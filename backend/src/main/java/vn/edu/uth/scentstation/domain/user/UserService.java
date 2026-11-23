package vn.edu.uth.scentstation.domain.user;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.brand.*;
import vn.edu.uth.scentstation.domain.audit.*;
import vn.edu.uth.scentstation.security.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@Transactional
@PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN')")
public class UserService {
    private static final Set<String> STAFF =
            Set.of(Roles.OPERATIONS_MANAGER, Roles.TECHNICIAN, Roles.INVENTORY_STAFF, Roles.VIEWER);
    private final UserRepository users;
    private final RoleRepository roles;
    private final BrandRepository brands;
    private final PasswordEncoder encoder;
    private final AuthService auth;
    @PersistenceContext private EntityManager em;

    public UserService(
            UserRepository users,
            RoleRepository roles,
            BrandRepository brands,
            PasswordEncoder encoder,
            AuthService auth) {
        this.users = users;
        this.roles = roles;
        this.brands = brands;
        this.encoder = encoder;
        this.auth = auth;
    }

    public record CreateBrandAdminRequest(
            @NotNull @Positive Long brandId,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Size(max = 60) String password) {}

    public record CreateUserRequest(
            @Positive Long brandId,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Size(max = 60) String password,
            @NotEmpty Set<@NotBlank String> roles) {}

    public record UpdateUserRequest(
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(max = 120) String fullName) {}

    public record PasswordRequest(@NotBlank @Size(max = 60) String password) {}

    public record RolesRequest(@NotEmpty Set<@NotBlank String> roles) {}

    public record UserResponse(
            Long id,
            String email,
            String fullName,
            Long brandId,
            UserStatus status,
            Set<String> roles) {}

    @PreAuthorize("hasRole('PLATFORM_SUPER_ADMIN')")
    @Auditable(action="BRAND_ADMIN_CREATED",target=AuditTarget.USER,id="",resultId="#result.id")
    public UserResponse createBrandAdmin(CreateBrandAdminRequest r) {
        return create(
                r.email(),
                r.fullName(),
                r.password(),
                requireBrand(r.brandId()),
                resolveRoles(Set.of(Roles.BRAND_ADMIN), true));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers(AuthenticatedUser p) {
        checkAdmin(p);
        // User has no @Filter: tenant scope must be explicit here and in target().
        var q =
                em.createQuery(
                        "select u from User u"
                                + (p.isPlatformAdmin() ? "" : " where u.brand.id = :brand")
                                + " order by u.id",
                        User.class);
        if (!p.isPlatformAdmin()) q.setParameter("brand", p.brandId());
        return q.getResultList().stream()
                .filter(
                        u ->
                                p.isPlatformAdmin()
                                        || !u.roleNames().contains(Roles.PLATFORM_SUPER_ADMIN))
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse detail(Long id, AuthenticatedUser p) {
        return response(target(id, p, false));
    }

    @Auditable(action="USER_CREATED",target=AuditTarget.USER,id="",resultId="#result.id")
    public UserResponse createUser(CreateUserRequest r, AuthenticatedUser p) {
        checkAdmin(p);
        Set<Role> assigned = resolveRoles(r.roles(), p.isPlatformAdmin());
        Long brandId = p.isPlatformAdmin() ? r.brandId() : p.brandId();
        if (!p.isPlatformAdmin() && r.brandId() != null && !r.brandId().equals(p.brandId()))
            throw ApiException.forbidden(
                    "BRAND_SCOPE_DENIED", "Cannot create users for another brand");
        boolean platform = r.roles().contains(Roles.PLATFORM_SUPER_ADMIN);
        if (platform && (brandId != null || r.roles().size() != 1))
            throw ApiException.badRequest(
                    "INVALID_PLATFORM_SCOPE", "PSA requires null brand and only PSA role");
        return create(
                r.email(),
                r.fullName(),
                r.password(),
                platform ? null : requireBrand(brandId),
                assigned);
    }

    @Auditable(action="USER_PROFILE_CHANGED",target=AuditTarget.USER)
    public UserResponse update(Long id, UpdateUserRequest r, AuthenticatedUser p) {
        User u = target(id, p, true);
        String fullName = normalizeFullName(r.fullName());
        u.setEmail(uniqueEmail(r.email(), id));
        u.setFullName(fullName);
        return response(u);
    }

    @Auditable(action="USER_STATUS_CHANGED",target=AuditTarget.USER)
    public UserResponse changeStatus(Long id, UserStatus status, AuthenticatedUser p) {
        User u = target(id, p, true);
        if (Objects.equals(id, p.userId()))
            throw ApiException.forbidden(
                    "SELF_ADMIN_CHANGE", "Cannot change own administrative status");
        if (status == null)
            throw ApiException.badRequest("INVALID_USER_STATUS", "Account status is required");
        u.setStatus(status);
        if (status != UserStatus.ACTIVE) auth.revokeAllSessions(id);
        return response(u);
    }

    @Auditable(action="USER_PASSWORD_RESET",target=AuditTarget.USER,always=true)
    public UserResponse resetPassword(Long id, PasswordRequest r, AuthenticatedUser p) {
        User u = target(id, p, true);
        validatePassword(r.password());
        u.setPasswordHash(encoder.encode(r.password()));
        auth.revokeAllSessions(id);
        return response(u);
    }

    @Auditable(action="USER_ROLES_CHANGED",target=AuditTarget.USER)
    public UserResponse changeRoles(Long id, RolesRequest r, AuthenticatedUser p) {
        User u = target(id, p, true);
        if (Objects.equals(id, p.userId()))
            throw ApiException.forbidden(
                    "SELF_ADMIN_CHANGE", "Cannot change own administrative roles");
        Set<Role> assigned = resolveRoles(r.roles(), p.isPlatformAdmin());
        if (r.roles().contains(Roles.PLATFORM_SUPER_ADMIN)) {
            if (u.brandId() != null || r.roles().size() != 1)
                throw ApiException.badRequest(
                        "INVALID_PLATFORM_SCOPE", "Cannot grant PSA to brand accounts");
        } else if (u.brandId() == null)
            throw ApiException.badRequest("BRAND_REQUIRED", "Brand roles require a brand");
        // Long's existing API increments token_version in this same transaction.
        u.setRoles(assigned);
        auth.revokeAllSessions(id);
        return response(u);
    }

    private UserResponse create(
            String email, String name, String password, Brand brand, Set<Role> assigned) {
        validatePassword(password);
        String fullName = normalizeFullName(name);
        User u = new User();
        u.setEmail(uniqueEmail(email, null));
        u.setFullName(fullName);
        u.setPasswordHash(encoder.encode(password));
        u.setBrand(brand);
        u.setRoles(assigned);
        u.setStatus(UserStatus.ACTIVE);
        u.setTokenVersion(0);
        return response(users.saveAndFlush(u));
    }

    private void checkAdmin(AuthenticatedUser p) {
        if (p == null
                || (!p.isPlatformAdmin()
                        && (!p.roles().contains(Roles.BRAND_ADMIN) || p.brandId() == null)))
            throw ApiException.forbidden(
                    "ADMIN_SCOPE_REQUIRED", "Administrator requires valid brand scope");
    }

    private User target(Long id, AuthenticatedUser p, boolean write) {
        checkAdmin(p);
        var q =
                em.createQuery(
                                "select u from User u where u.id = :id"
                                        + (p.isPlatformAdmin() ? "" : " and u.brand.id = :brand"),
                                User.class)
                        .setParameter("id", id);
        if (!p.isPlatformAdmin()) q.setParameter("brand", p.brandId());
        // Account updates and token revocation share this row lock and transaction.
        if (write) q.setLockMode(LockModeType.PESSIMISTIC_WRITE);
        User u =
                q.getResultStream()
                        .findFirst()
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "USER_NOT_FOUND",
                                                "No account in the permitted scope"));
        if (!p.isPlatformAdmin()
                && (u.roleNames().contains(Roles.PLATFORM_SUPER_ADMIN)
                        || (write && u.roleNames().contains(Roles.BRAND_ADMIN))))
            throw ApiException.forbidden("ROLE_SCOPE_DENIED", "BA can manage staff accounts only");
        return u;
    }

    private Set<Role> resolveRoles(Set<String> names, boolean platform) {
        if (names == null || names.isEmpty())
            throw ApiException.badRequest("INVALID_ROLE", "At least one role is required");
        Set<Role> result = new LinkedHashSet<>();
        for (String name : names) {
            if (name == null || name.isBlank())
                throw ApiException.badRequest("INVALID_ROLE", "Role name is required");
            if (!platform && !STAFF.contains(name))
                throw ApiException.forbidden("ROLE_SCOPE_DENIED", "Role outside BA authority");
            result.add(
                    roles.findByRoleName(name)
                            .orElseThrow(
                                    () ->
                                            ApiException.badRequest(
                                                    "INVALID_ROLE", "Unknown role: " + name)));
        }
        return result;
    }

    private Brand requireBrand(Long id) {
        if (id == null) throw ApiException.badRequest("BRAND_REQUIRED", "Brand is required");
        return brands.findById(id)
                .orElseThrow(() -> ApiException.notFound("BRAND_NOT_FOUND", "No such brand"));
    }

    private String uniqueEmail(String email, Long id) {
        if (email == null || email.isBlank() || email.length() > 160)
            throw ApiException.badRequest(
                    "INVALID_EMAIL", "Email is required and must not exceed 160 characters");
        String normalized = email.strip().toLowerCase(Locale.ROOT);
        // Serialise case-insensitive uniqueness checks without changing the shared schema.
        em.createNativeQuery("select pg_advisory_xact_lock(731002)").getSingleResult();
        users.findByEmailIgnoreCase(normalized)
                .filter(u -> !Objects.equals(u.getId(), id))
                .ifPresent(
                        u -> {
                            throw ApiException.conflict(
                                    "EMAIL_ALREADY_EXISTS", "Email already used");
                        });
        return normalized;
    }

    private String normalizeFullName(String name) {
        if (name == null || name.isBlank() || name.strip().length() > 120)
            throw ApiException.badRequest(
                    "INVALID_FULL_NAME",
                    "Full name is required and must not exceed 120 characters");
        return name.strip();
    }

    private void validatePassword(String password) {
        if (password == null
                || password.isBlank()
                || password.length() > 60
                || password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw ApiException.badRequest(
                    "INVALID_PASSWORD",
                    "Password must be nonblank, at most 60 characters and 72 UTF-8 bytes");
    }

    private UserResponse response(User u) {
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.brandId(),
                u.getStatus(),
                u.roleNames());
    }
}
