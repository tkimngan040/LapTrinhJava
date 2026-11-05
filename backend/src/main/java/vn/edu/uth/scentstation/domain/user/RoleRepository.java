/*
 * Task M1 — repository for group A of Report section 2.7.2.
 */
package vn.edu.uth.scentstation.domain.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

    /** The seven rows are seeded by V1__core.sql; nothing creates one at runtime. */
    Optional<Role> findByRoleName(String roleName);
}
