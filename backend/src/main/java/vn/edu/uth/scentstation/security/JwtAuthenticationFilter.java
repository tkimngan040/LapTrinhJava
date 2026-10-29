package vn.edu.uth.scentstation.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.uth.scentstation.domain.user.User;
import vn.edu.uth.scentstation.domain.user.UserRepository;
import vn.edu.uth.scentstation.domain.user.UserStatus;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Reads the bearer token on every request, checks it, and publishes who the
 * caller is into both Spring Security and {@link TenantContext}.
 *
 * <p>Three things are checked, in this order: the signature and expiry, then
 * that the account is still ACTIVE, then that the {@code tokenVersion} claim
 * still matches the account. The third check is FR1.8 — it is what makes
 * "lock the account" take effect immediately instead of at the next expiry.
 *
 * <p>The account lookup costs one query per request. That is the price of
 * revocation without server-side sessions, and it is a deliberate trade
 * (Report section 2.7.2).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            authenticate(request);
            chain.doFilter(request, response);
        } finally {
            // Threads are pooled: a brand left behind here would be inherited
            // by the next request on this thread.
            TenantContext.clear();
        }
    }

    private void authenticate(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER)) {
            return;
        }

        String token = header.substring(BEARER.length()).trim();
        Claims claims;
        try {
            claims = jwtService.parse(token);
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Rejected token: {}", ex.getMessage());
            return;
        }

        Optional<User> found = userRepository.findById(jwtService.userId(claims));
        if (found.isEmpty()) {
            return;
        }
        User user = found.get();

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.debug("Rejected token for user {}: account is {}", user.getId(), user.getStatus());
            return;
        }

        // FR1.8: a token minted before the account changed no longer matches.
        if (jwtService.tokenVersion(claims) != user.getTokenVersion()) {
            log.debug("Rejected token for user {}: token version {} but account is at {}",
                    user.getId(), jwtService.tokenVersion(claims), user.getTokenVersion());
            return;
        }

        Set<String> roles = user.roleNames();
        List<SimpleGrantedAuthority> authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority(Roles.authority(role)))
                .collect(Collectors.toList());

        AuthenticatedUser principal =
                new AuthenticatedUser(user.getId(), user.brandId(), user.getEmail(), roles);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        if (principal.isPlatformAdmin()) {
            TenantContext.setPlatformScope();
        } else if (principal.brandId() != null) {
            TenantContext.setBrandId(principal.brandId());
        }
    }
}
