package vn.edu.uth.scentstation.domain.report;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.order.OrderStatus;
import vn.edu.uth.scentstation.security.AuthenticatedUser;
import vn.edu.uth.scentstation.security.Roles;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
@Transactional(readOnly = true)
@PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', 'OPERATIONS_MANAGER', 'VIEWER')")
public class ReportService {
    private static final String ZONE = "Asia/Ho_Chi_Minh";
    private final ReportRepository reports;
    private final Clock clock;

    public ReportService(ReportRepository reports, Clock clock) {
        this.reports = reports;
        this.clock = clock;
    }

    public record Document(Object body, byte[] csv, String filename) {}

    public Document build(String report, ReportRequest request, AuthenticatedUser principal) {
        if (principal == null || (!principal.isPlatformAdmin() && principal.brandId() == null)) {
            throw ApiException.forbidden(
                    "REPORT_SCOPE_REQUIRED", "A valid report scope is required");
        }
        if (!Set.of("machines", "revenue", "orders", "products", "inventory").contains(report)) {
            throw ApiException.notFound("REPORT_NOT_FOUND", "No such report");
        }
        String format =
                request.format() == null ? "json" : request.format().toLowerCase(Locale.ROOT);
        if (!Set.of("json", "csv").contains(format))
            throw ApiException.badRequest("INVALID_FORMAT", "Use json or csv");
        boolean csv = format.equals("csv");
        if (csv
                && !principal.isPlatformAdmin()
                && !principal.roles().contains(Roles.BRAND_ADMIN)
                && !principal.roles().contains(Roles.OPERATIONS_MANAGER)) {
            throw ApiException.forbidden(
                    "EXPORT_FORBIDDEN",
                    "Report export requires administrator or operations manager authority");
        }
        if (!principal.isPlatformAdmin()
                && request.brandId() != null
                && !request.brandId().equals(principal.brandId())) {
            throw ApiException.forbidden("BRAND_SCOPE_DENIED", "Cannot report on another brand");
        }
        LocalDate to =
                request.to() == null
                        ? LocalDate.now(clock.withZone(ZoneId.of(ZONE)))
                        : request.to();
        LocalDate from = request.from() == null ? to.minusDays(29) : request.from();
        if (from.isAfter(to) || from.getYear() < 1 || to.getYear() > 9998) {
            throw ApiException.badRequest(
                    "INVALID_DATE_RANGE", "Report dates must form an inclusive, valid range");
        }
        ReportFilter filter =
                new ReportFilter(
                        principal.isPlatformAdmin() ? request.brandId() : principal.brandId(),
                        request.machineId(),
                        request.productId(),
                        request.locationId(),
                        from,
                        to,
                        ZONE,
                        principal.isPlatformAdmin() && request.brandId() == null
                                ? "PLATFORM"
                                : "BRAND");
        reports.validateReferences(filter);
        return switch (report) {
            case "machines" -> machines(filter, csv);
            case "revenue" -> revenue(filter, request.groupBy(), csv);
            case "orders" -> orders(filter, request, csv);
            case "products" -> products(filter, csv);
            case "inventory" -> inventory(filter, csv);
            default -> throw new IllegalStateException();
        };
    }

    private Document machines(ReportFilter filter, boolean csv) {
        var items = reports.machines(filter);
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String status :
                List.of("ONLINE", "OFFLINE", "UNSTABLE", "MAINTENANCE", "DISABLED", "ERROR"))
            counts.put(status, 0L);
        for (var item : items) counts.merge((String) item.get("status"), 1L, Long::sum);
        var body = body(filter);
        body.put("totalMachines", items.size());
        body.put("statusCounts", counts);
        body.put("items", items);
        return document(
                "machines",
                body,
                csv,
                List.of(
                        "machineId",
                        "kioskCode",
                        "brandName",
                        "status",
                        "connectivityStatus",
                        "operatingStatus"),
                items);
    }

    private Document revenue(ReportFilter filter, String requestedGroup, boolean csv) {
        String group = requestedGroup == null ? "DAY" : requestedGroup.toUpperCase(Locale.ROOT);
        String bucket =
                switch (group) {
                    case "DAY" -> "day";
                    case "WEEK" -> "week";
                    case "MONTH" -> "month";
                    default ->
                            throw ApiException.badRequest(
                                    "INVALID_GROUP_BY", "Use DAY, WEEK or MONTH");
                };
        Map<LocalDate, Map<String, Object>> found = new HashMap<>();
        for (var row : reports.revenue(filter, bucket))
            found.put(((java.sql.Date) row.get("periodStart")).toLocalDate(), row);
        LocalDate start =
                switch (group) {
                    case "WEEK" ->
                            filter.from().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                    case "MONTH" -> filter.from().withDayOfMonth(1);
                    default -> filter.from();
                };
        List<Map<String, Object>> series = new ArrayList<>();
        long gross = 0, refunded = 0;
        for (LocalDate date = start;
                !date.isAfter(filter.to());
                date =
                        switch (group) {
                            case "WEEK" -> date.plusWeeks(1);
                            case "MONTH" -> date.plusMonths(1);
                            default -> date.plusDays(1);
                        }) {
            if (series.size() >= 10000)
                throw ApiException.badRequest(
                        "TOO_MANY_PERIODS", "Choose a coarser grouping or a shorter period");
            var data = found.getOrDefault(date, Map.of());
            long g = number(data, "grossAmount"), r = number(data, "refundedAmount");
            gross += g;
            refunded += r;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("periodStart", date);
            row.put("amount", g - r);
            row.put("grossAmount", g);
            row.put("refundedAmount", r);
            row.put("currency", "VND");
            row.put("transactionCount", number(data, "transactionCount"));
            series.add(row);
        }
        var body = body(filter);
        body.put("amount", gross - refunded);
        body.put("grossAmount", gross);
        body.put("refundedAmount", refunded);
        body.put("currency", "VND");
        body.put("groupBy", group);
        body.put("transactionCount", reports.revenueTransactionCount(filter));
        body.put("series", series);
        return document(
                "revenue",
                body,
                csv,
                List.of(
                        "periodStart",
                        "amount",
                        "grossAmount",
                        "refundedAmount",
                        "currency",
                        "transactionCount"),
                series);
    }

    private Document orders(ReportFilter filter, ReportRequest request, boolean csv) {
        int page = request.page() == null ? 0 : request.page(),
                size = request.size() == null ? 50 : request.size();
        if (page < 0 || size < 1 || size > 500)
            throw ApiException.badRequest(
                    "INVALID_PAGINATION", "Use page >= 0 and size between 1 and 500");
        Map<String, Long> counts = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) counts.put(status.name(), 0L);
        for (var row : reports.orderCounts(filter))
            counts.put((String) row.get("status"), number(row, "count"));
        Map<String, Long> commands = new HashMap<>();
        for (var row : reports.commandCounts(filter))
            commands.put((String) row.get("status"), number(row, "count"));
        long successful = commands.getOrDefault("SUCCEEDED", 0L);
        long failed = commands.getOrDefault("FAILED", 0L) + commands.getOrDefault("REJECTED", 0L);
        long uncertain = commands.getOrDefault("TIMED_OUT", 0L),
                total = successful + failed + uncertain;
        BigDecimal rate =
                total == 0
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(successful)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
        var items = reports.orders(filter, csv ? null : size, (long) page * size);
        var body = body(filter);
        body.put("totalOrders", counts.values().stream().mapToLong(Long::longValue).sum());
        body.put("statusCounts", counts);
        body.put("successfulDispenses", successful);
        body.put("failedDispenses", failed);
        body.put("uncertainDispenses", uncertain);
        body.put("dispenseSuccessRate", rate);
        body.put("paidButUnconfirmed", reports.paidButUnconfirmed(filter));
        body.put("items", items);
        body.put("page", page);
        body.put("size", size);
        List<List<?>> rows =
                csv
                        ? items.stream()
                                .<List<?>>map(
                                        o ->
                                                List.of(
                                                        o.orderId(),
                                                        o.createdAt(),
                                                        o.kioskCode(),
                                                        o.brandName(),
                                                        o.productName(),
                                                        o.volumeMl(),
                                                        o.amount(),
                                                        o.currency(),
                                                        o.status()))
                                .toList()
                        : List.of();
        return new Document(
                body,
                csv
                        ? csv(
                                List.of(
                                        "orderId",
                                        "createdAt",
                                        "kioskCode",
                                        "brandName",
                                        "productName",
                                        "volumeMl",
                                        "amount",
                                        "currency",
                                        "status"),
                                rows)
                        : null,
                "reports-orders.csv");
    }

    private Document products(ReportFilter filter, boolean csv) {
        var items = reports.products(filter);
        var body = body(filter);
        body.put("items", items);
        return document(
                "products",
                body,
                csv,
                List.of(
                        "productId",
                        "productName",
                        "brandName",
                        "orderCount",
                        "soldCount",
                        "amount",
                        "currency"),
                items);
    }

    private Document inventory(ReportFilter filter, boolean csv) {
        var items = reports.inventory(filter);
        var body = body(filter);
        body.put("items", items);
        return document(
                "inventory",
                body,
                csv,
                List.of(
                        "slotId",
                        "slotNumber",
                        "kioskCode",
                        "brandName",
                        "productName",
                        "bottleCode",
                        "volumeMl",
                        "initialVolumeMl",
                        "thresholdMl",
                        "status",
                        "available",
                        "refillRequiredMl"),
                items);
    }

    private LinkedHashMap<String, Object> body(ReportFilter filter) {
        var body = new LinkedHashMap<String, Object>();
        body.put("filters", filter);
        return body;
    }

    private long number(Map<String, Object> data, String key) {
        return data.get(key) == null ? 0 : ((Number) data.get(key)).longValue();
    }

    private Document document(
            String name,
            Object body,
            boolean export,
            List<String> headers,
            List<Map<String, Object>> data) {
        List<List<?>> rows =
                export
                        ? data.stream()
                                .<List<?>>map(row -> headers.stream().map(row::get).toList())
                                .toList()
                        : List.of();
        return new Document(body, export ? csv(headers, rows) : null, "reports-" + name + ".csv");
    }

    private byte[] csv(List<String> headers, List<List<?>> rows) {
        StringBuilder text = new StringBuilder("\uFEFF");
        appendRow(text, headers);
        for (List<?> row : rows) appendRow(text, row);
        return text.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void appendRow(StringBuilder output, List<?> row) {
        for (int i = 0; i < row.size(); i++) {
            if (i > 0) output.append(',');
            Object value = row.get(i);
            String cell = value == null ? "" : value.toString();
            String leading = cell.stripLeading();
            if (!(value instanceof Number)
                    && !leading.isEmpty()
                    && "=+-@".indexOf(leading.charAt(0)) >= 0) cell = "'" + cell;
            output.append('"').append(cell.replace("\"", "\"\"")).append('"');
        }
        output.append("\r\n");
    }
}
