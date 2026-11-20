# A2 — Brands and users

Only `domain/brand` and `domain/user` source and test files are changed. Entities,
repositories, migrations and Long's authentication/security code are reused.

## Postman

Import `A2.postman_collection.json`, set `baseUrl`, `psaEmail` and `psaPassword`
in the collection variables, then run all 30 requests in order. An existing PSA
account is required. The optional `seed-admin` profile in this project can create
`psa@scentstation.local` using `seed.admin-password`.

The collection creates unique A/B brands and accounts, checks that BA A cannot
read or modify B, and checks revocation on lock, role change and password reset.
Unlocking must not revive an old token. Test brands/accounts remain available
for inspection; run against a development database.

## Automated integration tests

Use an empty, disposable PostgreSQL database. No MQTT broker is needed. From
`backend`, in PowerShell:

```powershell
$env:SCENT_A2_TEST_DB_URL = 'jdbc:postgresql://localhost:5432/scent_a2_test'
$env:SCENT_A2_TEST_DB_USER = 'postgres'
$env:SCENT_A2_TEST_DB_PASSWORD = 'your-test-password'
mvn test
```

Flyway applies the existing migrations. Test fixtures remain in the database.
Without `SCENT_A2_TEST_DB_URL`, the integration class is skipped and the existing
unit tests still run. No new Maven dependencies are required.

These tests exercise real JWT authentication, method authorization, PostgreSQL
queries and committed transactions. They verify that revoked tokens return 401
on the next request; the frontend must handle that response to return to login.

## API

| Method | Path | Caller / body |
| --- | --- | --- |
| GET | `/api/brands` | PSA |
| POST | `/api/brands` | PSA: `{ "name": "Brand A" }` |
| PUT | `/api/brands/{id}` | PSA: `{ "name": "New name" }` |
| PATCH | `/api/brands/{id}/activate` | PSA |
| PATCH | `/api/brands/{id}/suspend` | PSA |
| POST | `/api/users/brand-admin` | PSA: `{ "brandId": 1, "email": "ba@example.com", "fullName": "Admin", "password": "test-password" }` |
| GET | `/api/users` | PSA: all; BA: own brand |
| GET | `/api/users/{id}` | PSA / BA within scope |
| POST | `/api/users` | `{ "email": "staff@example.com", "fullName": "Staff", "password": "test-password", "roles": ["VIEWER"] }`; PSA also supplies `brandId` for brand accounts |
| PUT | `/api/users/{id}` | `{ "email": "staff@example.com", "fullName": "New name" }` |
| PATCH | `/api/users/{id}/lock` | PSA / BA within scope |
| PATCH | `/api/users/{id}/unlock` | Alias: `/activate` |
| PATCH | `/api/users/{id}/deactivate` | PSA / BA within scope |
| PATCH | `/api/users/{id}/password` | `{ "password": "new-password" }` |
| PATCH | `/api/users/{id}/roles` | `{ "roles": ["TECHNICIAN"] }` |

BA can assign `OPERATIONS_MANAGER`, `TECHNICIAN`, `INVENTORY_STAFF`, `VIEWER` and
manage staff accounts in its own brand. BA cannot modify BA/PSA accounts. PSA
cannot change its own status/roles. Brand accounts cannot acquire the PSA role.
Email and brand-name uniqueness checks ignore case. Responses omit password
hashes and token versions.

`User` currently has no Hibernate `@Filter`, so service queries include explicit
brand predicates for BA. Account writes take a row lock. Locking/deactivating,
changing roles and resetting passwords call Long's existing
`AuthService.revokeAllSessions(id)` within the same transaction; this is the
available equivalent of the screenshot's `bumpTokenVersion` API.
