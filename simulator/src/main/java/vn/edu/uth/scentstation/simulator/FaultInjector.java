package vn.edu.uth.scentstation.simulator;

/**
 * How the simulator is told to misbehave.
 *
 * <p>This interface is the seam between task L4 (Long, the working simulator)
 * and task N2 (Kim Ngan, the five fault modes). It is deliberately written
 * first and separately, so both tasks can be done at the same time instead of
 * one waiting for the other.
 *
 * <p>Each mode reproduces one row of the exception table in Report section
 * 2.9.4, and each gives one integration test case in section 3.6. This is also
 * the answer to "but you have no hardware": these failures are difficult and
 * sometimes dangerous to stage on a real machine, and trivial here.
 *
 * <table>
 *   <caption>The six modes and what the backend must do</caption>
 *   <tr><th>Mode</th><th>Simulator</th><th>Expected backend outcome</th></tr>
 *   <tr><td>none</td><td>works normally</td><td>order DISPENSED</td></tr>
 *   <tr><td>reject</td><td>refuses the command in its ack</td>
 *       <td>order FAILED, incident opened</td></tr>
 *   <tr><td>interlock</td><td>reports the door as open</td>
 *       <td>order FAILED, machine status updated, alert raised</td></tr>
 *   <tr><td>silent</td><td>accepts, never sends a result</td>
 *       <td>order UNCERTAIN, no second command</td></tr>
 *   <tr><td>duplicate</td><td>publishes its result twice</td>
 *       <td>stock deducted exactly once</td></tr>
 *   <tr><td>offline</td><td>stops sending heartbeats</td>
 *       <td>machine OFFLINE, new orders refused</td></tr>
 * </table>
 */
public interface FaultInjector {

    /** The name given on the command line, for logging. */
    String name();

    /** False stops the heartbeat, which eventually marks the machine OFFLINE (BR9). */
    default boolean sendHeartbeats() {
        return true;
    }

    /** False makes the simulator refuse the command in its acknowledgement. */
    default boolean acceptCommand() {
        return true;
    }

    /** The reason sent with a refusal, when {@link #acceptCommand()} is false. */
    default String rejectionReason() {
        return "Refused by the device";
    }

    /** True makes the safety interlock report the door as open (BR8). */
    default boolean forceDoorOpen() {
        return false;
    }

    /** False means no result is ever published, which should end in UNCERTAIN. */
    default boolean sendResult() {
        return true;
    }

    /** How many times the result is published. Two exercises NFR3.4. */
    default int resultCopies() {
        return 1;
    }

    /** The mode that changes nothing, used for a normal run. */
    static FaultInjector none() {
        return () -> "none";
    }

    /**
     * Resolves a {@code --fault=} value.
     *
     * <p>Kim Ngan (N2) adds the five remaining modes here. Each one is a small
     * anonymous implementation overriding one default above; no other file in
     * the simulator needs to change.
     */
    static FaultInjector forName(String name) {
        if (name == null || name.isBlank() || "none".equalsIgnoreCase(name)) {
            return none();
        }
        throw new IllegalArgumentException(
                "Unknown fault mode '" + name + "'. Expected one of: "
                        + "none, reject, interlock, silent, duplicate, offline. "
                        + "Only 'none' is implemented so far; the rest are task N2.");
    }
}
