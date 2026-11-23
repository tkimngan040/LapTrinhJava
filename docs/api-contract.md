# API contract

Agree this **before writing code**. Backend and frontend both edit this file.
If you change a field name, change it here and tell the team.

Conventions: JSON uses `camelCase`, timestamps are ISO-8601 UTC
(`2026-11-05T10:30:00Z`), money is a decimal number with two places.

> Money changed shape in task M1 and this is the one place it is written down.
> The ERD stores every amount as `NUMERIC`, so the backend maps it to
> `BigDecimal` and Jackson writes `20000.00`, not `20000`. It is still a JSON
> number — `Number("20000.00")` is 20000 in JavaScript — so nothing breaks,
> but format it for display rather than printing it raw, and never compare two
> amounts as strings.

Errors always have the same shape:

```json
{ "timestamp": "...", "status": 400, "code": "SLOT_EMPTY", "message": "Slot has insufficient volume" }
```

## Authentication — Long (L2)

```
POST /api/auth/login
→ { "username": "...", "password": "..." }
← { "token": "eyJ...", "user": { "id": 1, "fullName": "...", "email": "...",
                                 "brandId": 1, "roles": ["BRAND_ADMIN"] } }
```

`username` holds an email address and is validated as one. `brandId` is null
for a platform-level account.

The migration seeds one account so that sign-in can be exercised from the
first start-up:

| Email | Password | Role |
|---|---|---|
| `admin@scentstation.local` | `Admin@12345` | `PLATFORM_SUPER_ADMIN` |

Development only. Change it before the application is shown to anyone outside
the team.

## Machine menu — Tra My (M3)

```
GET /api/kiosk/machines/{deviceId}/menu
← { "deviceId": "KIOSK-001", "status": "ONLINE",
    "slots": [ { "slotNumber": 1, "productId": 10, "productName": "...",
                 "notes": "...", "imageUrl": "...", "price": 20000.00,
                 "available": true } ] }
```

`deviceId` in the path and in the response is the machine's `device_identity`,
the same string the MQTT topics use. `status` is the machine's
`connection_status`: `ONLINE`, `UNSTABLE` or `OFFLINE`.

`available` is false for a slot that cannot be sold right now — the machine is
unreachable or under maintenance, the slot is empty or disabled, or the
product has been retired. The slot is still listed so the screen can grey it
out instead of changing shape.

## Orders — Long (L3)

```
POST /api/kiosk/orders   → { "deviceId": "...", "slotNumber": 1 }
← { "orderId": 55, "status": "PENDING", "price": 20000.00, "currency": "VND",
    "qrContent": "...", "expiresAt": "...", "failureReason": null }

GET /api/kiosk/orders/{id}/status
← { "orderId": 55, "status": "DISPENSING", "failureReason": null }

POST /api/kiosk/orders/{id}/cancel
← 204 No Content
```

`status` is one of the nine order states of Report section 2.9.2:
`PENDING`, `PAID`, `DISPENSING`, `DISPENSED`, `FAILED`, `UNCERTAIN`,
`CANCELLED`, `EXPIRED`, `REFUNDED`. The kiosk polls the status endpoint while
the countdown runs; `UNCERTAIN` means a person has to check the machine, so
the screen should say so rather than claiming success or failure.

## Review and refunds — Long (L7)

Signed-in operators only (`Authorization: Bearer <token>`). Reading the queue
is open to every role, a Viewer included. Deciding and refunding need
`OPERATIONS_MANAGER`, `BRAND_ADMIN` or `PLATFORM_SUPER_ADMIN` (FR1.9). An order
that belongs to another brand answers `404 ORDER_NOT_FOUND`, exactly as if it
did not exist (BR13).

```
GET /api/review/orders
← [ { "orderId": 55, "status": "UNCERTAIN", "deviceId": "KIOSK-001",
      "slotNumber": 1, "productName": "...", "amount": 20000.00,
      "currency": "VND", "failureReason": "...", "reviewNote": null,
      "createdAt": "2026-11-05T10:30:00Z" } ]
```

The queue holds every order in `UNCERTAIN` or `FAILED` that the caller's brand
owns.

```
POST /api/review/orders/{id}/resolve
→ { "outcome": "DISPENSED", "note": "Customer confirmed the spray" }
← { "orderId": 55, "status": "DISPENSED", "reviewNote": "Customer confirmed the spray" }
```

`outcome` is `DISPENSED` (the spray is proven to have happened, so stock is
deducted once) or `FAILED` (it is proven not to have happened). `note` is
required. Only an `UNCERTAIN` order can be resolved; any other state answers
`409 ILLEGAL_ORDER_TRANSITION`. No dispensing command is ever sent from here
(BR14).

```
POST /api/review/orders/{id}/refund
→ { "reason": "Device jammed, no spray" }
← { "orderId": 55, "orderStatus": "REFUNDED",
    "refundReference": "RF-70", "refundStatus": "COMPLETED" }
```

Only a `FAILED` order can be refunded (`409 ORDER_NOT_REFUNDABLE` otherwise).
The order becomes `REFUNDED` only when `refundStatus` is `COMPLETED`; with
`PENDING` or `FAILED` the order stays `FAILED`, and calling again retries the
same refund under the same `refundReference`, so the customer is never
refunded twice. A refused request is recorded in the audit log.

| Code | Status | Meaning |
|---|---|---|
| `INVALID_OUTCOME` | 400 | `outcome` was not `DISPENSED` or `FAILED` |
| `NOTE_REQUIRED` | 400 | a review needs a written note |
| `REASON_REQUIRED` | 400 | a refund needs a reason |
| `NO_COMMAND` | 409 | no dispensing command exists to confirm |
| `NO_PAYMENT_TO_REFUND` | 409 | the order has no confirmed payment |

> Add the remaining endpoints as you build them. For each one record the path,
> the request body, the response body, and who owns it.

## Inventory — Hoai Anh (FR6.1–6.4, FR6.11–6.13)

All paths below start with `/api/inventory`. PSA, BA, Operations Manager and
Inventory Staff may manage inventory. Brand users are restricted to their own
brand, including lookups by ID. Manual adjustments require PSA, BA or Operations
Manager, plus a nonblank reason. Viewer/Technician/Customer cannot write inventory.

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| GET | `/batches` | — | `BatchResponse[]` |
| POST | `/batches` | `{ "productId": 1, "batchNumber": "LOT-001", "quantity": 2, "receivedDate": "2026-11-14", "expiryDate": "2027-11-14" }` | 201 `BatchResponse` |
| GET | `/bottles` | — | `BottleResponse[]` |
| POST | `/bottles` | `{ "batchId": 1, "bottleCode": "BTL-001", "initialQuantityMl": 100 }` | 201 `BottleResponse` |
| PATCH | `/slots/{id}/service` | — | 204; pauses slot before physical service |
| POST | `/slots/{id}/install` | `{ "bottleId": 1, "initialQuantityMl": 100 }` | `BottleResponse` |
| POST | `/slots/{id}/replace` | `{ "bottleId": 2, "initialQuantityMl": 100 }` | incoming `BottleResponse` |
| POST | `/slots/{id}/refill` | `{ "quantityMl": 20, "reason": "Scheduled refill" }` | `BottleResponse` |
| POST | `/slots/{id}/remove` | — | outgoing `BottleResponse` |
| PATCH | `/bottles/{id}/adjust` | `{ "remainingQuantityMl": 60, "reason": "Measured reconciliation" }` | `BottleResponse` |
| PATCH | `/bottles/{id}/status` | `{ "status": "DAMAGED", "reason": "Broken seal" }` | `BottleResponse`; also accepts `EXPIRED` |
| GET | `/movements?bottleId=1` | optional bottle filter | `MovementResponse[]` |

`BatchResponse`: `id`, `brandId`, `productId`, `batchNumber`, `quantity`,
`receivedDate`, `expiryDate`. Quantity counts bottles; registration cannot exceed
the batch's received quantity. Batch number is unique within a brand; bottle code
is globally unique. Expiry date is optional, but cannot precede receipt.

`BottleResponse`: `id`, `batchId`, `productId`, `bottleCode`, `status`,
`initialQuantityMl`, `remainingQuantityMl`, `machineId`, `slotId`, `installedAt`,
`removedAt`, `expiryDate`. States: `AVAILABLE`, `INSTALLED`, `NEARLY_EMPTY`,
`EMPTY`, `DAMAGED`, `EXPIRED`. Expired batch dates override the displayed state
and prevent installation/refill. Damage/expiry can be recorded manually; volume
states follow installation, dispensing, refill and adjustment.

`MovementResponse`: `id`, `movementType`, `bottleId`, `previousBottleId`,
`newBottleId`, `machineId`, `slotId`, `performedBy`, `performedAt`, `quantityMl`,
`quantityBeforeMl`, `quantityAfterMl`, `reason`. Null fields are omitted. Legacy
movements may lack before/after quantities. Device movements have no employee.
Replacement appends REMOVE and INSTALL with the same old/new bottle IDs in one
transaction. Refill uses the same bottle for old/new. Transfers preserve bottle
volume; `quantityMl` records the volume delta, not a count of bottles.

Pause a slot before installation, replacement, refill, removal or installed-bottle
adjustment/status changes. A machine already in maintenance also permits service.
Pending/uncertain dispensing must be resolved first. Successful quantity changes
recalculate slot availability, without changing machine maintenance state.
The installation baseline must not exceed recorded available volume; refill and
adjustment cannot exceed that baseline. Positive volumes are integer millilitres.

Errors use the existing `ApiError` JSON shape: 400 for invalid quantities/dates,
missing adjustment quantity/reason or malformed input; 403 for insufficient role;
404 for references outside the brand; 409 for occupied slots, duplicate codes,
exhausted batches, incompatible/unusable bottles or a slot not ready for service.
`SLOT_ALREADY_OCCUPIED` is returned for a second installation, including when the
attached bottle is nearly empty or empty. Migration V3 retains the database
constraint `uq_bottle_active_slot` and extends it to all attached states.

## Confirmed consumption and LOW_STOCK — A4 / L5

See [the internal callback contract](inventory-command-contract.md). The selected
signature is `void deductForCommand(DispenseCommand command)`, matching the L5
caller. There is no public stock-deduction endpoint. Confirmed diagnostics use
DIAGNOSTIC movements and no sale order.

`GET /api/alerts` returns open LOW_STOCK alerts; `?activeOnly=false` includes
resolved alerts. Rows contain `id`, `alertType`, `status`, `bottleId`, `machineId`,
`slotId`, `remainingQuantityMl`, `thresholdMl`, `message`, `createdAt` and optional
`resolvedAt`. Quantity and threshold are snapshots at alert creation. PSA reads
all brands; BA/OM/Inventory Staff/Viewer read their own brand.

Consumption failures roll back stock/history/success changes, then place the
customer order in UNCERTAIN in a separate transaction and pause its slot for
human reconciliation. Duplicate results do not retry that held command.

## Alert actions and maintenance — FR7 / FR8

Alert types now include OFFLINE, LOW_STOCK, DOOR_OPEN, LEAK and DISPENSE_FAILED.
GET `/api/alerts` returns all active states (OPEN/ACKNOWLEDGED/ASSIGNED); false
`activeOnly` includes resolved rows. Technician reads are also permitted.
PATCH `/api/alerts/{id}/acknowledge`, `/assign`, `/resolve`, `/reopen` provide
scoped lifecycle actions with actor/timestamps. Critical alerts auto-link a
maintenance ticket.

GET/POST `/api/maintenance/tickets`, GET `/{id}`, PATCH `/{id}/assign`,
POST `/{id}/start`, PATCH `/{id}/repair`, POST `/{id}/test`, and POST `/{id}/close`
implement the technical service workflow. Closure requires a recorded repair
and an actual successful diagnostic command after that repair. See the
[alert/maintenance contract](maintenance-api-contract.md) for JSON bodies, enum
values, role/assignee guards, deduplication keys and safety rules.

## Audit and catalogue changes — FR10 / BR11 / BR12

PSA searches `GET /api/audit-logs` with actor/brand/machine/action/target/time/severity
filters and pagination. There are no audit mutation endpoints. V6 also rejects
SQL UPDATE/DELETE/TRUNCATE on the audit ledger. `@Auditable` persists safe before/after
snapshots in the business transaction; successful/denied login snapshots exclude
passwords and tokens.

PSA/BA/OM may PATCH `/api/products/{id}/price` and `/api/slots/{id}/price` with
`{"price":25000}`, or `/api/slots/{id}/product` with `{"productId":12}` within
their scope. Slot reassignment requires a paused, empty slot and no outstanding
command. See the [audit contract](audit-api-contract.md) for the JSON response,
all filters, covered actions, security rules and remaining refund/trace scope.

## Refunds and manual review — FR3.13 / FR10 / BR11

PSA/BA/OM may POST `/api/orders/{id}/refunds` with `requestKey` and mandatory
`reason`. Requests are queued durably, scoped to the order's brand and deduplicated.
GET `/api/refunds`, GET `/{id}` and POST `/{id}/retry` expose the request lifecycle.
POST `/api/refunds/webhook` verifies a provider HMAC and the exact request/attempt/
amount/currency before recording success. Only then do order/payment become REFUNDED.
The enabled development provider exposes POST `/api/dev/refunds/{id}/simulate`;
its separate evidence ledger and normal callback path are used for acceptance.

POST `/api/orders/{id}/review` records an authorised, reasoned decision for an
UNCERTAIN order. A verified success applies stock to the original command once;
failure permits refund. Neither path issues another command. See the
[refund/review contract](refunds-api-contract.md) and
[complete screenshot acceptance](all-screenshot-acceptance.md).
