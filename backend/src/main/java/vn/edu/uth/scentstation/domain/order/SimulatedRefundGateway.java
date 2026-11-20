package vn.edu.uth.scentstation.domain.order;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.*;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.iot.CommandSigner;

import java.util.*;

@Component
@ConditionalOnProperty(
        name = "scentstation.payment.fake-provider-enabled",
        havingValue = "true",
        matchIfMissing = true)
public class SimulatedRefundGateway implements RefundGateway {
    private final JdbcTemplate jdbc;
    private final CommandSigner signer;

    public SimulatedRefundGateway(JdbcTemplate jdbc, ScentStationProperties p) {
        this.jdbc = jdbc;
        this.signer = new CommandSigner(p.getPayment().getWebhookSecret());
    }

    public boolean supports(String provider) {
        return FakePaymentProvider.PROVIDER_NAME.equals(provider);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void submit(RefundRepository.Refund r, String paymentReference) {
        jdbc.update(
                "INSERT INTO"
                    + " simulated_refund_requests(refund_reference,attempt,provider,payment_reference,amount,currency,provider_reference)"
                    + " VALUES (?,?,?,?,?,?,?) ON CONFLICT(refund_reference,attempt) DO NOTHING",
                r.refundReference(),
                r.attempt(),
                r.provider(),
                paymentReference,
                r.amount(),
                r.currency(),
                "SIM-" + UUID.randomUUID());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RefundWebhookController.Outcome complete(
            String reference, int attempt, boolean succeeded) {
        var rows =
                jdbc.queryForList(
                        "SELECT * FROM simulated_refund_requests WHERE refund_reference=? AND"
                            + " attempt=? FOR UPDATE",
                        reference,
                        attempt);
        if (rows.isEmpty())
            throw ApiException.conflict(
                    "REFUND_NOT_SUBMITTED",
                    "Wait until the queued refund request is delivered to the provider");
        var r = rows.getFirst();
        String outcome = succeeded ? "SUCCEEDED" : "FAILED";
        if (!r.get("status").equals("PENDING") && !r.get("status").equals(outcome))
            throw ApiException.conflict(
                    "PROVIDER_OUTCOME_FINAL",
                    "Provider already recorded a different final outcome");
        jdbc.update(
                "UPDATE simulated_refund_requests SET"
                    + " status=?,completed_at=COALESCE(completed_at,clock_timestamp()) WHERE"
                    + " refund_reference=? AND attempt=?",
                outcome,
                reference,
                attempt);
        var unsigned =
                new RefundWebhookController.Outcome(
                        reference,
                        (String) r.get("provider"),
                        (String) r.get("provider_reference"),
                        attempt,
                        ((Number) r.get("amount")).longValue(),
                        (String) r.get("currency"),
                        outcome,
                        succeeded ? "REFUNDED" : "PROVIDER_DECLINED",
                        "unused");
        return new RefundWebhookController.Outcome(
                unsigned.refundReference(),
                unsigned.provider(),
                unsigned.providerReference(),
                unsigned.attempt(),
                unsigned.amount(),
                unsigned.currency(),
                unsigned.status(),
                unsigned.resultCode(),
                signer.sign(RefundWebhookController.signed(unsigned)));
    }
}
