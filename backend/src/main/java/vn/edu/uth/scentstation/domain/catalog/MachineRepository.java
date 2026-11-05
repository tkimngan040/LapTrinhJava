/*
 * Task M1 — repository for group B of Report section 2.7.2.
 */
package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MachineRepository extends JpaRepository<Machine, Long> {

    /**
     * Looks a machine up by the identifier that appears in its MQTT topics.
     * Every inbound device message starts here (Report section 2.8.3).
     */
    Optional<Machine> findByDeviceIdentity(String deviceIdentity);

    Optional<Machine> findBySerialNumber(String serialNumber);

    /**
     * The machines the watchdog still has to consider. One that is already
     * OFFLINE cannot change state again, so it is left out (FR5.2).
     */
    List<Machine> findByConnectionStatusNot(ConnectionStatus status);

    List<Machine> findByBrandId(Long brandId);
}
