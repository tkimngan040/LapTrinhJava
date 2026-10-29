package vn.edu.uth.scentstation.domain.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

/**
 * Where the payment provider reports what happened (Report section 2.9.3,
 * steps 4 and 5).
 *
 * <p>This endpoint is open to the network, so the signature is the only thing
 * that makes it trustworthy. Every field is checked before anything is
 * recorded (FR3.7), and only this path can mark an order paid (BR5).
 *
 * <p>It always answers 200, even for a duplicate or a payment it refuses to
 * apply. Providers retry on any other status, and retrying will not change the
 * outcome. The body says which of the two happened.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookController.class);

    private final PaymentService paymentService;
    private final CommandSigner webhookSigner;

    public PaymentWebhookController(PaymentService paymentService,
                                    ScentStationProperties properties) {
        this.paymentService = paymentService;
        // The provider and the backend share this secret. A real integration
        // would use the provider's own key; the shape of the check is the same.
        this.webhookSigner = new CommandSigner(properties.getPayment().getWebhookSecret());
    }

    public record WebhookRequest(
            @NotBlank String provider,
            @NotBlank String providerReference,
            @NotBlank String paymentRef,
            @Positive long amount,
            @NotBlank String currency,
            @NotBlank String status,
            @NotBlank String signature) {
    }

    public record WebhookResponse(boolean applied, String message) {
    }

    @PostMapping("/webhook")
    public ResponseEntity<WebhookResponse> receive(@Valid @RequestBody WebhookRequest request) {
        if (!webhookSigner.verify(asSignedMap(request))) {
            log.warn("Rejected a payment webhook for {} with a bad signature",
                    request.paymentRef());
            throw ApiException.badRequest("INVALID_SIGNATURE",
                    "The webhook signature does not match its contents");
        }

        if ("SUCCEEDED".equalsIgnoreCase(request.status())) {
            boolean applied = paymentService.recordSuccessfulPayment(
                    request.provider(), request.providerReference(),
                    request.paymentRef(), request.amount(), request.currency());
            return ResponseEntity.ok(new WebhookResponse(applied,
                    applied ? "Payment recorded" : "Already recorded, ignored"));
        }

        paymentService.recordFailedPayment(
                request.provider(), request.providerReference(), request.paymentRef());
        return ResponseEntity.ok(new WebhookResponse(false,
                "Failed attempt recorded; the order stays open"));
    }

    /**
     * The exact field set the provider signs. Keeping it in one method means
     * the sender and this check cannot drift apart.
     */
    static Map<String, Object> asSignedMap(WebhookRequest request) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("provider", request.provider());
        fields.put("providerReference", request.providerReference());
        fields.put("paymentRef", request.paymentRef());
        fields.put("amount", request.amount());
        fields.put("currency", request.currency());
        fields.put("status", request.status());
        fields.put("signature", request.signature());
        return fields;
    }
}
