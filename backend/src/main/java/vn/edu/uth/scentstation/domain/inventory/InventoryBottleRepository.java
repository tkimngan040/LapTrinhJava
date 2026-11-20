/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.inventory;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryBottleRepository extends JpaRepository<InventoryBottle, Long> {

    Optional<InventoryBottle> findBySlotIdAndStatus(Long slotId, BottleStatus status);

    @Query(
            "select b from InventoryBottle b where (:brand is null or b.product.brand.id = :brand)"
                    + " order by b.id")
    List<InventoryBottle> findAllScoped(@Param("brand") Long brandId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            "select b from InventoryBottle b where b.id = :id and (:brand is null or"
                    + " b.product.brand.id = :brand)")
    Optional<InventoryBottle> lockScoped(@Param("id") Long id, @Param("brand") Long brandId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from InventoryBottle b where b.slot.id = :slot")
    Optional<InventoryBottle> lockBySlotId(@Param("slot") Long slotId);

    // A scalar lookup avoids caching a stale bottle before its slot lock is acquired.
    @Query(
            "select coalesce(b.slot.id, 0L) from InventoryBottle b where b.id = :id and (:brand is"
                    + " null or b.product.brand.id = :brand)")
    Optional<Long> findSlotIdScoped(@Param("id") Long id, @Param("brand") Long brandId);

    boolean existsByBottleCode(String bottleCode);

    long countByBatchId(Long batchId);
}
