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

> Add the remaining endpoints as you build them. For each one record the path,
> the request body, the response body, and who owns it.
