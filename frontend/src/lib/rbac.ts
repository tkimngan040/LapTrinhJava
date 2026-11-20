export type InternalRole = "PSA" | "BA" | "OM" | "TE" | "IS" | "VW";

export type SettingsTabId =
    | "general"
    | "brands"
    | "machines"
    | "payment"
    | "notifications"
    | "system"
    | "security"
    | "integrations"
    | "audit";

export interface RolePermissionConfig {
    label: string;
    labelVi: string;
    labelEn: string;
    defaultRoute: string;
    allowedRoutes: string[];
    allowedSettingsTabs: SettingsTabId[];
    canManageBrands: boolean;
    canManageProducts: boolean;
    canManageUsers: boolean;
    canDispatchTickets: boolean;
    canExecuteMaintenance: boolean;
    canDiagnosticSpray: boolean;
    canManageInventory: boolean;
    canAdjustStock: boolean;
    canRefund: boolean;
    canExportReport: boolean;
    isReadOnly: boolean;
}

export const ROLE_PERMISSIONS: Record<InternalRole, RolePermissionConfig> = {
    PSA: {
        label: "Quản trị viên nền tảng (PSA)",
        labelVi: "Quản trị viên nền tảng (PSA)",
        labelEn: "Platform Super Admin (PSA)",
        defaultRoute: "/dashboard",
        allowedRoutes: [
            "/dashboard",
            "/brands",
            "/users",
            "/reports",
            "/profile",
            "/settings",
        ],
        allowedSettingsTabs: [
            "general",
            "brands",
            "machines",
            "payment",
            "notifications",
            "system",
            "security",
            "integrations",
            "audit",
        ],
        canManageBrands: true,
        canManageProducts: false,
        canManageUsers: true,
        canDispatchTickets: false,
        canExecuteMaintenance: false,
        canDiagnosticSpray: false,
        canManageInventory: false,
        canAdjustStock: false,
        canRefund: false,
        canExportReport: true,
        isReadOnly: false,
    },
    BA: {
        label: "Quản trị viên thương hiệu (BA)",
        labelVi: "Quản trị viên thương hiệu (BA)",
        labelEn: "Brand Administrator (BA)",
        defaultRoute: "/dashboard",
        allowedRoutes: [
            "/dashboard",
            "/brands",
            "/products",
            "/transactions",
            "/users",
            "/reports",
            "/profile",
            "/settings",
        ],
        allowedSettingsTabs: ["general", "brands"],
        canManageBrands: true,
        canManageProducts: true,
        canManageUsers: true,
        canDispatchTickets: false,
        canExecuteMaintenance: false,
        canDiagnosticSpray: false,
        canManageInventory: false,
        canAdjustStock: false,
        canRefund: false,
        canExportReport: true,
        isReadOnly: false,
    },
    OM: {
        label: "Quản lý vận hành (OM)",
        labelVi: "Quản lý vận hành (OM)",
        labelEn: "Operations Manager (OM)",
        defaultRoute: "/dashboard",
        allowedRoutes: [
            "/dashboard",
            "/alerts",
            "/machines",
            "/transactions",
            "/refill",
            "/maintenance",
            "/reports",
            "/profile",
            "/settings",
        ],
        allowedSettingsTabs: ["machines", "notifications"],
        canManageBrands: false,
        canManageProducts: false,
        canManageUsers: false,
        canDispatchTickets: true,
        canExecuteMaintenance: false,
        canDiagnosticSpray: false,
        canManageInventory: false,
        canAdjustStock: false,
        canRefund: false,
        canExportReport: true,
        isReadOnly: false,
    },
    TE: {
        label: "Kỹ thuật viên (TE)",
        labelVi: "Kỹ thuật viên (TE)",
        labelEn: "Technician (TE)",
        defaultRoute: "/maintenance",
        allowedRoutes: [
            "/alerts",
            "/machines",
            "/maintenance",
            "/profile",
        ],
        allowedSettingsTabs: [],
        canManageBrands: false,
        canManageProducts: false,
        canManageUsers: false,
        canDispatchTickets: false,
        canExecuteMaintenance: true,
        canDiagnosticSpray: true,
        canManageInventory: false,
        canAdjustStock: false,
        canRefund: false,
        canExportReport: false,
        isReadOnly: false,
    },
    IS: {
        label: "Nhân viên kho (IS)",
        labelVi: "Nhân viên kho (IS)",
        labelEn: "Inventory Staff (IS)",
        defaultRoute: "/inventory",
        allowedRoutes: [
            "/alerts",
            "/inventory",
            "/refill",
            "/profile",
        ],
        allowedSettingsTabs: [],
        canManageBrands: false,
        canManageProducts: false,
        canManageUsers: false,
        canDispatchTickets: false,
        canExecuteMaintenance: false,
        canDiagnosticSpray: false,
        canManageInventory: true,
        canAdjustStock: true,
        canRefund: false,
        canExportReport: false,
        isReadOnly: false,
    },
    VW: {
        label: "Người xem (VW)",
        labelVi: "Người xem (VW)",
        labelEn: "Viewer (VW)",
        defaultRoute: "/dashboard",
        allowedRoutes: [
            "/dashboard",
            "/reports",
            "/profile",
        ],
        allowedSettingsTabs: [],
        canManageBrands: false,
        canManageProducts: false,
        canManageUsers: false,
        canDispatchTickets: false,
        canExecuteMaintenance: false,
        canDiagnosticSpray: false,
        canManageInventory: false,
        canAdjustStock: false,
        canRefund: false,
        canExportReport: false,
        isReadOnly: true,
    },
};

export function normalizeRole(rawRole?: string): InternalRole {
    const upper = String(rawRole || "PSA").toUpperCase();
    if (upper === "PSA" || upper === "ADMIN" || upper === "PLATFORM_SUPER_ADMIN") return "PSA";
    if (upper === "BA" || upper === "BRAND_ADMIN") return "BA";
    if (upper === "OM" || upper === "OPERATIONS_MANAGER") return "OM";
    if (upper === "TE" || upper === "TECHNICIAN") return "TE";
    if (upper === "IS" || upper === "INVENTORY_STAFF") return "IS";
    if (upper === "VW" || upper === "VIEWER") return "VW";
    return "VW";
}

export function isRouteAllowedForRole(role: InternalRole, pathname: string): boolean {
    const config = ROLE_PERMISSIONS[role];
    if (!config) return false;
    return config.allowedRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
}