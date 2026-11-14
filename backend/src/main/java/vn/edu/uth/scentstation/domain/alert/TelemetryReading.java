package vn.edu.uth.scentstation.domain.alert;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vn.edu.uth.scentstation.common.BaseEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "telemetry_readings")
@AttributeOverride(name = "id", column = @Column(name = "reading_id"))
public class TelemetryReading extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private MachineSlot slot;

    @Column(name = "reading_reference", nullable = false, length = 255)
    private String readingReference;

    @Column(name = "weight_g", precision = 12, scale = 3)
    private BigDecimal weightG;

    @Column(name = "estimated_remaining", precision = 12, scale = 3)
    private BigDecimal estimatedRemaining;

    @Column(name = "door_open")
    private Boolean doorOpen;

    @Column(name = "leak_detected")
    private Boolean leakDetected;

    @Column(name = "actuator_state", length = 50)
    private String actuatorState;

    @Column(name = "power_status", length = 50)
    private String powerStatus;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "received_at", nullable = false)
    private Instant receivedAt;

    public Brand getBrand() { return brand; }
    public void setBrand(Brand brand) { this.brand = brand; }

    public Machine getMachine() { return machine; }
    public void setMachine(Machine machine) { this.machine = machine; }

    public MachineSlot getSlot() { return slot; }
    public void setSlot(MachineSlot slot) { this.slot = slot; }

    public String getReadingReference() { return readingReference; }
    public void setReadingReference(String readingReference) { this.readingReference = readingReference; }

    public BigDecimal getWeightG() { return weightG; }
    public void setWeightG(BigDecimal weightG) { this.weightG = weightG; }

    public BigDecimal getEstimatedRemaining() { return estimatedRemaining; }
    public void setEstimatedRemaining(BigDecimal estimatedRemaining) { this.estimatedRemaining = estimatedRemaining; }

    public Boolean getDoorOpen() { return doorOpen; }
    public void setDoorOpen(Boolean doorOpen) { this.doorOpen = doorOpen; }

    public Boolean getLeakDetected() { return leakDetected; }
    public void setLeakDetected(Boolean leakDetected) { this.leakDetected = leakDetected; }

    public String getActuatorState() { return actuatorState; }
    public void setActuatorState(String actuatorState) { this.actuatorState = actuatorState; }

    public String getPowerStatus() { return powerStatus; }
    public void setPowerStatus(String powerStatus) { this.powerStatus = powerStatus; }

    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }

    public Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }
}
