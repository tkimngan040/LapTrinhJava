/*
 * Task M1 — repository for group A of Report section 2.7.2.
 */
package vn.edu.uth.scentstation.domain.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Sign-in looks the account up by email, case-insensitively, so that a
     * capital letter typed on a phone keyboard is not a failed login.
     */
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByBrandId(Long brandId);
}
