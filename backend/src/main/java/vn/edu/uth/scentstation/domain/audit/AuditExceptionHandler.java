package vn.edu.uth.scentstation.domain.audit;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import vn.edu.uth.scentstation.common.ApiError;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {AuditController.class})
public class AuditExceptionHandler {
    @ExceptionHandler({BindException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> invalid(Exception e) {
        return ResponseEntity.badRequest()
                .body(
                        ApiError.of(
                                400,
                                "INVALID_AUDIT_FILTER",
                                "Invalid audit ID, date, page, size or filter"));
    }
}
