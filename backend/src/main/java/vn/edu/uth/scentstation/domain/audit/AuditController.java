package vn.edu.uth.scentstation.domain.audit;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditController {
    private final AuditService audit;

    public AuditController(AuditService audit) {
        this.audit = audit;
    }

    @GetMapping
    public AuditLogRepository.Page search(@Valid @ModelAttribute Filter filter) {
        return audit.search(filter);
    }

    public static class Filter {
        @Positive private Long brandId;
        @Positive private Long actorId;
        @Positive private Long machineId;
        @Positive private Long targetId;

        @Pattern(regexp = "[A-Z_]{1,80}")
        private String action;

        private AuditTarget targetType;

        @Pattern(regexp = "INFO|WARNING|CRITICAL")
        private String severity;

        private Instant from;
        private Instant to;

        @Min(0)
        private int page;

        @Min(1)
        @Max(100)
        private int size = 50;

        public Long getBrandId() {
            return brandId;
        }

        public void setBrandId(Long v) {
            brandId = v;
        }

        public Long getActorId() {
            return actorId;
        }

        public void setActorId(Long v) {
            actorId = v;
        }

        public Long getMachineId() {
            return machineId;
        }

        public void setMachineId(Long v) {
            machineId = v;
        }

        public Long getTargetId() {
            return targetId;
        }

        public void setTargetId(Long v) {
            targetId = v;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String v) {
            action = v;
        }

        public AuditTarget getTargetType() {
            return targetType;
        }

        public void setTargetType(AuditTarget v) {
            targetType = v;
        }

        public String getSeverity() {
            return severity;
        }

        public void setSeverity(String v) {
            severity = v;
        }

        public Instant getFrom() {
            return from;
        }

        public void setFrom(Instant v) {
            from = v;
        }

        public Instant getTo() {
            return to;
        }

        public void setTo(Instant v) {
            to = v;
        }

        public int getPage() {
            return page;
        }

        public void setPage(int v) {
            page = v;
        }

        public int getSize() {
            return size;
        }

        public void setSize(int v) {
            size = v;
        }
    }
}
