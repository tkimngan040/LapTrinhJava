/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 */
package vn.edu.uth.scentstation.domain.dispensing;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.Filter;
import vn.edu.uth.scentstation.common.TimestampedEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.order.Order;

/**
 * One signed instruction to spray once, and what the device reported back.
 *
 * <p>There is no machine, no dose and no spray duration here, which is the
 * ERD's design rather than an omission: the machine and the duration are
 * properties of the slot, and what was actually dispensed is recorded by the
 * inventory movement the result produced. A second copy of any of them could
 * disagree with the first.
 */
@Entity
@Table(name = "dispense_commands")
@AttributeOverride(name = "id", column = @Column(name = "command_id"))
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class DispenseCommand extends TimestampedEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slot_id", nullable = false)
    private MachineSlot slot;

    // The reference an operator quotes when asking about one command (FR10.6).
    @Column(name = "command_reference", nullable = false, length = 80)
    private String commandReference;

    // NFR3.4: the device echoes this back, so a repeated result is a no-op.
    @Column(name = "idempotency_key", nullable = false, length = 80)
    private String idempotencyKey;

    @Column(nullable = false, length = 120)
    private String signature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommandStatus status;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "acked_at")
    private Instant ackedAt;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Column(name = "failure_reason")
    private String failureReason;

    // Set once the stock deduction for this command has been written (BR10).
    @Column(name = "inventory_applied", nullable = false)
    private boolean inventoryApplied;

    /**
     * The machine this command is addressed to, reached through the slot.
     * Derived, not stored, which is why there is no setter.
     */
    public Machine getMachine() {
        return slot == null ? null : slot.getMachine();
    }

    public Brand getBrand() {
        return brand;
    }

    public void setBrand(Brand brand) {
        this.brand = brand;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public MachineSlot getSlot() {
        return slot;
    }

    public void setSlot(MachineSlot slot) {
        this.slot = slot;
    }

    public String getCommandReference() {
        return commandReference;
    }

    public void setCommandReference(String commandReference) {
        this.commandReference = commandReference;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public CommandStatus getStatus() {
        return status;
    }

    public void setStatus(CommandStatus status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getAckedAt() {
        return ackedAt;
    }

    public void setAckedAt(Instant ackedAt) {
        this.ackedAt = ackedAt;
    }

    public Instant getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(Instant executedAt) {
        this.executedAt = executedAt;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public boolean isInventoryApplied() {
        return inventoryApplied;
    }

    public void setInventoryApplied(boolean inventoryApplied) {
        this.inventoryApplied = inventoryApplied;
    }

    /** ISSUED and ACKNOWLEDGED are the two in-flight statuses (BR6). */
    public boolean isInFlight() {
        return status == CommandStatus.ISSUED || status == CommandStatus.ACKNOWLEDGED;
    }
}
