package vn.edu.uth.scentstation.simulator;

/**
 * The physical conditions a real kiosk checks before it drives the pump
 * (BR8, FR4.7).
 *
 * <p>On hardware these are sensor readings. Here they are fields, which is the
 * point: a test can put the machine into "door open" or "slot empty" in one
 * line, where staging the same thing on a real machine means opening a cabinet
 * at the right moment.
 *
 * <p>The checks run on the device, not on the backend. A machine that is
 * unsafe must refuse even a perfectly valid, correctly signed command — the
 * backend cannot see the door.
 */
public class SafetyInterlock {

    private boolean doorOpen;
    private boolean maintenanceMode;
    private boolean criticalError;
    private final int[] remainingMl;

    /**
     * @param slots      how many slots this machine has (at least four, FR2.3)
     * @param initialMl  starting volume in every slot
     */
    public SafetyInterlock(int slots, int initialMl) {
        this.remainingMl = new int[slots];
        java.util.Arrays.fill(this.remainingMl, initialMl);
    }

    /**
     * Why this machine may not spray from {@code slotNumber} right now, or null
     * when it may.
     *
     * <p>Returning the reason rather than a boolean matters: it is what the
     * refusal carries back to the backend, and what ends up in the order's
     * failure reason and in the report's test table.
     */
    public String blockingReason(int slotNumber, int doseMl) {
        if (doorOpen) {
            return "DOOR_OPEN";
        }
        if (maintenanceMode) {
            return "MAINTENANCE_MODE";
        }
        if (criticalError) {
            return "CRITICAL_ERROR";
        }
        if (slotNumber < 1 || slotNumber > remainingMl.length) {
            return "UNKNOWN_SLOT";
        }
        if (remainingMl[slotNumber - 1] < doseMl) {
            return "SLOT_EMPTY";
        }
        return null;
    }

    /** Consumes one dose. Called only after an actual spray. */
    public void consume(int slotNumber, int doseMl) {
        if (slotNumber >= 1 && slotNumber <= remainingMl.length) {
            remainingMl[slotNumber - 1] = Math.max(0, remainingMl[slotNumber - 1] - doseMl);
        }
    }

    public int remainingMl(int slotNumber) {
        return slotNumber >= 1 && slotNumber <= remainingMl.length
                ? remainingMl[slotNumber - 1] : 0;
    }

    public int slotCount() {
        return remainingMl.length;
    }

    public void setDoorOpen(boolean doorOpen) {
        this.doorOpen = doorOpen;
    }

    public boolean isDoorOpen() {
        return doorOpen;
    }

    public void setMaintenanceMode(boolean maintenanceMode) {
        this.maintenanceMode = maintenanceMode;
    }

    public boolean isMaintenanceMode() {
        return maintenanceMode;
    }

    public void setCriticalError(boolean criticalError) {
        this.criticalError = criticalError;
    }

    public boolean isCriticalError() {
        return criticalError;
    }
}
