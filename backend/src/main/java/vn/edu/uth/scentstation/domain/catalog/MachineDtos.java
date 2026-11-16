
package vn.edu.uth.scentstation.domain.catalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request and response contracts for Machine management.
 */
public final class MachineDtos {

    private MachineDtos() {
    }

    public record MachineRequest(
            Long brandId,

            @NotBlank(message = "Serial number is required")
            @Size(max = 60, message = "Serial number must not exceed 60 characters")
            String serialNumber,

            @NotBlank(message = "Device identity is required")
            @Size(max = 60, message = "Device identity must not exceed 60 characters")
            String deviceIdentity,

            Long locationId,

            @Size(max = 40, message = "Firmware version must not exceed 40 characters")
            String firmwareVersion,

            OperatingStatus operatingStatus
    ) {
    }

    public record OperatingStatusRequest(
            @NotNull(message = "Operating status is required")
            OperatingStatus operatingStatus
    ) {
    }

    public record MachineResponse(
            Long id,
            Long brandId,
            String brandName,
            Long locationId,
            String locationName,
            String serialNumber,
            String deviceIdentity,
            String firmwareVersion,
            ConnectionStatus connectionStatus,
            OperatingStatus operatingStatus
    ) {
    }
}
