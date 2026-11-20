package vn.edu.uth.scentstation.domain.order;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class RefundDispatcher {
    private final JdbcTemplate jdbc;
    private final RefundRepository refunds;
    private final List<RefundGateway> gateways;

    public RefundDispatcher(
            JdbcTemplate jdbc, RefundRepository refunds, List<RefundGateway> gateways) {
        this.jdbc = jdbc;
        this.refunds = refunds;
        this.gateways = gateways;
    }

    @Scheduled(fixedDelayString = "PT2S")
    @Transactional
    public void dispatchPending() {
        List<Long> ids =
                jdbc.queryForList(
                        "SELECT id FROM refund_dispatches WHERE status='PENDING' ORDER BY id FOR"
                            + " UPDATE SKIP LOCKED LIMIT 20",
                        Long.class);
        for (Long id : ids) {
            Long refundId =
                    jdbc.queryForObject(
                            "SELECT refund_id FROM refund_dispatches WHERE id=?", Long.class, id);
            var r = refunds.byId(refundId).orElseThrow();
            var gateway = gateways.stream().filter(g -> g.supports(r.provider())).findFirst();
            if (gateway.isEmpty())
                continue; // Retain the durable request for configured provider/reconciliation.
            String paymentRef =
                    jdbc.queryForObject(
                            "SELECT provider_reference FROM payments WHERE id=?",
                            String.class,
                            r.paymentId());
            gateway.get().submit(r, paymentRef);
            jdbc.update(
                    "UPDATE refund_dispatches SET status='DELIVERED',delivered_at=clock_timestamp()"
                        + " WHERE id=?",
                    id);
        }
    }
}
