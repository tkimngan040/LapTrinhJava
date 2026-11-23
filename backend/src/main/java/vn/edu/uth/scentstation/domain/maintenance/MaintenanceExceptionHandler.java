package vn.edu.uth.scentstation.domain.maintenance;

import org.springframework.core.*;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import vn.edu.uth.scentstation.common.ApiError;
import vn.edu.uth.scentstation.domain.alert.AlertController;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {MaintenanceController.class, AlertController.class})
public class MaintenanceExceptionHandler {
    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<ApiError> malformed(Exception exception) {
        return ResponseEntity.badRequest()
                .body(ApiError.of(400, "INVALID_REQUEST", "Invalid alert or maintenance request"));
    }
}
