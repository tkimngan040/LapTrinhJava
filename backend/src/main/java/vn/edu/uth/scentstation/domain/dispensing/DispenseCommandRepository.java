/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.dispensing;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DispenseCommandRepository extends JpaRepository<DispenseCommand, Long> {

    Optional<DispenseCommand> findByIdempotencyKey(String idempotencyKey);

    List<DispenseCommand> findByStatusInAndIssuedAtBefore(
            Collection<CommandStatus> statuses, Instant cutoff);

    boolean existsByOrderIdAndStatusIn(Long orderId, Collection<CommandStatus> statuses);
}
