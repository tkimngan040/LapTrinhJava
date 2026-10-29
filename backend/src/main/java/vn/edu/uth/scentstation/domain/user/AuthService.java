package vn.edu.uth.scentstation.domain.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.security.JwtService;

import java.util.Optional;

/** Checks credentials and issues tokens (UC-00, FR1.3). */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public AuthController.LoginResponse login(String email, String rawPassword) {
        Optional<User> found = userRepository.findByEmailIgnoreCase(email);

        // The same error for an unknown address and a wrong password, so the
        // response cannot be used to find out which accounts exist.
        User user = found.orElseThrow(AuthService::invalidCredentials);

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            log.info("Failed sign-in for {}", email);
            throw invalidCredentials();
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED",
                    "This account is locked. Contact your administrator.");
        }
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED",
                    "This account has been disabled.");
        }

        log.info("User {} signed in", user.getId());
        return new AuthController.LoginResponse(jwtService.issue(user), summary(user));
    }

    @Transactional(readOnly = true)
    public AuthController.UserSummary describe(Long userId) {
        return userRepository.findById(userId)
                .map(this::summary)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "No such account"));
    }

    /**
     * FR1.8: raises the account's token version, which invalidates every token
     * already issued to it. Called when an account is locked, disabled, or has
     * its roles changed.
     */
    @Transactional
    public void revokeAllSessions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "No such account"));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        log.info("All sessions revoked for user {} (token version now {})",
                userId, user.getTokenVersion());
    }

    private AuthController.UserSummary summary(User user) {
        return new AuthController.UserSummary(
                user.getId(), user.getFullName(), user.getEmail(),
                user.brandId(), user.roleNames());
    }

    private static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                "Email address or password is incorrect");
    }
}
