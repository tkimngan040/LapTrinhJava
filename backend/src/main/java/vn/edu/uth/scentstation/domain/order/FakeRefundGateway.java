package vn.edu.uth.scentstation.domain.order;

import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Stands in for the provider's refund API in the demo: it confirms every
 * refund at once. Replace it with a real client by providing another
 * {@link RefundGateway} bean; nothing else needs to change.
 */
@Component
public class FakeRefundGateway implements RefundGateway {

    private static final Logger log = LoggerFactory.getLogger(FakeRefundGateway.class);

    @Override
    public RefundStatus submit(String refundReference, String provider,
                               String providerReference, BigDecimal amount) {
        log.info("{} confirmed refund {} of {} for payment {}",
                provider, refundReference, amount, providerReference);
        return RefundStatus.COMPLETED;
    }
}
