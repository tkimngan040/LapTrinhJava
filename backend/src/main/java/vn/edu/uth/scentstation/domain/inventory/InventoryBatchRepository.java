package vn.edu.uth.scentstation.domain.inventory;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    @Query(
            "select b from InventoryBatch b where (:brand is null or b.brand.id = :brand) order by"
                    + " b.id")
    List<InventoryBatch> findAllScoped(@Param("brand") Long brandId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            "select b from InventoryBatch b where b.id = :id and (:brand is null or b.brand.id ="
                    + " :brand)")
    Optional<InventoryBatch> lockScoped(@Param("id") Long id, @Param("brand") Long brandId);

    boolean existsByBrandIdAndBatchNumber(Long brandId, String batchNumber);
}
