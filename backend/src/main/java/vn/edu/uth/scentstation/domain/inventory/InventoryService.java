package vn.edu.uth.scentstation.domain.inventory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.audit.*;
import vn.edu.uth.scentstation.domain.alert.AlertService;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.dispensing.CommandPurpose;
import vn.edu.uth.scentstation.domain.dispensing.CommandStatus;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommand;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommandRepository;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

/** Confirmed physical consumption, shared by customer and diagnostic callbacks. */
@Service
public class InventoryService {
    private final InventoryBottleRepository bottles;
    private final InventoryMovementRepository movements;
    private final DispenseCommandRepository commands;
    private final InventoryReferenceRepository references;
    private final AlertService alerts;
    private final Clock clock;

    public InventoryService(
            InventoryBottleRepository bottles,
            InventoryMovementRepository movements,
            DispenseCommandRepository commands,
            InventoryReferenceRepository references,
            AlertService alerts,
            Clock clock) {
        this.bottles = bottles;
        this.movements = movements;
        this.commands = commands;
        this.references = references;
        this.alerts = alerts;
        this.clock = clock;
    }

    /**
     * Agreed L5 contract: called inside the result transaction, after the managed command is marked
     * SUCCEEDED. Reloads/locks the authoritative command; detached caller-supplied status, dose and
     * slot values are never trusted.
     */
    @Transactional
    @Auditable(action="DISPENSE_STOCK_DEDUCTED",target=AuditTarget.DISPENSE_COMMAND,id="#p0?.id")
    public void deductForCommand(DispenseCommand command) {
        deduct(requireCommand(command == null ? null : command.getId()));
    }

    /** Used only after a confirmed-result transaction rolled back. */
    @Transactional
    public void pauseForReconciliation(Long slotId) {
        references.lockSlot(slotId, null).setAvailable(false);
    }

    private DispenseCommand requireCommand(Long id) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest(
                    "INVALID_COMMAND_ID", "A persisted command ID is required");
        }
        return commands.lockById(id)
                .orElseThrow(
                        () ->
                                ApiException.notFound(
                                        "COMMAND_NOT_FOUND", "No such dispensing command"));
    }

    private void deduct(DispenseCommand command) {
        // Lock order is command -> slot -> bottle, the same as the result processor.
        // The command's unique idempotency key maps every duplicate device result
        // to this same row. The movement index is an independent database backstop.
        if (command.isInventoryApplied()) return;
        if (movements.existsByCommandIdAndMovementTypeIn(
                command.getId(), List.of(MovementType.DISPENSE, MovementType.DIAGNOSTIC))) {
            command.setInventoryApplied(true);
            return;
        }
        if (command.getStatus() != CommandStatus.SUCCEEDED || command.getDoseMl() <= 0) {
            throw ApiException.conflict(
                    "UNCONFIRMED_DISPENSE",
                    "Only a confirmed successful spray can deduct inventory");
        }
        MachineSlot slot = references.lockSlot(command.getSlot().getId(), null);
        InventoryBottle bottle =
                bottles.lockBySlotId(slot.getId())
                        .orElseThrow(
                                () ->
                                        ApiException.conflict(
                                                "NO_INSTALLED_BOTTLE",
                                                "Slot holds no installed bottle"));
        if (!Objects.equals(slot.getMachine().getId(), command.getMachine().getId())
                || (command.getPurpose() == CommandPurpose.CUSTOMER
                        && (command.getOrder() == null
                                || !Objects.equals(
                                        command.getOrder().getProduct().getId(),
                                        bottle.getProduct().getId())))) {
            throw ApiException.conflict(
                    "COMMAND_SCOPE_MISMATCH", "Command and installed product do not match");
        }
        int dose = command.getDoseMl(); // signed snapshot, not a later slot calibration
        int before = bottle.getRemainingQuantityMl();
        if (before < dose) {
            throw ApiException.conflict(
                    "INSUFFICIENT_VOLUME",
                    "Bottle has "
                            + before
                            + " ml remaining, less than the "
                            + dose
                            + " ml confirmed dose");
        }
        if ((bottle.getStatus() != BottleStatus.INSTALLED
                        && bottle.getStatus() != BottleStatus.NEARLY_EMPTY)
                || (bottle.getBatch() != null
                        && bottle.getBatch().getExpiryDate() != null
                        && bottle.getBatch().getExpiryDate().isBefore(LocalDate.now(clock)))) {
            throw ApiException.conflict(
                    "BOTTLE_UNUSABLE", "Installed bottle is damaged, expired or unusable");
        }
        boolean diagnostic = command.getPurpose() == CommandPurpose.DIAGNOSTIC;
        if (diagnostic && (command.getOrder() != null || command.getRequestedBy() == null)) {
            throw ApiException.conflict(
                    "INVALID_DIAGNOSTIC_SCOPE",
                    "Diagnostic commands require an operator and no sale order");
        }
        bottle.setRemainingQuantityMl(before - dose);
        InventoryMovement movement = new InventoryMovement();
        movement.setBottle(bottle);
        movement.setSlot(slot);
        movement.setMachine(slot.getMachine());
        movement.setPreviousBottle(bottle);
        movement.setNewBottle(bottle);
        movement.setCommandId(command.getId());
        movement.setPerformedBy(diagnostic ? command.getRequestedBy() : null);
        movement.setMovementType(diagnostic ? MovementType.DIAGNOSTIC : MovementType.DISPENSE);
        movement.setQuantityBeforeMl(before);
        movement.setQuantityAfterMl(before - dose);
        movement.setQuantityMl(-dose);
        movement.setReason(
                diagnostic
                        ? "Confirmed diagnostic spray"
                        : "Confirmed customer spray for order " + command.getOrder().getId());
        movements.saveAndFlush(movement);
        if (bottle.getRemainingQuantityMl() < slot.getDoseMl()) {
            bottle.setStatus(BottleStatus.EMPTY);
            slot.setAvailable(false);
        } else {
            bottle.setStatus(
                    bottle.getRemainingQuantityMl() <= slot.getLowStockThresholdMl()
                            ? BottleStatus.NEARLY_EMPTY
                            : BottleStatus.INSTALLED);
        }
        // Includes the zero-volume case. Alert failure rolls back consumption too.
        alerts.reconcileLowStock(bottle);
        command.setInventoryApplied(true);
    }
}
