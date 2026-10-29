package vn.edu.uth.scentstation.domain.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

/** Sign in, sign out, and "who am I" (UC-00). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record LoginRequest(
            @NotBlank @Email String username,
            @NotBlank String password) {
    }

    public record UserSummary(Long id, String fullName, String email, Long brandId,
                              java.util.Set<String> roles) {
    }

    public record LoginResponse(String token, UserSummary user) {
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.username(), request.password());
    }

    /**
     * Signing out is a client-side discard of the token. The endpoint exists so
     * the frontend has one call to make, and so the action can be audited.
     * To revoke a token before it expires, increment the account's
     * token_version instead (FR1.8).
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserSummary me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.describe(principal.userId());
    }
}
