package vn.edu.uth.scentstation.domain.inventory;

/** BR10: only DISPENSE reduces sale inventory; DIAGNOSTIC is recorded apart. */
public enum MovementType {
    INSTALL,
    REFILL,
    REMOVE,
    DISPENSE,
    DIAGNOSTIC,
    ADJUST,
    DISPOSE
}
