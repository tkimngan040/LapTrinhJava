package vn.edu.uth.scentstation.iot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import vn.edu.uth.scentstation.domain.catalog.MachineService;
import vn.edu.uth.scentstation.domain.dispensing.DispenseService;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * IT-01 through IT-06: PostgreSQL-backed dispensing flows over a real
 * Mosquitto broker. The test device speaks the simulator's MQTT message
 * contract and drives each deterministic fault response.
 *
 * Manual run from Git Bash (including IntelliJ Terminal), starting at the repository root:
 *   docker compose up -d db mqtt
 *   docker compose exec db pg_isready -U scent -d scentstation
 *   cd backend
 *   mvn "-Dit.test=MqttDispensingIT" verify
 *
 * The test starts the Spring application in-process; do not run the backend
 * separately (or leave another backend/simulator connected to this broker).
 * It uses the local Compose database and changes its seeded machine/bottle
 * state while creating test orders, so do not point it at production data.
 */
@SpringBootTest(properties = {
        "scentstation.mqtt.heartbeat-timeout-seconds=1",
        "scentstation.dispensing.result-timeout-seconds=60"
})
@AutoConfigureMockMvc
class MqttDispensingIT {

    private static final String DEVICE_ID = "ma-device-001";
    private static final String BRAND_ADMIN = "admin@maisonaroma.local";
    private static final String ADMIN_PASSWORD = "Admin@12345";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private MachineService machineService;
    @Autowired
    private DispenseService dispenseService;
    @Autowired
    private ObjectMapper objectMapper;
    @Value("${scentstation.mqtt.broker-url}")
    private String mqttBrokerUrl;

    @BeforeEach
    void resetSeedMachineAndBottle() {
        jdbcTemplate.update("""
                UPDATE machines
                SET connection_status = 'ONLINE',
                    operating_status = 'ACTIVE',
                    last_seen_at = TIMESTAMPTZ '2000-01-01 00:00:00+00'
                WHERE device_identity = ?
                """, DEVICE_ID);
        jdbcTemplate.update("""
                UPDATE inventory_bottles
                SET remaining_quantity = 90.000, status = 'INSTALLED'
                WHERE slot_id = (
                    SELECT s.slot_id FROM machine_slots s
                    JOIN machines m ON m.machine_id = s.machine_id
                    WHERE m.device_identity = ? AND s.slot_number = 1
                )
                """, DEVICE_ID);
        jdbcTemplate.update("""
                UPDATE machine_slots SET status = 'AVAILABLE'
                WHERE machine_id = (SELECT machine_id FROM machines WHERE device_identity = ?)
                  AND slot_number = 1
                """, DEVICE_ID);
    }

    @Test
    @DisplayName("IT-01 — successful payment and device result dispense once and deduct one dose")
    void successfulPaymentAndDeviceResultCompleteTheOrder() throws Exception {
        try (TestDevice device = connectDevice(Fault.NORMAL)) {
            CreatedOrder order = createPaidOrder();
            device.awaitAcknowledgement();
            device.awaitResults(1);

            await().atMost(Duration.ofSeconds(10))
                    .untilAsserted(() -> assertThat(orderStatus(order.orderId())).isEqualTo("DISPENSED"));

            Long commandId = commandId(order.paymentRef());
            assertThat(count("""
                    SELECT COUNT(*) FROM payments p JOIN orders o ON o.order_id = p.order_id
                    WHERE o.payment_ref = ? AND p.status = 'SUCCEEDED'
                    """, order.paymentRef())).isEqualTo(1);
            assertThat(commandStatus(order.paymentRef())).isEqualTo("SUCCEEDED");
            assertThat(count("SELECT COUNT(*) FROM inventory_movements WHERE command_id = ? "
                    + "AND movement_type = 'DISPENSE'", commandId)).isEqualTo(1);
            assertThat(movementQuantity(commandId)).isEqualByComparingTo("-1.000");
            assertThat(remainingVolume()).isEqualByComparingTo("89.000");
        }
    }

    @Test
    @DisplayName("IT-02 — device rejection fails the order, preserves stock and opens an incident")
    void rejectedCommandCreatesIncidentWithoutDeductingStock() throws Exception {
        try (TestDevice device = connectDevice(Fault.REJECT)) {
            CreatedOrder order = createPaidOrder();
            device.awaitAcknowledgement();

            await().atMost(Duration.ofSeconds(10))
                    .untilAsserted(() -> assertThat(orderStatus(order.orderId())).isEqualTo("FAILED"));

            assertThat(commandStatus(order.paymentRef())).isEqualTo("REJECTED");
            assertThat(orderFailureReason(order.orderId())).isEqualTo("DEVICE_REJECTED");
            assertThat(dispenseMovementCount(order.paymentRef())).isZero();
            assertThat(count("SELECT COUNT(*) FROM incidents WHERE order_id = ?", order.orderId()))
                    .as("a rejected spray must leave a durable incident for operational review")
                    .isGreaterThan(0);
            assertThat(remainingVolume()).isEqualByComparingTo("90.000");
        }
    }

    @Test
    @DisplayName("IT-03 — door interlock rejects the spray and updates machine status with an alert")
    void openDoorInterlockUpdatesMachineAndRaisesAlert() throws Exception {
        try (TestDevice device = connectDevice(Fault.INTERLOCK)) {
            CreatedOrder order = createPaidOrder();
            device.awaitAcknowledgement();

            await().atMost(Duration.ofSeconds(10))
                    .untilAsserted(() -> assertThat(orderStatus(order.orderId())).isEqualTo("FAILED"));

            assertThat(commandStatus(order.paymentRef())).isEqualTo("REJECTED");
            assertThat(orderFailureReason(order.orderId())).isEqualTo("DOOR_OPEN");
            assertThat(dispenseMovementCount(order.paymentRef())).isZero();
            assertThat(machineOperatingStatus()).isNotEqualTo("ACTIVE");
            assertThat(count("""
                    SELECT COUNT(*) FROM alerts a
                    JOIN machines m ON m.machine_id = a.machine_id
                    WHERE m.device_identity = ?
                      AND a.created_at >= (
                          SELECT created_at FROM orders WHERE order_id = ?
                      )
                    """, DEVICE_ID, order.orderId()))
                    .as("an interlock event must create a durable alert linked to the order incident")
                    .isGreaterThan(0);
            assertThat(remainingVolume()).isEqualByComparingTo("90.000");
        }
    }

    @Test
    @DisplayName("IT-04 — silent device times out to UNCERTAIN without retry and creates review incident")
    void silentDeviceTimesOutWithoutIssuingAnotherCommand() throws Exception {
        try (TestDevice device = connectDevice(Fault.SILENT)) {
            CreatedOrder order = createPaidOrder();
            device.awaitAcknowledgement();
            jdbcTemplate.update("""
                    UPDATE dispense_commands SET created_at = NOW() - INTERVAL '5 minutes'
                    WHERE order_id = (SELECT order_id FROM orders WHERE payment_ref = ?)
                    """, order.paymentRef());

            assertThat(dispenseService.timeOutStaleCommands()).isGreaterThanOrEqualTo(1);

            assertThat(orderStatus(order.orderId())).isEqualTo("UNCERTAIN");
            assertThat(commandStatus(order.paymentRef())).isEqualTo("TIMED_OUT");
            assertThat(count("""
                    SELECT COUNT(*) FROM dispense_commands dc
                    JOIN orders o ON o.order_id = dc.order_id WHERE o.payment_ref = ?
                    """, order.paymentRef())).isEqualTo(1);
            assertThat(count("SELECT COUNT(*) FROM incidents WHERE order_id = ?", order.orderId()))
                    .as("a timed-out order must be routed to durable human review")
                    .isGreaterThan(0);
            assertThat(dispenseMovementCount(order.paymentRef())).isZero();
            assertThat(device.commandCount()).isEqualTo(1);
        }
    }

    @Test
    @DisplayName("IT-05 — duplicate device results create one sale movement and one dose deduction")
    void duplicateSuccessfulResultIsIdempotent() throws Exception {
        try (TestDevice device = connectDevice(Fault.DUPLICATE)) {
            CreatedOrder order = createPaidOrder();
            device.awaitAcknowledgement();
            device.awaitResults(2);

            await().atMost(Duration.ofSeconds(10))
                    .untilAsserted(() -> assertThat(orderStatus(order.orderId())).isEqualTo("DISPENSED"));

            Long commandId = commandId(order.paymentRef());
            assertThat(commandStatus(order.paymentRef())).isEqualTo("SUCCEEDED");
            assertThat(count("SELECT COUNT(*) FROM inventory_movements WHERE command_id = ? "
                    + "AND movement_type = 'DISPENSE'", commandId)).isEqualTo(1);
            assertThat(movementQuantity(commandId)).isEqualByComparingTo("-1.000");
            assertThat(remainingVolume()).isEqualByComparingTo("89.000");
        }
    }

    @Test
    @DisplayName("IT-06 — stopped heartbeats mark the machine offline and block kiosk orders")
    void offlineMachineCannotReceiveANewOrder() throws Exception {
        long ordersBefore = countOrdersForDevice(DEVICE_ID);
        long paymentsBefore = countPaymentsForDevice(DEVICE_ID);
        jdbcTemplate.update("""
                UPDATE machines SET last_seen_at = NOW() - INTERVAL '5 seconds'
                WHERE device_identity = ?
                """, DEVICE_ID);

        assertThat(machineService.markSilentMachinesOffline()).isGreaterThan(0);

        mockMvc.perform(post("/api/kiosk/orders")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                Map.of("deviceId", DEVICE_ID, "slotNumber", 1))))
                .andExpect(status().isConflict());

        assertThat(machineConnectionStatus()).isEqualTo("OFFLINE");
        assertThat(countOrdersForDevice(DEVICE_ID)).isEqualTo(ordersBefore);
        assertThat(countPaymentsForDevice(DEVICE_ID)).isEqualTo(paymentsBefore);
    }

    @Test
    @DisplayName("UT-17 — late successful result is retained as durable review evidence")
    void lateSuccessIsPersistedWithoutResolvingUncertainOrChangingInventory() throws Exception {
        try (TestDevice device = connectDevice(Fault.SILENT)) {
            CreatedOrder order = createPaidOrder();
            device.awaitAcknowledgement();
            jdbcTemplate.update("""
                    UPDATE dispense_commands SET created_at = NOW() - INTERVAL '5 minutes'
                    WHERE order_id = (SELECT order_id FROM orders WHERE payment_ref = ?)
                    """, order.paymentRef());
            assertThat(dispenseService.timeOutStaleCommands()).isGreaterThanOrEqualTo(1);
            Long commandId = commandId(order.paymentRef());
            String idempotencyKey = jdbcTemplate.queryForObject(
                    "SELECT idempotency_key FROM dispense_commands WHERE command_id = ?",
                    String.class, commandId);

            device.publishLateSuccess(idempotencyKey);

            await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                    assertThat(count("""
                            SELECT COUNT(*) FROM device_events
                            WHERE event_type = 'LATE_RESULT'
                              AND event_reference = ?
                              AND event_data ->> 'success' = 'true'
                              AND received_at IS NOT NULL
                            """, idempotencyKey))
                            .as("late result evidence must be durably correlated for human review")
                            .isEqualTo(1));
            assertThat(orderStatus(order.orderId())).isEqualTo("UNCERTAIN");
            assertThat(commandStatus(order.paymentRef())).isEqualTo("TIMED_OUT");
            assertThat(dispenseMovementCount(order.paymentRef())).isZero();
            assertThat(device.commandCount()).isEqualTo(1);
        }
    }

    private TestDevice connectDevice(Fault fault) throws Exception {
        TestDevice device = new TestDevice(fault, mqttBrokerUrl);
        device.connect();
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(jdbcTemplate.queryForObject("""
                        SELECT last_seen_at > TIMESTAMPTZ '2000-01-01 00:00:00+00'
                        FROM machines WHERE device_identity = ?
                        """, Boolean.class, DEVICE_ID)).isTrue());
        return device;
    }

    private CreatedOrder createPaidOrder() throws Exception {
        String token = login(BRAND_ADMIN, ADMIN_PASSWORD);
        MvcResult orderResponse = mockMvc.perform(post("/api/kiosk/orders")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                Map.of("deviceId", DEVICE_ID, "slotNumber", 1))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode order = objectMapper.readTree(orderResponse.getResponse().getContentAsByteArray());
        String paymentRef = order.path("qrContent").asText()
                .substring(order.path("qrContent").asText().lastIndexOf('/') + 1);

        mockMvc.perform(post("/api/dev/payments/simulate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                Map.of("paymentRef", paymentRef, "succeed", true))))
                .andExpect(status().isOk());
        return new CreatedOrder(order.path("orderId").asLong(), paymentRef);
    }

    private String login(String username, String password) throws Exception {
        MvcResult response = mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(response.getResponse().getContentAsByteArray())
                .path("token").asText();
    }

    private String orderStatus(Long orderId) {
        return jdbcTemplate.queryForObject(
                "SELECT status FROM orders WHERE order_id = ?", String.class, orderId);
    }

    private String orderFailureReason(Long orderId) {
        return jdbcTemplate.queryForObject(
                "SELECT failure_reason FROM orders WHERE order_id = ?", String.class, orderId);
    }

    private String commandStatus(String paymentRef) {
        return jdbcTemplate.queryForObject("""
                SELECT dc.status FROM dispense_commands dc
                JOIN orders o ON o.order_id = dc.order_id WHERE o.payment_ref = ?
                """, String.class, paymentRef);
    }

    private Long commandId(String paymentRef) {
        return jdbcTemplate.queryForObject("""
                SELECT dc.command_id FROM dispense_commands dc
                JOIN orders o ON o.order_id = dc.order_id WHERE o.payment_ref = ?
                """, Long.class, paymentRef);
    }

    private long dispenseMovementCount(String paymentRef) {
        return count("""
                SELECT COUNT(*) FROM inventory_movements im
                JOIN dispense_commands dc ON dc.command_id = im.command_id
                JOIN orders o ON o.order_id = dc.order_id
                WHERE o.payment_ref = ? AND im.movement_type = 'DISPENSE'
                """, paymentRef);
    }

    private java.math.BigDecimal movementQuantity(Long commandId) {
        return jdbcTemplate.queryForObject(
                "SELECT quantity FROM inventory_movements WHERE command_id = ? "
                        + "AND movement_type = 'DISPENSE'",
                java.math.BigDecimal.class, commandId);
    }

    private java.math.BigDecimal remainingVolume() {
        return jdbcTemplate.queryForObject("""
                SELECT ib.remaining_quantity FROM inventory_bottles ib
                JOIN machine_slots s ON s.slot_id = ib.slot_id
                JOIN machines m ON m.machine_id = s.machine_id
                WHERE m.device_identity = ? AND s.slot_number = 1
                """, java.math.BigDecimal.class, DEVICE_ID);
    }

    private String machineConnectionStatus() {
        return jdbcTemplate.queryForObject(
                "SELECT connection_status FROM machines WHERE device_identity = ?",
                String.class, DEVICE_ID);
    }

    private String machineOperatingStatus() {
        return jdbcTemplate.queryForObject(
                "SELECT operating_status FROM machines WHERE device_identity = ?",
                String.class, DEVICE_ID);
    }

    private long countOrdersForDevice(String deviceId) {
        return count("""
                SELECT COUNT(*) FROM orders o
                JOIN machines m ON m.machine_id = o.machine_id
                WHERE m.device_identity = ?
                """, deviceId);
    }

    private long countPaymentsForDevice(String deviceId) {
        return count("""
                SELECT COUNT(*) FROM payments p
                JOIN orders o ON o.order_id = p.order_id
                JOIN machines m ON m.machine_id = o.machine_id
                WHERE m.device_identity = ?
                """, deviceId);
    }

    private long count(String sql, Object parameter) {
        return jdbcTemplate.queryForObject(sql, Long.class, parameter);
    }

    private long count(String sql, Object first, Object second) {
        return jdbcTemplate.queryForObject(sql, Long.class, first, second);
    }

    private record CreatedOrder(Long orderId, String paymentRef) {
    }

    private enum Fault {
        NORMAL,
        REJECT,
        INTERLOCK,
        SILENT,
        DUPLICATE
    }

    private static final class TestDevice implements AutoCloseable {

        private final Fault fault;
        private final MqttClient client;
        private final CountDownLatch acknowledgement = new CountDownLatch(1);
        private final CountDownLatch resultLatch;
        private final int expectedResults;
        private final AtomicInteger commandCount = new AtomicInteger();

        private TestDevice(Fault fault, String brokerUrl) throws Exception {
            this.fault = fault;
            this.expectedResults = fault == Fault.DUPLICATE ? 2 : 1;
            this.resultLatch = new CountDownLatch(expectedResults);
            this.client = new MqttClient(
                    brokerUrl,
                    "test-device-" + UUID.randomUUID(),
                    new org.eclipse.paho.client.mqttv3.persist.MemoryPersistence());
        }

        private void connect() throws Exception {
            client.setCallback(new MqttCallbackExtended() {
                @Override
                public void connectComplete(boolean reconnect, String serverURI) {
                }

                @Override
                public void connectionLost(Throwable cause) {
                }

                @Override
                public void messageArrived(String topic, MqttMessage message) throws Exception {
                    commandCount.incrementAndGet();
                    JsonNode command = MAPPER.readTree(message.getPayload());
                    String key = command.path("idempotencyKey").asText();
                    // Let the payment transaction commit before the device replies.
                    Thread.sleep(100);
                    if (fault == Fault.INTERLOCK) {
                        publish(Topics.TELEMETRY, Map.of(
                                "deviceId", DEVICE_ID,
                                "doorOpen", true,
                                "at", Instant.now().toString()));
                    }
                    boolean accepted = fault != Fault.REJECT && fault != Fault.INTERLOCK;
                    String reason = fault == Fault.REJECT
                            ? "DEVICE_REJECTED"
                            : fault == Fault.INTERLOCK ? "DOOR_OPEN" : null;
                    publish(Topics.ACK, Map.of(
                            "deviceId", DEVICE_ID,
                            "idempotencyKey", key,
                            "accepted", accepted,
                            "reason", reason == null ? "" : reason,
                            "at", Instant.now().toString()));
                    acknowledgement.countDown();
                    if (!accepted || fault == Fault.SILENT) {
                        return;
                    }
                    int copies = fault == Fault.DUPLICATE ? 2 : 1;
                    for (int i = 0; i < copies; i++) {
                        publishResult(key);
                    }
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                }
            });
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            client.connect(options);
            client.subscribe(Topics.forDevice(DEVICE_ID, Topics.COMMAND), 1);
            publish(Topics.HEARTBEAT, Map.of(
                    "deviceId", DEVICE_ID,
                    "firmwareVersion", "test-device",
                    "at", Instant.now().toString()));
        }

        private void awaitAcknowledgement() throws InterruptedException {
            assertThat(acknowledgement.await(10, TimeUnit.SECONDS))
                    .as("device receives command and acknowledges it")
                    .isTrue();
        }

        private void awaitResults(int count) throws InterruptedException {
            assertThat(count).isEqualTo(expectedResults);
            assertThat(resultLatch.await(10, TimeUnit.SECONDS))
                    .as("device result message(s) arrive")
                    .isTrue();
            assertThat(resultLatch.getCount()).isZero();
        }

        private int commandCount() {
            return commandCount.get();
        }

        private void publishLateSuccess(String key) throws Exception {
            publishResult(key);
        }

        private void publishResult(String key) throws Exception {
            publish(Topics.RESULT, Map.of(
                    "deviceId", DEVICE_ID,
                    "idempotencyKey", key,
                    "success", true,
                    "resultCode", "OK",
                    "reason", "",
                    "at", Instant.now().toString()));
            if (fault != Fault.SILENT) {
                resultLatch.countDown();
            }
        }

        private void publish(String leaf, Map<String, Object> payload) throws Exception {
            byte[] body = MAPPER.writeValueAsBytes(payload);
            client.publish(Topics.forDevice(DEVICE_ID, leaf), body, 1, false);
        }

        @Override
        public void close() throws Exception {
            if (client.isConnected()) {
                client.disconnect();
            }
            client.close();
        }
    }
}
