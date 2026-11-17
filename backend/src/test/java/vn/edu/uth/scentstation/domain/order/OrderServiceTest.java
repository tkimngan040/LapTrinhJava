package vn.edu.uth.scentstation.domain.order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.brand.Brand;
import vn.edu.uth.scentstation.domain.catalog.ConnectionStatus;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.catalog.MachineRepository;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.catalog.MachineSlotRepository;
import vn.edu.uth.scentstation.domain.catalog.OperatingStatus;
import vn.edu.uth.scentstation.domain.catalog.Product;
import vn.edu.uth.scentstation.domain.catalog.ProductStatus;
import vn.edu.uth.scentstation.domain.catalog.SlotStatus;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** UT-07, UT-10, UT-11 and UT-12: unit tests for order creation and expiry. */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final Instant NOW = Instant.parse("2026-01-02T03:04:05Z");

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private MachineRepository machineRepository;
    @Mock
    private MachineSlotRepository slotRepository;

    private ScentStationProperties properties;
    private OrderStateMachine stateMachine;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        properties = new ScentStationProperties();
        properties.getOrder().setTtlSeconds(120);
        stateMachine = new OrderStateMachine();
        orderService = new OrderService(orderRepository, machineRepository, slotRepository,
                stateMachine, properties, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    @DisplayName("UT-07 — create PENDING order and retain the effective price snapshot")
    void createOrderStoresEffectivePriceAndConfiguredExpiry() {
        Machine machine = machine(ConnectionStatus.ONLINE, OperatingStatus.ACTIVE);
        Product product = new Product();
        product.setPricePerSpray(new BigDecimal("12000.00"));
        product.setStatus(ProductStatus.ACTIVE);
        MachineSlot slot = slot(machine, product);
        when(machineRepository.findByDeviceIdentity("device-1")).thenReturn(Optional.of(machine));
        when(slotRepository.findByMachineIdAndSlotNumber(7L, 2)).thenReturn(Optional.of(slot));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order order = orderService.createOrder("device-1", 2);
        product.setPricePerSpray(new BigDecimal("15000.00"));

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(order.getPriceSnapshot()).isEqualByComparingTo("12000.00");
        assertThat(order.getCurrency()).isEqualTo("VND");
        assertThat(order.getExpiresAt()).isEqualTo(NOW.plusSeconds(120));
        assertThat(order.getPaymentRef()).startsWith("SCENT-");
        assertThat(order.getPaymentRef()).hasSize(22);
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("UT-10 — reject order creation when the machine is offline")
    void offlineMachineDoesNotLookUpSlotOrSaveOrder() {
        Machine machine = machine(ConnectionStatus.OFFLINE, OperatingStatus.ACTIVE);
        when(machineRepository.findByDeviceIdentity("device-1")).thenReturn(Optional.of(machine));

        assertMachineUnavailable();
    }

    @Test
    @DisplayName("UT-10 — reject order creation when the machine is under maintenance")
    void maintenanceMachineDoesNotLookUpSlotOrSaveOrder() {
        Machine machine = machine(ConnectionStatus.ONLINE, OperatingStatus.MAINTENANCE);
        when(machineRepository.findByDeviceIdentity("device-1")).thenReturn(Optional.of(machine));

        assertMachineUnavailable();
    }

    @Test
    @DisplayName("UT-11 — reject an unavailable slot without saving an order")
    void unavailableSlotIsRejected() {
        Machine machine = machine(ConnectionStatus.ONLINE, OperatingStatus.ACTIVE);
        MachineSlot slot = slot(machine, activeProduct());
        slot.setStatus(SlotStatus.DISABLED);
        when(machineRepository.findByDeviceIdentity("device-1")).thenReturn(Optional.of(machine));
        when(slotRepository.findByMachineIdAndSlotNumber(7L, 2)).thenReturn(Optional.of(slot));

        assertSlotUnavailable();
    }

    @Test
    @DisplayName("UT-11 — reject a slot with no product without saving an order")
    void slotWithoutProductIsRejected() {
        Machine machine = machine(ConnectionStatus.ONLINE, OperatingStatus.ACTIVE);
        MachineSlot slot = slot(machine, null);
        when(machineRepository.findByDeviceIdentity("device-1")).thenReturn(Optional.of(machine));
        when(slotRepository.findByMachineIdAndSlotNumber(7L, 2)).thenReturn(Optional.of(slot));

        assertSlotUnavailable();
    }

    @Test
    @DisplayName("UT-12 — expire overdue pending orders and persist their reason")
    void expireOverdueOrdersChangesAndSavesEachReturnedOrder() {
        Order first = pendingOrder();
        Order second = pendingOrder();
        when(orderRepository.findByStatusAndExpiresAtBefore(OrderStatus.PENDING, NOW))
                .thenReturn(List.of(first, second));

        int expired = orderService.expireOverdueOrders();

        assertThat(expired).isEqualTo(2);
        for (Order order : List.of(first, second)) {
            assertThat(order.getStatus()).isEqualTo(OrderStatus.EXPIRED);
            assertThat(order.getFailureReason()).isEqualTo("Not paid within the validity window");
            verify(orderRepository).save(order);
        }
    }

    private void assertMachineUnavailable() {
        assertThatThrownBy(() -> orderService.createOrder("device-1", 2))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> assertThat(exception.getCode()).isEqualTo("MACHINE_UNAVAILABLE"));
        verify(slotRepository, never()).findByMachineIdAndSlotNumber(any(), any(Integer.class));
        verify(orderRepository, never()).save(any(Order.class));
    }

    private void assertSlotUnavailable() {
        assertThatThrownBy(() -> orderService.createOrder("device-1", 2))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> assertThat(exception.getCode()).isEqualTo("SLOT_UNAVAILABLE"));
        verify(orderRepository, never()).save(any(Order.class));
    }

    private static Machine machine(ConnectionStatus connection, OperatingStatus operating) {
        Brand brand = new Brand();
        Machine machine = new Machine();
        machine.setId(7L);
        machine.setBrand(brand);
        machine.setDeviceIdentity("device-1");
        machine.setConnectionStatus(connection);
        machine.setOperatingStatus(operating);
        return machine;
    }

    private static MachineSlot slot(Machine machine, Product product) {
        MachineSlot slot = new MachineSlot();
        slot.setId(12L);
        slot.setMachine(machine);
        slot.setProduct(product);
        slot.setSlotNumber(2);
        slot.setStatus(SlotStatus.AVAILABLE);
        return slot;
    }

    private static Product activeProduct() {
        Product product = new Product();
        product.setPricePerSpray(new BigDecimal("12000.00"));
        product.setStatus(ProductStatus.ACTIVE);
        return product;
    }

    private static Order pendingOrder() {
        Order order = new Order();
        order.setStatus(OrderStatus.PENDING);
        order.setExpiresAt(NOW.minusSeconds(1));
        return order;
    }
}
