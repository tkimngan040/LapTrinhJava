package vn.edu.uth.scentstation.domain.report;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public record ReportFilter(
        Long brandId,
        Long machineId,
        Long productId,
        Long locationId,
        LocalDate from,
        LocalDate to,
        String timeZone,
        String scope) {
    public Instant start() {
        return from.atStartOfDay(ZoneId.of(timeZone)).toInstant();
    }

    public Instant end() {
        return to.plusDays(1).atStartOfDay(ZoneId.of(timeZone)).toInstant();
    }
}
