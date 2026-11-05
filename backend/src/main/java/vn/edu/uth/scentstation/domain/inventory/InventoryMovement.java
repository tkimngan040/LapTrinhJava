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
import org.hibernate.annotations.Filter;
import vn.edu.uth.scentstation.common.TimestampedEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;

/**
 * Every change to a bottle quantity, so the history is complete (FR6.13).
 *
 * <p>Each row carries the quantity before and after as well as the change
 * itself. That is redundant on purpose: it lets the history be audited one row
 * at a time, without replaying every earlier movement, and a database CHECK
 * makes the three agree.
 */
@Entity
@Table(name = "inventory_movements")
@AttributeOverride(name = "id", column = @Column(name = "movement_id"))
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class InventoryMovement extends TimestampedEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bottle_id", nullable = false)
    private InventoryBottle bottle;

    // Who did it, when a person did. Null for a movement the device caused.
    @Column(name = "user_id")
    private Long userId;

    // Which dispensing command caused this movement, when one did (FR10.6).
    @Column(name = "command_id")
    private Long commandId;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;

    // Negative for a deduction, positive for a refill.
    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantity;

    @Column(name = "quantity_before", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantityBefore;

    @Column(name = "quantity_after", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantityAfter;

    @Column(length = 300)
    private String reason;

    public Brand getBrand() {
        return brand;
    }

    public void setBrand(Brand brand) {
        this.brand = brand;
    }

    public InventoryBottle getBottle() {
        return bottle;
    }

    public void setBottle(InventoryBottle bottle) {
        this.bottle = bottle;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCommandId() {
        return commandId;
    }

    public void setCommandId(Long commandId) {
        this.commandId = commandId;
    }

    public MovementType getMovementType() {
        return movementType;
    }

    public void setMovementType(MovementType movementType) {
        this.movementType = movementType;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getQuantityBefore() {
        return quantityBefore;
    }

    public void setQuantityBefore(BigDecimal quantityBefore) {
        this.quantityBefore = quantityBefore;
    }

    public BigDecimal getQuantityAfter() {
        return quantityAfter;
    }

    public void setQuantityAfter(BigDecimal quantityAfter) {
        this.quantityAfter = quantityAfter;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
