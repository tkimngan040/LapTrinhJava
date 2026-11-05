package vn.edu.uth.scentstation.domain.order;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

/**
 * UC-16 over HTTP: the review queue, the decision on an UNCERTAIN order, and
 * the refund of a FAILED one.
 *
 * <p>Reading the queue needs only a signed-in user, so a Viewer can see it
 * (FR1.11). Deciding and refunding need an operations role: refunds are one of
 * the sensitive actions FR1.9 reserves for extra authority.
 */
@RestController
@RequestMapping("/api/review")
public class ReviewController {

    private static final String MAY_DECIDE =
            "hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER')";

    public record ResolveRequest(@NotNull OrderStatus outcome, @NotBlank String note) {
    }

    public record RefundRequest(@NotBlank String reason) {
    }

    public record DecisionView(Long orderId, String status, String reviewNote) {
    }

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/orders")
    public List<ReviewService.ReviewItem> queue(@AuthenticationPrincipal AuthenticatedUser actor) {
        return reviewService.reviewQueue(actor);
    }

    @PostMapping("/orders/{id}/resolve")
    @PreAuthorize(MAY_DECIDE)
    public DecisionView resolve(@PathVariable("id") Long id,
                                @Valid @RequestBody ResolveRequest body,
                                @AuthenticationPrincipal AuthenticatedUser actor,
                                HttpServletRequest request) {
        Order order = reviewService.resolveUncertain(
                id, body.outcome(), body.note(), actor, request.getRemoteAddr());
        return new DecisionView(order.getId(), order.getStatus().name(), order.getReviewNote());
    }

    @PostMapping("/orders/{id}/refund")
    @PreAuthorize(MAY_DECIDE)
    public ReviewService.RefundOutcome refund(@PathVariable("id") Long id,
                                              @Valid @RequestBody RefundRequest body,
                                              @AuthenticationPrincipal AuthenticatedUser actor,
                                              HttpServletRequest request) {
        return reviewService.refund(id, body.reason(), actor, request.getRemoteAddr());
    }
}
