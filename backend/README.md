# backend — Spring Boot API and IoT gateway

The only component that writes to the database, and the only one allowed to
confirm a payment or emit a dispensing command (Report section 2.8.1).

## Running it

```bash
# from the repository root
docker compose up -d          # PostgreSQL 16 and Mosquitto 2.0
cd backend && mvn spring-boot:run
```

The API comes up on http://localhost:8080. Flyway applies the migrations on
first start; `ddl-auto: validate` then refuses to start if any entity has
drifted from its table, which is the point of using Flyway rather than
`ddl-auto: update`.

```bash
mvn test                   # unit tests, no database needed
```

These commands need Maven 3.9 or later on the PATH. To spare the team that,
run `mvn -N wrapper:wrapper` once and commit the `mvnw` files it creates;
after that everyone can use `./mvnw` and get the same Maven version.

## What is implemented

| Task | Area | Main classes |
|---|---|---|
| L1 | Project skeleton, configuration | `ScentStationApplication`, `AppConfig`, `ScentStationProperties`, `common/` |
| L2 | Authentication and authorisation | `security/` — `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig`, `TenantContext`, `TenantFilterAspect` |
| L3 | Order state machine, ordering, payment | `domain/order/` — `OrderStatus`, `OrderStateMachine`, `OrderService`, `PaymentService`, `KioskController`, `PaymentWebhookController`, `FakePaymentProvider` |
| L5 | MQTT gateway and dispensing | `iot/` and `domain/dispensing/` — `Topics`, `CanonicalJson`, `CommandSigner`, `MqttDeviceGateway`, `DeviceMessageHandler`, `DispenseService`, `DeviceWatchdog` |

Written so the above can run, but owned by other tasks: the migrations and the
entity and repository classes (M1, M2 — Tra My) and `InventoryService`
(A4 — Hoai Anh). Each carries a note saying so.

## File ownership inside this project

In every business package, **Tra My** owns the `*Entity.java` and
`*Repository.java` files and the package owner writes the `*Service.java` and
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

## Three rules that must not be broken

- **Layering flows one way**: Controller → Service → Repository → Entity. A
  controller never calls a repository directly (Report section 2.8.2).
- **`iot/` only calls services.** It parses, validates and dispatches; it must
  not reimplement a business rule. Each rule has exactly one implementation,
  whether it is reached from the web or from a device.
- **Schema changes go into a new migration.** Never edit a migration that has
  already been pushed.

## Trying the whole flow by hand

```bash
# 1. the simulator, in its own terminal
cd ../simulator && mvn package && java -jar target/simulator.jar --device=KIOSK-001

# 2. what this machine is selling
curl localhost:8080/api/kiosk/machines/KIOSK-001/menu

# 3. place an order; note the paymentRef in the qrContent
curl -X POST localhost:8080/api/kiosk/orders \
     -H 'Content-Type: application/json' \
     -d '{"deviceId":"KIOSK-001","slotNumber":1}'

# 4. pretend the customer scanned the QR code
curl -X POST localhost:8080/api/dev/payments/simulate \
     -H 'Content-Type: application/json' \
     -d '{"paymentRef":"SCENT-XXXXXXXXXXXXXXXX","succeed":true}'

# 5. watch it reach DISPENSED
curl localhost:8080/api/kiosk/orders/1/status
```

Step 4 goes the long way round on purpose. The kiosk could call the payment
service directly and the demo would look the same, but then something the
kiosk did would have marked an order paid, and BR5 says only the backend may
do that. The detour keeps the code and the design saying the same thing.

## Configuration worth knowing about

Everything lives under `scentstation` in `application.yml`.

| Property | Default | Why it matters |
|---|---|---|
| `security.jwt-secret` | a development value | Must be at least 32 bytes; the application refuses to start otherwise |
| `order.ttl-seconds` | 180 | How long an unpaid order stays PENDING (FR3.9) |
| `dispensing.command-ttl-seconds` | 30 | Command validity window (BR7) |
| `dispensing.result-timeout-seconds` | 60 | After this an order becomes UNCERTAIN (BR14) |
| `mqtt.command-secret` | a development value | **Must match the simulator's `--secret`**, or every command is refused on its signature |
| `mqtt.heartbeat-timeout-seconds` | 45 | After this a machine is marked OFFLINE (FR5.2) |

## Checking the database constraints

`src/test/resources/constraint-check.sql` proves the four partial unique
indexes of Report section 2.7.4 refuse what they are meant to refuse, and
still allow the legitimate cases: reusing a slot after the bottle is removed,
and issuing a new command once the previous one has finished.

```bash
psql -h localhost -U scent -d scentstation -f src/test/resources/constraint-check.sql
```

Every marked block must print `BLOCKED`. The output is worth a screenshot for
Report section 3.6.
