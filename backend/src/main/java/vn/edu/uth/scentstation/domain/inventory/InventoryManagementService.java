package vn.edu.uth.scentstation.domain.inventory;

import vn.edu.uth.scentstation.domain.audit.*;

import jakarta.validation.constraints.*;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.alert.AlertService;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.OperatingStatus;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

/** Human inventory operations, separate from the device callback's InventoryService contract. */
@Service
@Transactional
@PreAuthorize(
        "hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', 'OPERATIONS_MANAGER',"
                + " 'INVENTORY_STAFF')")
public class InventoryManagementService {
    private final InventoryBatchRepository batches;
    private final InventoryBottleRepository bottles;
    private final InventoryMovementRepository movements;
    private final InventoryReferenceRepository references;
    private final Clock clock;
    private final AlertService alerts;

    public InventoryManagementService(
            InventoryBatchRepository batches,
            InventoryBottleRepository bottles,
            InventoryMovementRepository movements,
            InventoryReferenceRepository references,
            Clock clock,
            AlertService alerts) {
        this.batches = batches;
        this.bottles = bottles;
        this.movements = movements;
        this.references = references;
        this.clock = clock;
        this.alerts = alerts;
    }

    public record BatchRequest(
            @NotNull @Positive Long productId,
            @NotBlank @Size(max = 80) String batchNumber,
            @Positive int quantity,
            @NotNull @PastOrPresent LocalDate receivedDate,
            LocalDate expiryDate) {}

    public record BottleRequest(
            @NotNull @Positive Long batchId,
            @NotBlank @Size(max = 80) String bottleCode,
            @Positive int initialQuantityMl) {}

    public record InstallRequest(
            @NotNull @Positive Long bottleId, @Positive int initialQuantityMl) {}

    public record RefillRequest(@Positive int quantityMl, @Size(max = 300) String reason) {}

    public record AdjustRequest(
            @NotNull @PositiveOrZero Integer remainingQuantityMl,
            @NotBlank @Size(max = 300) String reason) {}

    public record StatusRequest(
            @NotNull BottleStatus status, @NotBlank @Size(max = 300) String reason) {}

    public record BatchResponse(
            Long id,
            Long brandId,
            Long productId,
            String batchNumber,
            int quantity,
            LocalDate receivedDate,
            LocalDate expiryDate) {}

    public record BottleResponse(
            Long id,
            Long batchId,
            Long productId,
            String bottleCode,
            BottleStatus status,
            int initialQuantityMl,
            int remainingQuantityMl,
            Long machineId,
            Long slotId,
            Instant installedAt,
            Instant removedAt,
            LocalDate expiryDate) {}

    public record MovementResponse(
            Long id,
            MovementType movementType,
            Long bottleId,
            Long previousBottleId,
            Long newBottleId,
            Long machineId,
            Long slotId,
            Long performedBy,
            Instant performedAt,
            int quantityMl,
            Integer quantityBeforeMl,
            Integer quantityAfterMl,
            String reason) {}

    @Transactional(readOnly = true)
    public List<BatchResponse> listBatches(AuthenticatedUser principal) {
        return batches.findAllScoped(scope(principal)).stream().map(this::batchResponse).toList();
    }

    public BatchResponse receiveBatch(BatchRequest request, AuthenticatedUser principal) {
        var product = references.product(request.productId(), scope(principal));
        String number = requiredText(request.batchNumber(), 80, "Batch number");
        if (request.quantity() <= 0
                || request.receivedDate() == null
                || request.receivedDate().isAfter(today())
                || (request.expiryDate() != null
                        && request.expiryDate().isBefore(request.receivedDate()))) {
            throw ApiException.badRequest(
                    "INVALID_BATCH",
                    "Positive quantity and valid receipt/expiry dates are required");
        }
        if (batches.existsByBrandIdAndBatchNumber(product.getBrand().getId(), number)) {
            throw ApiException.conflict(
                    "BATCH_ALREADY_EXISTS", "Batch number already exists in this brand");
        }
        InventoryBatch batch = new InventoryBatch();
        batch.setBrand(product.getBrand());
        batch.setProduct(product);
        batch.setBatchNumber(number);
        batch.setQuantity(request.quantity());
        batch.setReceivedDate(request.receivedDate());
        batch.setExpiryDate(request.expiryDate());
        return batchResponse(batches.saveAndFlush(batch));
    }

    @Transactional(readOnly = true)
    public List<BottleResponse> listBottles(AuthenticatedUser principal) {
        return bottles.findAllScoped(scope(principal)).stream().map(this::bottleResponse).toList();
    }

    public BottleResponse registerBottle(BottleRequest request, AuthenticatedUser principal) {
        InventoryBatch batch =
                batches.lockScoped(request.batchId(), scope(principal))
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "BATCH_NOT_FOUND",
                                                "No batch in the permitted brand"));
        String code = requiredText(request.bottleCode(), 80, "Bottle code");
        if (request.initialQuantityMl() <= 0) {
            throw ApiException.badRequest("INVALID_QUANTITY", "Initial quantity must be positive");
        }
        if (bottles.existsByBottleCode(code)) {
            throw ApiException.conflict(
                    "BOTTLE_CODE_ALREADY_EXISTS", "Bottle code is already registered");
        }
        // The batch row lock prevents concurrent registrations exceeding the receipt.
        if (bottles.countByBatchId(batch.getId()) >= batch.getQuantity()) {
            throw ApiException.conflict(
                    "BATCH_FULL", "All bottles in this batch have already been registered");
        }
        InventoryBottle bottle = new InventoryBottle();
        bottle.setBatch(batch);
        bottle.setProduct(batch.getProduct());
        bottle.setBottleCode(code);
        bottle.setInitialQuantityMl(request.initialQuantityMl());
        bottle.setRemainingQuantityMl(request.initialQuantityMl());
        bottle.setStatus(
                batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(today())
                        ? BottleStatus.EXPIRED
                        : BottleStatus.AVAILABLE);
        return bottleResponse(bottles.saveAndFlush(bottle));
    }

    /** Pause this slot before physical service; machine maintenance state is never changed here. */
    public void beginService(Long slotId, AuthenticatedUser principal) {
        MachineSlot slot = references.lockSlot(slotId, scope(principal));
        ensureSettled(slot);
        slot.setAvailable(false);
    }

    @Auditable(action="SLOT_BOTTLE_INSTALLED",target=AuditTarget.SLOT)
    public BottleResponse install(
            Long slotId, InstallRequest request, AuthenticatedUser principal) {
        MachineSlot slot = references.lockSlot(slotId, scope(principal));
        if (bottles.lockBySlotId(slotId).isPresent()) {
            throw ApiException.conflict(
                    "SLOT_ALREADY_OCCUPIED",
                    "Remove or replace the current bottle before installing another");
        }
        ensureSettled(slot);
        requireServiceMode(slot);
        InventoryBottle incoming = incomingBottle(request, slot, principal);
        int before = incoming.getRemainingQuantityMl();
        attach(incoming, slot, request.initialQuantityMl());
        bottles.saveAndFlush(incoming);
        record(
                incoming,
                slot,
                null,
                incoming,
                MovementType.INSTALL,
                before,
                incoming.getRemainingQuantityMl(),
                "Bottle installation",
                principal);
        return bottleResponse(incoming);
    }

    @Auditable(action="SLOT_BOTTLE_REPLACED",target=AuditTarget.SLOT)
    public BottleResponse replace(
            Long slotId, InstallRequest request, AuthenticatedUser principal) {
        MachineSlot slot = serviceSlot(slotId, principal);
        // Validate and lock incoming stock before changing the current assignment.
        InventoryBottle incoming = incomingBottle(request, slot, principal);
        InventoryBottle outgoing = currentBottle(slotId);
        int oldQuantity = outgoing.getRemainingQuantityMl();
        detach(outgoing);
        bottles.saveAndFlush(
                outgoing); // Release uq_bottle_active_slot before attaching the next bottle.
        record(
                outgoing,
                slot,
                outgoing,
                incoming,
                MovementType.REMOVE,
                oldQuantity,
                oldQuantity,
                "Bottle replacement: removed previous bottle",
                principal);
        int before = incoming.getRemainingQuantityMl();
        attach(incoming, slot, request.initialQuantityMl());
        bottles.saveAndFlush(incoming);
        record(
                incoming,
                slot,
                outgoing,
                incoming,
                MovementType.INSTALL,
                before,
                incoming.getRemainingQuantityMl(),
                "Bottle replacement: installed new bottle",
                principal);
        return bottleResponse(incoming);
    }

    @Auditable(action="SLOT_BOTTLE_REMOVED",target=AuditTarget.SLOT)
    public BottleResponse remove(Long slotId, AuthenticatedUser principal) {
        MachineSlot slot = serviceSlot(slotId, principal);
        InventoryBottle bottle = currentBottle(slotId);
        int quantity = bottle.getRemainingQuantityMl();
        detach(bottle);
        slot.setAvailable(false);
        record(
                bottle,
                slot,
                bottle,
                null,
                MovementType.REMOVE,
                quantity,
                quantity,
                "Bottle removal",
                principal);
        return bottleResponse(bottle);
    }

    @Auditable(action="INVENTORY_REFILLED",target=AuditTarget.SLOT,reason="#p1.reason")
    public BottleResponse refill(Long slotId, RefillRequest request, AuthenticatedUser principal) {
        MachineSlot slot = serviceSlot(slotId, principal);
        InventoryBottle bottle = currentBottle(slotId);
        ensureUsable(bottle);
        int before = bottle.getRemainingQuantityMl();
        long after = (long) before + request.quantityMl();
        if (request.quantityMl() <= 0 || after > bottle.getInitialQuantityMl()) {
            throw ApiException.badRequest(
                    "INVALID_QUANTITY",
                    "Refill must be positive and cannot exceed the installed baseline");
        }
        bottle.setRemainingQuantityMl((int) after);
        refreshState(bottle);
        record(
                bottle,
                slot,
                bottle,
                bottle,
                MovementType.REFILL,
                before,
                (int) after,
                optionalReason(request.reason(), "Bottle refill"),
                principal);
        return bottleResponse(bottle);
    }

    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', 'OPERATIONS_MANAGER')")
    @Auditable(action="INVENTORY_ADJUSTED",target=AuditTarget.INVENTORY_BOTTLE,reason="#p1.reason")
    public BottleResponse adjust(
            Long bottleId, AdjustRequest request, AuthenticatedUser principal) {
        String reason = requiredText(request.reason(), 300, "Adjustment reason");
        InventoryBottle bottle = lockedBottle(bottleId, principal);
        if (request.remainingQuantityMl() == null
                || request.remainingQuantityMl() < 0
                || request.remainingQuantityMl() > bottle.getInitialQuantityMl()) {
            throw ApiException.badRequest(
                    "INVALID_QUANTITY",
                    "Adjusted quantity must be between zero and the initial baseline");
        }
        int before = bottle.getRemainingQuantityMl();
        bottle.setRemainingQuantityMl(request.remainingQuantityMl());
        refreshState(bottle);
        record(
                bottle,
                bottle.getSlot(),
                bottle,
                bottle,
                MovementType.ADJUST,
                before,
                bottle.getRemainingQuantityMl(),
                reason,
                principal);
        return bottleResponse(bottle);
    }

    /** Only damage/expiry are manual states; install/refill/adjust derive volume states. */
    @Auditable(action="INVENTORY_BOTTLE_STATUS_CHANGED",target=AuditTarget.INVENTORY_BOTTLE,reason="#p1.reason")
    public BottleResponse changeStatus(
            Long bottleId, StatusRequest request, AuthenticatedUser principal) {
        String reason = requiredText(request.reason(), 300, "Status change reason");
        if (request.status() != BottleStatus.DAMAGED && request.status() != BottleStatus.EXPIRED) {
            throw ApiException.badRequest(
                    "INVALID_BOTTLE_STATUS", "Only DAMAGED or EXPIRED can be set manually");
        }
        InventoryBottle bottle = lockedBottle(bottleId, principal);
        bottle.setStatus(request.status());
        if (bottle.getSlot() != null) bottle.getSlot().setAvailable(false);
        int quantity = bottle.getRemainingQuantityMl();
        record(
                bottle,
                bottle.getSlot(),
                bottle,
                null,
                MovementType.DISPOSE,
                quantity,
                quantity,
                reason,
                principal);
        return bottleResponse(bottle);
    }

    @Transactional(readOnly = true)
    public List<MovementResponse> history(Long bottleId, AuthenticatedUser principal) {
        return movements.findAllScoped(scope(principal), bottleId).stream()
                .map(
                        m ->
                                new MovementResponse(
                                        m.getId(),
                                        m.getMovementType(),
                                        m.getBottle().getId(),
                                        id(m.getPreviousBottle()),
                                        id(m.getNewBottle()),
                                        m.getMachine() == null
                                                ? (m.getSlot() == null
                                                        ? null
                                                        : m.getSlot().getMachine().getId())
                                                : m.getMachine().getId(),
                                        m.getSlot() == null ? null : m.getSlot().getId(),
                                        m.getPerformedBy(),
                                        m.getCreatedAt(),
                                        m.getQuantityMl(),
                                        m.getQuantityBeforeMl(),
                                        m.getQuantityAfterMl(),
                                        m.getReason()))
                .toList();
    }

    private InventoryBottle incomingBottle(
            InstallRequest request, MachineSlot slot, AuthenticatedUser principal) {
        InventoryBottle bottle =
                bottles.lockScoped(request.bottleId(), scope(principal))
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "BOTTLE_NOT_FOUND",
                                                "No bottle in the permitted brand"));
        ensureUsable(bottle);
        if (bottle.getSlot() != null || bottle.getStatus() != BottleStatus.AVAILABLE) {
            throw ApiException.conflict(
                    "BOTTLE_UNAVAILABLE",
                    "Incoming bottle must be available and not installed elsewhere");
        }
        if (slot.getProduct() == null
                || !Objects.equals(slot.getProduct().getId(), bottle.getProduct().getId())
                || !Objects.equals(
                        slot.getMachine().getBrand().getId(),
                        bottle.getProduct().getBrand().getId())) {
            throw ApiException.conflict(
                    "PRODUCT_MISMATCH", "Bottle product must match the slot and machine brand");
        }
        if (request.initialQuantityMl() <= 0
                || request.initialQuantityMl() > bottle.getRemainingQuantityMl()) {
            throw ApiException.badRequest(
                    "INVALID_QUANTITY",
                    "Installation baseline must be positive and cannot exceed available volume");
        }
        return bottle;
    }

    private MachineSlot serviceSlot(Long id, AuthenticatedUser principal) {
        MachineSlot slot = references.lockSlot(id, scope(principal));
        ensureSettled(slot);
        requireServiceMode(slot);
        return slot;
    }

    private void requireServiceMode(MachineSlot slot) {
        if (slot.isAvailable()
                && slot.getMachine().getOperatingStatus() != OperatingStatus.MAINTENANCE) {
            throw ApiException.conflict(
                    "SLOT_NOT_IN_SERVICE_MODE", "Pause the slot before physical inventory service");
        }
    }

    private InventoryBottle lockedBottle(Long id, AuthenticatedUser principal) {
        Long brand = scope(principal);
        long slotId =
                bottles.findSlotIdScoped(id, brand)
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "BOTTLE_NOT_FOUND",
                                                "No bottle in the permitted brand"));
        if (slotId != 0) serviceSlot(slotId, principal);
        InventoryBottle bottle =
                bottles.lockScoped(id, brand)
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "BOTTLE_NOT_FOUND",
                                                "No bottle in the permitted brand"));
        if (!Objects.equals(bottle.getSlot() == null ? 0L : bottle.getSlot().getId(), slotId)) {
            throw ApiException.conflict(
                    "BOTTLE_ASSIGNMENT_CHANGED",
                    "Bottle was moved concurrently; reload before retrying");
        }
        return bottle;
    }

    private InventoryBottle currentBottle(Long slotId) {
        return bottles.lockBySlotId(slotId)
                .orElseThrow(
                        () -> ApiException.conflict("NO_INSTALLED_BOTTLE", "Slot holds no bottle"));
    }

    private void ensureSettled(MachineSlot slot) {
        if (references.hasUnsettledCommand(slot.getId())) {
            throw ApiException.conflict(
                    "SLOT_BUSY",
                    "Resolve pending or uncertain dispensing before inventory service");
        }
    }

    private void attach(InventoryBottle bottle, MachineSlot slot, int initial) {
        bottle.setSlot(slot);
        bottle.setInitialQuantityMl(initial);
        bottle.setRemainingQuantityMl(initial);
        bottle.setInstalledAt(clock.instant());
        bottle.setRemovedAt(null);
        refreshState(bottle);
    }

    private void detach(InventoryBottle bottle) {
        bottle.setSlot(null);
        bottle.setRemovedAt(clock.instant());
        refreshState(bottle);
    }

    private void refreshState(InventoryBottle bottle) {
        BottleStatus status = effectiveStatus(bottle);
        if (status != BottleStatus.DAMAGED && status != BottleStatus.EXPIRED) {
            MachineSlot slot = bottle.getSlot();
            int remaining = bottle.getRemainingQuantityMl();
            status =
                    remaining == 0 || (slot != null && remaining < slot.getDoseMl())
                            ? BottleStatus.EMPTY
                            : slot == null
                                    ? BottleStatus.AVAILABLE
                                    : remaining <= slot.getLowStockThresholdMl()
                                            ? BottleStatus.NEARLY_EMPTY
                                            : BottleStatus.INSTALLED;
        }
        bottle.setStatus(status);
        if (bottle.getSlot() != null) {
            bottle.getSlot()
                    .setAvailable(
                            status == BottleStatus.INSTALLED
                                    || status == BottleStatus.NEARLY_EMPTY);
        }
        alerts.reconcileLowStock(bottle);
    }

    private void ensureUsable(InventoryBottle bottle) {
        if (effectiveStatus(bottle) == BottleStatus.EXPIRED
                || bottle.getStatus() == BottleStatus.DAMAGED) {
            throw ApiException.conflict(
                    "BOTTLE_UNUSABLE",
                    "Expired or damaged bottles cannot be installed or refilled");
        }
    }

    private BottleStatus effectiveStatus(InventoryBottle bottle) {
        return bottle.getBatch() != null
                        && bottle.getBatch().getExpiryDate() != null
                        && bottle.getBatch().getExpiryDate().isBefore(today())
                ? BottleStatus.EXPIRED
                : bottle.getStatus();
    }

    private void record(
            InventoryBottle bottle,
            MachineSlot slot,
            InventoryBottle previous,
            InventoryBottle next,
            MovementType type,
            int before,
            int after,
            String reason,
            AuthenticatedUser principal) {
        InventoryMovement movement = new InventoryMovement();
        movement.setBottle(bottle);
        movement.setSlot(slot);
        movement.setMachine(slot == null ? null : slot.getMachine());
        movement.setPreviousBottle(previous);
        movement.setNewBottle(next);
        movement.setPerformedBy(principal.userId());
        movement.setMovementType(type);
        movement.setQuantityBeforeMl(before);
        movement.setQuantityAfterMl(after);
        movement.setQuantityMl(after - before);
        movement.setReason(reason);
        movements.saveAndFlush(movement);
    }

    private Long scope(AuthenticatedUser principal) {
        if (principal == null || (!principal.isPlatformAdmin() && principal.brandId() == null)) {
            throw ApiException.forbidden(
                    "BRAND_SCOPE_REQUIRED", "A valid inventory brand scope is required");
        }
        return principal.isPlatformAdmin() ? null : principal.brandId();
    }

    private String requiredText(String value, int max, String field) {
        if (value == null || value.isBlank() || value.strip().length() > max) {
            throw ApiException.badRequest(
                    "INVALID_INVENTORY_INPUT",
                    field + " is required and must not exceed " + max + " characters");
        }
        return value.strip();
    }

    private String optionalReason(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : requiredText(value, 300, "Reason");
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }

    private Long id(InventoryBottle bottle) {
        return bottle == null ? null : bottle.getId();
    }

    private BatchResponse batchResponse(InventoryBatch batch) {
        return new BatchResponse(
                batch.getId(),
                batch.getBrand().getId(),
                batch.getProduct().getId(),
                batch.getBatchNumber(),
                batch.getQuantity(),
                batch.getReceivedDate(),
                batch.getExpiryDate());
    }

    private BottleResponse bottleResponse(InventoryBottle bottle) {
        return new BottleResponse(
                bottle.getId(),
                bottle.getBatch() == null ? null : bottle.getBatch().getId(),
                bottle.getProduct().getId(),
                bottle.getBottleCode(),
                effectiveStatus(bottle),
                bottle.getInitialQuantityMl(),
                bottle.getRemainingQuantityMl(),
                bottle.getSlot() == null ? null : bottle.getSlot().getMachine().getId(),
                bottle.getSlot() == null ? null : bottle.getSlot().getId(),
                bottle.getInstalledAt(),
                bottle.getRemovedAt(),
                bottle.getBatch() == null ? null : bottle.getBatch().getExpiryDate());
    }
}
