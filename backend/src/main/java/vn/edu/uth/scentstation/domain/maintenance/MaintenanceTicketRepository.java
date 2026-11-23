package vn.edu.uth.scentstation.domain.maintenance;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    @Query(
            "select t from MaintenanceTicket t where (:brand is null or t.brand.id = :brand) order"
                + " by t.id desc")
    List<MaintenanceTicket> findAllScoped(@Param("brand") Long brand);

    @Query(
            "select t.machine.id from MaintenanceTicket t where t.id = :id and (:brand is null or"
                + " t.brand.id = :brand)")
    Optional<Long> machineIdScoped(@Param("id") Long id, @Param("brand") Long brand);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            "select t from MaintenanceTicket t where t.id = :id and (:brand is null or t.brand.id ="
                + " :brand)")
    Optional<MaintenanceTicket> lockScoped(@Param("id") Long id, @Param("brand") Long brand);

    List<MaintenanceTicket> findByMachineIdAndStatusNotOrderById(
            Long machineId, MaintenanceTicket.Status status);

    boolean existsByMachineIdAndPriorityAndStatusNot(
            Long machineId, MaintenanceTicket.Priority priority, MaintenanceTicket.Status status);
}
