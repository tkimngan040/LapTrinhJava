/*
 * Task M1 — repository for group B of Report section 2.7.2.
 */
package vn.edu.uth.scentstation.domain.catalog;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByBrandIdOrderByNameAsc(Long brandId);

    List<Product> findByStatus(ProductStatus status);
}
