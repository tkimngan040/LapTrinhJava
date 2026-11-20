/*
 * Entity and repository files belong to Tra My (tasks M1, M2).
 * Written here so the security, ordering and dispensing code can run;
 * check the columns against Report section 2.7.2 before merging.
 */
package vn.edu.uth.scentstation.domain.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MachineRepository extends JpaRepository<Machine, Long> {

    Optional<Machine> findByDeviceId(String deviceId);

    List<Machine> findByConnectivityStatusNot(ConnectivityStatus status);

    @org.springframework.data.jpa.repository.Lock(
            jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select m from Machine m where m.id = :id")
    Optional<Machine> lockById(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Lock(
            jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query(
            "select m from Machine m where m.deviceId = :device")
    Optional<Machine> lockByDeviceId(
            @org.springframework.data.repository.query.Param("device") String device);

    @org.springframework.data.jpa.repository.Query(
            "select m.id from Machine m where m.connectivityStatus <> :offline order by m.id")
    List<Long> findConnectedIds(
            @org.springframework.data.repository.query.Param("offline") ConnectivityStatus offline);
}
