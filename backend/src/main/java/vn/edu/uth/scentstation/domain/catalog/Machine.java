/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.catalog;

import jakarta.persistence.Column;
import org.hibernate.annotations.Filter;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import vn.edu.uth.scentstation.domain.brand.Brand;

import vn.edu.uth.scentstation.common.BaseEntity;

/**
 * A sampling kiosk. BR1: it belongs to exactly one brand.
 */
@Entity
@Table(name = "machines")
// Narrowed to the signed-in user's brand by TenantFilterAspect (BR13).
@Filter(name = "brandFilter", condition = "brand_id = :brandId")
public class Machine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(name = "serial_number", nullable = false, length = 60)
    private String serialNumber;

    // The identifier that appears in every MQTT topic for this machine.
    @Column(name = "device_id", nullable = false, length = 60)
    private String deviceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "connectivity_status", nullable = false, length = 20)
    private ConnectivityStatus connectivityStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "operating_status", nullable = false, length = 20)
    private OperatingStatus operatingStatus;

    @Column(name = "firmware_version", length = 40)
    private String firmwareVersion;

    @Column(name = "config_version", length = 40)
    private String configVersion;

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

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public ConnectivityStatus getConnectivityStatus() {
        return connectivityStatus;
    }

    public void setConnectivityStatus(ConnectivityStatus connectivityStatus) {
        this.connectivityStatus = connectivityStatus;
    }

    public OperatingStatus getOperatingStatus() {
        return operatingStatus;
    }

    public void setOperatingStatus(OperatingStatus operatingStatus) {
        this.operatingStatus = operatingStatus;
    }

    public String getFirmwareVersion() {
        return firmwareVersion;
    }

    public void setFirmwareVersion(String firmwareVersion) {
        this.firmwareVersion = firmwareVersion;
    }

    public String getConfigVersion() {
        return configVersion;
    }

    public void setConfigVersion(String configVersion) {
        this.configVersion = configVersion;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }

    /**
     * BR3 and BR9: a machine only accepts new orders while it can talk to the
     * backend and is not under maintenance or disabled.
     */
    public boolean acceptsOrders() {
        return connectivityStatus == ConnectivityStatus.ONLINE
                && operatingStatus == OperatingStatus.ACTIVE;
    }

}
