package vn.edu.uth.scentstation.domain.inventory;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import vn.edu.uth.scentstation.common.ApiError;

import java.util.Locale;

/** Translate inventory constraint races without changing the shared exception handler. */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = InventoryController.class)
public class InventoryExceptionHandler {
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> conflict(DataIntegrityViolationException exception) {
        String detail =
                String.valueOf(exception.getMostSpecificCause().getMessage())
                        .toLowerCase(Locale.ROOT);
        String code = "INVENTORY_CONSTRAINT_VIOLATION";
        String message = "Inventory change conflicts with existing records";
        if (detail.contains("uq_bottle_active_slot")) {
            code = "SLOT_ALREADY_OCCUPIED";
            message = "This slot already holds a bottle";
        } else if (detail.contains("uq_bottle_code")) {
            code = "BOTTLE_CODE_ALREADY_EXISTS";
            message = "Bottle code is already registered";
        } else if (detail.contains("uq_batch_number_per_brand")) {
            code = "BATCH_ALREADY_EXISTS";
            message = "Batch number already exists in this brand";
        }
        return ResponseEntity.status(409).body(ApiError.of(409, code, message));
    }

    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<ApiError> malformed(Exception exception) {
        return ResponseEntity.badRequest()
                .body(
                        ApiError.of(
                                400,
                                "INVALID_REQUEST",
                                "Invalid inventory JSON body or identifier"));
    }
}
