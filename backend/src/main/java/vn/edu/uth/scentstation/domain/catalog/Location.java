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

import vn.edu.uth.scentstation.common.BaseEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;

/**
 * A site where machines stand: a mall, an office lobby, a hotel.
 */
@Entity
@Table(name = "locations")
@AttributeOverride(name = "id", column = @Column(name = "location_id"))
// Narrowed to the signed-in user's brand by TenantFilterAspect (BR13).
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class Location extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false, length = 160)
    private String name;

    @Column
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LocationStatus status;

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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocationStatus getStatus() {
        return status;
    }

    public void setStatus(LocationStatus status) {
        this.status = status;
    }
}
