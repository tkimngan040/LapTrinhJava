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
| L7 | Review of UNCERTAIN and FAILED orders, refunds, audit trail | `domain/order/` — `ReviewService`, `ReviewController`, `PaymentRefund`, `RefundGateway`, `FakeRefundGateway`; `domain/audit/` — `AuditService`, `AuditLog`; `db/migration/V3__refunds_and_audit.sql` |
| M1 | Core schema, entities, repositories | `db/migration/V1__core.sql` and the eight entities of groups A and B of Report section 2.7.2, with their repositories |
| M2 | Transaction and inventory schema | `db/migration/V2__transaction.sql`, the four partial unique indexes of section 2.7.4, and the order, payment, command and inventory entities |

Written so the above can run, but owned by another task: `InventoryService`
(A4 — Hoai Anh) deducts stock and applies the low-stock rules; the alerting it
should raise is still to come.

### Conventions the schema follows

Worth knowing before writing a new entity, because `ddl-auto: validate`
refuses to start the application over any of them:

- **a table's primary key is named after its entity** — `brand_id`,
  `machine_id`, `slot_id` — as the ERD shows it. The Java attribute stays
  `id`, inherited from `BaseEntity`, and each entity renames the column with
  `@AttributeOverride(name = "id", column = @Column(name = "..."))`;
- **there is no `updated_at` column anywhere.** A table that the ERD gives a
  `created_at` extends `TimestampedEntity`; one that it does not extends
  `BaseEntity` and has no timestamp. Who changed what is in `AUDIT_LOGS`;
- **money and quantities are `NUMERIC` and `BigDecimal`,** never `double` and
  never an integer count of dong. Compare two amounts with `compareTo`, not
  `equals`, which also compares the scale;
- **every enumeration has a CHECK constraint** listing exactly the constants
  of its Java enum, so a value Hibernate could not map never reaches a row.

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
| `src/main/resources/db/migration/` | Tra My | M1, M2, M4 (V3 is taken by L7; M4 uses V4) |
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

## Checking the database

Five checks, none of which needs the application to be running. All five
produce output worth a screenshot for Report section 3.6.

**The partial unique indexes.** `src/test/resources/constraint-check.sql`
proves the four indexes of Report section 2.7.4 refuse what they are meant to
refuse, and still allow the legitimate cases: reusing a slot after the bottle
is removed, and issuing a new command once the previous one has finished.

```bash
psql -h localhost -U scent -d scentstation -f src/test/resources/constraint-check.sql
```

**The core schema and its seed.** `src/test/resources/m1-schema-check.sql`
checks what task M1 promised: the seven roles and the administrator account
are there with a real BCrypt hash, `uq_slot_number_per_machine` refuses a
repeated slot number on one machine and allows the same number on another,
and the CHECK constraints refuse an unknown status and a negative price.

```bash
psql -h localhost -U scent -d scentstation -f src/test/resources/m1-schema-check.sql
```

**Refunds and the audit trail.** `src/test/resources/l7-schema-check.sql`
checks V3: a refund reference cannot be recorded twice, so a retried request
cannot refund twice, one refund may move PENDING → FAILED → COMPLETED on the
same row, a zero amount and an unknown status are refused, and an audit line
keeps its before and after JSON.

```bash
psql -h localhost -U scent -d scentstation -f src/test/resources/l7-schema-check.sql
```

Every line marked `EXPECT` must read as its label says, and every block marked
`EXPECT BLOCKED` must print `BLOCKED`. The script runs inside a transaction it
rolls back, so it writes nothing.

**The transaction and inventory schema.** `src/test/resources/m2-schema-check.sql`
checks what task M2 promised of V2: every transaction and inventory table
carries `brand_id`, a movement cannot disagree with its own arithmetic or take
a bottle below zero, an adjustment cannot be made without a reason, quantities
keep their fraction, and one `command_reference` cannot be used twice.

```bash
psql -h localhost -U scent -d scentstation -f src/test/resources/m2-schema-check.sql
```

**The entities against the tables.** `tools/check_schema_mapping.py` compares
every mapped column, type, nullability and enum with the live database and
reports all the disagreements at once, instead of the one column a failed
Hibernate start-up would name.

```bash
python3 -I ../tools/check_schema_mapping.py scentstation
```
