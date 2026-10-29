/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.inventory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * Every change to a bottle quantity, so the history is complete (FR6.13).
 */
@Entity
@Table(name = "inventory_movements")
public class InventoryMovement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bottle_id", nullable = false)
    private InventoryBottle bottle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private MachineSlot slot;

    // Which dispensing command caused this movement, when one did.
    @Column(name = "command_id")
    private Long commandId;

    @Column(name = "performed_by")
    private Long performedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;

    // Negative for a deduction, positive for a refill.
    @Column(name = "quantity_ml", nullable = false)
    private int quantityMl;

    @Column(length = 300)
    private String reason;

    public InventoryBottle getBottle() {
        return bottle;
    }

    public void setBottle(InventoryBottle bottle) {
        this.bottle = bottle;
    }

    public MachineSlot getSlot() {
        return slot;
    }

    public void setSlot(MachineSlot slot) {
        this.slot = slot;
    }

    public Long getCommandId() {
        return commandId;
    }

    public void setCommandId(Long commandId) {
        this.commandId = commandId;
    }

    public Long getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(Long performedBy) {
        this.performedBy = performedBy;
    }

    public MovementType getMovementType() {
        return movementType;
    }

    public void setMovementType(MovementType movementType) {
        this.movementType = movementType;
    }

    public int getQuantityMl() {
        return quantityMl;
    }

    public void setQuantityMl(int quantityMl) {
        this.quantityMl = quantityMl;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
