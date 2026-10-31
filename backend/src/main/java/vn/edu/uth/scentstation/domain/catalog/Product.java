package vn.edu.uth.scentstation.domain.catalog;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "perfumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "brand_id", nullable = false)
    private Long brandId;

    @Column(nullable = false)
    private String name;

    @Column(name = "fragrance_notes")
    private String fragranceNotes;

    private String description;

    @Column(name = "price_per_spray", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerSpray;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = "AVAILABLE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}