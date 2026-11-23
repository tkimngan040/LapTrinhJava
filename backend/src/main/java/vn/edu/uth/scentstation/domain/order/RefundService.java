package vn.edu.uth.scentstation.domain.order;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.audit.*;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.util.*;

@Service
@Transactional
public class RefundService {
    public static final String OPERATORS =
            "hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER')";

    public record Request(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9._:-]{1,80}") String requestKey,
            @NotBlank @Size(max = 1000) String reason) {}

    public record RequestResult(RefundRepository.Refund refund, boolean created) {}

    private final RefundRepository refunds;
    private final OrderStateMachine states;
    @PersistenceContext private EntityManager em;

    public RefundService(RefundRepository refunds, OrderStateMachine states) {
        this.refunds = refunds;
        this.states = states;
    }

    @PreAuthorize(OPERATORS)
    @Auditable(
            action = "REFUND_REQUESTED",
            target = AuditTarget.REFUND,
            id = "",
            resultId = "#result.refund.id",
            reason = "#p1.reason",
            resultCondition = "#result.created")
    public RequestResult request(Long orderId, Request r, AuthenticatedUser p) {
        Order order = lockOrder(orderId, p);
        RefundRepository.Refund existing =
                refunds.byKey(order.getBrand().getId(), r.requestKey()).orElse(null);
        if (existing != null) {
            if (!existing.orderId().equals(orderId)
                    || !existing.reason().equals(r.reason().strip()))
                throw ApiException.conflict(
                        "IDEMPOTENCY_KEY_REUSED",
                        "Request key already identifies a different refund request");
            return new RequestResult(existing, false);
        }
        if (refunds.byOrder(orderId).isPresent())
            throw ApiException.conflict(
                    "REFUND_ALREADY_REQUESTED",
                    "This order already has a full refund request; use its existing reference");
        if (order.getStatus() != OrderStatus.FAILED)
            throw ApiException.conflict(
                    "ORDER_NOT_REFUNDABLE",
                    "Only a definitely failed order can be refunded; review UNCERTAIN first");
        List<Payment> paid =
                em.createQuery(
                                "select p from Payment p where p.order.id=:id and p.status=:status",
                                Payment.class)
                        .setParameter("id", orderId)
                        .setParameter("status", PaymentStatus.SUCCEEDED)
                        .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                        .getResultList();
        if (paid.size() != 1
                || paid.getFirst().getAmount() != order.getPriceSnapshot()
                || !paid.getFirst().getCurrency().equals(order.getCurrency()))
            throw ApiException.conflict(
                    "PAYMENT_RECONCILIATION_REQUIRED",
                    "Exactly one matching successful payment is required");
        return new RequestResult(
                refunds.create(
                        order, paid.getFirst(), r.requestKey(), r.reason().strip(), p.userId()),
                true);
    }

    @Transactional(readOnly = true)
    @PreAuthorize(OPERATORS)
    public List<RefundRepository.Refund> list(AuthenticatedUser p) {
        return refunds.list(scope(p));
    }

    @Transactional(readOnly = true)
    @PreAuthorize(OPERATORS)
    public RefundRepository.Refund detail(Long id, AuthenticatedUser p) {
        return scoped(id, p);
    }

    @PreAuthorize(OPERATORS)
    @Auditable(action = "REFUND_RETRIED", target = AuditTarget.REFUND)
    public RefundRepository.Refund retry(Long id, AuthenticatedUser p) {
        RefundRepository.Refund r = scoped(id, p);
        lockOrder(r.orderId(), p);
        r = refunds.byId(id).orElseThrow();
        if (!r.status().equals("FAILED"))
            throw ApiException.conflict(
                    "REFUND_NOT_FAILED", "Retry is allowed only after a confirmed failed attempt");
        refunds.retry(r);
        return refunds.byId(id).orElseThrow();
    }

    /** Called only after the provider callback's HMAC has been verified. */
    @Auditable(action = "REFUND_OUTCOME_RECORDED", target = AuditTarget.REFUND)
    public RefundRepository.Refund applyOutcome(Long id, RefundWebhookController.Outcome result) {
        RefundRepository.Refund r =
                refunds.byId(id)
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "REFUND_NOT_FOUND", "Unknown refund reference"));
        Order order = lockOrder(r.orderId(), null);
        r = refunds.byId(id).orElseThrow();
        if (!r.refundReference().equals(result.refundReference())
                || !r.provider().equals(result.provider())
                || r.amount() != result.amount()
                || !r.currency().equals(result.currency())
                || r.attempt() != result.attempt())
            throw ApiException.conflict(
                    "REFUND_CALLBACK_MISMATCH",
                    "Reference, provider, attempt, amount and currency must match the request");
        if (!r.status().equals("PENDING")) {
            if (r.status().equals(result.status())
                    && Objects.equals(r.providerReference(), result.providerReference())) return r;
            throw ApiException.conflict(
                    "REFUND_ALREADY_FINAL", "This attempt already has a final outcome");
        }
        Payment payment = em.find(Payment.class, r.paymentId(), LockModeType.PESSIMISTIC_WRITE);
        if (order.getStatus() != OrderStatus.FAILED
                || payment.getStatus() != PaymentStatus.SUCCEEDED)
            throw ApiException.conflict(
                    "REFUND_STATE_CONFLICT",
                    "Order/payment changed; reconcile before applying refund");
        if (result.status().equals("SUCCEEDED")) {
            states.transition(order, OrderStatus.REFUNDED);
            payment.setStatus(PaymentStatus.REFUNDED);
        }
        refunds.complete(id, result.status(), result.providerReference(), result.resultCode());
        return refunds.byId(id).orElseThrow();
    }

    private RefundRepository.Refund scoped(Long id, AuthenticatedUser p) {
        Long brand = scope(p);
        return refunds.byId(id)
                .filter(r -> brand == null || r.brandId().equals(brand))
                .orElseThrow(
                        () ->
                                ApiException.notFound(
                                        "REFUND_NOT_FOUND", "No refund in the permitted scope"));
    }

    private Long scope(AuthenticatedUser p) {
        if (p == null || (!p.isPlatformAdmin() && p.brandId() == null))
            throw ApiException.forbidden("BRAND_SCOPE_REQUIRED", "Valid brand scope required");
        return p.isPlatformAdmin() ? null : p.brandId();
    }

    private Order lockOrder(Long id, AuthenticatedUser p) {
        Long brand = p == null ? null : scope(p);
        List<Long> machines =
                em.createQuery(
                                "select o.machine.id from Order o where o.id=:id and (:brand is"
                                    + " null or o.brand.id=:brand)",
                                Long.class)
                        .setParameter("id", id)
                        .setParameter("brand", brand)
                        .getResultList();
        if (machines.isEmpty())
            throw ApiException.notFound("ORDER_NOT_FOUND", "No order in the permitted scope");
        em.find(Machine.class, machines.getFirst(), LockModeType.PESSIMISTIC_WRITE);
        return em.find(Order.class, id, LockModeType.PESSIMISTIC_WRITE);
    }
}
