# frontend — Next.js: portal quản trị + màn hình kiosk

Chủ sở hữu: **Kim Tuyến**. Tạo ở task **T1**.

Chạy: `npm install && npm run dev` → http://localhost:3000

| Đường dẫn | Màn hình | Task |
|---|---|---|
| `src/app/login` | 1 Đăng nhập | T1 |
| `src/app/kiosk/[deviceId]` | 15 Kiosk | T2 |
| `src/app/(portal)/products`, `/machines` | 6, 7 | T3 |
| `src/app/(portal)/dashboard`, `/reports` | 2, 13 | T4 |
| `src/app/(portal)/transactions`, `/inventory` | 8, 9 | T5 |
| còn lại | 3, 4, 5, 10, 11, 12 | T7 (làm thêm) |

`src/lib/api.ts` tự gắn JWT và đẩy về trang đăng nhập khi gặp 401.

**Không ngồi chờ backend.** Chốt tên trường JSON trong `docs/api-contract.md`,
dựng dữ liệu giả theo đúng hình dạng đó, xong rồi chỉ đổi URL.
