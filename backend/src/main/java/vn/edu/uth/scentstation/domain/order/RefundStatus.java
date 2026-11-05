package vn.edu.uth.scentstation.domain.order;

/**
 * Where a refund stands with the payment provider.
 *
 * <p>An order only becomes {@code REFUNDED} once its refund is
 * {@code COMPLETED}. A {@code PENDING} or {@code FAILED} refund keeps the order
 * in {@code FAILED}, so nothing is reported as repaid before the provider has
 * confirmed it (UC-16 exception E7).
 */
public enum RefundStatus {
    PENDING,
    COMPLETED,
    FAILED
}
