package vn.edu.uth.scentstation.domain.alert;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TelemetryReadingRepository extends JpaRepository<TelemetryReading, Long> {
}
