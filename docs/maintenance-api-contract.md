# Alerts and maintenance — FR7 / FR8

Migration V5 extends the existing alert table and adds maintenance tickets. V1–V4
are unchanged. Status/type/severity values are returned as stored enum names.

## Incident generation and deduplication

| Type | Source | Default severity | Automatic ticket |
| --- | --- | --- | --- |
| OFFLINE | Heartbeat timeout transitions an observed machine to OFFLINE | WARNING | No |
| LOW_STOCK | Inventory falls at/below the configured slot threshold | WARNING | No |
| DOOR_OPEN | Telemetry `doorOpen=true` or event `DOOR_OPEN` | WARNING | No |
| LEAK | Telemetry `leakDetected=true` or event `LEAK` | CRITICAL | Yes |
| DISPENSE_FAILED | Rejected ACK, failed result, result timeout or inventory reconciliation failure | CRITICAL | Yes |

Device telemetry safety flags must be JSON booleans. `DOOR_CLOSED`,
`LEAK_CLEARED`, or false telemetry flags clear their observed condition.
Heartbeat recovery clears OFFLINE. LOW_STOCK resolves after refill/removal.
Critical alert resolution waits for repair and a confirmed test even when the
sensor has already cleared. This is condition tracking, not a complete telemetry
history or estimate-versus-sensor leakage algorithm.

An incident key identifies LOW_STOCK by bottle, DOOR_OPEN/LEAK/OFFLINE by machine,
and DISPENSE_FAILED by machine/slot. OPEN, ACKNOWLEDGED and ASSIGNED are all
active states. A partial unique index `uq_active_alert_incident` prevents
duplicates in every active state. Machine/bottle locks serialize the respective
event paths. Repeated critical observations reuse their active alert/ticket.
New critical incidents on the same machine may reuse an active ticket, escalate
its priority and invalidate earlier repair/test evidence.

## Alerts API

| Method | Path | Body / behavior |
| --- | --- | --- |
| GET | `/api/alerts?activeOnly=true` | Brand-scoped active alerts; false includes resolved rows |
| PATCH | `/api/alerts/{id}/acknowledge` | No body; records actor/time |
| PATCH | `/api/alerts/{id}/assign` | `{ "assigneeId": 12 }` |
| PATCH | `/api/alerts/{id}/resolve` | `{ "reason": "Inspected and documented resolution" }` |
| PATCH | `/api/alerts/{id}/reopen` | `{ "reason": "Issue recurred" }` |

Readers: PSA/BA/OM/TE/IS/Viewer. Acknowledgement: same roles except Viewer.
Assignment: PSA/BA/OM; technician assignees must be active and in the same brand.
LOW_STOCK may also be assigned to active Inventory Staff. Assignment of a
critical alert also assigns its linked active ticket. Resolution/reopening:
PSA/BA/OM/TE. An assigned alert cannot be modified by a different non-supervisor.

Resolving a warning records an operator decision with a mandatory reason; it
does not override machine connectivity or device safety. A later active
observation can create a new occurrence. Critical alerts cannot bypass the
linked maintenance workflow. Reopening a resolved critical alert creates/reuses
an active critical ticket and blocks the machine again. An already-active
incident returns 409 rather than creating another active alert.

Existing response fields remain: `id`, `alertType`, `status`, `bottleId`,
`machineId`, `slotId`, `remainingQuantityMl`, `thresholdMl`, `message`, `createdAt`,
`resolvedAt`. Slot/bottle/stock fields can be absent for machine-level alerts.
Added fields: `severity`, `conditionActive`, `acknowledgedBy`, `acknowledgedAt`,
`assignedTo`, `resolvedBy`, `resolution`, `reopenedBy`, `reopenedAt`, `reopenCount`,
`maintenanceTicketId`. These are last-action metadata, not an append-only audit
ledger of every edit.

## Maintenance API

PSA/BA/OM/TE can read/create tickets in their scope. Only PSA/BA/OM can reassign
tickets. A technician may act only on tickets assigned to that technician; a
technician-created ticket is self-assigned. Cross-brand tickets/assignees return
404. Viewer/IS have no ticket mutation permission.

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/maintenance/tickets` | List within scope |
| GET | `/api/maintenance/tickets/{id}` | Detail |
| POST | `/api/maintenance/tickets` | `{ "machineId": 1, "title": "Inspect actuator", "description": "Failure observed", "category": "REPAIR", "priority": "HIGH", "assigneeId": 12, "dueAt": "2026-12-01T10:00:00Z" }` |
| PATCH | `/api/maintenance/tickets/{id}/assign` | `{ "assigneeId": 12 }` |
| POST | `/api/maintenance/tickets/{id}/start` | No body; enters machine maintenance mode |
| PATCH | `/api/maintenance/tickets/{id}/repair` | `{ "repairResult": "Replaced seal and inspected connections" }` |
| POST | `/api/maintenance/tickets/{id}/test` | `{ "slotId": 1 }`; issues a real signed DIAGNOSTIC command |
| POST | `/api/maintenance/tickets/{id}/close` | No body; verifies stored repair/test evidence |

Categories: REPAIR, INSPECTION, REFILL, LEAK, DISPENSING, OFFLINE, OTHER.
Priorities: LOW, NORMAL, HIGH, CRITICAL. Ticket states: OPEN, ASSIGNED,
IN_PROGRESS, REPAIRED, TESTING, CLOSED. Priority defaults to NORMAL and category
to REPAIR; optional dueAt must be future. New critical tickets immediately place
the machine into MAINTENANCE. Starting other tickets does the same. New orders
lock the machine and reject maintenance mode or any open critical ticket.

Responses include ticket IDs/scope, classification, title/description, assignee,
dueAt, creation/start/repair/closure actor/timestamps and `testCommandId`,
`testStatus`, `testPassed`. TESTING describes the test phase until operator
closure; `testStatus` is the actual command state. `testPassed` is computed from
persisted device-confirmed command evidence, never supplied by a client.

### Closure guard (BR15)

1. Start service and record a nonblank repair result.
2. Clear observed LEAK/DOOR_OPEN conditions and bring the machine online.
3. Request a diagnostic using a slot on this machine with a usable full dose.
   A broker failure returns 409 and rolls back test issuance. No inventory is
   deducted merely for requesting a test.
4. Wait for the normal MQTT result callback: DIAGNOSTIC + SUCCEEDED + inventory
   applied + completion timestamp. The command must have been issued/completed
   after the current repair record. Re-recording repair invalidates the test.
5. Close the ticket. Missing, failed, timed-out or stale tests return 409. Closed
   tickets cannot be edited. Success resolves linked alerts and returns the
   machine to ACTIVE only if no other blocking service remains; an originally
   DISABLED machine remains DISABLED.

The DIAGNOSTIC purpose is included in the signed payload. The simulator allows
this purpose during maintenance, while still rejecting open doors, critical
errors, empty slots, wrong targets and invalid signatures. Customer commands do
not receive this maintenance exception. Diagnostics remain separate inventory
movements and do not create sales. Ticket closure does not resolve customer
payment/refund accounting or change UNCERTAIN orders.

General errors use ApiError: 400 invalid input, 403 role/assignment denial, 404
foreign/missing references and 409 invalid lifecycle/safety/test conditions.
The UI, configurable checklists, attachments/component costs, external
notifications and escalation remain outside this implementation.
