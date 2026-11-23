package vn.edu.uth.scentstation.domain.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.iot.CommandSigner;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/refunds")
public class RefundWebhookController {
    public record Outcome(
            @NotBlank @Size(max = 80) String refundReference,
            @NotBlank @Size(max = 40) String provider,
            @NotBlank @Size(max = 120) String providerReference,
            @Positive int attempt,
            @Positive long amount,
            @NotBlank @Size(min = 3, max = 3) String currency,
            @Pattern(regexp = "SUCCEEDED|FAILED") @NotNull String status,
            @NotBlank @Size(max = 120) String resultCode,
            @NotBlank String signature) {}

    private final RefundService refunds;
    private final RefundRepository records;
    private final CommandSigner signer;

    public RefundWebhookController(
            RefundService refunds, RefundRepository records, ScentStationProperties p) {
        this.refunds = refunds;
        this.records = records;
        this.signer = new CommandSigner(p.getPayment().getWebhookSecret());
    }

    @PostMapping("/webhook")
    public RefundRepository.Refund receive(@Valid @RequestBody Outcome result) {
        if (!signer.verify(signed(result)))
            throw ApiException.badRequest(
                    "INVALID_SIGNATURE", "Refund webhook signature does not match its contents");
        long id =
                records.byReference(result.refundReference())
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "REFUND_NOT_FOUND", "Unknown refund reference"))
                        .id();
        return refunds.applyOutcome(id, result);
    }

    public static Map<String, Object> signed(Outcome r) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("eventType", "REFUND");
        fields.put("refundReference", r.refundReference());
        fields.put("provider", r.provider());
        fields.put("providerReference", r.providerReference());
        fields.put("attempt", r.attempt());
        fields.put("amount", r.amount());
        fields.put("currency", r.currency());
        fields.put("status", r.status());
        fields.put("resultCode", r.resultCode());
        fields.put("signature", r.signature());
        return fields;
    }
}
