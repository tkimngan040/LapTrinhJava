/*
 * Task M1 — group A of the entity inventory in Report section 2.7.2.
 * Column names, types and keys follow the ERD in figure 2.6.
 */
package vn.edu.uth.scentstation.domain.user;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * One of the seven roles of Report section 1.4.
 *
 * <p>The seven rows are seeded by {@code V1__core.sql}; nothing creates a role
 * at runtime. {@code role_name} is what
 * {@code vn.edu.uth.scentstation.security.Roles} names as constants, and
 * Spring Security sees it with the {@code ROLE_} prefix added.
 */
@Entity
@Table(name = "roles")
@AttributeOverride(name = "id", column = @Column(name = "role_id"))
public class Role extends BaseEntity {

    @Column(name = "role_name", nullable = false, length = 40)
    private String roleName;

    @Column(length = 200)
    private String description;

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
