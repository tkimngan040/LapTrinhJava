/*
 * Task M1 — group A of the entity inventory in Report section 2.7.2.
 * Column names, types and keys follow the ERD in figure 2.6.
 */
package vn.edu.uth.scentstation.domain.user;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.LinkedHashSet;
import java.util.Set;

import vn.edu.uth.scentstation.common.TimestampedEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;

/**
 * A platform or brand account.
 */
@Entity
@Table(name = "users")
@AttributeOverride(name = "id", column = @Column(name = "user_id"))
public class User extends TimestampedEntity {

    // NULL for a Platform Super Administrator, who sees every brand
    // (Report section 2.7.2 group A).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(nullable = false, length = 160)
    private String email;

    // BCrypt, cost 10 (NFR2.1). A BCrypt hash is 60 characters; the column
    // leaves room for a longer one if the cost or the algorithm changes.
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    // FR1.8: bumping this invalidates every JWT already issued to the user,
    // which is how a session is revoked with no session state on the server.
    @Column(name = "token_version", nullable = false)
    private int tokenVersion;

    /**
     * The roles this account holds.
     *
     * <p>{@code USER_ROLES} is mapped as a join table rather than as an entity
     * of its own. It holds nothing but the two keys and an {@code assigned_at}
     * stamp, which the column's own default fills in, so an entity would add a
     * class and a composite identifier without adding anything a query needs.
     * If a later task has to record who granted a role, it becomes an entity
     * then.
     *
     * <p>Fetched eagerly on purpose: every authenticated request reads the
     * roles to build the authorities, so a lazy collection would only buy a
     * second query and a chance of {@code LazyInitializationException}.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new LinkedHashSet<>();

    public Brand getBrand() {
        return brand;
    }

    public void setBrand(Brand brand) {
        this.brand = brand;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    public void setTokenVersion(int tokenVersion) {
        this.tokenVersion = tokenVersion;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }

    /** Brand id, or null for a platform-level account. */
    public Long brandId() {
        return brand == null ? null : brand.getId();
    }

    /** Role names in the form Spring Security expects after the ROLE_ prefix. */
    public Set<String> roleNames() {
        Set<String> names = new LinkedHashSet<>();
        for (Role role : roles) {
            names.add(role.getRoleName());
        }
        return names;
    }
}
