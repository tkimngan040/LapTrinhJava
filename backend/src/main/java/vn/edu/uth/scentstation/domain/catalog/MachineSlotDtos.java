
package vn.edu.uth.scentstation.domain.catalog;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
/**
 * Request and response contracts for Machine Slot management.
 */
public final class MachineSlotDtos {

    private MachineSlotDtos() {
    }

    public record SlotRequest(
            Long productId,

            @DecimalMin(value = "0.0",
                    message = "Price must not be negative")
            BigDecimal price,

            @NotNull(message = "Low stock threshold is required")
            @DecimalMin(value = "0.0",
                    message = "Low stock threshold must not be negative")
            BigDecimal lowStockThreshold,

            @Positive(message = "Spray duration must be greater than zero")
            int sprayDurationMs,

            SlotStatus status
    ) {
    }

    public record StatusRequest(
            @NotNull(message = "Slot status is required")
            SlotStatus status
    ) {
    }

    public record SlotResponse(
            Long id,
            Long machineId,
            int slotNumber,
            Long productId,
            String productName,
            BigDecimal price,
            BigDecimal effectivePrice,
            BigDecimal lowStockThreshold,
            int sprayDurationMs,
            SlotStatus status
    ) {
    }
}
