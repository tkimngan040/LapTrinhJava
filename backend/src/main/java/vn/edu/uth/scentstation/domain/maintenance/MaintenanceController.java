package vn.edu.uth.scentstation.domain.maintenance;

import static vn.edu.uth.scentstation.domain.maintenance.MaintenanceService.*;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance/tickets")
public class MaintenanceController {
    private final MaintenanceService service;

    public MaintenanceController(MaintenanceService service) {
        this.service = service;
    }

    @GetMapping
    public List<TicketResponse> list(@AuthenticationPrincipal AuthenticatedUser p) {
        return service.list(p);
    }

    @GetMapping("/{id}")
    public TicketResponse detail(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return service.detail(id, p);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse create(
            @Valid @RequestBody CreateRequest r, @AuthenticationPrincipal AuthenticatedUser p) {
        return service.create(r, p);
    }

    @PatchMapping("/{id}/assign")
    public TicketResponse assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return service.assign(id, r, p);
    }

    @PostMapping("/{id}/start")
    public TicketResponse start(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return service.start(id, p);
    }

    @PatchMapping("/{id}/repair")
    public TicketResponse repair(
            @PathVariable Long id,
            @Valid @RequestBody RepairRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return service.repair(id, r, p);
    }

    @PostMapping("/{id}/test")
    public TicketResponse test(
            @PathVariable Long id,
            @Valid @RequestBody TestRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return service.requestTest(id, r, p);
    }

    @PostMapping("/{id}/close")
    public TicketResponse close(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser p) {
        return service.close(id, p);
    }
}
