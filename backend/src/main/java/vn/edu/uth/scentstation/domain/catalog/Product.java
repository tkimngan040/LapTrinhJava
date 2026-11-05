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

import org.hibernate.annotations.Filter;

import java.math.BigDecimal;

import vn.edu.uth.scentstation.common.BaseEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;

/**
 * A fragrance in a brand's catalogue.
 */
@Entity
@Table(name = "products")
@AttributeOverride(name = "id", column = @Column(name = "product_id"))
// Narrowed to the signed-in user's brand by TenantFilterAspect (BR13).
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class Product extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false, length = 160)
    private String name;

    @Column
    private String description;

    @Column(name = "fragrance_notes", length = 300)
    private String fragranceNotes;

    @Column(name = "image_url", length = 400)
    private String imageUrl;

    /**
     * The brand-wide price of one spray.
     *
     * <p>{@code BigDecimal} over {@code double}: money is never binary
     * floating point. A slot may override this; see {@link MachineSlot#getPrice()}.
     */
    @Column(name = "price_per_spray", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerSpray;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

    public Brand getBrand() {
        return brand;
    }

    public void setBrand(Brand brand) {
        this.brand = brand;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFragranceNotes() {
        return fragranceNotes;
    }

    public void setFragranceNotes(String fragranceNotes) {
        this.fragranceNotes = fragranceNotes;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public BigDecimal getPricePerSpray() {
        return pricePerSpray;
    }

    public void setPricePerSpray(BigDecimal pricePerSpray) {
        this.pricePerSpray = pricePerSpray;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
    }

    /** BR3: only an ACTIVE product may be sold. */
    public boolean isSellable() {
        return status == ProductStatus.ACTIVE;
    }
}
