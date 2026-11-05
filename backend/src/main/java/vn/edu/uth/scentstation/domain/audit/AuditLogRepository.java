package vn.edu.uth.scentstation.domain.audit;

import java.util.List;
import org.springframework.data.repository.Repository;

/**
 * Deliberately not a {@code JpaRepository}: that interface brings
 * {@code delete} and {@code deleteAll}, and BR12 says audit lines are never
 * removed. This one can write a line and read lines back, and nothing else.
 */
public interface AuditLogRepository extends Repository<AuditLog, Long> {

    AuditLog save(AuditLog line);

    List<AuditLog> findByEntityTypeAndEntityIdOrderByIdAsc(String entityType, Long entityId);
}
