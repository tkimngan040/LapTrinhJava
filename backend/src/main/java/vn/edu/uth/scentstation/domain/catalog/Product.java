/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.catalog;

import jakarta.persistence.Column;
import org.hibernate.annotations.Filter;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vn.edu.uth.scentstation.domain.brand.Brand;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * A fragrance in a brand catalogue.
 */
@Entity
@Table(name = "products")
// Narrowed to the signed-in user's brand by TenantFilterAspect (BR13).
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class Product extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 600)
    private String description;

    @Column(name = "fragrance_notes", length = 300)
    private String fragranceNotes;

    @Column(name = "image_url", length = 400)
    private String imageUrl;

    // Integer amount in VND, as agreed in docs/api-contract.md.
    @Column(name = "default_price", nullable = false)
    private long defaultPrice;

    @Column(nullable = false)
    private boolean active;

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

    public long getDefaultPrice() {
        return defaultPrice;
    }

    public void setDefaultPrice(long defaultPrice) {
        this.defaultPrice = defaultPrice;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
