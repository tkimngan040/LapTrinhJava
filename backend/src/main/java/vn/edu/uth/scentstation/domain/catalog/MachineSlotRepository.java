/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MachineSlotRepository extends JpaRepository<MachineSlot, Long> {

    /**
     * Loads the slots of one machine together with their products.
     *
     * <p>The join fetch is not an optimisation, it is required. The kiosk menu
     * is built outside a transaction and {@code spring.jpa.open-in-view} is
     * false, so a lazily loaded product would throw
     * {@code LazyInitializationException} the moment the controller asked for
     * its name.
     */
    @Query("select s from MachineSlot s left join fetch s.product "
            + "where s.machine.id = :machineId order by s.slotNumber asc")
    List<MachineSlot> findByMachineWithProduct(@Param("machineId") Long machineId);

    Optional<MachineSlot> findByMachineIdAndSlotNumber(Long machineId, int slotNumber);
}
