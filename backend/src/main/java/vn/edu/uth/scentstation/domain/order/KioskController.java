package vn.edu.uth.scentstation.domain.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.MachineRepository;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.MachineSlotRepository;
import vn.edu.uth.scentstation.common.ApiException;

import java.util.ArrayList;
import java.util.List;

/**
 * What the kiosk screen talks to (UC-04, UC-05, UC-06).
 *
 * <p>No sign-in: the customer standing at the machine is anonymous. The brand
 * therefore comes from the machine rather than from a token, which is the
 * second of the two exceptions noted on {@code TenantContext}.
 */
@RestController
@RequestMapping("/api/kiosk")
public class KioskController {

    private final OrderService orderService;
    private final MachineRepository machineRepository;
    private final MachineSlotRepository slotRepository;

    public KioskController(OrderService orderService,
                           MachineRepository machineRepository,
                           MachineSlotRepository slotRepository) {
        this.orderService = orderService;
        this.machineRepository = machineRepository;
        this.slotRepository = slotRepository;
    }

    public record SlotView(int slotNumber, Long productId, String productName,
                           String notes, String imageUrl, long price, boolean available) {
    }

    public record MenuView(String deviceId, String status, List<SlotView> slots) {
    }

    public record CreateOrderRequest(
            @NotBlank String deviceId,
            @Min(1) int slotNumber) {
    }

    public record OrderView(Long orderId, String status, long price, String currency,
                            String qrContent, String expiresAt, String failureReason) {
    }

    /**
     * The fragrances this machine can actually dispense right now.
     *
     * <p>BR3: a slot that is unavailable, has no product or holds no usable
     * bottle is reported as unavailable rather than hidden, so the screen can
     * grey it out instead of silently changing shape.
     */
    @GetMapping("/machines/{deviceId}/menu")
    public MenuView menu(@PathVariable String deviceId) {
        Machine machine = machineRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> ApiException.notFound("MACHINE_NOT_FOUND",
                        "No machine with device id " + deviceId));

        List<SlotView> slots = new ArrayList<>();
        for (MachineSlot slot : slotRepository.findByMachineWithProduct(machine.getId())) {
            if (slot.getProduct() == null) {
                continue;
            }
            boolean sellable = machine.acceptsOrders() && slot.isAvailable();
            slots.add(new SlotView(
                    slot.getSlotNumber(),
                    slot.getProduct().getId(),
                    slot.getProduct().getName(),
                    slot.getProduct().getFragranceNotes(),
                    slot.getProduct().getImageUrl(),
                    slot.effectivePrice(),
                    sellable));
        }

        return new MenuView(machine.getDeviceId(),
                machine.getConnectivityStatus().name(), slots);
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderView> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(request.deviceId(), request.slotNumber());
        return ResponseEntity.status(HttpStatus.CREATED).body(view(order));
    }

    /** The kiosk polls this while the countdown runs (FR3.11, FR4.14). */
    @GetMapping("/orders/{orderId}/status")
    public OrderView status(@PathVariable Long orderId) {
        return view(orderService.require(orderId));
    }

    @PostMapping("/orders/{orderId}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable Long orderId) {
        orderService.cancel(orderId);
        return ResponseEntity.noContent().build();
    }

    private OrderView view(Order order) {
        return new OrderView(
                order.getId(),
                order.getStatus().name(),
                order.getPriceSnapshot(),
                order.getCurrency(),
                // What the kiosk renders as a QR code. A real provider would
                // return a payment URL here; the field shape is the same.
                "scentstation://pay/" + order.getPaymentRef(),
                order.getExpiresAt().toString(),
                order.getFailureReason());
    }
}
