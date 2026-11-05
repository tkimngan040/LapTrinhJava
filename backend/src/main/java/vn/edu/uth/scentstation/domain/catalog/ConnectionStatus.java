package vn.edu.uth.scentstation.domain.catalog;

/**
 * Whether the backend can currently reach the machine, derived from the time
 * since its last heartbeat (FR5.2).
 *
 * <p>Independent of {@link OperatingStatus}: a machine can be ONLINE and under
 * maintenance at once, and either state alone stops new orders (BR9).
 */
public enum ConnectionStatus {
    ONLINE,
    UNSTABLE,
    OFFLINE
}
