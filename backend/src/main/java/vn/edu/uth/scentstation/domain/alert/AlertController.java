package vn.edu.uth.scentstation.domain.alert;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {
    private final AlertService alerts;

    public AlertController(AlertService alerts) {
        this.alerts = alerts;
    }

    @GetMapping
    public List<AlertService.AlertResponse> list(
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return alerts.list(activeOnly, principal);
    }

    @PatchMapping("/{id}/acknowledge")
    public AlertService.AlertResponse acknowledge(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return alerts.acknowledge(id, p);
    }

    @PatchMapping("/{id}/assign")
    public AlertService.AlertResponse assign(
            @PathVariable Long id,
            @Valid @RequestBody AlertService.AssignRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return alerts.assign(id, r, p);
    }

    @PatchMapping("/{id}/resolve")
    public AlertService.AlertResponse resolve(
            @PathVariable Long id,
            @Valid @RequestBody AlertService.NoteRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return alerts.resolve(id, r, p);
    }

    @PatchMapping("/{id}/reopen")
    public AlertService.AlertResponse reopen(
            @PathVariable Long id,
            @Valid @RequestBody AlertService.NoteRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return alerts.reopen(id, r, p);
    }
}
