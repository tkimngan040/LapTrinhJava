# Hợp đồng API

Chốt **trước khi code**. Backend và frontend cùng sửa file này, ai đổi tên
trường thì phải sửa ở đây và nhắn nhóm.

Quy ước chung: JSON dùng `camelCase`, thời gian dùng ISO-8601 UTC
(`2026-11-05T10:30:00Z`), tiền là số nguyên đơn vị đồng.

Lỗi trả về luôn cùng một hình dạng:

```json
{ "timestamp": "...", "status": 400, "code": "SLOT_EMPTY", "message": "Slot không còn đủ dung tích" }
```

## Đăng nhập — Long (L2)

```
POST /api/auth/login
→ { "username": "...", "password": "..." }
← { "token": "eyJ...", "user": { "id": 1, "fullName": "...", "brandId": 1, "roles": ["BRAND_ADMIN"] } }
```

## Menu của máy — Trà My (M3)

```
GET /api/kiosk/machines/{deviceId}/menu
← { "deviceId": "KIOSK-001", "status": "ONLINE",
    "slots": [ { "slotNumber": 1, "productId": 10, "productName": "...",
                 "notes": "...", "imageUrl": "...", "price": 20000, "available": true } ] }
```

## Đặt đơn — Long (L3)

```
POST /api/kiosk/orders   → { "deviceId": "...", "slotNumber": 1 }
← { "orderId": 55, "status": "PENDING", "price": 20000, "qrContent": "...", "expiresAt": "..." }

GET /api/kiosk/orders/{id}/status
← { "orderId": 55, "status": "DISPENSING", "failureReason": null }
```

> Thêm tiếp các endpoint còn lại khi làm tới. Mỗi endpoint ghi đủ: đường dẫn,
> body gửi đi, body trả về, và ai làm.
