package vn.edu.uth.scentstation.domain.catalog;

/**
 * Whether a slot can sell a spray right now.
 *
 * <p>Only {@link #AVAILABLE} may be ordered from (BR3). The other three are
 * reported to the kiosk rather than hidden, so the screen greys the slot out
 * instead of silently changing shape.
 */
public enum SlotStatus {

    /** Configured with a product and holding a bottle with stock. */
    AVAILABLE,

    /** No product configured, or no bottle installed. */
    EMPTY,

    /** Still sellable, but the bottle is below its low-stock threshold (FR6.7). */
    LOW,

    /** Taken out of service by a person or by a fault. */
    DISABLED
}
