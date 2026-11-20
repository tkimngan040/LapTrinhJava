package vn.edu.uth.scentstation.domain.catalog;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.audit.*;
import vn.edu.uth.scentstation.domain.inventory.*;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

@Service
@Transactional
@PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER')")
public class CatalogManagementService {
    @PersistenceContext private EntityManager em;
    private final InventoryReferenceRepository references;
    private final InventoryBottleRepository bottles;

    public CatalogManagementService(
            InventoryReferenceRepository references, InventoryBottleRepository bottles) {
        this.references = references;
        this.bottles = bottles;
    }

    public record ProductPriceRequest(@NotNull @PositiveOrZero Long price) {}

    public record SlotPriceRequest(@PositiveOrZero Long price) {}

    public record AssignProductRequest(@NotNull @Positive Long productId) {}

    public record ProductResponse(Long id, Long brandId, String name, long defaultPrice) {}

    public record SlotResponse(
            Long id, Long machineId, Long productId, Long price, boolean available) {}

    @Auditable(action = "PRODUCT_PRICE_CHANGED", target = AuditTarget.PRODUCT)
    public ProductResponse changePrice(Long id, ProductPriceRequest r, AuthenticatedUser p) {
        Long scope = scope(p);
        Product product =
                em.createQuery(
                                "select p from Product p where p.id=:id and (:brand is null or"
                                        + " p.brand.id=:brand)",
                                Product.class)
                        .setParameter("id", id)
                        .setParameter("brand", scope)
                        .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                        .getResultStream()
                        .findFirst()
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "PRODUCT_NOT_FOUND",
                                                "No product in the permitted brand"));
        if (r.price() == null || r.price() < 0)
            throw ApiException.badRequest("INVALID_PRICE", "Price must be zero or greater");
        product.setDefaultPrice(r.price());
        return new ProductResponse(
                product.getId(),
                product.getBrand().getId(),
                product.getName(),
                product.getDefaultPrice());
    }

    @Auditable(action = "SLOT_PRICE_CHANGED", target = AuditTarget.SLOT)
    public SlotResponse changeSlotPrice(Long id, SlotPriceRequest r, AuthenticatedUser p) {
        MachineSlot slot = references.lockSlot(id, scope(p));
        if (r.price() != null && r.price() < 0)
            throw ApiException.badRequest("INVALID_PRICE", "Price must be zero or greater");
        slot.setPrice(r.price());
        return response(slot);
    }

    @Auditable(action = "SLOT_PRODUCT_ASSIGNED", target = AuditTarget.SLOT)
    public SlotResponse assignProduct(Long id, AssignProductRequest r, AuthenticatedUser p) {
        MachineSlot slot = references.lockSlot(id, scope(p));
        if (slot.isAvailable())
            throw ApiException.conflict(
                    "SLOT_NOT_IN_SERVICE_MODE", "Pause the slot before changing its product");
        if (references.hasUnsettledCommand(id))
            throw ApiException.conflict("SLOT_BUSY", "Resolve pending/uncertain dispensing first");
        if (bottles.lockBySlotId(id).isPresent())
            throw ApiException.conflict(
                    "SLOT_ALREADY_OCCUPIED", "Remove the installed bottle before changing product");
        Product product = references.product(r.productId(), slot.getMachine().getBrand().getId());
        if (!product.isActive())
            throw ApiException.conflict("PRODUCT_INACTIVE", "Cannot assign an inactive product");
        slot.setProduct(product);
        return response(slot);
    }

    private Long scope(AuthenticatedUser p) {
        if (p == null || (!p.isPlatformAdmin() && p.brandId() == null))
            throw ApiException.forbidden("BRAND_SCOPE_REQUIRED", "Valid brand scope required");
        return p.isPlatformAdmin() ? null : p.brandId();
    }

    private SlotResponse response(MachineSlot s) {
        return new SlotResponse(
                s.getId(),
                s.getMachine().getId(),
                s.getProduct() == null ? null : s.getProduct().getId(),
                s.getPrice(),
                s.isAvailable());
    }
}
