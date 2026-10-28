# backend — Spring Boot API and IoT gateway

Created in task **L1** (Long). Run with `./mvnw spring-boot:run` → http://localhost:8080

## File ownership

Inside every business package, **Tra My** owns the `*Entity.java` and
`*Repository.java` files; the package owner writes `*Service.java` and
`*Controller.java`. Different files, so Git never conflicts.

| Package | Owner | Task |
|---|---|---|
| `config/`, `common/` | Long | L1 |
| `security/` | Long | L2 |
| `domain/order/` | Long | L3 |
| `domain/dispensing/`, `iot/` | Long | L5 |
| `domain/catalog/` | Tra My | M3 |
| `domain/brand/`, `domain/user/` | Hoai Anh | A2 |
| `domain/inventory/` | Hoai Anh | A3, A4 |
| `domain/report/` | Hoai Anh | A5 |
| `domain/alert/`, `domain/maintenance/`, `domain/audit/` | Hoai Anh | A7, A8 (stretch) |
| `src/main/resources/db/migration/` | Tra My | M1, M2, M4 |
| `src/test/` | Kim Ngan | N3, N4 |

## Rules that must not be broken

- Layering flows one way: Controller → Service → Repository → Entity. A
  controller never calls a repository directly.
- `iot/` only calls services. It must not reimplement business logic. Each
  business rule has exactly one implementation, whether it is reached from the
  web or from a device (Report §2.8.2).
- `ddl-auto: validate`. Every schema change goes into a new migration file.
  Never edit a migration that has already been pushed.
