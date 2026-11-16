// noinspection SpellCheckingInspection
"use client";

import React, { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Globe,
    ShieldCheck,
    ArrowLeft,
    CheckCircle2,
    AlertOctagon,
    KeyRound,
    X,
    Volume2,
    VolumeX,
    Check,
    Unlock,
    LayoutDashboard,
    LogOut,
    ChevronDown,
    Building2,
    Cpu,
    Users,
    Sparkles,
} from "lucide-react";
import styles from "./login.module.css";

export type AuthenticatedRoleCode = "PSA" | "BA" | "OM" | "TE" | "IS" | "VW";

export interface SeedAccountItem {
    id: number;
    email: string;
    passwordPlain: string;
    roleCode: AuthenticatedRoleCode;
    accountLabel: string;
    brandTenant: string | null;
    brandScopeDisplay: string;
    status: "ACTIVE" | "LOCKED" | "INACTIVE";
    requires2FA: boolean;
    tokenVersion: number;
    defaultRedirect: string;
}

const ROLE_ACCESS_MAP: Record<string, AuthenticatedRoleCode[]> = {
    "/dashboard": ["PSA", "BA", "OM", "VW"],
    "/alerts": ["PSA", "BA", "OM", "TE", "IS"],
    "/profile": ["PSA", "BA", "OM", "TE", "IS", "VW"],
    "/brands": ["PSA", "BA"],
    "/products": ["PSA", "BA", "OM", "IS"],
    "/machines": ["PSA", "BA", "OM", "TE", "IS"],
    "/transactions": ["PSA", "BA", "OM"],
    "/inventory": ["PSA", "BA", "OM", "IS"],
    "/refill": ["OM", "TE", "IS"],
    "/maintenance": ["PSA", "BA", "OM", "TE"],
    "/users": ["PSA", "BA"],
    "/reports": ["PSA", "BA", "OM", "VW"],
    "/settings": ["PSA", "BA"],
};

const ENTERPRISE_SEED_ACCOUNTS: SeedAccountItem[] = [
    {
        id: 1,
        email: "admin@scentstation.local",
        passwordPlain: "Admin@12345",
        roleCode: "PSA",
        accountLabel: "Platform Super Administrator",
        brandTenant: null,
        brandScopeDisplay: "Global Platform Governance • All 21 Maisons",
        status: "ACTIVE",
        requires2FA: false,
        tokenVersion: 1,
        defaultRedirect: "/dashboard",
    },
    {
        id: 2,
        email: "brand.admin@scentstation.local",
        passwordPlain: "Admin@12345",
        roleCode: "BA",
        accountLabel: "Chanel Brand Administrator",
        brandTenant: "Chanel",
        brandScopeDisplay: "Chanel Maison Workspace • 2FA Protected",
        status: "ACTIVE",
        requires2FA: true,
        tokenVersion: 1,
        defaultRedirect: "/dashboard",
    },
    {
        id: 3,
        email: "ops.manager@scentstation.local",
        passwordPlain: "Admin@12345",
        roleCode: "OM",
        accountLabel: "Operations Manager",
        brandTenant: null,
        brandScopeDisplay: "Fleet Operations, Alerts & Transaction Reconciliation",
        status: "ACTIVE",
        requires2FA: false,
        tokenVersion: 1,
        defaultRedirect: "/dashboard",
    },
    {
        id: 4,
        email: "tech@scentstation.local",
        passwordPlain: "Admin@12345",
        roleCode: "TE",
        accountLabel: "Lead Field Technician",
        brandTenant: null,
        brandScopeDisplay: "Hardware Diagnostics, Maintenance & Calibration",
        status: "ACTIVE",
        requires2FA: false,
        tokenVersion: 1,
        defaultRedirect: "/maintenance",
    },
    {
        id: 5,
        email: "inventory@scentstation.local",
        passwordPlain: "Admin@12345",
        roleCode: "IS",
        accountLabel: "Warehouse & Inventory Specialist",
        brandTenant: null,
        brandScopeDisplay: "Perfume Batches, Bottle Registration & Refills",
        status: "ACTIVE",
        requires2FA: false,
        tokenVersion: 1,
        defaultRedirect: "/inventory",
    },
    {
        id: 6,
        email: "viewer@scentstation.local",
        passwordPlain: "Admin@12345",
        roleCode: "VW",
        accountLabel: "Executive Analytics Viewer",
        brandTenant: null,
        brandScopeDisplay: "Read-Only Business Intelligence & Reports",
        status: "ACTIVE",
        requires2FA: false,
        tokenVersion: 1,
        defaultRedirect: "/dashboard",
    },
    {
        id: 7,
        email: "locked@scentstation.local",
        passwordPlain: "Admin@12345",
        roleCode: "TE",
        accountLabel: "Field Technician (Suspended)",
        brandTenant: null,
        brandScopeDisplay: "Account Locked Due to Security Policy",
        status: "LOCKED",
        requires2FA: false,
        tokenVersion: 2,
        defaultRedirect: "/maintenance",
    },
];

const I18N_CONTENT = {
    en: {
        platformSubtitle: "Haute Parfumerie & Automated Sampling Boutiques",
        backToGateway: "Back to Flagship Store",
        heroTitle: "Enterprise Fragrance & Telemetry Governance",
        heroDesc:
            "Centralized multi-tenant workspace for partner fragrance houses and operations teams. Manage curated catalogs, monitor real-time station telemetry, and oversee financial reconciliation.",
        kpi1: "Partner Maisons",
        kpi2: "Curated Signatures",
        kpi3: "Calibrated Mist",
        pillar1Title: "Multi-Tenant Brand Isolation",
        pillar1Desc: "Dedicated workspace boundaries ensuring each luxury maison manages its own catalog, pricing, and analytics.",
        pillar2Title: "Real-Time IoT Fleet Telemetry",
        pillar2Desc: "Live heartbeat monitoring, load-cell volume tracking, and cryptographically signed dispensing commands.",
        pillar3Title: "Role-Scoped Access Control",
        pillar3Desc: "Granular permissions tailored for Administrators, Operations, Technicians, Inventory Staff, and Viewers.",
        seedToggleLabel: "Demo Role Switcher (Quick Autofill)",
        cardTitle: "Partner & Staff Sign In",
        cardSubtitle: "Enter your corporate credentials to access your authorized workspace.",
        emailLabel: "Corporate Email",
        emailPlaceholder: "name@scentstation.local",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        rememberMe: "Keep me signed in on this device",
        forgotPassword: "Forgot password?",
        signInBtn: "Sign In to Workspace",
        signingInBtn: "Authenticating...",
        securityHeading: "Enterprise Role-Based Security",
        securityBody:
            "Protected by cryptographic password hashing, stateless session verification, and strict tenant boundary enforcement. All authentication events are recorded for security compliance.",
        errEmailEmpty: "Please enter your email address.",
        errEmailFormat: "Please enter a valid email address (e.g., admin@scentstation.local).",
        errPasswordEmpty: "Please enter your password.",
        errGenericCredentials:
            "Invalid email or password. Please verify your credentials and try again.",
    },
    vi: {
        platformSubtitle: "Hệ Thống Trải Nghiệm Nước Hoa Tự Động Cao Cấp",
        backToGateway: "Về Trang Chủ Trải Nghiệm",
        heroTitle: "Hệ Thống Quản Trị & Giám Sát Trạm Hương Thơm",
        heroDesc:
            "Không gian quản trị tập trung đa thương hiệu dành cho các nhà hương đối tác và đội ngũ vận hành. Quản lý danh mục sản phẩm, giám sát cảm biến thời gian thực và đối soát giao dịch.",
        kpi1: "Thương Hiệu Cao Cấp",
        kpi2: "Tuyệt Tác Tuyển Chọn",
        kpi3: "Định Lượng Phun Chuẩn",
        pillar1Title: "Cô Lập Dữ Liệu Đa Thương Hiệu",
        pillar1Desc: "Không gian làm việc độc lập giúp mỗi thương hiệu quản lý danh mục, giá bán và báo cáo doanh thu riêng biệt.",
        pillar2Title: "Giám Sát Thiết Bị IoT Thời Gian Thực",
        pillar2Desc: "Theo dõi trạng thái kết nối, định lượng dung tích từng bình chứa và xác thực lệnh phun an toàn.",
        pillar3Title: "Phân Quyền Theo Vai Trò Nghiêm Ngặt",
        pillar3Desc: "Giao diện và chức năng được cấp phát chính xác theo từng vị trí: Quản trị viên, Vận hành, Kỹ thuật, Kho và Kiểm toán.",
        seedToggleLabel: "Chuyển Nhanh Tài Khoản Demo (Tự Động Điền)",
        cardTitle: "Đăng Nhập Cổng Quản Trị",
        cardSubtitle: "Sử dụng tài khoản nội bộ để truy cập không gian làm việc được phân quyền.",
        emailLabel: "Email Doanh Nghiệp",
        emailPlaceholder: "name@scentstation.local",
        passwordLabel: "Mật Khẩu",
        passwordPlaceholder: "Nhập mật khẩu của bạn",
        rememberMe: "Duy trì đăng nhập trên thiết bị này",
        forgotPassword: "Quên mật khẩu?",
        signInBtn: "Đăng Nhập Hệ Thống",
        signingInBtn: "Đang xác thực...",
        securityHeading: "Bảo Mật Phân Quyền Doanh Nghiệp",
        securityBody:
            "Hệ thống bảo vệ dữ liệu bằng mã hóa mật khẩu một chiều, kiểm soát phiên truy cập tức thời và cô lập phạm vi thương hiệu. Mọi hoạt động đăng nhập đều được ghi nhận.",
        errEmailEmpty: "Vui lòng nhập địa chỉ email của bạn.",
        errEmailFormat: "Định dạng email không hợp lệ (VD: admin@scentstation.local).",
        errPasswordEmpty: "Vui lòng nhập mật khẩu của bạn.",
        errGenericCredentials:
            "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại thông tin.",
    },
};

const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const AUTH_SECURITY_STATE_KEY = "scentstation_auth_security_state_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const ACTIVE_SESSIONS_STORAGE_KEY = "scentstation_active_sessions_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function LoginPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const isMountedRef = useRef<boolean>(true);
    const hasInitializedUrlRef = useRef<boolean>(false);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const registerTimeout = useCallback((fn: () => void, ms: number) => {
        const t = setTimeout(() => {
            if (isMountedRef.current) fn();
        }, ms);
        timersRef.current.push(t);
        return t;
    }, []);

    const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);
    const [language, setLanguage] = useState<"en" | "vi">("en");
    const [langOpen, setLangOpen] = useState<boolean>(false);
    const t = I18N_CONTENT[language];

    const handleChangeLanguage = useCallback((nextLang: "en" | "vi") => {
        setLanguage(nextLang);
        setLangOpen(false);
        setEmailError("");
        setPasswordError("");
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
        } catch {
            // Ignore storage errors
        }
    }, []);

    const [onlineKiosksCount, setOnlineKiosksCount] = useState<number>(6);
    const [totalKiosksCount, setTotalKiosksCount] = useState<number>(8);
    const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(true);

    const [existingSessionUser, setExistingSessionUser] = useState<{
        fullName: string;
        email: string;
        roleCode: AuthenticatedRoleCode;
        defaultRedirect: string;
    } | null>(null);

    const [requestedRedirect, setRequestedRedirect] = useState<string | null>(null);
    const requestedRedirectRef = useRef<string | null>(null);

    const [email, setEmail] = useState<string>("admin@scentstation.local");
    const [password, setPassword] = useState<string>("Admin@12345");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [rememberMe, setRememberMe] = useState<boolean>(true);
    const rememberMeRef = useRef<boolean>(true);

    useEffect(() => {
        rememberMeRef.current = rememberMe;
    }, [rememberMe]);

    const [emailError, setEmailError] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");
    const [authError, setAuthError] = useState<string>("");
    const [authSuccess, setAuthSuccess] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});
    const [updatedPasswords, setUpdatedPasswords] = useState<Record<string, string>>({});
    const [unlockedEmails, setUnlockedEmails] = useState<Record<string, boolean>>({});

    const [pending2FAUser, setPending2FAUser] = useState<SeedAccountItem | null>(null);
    const [otpInput, setOtpInput] = useState<string>("");
    const [otpError, setOtpError] = useState<string>("");

    const [isForgotOpen, setIsForgotOpen] = useState<boolean>(false);
    const [forgotStep, setForgotStep] = useState<"EMAIL" | "NEW_PW" | "SUCCESS">("EMAIL");
    const [forgotEmail, setForgotEmail] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [forgotError, setForgotError] = useState<string>("");

    const appendSecurityAuditLog = useCallback(
        (entry: {
            actor: string;
            role: string;
            tenant: string | null;
            action: string;
            entityId: string;
            severity: "INFO" | "WARNING" | "ERROR";
            details: Record<string, unknown>;
        }) => {
            try {
                const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const logs = rawLogs ? JSON.parse(rawLogs) : [];
                logs.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: new Date().toISOString(),
                    actor: entry.actor,
                    role: entry.role,
                    tenant: entry.tenant,
                    action: entry.action,
                    entityType: "AUTHENTICATION",
                    entityId: entry.entityId,
                    severity: entry.severity,
                    oldValues: null,
                    newValues: entry.details,
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));
            } catch {
                // Ignore storage quota errors
            }
        },
        []
    );

    const persistSecurityState = useCallback(
        (
            nextFailures: Record<string, number>,
            nextPasswords: Record<string, string>,
            nextUnlocked: Record<string, boolean>
        ) => {
            try {
                localStorage.setItem(
                    AUTH_SECURITY_STATE_KEY,
                    JSON.stringify({
                        failedAttempts: nextFailures,
                        updatedPasswords: nextPasswords,
                        unlockedEmails: nextUnlocked,
                    })
                );
            } catch {
                // Safe fallback
            }
        },
        []
    );

    const resolvePermittedDestination = useCallback((account: SeedAccountItem): string => {
        const redir = requestedRedirectRef.current;
        if (redir && redir.startsWith("/")) {
            const [pathWithoutQuery, queryString] = redir.split("?");
            const baseRoute = "/" + pathWithoutQuery.split("/").filter(Boolean)[0];
            const allowedRoles = ROLE_ACCESS_MAP[baseRoute];
            if (!allowedRoles || allowedRoles.includes(account.roleCode)) {
                if (account.brandTenant && account.roleCode !== "PSA") {
                    const params = new URLSearchParams(queryString || "");
                    if (!params.has("brand")) {
                        params.set("brand", account.brandTenant);
                    }
                    const qs = params.toString();
                    return qs ? `${pathWithoutQuery}?${qs}` : pathWithoutQuery;
                }
                return redir;
            }
        }
        return account.defaultRedirect;
    }, []);

    const establishAuthenticatedSession = useCallback(
        (account: SeedAccountItem, authMethod: "PASSWORD" | "2FA_OTP" = "PASSWORD") => {
            const targetRoute = resolvePermittedDestination(account);
            const isRemember = rememberMeRef.current;
            const sessionId = `SES-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
            const nowIso = new Date().toISOString();

            const sessionPayload = {
                token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.scentstation_${account.roleCode}_v${account.tokenVersion}_${Date.now()}`,
                user: {
                    id: account.id,
                    sessionId,
                    fullName: account.accountLabel,
                    name: account.accountLabel,
                    email: account.email,
                    role: account.roleCode,
                    roleCode: account.roleCode,
                    brand: account.brandTenant,
                    brandScope: account.brandTenant,
                    brandScopeDisplay: account.brandScopeDisplay,
                    tokenVersion: account.tokenVersion,
                    roles: [account.roleCode],
                    authenticatedAt: nowIso,
                    authMethod,
                },
            };

            sessionStorage.setItem("scentstation-token", sessionPayload.token);
            sessionStorage.setItem("scentstation-user", JSON.stringify(sessionPayload.user));
            sessionStorage.setItem("scentstation-remember", String(isRemember));
            sessionStorage.setItem("scentstation-demo-user", JSON.stringify(sessionPayload.user));
            sessionStorage.setItem("scentstation-demo-role", account.roleCode);
            sessionStorage.setItem("scentstation-demo-remember", String(isRemember));

            if (isRemember) {
                localStorage.setItem("scentstation-token", sessionPayload.token);
                localStorage.setItem("scentstation-user", JSON.stringify(sessionPayload.user));
                localStorage.setItem("scentstation-remember", "true");
            } else {
                localStorage.removeItem("scentstation-token");
                localStorage.removeItem("scentstation-user");
                localStorage.removeItem("scentstation-remember");
            }

            try {
                const rawSessions = localStorage.getItem(ACTIVE_SESSIONS_STORAGE_KEY);
                const sessions = rawSessions ? JSON.parse(rawSessions) : [];
                const updatedSessions = Array.isArray(sessions)
                    ? sessions.map((s: any) => ({ ...s, isCurrent: false }))
                    : [];
                updatedSessions.unshift({
                    sessionId,
                    userId: account.id,
                    email: account.email,
                    userName: account.accountLabel,
                    roleCode: account.roleCode,
                    brandScope: account.brandTenant,
                    device: "Windows Desktop • Chrome Web Portal",
                    ipAddress: "127.0.0.1",
                    location: "Ho Chi Minh City, VN",
                    loginTime: nowIso,
                    lastActive: nowIso,
                    authMethod,
                    tokenVersion: account.tokenVersion,
                    status: "ACTIVE",
                    isCurrent: true,
                });
                localStorage.setItem(
                    ACTIVE_SESSIONS_STORAGE_KEY,
                    JSON.stringify(updatedSessions.slice(0, 25))
                );
            } catch {
                // Safe fallback
            }

            const cleanEmailKey = account.email.toLowerCase();
            setFailedAttempts((prev) => {
                const nextFail = { ...prev, [cleanEmailKey]: 0 };
                try {
                    const rawSec = localStorage.getItem(AUTH_SECURITY_STATE_KEY);
                    const parsed = rawSec ? JSON.parse(rawSec) : {};
                    localStorage.setItem(
                        AUTH_SECURITY_STATE_KEY,
                        JSON.stringify({
                            ...parsed,
                            failedAttempts: nextFail,
                        })
                    );
                } catch {
                    // Safe fallback
                }
                return nextFail;
            });

            appendSecurityAuditLog({
                actor: account.accountLabel,
                role: account.roleCode,
                tenant: account.brandTenant,
                action: "LOGIN_SUCCESS",
                entityId: account.email,
                severity: "INFO",
                details: {
                    sessionId,
                    method: authMethod,
                    tokenVersion: account.tokenVersion,
                    redirectedTo: targetRoute,
                    rememberMe: isRemember,
                },
            });

            router.push(targetRoute);
        },
        [appendSecurityAuditLog, resolvePermittedDestination, router]
    );

    const handleSignOutCurrentSession = useCallback(() => {
        if (existingSessionUser) {
            appendSecurityAuditLog({
                actor: existingSessionUser.fullName,
                role: existingSessionUser.roleCode,
                tenant: null,
                action: "LOGOUT_SUCCESS",
                entityId: existingSessionUser.email,
                severity: "INFO",
                details: { source: "Login Session Switcher" },
            });
        }
        sessionStorage.removeItem("scentstation-token");
        sessionStorage.removeItem("scentstation-user");
        sessionStorage.removeItem("scentstation-demo-user");
        localStorage.removeItem("scentstation-token");
        localStorage.removeItem("scentstation-user");
        setExistingSessionUser(null);
        setAuthSuccess(
            language === "en"
                ? "You have been signed out of the previous session."
                : "Đã đăng xuất khỏi phiên làm việc trước đó."
        );
    }, [appendSecurityAuditLog, existingSessionUser, language]);

    useEffect(() => {
        isMountedRef.current = true;
        if (typeof window === "undefined") return;

        if (!hasInitializedUrlRef.current) {
            hasInitializedUrlRef.current = true;

            try {
                const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLang === "vi" || savedLang === "en") {
                    setLanguage(savedLang);
                }
            } catch {
                // Safe fallback
            }

            try {
                const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawMachines) {
                    const parsedMachines = JSON.parse(rawMachines);
                    if (Array.isArray(parsedMachines) && parsedMachines.length > 0) {
                        setTotalKiosksCount(parsedMachines.length);
                        const onlineCnt = parsedMachines.filter((m: any) => {
                            const conn = m.connectionStatus || (m.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                            const oper =
                                m.operatingStatus ||
                                (m.status === "MAINTENANCE"
                                    ? "MAINTENANCE"
                                    : m.status === "OFFLINE"
                                        ? "ERROR"
                                        : "ACTIVE");
                            return conn === "ONLINE" && oper === "ACTIVE";
                        }).length;
                        setOnlineKiosksCount(onlineCnt);
                    }
                }
            } catch {
                // Safe fallback
            }

            try {
                const savedUserRaw =
                    sessionStorage.getItem("scentstation-user") ||
                    localStorage.getItem("scentstation-user");
                if (savedUserRaw) {
                    const parsedUser = JSON.parse(savedUserRaw);
                    const roleCode = (parsedUser.roleCode || parsedUser.role || "PSA") as AuthenticatedRoleCode;
                    const seedMatch = ENTERPRISE_SEED_ACCOUNTS.find((a) => a.roleCode === roleCode);
                    setExistingSessionUser({
                        fullName: parsedUser.fullName || parsedUser.name || "Portal User",
                        email: parsedUser.email || "admin@scentstation.local",
                        roleCode,
                        defaultRedirect: seedMatch?.defaultRedirect || "/dashboard",
                    });
                }
            } catch {
                // Safe fallback
            }

            try {
                const rawSec = localStorage.getItem(AUTH_SECURITY_STATE_KEY);
                if (rawSec) {
                    const parsed = JSON.parse(rawSec);
                    if (parsed.failedAttempts) setFailedAttempts(parsed.failedAttempts);
                    if (parsed.updatedPasswords) setUpdatedPasswords(parsed.updatedPasswords);
                    if (parsed.unlockedEmails) setUnlockedEmails(parsed.unlockedEmails);
                }
            } catch {
                // Safe fallback
            }

            const params = new URLSearchParams(window.location.search);
            const redirectParam = params.get("redirect");
            if (redirectParam) {
                requestedRedirectRef.current = redirectParam;
                setRequestedRedirect(redirectParam);
            }
        }

        return () => {
            isMountedRef.current = false;
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current = [];
        };
    }, []);

    useEffect(() => {
        const anyModalOpen = isForgotOpen || Boolean(pending2FAUser);
        document.body.style.overflow = anyModalOpen ? "hidden" : "";

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsForgotOpen(false);
                setPending2FAUser(null);
                setLangOpen(false);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isForgotOpen, pending2FAUser]);

    const handleSignInSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading) return;

        setEmailError("");
        setPasswordError("");
        setAuthError("");
        setAuthSuccess("");

        const cleanEmail = email.trim().toLowerCase();
        let valid = true;

        if (!cleanEmail) {
            setEmailError(t.errEmailEmpty);
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setEmailError(t.errEmailFormat);
            valid = false;
        }

        if (!password.trim()) {
            setPasswordError(t.errPasswordEmpty);
            valid = false;
        }

        if (!valid) return;

        setLoading(true);
        await new Promise<void>((resolve) => {
            registerTimeout(() => resolve(), 360);
        });
        if (!isMountedRef.current) return;

        const matched = ENTERPRISE_SEED_ACCOUNTS.find(
            (item) => item.email.toLowerCase() === cleanEmail
        );

        if (!matched) {
            setAuthError(t.errGenericCredentials);
            appendSecurityAuditLog({
                actor: cleanEmail,
                role: "UNAUTHENTICATED",
                tenant: null,
                action: "LOGIN_FAILED_UNKNOWN_USER",
                entityId: cleanEmail,
                severity: "WARNING",
                details: { attemptedEmail: cleanEmail },
            });
            setLoading(false);
            return;
        }

        const failCount = failedAttempts[cleanEmail] || 0;
        const isSeedLocked = matched.status === "LOCKED" && !unlockedEmails[cleanEmail];

        if (isSeedLocked || failCount >= 5) {
            const lockMsg =
                language === "en"
                    ? `This account (${cleanEmail}) has been temporarily locked due to multiple failed sign-in attempts. Please reset your password or contact an administrator.`
                    : `Tài khoản (${cleanEmail}) đã bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng khôi phục mật khẩu hoặc liên hệ Quản trị viên.`;
            setAuthError(lockMsg);

            appendSecurityAuditLog({
                actor: matched.accountLabel,
                role: matched.roleCode,
                tenant: matched.brandTenant,
                action: "LOGIN_REFUSED_ACCOUNT_LOCKED",
                entityId: cleanEmail,
                severity: "ERROR",
                details: { failCount, status: "LOCKED" },
            });
            setLoading(false);
            return;
        }

        const activePassword = updatedPasswords[cleanEmail] || matched.passwordPlain;

        if (password !== activePassword) {
            const nextFail = failCount + 1;
            const nextFailMap = { ...failedAttempts, [cleanEmail]: nextFail };
            setFailedAttempts(nextFailMap);
            persistSecurityState(nextFailMap, updatedPasswords, unlockedEmails);

            const left = Math.max(0, 5 - nextFail);

            appendSecurityAuditLog({
                actor: matched.accountLabel,
                role: matched.roleCode,
                tenant: matched.brandTenant,
                action: left === 0 ? "ACCOUNT_LOCKED_MAX_ATTEMPTS" : "LOGIN_FAILED_WRONG_PASSWORD",
                entityId: cleanEmail,
                severity: left === 0 ? "ERROR" : "WARNING",
                details: { failedAttemptNumber: nextFail, remainingAttempts: left },
            });

            setAuthError(
                left === 0
                    ? language === "en"
                        ? `Maximum failed attempts reached. Account "${cleanEmail}" is now locked for security.`
                        : `Đã vượt quá 5 lần thử. Tài khoản "${cleanEmail}" đã bị khóa để bảo mật.`
                    : language === "vi"
                        ? `Email hoặc mật khẩu không chính xác. Còn ${left}/5 lần thử trước khi tài khoản bị tạm khóa.`
                        : `Invalid email or password. ${left}/5 attempt(s) remaining before temporary lockout.`
            );
            setLoading(false);
            return;
        }

        if (matched.requires2FA) {
            setPending2FAUser(matched);
            setOtpInput("");
            setOtpError("");
            setLoading(false);
            return;
        }

        establishAuthenticatedSession(matched, "PASSWORD");
        setLoading(false);
    };

    const handleVerify2FASubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!pending2FAUser) return;
        if (otpInput.trim() !== "123456") {
            setOtpError(
                language === "en"
                    ? "Invalid 6-digit verification code. Please enter 123456 for demonstration."
                    : "Mã xác thực 6 chữ số không chính xác. Vui lòng nhập mã demo: 123456."
            );
            appendSecurityAuditLog({
                actor: pending2FAUser.accountLabel,
                role: pending2FAUser.roleCode,
                tenant: pending2FAUser.brandTenant,
                action: "2FA_VERIFICATION_FAILED",
                entityId: pending2FAUser.email,
                severity: "WARNING",
                details: { enteredOtp: otpInput },
            });
            return;
        }
        const userToAuth = pending2FAUser;
        setPending2FAUser(null);
        establishAuthenticatedSession(userToAuth, "2FA_OTP");
    };

    const handleForgotPasswordFlow = (e: FormEvent) => {
        e.preventDefault();
        setForgotError("");

        if (forgotStep === "EMAIL") {
            const clean = forgotEmail.trim().toLowerCase();
            if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
                setForgotError(t.errEmailFormat);
                return;
            }
            const matchedAccount = ENTERPRISE_SEED_ACCOUNTS.find(
                (acc) => acc.email.toLowerCase() === clean
            );
            if (!matchedAccount) {
                setForgotError(
                    language === "en"
                        ? `No registered corporate account found for "${clean}".`
                        : `Không tìm thấy tài khoản doanh nghiệp "${clean}".`
                );
                return;
            }
            setForgotStep("NEW_PW");
            return;
        }

        if (forgotStep === "NEW_PW") {
            const hasMinLen = newPassword.length >= 8;
            const hasUpper = /[A-Z]/.test(newPassword);
            const hasLower = /[a-z]/.test(newPassword);
            const hasDigit = /[0-9]/.test(newPassword);
            const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

            if (!hasMinLen || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
                setForgotError(
                    language === "en"
                        ? "Password must meet all security requirements (min 8 characters, uppercase, lowercase, number, and special character)."
                        : "Mật khẩu mới phải đáp ứng đủ các tiêu chí bảo mật (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt)."
                );
                return;
            }
            if (newPassword !== confirmPassword) {
                setForgotError(
                    language === "en"
                        ? "Password confirmation does not match."
                        : "Mật khẩu xác nhận không khớp."
                );
                return;
            }
            const clean = forgotEmail.trim().toLowerCase();
            const nextPasswords = { ...updatedPasswords, [clean]: newPassword };
            const nextFailures = { ...failedAttempts, [clean]: 0 };
            const nextUnlocked = { ...unlockedEmails, [clean]: true };

            setUpdatedPasswords(nextPasswords);
            setFailedAttempts(nextFailures);
            setUnlockedEmails(nextUnlocked);
            persistSecurityState(nextFailures, nextPasswords, nextUnlocked);

            appendSecurityAuditLog({
                actor: clean,
                role: "USER_RECOVERY",
                tenant: null,
                action: "PASSWORD_RESET_COMPLETED",
                entityId: clean,
                severity: "INFO",
                details: { lockoutCleared: true },
            });

            setForgotStep("SUCCESS");
        }
    };

    return (
        <main className={`${styles.viewport} notranslate`} translate="no" onClick={() => setLangOpen(false)}>
            <div className={styles.videoBackdropContainer} aria-hidden="true">
                <video
                    ref={videoRef}
                    className={styles.backgroundVideo}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    poster="/login-perfume.png"
                >
                    <source src="/video_1.mp4" type="video/mp4" />
                    <source src="/login-bg.mp4" type="video/mp4" />
                    <source src="/videos/video_1.mp4" type="video/mp4" />
                </video>
                <div className={styles.videoVignetteOverlay} />
            </div>

            <header className={styles.topHeader}>
                <div className={styles.topHeaderInner}>
                    <div
                        className={styles.brandTypographyOnly}
                        onClick={() => router.push("/")}
                    >
                        <span className={styles.brandNameText} translate="no">
                            ScentStation
                        </span>
                        <span className={styles.brandSubText}>{t.platformSubtitle}</span>
                    </div>

                    <div
                        className={styles.headerControlsRight}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className={styles.videoControlBtn}
                        >
                            <ArrowLeft size={14} color="#D4AF37" />
                            <span>{t.backToGateway}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsVideoMuted(!isVideoMuted)}
                            className={styles.videoControlBtn}
                            title={isVideoMuted ? "Unmute ambient audio" : "Mute ambient audio"}
                        >
                            {isVideoMuted ? (
                                <VolumeX size={15} color="#94A3B8" />
                            ) : (
                                <Volume2 size={15} color="#D4AF37" />
                            )}
                        </button>

                        <div className={styles.langSelectorWrapper}>
                            <button
                                type="button"
                                onClick={() => setLangOpen(!langOpen)}
                                className={styles.langButton}
                                aria-expanded={langOpen}
                            >
                                <Globe size={15} color="#D4AF37" />
                                <span>{language === "en" ? "EN" : "VI"}</span>
                                <ChevronDown
                                    size={14}
                                    color="#D4AF37"
                                    style={{
                                        transform: langOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease",
                                    }}
                                />
                            </button>

                            {langOpen && (
                                <div className={styles.langDropdown}>
                                    <button
                                        type="button"
                                        onClick={() => handleChangeLanguage("en")}
                                        className={`${styles.langOption} ${
                                            language === "en" ? styles.langOptionActive : ""
                                        }`}
                                    >
                                        <span>English (EN)</span>
                                        {language === "en" && <Check size={14} color="#D4AF37" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChangeLanguage("vi")}
                                        className={`${styles.langOption} ${
                                            language === "vi" ? styles.langOptionActive : ""
                                        }`}
                                    >
                                        <span>Tiếng Việt (VI)</span>
                                        {language === "vi" && <Check size={14} color="#D4AF37" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className={styles.mainWorkspace}>
                <div className={styles.telemetryPanel}>
                    <div className={styles.statusPill}>
                        <span className={styles.statusDot} />
                        <span>
                            {language === "en"
                                ? `LIVE NETWORK • ${onlineKiosksCount} OF ${totalKiosksCount} BOUTIQUE STATIONS ONLINE`
                                : `MẠNG LƯỚI TRỰC TUYẾN • ${onlineKiosksCount}/${totalKiosksCount} TRẠM ĐANG HOẠT ĐỘNG`}
                        </span>
                    </div>

                    <h1 className={styles.heroHeading}>{t.heroTitle}</h1>
                    <p className={styles.heroDescription}>{t.heroDesc}</p>

                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiValue} translate="no">
                                21 Maisons
                            </div>
                            <div className={styles.kpiLabel}>{t.kpi1}</div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiValue} translate="no">
                                34 Scents
                            </div>
                            <div className={styles.kpiLabel}>{t.kpi2}</div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiValue} translate="no">
                                0.12 ml
                            </div>
                            <div className={styles.kpiLabel}>{t.kpi3}</div>
                        </div>
                    </div>

                    <div className={styles.architecturePillars}>
                        <div className={styles.pillarItem}>
                            <div className={styles.pillarIconBox}>
                                <Building2 size={17} color="#D4AF37" />
                            </div>
                            <div>
                                <div className={styles.pillarTitle}>{t.pillar1Title}</div>
                                <div className={styles.pillarDesc}>{t.pillar1Desc}</div>
                            </div>
                        </div>

                        <div className={styles.pillarItem}>
                            <div className={styles.pillarIconBox}>
                                <Cpu size={17} color="#34D399" />
                            </div>
                            <div>
                                <div className={styles.pillarTitle}>{t.pillar2Title}</div>
                                <div className={styles.pillarDesc}>{t.pillar2Desc}</div>
                            </div>
                        </div>

                        <div className={styles.pillarItem}>
                            <div className={styles.pillarIconBox}>
                                <Users size={17} color="#F5E6AD" />
                            </div>
                            <div>
                                <div className={styles.pillarTitle}>{t.pillar3Title}</div>
                                <div className={styles.pillarDesc}>{t.pillar3Desc}</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.seedDirectoryCard}>
                        <button
                            type="button"
                            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                            className={styles.seedDirectoryHeaderBtn}
                        >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                                <Sparkles size={13} color="#D4AF37" />
                                <span>{t.seedToggleLabel}</span>
                            </span>
                            <ChevronDown
                                size={15}
                                color="#D4AF37"
                                style={{
                                    transform: showRoleSwitcher ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            />
                        </button>

                        {showRoleSwitcher && (
                            <div className={styles.seedDirectoryList}>
                                {ENTERPRISE_SEED_ACCOUNTS.map((acc) => {
                                    const cleanKey = acc.email.toLowerCase();
                                    const isCurrentlyLocked =
                                        (acc.status === "LOCKED" && !unlockedEmails[cleanKey]) ||
                                        (failedAttempts[cleanKey] || 0) >= 5;

                                    return (
                                        <button
                                            key={acc.email}
                                            type="button"
                                            onClick={() => {
                                                setEmail(acc.email);
                                                setPassword(updatedPasswords[cleanKey] || acc.passwordPlain);
                                                setEmailError("");
                                                setPasswordError("");
                                                setAuthError("");
                                                setAuthSuccess("");
                                            }}
                                            className={`${styles.seedRowBtn} ${
                                                email.toLowerCase() === cleanKey ? styles.seedRowBtnActive : ""
                                            }`}
                                        >
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.45rem",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <strong style={{ color: "#FFF", fontSize: "0.79rem" }}>
                                                        {acc.accountLabel}
                                                    </strong>
                                                    <span
                                                        translate="no"
                                                        style={{
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontSize: "0.69rem",
                                                            color: "#F5E6AD",
                                                        }}
                                                    >
                                                        {acc.email}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: "2px" }}>
                                                    {acc.brandScopeDisplay}
                                                </div>
                                            </div>

                                            <span
                                                translate="no"
                                                style={{
                                                    fontSize: "0.63rem",
                                                    fontWeight: 700,
                                                    fontFamily: "Space Grotesk, monospace",
                                                    padding: "0.22rem 0.55rem",
                                                    borderRadius: "999px",
                                                    whiteSpace: "nowrap",
                                                    background: isCurrentlyLocked
                                                        ? "rgba(248,113,113,0.16)"
                                                        : acc.requires2FA
                                                            ? "rgba(251,191,36,0.16)"
                                                            : "rgba(52,211,153,0.14)",
                                                    border: `1px solid ${
                                                        isCurrentlyLocked
                                                            ? "rgba(248,113,113,0.4)"
                                                            : acc.requires2FA
                                                                ? "rgba(251,191,36,0.4)"
                                                                : "rgba(52,211,153,0.4)"
                                                    }`,
                                                    color: isCurrentlyLocked
                                                        ? "#F87171"
                                                        : acc.requires2FA
                                                            ? "#FBBF24"
                                                            : "#34D399",
                                                }}
                                            >
                                                {isCurrentlyLocked
                                                    ? "SUSPENDED"
                                                    : acc.requires2FA
                                                        ? `${acc.roleCode} • 2FA`
                                                        : acc.roleCode}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <section className={styles.authCardContainer}>
                    <div className={styles.authCard}>
                        <div className={styles.authHeader}>
                            <span className={styles.authEyebrow}>
                                {language === "en" ? "CORPORATE ACCESS PORTAL" : "CỔNG TRUY CẬP DOANH NGHIỆP"}
                            </span>
                            <h2 className={styles.authTitle}>{t.cardTitle}</h2>
                            <p className={styles.authSubtitle}>{t.cardSubtitle}</p>

                            {existingSessionUser && (
                                <div className={styles.activeSessionBanner}>
                                    <div style={{ fontSize: "0.73rem", color: "#E2E8F0" }}>
                                        <span style={{ color: "#34D399", fontWeight: 700 }}>● Signed in as:</span>{" "}
                                        <strong>{existingSessionUser.fullName}</strong> ({existingSessionUser.roleCode})
                                    </div>
                                    <div style={{ display: "flex", gap: "0.4rem" }}>
                                        <button
                                            type="button"
                                            onClick={() => router.push(existingSessionUser.defaultRedirect)}
                                            className={styles.sessionContinueBtn}
                                        >
                                            <LayoutDashboard size={12} />
                                            <span>{language === "en" ? "Continue" : "Vào trang"}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSignOutCurrentSession}
                                            className={styles.sessionSignOutBtn}
                                        >
                                            <LogOut size={12} />
                                            <span>{language === "en" ? "Sign Out" : "Đăng xuất"}</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {requestedRedirect && (
                                <div className={styles.redirectNoticePill}>
                                    {language === "en" ? "Continuing to:" : "Chuyển hướng sau khi đăng nhập:"}{" "}
                                    <strong>{requestedRedirect}</strong>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSignInSubmit} noValidate>
                            <div className={styles.fieldBlock}>
                                <label htmlFor="login-email" className={styles.fieldLabel}>
                                    <span>{t.emailLabel}</span>
                                </label>
                                <div
                                    className={`${styles.inputShell} ${
                                        emailError ? styles.inputShellError : ""
                                    }`}
                                >
                                    <span className={styles.inputIconPrefix}>
                                        <Mail size={17} />
                                    </span>
                                    <input
                                        id="login-email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setEmailError("");
                                            setAuthError("");
                                        }}
                                        placeholder={t.emailPlaceholder}
                                        className={styles.textInput}
                                    />
                                </div>
                                {emailError && (
                                    <p className={styles.fieldErrorMsg} role="alert">
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            <div className={styles.fieldBlock}>
                                <label htmlFor="login-password" className={styles.fieldLabel}>
                                    <span>{t.passwordLabel}</span>
                                </label>
                                <div
                                    className={`${styles.inputShell} ${
                                        passwordError ? styles.inputShellError : ""
                                    }`}
                                >
                                    <span className={styles.inputIconPrefix}>
                                        <Lock size={17} />
                                    </span>
                                    <input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setPasswordError("");
                                            setAuthError("");
                                        }}
                                        placeholder={t.passwordPlaceholder}
                                        className={styles.textInput}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className={styles.eyeToggleBtn}
                                    >
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className={styles.fieldErrorMsg} role="alert">
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            <div className={styles.utilityRow}>
                                <label className={styles.rememberLabel}>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        style={{
                                            accentColor: "#D4AF37",
                                            width: "15px",
                                            height: "15px",
                                        }}
                                    />
                                    <span>{t.rememberMe}</span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setForgotEmail(email || "admin@scentstation.local");
                                        setForgotStep("EMAIL");
                                        setNewPassword("");
                                        setConfirmPassword("");
                                        setShowNewPassword(false);
                                        setForgotError("");
                                        setIsForgotOpen(true);
                                    }}
                                    className={styles.forgotLinkBtn}
                                >
                                    {t.forgotPassword}
                                </button>
                            </div>

                            {authError && (
                                <div className={styles.authErrorAlert} role="alert">
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem" }}>
                                        <AlertOctagon size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                                        <div style={{ flex: 1 }}>
                                            <div>{authError}</div>
                                            {(authError.includes("locked") || authError.includes("khóa")) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cleanKey = email.trim().toLowerCase();
                                                        const nextFail = { ...failedAttempts, [cleanKey]: 0 };
                                                        const nextUnl = { ...unlockedEmails, [cleanKey]: true };
                                                        setFailedAttempts(nextFail);
                                                        setUnlockedEmails(nextUnl);
                                                        persistSecurityState(nextFail, updatedPasswords, nextUnl);
                                                        setAuthError("");
                                                        setAuthSuccess(
                                                            language === "en"
                                                                ? `Administrator Override: Account "${cleanKey}" has been unlocked.`
                                                                : `Quản trị viên đã mở khóa cho tài khoản "${cleanKey}".`
                                                        );
                                                    }}
                                                    className={styles.adminUnlockBtn}
                                                >
                                                    <Unlock size={12} />
                                                    <span>
                                                        {language === "en"
                                                            ? "Unlock Account (Admin Override)"
                                                            : "Mở khóa nhanh (Quyền Super Admin)"}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {authSuccess && (
                                <div className={styles.authSuccessAlert} role="status">
                                    <CheckCircle2
                                        size={15}
                                        style={{
                                            display: "inline",
                                            marginRight: "6px",
                                            verticalAlign: "text-bottom",
                                        }}
                                    />
                                    {authSuccess}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.signInBtn}
                            >
                                <Lock size={15} />
                                <span>{loading ? t.signingInBtn : t.signInBtn}</span>
                            </button>
                        </form>

                        <div className={styles.securityInfoPanel}>
                            <ShieldCheck
                                size={20}
                                color="#34D399"
                                style={{ flexShrink: 0, marginTop: "2px" }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: "0.76rem",
                                        fontWeight: 700,
                                        color: "#F5E6AD",
                                    }}
                                >
                                    {t.securityHeading}
                                </div>
                                <div
                                    style={{
                                        fontSize: "0.69rem",
                                        color: "#94A3B8",
                                        lineHeight: 1.5,
                                        marginTop: "3px",
                                    }}
                                >
                                    {t.securityBody}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {isForgotOpen && (() => {
                const cleanForgot = forgotEmail.trim().toLowerCase();
                const matchedForgotAcc = ENTERPRISE_SEED_ACCOUNTS.find(
                    (a) => a.email.toLowerCase() === cleanForgot
                );
                const isForgotAccLocked =
                    matchedForgotAcc &&
                    ((matchedForgotAcc.status === "LOCKED" && !unlockedEmails[cleanForgot]) ||
                        (failedAttempts[cleanForgot] || 0) >= 5);

                const pwChecks = {
                    len: newPassword.length >= 8,
                    upper: /[A-Z]/.test(newPassword),
                    lower: /[a-z]/.test(newPassword),
                    digit: /[0-9]/.test(newPassword),
                    special: /[^A-Za-z0-9]/.test(newPassword),
                    match: newPassword.length > 0 && newPassword === confirmPassword,
                };

                return (
                    <div className={styles.modalOverlay} onClick={() => setIsForgotOpen(false)}>
                        <div className={styles.recoveryModalCard} onClick={(e) => e.stopPropagation()}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "0.85rem",
                                }}
                            >
                                <div>
                                    <span
                                        translate="no"
                                        style={{
                                            fontSize: "0.65rem",
                                            color: "#D4AF37",
                                            fontWeight: 700,
                                            letterSpacing: "0.14em",
                                            fontFamily: "Space Grotesk, monospace",
                                            display: "block",
                                        }}
                                    >
                                        ACCOUNT CREDENTIAL RECOVERY
                                    </span>
                                    <h3
                                        style={{
                                            margin: "0.18rem 0 0 0",
                                            fontSize: "1.25rem",
                                            color: "#FFF",
                                            fontFamily: "Bodoni Moda, Georgia, serif",
                                            fontWeight: 600,
                                        }}
                                    >
                                        <KeyRound
                                            size={18}
                                            color="#D4AF37"
                                            style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }}
                                        />
                                        {language === "en" ? "Reset Corporate Password" : "Khôi Phục Mật Khẩu"}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsForgotOpen(false)}
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: "8px",
                                        padding: "0.3rem",
                                        color: "#94A3B8",
                                        cursor: "pointer",
                                        display: "flex",
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className={styles.recoveryStepper} translate="no">
                                <div
                                    className={`${styles.recoveryStepPill} ${
                                        forgotStep === "EMAIL"
                                            ? styles.recoveryStepActive
                                            : styles.recoveryStepDone
                                    }`}
                                >
                                    <span>01</span>
                                    <span>VERIFY EMAIL</span>
                                </div>
                                <div
                                    className={`${styles.recoveryStepPill} ${
                                        forgotStep === "NEW_PW"
                                            ? styles.recoveryStepActive
                                            : forgotStep === "SUCCESS"
                                                ? styles.recoveryStepDone
                                                : ""
                                    }`}
                                >
                                    <span>02</span>
                                    <span>NEW PASSWORD</span>
                                </div>
                                <div
                                    className={`${styles.recoveryStepPill} ${
                                        forgotStep === "SUCCESS" ? styles.recoveryStepDone : ""
                                    }`}
                                >
                                    <span>03</span>
                                    <span>COMPLETE</span>
                                </div>
                            </div>

                            {forgotError && (
                                <div className={styles.authErrorAlert}>{forgotError}</div>
                            )}

                            {forgotStep === "EMAIL" && (
                                <form onSubmit={handleForgotPasswordFlow}>
                                    <p style={{ fontSize: "0.8rem", color: "#CBD5E1", lineHeight: 1.5, margin: "0 0 0.75rem 0" }}>
                                        {language === "en"
                                            ? "Enter your registered corporate email address to verify your identity and set a new password:"
                                            : "Nhập địa chỉ email doanh nghiệp đã đăng ký để xác minh danh tính và thiết lập mật khẩu mới:"}
                                    </p>

                                    <div className={styles.quickAccountChips} translate="no">
                                        {ENTERPRISE_SEED_ACCOUNTS.map((acc) => {
                                            const isSelected = acc.email.toLowerCase() === cleanForgot;
                                            return (
                                                <button
                                                    key={acc.email}
                                                    type="button"
                                                    onClick={() => {
                                                        setForgotEmail(acc.email);
                                                        setForgotError("");
                                                    }}
                                                    className={`${styles.quickChipBtn} ${
                                                        isSelected ? styles.quickChipBtnActive : ""
                                                    }`}
                                                >
                                                    {acc.roleCode}: {acc.email.split("@")[0]}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className={styles.inputShell} style={{ marginBottom: "0.75rem" }}>
                                        <span className={styles.inputIconPrefix}>
                                            <Mail size={16} />
                                        </span>
                                        <input
                                            type="email"
                                            required
                                            value={forgotEmail}
                                            onChange={(e) => {
                                                setForgotEmail(e.target.value);
                                                setForgotError("");
                                            }}
                                            className={styles.textInput}
                                            placeholder="admin@scentstation.local"
                                        />
                                    </div>

                                    {matchedForgotAcc && (
                                        <div className={styles.accountPreviewBox}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: "#FFF", fontSize: "0.78rem" }}>
                                                    {matchedForgotAcc.accountLabel}
                                                </div>
                                                <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                                    {matchedForgotAcc.brandScopeDisplay}
                                                </div>
                                            </div>
                                            <span
                                                translate="no"
                                                style={{
                                                    fontSize: "0.64rem",
                                                    fontWeight: 700,
                                                    fontFamily: "Space Grotesk, monospace",
                                                    padding: "0.22rem 0.55rem",
                                                    borderRadius: "999px",
                                                    background: isForgotAccLocked
                                                        ? "rgba(248,113,113,0.16)"
                                                        : "rgba(52,211,153,0.14)",
                                                    border: `1px solid ${
                                                        isForgotAccLocked
                                                            ? "rgba(248,113,113,0.4)"
                                                            : "rgba(52,211,153,0.4)"
                                                    }`,
                                                    color: isForgotAccLocked ? "#F87171" : "#34D399",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {isForgotAccLocked ? "SUSPENDED" : "VERIFIED"}
                                            </span>
                                        </div>
                                    )}

                                    <div className={styles.modalActionStack}>
                                        <button type="submit" className={styles.signInBtn}>
                                            <span>
                                                {language === "en"
                                                    ? "Continue to Password Reset"
                                                    : "Tiếp Tục Đặt Lại Mật Khẩu"}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            )}

                            {forgotStep === "NEW_PW" && (
                                <form onSubmit={handleForgotPasswordFlow}>
                                    <div
                                        style={{
                                            padding: "0.65rem 0.85rem",
                                            borderRadius: "11px",
                                            background: "rgba(52, 211, 153, 0.1)",
                                            border: "1px solid rgba(52, 211, 153, 0.38)",
                                            color: "#34D399",
                                            fontSize: "0.75rem",
                                            lineHeight: 1.45,
                                            marginBottom: "0.85rem",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <span>
                                            ✓ Account verified: <strong>{forgotEmail}</strong>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewPassword("Scent@2026");
                                                setConfirmPassword("Scent@2026");
                                                setForgotError("");
                                            }}
                                            style={{
                                                background: "rgba(212,175,55,0.2)",
                                                border: "1px solid #D4AF37",
                                                color: "#F5E6AD",
                                                borderRadius: "6px",
                                                padding: "0.2rem 0.5rem",
                                                fontSize: "0.66rem",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Fill Strong Password
                                        </button>
                                    </div>

                                    <div className={styles.inputShell} style={{ marginBottom: "0.65rem" }}>
                                        <span className={styles.inputIconPrefix}>
                                            <Lock size={16} />
                                        </span>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setForgotError("");
                                            }}
                                            placeholder={
                                                language === "en"
                                                    ? "Enter new password"
                                                    : "Nhập mật khẩu mới"
                                            }
                                            className={styles.textInput}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className={styles.eyeToggleBtn}
                                            aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>

                                    <div className={styles.inputShell} style={{ marginBottom: "0.85rem" }}>
                                        <span className={styles.inputIconPrefix}>
                                            <Lock size={16} />
                                        </span>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                setForgotError("");
                                            }}
                                            placeholder={
                                                language === "en"
                                                    ? "Confirm new password"
                                                    : "Nhập lại mật khẩu mới"
                                            }
                                            className={styles.textInput}
                                        />
                                    </div>

                                    <div className={styles.pwCriteriaGrid} translate="no">
                                        <div className={`${styles.pwCriteriaItem} ${pwChecks.len ? styles.pwCriteriaPass : ""}`}>
                                            <Check size={12} />
                                            <span>8+ characters</span>
                                        </div>
                                        <div className={`${styles.pwCriteriaItem} ${pwChecks.upper ? styles.pwCriteriaPass : ""}`}>
                                            <Check size={12} />
                                            <span>Uppercase (A-Z)</span>
                                        </div>
                                        <div className={`${styles.pwCriteriaItem} ${pwChecks.lower ? styles.pwCriteriaPass : ""}`}>
                                            <Check size={12} />
                                            <span>Lowercase (a-z)</span>
                                        </div>
                                        <div className={`${styles.pwCriteriaItem} ${pwChecks.digit ? styles.pwCriteriaPass : ""}`}>
                                            <Check size={12} />
                                            <span>Number (0-9)</span>
                                        </div>
                                        <div className={`${styles.pwCriteriaItem} ${pwChecks.special ? styles.pwCriteriaPass : ""}`}>
                                            <Check size={12} />
                                            <span>Special (@#$%!)</span>
                                        </div>
                                        <div className={`${styles.pwCriteriaItem} ${pwChecks.match ? styles.pwCriteriaPass : ""}`}>
                                            <Check size={12} />
                                            <span>Passwords match</span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.6rem" }}>
                                        <button
                                            type="button"
                                            onClick={() => setForgotStep("EMAIL")}
                                            className={styles.secondaryBtn}
                                            style={{ flex: 0.45 }}
                                        >
                                            <span>{language === "en" ? "Back" : "Quay lại"}</span>
                                        </button>
                                        <button type="submit" className={styles.signInBtn} style={{ flex: 1.55 }}>
                                            <Unlock size={16} />
                                            <span>
                                                {language === "en"
                                                    ? "Update Password & Unlock"
                                                    : "Cập Nhật & Mở Khóa"}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            )}

                            {forgotStep === "SUCCESS" && (
                                <div>
                                    <div className={styles.authSuccessAlert}>
                                        <strong>
                                            {language === "en"
                                                ? "✓ Password Updated Successfully"
                                                : "✓ Đã Cập Nhật Mật Khẩu Thành Công"}
                                        </strong>
                                        <div style={{ marginTop: "0.25rem", color: "#E2E8F0" }}>
                                            {language === "en" ? (
                                                <>
                                                    Your new password for <strong>{forgotEmail}</strong> is active and any security lockouts have been cleared.
                                                </>
                                            ) : (
                                                <>
                                                    Mật khẩu mới cho tài khoản <strong>{forgotEmail}</strong> đã có hiệu lực và trạng thái khóa bảo mật đã được gỡ bỏ.
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEmail(forgotEmail);
                                            setPassword(newPassword);
                                            setIsForgotOpen(false);
                                            setAuthSuccess(
                                                language === "en"
                                                    ? "Password updated. You may now sign in with your new credentials."
                                                    : "Đã điền mật khẩu mới. Bạn có thể bấm Đăng nhập ngay."
                                            );
                                        }}
                                        className={styles.signInBtn}
                                    >
                                        <span>
                                            {language === "en"
                                                ? "Return to Sign In"
                                                : "Quay Lại Đăng Nhập"}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {pending2FAUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <span
                            translate="no"
                            style={{
                                fontSize: "0.65rem",
                                color: "#D4AF37",
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                fontFamily: "Space Grotesk, monospace",
                                display: "block",
                                marginBottom: "0.2rem",
                            }}
                        >
                            TWO-FACTOR AUTHENTICATION
                        </span>
                        <h3
                            style={{
                                margin: "0 0 0.45rem 0",
                                fontSize: "1.24rem",
                                color: "#FFF",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                            }}
                        >
                            {language === "en"
                                ? "Security Verification Required"
                                : "Xác Thực Bảo Mật Hai Lớp"}
                        </h3>
                        <p style={{ fontSize: "0.8rem", color: "#CBD5E1", lineHeight: 1.55, margin: 0 }}>
                            {language === "en" ? (
                                <>
                                    Enter the 6-digit verification code for{" "}
                                    <strong>{pending2FAUser.accountLabel}</strong> (Demo code:{" "}
                                    <strong style={{ color: "#F5E6AD" }}>123456</strong>).
                                </>
                            ) : (
                                <>
                                    Nhập mã xác thực gồm 6 chữ số cho tài khoản{" "}
                                    <strong>{pending2FAUser.accountLabel}</strong> (Mã demo:{" "}
                                    <strong style={{ color: "#F5E6AD" }}>123456</strong>).
                                </>
                            )}
                        </p>

                        {otpError && (
                            <div className={styles.authErrorAlert} style={{ marginTop: "0.75rem" }}>
                                {otpError}
                            </div>
                        )}

                        <form onSubmit={handleVerify2FASubmit}>
                            <div className={styles.inputShell} style={{ margin: "1rem 0" }}>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value)}
                                    placeholder="123456"
                                    className={styles.textInput}
                                    style={{
                                        textAlign: "center",
                                        fontSize: "1.25rem",
                                        fontWeight: 700,
                                        letterSpacing: "0.35em",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.65rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setPending2FAUser(null)}
                                    className={styles.secondaryBtn}
                                >
                                    {language === "en" ? "Cancel" : "Hủy"}
                                </button>
                                <button
                                    type="submit"
                                    className={styles.signInBtn}
                                    style={{ width: "auto", padding: "0 1.4rem", height: "42px" }}
                                >
                                    {language === "en" ? "Verify & Continue" : "Xác Thực & Tiếp Tục"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <footer className={styles.footerBar}>
                <div className={styles.footerInner}>
                    <div>
                        <strong>SCENTSTATION</strong> •{" "}
                        {language === "en"
                            ? "Enterprise Identity & Access Governance"
                            : "Hệ Thống Quản Trị Định Danh & Phân Quyền Doanh Nghiệp"}
                    </div>
                    <div className={styles.footerRight}>
                        <span>BCrypt Security</span>
                        <span>•</span>
                        <span>Multi-Tenant Isolation</span>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className={styles.footerLinkBtn}
                        >
                            {t.backToGateway}
                        </button>
                    </div>
                </div>
            </footer>
        </main>
    );
}