package vn.edu.uth.scentstation.domain.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionTemplate;

import vn.edu.uth.scentstation.common.GlobalExceptionHandler;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.brand.*;
import vn.edu.uth.scentstation.security.*;

import java.time.Clock;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Uses the real security chain, JWTs, transactions and PostgreSQL queries. Set SCENT_A2_TEST_DB_URL
 * to an EMPTY, DISPOSABLE PostgreSQL database; Flyway applies the project migrations and fixtures
 * are retained there for inspection. Optional credentials: SCENT_A2_TEST_DB_USER /
 * SCENT_A2_TEST_DB_PASSWORD (default postgres/empty). No MQTT broker or changes to Long's security
 * package are needed.
 */
@EnabledIfEnvironmentVariable(named = "SCENT_A2_TEST_DB_URL", matches = ".+")
@SpringBootTest(classes = UserManagementIntegrationTest.TestApplication.class)
@AutoConfigureMockMvc
class UserManagementIntegrationTest {

    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration
    @EntityScan("vn.edu.uth.scentstation.domain")
    @EnableJpaRepositories(basePackageClasses = {UserRepository.class, BrandRepository.class})
    @EnableConfigurationProperties(ScentStationProperties.class)
    @Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtService.class,
        TenantFilterAspect.class,
        AuthService.class,
        AuthController.class,
        UserService.class,
        UserController.class,
        BrandService.class,
        BrandController.class,
        GlobalExceptionHandler.class
    })
    static class TestApplication {
        @Bean
        Clock clock() {
            return Clock.systemUTC();
        }
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> System.getenv("SCENT_A2_TEST_DB_URL"));
        properties.add(
                "spring.datasource.username",
                () -> System.getenv().getOrDefault("SCENT_A2_TEST_DB_USER", "postgres"));
        properties.add(
                "spring.datasource.password",
                () -> System.getenv().getOrDefault("SCENT_A2_TEST_DB_PASSWORD", ""));
        properties.add(
                "scentstation.security.jwt-secret",
                () -> "a2-integration-test-secret-at-least-32-bytes");
    }

    private static final String PASSWORD = "A2-test-password";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired BrandRepository brands;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;

    private String suffix;
    private Brand brandA;
    private Brand brandB;
    private User psa;
    private User adminA;
    private User staffA;
    private User staffB;
    private String psaToken;
    private String adminToken;
    private String staffToken;

    @BeforeEach
    void fixtures() {
        suffix = UUID.randomUUID().toString();
        String hash = encoder.encode(PASSWORD);
        new TransactionTemplate(transactionManager)
                .executeWithoutResult(
                        ignored -> {
                            brandA = brand("A-" + suffix);
                            brandB = brand("B-" + suffix);
                            psa = account("psa", null, Roles.PLATFORM_SUPER_ADMIN, hash);
                            adminA = account("admin", brandA, Roles.BRAND_ADMIN, hash);
                            staffA = account("staff-a", brandA, Roles.VIEWER, hash);
                            staffB = account("staff-b", brandB, Roles.TECHNICIAN, hash);
                            psaToken = jwt.issue(psa);
                            adminToken = jwt.issue(adminA);
                            staffToken = jwt.issue(staffA);
                        });
    }

    @Test
    void brandAdminListsOnlyOwnBrandAndCannotReadAnotherBrandById() throws Exception {
        call("GET", "/api/users", adminToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].brandId", everyItem(is(brandA.getId().intValue()))))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
        call("GET", "/api/users/" + staffB.getId(), adminToken, null)
                .andExpect(status().isNotFound());
        call("GET", "/api/users/" + staffB.getId(), psaToken, null).andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"update", "lock", "unlock", "deactivate", "password", "roles"})
    void everyWriteRejectsAnotherBrandWithoutChangingIt(String action) throws Exception {
        String path = "/api/users/" + staffB.getId();
        Object body =
                switch (action) {
                    case "update" ->
                            Map.of(
                                    "email",
                                    "changed-" + suffix + "@example.com",
                                    "fullName",
                                    "Changed");
                    case "password" -> Map.of("password", "New-test-password");
                    case "roles" -> Map.of("roles", Set.of(Roles.VIEWER));
                    default -> null;
                };
        call(
                        action.equals("update") ? "PUT" : "PATCH",
                        path + (action.equals("update") ? "" : "/" + action),
                        adminToken,
                        body)
                .andExpect(status().isNotFound());
        User unchanged = users.findById(staffB.getId()).orElseThrow();
        assertThat(unchanged.getEmail()).isEqualTo(staffB.getEmail());
        assertThat(unchanged.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(unchanged.getTokenVersion()).isZero();
        assertThat(unchanged.roleNames()).containsExactly(Roles.TECHNICIAN);
        assertThat(encoder.matches(PASSWORD, unchanged.getPasswordHash())).isTrue();
    }

    @Test
    void createsStaffInOwnBrandAndPreventsTenantOverrideOrRoleEscalation() throws Exception {
        call("POST", "/api/users", adminToken, createBody(null, Roles.TECHNICIAN))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.brandId").value(brandA.getId()))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        call("POST", "/api/users", adminToken, createBody(brandB.getId(), Roles.VIEWER))
                .andExpect(status().isForbidden());
        call("POST", "/api/users", adminToken, createBody(null, Roles.BRAND_ADMIN))
                .andExpect(status().isForbidden());
        call(
                        "PATCH",
                        "/api/users/" + staffA.getId() + "/roles",
                        adminToken,
                        Map.of("roles", Set.of(Roles.PLATFORM_SUPER_ADMIN)))
                .andExpect(status().isForbidden());
        call("PATCH", "/api/users/" + adminA.getId() + "/lock", adminToken, null)
                .andExpect(status().isForbidden());
    }

    @Test
    void onlyPsaProvisionsBrandAdmins() throws Exception {
        Object body = createBody(brandB.getId(), Roles.VIEWER);
        call("POST", "/api/users/brand-admin", adminToken, body).andExpect(status().isForbidden());
        call("POST", "/api/users/brand-admin", psaToken, body)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.brandId").value(brandB.getId()))
                .andExpect(jsonPath("$.roles[0]").value(Roles.BRAND_ADMIN));
    }

    @ParameterizedTest
    @ValueSource(strings = {"lock", "deactivate", "roles", "password"})
    void administrativeChangesRevokeEveryOldTokenEvenAfterUnlock(String action) throws Exception {
        call("GET", "/api/auth/me", staffToken, null).andExpect(status().isOk());
        String secondToken = login(staffA.getEmail(), PASSWORD);
        Object body =
                switch (action) {
                    case "roles" -> Map.of("roles", Set.of(Roles.TECHNICIAN));
                    case "password" -> Map.of("password", "New-test-password");
                    default -> null;
                };
        call("PATCH", "/api/users/" + staffA.getId() + "/" + action, adminToken, body)
                .andExpect(status().isOk());
        assertThat(users.findById(staffA.getId()).orElseThrow().getTokenVersion()).isEqualTo(1);
        call("GET", "/api/auth/me", staffToken, null).andExpect(status().isUnauthorized());
        call("GET", "/api/auth/me", secondToken, null).andExpect(status().isUnauthorized());
        if (action.equals("lock") || action.equals("deactivate")) {
            call(
                            "POST",
                            "/api/auth/login",
                            null,
                            Map.of("username", staffA.getEmail(), "password", PASSWORD))
                    .andExpect(status().isForbidden());
            call("PATCH", "/api/users/" + staffA.getId() + "/unlock", adminToken, null)
                    .andExpect(status().isOk());
            call("GET", "/api/auth/me", staffToken, null).andExpect(status().isUnauthorized());
        }
        if (action.equals("password")) {
            call(
                            "POST",
                            "/api/auth/login",
                            null,
                            Map.of("username", staffA.getEmail(), "password", PASSWORD))
                    .andExpect(status().isUnauthorized());
        }
        String fresh =
                login(
                        staffA.getEmail(),
                        action.equals("password") ? "New-test-password" : PASSWORD);
        call("GET", "/api/auth/me", fresh, null).andExpect(status().isOk());
    }

    @Test
    void updateNormalizesIdentityAndRejectsDuplicateEmailAcrossBrands() throws Exception {
        call(
                        "PUT",
                        "/api/users/" + staffA.getId(),
                        adminToken,
                        Map.of(
                                "email",
                                "UPDATED-" + suffix + "@example.com",
                                "fullName",
                                "  Updated Name  "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("updated-" + suffix + "@example.com"))
                .andExpect(jsonPath("$.fullName").value("Updated Name"));
        call(
                        "PUT",
                        "/api/users/" + staffA.getId(),
                        adminToken,
                        Map.of(
                                "email",
                                staffB.getEmail().toUpperCase(java.util.Locale.ROOT),
                                "fullName",
                                "Duplicate"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void invalidInputLeavesAccountAndSessionsUnchanged() throws Exception {
        call(
                        "PATCH",
                        "/api/users/" + staffA.getId() + "/roles",
                        adminToken,
                        Map.of("roles", Set.of()))
                .andExpect(status().isBadRequest());
        call(
                        "PATCH",
                        "/api/users/" + staffA.getId() + "/password",
                        adminToken,
                        Map.of("password", "ậ".repeat(25)))
                .andExpect(status().isBadRequest());
        call(
                        "PUT",
                        "/api/users/" + staffA.getId(),
                        adminToken,
                        Map.of("email", staffA.getEmail(), "fullName", "\u2003"))
                .andExpect(status().isBadRequest());
        assertThat(users.findById(staffA.getId()).orElseThrow().getTokenVersion()).isZero();
        call("GET", "/api/auth/me", staffToken, null).andExpect(status().isOk());
    }

    @Test
    void viewerAndAnonymousCannotManageUsers() throws Exception {
        call("GET", "/api/users", null, null).andExpect(status().isUnauthorized());
        call("GET", "/api/users", staffToken, null).andExpect(status().isForbidden());
        call("PATCH", "/api/users/" + staffA.getId() + "/lock", staffToken, null)
                .andExpect(status().isForbidden());
    }

    @Test
    void onlyPsaManagesBrandLifecycleAndNamesAreUniqueIgnoringCase() throws Exception {
        call("POST", "/api/brands", adminToken, Map.of("name", "Forbidden"))
                .andExpect(status().isForbidden());
        call("GET", "/api/brands", adminToken, null).andExpect(status().isForbidden());
        String name = "Created-" + suffix;
        JsonNode created =
                result(
                        call("POST", "/api/brands", psaToken, Map.of("name", "  " + name + "  "))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.name").value(name)));
        String path = "/api/brands/" + created.get("id").asLong();
        call(
                        "POST",
                        "/api/brands",
                        psaToken,
                        Map.of("name", name.toUpperCase(java.util.Locale.ROOT)))
                .andExpect(status().isConflict());
        call("PUT", path, psaToken, Map.of("name", "Renamed-" + suffix)).andExpect(status().isOk());
        call("PATCH", path + "/suspend", psaToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));
        call("PATCH", path + "/activate", psaToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    private Brand brand(String name) {
        Brand brand = new Brand();
        brand.setName(name);
        brand.setStatus(BrandStatus.ACTIVE);
        return brands.saveAndFlush(brand);
    }

    private User account(String prefix, Brand brand, String role, String passwordHash) {
        User user = new User();
        user.setEmail(prefix + "-" + suffix + "@example.com");
        user.setFullName(prefix);
        user.setBrand(brand);
        user.setStatus(UserStatus.ACTIVE);
        user.setPasswordHash(passwordHash);
        user.setRoles(Set.of(roles.findByRoleName(role).orElseThrow()));
        return users.saveAndFlush(user);
    }

    private Map<String, Object> createBody(Long brandId, String role) {
        var body = new java.util.HashMap<String, Object>();
        body.put("email", "new-" + suffix + "@example.com");
        body.put("fullName", "New User");
        body.put("password", PASSWORD);
        body.put("roles", Set.of(role));
        if (brandId != null) body.put("brandId", brandId);
        return body;
    }

    private String login(String email, String password) throws Exception {
        return result(
                        call(
                                        "POST",
                                        "/api/auth/login",
                                        null,
                                        Map.of("username", email, "password", password))
                                .andExpect(status().isOk()))
                .get("token")
                .asText();
    }

    private ResultActions call(String method, String path, String token, Object body)
            throws Exception {
        var builder = request(HttpMethod.valueOf(method), path);
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (body != null)
            builder.contentType("application/json").content(json.writeValueAsBytes(body));
        return mvc.perform(builder);
    }

    private JsonNode result(ResultActions actions) throws Exception {
        return json.readTree(actions.andReturn().getResponse().getContentAsByteArray());
    }
}
