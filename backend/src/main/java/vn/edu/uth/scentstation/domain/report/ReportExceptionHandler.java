package vn.edu.uth.scentstation.domain.report;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import vn.edu.uth.scentstation.common.ApiError;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = ReportController.class)
public class ReportExceptionHandler {
    @ExceptionHandler({BindException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> invalid(Exception exception) {
        return ResponseEntity.badRequest()
                .body(
                        ApiError.of(
                                400,
                                "INVALID_REPORT_FILTER",
                                "Invalid report ID, date or query parameter"));
    }
}
