
package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/machines")
public class MachineController {

    private final MachineManagementService machineManagementService;

    public MachineController(
            MachineManagementService machineManagementService) {
        this.machineManagementService = machineManagementService;
    }

    /**
     * List machines belonging to the current brand.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER', 'TECHNICIAN', 'VIEWER')")
    public ResponseEntity<List<MachineDtos.MachineResponse>> findAll() {
        return ResponseEntity.ok(machineManagementService.findAll());
    }

    /**
     * Get machine details.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER', 'TECHNICIAN', 'VIEWER')")
    public ResponseEntity<MachineDtos.MachineResponse> findById(
            @PathVariable Long id) {
        return ResponseEntity.ok(machineManagementService.findById(id));
    }

    /**
     * Register a new machine.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER')")
    public ResponseEntity<MachineDtos.MachineResponse> create(
            @Valid @RequestBody MachineDtos.MachineRequest request) {

        MachineDtos.MachineResponse response =
                machineManagementService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update machine information.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER')")
    public ResponseEntity<MachineDtos.MachineResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody MachineDtos.MachineRequest request) {

        return ResponseEntity.ok(
                machineManagementService.update(id, request));
    }

    /**
     * Change machine operating status.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER', 'TECHNICIAN')")
    public ResponseEntity<MachineDtos.MachineResponse> updateOperatingStatus(
            @PathVariable Long id,
            @Valid @RequestBody MachineDtos.OperatingStatusRequest request) {

        return ResponseEntity.ok(
                machineManagementService.updateOperatingStatus(id, request));
    }
}
