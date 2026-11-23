package vn.edu.uth.scentstation.domain.inventory;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import vn.edu.uth.scentstation.common.GlobalExceptionHandler;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.alert.AlertController;
import vn.edu.uth.scentstation.domain.alert.AlertService;
import vn.edu.uth.scentstation.domain.brand.*;
import vn.edu.uth.scentstation.domain.catalog.*;
import vn.edu.uth.scentstation.domain.dispensing.*;
import vn.edu.uth.scentstation.domain.order.*;
import vn.edu.uth.scentstation.domain.user.*;
import vn.edu.uth.scentstation.security.*;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

/** Real PostgreSQL/Flyway, JWTs and committed transactions. Use a disposable database. */
@EnabledIfEnvironmentVariable(named = "SCENT_INVENTORY_TEST_DB_URL", matches = ".+")
@SpringBootTest(classes = InventoryManagementIntegrationTest.TestApplication.class)
@AutoConfigureMockMvc
class InventoryManagementIntegrationTest {
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
        InventoryManagementService.class,
        InventoryService.class,
        InventoryController.class,
        InventoryReferenceRepository.class,
        InventoryExceptionHandler.class,
        AlertService.class,
        vn.edu.uth.scentstation.domain.maintenance.MaintenanceService.class,
        AlertController.class,
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
        properties.add("spring.datasource.url", () -> System.getenv("SCENT_INVENTORY_TEST_DB_URL"));
        properties.add(
                "spring.datasource.username",
                () -> System.getenv().getOrDefault("SCENT_INVENTORY_TEST_DB_USER", "postgres"));
        properties.add(
                "spring.datasource.password",
                () -> System.getenv().getOrDefault("SCENT_INVENTORY_TEST_DB_PASSWORD", ""));
        properties.add(
                "scentstation.security.jwt-secret",
                () -> "inventory-integration-secret-at-least-32-bytes");
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtService jwt;
    @Autowired RoleRepository roles;
    @Autowired InventoryBottleRepository bottles;
    @Autowired InventoryService inventory;
    @Autowired AlertService stockAlerts;
    @Autowired PlatformTransactionManager transactionManager;
    @PersistenceContext EntityManager em;

    private TransactionTemplate tx;
    private String suffix;
    private Brand brandA;
    private Product productA;
    private Product productB;
    private Machine machine;
    private MachineSlot slot;
    private MachineSlot otherSlot;
    private MachineSlot foreignSlot;
    private InventoryBatch batch;
    private InventoryBatch foreignBatch;
    private InventoryBottle first;
    private InventoryBottle second;
    private InventoryBottle foreignBottle;
    private User staff;
    private String staffToken;
    private String managerToken;
    private String viewerToken;

    @BeforeEach
    void fixtures() {
        tx = new TransactionTemplate(transactionManager);
        suffix = UUID.randomUUID().toString();
        String hash = encoder.encode("inventory-test");
        tx.executeWithoutResult(
                ignored -> {
                    brandA = brand("A");
                    Brand brandB = brand("B");
                    productA = product(brandA, "A");
                    productB = product(brandB, "B");
                    machine = machine(brandA, "A");
                    slot = slot(machine, productA, 1);
                    otherSlot = slot(machine, productA, 2);
                    foreignSlot = slot(machine(brandB, "B"), productB, 1);
                    batch = batch(productA, "A", 10, LocalDate.now().plusDays(60));
                    foreignBatch = batch(productB, "B", 10, LocalDate.now().plusDays(60));
                    first = bottle(batch, "first");
                    second = bottle(batch, "second");
                    foreignBottle = bottle(foreignBatch, "foreign");
                    staff = account("staff", brandA, Roles.INVENTORY_STAFF, hash);
                    staffToken = jwt.issue(staff);
                    managerToken =
                            jwt.issue(account("manager", brandA, Roles.OPERATIONS_MANAGER, hash));
                    viewerToken = jwt.issue(account("viewer", brandA, Roles.VIEWER, hash));
                });
    }

    @Test
    void receivesBatchRegistersUniqueBottlesAndEnforcesReceiptCount() throws Exception {
        Map<String, Object> body =
                Map.of(
                        "productId",
                        productA.getId(),
                        "batchNumber",
                        "receipt-" + suffix,
                        "quantity",
                        1,
                        "receivedDate",
                        LocalDate.now().toString(),
                        "expiryDate",
                        LocalDate.now().plusDays(30).toString());
        JsonNode receipt =
                result(call("POST", "/batches", staffToken, body).andExpect(status().isCreated()));
        call("POST", "/batches", staffToken, body).andExpect(status().isConflict());
        Map<String, Object> registration =
                Map.of(
                        "batchId",
                        receipt.get("id").asLong(),
                        "bottleCode",
                        "new-" + suffix,
                        "initialQuantityMl",
                        100);
        call("POST", "/bottles", staffToken, registration)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
        call("POST", "/bottles", staffToken, registration)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BOTTLE_CODE_ALREADY_EXISTS"));
        call(
                        "POST",
                        "/bottles",
                        staffToken,
                        Map.of(
                                "batchId",
                                receipt.get("id").asLong(),
                                "bottleCode",
                                "overflow-" + suffix,
                                "initialQuantityMl",
                                100))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BATCH_FULL"));
        call(
                        "POST",
                        "/batches",
                        staffToken,
                        Map.of(
                                "productId",
                                productA.getId(),
                                "batchNumber",
                                "bad-" + suffix,
                                "quantity",
                                1,
                                "receivedDate",
                                LocalDate.now().toString(),
                                "expiryDate",
                                LocalDate.now().minusDays(1).toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void completeInstallAdjustRefillReplacementHistoryIncludesActorTimeMachineAndBothBottles()
            throws Exception {
        install(first, 100)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.initialQuantityMl").value(100));
        install(second, 100)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SLOT_ALREADY_OCCUPIED"));
        pause();
        call(
                        "PATCH",
                        "/bottles/" + first.getId() + "/adjust",
                        managerToken,
                        Map.of("remainingQuantityMl", 50, "reason", "Measured reconciliation"))
                .andExpect(status().isOk());
        pause();
        call(
                        "POST",
                        "/slots/" + slot.getId() + "/refill",
                        staffToken,
                        Map.of("quantityMl", 25, "reason", "Refill during service"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingQuantityMl").value(75));
        pause();
        call(
                        "POST",
                        "/slots/" + slot.getId() + "/replace",
                        staffToken,
                        Map.of("bottleId", second.getId(), "initialQuantityMl", 100))
                .andExpect(status().isOk());
        JsonNode history =
                result(call("GET", "/movements", staffToken, null).andExpect(status().isOk()));
        assertThat(history).hasSize(5);
        assertThat(history.findValuesAsText("movementType"))
                .containsExactly("INSTALL", "ADJUST", "REFILL", "REMOVE", "INSTALL");
        for (JsonNode movement : history) {
            assertThat(movement.get("machineId").asLong()).isEqualTo(machine.getId());
            assertThat(movement.get("slotId").asLong()).isEqualTo(slot.getId());
            assertThat(movement.get("performedAt").asText()).isNotBlank();
            assertThat(movement.get("performedBy").asLong()).isPositive();
        }
        assertThat(history.get(2).get("previousBottleId").asLong()).isEqualTo(first.getId());
        assertThat(history.get(2).get("newBottleId").asLong()).isEqualTo(first.getId());
        assertThat(history.get(4).get("previousBottleId").asLong()).isEqualTo(first.getId());
        assertThat(history.get(4).get("newBottleId").asLong()).isEqualTo(second.getId());
        assertThat(history.get(4).get("performedBy").asLong()).isEqualTo(staff.getId());
        assertThat(bottles.findById(first.getId()).orElseThrow().getSlot()).isNull();
    }

    @Test
    void manualAdjustmentRequiresSupervisorReasonAndValidVolume() throws Exception {
        call(
                        "PATCH",
                        "/bottles/" + first.getId() + "/adjust",
                        staffToken,
                        Map.of("remainingQuantityMl", 20, "reason", "Counted"))
                .andExpect(status().isForbidden());
        for (Object body :
                List.of(
                        Map.of("reason", "Quantity omitted"),
                        Map.of("remainingQuantityMl", 20),
                        Map.of("remainingQuantityMl", 20, "reason", "   "),
                        Map.of("remainingQuantityMl", -1, "reason", "Invalid"),
                        Map.of("remainingQuantityMl", 101, "reason", "Invalid"))) {
            call("PATCH", "/bottles/" + first.getId() + "/adjust", managerToken, body)
                    .andExpect(status().isBadRequest());
        }
        assertThat(bottles.findById(first.getId()).orElseThrow().getRemainingQuantityMl())
                .isEqualTo(100);
        call(
                        "PATCH",
                        "/bottles/" + first.getId() + "/adjust",
                        managerToken,
                        Map.of("remainingQuantityMl", 0, "reason", "Broken seal: counted empty"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EMPTY"));
        call("GET", "/movements", staffToken, null).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void allReadsAndWritesEnforceBrandScopeAndViewerCannotManageInventory() throws Exception {
        call("GET", "/batches", staffToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        call("GET", "/bottles", staffToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        call(
                        "POST",
                        "/batches",
                        staffToken,
                        Map.of(
                                "productId",
                                productB.getId(),
                                "batchNumber",
                                "denied",
                                "quantity",
                                1,
                                "receivedDate",
                                LocalDate.now().toString()))
                .andExpect(status().isNotFound());
        call(
                        "POST",
                        "/bottles",
                        staffToken,
                        Map.of(
                                "batchId",
                                foreignBatch.getId(),
                                "bottleCode",
                                "denied",
                                "initialQuantityMl",
                                100))
                .andExpect(status().isNotFound());
        install(foreignBottle, 100).andExpect(status().isNotFound());
        call(
                        "POST",
                        "/slots/" + foreignSlot.getId() + "/install",
                        staffToken,
                        Map.of("bottleId", first.getId(), "initialQuantityMl", 100))
                .andExpect(status().isNotFound());
        call(
                        "PATCH",
                        "/bottles/" + foreignBottle.getId() + "/adjust",
                        managerToken,
                        Map.of("remainingQuantityMl", 50, "reason", "Denied"))
                .andExpect(status().isNotFound());
        call("GET", "/movements?bottleId=" + foreignBottle.getId(), staffToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        call("GET", "/bottles", viewerToken, null).andExpect(status().isForbidden());
        call(
                        "POST",
                        "/slots/" + slot.getId() + "/install",
                        viewerToken,
                        Map.of("bottleId", first.getId(), "initialQuantityMl", 100))
                .andExpect(status().isForbidden());
        call("GET", "/bottles", null, null).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidReplacementPreservesCurrentBottleAndHistory() throws Exception {
        install(first, 100).andExpect(status().isOk());
        pause();
        tx.executeWithoutResult(
                ignored ->
                        em.find(InventoryBottle.class, second.getId())
                                .setStatus(BottleStatus.DAMAGED));
        call(
                        "POST",
                        "/slots/" + slot.getId() + "/replace",
                        staffToken,
                        Map.of("bottleId", second.getId(), "initialQuantityMl", 100))
                .andExpect(status().isConflict());
        tx.executeWithoutResult(
                ignored ->
                        assertThat(em.find(InventoryBottle.class, first.getId()).getSlot().getId())
                                .isEqualTo(slot.getId()));
        call("GET", "/movements", staffToken, null).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void rejectsExpiredDamagedWrongProductAndAlreadyInstalledBottles() throws Exception {
        tx.executeWithoutResult(
                ignored -> {
                    em.find(InventoryBatch.class, batch.getId())
                            .setExpiryDate(LocalDate.now().minusDays(1));
                });
        install(first, 100)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BOTTLE_UNUSABLE"));
        tx.executeWithoutResult(
                ignored -> {
                    em.find(InventoryBatch.class, batch.getId())
                            .setExpiryDate(LocalDate.now().plusDays(10));
                    em.find(InventoryBottle.class, first.getId()).setStatus(BottleStatus.DAMAGED);
                });
        install(first, 100).andExpect(status().isConflict());
        tx.executeWithoutResult(
                ignored -> {
                    em.find(InventoryBottle.class, first.getId()).setStatus(BottleStatus.AVAILABLE);
                    em.find(MachineSlot.class, slot.getId()).setProduct(product(brandA, "Other"));
                });
        install(first, 100)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PRODUCT_MISMATCH"));
        tx.executeWithoutResult(
                ignored ->
                        em.find(MachineSlot.class, slot.getId())
                                .setProduct(em.find(Product.class, productA.getId())));
        install(first, 101).andExpect(status().isBadRequest());
        install(first, 100).andExpect(status().isOk());
        call(
                        "POST",
                        "/slots/" + otherSlot.getId() + "/install",
                        staffToken,
                        Map.of("bottleId", first.getId(), "initialQuantityMl", 100))
                .andExpect(status().isConflict());
    }

    @ParameterizedTest
    @EnumSource(
            value = BottleStatus.class,
            names = {"INSTALLED", "NEARLY_EMPTY", "EMPTY", "DAMAGED", "EXPIRED"})
    void databaseOccupancyConstraintCoversEveryAttachedState(BottleStatus state) throws Exception {
        install(first, 100).andExpect(status().isOk());
        tx.executeWithoutResult(
                ignored -> em.find(InventoryBottle.class, first.getId()).setStatus(state));
        install(second, 100)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SLOT_ALREADY_OCCUPIED"));
        assertThatThrownBy(
                        () ->
                                tx.executeWithoutResult(
                                        ignored -> {
                                            InventoryBottle bottle =
                                                    bottles.findById(second.getId()).orElseThrow();
                                            bottle.setSlot(
                                                    em.find(MachineSlot.class, slot.getId()));
                                            bottle.setStatus(BottleStatus.INSTALLED);
                                            bottles.saveAndFlush(bottle);
                                        }))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasStackTraceContaining("uq_bottle_active_slot");
    }

    @Test
    void simultaneousInstallsHaveExactlyOneWinner() throws Exception {
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            CountDownLatch start = new CountDownLatch(1);
            Future<Integer> a =
                    executor.submit(
                            () -> {
                                start.await();
                                return install(first, 100).andReturn().getResponse().getStatus();
                            });
            Future<Integer> b =
                    executor.submit(
                            () -> {
                                start.await();
                                return install(second, 100).andReturn().getResponse().getStatus();
                            });
            start.countDown();
            assertThat(List.of(a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(200, 409);
        }
        call("GET", "/movements", staffToken, null).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void nearlyEmptyBottleRemainsUsableAndDuplicateResultDoesNotDeductTwice() throws Exception {
        install(first, 100).andExpect(status().isOk());
        pause();
        call(
                        "PATCH",
                        "/bottles/" + first.getId() + "/adjust",
                        managerToken,
                        Map.of("remainingQuantityMl", 2, "reason", "Measured baseline"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEARLY_EMPTY"));
        Long commandId = tx.execute(ignored -> command(CommandStatus.SUCCEEDED).getId());
        tx.executeWithoutResult(
                ignored -> inventory.deductForCommand(em.find(DispenseCommand.class, commandId)));
        tx.executeWithoutResult(
                ignored -> inventory.deductForCommand(em.find(DispenseCommand.class, commandId)));
        assertThat(bottles.findById(first.getId()).orElseThrow().getRemainingQuantityMl())
                .isEqualTo(1);
        Long next = tx.execute(ignored -> command(CommandStatus.SUCCEEDED).getId());
        tx.executeWithoutResult(
                ignored -> inventory.deductForCommand(em.find(DispenseCommand.class, next)));
        assertThat(bottles.findById(first.getId()).orElseThrow().getRemainingQuantityMl()).isZero();
        assertThat(bottles.findById(first.getId()).orElseThrow().getStatus())
                .isEqualTo(BottleStatus.EMPTY);
        tx.executeWithoutResult(
                ignored ->
                        assertThat(em.find(MachineSlot.class, slot.getId()).isAvailable())
                                .isFalse());
        install(second, 100)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SLOT_ALREADY_OCCUPIED"));
    }

    @Test
    void serviceRejectsInFlightCommandsAndMalformedInputHasClientError() throws Exception {
        tx.executeWithoutResult(ignored -> command(CommandStatus.ISSUED));
        call("PATCH", "/slots/" + slot.getId() + "/service", staffToken, null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SLOT_BUSY"));
        call(
                        "PATCH",
                        "/bottles/abc/adjust",
                        managerToken,
                        Map.of("remainingQuantityMl", 0, "reason", "test"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void lowStockAlertsAreBrandScopedAndRefillingResolvesThem() throws Exception {
        install(first, 100).andExpect(status().isOk());
        pause();
        call(
                        "PATCH",
                        "/bottles/" + first.getId() + "/adjust",
                        managerToken,
                        Map.of("remainingQuantityMl", 4, "reason", "Measured low stock"))
                .andExpect(status().isOk());
        tx.executeWithoutResult(
                ignored -> {
                    InventoryBottle foreign = em.find(InventoryBottle.class, foreignBottle.getId());
                    foreign.setSlot(em.find(MachineSlot.class, foreignSlot.getId()));
                    foreign.setRemainingQuantityMl(3);
                    foreign.setStatus(BottleStatus.NEARLY_EMPTY);
                    stockAlerts.reconcileLowStock(foreign);
                });
        mvc.perform(
                        request(HttpMethod.GET, "/api/alerts")
                                .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].bottleId").value(first.getId()));
        pause();
        call("POST", "/slots/" + slot.getId() + "/refill", staffToken, Map.of("quantityMl", 20))
                .andExpect(status().isOk());
        mvc.perform(
                        request(HttpMethod.GET, "/api/alerts")
                                .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(
                        request(HttpMethod.GET, "/api/alerts?activeOnly=false")
                                .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("RESOLVED"));
    }

    @Test
    void inFlightDiagnosticWithoutSaleOrderAlsoBlocksPhysicalService() throws Exception {
        tx.executeWithoutResult(
                ignored -> {
                    DispenseCommand diagnostic = command(CommandStatus.ISSUED);
                    diagnostic.setPurpose(CommandPurpose.DIAGNOSTIC);
                    diagnostic.setOrder(null);
                    diagnostic.setRequestedBy(staff.getId());
                });
        call("PATCH", "/slots/" + slot.getId() + "/service", staffToken, null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SLOT_BUSY"));
    }

    private Brand brand(String prefix) {
        Brand value = new Brand();
        value.setName("inventory-" + prefix + suffix);
        value.setStatus(BrandStatus.ACTIVE);
        em.persist(value);
        return value;
    }

    private Product product(Brand brand, String name) {
        Product value = new Product();
        value.setBrand(brand);
        value.setName(name);
        value.setDefaultPrice(20000);
        value.setActive(true);
        em.persist(value);
        return value;
    }

    private Machine machine(Brand brand, String prefix) {
        Machine value = new Machine();
        value.setBrand(brand);
        value.setDeviceId(prefix + suffix);
        value.setSerialNumber(prefix + suffix);
        value.setConnectivityStatus(ConnectivityStatus.OFFLINE);
        value.setOperatingStatus(OperatingStatus.ACTIVE);
        em.persist(value);
        return value;
    }

    private MachineSlot slot(Machine machine, Product product, int number) {
        MachineSlot value = new MachineSlot();
        value.setMachine(machine);
        value.setProduct(product);
        value.setSlotNumber(number);
        value.setDoseMl(1);
        value.setSprayDurationMs(800);
        value.setLowStockThresholdMl(10);
        value.setAvailable(false);
        em.persist(value);
        return value;
    }

    private InventoryBatch batch(Product product, String prefix, int quantity, LocalDate expiry) {
        InventoryBatch value = new InventoryBatch();
        value.setBrand(product.getBrand());
        value.setProduct(product);
        value.setBatchNumber(prefix + suffix);
        value.setQuantity(quantity);
        value.setReceivedDate(LocalDate.now());
        value.setExpiryDate(expiry);
        em.persist(value);
        return value;
    }

    private InventoryBottle bottle(InventoryBatch batch, String prefix) {
        InventoryBottle value = new InventoryBottle();
        value.setBatch(batch);
        value.setProduct(batch.getProduct());
        value.setBottleCode(prefix + suffix);
        value.setStatus(BottleStatus.AVAILABLE);
        value.setInitialQuantityMl(100);
        value.setRemainingQuantityMl(100);
        em.persist(value);
        return value;
    }

    private User account(String prefix, Brand brand, String role, String hash) {
        User value = new User();
        value.setEmail(prefix + suffix + "@example.com");
        value.setFullName(prefix);
        value.setBrand(brand);
        value.setStatus(UserStatus.ACTIVE);
        value.setPasswordHash(hash);
        value.setRoles(Set.of(roles.findByRoleName(role).orElseThrow()));
        em.persist(value);
        return value;
    }

    private DispenseCommand command(CommandStatus status) {
        MachineSlot managedSlot = em.find(MachineSlot.class, slot.getId());
        Order order = new Order();
        order.setBrand(em.find(Brand.class, brandA.getId()));
        order.setMachine(managedSlot.getMachine());
        order.setSlot(managedSlot);
        order.setProduct(managedSlot.getProduct());
        order.setStatus(OrderStatus.DISPENSING);
        order.setPriceSnapshot(20000);
        order.setCurrency("VND");
        order.setPaymentRef(UUID.randomUUID().toString());
        order.setExpiresAt(Instant.now().plusSeconds(60));
        em.persist(order);
        DispenseCommand command = new DispenseCommand();
        command.setOrder(order);
        command.setMachine(managedSlot.getMachine());
        command.setSlot(managedSlot);
        command.setIdempotencyKey(UUID.randomUUID().toString());
        command.setDoseMl(1);
        command.setSprayDurationMs(800);
        command.setSignature("test");
        command.setStatus(status);
        command.setIssuedAt(Instant.now());
        command.setExpiresAt(Instant.now().plusSeconds(30));
        em.persist(command);
        return command;
    }

    private ResultActions install(InventoryBottle bottle, int quantity) throws Exception {
        return call(
                "POST",
                "/slots/" + slot.getId() + "/install",
                staffToken,
                Map.of("bottleId", bottle.getId(), "initialQuantityMl", quantity));
    }

    private void pause() throws Exception {
        call("PATCH", "/slots/" + slot.getId() + "/service", staffToken, null)
                .andExpect(status().isNoContent());
    }

    private ResultActions call(String method, String path, String token, Object body)
            throws Exception {
        var builder = request(HttpMethod.valueOf(method), "/api/inventory" + path);
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (body != null)
            builder.contentType("application/json").content(json.writeValueAsBytes(body));
        return mvc.perform(builder);
    }

    private JsonNode result(ResultActions actions) throws Exception {
        return json.readTree(actions.andReturn().getResponse().getContentAsByteArray());
    }
}
