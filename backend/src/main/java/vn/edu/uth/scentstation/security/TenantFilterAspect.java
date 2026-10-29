package vn.edu.uth.scentstation.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Switches the Hibernate {@code brandFilter} on for the brand of the current
 * request, just before any repository call.
 *
 * <p>This is what makes BR13 structural rather than a habit: a developer who
 * writes {@code findAll()} and forgets the brand still gets only their own
 * brand's rows, because the filter is added to the SQL underneath them.
 *
 * <p>Two scopes deliberately leave the filter off:
 * <ul>
 *   <li>a Platform Super Administrator, who is allowed to see every brand;</li>
 *   <li>the kiosk flow, where nobody is signed in — those services read the
 *       brand from the machine and pass it explicitly.</li>
 * </ul>
 *
 * <p>The aspect runs around repository methods, which are always reached from
 * a {@code @Transactional} service method, so a Hibernate session already
 * exists by the time it unwraps one. When no session is active it simply does
 * nothing rather than failing the call.
 */
@Aspect
@Component
public class TenantFilterAspect {

    private static final Logger log = LoggerFactory.getLogger(TenantFilterAspect.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Around("execution(* vn.edu.uth.scentstation.domain..*Repository+.*(..))")
    public Object applyBrandFilter(ProceedingJoinPoint joinPoint) throws Throwable {
        if (TenantContext.hasBrandScope()) {
            enable(TenantContext.getBrandId());
        }
        return joinPoint.proceed();
    }

    private void enable(Long brandId) {
        try {
            Session session = entityManager.unwrap(Session.class);
            if (session.getEnabledFilter("brandFilter") == null) {
                session.enableFilter("brandFilter").setParameter("brandId", brandId);
                log.trace("brandFilter enabled for brand {}", brandId);
            }
        } catch (RuntimeException ex) {
            // No active session: nothing to narrow, and the call must not fail
            // because of it.
            log.trace("brandFilter not applied: {}", ex.getMessage());
        }
    }
}
