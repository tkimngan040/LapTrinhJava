# Audit integration verification

Use a disposable PostgreSQL database; tests retain uniquely named fixtures.

```powershell
$env:SCENT_AUDIT_TEST_DB_URL = 'jdbc:postgresql://127.0.0.1:55432/scent_a2_test'
$env:SCENT_AUDIT_TEST_DB_USER = 'postgres'
$env:SCENT_AUDIT_TEST_DB_PASSWORD = ''
mvn -f backend/pom.xml test -Dtest=AuditIntegrationTest
```

Without the URL the class is skipped. Flyway applies V1–V7. The test uses the
real JWT/method security, AOP, JPA/JDBC transactions and PostgreSQL locks/triggers;
only outbound MQTT is mocked. It covers price before/after, concurrent changes,
tenant/role denial, audit-insert rollback, safe login evidence, permission changes,
stock correction/refill, slot assignment, maintenance and confirmed diagnostic
deduplication, filtered/paged search and rejection of API/SQL mutation. Refund
tests exercise the full configured simulated-provider request/dispatch/signed-
callback/retry flow, stale or forged callback rejection, human review, stock
idempotency and database/audit rollback. A separate test verifies that production
MQTT publication waits for commit and is suppressed by rollback.

The live HTTP price-change result is recorded in `price-acceptance-result.md`.
API fields, covered actions and limitations: [audit contract](../../../../../../docs/audit-api-contract.md).
All screenshot results: [acceptance checklist](../../../../../../docs/all-screenshot-acceptance.md).
