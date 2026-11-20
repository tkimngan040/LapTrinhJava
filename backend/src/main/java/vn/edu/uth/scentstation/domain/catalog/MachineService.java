package vn.edu.uth.scentstation.domain.catalog;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.alert.AlertService;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Machine state as the device reports it (FR5.1 to FR5.4).
 *
 * <p>Heartbeats arrive every few seconds from every machine, so this class is deliberately cheap:
 * it writes a timestamp and only touches the status column when the status actually changes.
 */
@Service
public class MachineService {

    private static final Logger log = LoggerFactory.getLogger(MachineService.class);

    private final MachineRepository machineRepository;
    private final ScentStationProperties properties;
    private final Clock clock;
    private final AlertService alerts;
    private final ObjectMapper json;

    public MachineService(
            MachineRepository machineRepository,
            ScentStationProperties properties,
            Clock clock,
            AlertService alerts,
            ObjectMapper json) {
        this.machineRepository = machineRepository;
        this.properties = properties;
        this.clock = clock;
        this.alerts = alerts;
        this.json = json;
    }

    /** FR5.1: the machine is alive. */
    @Transactional
    public void recordHeartbeat(String deviceId) {
        Optional<Machine> found = machineRepository.lockByDeviceId(deviceId);
        if (found.isEmpty()) {
            // FR5.11: traffic from a machine that is not registered is refused
            // rather than silently creating one.
            log.warn("Heartbeat from an unregistered device: {}", deviceId);
            return;
        }

        Machine machine = found.get();
        machine.setLastSeenAt(clock.instant());
        if (machine.getConnectivityStatus() != ConnectivityStatus.ONLINE) {
            log.info("Machine {} is back ONLINE", deviceId);
            machine.setConnectivityStatus(ConnectivityStatus.ONLINE);
        }
        machineRepository.save(machine);
        alerts.reconcileMachineCondition(machine, "OFFLINE", false);
    }

    /** Derives current door/leak conditions; full sensor history remains separate. */
    @Transactional
    public void recordTelemetry(String deviceId, String payload) {
        log.debug("Telemetry from {}: {}", deviceId, payload);
        recordHeartbeat(deviceId);
        Machine machine = machineRepository.lockByDeviceId(deviceId).orElse(null);
        if (machine == null) return;
        try {
            var data = json.readTree(payload);
            if(data==null||!data.isObject()) throw ApiException.badRequest("INVALID_TELEMETRY","Telemetry must be a JSON object");
            for (String field : List.of("doorOpen", "leakDetected")) {
                if (!data.has(field)) continue;
                if (!data.get(field).isBoolean())
                    throw ApiException.badRequest(
                            "INVALID_TELEMETRY", "Safety flags must be JSON booleans");
                alerts.reconcileMachineCondition(
                        machine,
                        field.equals("doorOpen") ? "DOOR_OPEN" : "LEAK",
                        data.get(field).asBoolean());
            }
        } catch (java.io.IOException exception) {
            throw ApiException.badRequest("INVALID_TELEMETRY", "Invalid telemetry JSON");
        }
    }

    /** FR5.4: a discrete event such as a door opening or a sensor error. */
    @Transactional
    public void recordEvent(String deviceId, String type, String payload) {
        log.info("Event '{}' from {}: {}", type, deviceId, payload);
        recordHeartbeat(deviceId);
        Machine machine = machineRepository.lockByDeviceId(deviceId).orElse(null);
        if (machine == null || type == null) return;
        switch (type.toUpperCase(java.util.Locale.ROOT)) {
            case "DOOR_OPEN" -> alerts.reconcileMachineCondition(machine, "DOOR_OPEN", true);
            case "DOOR_CLOSED" -> alerts.reconcileMachineCondition(machine, "DOOR_OPEN", false);
            case "LEAK" -> alerts.reconcileMachineCondition(machine, "LEAK", true);
            case "LEAK_CLEARED" -> alerts.reconcileMachineCondition(machine, "LEAK", false);
            default -> {}
        }
    }

    /**
     * FR5.2 and BR9: a machine that has stopped reporting is marked OFFLINE, which is what makes
     * {@code acceptsOrders()} false and stops new orders being taken for a machine nobody can
     * reach.
     */
    @Transactional
    public int markSilentMachinesOffline() {
        Instant cutoff =
                clock.instant().minusSeconds(properties.getMqtt().getHeartbeatTimeoutSeconds());

        List<Long> machines = machineRepository.findConnectedIds(ConnectivityStatus.OFFLINE);

        int changed = 0;
        for (Long id : machines) {
            Machine machine = machineRepository.lockById(id).orElse(null);
            if (machine == null || machine.getConnectivityStatus() == ConnectivityStatus.OFFLINE)
                continue;
            Instant lastSeen = machine.getLastSeenAt();
            if (lastSeen == null || lastSeen.isBefore(cutoff)) {
                machine.setConnectivityStatus(ConnectivityStatus.OFFLINE);
                machineRepository.save(machine);
                alerts.reconcileMachineCondition(machine, "OFFLINE", true);
                changed++;
                log.warn(
                        "Machine {} marked OFFLINE: no heartbeat since {}",
                        machine.getDeviceId(),
                        lastSeen);
            }
        }
        return changed;
    }
}
