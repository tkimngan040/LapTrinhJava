/*
 * Task M1 — group B of the entity inventory in Report section 2.7.2.
 * Column names, types and keys follow the ERD in figure 2.6.
 */
package vn.edu.uth.scentstation.domain.catalog;

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

import vn.edu.uth.scentstation.common.BaseEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;

/**
 * One of the at least four independently controlled positions inside a machine
 * (FR2.3).
 *
 * <p>The pair {@code (machine_id, slot_number)} is unique, enforced by
 * {@code uq_slot_number_per_machine} in the database rather than only in Java
 * (Report section 2.7.4).
 */
@Entity
@Table(name = "machine_slots")
@AttributeOverride(name = "id", column = @Column(name = "slot_id"))
public class MachineSlot extends BaseEntity {

    // The ERD carries brand_id on this table too, following rule 1 of section
    // 2.7.1. No @Filter on it yet: every path to a slot today goes through a
    // machine, which is already filtered. Task M3 adds the filter when the
    // slot administration endpoints arrive.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Column(name = "slot_number", nullable = false)
    private int slotNumber;

    // Nullable: a slot may be configured with no product yet
    // (Report section 2.7.3).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /**
     * This slot's own price, or null to use the product's.
     *
     * <p>Nullable by design (Report section 2.7.2 group B): a brand-wide price
     * change does not require touching every slot, while one location can
     * still be priced differently.
     */
    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    // FR6.7: below this remaining volume the slot raises a low-stock alert.
    @Column(name = "low_stock_threshold", nullable = false, precision = 10, scale = 2)
    private BigDecimal lowStockThreshold;

    // The calibrated value a dispensing command carries (section 2.9.3 step 6).
    @Column(name = "spray_duration_ms", nullable = false)
    private int sprayDurationMs;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SlotStatus status;

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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(BigDecimal lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public int getSprayDurationMs() {
        return sprayDurationMs;
    }

    public void setSprayDurationMs(int sprayDurationMs) {
        this.sprayDurationMs = sprayDurationMs;
    }

    public SlotStatus getStatus() {
        return status;
    }

    public void setStatus(SlotStatus status) {
        this.status = status;
    }

    /**
     * BR3: whether a spray may be sold from this slot right now.
     *
     * <p>{@link SlotStatus#LOW} still sells. It means the bottle is below its
     * low-stock threshold, which is a signal to whoever refills the machine,
     * not a reason to refuse a customer who can still be served.
     */
    public boolean isSellable() {
        return status == SlotStatus.AVAILABLE || status == SlotStatus.LOW;
    }

    /**
     * The price to charge for one spray from this slot: the slot's own price if
     * it has one, otherwise the product's.
     *
     * <p>BR4 copies the result onto the order at creation, so a later catalogue
     * change never reaches an order that already exists.
     */
    public BigDecimal effectivePrice() {
        if (price != null) {
            return price;
        }
        if (product == null) {
            throw new IllegalStateException(
                    "Slot " + slotNumber + " has neither a price of its own nor a product");
        }
        return product.getPricePerSpray();
    }
}
