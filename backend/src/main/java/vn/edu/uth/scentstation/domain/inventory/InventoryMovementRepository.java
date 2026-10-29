/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.inventory;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
}
