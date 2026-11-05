/*
 * Task M1 — group B of the entity inventory in Report section 2.7.2.
 * Column names, types and keys follow the ERD in figure 2.6.
 */
package vn.edu.uth.scentstation.domain.catalog;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import org.hibernate.annotations.Filter;

import java.time.Instant;

import vn.edu.uth.scentstation.common.TimestampedEntity;
import vn.edu.uth.scentstation.domain.brand.Brand;

/**
 * A sampling kiosk, physical or simulated. BR1: it belongs to exactly one brand.
 */
@Entity
@Table(name = "machines")
@AttributeOverride(name = "id", column = @Column(name = "machine_id"))
// Narrowed to the signed-in user's brand by TenantFilterAspect (BR13).
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class Machine extends TimestampedEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    // Nullable: a machine may be in storage rather than at a site
    // (Report section 2.7.3).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    // The number on the chassis.
    @Column(name = "serial_number", nullable = false, length = 60)
    private String serialNumber;

    // The identifier that appears in every MQTT topic for this machine
    // (Report section 2.8.3). Unique across the platform, which is what makes
    // a command addressed to another machine detectable (FR4.6).
    @Column(name = "device_identity", nullable = false, length = 60)
    private String deviceIdentity;

    @Column(name = "firmware_version", length = 40)
    private String firmwareVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_status", nullable = false, length = 20)
    private ConnectionStatus connectionStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "operating_status", nullable = false, length = 20)
    private OperatingStatus operatingStatus;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    public Brand getBrand() {
        return brand;
    }

    public void setBrand(Brand brand) {
        this.brand = brand;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getDeviceIdentity() {
        return deviceIdentity;
    }

    public void setDeviceIdentity(String deviceIdentity) {
        this.deviceIdentity = deviceIdentity;
    }

    public String getFirmwareVersion() {
        return firmwareVersion;
    }

    public void setFirmwareVersion(String firmwareVersion) {
        this.firmwareVersion = firmwareVersion;
    }

    public ConnectionStatus getConnectionStatus() {
        return connectionStatus;
    }

    public void setConnectionStatus(ConnectionStatus connectionStatus) {
        this.connectionStatus = connectionStatus;
    }

    public OperatingStatus getOperatingStatus() {
        return operatingStatus;
    }

    public void setOperatingStatus(OperatingStatus operatingStatus) {
        this.operatingStatus = operatingStatus;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }

    /**
     * BR3 and BR9: a machine only accepts new orders while the backend can
     * reach it and it is neither under maintenance nor disabled.
     *
     * <p>Both halves matter. Without the connection check an order could be
     * taken for a machine nobody can command; without the operating check a
     * technician's work could be interrupted by a spray.
     */
    public boolean acceptsOrders() {
        return connectionStatus == ConnectionStatus.ONLINE
                && operatingStatus == OperatingStatus.ACTIVE;
    }
}
