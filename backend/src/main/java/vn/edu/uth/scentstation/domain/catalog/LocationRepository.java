/*
 * Task M1 — repository for group B of Report section 2.7.2.
 */
package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {

    List<Location> findByBrandIdOrderByNameAsc(Long brandId);
    // Explicit tenant-scoped lookup for machine assignment.
    Optional<Location> findByIdAndBrand_Id(Long id, Long brandId);
}
