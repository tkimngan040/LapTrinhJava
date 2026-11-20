package vn.edu.uth.scentstation.domain.maintenance;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;

import jakarta.persistence.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.*;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.http.HttpMethod;
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
import vn.edu.uth.scentstation.domain.order.*;
import vn.edu.uth.scentstation.domain.user.*;
import vn.edu.uth.scentstation.iot.*;
import vn.edu.uth.scentstation.security.*;

import java.time.*;
import java.util.*;
import java.util.concurrent.*;

@EnabledIfEnvironmentVariable(named = "SCENT_MAINTENANCE_TEST_DB_URL", matches = ".+")
@SpringBootTest(classes = MaintenanceIntegrationTest.TestApplication.class)
@AutoConfigureMockMvc
class MaintenanceIntegrationTest {
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
        AlertService.class,
        AlertController.class,
        MaintenanceService.class,
        MaintenanceController.class,
        MaintenanceExceptionHandler.class,
        InventoryService.class,
        InventoryReferenceRepository.class,
        DispenseService.class,
        OrderService.class,
        OrderStateMachine.class,
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
        p.add("spring.datasource.url", () -> System.getenv("SCENT_MAINTENANCE_TEST_DB_URL"));
        p.add(
                "spring.datasource.username",
                () -> System.getenv().getOrDefault("SCENT_MAINTENANCE_TEST_DB_USER", "postgres"));
        p.add(
                "spring.datasource.password",
                () -> System.getenv().getOrDefault("SCENT_MAINTENANCE_TEST_DB_PASSWORD", ""));
        p.add(
                "scentstation.security.jwt-secret",
                () -> "maintenance-test-secret-is-at-least-32-bytes");
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @PersistenceContext EntityManager em;
    @Autowired PlatformTransactionManager transactions;
    @Autowired PasswordEncoder encoder;
    @Autowired RoleRepository roles;
    @Autowired JwtService jwt;
    @Autowired MachineService machineService;
    @Autowired DeviceMessageHandler messages;
    @Autowired OrderService orders;
    @Autowired MaintenanceTicketRepository tickets;
    @Autowired AlertRepository alerts;
    @Autowired DispenseCommandRepository commands;
    @Autowired DeviceGateway gateway;
    private TransactionTemplate tx;
    private Brand brand;
    private Machine machine;
    private MachineSlot slot;
    private InventoryBottle bottle;
    private User tech, otherTech, foreignTech;
    private String managerToken, techToken, otherTechToken, viewerToken, foreignToken;

    @BeforeEach
    void seed() {
        reset(gateway);
        tx = new TransactionTemplate(transactions);
        String key = UUID.randomUUID().toString();
        String hash = encoder.encode("maintenance-test");
        tx.executeWithoutResult(
                ignored -> {
                    brand = brand("service-" + key);
                    Brand foreign = brand("foreign-" + key);
                    Product product = new Product();
                    product.setBrand(brand);
                    product.setName("Perfume");
                    product.setActive(true);
                    product.setDefaultPrice(20000);
                    em.persist(product);
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
                    slot.setAvailable(true);
                    slot.setLowStockThresholdMl(10);
                    em.persist(slot);
                    bottle = new InventoryBottle();
                    bottle.setProduct(product);
                    bottle.setSlot(slot);
                    bottle.setBottleCode(key);
                    bottle.setInitialQuantityMl(100);
                    bottle.setRemainingQuantityMl(100);
                    bottle.setStatus(BottleStatus.INSTALLED);
                    em.persist(bottle);
                    managerToken =
                            jwt.issue(
                                    user(key + "-manager", brand, Roles.OPERATIONS_MANAGER, hash));
                    tech = user(key + "-tech", brand, Roles.TECHNICIAN, hash);
                    techToken = jwt.issue(tech);
                    otherTech = user(key + "-other", brand, Roles.TECHNICIAN, hash);
                    otherTechToken = jwt.issue(otherTech);
                    foreignTech = user(key + "-foreign", foreign, Roles.TECHNICIAN, hash);
                    foreignToken = jwt.issue(foreignTech);
                    viewerToken = jwt.issue(user(key + "-viewer", brand, Roles.VIEWER, hash));
                });
    }

    @Test
    void repeatedLeakCreatesOneCriticalAlertAndTicketAndBlocksNewOrders() throws Exception {
        event("LEAK");
        event("LEAK");
        JsonNode list =
                result(call("GET", "/api/alerts", managerToken, null).andExpect(status().isOk()));
        assertThat(list).hasSize(1);
        assertThat(list.get(0).get("severity").asText()).isEqualTo("CRITICAL");
        assertThat(ticketCount()).isEqualTo(1);
        assertThatThrownBy(() -> orders.createOrder(machine.getDeviceId(), 1))
                .isInstanceOf(ApiException.class);
        tx.executeWithoutResult(
                ignored ->
                        assertThat(em.find(Machine.class, machine.getId()).getOperatingStatus())
                                .isEqualTo(OperatingStatus.MAINTENANCE));
        // The open critical ticket remains a guard even if a bad external write reset the machine
        // mode.
        tx.executeWithoutResult(
                ignored ->
                        em.find(Machine.class, machine.getId())
                                .setOperatingStatus(OperatingStatus.ACTIVE));
        assertThatThrownBy(() -> orders.createOrder(machine.getDeviceId(), 1))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void acknowledgeAssignRepairTestCloseAndReopenPreserveSafetyAndHistory() throws Exception {
        event("LEAK");
        JsonNode alert = ownAlerts().get(0);
        long id = alert.get("id").asLong(), ticket = alert.get("maintenanceTicketId").asLong();
        call("PATCH", "/api/alerts/" + id + "/acknowledge", managerToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"));
        call(
                        "PATCH",
                        "/api/alerts/" + id + "/assign",
                        managerToken,
                        Map.of("assigneeId", tech.getId()))
                .andExpect(status().isOk());
        call("POST", ticket(ticket, "close"), techToken, null).andExpect(status().isConflict());
        call("POST", ticket(ticket, "start"), otherTechToken, null)
                .andExpect(status().isForbidden());
        call("POST", ticket(ticket, "start"), techToken, null).andExpect(status().isOk());
        call(
                        "PATCH",
                        ticket(ticket, "repair"),
                        techToken,
                        Map.of("repairResult", "Replaced leaking seal"))
                .andExpect(status().isOk());
        call("POST", ticket(ticket, "test"), techToken, Map.of("slotId", slot.getId()))
                .andExpect(status().isConflict());
        event("LEAK_CLEARED");
        call(
                        "PATCH",
                        "/api/alerts/" + id + "/resolve",
                        techToken,
                        Map.of("reason", "Physical repair complete"))
                .andExpect(status().isConflict());
        JsonNode testing =
                result(
                        call(
                                        "POST",
                                        ticket(ticket, "test"),
                                        techToken,
                                        Map.of("slotId", slot.getId()))
                                .andExpect(status().isOk()));
        long command = testing.get("testCommandId").asLong();
        call("POST", ticket(ticket, "close"), techToken, null).andExpect(status().isConflict());
        finish(command, true);
        call("POST", ticket(ticket, "close"), techToken, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.testPassed").value(true))
                .andExpect(jsonPath("$.closedBy").value(tech.getId()));
        tx.executeWithoutResult(
                ignored -> {
                    assertThat(em.find(Machine.class, machine.getId()).getOperatingStatus())
                            .isEqualTo(OperatingStatus.ACTIVE);
                    assertThat(
                                    em.find(InventoryBottle.class, bottle.getId())
                                            .getRemainingQuantityMl())
                            .isEqualTo(98);
                });
        assertThat(orders.createOrder(machine.getDeviceId(), 1).getStatus())
                .isEqualTo(OrderStatus.PENDING);
        call(
                        "PATCH",
                        "/api/alerts/" + id + "/reopen",
                        managerToken,
                        Map.of("reason", "Leak recurred after inspection"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reopenCount").value(1));
        assertThat(ticketCount())
                .isEqualTo(1); // one NEW active ticket; the closed record is retained
        assertThatThrownBy(() -> orders.createOrder(machine.getDeviceId(), 1))
                .isInstanceOf(ApiException.class);
        tx.executeWithoutResult(
                ignored -> assertThat(tickets.findAllScoped(brand.getId())).hasSize(2));
    }

    @Test
    void failedOrStaleTestCannotCloseAndNewRepairInvalidatesEarlierSuccessfulTest()
            throws Exception {
        long ticket = createTicket();
        assignStartRepair(ticket);
        long failed = requestTest(ticket);
        finish(failed, false);
        call("POST", ticket(ticket, "close"), techToken, null).andExpect(status().isConflict());
        // The failed test raises a critical incident and requires a fresh repair record.
        call(
                        "PATCH",
                        ticket(ticket, "repair"),
                        techToken,
                        Map.of("repairResult", "Corrected actuator after failed test"))
                .andExpect(status().isOk());
        long success = requestTest(ticket);
        finish(success, true);
        call(
                        "PATCH",
                        ticket(ticket, "repair"),
                        techToken,
                        Map.of("repairResult", "Performed another repair after test"))
                .andExpect(status().isOk());
        call("POST", ticket(ticket, "close"), techToken, null).andExpect(status().isConflict());
        assertThat(commands.findById(success).orElseThrow().getStatus())
                .isEqualTo(CommandStatus.SUCCEEDED);
    }

    @Test
    void telemetryGeneratesDoorAndLeakIncidentsAndHeartbeatClearsOffline() throws Exception {
        messages.handle(
                machine.getDeviceId(),
                Topics.TELEMETRY,
                "{\"doorOpen\":true,\"leakDetected\":true}");
        messages.handle(
                machine.getDeviceId(),
                Topics.TELEMETRY,
                "{\"doorOpen\":true,\"leakDetected\":true}");
        assertThat(ownAlerts()).hasSize(2);
        assertThat(ticketCount()).isEqualTo(1);
        messages.handle(
                machine.getDeviceId(),
                Topics.TELEMETRY,
                "{\"doorOpen\":false,\"leakDetected\":false}");
        assertThat(ownAlerts()).hasSize(1); // critical LEAK awaits the maintenance workflow
        tx.executeWithoutResult(
                ignored ->
                        em.find(Machine.class, machine.getId())
                                .setLastSeenAt(Instant.now().minusSeconds(120)));
        machineService.markSilentMachinesOffline();
        machineService.markSilentMachinesOffline();
        assertThat(ownAlerts().findValuesAsText("alertType")).contains("OFFLINE");
        machineService.recordHeartbeat(machine.getDeviceId());
        assertThat(ownAlerts().findValuesAsText("alertType")).doesNotContain("OFFLINE");
        assertThatThrownBy(
                        () ->
                                messages.handle(
                                        machine.getDeviceId(),
                                        Topics.TELEMETRY,
                                        "{\"leakDetected\":\"false\"}"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejectedAndFailedDispensingGenerateDeduplicatedCriticalIncident() throws Exception {
        DispenseCommand first = command();
        messages.handle(
                machine.getDeviceId(),
                Topics.RESULT,
                json.writeValueAsString(
                        Map.of(
                                "idempotencyKey",
                                first.getIdempotencyKey(),
                                "success",
                                false,
                                "reason",
                                "Pump failed")));
        messages.handle(
                machine.getDeviceId(),
                Topics.RESULT,
                json.writeValueAsString(
                        Map.of("idempotencyKey", first.getIdempotencyKey(), "success", false)));
        assertThat(ownAlerts()).hasSize(1);
        assertThat(ownAlerts().get(0).get("alertType").asText()).isEqualTo("DISPENSE_FAILED");
        assertThat(ticketCount()).isEqualTo(1);
    }

    @Test
    void tenantAndAssigneeRolesCannotEscapeTheirScope() throws Exception {
        long id = createTicket();
        call("GET", "/api/maintenance/tickets/" + id, foreignToken, null)
                .andExpect(status().isNotFound());
        call("PATCH", ticket(id, "assign"), managerToken, Map.of("assigneeId", foreignTech.getId()))
                .andExpect(status().isNotFound());
        call("PATCH", ticket(id, "assign"), techToken, Map.of("assigneeId", tech.getId()))
                .andExpect(status().isForbidden());
        call("POST", ticket(id, "start"), techToken, null).andExpect(status().isForbidden());
        call("GET", "/api/maintenance/tickets", viewerToken, null)
                .andExpect(status().isForbidden());
        event("DOOR_OPEN");
        long alert = ownAlerts().get(0).get("id").asLong();
        call("PATCH", "/api/alerts/" + alert + "/acknowledge", viewerToken, null)
                .andExpect(status().isForbidden());
        call("PATCH", "/api/alerts/" + alert + "/acknowledge", foreignToken, null)
                .andExpect(status().isNotFound());
        call("GET", "/api/alerts", viewerToken, null).andExpect(status().isOk());
    }

    @Test
    void simultaneousMachineIncidentsCreateOneAlertAndOneTicket() throws Exception {
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            CountDownLatch start = new CountDownLatch(1);
            Callable<Void> task =
                    () -> {
                        start.await();
                        event("LEAK");
                        return null;
                    };
            Future<Void> a = executor.submit(task), b = executor.submit(task);
            start.countDown();
            a.get(20, TimeUnit.SECONDS);
            b.get(20, TimeUnit.SECONDS);
        }
        assertThat(ownAlerts()).hasSize(1);
        assertThat(ticketCount()).isEqualTo(1);
    }

    @Test
    void brokerFailureRollsBackTestCommandAndClosedTicketCannotBeEdited() throws Exception {
        long ticket = createTicket();
        assignStartRepair(ticket);
        doThrow(ApiException.conflict("DEVICE_UNREACHABLE", "Broker not connected"))
                .when(gateway)
                .publishCommand(anyString(), anyMap());
        call("POST", ticket(ticket, "test"), techToken, Map.of("slotId", slot.getId()))
                .andExpect(status().isConflict());
        call("GET", "/api/maintenance/tickets/" + ticket, techToken, null)
                .andExpect(jsonPath("$.testCommandId").doesNotExist())
                .andExpect(jsonPath("$.status").value("REPAIRED"));
        reset(gateway);
        long command = requestTest(ticket);
        finish(command, true);
        call("POST", ticket(ticket, "close"), techToken, null).andExpect(status().isOk());
        call("PATCH", ticket(ticket, "repair"), techToken, Map.of("repairResult", "Late edit"))
                .andExpect(status().isConflict());
    }

    @Test
    void warningResolutionAndReopeningAreRealOperatorActions() throws Exception {
        event("DOOR_OPEN"); long id=ownAlerts().get(0).get("id").asLong();
        call("PATCH","/api/alerts/"+id+"/resolve",managerToken,Map.of("reason","Inspected and documented door condition"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RESOLVED"));
        assertThat(ownAlerts()).hasSize(0);
        call("PATCH","/api/alerts/"+id+"/reopen",managerToken,Map.of("reason","Requires another inspection"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.reopenCount").value(1));
        event("DOOR_OPEN"); assertThat(ownAlerts()).hasSize(1); assertThat(ticketCount()).isZero();
    }

    @Test
    void offlineAlertRemainsSingleAcrossWatchdogCyclesAndAcknowledgement() throws Exception {
        tx.executeWithoutResult(
                ignored ->
                        em.find(Machine.class, machine.getId())
                                .setLastSeenAt(Instant.now().minusSeconds(120)));
        machineService.markSilentMachinesOffline();
        JsonNode first = ownAlerts();
        assertThat(first).hasSize(1);
        assertThat(first.get(0).get("alertType").asText()).isEqualTo("OFFLINE");
        long alertId = first.get(0).get("id").asLong();
        call("PATCH", "/api/alerts/" + alertId + "/acknowledge", managerToken, null)
                .andExpect(status().isOk());
        for (int cycle = 0; cycle < 4; cycle++) machineService.markSilentMachinesOffline();
        JsonNode repeated = ownAlerts();
        assertThat(repeated).hasSize(1);
        assertThat(repeated.get(0).get("id").asLong()).isEqualTo(alertId);
        assertThat(repeated.get(0).get("status").asText()).isEqualTo("ACKNOWLEDGED");
        machineService.recordHeartbeat(machine.getDeviceId());
        assertThat(ownAlerts()).hasSize(0);
        tx.executeWithoutResult(
                ignored ->
                        em.find(Machine.class, machine.getId())
                                .setLastSeenAt(Instant.now().minusSeconds(120)));
        machineService.markSilentMachinesOffline();
        JsonNode next = ownAlerts();
        assertThat(next).hasSize(1);
        assertThat(next.get(0).get("id").asLong()).isNotEqualTo(alertId);
    }

    private long createTicket() throws Exception {
        return result(
                        call(
                                        "POST",
                                        "/api/maintenance/tickets",
                                        managerToken,
                                        Map.of(
                                                "machineId",
                                                machine.getId(),
                                                "title",
                                                "Inspect actuator",
                                                "priority",
                                                "NORMAL"))
                                .andExpect(status().isCreated()))
                .get("id")
                .asLong();
    }

    private void assignStartRepair(long id) throws Exception {
        call("PATCH", ticket(id, "assign"), managerToken, Map.of("assigneeId", tech.getId()))
                .andExpect(status().isOk());
        call("POST", ticket(id, "start"), techToken, null).andExpect(status().isOk());
        call(
                        "PATCH",
                        ticket(id, "repair"),
                        techToken,
                        Map.of("repairResult", "Replaced actuator and inspected wiring"))
                .andExpect(status().isOk());
    }

    private long requestTest(long id) throws Exception {
        return result(
                        call("POST", ticket(id, "test"), techToken, Map.of("slotId", slot.getId()))
                                .andExpect(status().isOk()))
                .get("testCommandId")
                .asLong();
    }

    private void finish(long command, boolean success) throws Exception {
        String key = commands.findById(command).orElseThrow().getIdempotencyKey();
        messages.handle(
                machine.getDeviceId(),
                Topics.RESULT,
                json.writeValueAsString(Map.of("idempotencyKey", key, "success", success)));
    }

    private DispenseCommand command() {
        return tx.execute(
                ignored -> {
                    Order o = new Order();
                    o.setBrand(em.find(Brand.class, brand.getId()));
                    o.setMachine(em.find(Machine.class, machine.getId()));
                    o.setSlot(em.find(MachineSlot.class, slot.getId()));
                    o.setProduct(o.getSlot().getProduct());
                    o.setPriceSnapshot(20000);
                    o.setCurrency("VND");
                    o.setStatus(OrderStatus.DISPENSING);
                    o.setPaymentRef(UUID.randomUUID().toString());
                    o.setExpiresAt(Instant.now().plusSeconds(120));
                    em.persist(o);
                    DispenseCommand c = new DispenseCommand();
                    c.setOrder(o);
                    c.setMachine(o.getMachine());
                    c.setSlot(o.getSlot());
                    c.setIdempotencyKey(UUID.randomUUID().toString());
                    c.setDoseMl(2);
                    c.setSprayDurationMs(800);
                    c.setSignature("test");
                    c.setStatus(CommandStatus.ISSUED);
                    c.setIssuedAt(Instant.now());
                    c.setExpiresAt(Instant.now().plusSeconds(30));
                    em.persist(c);
                    return c;
                });
    }

    private JsonNode ownAlerts() throws Exception {
        return result(call("GET", "/api/alerts", managerToken, null).andExpect(status().isOk()));
    }

    private long ticketCount() {
        return tx.execute(
                ignored ->
                        (long)
                                tickets.findByMachineIdAndStatusNotOrderById(
                                                machine.getId(), MaintenanceTicket.Status.CLOSED)
                                        .size());
    }

    private void event(String type) {
        machineService.recordEvent(machine.getDeviceId(), type, "{}");
    }

    private String ticket(long id, String action) {
        return "/api/maintenance/tickets/" + id + "/" + action;
    }

    private Brand brand(String name) {
        Brand b = new Brand();
        b.setName(name);
        b.setStatus(BrandStatus.ACTIVE);
        em.persist(b);
        return b;
    }

    private User user(String prefix, Brand brand, String role, String hash) {
        User u = new User();
        u.setBrand(brand);
        u.setEmail(prefix + "@example.com");
        u.setFullName(prefix);
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

    private JsonNode result(ResultActions actions) throws Exception {
        return json.readTree(actions.andReturn().getResponse().getContentAsByteArray());
    }
}
