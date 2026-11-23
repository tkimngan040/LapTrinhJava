package vn.edu.uth.scentstation.domain.inventory;

import static vn.edu.uth.scentstation.domain.inventory.InventoryManagementService.*;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryManagementService inventory;

    public InventoryController(InventoryManagementService inventory) {
        this.inventory = inventory;
    }

    @GetMapping("/batches")
    public List<BatchResponse> batches(@AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.listBatches(principal);
    }

    @PostMapping("/batches")
    @ResponseStatus(HttpStatus.CREATED)
    public BatchResponse receive(
            @Valid @RequestBody BatchRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.receiveBatch(request, principal);
    }

    @GetMapping("/bottles")
    public List<BottleResponse> bottles(@AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.listBottles(principal);
    }

    @PostMapping("/bottles")
    @ResponseStatus(HttpStatus.CREATED)
    public BottleResponse register(
            @Valid @RequestBody BottleRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.registerBottle(request, principal);
    }

    @PatchMapping("/slots/{id}/service")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void beginService(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        inventory.beginService(id, principal);
    }

    @PostMapping("/slots/{id}/install")
    public BottleResponse install(
            @PathVariable Long id,
            @Valid @RequestBody InstallRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.install(id, request, principal);
    }

    @PostMapping("/slots/{id}/replace")
    public BottleResponse replace(
            @PathVariable Long id,
            @Valid @RequestBody InstallRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.replace(id, request, principal);
    }

    @PostMapping("/slots/{id}/refill")
    public BottleResponse refill(
            @PathVariable Long id,
            @Valid @RequestBody RefillRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.refill(id, request, principal);
    }

    @PostMapping("/slots/{id}/remove")
    public BottleResponse remove(
            @PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.remove(id, principal);
    }

    @PatchMapping("/bottles/{id}/adjust")
    public BottleResponse adjust(
            @PathVariable Long id,
            @Valid @RequestBody AdjustRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.adjust(id, request, principal);
    }

    @PatchMapping("/bottles/{id}/status")
    public BottleResponse status(
            @PathVariable Long id,
            @Valid @RequestBody StatusRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.changeStatus(id, request, principal);
    }

    @GetMapping("/movements")
    public List<MovementResponse> history(
            @RequestParam(required = false) Long bottleId,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return inventory.history(bottleId, principal);
    }
}
