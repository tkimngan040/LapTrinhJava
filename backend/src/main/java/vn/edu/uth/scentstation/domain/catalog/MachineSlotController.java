
package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/machines/{machineId}/slots")
public class MachineSlotController {

    private final MachineSlotManagementService machineSlotManagementService;

    public MachineSlotController(
            MachineSlotManagementService machineSlotManagementService) {

        this.machineSlotManagementService = machineSlotManagementService;
    }

    /**
     * Get all slots belonging to a machine.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER', 'TECHNICIAN', 'VIEWER')")
    public ResponseEntity<List<MachineSlotDtos.SlotResponse>> findSlots(
            @PathVariable Long machineId) {

        return ResponseEntity.ok(
                machineSlotManagementService.findSlots(machineId));
    }

    /**
     * Assign a product and update slot configuration.
     */
    @PutMapping("/{slotId}")
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER')")
    public ResponseEntity<MachineSlotDtos.SlotResponse> updateSlot(
            @PathVariable Long machineId,
            @PathVariable Long slotId,
            @Valid @RequestBody MachineSlotDtos.SlotRequest request) {

        return ResponseEntity.ok(
                machineSlotManagementService.updateSlot(
                        machineId, slotId, request));
    }

    /**
     * Change slot status.
     */
    @PatchMapping("/{slotId}/status")
    @PreAuthorize("hasAnyRole('PLATFORM_SUPER_ADMIN', 'BRAND_ADMIN', "
            + "'OPERATIONS_MANAGER', 'TECHNICIAN')")
    public ResponseEntity<MachineSlotDtos.SlotResponse> updateStatus(
            @PathVariable Long machineId,
            @PathVariable Long slotId,
            @Valid @RequestBody MachineSlotDtos.StatusRequest request) {

        return ResponseEntity.ok(
                machineSlotManagementService.updateStatus(
                        machineId, slotId, request));
    }
}
