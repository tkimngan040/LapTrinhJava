/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    @Query(
            "select m from InventoryMovement m where (:brand is null or m.bottle.product.brand.id ="
                    + " :brand) and (:bottle is null or m.bottle.id = :bottle) order by m.id")
    List<InventoryMovement> findAllScoped(
            @Param("brand") Long brandId, @Param("bottle") Long bottleId);

    boolean existsByCommandIdAndMovementType(Long commandId, MovementType type);

    boolean existsByCommandIdAndMovementTypeIn(
            Long commandId, java.util.Collection<MovementType> types);
}
