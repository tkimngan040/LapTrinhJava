package vn.edu.uth.scentstation.domain.catalog;

import static vn.edu.uth.scentstation.domain.catalog.CatalogManagementService.*;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

@RestController
@RequestMapping("/api")
public class CatalogManagementController {
    private final CatalogManagementService catalog;

    public CatalogManagementController(CatalogManagementService catalog) {
        this.catalog = catalog;
    }

    @PatchMapping("/products/{id}/price")
    public ProductResponse price(
            @PathVariable Long id,
            @Valid @RequestBody ProductPriceRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return catalog.changePrice(id, r, p);
    }

    @PatchMapping("/slots/{id}/price")
    public SlotResponse slotPrice(
            @PathVariable Long id,
            @Valid @RequestBody SlotPriceRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return catalog.changeSlotPrice(id, r, p);
    }

    @PatchMapping("/slots/{id}/product")
    public SlotResponse assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignProductRequest r,
            @AuthenticationPrincipal AuthenticatedUser p) {
        return catalog.assignProduct(id, r, p);
    }
}
