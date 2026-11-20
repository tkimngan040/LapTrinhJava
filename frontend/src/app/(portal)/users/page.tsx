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
    Users,
    Sliders,
    History,
    Clock,
    Globe,
} from "lucide-react";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";
import LuxurySelect from "@/components/ui/LuxurySelect";

type AccountStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "INVITED";

interface EnterpriseUserItem {
    id: number;
    uidCode: string;
    fullName: string;
    email: string;
    phone: string;
    department: string;
    roleCode: InternalRole;
    brandAccess: string;
    locationScope: string;
    status: AccountStatus;
    tokenVersion: number;
    lastActive: string;
    createdAt: string;
    deactivationReason?: string;
}

interface RoleDefinitionItem {
    code: string;
    titleVi: string;
    titleEn: string;
    descVi: string;
    descEn: string;
    isSystemProtected: boolean;
    permissions: {
        moduleKey: string;
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
    currentRoleCode: InternalRole;
    requestedScope: string;
    targetBrand: string;
    reason: string;
    requestedAt: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    decidedBy?: string;
    decidedAt?: string;
}

interface SecurityAuditLogItem {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    target: string;
    ipAddress: string;
    status: "SUCCESS" | "BLOCKED" | "PENDING";
    detail: string;
}

const PARTNER_BRANDS = ["All Brands", "Chanel", "Dior", "Creed", "Le Labo", "Maison Francis Kurkdjian", "Tom Ford", "Versace", "Yves Saint Laurent"];

const MODULE_LABELS: Record<string, { vi: string; en: string }> = {
    brands: { vi: "Thương hiệu", en: "Brands" },
    products: { vi: "Sản phẩm", en: "Products" },
    machines: { vi: "Đội máy & Khoang", en: "Machines & Slots" },
    inventory: { vi: "Tồn kho & Nạp bình", en: "Inventory & Refill" },
    transactions: { vi: "Giao dịch & Đối soát", en: "Transactions" },
    users: { vi: "Người dùng & Nhật ký", en: "Users & Audit" },
};

const INITIAL_ROLES: RoleDefinitionItem[] = [
    {
        code: "PSA", titleVi: "Quản trị viên nền tảng", titleEn: "Platform Super Admin", descVi: "Quản trị toàn nền tảng, thương hiệu, nhân sự và nhật ký bảo mật.", descEn: "Platform-wide governance, tenants, staff, and security audit.", isSystemProtected: true,
        permissions: [
            { moduleKey: "brands", view: true, create: true, edit: true, delete: true, approve: true },
            { moduleKey: "products", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "machines", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "inventory", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "transactions", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "users", view: true, create: true, edit: true, delete: true, approve: true },
        ],
    },
    {
        code: "BA", titleVi: "Quản trị viên thương hiệu", titleEn: "Brand Administrator", descVi: "Quản lý sản phẩm, giá xịt và nhân sự trong phạm vi thương hiệu.", descEn: "Manages catalog, pricing, and staff within a single brand tenant.", isSystemProtected: true,
        permissions: [
            { moduleKey: "brands", view: true, create: false, edit: true, delete: false, approve: false },
            { moduleKey: "products", view: true, create: true, edit: true, delete: false, approve: true },
            { moduleKey: "machines", view: true, create: false, edit: true, delete: false, approve: false },
            { moduleKey: "inventory", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "transactions", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "users", view: true, create: true, edit: true, delete: false, approve: true },
        ],
    },
    {
        code: "OM", titleVi: "Quản lý vận hành", titleEn: "Operations Manager", descVi: "Giám sát đội máy, cảnh báo, điều phối phiếu và đối soát giao dịch.", descEn: "Monitors fleet, alerts, dispatches tickets, and reconciles orders.", isSystemProtected: true,
        permissions: [
            { moduleKey: "brands", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "products", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "machines", view: true, create: true, edit: true, delete: false, approve: true },
            { moduleKey: "inventory", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "transactions", view: true, create: false, edit: true, delete: false, approve: true },
            { moduleKey: "users", view: false, create: false, edit: false, delete: false, approve: false },
        ],
    },
    {
        code: "TE", titleVi: "Kỹ thuật viên", titleEn: "Technician", descVi: "Thực thi bảo trì hiện trường, checklist và xịt chẩn đoán.", descEn: "Executes field maintenance, checklists, and diagnostic sprays.", isSystemProtected: true,
        permissions: [
            { moduleKey: "brands", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "products", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "machines", view: true, create: false, edit: true, delete: false, approve: false },
            { moduleKey: "inventory", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "transactions", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "users", view: false, create: false, edit: false, delete: false, approve: false },
        ],
    },
    {
        code: "IS", titleVi: "Nhân viên kho", titleEn: "Inventory Staff", descVi: "Nhập lô, xuất kho nạp bình, điều chỉnh tồn và đối soát cảm biến.", descEn: "Receives batches, refills cartridges, and reconciles stock.", isSystemProtected: true,
        permissions: [
            { moduleKey: "brands", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "products", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "machines", view: true, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "inventory", view: true, create: true, edit: true, delete: false, approve: false },
            { moduleKey: "transactions", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "users", view: false, create: false, edit: false, delete: false, approve: false },
        ],
    },
    {
        code: "VW", titleVi: "Người xem", titleEn: "Viewer", descVi: "Chỉ xem tổng quan và báo cáo trong phạm vi, không có quyền ghi.", descEn: "Read-only access to dashboards and reports.", isSystemProtected: true,
        permissions: [
            { moduleKey: "brands", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "products", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "machines", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "inventory", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "transactions", view: false, create: false, edit: false, delete: false, approve: false },
            { moduleKey: "users", view: false, create: false, edit: false, delete: false, approve: false },
        ],
    },
];

const INITIAL_USERS: EnterpriseUserItem[] = [
    { id: 1, uidCode: "UID-USR-001", fullName: "Lê Hoàng Bách", email: "admin@scentstation.local", phone: "+84 908 458 999", department: "Executive Governance", roleCode: "PSA", brandAccess: "All Brands", locationScope: "Global", status: "ACTIVE", tokenVersion: 4, lastActive: "2m", createdAt: "2026-10-20" },
    { id: 2, uidCode: "UID-USR-003", fullName: "Nguyễn Hoàng Nam", email: "nam.nguyen@scentstation.local", phone: "+84 912 345 678", department: "Hardware & IoT", roleCode: "TE", brandAccess: "All Brands", locationScope: "HCMC & Hanoi", status: "ACTIVE", tokenVersion: 1, lastActive: "8m", createdAt: "2026-10-25" },
    { id: 3, uidCode: "UID-USR-004", fullName: "Lê Minh Khôi", email: "khoi.le@scentstation.local", phone: "+84 923 456 789", department: "Warehouse Logistics", roleCode: "IS", brandAccess: "Chanel", locationScope: "WH-SGN-CENTRAL", status: "ACTIVE", tokenVersion: 1, lastActive: "15m", createdAt: "2026-10-28" },
    { id: 4, uidCode: "UID-USR-005", fullName: "Phạm Bảo Ngọc", email: "ngoc.pham@scentstation.local", phone: "+84 934 567 890", department: "Field Operations", roleCode: "OM", brandAccess: "Chanel", locationScope: "Takashimaya & Vincom", status: "ACTIVE", tokenVersion: 2, lastActive: "25m", createdAt: "2026-11-01" },
    { id: 5, uidCode: "UID-USR-006", fullName: "Nguyễn Văn An", email: "an.nguyen@chanel.local", phone: "+84 945 678 901", department: "Brand Retail", roleCode: "BA", brandAccess: "Chanel", locationScope: "Chanel Kiosks", status: "ACTIVE", tokenVersion: 1, lastActive: "35m", createdAt: "2026-11-03" },
    { id: 6, uidCode: "UID-USR-007", fullName: "Lê Thị Hồng", email: "hong.le@dior.local", phone: "+84 956 789 012", department: "Store Operations", roleCode: "BA", brandAccess: "Dior", locationScope: "KIOSK-HN-01", status: "ACTIVE", tokenVersion: 1, lastActive: "1h", createdAt: "2026-11-05" },
    { id: 7, uidCode: "UID-USR-008", fullName: "Trần Minh Quân", email: "quan.tran@creed.local", phone: "+84 967 890 123", department: "Hardware & IoT", roleCode: "TE", brandAccess: "Creed", locationScope: "demo-device", status: "LOCKED", tokenVersion: 3, lastActive: "2d", createdAt: "2026-11-08", deactivationReason: "5 failed login attempts" },
    { id: 8, uidCode: "UID-USR-010", fullName: "Hoàng Gia Hân", email: "han.hoang@mfk.local", phone: "+84 989 012 345", department: "Marketing", roleCode: "VW", brandAccess: "Maison Francis Kurkdjian", locationScope: "Read-Only", status: "INACTIVE", tokenVersion: 2, lastActive: "1w", createdAt: "2026-11-10" },
];

const INITIAL_REQUESTS: AccessRequestItem[] = [
    { id: "REQ-2026-01", requesterId: 8, requesterName: "Hoàng Gia Hân", requesterEmail: "han.hoang@mfk.local", currentRoleCode: "VW", requestedScope: "Operations Manager", targetBrand: "Maison Francis Kurkdjian", reason: "Q4 campaign reconciliation support.", requestedAt: "2026-11-20 10:20", status: "PENDING" },
    { id: "REQ-2026-02", requesterId: 5, requesterName: "Nguyễn Văn An", requesterEmail: "an.nguyen@chanel.local", currentRoleCode: "BA", requestedScope: "Add KIOSK-HN-01 Scope", targetBrand: "Chanel", reason: "Holiday campaign at Lotte West Lake.", requestedAt: "2026-11-20 09:05", status: "PENDING" },
];

const INITIAL_AUDIT: SecurityAuditLogItem[] = [
    { id: "AUD-901", timestamp: "2026-11-20 14:45:10", actor: "Lê Hoàng Bách (PSA)", action: "RBAC_SCOPE_VERIFIED", target: "Tenant Isolation", ipAddress: "115.78.209.14", status: "SUCCESS", detail: "Verified multi-tenant boundary." },
    { id: "AUD-902", timestamp: "2026-11-20 13:20:05", actor: "Nguyễn Văn An (BA)", action: "PRICE_UPDATE", target: "Bleu de Chanel", ipAddress: "171.244.18.92", status: "SUCCESS", detail: "Updated spray price to 15,000 VND." },
    { id: "AUD-905", timestamp: "2026-11-19 22:14:00", actor: "Security Watchdog", action: "CROSS_TENANT_BLOCKED", target: "UID-USR-008 → Dior", ipAddress: "45.33.32.156", status: "BLOCKED", detail: "Denied 403 Forbidden cross-tenant request." },
];

const USERS_STORAGE_KEY = "scentstation_commercial_users_v3";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

function formatNowStr(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export default function UsersManagementPage(): React.ReactElement {
    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [activeSessionEmail, setActiveSessionEmail] = useState<string>("admin@scentstation.local");
    const [activeSessionActorName, setActiveSessionActorName] = useState<string>("Lê Hoàng Bách (PSA)");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [users, setUsers] = useState<EnterpriseUserItem[]>(INITIAL_USERS);
    const [roles, setRoles] = useState<RoleDefinitionItem[]>(INITIAL_ROLES);
    const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>(INITIAL_REQUESTS);
    const [auditLogs, setAuditLogs] = useState<SecurityAuditLogItem[]>(INITIAL_AUDIT);

    const [activeTab, setActiveTab] = useState<"users" | "roles" | "permissions" | "audit">("users");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("ALL");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [bulkActionConfirm, setBulkActionConfirm] = useState<"ACTIVATE" | "DEACTIVATE" | null>(null);
    const [selectedRoleCode, setSelectedRoleCode] = useState<string>("BA");

    const [selectedUser, setSelectedUser] = useState<EnterpriseUserItem | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
    const [editName, setEditName] = useState<string>("");
    const [editPhone, setEditPhone] = useState<string>("");
    const [editRoleCode, setEditRoleCode] = useState<InternalRole>("OM");
    const [editBrandAccess, setEditBrandAccess] = useState<string>("Chanel");

    const [deactivateTargetUser, setDeactivateTargetUser] = useState<EnterpriseUserItem | null>(null);
    const [deactivateReasonInput, setDeactivateReasonInput] = useState<string>("");

    const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
    const [inviteName, setInviteName] = useState<string>("");
    const [inviteEmail, setInviteEmail] = useState<string>("");
    const [inviteRoleCode, setInviteRoleCode] = useState<InternalRole>("OM");
    const [inviteBrand, setInviteBrand] = useState<string>("Chanel");
    const [inviteError, setInviteError] = useState<string>("");

    const [isCreateRoleOpen, setIsCreateRoleOpen] = useState<boolean>(false);
    const [newRoleCode, setNewRoleCode] = useState<string>("AUD");
    const [newRoleTitle, setNewRoleTitle] = useState<string>("");
    const [newRoleDesc, setNewRoleDesc] = useState<string>("");

    const [auditSearchUser, setAuditSearchUser] = useState<string>("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const isPSA = currentRole === "PSA";
    const canManageUsers = roleConfig.canManageUsers;

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    }, []);

    const handleToggleLanguage = useCallback(() => {
        const nextLang = lang === "en" ? "vi" : "en";
        setLang(nextLang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
            window.dispatchEvent(new Event("scentstation-sync"));
        } catch {
            // Safe fallback
        }
    }, [lang]);

    const formatStatus = (st: AccountStatus) => {
        const map: Record<AccountStatus, { en: string; vi: string }> = {
            ACTIVE: { en: "Active", vi: "Hoạt động" },
            INACTIVE: { en: "Inactive", vi: "Ngưng hoạt động" },
            LOCKED: { en: "Locked", vi: "Đã khóa" },
            INVITED: { en: "Invited", vi: "Đã mời" },
        };
        return map[st]?.[lang] || st;
    };

    const formatRoleTitle = (code: InternalRole) =>
        lang === "en" ? ROLE_PERMISSIONS[code]?.labelEn || code : ROLE_PERMISSIONS[code]?.labelVi || code;

    const loadUsersData = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            const rawSession = sessionStorage.getItem("scentstation-user") || localStorage.getItem("scentstation-user");
            if (rawSession) {
                const parsed = JSON.parse(rawSession);
                const resolvedRole = normalizeRole(parsed.roleCode || parsed.role || parsed.roles?.[0]);
                setCurrentRole(resolvedRole);
                setActiveSessionEmail(parsed.email || "admin@scentstation.local");
                setActiveSessionActorName(parsed.fullName || parsed.name || ROLE_PERMISSIONS[resolvedRole].label);
                const scope = parsed.brandScope || parsed.brand || null;
                if (resolvedRole === "BA" && scope) {
                    setLockedBrandScope(scope);
                    setSelectedBrandFilter(scope);
                    setInviteBrand(scope);
                } else {
                    setLockedBrandScope(null);
                }
            }

            const rawSaved = localStorage.getItem(USERS_STORAGE_KEY);
            if (rawSaved) {
                const parsed = JSON.parse(rawSaved);
                if (Array.isArray(parsed.users) && parsed.users.length > 0) setUsers(parsed.users);
                if (
                    Array.isArray(parsed.roles) &&
                    parsed.roles.length >= 6 &&
                    parsed.roles.every((r: any) => r.titleVi && r.titleEn && Array.isArray(r.permissions) && r.permissions.every((p: any) => Boolean(p.moduleKey)))
                ) {
                    setRoles(parsed.roles);
                } else {
                    setRoles(INITIAL_ROLES);
                }
                if (Array.isArray(parsed.accessRequests) && parsed.accessRequests.length > 0) setAccessRequests(parsed.accessRequests);
            }
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadUsersData();
        const handleSync = () => loadUsersData();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadUsersData]);

    const persistAll = useCallback(
        (nextUsers: EnterpriseUserItem[], nextRoles: RoleDefinitionItem[], nextReqs: AccessRequestItem[], action?: string, target?: string, detail?: string) => {
            setUsers(nextUsers);
            setRoles(nextRoles);
            setAccessRequests(nextReqs);
            try {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify({ users: nextUsers, roles: nextRoles, accessRequests: nextReqs }));
                if (action && target) {
                    const logItem: SecurityAuditLogItem = {
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: formatNowStr(),
                        actor: activeSessionActorName,
                        action,
                        target,
                        ipAddress: "127.0.0.1",
                        status: "SUCCESS",
                        detail: detail || action,
                    };
                    setAuditLogs((prev) => [logItem, ...prev]);
                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const list = rawAudit ? JSON.parse(rawAudit) : [];
                    list.unshift({ ...logItem, entityType: "USERS_RBAC", entityId: target });
                    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(list.slice(0, 250)));
                }
                window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        [activeSessionActorName]
    );

    const tenantScopedUsers = useMemo(() => {
        if (!lockedBrandScope) return users;
        return users.filter((u) => u.brandAccess.toLowerCase() === lockedBrandScope.toLowerCase());
    }, [users, lockedBrandScope]);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const effectiveBrand = lockedBrandScope || selectedBrandFilter;
        return tenantScopedUsers.filter((u) => {
            const matchQ = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.uidCode.toLowerCase().includes(q);
            const matchRole = selectedRoleFilter === "ALL" || u.roleCode === selectedRoleFilter;
            const matchBrand = effectiveBrand === "ALL" || u.brandAccess === effectiveBrand;
            const matchSt =
                selectedStatusFilter === "ALL" ||
                (selectedStatusFilter === "INACTIVE_LOCKED" ? u.status === "INACTIVE" || u.status === "LOCKED" : u.status === selectedStatusFilter);
            return matchQ && matchRole && matchBrand && matchSt;
        });
    }, [tenantScopedUsers, searchQuery, selectedRoleFilter, lockedBrandScope, selectedBrandFilter, selectedStatusFilter]);

    const summaryMetrics = useMemo(() => ({
        total: tenantScopedUsers.length,
        active: tenantScopedUsers.filter((u) => u.status === "ACTIVE").length,
        inactiveLocked: tenantScopedUsers.filter((u) => u.status === "INACTIVE" || u.status === "LOCKED").length,
        rolesCount: roles.length,
    }), [tenantScopedUsers, roles]);

    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManageUsers) return;
        setInviteError("");
        const cleanEmail = inviteEmail.trim().toLowerCase();
        if (!inviteName.trim() || !cleanEmail.includes("@")) {
            setInviteError(lang === "en" ? "Valid name and email are required." : "Vui lòng nhập họ tên và email hợp lệ.");
            return;
        }
        if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
            setInviteError(lang === "en" ? "Email already exists." : "Email này đã tồn tại trên hệ thống.");
            return;
        }
        if (!isPSA && (inviteRoleCode === "PSA" || inviteRoleCode === "BA")) {
            setInviteError(lang === "en" ? "Brand Admins cannot assign PSA or BA roles." : "Quản trị viên thương hiệu không được cấp quyền PSA hoặc BA.");
            return;
        }
        const nextId = users.length + 1;
        const newUser: EnterpriseUserItem = {
            id: nextId,
            uidCode: `UID-USR-${String(nextId).padStart(3, "0")}`,
            fullName: inviteName.trim(),
            email: cleanEmail,
            phone: "+84 900 000 000",
            department: "Operations",
            roleCode: inviteRoleCode,
            brandAccess: lockedBrandScope || inviteBrand,
            locationScope: "Assigned Stations",
            status: "INVITED",
            tokenVersion: 1,
            lastActive: "-",
            createdAt: new Date().toISOString().slice(0, 10),
        };
        persistAll([newUser, ...users], roles, accessRequests, "INVITE_USER", cleanEmail, `${inviteRoleCode} • ${newUser.brandAccess}`);
        setIsInviteModalOpen(false);
        setInviteName("");
        setInviteEmail("");
        showToast(lang === "en" ? `Invited ${cleanEmail}.` : `Đã gửi lời mời tới ${cleanEmail}.`);
    };

    const handleSaveUserEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !canManageUsers) return;
        const updated: EnterpriseUserItem = {
            ...selectedUser,
            fullName: editName.trim() || selectedUser.fullName,
            phone: editPhone.trim() || selectedUser.phone,
            roleCode: isPSA ? editRoleCode : selectedUser.roleCode,
            brandAccess: lockedBrandScope || editBrandAccess,
            tokenVersion: selectedUser.tokenVersion + 1,
        };
        persistAll(users.map((u) => (u.id === selectedUser.id ? updated : u)), roles, accessRequests, "USER_UPDATED", updated.uidCode, `${updated.roleCode} • v${updated.tokenVersion}`);
        setSelectedUser(updated);
        setIsEditingProfile(false);
        showToast(lang === "en" ? "Profile updated." : "Đã cập nhật hồ sơ nhân sự.");
    };

    const handleConfirmToggleStatus = () => {
        if (!deactivateTargetUser || !canManageUsers) return;
        const nextStatus: AccountStatus = deactivateTargetUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        const updated: EnterpriseUserItem = {
            ...deactivateTargetUser,
            status: nextStatus,
            tokenVersion: deactivateTargetUser.tokenVersion + 1,
            deactivationReason: nextStatus === "INACTIVE" ? deactivateReasonInput.trim() : undefined,
        };
        persistAll(users.map((u) => (u.id === deactivateTargetUser.id ? updated : u)), roles, accessRequests, `USER_${nextStatus}`, updated.uidCode, deactivateReasonInput || nextStatus);
        if (selectedUser?.id === deactivateTargetUser.id) setSelectedUser(updated);
        setDeactivateTargetUser(null);
        setDeactivateReasonInput("");
        showToast(lang === "en" ? `Account ${updated.uidCode} is now ${formatStatus(nextStatus)}.` : `Tài khoản ${updated.uidCode} đã chuyển sang ${formatStatus(nextStatus)}.`);
    };

    const handleBulkExecute = () => {
        if (!bulkActionConfirm || !canManageUsers) return;
        const nextSt: AccountStatus = bulkActionConfirm === "ACTIVATE" ? "ACTIVE" : "INACTIVE";
        const nextUsers = users.map((u) => (selectedUserIds.includes(u.id) ? { ...u, status: nextSt, tokenVersion: u.tokenVersion + 1 } : u));
        persistAll(nextUsers, roles, accessRequests, `BULK_${bulkActionConfirm}`, `${selectedUserIds.length} accounts`, `Status → ${nextSt}`);
        setSelectedUserIds([]);
        setBulkActionConfirm(null);
        showToast(lang === "en" ? "Bulk update completed." : "Đã cập nhật hàng loạt thành công.");
    };

    const handleToggleMatrix = (moduleKey: string, field: "view" | "create" | "edit" | "delete" | "approve") => {
        if (!isPSA || selectedRoleCode === "PSA") return;
        setRoles((prev) =>
            prev.map((r) =>
                r.code === selectedRoleCode
                    ? { ...r, permissions: r.permissions.map((p) => (p.moduleKey === moduleKey ? { ...p, [field]: !p[field] } : p)) }
                    : r
            )
        );
    };

    const handleDecideRequest = (req: AccessRequestItem, decision: "APPROVED" | "REJECTED") => {
        if (!canManageUsers) return;
        if (req.requesterEmail.toLowerCase() === activeSessionEmail.toLowerCase()) {
            showToast(lang === "en" ? "Self-approval is blocked." : "Không được tự phê duyệt yêu cầu của chính mình.");
            return;
        }
        const nextReqs = accessRequests.map((r) => (r.id === req.id ? { ...r, status: decision, decidedBy: activeSessionActorName, decidedAt: formatNowStr() } : r));
        persistAll(users, roles, nextReqs, `REQUEST_${decision}`, req.id, req.requestedScope);
        showToast(lang === "en" ? `Request ${req.id} ${decision.toLowerCase()}.` : `Đã ${decision === "APPROVED" ? "phê duyệt" : "từ chối"} yêu cầu ${req.id}.`);
    };

    const selectedRoleObj = roles.find((r) => r.code === selectedRoleCode) || roles[0];

    const renderStatusBadge = (st: AccountStatus) => {
        if (st === "ACTIVE") return <span className={styles.badgeActive}><CheckCircle2 size={12} /> {formatStatus(st)}</span>;
        if (st === "LOCKED") return <span className={styles.badgeLocked}><Lock size={12} /> {formatStatus(st)}</span>;
        if (st === "INVITED") return <span className={styles.badgeInvited}><Clock size={12} /> {formatStatus(st)}</span>;
        return <span className={styles.badgeInactive}><AlertCircle size={12} /> {formatStatus(st)}</span>;
    };

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Users & Access Control" : "Người dùng & Phân quyền"}</h1>
                        <div className={styles.scopeBadge}>
                            <span>{lang === "en" ? roleConfig.labelEn : roleConfig.labelVi}</span>
                            {lockedBrandScope && <span>• {lockedBrandScope}</span>}
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button type="button" onClick={handleToggleLanguage} className={styles.secondaryGoldBtn}>
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        {canManageUsers && (
                            <button type="button" onClick={() => { setInviteError(""); setIsInviteModalOpen(true); }} className={styles.primaryGoldBtn}>
                                <UserPlus size={15} />
                                <span>{lang === "en" ? "Invite User" : "Mời nhân sự"}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 4 KPI */}
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${activeTab === "users" && selectedStatusFilter === "ALL" ? styles.statCardActive : ""}`} onClick={() => { setActiveTab("users"); setSelectedStatusFilter("ALL"); }}>
                        <div className={styles.statLabel}>{lang === "en" ? "Total Accounts" : "Tổng tài khoản"}</div>
                        <div className={styles.statValue}>{summaryMetrics.total}</div>
                    </div>
                    <div className={`${styles.statCard} ${activeTab === "users" && selectedStatusFilter === "ACTIVE" ? styles.statCardActive : ""}`} onClick={() => { setActiveTab("users"); setSelectedStatusFilter("ACTIVE"); }}>
                        <div className={styles.statLabel}>{lang === "en" ? "Active" : "Đang hoạt động"}</div>
                        <div className={styles.statValue} style={{ color: "#34D399" }}>{summaryMetrics.active}</div>
                    </div>
                    <div className={`${styles.statCard} ${activeTab === "users" && selectedStatusFilter === "INACTIVE_LOCKED" ? styles.statCardActive : ""}`} onClick={() => { setActiveTab("users"); setSelectedStatusFilter("INACTIVE_LOCKED"); }}>
                        <div className={styles.statLabel}>{lang === "en" ? "Inactive / Locked" : "Khóa / Ngưng"}</div>
                        <div className={styles.statValue} style={{ color: "#F87171" }}>{summaryMetrics.inactiveLocked}</div>
                    </div>
                    <div className={`${styles.statCard} ${activeTab === "roles" ? styles.statCardActive : ""}`} onClick={() => setActiveTab("roles")}>
                        <div className={styles.statLabel}>{lang === "en" ? "Roles" : "Vai trò"}</div>
                        <div className={styles.statValue} style={{ color: "#F5E6AD" }}>{summaryMetrics.rolesCount}</div>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className={styles.tabsContainer}>
                <button type="button" className={`${styles.tabButton} ${activeTab === "users" ? styles.tabButtonActive : ""}`} onClick={() => setActiveTab("users")}>
                    <Users size={14} /><span>{lang === "en" ? `Users (${filteredUsers.length})` : `Nhân sự (${filteredUsers.length})`}</span>
                </button>
                <button type="button" className={`${styles.tabButton} ${activeTab === "roles" ? styles.tabButtonActive : ""}`} onClick={() => setActiveTab("roles")}>
                    <Shield size={14} /><span>{lang === "en" ? `Roles (${roles.length})` : `Vai trò (${roles.length})`}</span>
                </button>
                <button type="button" className={`${styles.tabButton} ${activeTab === "permissions" ? styles.tabButtonActive : ""}`} onClick={() => setActiveTab("permissions")}>
                    <Sliders size={14} /><span>{lang === "en" ? "Permission Matrix" : "Ma trận quyền"}</span>
                </button>
                <button type="button" className={`${styles.tabButton} ${activeTab === "audit" ? styles.tabButtonActive : ""}`} onClick={() => setActiveTab("audit")}>
                    <History size={14} /><span>{lang === "en" ? `Requests & Audit (${accessRequests.filter((r) => r.status === "PENDING").length})` : `Yêu cầu & Nhật ký (${accessRequests.filter((r) => r.status === "PENDING").length})`}</span>
                </button>
            </div>

            {/* TAB 1: DANH BẠ NHÂN SỰ */}
            {activeTab === "users" && (
                <>
                    <div className={styles.filterBar}>
                        <div className={styles.searchWrapper}>
                            <Search className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder={lang === "en" ? "Search name, email, UID..." : "Tìm họ tên, email, mã UID..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchQuery && <button type="button" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.6rem", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}><X size={14} /></button>}
                        </div>

                        <LuxurySelect
                            value={selectedRoleFilter}
                            onChange={setSelectedRoleFilter}
                            minWidth="175px"
                            options={[
                                { value: "ALL", label: lang === "en" ? "All Roles" : "Mọi vai trò" },
                                ...(["PSA", "BA", "OM", "TE", "IS", "VW"] as const).map((rc) => ({ value: rc, label: formatRoleTitle(rc) })),
                            ]}
                        />

                        {!lockedBrandScope && (
                            <LuxurySelect
                                value={selectedBrandFilter}
                                onChange={setSelectedBrandFilter}
                                minWidth="175px"
                                options={[
                                    { value: "ALL", label: lang === "en" ? "All Brands" : "Tất cả thương hiệu" },
                                    ...PARTNER_BRANDS.map((b) => ({ value: b, label: b })),
                                ]}
                            />
                        )}

                        <LuxurySelect
                            value={selectedStatusFilter}
                            onChange={setSelectedStatusFilter}
                            minWidth="165px"
                            options={[
                                { value: "ALL", label: lang === "en" ? "All Status" : "Mọi trạng thái" },
                                { value: "ACTIVE", label: formatStatus("ACTIVE") },
                                { value: "INACTIVE", label: formatStatus("INACTIVE") },
                                { value: "LOCKED", label: formatStatus("LOCKED") },
                                { value: "INVITED", label: formatStatus("INVITED") },
                            ]}
                        />

                        {(searchQuery || selectedRoleFilter !== "ALL" || (!lockedBrandScope && selectedBrandFilter !== "ALL") || selectedStatusFilter !== "ALL") && (
                            <button type="button" onClick={() => { setSearchQuery(""); setSelectedRoleFilter("ALL"); if (!lockedBrandScope) setSelectedBrandFilter("ALL"); setSelectedStatusFilter("ALL"); }} className={styles.secondaryGoldBtn}>
                                <RefreshCw size={13} /><span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                            </button>
                        )}
                    </div>

                    {selectedUserIds.length > 0 && canManageUsers && (
                        <div className={styles.bulkActionBar}>
                            <span>{lang === "en" ? `Selected ${selectedUserIds.length} account(s)` : `Đã chọn ${selectedUserIds.length} tài khoản`}</span>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button type="button" onClick={() => setBulkActionConfirm("ACTIVATE")} className={styles.secondaryGoldBtn} style={{ color: "#34D399" }}>{lang === "en" ? "Bulk Activate" : "Kích hoạt hàng loạt"}</button>
                                <button type="button" onClick={() => setBulkActionConfirm("DEACTIVATE")} className={styles.secondaryGoldBtn} style={{ color: "#F87171" }}>{lang === "en" ? "Bulk Deactivate" : "Khóa hàng loạt"}</button>
                                <button type="button" onClick={() => setSelectedUserIds([])} className={styles.secondaryGoldBtn}>{lang === "en" ? "Clear" : "Bỏ chọn"}</button>
                            </div>
                        </div>
                    )}

                    <div className={styles.tableCard}>
                        <div className={styles.tableScrollContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                <tr>
                                    {canManageUsers && <th style={{ width: "36px" }}>✓</th>}
                                    <th>{lang === "en" ? "User" : "Nhân sự"}</th>
                                    <th>{lang === "en" ? "Role" : "Vai trò"}</th>
                                    <th>{lang === "en" ? "Brand Scope" : "Phạm vi thương hiệu"}</th>
                                    <th style={{ textAlign: "center" }}>{lang === "en" ? "Status" : "Trạng thái"}</th>
                                    {canManageUsers && <th style={{ textAlign: "right" }}>{lang === "en" ? "Actions" : "Thao tác"}</th>}
                                </tr>
                                </thead>
                                <tbody>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={styles.tableRow}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setIsEditingProfile(false);
                                            setEditName(user.fullName);
                                            setEditPhone(user.phone);
                                            setEditRoleCode(user.roleCode);
                                            setEditBrandAccess(user.brandAccess);
                                        }}
                                    >
                                        {canManageUsers && (
                                            <td className={styles.tableCell} onClick={(e) => { e.stopPropagation(); setSelectedUserIds((p) => (p.includes(user.id) ? p.filter((x) => x !== user.id) : [...p, user.id])); }}>
                                                <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => {}} style={{ accentColor: "#D4AF37" }} />
                                            </td>
                                        )}
                                        <td className={styles.tableCell}>
                                            <strong>{user.fullName}</strong>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{user.uidCode} • {user.email}</div>
                                        </td>
                                        <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 600 }}>{formatRoleTitle(user.roleCode)}</td>
                                        <td className={styles.tableCell}><strong>{user.brandAccess}</strong><div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{user.locationScope}</div></td>
                                        <td className={styles.tableCell} style={{ textAlign: "center" }}>{renderStatusBadge(user.status)}</td>
                                        {canManageUsers && (
                                            <td className={styles.tableCell} style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                                <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                                                    <button type="button" onClick={() => { setSelectedUser(user); setIsEditingProfile(true); setEditName(user.fullName); setEditPhone(user.phone); setEditRoleCode(user.roleCode); setEditBrandAccess(user.brandAccess); }} className={styles.actionButton} style={{ padding: "0.35rem 0.55rem" }}><Edit3 size={14} color="#D4AF37" /></button>
                                                    <button type="button" onClick={() => setDeactivateTargetUser(user)} className={styles.actionButton} style={{ padding: "0.35rem 0.55rem" }}>
                                                        {user.status === "ACTIVE" ? <Lock size={14} color="#F87171" /> : <CheckCircle2 size={14} color="#34D399" />}
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* TAB 2: DANH MỤC VAI TRÒ */}
            {activeTab === "roles" && (
                <div>
                    {isPSA && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.85rem" }}>
                            <button type="button" onClick={() => setIsCreateRoleOpen(true)} className={styles.primaryGoldBtn}>
                                {lang === "en" ? "Create Custom Role" : "Tạo vai trò tùy chỉnh"}
                            </button>
                        </div>
                    )}
                    <div className={styles.rolesGrid}>
                        {roles.map((r) => (
                            <div key={r.code} onClick={() => { setSelectedRoleCode(r.code); setActiveTab("permissions"); }} className={styles.roleCard}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <span style={{ background: "rgba(212,175,55,0.16)", color: "#F5E6AD", padding: "0.18rem 0.55rem", borderRadius: "6px", fontSize: "0.74rem", fontWeight: 700 }}>{r.code}</span>
                                        <span style={{ fontSize: "0.72rem", color: r.isSystemProtected ? "#34D399" : "#38BDF8", fontWeight: 700 }}>
                                            {r.isSystemProtected ? (lang === "en" ? "System" : "Hệ thống") : (lang === "en" ? "Custom" : "Tùy chỉnh")}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1.02rem" }}>{lang === "en" ? r.titleEn : r.titleVi}</h3>
                                    <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.8rem", color: "#94A3B8" }}>{lang === "en" ? r.descEn : r.descVi}</p>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.65rem", fontSize: "0.78rem" }}>
                                    <span>{lang === "en" ? "Accounts:" : "Tài khoản:"} <strong>{users.filter((u) => u.roleCode === r.code).length}</strong></span>
                                    <span style={{ color: "#D4AF37", fontWeight: 700 }}>{lang === "en" ? "Matrix →" : "Ma trận →"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: MA TRẬN PHÂN QUYỀN (DÙNG LUXURYSELECT ĐỒNG BỘ 100%) */}
            {activeTab === "permissions" && (
                <div className={styles.tableCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                        <LuxurySelect
                            value={selectedRoleCode}
                            onChange={setSelectedRoleCode}
                            minWidth="280px"
                            options={roles.map((r) => ({
                                value: r.code,
                                label: `${r.code} — ${lang === "en" ? r.titleEn : r.titleVi}`,
                            }))}
                        />
                        {isPSA && (
                            <button type="button" onClick={() => { persistAll(users, roles, accessRequests, "PERMISSION_MATRIX_SAVED", selectedRoleCode); showToast(lang === "en" ? "Permission matrix saved." : "Đã lưu ma trận phân quyền."); }} className={styles.primaryGoldBtn}>
                                {lang === "en" ? "Save Matrix" : "Lưu ma trận"}
                            </button>
                        )}
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                            <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.12)", color: "#CBD5E1" }}>
                                <th style={{ padding: "0.7rem", textAlign: "left" }}>{lang === "en" ? "Module" : "Phân hệ"}</th>
                                <th style={{ padding: "0.7rem", textAlign: "center" }}>{lang === "en" ? "View" : "Xem"}</th>
                                <th style={{ padding: "0.7rem", textAlign: "center" }}>{lang === "en" ? "Create" : "Tạo"}</th>
                                <th style={{ padding: "0.7rem", textAlign: "center" }}>{lang === "en" ? "Edit" : "Sửa"}</th>
                                <th style={{ padding: "0.7rem", textAlign: "center" }}>{lang === "en" ? "Delete" : "Xóa"}</th>
                                <th style={{ padding: "0.7rem", textAlign: "center" }}>{lang === "en" ? "Approve" : "Duyệt"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedRoleObj.permissions.map((perm) => (
                                <tr key={perm.moduleKey} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    <td style={{ padding: "0.7rem", fontWeight: 700, color: "#F8FAFC" }}>{MODULE_LABELS[perm.moduleKey]?.[lang] || perm.moduleKey}</td>
                                    {(["view", "create", "edit", "delete", "approve"] as const).map((field) => (
                                        <td key={field} style={{ padding: "0.7rem", textAlign: "center" }}>
                                            <button type="button" onClick={() => handleToggleMatrix(perm.moduleKey, field)} className={`${styles.matrixCheckBtn} ${perm[field] ? styles.matrixCheckBtnActive : ""}`}>
                                                {perm[field] ? <Check size={13} /> : <X size={11} />}
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

            {/* TAB 4: YÊU CẦU CẤP QUYỀN & NHẬT KÝ BẢO MẬT */}
            {activeTab === "audit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className={styles.tableCard}>
                        <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>{lang === "en" ? "Access Requests" : "Yêu cầu cấp quyền"}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            {accessRequests.map((req) => (
                                <div key={req.id} style={{ background: "#0B0D14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                                    <div>
                                        <div><strong style={{ color: "#F5E6AD" }}>{req.id}</strong> • <strong>{req.requesterName}</strong> ({req.targetBrand})</div>
                                        <div style={{ fontSize: "0.82rem", color: "#34D399" }}>{req.requestedScope}</div>
                                        <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>{req.reason}</div>
                                    </div>
                                    {req.status === "PENDING" && canManageUsers ? (
                                        <div style={{ display: "flex", gap: "0.45rem" }}>
                                            <button type="button" onClick={() => handleDecideRequest(req, "APPROVED")} className={styles.secondaryGoldBtn} style={{ color: "#34D399" }}>{lang === "en" ? "Approve" : "Duyệt"}</button>
                                            <button type="button" onClick={() => handleDecideRequest(req, "REJECTED")} className={styles.secondaryGoldBtn} style={{ color: "#F87171" }}>{lang === "en" ? "Reject" : "Từ chối"}</button>
                                        </div>
                                    ) : (
                                        <span className={req.status === "APPROVED" ? styles.badgeActive : styles.badgeLocked}>
                                            {req.status === "APPROVED" ? (lang === "en" ? "Approved" : "Đã duyệt") : (lang === "en" ? "Rejected" : "Từ chối")}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.tableCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <strong>{lang === "en" ? "Security Audit Logs" : "Nhật ký bảo mật"}</strong>
                            <input type="text" placeholder={lang === "en" ? "Filter logs..." : "Lọc nhật ký..."} value={auditSearchUser} onChange={(e) => setAuditSearchUser(e.target.value)} className={styles.searchInput} style={{ width: "210px", padding: "0.45rem 0.75rem" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "320px", overflowY: "auto" }}>
                            {auditLogs
                                .filter((l) => !auditSearchUser.trim() || l.actor.toLowerCase().includes(auditSearchUser.toLowerCase()) || l.action.toLowerCase().includes(auditSearchUser.toLowerCase()))
                                .map((log) => (
                                    <div key={log.id} style={{ background: "#0B0D14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", padding: "0.7rem 0.9rem", display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                                        <div>
                                            <div><span style={{ color: "#F5E6AD" }}>{log.timestamp}</span> • <strong>{log.action}</strong></div>
                                            <div style={{ color: "#CBD5E1" }}>{log.actor} → {log.target}</div>
                                        </div>
                                        <span style={{ color: log.status === "SUCCESS" ? "#34D399" : "#F87171", fontWeight: 700 }}>{log.status}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT / SỬA NHÂN SỰ */}
            {selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
                    <div className={styles.modalContent} style={{ overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{selectedUser.fullName} ({selectedUser.uidCode})</h3>
                            <div style={{ display: "flex", gap: "0.45rem" }}>
                                {canManageUsers && (
                                    <button type="button" onClick={() => setIsEditingProfile(!isEditingProfile)} className={styles.secondaryGoldBtn}>
                                        {isEditingProfile ? (lang === "en" ? "Cancel" : "Hủy sửa") : (lang === "en" ? "Edit" : "Sửa")}
                                    </button>
                                )}
                                <button type="button" onClick={() => setSelectedUser(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                            </div>
                        </div>

                        {isEditingProfile && canManageUsers ? (
                            <form onSubmit={handleSaveUserEdit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Full Name" : "Họ tên"}</label>
                                        <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Phone" : "Số điện thoại"}</label>
                                        <input type="text" required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Role" : "Vai trò"}</label>
                                        <LuxurySelect
                                            width="100%"
                                            disabled={!isPSA}
                                            value={editRoleCode}
                                            onChange={(v) => setEditRoleCode(v as InternalRole)}
                                            options={(["PSA", "BA", "OM", "TE", "IS", "VW"] as const).map((rc) => ({ value: rc, label: formatRoleTitle(rc) }))}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Brand Scope" : "Thương hiệu"}</label>
                                        <LuxurySelect
                                            width="100%"
                                            disabled={Boolean(lockedBrandScope)}
                                            value={editBrandAccess}
                                            onChange={setEditBrandAccess}
                                            options={PARTNER_BRANDS.map((b) => ({ value: b, label: b }))}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className={styles.primaryGoldBtn}>{lang === "en" ? "Save Changes" : "Lưu thay đổi"}</button>
                            </form>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.86rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>Email:</span><strong>{selectedUser.email}</strong></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Role" : "Vai trò"}:</span><strong style={{ color: "#F5E6AD" }}>{formatRoleTitle(selectedUser.roleCode)}</strong></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Brand Scope" : "Phạm vi"}:</span><strong>{selectedUser.brandAccess}</strong></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Status" : "Trạng thái"}:</span>{renderStatusBadge(selectedUser.status)}</div>
                                {canManageUsers && (
                                    <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
                                        <button type="button" onClick={() => showToast(lang === "en" ? `Password reset sent to ${selectedUser.email}.` : `Đã gửi liên kết đặt lại mật khẩu tới ${selectedUser.email}.`)} className={styles.secondaryGoldBtn} style={{ flex: 1 }}>
                                            <Key size={14} color="#D4AF37" /><span>{lang === "en" ? "Reset Password" : "Đặt lại mật khẩu"}</span>
                                        </button>
                                        <button type="button" onClick={() => setDeactivateTargetUser(selectedUser)} className={styles.secondaryGoldBtn} style={{ flex: 1, color: selectedUser.status === "ACTIVE" ? "#F87171" : "#34D399" }}>
                                            <Lock size={14} /><span>{selectedUser.status === "ACTIVE" ? (lang === "en" ? "Deactivate" : "Khóa tài khoản") : (lang === "en" ? "Activate" : "Mở khóa")}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL MỜI NHÂN SỰ */}
            {isInviteModalOpen && canManageUsers && (
                <div className={styles.modalOverlay} onClick={() => setIsInviteModalOpen(false)}>
                    <div className={styles.modalContent} style={{ overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{lang === "en" ? "Invite User" : "Mời nhân sự mới"}</h3>
                            <button type="button" onClick={() => setIsInviteModalOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>
                        {inviteError && <div style={{ padding: "0.65rem", borderRadius: "8px", background: "rgba(248,113,113,0.14)", color: "#F87171", fontSize: "0.82rem", marginBottom: "0.85rem" }}>{inviteError}</div>}
                        <form onSubmit={handleInviteSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Full Name *" : "Họ tên *"}</label>
                                    <input type="text" required value={inviteName} onChange={(e) => setInviteName(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>Email *</label>
                                    <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Role" : "Vai trò"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={inviteRoleCode}
                                        onChange={(v) => setInviteRoleCode(v as InternalRole)}
                                        options={(isPSA ? (["BA", "OM", "TE", "IS", "VW"] as const) : (["OM", "TE", "IS", "VW"] as const)).map((rc) => ({ value: rc, label: formatRoleTitle(rc) }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Brand" : "Thương hiệu"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        disabled={Boolean(lockedBrandScope)}
                                        value={lockedBrandScope || inviteBrand}
                                        onChange={setInviteBrand}
                                        options={PARTNER_BRANDS.filter((b) => b !== "All Brands").map((b) => ({ value: b, label: b }))}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.primaryGoldBtn}>{lang === "en" ? "Send Invite" : "Gửi lời mời"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KHÓA / MỞ KHÓA */}
            {deactivateTargetUser && canManageUsers && (
                <div className={styles.modalOverlay} onClick={() => setDeactivateTargetUser(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>
                            {deactivateTargetUser.status === "ACTIVE"
                                ? lang === "en" ? `Deactivate ${deactivateTargetUser.fullName}?` : `Khóa tài khoản ${deactivateTargetUser.fullName}?`
                                : lang === "en" ? `Activate ${deactivateTargetUser.fullName}?` : `Mở khóa tài khoản ${deactivateTargetUser.fullName}?`}
                        </h3>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", fontSize: "0.78rem", color: "#D4AF37", fontWeight: 700, marginBottom: "0.3rem" }}>{lang === "en" ? "Audit Reason *" : "Lý do bắt buộc *"}</label>
                            <input type="text" required value={deactivateReasonInput} onChange={(e) => setDeactivateReasonInput(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                            <button type="button" onClick={() => setDeactivateTargetUser(null)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                            <button type="button" onClick={handleConfirmToggleStatus} className={styles.primaryGoldBtn}>{lang === "en" ? "Confirm" : "Xác nhận"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN HÀNG LOẠT */}
            {bulkActionConfirm && canManageUsers && (
                <div className={styles.modalOverlay} onClick={() => setBulkActionConfirm(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? `Confirm Bulk ${bulkActionConfirm}` : `Xác nhận ${bulkActionConfirm === "ACTIVATE" ? "kích hoạt" : "khóa"} hàng loạt`}</h3>
                        <p style={{ color: "#CBD5E1", fontSize: "0.86rem" }}>
                            {lang === "en" ? `Apply to ${selectedUserIds.length} selected account(s)?` : `Áp dụng cho ${selectedUserIds.length} tài khoản đã chọn?`}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                            <button type="button" onClick={() => setBulkActionConfirm(null)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                            <button type="button" onClick={handleBulkExecute} className={styles.primaryGoldBtn}>{lang === "en" ? "Confirm" : "Xác nhận"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TẠO VAI TRÒ TÙY CHỈNH (CHỈ PSA) */}
            {isCreateRoleOpen && isPSA && (
                <div className={styles.modalOverlay} onClick={() => setIsCreateRoleOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? "Create Custom Role" : "Tạo vai trò tùy chỉnh"}</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!newRoleCode.trim() || !newRoleTitle.trim()) return;
                                const custom: RoleDefinitionItem = {
                                    code: newRoleCode.trim().toUpperCase(),
                                    titleVi: newRoleTitle.trim(),
                                    titleEn: newRoleTitle.trim(),
                                    descVi: newRoleDesc.trim(),
                                    descEn: newRoleDesc.trim(),
                                    isSystemProtected: false,
                                    permissions: INITIAL_ROLES[5].permissions,
                                };
                                persistAll(users, [...roles, custom], accessRequests, "ROLE_CREATED", custom.code);
                                setIsCreateRoleOpen(false);
                                showToast(lang === "en" ? `Created role ${custom.code}.` : `Đã tạo vai trò ${custom.code}.`);
                            }}
                        >
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Code *" : "Mã *"}</label>
                                    <input type="text" required maxLength={5} value={newRoleCode} onChange={(e) => setNewRoleCode(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Title *" : "Tên vai trò *"}</label>
                                    <input type="text" required value={newRoleTitle} onChange={(e) => setNewRoleTitle(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Description" : "Mô tả"}</label>
                                <textarea rows={2} value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem", resize: "none" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsCreateRoleOpen(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.primaryGoldBtn}>{lang === "en" ? "Create" : "Tạo mới"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: "#181D2C", border: "1px solid #D4AF37", borderRadius: "12px", padding: "0.85rem 1.15rem", color: "#F5E6AD", fontWeight: 600, fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "0.55rem", zIndex: 99999 }}>
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}