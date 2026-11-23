package vn.edu.uth.scentstation.domain.order;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import vn.edu.uth.scentstation.common.ApiError;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(
        assignableTypes = {
            RefundController.class,
            RefundWebhookController.class,
            OrderReviewController.class,
            SimulatedRefundController.class
        })
public class RecoveryExceptionHandler {
    @ExceptionHandler({BindException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> invalid(Exception e) {
        return ResponseEntity.badRequest()
                .body(
                        ApiError.of(
                                400,
                                "INVALID_RECOVERY_REQUEST",
                                "Invalid order/refund ID or request fields"));
    }
}
