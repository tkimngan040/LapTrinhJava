# Confirmed consumption — A4 / L5

The integration signature selected by the user is
`void InventoryService.deductForCommand(DispenseCommand command)`. It matches the
existing L5 caller in `DispenseService`; the Long-ID overload has been removed.
The service reads `command.getId()` to lock and check the authoritative persisted
command. No REST endpoint lets clients declare a spray confirmed.

L5 marks the managed command SUCCEEDED after a successful device result, then
calls inventory in the same transaction. Inventory locks the authoritative
command, slot and bottle, uses the signed command's `doseMl`, records before/after
volume, updates LOW_STOCK and marks `inventoryApplied`. The order becomes
DISPENSED only if everything commits. ACKs, rejected/failed/unconfirmed commands
do not consume stock. The method never trusts detached status/dose data.

`uq_command_idempotency` maps duplicate result keys to one command. Command/slot
locks serialise concurrent deliveries. The inventory flag and movement lookup
make replays no-ops; V4's `uq_inventory_command_consumption` independently limits
each command to one DISPENSE/DIAGNOSTIC movement. Replays are checked before
current volume, so replaying the final spray still succeeds harmlessly.

`DispenseService.applyResult` retains its public arguments. It processes the
result in a separate transaction. If consumption, movement, alert or success
persistence fails, that transaction rolls back completely. A subsequent review
transaction marks the command FAILED with a reconciliation reason, puts the
customer order in UNCERTAIN, and pauses the slot. The original error is rethrown;
duplicates do not retry held commands. If the whole database is unavailable,
review cannot be persisted either; the existing stale-command watchdog remains
the fallback once database access returns.

Purpose is persisted when a command is authorised, never read from result JSON.
Existing commands default to CUSTOMER. L5 diagnostic command creation must store
DIAGNOSTIC, `requestedBy = operatorId`, and no sale order; V4 enforces this shape.
Controlled diagnostic issuance is now available through
`POST /api/maintenance/tickets/{id}/test` after an authorised repair record.
It signs the DIAGNOSTIC purpose; the simulator permits it during maintenance
without bypassing door/error/volume checks. A maintenance UI is not supplied.
Confirmed diagnostics consume physical volume as DIAGNOSTIC, record the operator,
and create/change no sale order or DISPENSE movement. Sales queries must include
only DISPENSE. Failure, ACK and timeout handlers support diagnostics without
orders. Unsettled diagnostics also block physical bottle service.

At or below the configured threshold, one open LOW_STOCK alert is kept per
bottle, including when volume reaches zero. Alert volume is a creation snapshot.
Below one further calibrated slot dose, the bottle becomes EMPTY and the slot
becomes unavailable. Refill/adjustment above threshold, removal and replacement
resolve the old alert. Alert writes share the inventory transaction.

`GET /api/alerts` lists open alerts; `?activeOnly=false` includes resolved history.
PSA reads all brands; BA, Operations Manager, Inventory Staff and Viewer read
their own brand. The integration suites use the real result dispatcher and
PostgreSQL, including concurrent callbacks and injected post-movement failures:

```powershell
mvn test -Dtest=ConfirmedConsumptionIntegrationTest,InventoryManagementIntegrationTest
```
