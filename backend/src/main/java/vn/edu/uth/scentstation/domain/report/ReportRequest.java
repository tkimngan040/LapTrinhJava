package vn.edu.uth.scentstation.domain.report;

import jakarta.validation.constraints.Positive;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record ReportRequest(
        @Positive Long brandId,
        @Positive Long machineId,
        @Positive Long productId,
        @Positive Long locationId,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        String groupBy,
        String format,
        Integer page,
        Integer size) {}
