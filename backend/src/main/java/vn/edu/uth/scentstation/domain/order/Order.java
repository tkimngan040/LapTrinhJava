/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.order;

import jakarta.persistence.Column;
import org.hibernate.annotations.Filter;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.Product;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * One customer purchase, from selection to spray.
 *
 * <p>Its {@code status} only ever changes through
 * {@link OrderStateMachine#transition}, never by calling
 * {@code setStatus} from a service.
 */
@Entity
@Table(name = "orders")
// Narrowed to the signed-in user's brand by TenantFilterAspect (BR13).
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class Order extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slot_id", nullable = false)
    private MachineSlot slot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    // BR4: the price as it stood when the order was created. A later price
    // change on the product never reaches an order that already exists.
    @Column(name = "price_snapshot", nullable = false)
    private long priceSnapshot;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "payment_ref", nullable = false, length = 80)
    private String paymentRef;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "failure_reason", length = 200)
    private String failureReason;

    // Why a human moved the order out of UNCERTAIN (BR14).
    @Column(name = "review_note", length = 400)
    private String reviewNote;

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

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public long getPriceSnapshot() {
        return priceSnapshot;
    }

    public void setPriceSnapshot(long priceSnapshot) {
        this.priceSnapshot = priceSnapshot;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPaymentRef() {
        return paymentRef;
    }

    public void setPaymentRef(String paymentRef) {
        this.paymentRef = paymentRef;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }
}
