/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.dispensing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.order.Order;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * One signed instruction to spray once, and what the device reported back.
 */
@Entity
@Table(name = "dispense_commands")
public class DispenseCommand extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slot_id", nullable = false)
    private MachineSlot slot;

    // NFR3.4: the device echoes this back, so a repeated result is a no-op.
    @Column(name = "idempotency_key", nullable = false, length = 80)
    private String idempotencyKey;

    @Column(name = "dose_ml", nullable = false)
    private int doseMl;

    @Column(name = "spray_duration_ms", nullable = false)
    private int sprayDurationMs;

    @Column(nullable = false, length = 120)
    private String signature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommandStatus status;

    @Column(name = "issued_at", nullable = false)
    private Instant issuedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "result_code", length = 60)
    private String resultCode;

    @Column(name = "failure_reason", length = 200)
    private String failureReason;

    // Set once the stock deduction for this command has been written (BR10).
    @Column(name = "inventory_applied", nullable = false)
    private boolean inventoryApplied;

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Machine getMachine() {
        return machine;
    }

    public void setMachine(Machine machine) {
        this.machine = machine;
    }

    public MachineSlot getSlot() {
        return slot;
    }

    public void setSlot(MachineSlot slot) {
        this.slot = slot;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public int getDoseMl() {
        return doseMl;
    }

    public void setDoseMl(int doseMl) {
        this.doseMl = doseMl;
    }

    public int getSprayDurationMs() {
        return sprayDurationMs;
    }

    public void setSprayDurationMs(int sprayDurationMs) {
        this.sprayDurationMs = sprayDurationMs;
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

    public Instant getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(Instant issuedAt) {
        this.issuedAt = issuedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(Instant acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public String getResultCode() {
        return resultCode;
    }

    public void setResultCode(String resultCode) {
        this.resultCode = resultCode;
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

    public boolean isInFlight() {
        return status == CommandStatus.ISSUED || status == CommandStatus.ACKNOWLEDGED;
    }

}
