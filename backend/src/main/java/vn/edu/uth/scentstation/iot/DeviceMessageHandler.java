package vn.edu.uth.scentstation.iot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import vn.edu.uth.scentstation.domain.catalog.MachineService;
import vn.edu.uth.scentstation.domain.dispensing.DispenseService;

import java.io.IOException;

/**
 * Turns one inbound device message into one call on a business service.
 *
 * <p>It parses, it validates the shape, and it dispatches. It must not contain
 * business logic of its own: the same rules are reached from the web tier, and
 * Report section 2.8.2 allows each rule exactly one implementation.
 */
@Component
public class DeviceMessageHandler {

    private static final Logger log = LoggerFactory.getLogger(DeviceMessageHandler.class);

    private final DispenseService dispenseService;
    private final MachineService machineService;
    private final ObjectMapper objectMapper;

    public DeviceMessageHandler(DispenseService dispenseService,
                                MachineService machineService,
                                ObjectMapper objectMapper) {
        this.dispenseService = dispenseService;
        this.machineService = machineService;
        this.objectMapper = objectMapper;
    }

    public void handle(String deviceId, String leaf, String body) {
        JsonNode json;
        try {
            json = objectMapper.readTree(body);
        } catch (IOException ex) {
            log.warn("Unparseable {} message from {}: {}", leaf, deviceId, ex.getMessage());
            return;
        }

        switch (leaf) {
            case Topics.HEARTBEAT -> machineService.recordHeartbeat(deviceId);
            case Topics.TELEMETRY -> machineService.recordTelemetry(deviceId, body);
            case Topics.EVENT -> machineService.recordEvent(deviceId, text(json, "type"), body);
            case Topics.ACK -> handleAck(deviceId, json);
            case Topics.RESULT -> handleResult(deviceId, json);
            default -> log.warn("Ignoring an unknown message type '{}' from {}", leaf, deviceId);
        }
    }

    private void handleAck(String deviceId, JsonNode json) {
        String key = text(json, "idempotencyKey");
        if (key == null) {
            log.warn("Ack from {} carries no idempotency key", deviceId);
            return;
        }
        boolean accepted = json.path("accepted").asBoolean(false);
        dispenseService.applyAck(key, accepted, text(json, "reason"));
    }

    private void handleResult(String deviceId, JsonNode json) {
        String key = text(json, "idempotencyKey");
        if (key == null) {
            log.warn("Result from {} carries no idempotency key", deviceId);
            return;
        }
        boolean success = json.path("success").asBoolean(false);
        dispenseService.applyResult(key, success,
                text(json, "resultCode"), text(json, "reason"));
    }

    private String text(JsonNode json, String field) {
        JsonNode node = json.get(field);
        return node == null || node.isNull() ? null : node.asText();
    }
}
