# Inventory acceptance checks

Import `Inventory.postman_collection.json`. Set `baseUrl`, `username`, `password`,
`productId` and `slotId`, then run all 16 requests in order. The slot must be empty
and configured for that product. Use a development database: the collection
leaves its bottles and history available for inspection. Use another empty slot
for the next full run.

The full collection uses PSA/BA/Operations Manager credentials because manual
ADJUST requires a supervisor. Inventory Staff may receive batches, register
bottles, pause slots, install/replace/refill/remove bottles and consult history.
The integration tests independently verify Inventory Staff access and the
supervisor restriction on adjustments.

The authoritative paths, JSON fields and error codes are in
`docs/api-contract.md` at the repository root. All quantities are integer ml;
batch quantity counts bottles. Pause an active slot via
`PATCH /api/inventory/slots/{id}/service` before physical service. Refilling adds
to the current amount, up to the installed baseline. Replacements append linked
REMOVE and INSTALL entries in one transaction. An EMPTY bottle still occupies its
slot until removed/replaced.

To run the integration suite against a disposable PostgreSQL database, from
`backend` in PowerShell:

```powershell
$env:SCENT_INVENTORY_TEST_DB_URL = 'jdbc:postgresql://localhost:5432/inventory_test'
$env:SCENT_INVENTORY_TEST_DB_USER = 'postgres'
$env:SCENT_INVENTORY_TEST_DB_PASSWORD = 'your-test-password'
mvn test -Dtest=InventoryManagementIntegrationTest
```

No MQTT broker or new Maven dependency is needed. Without the URL variable the
integration class is skipped. Flyway applies V1–V3 and fixtures remain in the
test database. Tests use real JWTs, method security, database constraints and
committed transactions. They cover brand isolation, receipt counts, invalid
input, adjustment authorisation/reasons, replacement history/rollback, expired
and damaged bottles, all attached states, concurrent installation and repeated
dispensing results.

V3 adds movement machine/old/new bottle references and before/after quantities,
extends `uq_bottle_active_slot` to all non-null slot assignments and adds a unique
confirmed-dispense movement per command. Existing migration files are unchanged;
legacy movement baselines remain null instead of being guessed.

V4 adds confirmed CUSTOMER/DIAGNOSTIC command classification, unique consumption
per command and LOW_STOCK alerts. Run `ConfirmedConsumptionIntegrationTest` for
duplicate/concurrent MQTT results, diagnostic consumption, insufficient stock,
rollback and immediate review holds. See `docs/inventory-command-contract.md`.
