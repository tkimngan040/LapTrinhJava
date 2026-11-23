package vn.edu.uth.scentstation.domain.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

/** Insert/search only: no general-purpose save, update or delete surface. */
@Repository
public class AuditLogRepository {
    public record Entry(
            Long id,
            Long actorId,
            String actorIdentifier,
            Long brandId,
            String action,
            String targetType,
            Long targetId,
            Long machineId,
            Instant occurredAt,
            String source,
            String severity,
            JsonNode beforeValues,
            JsonNode afterValues,
            String reason) {}

    public record Page(List<Entry> content, long totalElements, int page, int size) {}

    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper json;

    public AuditLogRepository(NamedParameterJdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public void append(
            Long actorId,
            String actorIdentifier,
            Long brandId,
            String action,
            String targetType,
            Long targetId,
            Long machineId,
            String source,
            String severity,
            JsonNode before,
            JsonNode after,
            String reason) {
        MapSqlParameterSource p =
                new MapSqlParameterSource()
                        .addValue("actor", actorId)
                        .addValue("identifier", actorIdentifier)
                        .addValue("brand", brandId)
                        .addValue("action", action)
                        .addValue("type", targetType)
                        .addValue("target", targetId)
                        .addValue("machine", machineId)
                        .addValue("source", source)
                        .addValue("severity", severity)
                        .addValue("before", before == null ? null : before.toString())
                        .addValue("after", after == null ? null : after.toString())
                        .addValue("reason", reason);
        jdbc.update(
                "INSERT INTO"
                    + " audit_logs(actor_id,actor_identifier,brand_id,action,target_type,target_id,machine_id,source,severity,before_values,after_values,reason)"
                    + " VALUES"
                    + " (:actor,:identifier,:brand,:action,:type,:target,:machine,:source,:severity,CAST(:before"
                    + " AS jsonb),CAST(:after AS jsonb),:reason)",
                p);
    }

    public Page search(AuditController.Filter f) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE true");
        filter(where, p, "brand_id", "brand", f.getBrandId());
        filter(where, p, "actor_id", "actor", f.getActorId());
        filter(where, p, "machine_id", "machine", f.getMachineId());
        filter(where, p, "action", "action", f.getAction());
        filter(
                where,
                p,
                "target_type",
                "type",
                f.getTargetType() == null ? null : f.getTargetType().name());
        filter(where, p, "target_id", "target", f.getTargetId());
        filter(where, p, "severity", "severity", f.getSeverity());
        if (f.getFrom() != null) {
            where.append(" AND occurred_at>=:from");
            p.addValue("from", Timestamp.from(f.getFrom()));
        }
        if (f.getTo() != null) {
            where.append(" AND occurred_at<:to");
            p.addValue("to", Timestamp.from(f.getTo()));
        }
        long count = jdbc.queryForObject("SELECT count(*) FROM audit_logs" + where, p, Long.class);
        p.addValue("limit", f.getSize()).addValue("offset", (long) f.getPage() * f.getSize());
        List<Entry> rows =
                jdbc.query(
                        "SELECT * FROM audit_logs"
                                + where
                                + " ORDER BY occurred_at DESC,id DESC LIMIT :limit OFFSET :offset",
                        p,
                        (r, n) ->
                                new Entry(
                                        r.getLong("id"),
                                        r.getObject("actor_id", Long.class),
                                        r.getString("actor_identifier"),
                                        r.getObject("brand_id", Long.class),
                                        r.getString("action"),
                                        r.getString("target_type"),
                                        r.getObject("target_id", Long.class),
                                        r.getObject("machine_id", Long.class),
                                        r.getTimestamp("occurred_at").toInstant(),
                                        r.getString("source"),
                                        r.getString("severity"),
                                        parse(r.getString("before_values")),
                                        parse(r.getString("after_values")),
                                        r.getString("reason")));
        return new Page(rows, count, f.getPage(), f.getSize());
    }

    private void filter(
            StringBuilder where,
            MapSqlParameterSource p,
            String column,
            String name,
            Object value) {
        if (value != null) {
            where.append(" AND ").append(column).append("=:").append(name);
            p.addValue(name, value);
        }
    }

    private JsonNode parse(String s) {
        try {
            return s == null ? null : json.readTree(s);
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Invalid stored audit JSON", e);
        }
    }
}
