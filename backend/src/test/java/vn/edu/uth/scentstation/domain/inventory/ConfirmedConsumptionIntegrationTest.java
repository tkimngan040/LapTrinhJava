package vn.edu.uth.scentstation.domain.inventory;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.alert.*;
import vn.edu.uth.scentstation.domain.brand.*;
import vn.edu.uth.scentstation.domain.catalog.*;
import vn.edu.uth.scentstation.domain.dispensing.*;
import vn.edu.uth.scentstation.domain.order.*;
import vn.edu.uth.scentstation.domain.user.*;
import vn.edu.uth.scentstation.iot.*;

import java.time.Clock;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/** Exercises the real MQTT result dispatcher and PostgreSQL transaction boundaries. */
@EnabledIfEnvironmentVariable(named = "SCENT_INVENTORY_TEST_DB_URL", matches = ".+")
@SpringBootTest(
        classes = ConfirmedConsumptionIntegrationTest.TestApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ConfirmedConsumptionIntegrationTest {
    @Configuration(proxyBeanMethods = false)
    @EnableAutoConfiguration
    @EntityScan("vn.edu.uth.scentstation.domain")
    @EnableJpaRepositories("vn.edu.uth.scentstation.domain")
    @EnableConfigurationProperties(ScentStationProperties.class)
    @Import({
        InventoryService.class,
        InventoryReferenceRepository.class,
        AlertService.class,
        vn.edu.uth.scentstation.domain.maintenance.MaintenanceService.class,
        DispenseService.class,
        OrderStateMachine.class,
        DeviceMessageHandler.class,
        MachineService.class
    })
    static class TestApplication {
        @Bean
        Clock clock() {
            return Clock.systemUTC();
        }

        @Bean
        DeviceGateway gateway() {
            return (device, payload) -> {};
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
    }

    @PersistenceContext EntityManager em;
    @Autowired InventoryService inventory;
    @Autowired InventoryBottleRepository bottles;
    @Autowired InventoryMovementRepository movements;
    @Autowired DispenseCommandRepository commands;
    @Autowired AlertRepository alertRepository;
    @SpyBean AlertService alerts;
    @Autowired DeviceMessageHandler messages;
    @Autowired DispenseService dispensing;
    @Autowired ObjectMapper json;
    @Autowired PlatformTransactionManager transactionManager;
    private TransactionTemplate tx;
    private Brand brand;
    private Product product;
    private Machine machine;
    private MachineSlot slot;
    private InventoryBottle bottle;
    private User operator;

    @BeforeEach
    void fixtures() {
        tx = new TransactionTemplate(transactionManager);
        String suffix = UUID.randomUUID().toString();
        tx.executeWithoutResult(
                ignored -> {
                    brand = new Brand();
                    brand.setName("consume-" + suffix);
                    brand.setStatus(BrandStatus.ACTIVE);
                    em.persist(brand);
                    product = new Product();
                    product.setBrand(brand);
                    product.setName("Perfume");
                    product.setDefaultPrice(20000);
                    product.setActive(true);
                    em.persist(product);
                    machine = new Machine();
                    machine.setBrand(brand);
                    machine.setDeviceId(suffix);
                    machine.setSerialNumber(suffix);
                    machine.setConnectivityStatus(ConnectivityStatus.ONLINE);
                    machine.setOperatingStatus(OperatingStatus.ACTIVE);
                    em.persist(machine);
                    slot = new MachineSlot();
                    slot.setMachine(machine);
                    slot.setProduct(product);
                    slot.setSlotNumber(1);
                    slot.setDoseMl(2);
                    slot.setLowStockThresholdMl(5);
                    slot.setSprayDurationMs(800);
                    slot.setAvailable(true);
                    em.persist(slot);
                    bottle = new InventoryBottle();
                    bottle.setProduct(product);
                    bottle.setSlot(slot);
                    bottle.setBottleCode(suffix);
                    bottle.setInitialQuantityMl(100);
                    bottle.setRemainingQuantityMl(12);
                    bottle.setStatus(BottleStatus.INSTALLED);
                    bottle.setInstalledAt(Instant.now());
                    em.persist(bottle);
                    operator = new User();
                    operator.setBrand(brand);
                    operator.setEmail(suffix + "@example.com");
                    operator.setFullName("Technician");
                    operator.setStatus(UserStatus.ACTIVE);
                    operator.setPasswordHash("not-used-for-authentication");
                    em.persist(operator);
                });
    }

    @Test
    void commandContractDeductsExactlyOnceAndPersistsSignedDoseAndMovementBaseline() {
        DispenseCommand command =
                createCommand(CommandStatus.SUCCEEDED, 3, CommandPurpose.CUSTOMER);
        inventory.deductForCommand(command);
        inventory.deductForCommand(commands.findById(command.getId()).orElseThrow());
        assertThat(remaining()).isEqualTo(9); // signed command dose 3, slot calibration 2
        assertThat(commands.findById(command.getId()).orElseThrow().isInventoryApplied()).isTrue();
        tx.executeWithoutResult(
                ignored -> {
                    List<InventoryMovement> rows =
                            movements.findAllScoped(brand.getId(), bottle.getId());
                    assertThat(rows).hasSize(1);
                    assertThat(rows.getFirst().getQuantityMl()).isEqualTo(-3);
                    assertThat(rows.getFirst().getQuantityBeforeMl()).isEqualTo(12);
                    assertThat(rows.getFirst().getQuantityAfterMl()).isEqualTo(9);
                    assertThat(rows.getFirst().getCommandId()).isEqualTo(command.getId());
                    assertThat(rows.getFirst().getMovementType()).isEqualTo(MovementType.DISPENSE);
                });
    }

    @Test
    void twoConcurrentMqttResultsDeductOneDoseAndCompleteOrderOnce() throws Exception {
        DispenseCommand command =
                createCommand(CommandStatus.ACKNOWLEDGED, 2, CommandPurpose.CUSTOMER);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            CountDownLatch start = new CountDownLatch(1);
            Callable<Void> delivery =
                    () -> {
                        start.await();
                        result(command, true);
                        return null;
                    };
            Future<Void> first = executor.submit(delivery);
            Future<Void> second = executor.submit(delivery);
            start.countDown();
            first.get(20, TimeUnit.SECONDS);
            second.get(20, TimeUnit.SECONDS);
        }
        assertThat(remaining()).isEqualTo(10);
        assertThat(movementCount()).isEqualTo(1);
        assertThat(orderState(command)).isEqualTo(OrderStatus.DISPENSED);
        assertThat(commands.findById(command.getId()).orElseThrow().getStatus())
                .isEqualTo(CommandStatus.SUCCEEDED);
    }

    @Test
    void ackAndFailedResultNeverConsumeStock() throws Exception {
        DispenseCommand command = createCommand(CommandStatus.ISSUED, 2, CommandPurpose.CUSTOMER);
        messages.handle(
                machine.getDeviceId(),
                Topics.ACK,
                json.writeValueAsString(
                        Map.of("idempotencyKey", command.getIdempotencyKey(), "accepted", true)));
        assertThat(remaining()).isEqualTo(12);
        assertThat(movementCount()).isZero();
        result(command, false);
        result(command, true); // contradictory late success must not revive a settled command
        assertThat(remaining()).isEqualTo(12);
        assertThat(movementCount()).isZero();
        assertThat(orderState(command)).isEqualTo(OrderStatus.FAILED);
    }

    @Test
    void unconfirmedAndForgedDetachedCommandsCannotDeduct() {
        DispenseCommand command =
                createCommand(CommandStatus.ACKNOWLEDGED, 2, CommandPurpose.CUSTOMER);
        DispenseCommand forged = new DispenseCommand();
        forged.setId(command.getId());
        forged.setStatus(CommandStatus.SUCCEEDED);
        forged.setDoseMl(1);
        forged.setSlot(slot);
        assertThatThrownBy(() -> inventory.deductForCommand(forged))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("confirmed successful");
        assertThatThrownBy(() -> inventory.deductForCommand(command))
                .isInstanceOf(ApiException.class);
        assertThat(remaining()).isEqualTo(12);
        assertThat(movementCount()).isZero();
    }

    @Test
    void managedEntityContractStillJoinsLongsResultTransaction() {
        DispenseCommand command =
                createCommand(CommandStatus.ACKNOWLEDGED, 2, CommandPurpose.CUSTOMER);
        tx.executeWithoutResult(
                ignored -> {
                    DispenseCommand managed = em.find(DispenseCommand.class, command.getId());
                    managed.setStatus(CommandStatus.SUCCEEDED);
                    inventory.deductForCommand(managed);
                });
        assertThat(remaining()).isEqualTo(10);
        assertThat(movementCount()).isEqualTo(1);
    }

    @Test
    void insufficientStockThrowsWithoutNegativeVolumeAndHoldsOrderForImmediateReview() {
        setRemaining(2);
        DispenseCommand command =
                createCommand(CommandStatus.ACKNOWLEDGED, 3, CommandPurpose.CUSTOMER);
        assertThatThrownBy(() -> result(command, true))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("less than");
        assertThat(remaining()).isEqualTo(2);
        assertThat(movementCount()).isZero();
        assertThat(orderState(command)).isEqualTo(OrderStatus.UNCERTAIN);
        DispenseCommand stored = commands.findById(command.getId()).orElseThrow();
        assertThat(stored.isInventoryApplied()).isFalse();
        assertThat(stored.getStatus()).isEqualTo(CommandStatus.FAILED);
        tx.executeWithoutResult(
                ignored ->
                        assertThat(em.find(MachineSlot.class, slot.getId()).isAvailable())
                                .isFalse());
        // Repeated delivery after review hold cannot retry the physical consumption.
        assertThatCode(() -> result(command, true)).doesNotThrowAnyException();
        assertThat(orderState(command)).isEqualTo(OrderStatus.UNCERTAIN);
        assertThat(remaining()).isEqualTo(2);
    }

    @Test
    void lateAlertPersistenceFailureRollsBackBottleMovementAndSuccessBeforeReviewIsCommitted() {
        setRemaining(6);
        DispenseCommand command =
                createCommand(CommandStatus.ACKNOWLEDGED, 2, CommandPurpose.CUSTOMER);
        doThrow(new IllegalStateException("Injected alert persistence failure"))
                .when(alerts)
                .reconcileLowStock(any());
        assertThatThrownBy(() -> result(command, true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Injected");
        assertThat(remaining()).isEqualTo(6);
        assertThat(movementCount()).isZero();
        long lowStockAlerts =
                tx.execute(
                        ignored ->
                                alertRepository
                                        .findAllScoped(brand.getId(), false, Alert.Status.RESOLVED)
                                        .stream()
                                        .filter(a -> a.getAlertType().equals("LOW_STOCK"))
                                        .count());
        assertThat(lowStockAlerts).isZero();
        assertThat(orderState(command)).isEqualTo(OrderStatus.UNCERTAIN);
        assertThat(commands.findById(command.getId()).orElseThrow().isInventoryApplied()).isFalse();
    }

    @Test
    void lowStockCreatesOneOpenAlertAndZeroStockDisablesSlot() throws Exception {
        setRemaining(6);
        for (int i = 0; i < 3; i++) {
            DispenseCommand command =
                    createCommand(CommandStatus.ACKNOWLEDGED, 2, CommandPurpose.CUSTOMER);
            result(command, true);
            result(command, true);
            assertThat(alertCount()).isEqualTo(1);
        }
        assertThat(remaining()).isZero();
        assertThat(bottles.findById(bottle.getId()).orElseThrow().getStatus())
                .isEqualTo(BottleStatus.EMPTY);
        tx.executeWithoutResult(
                ignored -> {
                    assertThat(em.find(MachineSlot.class, slot.getId()).isAvailable()).isFalse();
                    Alert alert =
                            alertRepository
                                    .findByBottleIdAndStatus(bottle.getId(), Alert.Status.OPEN)
                                    .orElseThrow();
                    assertThat(alert.getAlertType()).isEqualTo("LOW_STOCK");
                    assertThat(alert.getMachine().getId()).isEqualTo(machine.getId());
                    assertThat(alert.getRemainingQuantityMl()).isEqualTo(4);
                });
    }

    @Test
    void diagnosticConsumesPhysicalVolumeOnceWithoutCreatingSaleOrCustomerMovement()
            throws Exception {
        DispenseCommand command =
                createCommand(CommandStatus.ACKNOWLEDGED, 2, CommandPurpose.DIAGNOSTIC);
        result(command, true);
        result(command, true);
        assertThat(remaining()).isEqualTo(10);
        assertThat(movementCount()).isEqualTo(1);
        tx.executeWithoutResult(
                ignored -> {
                    InventoryMovement movement =
                            movements.findAllScoped(brand.getId(), bottle.getId()).getFirst();
                    assertThat(movement.getMovementType()).isEqualTo(MovementType.DIAGNOSTIC);
                    assertThat(movement.getPerformedBy()).isEqualTo(operator.getId());
                    assertThat(
                                    em.createQuery(
                                                    "select count(o) from Order o where o.brand.id"
                                                            + " = :brand",
                                                    Long.class)
                                            .setParameter("brand", brand.getId())
                                            .getSingleResult())
                            .isZero();
                });
        assertThat(commands.findById(command.getId()).orElseThrow().isInventoryApplied()).isTrue();
    }

    @Test
    void diagnosticFailureAndTimeoutNeverConsumeAndDoNotNeedSaleOrder() throws Exception {
        DispenseCommand failed =
                createCommand(CommandStatus.ACKNOWLEDGED, 2, CommandPurpose.DIAGNOSTIC);
        result(failed, false);
        DispenseCommand timedOut =
                createCommand(CommandStatus.ISSUED, 2, CommandPurpose.DIAGNOSTIC);
        tx.executeWithoutResult(
                ignored ->
                        em.find(DispenseCommand.class, timedOut.getId())
                                .setIssuedAt(Instant.now().minusSeconds(300)));
        assertThat(dispensing.timeOutStaleCommands()).isGreaterThanOrEqualTo(1);
        assertThat(commands.findById(timedOut.getId()).orElseThrow().getStatus())
                .isEqualTo(CommandStatus.TIMED_OUT);
        assertThat(remaining()).isEqualTo(12);
        assertThat(movementCount()).isZero();
    }

    @Test
    void unknownOrTransientCommandIsRejected() {
        DispenseCommand invalid = new DispenseCommand();
        invalid.setId(-1L);
        assertThatThrownBy(() -> inventory.deductForCommand(invalid))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> inventory.deductForCommand(new DispenseCommand()))
                .isInstanceOf(ApiException.class);
        DispenseCommand unknown = new DispenseCommand();
        unknown.setId(Long.MAX_VALUE);
        assertThatThrownBy(() -> inventory.deductForCommand(unknown))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> inventory.deductForCommand(null)).isInstanceOf(ApiException.class);
        assertThat(remaining()).isEqualTo(12);
    }

    @Test
    void diagnosticInsufficientStockRollsBackWithoutSaleOrderAndPausesSlotForReview() {
        setRemaining(2);
        DispenseCommand command =
                createCommand(CommandStatus.ACKNOWLEDGED, 3, CommandPurpose.DIAGNOSTIC);
        assertThatThrownBy(() -> result(command, true)).isInstanceOf(ApiException.class);
        assertThat(remaining()).isEqualTo(2);
        assertThat(movementCount()).isZero();
        assertThat(commands.findById(command.getId()).orElseThrow().getStatus())
                .isEqualTo(CommandStatus.FAILED);
        tx.executeWithoutResult(
                ignored ->
                        assertThat(em.find(MachineSlot.class, slot.getId()).isAvailable())
                                .isFalse());
    }

    private DispenseCommand createCommand(CommandStatus status, int dose, CommandPurpose purpose) {
        return tx.execute(
                ignored -> {
                    DispenseCommand command = new DispenseCommand();
                    command.setPurpose(purpose);
                    command.setMachine(em.find(Machine.class, machine.getId()));
                    command.setSlot(em.find(MachineSlot.class, slot.getId()));
                    if (purpose == CommandPurpose.CUSTOMER) {
                        Order order = new Order();
                        order.setBrand(em.find(Brand.class, brand.getId()));
                        order.setMachine(command.getMachine());
                        order.setSlot(command.getSlot());
                        order.setProduct(em.find(Product.class, product.getId()));
                        order.setStatus(OrderStatus.DISPENSING);
                        order.setPriceSnapshot(20000);
                        order.setCurrency("VND");
                        order.setPaymentRef(UUID.randomUUID().toString());
                        order.setExpiresAt(Instant.now().plusSeconds(120));
                        em.persist(order);
                        command.setOrder(order);
                    } else command.setRequestedBy(operator.getId());
                    command.setIdempotencyKey(UUID.randomUUID().toString());
                    command.setDoseMl(dose);
                    command.setSprayDurationMs(800);
                    command.setSignature("test");
                    command.setStatus(status);
                    command.setIssuedAt(Instant.now());
                    command.setExpiresAt(Instant.now().plusSeconds(30));
                    em.persist(command);
                    return command;
                });
    }

    private void result(DispenseCommand command, boolean success) throws Exception {
        messages.handle(
                machine.getDeviceId(),
                Topics.RESULT,
                json.writeValueAsString(
                        Map.of(
                                "idempotencyKey",
                                command.getIdempotencyKey(),
                                "success",
                                success,
                                "resultCode",
                                success ? "OK" : "DEVICE_FAILED")));
    }

    private int remaining() {
        return bottles.findById(bottle.getId()).orElseThrow().getRemainingQuantityMl();
    }

    private long movementCount() {
        return tx.execute(
                ignored -> (long) movements.findAllScoped(brand.getId(), bottle.getId()).size());
    }

    private long alertCount() {
        return tx.execute(
                ignored ->
                        (long)
                                alertRepository
                                        .findAllScoped(brand.getId(), false, Alert.Status.OPEN)
                                        .size());
    }

    private OrderStatus orderState(DispenseCommand command) {
        return tx.execute(
                ignored -> em.find(DispenseCommand.class, command.getId()).getOrder().getStatus());
    }

    private void setRemaining(int quantity) {
        tx.executeWithoutResult(
                ignored -> {
                    InventoryBottle managed = em.find(InventoryBottle.class, bottle.getId());
                    managed.setRemainingQuantityMl(quantity);
                    managed.setStatus(
                            quantity <= slot.getLowStockThresholdMl()
                                    ? BottleStatus.NEARLY_EMPTY
                                    : BottleStatus.INSTALLED);
                });
    }
}
