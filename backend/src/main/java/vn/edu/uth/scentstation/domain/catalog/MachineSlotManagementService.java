
package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.security.TenantContext;

@Service
@Transactional
public class MachineSlotManagementService {

    private final MachineRepository machineRepository;
    private final MachineSlotRepository machineSlotRepository;
    private final ProductRepository productRepository;

    public MachineSlotManagementService(
            MachineRepository machineRepository,
            MachineSlotRepository machineSlotRepository,
            ProductRepository productRepository) {

        this.machineRepository = machineRepository;
        this.machineSlotRepository = machineSlotRepository;
        this.productRepository = productRepository;
    }

    // Get all slots belonging to a machine
    @Transactional(readOnly = true)
    public List<MachineSlotDtos.SlotResponse> findSlots(long machineId) {

        requireMachine(machineId);

        return machineSlotRepository
                .findByMachineWithProduct(machineId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Assign or update product and slot configuration
    public MachineSlotDtos.SlotResponse updateSlot(
            long machineId,
            long slotId,
            MachineSlotDtos.SlotRequest request) {

        if (request == null) {
            throw ApiException.badRequest(
                    "INVALID_SLOT_REQUEST",
                    "Slot request must not be null");
        }

        Machine machine = requireMachine(machineId);
        long brandId = requireBrandId(machine);

        MachineSlot slot = machineSlotRepository
                .findByIdAndMachine_IdAndBrand_Id(
                        slotId,
                        machineId,
                        brandId)
                .orElseThrow(() -> ApiException.notFound(
                        "SLOT_NOT_FOUND",
                        "Machine slot not found"));

        Long requestedProductId = request.productId();

        if (requestedProductId == null) {

            slot.setProduct(null);
            slot.setStatus(SlotStatus.EMPTY);

        } else {

            Product product = requireProduct(
                    requestedProductId.longValue(),
                    brandId);

            if (product.getStatus() != ProductStatus.ACTIVE) {
                throw ApiException.badRequest(
                        "PRODUCT_NOT_ACTIVE",
                        "Only active products can be assigned to a slot");
            }

            slot.setProduct(product);
        }

        slot.setPrice(request.price());
        slot.setLowStockThreshold(request.lowStockThreshold());
        slot.setSprayDurationMs(request.sprayDurationMs());

        if (request.status() != null) {
            validateStatus(request.status(), slot.getProduct());
            slot.setStatus(request.status());
        }

        return toResponse(slot);
    }

    // Update slot status
    public MachineSlotDtos.SlotResponse updateStatus(
            long machineId,
            long slotId,
            MachineSlotDtos.StatusRequest request) {

        if (request == null || request.status() == null) {
            throw ApiException.badRequest(
                    "INVALID_SLOT_STATUS",
                    "Slot status must not be null");
        }

        Machine machine = requireMachine(machineId);
        long brandId = requireBrandId(machine);

        MachineSlot slot = machineSlotRepository
                .findByIdAndMachine_IdAndBrand_Id(
                        slotId,
                        machineId,
                        brandId)
                .orElseThrow(() -> ApiException.notFound(
                        "SLOT_NOT_FOUND",
                        "Machine slot not found"));

        validateStatus(request.status(), slot.getProduct());

        slot.setStatus(request.status());

        return toResponse(slot);
    }

    // Find a machine according to the current user's permission scope
    private Machine requireMachine(long machineId) {

        if (TenantContext.isPlatformScope()) {

            return machineRepository.findById(machineId)
                    .orElseThrow(() -> ApiException.notFound(
                            "MACHINE_NOT_FOUND",
                            "Machine not found"));
        }

        if (TenantContext.hasBrandScope()) {

            Long brandIdValue = TenantContext.getBrandId();

            if (brandIdValue == null) {
                throw ApiException.forbidden(
                        "BRAND_SCOPE_REQUIRED",
                        "Brand scope is required");
            }

            long brandId = brandIdValue.longValue();

            return machineRepository
                    .findByIdAndBrand_Id(machineId, brandId)
                    .orElseThrow(() -> ApiException.notFound(
                            "MACHINE_NOT_FOUND",
                            "Machine not found"));
        }

        throw ApiException.forbidden(
                "BRAND_SCOPE_REQUIRED",
                "Brand scope is required");
    }

    // Get the brand ID of a machine safely
    private long requireBrandId(Machine machine) {

        if (machine == null
                || machine.getBrand() == null
                || machine.getBrand().getId() == null) {

            throw ApiException.badRequest(
                    "MACHINE_BRAND_REQUIRED",
                    "Machine must belong to a brand");
        }

        return machine.getBrand().getId().longValue();
    }

    // Find a product belonging to the same brand as the machine
    private Product requireProduct(long productId, long brandId) {

        Product product;

        if (TenantContext.isPlatformScope()) {

            product = productRepository.findById(productId)
                    .orElseThrow(() -> ApiException.notFound(
                            "PRODUCT_NOT_FOUND",
                            "Product not found"));

        } else {

            product = productRepository
                    .findByIdAndBrand_Id(productId, brandId)
                    .orElseThrow(() -> ApiException.notFound(
                            "PRODUCT_NOT_FOUND",
                            "Product not found"));
        }

        if (product.getBrand() == null
                || product.getBrand().getId() == null
                || product.getBrand().getId().longValue() != brandId) {

            throw ApiException.notFound(
                    "PRODUCT_NOT_FOUND",
                    "Product not found");
        }

        return product;
    }

    // Validate slot status before updating
    private void validateStatus(SlotStatus status, Product product) {

        if (status == null) {
            throw ApiException.badRequest(
                    "INVALID_SLOT_STATUS",
                    "Slot status must not be null");
        }

        if ((status == SlotStatus.AVAILABLE
                || status == SlotStatus.LOW)
                && product == null) {

            throw ApiException.badRequest(
                    "SLOT_PRODUCT_REQUIRED",
                    "A product must be assigned before enabling this slot");
        }
    }

    // Convert MachineSlot entity to response DTO
    private MachineSlotDtos.SlotResponse toResponse(MachineSlot slot) {

        Product product = slot.getProduct();

        return new MachineSlotDtos.SlotResponse(
                slot.getId(),
                slot.getMachine().getId(),
                slot.getSlotNumber(),
                product == null ? null : product.getId(),
                product == null ? null : product.getName(),
                slot.getPrice(),
                slot.getPrice() != null
                        ? slot.getPrice()
                        : product == null
                                ? null
                                : product.getPricePerSpray(),
                slot.getLowStockThreshold(),
                slot.getSprayDurationMs(),
                slot.getStatus()
        );
    }
}
