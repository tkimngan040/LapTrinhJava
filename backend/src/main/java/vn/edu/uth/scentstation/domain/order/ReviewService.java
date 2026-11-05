package vn.edu.uth.scentstation.domain.order;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.audit.AuditService;
import vn.edu.uth.scentstation.domain.dispensing.CommandStatus;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommand;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommandRepository;
import vn.edu.uth.scentstation.domain.inventory.InventoryService;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

/**
 * The human side of the order lifecycle: UC-16, review and reconcile paid
 * orders that did not end cleanly.
 *
 * <p>Three rules shape everything below.
 * <ul>
 *   <li><b>No second spray.</b> Resolving an UNCERTAIN order only records what
 *       a person found. It never issues a dispensing command (BR14, NFR4.5).</li>
 *   <li><b>One deduction.</b> If the person concludes the spray happened, stock
 *       is deducted exactly once, through the same {@code inventoryApplied}
 *       flag the device path uses (BR6, BR10).</li>
 *   <li><b>Nothing is repaid until the provider says so.</b> The order becomes
 *       REFUNDED only when the refund is COMPLETED; a pending or failed refund
 *       is kept under the same reference and the order stays FAILED (E7).</li>
 * </ul>
 * Every decision is written to the audit log (BR11).
 */
@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    /** One row of the review queue. Built inside the transaction, because lazy
     *  associations cannot be read after it closes (open-in-view is off). */
    public record ReviewItem(Long orderId, String status, String deviceId, int slotNumber,
                             String productName, BigDecimal amount, String currency,
                             String failureReason, String reviewNote, Instant createdAt) {
    }

    public record RefundOutcome(Long orderId, String orderStatus,
                                String refundReference, String refundStatus) {
    }

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentRefundRepository refundRepository;
    private final DispenseCommandRepository commandRepository;
    private final InventoryService inventoryService;
    private final OrderStateMachine stateMachine;
    private final RefundGateway refundGateway;
    private final AuditService auditService;
    private final Clock clock;

    public ReviewService(OrderRepository orderRepository,
                         PaymentRepository paymentRepository,
                         PaymentRefundRepository refundRepository,
                         DispenseCommandRepository commandRepository,
                         InventoryService inventoryService,
                         OrderStateMachine stateMachine,
                         RefundGateway refundGateway,
                         AuditService auditService,
                         Clock clock) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.commandRepository = commandRepository;
        this.inventoryService = inventoryService;
        this.stateMachine = stateMachine;
        this.refundGateway = refundGateway;
        this.auditService = auditService;
        this.clock = clock;
    }

    /** UC-16 step 2: the paid orders that still need a person (UNCERTAIN and FAILED). */
    @Transactional(readOnly = true)
    public List<ReviewItem> reviewQueue(AuthenticatedUser actor) {
        return orderRepository.findByStatusIn(List.of(OrderStatus.UNCERTAIN, OrderStatus.FAILED))
                .stream()
                .filter(order -> inScope(actor, order))
                .map(order -> new ReviewItem(
                        order.getId(),
                        order.getStatus().name(),
                        order.getMachine().getDeviceIdentity(),
                        order.getSlot().getSlotNumber(),
                        order.getProduct().getName(),
                        order.getPriceSnapshot(),
                        order.getCurrency(),
                        order.getFailureReason(),
                        order.getReviewNote(),
                        order.getCreatedAt()))
                .toList();
    }

    /**
     * UC-16 step 4: a person settles an UNCERTAIN order after checking the
     * machine.
     *
     * @param outcome {@code DISPENSED} when the spray is proven to have
     *        happened, {@code FAILED} when it is proven not to have
     * @param note what the reviewer found; required
     */
    @Transactional
    public Order resolveUncertain(Long orderId, OrderStatus outcome, String note,
                                  AuthenticatedUser actor, String sourceIp) {
        if (outcome != OrderStatus.DISPENSED && outcome != OrderStatus.FAILED) {
            throw ApiException.badRequest("INVALID_OUTCOME",
                    "A review can only conclude DISPENSED or FAILED");
        }
        if (note == null || note.isBlank()) {
            throw ApiException.badRequest("NOTE_REQUIRED",
                    "A review note is required so the decision is recorded");
        }

        Order order = requireInScope(orderId, actor);
        String before = order.getStatus().name();

        if (order.getStatus() != OrderStatus.UNCERTAIN) {
            // Checked before anything else is touched, so a FAILED or
            // DISPENSED order is refused for the right reason and no command
            // or stock is looked at.
            throw new IllegalOrderTransitionException(order.getStatus(), outcome,
                    "only an order in UNCERTAIN can be resolved by review");
        }

        if (outcome == OrderStatus.DISPENSED) {
            DispenseCommand command = commandRepository
                    .findFirstByOrderIdOrderByIdDesc(orderId)
                    .orElseThrow(() -> ApiException.conflict("NO_COMMAND",
                            "Order " + orderId + " has no dispensing command to confirm"));
            if (!command.isInventoryApplied()) {
                // The same deduction the device path performs, guarded by the
                // same flag, so a late device result can never deduct again.
                command.setStatus(CommandStatus.SUCCEEDED);
                inventoryService.deductForCommand(command);
                command.setInventoryApplied(true);
                commandRepository.save(command);
            }
        }

        // Throws unless the order is UNCERTAIN, so a FAILED or DISPENSED order
        // cannot be rewritten by this endpoint.
        stateMachine.resolveUncertain(order, outcome, note);
        orderRepository.save(order);

        Map<String, Object> was = new LinkedHashMap<>();
        was.put("status", before);
        Map<String, Object> now = new LinkedHashMap<>();
        now.put("status", order.getStatus().name());
        now.put("reviewNote", note);
        auditService.record(actor, order.getBrand().getId(), "ORDER_REVIEW_RESOLVED",
                "ORDER", order.getId(), was, now, sourceIp);

        log.info("Order {} resolved from {} to {} by user {}",
                orderId, before, outcome, actor.userId());
        return order;
    }

    /**
     * UC-16 steps 5 to 7: refund a FAILED order.
     *
     * <p>Safe to call again: the refund reference is derived from the payment,
     * so a repeat finds the same refund row and the provider sees the same
     * idempotency key, whether the first attempt completed, failed or timed
     * out.
     */
    @Transactional
    public RefundOutcome refund(Long orderId, String reason,
                                AuthenticatedUser actor, String sourceIp) {
        Order order = requireInScope(orderId, actor);
        Long brandId = order.getBrand().getId();

        try {
            if (reason == null || reason.isBlank()) {
                throw ApiException.badRequest("REASON_REQUIRED", "A refund needs a reason");
            }
            if (order.getStatus() == OrderStatus.REFUNDED) {
                return alreadyRefunded(order);
            }
            if (order.getStatus() != OrderStatus.FAILED) {
                throw ApiException.conflict("ORDER_NOT_REFUNDABLE",
                        "Only a FAILED order can be refunded, not " + order.getStatus()
                                + (order.getStatus() == OrderStatus.UNCERTAIN
                                ? "; resolve the review first" : ""));
            }
        } catch (ApiException rejected) {
            // E6: a refused request is audited even though this transaction
            // rolls back; recordRejected commits on its own.
            auditService.recordRejected(actor, brandId, "REFUND", "ORDER", orderId,
                    rejected.getMessage(), sourceIp);
            throw rejected;
        }

        Payment payment = paymentRepository
                .findFirstByOrderIdAndStatus(orderId, PaymentStatus.SUCCEEDED)
                .orElseThrow(() -> ApiException.conflict("NO_PAYMENT_TO_REFUND",
                        "Order " + orderId + " has no confirmed payment to refund"));

        String reference = "RF-" + payment.getId();
        PaymentRefund refund = refundRepository.findByRefundReference(reference)
                .orElseGet(() -> newRefund(order, payment, reference, reason));

        RefundStatus result = refundGateway.submit(reference, payment.getPaymentMethod(),
                payment.getProviderReference(), refund.getAmount());
        refund.setStatus(result);

        if (result == RefundStatus.COMPLETED) {
            refund.setCompletedAt(clock.instant());
            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            stateMachine.transition(order, OrderStatus.REFUNDED);
            orderRepository.save(order);
        }
        refundRepository.save(refund);

        Map<String, Object> after = new LinkedHashMap<>();
        after.put("refundReference", reference);
        after.put("refundStatus", result.name());
        after.put("orderStatus", order.getStatus().name());
        after.put("amount", refund.getAmount().toPlainString());
        after.put("reason", reason);
        auditService.record(actor, brandId, "REFUND_" + result.name(),
                "ORDER", order.getId(), null, after, sourceIp);

        log.info("Refund {} for order {} is {}", reference, orderId, result);
        return new RefundOutcome(orderId, order.getStatus().name(), reference, result.name());
    }

    private PaymentRefund newRefund(Order order, Payment payment, String reference, String reason) {
        PaymentRefund refund = new PaymentRefund();
        refund.setBrand(order.getBrand());
        refund.setPayment(payment);
        refund.setRefundReference(reference);
        refund.setAmount(payment.getAmount());
        refund.setReason(reason);
        refund.setStatus(RefundStatus.PENDING);
        return refund;
    }

    private RefundOutcome alreadyRefunded(Order order) {
        String reference = paymentRepository
                .findFirstByOrderIdAndStatus(order.getId(), PaymentStatus.REFUNDED)
                .map(payment -> "RF-" + payment.getId())
                .orElse(null);
        return new RefundOutcome(order.getId(), order.getStatus().name(),
                reference, RefundStatus.COMPLETED.name());
    }

    private Order requireInScope(Long orderId, AuthenticatedUser actor) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("ORDER_NOT_FOUND", "No such order"));
        if (!inScope(actor, order)) {
            // BR13: another brand's order looks exactly like one that does not
            // exist. findById ignores the Hibernate brand filter, so the check
            // has to be explicit here.
            throw ApiException.notFound("ORDER_NOT_FOUND", "No such order");
        }
        return order;
    }

    private boolean inScope(AuthenticatedUser actor, Order order) {
        return actor.isPlatformAdmin()
                || (actor.brandId() != null && actor.brandId().equals(order.getBrand().getId()));
    }
}
