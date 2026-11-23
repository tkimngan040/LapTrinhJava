package vn.edu.uth.scentstation.domain.order;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

@RestController
@RequestMapping("/api/orders")
public class OrderReviewController {
    private final OrderReviewService reviews;

    public OrderReviewController(OrderReviewService reviews) {
        this.reviews = reviews;
    }

    @PostMapping("/{id}/review")
    public OrderReviewService.Result review(
            @PathVariable Long id,
            @Valid @RequestBody OrderReviewService.Review r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return reviews.review(id, r, p);
    }
}
