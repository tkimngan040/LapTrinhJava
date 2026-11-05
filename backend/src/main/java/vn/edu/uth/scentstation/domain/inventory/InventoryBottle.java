/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 */
package vn.edu.uth.scentstation.domain.inventory;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.Filter;
import vn.edu.uth.scentstation.common.BaseEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;

/**
 * A bottle or cartridge, and how much is left in it.
 *
 * <p>Quantities are millilitres as {@code NUMERIC}, so half a dose is
 * representable and no rounding is hidden in an integer. Compare two of them
 * with {@code compareTo}, never {@code equals}, which also compares the scale.
 *
 * <p>Extends {@code BaseEntity} and not {@code TimestampedEntity}: the ERD
 * gives this table {@code installed_at} and {@code removed_at} but no
 * {@code created_at}.
 */
@Entity
@Table(name = "inventory_bottles")
@AttributeOverride(name = "id", column = @Column(name = "bottle_id"))
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class InventoryBottle extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private InventoryBatch batch;

    // Null once the bottle is removed, which frees the slot for the next one.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private MachineSlot slot;

    @Column(name = "bottle_code", nullable = false, length = 80)
    private String bottleCode;

    @Column(name = "initial_quantity", nullable = false, precision = 10, scale = 3)
    private BigDecimal initialQuantity;

    @Column(name = "remaining_quantity", nullable = false, precision = 10, scale = 3)
    private BigDecimal remainingQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BottleStatus status;

    @Column(name = "installed_at")
    private Instant installedAt;

    @Column(name = "removed_at")
    private Instant removedAt;

    /** True when the bottle still holds at least one full dose. */
    public boolean holdsAtLeast(BigDecimal quantity) {
        return remainingQuantity != null && remainingQuantity.compareTo(quantity) >= 0;
    }

    public Brand getBrand() {
        return brand;
    }

    public void setBrand(Brand brand) {
        this.brand = brand;
    }

    public InventoryBatch getBatch() {
        return batch;
    }

    public void setBatch(InventoryBatch batch) {
        this.batch = batch;
    }

    public MachineSlot getSlot() {
        return slot;
    }

    public void setSlot(MachineSlot slot) {
        this.slot = slot;
    }

    public String getBottleCode() {
        return bottleCode;
    }

    public void setBottleCode(String bottleCode) {
        this.bottleCode = bottleCode;
    }

    public BigDecimal getInitialQuantity() {
        return initialQuantity;
    }

    public void setInitialQuantity(BigDecimal initialQuantity) {
        this.initialQuantity = initialQuantity;
    }

    public BigDecimal getRemainingQuantity() {
        return remainingQuantity;
    }

    public void setRemainingQuantity(BigDecimal remainingQuantity) {
        this.remainingQuantity = remainingQuantity;
    }

    public BottleStatus getStatus() {
        return status;
    }

    public void setStatus(BottleStatus status) {
        this.status = status;
    }

    public Instant getInstalledAt() {
        return installedAt;
    }

    public void setInstalledAt(Instant installedAt) {
        this.installedAt = installedAt;
    }

    public Instant getRemovedAt() {
        return removedAt;
    }

    public void setRemovedAt(Instant removedAt) {
        this.removedAt = removedAt;
    }
}
