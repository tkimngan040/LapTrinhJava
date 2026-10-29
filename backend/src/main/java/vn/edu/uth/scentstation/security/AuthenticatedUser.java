package vn.edu.uth.scentstation.security;

import java.util.Set;

/**
 * Who is making the current request, as resolved from the access token.
 *
 * <p>{@code brandId} is null for a Platform Super Administrator, who is scoped
 * to the whole platform rather than to one brand.
 */
public record AuthenticatedUser(Long userId, Long brandId, String email, Set<String> roles) {

    public boolean isPlatformAdmin() {
        return roles.contains(Roles.PLATFORM_SUPER_ADMIN);
    }
}
