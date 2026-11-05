package vn.edu.uth.scentstation.domain.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.MachineSlotRepository;
import vn.edu.uth.scentstation.domain.catalog.SlotStatus;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommand;

import java.math.BigDecimal;

/**
 * Stock deduction after a confirmed spray.
 *
 * <p>This class is Hoai Anh's, task A4. What is here is the contract his
 * version has to keep, written so the dispensing flow compiles and runs
 * end to end in the meantime: the method name, its argument and its
 * guarantees. He should replace the body, keeping the signature.
 *
 * <p>Three guarantees, in order of how much they matter:
 * <ol>
 *   <li>deducting twice for the same command must not reduce stock twice
 *       (NFR3.4) — hence the {@code inventoryApplied} check;</li>
 *   <li>only a confirmed customer spray touches sale stock; a diagnostic
 *       spray is recorded as its own movement type (BR10);</li>
 *   <li>a failure throws, so the caller's transaction rolls back and the order
 *       is held for review rather than reported as complete
 *       (Report section 2.9.4, last row).</li>
 * </ol>
 */
@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryBottleRepository bottleRepository;
    private final InventoryMovementRepository movementRepository;
    private final MachineSlotRepository slotRepository;
    private final ScentStationProperties properties;

    public InventoryService(InventoryBottleRepository bottleRepository,
                            InventoryMovementRepository movementRepository,
                            MachineSlotRepository slotRepository,
                            ScentStationProperties properties) {
        this.bottleRepository = bottleRepository;
        this.movementRepository = movementRepository;
        this.slotRepository = slotRepository;
        this.properties = properties;
    }

    /**
     * One dose, in millilitres. It comes from configuration because neither
     * MACHINE_SLOTS nor DISPENSE_COMMANDS carries a dose in the ERD: a slot is
     * calibrated by its spray duration, and what was actually dispensed is
     * recorded by the movement this service writes.
     */
    private BigDecimal dose() {
        return BigDecimal.valueOf(properties.getDispensing().getDoseMl());
    }

    /**
     * Deducts one dose for a command that the device confirmed.
     *
     * @throws ApiException when the slot holds no installed bottle, or the
     *         bottle no longer holds a full dose
     */
    @Transactional
    public void deductForCommand(DispenseCommand command) {
        if (command.isInventoryApplied()) {
            // NFR3.4: a repeated result reaches here at most once more, and
            // must change nothing.
            log.info("Command {} has already been applied to inventory", command.getId());
            return;
        }

        MachineSlot slot = command.getSlot();
        InventoryBottle bottle = bottleRepository
                .findBySlotIdAndStatus(slot.getId(), BottleStatus.INSTALLED)
                .orElseThrow(() -> ApiException.conflict("NO_INSTALLED_BOTTLE",
                        "Slot " + slot.getSlotNumber() + " holds no installed bottle"));

        BigDecimal dose = dose();
        if (!bottle.holdsAtLeast(dose)) {
            // Refused rather than clamped to zero: a spray that could not have
            // happened must not be recorded as if it did.
            throw ApiException.conflict("INSUFFICIENT_VOLUME",
                    "Bottle " + bottle.getBottleCode() + " has "
                            + bottle.getRemainingQuantity().toPlainString() + " ml left, less than one "
                            + dose.toPlainString() + " ml dose");
        }

        BigDecimal before = bottle.getRemainingQuantity();
        BigDecimal after = before.subtract(dose);
        bottle.setRemainingQuantity(after);

        InventoryMovement movement = new InventoryMovement();
        movement.setBrand(bottle.getBrand());
        movement.setBottle(bottle);
        movement.setCommandId(command.getId());
        movement.setMovementType(MovementType.DISPENSE);
        movement.setQuantity(dose.negate());
        movement.setQuantityBefore(before);
        movement.setQuantityAfter(after);
        movement.setReason("Confirmed spray for order " + command.getOrder().getId());
        movementRepository.save(movement);

        applyLowStockRules(bottle, slot, dose);
        bottleRepository.save(bottle);

        log.info("Deducted {} ml from bottle {}; {} ml left",
                dose.toPlainString(), bottle.getBottleCode(),
                after.toPlainString());
    }

    /**
     * FR6.8 and FR6.9: flag a bottle that is running low, and take the slot out
     * of service once it can no longer give one more full dose.
     *
     * <p>The dose is passed in rather than read from the slot. The ERD gives
     * MACHINE_SLOTS no dose column — a slot is calibrated by
     * {@code spray_duration_ms} — so the only authoritative dose is the one
     * stamped on the command that was actually executed.
     */
    private void applyLowStockRules(InventoryBottle bottle, MachineSlot slot, BigDecimal dose) {
        BigDecimal remaining = bottle.getRemainingQuantity();

        if (remaining.compareTo(dose) < 0) {
            bottle.setStatus(BottleStatus.EMPTY);
            // EMPTY, not DISABLED: nothing is wrong with the slot, it has run
            // out. A refill brings it back without anyone re-enabling it.
            slot.setStatus(SlotStatus.EMPTY);
            slotRepository.save(slot);
            log.warn("Slot {} is out of stock: bottle {} cannot give another dose",
                    slot.getSlotNumber(), bottle.getBottleCode());
            return;
        }

        if (remaining.compareTo(slot.getLowStockThreshold()) <= 0
                && bottle.getStatus() != BottleStatus.NEARLY_EMPTY) {
            bottle.setStatus(BottleStatus.NEARLY_EMPTY);
            // LOW still sells (see MachineSlot.isSellable). The customer in
            // front of the machine can be served; the refill is someone
            // else's problem, and this is how they hear about it.
            slot.setStatus(SlotStatus.LOW);
            slotRepository.save(slot);
            log.info("Bottle {} is nearly empty ({} ml left)",
                    bottle.getBottleCode(), remaining.toPlainString());
            // Hoai Anh (A4): raise a LOW_STOCK alert here once AlertService exists.
        }
    }
}
