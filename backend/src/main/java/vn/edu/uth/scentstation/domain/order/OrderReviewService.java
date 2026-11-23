package vn.edu.uth.scentstation.domain.order;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.audit.*;
import vn.edu.uth.scentstation.domain.catalog.Machine;
import vn.edu.uth.scentstation.domain.dispensing.*;
import vn.edu.uth.scentstation.domain.inventory.InventoryService;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.time.Clock;
import java.util.*;

@Service
@Transactional
@PreAuthorize(RefundService.OPERATORS)
public class OrderReviewService {
    public record Review(
            @NotNull OrderStatus decision,
            @NotBlank @Size(max = 400) String note,
            @NotBlank @Size(max = 1000) String evidence) {}

    public record Result(Long orderId, OrderStatus status, String note) {}

    @PersistenceContext private EntityManager em;
    private final JdbcTemplate jdbc;
    private final OrderStateMachine states;
    private final InventoryService inventory;
    private final Clock clock;

    public OrderReviewService(
            JdbcTemplate jdbc, OrderStateMachine states, InventoryService inventory, Clock clock) {
        this.jdbc = jdbc;
        this.states = states;
        this.inventory = inventory;
        this.clock = clock;
    }

    @Auditable(action = "ORDER_REVIEWED", target = AuditTarget.ORDER, reason = "#p1.note")
    public Result review(Long id, Review r, AuthenticatedUser p) {
        Long brand = p.isPlatformAdmin() ? null : p.brandId();
        if (!p.isPlatformAdmin() && brand == null)
            throw ApiException.forbidden("BRAND_SCOPE_REQUIRED", "Valid brand scope required");
        List<Long> machineIds =
                em.createQuery(
                                "select o.machine.id from Order o where o.id=:id and (:brand is"
                                    + " null or o.brand.id=:brand)",
                                Long.class)
                        .setParameter("id", id)
                        .setParameter("brand", brand)
                        .getResultList();
        if (machineIds.isEmpty())
            throw ApiException.notFound("ORDER_NOT_FOUND", "No order in the permitted scope");
        em.find(Machine.class, machineIds.getFirst(), LockModeType.PESSIMISTIC_WRITE);
        Order order = em.find(Order.class, id, LockModeType.PESSIMISTIC_WRITE);
        var previous =
                jdbc.queryForList(
                        "SELECT decision,note,evidence FROM order_reviews WHERE order_id=?", id);
        if (!previous.isEmpty()) {
            var old = previous.getFirst();
            if (old.get("decision").equals(r.decision().name())
                    && old.get("note").equals(r.note().strip())
                    && old.get("evidence").equals(r.evidence().strip()))
                return new Result(id, order.getStatus(), order.getReviewNote());
            throw ApiException.conflict(
                    "ORDER_ALREADY_REVIEWED", "A recorded review cannot be overwritten");
        }
        if (order.getStatus() != OrderStatus.UNCERTAIN)
            throw ApiException.conflict(
                    "ORDER_NOT_UNCERTAIN", "Only an UNCERTAIN order requires this review");
        if (r.decision() != OrderStatus.DISPENSED && r.decision() != OrderStatus.FAILED)
            throw ApiException.badRequest(
                    "INVALID_REVIEW_DECISION",
                    "Review must establish DISPENSED or definite FAILED");
        List<DispenseCommand> commands =
                em.createQuery(
                                "select c from DispenseCommand c where c.order.id=:id order by"
                                    + " c.id",
                                DispenseCommand.class)
                        .setParameter("id", id)
                        .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                        .getResultList();
        if (commands.size() != 1 || commands.getFirst().isInFlight())
            throw ApiException.conflict(
                    "COMMAND_REVIEW_REQUIRED",
                    "Exactly one finished/timed-out command is required; never issue a second"
                        + " command");
        DispenseCommand command = commands.getFirst();
        if (r.decision() == OrderStatus.DISPENSED) {
            command.setStatus(CommandStatus.SUCCEEDED);
            command.setCompletedAt(clock.instant());
            command.setResultCode("HUMAN_VERIFIED_SUCCESS");
            inventory.deductForCommand(command);
        } else {
            if (command.isInventoryApplied())
                throw ApiException.conflict(
                        "CONSUMPTION_ALREADY_RECORDED",
                        "Cannot declare failure after recorded successful consumption");
            command.setStatus(CommandStatus.FAILED);
            command.setCompletedAt(clock.instant());
            command.setResultCode("HUMAN_VERIFIED_FAILURE");
        }
        states.resolveUncertain(order, r.decision(), r.note().strip());
        jdbc.update(
                "INSERT INTO order_reviews(order_id,reviewed_by,decision,evidence,note) VALUES"
                    + " (?,?,?,?,?)",
                id,
                p.userId(),
                r.decision().name(),
                r.evidence().strip(),
                r.note().strip());
        return new Result(id, order.getStatus(), order.getReviewNote());
    }
}
