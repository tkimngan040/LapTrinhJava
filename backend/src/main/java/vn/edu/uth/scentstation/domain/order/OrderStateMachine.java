package vn.edu.uth.scentstation.domain.order;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * The only place an order status is allowed to change.
 *
 * <p>Keeping the rule here, instead of spreading
 * {@code if (order.getStatus() == ...)} across the services, means the whole of
 * Report section 2.9.2 can be covered by one unit test class that needs no
 * Spring context and no database.
 *
 * <p>Two methods, because two different things are being done:
 * {@link #transition} is what code does, and it refuses to leave
 * {@code UNCERTAIN}; {@link #resolveUncertain} is what a human does, and it is
 * the only way out of that state (BR14, NFR4.5).
 */
@Component
public class OrderStateMachine {

    private static final Logger log = LoggerFactory.getLogger(OrderStateMachine.class);

    /**
     * Moves an order to {@code next}, or throws when that is not a legal step.
     *
     * @throws IllegalOrderTransitionException when the transition is not in the
     *         map, or when it would leave {@code UNCERTAIN} without review
     */
    public void transition(Order order, OrderStatus next) {
        transition(order, next, null);
    }

    /**
     * As {@link #transition}, recording why the order failed. The reason is kept
     * even when the order later moves on, so the transaction history explains
     * itself (FR3.12).
     */
    public void transition(Order order, OrderStatus next, String failureReason) {
        OrderStatus current = order.getStatus();

        if (current == next) {
            // Re-delivery of a device message that was already applied. Doing
            // nothing is correct here and keeps the operation idempotent.
            log.debug("Order {} is already {}, nothing to do", order.getId(), next);
            return;
        }

        if (current.requiresHumanReview()) {
            throw new IllegalOrderTransitionException(current, next,
                    "an uncertain dispensing result must be resolved by a person (BR14)");
        }

        if (!current.canMoveTo(next)) {
            throw new IllegalOrderTransitionException(current, next,
                    current.isTerminal()
                            ? "the order is already in a final state"
                            : "allowed next states are " + current.allowedNext());
        }

        apply(order, next, failureReason);
    }

    /**
     * Resolves an order that is stuck in {@code UNCERTAIN}, after a person has
     * checked what actually happened at the machine.
     *
     * @param next must be {@code DISPENSED} or {@code FAILED}
     * @param reviewNote what the reviewer found; required, so the decision is
     *        never anonymous
     */
    public void resolveUncertain(Order order, OrderStatus next, String reviewNote) {
        if (order.getStatus() != OrderStatus.UNCERTAIN) {
            throw new IllegalOrderTransitionException(order.getStatus(), next,
                    "only an order in UNCERTAIN can be resolved by review");
        }
        if (reviewNote == null || reviewNote.isBlank()) {
            throw new IllegalOrderTransitionException(OrderStatus.UNCERTAIN, next,
                    "a review note is required so the decision is recorded");
        }
        if (!OrderStatus.UNCERTAIN.canMoveTo(next)) {
            throw new IllegalOrderTransitionException(OrderStatus.UNCERTAIN, next,
                    "review may only conclude DISPENSED or FAILED");
        }

        order.setReviewNote(reviewNote);
        apply(order, next, order.getFailureReason());
        log.info("Order {} resolved from UNCERTAIN to {} by review", order.getId(), next);
    }

    private void apply(Order order, OrderStatus next, String failureReason) {
        log.info("Order {}: {} -> {}", order.getId(), order.getStatus(), next);
        order.setStatus(next);
        if (failureReason != null && !failureReason.isBlank()) {
            order.setFailureReason(failureReason);
        }
    }
}
