package vn.edu.uth.scentstation.domain.inventory;

/** Where a delivered batch stands (FR6.1, FR6.3). */
public enum BatchStatus {
    ACTIVE,
    DEPLETED,
    EXPIRED,
    QUARANTINED
}
