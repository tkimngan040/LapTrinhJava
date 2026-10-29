package vn.edu.uth.scentstation.domain.inventory;

/** State of one physical bottle (FR6.3). */
public enum BottleStatus {
    AVAILABLE,
    INSTALLED,
    NEARLY_EMPTY,
    EMPTY,
    DAMAGED,
    EXPIRED
}
