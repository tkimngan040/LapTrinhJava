package vn.edu.uth.scentstation.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.user.User;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Issues and validates the stateless access token.
 *
 * <p>The token carries {@code tokenVersion}. Every request compares that claim
 * with the value stored on the account, and a mismatch is rejected. Locking an
 * account or changing its roles increments the stored value, which kills every
 * token already issued without the server keeping any session state. That is
 * FR1.8, and it is the detail worth pointing at in the report.
 */
@Service
public class JwtService {

    public static final String CLAIM_BRAND_ID = "brandId";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_TOKEN_VERSION = "tokenVersion";

    private final SecretKey key;
    private final long ttlMinutes;
    private final Clock clock;

    public JwtService(ScentStationProperties properties, Clock clock) {
        String secret = properties.getSecurity().getJwtSecret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "scentstation.security.jwt-secret must be at least 32 bytes for HMAC-SHA256");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMinutes = properties.getSecurity().getJwtTtlMinutes();
        this.clock = clock;
    }

    /** Signs a token for an account that has just authenticated. */
    public String issue(User user) {
        Instant now = clock.instant();
        Instant expiry = now.plusSeconds(ttlMinutes * 60);

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim(CLAIM_BRAND_ID, user.brandId())
                .claim(CLAIM_ROLES, List.copyOf(user.roleNames()))
                .claim(CLAIM_TOKEN_VERSION, user.getTokenVersion())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    /**
     * Verifies the signature and expiry and returns the claims.
     *
     * @throws JwtException when the token is malformed, tampered with or expired
     */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .clock(() -> Date.from(clock.instant()))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long userId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public Long brandId(Claims claims) {
        Number value = claims.get(CLAIM_BRAND_ID, Number.class);
        return value == null ? null : value.longValue();
    }

    public int tokenVersion(Claims claims) {
        Number value = claims.get(CLAIM_TOKEN_VERSION, Number.class);
        return value == null ? -1 : value.intValue();
    }

    @SuppressWarnings("unchecked")
    public List<String> roles(Claims claims) {
        Object value = claims.get(CLAIM_ROLES);
        return value instanceof List<?> list ? (List<String>) list : List.of();
    }
}
