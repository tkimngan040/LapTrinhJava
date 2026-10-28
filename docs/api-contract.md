# API contract

Agree this **before writing code**. Backend and frontend both edit this file.
If you change a field name, change it here and tell the team.

Conventions: JSON uses `camelCase`, timestamps are ISO-8601 UTC
(`2026-11-05T10:30:00Z`), money is an integer amount in VND.

Errors always have the same shape:

```json
{ "timestamp": "...", "status": 400, "code": "SLOT_EMPTY", "message": "Slot has insufficient volume" }
```

## Authentication — Long (L2)

```
POST /api/auth/login
→ { "username": "...", "password": "..." }
← { "token": "eyJ...", "user": { "id": 1, "fullName": "...", "brandId": 1, "roles": ["BRAND_ADMIN"] } }
```

## Machine menu — Tra My (M3)

```
GET /api/kiosk/machines/{deviceId}/menu
← { "deviceId": "KIOSK-001", "status": "ONLINE",
    "slots": [ { "slotNumber": 1, "productId": 10, "productName": "...",
                 "notes": "...", "imageUrl": "...", "price": 20000, "available": true } ] }
```

## Orders — Long (L3)

```
POST /api/kiosk/orders   → { "deviceId": "...", "slotNumber": 1 }
← { "orderId": 55, "status": "PENDING", "price": 20000, "qrContent": "...", "expiresAt": "..." }

GET /api/kiosk/orders/{id}/status
← { "orderId": 55, "status": "DISPENSING", "failureReason": null }
```

> Add the remaining endpoints as you build them. For each one record the path,
> the request body, the response body, and who owns it.
