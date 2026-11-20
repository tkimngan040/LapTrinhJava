package vn.edu.uth.scentstation.domain.audit;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.*;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.SimpleEvaluationContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import vn.edu.uth.scentstation.common.ApiException;
import vn.edu.uth.scentstation.domain.user.AuthController;
import vn.edu.uth.scentstation.security.AuthenticatedUser;

import java.util.Map;

@Aspect
@Component
// Method security (order 200) authorizes first. Own writable transaction wraps
// snapshots, the business call, flush and audit insert, including login.
@Order(300)
public class AuditAspect {
    private final AuditSnapshotRepository snapshots;
    private final AuditService audit;
    private final ObjectMapper json;
    private final TransactionTemplate tx;
    private final SpelExpressionParser expressions = new SpelExpressionParser();
    @PersistenceContext private EntityManager em;

    public AuditAspect(
            AuditSnapshotRepository snapshots,
            AuditService audit,
            ObjectMapper json,
            PlatformTransactionManager transactions) {
        this.snapshots = snapshots;
        this.audit = audit;
        this.json = json;
        this.tx = new TransactionTemplate(transactions);
    }

    @Around("@annotation(rule)")
    public Object around(ProceedingJoinPoint call, Auditable rule) throws Throwable {
        var context =
                SimpleEvaluationContext.forReadOnlyDataBinding().withInstanceMethods().build();
        for (int i = 0; i < call.getArgs().length; i++)
            context.setVariable("p" + i, call.getArgs()[i]);
        if (!Boolean.TRUE.equals(
                expressions.parseExpression(rule.condition()).getValue(context, Boolean.class)))
            return call.proceed();
        try {
            return tx.execute(
                    status -> {
                        AuthenticatedUser actor = principal();
                        Long brand =
                                actor == null || actor.isPlatformAdmin() ? null : actor.brandId();
                        Long id =
                                rule.login() || rule.id().isEmpty()
                                        ? null
                                        : expressions
                                                .parseExpression(rule.id())
                                                .getValue(context, Long.class);
                        em.flush();
                        var before =
                                rule.login()
                                        ? null
                                        : snapshots.snapshot(rule.target(), id, brand, true);
                        Object result;
                        try {
                            result = call.proceed();
                        } catch (RuntimeException | Error e) {
                            throw e;
                        } catch (Throwable e) {
                            throw new InvocationFailure(e);
                        }
                        em.flush();
                        context.setVariable("result", result);
                        if (!Boolean.TRUE.equals(
                                expressions
                                        .parseExpression(rule.resultCondition())
                                        .getValue(context, Boolean.class))) return result;
                        if (rule.login()) {
                            // Whitelist only identity/outcome. Never serialize LoginResponse/token
                            // or arguments/password.
                            var user = ((AuthController.LoginResponse) result).user();
                            var who =
                                    new AuthenticatedUser(
                                            user.id(), user.brandId(), user.email(), user.roles());
                            var safe =
                                    json.valueToTree(
                                            Map.of("outcome", "SUCCESS", "email", user.email()));
                            audit.append(
                                    who,
                                    new AuditSnapshotRepository.Snapshot(
                                            user.id(), user.brandId(), null, null, safe),
                                    rule.action(),
                                    AuditTarget.USER,
                                    null,
                                    safe,
                                    null);
                        } else {
                            context.setVariable("result", result);
                            if (!rule.resultId().isEmpty())
                                id =
                                        expressions
                                                .parseExpression(rule.resultId())
                                                .getValue(context, Long.class);
                            var after = snapshots.snapshot(rule.target(), id, brand, false);
                            if (after == null)
                                throw new IllegalStateException(
                                        "Audited target missing after successful operation");
                            if (rule.always()
                                    || before == null
                                    || !before.values().equals(after.values())) {
                                String reason =
                                        rule.reason().isEmpty()
                                                ? null
                                                : expressions
                                                        .parseExpression(rule.reason())
                                                        .getValue(context, String.class);
                                audit.append(
                                        actor,
                                        after,
                                        rule.action(),
                                        rule.target(),
                                        before == null ? null : before.values(),
                                        after.values(),
                                        reason);
                            }
                        }
                        return result;
                    });
        } catch (ApiException e) {
            if (rule.login() && (e.getStatus().value() == 401 || e.getStatus().value() == 403))
                audit.deniedLogin((String) call.getArgs()[0], e.getCode());
            throw e;
        } catch (InvocationFailure e) {
            throw e.getCause();
        }
    }

    private AuthenticatedUser principal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof AuthenticatedUser p ? p : null;
    }

    private static class InvocationFailure extends RuntimeException {
        InvocationFailure(Throwable cause) {
            super(cause);
        }
    }
}
