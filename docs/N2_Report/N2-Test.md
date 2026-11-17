# N2 – INTEGRATION TEST PROCEDURE

| Information | Value |
|---|---|
| Project | ScentStation |
| Scope | N2 – Backend/Simulator Fault Mode integration testing |
| Test device | `ma-device-001` |
| Test date | 17/11/2026 |
| Tester | Tran Thi Kim Ngan |
| Status | In Progress |

> **How to use this document:** Use the three terminals as assigned in Section 2.2. Complete the setup, then run each Fault Mode in order. Record results and evidence screenshots in [N2-Report.md](N2-Report.md).

---

## 1. Test Purpose and Scope

N2 verifies how the Backend handles abnormal conditions encountered by a Kiosk while executing commands.

The Simulator is used to reproduce five fault scenarios:

| Fault Mode | Simulated scenario | Verification goals |
|---|---|---|
| `reject` | Device rejects a command | Order fails, inventory is not deducted, and an incident is created |
| `interlock` | Device rejects a command because a safety condition is not met (door open) | Order fails with a recorded reason, device status is updated, and an alert is created |
| `silent` | Device does not send a dispense result | Order becomes `UNCERTAIN`; the command is not retried automatically |
| `duplicate` | Device sends a duplicate result | Inventory and transactions are recorded only once |
| `offline` | Simulator stops sending heartbeats | Backend marks the machine `OFFLINE` and rejects new Order requests |

The tests verify that the Backend handles Order status, inventory, transactions, incidents/alerts, and device status correctly in each scenario.

## 2. Test Environment and Preconditions

### 2.1. Environment Configuration

| Component / precondition | Requirement | Actual status |
|---|---|---|
| Docker Desktop | Installed and running | [Enter result] |
| PostgreSQL | Running via Docker Compose | [Enter result] |
| MQTT Broker | Running via Docker Compose | [Enter result] |
| Backend | Started successfully and API responds | [Enter result] |
| Simulator | Build completed successfully | [Enter result] |
| Device `ma-device-001` | Maison Aroma demo machine in seed data; must be `ONLINE` before each mode, except when verifying the `offline` mode | [Enter result] |
| MQTT command secret | Backend and Simulator configurations match | [Enter result] |
| Order creation and simulated payment | Flow works before fault-mode testing begins | [Enter result] |
| Heartbeat timeout | 45 seconds by default, or record the actual value | [Enter result] |

### 2.2. Terminals to Keep Open

Open three terminals:

| Terminal | Purpose |
|---|---|
| **Terminal 1** | Docker Compose, build the Simulator, sign in, create Orders, and check the API/Database |
| **Terminal 2** | Run the Backend |
| **Terminal 3** | Run each Fault Mode |

Keep Terminal 1 open to retain `TOKEN` and the shell function, and Terminal 2 open while the Backend is running. When switching modes, press `Ctrl+C` in Terminal 3 before starting the next mode.

## 3. Environment Setup and Shared Commands

Perform the following steps in order. Sign in only after the Backend has started.

### 3.1. Start PostgreSQL and the MQTT Broker

**Terminal 1:**
**Purpose:** Start the services required by the Backend and Simulator, and create the evidence directory.

```bash
cd /c/1.UTH/nam3HK1/Java/LapTrinhJava
docker compose up -d db mqtt
mkdir -p docs/evidence/N2
```

**Expected results:**
- Docker Compose starts the database and MQTT broker.
- The `docs/evidence/N2` directory is created.

### 3.2. Build the Simulator

**Terminal 1:**

**Purpose:** Create the JAR file used to run the Fault Modes.

```bash
cd /c/1.UTH/nam3HK1/Java/LapTrinhJava/simulator
mvn clean package
```

- `mvn clean`: removes the previous build output.
- `mvn package`: compiles, runs the configured Maven test phases, and packages the application.

**Expected result:** The build succeeds and produces `target/simulator.jar`.

### 3.3. Start the Backend

**Terminal 2:**
**Purpose:** Start the Backend.

```bash
cd /c/1.UTH/nam3HK1/Java/LapTrinhJava/backend
mvn spring-boot:run
```

Wait for the Spring Boot log to confirm that the application has started. Leave the Backend running in Terminal 2, then return to Terminal 1.

### 3.4. Sign In and Obtain a Token

**Terminal 1:**

**Purpose:** Sign in with the demo account to obtain a token for the simulated payment endpoint.

After Terminal 2 confirms that the Backend has started successfully, run this command in Terminal 1:

```bash
AUTH_JSON=$(curl -fsS -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@maisonaroma.local","password":"Admin@12345"}')

TOKEN=$(printf '%s' "$AUTH_JSON" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

test -n "$TOKEN" && echo "Login successful; token is ready."
```

**Expected result:**

```text
Login successful; token is ready.
```

If the message does not appear, check the demo credentials and login response. Keep Terminal 1 open to retain the `TOKEN` variable.

### 3.5. Define the Shared Order-Creation and Payment Function

**Terminal 1:**
**Purpose:** Create an Order for the configured device and slot, extract `ORDER_ID` and `PAYMENT_REF`, and then call the simulated payment endpoint.

Run the following block **once** in Terminal 1. It defines the function but does not create an Order:

```bash
create_and_pay_order() {
  ORDER_JSON=$(curl -fsS -X POST http://localhost:8080/api/kiosk/orders \
    -H "Content-Type: application/json" \
    -d '{"deviceId":"ma-device-001","slotNumber":1}') || return 1

  ORDER_ID=$(printf '%s' "$ORDER_JSON" | sed -n 's/.*"orderId":\([0-9][0-9]*\).*/\1/p')
  PAYMENT_REF=$(printf '%s' "$ORDER_JSON" | sed -n 's/.*"qrContent":"scentstation:\/\/pay\/\([^"]*\)".*/\1/p')

  if [ -z "$ORDER_ID" ] || [ -z "$PAYMENT_REF" ]; then
    printf 'Could not read orderId/paymentRef from response: %s\n' "$ORDER_JSON" >&2
    return 1
  fi

  printf 'Created order: %s\n' "$ORDER_JSON"

  curl -fsS -X POST http://localhost:8080/api/dev/payments/simulate \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"paymentRef\":\"$PAYMENT_REF\",\"succeed\":true}" || return 1

  printf '\nOrder ID for status/database checks: %s\n' "$ORDER_ID"
}
```

The new Order starts in `PENDING`, so the Backend has not yet sent a dispense command for the Simulator to process. This function retrieves the Order's `paymentRef` and calls the simulated payment API. After the Backend confirms payment, it publishes a command over MQTT for the Simulator's active fault mode to process. The function stores `ORDER_ID` for subsequent checks.

For `reject`, `interlock`, `silent`, and `duplicate`, run `create_and_pay_order` after starting the corresponding Simulator mode. Each call creates a new Order. For `offline`, do not call this function after the machine goes offline; send a separate Order-creation request to verify that the Backend rejects it.

Function summary:
- Calls the API to create an Order for `ma-device-001`, slot 1.
- Extracts `orderId` and `paymentRef` from the response.
- Calls the simulated payment API with `succeed: true`.
- Stores the new Order ID in `ORDER_ID` for subsequent checks.

### 3.6. Check Order Status

**Terminal 1:**
Run this after `create_and_pay_order` successfully creates an Order. The Order-status endpoint does not require a token.

```bash
curl -fsS "http://localhost:8080/api/kiosk/orders/$ORDER_ID/status"
```

This command reads the status and failure reason of the Order whose ID is stored in `ORDER_ID`.

**Usage:** Run this command for each Fault Mode after allowing the Backend enough time to process the result or reach the applicable timeout. Expected statuses are listed in Section 4.

For each mode in Section 4, save the screenshot after collecting the relevant logs and check results, using the filename specified for that mode. Save all screenshots in `docs/evidence/N2/`, created in Step 3.1.

---

## 4. Execute Each Fault Mode

Run the modes below in order in Terminal 3. Between modes, press `Ctrl+C` to stop the Simulator before starting the next mode. Run only one Simulator for `ma-device-001` at a time.

### 4.1. Fault Mode Test: Reject

**Test ID:** `N2-REJECT`
**Fault Mode:** `reject`

**Objective:** Verify that the Backend handles a device rejecting a command correctly.

#### Step 1. Start the Simulator

**Terminal 3:**

Start the Simulator in `reject` mode:

```bash
java -jar /c/1.UTH/nam3HK1/Java/LapTrinhJava/simulator/target/simulator.jar --device=ma-device-001 --fault=reject
```

This starts the Simulator for device `ma-device-001` in command-rejection mode.

**Expected result:** The Simulator starts with `fault=reject` and connects to MQTT successfully.

#### Step 2. Verify Device Readiness

After the Simulator reports that it has connected to MQTT, check the menu in Terminal 1:

```bash
curl -sS http://localhost:8080/api/kiosk/machines/ma-device-001/menu
```

Continue only if the response shows `deviceId` as `ma-device-001`, `status` as `ONLINE`, and slot 1 as `"available":true`. If these conditions are not met, do not create an Order; see the recovery instructions in Section 5.

#### Step 3. Create and Pay for an Order

**Terminal 1:**

After the Simulator reports that it has connected to MQTT, run the function defined in Section 3.5:

```bash
create_and_pay_order
```

Record the printed `ORDER_ID`.

#### Step 4. Check Order Status

**Terminal 1:**

Run the Order-status command in [Section 3.6](#36-check-order-status).

**Expected result:** `status` is `FAILED` and `failureReason` is `DEVICE_REJECTED`.

#### Step 5. Check the Command and Inventory

**Terminal 1:**

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT o.order_id, o.status, o.failure_reason,
        dc.command_id, dc.status AS command_status,
        dc.failure_reason AS command_reason, dc.inventory_applied
 FROM orders o
 JOIN dispense_commands dc ON dc.order_id = o.order_id
 WHERE o.order_id = $ORDER_ID;"
```

This query retrieves the Order and its corresponding command.

**Expected results:**
- The Order status is `FAILED`.
- The command status is `REJECTED`.
- The Order and command failure reasons are `DEVICE_REJECTED`.
- `inventory_applied` is `f`.

Next, check the inventory movements:

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT im.movement_id, im.movement_type, im.quantity
 FROM inventory_movements im
 JOIN dispense_commands dc ON dc.command_id = im.command_id
 WHERE dc.order_id = $ORDER_ID AND im.movement_type = 'DISPENSE';"
```

This query retrieves `DISPENSE` movements associated with the Order's command.

**Expected result:** No rows are returned.

#### Step 6. Check for an Incident

**Terminal 1:**

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT incident_id, incident_type, severity, status, description
 FROM incidents
 WHERE order_id = $ORDER_ID;"
```

This query retrieves incidents recorded for the Order under test.

**Expected result:** An incident exists for the rejected Order. If no rows are returned, the incident criterion is not met.

#### Expected Results

| Criterion | Expected result | Actual result |
|---|---|---|
| Simulator response | `DEVICE_REJECTED` | [Enter] |
| Order status | `FAILED` | [Enter] |
| Command status | `REJECTED` | [Enter] |
| Inventory | No deduction | [Enter] |
| Incident | Recorded | [Enter] |

**Assessment:** [PASS / FAIL / BLOCKED]

**Evidence:** `N2-reject.png`

The screenshot/logs should show the Simulator response, Order status, and inventory/incident check results.

---

### 4.2. Fault Mode Test: Interlock

**Test ID:** `N2-INTERLOCK`
**Fault Mode:** `interlock`

**Objective:** Verify that the Backend handles a command rejected because a safety condition is not met.

#### Step 1. Start the Simulator

**Terminal 3:**

After stopping the previous Simulator mode, run this mode's command:

```bash
java -jar /c/1.UTH/nam3HK1/Java/LapTrinhJava/simulator/target/simulator.jar --device=ma-device-001 --fault=interlock
```

This starts the Simulator in interlock mode.

**Expected result:** The Simulator starts with `fault=interlock` and connects to MQTT successfully.

#### Step 2. Verify Device Readiness

After the Simulator reports that it has connected to MQTT, continue to Order creation.

#### Step 3. Create and Pay for an Order

**Terminal 1:**

After the Simulator reports that it has connected to MQTT, create and pay for a new Order by running the function in Section 3.5:

```bash
create_and_pay_order
```

Record the printed `ORDER_ID`.

#### Step 4. Check the Order and Command

**Terminal 1:**

Run the Order-status command in [Section 3.6](#36-check-order-status).

Then query the database:

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT o.order_id, o.status, o.failure_reason,
        dc.status AS command_status, dc.failure_reason AS command_reason,
        dc.inventory_applied
 FROM orders o
 JOIN dispense_commands dc ON dc.order_id = o.order_id
 WHERE o.order_id = $ORDER_ID;"
```

**Expected results:**
- Order is `FAILED`.
- Command is `REJECTED`.
- Failure reason is `DOOR_OPEN`.
- Inventory is not applied.

#### Step 5. Check Inventory Movements

**Terminal 1:**

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT COUNT(*) AS dispense_movement_count
 FROM inventory_movements im
 JOIN dispense_commands dc ON dc.command_id = im.command_id
 WHERE dc.order_id = $ORDER_ID AND im.movement_type = 'DISPENSE';"
```

This query counts the Order's `DISPENSE` movements.

**Expected result:** `dispense_movement_count` is `0`.

#### Step 6. Check Machine Status, Incidents, and Alerts

**Terminal 1:**

Check the machine status:

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT m.device_identity, m.connection_status, m.operating_status
 FROM machines m
 JOIN orders o ON o.machine_id = m.machine_id
 WHERE o.order_id = $ORDER_ID;"
```

Check for an incident:

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT incident_id, incident_type, severity, status, description
 FROM incidents
 WHERE order_id = $ORDER_ID;"
```

Check for an alert:

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT a.alert_id, a.alert_type, a.severity, a.status, a.message
 FROM alerts a
 JOIN orders o ON o.machine_id = a.machine_id
 WHERE o.order_id = $ORDER_ID
   AND a.created_at >= o.created_at;"
```

These queries retrieve the machine status, incidents for the Order, and alerts for the machine created since the Order timestamp. Verify the actual schema and relationships to confirm that any returned alert is related to the interlock event under test; do not treat an unrelated alert as evidence.

**Coordinate with Long:**

As previously observed, when `forceDoorOpen` is enabled, the Simulator may return a `DOOR_OPEN` acknowledgement while telemetry still reads the actual door state through `isDoorOpen()`, which defaults to closed.

Agree on one of the following approaches:
- The Backend updates device status and creates an alert based on the `DOOR_OPEN` acknowledgement; or
- The Simulator publishes telemetry that reports the door as open.

Mark the test as passing only when the machine status and alert meet the agreed requirements. If this has not been resolved or confirmed, record `BLOCKED`, not `PASS`.

#### Expected Results

| Criterion | Expected result | Actual result |
|---|---|---|
| Simulator response | `DOOR_OPEN` | [Enter] |
| Order status | `FAILED` | [Enter] |
| Failure reason | `DOOR_OPEN` is recorded | [Enter] |
| Inventory | Unchanged | [Enter] |
| Device status | Updated as required | [Enter] |
| Incident/Alert | Recorded as required | [Enter] |

**Confirmation with Long:** [Name / agreed behavior / date]

**Assessment:** [PASS / FAIL / BLOCKED]

**Evidence:** `N2-interlock.png`

The screenshot/logs should show the `DOOR_OPEN` response, Order status, machine status, and alert.

---

### 4.3. Fault Mode Test: Silent

**Test ID:** `N2-SILENT`
**Fault Mode:** `silent`

**Objective:** Verify that the Backend handles a device that does not send a dispense result after receiving a command.

#### Step 1. Start the Simulator

**Terminal 3:**

After stopping the previous Simulator mode, run this mode's command:

```bash
java -jar /c/1.UTH/nam3HK1/Java/LapTrinhJava/simulator/target/simulator.jar --device=ma-device-001 --fault=silent
```

This starts the Simulator in silent mode.

**Expected result:** The Simulator starts with `fault=silent` and connects to MQTT successfully.

#### Step 2. Verify Device Readiness

After the Simulator reports that it has connected to MQTT, continue to Order creation.

#### Step 3. Create and Pay for an Order

**Terminal 1:**

After the Simulator reports that it has connected to MQTT, create and pay for a new Order by running the function in Section 3.5:

```bash
create_and_pay_order
```

Record the printed `ORDER_ID`.

The Simulator sends an acknowledgement but no dispense result. Wait **70 seconds** to allow the Backend's watchdog timeout to run as configured.

> Confirm the actual timeout in the Backend configuration before testing. Adjust the wait if the timeout or watchdog interval has changed.

#### Step 4. Check the Order Status and Command Count

**Terminal 1:**

Run the Order-status command in [Section 3.6](#36-check-order-status).

Then run this query:

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT o.order_id, o.status, o.failure_reason,
        COUNT(dc.command_id) AS command_count,
        MIN(dc.status) AS command_status,
        BOOL_AND(NOT dc.inventory_applied) AS inventory_not_applied
 FROM orders o
 JOIN dispense_commands dc ON dc.order_id = o.order_id
 WHERE o.order_id = $ORDER_ID
 GROUP BY o.order_id, o.status, o.failure_reason;"
```

This query retrieves the Order status, command count, and whether inventory was applied.

**Expected results:**
- The Order status is `UNCERTAIN`.
- `command_count` is `1`.
- The command status is `TIMED_OUT`.
- `inventory_not_applied` is `t`.

Do not create a replacement Order during the same test. Check the Backend and Simulator logs to verify that the command was not retried.

#### Expected Results

| Criterion | Expected result | Actual result |
|---|---|---|
| Dispense result | No response | [Enter] |
| Order status | `UNCERTAIN` | [Enter] |
| Command count | One command | [Enter] |
| Command retry | Not automatically retried | [Enter] |
| Inventory | Not applied while the result is unknown | [Enter] |

**Assessment:** [PASS / FAIL / BLOCKED]

**Evidence:** `N2-silent.png`

The screenshot/logs should show that the Simulator did not send a dispense result, the Order is `UNCERTAIN`, and only one command exists.

---

### 4.4. Fault Mode Test: Duplicate

**Test ID:** `N2-DUPLICATE`
**Fault Mode:** `duplicate`

**Objective:** Verify that the Backend handles duplicate responses without recording a transaction or deducting inventory more than once.

#### Step 1. Start the Simulator

**Terminal 3:**

After stopping the previous Simulator mode, run this mode's command:

```bash
java -jar /c/1.UTH/nam3HK1/Java/LapTrinhJava/simulator/target/simulator.jar --device=ma-device-001 --fault=duplicate
```

This starts the Simulator in duplicate mode.

**Expected result:** The Simulator starts with `fault=duplicate` and connects to MQTT successfully.

#### Step 2. Verify Device Readiness

After the Simulator reports that it has connected to MQTT, continue to Order creation.

#### Step 3. Create and Pay for an Order

**Terminal 1:**

After the Simulator reports that it has connected to MQTT, create and pay for a new Order by running the function in Section 3.5:

```bash
create_and_pay_order
```

Record the printed `ORDER_ID`.

#### Step 4. Check the Order and Command

Wait until the Simulator logs the duplicate result, then check the Order status using [Section 3.6](#36-check-order-status).

**Terminal 1:**

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT o.order_id, o.status, COUNT(dc.command_id) AS command_count,
        BOOL_AND(dc.status = 'SUCCEEDED') AS all_commands_succeeded,
        BOOL_AND(dc.inventory_applied) AS inventory_applied
 FROM orders o
 JOIN dispense_commands dc ON dc.order_id = o.order_id
 WHERE o.order_id = $ORDER_ID
 GROUP BY o.order_id, o.status;"
```

This query retrieves the Order status, command count, and inventory application status.

**Expected result for the current flow:** The Order is `DISPENSED`, there is one successful command, and `inventory_applied` is `t`.

#### Step 5. Check the Inventory Deduction Count

**Terminal 1:**

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT COUNT(*) AS dispense_movement_count,
        COALESCE(SUM(-im.quantity), 0) AS total_deducted_ml
 FROM inventory_movements im
 JOIN dispense_commands dc ON dc.command_id = im.command_id
 WHERE dc.order_id = $ORDER_ID AND im.movement_type = 'DISPENSE';"
```

This query retrieves the number of `DISPENSE` movements and the total inventory deducted for the Order.

**Expected result:** There is only one `DISPENSE` movement for this command/Order.

**Check the customer-sale movement:**

The test plan requires exactly one customer-sale movement. Identify the correct table, columns, and relation keys in the current schema before writing the SQL query. Do not guess table names. Once identified, add the query here and record the actual movement count.

#### Expected Results

| Criterion | Expected result | Actual result |
|---|---|---|
| Simulator response count | Two responses for the same command | [Enter] |
| Order command count | One command | [Enter] |
| Order status | `DISPENSED` | [Enter] |
| Inventory deduction count | Once | [Enter] |
| Customer-sale movement | One record | [Enter] |

**Assessment:** [PASS / FAIL / BLOCKED]

**Evidence:** `N2-duplicate.png`

The screenshot/logs should show two Simulator results but only one Backend inventory update and one customer-sale movement.

---

### 4.5. Fault Mode Test: Offline

**Test ID:** `N2-OFFLINE`
**Fault Mode:** `offline`

**Objective:** Verify that the Backend marks the machine `OFFLINE` after the Simulator stops sending heartbeats and rejects new Order requests for that device.

#### Step 1. Verify the Device Is ONLINE

After completing the previous mode, the device should still be receiving Simulator heartbeats. If the machine is `OFFLINE`, follow the recovery instructions in Section 5 and continue only after a heartbeat restores it to `ONLINE`.

#### Step 2. Switch the Simulator to Offline Mode

Stop the Simulator that is sending heartbeats by pressing `Ctrl+C` in Terminal 3. Then run:

**Terminal 3:**

After stopping the Simulator that is sending heartbeats, run this mode's command:

```bash
java -jar /c/1.UTH/nam3HK1/Java/LapTrinhJava/simulator/target/simulator.jar --device=ma-device-001 --fault=offline
```

This starts the Simulator in a mode that stops sending heartbeats. In this mode, the Simulator may remain connected to MQTT but does not send heartbeats.

#### Step 3. Wait for the Backend to Mark the Device OFFLINE

**Terminal 1:**

```bash
sleep 60
```

Wait 60 seconds to exceed the default 45-second heartbeat timeout and the expected 15-second watchdog interval.

Then query the machine status:

```bash
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT device_identity, connection_status, operating_status, last_seen_at
 FROM machines
 WHERE device_identity = 'ma-device-001';"
```

This query retrieves the connection status, operating status, and time of the last heartbeat.

**Expected result:** `connection_status` is `OFFLINE`.

If the machine is not `OFFLINE`, check the Backend logs and heartbeat/watchdog configuration. Do not proceed until the status is correct.

#### Step 4. Send an Order-Creation Request While the Machine Is OFFLINE

**Terminal 1:**

The following block records the Order and Payment counts before and after the request. Send the Order-creation request only after the device is `OFFLINE`.

```bash
ORDERS_BEFORE=$(docker exec scent-db psql -At -U scent -d scentstation -c \
"SELECT COUNT(*) FROM orders o JOIN machines m ON m.machine_id = o.machine_id
 WHERE m.device_identity = 'ma-device-001';") || exit 1

PAYMENTS_BEFORE=$(docker exec scent-db psql -At -U scent -d scentstation -c \
"SELECT COUNT(*) FROM payments p JOIN orders o ON o.order_id = p.order_id
 JOIN machines m ON m.machine_id = o.machine_id
 WHERE m.device_identity = 'ma-device-001';") || exit 1

HTTP_RESPONSE=$(curl -sS -w '\nHTTP_STATUS=%{http_code}' -X POST http://localhost:8080/api/kiosk/orders \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ma-device-001","slotNumber":1}')

printf '%s\n' "$HTTP_RESPONSE"
HTTP_STATUS=${HTTP_RESPONSE##*HTTP_STATUS=}

case "$HTTP_STATUS" in
  4*) ;;
  *) printf 'FAIL: expected HTTP 4xx, got %s\n' "$HTTP_STATUS" >&2; exit 1 ;;
esac

ORDERS_AFTER=$(docker exec scent-db psql -At -U scent -d scentstation -c \
"SELECT COUNT(*) FROM orders o JOIN machines m ON m.machine_id = o.machine_id
 WHERE m.device_identity = 'ma-device-001';") || exit 1

PAYMENTS_AFTER=$(docker exec scent-db psql -At -U scent -d scentstation -c \
"SELECT COUNT(*) FROM payments p JOIN orders o ON o.order_id = p.order_id
 JOIN machines m ON m.machine_id = o.machine_id
 WHERE m.device_identity = 'ma-device-001';") || exit 1

printf 'Orders before/after: %s / %s\nPayments before/after: %s / %s\n' \
  "$ORDERS_BEFORE" "$ORDERS_AFTER" "$PAYMENTS_BEFORE" "$PAYMENTS_AFTER"

test "$ORDERS_BEFORE" = "$ORDERS_AFTER" &&
test "$PAYMENTS_BEFORE" = "$PAYMENTS_AFTER" &&
echo "PASS: the offline order request created no order or payment."
```

Command summary:
- Records the current Order and Payment counts for the device.
- Sends an Order-creation request while the machine is `OFFLINE`.
- Checks that the HTTP response is a 4xx status.
- Counts the Orders and Payments again after the request.
- Compares the counts to verify that no records were created.

**Expected results:**
- The API rejects the request with HTTP 4xx.
- The Order count is unchanged.
- The Payment count is unchanged.
- The final line displays `PASS: the offline order request created no order or payment.`

#### Expected Results

| Criterion | Expected result | Actual result |
|---|---|---|
| Device status | `OFFLINE` | [Enter] |
| Order-creation request | Rejected | [Enter] |
| New Order | Not created | [Enter] |
| New Payment | Not created | [Enter] |

**Assessment:** [PASS / FAIL / BLOCKED]

**Evidence:** `N2-offline.png`

The screenshot/logs should show the machine status as `OFFLINE`, the rejected HTTP response, and unchanged Order/Payment counts.

---

## 5. Troubleshooting and Machine Recovery

Use the commands in this section only when a main-flow check fails. They are for troubleshooting and recovery; they do not replace the test steps or serve as evidence for a Fault Mode.

### 5.1. Check the Backend, Menu, and Database Status

**Terminal 1:**

```bash
curl -sS http://localhost:8080/api/kiosk/machines/ma-device-001/menu
docker exec scent-db psql -U scent -d scentstation -c \
"SELECT device_identity, connection_status, operating_status, last_seen_at
 FROM machines
 WHERE device_identity = 'ma-device-001';"
```

- `MACHINE_NOT_FOUND` response: verify that the correct local database is in use and that its seed data includes `ma-device-001`.
- `OFFLINE` status: use Step 5.2 to restore the machine with a real heartbeat.
- Machine is `ONLINE` but slot 1 is unavailable: check the slot, bottle, and inventory status; do not modify data directly to make the test appear to pass.

### 5.2. Restore the Machine to ONLINE

If the Simulator is running a fault mode, stop it by pressing `Ctrl+C` in Terminal 3. Then start normal mode:

```bash
java -jar /c/1.UTH/nam3HK1/Java/LapTrinhJava/simulator/target/simulator.jar --device=ma-device-001 --fault=none
```

Keep the Simulator running so it continues to send heartbeats. In Terminal 1, repeat the menu check from Step 5.1; resume testing only when the status is `ONLINE`.

Do not use `UPDATE machines SET connection_status = 'ONLINE'` to resolve an offline status. Direct database changes do not prove that the device is connected or that the Backend is receiving heartbeats; only a Simulator heartbeat verifies the actual connection.

### 5.3. Rerun a Fault Mode

If the Simulator repeatedly alternates between `connected and listening` and `connection lost`, multiple Simulator processes are likely using the same `deviceId`. These processes share an MQTT client ID, so the Broker disconnects the previous process when another process connects.

To resolve this, keep Terminals 1, 2, and 3 open. Press `Ctrl+C` in Terminal 3 and in any other terminal running a Simulator for `ma-device-001`. Then start only **one** Simulator in the correct mode in Terminal 3 and verify that `connected and listening` is not followed by repeated `connection lost` messages.

After restoring the machine, keep Terminal 1 open to retain `TOKEN` and the `create_and_pay_order` function. In Terminal 3, stop the running Simulator with `Ctrl+C`, then return to the relevant mode in Section 4 and run its command. Create a new Order and record separate evidence for each rerun; do not reuse the previous Order's results.

---

## 6. Test Results Summary

Update this table after completing the corresponding checks.

| No. | Fault Mode | Expected result | Actual result | Assessment |
|---:|---|---|---|---|
| 1 | Reject | Order `FAILED`, no inventory deduction, incident created | [Enter] | [PASS / FAIL / BLOCKED] |
| 2 | Interlock | Order `FAILED`, reason `DOOR_OPEN`, appropriate machine status/alert | [Enter] | [PASS / FAIL / BLOCKED] |
| 3 | Silent | Order `UNCERTAIN`, one command, no retry | [Enter] | [PASS / FAIL / BLOCKED] |
| 4 | Duplicate | Two responses but only one inventory/transaction update | [Enter] | [PASS / FAIL / BLOCKED] |
| 5 | Offline | Machine `OFFLINE`, rejects new Order/Payment | [Enter] | [PASS / FAIL / BLOCKED] |

## 7. Issues

| No. | Issue | Cause | Resolution | Owner | Status |
|---:|---|---|---|---|---|
| 1 | [Enter issue] | [Enter cause] | [Enter resolution] | [Enter] | [Open / Resolved] |

Record any case that cannot be verified because of missing configuration/data or pending work by another team member as `BLOCKED`, including the reason and owner.

## 8. Conclusion

After testing, summarize the results:

- Total test cases: 5.
- `PASS`: [Enter].
- `FAIL`: [Enter].
- `BLOCKED`: [Enter].

**Overall conclusion:**

[Enter a conclusion based on the actual results.]

Confirm N2 as complete only when:
1. All five Fault Modes meet their required criteria.
2. All required test evidence has been saved.
3. The `interlock` behavior has been confirmed with Long.
4. Issues have been resolved or have a clear conclusion in accordance with the task requirements.

## 9. Evidence Checklist

Evidence directory:

```text
docs/evidence/N2/
```

| No. | Filename | Required evidence |
|---:|---|---|
| 1 | `N2-reject.png` | `DEVICE_REJECTED` log, Order `FAILED`, no inventory deduction, and incident |
| 2 | `N2-interlock.png` | `DOOR_OPEN` log, Order `FAILED`, machine status, and alert |
| 3 | `N2-silent.png` | No dispense result, Order `UNCERTAIN`, one command |
| 4 | `N2-duplicate.png` | Two responses but only one inventory/customer-sale movement update |
| 5 | `N2-offline.png` | Machine `OFFLINE`, rejected Order request, no new Order/Payment |

> **Evidence screenshot requirements:** Screenshots should show the Simulator logs and corresponding Backend/Database results. Simulator logs alone are not sufficient to prove that the Backend handled the scenario correctly.
