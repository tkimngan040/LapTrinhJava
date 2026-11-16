package vn.edu.uth.scentstation.domain.catalog;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request and response contracts for Product management.
 */
public final class ProductDtos {

    private ProductDtos() {
    }

    public record ProductRequest(
            Long brandId,

            @NotBlank(message = "Product name is required")
            @Size(max = 160, message = "Product name must not exceed 160 characters")
            String name,

            String description,

            @Size(max = 300, message = "Fragrance notes must not exceed 300 characters")
            String fragranceNotes,

            @Size(max = 400, message = "Image URL must not exceed 400 characters")
            String imageUrl,

            @NotNull(message = "Price per spray is required")
            @DecimalMin(value = "0.0", inclusive = true,
                    message = "Price per spray must not be negative")
            BigDecimal pricePerSpray,

            ProductStatus status
    ) {
    }

    public record StatusRequest(
            @NotNull(message = "Product status is required")
            ProductStatus status
    ) {
    }

    public record ProductResponse(
            Long id,
            Long brandId,
            String brandName,
            String name,
            String description,
            String fragranceNotes,
            String imageUrl,
            BigDecimal pricePerSpray,
            ProductStatus status
    ) {
    }
}
