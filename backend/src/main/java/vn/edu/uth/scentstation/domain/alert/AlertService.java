package vn.edu.uth.scentstation.domain.alert;

import vn.edu.uth.scentstation.domain.audit.*;

import jakarta.validation.constraints.*;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.catalog.*;
import vn.edu.uth.scentstation.domain.dispensing.DispenseCommand;
import vn.edu.uth.scentstation.domain.inventory.InventoryBottle;
import vn.edu.uth.scentstation.domain.maintenance.*;
import vn.edu.uth.scentstation.domain.user.*;
import vn.edu.uth.scentstation.security.*;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class AlertService {
    private static final String READ =
            "hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER','TECHNICIAN','INVENTORY_STAFF','VIEWER')";
    private static final String ACK =
            "hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER','TECHNICIAN','INVENTORY_STAFF')";
    private static final String MANAGE =
            "hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER','TECHNICIAN')";
    private final AlertRepository alerts;
    private final MaintenanceService maintenance;
    private final MachineRepository machines;
    private final UserRepository users;
    private final Clock clock;

    public AlertService(
            AlertRepository alerts,
            MaintenanceService maintenance,
            MachineRepository machines,
            UserRepository users,
            Clock clock) {
        this.alerts = alerts;
        this.maintenance = maintenance;
        this.machines = machines;
        this.users = users;
        this.clock = clock;
    }

    public record NoteRequest(@NotBlank @Size(max = 1000) String reason) {}

    public record AssignRequest(@NotNull @Positive Long assigneeId) {}

    public record AlertResponse(
            Long id,
            String alertType,
            Alert.Status status,
            Long bottleId,
            Long machineId,
            Long slotId,
            Integer remainingQuantityMl,
            Integer thresholdMl,
            String message,
            Instant createdAt,
            Instant resolvedAt,
            Alert.Severity severity,
            boolean conditionActive,
            Long acknowledgedBy,
            Instant acknowledgedAt,
            Long assignedTo,
            Long resolvedBy,
            String resolution,
            Long reopenedBy,
            Instant reopenedAt,
            int reopenCount,
            Long maintenanceTicketId) {}

    @PreAuthorize(READ)
    @Transactional(readOnly = true)
    public List<AlertResponse> list(boolean activeOnly, AuthenticatedUser p) {
        return alerts.findAllScoped(scope(p), activeOnly, Alert.Status.RESOLVED).stream()
                .map(this::response)
                .toList();
    }

    @PreAuthorize(ACK)
    @Auditable(action="ALERT_ACKNOWLEDGED",target=AuditTarget.ALERT)
    public AlertResponse acknowledge(Long id, AuthenticatedUser p) {
        Alert a = target(id, p);
        requireActive(a);
        if (a.getAcknowledgedAt() == null) {
            a.setAcknowledgedAt(clock.instant());
            a.setAcknowledgedBy(p.userId());
        }
        if (a.getStatus() == Alert.Status.OPEN) a.setStatus(Alert.Status.ACKNOWLEDGED);
        return response(a);
    }

    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN','BRAND_ADMIN','OPERATIONS_MANAGER')")
    @Auditable(action="ALERT_ASSIGNED",target=AuditTarget.ALERT)
    public AlertResponse assign(Long id, AssignRequest r, AuthenticatedUser p) {
        Alert a = target(id, p);
        requireActive(a);
        User u =
                users.findById(r.assigneeId())
                        .filter(user -> Objects.equals(user.brandId(), a.getBrand().getId()))
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "ASSIGNEE_NOT_FOUND",
                                                "No assignee in the alert brand"));
        boolean role =
                u.roleNames().contains(Roles.TECHNICIAN)
                        || (a.getAlertType().equals("LOW_STOCK")
                                && u.roleNames().contains(Roles.INVENTORY_STAFF));
        if (u.getStatus() != UserStatus.ACTIVE || !role)
            throw ApiException.badRequest(
                    "INVALID_ASSIGNEE", "Assignee must have an active technical or inventory role");
        a.setAssignedTo(u.getId());
        a.setStatus(Alert.Status.ASSIGNED);
        if (a.getMaintenanceTicket() != null
                && a.getMaintenanceTicket().getStatus() != MaintenanceTicket.Status.CLOSED)
            maintenance.assign(
                    a.getMaintenanceTicket().getId(),
                    new MaintenanceService.AssignRequest(u.getId()),
                    p);
        return response(a);
    }

    @PreAuthorize(MANAGE)
    @Auditable(action="ALERT_RESOLVED",target=AuditTarget.ALERT,reason="#p1.reason")
    public AlertResponse resolve(Long id, NoteRequest r, AuthenticatedUser p) {
        Alert a = target(id, p);
        String reason = note(r.reason());
        if (a.getStatus() == Alert.Status.RESOLVED) return response(a);
        if (a.getMaintenanceTicket() != null
                && a.getMaintenanceTicket().getStatus() != MaintenanceTicket.Status.CLOSED)
            throw ApiException.conflict(
                    "MAINTENANCE_REQUIRED",
                    "Repair and pass the post-maintenance test before resolving this critical"
                        + " alert");
        if (a.getSeverity() == Alert.Severity.CRITICAL && a.isConditionActive())
            throw ApiException.conflict(
                    "CONDITION_STILL_ACTIVE", "Clear the observed condition before resolution");
        resolved(a, reason, p.userId());
        return response(a);
    }

    @PreAuthorize(MANAGE)
    @Auditable(action="ALERT_REOPENED",target=AuditTarget.ALERT,reason="#p1.reason")
    public AlertResponse reopen(Long id, NoteRequest r, AuthenticatedUser p) {
        Alert a = target(id, p);
        String reason = note(r.reason());
        if (a.getStatus() != Alert.Status.RESOLVED) return response(a);
        var other = alerts.findActiveIncident(a.getIncidentKey(), Alert.Status.RESOLVED);
        if (other.isPresent() && !other.get().getId().equals(a.getId()))
            throw ApiException.conflict(
                    "INCIDENT_ALREADY_ACTIVE",
                    "Another active alert already represents this incident");
        a.setStatus(Alert.Status.OPEN);
        a.setResolvedAt(null);
        a.setResolvedBy(null);
        a.setResolution(null);
        a.setAcknowledgedAt(null);
        a.setAcknowledgedBy(null);
        a.setAssignedTo(null);
        a.setReopenedAt(clock.instant());
        a.setReopenedBy(p.userId());
        a.setReopenCount(a.getReopenCount() + 1);
        a.setConditionActive(!a.getAlertType().equals("DISPENSE_FAILED"));
        a.setMessage(("Reopened: " + reason).substring(0, Math.min(300, 10 + reason.length())));
        if (a.getSeverity() == Alert.Severity.CRITICAL)
            a.setMaintenanceTicket(maintenance.ensureForCriticalAlert(a));
        return response(alerts.saveAndFlush(a));
    }

    /**
     * Trusted machine event path. The machine lock serialises deduplication and ticket creation.
     */
    public void reconcileMachineCondition(Machine machine, String type, boolean active) {
        if (!Set.of("OFFLINE", "DOOR_OPEN", "LEAK").contains(type))
            throw ApiException.badRequest("INVALID_ALERT_TYPE", "Unsupported condition type");
        Machine locked =
                machines.lockById(machine.getId())
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "MACHINE_NOT_FOUND", "No such machine"));
        String key = type + ":MACHINE:" + locked.getId();
        if (active)
            raise(locked, null, type, key, type + " detected on " + locked.getDeviceId(), true);
        else
            alerts.findActiveIncident(key, Alert.Status.RESOLVED)
                    .ifPresent(
                            a -> {
                                a.setConditionActive(false);
                                if (a.getMaintenanceTicket() == null
                                        || a.getMaintenanceTicket().getStatus()
                                                == MaintenanceTicket.Status.CLOSED)
                                    resolved(a, "Observed condition cleared", null);
                            });
    }

    public void raiseDispenseFailure(DispenseCommand command, String reason) {
        Machine machine =
                machines.lockById(command.getMachine().getId())
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "MACHINE_NOT_FOUND", "No such machine"));
        String message = "Dispensing failed: " + (reason == null ? "No successful result" : reason);
        raise(
                machine,
                command.getSlot(),
                "DISPENSE_FAILED",
                "DISPENSE_FAILED:MACHINE:" + machine.getId() + ":SLOT:" + command.getSlot().getId(),
                message.substring(0, Math.min(300, message.length())),
                false);
    }

    private Alert raise(
            Machine machine,
            MachineSlot slot,
            String type,
            String key,
            String message,
            boolean condition) {
        var existing = alerts.findActiveIncident(key, Alert.Status.RESOLVED);
        if (existing.isPresent()) {
            existing.get().setConditionActive(condition);
            return existing.get();
        }
        Alert a = new Alert();
        a.setBrand(machine.getBrand());
        a.setMachine(machine);
        a.setSlot(slot);
        a.setAlertType(type);
        a.setIncidentKey(key);
        a.setConditionActive(condition);
        a.setMessage(message);
        a.setSeverity(
                Set.of("LEAK", "DISPENSE_FAILED").contains(type)
                        ? Alert.Severity.CRITICAL
                        : Alert.Severity.WARNING);
        alerts.saveAndFlush(a);
        if (a.getSeverity() == Alert.Severity.CRITICAL)
            a.setMaintenanceTicket(maintenance.ensureForCriticalAlert(a));
        return a;
    }

    /**
     * Joins the stock transaction. Caller holds its slot/bottle lock; no machine lock is acquired.
     */
    public void reconcileLowStock(InventoryBottle bottle) {
        MachineSlot slot = bottle.getSlot();
        String key = "LOW_STOCK:BOTTLE:" + bottle.getId();
        var open = alerts.findActiveIncident(key, Alert.Status.RESOLVED);
        if (slot == null || bottle.getRemainingQuantityMl() > slot.getLowStockThresholdMl()) {
            open.ifPresent(
                    a -> {
                        a.setConditionActive(false);
                        resolved(a, "Stock restored or bottle removed", null);
                    });
            return;
        }
        if (open.isPresent()) return;
        Alert a = new Alert();
        a.setBrand(bottle.getProduct().getBrand());
        a.setMachine(slot.getMachine());
        a.setSlot(slot);
        a.setBottle(bottle);
        a.setIncidentKey(key);
        a.setRemainingQuantityMl(bottle.getRemainingQuantityMl());
        a.setThresholdMl(slot.getLowStockThresholdMl());
        a.setMessage(
                "Bottle "
                        + bottle.getBottleCode()
                        + " has "
                        + bottle.getRemainingQuantityMl()
                        + " ml remaining");
        alerts.saveAndFlush(a);
    }

    private Alert target(Long id, AuthenticatedUser p) {
        Long brand = scope(p);
        Long machine =
                alerts.machineIdScoped(id, brand)
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "ALERT_NOT_FOUND",
                                                "No alert in the permitted brand"));
        machines.lockById(machine)
                .orElseThrow(() -> ApiException.notFound("MACHINE_NOT_FOUND", "No such machine"));
        Alert a =
                alerts.lockScoped(id, brand)
                        .orElseThrow(
                                () ->
                                        ApiException.notFound(
                                                "ALERT_NOT_FOUND",
                                                "No alert in the permitted brand"));
        boolean supervisor =
                p.isPlatformAdmin()
                        || p.roles().contains(Roles.BRAND_ADMIN)
                        || p.roles().contains(Roles.OPERATIONS_MANAGER);
        if (!supervisor && a.getAssignedTo() != null && !a.getAssignedTo().equals(p.userId()))
            throw ApiException.forbidden(
                    "ALERT_ASSIGNEE_REQUIRED", "This alert is assigned to another user");
        return a;
    }

    private void resolved(Alert a, String reason, Long actor) {
        a.setStatus(Alert.Status.RESOLVED);
        a.setResolvedAt(clock.instant());
        a.setResolvedBy(actor);
        a.setResolution(reason);
    }

    private void requireActive(Alert a) {
        if (a.getStatus() == Alert.Status.RESOLVED)
            throw ApiException.conflict("ALERT_RESOLVED", "Reopen the alert before modifying it");
    }

    private String note(String s) {
        if (s == null || s.isBlank() || s.strip().length() > 1000)
            throw ApiException.badRequest(
                    "REASON_REQUIRED", "A reason of at most 1000 characters is required");
        return s.strip();
    }

    private Long scope(AuthenticatedUser p) {
        if (p == null || (!p.isPlatformAdmin() && p.brandId() == null))
            throw ApiException.forbidden("BRAND_SCOPE_REQUIRED", "A valid brand scope is required");
        return p.isPlatformAdmin() ? null : p.brandId();
    }

    private AlertResponse response(Alert a) {
        return new AlertResponse(
                a.getId(),
                a.getAlertType(),
                a.getStatus(),
                a.getBottle() == null ? null : a.getBottle().getId(),
                a.getMachine().getId(),
                a.getSlot() == null ? null : a.getSlot().getId(),
                a.getRemainingQuantityMl(),
                a.getThresholdMl(),
                a.getMessage(),
                a.getCreatedAt(),
                a.getResolvedAt(),
                a.getSeverity(),
                a.isConditionActive(),
                a.getAcknowledgedBy(),
                a.getAcknowledgedAt(),
                a.getAssignedTo(),
                a.getResolvedBy(),
                a.getResolution(),
                a.getReopenedBy(),
                a.getReopenedAt(),
                a.getReopenCount(),
                a.getMaintenanceTicket() == null ? null : a.getMaintenanceTicket().getId());
    }
}
