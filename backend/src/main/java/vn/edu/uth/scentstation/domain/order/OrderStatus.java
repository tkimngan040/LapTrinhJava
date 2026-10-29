package vn.edu.uth.scentstation.domain.order;

import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * The nine order states of Report section 2.9.2 and the transitions allowed
 * between them.
 *
 * <p>The map below is the single source of truth. Services never compare
 * statuses by hand; they ask {@link OrderStateMachine} to move an order, and it
 * consults this map. Ten transitions are legal in total.
 *
 * <p>{@code UNCERTAIN} is what makes the workflow safe. It is reached whenever
 * the backend can prove neither success nor failure, and no automatic process
 * may leave it: resolution is a human decision (BR14, NFR4.5).
 */
public enum OrderStatus {

    /** Order exists, price fixed, payment QR issued, waiting for payment. */
    PENDING,

    /** Payment confirmed by the backend from the provider webhook (BR5). */
    PAID,

    /** Signed command sent to the device, waiting for its result. */
    DISPENSING,

    /** Spray confirmed by the device, inventory deducted. Terminal. */
    DISPENSED,

    /** The device reported a definite failure or rejected the command. */
    FAILED,

    /** No confirmed result within the timeout. Only a human may leave it. */
    UNCERTAIN,

    /** The customer abandoned the order before paying. Terminal. */
    CANCELLED,

    /** Not paid within the validity window. Terminal. */
    EXPIRED,

    /** A refund was completed against the payment. Terminal. */
    REFUNDED;

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED;

    static {
        Map<OrderStatus, Set<OrderStatus>> map = new EnumMap<>(OrderStatus.class);
        map.put(PENDING, EnumSet.of(PAID, CANCELLED, EXPIRED));
        map.put(PAID, EnumSet.of(DISPENSING));
        map.put(DISPENSING, EnumSet.of(DISPENSED, FAILED, UNCERTAIN));
        map.put(DISPENSED, EnumSet.noneOf(OrderStatus.class));
        map.put(FAILED, EnumSet.of(REFUNDED));
        map.put(UNCERTAIN, EnumSet.of(DISPENSED, FAILED));
        map.put(CANCELLED, EnumSet.noneOf(OrderStatus.class));
        map.put(EXPIRED, EnumSet.noneOf(OrderStatus.class));
        map.put(REFUNDED, EnumSet.noneOf(OrderStatus.class));
        // Each set is wrapped as well as the map. Without this a caller could
        // add an entry to the set handed back by allowedNext() and quietly
        // widen the transition table for the whole application.
        map.replaceAll((state, next) -> Collections.unmodifiableSet(next));
        ALLOWED = Collections.unmodifiableMap(map);
    }

    /** The states this one may move to, empty when it is terminal. */
    public Set<OrderStatus> allowedNext() {
        return ALLOWED.get(this);
    }

    public boolean canMoveTo(OrderStatus next) {
        return ALLOWED.get(this).contains(next);
    }

    /** True when no transition leads out of this state. */
    public boolean isTerminal() {
        return ALLOWED.get(this).isEmpty();
    }

    /**
     * True when leaving this state requires a human decision. Only
     * {@code UNCERTAIN} does, and that is BR14.
     */
    public boolean requiresHumanReview() {
        return this == UNCERTAIN;
    }
}
