/*
 * Task M1 — group A of the entity inventory in Report section 2.7.2.
 * Column names, types and keys follow the ERD in figure 2.6.
 */
package vn.edu.uth.scentstation.domain.brand;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import vn.edu.uth.scentstation.common.TimestampedEntity;

/**
 * A tenant: one perfume brand.
 *
 * <p>The root of the shared-schema multi-tenancy of Report section 2.7.1. Every
 * operational table carries a foreign key to this one, and BR13 narrows every
 * query to the signed-in user's brand.
 */
@Entity
@Table(name = "brands")
@AttributeOverride(name = "id", column = @Column(name = "brand_id"))
public class Brand extends TimestampedEntity {

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "logo_url", length = 400)
    private String logoUrl;

    @Column
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BrandStatus status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BrandStatus getStatus() {
        return status;
    }

    public void setStatus(BrandStatus status) {
        this.status = status;
    }
}
