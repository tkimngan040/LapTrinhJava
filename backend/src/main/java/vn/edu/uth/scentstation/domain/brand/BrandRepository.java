/*
 * Task M1 — repository for group A of Report section 2.7.2.
 */
package vn.edu.uth.scentstation.domain.brand;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Long> {

    Optional<Brand> findByNameIgnoreCase(String name);
}
