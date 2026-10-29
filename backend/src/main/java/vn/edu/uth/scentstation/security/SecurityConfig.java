package vn.edu.uth.scentstation.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import vn.edu.uth.scentstation.common.ApiError;

import java.util.List;

/**
 * The four security layers of Report section 2.8.4, as far as the web tier is
 * concerned: stateless JWT authentication, BCrypt password hashing, and
 * role-based authorisation at the method level.
 *
 * <p>{@code @EnableMethodSecurity} is what lets services carry
 * {@code @PreAuthorize}, so the rule sits next to the business method it
 * protects rather than in a URL table far away from it.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter, ObjectMapper objectMapper) {
        this.jwtFilter = jwtFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Keeps the JWT filter out of the plain servlet chain.
     *
     * <p>Spring Boot registers any {@code Filter} bean with the servlet
     * container automatically. This one is already placed inside the security
     * chain below, so without this it would be registered twice and would run
     * on requests that never reach Spring Security.
     */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> disableAutoRegistration(
            JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration =
                new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // No cookies and no server session, so CSRF has nothing to protect.
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Signing in, and the kiosk, which has no signed-in user.
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/kiosk/**").permitAll()
                        // The simulated payment provider calls this; it is
                        // protected by its own HMAC signature, not by a token.
                        .requestMatchers(HttpMethod.POST, "/api/payments/webhook").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        // FR1.11 and UC-17: a Viewer reads, and never writes.
                        // Method-level rules then narrow each endpoint further.
                        .requestMatchers(HttpMethod.POST, "/api/**").hasAnyRole(
                                Roles.PLATFORM_SUPER_ADMIN, Roles.BRAND_ADMIN,
                                Roles.OPERATIONS_MANAGER, Roles.TECHNICIAN, Roles.INVENTORY_STAFF)
                        .requestMatchers(HttpMethod.PUT, "/api/**").hasAnyRole(
                                Roles.PLATFORM_SUPER_ADMIN, Roles.BRAND_ADMIN,
                                Roles.OPERATIONS_MANAGER, Roles.TECHNICIAN, Roles.INVENTORY_STAFF)
                        .requestMatchers(HttpMethod.PATCH, "/api/**").hasAnyRole(
                                Roles.PLATFORM_SUPER_ADMIN, Roles.BRAND_ADMIN,
                                Roles.OPERATIONS_MANAGER, Roles.TECHNICIAN, Roles.INVENTORY_STAFF)
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole(
                                Roles.PLATFORM_SUPER_ADMIN, Roles.BRAND_ADMIN)
                        .anyRequest().authenticated())
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, ex) ->
                                writeError(response, 401, "UNAUTHENTICATED",
                                        "A valid access token is required"))
                        .accessDeniedHandler((request, response, ex) ->
                                writeError(response, 403, "FORBIDDEN",
                                        "You are not allowed to perform this action")))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void writeError(jakarta.servlet.http.HttpServletResponse response,
                            int status, String code, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(
                ApiError.of(status, code, message)));
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // The Next.js development server. Tighten this before any deployment.
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
