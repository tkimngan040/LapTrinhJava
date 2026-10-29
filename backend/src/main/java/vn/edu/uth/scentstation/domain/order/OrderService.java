package vn.edu.uth.scentstation.domain.order;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.MachineRepository;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.MachineSlotRepository;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Creating an order and moving it through the part of its life that happens
 * before the device is involved (Report section 2.9.3, steps 1 to 5).
 *
 * <p>Two rules are enforced here and nowhere else:
 * <ul>
 *   <li>BR4 — the price is copied onto the order at creation, so a later
 *       catalogue change never reaches an order that already exists;</li>
 *   <li>BR5 — only {@link #confirmPayment} marks an order paid, and it is
 *       reachable only from the verified provider webhook. Nothing the kiosk
 *       displays is ever treated as proof of payment.</li>
 * </ul>
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final MachineRepository machineRepository;
    private final MachineSlotRepository slotRepository;
    private final OrderStateMachine stateMachine;
    private final ScentStationProperties properties;
    private final Clock clock;

    public OrderService(OrderRepository orderRepository,
                        MachineRepository machineRepository,
                        MachineSlotRepository slotRepository,
                        OrderStateMachine stateMachine,
                        ScentStationProperties properties,
                        Clock clock) {
        this.orderRepository = orderRepository;
        this.machineRepository = machineRepository;
        this.slotRepository = slotRepository;
        this.stateMachine = stateMachine;
        this.properties = properties;
        this.clock = clock;
    }

    /**
     * Creates a PENDING order for one slot of one machine.
     *
     * <p>Refuses when the machine cannot currently accept orders (BR3, BR9) or
     * when the slot is not available, so a customer never pays for a spray that
     * was never going to happen.
     */
    @Transactional
    public Order createOrder(String deviceId, int slotNumber) {
        Machine machine = machineRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> ApiException.notFound("MACHINE_NOT_FOUND",
                        "No machine with device id " + deviceId));

        if (!machine.acceptsOrders()) {
            // BR9: no new orders while the machine cannot talk to the backend,
            // and none while it is in maintenance or disabled.
            throw ApiException.conflict("MACHINE_UNAVAILABLE",
                    "This machine is not accepting orders right now");
        }

        MachineSlot slot = slotRepository
                .findByMachineIdAndSlotNumber(machine.getId(), slotNumber)
                .orElseThrow(() -> ApiException.notFound("SLOT_NOT_FOUND",
                        "Machine " + deviceId + " has no slot " + slotNumber));

        if (!slot.isAvailable() || slot.getProduct() == null) {
            // BR3: only an available product in an operational machine is sellable.
            throw ApiException.conflict("SLOT_UNAVAILABLE",
                    "That fragrance is not available on this machine");
        }

        Instant now = clock.instant();
        Order order = new Order();
        order.setBrand(machine.getBrand());
        order.setMachine(machine);
        order.setSlot(slot);
        order.setProduct(slot.getProduct());
        order.setStatus(OrderStatus.PENDING);
        // BR4: the price is fixed here, by value.
        order.setPriceSnapshot(slot.effectivePrice());
        order.setCurrency("VND");
        order.setPaymentRef(newPaymentReference());
        order.setExpiresAt(now.plusSeconds(properties.getOrder().getTtlSeconds()));

        Order saved = orderRepository.save(order);
        log.info("Order {} created on {} slot {} at {} VND",
                saved.getId(), deviceId, slotNumber, saved.getPriceSnapshot());
        return saved;
    }

    /**
     * Marks an order paid. Called only from the payment webhook after its
     * signature, reference, amount and currency have been verified (FR3.7).
     *
     * <p>Package-private on purpose: no controller and no kiosk endpoint can
     * reach it, which is how BR5 is kept structural rather than a convention.
     *
     * <p>No {@code @Transactional} here, and that is deliberate rather than an
     * oversight: Spring's proxies do not advise package-private methods, so
     * the annotation would have looked like a guarantee while doing nothing.
     * The only caller is {@code PaymentService}, whose own transaction this
     * runs inside.
     */
    void confirmPayment(Order order) {
        if (clock.instant().isAfter(order.getExpiresAt())) {
            stateMachine.transition(order, OrderStatus.EXPIRED,
                    "Payment arrived after the order had expired");
            orderRepository.save(order);
            throw ApiException.conflict("ORDER_EXPIRED",
                    "This order expired before the payment was confirmed");
        }
        stateMachine.transition(order, OrderStatus.PAID);
        orderRepository.save(order);
    }

    @Transactional
    public void cancel(Long orderId) {
        Order order = require(orderId);
        stateMachine.transition(order, OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    /**
     * FR3.9: unpaid orders past their window become EXPIRED.
     *
     * <p>Runs every ten seconds rather than on a timer per order: one query is
     * cheaper than thousands of scheduled tasks, and a few seconds of lateness
     * costs nothing here.
     */
    @Transactional
    public int expireOverdueOrders() {
        List<Order> overdue = orderRepository
                .findByStatusAndExpiresAtBefore(OrderStatus.PENDING, clock.instant());
        for (Order order : overdue) {
            stateMachine.transition(order, OrderStatus.EXPIRED,
                    "Not paid within the validity window");
            orderRepository.save(order);
        }
        if (!overdue.isEmpty()) {
            log.info("Expired {} unpaid order(s)", overdue.size());
        }
        return overdue.size();
    }

    @Transactional(readOnly = true)
    public Order require(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("ORDER_NOT_FOUND", "No such order"));
    }

    /**
     * The reference the customer's payment is matched against. Random rather
     * than sequential so one reference cannot be guessed from another.
     */
    private String newPaymentReference() {
        return "SCENT-" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 16).toUpperCase();
    }
}
