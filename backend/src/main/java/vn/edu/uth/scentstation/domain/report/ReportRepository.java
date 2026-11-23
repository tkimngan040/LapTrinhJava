package vn.edu.uth.scentstation.domain.report;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.order.OrderStatus;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** SQL aggregation with explicit tenant predicates on every query, including native SQL. */
@Repository
public class ReportRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public ReportRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private MapSqlParameterSource params(ReportFilter filter) {
        return new MapSqlParameterSource()
                .addValue("brand", filter.brandId(), java.sql.Types.BIGINT)
                .addValue("machine", filter.machineId(), java.sql.Types.BIGINT)
                .addValue("product", filter.productId(), java.sql.Types.BIGINT)
                .addValue("location", filter.locationId(), java.sql.Types.BIGINT)
                .addValue("start", Timestamp.from(filter.start()))
                .addValue("end", Timestamp.from(filter.end()))
                .addValue("zone", filter.timeZone());
    }

    public void validateReferences(ReportFilter filter) {
        var p = params(filter);
        if (filter.brandId() != null)
            require("select count(*) from brands where id = :brand", p, "BRAND_NOT_FOUND");
        if (filter.machineId() != null)
            require(
                    "select count(*) from machines where id = :machine and (:brand is null or"
                        + " brand_id = :brand)",
                    p,
                    "MACHINE_NOT_FOUND");
        if (filter.productId() != null)
            require(
                    "select count(*) from products where id = :product and (:brand is null or"
                        + " brand_id = :brand)",
                    p,
                    "PRODUCT_NOT_FOUND");
        if (filter.locationId() != null)
            require(
                    "select count(*) from locations where id = :location and (:brand is null or"
                        + " brand_id = :brand)",
                    p,
                    "LOCATION_NOT_FOUND");
    }

    private void require(String sql, MapSqlParameterSource params, String code) {
        if (jdbc.queryForObject(sql, params, Long.class) == 0)
            throw ApiException.notFound(code, "No report reference in the permitted scope");
    }

    private String machineScope() {
        return " (:brand is null or m.brand_id = :brand) and (:machine is null or m.id = :machine)"
                   + " and (:location is null or m.location_id = :location) ";
    }

    private String orderScope() {
        return machineScope()
                + " and (:brand is null or o.brand_id = :brand) and (:product is null or"
                + " o.product_id = :product)  and exists (select 1 from products scoped_product"
                + " where scoped_product.id = o.product_id and (:brand is null or"
                + " scoped_product.brand_id = :brand)) ";
    }

    private String orderTime() {
        return " and o.created_at >= :start and o.created_at < :end ";
    }

    public List<Map<String, Object>> machines(ReportFilter filter) {
        return jdbc.queryForList(
                """
select m.id as "machineId", m.device_id as "kioskCode", b.name as "brandName",
       m.connectivity_status as "connectivityStatus", m.operating_status as "operatingStatus",
       case when m.operating_status <> 'ACTIVE' then m.operating_status else m.connectivity_status end as status
from machines m join brands b on b.id = m.brand_id where
"""
                        + machineScope()
                        + " and (:product is null or exists (select 1 from machine_slots s where"
                        + " s.machine_id = m.id and s.product_id = :product)) order by m.id",
                params(filter));
    }

    public List<Map<String, Object>> revenue(ReportFilter filter, String bucket) {
        return jdbc.queryForList(
                """
select cast(date_trunc(:bucket, p.paid_at at time zone :zone) as date) as "periodStart",
       coalesce(sum(p.amount),0) as "grossAmount",
       coalesce(sum(case when p.status = 'REFUNDED' then p.amount else 0 end),0) as "refundedAmount",
       count(distinct p.order_id) as "transactionCount"
from payments p join orders o on o.id = p.order_id join machines m on m.id = o.machine_id
where p.status in ('SUCCEEDED','REFUNDED') and p.currency = 'VND'
  and p.paid_at >= :start and p.paid_at < :end and
"""
                        + orderScope()
                        + " group by 1 order by 1",
                params(filter).addValue("bucket", bucket));
    }

    public List<Map<String, Object>> orderCounts(ReportFilter filter) {
        return jdbc.queryForList(
                "select o.status, count(*) as count from orders o join machines m on m.id ="
                    + " o.machine_id where "
                        + orderScope()
                        + orderTime()
                        + " group by o.status",
                params(filter));
    }

    public long revenueTransactionCount(ReportFilter filter) {
        return jdbc.queryForObject(
                "select count(distinct p.order_id) from payments p join orders o on o.id ="
                    + " p.order_id join machines m on m.id = o.machine_id where p.status in"
                    + " ('SUCCEEDED','REFUNDED') and p.currency = 'VND' and p.paid_at >= :start and"
                    + " p.paid_at < :end and "
                        + orderScope(),
                params(filter),
                Long.class);
    }

    public List<Map<String, Object>> commandCounts(ReportFilter filter) {
        return jdbc.queryForList(
                """
                select c.status, count(*) as count from dispense_commands c
                join orders o on o.id = c.order_id join machines m on m.id = c.machine_id
                where c.purpose = 'CUSTOMER' and c.issued_at >= :start and c.issued_at < :end and
                """
                        + orderScope()
                        + " group by c.status",
                params(filter));
    }

    public long paidButUnconfirmed(ReportFilter filter) {
        return jdbc.queryForObject(
                """
select count(*) from orders o join machines m on m.id = o.machine_id
where o.status not in ('DISPENSED','REFUNDED') and exists
    (select 1 from payments p where p.order_id = o.id and p.status = 'SUCCEEDED') and
"""
                        + orderScope()
                        + orderTime(),
                params(filter),
                Long.class);
    }

    /** The nine transaction field names are the frontend's confirmed schema. */
    public record OrderRow(
            Long orderId,
            Instant createdAt,
            String kioskCode,
            String brandName,
            String productName,
            int volumeMl,
            long amount,
            String currency,
            OrderStatus status) {}

    public List<OrderRow> orders(ReportFilter filter, Integer limit, long offset) {
        String sql =
                """
select o.id, o.created_at, m.device_id, b.name as brand_name, p.name as product_name,
  coalesce((select c.dose_ml from dispense_commands c where c.order_id = o.id and c.purpose = 'CUSTOMER'
            order by c.issued_at desc, c.id desc limit 1), s.dose_ml) as volume_ml,
  o.price_snapshot, o.currency, o.status
from orders o join machines m on m.id = o.machine_id join brands b on b.id = o.brand_id
join products p on p.id = o.product_id join machine_slots s on s.id = o.slot_id where
"""
                        + orderScope()
                        + orderTime()
                        + " order by o.created_at desc, o.id desc";
        var parameters = params(filter);
        if (limit != null) {
            sql += " limit :limit offset :offset";
            parameters.addValue("limit", limit).addValue("offset", offset);
        }
        return jdbc.query(
                sql,
                parameters,
                (rs, row) ->
                        new OrderRow(
                                rs.getLong("id"),
                                rs.getTimestamp("created_at").toInstant(),
                                rs.getString("device_id"),
                                rs.getString("brand_name"),
                                rs.getString("product_name"),
                                rs.getInt("volume_ml"),
                                rs.getLong("price_snapshot"),
                                rs.getString("currency"),
                                OrderStatus.valueOf(rs.getString("status"))));
    }

    public List<Map<String, Object>> products(ReportFilter filter) {
        return jdbc.queryForList(
                """
select p.id as "productId", p.name as "productName", b.name as "brandName", count(*) as "orderCount",
       count(*) filter(where o.status = 'DISPENSED') as "soldCount",
       coalesce(sum(case when o.status = 'DISPENSED' then o.price_snapshot else 0 end),0) as amount,
       'VND' as currency
from orders o join machines m on m.id = o.machine_id join products p on p.id = o.product_id
join brands b on b.id = o.brand_id where o.currency = 'VND' and
"""
                        + orderScope()
                        + orderTime()
                        + " group by p.id, p.name, b.id, b.name order by \"soldCount\" desc,"
                        + " \"orderCount\" desc, p.id",
                params(filter));
    }

    public List<Map<String, Object>> inventory(ReportFilter filter) {
        return jdbc.queryForList(
                """
select s.id as "slotId", s.slot_number as "slotNumber", m.device_id as "kioskCode", br.name as "brandName",
       p.name as "productName", ib.bottle_code as "bottleCode", ib.remaining_quantity_ml as "volumeMl",
       ib.initial_quantity_ml as "initialVolumeMl", s.low_stock_threshold_ml as "thresholdMl",
       case when batch.expiry_date < cast(current_timestamp at time zone :zone as date) then 'EXPIRED' else ib.status end as status,
       s.available, greatest(ib.initial_quantity_ml - ib.remaining_quantity_ml,0) as "refillRequiredMl"
from inventory_bottles ib join machine_slots s on s.id = ib.slot_id join machines m on m.id = s.machine_id
join products p on p.id = ib.product_id join brands br on br.id = m.brand_id
left join inventory_batches batch on batch.id = ib.batch_id where
"""
                        + machineScope()
                        + " and (:product is null or ib.product_id = :product) and (:brand is null"
                        + " or p.brand_id = :brand) and (ib.remaining_quantity_ml <="
                        + " s.low_stock_threshold_ml or ib.remaining_quantity_ml < s.dose_ml) order"
                        + " by ib.remaining_quantity_ml, s.id",
                params(filter));
    }
}
