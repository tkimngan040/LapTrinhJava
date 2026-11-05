package vn.edu.uth.scentstation.domain.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

/**
 * Writes the audit trail (BR11, BR12).
 *
 * <p>Two entry points, because two things must hold:
 * <ul>
 *   <li>{@link #record} joins the caller's transaction, so an action and its
 *       audit line are saved together or not at all;</li>
 *   <li>{@link #recordRejected} runs in its own transaction, so a request that
 *       was refused still leaves a line behind even though the caller rolls
 *       back (UC-16 exception E6).</li>
 * </ul>
 */
@Service
public class AuditService {

    private final AuditLogRepository repository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public AuditService(AuditLogRepository repository, ObjectMapper objectMapper, Clock clock) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional
    public void record(AuthenticatedUser actor, Long brandId, String action,
                       String entityType, Long entityId,
                       Map<String, Object> before, Map<String, Object> after,
                       String sourceIp) {
        write(actor, brandId, action, entityType, entityId, before, after, sourceIp);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordRejected(AuthenticatedUser actor, Long brandId, String action,
                               String entityType, Long entityId, String why,
                               String sourceIp) {
        write(actor, brandId, action + "_REJECTED", entityType, entityId,
                null, Map.of("reason", why), sourceIp);
    }

    private void write(AuthenticatedUser actor, Long brandId, String action,
                       String entityType, Long entityId,
                       Map<String, Object> before, Map<String, Object> after,
                       String sourceIp) {
        AuditLog line = new AuditLog();
        line.setBrandId(brandId);
        line.setUserId(actor == null ? null : actor.userId());
        line.setAction(action);
        line.setEntityType(entityType);
        line.setEntityId(entityId);
        line.setOldValues(json(before));
        line.setNewValues(json(after));
        line.setSourceIp(sourceIp);
        line.setCreatedAt(clock.instant());
        repository.save(line);
    }

    private String json(Map<String, Object> values) {
        if (values == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(values);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Audit values could not be serialised", ex);
        }
    }
}
