package vn.edu.uth.scentstation.domain.order;

/** Outcome the payment provider reported for one attempt. */
public enum PaymentStatus {
    SUCCEEDED,
    FAILED,
    REFUNDED
}
