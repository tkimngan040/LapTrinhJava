package vn.edu.uth.scentstation.domain.alert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    Optional<Alert> findByBottleIdAndStatus(Long bottleId, Alert.Status status);

    @Query(
            "select a from Alert a where (:brand is null or a.brand.id = :brand) and (:active ="
                    + " false or a.status <> :status) order by a.id")
    List<Alert> findAllScoped(
            @Param("brand") Long brandId,
            @Param("active") boolean activeOnly,
            @Param("status") Alert.Status status);

    @Query("select a from Alert a where a.incidentKey = :key and a.status <> :resolved")
    Optional<Alert> findActiveIncident(
            @Param("key") String key, @Param("resolved") Alert.Status resolved);

    @Query(
            "select a.machine.id from Alert a where a.id = :id and (:brand is null or a.brand.id ="
                + " :brand)")
    Optional<Long> machineIdScoped(@Param("id") Long id, @Param("brand") Long brand);

    @org.springframework.data.jpa.repository.Lock(
            jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Alert a where a.id = :id and (:brand is null or a.brand.id = :brand)")
    Optional<Alert> lockScoped(@Param("id") Long id, @Param("brand") Long brand);

    List<Alert> findByMaintenanceTicketId(Long ticketId);

    List<Alert> findByMachineIdAndStatusNot(Long machineId, Alert.Status status);
}
