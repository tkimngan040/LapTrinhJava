package vn.edu.uth.scentstation.security;

/**
 * The seven roles of Report section 1.4, as the single set of constants the
 * whole application uses. Spring Security needs the ROLE_ prefix on the
 * authority, so both forms live here and nowhere else.
 */
public final class Roles {

    public static final String PLATFORM_SUPER_ADMIN = "PLATFORM_SUPER_ADMIN";
    public static final String BRAND_ADMIN = "BRAND_ADMIN";
    public static final String OPERATIONS_MANAGER = "OPERATIONS_MANAGER";
    public static final String TECHNICIAN = "TECHNICIAN";
    public static final String INVENTORY_STAFF = "INVENTORY_STAFF";
    public static final String VIEWER = "VIEWER";
    public static final String CUSTOMER = "CUSTOMER";

    public static final String PREFIX = "ROLE_";

    private Roles() {
    }

    public static String authority(String role) {
        return PREFIX + role;
    }
}
