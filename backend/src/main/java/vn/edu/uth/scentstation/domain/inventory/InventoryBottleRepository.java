/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.inventory;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryBottleRepository extends JpaRepository<InventoryBottle, Long> {

    Optional<InventoryBottle> findBySlotIdAndStatus(Long slotId, BottleStatus status);
}
