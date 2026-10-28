# backend — Spring Boot API + cổng MQTT

Tạo ở task **L1** (Long). Chạy: `./mvnw spring-boot:run` → http://localhost:8080

## Ai sửa file nào

Trong mỗi package nghiệp vụ, **Trà My** giữ file `*Entity.java` và `*Repository.java`,
người chủ package giữ `*Service.java` và `*Controller.java`. Khác file nên không xung đột git.

| Package | Chủ sở hữu | Task |
|---|---|---|
| `config/`, `common/` | Long | L1 |
| `security/` | Long | L2 |
| `domain/order/` | Long | L3 |
| `domain/dispensing/`, `iot/` | Long | L5 |
| `domain/catalog/` | Trà My | M3 |
| `domain/brand/`, `domain/user/` | Hoài Anh | A2 |
| `domain/inventory/` | Hoài Anh | A3, A4 |
| `domain/report/` | Hoài Anh | A5 |
| `domain/alert/`, `domain/maintenance/`, `domain/audit/` | Hoài Anh | A7, A8 (làm thêm) |
| `src/main/resources/db/migration/` | Trà My | M1, M2, M4 |
| `src/test/` | Kim Ngân | N3, N4 |

## Quy tắc không được phá

- Phân tầng một chiều: Controller → Service → Repository → Entity. Controller
  không gọi thẳng Repository.
- `iot/` chỉ gọi Service, **không** viết lại logic nghiệp vụ. Mỗi quy tắc nghiệp
  vụ chỉ có đúng một cài đặt, dù đến từ web hay từ thiết bị (§2.8.2).
- `ddl-auto: validate`. Mọi thay đổi schema đi qua file migration mới, không sửa
  file migration đã push.
