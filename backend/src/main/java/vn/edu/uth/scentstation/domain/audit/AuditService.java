package vn.edu.uth.scentstation.domain.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.context.request.*;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.util.*;

@Service
public class AuditService {
    private final AuditLogRepository logs;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public AuditService(AuditLogRepository logs, JdbcTemplate jdbc, ObjectMapper json) {
        this.logs = logs;
        this.jdbc = jdbc;
        this.json = json;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void append(
            AuthenticatedUser actor,
            AuditSnapshotRepository.Snapshot target,
            String action,
            AuditTarget type,
            JsonNode before,
            JsonNode after,
            String reason) {
        Long actorId = actor == null ? target.operatorId() : actor.userId();
        String identifier = actor == null ? "SYSTEM" : actor.email();
        if (actor == null && actorId != null) {
            List<String> names =
                    jdbc.queryForList("SELECT email FROM users WHERE id=?", String.class, actorId);
            if (!names.isEmpty()) identifier = names.getFirst();
        }
        logs.append(
                actorId,
                identifier,
                target.brandId(),
                action,
                type.name(),
                target.id(),
                target.machineId(),
                source(),
                "INFO",
                before,
                after,
                reason);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deniedLogin(String email, String code) {
        String identifier = email.strip().toLowerCase(Locale.ROOT);
        List<Map<String, Object>> users =
                jdbc.queryForList("SELECT id,brand_id FROM users WHERE lower(email)=?", identifier);
        Long actor = users.isEmpty() ? null : ((Number) users.getFirst().get("id")).longValue();
        Long brand =
                users.isEmpty() || users.getFirst().get("brand_id") == null
                        ? null
                        : ((Number) users.getFirst().get("brand_id")).longValue();
        logs.append(
                null,
                identifier,
                brand,
                "LOGIN_DENIED",
                "USER",
                actor,
                null,
                source(),
                "WARNING",
                null,
                json.valueToTree(
                        Map.of("outcome", "DENIED", "code", code, "identityVerified", false)),
                null);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('PLATFORM_SUPER_ADMIN')")
    public AuditLogRepository.Page search(AuditController.Filter f) {
        if (f.getFrom() != null && f.getTo() != null && !f.getFrom().isBefore(f.getTo()))
            throw ApiException.badRequest("INVALID_AUDIT_FILTER", "from must precede to");
        return logs.search(f);
    }

    static String source() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes a) {
            String value = a.getRequest().getMethod() + " " + a.getRequest().getRequestURI();
            return value.substring(0, Math.min(255, value.length()));
        }
        return "APPLICATION";
    }
}
