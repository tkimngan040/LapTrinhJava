package vn.edu.uth.scentstation.domain.dispensing;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.inventory.InventoryService;
import vn.edu.uth.scentstation.domain.order.Order;
import vn.edu.uth.scentstation.domain.order.OrderRepository;
import vn.edu.uth.scentstation.domain.order.OrderStateMachine;
import vn.edu.uth.scentstation.domain.order.OrderStatus;
import vn.edu.uth.scentstation.iot.DeviceGateway;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** UT-13 and UT-14: unit tests for command authorization and result idempotency. */
@ExtendWith(MockitoExtension.class)
class DispenseServiceTest {

    @Mock
    private DispenseCommandRepository commandRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private InventoryService inventoryService;
    @Mock
    private DeviceGateway deviceGateway;

    @Test
    @DisplayName("UT-13 — refuse to issue a command for an unpaid order")
    void commandIsNotPersistedOrPublishedBeforePayment() {
        ScentStationProperties properties = properties();
        DispenseService service = service(properties);
        Order order = new Order();
        order.setStatus(OrderStatus.PENDING);

        assertThatThrownBy(() -> service.issueCommand(order))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> assertThat(exception.getCode()).isEqualTo("ORDER_NOT_PAID"));

        verify(commandRepository, never()).saveAndFlush(any(DispenseCommand.class));
        verify(deviceGateway, never()).publishCommand(any(), any());
    }

    @Test
    @DisplayName("UT-14 — ignore a repeated successful result for an already completed command")
    void terminalCommandDoesNotDeductStockOrChangeCompletedOrderAgain() {
        DispenseService service = service(properties());
        Order order = new Order();
        order.setStatus(OrderStatus.DISPENSED);
        DispenseCommand command = new DispenseCommand();
        command.setIdempotencyKey("key-1");
        command.setStatus(CommandStatus.SUCCEEDED);
        command.setOrder(order);
        when(commandRepository.findByIdempotencyKey("key-1")).thenReturn(Optional.of(command));

        service.applyResult("key-1", true, null, null);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.DISPENSED);
        verify(inventoryService, never()).deductForCommand(any(DispenseCommand.class));
        verify(commandRepository, never()).save(any(DispenseCommand.class));
        verify(orderRepository, never()).save(any(Order.class));
    }

    private DispenseService service(ScentStationProperties properties) {
        return new DispenseService(commandRepository, orderRepository, new OrderStateMachine(),
                inventoryService, deviceGateway, properties,
                Clock.fixed(Instant.parse("2026-01-02T03:04:05Z"), ZoneOffset.UTC));
    }

    private static ScentStationProperties properties() {
        ScentStationProperties properties = new ScentStationProperties();
        properties.getMqtt().setCommandSecret("unit-test-command-secret-long-enough");
        return properties;
    }
}
