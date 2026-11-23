package vn.edu.uth.scentstation.domain.order;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;

@Repository
public class RefundRepository {
    public record Refund(
            Long id,
            Long brandId,
            Long orderId,
            Long paymentId,
            String refundReference,
            String requestKey,
            String provider,
            long amount,
            String currency,
            String status,
            String reason,
            Long requestedBy,
            int attempt,
            String providerReference,
            String resultCode,
            Instant createdAt,
            Instant completedAt) {}

    private final JdbcTemplate jdbc;

    public RefundRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Refund> byId(Long id) {
        return find("id=?", id);
    }

    public Optional<Refund> byReference(String reference) {
        return find("refund_reference=?", reference);
    }

    public Optional<Refund> byOrder(Long order) {
        return find("order_id=?", order);
    }

    public Optional<Refund> byKey(Long brand, String key) {
        return find("brand_id=? AND request_key=?", brand, key);
    }

    public List<Refund> list(Long brand) {
        return query(
                "SELECT * FROM refunds"
                        + (brand == null ? "" : " WHERE brand_id=?")
                        + " ORDER BY id DESC LIMIT 100",
                brand == null ? new Object[] {} : new Object[] {brand});
    }

    public Refund create(Order order, Payment payment, String key, String reason, Long actor) {
        Long id =
                jdbc.queryForObject(
                        "INSERT INTO"
                            + " refunds(brand_id,order_id,payment_id,refund_reference,request_key,provider,amount,currency,status,reason,requested_by)"
                            + " VALUES (?,?,?,?,?,?,?,?,'PENDING',?,?) RETURNING id",
                        Long.class,
                        order.getBrand().getId(),
                        order.getId(),
                        payment.getId(),
                        "REFUND-" + UUID.randomUUID(),
                        key,
                        payment.getProvider(),
                        payment.getAmount(),
                        payment.getCurrency(),
                        reason,
                        actor);
        enqueue(id, 1);
        return byId(id).orElseThrow();
    }

    public void enqueue(Long id, int attempt) {
        jdbc.update("INSERT INTO refund_dispatches(refund_id,attempt) VALUES (?,?)", id, attempt);
    }

    public void retry(Refund r) {
        jdbc.update(
                "UPDATE refunds SET"
                    + " status='PENDING',attempt=attempt+1,provider_reference=NULL,result_code=NULL,completed_at=NULL,updated_at=clock_timestamp()"
                    + " WHERE id=?",
                r.id());
        enqueue(r.id(), r.attempt() + 1);
    }

    public void complete(Long id, String status, String providerReference, String resultCode) {
        jdbc.update(
                "UPDATE refunds SET"
                    + " status=?,provider_reference=?,result_code=?,completed_at=clock_timestamp(),updated_at=clock_timestamp()"
                    + " WHERE id=?",
                status,
                providerReference,
                resultCode,
                id);
    }

    private Optional<Refund> find(String predicate, Object... args) {
        return query("SELECT * FROM refunds WHERE " + predicate, args).stream().findFirst();
    }

    private List<Refund> query(String sql, Object... args) {
        return jdbc.query(
                sql,
                (r, n) ->
                        new Refund(
                                r.getLong("id"),
                                r.getLong("brand_id"),
                                r.getLong("order_id"),
                                r.getLong("payment_id"),
                                r.getString("refund_reference"),
                                r.getString("request_key"),
                                r.getString("provider"),
                                r.getLong("amount"),
                                r.getString("currency"),
                                r.getString("status"),
                                r.getString("reason"),
                                r.getLong("requested_by"),
                                r.getInt("attempt"),
                                r.getString("provider_reference"),
                                r.getString("result_code"),
                                r.getTimestamp("created_at").toInstant(),
                                r.getTimestamp("completed_at") == null
                                        ? null
                                        : r.getTimestamp("completed_at").toInstant()),
                args);
    }
}
