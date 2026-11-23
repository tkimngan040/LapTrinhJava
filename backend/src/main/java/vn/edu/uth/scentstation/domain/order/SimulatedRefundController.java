package vn.edu.uth.scentstation.domain.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

@RestController
@RequestMapping("/api/dev/refunds")
@ConditionalOnProperty(
        name = "scentstation.payment.fake-provider-enabled",
        havingValue = "true",
        matchIfMissing = true)
@PreAuthorize(RefundService.OPERATORS)
public class SimulatedRefundController {
    public record Simulate(@Positive int attempt, boolean succeed) {}

    private final RefundService refunds;
    private final SimulatedRefundGateway provider;
    private final RefundWebhookController callbacks;

    public SimulatedRefundController(
            RefundService refunds,
            SimulatedRefundGateway provider,
            RefundWebhookController callbacks) {
        this.refunds = refunds;
        this.provider = provider;
        this.callbacks = callbacks;
    }

    @PostMapping("/{id}/simulate")
    public RefundRepository.Refund simulate(
            @PathVariable Long id,
            @Valid @RequestBody Simulate r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        var refund = refunds.detail(id, p);
        return callbacks.receive(
                provider.complete(refund.refundReference(), r.attempt(), r.succeed()));
    }
}
