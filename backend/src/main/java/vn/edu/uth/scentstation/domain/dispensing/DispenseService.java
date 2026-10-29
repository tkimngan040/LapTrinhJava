package vn.edu.uth.scentstation.domain.dispensing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.config.ScentStationProperties;
import vn.edu.uth.scentstation.domain.catalog.MachineSlot;
import vn.edu.uth.scentstation.domain.inventory.InventoryService;
import vn.edu.uth.scentstation.domain.order.Order;
import vn.edu.uth.scentstation.domain.order.OrderRepository;
import vn.edu.uth.scentstation.domain.order.OrderStateMachine;
import vn.edu.uth.scentstation.domain.order.OrderStatus;
import vn.edu.uth.scentstation.iot.CommandSigner;
import vn.edu.uth.scentstation.iot.DeviceGateway;

import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Issues dispensing commands and applies what the device reports back
 * (Report section 2.9.3, steps 6 to 10).
 *
 * <p>This is the part of the system where a mistake costs a customer money,
 * so three rules are held to strictly:
 * <ul>
 *   <li>a command is only ever created for an order the backend itself marked
 *       PAID (FR4.1);</li>
 *   <li>one order has at most one command in flight, guaranteed by the partial
 *       unique index rather than by this code alone (BR6);</li>
 *   <li>a timeout never produces a second command. The order becomes
 *       UNCERTAIN and waits for a person (BR14, NFR4.5, FR4.11).</li>
 * </ul>
 */
@Service
public class DispenseService {

    private static final Logger log = LoggerFactory.getLogger(DispenseService.class);

    private final DispenseCommandRepository commandRepository;
    private final OrderRepository orderRepository;
    private final OrderStateMachine stateMachine;
    private final InventoryService inventoryService;
    private final DeviceGateway deviceGateway;
    private final CommandSigner signer;
    private final ScentStationProperties properties;
    private final Clock clock;

    public DispenseService(DispenseCommandRepository commandRepository,
                           OrderRepository orderRepository,
                           OrderStateMachine stateMachine,
                           InventoryService inventoryService,
                           DeviceGateway deviceGateway,
                           ScentStationProperties properties,
                           Clock clock) {
        this.commandRepository = commandRepository;
        this.orderRepository = orderRepository;
        this.stateMachine = stateMachine;
        this.inventoryService = inventoryService;
        this.deviceGateway = deviceGateway;
        this.properties = properties;
        this.clock = clock;
        this.signer = new CommandSigner(properties.getMqtt().getCommandSecret());
    }

    /** Creates, signs and publishes the one command a paid order is entitled to. */
    @Transactional
    public DispenseCommand issueCommand(Order order) {
        if (order.getStatus() != OrderStatus.PAID) {
            // FR4.1: nothing is dispensed for an order the backend has not
            // itself confirmed as paid.
            throw ApiException.conflict("ORDER_NOT_PAID",
                    "A dispensing command needs an order in PAID, not " + order.getStatus());
        }

        MachineSlot slot = order.getSlot();
        Instant now = clock.instant();
        Instant expiresAt = now.plusSeconds(properties.getDispensing().getCommandTtlSeconds());

        DispenseCommand command = new DispenseCommand();
        command.setOrder(order);
        command.setMachine(order.getMachine());
        command.setSlot(slot);
        command.setIdempotencyKey(newIdempotencyKey());
        command.setDoseMl(slot.getDoseMl());
        command.setSprayDurationMs(slot.getSprayDurationMs());
        command.setStatus(CommandStatus.ISSUED);
        command.setIssuedAt(now);
        command.setExpiresAt(expiresAt);
        command.setInventoryApplied(false);
        command.setSignature("pending");

        DispenseCommand saved;
        try {
            saved = commandRepository.saveAndFlush(command);
        } catch (DataIntegrityViolationException ex) {
            // BR6: uq_command_active_order refused a second in-flight command.
            // Two threads raced; the other one won, and that is the correct
            // outcome rather than an error to paper over.
            log.warn("Order {} already has a command in flight", order.getId());
            throw ApiException.conflict("COMMAND_ALREADY_IN_FLIGHT",
                    "This order already has a dispensing command in flight");
        }

        Map<String, Object> payload = payloadOf(saved);
        String signature = signer.sign(payload);
        saved.setSignature(signature);
        commandRepository.save(saved);
        payload.put(CommandSigner.SIGNATURE_FIELD, signature);

        stateMachine.transition(order, OrderStatus.DISPENSING);
        orderRepository.save(order);

        deviceGateway.publishCommand(order.getMachine().getDeviceId(), payload);
        log.info("Command {} issued for order {} on {} slot {}",
                saved.getId(), order.getId(),
                order.getMachine().getDeviceId(), slot.getSlotNumber());
        return saved;
    }

    /**
     * Applies an acknowledgement from the device (FR4.5, FR4.6).
     *
     * <p>An accepted acknowledgement changes nothing about the order: it only
     * says the command arrived. A refusal is a definite failure, so the order
     * can go to FAILED immediately rather than waiting for a timeout.
     */
    @Transactional
    public void applyAck(String idempotencyKey, boolean accepted, String reason) {
        DispenseCommand command = requireCommand(idempotencyKey);

        if (!command.isInFlight()) {
            log.info("Ack for command {} ignored; it is already {}",
                    command.getId(), command.getStatus());
            return;
        }

        command.setAcknowledgedAt(clock.instant());

        if (accepted) {
            command.setStatus(CommandStatus.ACKNOWLEDGED);
            commandRepository.save(command);
            log.info("Command {} acknowledged by the device", command.getId());
            return;
        }

        command.setStatus(CommandStatus.REJECTED);
        command.setFailureReason(reason);
        command.setCompletedAt(clock.instant());
        commandRepository.save(command);

        Order order = command.getOrder();
        stateMachine.transition(order, OrderStatus.FAILED,
                reason == null ? "The device refused the command" : reason);
        orderRepository.save(order);
        log.warn("Command {} refused by the device: {}", command.getId(), reason);
    }

    /**
     * Applies the final result (Report section 2.9.3, step 10).
     *
     * <p>A device may publish the same result twice. The second one finds the
     * command already in a terminal status and returns without touching
     * inventory, which together with {@code uq_command_idempotency} is NFR3.4.
     */
    @Transactional
    public void applyResult(String idempotencyKey, boolean success,
                            String resultCode, String reason) {
        DispenseCommand command = requireCommand(idempotencyKey);

        if (!command.isInFlight()) {
            // Already settled. Doing nothing is exactly right: this is what
            // stops a repeated result from deducting stock twice.
            log.info("Result for command {} ignored; it is already {}",
                    command.getId(), command.getStatus());
            return;
        }

        command.setCompletedAt(clock.instant());
        command.setResultCode(resultCode);
        Order order = command.getOrder();

        if (!success) {
            command.setStatus(CommandStatus.FAILED);
            command.setFailureReason(reason);
            commandRepository.save(command);
            stateMachine.transition(order, OrderStatus.FAILED,
                    reason == null ? "The device reported a failure" : reason);
            orderRepository.save(order);
            log.warn("Command {} failed: {}", command.getId(), reason);
            return;
        }

        command.setStatus(CommandStatus.SUCCEEDED);
        commandRepository.save(command);

        // BR10: only a confirmed spray reduces sale inventory. If this throws,
        // the whole transaction rolls back and the order is left for review
        // rather than being reported as complete (Report section 2.9.4).
        inventoryService.deductForCommand(command);
        command.setInventoryApplied(true);
        commandRepository.save(command);

        stateMachine.transition(order, OrderStatus.DISPENSED);
        orderRepository.save(order);
        log.info("Command {} succeeded; order {} dispensed", command.getId(), order.getId());
    }

    /**
     * Moves orders whose device never answered into UNCERTAIN (BR14, NFR4.5).
     *
     * <p>The one thing this must not do is issue another command. The backend
     * cannot tell "the spray happened and the reply was lost" from "nothing
     * happened", and retrying would mean sometimes spraying twice for one
     * payment. A person decides instead.
     */
    @Transactional
    public int timeOutStaleCommands() {
        Instant cutoff = clock.instant()
                .minusSeconds(properties.getDispensing().getResultTimeoutSeconds());

        List<DispenseCommand> stale = commandRepository.findByStatusInAndIssuedAtBefore(
                List.of(CommandStatus.ISSUED, CommandStatus.ACKNOWLEDGED), cutoff);

        for (DispenseCommand command : stale) {
            command.setStatus(CommandStatus.TIMED_OUT);
            command.setCompletedAt(clock.instant());
            command.setFailureReason("No result received before the timeout");
            commandRepository.save(command);

            Order order = command.getOrder();
            if (order.getStatus() == OrderStatus.DISPENSING) {
                stateMachine.transition(order, OrderStatus.UNCERTAIN,
                        "No result received from the device; needs human review");
                orderRepository.save(order);
                log.warn("Order {} is UNCERTAIN: command {} never reported back. "
                                + "No second command will be issued.",
                        order.getId(), command.getId());
            }
        }
        return stale.size();
    }

    private DispenseCommand requireCommand(String idempotencyKey) {
        return commandRepository.findByIdempotencyKey(idempotencyKey)
                .orElseThrow(() -> ApiException.notFound("COMMAND_NOT_FOUND",
                        "No dispensing command with key " + idempotencyKey));
    }

    /**
     * The five things a command must carry (Report section 2.8.4 point 4):
     * which device, an idempotency key, an expiry, the spray parameters, and
     * the signature, which is added after this map is built.
     */
    private Map<String, Object> payloadOf(DispenseCommand command) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("deviceId", command.getMachine().getDeviceId());
        payload.put("commandId", command.getId());
        payload.put("slotNumber", command.getSlot().getSlotNumber());
        payload.put("doseMl", command.getDoseMl());
        payload.put("sprayDurationMs", command.getSprayDurationMs());
        payload.put("idempotencyKey", command.getIdempotencyKey());
        payload.put("expiresAt", command.getExpiresAt().toString());
        return payload;
    }

    private String newIdempotencyKey() {
        return UUID.randomUUID().toString();
    }
}
