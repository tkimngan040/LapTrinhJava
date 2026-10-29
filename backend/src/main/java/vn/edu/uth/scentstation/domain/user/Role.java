/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * One of the seven roles of Report section 1.4.
 */
@Entity
@Table(name = "roles")
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
