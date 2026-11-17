# ScentStation test plan

## 1. Purpose and status

This plan defines the backend unit and integration scenarios the team intends
to implement. It is prepared before the test code so developers and reviewers
can agree on expected behavior and requirement traceability.

The plan contains **17 unit cases (UT-01–UT-17) and 9 integration cases
(IT-01–IT-09), 26 cases in total**. A listed case is planned coverage, not
evidence that a test has already been implemented or passed. Record actual
results only after running the corresponding automated test. Some expected
behaviors depend on modules or routes that may not exist in the current build;
those cases remain blocked until the dependency is available and must not be
reported as passed based only on a partial assertion.

Every case asserts an observable rule or use-case outcome. A test that checks
unrelated arithmetic or only repeats an implementation detail does not satisfy
this plan.

## 2. Scope and references

The scope is the ScentStation Java backend and its declared order, payment,
dispensing, inventory, device-message and authorization behaviors. Unit tests
isolate a class or rule and use Mockito for collaborators. Integration tests
exercise application boundaries, including PostgreSQL persistence, Spring
Security, and the simulator/device or payment adapter. Tests do not require a
physical kiosk or a real payment provider.

This plan traces cases to:

- Report §1.7.2 — derive verification from the requirements and use cases.
- Report §§2.9.2–2.9.4 — order states, main transaction flow and exception
  handling.
- Report §2.2.9, NFR7 — component testability, critical-scenario coverage and
  authorization testing.
- Report Appendix A — detailed UC-05, UC-07, UC-08, UC-09, UC-16 and UC-17
  flows and outcomes.
- The N1 task brief also references “ScentStation — Hướng dẫn làm Chương 3”,
  section 9. That external guide is not stored in this repository; verify its
  exact title and section against the team's supplied copy before citing it in
  a submitted report.

## 3. Test approach

### Unit tests

- Use JUnit 5. Use Mockito to replace repositories, gateways and other
  collaborators when the case is about one unit's business behavior.
- Do not start Spring, PostgreSQL, Mosquitto or the device simulator for a
  unit test.
- Use a fixed `Clock` for expiry and timeout cases; do not make a test wait
  through a production timeout.
- Assert the returned state/error and relevant effects, such as a repository
  save, a device publish, or the absence of a call. Avoid asserting private
  implementation details that do not represent a rule.

### Integration tests

- Use Spring Boot Test/MockMvc and PostgreSQL for tests that need real Spring
  wiring, database migrations, transactions, indexes or tenant filters. The
  current `MqttDispensingIT` and `BackendBoundaryIT` connect to the local
  PostgreSQL service from `docker-compose.yml`; start it before running them.
- Use Mosquitto plus the Java device simulator, or a deterministic
  protocol-compatible test device, for MQTT scenarios. The simulator supports
  reproducible `reject`, `interlock`, `silent`, `duplicate` and `offline`
  fault modes. Use a test payment payload/provider; never call a real payment
  service.
- Seed only the records required by a case. These two integration test classes
  use the shared local Compose database and may leave test orders/records
  behind; use only the local development database, never production data.
- For a security case without a corresponding production admin endpoint yet,
  register a test-only controller through test configuration. It must call
  the real repository or a marker-writing service and pass through the real
  JWT, Spring Security and tenant-filter wiring. This fixture verifies those
  boundaries only; it is not a production route and does not prove a missing
  production admin feature exists.
- Treat every expected result in a case as required for that case to pass.
  If a required incident, alert, refund, review or production admin behavior
  is absent, mark the case **Blocked** (or **Not run** if it was not attempted)
  and name the missing dependency; do not mark only the available assertions
  as a full pass. Do not silently skip a required assertion.

## 4. Unit test cases

| ID | Unit under test | Preconditions and action | Expected result / assertions | UC | BR | FR / NFR | Basis |
|---|---|---|---|---|---|---|---|
| UT-01 | `OrderStateMachine` | For each order status, attempt every possible next status according to the transition table in §2.9.2 | Only transitions listed in the specification change state; repeating the current state is a no-op; every other transition is rejected without changing the order | UC-05, UC-08, UC-09, UC-16 | BR14 | FR3.10, FR4.10 | §2.9.2 order state machine |
| UT-02 | `OrderStateMachine` | Start at `DISPENSED`; attempt to move to every different status | Every attempt is rejected; the order remains `DISPENSED` | UC-09 | BR6 | FR4.10 | A completed successful spray is not repeated or reversed by an automatic transition |
| UT-03 | `OrderStateMachine` | Start at `UNCERTAIN`; try automatic transitions, then try human resolution with a blank note and with a valid note | Automatic transition and blank-note resolution are rejected; a non-blank human review note permits only `DISPENSED` or `FAILED` | UC-08, UC-09, UC-16 | BR14 | FR4.11, FR4.12, NFR4.5 | Uncertain outcomes require human review |
| UT-04 | `CommandSigner` | Sign a valid command payload and verify the unchanged payload | Verification returns true | UC-08 | BR7 | FR4.2, FR4.6, NFR2.6 | The command carries a verifiable signature |
| UT-05 | `CommandSigner` | Sign a command, change a signed field such as `doseMl` or `deviceId`, then verify | Verification returns false for the changed payload | UC-08 | BR7 | FR4.6, NFR2.6 | Invalid or altered commands must not be trusted |
| UT-06 | `CommandSigner` | Verify a payload with a missing, blank or incorrect signature | Verification returns false in each case | UC-08 | BR7 | FR4.6, NFR2.6 | Covers invalid signature input; expiry is not tested here because the backend signer does not enforce command expiry |
| UT-07 | `OrderService` | Give the service an online/active machine and an available slot with a known effective price; create an order | A `PENDING` order is saved with the slot's effective price in `priceSnapshot`, currency and expiry set from configuration/clock; later price changes do not alter that snapshot | UC-05 | BR4 | FR3.3, FR3.4, NFR3.6 | Order-time price immutability |
| UT-08 | `InventoryService` | Give the service an installed bottle with enough stock and a confirmed command with a known dose | Remaining quantity decreases by exactly one dose; one negative-quantity `DISPENSE` movement with that command ID is saved | UC-09, UC-10 | BR10 | FR6.5, FR6.7 | Only a confirmed customer spray reduces sale stock |
| UT-09 | `InventoryService` | Give the service an installed bottle with less remaining volume than the command dose | `INSUFFICIENT_VOLUME` is returned; remaining quantity is unchanged and no movement is saved | UC-09, UC-10 | BR10 | FR6.7, FR6.9 | A dose that cannot be supplied must not be recorded as dispensed |
| UT-10 | `OrderService` | Try creating an order when the machine is offline; repeat with a non-active operating status | Each request returns `MACHINE_UNAVAILABLE`; slot lookup and order save are not called | UC-05 | BR9 | FR3.2, FR5.2 | New orders require a communicating, operational machine |
| UT-11 | `OrderService` | With an online/active machine, try an unavailable slot and a slot with no product | Each request returns `SLOT_UNAVAILABLE`; no order is saved | UC-04, UC-05 | BR3 | FR3.2 | Only available products/slots are selectable |
| UT-12 | `OrderService` | Use a fixed clock and repository results containing overdue `PENDING` orders; run expiry processing | Each returned overdue order transitions to `EXPIRED` and is saved with its expiry reason; the method returns the number expired | UC-05 | — | FR3.9 | Expiry processing is deterministic |
| UT-13 | `DispenseService` | Call `issueCommand` for an order in a status other than `PAID` | `ORDER_NOT_PAID` is returned; command persistence and device publishing are not called | UC-08 | BR5 | FR4.1 | A command may only be issued after backend-confirmed payment |
| UT-14 | `DispenseService` | Apply the same successful result again after its command and order have already been committed as successful | The repeated result causes no state change, additional inventory movement or second deduction | UC-09 | BR6, BR10 | FR4.3, FR6.7, NFR3.4 | Repeated device results must be idempotent |
| UT-15 | `DeviceMessageHandler` | Pass malformed JSON for an MQTT acknowledgement or result message | The malformed message is ignored; neither `DispenseService` nor `MachineService` is called | UC-07, UC-08 | — | NFR7.5, NFR8.4 | Malformed payloads must not change business state |
| UT-16 | `PaymentService` | Return an existing order from the repository, then submit a success notification whose amount differs from its price snapshot | `AMOUNT_MISMATCH` is returned; payment is not saved/flushed, and payment confirmation/dispensing are not called | UC-05 | BR5 | FR3.7 | Provider amount must match the order before payment is accepted |
| UT-17 | `DispenseService` | Time out an issued command so its order becomes `UNCERTAIN`, then deliver a late successful result for that command | A durable late-result record retains the command correlation, outcome and receipt time for review; the order remains `UNCERTAIN`, inventory is unchanged, and no new command is issued. A reviewer must resolve the order separately | UC-09, UC-16 | BR10, BR14 | FR4.9, FR4.11, FR4.12, NFR4.5 | UC-09 exception E2b: late results are evidence for human review, not automatic resolution |

## 5. Integration test cases

| ID | Test setup and action | Expected result / assertions | UC | BR | FR / NFR | Boundary and test data |
|---|---|---|---|---|---|---|
| IT-01 | In PostgreSQL, create an active brand, online/active machine, available slot, installed bottle and pending order. Submit a correctly signed success payment notification with the exact reference, amount and currency. Run the simulator or protocol-compatible test device and allow acknowledgement/result success. | Persisted order is `DISPENSED`; one `SUCCEEDED` payment and one successful command/result correlated to the order are persisted; exactly one customer-sale inventory movement for the configured dose is recorded. | UC-05, UC-08, UC-09 | BR3, BR4, BR5, BR6, BR10 | FR3.2, FR3.4, FR3.7, FR4.1, FR4.9, FR4.10, FR6.7 | Spring Boot + local Compose PostgreSQL + Mosquitto + protocol-compatible test device in normal mode. |
| IT-02 | Begin with a paid order and an active command. Start the simulator or protocol-compatible test device in `reject` mode and deliver its negative acknowledgement with a failure reason. | Command is recorded as rejected; order becomes `FAILED` with the device reason; no customer-sale inventory movement is created; an incident/review item is persisted and available to the operational review workflow. All assertions are required for Pass. | UC-08, UC-09, UC-16 | BR7, BR10 | FR3.13, FR4.6, FR4.9, FR4.12 | PostgreSQL + MQTT + simulator/test device `reject`. If incident/review persistence or workflow is absent, mark the case Blocked; passing only the command/order/stock assertions is partial, not a Pass. |
| IT-03 | Begin with a paid order and an active command. Start the simulator or protocol-compatible test device in `interlock` mode, which reports the door-open safety condition. | Device refuses actuation; backend records the correlated rejection and order `FAILED`; failure reason is retained; customer-sale inventory is unchanged; machine operating status is updated and an alert is raised. All assertions are required for Pass. | UC-08, UC-13 | BR8 | FR4.7, FR4.9, FR7.1 | PostgreSQL + MQTT + simulator/test device `interlock`; this concrete scenario covers the door-open interlock. Other BR8 interlocks require equivalent controllable simulator/test-fixture states. If status/alert handling is absent, mark Blocked. |
| IT-04 | Begin with a paid order and an active command. Start the simulator or protocol-compatible test device in `silent` mode and advance the configured result timeout without delivering a result. | Command is marked timed out; order becomes `UNCERTAIN`; exactly one command was published; no automatic retry is issued; an incident/review item is persisted for human resolution. All assertions are required for Pass. | UC-08, UC-16 | BR14 | FR4.11, FR4.12, NFR4.5 | PostgreSQL + MQTT + simulator/test device `silent`; advance/test the timeout without sleeping for the production duration. If incident/review routing is absent, mark Blocked. |
| IT-05 | Begin with a paid order. Start the simulator or protocol-compatible test device in `duplicate` mode so it publishes the same successful result more than once. | The order remains `DISPENSED`; command/result correlation is preserved; exactly one customer-sale inventory movement and one dose deduction are persisted. | UC-09, UC-10 | BR6, BR10 | FR5.6, FR6.7, NFR3.3, NFR3.4 | PostgreSQL + MQTT + simulator/test device `duplicate`; verify database rows after all result copies have arrived. |
| IT-06 | Register an online machine, then run the simulator in `offline` mode or otherwise stop its heartbeats. Advance beyond the configured heartbeat threshold and submit a kiosk order request. | Machine is classified `OFFLINE`; the order request is refused; no order or payment record is created. | UC-05, UC-07 | BR9 | FR3.2, FR5.1, FR5.2, NFR7.5 | PostgreSQL + MQTT + simulator `offline`, or age the last heartbeat under a controllable threshold; do not wait through the production timeout. |
| IT-07 | Seed PostgreSQL with machines belonging to Brand A and Brand B. Authenticate a Brand A user and request the known Brand B machine through a test-only controller registered by test configuration and calling the real `MachineRepository`. | The request cannot retrieve Brand B data (for example, the scoped repository lookup is empty and the fixture responds `404`). A platform administrator can retrieve it in a separate positive control. Both checks are required. | UC-07, UC-17 | BR13 | FR1.4, FR1.5, NFR7.6 | Spring Boot + local Compose PostgreSQL + real JWT filter + tenant filter. This fixture specifically tests tenant isolation, not the existence or behavior of a production brand-admin read API. If the real tenant filter/repository path cannot be exercised, mark Blocked rather than substituting a mocked repository. |
| IT-08 | Authenticate a Viewer and POST to a test-only protected write route registered by test configuration under `/api/`; its handler would save a marker record through the test database. | Spring Security returns `403` before the handler runs; the marker record is not created or modified. A role permitted to write may reach the same fixture as a positive control. Both checks are required. | UC-17 | — | FR1.11, NFR7.6 | Spring Boot/MockMvc + local Compose PostgreSQL + real JWT and `SecurityFilterChain`. The fixture verifies the configured authorization boundary only; it is not a production write API. |
| IT-09 | Create a pending order and submit the same correctly signed successful webhook twice, with matching provider, provider reference, payment reference, amount and currency. | First delivery is applied; repeat is reported as ignored; one payment is persisted, order is confirmed paid once, and no more than one dispense command is issued. | UC-05, UC-08 | BR5, BR6 | FR3.7, FR3.8, FR4.1, NFR3.3 | Spring Boot + local Compose PostgreSQL; capture the `DeviceGateway` publish count and inspect persisted payment/order/command records. |

## 6. Execution and reporting

### Implementation and execution status

The results below include the user's Maven/Failsafe run of
`MqttDispensingIT` against local Compose services and the IntelliJ run of
`BackendBoundaryIT` shown in the supplied screenshot, on 2026-11-17. Passing
means every assertion in that case passed; an assertion failure is recorded as
Fail, not as an environment issue.

| Cases | Current code status |
|---|---|
| UT-01–UT-16 | **Pass**: reported passed; the supplied `MqttDispensingIT` Maven output also shows 35 Surefire tests with 0 failures/errors/skips. JVM/Mockito warnings did not fail those tests. |
| UT-17 | **Error** in `MqttDispensingIT`: timed out waiting for the correlated `LATE_RESULT` device event; query returned 0 rows after 10 seconds. |
| IT-01 | **Pass** in `MqttDispensingIT`: success result dispensed once and deducted one dose. |
| IT-02 | **Fail** in `MqttDispensingIT`: rejected command/order/stock assertions passed, but no incident was persisted (`0` expected greater than `0`). |
| IT-03 | **Fail** in `MqttDispensingIT`: order rejection and reason were observed, but machine operating status remained `ACTIVE`; the test stopped before checking the alert assertion. |
| IT-04 | **Fail** in `MqttDispensingIT`: timeout/order/one-command assertions passed, but no incident/review item was persisted. |
| IT-05–IT-06 | **Pass** in `MqttDispensingIT`: duplicate result was idempotent; offline machine blocked a new order. |
| IT-07–IT-08 | **Pass** in `BackendBoundaryIT` screenshot: tenant isolation and write authorization passed. |
| IT-09 | **Fail** in `BackendBoundaryIT` screenshot: duplicate signed payment webhook case failed. The screenshot does not show the assertion details. |

Run backend unit tests from `backend/`:

```shell
mvn test
```

For the integration tests, first start their local dependencies from the
repository root, then run the test from `backend/`:

```shell
docker compose up -d db mqtt
docker compose exec db pg_isready -U scent -d scentstation
cd backend
mvn verify
```

The two phases are separated by the file name rather than by a tag: Surefire
runs `*Test.java` on `mvn test`, Failsafe runs `*IT.java` on `mvn verify`.
Name an integration case `SomethingIT.java`, so that `mvn test` stays runnable
by every member on every change, including on a machine with no Docker.

What the build provides: `spring-boot-starter-test` brings JUnit 5, Mockito
and AssertJ; `spring-security-test` is available for security test helpers,
while `BackendBoundaryIT` obtains tokens through the real login endpoint.
These integration test classes connect to PostgreSQL and Mosquitto on
`localhost` as configured in `application.yml` and `docker-compose.yml`; start
the required Compose services before running them. They start Spring in the
test process, so do not start a separate backend. Do not start a production
payment provider or physical device.

Use the following result record in the Chapter 3 test-results section after
the cases have actually been implemented and run:

| ID | Test case | Command/environment | Expected result | Actual result / evidence | Status |
|---|---|---|---|---|---|
| UT-01–UT-03 | Order state-machine rules | IntelliJ JUnit: `OrderStateMachineTest` | Expected assertions in §4 | User reports test file passed; green indicator (2026-11-17) | Pass |
| UT-04–UT-06 | Command signature verification | IntelliJ JUnit: `CommandSignerTest` | Expected assertions in §4 | User reports test file passed; green indicator (2026-11-17) | Pass |
| UT-07, UT-10–UT-12 | Order creation, availability and expiry | IntelliJ JUnit: `OrderServiceTest` | Expected assertions in §4 | User reports test file passed; green indicator (2026-11-17) | Pass |
| UT-08–UT-09 | Inventory deduction and insufficient volume | IntelliJ JUnit: `InventoryServiceTest` | Expected assertions in §4 | User reports test file passed; green indicator (2026-11-17) | Pass |
| UT-13–UT-14 | Command authorization and duplicate result handling | IntelliJ JUnit: `DispenseServiceTest` | Expected assertions in §4 | Test class completed; process exit code 0 (2026-11-17) | Pass |
| UT-15 | Malformed MQTT message handling | IntelliJ JUnit: `DeviceMessageHandlerTest` | Expected assertions in §4 | User reports test file passed; green indicator (2026-11-17) | Pass |
| UT-16 | Payment amount validation | IntelliJ JUnit: `PaymentServiceTest` | Expected assertions in §4 | User reports test file passed; green indicator (2026-11-17) | Pass |
| UT-17 | Late successful result is retained as durable review evidence | `mvn "-Dit.test=MqttDispensingIT" verify`, local Compose PostgreSQL/Mosquitto | One correlated `LATE_RESULT` device event; order remains `UNCERTAIN`, stock unchanged, no second command | Awaitility timed out after 10 seconds; event query returned 0 rows | Error |
| IT-01 | Successful dispensing flow | `mvn "-Dit.test=MqttDispensingIT" verify`, local Compose PostgreSQL/Mosquitto | Dispense once and deduct one dose | Passed in the user's run; Maven summary: 7 tests, 3 failures, 1 error | Pass |
| IT-02 | Device rejection and incident | Same as above | Rejected order, unchanged stock, durable incident | Incident count was 0; assertion expected > 0 | Fail |
| IT-03 | Door interlock and alert | Same as above | Rejected order, non-active machine, alert | Machine operating status was still `ACTIVE`; alert assertion was not reached | Fail |
| IT-04 | Silent device timeout and review incident | Same as above | `UNCERTAIN`, one command, no stock change, durable incident | Incident count was 0; assertion expected > 0 | Fail |
| IT-05–IT-06 | Duplicate result; offline machine | Same as above | Idempotent stock deduction; offline machine blocks new order | Both cases passed in the user's run | Pass |
| IT-07–IT-08 | Tenant isolation; write authorization | IntelliJ JUnit: `BackendBoundaryIT`, local Compose PostgreSQL | Expected assertions in §5 | Supplied screenshot: 2 passed | Pass |
| IT-09 | Duplicate signed payment webhook | Same as above | One payment and command; duplicate notification ignored | Supplied screenshot: test failed; assertion detail not visible | Fail |

Status meanings: **Pass** means all stated assertions succeeded; **Fail**
means at least one assertion did not; **Blocked** means a required component
or environment was unavailable; **Not run** means no execution result exists.
Never report a planned or blocked case as passing.
