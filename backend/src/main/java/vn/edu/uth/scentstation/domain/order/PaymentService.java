package vn.edu.uth.scentstation.domain.order;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.dispensing.DispenseService;

import java.time.Clock;

/**
 * Accepts payment notifications from the provider and, when one is genuine,
 * moves the order to PAID and starts the dispense (Report section 2.9.3,
 * steps 4 to 6).
 *
 * <p>This class is the whole of BR5: it is the only path to PAID, and it is
 * reached only from the webhook endpoint after the signature has been checked.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final DispenseService dispenseService;
    private final Clock clock;

    public PaymentService(OrderRepository orderRepository,
                          PaymentRepository paymentRepository,
                          OrderService orderService,
                          DispenseService dispenseService,
                          Clock clock) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.orderService = orderService;
        this.dispenseService = dispenseService;
        this.clock = clock;
    }

    /**
     * Records a successful payment and issues the dispensing command.
     *
     * <p>A provider may deliver the same notification twice (NFR3.3). The
     * second one is absorbed here: either this method sees the payment already
     * recorded, or two concurrent deliveries race and the unique index
     * {@code uq_payment_provider_ref} rejects the loser. Both paths end in one
     * payment, one order, one command.
     *
     * @return true when this call was the one that recorded the payment
     */
    @Transactional
    public boolean recordSuccessfulPayment(String provider,
                                           String providerReference,
                                           String paymentRef,
                                           long amount,
                                           String currency) {
        if (paymentRepository.existsByProviderAndProviderReference(provider, providerReference)) {
            log.info("Duplicate webhook for {} {} ignored", provider, providerReference);
            return false;
        }

        Order order = orderRepository.findByPaymentRef(paymentRef)
                .orElseThrow(() -> ApiException.notFound("ORDER_NOT_FOUND",
                        "No order with payment reference " + paymentRef));

        // FR3.7: the amount and currency must match what the order was created
        // with, so a tampered notification cannot pay a cheap order for an
        // expensive spray.
        if (amount != order.getPriceSnapshot()) {
            throw ApiException.badRequest("AMOUNT_MISMATCH",
                    "Paid amount does not match the order");
        }
        if (!order.getCurrency().equalsIgnoreCase(currency)) {
            throw ApiException.badRequest("CURRENCY_MISMATCH",
                    "Paid currency does not match the order");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider(provider);
        payment.setProviderReference(providerReference);
        payment.setAmount(amount);
        payment.setCurrency(order.getCurrency());
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setPaidAt(clock.instant());

        try {
            paymentRepository.save(payment);
            paymentRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            // Two deliveries arrived at once; the other one won.
            log.info("Concurrent duplicate webhook for {} {} absorbed by the unique index",
                    provider, providerReference);
            return false;
        }

        orderService.confirmPayment(order);
        log.info("Order {} paid, {} {}", order.getId(), amount, order.getCurrency());

        // Step 6: a paid order immediately gets exactly one signed command.
        dispenseService.issueCommand(order);
        return true;
    }

    /**
     * Records a failed attempt. The order stays PENDING so the customer can try
     * again until it expires (Report section 2.9.2).
     */
    @Transactional
    public void recordFailedPayment(String provider, String providerReference, String paymentRef) {
        Order order = orderRepository.findByPaymentRef(paymentRef)
                .orElseThrow(() -> ApiException.notFound("ORDER_NOT_FOUND",
                        "No order with payment reference " + paymentRef));

        if (paymentRepository.existsByProviderAndProviderReference(provider, providerReference)) {
            return;
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setProvider(provider);
        payment.setProviderReference(providerReference);
        payment.setAmount(order.getPriceSnapshot());
        payment.setCurrency(order.getCurrency());
        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        log.info("Payment attempt failed for order {}; it stays PENDING", order.getId());
    }
}
