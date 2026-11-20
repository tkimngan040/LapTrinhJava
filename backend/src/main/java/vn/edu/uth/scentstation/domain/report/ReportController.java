package vn.edu.uth.scentstation.domain.report;

import jakarta.validation.Valid;

import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.scentstation.security.AuthenticatedUser;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reports;

    public ReportController(ReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/{report}")
    public ResponseEntity<?> report(
            @PathVariable String report,
            @Valid @ModelAttribute ReportRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        var document = reports.build(report, request, principal);
        if (document.csv() == null) return ResponseEntity.ok(document.body());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(document.filename())
                                .build()
                                .toString())
                .body(document.csv());
    }
}
