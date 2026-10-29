/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.brand;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * A tenant: one perfume brand. BR1 ties every machine to exactly one of these.
 */
@Entity
@Table(name = "brands")
public class Brand extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BrandStatus status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BrandStatus getStatus() {
        return status;
    }

    public void setStatus(BrandStatus status) {
        this.status = status;
    }
}
