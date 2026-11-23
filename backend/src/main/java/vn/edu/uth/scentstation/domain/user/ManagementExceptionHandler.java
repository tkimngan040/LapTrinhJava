package vn.edu.uth.scentstation.domain.user;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import vn.edu.uth.scentstation.common.ApiError;
import vn.edu.uth.scentstation.domain.brand.BrandController;

/** Preserve the shared error shape for malformed management requests. */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {UserController.class, BrandController.class})
public class ManagementExceptionHandler {
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> invalidRequest(Exception ex) {
        return ResponseEntity.badRequest().body(ApiError.of(400, "INVALID_REQUEST", "Invalid JSON body or identifier"));
    }
}
