package vn.edu.uth.scentstation.common;

import java.time.Instant;

/**
 * The single error shape every endpoint returns, as agreed in
 * docs/api-contract.md.
 */
public record ApiError(Instant timestamp, int status, String code, String message) {

    public static ApiError of(int status, String code, String message) {
        return new ApiError(Instant.now(), status, code, message);
    }
}
