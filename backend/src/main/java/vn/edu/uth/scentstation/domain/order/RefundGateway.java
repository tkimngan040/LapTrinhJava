package vn.edu.uth.scentstation.domain.order;

import java.math.BigDecimal;

/**
 * The payment provider's refund API, as the backend sees it.
 *
 * <p>A real provider would be an HTTP client behind this interface; the demo
 * uses {@link FakeRefundGateway}. The {@code refundReference} is the
 * idempotency key: submitting the same reference twice must never refund the
 * customer twice, which is what lets the backend retry after a timeout.
 */
public interface RefundGateway {

    /**
     * Asks the provider to return {@code amount} for one payment.
     *
     * @return {@code COMPLETED} when the provider confirmed the refund,
     *         {@code FAILED} when it refused, {@code PENDING} when it has not
     *         answered yet. The caller must not treat anything but
     *         {@code COMPLETED} as money returned.
     */
    RefundStatus submit(String refundReference, String provider,
                        String providerReference, BigDecimal amount);
}
