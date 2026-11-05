package vn.edu.uth.scentstation.common;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;

/**
 * The surrogate identifier every persisted entity has.
 *
 * <p>The ERD in Report figure 2.6 names each table's primary key after its
 * entity: {@code brand_id}, {@code machine_id}, {@code slot_id} and so on. The
 * Java attribute is called {@code id} in all of them, and each entity renames
 * the column with
 * {@code @AttributeOverride(name = "id", column = @Column(name = "..."))}.
 *
 * <p>That split is deliberate. The database keeps the naming the report
 * documents, while the code keeps one {@code getId()} that works on any entity,
 * so a generic repository or a log statement does not need to know which table
 * it is looking at.
 *
 * <p>No audit timestamps live here. Only some tables carry {@code created_at}
 * in the ERD; those extend {@link TimestampedEntity} instead. A table that the
 * diagram gives no timestamp does not get one silently.
 */
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
