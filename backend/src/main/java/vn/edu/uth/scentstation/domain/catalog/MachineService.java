package vn.edu.uth.scentstation.domain.catalog;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.config.ScentStationProperties;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Machine state as the device reports it (FR5.1 to FR5.4).
 *
 * <p>Heartbeats arrive every few seconds from every machine, so this class is
 * deliberately cheap: it writes a timestamp and only touches the status column
 * when the status actually changes.
 */
@Service
public class MachineService {

    private static final Logger log = LoggerFactory.getLogger(MachineService.class);

    private final MachineRepository machineRepository;
    private final ScentStationProperties properties;
    private final Clock clock;

    public MachineService(MachineRepository machineRepository,
                          ScentStationProperties properties,
                          Clock clock) {
        this.machineRepository = machineRepository;
        this.properties = properties;
        this.clock = clock;
    }

    /** FR5.1: the machine is alive. */
    @Transactional
    public void recordHeartbeat(String deviceId) {
        Optional<Machine> found = machineRepository.findByDeviceId(deviceId);
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
    }

    /**
     * FR5.3. Stored as the raw payload for now; the telemetry table and the
     * leak detection of FR6.10 are task A7.
     */
    @Transactional
    public void recordTelemetry(String deviceId, String payload) {
        log.debug("Telemetry from {}: {}", deviceId, payload);
        recordHeartbeat(deviceId);
    }

    /** FR5.4: a discrete event such as a door opening or a sensor error. */
    @Transactional
    public void recordEvent(String deviceId, String type, String payload) {
        log.info("Event '{}' from {}: {}", type, deviceId, payload);
        recordHeartbeat(deviceId);
    }

    /**
     * FR5.2 and BR9: a machine that has stopped reporting is marked OFFLINE,
     * which is what makes {@code acceptsOrders()} false and stops new orders
     * being taken for a machine nobody can reach.
     */
    @Transactional
    public int markSilentMachinesOffline() {
        Instant cutoff = clock.instant()
                .minusSeconds(properties.getMqtt().getHeartbeatTimeoutSeconds());

        List<Machine> machines =
                machineRepository.findByConnectivityStatusNot(ConnectivityStatus.OFFLINE);

        int changed = 0;
        for (Machine machine : machines) {
            Instant lastSeen = machine.getLastSeenAt();
            if (lastSeen == null || lastSeen.isBefore(cutoff)) {
                machine.setConnectivityStatus(ConnectivityStatus.OFFLINE);
                machineRepository.save(machine);
                changed++;
                log.warn("Machine {} marked OFFLINE: no heartbeat since {}",
                        machine.getDeviceId(), lastSeen);
            }
        }
        return changed;
    }
}
