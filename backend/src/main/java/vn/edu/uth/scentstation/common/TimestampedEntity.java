package vn.edu.uth.scentstation.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;

import java.time.Instant;

/**
 * An entity whose table carries {@code created_at} in the ERD.
 *
 * <p>There is no {@code updated_at} anywhere in the schema, and that is a
 * design decision rather than an omission: a single "last changed" column
 * overwrites its own history, so it answers neither who changed the row nor
 * what it held before. {@code AUDIT_LOGS} answers both (BR12, FR10.4).
 */
@MappedSuperclass
public abstract class TimestampedEntity extends BaseEntity {

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Set when the row is first written. A value already assigned by a test or
     * by an importer is kept, so a fixture can place a row in the past.
     */
    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
