package vn.edu.uth.scentstation.domain.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.iot.CommandSigner;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Stands in for the payment provider during a demo: the kiosk's "I have
 * scanned the QR code" button calls this, and this signs a webhook and posts
 * it back to the backend exactly as a real provider would.
 *
 * <p>The detour matters. The kiosk could have called {@code PaymentService}
 * directly in one line, and the demo would look identical — but then BR5 would
 * be broken, because something the kiosk did would have marked an order paid.
 * Going the long way round keeps the design and the code saying the same
 * thing, and makes the answer short when the examiner asks how payment is
 * confirmed.
 *
 * <p>Switched off with {@code scentstation.payment.fake-provider-enabled=false}
 * so it cannot exist anywhere real.
 */
@RestController
@RequestMapping("/api/dev/payments")
@ConditionalOnProperty(name = "scentstation.payment.fake-provider-enabled",
        havingValue = "true", matchIfMissing = true)
public class FakePaymentProvider {

    private static final Logger log = LoggerFactory.getLogger(FakePaymentProvider.class);
    public static final String PROVIDER_NAME = "FAKEPAY";

    private final OrderRepository orderRepository;
    private final PaymentWebhookController webhookController;
    private final CommandSigner webhookSigner;

    public FakePaymentProvider(OrderRepository orderRepository,
                               PaymentWebhookController webhookController,
                               ScentStationProperties properties) {
        this.orderRepository = orderRepository;
        this.webhookController = webhookController;
        this.webhookSigner = new CommandSigner(properties.getPayment().getWebhookSecret());
    }

    public record SimulateRequest(@NotBlank String paymentRef, boolean succeed) {
    }

    /** Pretends the customer scanned the QR code and paid. */
    @PostMapping("/simulate")
    public ResponseEntity<PaymentWebhookController.WebhookResponse> simulate(
            @Valid @RequestBody SimulateRequest request) {
        return deliver(request, newProviderReference());
    }

    /**
     * Sends the same notification twice, with the same provider reference, so
     * test case IT-09 can show that a duplicate webhook results in exactly one
     * payment (NFR3.3).
     *
     * <p>The reference has to be generated once and reused. Calling
     * {@link #simulate} twice would mint two references, which is two distinct
     * payments rather than one delivered twice, and would prove nothing.
     */
    @PostMapping("/simulate-duplicate")
    public ResponseEntity<PaymentWebhookController.WebhookResponse> simulateDuplicate(
            @Valid @RequestBody SimulateRequest request) {
        String providerReference = newProviderReference();
        deliver(request, providerReference);
        return deliver(request, providerReference);
    }

    private ResponseEntity<PaymentWebhookController.WebhookResponse> deliver(
            SimulateRequest request, String providerReference) {

        Order order = orderRepository.findByPaymentRef(request.paymentRef())
                .orElseThrow(() -> ApiException.notFound("ORDER_NOT_FOUND",
                        "No order with payment reference " + request.paymentRef()));

        String status = request.succeed() ? "SUCCEEDED" : "FAILED";

        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("provider", PROVIDER_NAME);
        fields.put("providerReference", providerReference);
        fields.put("paymentRef", order.getPaymentRef());
        fields.put("amount", order.getPriceSnapshot());
        fields.put("currency", order.getCurrency());
        fields.put("status", status);
        String signature = webhookSigner.sign(fields);

        log.info("Simulated payment {} for order {}", status, order.getId());

        return webhookController.receive(new PaymentWebhookController.WebhookRequest(
                PROVIDER_NAME, providerReference, order.getPaymentRef(),
                order.getPriceSnapshot(), order.getCurrency(), status, signature));
    }

    private String newProviderReference() {
        return "FAKEPAY-"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }
}
