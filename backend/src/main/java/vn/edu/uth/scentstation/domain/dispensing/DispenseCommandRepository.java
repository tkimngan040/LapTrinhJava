/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.dispensing;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DispenseCommandRepository extends JpaRepository<DispenseCommand, Long> {

    Optional<DispenseCommand> findByIdempotencyKey(String idempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from DispenseCommand c where c.idempotencyKey = :key")
    Optional<DispenseCommand> lockByIdempotencyKey(@Param("key") String key);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from DispenseCommand c where c.id = :id")
    Optional<DispenseCommand> lockById(@Param("id") Long id);

    @Query("select c.machine.id from DispenseCommand c where c.idempotencyKey = :key")
    Optional<Long> machineIdByKey(@Param("key") String key);

    @Query("select c.machine.id from DispenseCommand c where c.id = :id")
    Optional<Long> machineIdById(@Param("id") Long id);

    boolean existsBySlotIdAndStatusIn(Long slotId, Collection<CommandStatus> statuses);

    List<DispenseCommand> findByStatusInAndIssuedAtBefore(
            Collection<CommandStatus> statuses, Instant cutoff);

    @Query(
            "select c.id from DispenseCommand c where c.status in :statuses and c.issuedAt <"
                    + " :cutoff order by c.id")
    List<Long> findStaleIds(
            @Param("statuses") Collection<CommandStatus> statuses, @Param("cutoff") Instant cutoff);

    boolean existsByOrderIdAndStatusIn(Long orderId, Collection<CommandStatus> statuses);
}
