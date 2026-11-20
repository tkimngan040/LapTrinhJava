package vn.edu.uth.scentstation.domain.report;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.GlobalExceptionHandler;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.brand.BrandRepository;
import vn.edu.uth.scentstation.domain.user.*;
import vn.edu.uth.scentstation.security.*;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;

/** Isolated, rolled-back 30-day seed; real PostgreSQL, JWTs and method authorization. */
@EnabledIfEnvironmentVariable(named = "SCENT_REPORTS_TEST_DB_URL", matches = ".+")
@SpringBootTest(classes = ReportIntegrationTest.TestApplication.class)
@AutoConfigureMockMvc
@Transactional
class ReportIntegrationTest {
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
        ReportService.class,
        ReportRepository.class,
        ReportController.class,
        ReportExceptionHandler.class,
        GlobalExceptionHandler.class
    })
    static class TestApplication {
        @Bean
        Clock clock() {
            return Clock.fixed(Instant.parse("2024-06-30T10:00:00Z"), ZoneOffset.UTC);
        }
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", () -> System.getenv("SCENT_REPORTS_TEST_DB_URL"));
        properties.add(
                "spring.datasource.username",
                () -> System.getenv().getOrDefault("SCENT_REPORTS_TEST_DB_USER", "postgres"));
        properties.add(
                "spring.datasource.password",
                () -> System.getenv().getOrDefault("SCENT_REPORTS_TEST_DB_PASSWORD", ""));
        properties.add(
                "scentstation.security.jwt-secret",
                () -> "report-integration-secret-at-least-32-bytes");
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;
    @Autowired BrandRepository brands;
    @Autowired JwtService jwt;
    @Autowired PasswordEncoder encoder;
    private long brandA, brandB, productA, productB, machineA, machineA2, machineB, locationA;
    private String viewer, psa, manager, inventoryStaff;

    @BeforeEach
    void seed() throws Exception {
        jdbc.execute("SET LOCAL scent.reports_seed_end = '2024-06-30'");
        try (var input = new ClassPathResource("domain/report/seed-30-days.sql").getInputStream()) {
            jdbc.execute(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        }
        brandA = id("select id from brands where name='REPORT-SEED-A'");
        brandB = id("select id from brands where name='REPORT-SEED-B'");
        productA =
                id("select id from products where brand_id=" + brandA + " and name like 'Rose%'");
        productB = id("select id from products where brand_id=" + brandB);
        machineA = id("select id from machines where device_id='REPORT-A-1'");
        machineA2 = id("select id from machines where device_id='REPORT-A-2'");
        machineB = id("select id from machines where device_id='REPORT-B-1'");
        locationA = id("select id from locations where brand_id=" + brandA);
        String hash = encoder.encode("report-test-password");
        viewer = account("viewer", brandA, Roles.VIEWER, hash);
        manager = account("manager", brandA, Roles.OPERATIONS_MANAGER, hash);
        psa = account("psa", null, Roles.PLATFORM_SUPER_ADMIN, hash);
        inventoryStaff = account("inventory", brandA, Roles.INVENTORY_STAFF, hash);
    }

    @Test
    void machinesCountEachKioskOnceAndReturnUntranslatedBackendStates() throws Exception {
        call("machines", viewer)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMachines").value(6));
        JsonNode body = result(call("machines", viewer));
        for (String state :
                List.of("ONLINE", "OFFLINE", "UNSTABLE", "MAINTENANCE", "DISABLED", "ERROR")) {
            assertThat(body.get("statusCounts").get(state).asInt()).isEqualTo(1);
        }
        call("machines?productId=" + productA, viewer)
                .andExpect(jsonPath("$.totalMachines").value(1))
                .andExpect(jsonPath("$.items[0].kioskCode").value("REPORT-A-1"));
    }

    @Test
    void thirtyDayRevenueMatchesConfirmedPaymentsAndRefundsForAllGroupings() throws Exception {
        for (String group : List.of("DAY", "WEEK", "MONTH")) {
            JsonNode report =
                    result(
                            call("revenue?groupBy=" + group, viewer)
                                    .andExpect(status().isOk())
                                    .andExpect(jsonPath("$.amount").value(1200000))
                                    .andExpect(jsonPath("$.grossAmount").value(2100000))
                                    .andExpect(jsonPath("$.refundedAmount").value(900000))
                                    .andExpect(jsonPath("$.transactionCount").value(90)));
            long total = 0;
            for (JsonNode bucket : report.get("series")) total += bucket.get("amount").asLong();
            assertThat(total).isEqualTo(1200000);
        }
        call("revenue?from=2024-06-15&to=2024-06-15", viewer)
                .andExpect(jsonPath("$.amount").value(40000))
                .andExpect(jsonPath("$.series.length()").value(1));
    }

    @Test
    void ordersUseNineApprovedFieldsAndExcludeDiagnosticsFromSuccessRate() throws Exception {
        JsonNode report =
                result(
                        call("orders", viewer)
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalOrders").value(120))
                                .andExpect(jsonPath("$.successfulDispenses").value(30))
                                .andExpect(jsonPath("$.failedDispenses").value(60))
                                .andExpect(jsonPath("$.dispenseSuccessRate").value(33.33))
                                .andExpect(jsonPath("$.paidButUnconfirmed").value(30)));
        assertThat(report.get("statusCounts").size()).isEqualTo(9);
        for (String state : List.of("DISPENSED", "FAILED", "EXPIRED", "REFUNDED")) {
            assertThat(report.get("statusCounts").get(state).asInt()).isEqualTo(30);
        }
        var names = new HashSet<String>();
        report.get("items").get(0).fieldNames().forEachRemaining(names::add);
        assertThat(names)
                .containsExactlyInAnyOrder(
                        "orderId",
                        "createdAt",
                        "kioskCode",
                        "brandName",
                        "productName",
                        "volumeMl",
                        "amount",
                        "currency",
                        "status");
        call("orders?page=2&size=50", viewer).andExpect(jsonPath("$.items.length()").value(20));
        call("orders?machineId=" + machineA + "&productId=" + productA, viewer)
                .andExpect(jsonPath("$.totalOrders").value(60));
    }

    @Test
    void bestSellersUseOrderPriceSnapshotAndInventoryShowsOnlyLowSlots() throws Exception {
        call("products", viewer)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].productName").value("Rose, \"Fresh\""))
                .andExpect(jsonPath("$.items[0].soldCount").value(30))
                .andExpect(jsonPath("$.items[0].amount").value(600000));
        call("inventory", viewer)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].volumeMl").value(0))
                .andExpect(jsonPath("$.items[0].status").value("EMPTY"));
        call("inventory?machineId=" + machineA, viewer)
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].status").value("NEARLY_EMPTY"));
        call(
                        "products?locationId="
                                + locationA
                                + "&machineId="
                                + machineA2
                                + "&productId="
                                + productA,
                        viewer)
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void onlyPsaCanAggregatePlatformAndBrandFilterCannotEscapeViewerScope() throws Exception {
        call("revenue", psa)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(2700000))
                .andExpect(jsonPath("$.filters.scope").value("PLATFORM"));
        call("orders?brandId=" + brandB, psa).andExpect(jsonPath("$.totalOrders").value(30));
        call("revenue?brandId=" + brandB, viewer).andExpect(status().isForbidden());
        call("orders?machineId=" + machineB, viewer).andExpect(status().isNotFound());
        call("products?productId=" + productB, viewer).andExpect(status().isNotFound());
        call("orders?brandId=" + brandA, viewer)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrders").value(120));
        call("orders", inventoryStaff).andExpect(status().isForbidden());
        call("orders", null).andExpect(status().isUnauthorized());
    }

    @Test
    void csvExportsAllRowsWithApprovedHeadersAndEscapesNamesAndFormulas() throws Exception {
        String exported =
                call("orders?format=csv&size=1", manager)
                        .andExpect(status().isOk())
                        .andExpect(content().contentTypeCompatibleWith("text/csv"))
                        .andExpect(
                                header().string(
                                                "Content-Disposition",
                                                "attachment; filename=\"reports-orders.csv\""))
                        .andReturn()
                        .getResponse()
                        .getContentAsString(StandardCharsets.UTF_8);
        assertThat(exported)
                .startsWith(
                        "\uFEFF\"orderId\",\"createdAt\",\"kioskCode\",\"brandName\",\"productName\",\"volumeMl\",\"amount\",\"currency\",\"status\"\r\n");
        assertThat(exported.lines()).hasSize(121);
        assertThat(exported).contains("\"Rose, \"\"Fresh\"\"\"");
        jdbc.update("update products set name='=SUM(1,2)' where id=?", productA);
        String protectedCsv =
                call("products?format=csv", manager)
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString(StandardCharsets.UTF_8);
        assertThat(protectedCsv).contains("\"'=SUM(1,2)\"");
        for (String type : List.of("machines", "revenue", "products", "inventory")) {
            call(type + "?format=csv", manager).andExpect(status().isOk());
        }
    }

    @Test
    void viewerReadsAllFiveReportsButCannotExportOrChangeBusinessRecords() throws Exception {
        List<Long> before = rowCounts();
        for (String type : List.of("machines", "revenue", "orders", "products", "inventory")) {
            call(type, viewer).andExpect(status().isOk());
            call(type + "?format=csv", viewer).andExpect(status().isForbidden());
        }
        for (HttpMethod method :
                List.of(HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE)) {
            mvc.perform(
                            request(method, "/api/reports/orders")
                                    .header("Authorization", "Bearer " + viewer))
                    .andExpect(status().isForbidden());
        }
        assertThat(rowCounts()).isEqualTo(before);
    }

    @Test
    void invalidFiltersAre400AndEmptyRangesReturnZeros() throws Exception {
        for (String path :
                List.of(
                        "orders?from=bad",
                        "orders?from=2024-07-02&to=2024-07-01",
                        "orders?machineId=-1",
                        "orders?page=-1",
                        "orders?size=501",
                        "orders?format=xml",
                        "revenue?groupBy=HOUR")) {
            call(path, viewer).andExpect(status().isBadRequest());
        }
        call("revenue?from=2024-05-28&to=2024-05-30", viewer)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(0))
                .andExpect(jsonPath("$.series.length()").value(3));
        call("orders?from=2024-05-28&to=2024-05-30", viewer)
                .andExpect(jsonPath("$.totalOrders").value(0))
                .andExpect(jsonPath("$.dispenseSuccessRate").value(0))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void localDateBoundsAreInclusiveAndCommandDoseRemainsSnapshotAfterRecalibration()
            throws Exception {
        long source =
                id(
                        "select id from orders where brand_id="
                                + brandA
                                + " and status='DISPENSED' order by id limit 1");
        String copy =
                "insert into"
                    + " orders(brand_id,machine_id,slot_id,product_id,status,price_snapshot,currency,payment_ref,expires_at,created_at,updated_at)"
                    + " select"
                    + " brand_id,machine_id,slot_id,product_id,status,123,'VND',?,expires_at,cast(?"
                    + " as timestamptz),now() from orders where id=?";
        jdbc.update(copy, "REPORT-BOUND-START", "2024-06-14T17:00:00Z", source);
        jdbc.update(copy, "REPORT-BOUND-LAST", "2024-06-15T16:59:59.999999Z", source);
        jdbc.update(copy, "REPORT-BOUND-OUTSIDE", "2024-06-15T17:00:00Z", source);
        call("orders?from=2024-06-15&to=2024-06-15", viewer)
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.totalOrders")
                                .value(6)); // Four seed orders + both inclusive bounds.
        jdbc.update("update machine_slots set dose_ml=99 where machine_id=?", machineA);
        JsonNode report = result(call("orders?machineId=" + machineA + "&size=100", viewer));
        for (JsonNode row : report.get("items")) {
            if (row.get("amount").asLong() == 20000)
                assertThat(row.get("volumeMl").asInt()).isEqualTo(2);
        }
    }

    private long id(String sql) {
        return jdbc.queryForObject(sql, Long.class);
    }

    private String account(String prefix, Long brand, String role, String hash) {
        User user = new User();
        user.setBrand(brand == null ? null : brands.findById(brand).orElseThrow());
        user.setEmail("reports-" + prefix + "@example.com");
        user.setFullName(prefix);
        user.setPasswordHash(hash);
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(roles.findByRoleName(role).orElseThrow()));
        return jwt.issue(users.saveAndFlush(user));
    }

    private ResultActions call(String path, String token) throws Exception {
        var builder = request(HttpMethod.GET, "/api/reports/" + path);
        if (token != null) builder.header("Authorization", "Bearer " + token);
        return mvc.perform(builder);
    }

    private JsonNode result(ResultActions actions) throws Exception {
        return json.readTree(actions.andReturn().getResponse().getContentAsByteArray());
    }

    private List<Long> rowCounts() {
        return List.of(
                id("select count(*) from orders"),
                id("select count(*) from payments"),
                id("select count(*) from machines"),
                id("select count(*) from inventory_bottles"),
                id("select count(*) from inventory_movements"));
    }
}
