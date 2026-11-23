package vn.edu.uth.scentstation.domain.audit;

import java.lang.annotation.*;

/** Expressions refer only to explicit IDs/reasons, never entire request/response objects. */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action();

    AuditTarget target();

    String id() default "#p0";

    String resultId() default "";

    String reason() default "";

    String condition() default "true";

    String resultCondition() default "true";

    boolean login() default false;

    boolean always() default false;
}
