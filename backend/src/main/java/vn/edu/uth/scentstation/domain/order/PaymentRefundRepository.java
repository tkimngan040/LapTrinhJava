package vn.edu.uth.scentstation.domain.order;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRefundRepository extends JpaRepository<PaymentRefund, Long> {

    Optional<PaymentRefund> findByRefundReference(String refundReference);
}
