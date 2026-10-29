package vn.edu.uth.scentstation.iot;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.edu.uth.scentstation.domain.catalog.MachineService;
import vn.edu.uth.scentstation.domain.dispensing.DispenseService;

/**
 * The two periodic checks the device link needs.
 *
 * <p>Both exist because silence is itself information: a machine that stops
 * speaking is offline (FR5.2, BR9), and a command that is never answered
 * leaves an order nobody can account for (BR14, NFR4.5). Neither condition
 * announces itself, so something has to look.
 */
@Component
public class DeviceWatchdog {

    private final MachineService machineService;
    private final DispenseService dispenseService;

    public DeviceWatchdog(MachineService machineService, DispenseService dispenseService) {
        this.machineService = machineService;
        this.dispenseService = dispenseService;
    }

    /** FR5.2: machines that have gone quiet become OFFLINE. */
    @Scheduled(fixedDelayString = "PT15S")
    public void markSilentMachinesOffline() {
        machineService.markSilentMachinesOffline();
    }

    /**
     * BR14: commands with no result become TIMED_OUT and their orders
     * UNCERTAIN. No second command is ever issued here.
     */
    @Scheduled(fixedDelayString = "PT10S")
    public void timeOutStaleCommands() {
        dispenseService.timeOutStaleCommands();
    }
}
