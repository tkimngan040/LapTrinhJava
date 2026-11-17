package vn.edu.uth.scentstation.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.domain.catalog.MachineRepository;
import vn.edu.uth.scentstation.iot.DeviceGateway;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * IT-07 through IT-09: exercise authentication, tenant isolation, payment
 * webhook idempotency, and their PostgreSQL persistence boundaries.
 *
 * Manual run from Git Bash (including IntelliJ Terminal), starting at the repository root:
 *   docker compose up -d db
 *   docker compose exec db pg_isready -U scent -d scentstation
 *   cd backend
 *   mvn "-Dit.test=BackendBoundaryIT" verify
 *
 * The test starts the Spring application in-process; do not run the backend
 * separately. It writes test data to the local Compose database, so do not
 * point it at production data.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(BackendBoundaryIT.FixtureConfiguration.class)
class BackendBoundaryIT {

    private static final String VIEWER_EMAIL = "it-viewer@maisonaroma.local";
    private static final String VIEWER_PASSWORD = "Viewer@12345";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ObjectMapper objectMapper;
    @MockBean
    private DeviceGateway deviceGateway;

    @BeforeEach
    void prepareViewerAndMarkerTable() {
        Long maisonAromaId = jdbcTemplate.queryForObject(
                "SELECT brand_id FROM brands WHERE name = 'Maison Aroma'", Long.class);
        jdbcTemplate.update("""
                INSERT INTO users (brand_id, email, password_hash, full_name, status,
                                   token_version, created_at)
                VALUES (?, ?, ?, 'Integration Test Viewer', 'ACTIVE', 0, NOW())
                ON CONFLICT (email) DO UPDATE
                SET brand_id = EXCLUDED.brand_id,
                    password_hash = EXCLUDED.password_hash,
                    status = 'ACTIVE',
                    token_version = 0
                """, maisonAromaId, VIEWER_EMAIL, passwordEncoder.encode(VIEWER_PASSWORD));
        jdbcTemplate.update("""
                INSERT INTO user_roles (user_id, role_id)
                SELECT u.user_id, r.role_id
                FROM users u CROSS JOIN roles r
                WHERE u.email = ? AND r.role_name = 'VIEWER'
                ON CONFLICT (user_id, role_id) DO NOTHING
                """, VIEWER_EMAIL);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS test_write_markers (
                    marker_id BIGSERIAL PRIMARY KEY,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """);
        jdbcTemplate.execute("TRUNCATE TABLE test_write_markers");
    }

    @Test
    @DisplayName("IT-07 — Brand A cannot read Brand B machine through the real tenant filter")
    void brandUserCannotReadAnotherBrandsMachineButPlatformAdminCan() throws Exception {
        String brandBDeviceIdentity = jdbcTemplate.queryForObject(
                "SELECT device_identity FROM machines WHERE device_identity = 'ls-device-001'",
                String.class);
        String brandAToken = login("admin@maisonaroma.local", "Admin@12345");

        mockMvc.perform(get("/api/test-fixtures/machines/{deviceIdentity}", brandBDeviceIdentity)
                        .header("Authorization", "Bearer " + brandAToken))
                .andExpect(status().isNotFound());

        String platformAdminToken = login("admin@scentstation.local", "Admin@12345");
        mockMvc.perform(get("/api/test-fixtures/machines/{deviceIdentity}", brandBDeviceIdentity)
                        .header("Authorization", "Bearer " + platformAdminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("IT-08 — Viewer is denied a protected write before the handler runs")
    void viewerCannotWriteAndPermittedRoleCanReachTheSameFixture() throws Exception {
        String viewerToken = login(VIEWER_EMAIL, VIEWER_PASSWORD);

        mockMvc.perform(post("/api/test-fixtures/write-marker")
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isForbidden());
        assertThat(markerCount()).isZero();

        String brandAdminToken = login("admin@maisonaroma.local", "Admin@12345");
        mockMvc.perform(post("/api/test-fixtures/write-marker")
                        .header("Authorization", "Bearer " + brandAdminToken))
                .andExpect(status().isNoContent());
        assertThat(markerCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("IT-09 — duplicate signed payment webhook persists one payment and publishes one command")
    void duplicatePaymentNotificationIsAppliedOnlyOnce() throws Exception {
        String token = login("admin@maisonaroma.local", "Admin@12345");
        MvcResult orderResult = mockMvc.perform(post("/api/kiosk/orders")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                Map.of("deviceId", "ma-device-001", "slotNumber", 1))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode createdOrder = objectMapper.readTree(
                orderResult.getResponse().getContentAsByteArray());
        String qrContent = createdOrder.path("qrContent").asText();
        String paymentRef = qrContent.substring(qrContent.lastIndexOf('/') + 1);

        MvcResult paymentResult = mockMvc.perform(post("/api/dev/payments/simulate-duplicate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                Map.of("paymentRef", paymentRef, "succeed", true))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode response = objectMapper.readTree(
                paymentResult.getResponse().getContentAsByteArray());

        assertThat(response.path("applied").asBoolean()).isFalse();
        assertThat(response.path("message").asText()).isEqualTo("Already recorded, ignored");
        assertThat(jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM payments p JOIN orders o ON o.order_id = p.order_id
                WHERE o.payment_ref = ?
                """, Long.class, paymentRef)).isEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT status FROM orders WHERE payment_ref = ?", String.class, paymentRef))
                .isEqualTo("DISPENSING");
        assertThat(jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM dispense_commands dc JOIN orders o ON o.order_id = dc.order_id
                WHERE o.payment_ref = ?
                """, Long.class, paymentRef)).isEqualTo(1L);
        verify(deviceGateway, times(1)).publishCommand(eq("ma-device-001"), anyMap());
    }

    private String login(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(
                                Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsByteArray());
        return response.path("token").asText();
    }

    private long markerCount() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM test_write_markers", Long.class);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class FixtureConfiguration {

        @Bean
        MachineLookupFixture machineLookupFixture(MachineRepository machineRepository) {
            return new MachineLookupFixture(machineRepository);
        }

        @Bean
        TestFixtureController testFixtureController(
                MachineLookupFixture machineLookupFixture, JdbcTemplate jdbcTemplate) {
            return new TestFixtureController(machineLookupFixture, jdbcTemplate);
        }
    }

    public static class MachineLookupFixture {

        private final MachineRepository machineRepository;

        MachineLookupFixture(MachineRepository machineRepository) {
            this.machineRepository = machineRepository;
        }

        @Transactional(readOnly = true)
        public Optional<String> findDeviceIdentity(String deviceIdentity) {
            return machineRepository.findByDeviceIdentity(deviceIdentity)
                    .map(machine -> machine.getDeviceIdentity());
        }
    }

    @RestController
    @RequestMapping("/api/test-fixtures")
    public static class TestFixtureController {

        private final MachineLookupFixture machineLookupFixture;
        private final JdbcTemplate jdbcTemplate;

        TestFixtureController(MachineLookupFixture machineLookupFixture,
                              JdbcTemplate jdbcTemplate) {
            this.machineLookupFixture = machineLookupFixture;
            this.jdbcTemplate = jdbcTemplate;
        }

        @GetMapping("/machines/{deviceIdentity}")
        public ResponseEntity<String> findMachine(@PathVariable String deviceIdentity) {
            Optional<String> identity = machineLookupFixture.findDeviceIdentity(deviceIdentity);
            return identity.isPresent()
                    ? ResponseEntity.ok(identity.get())
                    : ResponseEntity.notFound().build();
        }

        @PostMapping("/write-marker")
        public ResponseEntity<Void> writeMarker() {
            jdbcTemplate.update("INSERT INTO test_write_markers DEFAULT VALUES");
            return ResponseEntity.noContent().build();
        }
    }
}
