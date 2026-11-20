package vn.edu.uth.scentstation.domain.maintenance;

import vn.edu.uth.scentstation.domain.audit.*;

import jakarta.validation.constraints.*;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.alert.*;
import vn.edu.uth.scentstation.domain.catalog.*;
import vn.edu.uth.scentstation.domain.dispensing.*;
import vn.edu.uth.scentstation.domain.inventory.InventoryReferenceRepository;
import vn.edu.uth.scentstation.domain.user.*;
import vn.edu.uth.scentstation.security.*;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class MaintenanceService {
    private static final String READ =
            "hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER','TECHNICIAN')";
    private static final String SUPERVISOR =
            "hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER')";
    private final MaintenanceTicketRepository tickets;
    private final MachineRepository machines;
    private final UserRepository users;
    private final AlertRepository alerts;
    private final InventoryReferenceRepository references;
    private final ObjectProvider<DispenseService> dispensing;
    private final Clock clock;

    public MaintenanceService(
            MaintenanceTicketRepository tickets,
            MachineRepository machines,
            UserRepository users,
            AlertRepository alerts,
            InventoryReferenceRepository references,
            ObjectProvider<DispenseService> dispensing,
            Clock clock) {
        this.tickets = tickets;
        this.machines = machines;
        this.users = users;
        this.alerts = alerts;
        this.references = references;
        this.dispensing = dispensing;
        this.clock = clock;
    }

    public record CreateRequest(
            @NotNull @Positive Long machineId,
            @NotBlank @Size(max = 160) String title,
            @Size(max = 1000) String description,
            String category,
            MaintenanceTicket.Priority priority,
            @Future Instant dueAt,
            @Positive Long assigneeId) {}

    public record AssignRequest(@NotNull @Positive Long assigneeId) {}

    public record RepairRequest(@NotBlank @Size(max = 1000) String repairResult) {}

    public record TestRequest(@NotNull @Positive Long slotId) {}

    public record TicketResponse(
            Long id,
            Long brandId,
            Long machineId,
            String title,
            String description,
            String category,
            MaintenanceTicket.Priority priority,
            Alert.Severity severity,
            MaintenanceTicket.Status status,
            Long assignedTo,
            Instant dueAt,
            Long createdBy,
            Instant createdAt,
            Instant startedAt,
            String repairResult,
            Instant repairedAt,
            Long repairedBy,
            Long testCommandId,
            CommandStatus testStatus,
            boolean testPassed,
            Instant closedAt,
            Long closedBy) {}

    @PreAuthorize(READ)
    @Transactional(readOnly = true)
    public List<TicketResponse> list(AuthenticatedUser p) {
        return tickets.findAllScoped(scope(p)).stream().map(this::response).toList();
    }

    @PreAuthorize(READ)
    @Transactional(readOnly = true)
    public TicketResponse detail(Long id, AuthenticatedUser p) {
        return response(
                tickets.findById(id)
                        .filter(t -> scope(p) == null || t.getBrand().getId().equals(p.brandId()))
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "TICKET_NOT_FOUND",
                                                "No ticket in the permitted brand")));
    }

    @PreAuthorize(READ)
    @Auditable(action="MAINTENANCE_CREATED",target=AuditTarget.MAINTENANCE_TICKET,id="",resultId="#result.id")
    public TicketResponse create(CreateRequest r, AuthenticatedUser p) {
        Machine machine = lockMachine(r.machineId(), scope(p));
        String title = text(r.title(), 160, "Ticket title");
        String category = r.category() == null ? "REPAIR" : r.category().toUpperCase(Locale.ROOT);
        if (!Set.of("REPAIR", "INSPECTION", "REFILL", "LEAK", "DISPENSING", "OFFLINE", "OTHER")
                .contains(category))
            throw ApiException.badRequest("INVALID_CATEGORY", "Unknown maintenance category");
        MaintenanceTicket.Priority priority =
                r.priority() == null ? MaintenanceTicket.Priority.NORMAL : r.priority();
        MaintenanceTicket ticket =
                newTicket(machine, title, r.description(), category, priority, p.userId());
        ticket.setDueAt(r.dueAt());
        Long assignee = r.assigneeId();
        if (!supervisor(p)) {
            if (assignee != null && !assignee.equals(p.userId()))
                throw ApiException.forbidden(
                        "ASSIGNMENT_FORBIDDEN",
                        "Technicians may only assign themselves on creation");
            assignee = p.userId();
        }
        if (assignee != null) {
            technician(assignee, machine.getBrand().getId());
            ticket.setAssignedTo(assignee);
            ticket.setStatus(MaintenanceTicket.Status.ASSIGNED);
        }
        if (priority == MaintenanceTicket.Priority.CRITICAL)
            machine.setOperatingStatus(OperatingStatus.MAINTENANCE);
        return response(tickets.saveAndFlush(ticket));
    }

    @PreAuthorize(SUPERVISOR)
    @Auditable(action="MAINTENANCE_ASSIGNED",target=AuditTarget.MAINTENANCE_TICKET)
    public TicketResponse assign(Long id, AssignRequest r, AuthenticatedUser p) {
        MaintenanceTicket t = target(id, p, false);
        requireOpen(t);
        technician(r.assigneeId(), t.getBrand().getId());
        t.setAssignedTo(r.assigneeId());
        if (t.getStatus() == MaintenanceTicket.Status.OPEN)
            t.setStatus(MaintenanceTicket.Status.ASSIGNED);
        return response(t);
    }

    @PreAuthorize(READ)
    @Auditable(action="MAINTENANCE_STARTED",target=AuditTarget.MAINTENANCE_TICKET)
    public TicketResponse start(Long id, AuthenticatedUser p) {
        MaintenanceTicket t = target(id, p, true);
        requireOpen(t);
        if (t.getStatus() != MaintenanceTicket.Status.OPEN
                && t.getStatus() != MaintenanceTicket.Status.ASSIGNED
                && t.getStatus() != MaintenanceTicket.Status.IN_PROGRESS)
            throw ApiException.conflict(
                    "INVALID_TICKET_STATE", "Ticket has already moved beyond initial service");
        if (t.getStartedAt() == null) {
            t.setStartedAt(clock.instant());
            if (t.getPriority() != MaintenanceTicket.Priority.CRITICAL)
                t.setPreviousOperatingStatus(t.getMachine().getOperatingStatus());
        }
        t.getMachine().setOperatingStatus(OperatingStatus.MAINTENANCE);
        t.setStatus(MaintenanceTicket.Status.IN_PROGRESS);
        return response(t);
    }

    @PreAuthorize(READ)
    @Auditable(action="MAINTENANCE_REPAIRED",target=AuditTarget.MAINTENANCE_TICKET)
    public TicketResponse repair(Long id, RepairRequest r, AuthenticatedUser p) {
        MaintenanceTicket t = target(id, p, true);
        requireOpen(t);
        if (t.getStartedAt() == null)
            throw ApiException.conflict(
                    "SERVICE_NOT_STARTED", "Start service before recording repair");
        if (t.getTestCommand() != null && t.getTestCommand().isInFlight())
            throw ApiException.conflict(
                    "TEST_IN_PROGRESS",
                    "Wait for the diagnostic result before changing the repair record");
        t.setRepairResult(text(r.repairResult(), 1000, "Repair result"));
        t.setRepairedAt(clock.instant());
        t.setRepairedBy(p.userId());
        t.setTestCommand(null);
        t.setStatus(MaintenanceTicket.Status.REPAIRED);
        return response(t);
    }

    @PreAuthorize(READ)
    @Auditable(action="DIAGNOSTIC_REQUESTED",target=AuditTarget.MAINTENANCE_TICKET)
    public TicketResponse requestTest(Long id, TestRequest r, AuthenticatedUser p) {
        MaintenanceTicket t = target(id, p, true);
        requireOpen(t);
        requireRepair(t);
        if (t.getTestCommand() != null && t.getTestCommand().isInFlight())
            throw ApiException.conflict("TEST_IN_PROGRESS", "The previous test is still in flight");
        if (t.getMachine().getConnectivityStatus() != ConnectivityStatus.ONLINE)
            throw ApiException.conflict(
                    "MACHINE_OFFLINE", "Machine must be online for a diagnostic test");
        requireSafeConditions(t.getMachine().getId());
        MachineSlot slot = references.lockSlot(r.slotId(), scope(p));
        if (!slot.getMachine().getId().equals(t.getMachine().getId()))
            throw ApiException.badRequest(
                    "TEST_MACHINE_MISMATCH", "Test slot must belong to the ticket machine");
        DispenseCommand command = dispensing.getObject().issueDiagnosticCommand(slot, p.userId());
        t.setTestCommand(command);
        t.setStatus(MaintenanceTicket.Status.TESTING);
        return response(t);
    }

    @PreAuthorize(READ)
    @Auditable(action="MAINTENANCE_CLOSED",target=AuditTarget.MAINTENANCE_TICKET)
    public TicketResponse close(Long id, AuthenticatedUser p) {
        MaintenanceTicket t = target(id, p, true);
        if (t.getStatus() == MaintenanceTicket.Status.CLOSED) return response(t);
        requireRepair(t);
        if (!passed(t))
            throw ApiException.conflict(
                    "POST_MAINTENANCE_TEST_REQUIRED",
                    "A confirmed successful diagnostic after the recorded repair is required");
        requireSafeConditions(t.getMachine().getId());
        t.setStatus(MaintenanceTicket.Status.CLOSED);
        t.setClosedAt(clock.instant());
        t.setClosedBy(p.userId());
        for (Alert a : alerts.findByMaintenanceTicketId(t.getId())) {
            a.setStatus(Alert.Status.RESOLVED);
            a.setResolvedAt(clock.instant());
            a.setResolvedBy(p.userId());
            a.setConditionActive(false);
            a.setResolution(
                    "Maintenance ticket " + t.getId() + " closed after repair and confirmed test");
        }
        boolean otherBlocking =
                tickets
                        .findByMachineIdAndStatusNotOrderById(
                                t.getMachine().getId(), MaintenanceTicket.Status.CLOSED)
                        .stream()
                        .anyMatch(
                                other ->
                                        !other.getId().equals(t.getId())
                                                && (other.getPriority()
                                                                == MaintenanceTicket.Priority
                                                                        .CRITICAL
                                                        || other.getStartedAt() != null));
        if (!otherBlocking)
            t.getMachine()
                    .setOperatingStatus(
                            t.getPreviousOperatingStatus() == OperatingStatus.DISABLED
                                    ? OperatingStatus.DISABLED
                                    : OperatingStatus.ACTIVE);
        return response(t);
    }

    /** Trusted event path; AlertService holds the machine lock. */
    public MaintenanceTicket ensureForCriticalAlert(Alert alert) {
        List<MaintenanceTicket> active =
                tickets.findByMachineIdAndStatusNotOrderById(
                        alert.getMachine().getId(), MaintenanceTicket.Status.CLOSED);
        MaintenanceTicket ticket =
                active.stream()
                        .filter(t -> t.getPriority() == MaintenanceTicket.Priority.CRITICAL)
                        .findFirst()
                        .orElse(active.isEmpty() ? null : active.getFirst());
        if (ticket == null)
            ticket =
                    newTicket(
                            alert.getMachine(),
                            "Auto: " + alert.getAlertType(),
                            alert.getMessage(),
                            alert.getAlertType().equals("LEAK") ? "LEAK" : "DISPENSING",
                            MaintenanceTicket.Priority.CRITICAL,
                            null);
        else {
            ticket.setPriority(MaintenanceTicket.Priority.CRITICAL);
            ticket.setSeverity(Alert.Severity.CRITICAL);
            ticket.setRepairResult(null);
            ticket.setRepairedAt(null);
            ticket.setRepairedBy(null);
            ticket.setTestCommand(null);
            ticket.setStatus(
                    ticket.getStartedAt() == null
                            ? MaintenanceTicket.Status.OPEN
                            : MaintenanceTicket.Status.IN_PROGRESS);
        }
        alert.getMachine().setOperatingStatus(OperatingStatus.MAINTENANCE);
        return tickets.saveAndFlush(ticket);
    }

    private MaintenanceTicket newTicket(
            Machine machine,
            String title,
            String description,
            String category,
            MaintenanceTicket.Priority priority,
            Long actor) {
        MaintenanceTicket t = new MaintenanceTicket();
        t.setBrand(machine.getBrand());
        t.setMachine(machine);
        t.setTitle(title);
        t.setDescription(description);
        t.setCategory(category);
        t.setPriority(priority);
        t.setSeverity(
                priority == MaintenanceTicket.Priority.CRITICAL
                        ? Alert.Severity.CRITICAL
                        : Alert.Severity.WARNING);
        t.setStatus(MaintenanceTicket.Status.OPEN);
        t.setCreatedBy(actor);
        t.setPreviousOperatingStatus(machine.getOperatingStatus());
        return t;
    }

    private MaintenanceTicket target(Long id, AuthenticatedUser p, boolean technicianWrite) {
        Long brand = scope(p);
        Long machine =
                tickets.machineIdScoped(id, brand)
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "TICKET_NOT_FOUND",
                                                "No ticket in the permitted brand"));
        lockMachine(machine, brand);
        MaintenanceTicket t =
                tickets.lockScoped(id, brand)
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "TICKET_NOT_FOUND",
                                                "No ticket in the permitted brand"));
        if (technicianWrite && !supervisor(p) && !Objects.equals(t.getAssignedTo(), p.userId()))
            throw ApiException.forbidden(
                    "TICKET_ASSIGNEE_REQUIRED",
                    "Technicians may act only on tickets assigned to them");
        return t;
    }

    private Machine lockMachine(Long id, Long brand) {
        return machines.lockById(id)
                .filter(m -> brand == null || m.getBrand().getId().equals(brand))
                .orElseThrow(
                        () ->
                                ApiException.notFound(
                                        "MACHINE_NOT_FOUND", "No machine in the permitted brand"));
    }

    private void technician(Long id, Long brand) {
        User u =
                users.findById(id)
                        .filter(user -> Objects.equals(user.brandId(), brand))
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "TECHNICIAN_NOT_FOUND",
                                                "No technician in the ticket brand"));
        if (u.getStatus() != UserStatus.ACTIVE || !u.roleNames().contains(Roles.TECHNICIAN))
            throw ApiException.badRequest(
                    "INVALID_TECHNICIAN",
                    "Assignee must be an active technician in the same brand");
    }

    private void requireOpen(MaintenanceTicket t) {
        if (t.getStatus() == MaintenanceTicket.Status.CLOSED)
            throw ApiException.conflict("TICKET_CLOSED", "Closed tickets cannot be modified");
    }

    private void requireRepair(MaintenanceTicket t) {
        if (t.getRepairResult() == null
                || t.getRepairResult().isBlank()
                || t.getRepairedAt() == null)
            throw ApiException.conflict(
                    "REPAIR_REQUIRED", "Record the repair result before test or closure");
    }

    private void requireSafeConditions(Long machine) {
        boolean unsafe =
                alerts.findByMachineIdAndStatusNot(machine, Alert.Status.RESOLVED).stream()
                        .anyMatch(
                                a ->
                                        a.isConditionActive()
                                                && Set.of("DOOR_OPEN", "LEAK")
                                                        .contains(a.getAlertType()));
        if (unsafe)
            throw ApiException.conflict(
                    "UNSAFE_MACHINE", "Door/leak condition must be cleared before test or closure");
    }

    private boolean passed(MaintenanceTicket t) {
        DispenseCommand c = t.getTestCommand();
        return c != null
                && t.getRepairedAt() != null
                && c.getPurpose() == CommandPurpose.DIAGNOSTIC
                && c.getStatus() == CommandStatus.SUCCEEDED
                && c.isInventoryApplied()
                && c.getCompletedAt() != null
                && !c.getIssuedAt().isBefore(t.getRepairedAt())
                && !c.getCompletedAt().isBefore(t.getRepairedAt())
                && c.getMachine().getId().equals(t.getMachine().getId());
    }

    private boolean supervisor(AuthenticatedUser p) {
        return p.isPlatformAdmin()
                || p.roles().contains(Roles.BRAND_ADMIN)
                || p.roles().contains(Roles.OPERATIONS_MANAGER);
    }

    private Long scope(AuthenticatedUser p) {
        if (p == null || (!p.isPlatformAdmin() && p.brandId() == null))
            throw ApiException.forbidden("BRAND_SCOPE_REQUIRED", "Valid brand scope is required");
        return p.isPlatformAdmin() ? null : p.brandId();
    }

    private String text(String s, int max, String label) {
        if (s == null || s.isBlank() || s.strip().length() > max)
            throw ApiException.badRequest(
                    "INVALID_MAINTENANCE_INPUT",
                    label + " is required and must not exceed " + max + " characters");
        return s.strip();
    }

    private TicketResponse response(MaintenanceTicket t) {
        DispenseCommand c = t.getTestCommand();
        return new TicketResponse(
                t.getId(),
                t.getBrand().getId(),
                t.getMachine().getId(),
                t.getTitle(),
                t.getDescription(),
                t.getCategory(),
                t.getPriority(),
                t.getSeverity(),
                t.getStatus(),
                t.getAssignedTo(),
                t.getDueAt(),
                t.getCreatedBy(),
                t.getCreatedAt(),
                t.getStartedAt(),
                t.getRepairResult(),
                t.getRepairedAt(),
                t.getRepairedBy(),
                c == null ? null : c.getId(),
                c == null ? null : c.getStatus(),
                passed(t),
                t.getClosedAt(),
                t.getClosedBy());
    }
}
