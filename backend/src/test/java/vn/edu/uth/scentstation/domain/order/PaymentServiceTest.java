package vn.edu.uth.scentstation.domain.order;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.dispensing.DispenseService;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** UT-16: provider amount validation happens before payment persistence or dispensing. */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private OrderService orderService;
    @Mock
    private DispenseService dispenseService;

    @Test
    @DisplayName("UT-16 — reject a payment amount that differs from the order snapshot")
    void amountMismatchHasNoPaymentOrDispenseSideEffect() {
        PaymentService service = new PaymentService(orderRepository, paymentRepository,
                orderService, dispenseService,
                Clock.fixed(Instant.parse("2026-01-02T03:04:05Z"), ZoneOffset.UTC));
        Order order = new Order();
        order.setPriceSnapshot(new BigDecimal("12000.00"));
        order.setCurrency("VND");
        when(paymentRepository.existsByProviderReference("provider-1")).thenReturn(false);
        when(orderRepository.findByPaymentRef("SCENT-REFERENCE"))
                .thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.recordSuccessfulPayment(
                "QR", "provider-1", "SCENT-REFERENCE", new BigDecimal("11000.00"), "VND"))
                .isInstanceOfSatisfying(ApiException.class,
                        exception -> org.assertj.core.api.Assertions.assertThat(exception.getCode())
                                .isEqualTo("AMOUNT_MISMATCH"));

        verify(paymentRepository, never()).save(any(Payment.class));
        verify(paymentRepository, never()).flush();
        verify(orderService, never()).confirmPayment(any(Order.class));
        verify(dispenseService, never()).issueCommand(any(Order.class));
    }
}
