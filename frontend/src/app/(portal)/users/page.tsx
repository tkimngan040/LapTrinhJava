// noinspection SpellCheckingInspection
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./users.module.css";
import {
    Search,
    UserPlus,
    Shield,
    Lock,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Edit3,
    X,
    Key,
    Check,
    ShieldCheck,
    Users,
    Sliders,
    History,
    Clock,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Globe,
    Zap,
} from "lucide-react";

type AccountStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "INVITED";

interface EnterpriseUserItem {
    id: number;
    uidCode: string;
    fullName: string;
    email: string;
    phone: string;
    department: string;
    role: string;
    roleCode: "PSA" | "BA" | "OM" | "TE" | "IS" | "VW";
    brandAccess: string;
    locationScope: string;
    status: AccountStatus;
    tokenVersion: number;
    lastActive: string;
    createdAt: string;
    deactivationReason?: string;
}

interface RoleDefinitionItem {
    code: "PSA" | "BA" | "OM" | "TE" | "IS" | "VW" | string;
    title: string;
    description: string;
    isSystemProtected: boolean;
    permissions: {
        module: string;
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        approve: boolean;
    }[];
}

interface AccessRequestItem {
    id: string;
    requesterId: number;
    requesterName: string;
    requesterEmail: string;
    currentRole: string;
    requestedRoleOrScope: string;
    targetBrand: string;
    reason: string;
    requestedAt: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    decidedBy?: string;
    decidedAt?: string;
    decisionReason?: string;
}

interface SecurityAuditLogItem {
    id: string;
    dateStr: string;
    timestamp: string;
    actor: string;
    action: string;
    target: string;
    ipAddress: string;
    status: "SUCCESS" | "LOCKED" | "BLOCKED" | "PENDING";
    detail: string;
}

const DEFAULT_PARTNER_BRANDS = [
    "All Brands (Global)",
    "Chanel",
    "Dior",
    "Creed",
    "Le Labo",
    "Maison Francis Kurkdjian",
    "Tom Ford",
    "Roja Parfums",
    "Parfums de Marly",
    "Giorgio Armani",
    "Versace",
    "Burberry",
    "Carolina Herrera",
    "Armaf",
    "Jean Paul Gaultier",
    "Maison Margiela",
    "MCM Worldwide",
    "Montblanc",
    "Narciso Rodriguez",
    "Paco Rabanne",
    "Valentino",
    "Yves Saint Laurent",
];

const INVITABLE_ROLE_OPTIONS = [
    "Brand Administrator",
    "Operations Manager",
    "Technician",
    "Inventory Staff",
    "Viewer",
];

const INITIAL_ROLES: RoleDefinitionItem[] = [
    {
        code: "PSA",
        title: "Platform Super Admin",
        description: "Platform-wide governance, tenant onboarding, global security policies, and immutable audit log investigations.",
        isSystemProtected: true,
        permissions: [
            { module: "Brands & Tenants", view: true, create: true, edit: true, delete: true, approve: true },
            { module: "Perfume Products", view: true, create: true, edit: true, delete: true, approve: true },
            { module: "IoT Machines & Slots", view: true, create: true, edit: true, delete: true, approve: true },
            { module: "Inventory & Refill", view: true, create: true, edit: true, delete: true, approve: true },
            { module: "Transactions & Refunds", view: true, create: false, edit: true, delete: false, approve: true },
            { module: "Users, Roles & Audit", view: true, create: true, edit: true, delete: true, approve: true },
        ],
    },
    {
        code: "BA",
        title: "Brand Administrator",
        description: "Highest authority within a single perfume maison tenant: manages catalog, spray pricing, locations, and brand staff.",
        isSystemProtected: true,
        permissions: [
            { module: "Brands & Tenants", view: true, create: false, edit: true, delete: false, approve: false },
            { module: "Perfume Products", view: true, create: true, edit: true, delete: false, approve: true },
            { module: "IoT Machines & Slots", view: true, create: false, edit: true, delete: false, approve: false },
            { module: "Inventory & Refill", view: true, create: true, edit: true, delete: false, approve: true },
            { module: "Transactions & Refunds", view: true, create: false, edit: false, delete: false, approve: true },
            { module: "Users, Roles & Audit", view: true, create: true, edit: true, delete: false, approve: true },
        ],
    },
    {
        code: "OM",
        title: "Operations Manager",
        description: "Monitors daily Kiosk connectivity, handles alerts, assigns maintenance/refill tickets, and reconciles uncertain orders.",
        isSystemProtected: true,
        permissions: [
            { module: "Brands & Tenants", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "Perfume Products", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "IoT Machines & Slots", view: true, create: false, edit: true, delete: false, approve: true },
            { module: "Inventory & Refill", view: true, create: true, edit: true, delete: false, approve: true },
            { module: "Transactions & Refunds", view: true, create: false, edit: true, delete: false, approve: true },
            { module: "Users, Roles & Audit", view: false, create: false, edit: false, delete: false, approve: false },
        ],
    },
    {
        code: "TE",
        title: "Technician",
        description: "Field engineering staff: executes maintenance checklists, places kiosks in Maintenance Mode, and triggers diagnostic sprays.",
        isSystemProtected: true,
        permissions: [
            { module: "Brands & Tenants", view: false, create: false, edit: false, delete: false, approve: false },
            { module: "Perfume Products", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "IoT Machines & Slots", view: true, create: false, edit: true, delete: false, approve: false },
            { module: "Inventory & Refill", view: true, create: false, edit: true, delete: false, approve: false },
            { module: "Transactions & Refunds", view: false, create: false, edit: false, delete: false, approve: false },
            { module: "Users, Roles & Audit", view: false, create: false, edit: false, delete: false, approve: false },
        ],
    },
    {
        code: "IS",
        title: "Inventory Staff",
        description: "Warehouse and replenishment personnel: registers batches/bottles, performs cartridge swaps, and reconciles stock.",
        isSystemProtected: true,
        permissions: [
            { module: "Brands & Tenants", view: false, create: false, edit: false, delete: false, approve: false },
            { module: "Perfume Products", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "IoT Machines & Slots", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "Inventory & Refill", view: true, create: true, edit: true, delete: false, approve: false },
            { module: "Transactions & Refunds", view: false, create: false, edit: false, delete: false, approve: false },
            { module: "Users, Roles & Audit", view: false, create: false, edit: false, delete: false, approve: false },
        ],
    },
    {
        code: "VW",
        title: "Viewer",
        description: "Read-only business/marketing analyst: consults scoped dashboards and exports reports with zero write access.",
        isSystemProtected: true,
        permissions: [
            { module: "Brands & Tenants", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "Perfume Products", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "IoT Machines & Slots", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "Inventory & Refill", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "Transactions & Refunds", view: true, create: false, edit: false, delete: false, approve: false },
            { module: "Users, Roles & Audit", view: false, create: false, edit: false, delete: false, approve: false },
        ],
    },
];

function toLocalYmd(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function addDaysToYmd(ymd: string, deltaDays: number): string {
    const [y, m, d] = ymd.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, (d || 1) + deltaDays);
    return toLocalYmd(dt);
}

function formatFullDisplayDate(ymd: string): string {
    const parts = ymd.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
}

// Hàm chuyển đổi dữ liệu Audit Log thô từ localStorage thành câu mô tả thương mại sạch đẹp (không hiện JSON thô bị cắt cụt)
function formatCleanAuditDetail(item: any): string {
    if (!item) return "Verified cross-module state synchronization.";
    const nv = item.newValues;
    if (!nv || typeof nv !== "object") {
        return String(item.detail || "Verified cross-module state synchronization.");
    }
    if (typeof nv.detail === "string") {
        return nv.detail;
    }
    if (nv.newStatus && nv.location) {
        return `Station operating state updated to [${nv.newStatus}] at ${nv.location}.`;
    }
    if (nv.status && nv.locationName) {
        return `Hardware console synchronized: Status [${nv.status}] at ${nv.locationName}.`;
    }
    if (nv.sessionId && nv.method) {
        return `Authenticated session (${nv.sessionId}) via ${nv.method} • Redirected to ${nv.redirectedTo || "/dashboard"}.`;
    }
    if (typeof nv.machineRemainingMl === "number") {
        return `Cartridge volume updated to ${nv.machineRemainingMl}ml (Warehouse Reserve: ${nv.warehouseBottlesCount ?? 3} bottles).`;
    }
    if (nv.status && typeof nv.recognizedAmount === "number") {
        return `Order reconciled to [${nv.status}] • Recognized revenue: ${Number(nv.recognizedAmount).toLocaleString("vi-VN")} VND.`;
    }
    if (nv.pricePerSpray && nv.status) {
        return `Catalog configuration updated: ${Number(nv.pricePerSpray).toLocaleString("vi-VN")} VND/spray • Status [${nv.status}].`;
    }
    const pairs = Object.entries(nv)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${String(v)}`);
    return `Synchronized update — ${pairs.join(" • ")}`;
}

function buildSeedUsers(): EnterpriseUserItem[] {
    const now = new Date();
    const d = (offset: number) =>
        toLocalYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset));

    return [
        { id: 1, uidCode: "UID-USR-001", fullName: "Lê Hoàng Bách", email: "admin@scentstation.local", phone: "+84 908 458 999", department: "Executive Governance", role: "Platform Super Admin", roleCode: "PSA", brandAccess: "All Brands (Global)", locationScope: "All Kiosks & 3 Regional Warehouses", status: "ACTIVE", tokenVersion: 4, lastActive: "Just now", createdAt: d(25) },
        { id: 2, uidCode: "UID-USR-002", fullName: "Nguyễn Duy Long", email: "long.nguyen@scentstation.local", phone: "+84 909 888 123", department: "Backend & IoT Architecture", role: "Platform Super Admin", roleCode: "PSA", brandAccess: "All Brands (Global)", locationScope: "All Kiosks & Payment Gateway", status: "ACTIVE", tokenVersion: 2, lastActive: "2 mins ago", createdAt: d(24) },
        { id: 3, uidCode: "UID-USR-003", fullName: "Nguyễn Hoàng Nam", email: "nam.nguyen@scentstation.local", phone: "+84 912 345 678", department: "Hardware & IoT Engineering", role: "Technician", roleCode: "TE", brandAccess: "All Brands (Global)", locationScope: "HCMC & Hanoi Kiosk Fleet", status: "ACTIVE", tokenVersion: 1, lastActive: "8 mins ago", createdAt: d(22) },
        { id: 4, uidCode: "UID-USR-004", fullName: "Lê Minh Khôi", email: "khoi.le@scentstation.local", phone: "+84 923 456 789", department: "Warehouse & Cartridge Logistics", role: "Inventory Staff", roleCode: "IS", brandAccess: "Chanel", locationScope: "WH-SGN-CENTRAL & KIOSK-SGN-01", status: "ACTIVE", tokenVersion: 1, lastActive: "15 mins ago", createdAt: d(20) },
        { id: 5, uidCode: "UID-USR-005", fullName: "Phạm Bảo Ngọc", email: "ngoc.pham@scentstation.local", phone: "+84 934 567 890", department: "Field Operations", role: "Operations Manager", roleCode: "OM", brandAccess: "Chanel", locationScope: "Takashimaya D1 & Vincom Dong Khoi", status: "ACTIVE", tokenVersion: 2, lastActive: "25 mins ago", createdAt: d(18) },
        { id: 6, uidCode: "UID-USR-006", fullName: "Nguyễn Văn An", email: "an.nguyen@chanel.local", phone: "+84 945 678 901", department: "Brand Retail Management", role: "Brand Administrator", roleCode: "BA", brandAccess: "Chanel", locationScope: "Chanel Authorized Kiosks", status: "ACTIVE", tokenVersion: 1, lastActive: "35 mins ago", createdAt: d(16) },
        { id: 7, uidCode: "UID-USR-007", fullName: "Lê Thị Hồng", email: "hong.le@dior.local", phone: "+84 956 789 012", department: "Store Operations", role: "Brand Administrator", roleCode: "BA", brandAccess: "Dior", locationScope: "KIOSK-HN-01 & KIOSK-SGN-01", status: "ACTIVE", tokenVersion: 1, lastActive: "1 hour ago", createdAt: d(14) },
        { id: 8, uidCode: "UID-USR-008", fullName: "Trần Minh Quân", email: "quan.tran@creed.local", phone: "+84 967 890 123", department: "Hardware & IoT", role: "Technician", roleCode: "TE", brandAccess: "Creed", locationScope: "Diamond Plaza Atrium (demo-device)", status: "LOCKED", tokenVersion: 3, lastActive: "2 days ago", createdAt: d(12), deactivationReason: "Exceeded 5 failed login attempts" },
        { id: 9, uidCode: "UID-USR-009", fullName: "Phạm Quỳnh Mai", email: "mai.pham@lelabo.local", phone: "+84 978 901 234", department: "Warehouse Logistics", role: "Inventory Staff", roleCode: "IS", brandAccess: "Le Labo", locationScope: "WH-SGN-CENTRAL", status: "ACTIVE", tokenVersion: 1, lastActive: "3 hours ago", createdAt: d(10) },
        { id: 10, uidCode: "UID-USR-010", fullName: "Hoàng Gia Hân", email: "han.hoang@mfk.local", phone: "+84 989 012 345", department: "Marketing & Analytics", role: "Viewer", roleCode: "VW", brandAccess: "Maison Francis Kurkdjian", locationScope: "Read-Only Scoped Dashboards", status: "INACTIVE", tokenVersion: 2, lastActive: "1 week ago", createdAt: d(9), deactivationReason: "Seasonal campaign contract completed" },
        { id: 11, uidCode: "UID-USR-011", fullName: "Vũ Đức Huy", email: "huy.vu@tomford.local", phone: "+84 990 123 456", department: "Brand Retail Management", role: "Brand Administrator", roleCode: "BA", brandAccess: "Tom Ford", locationScope: "KIOSK-HN-02 & KIOSK-004", status: "ACTIVE", tokenVersion: 1, lastActive: "18 mins ago", createdAt: d(7) },
        { id: 12, uidCode: "UID-USR-012", fullName: "Dương Minh Tuấn", email: "tuan.duong@parfumsdemarly.local", phone: "+84 901 234 888", department: "Marketing & Analytics", role: "Viewer", roleCode: "VW", brandAccess: "Parfums de Marly", locationScope: "Read-Only Scoped Reports", status: "ACTIVE", tokenVersion: 1, lastActive: "4 hours ago", createdAt: d(6) },
        { id: 13, uidCode: "UID-USR-013", fullName: "Trịnh Quốc Hưng", email: "hung.trinh@armani.local", phone: "+84 912 345 555", department: "Hardware & IoT", role: "Technician", roleCode: "TE", brandAccess: "Giorgio Armani", locationScope: "KIOSK-SGN-01", status: "ACTIVE", tokenVersion: 1, lastActive: "50 mins ago", createdAt: d(5) },
        { id: 14, uidCode: "UID-USR-014", fullName: "Đỗ Thị Ngọc", email: "ngoc.do@versace.local", phone: "+84 923 456 444", department: "Warehouse Logistics", role: "Inventory Staff", roleCode: "IS", brandAccess: "Versace", locationScope: "WH-DAD-CENTRAL & KIOSK-DAD-01", status: "ACTIVE", tokenVersion: 1, lastActive: "12 mins ago", createdAt: d(4) },
        { id: 15, uidCode: "UID-USR-015", fullName: "Cao Thị Mỹ Linh", email: "linh.cao@burberry.local", phone: "+84 934 567 222", department: "Brand Retail Management", role: "Brand Administrator", roleCode: "BA", brandAccess: "Burberry", locationScope: "KIOSK-SGN-02 & KIOSK-HN-01", status: "ACTIVE", tokenVersion: 1, lastActive: "1 hour ago", createdAt: d(3) },
        { id: 16, uidCode: "UID-USR-016", fullName: "Lương Thùy Dương", email: "duong.luong@carolina.local", phone: "+84 945 678 222", department: "Brand Retail Management", role: "Brand Administrator", roleCode: "BA", brandAccess: "Carolina Herrera", locationScope: "KIOSK-HN-01", status: "ACTIVE", tokenVersion: 1, lastActive: "Just now", createdAt: d(2) },
        { id: 17, uidCode: "UID-USR-017", fullName: "Ngô Thanh Vân", email: "van.ngo@ysl.local", phone: "+84 956 789 456", department: "Warehouse Logistics", role: "Inventory Staff", roleCode: "IS", brandAccess: "Yves Saint Laurent", locationScope: "WH-SGN-CENTRAL", status: "LOCKED", tokenVersion: 2, lastActive: "3 days ago", createdAt: d(1), deactivationReason: "Pending MFA re-verification" },
        { id: 18, uidCode: "UID-USR-018", fullName: "Đinh Công Thành", email: "thanh.dinh@montblanc.local", phone: "+84 967 890 111", department: "Marketing & Analytics", role: "Viewer", roleCode: "VW", brandAccess: "Montblanc", locationScope: "KIOSK-SGN-03 Read-Only", status: "ACTIVE", tokenVersion: 1, lastActive: "2 hours ago", createdAt: d(0) },
    ];
}

function buildSeedAccessRequests(): AccessRequestItem[] {
    const todayStr = toLocalYmd(new Date());
    return [
        {
            id: "REQ-2026-01",
            requesterId: 12,
            requesterName: "Dương Minh Tuấn",
            requesterEmail: "tuan.duong@parfumsdemarly.local",
            currentRole: "Viewer",
            requestedRoleOrScope: "Upgrade Role to Operations Manager",
            targetBrand: "Parfums de Marly",
            reason: "Need operational privileges to reconcile transactions and schedule refills for Q4 campaign.",
            requestedAt: `${todayStr} 10:20:00`,
            status: "PENDING",
        },
        {
            id: "REQ-2026-02",
            requesterId: 6,
            requesterName: "Nguyễn Văn An",
            requesterEmail: "an.nguyen@chanel.local",
            currentRole: "Brand Administrator",
            requestedRoleOrScope: "Add KIOSK-HN-01 to Chanel Location Scope",
            targetBrand: "Chanel",
            reason: "Launching Holiday Bleu de Chanel sampling campaign at Lotte West Lake Hanoi.",
            requestedAt: `${todayStr} 09:05:00`,
            status: "PENDING",
        },
        {
            id: "REQ-2026-03",
            requesterId: 4,
            requesterName: "Lê Minh Khôi",
            requesterEmail: "khoi.le@scentstation.local",
            currentRole: "Inventory Staff",
            requestedRoleOrScope: "Manual Inventory Adjustment Permission",
            targetBrand: "Chanel",
            reason: "Reconcile load-cell weight sensor after replacing nozzle manifold on KIOSK-SGN-01.",
            requestedAt: `${addDaysToYmd(todayStr, -1)} 16:40:00`,
            status: "APPROVED",
            decidedBy: "Lê Hoàng Bách (PSA)",
            decidedAt: `${addDaysToYmd(todayStr, -1)} 17:00:00`,
            decisionReason: "Approved for KIOSK-SGN-01 quarterly stock reconciliation.",
        },
    ];
}

function buildSeedAuditLogs(): SecurityAuditLogItem[] {
    const todayStr = toLocalYmd(new Date());
    const yestStr = addDaysToYmd(todayStr, -1);
    return [
        { id: "AUD-901", dateStr: todayStr, timestamp: `${todayStr} 14:45:10`, actor: "Lê Hoàng Bách (PSA)", action: "RBAC_SCOPE_VERIFIED", target: "Tenant Isolation Filter", ipAddress: "115.78.209.14", status: "SUCCESS", detail: "Verified multi-tenant boundary across partner brands." },
        { id: "AUD-902", dateStr: todayStr, timestamp: `${todayStr} 13:20:05`, actor: "Nguyễn Văn An (BA)", action: "PRICE_UPDATE", target: "Bleu de Chanel (15,000 VND/spray)", ipAddress: "171.244.18.92", status: "SUCCESS", detail: "Updated default spray price; pending orders retain snapshot price." },
        { id: "AUD-903", dateStr: todayStr, timestamp: `${todayStr} 11:10:42`, actor: "Lê Minh Khôi (IS)", action: "CARTRIDGE_INSTALL", target: "KIOSK-SGN-01 Slot 03 (BTL-2026-0903)", ipAddress: "14.162.145.80", status: "SUCCESS", detail: "Single active bottle enforced on chamber Slot 03." },
        { id: "AUD-904", dateStr: yestStr, timestamp: `${yestStr} 16:55:19`, actor: "Phạm Bảo Ngọc (OM)", action: "ORDER_RECONCILED", target: "Order #TXN-2026-9118 (UNCERTAIN -> REFUNDED)", ipAddress: "27.72.88.104", status: "SUCCESS", detail: "Authorized refund after MQTT ACK timeout." },
        { id: "AUD-905", dateStr: yestStr, timestamp: `${yestStr} 22:14:00`, actor: "System Security Watchdog", action: "CROSS_TENANT_BLOCKED", target: "User UID-USR-008 -> Attempted Dior Scope", ipAddress: "45.33.32.156", status: "BLOCKED", detail: "Denied 403 Forbidden cross-tenant request." },
    ];
}

const USERS_STORAGE_KEY = "scentstation_commercial_users_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type MainTabType = "users" | "roles" | "permissions" | "audit";
type QuickDatePreset = "TODAY" | "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "CUSTOM";

function mapTitleToRoleCode(title: string): EnterpriseUserItem["roleCode"] {
    const low = title.toLowerCase();
    if (low.includes("super admin")) return "PSA";
    if (low.includes("brand admin")) return "BA";
    if (low.includes("operations")) return "OM";
    if (low.includes("technician")) return "TE";
    if (low.includes("inventory")) return "IS";
    return "VW";
}

function formatNowStr(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export default function UsersManagementPage(): React.ReactElement {
    const filterBarRef = useRef<HTMLDivElement | null>(null);

    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [currentAdminScope, setCurrentAdminScope] = useState<"PSA_GLOBAL" | "BA_CHANEL">("PSA_GLOBAL");
    const [activeSessionUserEmail, setActiveSessionUserEmail] = useState<string>("admin@scentstation.local");
    const [activeSessionActorName, setActiveSessionActorName] = useState<string>("Lê Hoàng Bách (PSA)");

    const [partnerBrands, setPartnerBrands] = useState<string[]>(DEFAULT_PARTNER_BRANDS);
    const [users, setUsers] = useState<EnterpriseUserItem[]>(() => buildSeedUsers());
    const [roles, setRoles] = useState<RoleDefinitionItem[]>(INITIAL_ROLES);
    const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>(() => buildSeedAccessRequests());
    const [auditLogs, setAuditLogs] = useState<SecurityAuditLogItem[]>(() => buildSeedAuditLogs());

    const [activeTab, setActiveTab] = useState<MainTabType>("users");

    // LỊCH THỰC TẾ GIỐNG HỆT MÀN 9, 10, 11
    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("ALL");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

    // QUẢN LÝ TẤT CẢ CUSTOM LUXURY DROPDOWN (KHÔNG CÒN BẤT KỲ THẺ <SELECT> MẶC ĐỊNH NÀO CỦA WINDOWS)
    const [openDropdown, setOpenDropdown] = useState<
        | "CALENDAR"
        | "ROLE"
        | "BRAND"
        | "STATUS"
        | "MATRIX_ROLE"
        | "AUDIT_OUTCOME"
        | "INVITE_ROLE"
        | "INVITE_BRAND"
        | "EDIT_ROLE"
        | "EDIT_BRAND"
        | null
    >(null);

    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [bulkActionConfirm, setBulkActionConfirm] = useState<"ACTIVATE" | "DEACTIVATE" | null>(null);

    const [selectedRoleCode, setSelectedRoleCode] = useState<string>("BA");
    const [isCreateRoleOpen, setIsCreateRoleOpen] = useState<boolean>(false);
    const [newRoleCode, setNewRoleCode] = useState<string>("AUD");
    const [newRoleTitle, setNewRoleTitle] = useState<string>("Regional Compliance Auditor");
    const [newRoleDesc, setNewRoleDesc] = useState<string>(
        "Scoped compliance reviewer for regional warehouse and financial reconciliation."
    );

    const [selectedUser, setSelectedUser] = useState<EnterpriseUserItem | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
    const [editName, setEditName] = useState<string>("");
    const [editPhone, setEditPhone] = useState<string>("");
    const [editDept, setEditDept] = useState<string>("");
    const [editRole, setEditRole] = useState<string>("");
    const [editBrandAccess, setEditBrandAccess] = useState<string>("");

    const [deactivateTargetUser, setDeactivateTargetUser] =
        useState<EnterpriseUserItem | null>(null);
    const [deactivateReasonInput, setDeactivateReasonInput] = useState<string>(
        "Role reassignment / security policy rotation."
    );

    const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
    const [inviteName, setInviteName] = useState<string>("");
    const [inviteEmail, setInviteEmail] = useState<string>("");
    const [inviteDept] = useState<string>("Store Operations");
    const [inviteRole, setInviteRole] = useState<string>("Operations Manager");
    const [inviteBrand, setInviteBrand] = useState<string>("Chanel");
    const [inviteLocationScope, setInviteLocationScope] = useState<string>(
        "KIOSK-SGN-01 & KIOSK-SGN-02"
    );
    const [inviteError, setInviteError] = useState<string>("");

    const [auditSearchUser, setAuditSearchUser] = useState<string>("");
    const [auditStatusFilter, setAuditStatusFilter] = useState<string>("ALL");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4200);
    }, []);

    const handleToggleLanguage = useCallback(() => {
        const nextLang = lang === "en" ? "vi" : "en";
        setLang(nextLang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
        } catch {
            // Safe fallback
        }
    }, [lang]);

    /* --- HÀM CHỌN LỊCH THỰC TẾ --- */
    const handleApplyDatePreset = useCallback((preset: QuickDatePreset) => {
        const now = new Date();
        const todayStr = toLocalYmd(now);
        setDatePreset(preset);

        if (preset === "TODAY") {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === "THIS_WEEK") {
            const dow = now.getDay();
            const diffToMon = dow === 0 ? -6 : 1 - dow;
            const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
            const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
            setStartDate(toLocalYmd(mon));
            setEndDate(toLocalYmd(sun));
        } else if (preset === "LAST_WEEK") {
            const dow = now.getDay();
            const diffToMon = dow === 0 ? -6 : 1 - dow;
            const lastMon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon - 7);
            const lastSun = new Date(lastMon.getFullYear(), lastMon.getMonth(), lastMon.getDate() + 6);
            setStartDate(toLocalYmd(lastMon));
            setEndDate(toLocalYmd(lastSun));
        } else if (preset === "THIS_MONTH") {
            const first = new Date(now.getFullYear(), now.getMonth(), 1);
            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(toLocalYmd(first));
            setEndDate(toLocalYmd(last));
        } else if (preset === "LAST_30_DAYS") {
            setStartDate(addDaysToYmd(todayStr, -29));
            setEndDate(todayStr);
        }
    }, []);

    const calendarGridCells = useMemo(() => {
        const firstDay = new Date(calendarViewYear, calendarViewMonth, 1);
        const startWeekday = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
        const prevMonthDays = new Date(calendarViewYear, calendarViewMonth, 0).getDate();

        const cells: { ymd: string; dayNum: number; isCurrentMonth: boolean }[] = [];
        for (let i = startWeekday - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const dt = new Date(calendarViewYear, calendarViewMonth - 1, d);
            cells.push({ ymd: toLocalYmd(dt), dayNum: d, isCurrentMonth: false });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(calendarViewYear, calendarViewMonth, d);
            cells.push({ ymd: toLocalYmd(dt), dayNum: d, isCurrentMonth: true });
        }
        while (cells.length < 42) {
            const nextD = cells.length - (startWeekday + daysInMonth) + 1;
            const dt = new Date(calendarViewYear, calendarViewMonth + 1, nextD);
            cells.push({ ymd: toLocalYmd(dt), dayNum: nextD, isCurrentMonth: false });
        }
        return cells;
    }, [calendarViewYear, calendarViewMonth]);

    const handleSelectCalendarDay = (pickedYmd: string) => {
        setDatePreset("CUSTOM");
        if (selectingEdge === "START") {
            if (pickedYmd > endDate) {
                setStartDate(pickedYmd);
                setEndDate(pickedYmd);
            } else {
                setStartDate(pickedYmd);
            }
            setSelectingEdge("END");
        } else {
            if (pickedYmd < startDate) {
                setStartDate(pickedYmd);
                setEndDate(startDate);
            } else {
                setEndDate(pickedYmd);
            }
            setSelectingEdge("START");
            setOpenDropdown(null);
        }
    };

    const monthTitleText = useMemo(() => {
        const dt = new Date(calendarViewYear, calendarViewMonth, 1);
        return dt.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
            month: "long",
            year: "numeric",
        });
    }, [calendarViewYear, calendarViewMonth, lang]);

    /* --- 1. ĐỒNG BỘ 2 CHIỀU TOÀN DIỆN VỚI MÀN 1..11 --- */
    const loadAndReconcileUsersData = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            // A. Đọc phiên đăng nhập hiện tại từ Màn 2 (/login)
            const rawSessionUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawSessionUser) {
                const parsedSession = JSON.parse(rawSessionUser);
                const roleCode = parsedSession.roleCode || parsedSession.role || "PSA";
                setActiveSessionUserEmail(parsedSession.email || "admin@scentstation.local");
                setActiveSessionActorName(
                    `${parsedSession.fullName || parsedSession.name || "Lê Hoàng Bách"} (${roleCode})`
                );
                if (roleCode === "BA") {
                    setCurrentAdminScope("BA_CHANEL");
                }
            }

            // B. Đọc danh sách Thương hiệu động từ PRODUCTS_STORAGE_KEY
            const brandSet = new Set<string>(DEFAULT_PARTNER_BRANDS);
            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds)) {
                    parsedProds.forEach((p: any) => {
                        if (p && p.brand) brandSet.add(String(p.brand).trim());
                    });
                }
            }
            setPartnerBrands(Array.from(brandSet));

            // C. Đọc trạng thái Users, Roles & Access Requests từ USERS_STORAGE_KEY
            const rawSavedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (rawSavedUsers) {
                const parsed = JSON.parse(rawSavedUsers);
                if (Array.isArray(parsed.users) && parsed.users.length > 0) {
                    const cleanedUsers = parsed.users.map((u: EnterpriseUserItem) =>
                        u.id === 1 && u.email === "admin@scentstation.local"
                            ? { ...u, fullName: "Lê Hoàng Bách" }
                            : u
                    );
                    setUsers(cleanedUsers);
                }
                if (Array.isArray(parsed.roles) && parsed.roles.length >= 6) {
                    setRoles(parsed.roles);
                }
                if (Array.isArray(parsed.accessRequests) && parsed.accessRequests.length > 0) {
                    setAccessRequests(parsed.accessRequests);
                }
            }

            // D. Hợp nhất Audit Logs thực tế từ toàn bộ các màn hình trước (AUDIT_LOGS_STORAGE_KEY)
            const seedAudits = buildSeedAuditLogs();
            const rawSharedAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
            if (rawSharedAudit) {
                const parsedShared = JSON.parse(rawSharedAudit);
                if (Array.isArray(parsedShared) && parsedShared.length > 0) {
                    const convertedLiveAudits: SecurityAuditLogItem[] = parsedShared
                        .slice(0, 40)
                        .map((item: any, idx: number) => {
                            const tsRaw = String(item.timestamp || new Date().toISOString());
                            const dPart = tsRaw.includes("T")
                                ? tsRaw.split("T")[0]
                                : tsRaw.slice(0, 10) || todayYmd;
                            const tPart = tsRaw.includes("T")
                                ? tsRaw.split("T")[1].slice(0, 8)
                                : tsRaw.slice(11, 19) || "14:20:00";

                            return {
                                id: String(item.id || `AUD-LIVE-${idx}`),
                                dateStr: dPart,
                                timestamp: `${dPart} ${tPart}`,
                                actor: String(item.actor || "Platform Super Administrator"),
                                action: String(item.action || "SYSTEM_SYNC_EVENT"),
                                target: `${item.entityType || "SYSTEM"} • ${item.entityId || "GLOBAL"}`,
                                ipAddress: String(item.sourceIp || "127.0.0.1"),
                                status: "SUCCESS",
                                detail: formatCleanAuditDetail(item),
                            };
                        });

                    const seenIds = new Set<string>();
                    const mergedAudits: SecurityAuditLogItem[] = [];
                    [...convertedLiveAudits, ...seedAudits].forEach((log) => {
                        if (!seenIds.has(log.id)) {
                            seenIds.add(log.id);
                            mergedAudits.push(log);
                        }
                    });
                    setAuditLogs(mergedAudits);
                }
            }
        } catch {
            // Safe fallback
        }
    }, [todayYmd]);

    useEffect(() => {
        loadAndReconcileUsersData();

        const handleCrossTabSync = () => {
            loadAndReconcileUsersData();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileUsersData();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileUsersData]);

    /* --- 2. GHI & ĐỒNG BỘ NGƯỢC TỪ USERS SANG TOÀN BỘ 11 MÀN HÌNH KIA --- */
    const persistUsersAndBroadcastSync = useCallback(
        (
            nextUsers: EnterpriseUserItem[],
            nextRoles: RoleDefinitionItem[],
            nextRequests: AccessRequestItem[],
            auditEvent?: {
                action: string;
                target: string;
                detail: string;
                status?: "SUCCESS" | "LOCKED" | "BLOCKED" | "PENDING";
            },
            updatedActiveUser?: EnterpriseUserItem
        ) => {
            setUsers(nextUsers);
            setRoles(nextRoles);
            setAccessRequests(nextRequests);

            try {
                localStorage.setItem(
                    USERS_STORAGE_KEY,
                    JSON.stringify({
                        users: nextUsers,
                        roles: nextRoles,
                        accessRequests: nextRequests,
                    })
                );

                if (
                    updatedActiveUser &&
                    updatedActiveUser.email.toLowerCase() ===
                    activeSessionUserEmail.toLowerCase()
                ) {
                    const sessionPayload = {
                        id: updatedActiveUser.uidCode,
                        name: updatedActiveUser.fullName,
                        fullName: updatedActiveUser.fullName,
                        email: updatedActiveUser.email,
                        role: updatedActiveUser.roleCode,
                        roleCode: updatedActiveUser.roleCode,
                        roleTitle: updatedActiveUser.role,
                        brandScope:
                            updatedActiveUser.brandAccess === "All Brands (Global)"
                                ? null
                                : updatedActiveUser.brandAccess,
                        tokenVersion: updatedActiveUser.tokenVersion,
                    };
                    localStorage.setItem("scentstation-user", JSON.stringify(sessionPayload));
                    sessionStorage.setItem("scentstation-user", JSON.stringify(sessionPayload));
                }

                if (auditEvent) {
                    const nowIso = new Date().toISOString();
                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                    auditList.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: nowIso,
                        actor: activeSessionActorName,
                        role: currentAdminScope === "PSA_GLOBAL" ? "PSA" : "BA",
                        tenant: currentAdminScope === "PSA_GLOBAL" ? "GLOBAL" : "Chanel",
                        action: auditEvent.action,
                        entityType: "USERS_RBAC",
                        entityId: auditEvent.target,
                        severity: "INFO",
                        oldValues: null,
                        newValues: { detail: auditEvent.detail },
                        sourceIp: "127.0.0.1",
                    });
                    localStorage.setItem(
                        AUDIT_LOGS_STORAGE_KEY,
                        JSON.stringify(auditList.slice(0, 250))
                    );

                    setAuditLogs((prev) => [
                        {
                            id: `AUD-${Date.now().toString().slice(-4)}`,
                            dateStr: todayYmd,
                            timestamp: formatNowStr(),
                            actor: activeSessionActorName,
                            action: auditEvent.action,
                            target: auditEvent.target,
                            ipAddress: "127.0.0.1",
                            status: auditEvent.status || "SUCCESS",
                            detail: auditEvent.detail,
                        },
                        ...prev,
                    ]);
                }

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        [activeSessionActorName, activeSessionUserEmail, currentAdminScope, todayYmd]
    );

    const handleImpersonateUserSession = useCallback(
        (targetUser: EnterpriseUserItem) => {
            if (targetUser.status !== "ACTIVE") {
                showToast(
                    lang === "en"
                        ? `Cannot switch session: Account ${targetUser.uidCode} is currently ${targetUser.status}.`
                        : `Không thể chuyển phiên: Tài khoản ${targetUser.uidCode} đang ở trạng thái ${targetUser.status}.`
                );
                return;
            }

            const sessionPayload = {
                id: targetUser.uidCode,
                name: targetUser.fullName,
                fullName: targetUser.fullName,
                email: targetUser.email,
                role: targetUser.roleCode,
                roleCode: targetUser.roleCode,
                roleTitle: targetUser.role,
                brandScope:
                    targetUser.brandAccess === "All Brands (Global)"
                        ? null
                        : targetUser.brandAccess,
                tokenVersion: targetUser.tokenVersion,
            };

            try {
                localStorage.setItem("scentstation-user", JSON.stringify(sessionPayload));
                sessionStorage.setItem("scentstation-user", JSON.stringify(sessionPayload));
                setActiveSessionUserEmail(targetUser.email);
                setActiveSessionActorName(`${targetUser.fullName} (${targetUser.roleCode})`);
                setCurrentAdminScope(targetUser.roleCode === "BA" ? "BA_CHANEL" : "PSA_GLOBAL");

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }

                showToast(
                    lang === "en"
                        ? `Switched active portal session to ${targetUser.fullName} [${targetUser.role} • ${targetUser.brandAccess}] across all screens!`
                        : `Đã chuyển phiên làm việc sang ${targetUser.fullName} [${targetUser.role} • ${targetUser.brandAccess}] đồng bộ toàn hệ thống!`
                );
            } catch {
                // Safe fallback
            }
        },
        [lang, showToast]
    );

    const tenantScopedUsers = useMemo(() => {
        if (currentAdminScope === "PSA_GLOBAL") return users;
        return users.filter((u) => u.brandAccess === "Chanel");
    }, [users, currentAdminScope]);

    const summaryMetrics = useMemo(() => {
        const total = tenantScopedUsers.length;
        const active = tenantScopedUsers.filter((u) => u.status === "ACTIVE").length;
        const inactiveOrLocked = tenantScopedUsers.filter(
            (u) => u.status === "INACTIVE" || u.status === "LOCKED"
        ).length;
        const totalRolesCount = roles.length;

        return { total, active, inactiveOrLocked, totalRolesCount };
    }, [tenantScopedUsers, roles]);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tenantScopedUsers.filter((u) => {
            const matchesDate = u.createdAt >= startDate && u.createdAt <= endDate;
            const matchesSearch =
                !q ||
                u.fullName.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.uidCode.toLowerCase().includes(q) ||
                u.department.toLowerCase().includes(q);
            const matchesRole =
                selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;
            const matchesBrand =
                selectedBrandFilter === "ALL" ||
                u.brandAccess === selectedBrandFilter;
            const matchesStatus =
                selectedStatusFilter === "ALL" ||
                (selectedStatusFilter === "INACTIVE_LOCKED"
                    ? u.status === "INACTIVE" || u.status === "LOCKED"
                    : u.status === selectedStatusFilter);

            return (
                matchesDate &&
                matchesSearch &&
                matchesRole &&
                matchesBrand &&
                matchesStatus
            );
        });
    }, [
        tenantScopedUsers,
        startDate,
        endDate,
        searchQuery,
        selectedRoleFilter,
        selectedBrandFilter,
        selectedStatusFilter,
    ]);

    const handleResetFilters = () => {
        setStartDate(defaultStart30d);
        setEndDate(todayYmd);
        setDatePreset("LAST_30_DAYS");
        setSearchQuery("");
        setSelectedRoleFilter("ALL");
        setSelectedBrandFilter("ALL");
        setSelectedStatusFilter("ALL");
        setSelectedUserIds([]);
        setOpenDropdown(null);
    };

    const handleToggleSelectUser = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleExecuteBulkOperation = () => {
        if (!bulkActionConfirm) return;
        const nextStatus: AccountStatus =
            bulkActionConfirm === "ACTIVATE" ? "ACTIVE" : "INACTIVE";

        const nextUsers = users.map((u) =>
            selectedUserIds.includes(u.id)
                ? {
                    ...u,
                    status: nextStatus,
                    tokenVersion: u.tokenVersion + 1,
                }
                : u
        );

        persistUsersAndBroadcastSync(nextUsers, roles, accessRequests, {
            action: `BULK_${bulkActionConfirm}`,
            target: `${selectedUserIds.length} User Accounts`,
            detail: `Executed confirmed bulk status update to ${nextStatus} & incremented token_version.`,
        });

        showToast(
            lang === "en"
                ? `Bulk operation completed: ${selectedUserIds.length} accounts updated to ${nextStatus}!`
                : `Đã cập nhật hàng loạt ${selectedUserIds.length} tài khoản sang trạng thái ${nextStatus}!`
        );
        setSelectedUserIds([]);
        setBulkActionConfirm(null);
    };

    const handleInviteUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError("");

        const cleanName = inviteName.trim();
        const cleanEmail = inviteEmail.trim().toLowerCase();

        if (!cleanName || !cleanEmail.includes("@")) {
            setInviteError("Please provide a valid full name and corporate email address.");
            return;
        }
        if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
            setInviteError(`Duplicate email rejected: "${cleanEmail}" is already registered.`);
            return;
        }
        if (
            currentAdminScope === "BA_CHANEL" &&
            (inviteRole === "Platform Super Admin" ||
                inviteRole === "Brand Administrator")
        ) {
            setInviteError(
                "Privilege Escalation Blocked: Brand Administrators cannot grant Platform Super Admin or Brand Administrator privileges."
            );
            return;
        }

        const nextId = users.length + 1;
        const effectiveBrand =
            currentAdminScope === "BA_CHANEL" ? "Chanel" : inviteBrand;

        const newInvitedUser: EnterpriseUserItem = {
            id: nextId,
            uidCode: `UID-USR-${String(nextId).padStart(3, "0")}`,
            fullName: cleanName,
            email: cleanEmail,
            phone: "+84 900 000 000",
            department: inviteDept,
            role: inviteRole,
            roleCode: mapTitleToRoleCode(inviteRole),
            brandAccess: effectiveBrand,
            locationScope: inviteLocationScope,
            status: "INVITED",
            tokenVersion: 1,
            lastActive: "Invitation Sent (Pending)",
            createdAt: todayYmd,
        };

        const nextUsers = [newInvitedUser, ...users];
        persistUsersAndBroadcastSync(nextUsers, roles, accessRequests, {
            action: "INVITE_USER",
            target: `${cleanEmail} (${inviteRole} • ${effectiveBrand})`,
            detail: `Dispatched scoped account invitation bound to ${effectiveBrand}.`,
            status: "PENDING",
        });

        setIsInviteModalOpen(false);
        setInviteName("");
        setInviteEmail("");
        showToast(
            lang === "en"
                ? `Invitation sent to ${cleanEmail} [${inviteRole} • ${effectiveBrand}] & synchronized across all screens!`
                : `Đã gửi lời mời tài khoản tới ${cleanEmail} [${inviteRole} • ${effectiveBrand}] & đồng bộ toàn hệ thống!`
        );
    };

    const handleOpenUserModal = (user: EnterpriseUserItem) => {
        setSelectedUser(user);
        setIsEditingProfile(false);
        setEditName(user.fullName);
        setEditPhone(user.phone);
        setEditDept(user.department);
        setEditRole(user.role);
        setEditBrandAccess(user.brandAccess);
    };

    const handleSaveUserProfileEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        if (
            currentAdminScope === "BA_CHANEL" &&
            editBrandAccess !== "Chanel"
        ) {
            showToast(
                "Cross-Tenant Scope Rejected: Brand Administrators cannot grant access to brands outside their authorized scope."
            );
            return;
        }

        const updated: EnterpriseUserItem = {
            ...selectedUser,
            fullName: editName.trim() || selectedUser.fullName,
            phone: editPhone.trim() || selectedUser.phone,
            department: editDept,
            role: editRole,
            roleCode: mapTitleToRoleCode(editRole),
            brandAccess: editBrandAccess,
            tokenVersion: selectedUser.tokenVersion + 1,
        };

        const nextUsers = users.map((u) => (u.id === selectedUser.id ? updated : u));
        setSelectedUser(updated);
        setIsEditingProfile(false);

        persistUsersAndBroadcastSync(
            nextUsers,
            roles,
            accessRequests,
            {
                action: "USER_PROFILE_UPDATED",
                target: `${updated.uidCode} (${updated.email})`,
                detail: `Updated role/scope to [${updated.role} • ${updated.brandAccess}] & incremented token_version to v${updated.tokenVersion}.`,
            },
            updated
        );

        showToast(
            lang === "en"
                ? `Saved profile & brand scope for ${updated.fullName} (token_version -> v${updated.tokenVersion})!`
                : `Đã lưu hồ sơ & phạm vi thương hiệu cho ${updated.fullName} (token_version -> v${updated.tokenVersion})!`
        );
    };

    const handleConfirmDeactivateOrActivate = () => {
        if (!deactivateTargetUser) return;
        const isCurrentlyActive = deactivateTargetUser.status === "ACTIVE";
        const nextStatus: AccountStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";

        const updated: EnterpriseUserItem = {
            ...deactivateTargetUser,
            status: nextStatus,
            tokenVersion: deactivateTargetUser.tokenVersion + 1,
            deactivationReason: isCurrentlyActive
                ? deactivateReasonInput.trim()
                : undefined,
        };

        const nextUsers = users.map((u) =>
            u.id === deactivateTargetUser.id ? updated : u
        );
        if (selectedUser?.id === deactivateTargetUser.id) {
            setSelectedUser(updated);
        }

        persistUsersAndBroadcastSync(
            nextUsers,
            roles,
            accessRequests,
            {
                action: isCurrentlyActive ? "DEACTIVATE_USER" : "ACTIVATE_USER",
                target: `${updated.uidCode} (${updated.email})`,
                detail: `Status changed to ${nextStatus}. Reason: "${deactivateReasonInput}". Active sessions revoked.`,
            },
            updated
        );

        showToast(
            lang === "en"
                ? `Account ${updated.uidCode} is now ${nextStatus} (Active JWT sessions revoked)!`
                : `Tài khoản ${updated.uidCode} đã chuyển sang ${nextStatus} (Đã thu hồi phiên JWT)!`
        );
        setDeactivateTargetUser(null);
    };

    const handleToggleMatrixPermission = (
        moduleName: string,
        field: "view" | "create" | "edit" | "delete" | "approve"
    ) => {
        if (selectedRoleCode === "PSA") {
            showToast(
                "System Role Protection: Platform Super Admin core permissions are locked against modification."
            );
            return;
        }

        setRoles((prev) =>
            prev.map((r) => {
                if (r.code !== selectedRoleCode) return r;
                return {
                    ...r,
                    permissions: r.permissions.map((p) =>
                        p.module === moduleName
                            ? { ...p, [field]: !p[field] }
                            : p
                    ),
                };
            })
        );
    };

    const handleSavePermissionMatrix = () => {
        const affectedCount = users.filter(
            (u) =>
                u.role ===
                roles.find((r) => r.code === selectedRoleCode)?.title
        ).length;

        persistUsersAndBroadcastSync(users, roles, accessRequests, {
            action: "PERMISSION_MATRIX_UPDATED",
            target: `Role: ${selectedRoleCode} (${affectedCount} accounts affected)`,
            detail: `Updated granular RBAC matrix for role ${selectedRoleCode} and incremented token_version on ${affectedCount} accounts.`,
        });

        showToast(
            lang === "en"
                ? `Saved RBAC Permission Matrix for ${selectedRoleCode} (${affectedCount} accounts updated & logged)!`
                : `Đã lưu Ma trận Phân quyền RBAC cho ${selectedRoleCode} (Cập nhật ${affectedCount} tài khoản)!`
        );
    };

    const handleCreateCustomRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleCode.trim() || !newRoleTitle.trim()) return;

        const customRole: RoleDefinitionItem = {
            code: newRoleCode.trim().toUpperCase(),
            title: newRoleTitle.trim(),
            description: newRoleDesc.trim(),
            isSystemProtected: false,
            permissions: [
                { module: "Brands & Tenants", view: true, create: false, edit: false, delete: false, approve: false },
                { module: "Perfume Products", view: true, create: false, edit: false, delete: false, approve: false },
                { module: "IoT Machines & Slots", view: true, create: false, edit: false, delete: false, approve: false },
                { module: "Inventory & Refill", view: true, create: false, edit: false, delete: false, approve: false },
                { module: "Transactions & Refunds", view: true, create: false, edit: false, delete: false, approve: false },
                { module: "Users, Roles & Audit", view: true, create: false, edit: false, delete: false, approve: false },
            ],
        };

        const nextRoles = [...roles, customRole];
        persistUsersAndBroadcastSync(users, nextRoles, accessRequests, {
            action: "CUSTOM_ROLE_CREATED",
            target: `Role [${customRole.code}] ${customRole.title}`,
            detail: customRole.description,
        });

        setSelectedRoleCode(customRole.code);
        setIsCreateRoleOpen(false);
        showToast(
            `Created custom role [${customRole.code}] ${customRole.title}! Total Roles updated to ${nextRoles.length}.`
        );
    };

    const handleDecideAccessRequest = (
        req: AccessRequestItem,
        decision: "APPROVED" | "REJECTED"
    ) => {
        if (
            currentAdminScope === "BA_CHANEL" &&
            req.requesterEmail === "an.nguyen@chanel.local"
        ) {
            showToast(
                "Self-Approval Blocked: You cannot approve your own privilege escalation request. Platform Super Admin approval required."
            );
            return;
        }

        const nowStr = formatNowStr();
        const nextRequests = accessRequests.map((item) =>
            item.id === req.id
                ? {
                    ...item,
                    status: decision,
                    decidedBy: activeSessionActorName,
                    decidedAt: nowStr,
                    decisionReason:
                        decision === "APPROVED"
                            ? "Verified business justification & tenant scope policy."
                            : "Denied per least-privilege access control policy.",
                }
                : item
        );

        let nextUsers = users;
        if (decision === "APPROVED") {
            nextUsers = users.map((u) => {
                if (u.id !== req.requesterId) return u;
                if (req.requestedRoleOrScope.includes("Operations Manager")) {
                    return {
                        ...u,
                        role: "Operations Manager",
                        roleCode: "OM",
                        tokenVersion: u.tokenVersion + 1,
                    };
                }
                return {
                    ...u,
                    locationScope: `${u.locationScope} + ${req.requestedRoleOrScope}`,
                    tokenVersion: u.tokenVersion + 1,
                };
            });
        }

        persistUsersAndBroadcastSync(nextUsers, roles, nextRequests, {
            action: `ACCESS_REQUEST_${decision}`,
            target: `${req.id} (${req.requesterEmail})`,
            detail: `${decision} request for "${req.requestedRoleOrScope}" on ${req.targetBrand}.`,
        });

        showToast(
            lang === "en"
                ? `Access Request ${req.id} marked as ${decision} & synchronized across all modules!`
                : `Đã ${decision === "APPROVED" ? "PHÊ DUYỆT" : "TỪ CHỐI"} yêu cầu ${req.id} & đồng bộ toàn hệ thống!`
        );
    };

    const selectedRoleObj =
        roles.find((r) => r.code === selectedRoleCode) || roles[0];

    const renderUserStatusBadge = (st: AccountStatus) => {
        if (st === "ACTIVE") {
            return (
                <span className={styles.badgeActive}>
                    <CheckCircle2 size={12} />
                    <span>ACTIVE</span>
                </span>
            );
        }
        if (st === "LOCKED") {
            return (
                <span className={styles.badgeLocked}>
                    <Lock size={12} />
                    <span>LOCKED</span>
                </span>
            );
        }
        if (st === "INVITED") {
            return (
                <span className={styles.badgeInvited}>
                    <Clock size={12} />
                    <span>INVITED</span>
                </span>
            );
        }
        return (
            <span className={styles.badgeInactive}>
                <AlertCircle size={12} />
                <span>INACTIVE</span>
            </span>
        );
    };

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => setOpenDropdown(null)}
        >
            {/* LUXURY HERO BANNER CARD */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? "IDENTITY GOVERNANCE & MULTI-TENANT ACCESS CONTROL"
                                : "QUẢN TRỊ ĐỊNH DANH DOANH NGHIỆP & PHÂN QUYỀN ĐA THƯƠNG HIỆU"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Users & Role-Based Access Control"
                                : "Quản Trị Nhân Sự & Phân Quyền RBAC"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? `Multi-tenant identity governance across ${partnerBrands.length - 1} luxury partner maisons, granular permission matrices, and tamper-resistant security audit logs.`
                                : `Quản trị tài khoản nhân sự trên ${partnerBrands.length - 1} thương hiệu đối tác, ma trận phân quyền chi tiết và nhật ký bảo mật bất biến.`}
                        </p>
                    </div>

                    <div
                        className={styles.headerActions}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={handleToggleLanguage}
                            className={styles.secondaryGoldBtn}
                        >
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const nextScope =
                                    currentAdminScope === "PSA_GLOBAL"
                                        ? "BA_CHANEL"
                                        : "PSA_GLOBAL";
                                setCurrentAdminScope(nextScope);
                                setSelectedBrandFilter("ALL");
                            }}
                            className={styles.secondaryGoldBtn}
                        >
                            <ShieldCheck size={14} color="#D4AF37" />
                            <span>
                                {currentAdminScope === "PSA_GLOBAL"
                                    ? lang === "en"
                                        ? "Scope: Global Admin"
                                        : "Phạm vi: Toàn Hệ Thống"
                                    : lang === "en"
                                        ? "Scope: Chanel Tenant"
                                        : "Phạm vi: Hãng Chanel"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setInviteError("");
                                setInviteBrand("Chanel");
                                setOpenDropdown(null);
                                setIsInviteModalOpen(true);
                            }}
                            className={styles.primaryGoldBtn}
                        >
                            <UserPlus size={15} />
                            <span>
                                {lang === "en" ? "Invite User" : "Mời Nhân Sự Mới"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* 4 KPI SUMMARY CARDS */}
                <div className={styles.statsGrid}>
                    <div
                        className={`${styles.statCard} ${
                            activeTab === "users" && selectedStatusFilter === "ALL"
                                ? styles.statCardActive
                                : ""
                        }`}
                        onClick={() => {
                            setActiveTab("users");
                            setSelectedStatusFilter("ALL");
                        }}
                    >
                        <div className={styles.statLabel}>
                            {lang === "en" ? "TOTAL ACCOUNTS" : "TỔNG SỐ TÀI KHOẢN"}
                        </div>
                        <div className={styles.statValue}>
                            {summaryMetrics.total} Users
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {lang === "en"
                                ? "Within authorized tenant scope"
                                : "Trong phạm vi thương hiệu được giao"}
                        </div>
                    </div>

                    <div
                        className={`${styles.statCard} ${
                            activeTab === "users" && selectedStatusFilter === "ACTIVE"
                                ? styles.statCardActive
                                : ""
                        }`}
                        onClick={() => {
                            setActiveTab("users");
                            setSelectedStatusFilter("ACTIVE");
                        }}
                    >
                        <div className={styles.statLabel}>
                            {lang === "en" ? "ACTIVE PERSONNEL" : "TÀI KHOẢN ĐANG HOẠT ĐỘNG"}
                        </div>
                        <div className={styles.statValue} style={{ color: "#34D399" }}>
                            {summaryMetrics.active} Active
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399" }}>
                            {lang === "en"
                                ? "Select to filter active accounts"
                                : "Chạm để lọc nhân sự đang hoạt động"}
                        </div>
                    </div>

                    <div
                        className={`${styles.statCard} ${
                            activeTab === "users" &&
                            selectedStatusFilter === "INACTIVE_LOCKED"
                                ? styles.statCardActive
                                : ""
                        }`}
                        onClick={() => {
                            setActiveTab("users");
                            setSelectedStatusFilter("INACTIVE_LOCKED");
                        }}
                    >
                        <div className={styles.statLabel}>
                            {lang === "en"
                                ? "INACTIVE / LOCKED"
                                : "TẠM KHÓA / NGƯNG HOẠT ĐỘNG"}
                        </div>
                        <div className={styles.statValue} style={{ color: "#F87171" }}>
                            {summaryMetrics.inactiveOrLocked} Accounts
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#F87171" }}>
                            {lang === "en"
                                ? "Select to inspect suspended sessions"
                                : "Chạm để kiểm tra tài khoản bị khóa"}
                        </div>
                    </div>

                    <div
                        className={`${styles.statCard} ${
                            activeTab === "roles" ? styles.statCardActive : ""
                        }`}
                        onClick={() => setActiveTab("roles")}
                    >
                        <div className={styles.statLabel}>
                            {lang === "en" ? "CONFIGURED ROLES" : "VAI TRÒ PHÂN QUYỀN"}
                        </div>
                        <div className={styles.statValue} style={{ color: "#F5E6AD" }}>
                            {summaryMetrics.totalRolesCount} Roles
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#F5E6AD" }}>
                            {lang === "en"
                                ? "Select to configure RBAC matrix"
                                : "Chạm để cấu hình ma trận quyền hạn"}
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER BAR 2 TẦNG CÓ BẢNG LỊCH THỰC TẾ GIỐNG HỆT MÀN 9, 10, 11 */}
            <div
                className={styles.filterBar}
                ref={filterBarRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.filterRowTop}>
                    {/* 1. Ô Tìm kiếm */}
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={
                                lang === "en"
                                    ? "Search by full name, corporate email, UID code, or department..."
                                    : "Tìm theo họ tên, email doanh nghiệp, mã định danh UID hoặc phòng ban..."
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                style={{
                                    position: "absolute",
                                    right: "0.6rem",
                                    background: "none",
                                    border: "none",
                                    color: "#94A3B8",
                                    cursor: "pointer",
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* 2. Bảng Lịch Thực Tế (Custom Luxury Dark Calendar Popover) */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "CALENDAR" ? null : "CALENDAR"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                openDropdown === "CALENDAR"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <Calendar size={14} color="#D4AF37" />
                            <span style={{ fontFamily: "Space Grotesk, monospace" }}>
                                {formatFullDisplayDate(startDate)} — {formatFullDisplayDate(endDate)}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>

                        {openDropdown === "CALENDAR" && (
                            <div className={styles.calendarPopover}>
                                <div className={styles.calendarHeader}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (calendarViewMonth === 0) {
                                                setCalendarViewMonth(11);
                                                setCalendarViewYear((y) => y - 1);
                                            } else {
                                                setCalendarViewMonth((m) => m - 1);
                                            }
                                        }}
                                        className={styles.calendarNavBtn}
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className={styles.calendarMonthTitle}>
                                        {monthTitleText}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (calendarViewMonth === 11) {
                                                setCalendarViewMonth(0);
                                                setCalendarViewYear((y) => y + 1);
                                            } else {
                                                setCalendarViewMonth((m) => m + 1);
                                            }
                                        }}
                                        className={styles.calendarNavBtn}
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div
                                    style={{
                                        fontSize: "0.7rem",
                                        color: "#94A3B8",
                                        marginBottom: "0.55rem",
                                        textAlign: "center",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectingEdge === "START"
                                        ? lang === "en"
                                            ? "Step 1: Select Start Date"
                                            : "Bước 1: Chọn Ngày Bắt Đầu"
                                        : lang === "en"
                                            ? "Step 2: Select End Date"
                                            : "Bước 2: Chọn Ngày Kết Thúc"}
                                </div>

                                <div className={styles.calendarWeekdaysGrid}>
                                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((wd) => (
                                        <span key={wd}>{wd}</span>
                                    ))}
                                </div>

                                <div className={styles.calendarDaysGrid}>
                                    {calendarGridCells.map((cell) => {
                                        const isStartOrEnd =
                                            cell.ymd === startDate || cell.ymd === endDate;
                                        const isBetween =
                                            cell.ymd > startDate && cell.ymd < endDate;

                                        return (
                                            <button
                                                key={cell.ymd}
                                                type="button"
                                                onClick={() => handleSelectCalendarDay(cell.ymd)}
                                                className={`${styles.calendarDayBtn} ${
                                                    !cell.isCurrentMonth
                                                        ? styles.calendarDayMuted
                                                        : ""
                                                } ${
                                                    isBetween ? styles.calendarDayInRange : ""
                                                } ${
                                                    isStartOrEnd
                                                        ? styles.calendarDaySelected
                                                        : ""
                                                }`}
                                            >
                                                {cell.dayNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginTop: "0.8rem",
                                        paddingTop: "0.6rem",
                                        borderTop: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleApplyDatePreset("TODAY");
                                            setOpenDropdown(null);
                                        }}
                                        className={styles.secondaryGoldBtn}
                                        style={{ padding: "0.35rem 0.7rem", fontSize: "0.7rem" }}
                                    >
                                        <span>{lang === "en" ? "Today" : "Hôm nay"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOpenDropdown(null)}
                                        className={styles.primaryGoldBtn}
                                        style={{ padding: "0.35rem 0.85rem", fontSize: "0.72rem" }}
                                    >
                                        <span>{lang === "en" ? "Apply" : "Áp dụng"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Custom Dropdown: All Roles */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(openDropdown === "ROLE" ? null : "ROLE")
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedRoleFilter !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {selectedRoleFilter === "ALL"
                                    ? lang === "en"
                                        ? `All Roles (${roles.length})`
                                        : `Mọi Vai Trò (${roles.length})`
                                    : selectedRoleFilter}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "ROLE" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedRoleFilter("ALL");
                                        setOpenDropdown(null);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        selectedRoleFilter === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>
                                        {lang === "en"
                                            ? `All Roles (${roles.length})`
                                            : `Mọi Vai Trò (${roles.length})`}
                                    </span>
                                    {selectedRoleFilter === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {roles.map((r) => (
                                    <button
                                        key={r.code}
                                        type="button"
                                        onClick={() => {
                                            setSelectedRoleFilter(r.title);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedRoleFilter === r.title
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{r.title}</span>
                                        {selectedRoleFilter === r.title && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. Custom Dropdown: All Maisons */}
                    {currentAdminScope === "PSA_GLOBAL" && (
                        <div className={styles.customDropdownWrap}>
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(
                                        openDropdown === "BRAND" ? null : "BRAND"
                                    )
                                }
                                className={`${styles.customDropdownTrigger} ${
                                    selectedBrandFilter !== "ALL"
                                        ? styles.customDropdownTriggerActive
                                        : ""
                                }`}
                            >
                                <span>
                                    {selectedBrandFilter === "ALL"
                                        ? lang === "en"
                                            ? `All Maisons (${partnerBrands.length - 1})`
                                            : `Mọi Thương Hiệu (${partnerBrands.length - 1})`
                                        : selectedBrandFilter}
                                </span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "BRAND" && (
                                <div
                                    className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedBrandFilter("ALL");
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedBrandFilter === "ALL"
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>
                                            {lang === "en"
                                                ? `All Maisons (${partnerBrands.length - 1})`
                                                : `Mọi Thương Hiệu (${partnerBrands.length - 1})`}
                                        </span>
                                        {selectedBrandFilter === "ALL" && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                    {partnerBrands.map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => {
                                                setSelectedBrandFilter(b);
                                                setOpenDropdown(null);
                                            }}
                                            className={`${styles.customDropdownItem} ${
                                                selectedBrandFilter === b
                                                    ? styles.customDropdownItemActive
                                                    : ""
                                            }`}
                                        >
                                            <span>{b}</span>
                                            {selectedBrandFilter === b && (
                                                <Check size={13} color="#D4AF37" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. Custom Dropdown: All Statuses */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "STATUS" ? null : "STATUS"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedStatusFilter !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {selectedStatusFilter === "ALL"
                                    ? lang === "en"
                                        ? "All Statuses"
                                        : "Mọi Trạng Thái"
                                    : selectedStatusFilter}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                            >
                                {(
                                    [
                                        "ALL",
                                        "ACTIVE",
                                        "INACTIVE",
                                        "LOCKED",
                                        "INVITED",
                                        "INACTIVE_LOCKED",
                                    ] as const
                                ).map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatusFilter(st);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedStatusFilter === st
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>
                                            {st === "ALL"
                                                ? lang === "en"
                                                    ? "All Statuses"
                                                    : "Mọi Trạng Thái"
                                                : st === "INACTIVE_LOCKED"
                                                    ? "Inactive + Locked"
                                                    : st}
                                        </span>
                                        {selectedStatusFilter === st && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Dòng dưới: Chọn nhanh Lịch thực tế + Phiên đang hoạt động + Nút Reset */}
                <div className={styles.filterRowBottom}>
                    <div className={styles.quickRangePillsGroup}>
                        {(
                            [
                                { id: "TODAY", label: lang === "en" ? "Today" : "Hôm Nay" },
                                { id: "THIS_WEEK", label: lang === "en" ? "This Week" : "Tuần Này" },
                                { id: "LAST_WEEK", label: lang === "en" ? "Last Week" : "Tuần Trước" },
                                { id: "THIS_MONTH", label: lang === "en" ? "This Month" : "Tháng Này" },
                                { id: "LAST_30_DAYS", label: lang === "en" ? "Last 30 Days" : "30 Ngày Qua" },
                            ] as const
                        ).map((preset) => {
                            const isTodayMatched =
                                preset.id === "TODAY" &&
                                startDate === todayYmd &&
                                endDate === todayYmd;
                            const isActive =
                                datePreset === preset.id || isTodayMatched;

                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handleApplyDatePreset(preset.id)}
                                    className={`${styles.quickRangePill} ${
                                        isActive ? styles.quickRangePillActive : ""
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <span
                            style={{
                                fontSize: "0.74rem",
                                color: "#34D399",
                                fontFamily: "Space Grotesk, monospace",
                                fontWeight: 700,
                            }}
                        >
                            ● Active Session: {activeSessionActorName}
                        </span>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className={styles.secondaryGoldBtn}
                        >
                            <RefreshCw size={13} />
                            <span>{lang === "en" ? "Reset" : "Đặt lại"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* NAVIGATION TABS PILLS */}
            <div className={styles.tabsContainer}>
                <button
                    type="button"
                    className={`${styles.tabButton} ${
                        activeTab === "users" ? styles.tabButtonActive : ""
                    }`}
                    onClick={() => setActiveTab("users")}
                >
                    <Users size={14} />
                    <span>
                        {lang === "en"
                            ? `Users Directory (${filteredUsers.length})`
                            : `Danh Bạ Nhân Sự (${filteredUsers.length})`}
                    </span>
                </button>
                <button
                    type="button"
                    className={`${styles.tabButton} ${
                        activeTab === "roles" ? styles.tabButtonActive : ""
                    }`}
                    onClick={() => setActiveTab("roles")}
                >
                    <Shield size={14} />
                    <span>
                        {lang === "en"
                            ? `Roles Catalog (${roles.length})`
                            : `Danh Mục Vai Trò (${roles.length})`}
                    </span>
                </button>
                <button
                    type="button"
                    className={`${styles.tabButton} ${
                        activeTab === "permissions" ? styles.tabButtonActive : ""
                    }`}
                    onClick={() => setActiveTab("permissions")}
                >
                    <Sliders size={14} />
                    <span>
                        {lang === "en"
                            ? "Permissions Matrix"
                            : "Ma Trận Phân Quyền"}
                    </span>
                </button>
                <button
                    type="button"
                    className={`${styles.tabButton} ${
                        activeTab === "audit" ? styles.tabButtonActive : ""
                    }`}
                    onClick={() => setActiveTab("audit")}
                >
                    <History size={14} />
                    <span>
                        {lang === "en"
                            ? `Access Requests & Audit Trail (${
                                accessRequests.filter(
                                    (r) => r.status === "PENDING"
                                ).length
                            } Pending)`
                            : `Yêu Cầu Cấp Quyền & Nhật Ký (${
                                accessRequests.filter(
                                    (r) => r.status === "PENDING"
                                ).length
                            } Chờ Duyệt)`}
                    </span>
                </button>
            </div>

            {/* TAB 1: USERS DIRECTORY */}
            {activeTab === "users" && (
                <>
                    {selectedUserIds.length > 0 && (
                        <div className={styles.bulkActionBar}>
                            <div style={{ fontSize: "0.84rem", color: "#F5E6AD" }}>
                                Selected{" "}
                                <strong style={{ color: "#D4AF37" }}>
                                    {selectedUserIds.length} account(s)
                                </strong>{" "}
                                for bulk execution:
                            </div>
                            <div style={{ display: "flex", gap: "0.55rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setBulkActionConfirm("ACTIVATE")}
                                    className={styles.secondaryGoldBtn}
                                    style={{
                                        borderColor: "#34D399",
                                        color: "#34D399",
                                    }}
                                >
                                    <span>Bulk Activate</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setBulkActionConfirm("DEACTIVATE")
                                    }
                                    className={styles.secondaryGoldBtn}
                                    style={{
                                        borderColor: "#F87171",
                                        color: "#F87171",
                                    }}
                                >
                                    <span>Bulk Deactivate</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedUserIds([])}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Clear Selection</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.tableCard}>
                        <div className={styles.tableScrollContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                <tr>
                                    <th style={{ width: "44px" }}>✓</th>
                                    <th>USER & SYSTEM ID</th>
                                    <th>ASSIGNED ROLE</th>
                                    <th>DEPARTMENT</th>
                                    <th>MAISON ACCESS SCOPE</th>
                                    <th style={{ textAlign: "center" }}>
                                        STATUS
                                    </th>
                                    <th>LAST ACTIVE</th>
                                    <th style={{ textAlign: "right" }}>
                                        ACTIONS
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => {
                                        const isChecked =
                                            selectedUserIds.includes(
                                                user.id
                                            );
                                        const isCurrentSession =
                                            user.email.toLowerCase() ===
                                            activeSessionUserEmail.toLowerCase();

                                        return (
                                            <tr
                                                key={user.id}
                                                className={styles.tableRow}
                                                style={{ cursor: "pointer" }}
                                                onClick={() =>
                                                    handleOpenUserModal(
                                                        user
                                                    )
                                                }
                                            >
                                                <td
                                                    className={
                                                        styles.tableCell
                                                    }
                                                    onClick={(e) =>
                                                        handleToggleSelectUser(
                                                            user.id,
                                                            e
                                                        )
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {}}
                                                        style={{
                                                            width: "15px",
                                                            height: "15px",
                                                            accentColor:
                                                                "#D4AF37",
                                                            cursor: "pointer",
                                                        }}
                                                    />
                                                </td>

                                                <td
                                                    className={
                                                        styles.tableCell
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 700,
                                                            color: "#FFF",
                                                            fontSize:
                                                                "0.88rem",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "0.45rem",
                                                        }}
                                                    >
                                                            <span>
                                                                {user.fullName}
                                                            </span>
                                                        {isCurrentSession && (
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "0.62rem",
                                                                    padding:
                                                                        "0.12rem 0.45rem",
                                                                    borderRadius:
                                                                        "99px",
                                                                    background:
                                                                        "rgba(52,211,153,0.16)",
                                                                    color: "#34D399",
                                                                    border: "1px solid rgba(52,211,153,0.4)",
                                                                    fontFamily:
                                                                        "Space Grotesk, monospace",
                                                                }}
                                                            >
                                                                    SIGNED IN
                                                                </span>
                                                        )}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                            fontSize:
                                                                "0.73rem",
                                                            color: "#F5E6AD",
                                                            marginTop:
                                                                "0.15rem",
                                                        }}
                                                    >
                                                        {user.uidCode} •{" "}
                                                        <span
                                                            style={{
                                                                color: "#94A3B8",
                                                            }}
                                                        >
                                                                {user.email}
                                                            </span>
                                                    </div>
                                                </td>

                                                <td
                                                    className={
                                                        styles.tableCell
                                                    }
                                                >
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "0.38rem",
                                                                color: "#F5E6AD",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            <Shield
                                                                size={13}
                                                                color="#D4AF37"
                                                            />
                                                            <span>
                                                                {user.role}
                                                            </span>
                                                        </span>
                                                </td>

                                                <td
                                                    className={
                                                        styles.tableCell
                                                    }
                                                    style={{
                                                        color: "#E2E8F0",
                                                    }}
                                                >
                                                    {user.department}
                                                </td>

                                                <td
                                                    className={
                                                        styles.tableCell
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            color: "#FFF",
                                                            fontWeight: 600,
                                                            fontSize:
                                                                "0.82rem",
                                                        }}
                                                    >
                                                        {user.brandAccess}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize:
                                                                "0.71rem",
                                                            color: "#94A3B8",
                                                        }}
                                                    >
                                                        {user.locationScope}
                                                    </div>
                                                </td>

                                                <td
                                                    className={
                                                        styles.tableCell
                                                    }
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {renderUserStatusBadge(
                                                        user.status
                                                    )}
                                                </td>

                                                <td
                                                    className={
                                                        styles.tableCell
                                                    }
                                                    style={{
                                                        fontSize: "0.78rem",
                                                        color: "#94A3B8",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {user.lastActive}
                                                </td>

                                                <td
                                                    className={
                                                        styles.tableCell
                                                    }
                                                    style={{
                                                        textAlign: "right",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            gap: "0.38rem",
                                                        }}
                                                    >
                                                        {user.status ===
                                                            "ACTIVE" &&
                                                            !isCurrentSession && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleImpersonateUserSession(
                                                                            user
                                                                        )
                                                                    }
                                                                    className={
                                                                        styles.actionButton
                                                                    }
                                                                    style={{
                                                                        padding:
                                                                            "0.38rem 0.65rem",
                                                                        fontSize:
                                                                            "0.7rem",
                                                                        color: "#34D399",
                                                                        borderColor:
                                                                            "rgba(52,211,153,0.4)",
                                                                    }}
                                                                    title="Switch active portal session to this user across all screens"
                                                                >
                                                                    <Zap
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                    <span>
                                                                            Switch
                                                                            Role
                                                                        </span>
                                                                </button>
                                                            )}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenUserModal(
                                                                    user
                                                                )
                                                            }
                                                            className={
                                                                styles.actionButton
                                                            }
                                                            style={{
                                                                padding:
                                                                    "0.38rem 0.6rem",
                                                            }}
                                                        >
                                                            <Edit3
                                                                size={14}
                                                                color="#D4AF37"
                                                            />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeactivateTargetUser(
                                                                    user
                                                                )
                                                            }
                                                            className={
                                                                styles.actionButton
                                                            }
                                                            style={{
                                                                padding:
                                                                    "0.38rem 0.6rem",
                                                            }}
                                                        >
                                                            {user.status ===
                                                            "ACTIVE" ? (
                                                                <Lock
                                                                    size={
                                                                        14
                                                                    }
                                                                    color="#F87171"
                                                                />
                                                            ) : (
                                                                <CheckCircle2
                                                                    size={
                                                                        14
                                                                    }
                                                                    color="#34D399"
                                                                />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            style={{
                                                textAlign: "center",
                                                color: "#94A3B8",
                                                padding: "3rem",
                                            }}
                                        >
                                            No user accounts found matching
                                            your current filter criteria.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* TAB 2: ROLES CATALOG */}
            {activeTab === "roles" && (
                <div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1.25rem",
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "1.25rem",
                                    color: "#FFF",
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                }}
                            >
                                Enterprise RBAC Roles Catalog
                            </h2>
                            <p
                                style={{
                                    margin: "0.2rem 0 0 0",
                                    fontSize: "0.8rem",
                                    color: "#94A3B8",
                                }}
                            >
                                Select a role card to inspect assigned personnel
                                and configure its granular module permissions.
                            </p>
                        </div>

                        {currentAdminScope === "PSA_GLOBAL" && (
                            <button
                                type="button"
                                onClick={() => setIsCreateRoleOpen(true)}
                                className={styles.primaryGoldBtn}
                            >
                                <span>Create Custom Role</span>
                            </button>
                        )}
                    </div>

                    <div className={styles.rolesGrid}>
                        {roles.map((r) => {
                            const assignedCount = users.filter(
                                (u) => u.role === r.title
                            ).length;
                            return (
                                <div
                                    key={r.code}
                                    onClick={() => {
                                        setSelectedRoleCode(r.code);
                                        setActiveTab("permissions");
                                    }}
                                    className={styles.roleCard}
                                >
                                    <div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "0.75rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    background:
                                                        "rgba(212,175,55,0.16)",
                                                    color: "#F5E6AD",
                                                    border: "1px solid rgba(212,175,55,0.4)",
                                                    padding: "0.2rem 0.6rem",
                                                    borderRadius: "6px",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.73rem",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {r.code}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    color: r.isSystemProtected
                                                        ? "#34D399"
                                                        : "#60A5FA",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {r.isSystemProtected
                                                    ? "SYSTEM PROTECTED"
                                                    : "CUSTOM ROLE"}
                                            </span>
                                        </div>
                                        <h3
                                            style={{
                                                margin: "0 0 0.45rem 0",
                                                fontSize: "1.12rem",
                                                color: "#FFF",
                                                fontFamily:
                                                    "Bodoni Moda, Georgia, serif",
                                            }}
                                        >
                                            {r.title}
                                        </h3>
                                        <p
                                            style={{
                                                margin: "0 0 1.2rem 0",
                                                fontSize: "0.8rem",
                                                color: "#94A3B8",
                                                lineHeight: 1.55,
                                            }}
                                        >
                                            {r.description}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingTop: "0.85rem",
                                            borderTop:
                                                "1px solid rgba(255,255,255,0.08)",
                                            fontSize: "0.78rem",
                                        }}
                                    >
                                        <span style={{ color: "#CBD5E1" }}>
                                            Assigned Accounts:{" "}
                                            <strong style={{ color: "#F5E6AD" }}>
                                                {assignedCount}
                                            </strong>
                                        </span>
                                        <span
                                            style={{
                                                color: "#D4AF37",
                                                fontWeight: 700,
                                            }}
                                        >
                                            Configure Matrix
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 3: PERMISSIONS MATRIX (DÙNG CUSTOM LUXURY DROPDOWN) */}
            {activeTab === "permissions" && (
                <div
                    className={styles.tableCard}
                    style={{ padding: "1.5rem" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "1rem",
                            marginBottom: "1.2rem",
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    fontSize: "1.25rem",
                                    color: "#FFFFFF",
                                    margin: 0,
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                }}
                            >
                                Granular Module Permission Matrix
                            </h2>
                            <p
                                style={{
                                    color: "#94A3B8",
                                    fontSize: "0.8rem",
                                    margin: "0.2rem 0 0 0",
                                }}
                            >
                                Toggle View, Create, Edit, Delete, or Approve
                                capabilities per module.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.65rem",
                            }}
                        >
                            {/* Custom Luxury Dropdown chọn Role cho Matrix */}
                            <div className={styles.customDropdownWrap}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenDropdown(
                                            openDropdown === "MATRIX_ROLE"
                                                ? null
                                                : "MATRIX_ROLE"
                                        )
                                    }
                                    className={styles.customDropdownTrigger}
                                >
                                    <span>
                                        Role: {selectedRoleObj.code} —{" "}
                                        {selectedRoleObj.title}
                                    </span>
                                    <ChevronDown size={13} color="#D4AF37" />
                                </button>
                                {openDropdown === "MATRIX_ROLE" && (
                                    <div
                                        className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                        style={{ minWidth: "260px" }}
                                    >
                                        {roles.map((r) => (
                                            <button
                                                key={r.code}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRoleCode(r.code);
                                                    setOpenDropdown(null);
                                                }}
                                                className={`${
                                                    styles.customDropdownItem
                                                } ${
                                                    selectedRoleCode === r.code
                                                        ? styles.customDropdownItemActive
                                                        : ""
                                                }`}
                                            >
                                                <span>
                                                    {r.code} — {r.title}
                                                </span>
                                                {selectedRoleCode ===
                                                    r.code && (
                                                        <Check
                                                            size={13}
                                                            color="#D4AF37"
                                                        />
                                                    )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleSavePermissionMatrix}
                                className={styles.primaryGoldBtn}
                            >
                                <span>Save Matrix Changes</span>
                            </button>
                        </div>
                    </div>

                    <div
                        style={{
                            padding: "0.75rem 1rem",
                            borderRadius: "10px",
                            background: "rgba(212,175,55,0.08)",
                            border: "1px dashed rgba(212,175,55,0.35)",
                            fontSize: "0.78rem",
                            color: "#F5E6AD",
                            marginBottom: "1.15rem",
                        }}
                    >
                        <strong>Multi-Account Impact Notice:</strong> Modifying
                        permissions for <u>{selectedRoleObj.title}</u>{" "}
                        immediately impacts{" "}
                        <strong>
                            {
                                users.filter(
                                    (u) => u.role === selectedRoleObj.title
                                ).length
                            }{" "}
                            assigned user account(s)
                        </strong>{" "}
                        and increments their JWT <code>token_version</code>.
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                textAlign: "left",
                                fontSize: "0.84rem",
                            }}
                        >
                            <thead>
                            <tr
                                style={{
                                    borderBottom:
                                        "1px solid rgba(212,175,55,0.3)",
                                    color: "#F5E6AD",
                                    fontFamily: "Space Grotesk, monospace",
                                    fontSize: "0.72rem",
                                }}
                            >
                                <th style={{ padding: "0.9rem" }}>
                                    PLATFORM FUNCTIONAL MODULE
                                </th>
                                <th
                                    style={{
                                        padding: "0.9rem",
                                        textAlign: "center",
                                    }}
                                >
                                    VIEW (READ)
                                </th>
                                <th
                                    style={{
                                        padding: "0.9rem",
                                        textAlign: "center",
                                    }}
                                >
                                    CREATE
                                </th>
                                <th
                                    style={{
                                        padding: "0.9rem",
                                        textAlign: "center",
                                    }}
                                >
                                    EDIT (UPDATE)
                                </th>
                                <th
                                    style={{
                                        padding: "0.9rem",
                                        textAlign: "center",
                                    }}
                                >
                                    DELETE
                                </th>
                                <th
                                    style={{
                                        padding: "0.9rem",
                                        textAlign: "center",
                                    }}
                                >
                                    APPROVE / OVERRIDE
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedRoleObj.permissions.map((perm) => (
                                <tr
                                    key={perm.module}
                                    style={{
                                        borderBottom:
                                            "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "0.9rem",
                                            color: "#FFF",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {perm.module}
                                    </td>
                                    {(
                                        [
                                            "view",
                                            "create",
                                            "edit",
                                            "delete",
                                            "approve",
                                        ] as const
                                    ).map((field) => (
                                        <td
                                            key={field}
                                            style={{
                                                padding: "0.9rem",
                                                textAlign: "center",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleToggleMatrixPermission(
                                                        perm.module,
                                                        field
                                                    )
                                                }
                                                className={`${
                                                    styles.matrixCheckBtn
                                                } ${
                                                    perm[field]
                                                        ? styles.matrixCheckBtnActive
                                                        : ""
                                                }`}
                                            >
                                                {perm[field] ? (
                                                    <Check size={14} />
                                                ) : (
                                                    <X size={12} />
                                                )}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: ACCESS REQUESTS & REAL-TIME AUDIT LOGS (ĐÃ THAY THẾ <SELECT> BẰNG CUSTOM LUXURY DROPDOWN) */}
            {activeTab === "audit" && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.35rem",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className={styles.tableCard}
                        style={{ padding: "1.4rem 1.5rem" }}
                    >
                        <h2
                            style={{
                                fontSize: "1.2rem",
                                color: "#FFFFFF",
                                margin: "0 0 0.25rem 0",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                            }}
                        >
                            Privilege & Scope Access Requests
                        </h2>
                        <p
                            style={{
                                color: "#94A3B8",
                                fontSize: "0.78rem",
                                margin: "0 0 1rem 0",
                            }}
                        >
                            Review and approve or reject permission escalation
                            requests. Users are prohibited from approving their
                            own requests.
                        </p>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.7rem",
                            }}
                        >
                            {accessRequests.map((req) => (
                                <div
                                    key={req.id}
                                    style={{
                                        background: "rgba(255,255,255,0.025)",
                                        border: "1px solid rgba(212,175,55,0.25)",
                                        borderRadius: "14px",
                                        padding: "0.95rem 1.2rem",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "1rem",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.6rem",
                                                marginBottom: "0.2rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    color: "#F5E6AD",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {req.id}
                                            </span>
                                            <strong style={{ color: "#FFF" }}>
                                                {req.requesterName} (
                                                {req.currentRole})
                                            </strong>
                                            <span
                                                style={{
                                                    fontSize: "0.73rem",
                                                    color: "#94A3B8",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                • {req.requestedAt}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.84rem",
                                                color: "#34D399",
                                                fontWeight: 700,
                                            }}
                                        >
                                            Requested:{" "}
                                            {req.requestedRoleOrScope} (Maison:{" "}
                                            {req.targetBrand})
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.78rem",
                                                color: "#CBD5E1",
                                                marginTop: "0.2rem",
                                            }}
                                        >
                                            Justification: “{req.reason}
                                            ”
                                        </div>
                                        {req.decidedBy && (
                                            <div
                                                style={{
                                                    fontSize: "0.73rem",
                                                    color: "#F5E6AD",
                                                    marginTop: "0.2rem",
                                                }}
                                            >
                                                Decision by {req.decidedBy} at{" "}
                                                {req.decidedAt}:{" "}
                                                {req.decisionReason}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        {req.status === "PENDING" ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDecideAccessRequest(
                                                            req,
                                                            "APPROVED"
                                                        )
                                                    }
                                                    className={
                                                        styles.secondaryGoldBtn
                                                    }
                                                    style={{
                                                        borderColor: "#34D399",
                                                        color: "#34D399",
                                                    }}
                                                >
                                                    <span>Approve</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDecideAccessRequest(
                                                            req,
                                                            "REJECTED"
                                                        )
                                                    }
                                                    className={
                                                        styles.secondaryGoldBtn
                                                    }
                                                    style={{
                                                        borderColor: "#F87171",
                                                        color: "#F87171",
                                                    }}
                                                >
                                                    <span>Reject</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span
                                                className={
                                                    req.status === "APPROVED"
                                                        ? styles.badgeActive
                                                        : styles.badgeLocked
                                                }
                                            >
                                                {req.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className={styles.tableCard}
                        style={{ padding: "1.4rem 1.5rem" }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "1rem",
                                marginBottom: "1rem",
                            }}
                        >
                            <div>
                                <h2
                                    style={{
                                        fontSize: "1.2rem",
                                        color: "#FFFFFF",
                                        margin: 0,
                                        fontFamily:
                                            "Bodoni Moda, Georgia, serif",
                                    }}
                                >
                                    Immutable Account & Cross-Module Audit
                                    Trail ({auditLogs.length} Events)
                                </h2>
                                <p
                                    style={{
                                        color: "#94A3B8",
                                        fontSize: "0.78rem",
                                        margin: "0.2rem 0 0 0",
                                    }}
                                >
                                    Synchronized in real time with actions
                                    performed across Products, Machines,
                                    Transactions, Inventory & Users.
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
                                <input
                                    type="text"
                                    placeholder="Filter logs by actor or action..."
                                    value={auditSearchUser}
                                    onChange={(e) =>
                                        setAuditSearchUser(e.target.value)
                                    }
                                    className={styles.searchInput}
                                    style={{
                                        padding: "0.58rem 0.95rem",
                                        width: "225px",
                                    }}
                                />

                                {/* Custom Luxury Dropdown cho All Outcomes (Không bao giờ hiện hộp xanh dương Windows) */}
                                <div className={styles.customDropdownWrap}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "AUDIT_OUTCOME"
                                                    ? null
                                                    : "AUDIT_OUTCOME"
                                            )
                                        }
                                        className={`${styles.customDropdownTrigger} ${
                                            auditStatusFilter !== "ALL"
                                                ? styles.customDropdownTriggerActive
                                                : ""
                                        }`}
                                    >
                                        <span>
                                            {auditStatusFilter === "ALL"
                                                ? "All Outcomes"
                                                : auditStatusFilter}
                                        </span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "AUDIT_OUTCOME" && (
                                        <div
                                            className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                            style={{ minWidth: "175px" }}
                                        >
                                            {(
                                                [
                                                    "ALL",
                                                    "SUCCESS",
                                                    "BLOCKED",
                                                    "PENDING",
                                                ] as const
                                            ).map((outSt) => (
                                                <button
                                                    key={outSt}
                                                    type="button"
                                                    onClick={() => {
                                                        setAuditStatusFilter(
                                                            outSt
                                                        );
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        auditStatusFilter ===
                                                        outSt
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>
                                                        {outSt === "ALL"
                                                            ? "All Outcomes"
                                                            : outSt}
                                                    </span>
                                                    {auditStatusFilter ===
                                                        outSt && (
                                                            <Check
                                                                size={13}
                                                                color="#D4AF37"
                                                            />
                                                        )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.6rem",
                                maxHeight: "360px",
                                overflowY: "auto",
                            }}
                        >
                            {auditLogs
                                .filter((log) => {
                                    const matchesDate =
                                        log.dateStr >= startDate &&
                                        log.dateStr <= endDate;
                                    const q = auditSearchUser
                                        .toLowerCase()
                                        .trim();
                                    const matchesQ =
                                        !q ||
                                        log.actor.toLowerCase().includes(q) ||
                                        log.action.toLowerCase().includes(q) ||
                                        log.target.toLowerCase().includes(q);
                                    const matchesSt =
                                        auditStatusFilter === "ALL" ||
                                        log.status === auditStatusFilter;
                                    return matchesDate && matchesQ && matchesSt;
                                })
                                .map((log, i) => (
                                    <div
                                        key={`${log.id}-${i}`}
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.02)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                            borderRadius: "12px",
                                            padding: "0.82rem 1.1rem",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.65rem",
                                                    marginBottom: "0.2rem",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: "#F5E6AD",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        fontSize: "0.76rem",
                                                    }}
                                                >
                                                    {log.timestamp}
                                                </span>
                                                <span
                                                    style={{
                                                        background:
                                                            "rgba(212,175,55,0.15)",
                                                        color: "#F5E6AD",
                                                        padding:
                                                            "0.12rem 0.5rem",
                                                        borderRadius: "6px",
                                                        fontSize: "0.68rem",
                                                        fontWeight: 700,
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    color: "#FFF",
                                                    fontSize: "0.84rem",
                                                }}
                                            >
                                                Actor:{" "}
                                                <strong>{log.actor}</strong> •
                                                Target:{" "}
                                                <strong>{log.target}</strong>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#94A3B8",
                                                    marginTop: "2px",
                                                }}
                                            >
                                                {log.detail}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div
                                                style={{
                                                    fontSize: "0.72rem",
                                                    color: "#94A3B8",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                IP: {log.ipAddress}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.7rem",
                                                    color:
                                                        log.status === "SUCCESS"
                                                            ? "#34D399"
                                                            : log.status ===
                                                            "BLOCKED"
                                                                ? "#F87171"
                                                                : "#FBBF24",
                                                    fontWeight: 700,
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    marginTop: "0.2rem",
                                                }}
                                            >
                                                {log.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CENTERED LUXURY MODAL: USER PROFILE, BRAND SCOPE & QUICK SECURITY ACTIONS */}
            {selectedUser && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => {
                        setOpenDropdown(null);
                        setSelectedUser(null);
                    }}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1.15rem",
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.08)",
                                paddingBottom: "0.85rem",
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        fontSize: "0.68rem",
                                        color: "#D4AF37",
                                        fontWeight: 700,
                                        letterSpacing: "0.14em",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    ENTERPRISE IDENTITY & TENANT SCOPE
                                </span>
                                <h2
                                    style={{
                                        fontSize: "1.35rem",
                                        color: "#FFFFFF",
                                        fontFamily:
                                            "Bodoni Moda, Georgia, serif",
                                        margin: "0.15rem 0 0 0",
                                        fontWeight: 600,
                                    }}
                                >
                                    {selectedUser.fullName} (
                                    {selectedUser.uidCode})
                                </h2>
                            </div>
                            <div style={{ display: "flex", gap: "0.45rem" }}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsEditingProfile(!isEditingProfile)
                                    }
                                    className={styles.secondaryGoldBtn}
                                >
                                    <Edit3 size={13} color="#D4AF37" />
                                    <span>
                                        {isEditingProfile
                                            ? "Cancel Edit"
                                            : "Edit Profile & Scope"}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {isEditingProfile ? (
                            <form
                                onSubmit={handleSaveUserProfileEdit}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.95rem",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#94A3B8",
                                            fontWeight: 700,
                                            marginBottom: "0.3rem",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        SYSTEM USER ID (IMMUTABLE READ-ONLY)
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value={`${selectedUser.uidCode} • ${selectedUser.email}`}
                                        className={styles.searchInput}
                                        style={{
                                            padding: "0.65rem 0.9rem",
                                            opacity: 0.6,
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "0.85rem",
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.7rem",
                                                color: "#CBD5E1",
                                                fontWeight: 700,
                                                marginBottom: "0.3rem",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            FULL NAME *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editName}
                                            onChange={(e) =>
                                                setEditName(e.target.value)
                                            }
                                            className={styles.searchInput}
                                            style={{
                                                padding: "0.65rem 0.9rem",
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.7rem",
                                                color: "#CBD5E1",
                                                fontWeight: 700,
                                                marginBottom: "0.3rem",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            PHONE NUMBER *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editPhone}
                                            onChange={(e) =>
                                                setEditPhone(e.target.value)
                                            }
                                            className={styles.searchInput}
                                            style={{
                                                padding: "0.65rem 0.9rem",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "0.85rem",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Custom Luxury Dropdown cho Assigned Role */}
                                    <div className={styles.customDropdownWrap}>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.7rem",
                                                color: "#CBD5E1",
                                                fontWeight: 700,
                                                marginBottom: "0.3rem",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            ASSIGNED ROLE
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenDropdown(
                                                    openDropdown === "EDIT_ROLE"
                                                        ? null
                                                        : "EDIT_ROLE"
                                                )
                                            }
                                            className={
                                                styles.customDropdownTrigger
                                            }
                                            style={{ width: "100%" }}
                                        >
                                            <span>{editRole}</span>
                                            <ChevronDown
                                                size={13}
                                                color="#D4AF37"
                                            />
                                        </button>
                                        {openDropdown === "EDIT_ROLE" && (
                                            <div
                                                className={
                                                    styles.customDropdownMenu
                                                }
                                                style={{ width: "100%" }}
                                            >
                                                {roles.map((r) => (
                                                    <button
                                                        key={r.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setEditRole(
                                                                r.title
                                                            );
                                                            setOpenDropdown(
                                                                null
                                                            );
                                                        }}
                                                        className={`${
                                                            styles.customDropdownItem
                                                        } ${
                                                            editRole === r.title
                                                                ? styles.customDropdownItemActive
                                                                : ""
                                                        }`}
                                                    >
                                                        <span>{r.title}</span>
                                                        {editRole ===
                                                            r.title && (
                                                                <Check
                                                                    size={13}
                                                                    color="#D4AF37"
                                                                />
                                                            )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Custom Luxury Dropdown cho Maison Access Scope */}
                                    <div className={styles.customDropdownWrap}>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.7rem",
                                                color: "#D4AF37",
                                                fontWeight: 700,
                                                marginBottom: "0.3rem",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            MAISON ACCESS SCOPE
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenDropdown(
                                                    openDropdown ===
                                                    "EDIT_BRAND"
                                                        ? null
                                                        : "EDIT_BRAND"
                                                )
                                            }
                                            className={
                                                styles.customDropdownTrigger
                                            }
                                            style={{ width: "100%" }}
                                        >
                                            <span>{editBrandAccess}</span>
                                            <ChevronDown
                                                size={13}
                                                color="#D4AF37"
                                            />
                                        </button>
                                        {openDropdown === "EDIT_BRAND" && (
                                            <div
                                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                                style={{ width: "100%" }}
                                            >
                                                {partnerBrands.map((b) => (
                                                    <button
                                                        key={b}
                                                        type="button"
                                                        onClick={() => {
                                                            setEditBrandAccess(
                                                                b
                                                            );
                                                            setOpenDropdown(
                                                                null
                                                            );
                                                        }}
                                                        className={`${
                                                            styles.customDropdownItem
                                                        } ${
                                                            editBrandAccess ===
                                                            b
                                                                ? styles.customDropdownItemActive
                                                                : ""
                                                        }`}
                                                    >
                                                        <span>{b}</span>
                                                        {editBrandAccess ===
                                                            b && (
                                                                <Check
                                                                    size={13}
                                                                    color="#D4AF37"
                                                                />
                                                            )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                    style={{ width: "100%" }}
                                >
                                    <span>Save Profile & Sync Scope</span>
                                </button>
                            </form>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.95rem",
                                    fontSize: "0.84rem",
                                }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.03)",
                                            padding: "0.85rem",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "0.68rem",
                                                color: "#94A3B8",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            EMAIL & TOKEN VERSION
                                        </div>
                                        <div
                                            style={{
                                                color: "#FFF",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                marginTop: "4px",
                                            }}
                                        >
                                            {selectedUser.email} (JWT v
                                            {selectedUser.tokenVersion})
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.03)",
                                            padding: "0.85rem",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "0.68rem",
                                                color: "#94A3B8",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            PHONE & STATUS
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginTop: "4px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: "#FFF",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                {selectedUser.phone}
                                            </span>
                                            {renderUserStatusBadge(
                                                selectedUser.status
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.03)",
                                            padding: "0.85rem",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "0.68rem",
                                                color: "#94A3B8",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            ASSIGNED ROLE & DEPARTMENT
                                        </div>
                                        <div
                                            style={{
                                                color: "#F5E6AD",
                                                fontWeight: 700,
                                                marginTop: "4px",
                                            }}
                                        >
                                            {selectedUser.role} •{" "}
                                            {selectedUser.department}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.03)",
                                            padding: "0.85rem",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(212,175,55,0.3)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "0.68rem",
                                                color: "#D4AF37",
                                                fontWeight: 700,
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            MAISON & STATION SCOPE
                                        </div>
                                        <div
                                            style={{
                                                color: "#FFF",
                                                fontWeight: 700,
                                                marginTop: "4px",
                                            }}
                                        >
                                            {selectedUser.brandAccess} (
                                            {selectedUser.locationScope})
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "0.65rem",
                                        marginTop: "0.25rem",
                                    }}
                                >
                                    {selectedUser.status === "ACTIVE" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleImpersonateUserSession(
                                                    selectedUser
                                                );
                                                setSelectedUser(null);
                                            }}
                                            className={styles.primaryGoldBtn}
                                        >
                                            <Zap size={14} />
                                            <span>
                                                Switch Active Session to This
                                                User
                                            </span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            showToast(
                                                `Dispatched time-limited BCrypt password reset link to ${selectedUser.email}!`
                                            );
                                        }}
                                        className={styles.secondaryGoldBtn}
                                    >
                                        <Key size={14} color="#D4AF37" />
                                        <span>Send Password Reset Link</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDeactivateTargetUser(
                                                selectedUser
                                            )
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            color:
                                                selectedUser.status === "ACTIVE"
                                                    ? "#F87171"
                                                    : "#34D399",
                                            borderColor:
                                                selectedUser.status === "ACTIVE"
                                                    ? "rgba(248,113,113,0.45)"
                                                    : "rgba(52,211,153,0.45)",
                                        }}
                                    >
                                        <Lock size={14} />
                                        <span>
                                            {selectedUser.status === "ACTIVE"
                                                ? "Deactivate Account"
                                                : "Activate Account"}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAuditSearchUser(
                                                selectedUser.fullName.split(
                                                    " "
                                                )[0]
                                            );
                                            setSelectedUser(null);
                                            setActiveTab("audit");
                                        }}
                                        className={styles.secondaryGoldBtn}
                                    >
                                        <History size={14} color="#60A5FA" />
                                        <span>Inspect User Audit Trail</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 1: INVITE USER (ĐÃ THAY THẾ 2 THẺ <SELECT> BẰNG CUSTOM LUXURY GLASS DROPDOWN) */}
            {isInviteModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => {
                        setOpenDropdown(null);
                        setIsInviteModalOpen(false);
                    }}
                >
                    <div
                        className={styles.modalContent}
                        style={{ overflow: "visible" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1.15rem",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "1.35rem",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    margin: 0,
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                }}
                            >
                                Invite New Enterprise User
                            </h2>
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {inviteError && (
                            <div
                                style={{
                                    padding: "0.75rem 1rem",
                                    borderRadius: "10px",
                                    background: "rgba(248,113,113,0.15)",
                                    border: "1px solid rgba(248,113,113,0.45)",
                                    color: "#F87171",
                                    fontSize: "0.8rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                {inviteError}
                            </div>
                        )}

                        <form onSubmit={handleInviteUserSubmit}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        FULL NAME *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={inviteName}
                                        onChange={(e) =>
                                            setInviteName(e.target.value)
                                        }
                                        placeholder="e.g., Vũ Hoàng Khang"
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        CORPORATE EMAIL ADDRESS *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) =>
                                            setInviteEmail(e.target.value)
                                        }
                                        placeholder="khang.vu@chanel.local"
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Custom Luxury Dropdown cho SELECT ROLE trong Modal Invite */}
                                <div className={styles.customDropdownWrap}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        SELECT ROLE *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "INVITE_ROLE"
                                                    ? null
                                                    : "INVITE_ROLE"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{ width: "100%", padding: "0.65rem 0.9rem" }}
                                    >
                                        <span>
                                            {inviteRole === "Viewer"
                                                ? "Viewer (Read-Only)"
                                                : inviteRole}
                                        </span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "INVITE_ROLE" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ width: "100%" }}
                                        >
                                            {INVITABLE_ROLE_OPTIONS.map((rOpt) => (
                                                <button
                                                    key={rOpt}
                                                    type="button"
                                                    onClick={() => {
                                                        setInviteRole(rOpt);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        inviteRole === rOpt
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>
                                                        {rOpt === "Viewer"
                                                            ? "Viewer (Read-Only)"
                                                            : rOpt}
                                                    </span>
                                                    {inviteRole === rOpt && (
                                                        <Check
                                                            size={13}
                                                            color="#D4AF37"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Custom Luxury Dropdown cho MAISON ACCESS SCOPE trong Modal Invite */}
                                <div className={styles.customDropdownWrap}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        MAISON ACCESS SCOPE *
                                    </label>
                                    <button
                                        type="button"
                                        disabled={
                                            currentAdminScope === "BA_CHANEL"
                                        }
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "INVITE_BRAND"
                                                    ? null
                                                    : "INVITE_BRAND"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{ width: "100%", padding: "0.65rem 0.9rem" }}
                                    >
                                        <span>
                                            {currentAdminScope === "BA_CHANEL"
                                                ? "Chanel"
                                                : inviteBrand}
                                        </span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "INVITE_BRAND" &&
                                        currentAdminScope !== "BA_CHANEL" && (
                                            <div
                                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                                style={{
                                                    width: "100%",
                                                    maxHeight: "220px",
                                                }}
                                            >
                                                {partnerBrands
                                                    .filter(
                                                        (b) =>
                                                            b !==
                                                            "All Brands (Global)"
                                                    )
                                                    .map((b) => (
                                                        <button
                                                            key={b}
                                                            type="button"
                                                            onClick={() => {
                                                                setInviteBrand(
                                                                    b
                                                                );
                                                                setOpenDropdown(
                                                                    null
                                                                );
                                                            }}
                                                            className={`${
                                                                styles.customDropdownItem
                                                            } ${
                                                                inviteBrand ===
                                                                b
                                                                    ? styles.customDropdownItemActive
                                                                    : ""
                                                            }`}
                                                        >
                                                            <span>{b}</span>
                                                            {inviteBrand ===
                                                                b && (
                                                                    <Check
                                                                        size={13}
                                                                        color="#D4AF37"
                                                                    />
                                                                )}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                </div>
                            </div>

                            <div style={{ marginBottom: "1.15rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: "#CBD5E1",
                                        marginBottom: "0.35rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    STATION / WAREHOUSE SCOPE RESTRICTION
                                </label>
                                <input
                                    type="text"
                                    value={inviteLocationScope}
                                    onChange={(e) =>
                                        setInviteLocationScope(e.target.value)
                                    }
                                    className={styles.searchInput}
                                    style={{ padding: "0.65rem 0.9rem" }}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "0.75rem",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <span>Send Invitation</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: DEACTIVATE / ACTIVATE USER CONFIRMATION */}
            {deactivateTargetUser && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setDeactivateTargetUser(null)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                color: "#FFF",
                                fontSize: "1.3rem",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                            }}
                        >
                            {deactivateTargetUser.status === "ACTIVE"
                                ? `Deactivate User Account (${deactivateTargetUser.uidCode})`
                                : `Activate User Account (${deactivateTargetUser.uidCode})`}
                        </h3>
                        <p
                            style={{
                                fontSize: "0.84rem",
                                color: "#CBD5E1",
                                lineHeight: 1.6,
                            }}
                        >
                            Changing account status for{" "}
                            <strong style={{ color: "#F5E6AD" }}>
                                {deactivateTargetUser.fullName}
                            </strong>{" "}
                            will immediately increment their JWT{" "}
                            <code>token_version</code> and revoke active
                            sessions.
                        </p>

                        <div style={{ marginBottom: "1.25rem" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#D4AF37",
                                    fontWeight: 700,
                                    marginBottom: "0.35rem",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                MANDATORY AUDIT REASON *
                            </label>
                            <input
                                type="text"
                                required
                                value={deactivateReasonInput}
                                onChange={(e) =>
                                    setDeactivateReasonInput(e.target.value)
                                }
                                className={styles.searchInput}
                                style={{ padding: "0.65rem 0.9rem" }}
                            />
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "0.75rem",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setDeactivateTargetUser(null)}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Cancel</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDeactivateOrActivate}
                                className={styles.primaryGoldBtn}
                            >
                                <span>Confirm Status Change</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: BULK OPERATION CONFIRMATION */}
            {bulkActionConfirm && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setBulkActionConfirm(null)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                color: "#FFF",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                                fontSize: "1.3rem",
                            }}
                        >
                            Confirm Bulk {bulkActionConfirm} Operation
                        </h3>
                        <p
                            style={{
                                color: "#CBD5E1",
                                fontSize: "0.85rem",
                                lineHeight: 1.6,
                            }}
                        >
                            Are you sure you want to{" "}
                            {bulkActionConfirm.toLowerCase()}{" "}
                            <strong style={{ color: "#F5E6AD" }}>
                                {selectedUserIds.length} selected user
                                account(s)
                            </strong>
                            ? All changes will be recorded in the security audit
                            trail.
                        </p>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "0.75rem",
                                marginTop: "1.25rem",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setBulkActionConfirm(null)}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Cancel</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteBulkOperation}
                                className={styles.primaryGoldBtn}
                            >
                                <span>Confirm Bulk Execution</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: CREATE CUSTOM ROLE */}
            {isCreateRoleOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsCreateRoleOpen(false)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                color: "#FFF",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                                fontSize: "1.3rem",
                            }}
                        >
                            Create Custom RBAC Role
                        </h3>
                        <form onSubmit={handleCreateCustomRole}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 2fr",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.3rem",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        ROLE CODE *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={5}
                                        value={newRoleCode}
                                        onChange={(e) =>
                                            setNewRoleCode(e.target.value)
                                        }
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.3rem",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        ROLE TITLE *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newRoleTitle}
                                        onChange={(e) =>
                                            setNewRoleTitle(e.target.value)
                                        }
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: "1.25rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        fontWeight: 700,
                                        marginBottom: "0.3rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    ROLE SCOPE DESCRIPTION *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    value={newRoleDesc}
                                    onChange={(e) =>
                                        setNewRoleDesc(e.target.value)
                                    }
                                    className={styles.searchInput}
                                    style={{
                                        padding: "0.65rem 0.9rem",
                                        resize: "none",
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "0.75rem",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsCreateRoleOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <span>Create Role</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "1.75rem",
                        right: "1.75rem",
                        background:
                            "linear-gradient(135deg, #151520 0%, #09090F 100%)",
                        border: "1px solid rgba(212, 175, 55, 0.6)",
                        padding: "0.95rem 1.35rem",
                        borderRadius: "14px",
                        color: "#F5E6AD",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.92)",
                        zIndex: 99999,
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                    }}
                >
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}