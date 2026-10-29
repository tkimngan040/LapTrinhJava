/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * One of the at least four independently controlled slots of a machine (FR2.3).
 */
@Entity
@Table(name = "machine_slots")
public class MachineSlot extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(name = "slot_number", nullable = false)
    private int slotNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // Overrides the product price for this slot; null means use the product price.
    @Column
    private Long price;

    @Column(name = "low_stock_threshold_ml", nullable = false)
    private int lowStockThresholdMl;

    @Column(name = "dose_ml", nullable = false)
    private int doseMl;

    @Column(name = "spray_duration_ms", nullable = false)
    private int sprayDurationMs;

    @Column(nullable = false)
    private boolean available;

    public Machine getMachine() {
        return machine;
    }

    public void setMachine(Machine machine) {
        this.machine = machine;
    }

    public int getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(int slotNumber) {
        this.slotNumber = slotNumber;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Long getPrice() {
        return price;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public int getLowStockThresholdMl() {
        return lowStockThresholdMl;
    }

    public void setLowStockThresholdMl(int lowStockThresholdMl) {
        this.lowStockThresholdMl = lowStockThresholdMl;
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

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    /** BR4: the price copied onto an order at the moment it is created. */
    public long effectivePrice() {
        if (price != null) {
            return price;
        }
        if (product == null) {
            throw new IllegalStateException("Slot " + slotNumber + " has no product and no price");
        }
        return product.getDefaultPrice();
    }

}
