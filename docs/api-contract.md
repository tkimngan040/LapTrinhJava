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
