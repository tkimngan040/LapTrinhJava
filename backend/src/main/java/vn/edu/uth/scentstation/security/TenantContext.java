package vn.edu.uth.scentstation.security;

/**
 * Holds the brand the current request belongs to, for the duration of that
 * request only.
 *
 * <p>BR13 and NFR2.2 require that one brand never reads another brand's data.
 * Report section 1.5.5 chose to enforce this in the persistence layer rather
 * than by adding {@code WHERE brand_id = ?} to every query by hand, because one
 * forgotten query is a data leak. {@link TenantFilterAspect} reads this value
 * and switches on the Hibernate filter, so every query is narrowed
 * automatically.
 *
 * <p>Two cases carry no brand:
 * <ul>
 *   <li>a Platform Super Administrator, who may see every brand;</li>
 *   <li>the kiosk flow, where the customer is not signed in — there the brand
 *       comes from the machine, not from a token.</li>
 * </ul>
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT_BRAND = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> PLATFORM_SCOPE = ThreadLocal.withInitial(() -> false);

    private TenantContext() {
    }

    /** Narrows this request to one brand. */
    public static void setBrandId(Long brandId) {
        CURRENT_BRAND.set(brandId);
        PLATFORM_SCOPE.set(false);
    }

    /** Opens this request to every brand. Only for a Platform Super Administrator. */
    public static void setPlatformScope() {
        CURRENT_BRAND.remove();
        PLATFORM_SCOPE.set(true);
    }

    public static Long getBrandId() {
        return CURRENT_BRAND.get();
    }

    public static boolean isPlatformScope() {
        return Boolean.TRUE.equals(PLATFORM_SCOPE.get());
    }

    /** True when queries should be narrowed to {@link #getBrandId()}. */
    public static boolean hasBrandScope() {
        return !isPlatformScope() && CURRENT_BRAND.get() != null;
    }

    /**
     * Clears the request scope. The filter that sets it always calls this in a
     * {@code finally} block: threads are pooled, so a value left behind would
     * be inherited by the next, unrelated request.
     */
    public static void clear() {
        CURRENT_BRAND.remove();
        PLATFORM_SCOPE.remove();
    }
}
