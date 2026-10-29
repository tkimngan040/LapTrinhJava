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
import java.time.Instant;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.Product;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * A bottle or cartridge, and how much is left in it.
 */
@Entity
@Table(name = "inventory_bottles")
public class InventoryBottle extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Null once the bottle is removed, which frees the slot for the next one.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private MachineSlot slot;

    @Column(name = "bottle_code", nullable = false, length = 80)
    private String bottleCode;

    @Column(name = "initial_quantity_ml", nullable = false)
    private int initialQuantityMl;

    @Column(name = "remaining_quantity_ml", nullable = false)
    private int remainingQuantityMl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BottleStatus status;

    @Column(name = "installed_at")
    private Instant installedAt;

    @Column(name = "removed_at")
    private Instant removedAt;

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
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

    public int getInitialQuantityMl() {
        return initialQuantityMl;
    }

    public void setInitialQuantityMl(int initialQuantityMl) {
        this.initialQuantityMl = initialQuantityMl;
    }

    public int getRemainingQuantityMl() {
        return remainingQuantityMl;
    }

    public void setRemainingQuantityMl(int remainingQuantityMl) {
        this.remainingQuantityMl = remainingQuantityMl;
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
