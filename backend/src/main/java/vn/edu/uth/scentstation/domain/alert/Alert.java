package vn.edu.uth.scentstation.domain.alert;

import jakarta.persistence.*;

import vn.edu.uth.scentstation.common.BaseEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.inventory.InventoryBottle;

import java.time.Instant;

@Entity
@Table(name = "alerts")
public class Alert extends BaseEntity {
    public enum Status {
        OPEN,
        ACKNOWLEDGED,
        ASSIGNED,
        RESOLVED
    }

    public enum Severity {
        INFO,
        WARNING,
        CRITICAL
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private MachineSlot slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bottle_id")
    private InventoryBottle bottle;

    @Column(name = "alert_type", nullable = false, length = 20)
    private String alertType = "LOW_STOCK";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.OPEN;

    @Column(name = "remaining_quantity_ml")
    private Integer remainingQuantityMl;

    @Column(name = "threshold_ml")
    private Integer thresholdMl;

    @Column(nullable = false, length = 300)
    private String message;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    public Brand getBrand() {
        return brand;
    }

    public void setBrand(Brand brand) {
        this.brand = brand;
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

    public InventoryBottle getBottle() {
        return bottle;
    }

    public void setBottle(InventoryBottle bottle) {
        this.bottle = bottle;
    }

    public String getAlertType() {
        return alertType;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Integer getRemainingQuantityMl() {
        return remainingQuantityMl;
    }

    public void setRemainingQuantityMl(int quantity) {
        this.remainingQuantityMl = quantity;
    }

    public Integer getThresholdMl() {
        return thresholdMl;
    }

    public void setThresholdMl(int threshold) {
        this.thresholdMl = threshold;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    @Column(name = "incident_key", nullable = false, length = 180)
    private String incidentKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity = Severity.WARNING;

    @Column(name = "condition_active", nullable = false)
    private boolean conditionActive = true;

    @Column(name = "acknowledged_by")
    private Long acknowledgedBy;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(length = 1000)
    private String resolution;

    @Column(name = "reopened_by")
    private Long reopenedBy;

    @Column(name = "reopened_at")
    private Instant reopenedAt;

    @Column(name = "reopen_count", nullable = false)
    private int reopenCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_ticket_id")
    private vn.edu.uth.scentstation.domain.maintenance.MaintenanceTicket maintenanceTicket;

    public void setAlertType(String type) {
        alertType = type;
    }

    public String getIncidentKey() {
        return incidentKey;
    }

    public void setIncidentKey(String key) {
        incidentKey = key;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity value) {
        severity = value;
    }

    public boolean isConditionActive() {
        return conditionActive;
    }

    public void setConditionActive(boolean value) {
        conditionActive = value;
    }

    public Long getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(Long value) {
        acknowledgedBy = value;
    }

    public Instant getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(Instant value) {
        acknowledgedAt = value;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long value) {
        assignedTo = value;
    }

    public Long getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(Long value) {
        resolvedBy = value;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String value) {
        resolution = value;
    }

    public Long getReopenedBy() {
        return reopenedBy;
    }

    public void setReopenedBy(Long value) {
        reopenedBy = value;
    }

    public Instant getReopenedAt() {
        return reopenedAt;
    }

    public void setReopenedAt(Instant value) {
        reopenedAt = value;
    }

    public int getReopenCount() {
        return reopenCount;
    }

    public void setReopenCount(int value) {
        reopenCount = value;
    }

    public vn.edu.uth.scentstation.domain.maintenance.MaintenanceTicket getMaintenanceTicket() {
        return maintenanceTicket;
    }

    public void setMaintenanceTicket(
            vn.edu.uth.scentstation.domain.maintenance.MaintenanceTicket value) {
        maintenanceTicket = value;
    }
}
