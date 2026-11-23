package vn.edu.uth.scentstation.domain.order;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RefundController {
    private final RefundService refunds;

    public RefundController(RefundService refunds) {
        this.refunds = refunds;
    }

    @PostMapping("/orders/{id}/refunds")
    public ResponseEntity<RefundRepository.Refund> request(
            @PathVariable Long id,
            @Valid @RequestBody RefundService.Request r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        var result = refunds.request(id, r, p);
        return ResponseEntity.status(result.created() ? 201 : 200).body(result.refund());
    }

    @GetMapping("/refunds")
    public List<RefundRepository.Refund> list(@AuthenticationPrincipal AuthenticatedUser p) {
        return refunds.list(p);
    }

    @GetMapping("/refunds/{id}")
    public RefundRepository.Refund detail(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return refunds.detail(id, p);
    }

    @PostMapping("/refunds/{id}/retry")
    public RefundRepository.Refund retry(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return refunds.retry(id, p);
    }
}
