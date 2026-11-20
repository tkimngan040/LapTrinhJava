# Audit log contract

Implemented on 15 November 2026. References: FR10.2–FR10.5, BR11–BR13, UC-18.

## Search

`GET /api/audit-logs` requires a current **PLATFORM_SUPER_ADMIN** JWT, matching
UC-18. Other staff roles, including Brand Admin and Viewer, receive 403.
Unauthenticated requests receive 401. There is no create, edit or delete API.

Optional exact-match filters: `brandId`, `actorId`, `machineId`, `action`,
`targetType`, `targetId`, `severity`. IDs must be positive. `targetType` is one of
PRODUCT, SLOT, USER, INVENTORY_BOTTLE, DISPENSE_COMMAND, MAINTENANCE_TICKET, ORDER, REFUND, ALERT.
Severity is INFO, WARNING or CRITICAL. Current successful actions use INFO;
denied sign-ins use WARNING.

`from` and `to` are ISO-8601 instants; the interval is **[from, to)**. When both
are supplied, `from` must precede `to`. `page` starts at 0; `size` defaults to 50
and accepts 1–100. Invalid filters return 400. Newest `occurredAt`, then `id`,
come first. No matches returns an empty `content` list.

Example: `GET /api/audit-logs?action=PRODUCT_PRICE_CHANGED&targetType=PRODUCT&targetId=12&size=20`

```json
{
  "content": [{
    "id": 101,
    "actorId": 7,
    "actorIdentifier": "operator@example.com",
    "brandId": 2,
    "action": "PRODUCT_PRICE_CHANGED",
    "targetType": "PRODUCT",
    "targetId": 12,
    "occurredAt": "2026-11-15T08:00:00Z",
    "source": "PATCH /api/products/12/price",
    "severity": "INFO",
    "beforeValues": {"name":"Perfume","defaultPrice":20000,"active":true},
    "afterValues": {"name":"Perfume","defaultPrice":25000,"active":true}
  }],
  "totalElements": 1,
  "page": 0,
  "size": 20
}
```

Nullable fields may be omitted: `actorId`, `brandId`, `machineId`, `targetId`,
`beforeValues`, `afterValues`, `reason`. Brand is the **target's** tenant, even
when a platform administrator performs the change. Actors/targets are historical
IDs and identifiers, with no cascading update/delete of evidence.

## Covered operations

`@Auditable` is applied to public service methods. `AuditAspect` runs after
method authorization and opens/joins a writable transaction. Explicit safe SQL
snapshots follow the service's row-lock order; JPA is flushed before reading
the final values. The business write and audit insert commit or roll back
together. An audit persistence failure prevents a successful database change.
The production MQTT gateway defers command publication until commit, so rollback
also prevents a spray command from being sent. If transport fails after commit,
the stored command waits for result/timeout review; it is never automatically reissued.

| Action | Entry point / safe snapshot |
|---|---|
| LOGIN_SUCCEEDED / LOGIN_DENIED | `AuthService.login`; identity and outcome only |
| PRODUCT_PRICE_CHANGED | `PATCH /api/products/{id}/price`; product default price |
| SLOT_PRICE_CHANGED | `PATCH /api/slots/{id}/price`; slot price override |
| SLOT_PRODUCT_ASSIGNED | `PATCH /api/slots/{id}/product`; old/new product IDs |
| USER_CREATED / BRAND_ADMIN_CREATED / USER_PROFILE_CHANGED / USER_ROLES_CHANGED / USER_STATUS_CHANGED / USER_PASSWORD_RESET / LOGOUT | Existing account/profile/role/status/reset/logout endpoints; identity/role/status fields, never passwords/hashes. Logout revokes existing tokens |
| SLOT_BOTTLE_INSTALLED / SLOT_BOTTLE_REPLACED / SLOT_BOTTLE_REMOVED | Existing inventory slot operations; bottle assignment and volume |
| INVENTORY_REFILLED / INVENTORY_ADJUSTED | Existing refill/adjust endpoints; volume before/after and reason |
| DISPENSE_STOCK_DEDUCTED | `InventoryService.deductForCommand(DispenseCommand)`; confirmed consumption, purpose, order/slot, volume and application flag |
| MAINTENANCE_CREATED / MAINTENANCE_ASSIGNED / MAINTENANCE_STARTED / MAINTENANCE_REPAIRED / DIAGNOSTIC_REQUESTED / MAINTENANCE_CLOSED | Existing maintenance endpoints; status, assignee, repair and test references |
| REFUND_REQUESTED / REFUND_RETRIED / REFUND_OUTCOME_RECORDED | Refund workflow: amount, currency, references, attempt and old/new refund/order/payment states |
| ORDER_REVIEWED / ORDER_REFUND_RECORDED | Recorded human review and persisted refund transition |
| ALERT_ACKNOWLEDGED / ALERT_ASSIGNED / ALERT_RESOLVED / ALERT_REOPENED | Existing alert lifecycle; status, assignment, reason and incident references |
| INVENTORY_BOTTLE_STATUS_CHANGED | Existing damage/expiry operation; old/new bottle state and reason |

No-op writes do not produce change entries, except explicit password reset,
whose secret value is deliberately excluded. Repeated confirmed device results
do not duplicate stock-consumption audit. Diagnostic callbacks use the persisted
requesting operator when no web principal exists; automatic customer consumption
is attributed to SYSTEM. Ordinary rejected business writes have no success entry.

Failed sign-ins are recorded in a separate transaction after authentication
rollback, with `actorId` absent: the submitted identity is unverified.
`actorIdentifier` is the attempted email; `targetId`/brand identify a known
account when found. Unknown emails retain no target ID. Outcome includes
`identityVerified:false`. Successful sign-ins use the actual account identity,
regardless of any other principal on the request.

Snapshots are a whitelist. Raw method arguments, login responses, passwords,
password hashes, access tokens, signing secrets and arbitrary request headers
are never serialized. Source is HTTP method/path (no query string or credentials),
or APPLICATION for non-HTTP work.

## Price and slot assignment operations

PSA, Brand Admin and Operations Manager may call these endpoints. Brand staff
can modify only their own brand; cross-brand targets return 404. Viewer cannot
write. Prices are nonnegative integer VND amounts.

- `PATCH /api/products/{id}/price` with `{"price":25000}` changes the product's
  default price. Existing order snapshots and slot-specific overrides are retained.
- `PATCH /api/slots/{id}/price` with `{"price":25000}` sets an override;
  `{"price":null}` restores product-default pricing.
- `PATCH /api/slots/{id}/product` with `{"productId":12}` assigns an active product
  from the machine's brand. The slot must be paused, have no installed bottle
  and have no outstanding/uncertain command. Physical installation subsequently
  decides slot availability.

## Immutability and remaining coverage

V6 creates the insert/search ledger. The JDBC repository has no update/delete
methods. A PostgreSQL statement trigger rejects UPDATE, DELETE and TRUNCATE,
including statements that match no rows. Permissions are also revoked from PUBLIC.
A database administrator able to alter schema/triggers remains outside this
application-level protection; no cryptographic chain or external immutable archive
is claimed.

The [refund workflow](refunds-api-contract.md) now includes an authorised request,
durable provider dispatch, signed callback, failure/retry, human review and audit;
the order becomes REFUNDED only after matching provider confirmation. The project
uses its FAKEPAY simulated provider, with a separate provider evidence ledger.
No real bank integration is claimed. Direct SQL seeds/imports and unannotated
code do not produce historical audit retroactively. All device/payment/automatic
alert events, a complete end-to-end trace endpoint, retention/archive policy and
an audit UI remain future work. FR10 remains partially implemented in the report,
while the screenshot's listed sensitive operator operations are covered.
