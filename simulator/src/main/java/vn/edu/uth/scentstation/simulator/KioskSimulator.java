package vn.edu.uth.scentstation.simulator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * The kiosk, in software.
 *
 * <p>Report sections 1.5.3 and 2.8.1 define the device tier as a Java
 * simulator speaking the same MQTT contract hardware would. It is the device
 * tier, not a stand-in for one: the backend has no way of telling the
 * difference, which is exactly what makes the integration tests meaningful.
 *
 * <pre>
 *   java -jar simulator.jar --device=KIOSK-001
 *   java -jar simulator.jar --device=KIOSK-001 --fault=silent
 *   java -jar simulator.jar --device=KIOSK-001 --broker=tcp://localhost:1883 \
 *                           --secret=dev-command-signing-secret --slots=4 --volume=100
 * </pre>
 *
 * <p>{@code --secret} must match {@code scentstation.mqtt.command-secret} in
 * the backend, or every command is refused on its signature.
 */
public final class KioskSimulator implements MqttCallbackExtended {

    private static final int QOS = 1;
    private static final long HEARTBEAT_SECONDS = 10;

    private final String deviceId;
    private final String brokerUrl;
    private final FaultInjector fault;
    private final SafetyInterlock interlock;
    private final CommandVerifier verifier;
    private final CommandSigner signer;
    private final ObjectMapper mapper = new ObjectMapper();
    private final ScheduledExecutorService scheduler =
            Executors.newSingleThreadScheduledExecutor(runnable -> {
                Thread thread = new Thread(runnable, "kiosk-heartbeat");
                thread.setDaemon(true);
                return thread;
            });

    private MqttClient client;

    private KioskSimulator(String deviceId, String brokerUrl, String secret,
                           FaultInjector fault, int slots, int volumeMl) {
        this.deviceId = deviceId;
        this.brokerUrl = brokerUrl;
        this.fault = fault;
        this.signer = new CommandSigner(secret);
        this.interlock = new SafetyInterlock(slots, volumeMl);
        this.verifier = new CommandVerifier(deviceId, signer, interlock);
    }

    public static void main(String[] args) throws Exception {
        Map<String, String> options = parseArgs(args);

        String deviceId = options.getOrDefault("device", "KIOSK-001");
        String broker = options.getOrDefault("broker", "tcp://localhost:1883");
        String secret = options.getOrDefault("secret", "dev-command-signing-secret");
        int slots = Integer.parseInt(options.getOrDefault("slots", "4"));
        int volume = Integer.parseInt(options.getOrDefault("volume", "100"));

        FaultInjector fault;
        try {
            fault = FaultInjector.forName(options.get("fault"));
        } catch (IllegalArgumentException ex) {
            System.err.println(ex.getMessage());
            System.exit(2);
            return;
        }

        KioskSimulator simulator =
                new KioskSimulator(deviceId, broker, secret, fault, slots, volume);
        simulator.start();

        Runtime.getRuntime().addShutdownHook(new Thread(simulator::stop));
        Thread.currentThread().join();
    }

    private void start() throws MqttException {
        log("starting: broker=%s slots=%d fault=%s", brokerUrl, interlock.slotCount(), fault.name());

        client = new MqttClient(brokerUrl, "simulator-" + deviceId, new MemoryPersistence());
        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        options.setKeepAliveInterval(30);
        client.setCallback(this);
        client.connect(options);

        if (fault.sendHeartbeats()) {
            scheduler.scheduleAtFixedRate(this::publishHeartbeat,
                    0, HEARTBEAT_SECONDS, TimeUnit.SECONDS);
            scheduler.scheduleAtFixedRate(this::publishTelemetry,
                    5, HEARTBEAT_SECONDS * 3, TimeUnit.SECONDS);
        } else {
            log("fault mode 'offline': no heartbeat will be sent, "
                    + "so the backend should mark this machine OFFLINE (BR9)");
        }
    }

    @Override
    public void connectComplete(boolean reconnect, String serverUri) {
        try {
            client.subscribe(Topics.forDevice(deviceId, Topics.COMMAND), QOS);
            log("connected and listening on %s", Topics.forDevice(deviceId, Topics.COMMAND));
        } catch (MqttException ex) {
            log("could not subscribe: %s", ex.getMessage());
        }
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String body = new String(message.getPayload(), StandardCharsets.UTF_8);
        Map<String, Object> command;
        try {
            command = mapper.readValue(body, new TypeReference<LinkedHashMap<String, Object>>() {
            });
        } catch (Exception ex) {
            log("unparseable command ignored: %s", ex.getMessage());
            return;
        }

        String key = String.valueOf(command.get("idempotencyKey"));
        CommandVerifier.Verdict verdict =
                verifier.verify(command, Instant.now(), fault.forceDoorOpen());

        if (!verdict.accepted()) {
            log("command %s REFUSED: %s", key, verdict.reason());
            publishAck(key, false, verdict.reason());
            return;
        }

        if (!fault.acceptCommand()) {
            log("command %s refused by fault mode '%s'", key, fault.name());
            publishAck(key, false, fault.rejectionReason());
            return;
        }

        publishAck(key, true, null);

        int slotNumber = asInt(command.get("slotNumber"), 1);
        int doseMl = asInt(command.get("doseMl"), 1);
        int durationMs = asInt(command.get("sprayDurationMs"), 800);

        // The pump runs for the calibrated time. Sleeping here is what makes
        // the ack and the result separate moments rather than one event, which
        // is the whole reason they are separate topics.
        try {
            Thread.sleep(durationMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return;
        }

        interlock.consume(slotNumber, doseMl);
        log("sprayed %d ml from slot %d, %d ml left",
                doseMl, slotNumber, interlock.remainingMl(slotNumber));

        if (!fault.sendResult()) {
            log("fault mode 'silent': no result will be sent, "
                    + "so the backend should end at UNCERTAIN with no second command (BR14)");
            return;
        }

        for (int copy = 0; copy < fault.resultCopies(); copy++) {
            publishResult(key, true, "OK", null);
            if (copy > 0) {
                log("sent a duplicate result, which must not deduct stock twice (NFR3.4)");
            }
        }
    }

    private void publishAck(String idempotencyKey, boolean accepted, String reason) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("deviceId", deviceId);
        payload.put("idempotencyKey", idempotencyKey);
        payload.put("accepted", accepted);
        payload.put("reason", reason);
        payload.put("at", Instant.now().toString());
        publish(Topics.ACK, payload);
    }

    private void publishResult(String idempotencyKey, boolean success,
                               String resultCode, String reason) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("deviceId", deviceId);
        payload.put("idempotencyKey", idempotencyKey);
        payload.put("success", success);
        payload.put("resultCode", resultCode);
        payload.put("reason", reason);
        payload.put("at", Instant.now().toString());
        publish(Topics.RESULT, payload);
    }

    private void publishHeartbeat() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("deviceId", deviceId);
        payload.put("firmwareVersion", "sim-0.1.0");
        payload.put("at", Instant.now().toString());
        publish(Topics.HEARTBEAT, payload);
    }

    private void publishTelemetry() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("deviceId", deviceId);
        payload.put("doorOpen", interlock.isDoorOpen());
        payload.put("maintenanceMode", interlock.isMaintenanceMode());
        payload.put("criticalError", interlock.isCriticalError());
        for (int slot = 1; slot <= interlock.slotCount(); slot++) {
            payload.put("slot" + slot + "RemainingMl", interlock.remainingMl(slot));
        }
        payload.put("at", Instant.now().toString());
        publish(Topics.TELEMETRY, payload);
    }

    private void publish(String leaf, Map<String, Object> payload) {
        if (client == null || !client.isConnected()) {
            return;
        }
        String topic = Topics.forDevice(deviceId, leaf);
        try {
            MqttMessage message = new MqttMessage(mapper.writeValueAsBytes(payload));
            message.setQos(QOS);
            client.publish(topic, message);
        } catch (Exception ex) {
            log("could not publish to %s: %s", topic, ex.getMessage());
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log("connection lost: %s", cause.getMessage());
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Nothing to do.
    }

    private void stop() {
        scheduler.shutdownNow();
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
            }
        } catch (MqttException ignored) {
            // Shutting down anyway.
        }
    }

    private void log(String format, Object... args) {
        System.out.printf("[%s] [%s] %s%n",
                Instant.now(), deviceId, String.format(format, args));
    }

    private static int asInt(Object value, int fallback) {
        return value instanceof Number number ? number.intValue() : fallback;
    }

    /** Reads {@code --key=value} pairs; anything else is reported, not ignored. */
    private static Map<String, String> parseArgs(String[] args) {
        Map<String, String> options = new LinkedHashMap<>();
        for (String arg : args) {
            if (!arg.startsWith("--") || !arg.contains("=")) {
                System.err.println("Ignoring unrecognised argument: " + arg
                        + " (expected --key=value)");
                continue;
            }
            int equals = arg.indexOf('=');
            options.put(arg.substring(2, equals), arg.substring(equals + 1));
        }
        return options;
    }
}
