package vn.edu.uth.scentstation.domain.order;

/** Provider implementations must honour (refundReference, attempt) as an idempotency key. */
public interface RefundGateway {
    boolean supports(String provider);

    void submit(RefundRepository.Refund refund, String paymentReference);
}
