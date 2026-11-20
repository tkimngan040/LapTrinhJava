package vn.edu.uth.scentstation.domain.audit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;

import jakarta.persistence.*;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.*;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import vn.edu.uth.scentstation.common.*;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.alert.*;
import vn.edu.uth.scentstation.domain.brand.*;
import vn.edu.uth.scentstation.domain.catalog.*;
import vn.edu.uth.scentstation.domain.dispensing.*;
import vn.edu.uth.scentstation.domain.inventory.*;
import vn.edu.uth.scentstation.domain.maintenance.*;
import vn.edu.uth.scentstation.domain.order.*;
import vn.edu.uth.scentstation.domain.order.Order;
import vn.edu.uth.scentstation.domain.user.*;
import vn.edu.uth.scentstation.iot.*;
import vn.edu.uth.scentstation.security.*;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;

@EnabledIfEnvironmentVariable(named = "SCENT_AUDIT_TEST_DB_URL", matches = ".+")
@SpringBootTest(classes = AuditIntegrationTest.TestApplication.class)
@AutoConfigureMockMvc
class AuditIntegrationTest {
    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration
    @EntityScan("vn.edu.uth.scentstation.domain")
    @EnableJpaRepositories("vn.edu.uth.scentstation.domain")
    @EnableConfigurationProperties(ScentStationProperties.class)
    @Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtService.class,
        TenantFilterAspect.class,
        AuditAspect.class,
        AuditService.class,
        AuditLogRepository.class,
        AuditSnapshotRepository.class,
        AuditController.class,
        AuditExceptionHandler.class,
        AuthController.class,
        AuthService.class,
        UserService.class,
        UserController.class,
        CatalogManagementService.class,
        CatalogManagementController.class,
        InventoryManagementService.class,
        InventoryController.class,
        InventoryService.class,
        InventoryReferenceRepository.class,
        AlertService.class,
        AlertController.class,
        MaintenanceService.class,
        MaintenanceController.class,
        MaintenanceExceptionHandler.class,
        DispenseService.class,
        OrderService.class,
        OrderStateMachine.class,
        RefundRepository.class,
        RefundService.class,
        RefundController.class,
        RefundWebhookController.class,
        RefundDispatcher.class,
        SimulatedRefundGateway.class,
        SimulatedRefundController.class,
        OrderReviewService.class,
        OrderReviewController.class,
        RecoveryExceptionHandler.class,
        MachineService.class,
        DeviceMessageHandler.class,
        GlobalExceptionHandler.class
    })
    static class TestApplication {
        @Bean
        Clock clock() {
            return Clock.systemUTC();
        }

        @Bean
        DeviceGateway gateway() {
            return mock(DeviceGateway.class);
        }
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry p) {
        p.add("spring.datasource.url", () -> System.getenv("SCENT_AUDIT_TEST_DB_URL"));
        p.add(
                "spring.datasource.username",
                () -> System.getenv().getOrDefault("SCENT_AUDIT_TEST_DB_USER", "postgres"));
        p.add(
                "spring.datasource.password",
                () -> System.getenv().getOrDefault("SCENT_AUDIT_TEST_DB_PASSWORD", ""));
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @PersistenceContext EntityManager em;
    @Autowired PlatformTransactionManager transactions;
    @Autowired PasswordEncoder encoder;
    @Autowired RoleRepository roles;
    @Autowired JwtService jwt;
    @Autowired DeviceMessageHandler messages;
    @Autowired OrderStateMachine states;
    @Autowired RefundDispatcher refundDispatcher;
    @Autowired SimulatedRefundGateway refundProvider;
    @Autowired MachineService machines;
    @SpyBean AuditLogRepository logs;
    private TransactionTemplate tx;
    private Brand brand;
    private Product product, second, foreignProduct;
    private Machine machine;
    private MachineSlot slot;
    private InventoryBottle bottle;
    private User manager, staff;
    private String psaToken, managerToken, viewerToken, adminToken;

    @BeforeEach
    void seed() {
        reset(logs);
        tx = new TransactionTemplate(transactions);
        String key = UUID.randomUUID().toString();
        String hash = encoder.encode("audit-test-password");
        tx.executeWithoutResult(
                ignored -> {
                    brand = brand("audit-" + key);
                    Brand foreign = brand("other-" + key);
                    product = product(brand, "Perfume", 20000);
                    second = product(brand, "Replacement", 22000);
                    foreignProduct = product(foreign, "Foreign", 30000);
                    machine = new Machine();
                    machine.setBrand(brand);
                    machine.setDeviceId(key);
                    machine.setSerialNumber(key);
                    machine.setConnectivityStatus(ConnectivityStatus.ONLINE);
                    machine.setOperatingStatus(OperatingStatus.ACTIVE);
                    machine.setLastSeenAt(Instant.now());
                    em.persist(machine);
                    slot = new MachineSlot();
                    slot.setMachine(machine);
                    slot.setProduct(product);
                    slot.setSlotNumber(1);
                    slot.setDoseMl(2);
                    slot.setSprayDurationMs(800);
                    slot.setLowStockThresholdMl(10);
                    slot.setAvailable(false);
                    em.persist(slot);
                    bottle = new InventoryBottle();
                    bottle.setProduct(product);
                    bottle.setSlot(slot);
                    bottle.setBottleCode(key);
                    bottle.setInitialQuantityMl(100);
                    bottle.setRemainingQuantityMl(40);
                    bottle.setStatus(BottleStatus.INSTALLED);
                    em.persist(bottle);
                    manager = user("manager-" + key, brand, Roles.OPERATIONS_MANAGER, hash);
                    managerToken = jwt.issue(manager);
                    staff = user("staff-" + key, brand, Roles.VIEWER, hash);
                    viewerToken = jwt.issue(user("viewer-" + key, brand, Roles.VIEWER, hash));
                    adminToken = jwt.issue(user("admin-" + key, brand, Roles.BRAND_ADMIN, hash));
                    psaToken =
                            jwt.issue(user("psa-" + key, null, Roles.PLATFORM_SUPER_ADMIN, hash));
                });
    }

    @Test
    void priceChangeRecordsActorTenantSourceAndExactOldNewValues() throws Exception {
        price(25000).andExpect(status().isOk());
        JsonNode records = search("PRODUCT_PRICE_CHANGED", product.getId()).get("content");
        assertThat(records).hasSize(1);
        JsonNode a = records.get(0);
        assertThat(a.get("actorId").asLong()).isEqualTo(manager.getId());
        assertThat(a.get("actorIdentifier").asText()).isEqualTo(manager.getEmail());
        assertThat(a.get("brandId").asLong()).isEqualTo(brand.getId());
        assertThat(a.get("beforeValues").get("defaultPrice").asLong()).isEqualTo(20000);
        assertThat(a.get("afterValues").get("defaultPrice").asLong()).isEqualTo(25000);
        assertThat(a.get("source").asText())
                .isEqualTo("PATCH /api/products/" + product.getId() + "/price");
        price(25000).andExpect(status().isOk());
        assertThat(search("PRODUCT_PRICE_CHANGED", product.getId()).get("totalElements").asLong())
                .isEqualTo(1);
    }

    @Test
    void concurrentPricesKeepAContinuousBeforeAfterChain() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            CountDownLatch start = new CountDownLatch(1);
            var a =
                    pool.submit(
                            () -> {
                                start.await();
                                return price(25000).andReturn().getResponse().getStatus();
                            });
            var b =
                    pool.submit(
                            () -> {
                                start.await();
                                return price(30000).andReturn().getResponse().getStatus();
                            });
            start.countDown();
            assertThat(a.get(15, TimeUnit.SECONDS)).isEqualTo(200);
            assertThat(b.get(15, TimeUnit.SECONDS)).isEqualTo(200);
        } finally {
            pool.shutdownNow();
        }
        JsonNode rows = search("PRODUCT_PRICE_CHANGED", product.getId()).get("content");
        assertThat(rows).hasSize(2);
        assertThat(rows.get(1).get("beforeValues").get("defaultPrice").asLong()).isEqualTo(20000);
        assertThat(rows.get(0).get("beforeValues").get("defaultPrice"))
                .isEqualTo(rows.get(1).get("afterValues").get("defaultPrice"));
        assertThat(
                        jdbc.queryForObject(
                                "SELECT default_price FROM products WHERE id=?",
                                Long.class,
                                product.getId()))
                .isEqualTo(rows.get(0).get("afterValues").get("defaultPrice").asLong());
    }

    @Test
    void rejectedWritesLeaveNeitherBusinessChangesNorSuccessAudit() throws Exception {
        call(
                        "PATCH",
                        "/api/products/" + foreignProduct.getId() + "/price",
                        managerToken,
                        Map.of("price", 1))
                .andExpect(status().isNotFound());
        call("PATCH", pricePath(), viewerToken, Map.of("price", 1))
                .andExpect(status().isForbidden());
        price(-1).andExpect(status().isBadRequest());
        assertThat(search("PRODUCT_PRICE_CHANGED", product.getId()).get("totalElements").asLong())
                .isZero();
    }

    @Test
    void failedAuditInsertRollsBackThePriceChange() throws Exception {
        doThrow(new DataAccessResourceFailureException("Injected audit persistence failure"))
                .when(logs)
                .append(
                        any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                        any());
        price(25000).andExpect(status().isInternalServerError());
        assertThat(
                        jdbc.queryForObject(
                                "SELECT default_price FROM products WHERE id=?",
                                Long.class,
                                product.getId()))
                .isEqualTo(20000);
        assertThat(search("PRODUCT_PRICE_CHANGED", product.getId()).get("totalElements").asLong())
                .isZero();
    }

    @Test
    void loginAuditsSuccessAndDenialWithoutCredentialsOrTokens() throws Exception {
        JsonNode response =
                result(
                        call(
                                        "POST",
                                        "/api/auth/login",
                                        null,
                                        Map.of(
                                                "username",
                                                manager.getEmail(),
                                                "password",
                                                "audit-test-password"))
                                .andExpect(status().isOk()));
        call(
                        "POST",
                        "/api/auth/login",
                        null,
                        Map.of("username", manager.getEmail(), "password", "wrong-secret"))
                .andExpect(status().isUnauthorized());
        JsonNode success = search("LOGIN_SUCCEEDED", manager.getId()).get("content");
        JsonNode denied = search("LOGIN_DENIED", manager.getId()).get("content");
        assertThat(success).hasSize(1);
        assertThat(denied).hasSize(1);
        assertThat(success.get(0).get("actorId").asLong()).isEqualTo(manager.getId());
        String stored = success.toString() + denied.toString();
        assertThat(stored)
                .doesNotContain(
                        "audit-test-password",
                        "wrong-secret",
                        response.get("token").asText(),
                        "passwordHash");
        String unknown = "missing-" + UUID.randomUUID() + "@example.com";
        call(
                        "POST",
                        "/api/auth/login",
                        null,
                        Map.of("username", unknown, "password", "wrong-secret"))
                .andExpect(status().isUnauthorized());
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM audit_logs WHERE actor_identifier=? AND"
                                        + " actor_id IS NULL AND action='LOGIN_DENIED'",
                                Long.class,
                                unknown))
                .isEqualTo(1);
    }

    @Test
    void permissionChangeRecordsBothRoleSets() throws Exception {
        call(
                        "PATCH",
                        "/api/users/" + staff.getId() + "/roles",
                        adminToken,
                        Map.of("roles", List.of(Roles.TECHNICIAN)))
                .andExpect(status().isOk());
        JsonNode a = search("USER_ROLES_CHANGED", staff.getId()).get("content").get(0);
        assertThat(a.get("beforeValues").get("roles").get(0).asText()).isEqualTo(Roles.VIEWER);
        assertThat(a.get("afterValues").get("roles").get(0).asText()).isEqualTo(Roles.TECHNICIAN);
    }

    @Test
    void adjustmentAndRefillRecordVolumeAndReason() throws Exception {
        call(
                        "PATCH",
                        "/api/inventory/bottles/" + bottle.getId() + "/adjust",
                        managerToken,
                        Map.of("remainingQuantityMl", 30, "reason", "Measured stock correction"))
                .andExpect(status().isOk());
        JsonNode a = search("INVENTORY_ADJUSTED", bottle.getId()).get("content").get(0);
        assertThat(a.get("beforeValues").get("remainingQuantityMl").asInt()).isEqualTo(40);
        assertThat(a.get("afterValues").get("remainingQuantityMl").asInt()).isEqualTo(30);
        assertThat(a.get("reason").asText()).isEqualTo("Measured stock correction");
        call("PATCH", "/api/inventory/slots/" + slot.getId() + "/service", managerToken, null)
                .andExpect(status().isNoContent());
        call(
                        "POST",
                        "/api/inventory/slots/" + slot.getId() + "/refill",
                        managerToken,
                        Map.of("quantityMl", 5, "reason", "Topped up"))
                .andExpect(status().isOk());
        a = search("INVENTORY_REFILLED", slot.getId()).get("content").get(0);
        assertThat(a.get("beforeValues").get("bottle").get("remainingQuantityMl").asInt())
                .isEqualTo(30);
        assertThat(a.get("afterValues").get("bottle").get("remainingQuantityMl").asInt())
                .isEqualTo(35);
        assertThat(a.get("machineId").asLong()).isEqualTo(machine.getId());
    }

    @Test
    void slotAssignmentAuditsOnlyASafeSameBrandChange() throws Exception {
        String path = "/api/slots/" + slot.getId() + "/product";
        call("PATCH", path, managerToken, Map.of("productId", second.getId()))
                .andExpect(status().isConflict());
        call("POST", "/api/inventory/slots/" + slot.getId() + "/remove", managerToken, null)
                .andExpect(status().isOk());
        call("PATCH", path, managerToken, Map.of("productId", foreignProduct.getId()))
                .andExpect(status().isNotFound());
        call("PATCH", path, managerToken, Map.of("productId", second.getId()))
                .andExpect(status().isOk());
        JsonNode a = search("SLOT_PRODUCT_ASSIGNED", slot.getId()).get("content").get(0);
        assertThat(a.get("beforeValues").get("productId").asLong()).isEqualTo(product.getId());
        assertThat(a.get("afterValues").get("productId").asLong()).isEqualTo(second.getId());
    }

    @Test
    void maintenanceAndConfirmedDiagnosticAreAuditedOnceWithTheOperator() throws Exception {
        long ticket =
                result(
                                call(
                                                "POST",
                                                "/api/maintenance/tickets",
                                                managerToken,
                                                Map.of(
                                                        "machineId",
                                                        machine.getId(),
                                                        "title",
                                                        "Inspection"))
                                        .andExpect(status().isCreated()))
                        .get("id")
                        .asLong();
        String base = "/api/maintenance/tickets/" + ticket;
        call("POST", base + "/start", managerToken, null).andExpect(status().isOk());
        call("PATCH", base + "/repair", managerToken, Map.of("repairResult", "Checked pump"))
                .andExpect(status().isOk());
        JsonNode testing =
                result(
                        call("POST", base + "/test", managerToken, Map.of("slotId", slot.getId()))
                                .andExpect(status().isOk()));
        long command = testing.get("testCommandId").asLong();
        String key =
                jdbc.queryForObject(
                        "SELECT idempotency_key FROM dispense_commands WHERE id=?",
                        String.class,
                        command);
        String body =
                json.writeValueAsString(
                        Map.of("idempotencyKey", key, "success", true, "resultCode", "OK"));
        messages.handle(machine.getDeviceId(), "result", body);
        messages.handle(machine.getDeviceId(), "result", body);
        JsonNode consumed = search("DISPENSE_STOCK_DEDUCTED", command).get("content");
        assertThat(consumed).hasSize(1);
        JsonNode a = consumed.get(0);
        assertThat(a.get("actorId").asLong()).isEqualTo(manager.getId());
        assertThat(a.get("beforeValues").get("remainingQuantityMl").asInt()).isEqualTo(40);
        assertThat(a.get("afterValues").get("remainingQuantityMl").asInt()).isEqualTo(38);
        assertThat(a.get("afterValues").get("purpose").asText()).isEqualTo("DIAGNOSTIC");
        call("POST", base + "/close", managerToken, null).andExpect(status().isOk());
        assertThat(search("MAINTENANCE_CLOSED", ticket).get("content")).hasSize(1);
    }

    @Test
    void refundStateHookAuditsAPersistedTransitionWithoutInventingAProviderFlow() throws Exception {
        long order =
                tx.execute(
                        ignored -> {
                            Order o = new Order();
                            o.setBrand(em.find(Brand.class, brand.getId()));
                            o.setMachine(em.find(Machine.class, machine.getId()));
                            o.setSlot(em.find(MachineSlot.class, slot.getId()));
                            o.setProduct(em.find(Product.class, product.getId()));
                            o.setStatus(OrderStatus.FAILED);
                            o.setPriceSnapshot(20000);
                            o.setCurrency("VND");
                            o.setPaymentRef(UUID.randomUUID().toString());
                            o.setExpiresAt(Instant.now().plusSeconds(30));
                            em.persist(o);
                            em.flush();
                            return o.getId();
                        });
        tx.executeWithoutResult(
                ignored -> states.transition(em.find(Order.class, order), OrderStatus.REFUNDED));
        JsonNode a = search("ORDER_REFUND_RECORDED", order).get("content").get(0);
        assertThat(a.get("beforeValues").get("status").asText()).isEqualTo("FAILED");
        assertThat(a.get("afterValues").get("status").asText()).isEqualTo("REFUNDED");
    }

    @Test
    void onlyPsaCanSearchAndFiltersAndPaginationAreValidated() throws Exception {
        price(25000).andExpect(status().isOk());
        call("GET", "/api/audit-logs", managerToken, null).andExpect(status().isForbidden());
        call("GET", "/api/audit-logs", adminToken, null).andExpect(status().isForbidden());
        call("GET", "/api/audit-logs", viewerToken, null).andExpect(status().isForbidden());
        call("GET", "/api/audit-logs", null, null).andExpect(status().isUnauthorized());
        String url =
                "/api/audit-logs?brandId="
                        + brand.getId()
                        + "&actorId="
                        + manager.getId()
                        + "&action=PRODUCT_PRICE_CHANGED&targetType=PRODUCT&targetId="
                        + product.getId()
                        + "&severity=INFO&from=2020-01-01T00:00:00Z&to=2030-01-01T00:00:00Z&size=1";
        call("GET", url, psaToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
        call("GET", url + "&page=1", psaToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty());
        for (String query :
                List.of(
                        "size=101",
                        "page=-1",
                        "targetType=UNKNOWN",
                        "from=invalid",
                        "from=2030-01-01T00:00:00Z&to=2020-01-01T00:00:00Z",
                        "severity=INVALID",
                        "actorId=-1"))
            call("GET", "/api/audit-logs?" + query, psaToken, null)
                    .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"POST", "PUT", "PATCH", "DELETE"})
    void auditHasNoMutationApi(String method) throws Exception {
        call(method, "/api/audit-logs", psaToken, Map.of("action", "tamper"))
                .andExpect(status().isMethodNotAllowed());
        call(method, "/api/audit-logs/1", psaToken, Map.of("action", "tamper"))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "UPDATE audit_logs SET action='TAMPERED'",
                "DELETE FROM audit_logs",
                "TRUNCATE audit_logs"
            })
    void databaseRejectsAuditMutationEvenThroughDirectSql(String sql) throws Exception {
        price(25000).andExpect(status().isOk());
        assertThatThrownBy(() -> jdbc.execute(sql))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("append-only");
        assertThat(search("PRODUCT_PRICE_CHANGED", product.getId()).get("content")).hasSize(1);
    }

    @Test
    void fullRefundNeedsProviderConfirmationAndRecordsAllBeforeAfterValues() throws Exception {
        long order = paidOrder(OrderStatus.FAILED);
        JsonNode refund = result(requestRefund(order, "request-1").andExpect(status().isCreated()));
        long id = refund.get("id").asLong();
        assertThat(refund.get("status").asText()).isEqualTo("PENDING");
        assertThat(jdbc.queryForObject("SELECT status FROM orders WHERE id=?", String.class, order))
                .isEqualTo("FAILED");
        requestRefund(order, "request-1")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
        assertThat(search("REFUND_REQUESTED", id).get("content")).hasSize(1);
        refundDispatcher.dispatchPending();
        refundDispatcher.dispatchPending();
        call(
                        "POST",
                        "/api/dev/refunds/" + id + "/simulate",
                        managerToken,
                        Map.of("attempt", 1, "succeed", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCEEDED"));
        call(
                        "POST",
                        "/api/dev/refunds/" + id + "/simulate",
                        managerToken,
                        Map.of("attempt", 1, "succeed", true))
                .andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT status FROM orders WHERE id=?", String.class, order))
                .isEqualTo("REFUNDED");
        assertThat(
                        jdbc.queryForObject(
                                "SELECT status FROM payments WHERE order_id=?",
                                String.class,
                                order))
                .isEqualTo("REFUNDED");
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM simulated_refund_requests WHERE"
                                        + " refund_reference=?",
                                Long.class,
                                refund.get("refundReference").asText()))
                .isEqualTo(1);
        JsonNode rows = search("REFUND_OUTCOME_RECORDED", id).get("content");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).get("beforeValues").get("orderStatus").asText()).isEqualTo("FAILED");
        assertThat(rows.get(0).get("afterValues").get("orderStatus").asText())
                .isEqualTo("REFUNDED");
        assertThat(rows.get(0).get("afterValues").get("paymentStatus").asText())
                .isEqualTo("REFUNDED");
        assertThat(search("ORDER_REFUND_RECORDED", order).get("content")).hasSize(1);
        assertThat(
                        jdbc.queryForObject(
                                "SELECT remaining_quantity_ml FROM inventory_bottles WHERE id=?",
                                Integer.class,
                                bottle.getId()))
                .isEqualTo(40);
    }

    @Test
    void failedRefundCanRetryWithoutAcceptingAStaleAttempt() throws Exception {
        long order = paidOrder(OrderStatus.FAILED);
        JsonNode refund = result(requestRefund(order, "retry-1").andExpect(status().isCreated()));
        long id = refund.get("id").asLong();
        refundDispatcher.dispatchPending();
        call(
                        "POST",
                        "/api/dev/refunds/" + id + "/simulate",
                        managerToken,
                        Map.of("attempt", 1, "succeed", false))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));
        assertThat(jdbc.queryForObject("SELECT status FROM orders WHERE id=?", String.class, order))
                .isEqualTo("FAILED");
        call("POST", "/api/refunds/" + id + "/retry", managerToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attempt").value(2));
        var stale = refundProvider.complete(refund.get("refundReference").asText(), 1, false);
        call("POST", "/api/refunds/webhook", null, stale).andExpect(status().isConflict());
        refundDispatcher.dispatchPending();
        call(
                        "POST",
                        "/api/dev/refunds/" + id + "/simulate",
                        managerToken,
                        Map.of("attempt", 2, "succeed", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCEEDED"));
        assertThat(search("REFUND_RETRIED", id).get("content")).hasSize(1);
    }

    @Test
    void refundRejectsBadSignatureMismatchedMoneyAndUnauthorisedActors() throws Exception {
        call("GET", "/api/refunds/invalid", managerToken, null).andExpect(status().isBadRequest());
        long order = paidOrder(OrderStatus.FAILED);
        call(
                        "POST",
                        "/api/orders/" + order + "/refunds",
                        viewerToken,
                        Map.of("requestKey", "viewer", "reason", "Unauthorized"))
                .andExpect(status().isForbidden());
        JsonNode refund =
                result(requestRefund(order, "security-1").andExpect(status().isCreated()));
        long id = refund.get("id").asLong();
        refundDispatcher.dispatchPending();
        var actual = refundProvider.complete(refund.get("refundReference").asText(), 1, true);
        var bad =
                new RefundWebhookController.Outcome(
                        actual.refundReference(),
                        actual.provider(),
                        actual.providerReference(),
                        1,
                        actual.amount() + 1,
                        actual.currency(),
                        actual.status(),
                        actual.resultCode(),
                        actual.signature());
        call("POST", "/api/refunds/webhook", null, bad).andExpect(status().isBadRequest());
        var signer = new vn.edu.uth.scentstation.iot.CommandSigner("dev-payment-webhook-secret");
        var signedWrong =
                new RefundWebhookController.Outcome(
                        bad.refundReference(),
                        bad.provider(),
                        bad.providerReference(),
                        1,
                        bad.amount(),
                        bad.currency(),
                        bad.status(),
                        bad.resultCode(),
                        signer.sign(RefundWebhookController.signed(bad)));
        call("POST", "/api/refunds/webhook", null, signedWrong).andExpect(status().isConflict());
        assertThat(jdbc.queryForObject("SELECT status FROM orders WHERE id=?", String.class, order))
                .isEqualTo("FAILED");
        assertThat(search("REFUND_OUTCOME_RECORDED", id).get("content")).isEmpty();
        call("POST", "/api/refunds/webhook", null, actual).andExpect(status().isOk());
    }

    @Test
    void refundRequiresAReasonAndDefiniteFailedOrderAndEnforcesTenantScope() throws Exception {
        long order = paidOrder(OrderStatus.UNCERTAIN);
        requestRefund(order, "uncertain").andExpect(status().isConflict());
        call(
                        "POST",
                        "/api/orders/" + order + "/refunds",
                        managerToken,
                        Map.of("requestKey", "missing", "reason", " "))
                .andExpect(status().isBadRequest());
        String foreign =
                tx.execute(
                        ignored ->
                                jwt.issue(
                                        user(
                                                "foreign-" + UUID.randomUUID(),
                                                em.find(Product.class, foreignProduct.getId())
                                                        .getBrand(),
                                                Roles.OPERATIONS_MANAGER,
                                                encoder.encode("test"))));
        call(
                        "POST",
                        "/api/orders/" + order + "/refunds",
                        foreign,
                        Map.of("requestKey", "foreign", "reason", "Different brand"))
                .andExpect(status().isNotFound());
        call(
                        "POST",
                        "/api/orders/" + order + "/review",
                        managerToken,
                        Map.of(
                                "decision",
                                "FAILED",
                                "note",
                                "Device log proves refusal",
                                "evidence",
                                "Checked immutable command and operator incident log"))
                .andExpect(status().isOk());
        requestRefund(order, "reviewed").andExpect(status().isCreated());
        assertThat(search("ORDER_REVIEWED", order).get("content")).hasSize(1);
    }

    @Test
    void successfulHumanReviewDeductsOnceAndNeverIssuesAnotherCommand() throws Exception {
        long order = paidOrder(OrderStatus.UNCERTAIN);
        Map<String, String> review =
                Map.of(
                        "decision",
                        "DISPENSED",
                        "note",
                        "Confirmed at machine",
                        "evidence",
                        "Operator verified pump log for the original command");
        call("POST", "/api/orders/" + order + "/review", managerToken, review)
                .andExpect(status().isOk());
        call("POST", "/api/orders/" + order + "/review", managerToken, review)
                .andExpect(status().isOk());
        assertThat(
                        jdbc.queryForObject(
                                "SELECT remaining_quantity_ml FROM inventory_bottles WHERE id=?",
                                Integer.class,
                                bottle.getId()))
                .isEqualTo(38);
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM dispense_commands WHERE order_id=?",
                                Long.class,
                                order))
                .isEqualTo(1);
        assertThat(search("ORDER_REVIEWED", order).get("content")).hasSize(1);
        requestRefund(order, "no-refund-after-spray").andExpect(status().isConflict());
    }

    @Test
    void auditFailureRollsBackRefundAndItsDispatchRequest() throws Exception {
        long order = paidOrder(OrderStatus.FAILED);
        doThrow(new DataAccessResourceFailureException("Injected audit failure"))
                .when(logs)
                .append(
                        any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                        any());
        requestRefund(order, "rollback").andExpect(status().isInternalServerError());
        assertThat(
                        jdbc.queryForObject(
                                "SELECT count(*) FROM refunds WHERE order_id=?", Long.class, order))
                .isZero();
        assertThat(jdbc.queryForObject("SELECT status FROM orders WHERE id=?", String.class, order))
                .isEqualTo("FAILED");
    }

    private ResultActions requestRefund(long order, String key) throws Exception {
        return call(
                "POST",
                "/api/orders/" + order + "/refunds",
                managerToken,
                Map.of("requestKey", key, "reason", "Payment received; spray definitely failed"));
    }

    private long paidOrder(OrderStatus status) {
        return tx.execute(
                ignored -> {
                    Order o = new Order();
                    o.setBrand(em.find(Brand.class, brand.getId()));
                    o.setMachine(em.find(Machine.class, machine.getId()));
                    o.setSlot(em.find(MachineSlot.class, slot.getId()));
                    o.setProduct(em.find(Product.class, product.getId()));
                    o.setStatus(status);
                    o.setPriceSnapshot(20000);
                    o.setCurrency("VND");
                    o.setPaymentRef(UUID.randomUUID().toString());
                    o.setExpiresAt(Instant.now().plusSeconds(120));
                    em.persist(o);
                    Payment payment = new Payment();
                    payment.setOrder(o);
                    payment.setProvider("FAKEPAY");
                    payment.setProviderReference(UUID.randomUUID().toString());
                    payment.setAmount(20000);
                    payment.setCurrency("VND");
                    payment.setStatus(PaymentStatus.SUCCEEDED);
                    payment.setPaidAt(Instant.now());
                    em.persist(payment);
                    DispenseCommand command = new DispenseCommand();
                    command.setOrder(o);
                    command.setMachine(o.getMachine());
                    command.setSlot(o.getSlot());
                    command.setPurpose(CommandPurpose.CUSTOMER);
                    command.setDoseMl(2);
                    command.setSprayDurationMs(800);
                    command.setIdempotencyKey(UUID.randomUUID().toString());
                    command.setSignature("test");
                    command.setStatus(
                            status == OrderStatus.UNCERTAIN
                                    ? CommandStatus.TIMED_OUT
                                    : CommandStatus.FAILED);
                    command.setIssuedAt(Instant.now().minusSeconds(70));
                    command.setExpiresAt(Instant.now().minusSeconds(40));
                    command.setCompletedAt(Instant.now());
                    em.persist(command);
                    return o.getId();
                });
    }

    @Test
    void accountCreationProfileAndLogoutHaveSafeAuditsAndLogoutRevokesTheToken() throws Exception {
        String email = "new-" + UUID.randomUUID() + "@example.com";
        JsonNode created =
                result(
                        call(
                                        "POST",
                                        "/api/users",
                                        adminToken,
                                        Map.of(
                                                "email",
                                                email,
                                                "fullName",
                                                "Audit new user",
                                                "password",
                                                "new-account-secret",
                                                "roles",
                                                List.of(Roles.VIEWER)))
                                .andExpect(status().isCreated()));
        long id = created.get("id").asLong();
        JsonNode audit = search("USER_CREATED", id).get("content");
        assertThat(audit).hasSize(1);
        assertThat(audit.toString()).doesNotContain("new-account-secret", "passwordHash");
        call(
                        "PUT",
                        "/api/users/" + id,
                        adminToken,
                        Map.of("email", email, "fullName", "Updated audited name"))
                .andExpect(status().isOk());
        audit = search("USER_PROFILE_CHANGED", id).get("content").get(0);
        assertThat(audit.get("beforeValues").get("fullName").asText()).isEqualTo("Audit new user");
        assertThat(audit.get("afterValues").get("fullName").asText())
                .isEqualTo("Updated audited name");
        call("POST", "/api/auth/logout", managerToken, null).andExpect(status().isNoContent());
        call("GET", "/api/refunds", managerToken, null).andExpect(status().isUnauthorized());
        assertThat(search("LOGOUT", manager.getId()).get("content")).hasSize(1);
        call("POST", "/api/auth/logout", viewerToken, null).andExpect(status().isNoContent());
        call("GET", "/api/refunds", viewerToken, null).andExpect(status().isUnauthorized());
    }

    @Test
    void alertLifecycleAndBottleStatusHaveBeforeAfterAudit() throws Exception {
        machines.recordEvent(machine.getDeviceId(), "DOOR_OPEN", "{}");
        long alert =
                jdbc.queryForObject(
                        "SELECT id FROM alerts WHERE machine_id=? AND alert_type='DOOR_OPEN'",
                        Long.class,
                        machine.getId());
        call("PATCH", "/api/alerts/" + alert + "/acknowledge", managerToken, null)
                .andExpect(status().isOk());
        assertThat(
                        search("ALERT_ACKNOWLEDGED", alert)
                                .get("content")
                                .get(0)
                                .get("afterValues")
                                .get("status")
                                .asText())
                .isEqualTo("ACKNOWLEDGED");
        call(
                        "PATCH",
                        "/api/alerts/" + alert + "/resolve",
                        managerToken,
                        Map.of("reason", "Checked door during service"))
                .andExpect(status().isOk());
        call(
                        "PATCH",
                        "/api/alerts/" + alert + "/reopen",
                        managerToken,
                        Map.of("reason", "Door remains open"))
                .andExpect(status().isOk());
        assertThat(search("ALERT_RESOLVED", alert).get("content")).hasSize(1);
        assertThat(search("ALERT_REOPENED", alert).get("content")).hasSize(1);
        call(
                        "PATCH",
                        "/api/inventory/bottles/" + bottle.getId() + "/status",
                        managerToken,
                        Map.of("status", "DAMAGED", "reason", "Cracked bottle"))
                .andExpect(status().isOk());
        JsonNode audit =
                search("INVENTORY_BOTTLE_STATUS_CHANGED", bottle.getId()).get("content").get(0);
        assertThat(audit.get("beforeValues").get("status").asText()).isEqualTo("INSTALLED");
        assertThat(audit.get("afterValues").get("status").asText()).isEqualTo("DAMAGED");
    }

    @Test
    void actualGatewayPublishesOnlyAfterCommitAndNeverAfterRollback() throws Exception {
        org.eclipse.paho.client.mqttv3.MqttClient client =
                mock(org.eclipse.paho.client.mqttv3.MqttClient.class);
        when(client.isConnected()).thenReturn(true);
        MqttDeviceGateway gateway =
                new MqttDeviceGateway(
                        new ScentStationProperties(),
                        mock(org.springframework.beans.factory.ObjectProvider.class),
                        json);
        org.springframework.test.util.ReflectionTestUtils.setField(gateway, "client", client);
        tx.executeWithoutResult(
                ignored -> {
                    gateway.publishCommand(
                            machine.getDeviceId(), Map.of("idempotencyKey", "rolled-back"));
                    ignored.setRollbackOnly();
                });
        verify(client, never())
                .publish(anyString(), any(org.eclipse.paho.client.mqttv3.MqttMessage.class));
        tx.executeWithoutResult(
                ignored -> {
                    gateway.publishCommand(
                            machine.getDeviceId(), Map.of("idempotencyKey", "committed"));
                    try {
                        verify(client, never())
                                .publish(
                                        anyString(),
                                        any(org.eclipse.paho.client.mqttv3.MqttMessage.class));
                    } catch (org.eclipse.paho.client.mqttv3.MqttException e) {
                        throw new IllegalStateException(e);
                    }
                });
        verify(client, times(1))
                .publish(anyString(), any(org.eclipse.paho.client.mqttv3.MqttMessage.class));
    }

    private String pricePath() {
        return "/api/products/" + product.getId() + "/price";
    }

    private ResultActions price(long value) throws Exception {
        return call("PATCH", pricePath(), managerToken, Map.of("price", value));
    }

    private JsonNode search(String action, long target) throws Exception {
        return result(
                call(
                                "GET",
                                "/api/audit-logs?action=" + action + "&targetId=" + target,
                                psaToken,
                                null)
                        .andExpect(status().isOk()));
    }

    private Brand brand(String name) {
        Brand b = new Brand();
        b.setName(name);
        b.setStatus(BrandStatus.ACTIVE);
        em.persist(b);
        return b;
    }

    private Product product(Brand b, String name, long price) {
        Product p = new Product();
        p.setBrand(b);
        p.setName(name);
        p.setDefaultPrice(price);
        p.setActive(true);
        em.persist(p);
        return p;
    }

    private User user(String name, Brand b, String role, String hash) {
        User u = new User();
        u.setBrand(b);
        u.setEmail(name + "@example.com");
        u.setFullName(name);
        u.setPasswordHash(hash);
        u.setStatus(UserStatus.ACTIVE);
        u.setRoles(Set.of(roles.findByRoleName(role).orElseThrow()));
        em.persist(u);
        return u;
    }

    private ResultActions call(String method, String path, String token, Object body)
            throws Exception {
        var builder = request(HttpMethod.valueOf(method), path);
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (body != null)
            builder.contentType("application/json").content(json.writeValueAsBytes(body));
        return mvc.perform(builder);
    }

    private JsonNode result(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsByteArray());
    }
}
