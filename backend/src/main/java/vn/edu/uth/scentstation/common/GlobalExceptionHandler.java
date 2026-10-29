package vn.edu.uth.scentstation.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Turns every exception into the one {@link ApiError} shape.
 *
 * <p>A database constraint violation is reported as 409 Conflict rather than
 * 500: the partial unique indexes of Report section 2.7.4 are business rules,
 * so hitting one is a refused request, not a server fault.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiError.of(ex.getStatus().value(), ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(ApiError.of(400, "VALIDATION_FAILED", detail));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleConstraint(DataIntegrityViolationException ex) {
        String code = constraintCode(ex);
        log.warn("Database constraint rejected the request: {}", code);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of(409, code, messageFor(code)));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.of(403, "FORBIDDEN", "You are not allowed to perform this action"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of(500, "INTERNAL_ERROR", "Unexpected server error"));
    }

    /** Maps a violated index name onto the business rule it enforces. */
    private String constraintCode(DataIntegrityViolationException ex) {
        String text = ex.getMostSpecificCause().getMessage();
        if (text == null) {
            return "CONSTRAINT_VIOLATION";
        }
        String lower = text.toLowerCase();
        if (lower.contains("uq_bottle_active_slot")) {
            return "SLOT_ALREADY_OCCUPIED";
        }
        if (lower.contains("uq_command_active_order")) {
            return "COMMAND_ALREADY_IN_FLIGHT";
        }
        if (lower.contains("uq_payment_provider_ref")) {
            return "PAYMENT_ALREADY_RECORDED";
        }
        if (lower.contains("uq_command_idempotency")) {
            return "RESULT_ALREADY_APPLIED";
        }
        if (lower.contains("uq_slot_number_per_machine")) {
            return "SLOT_NUMBER_TAKEN";
        }
        return "CONSTRAINT_VIOLATION";
    }

    private String messageFor(String code) {
        return switch (code) {
            case "SLOT_ALREADY_OCCUPIED" -> "That slot already holds an installed bottle (BR2)";
            case "COMMAND_ALREADY_IN_FLIGHT" -> "This order already has a dispensing command in flight (BR6)";
            case "PAYMENT_ALREADY_RECORDED" -> "This payment reference was already recorded (NFR3.3)";
            case "RESULT_ALREADY_APPLIED" -> "This command result was already applied (NFR3.4)";
            case "SLOT_NUMBER_TAKEN" -> "That slot number is already used on this machine";
            default -> "The request violates a database constraint";
        };
    }
}
