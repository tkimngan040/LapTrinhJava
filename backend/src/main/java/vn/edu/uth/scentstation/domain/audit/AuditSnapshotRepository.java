package vn.edu.uth.scentstation.domain.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.edu.uth.scentstation.common.ApiException;

import java.util.*;

/** Explicit safe fields, with the same lock order as the corresponding business service. */
@Repository
public class AuditSnapshotRepository {
    public record Snapshot(
            Long id, Long brandId, Long machineId, Long operatorId, JsonNode values) {}

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public AuditSnapshotRepository(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public Snapshot snapshot(AuditTarget target, Long id, Long brand, boolean lock) {
        if (id == null) return null;
        String table;
        String fields;
        String brandColumn;
        String machine = "NULL::bigint";
        String operator = "NULL::bigint";
        String row;
        switch (target) {
            case PRODUCT -> {
                table = "products p";
                row = "p";
                brandColumn = "p.brand_id";
                fields = "'name',p.name,'defaultPrice',p.default_price,'active',p.active";
            }
            case USER -> {
                table = "users u";
                row = "u";
                brandColumn = "u.brand_id";
                fields =
                        "'email',u.email,'fullName',u.full_name,'status',u.status,'roles',COALESCE((SELECT"
                            + " jsonb_agg(r.role_name ORDER BY r.role_name) FROM user_roles ur JOIN"
                            + " roles r ON r.id=ur.role_id WHERE ur.user_id=u.id),'[]'::jsonb)";
            }
            case SLOT -> {
                table = "machine_slots s JOIN machines m ON m.id=s.machine_id";
                row = "s";
                brandColumn = "m.brand_id";
                machine = "m.id";
                fields =
                        "'productId',s.product_id,'price',s.price,'available',s.available,'bottle',(SELECT"
                            + " jsonb_build_object('id',b.id,'remainingQuantityMl',b.remaining_quantity_ml)"
                            + " FROM inventory_bottles b WHERE b.slot_id=s.id)";
            }
            case INVENTORY_BOTTLE -> {
                table =
                        "inventory_bottles b JOIN products p ON p.id=b.product_id LEFT JOIN"
                                + " machine_slots s ON s.id=b.slot_id";
                row = "b";
                brandColumn = "p.brand_id";
                machine = "s.machine_id";
                fields =
                        "'slotId',b.slot_id,'initialQuantityMl',b.initial_quantity_ml,'remainingQuantityMl',b.remaining_quantity_ml,'status',b.status";
            }
            case DISPENSE_COMMAND -> {
                table = "dispense_commands c JOIN machines m ON m.id=c.machine_id";
                row = "c";
                brandColumn = "m.brand_id";
                machine = "m.id";
                operator = "c.requested_by";
                fields =
                        "'orderId',c.order_id,'slotId',c.slot_id,'purpose',c.purpose,'status',c.status,'doseMl',c.dose_ml,'inventoryApplied',c.inventory_applied,'remainingQuantityMl',(SELECT"
                            + " b.remaining_quantity_ml FROM inventory_bottles b WHERE"
                            + " b.slot_id=c.slot_id)";
            }
            case MAINTENANCE_TICKET -> {
                table = "maintenance_tickets t";
                row = "t";
                brandColumn = "t.brand_id";
                machine = "t.machine_id";
                fields =
                        "'status',t.status,'assignedTo',t.assigned_to,'repairResult',t.repair_result,'testCommandId',t.test_command_id,'closedAt',t.closed_at";
            }
            case ORDER -> {
                table = "orders o";
                row = "o";
                brandColumn = "o.brand_id";
                machine = "o.machine_id";
                fields =
                        "'status',o.status,'amount',o.price_snapshot,'currency',o.currency,'paymentRef',o.payment_ref,'reviewNote',o.review_note";
            }
            case REFUND -> {
                table =
                        "refunds f JOIN orders o ON o.id=f.order_id JOIN payments p ON"
                            + " p.id=f.payment_id";
                row = "f";
                brandColumn = "f.brand_id";
                machine = "o.machine_id";
                fields =
                        "'orderId',f.order_id,'paymentId',f.payment_id,'refundReference',f.refund_reference,'amount',f.amount,'currency',f.currency,'status',f.status,'attempt',f.attempt,'providerReference',f.provider_reference,'requestedBy',f.requested_by,'orderStatus',o.status,'paymentStatus',p.status";
            }
            case ALERT -> {
                table = "alerts a";
                row = "a";
                brandColumn = "a.brand_id";
                machine = "a.machine_id";
                fields =
                        "'type',a.alert_type,'status',a.status,'severity',a.severity,'conditionActive',a.condition_active,'assignedTo',a.assigned_to,'acknowledgedBy',a.acknowledged_by,'resolution',a.resolution,'maintenanceTicketId',a.maintenance_ticket_id,'reopenCount',a.reopen_count";
            }
            default -> throw new IllegalArgumentException("Unsupported audit target");
        }
        String where =
                " WHERE " + row + ".id=?" + (brand == null ? "" : " AND " + brandColumn + "=?");
        Object[] args = brand == null ? new Object[] {id} : new Object[] {id, brand};
        if (lock) {
            // Machine precedes command/ticket; slot precedes bottle. Never invert
            // the ordering used by device-result processing and inventory service.
            if (target == AuditTarget.DISPENSE_COMMAND
                    || target == AuditTarget.MAINTENANCE_TICKET
                    || target == AuditTarget.REFUND
                    || target == AuditTarget.ALERT) {
                List<Long> ids =
                        jdbc.queryForList(
                                "SELECT " + machine + " FROM " + table + where, Long.class, args);
                if (!ids.isEmpty())
                    jdbc.queryForList(
                            "SELECT id FROM machines WHERE id=? FOR UPDATE", ids.getFirst());
            }
            if (target == AuditTarget.ORDER) {
                List<Long> ids =
                        jdbc.queryForList(
                                "SELECT o.machine_id FROM " + table + where, Long.class, args);
                if (!ids.isEmpty())
                    jdbc.queryForList(
                            "SELECT id FROM machines WHERE id=? FOR UPDATE", ids.getFirst());
            }
            if (target == AuditTarget.REFUND) {
                List<Long> orders =
                        jdbc.queryForList(
                                "SELECT f.order_id FROM " + table + where, Long.class, args);
                if (!orders.isEmpty())
                    jdbc.queryForList(
                            "SELECT id FROM orders WHERE id=? FOR UPDATE", orders.getFirst());
            }
            Long oldSlot = null;
            if (target == AuditTarget.INVENTORY_BOTTLE) {
                List<Long> slots =
                        jdbc.queryForList(
                                "SELECT b.slot_id FROM " + table + where, Long.class, args);
                if (!slots.isEmpty()) oldSlot = slots.getFirst();
                if (oldSlot != null)
                    jdbc.queryForList(
                            "SELECT id FROM machine_slots WHERE id=? FOR UPDATE", oldSlot);
            }
            jdbc.queryForList(
                    "SELECT " + row + ".id FROM " + table + where + " FOR UPDATE OF " + row, args);
            if (target == AuditTarget.INVENTORY_BOTTLE) {
                List<Long> current =
                        jdbc.queryForList(
                                "SELECT b.slot_id FROM " + table + where, Long.class, args);
                if (!current.isEmpty() && !Objects.equals(oldSlot, current.getFirst()))
                    throw ApiException.conflict(
                            "BOTTLE_ASSIGNMENT_CHANGED",
                            "Bottle moved concurrently; retry the operation");
            }
        }
        List<Snapshot> snapshots =
                jdbc.query(
                        "SELECT "
                                + row
                                + ".id,"
                                + brandColumn
                                + " AS brand_id,"
                                + machine
                                + " AS machine_id,"
                                + operator
                                + " AS operator_id,jsonb_build_object("
                                + fields
                                + ")::text AS values FROM "
                                + table
                                + where,
                        (rs, n) -> {
                            try {
                                return new Snapshot(
                                        rs.getLong("id"),
                                        rs.getObject("brand_id", Long.class),
                                        rs.getObject("machine_id", Long.class),
                                        rs.getObject("operator_id", Long.class),
                                        json.readTree(rs.getString("values")));
                            } catch (java.io.IOException e) {
                                throw new IllegalStateException("Invalid audit snapshot", e);
                            }
                        },
                        args);
        return snapshots.isEmpty() ? null : snapshots.getFirst();
    }
}
