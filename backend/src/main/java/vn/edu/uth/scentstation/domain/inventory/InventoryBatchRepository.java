/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 */
package vn.edu.uth.scentstation.domain.inventory;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
}