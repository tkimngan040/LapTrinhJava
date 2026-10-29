package vn.edu.uth.scentstation.domain.order;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * FR3.9: sweeps unpaid orders whose window has closed.
 *
 * <p>A sweep rather than a timer per order: one query every ten seconds costs
 * nothing, while thousands of scheduled tasks would, and being a few seconds
 * late to expire an order harms no one.
 */
@Component
public class OrderExpiryScheduler {

    private final OrderService orderService;

    public OrderExpiryScheduler(OrderService orderService) {
        this.orderService = orderService;
    }

    @Scheduled(fixedDelayString = "PT10S")
    public void expireOverdueOrders() {
        orderService.expireOverdueOrders();
    }
}
