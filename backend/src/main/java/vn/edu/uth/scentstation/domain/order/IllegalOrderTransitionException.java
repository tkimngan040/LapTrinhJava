package vn.edu.uth.scentstation.domain.order;

import org.springframework.http.HttpStatus;
import vn.edu.uth.scentstation.common.ApiException;

/**
 * Raised when something tries to move an order along a step the state machine
 * does not allow. It surfaces as 409 Conflict: the request was understood, the
 * order simply is not in a state where it can be done.
 */
public class IllegalOrderTransitionException extends ApiException {

    private final transient OrderStatus from;
    private final transient OrderStatus to;

    public IllegalOrderTransitionException(OrderStatus from, OrderStatus to, String why) {
        super(HttpStatus.CONFLICT, "ILLEGAL_ORDER_TRANSITION",
                "Cannot move an order from " + from + " to " + to + ": " + why);
        this.from = from;
        this.to = to;
    }

    public OrderStatus getFrom() {
        return from;
    }

    public OrderStatus getTo() {
        return to;
    }
}
