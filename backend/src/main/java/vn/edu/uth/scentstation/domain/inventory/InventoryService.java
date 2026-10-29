package vn.edu.uth.scentstation.domain.inventory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.MachineSlotRepository;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommand;

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

    public InventoryService(InventoryBottleRepository bottleRepository,
                            InventoryMovementRepository movementRepository,
                            MachineSlotRepository slotRepository) {
        this.bottleRepository = bottleRepository;
        this.movementRepository = movementRepository;
        this.slotRepository = slotRepository;
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

        int dose = command.getDoseMl();
        if (bottle.getRemainingQuantityMl() < dose) {
            // Refused rather than clamped to zero: a spray that could not have
            // happened must not be recorded as if it did.
            throw ApiException.conflict("INSUFFICIENT_VOLUME",
                    "Bottle " + bottle.getBottleCode() + " has "
                            + bottle.getRemainingQuantityMl() + " ml left, less than one "
                            + dose + " ml dose");
        }

        bottle.setRemainingQuantityMl(bottle.getRemainingQuantityMl() - dose);

        InventoryMovement movement = new InventoryMovement();
        movement.setBottle(bottle);
        movement.setSlot(slot);
        movement.setCommandId(command.getId());
        movement.setMovementType(MovementType.DISPENSE);
        movement.setQuantityMl(-dose);
        movement.setReason("Confirmed spray for order " + command.getOrder().getId());
        movementRepository.save(movement);

        applyLowStockRules(bottle, slot);
        bottleRepository.save(bottle);

        log.info("Deducted {} ml from bottle {}; {} ml left",
                dose, bottle.getBottleCode(), bottle.getRemainingQuantityMl());
    }

    /**
     * FR6.8 and FR6.9: flag a bottle that is running low, and take the slot out
     * of service once it can no longer give one more full dose.
     */
    private void applyLowStockRules(InventoryBottle bottle, MachineSlot slot) {
        if (bottle.getRemainingQuantityMl() < slot.getDoseMl()) {
            bottle.setStatus(BottleStatus.EMPTY);
            slot.setAvailable(false);
            slotRepository.save(slot);
            log.warn("Slot {} is out of service: bottle {} cannot give another dose",
                    slot.getSlotNumber(), bottle.getBottleCode());
            return;
        }

        if (bottle.getRemainingQuantityMl() <= slot.getLowStockThresholdMl()
                && bottle.getStatus() != BottleStatus.NEARLY_EMPTY) {
            bottle.setStatus(BottleStatus.NEARLY_EMPTY);
            log.info("Bottle {} is nearly empty ({} ml left)",
                    bottle.getBottleCode(), bottle.getRemainingQuantityMl());
            // Hoai Anh (A4): raise a LOW_STOCK alert here once AlertService exists.
        }
    }
}
