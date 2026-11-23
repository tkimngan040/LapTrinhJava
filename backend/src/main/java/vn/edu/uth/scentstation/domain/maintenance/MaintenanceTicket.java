package vn.edu.uth.scentstation.domain.maintenance;

import jakarta.persistence.*;

import vn.edu.uth.scentstation.common.BaseEntity;
import vn.edu.uth.scentstation.domain.alert.Alert;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.OperatingStatus;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommand;

import java.time.Instant;

@Entity
@Table(name = "maintenance_tickets")
public class MaintenanceTicket extends BaseEntity {
    public enum Status {
        OPEN,
        ASSIGNED,
        IN_PROGRESS,
        REPAIRED,
        TESTING,
        CLOSED
    }

    public enum Priority {
        LOW,
        NORMAL,
        HIGH,
        CRITICAL
    }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 30)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Alert.Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "repair_result", length = 1000)
    private String repairResult;

    @Column(name = "repaired_at")
    private Instant repairedAt;

    @Column(name = "repaired_by")
    private Long repairedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_command_id")
    private DispenseCommand testCommand;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "closed_by")
    private Long closedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_operating_status", nullable = false, length = 20)
    private OperatingStatus previousOperatingStatus;

    public Brand getBrand() {
        return brand;
    }

    public void setBrand(Brand value) {
        brand = value;
    }

    public Machine getMachine() {
        return machine;
    }

    public void setMachine(Machine value) {
        machine = value;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String value) {
        title = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String value) {
        description = value;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String value) {
        category = value;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority value) {
        priority = value;
    }

    public Alert.Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Alert.Severity value) {
        severity = value;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status value) {
        status = value;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public void setDueAt(Instant value) {
        dueAt = value;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long value) {
        createdBy = value;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long value) {
        assignedTo = value;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant value) {
        startedAt = value;
    }

    public String getRepairResult() {
        return repairResult;
    }

    public void setRepairResult(String value) {
        repairResult = value;
    }

    public Instant getRepairedAt() {
        return repairedAt;
    }

    public void setRepairedAt(Instant value) {
        repairedAt = value;
    }

    public Long getRepairedBy() {
        return repairedBy;
    }

    public void setRepairedBy(Long value) {
        repairedBy = value;
    }

    public DispenseCommand getTestCommand() {
        return testCommand;
    }

    public void setTestCommand(DispenseCommand value) {
        testCommand = value;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant value) {
        closedAt = value;
    }

    public Long getClosedBy() {
        return closedBy;
    }

    public void setClosedBy(Long value) {
        closedBy = value;
    }

    public OperatingStatus getPreviousOperatingStatus() {
        return previousOperatingStatus;
    }

    public void setPreviousOperatingStatus(OperatingStatus value) {
        previousOperatingStatus = value;
    }
}
