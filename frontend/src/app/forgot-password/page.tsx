// noinspection SpellCheckingInspection
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    RefreshCw,
    Volume2,
    VolumeX,
    Check,
    Sparkles,
    Unlock,
    ChevronDown,
    Clock,
    ShieldAlert,
    History,
} from "lucide-react";
import "./forgot-password.css";

export type AuthenticatedRoleCode = "PSA" | "BA" | "OM" | "TE" | "IS" | "VW";
export type RecoveryStep = "REQUEST_LINK" | "VERIFY_TOKEN" | "RESET_PASSWORD" | "COMPLETED";

interface SeedAccountDirectoryItem {
    id: number;
    email: string;
    roleCode: AuthenticatedRoleCode;
    accountLabel: string;
    brandTenant: string | null;
    brandScopeDisplay: string;
    defaultStatus: "ACTIVE" | "LOCKED";
}

const ENTERPRISE_ACCOUNTS: SeedAccountDirectoryItem[] = [
    {
        id: 1,
        email: "admin@scentstation.local",
        roleCode: "PSA",
        accountLabel: "Platform Super Administrator",
        brandTenant: null,
        brandScopeDisplay: "Global Platform Governance • All 21 Maisons",
        defaultStatus: "ACTIVE",
    },
    {
        id: 2,
        email: "brand.admin@scentstation.local",
        roleCode: "BA",
        accountLabel: "Chanel Brand Administrator",
        brandTenant: "Chanel",
        brandScopeDisplay: "Chanel Maison Workspace • 2FA Protected",
        defaultStatus: "ACTIVE",
    },
    {
        id: 3,
        email: "ops.manager@scentstation.local",
        roleCode: "OM",
        accountLabel: "Operations Manager",
        brandTenant: null,
        brandScopeDisplay: "Fleet Operations, Alerts & Reconciliation",
        defaultStatus: "ACTIVE",
    },
    {
        id: 4,
        email: "tech@scentstation.local",
        roleCode: "TE",
        accountLabel: "Lead Field Technician",
        brandTenant: null,
        brandScopeDisplay: "Hardware Diagnostics & Calibration",
        defaultStatus: "ACTIVE",
    },
    {
        id: 5,
        email: "inventory@scentstation.local",
        roleCode: "IS",
        accountLabel: "Warehouse & Inventory Specialist",
        brandTenant: null,
        brandScopeDisplay: "Perfume Batches, Bottles & Refills",
        defaultStatus: "ACTIVE",
    },
    {
        id: 6,
        email: "viewer@scentstation.local",
        roleCode: "VW",
        accountLabel: "Executive Analytics Viewer",
        brandTenant: null,
        brandScopeDisplay: "Read-Only Business Intelligence & Reports",
        defaultStatus: "ACTIVE",
    },
    {
        id: 7,
        email: "locked@scentstation.local",
        roleCode: "TE",
        accountLabel: "Field Technician (Suspended)",
        brandTenant: null,
        brandScopeDisplay: "Account Locked Due to Security Policy",
        defaultStatus: "LOCKED",
    },
];

const AUTH_SECURITY_STATE_KEY = "scentstation_auth_security_state_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const ACTIVE_SESSIONS_STORAGE_KEY = "scentstation_active_sessions_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const isMountedRef = useRef<boolean>(true);
    const hasInitRef = useRef<boolean>(false);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const registerTimeout = useCallback((fn: () => void, ms: number) => {
        const t = setTimeout(() => {
            if (isMountedRef.current) fn();
        }, ms);
        timersRef.current.push(t);
        return t;
    }, []);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [langOpen, setLangOpen] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [showAccountSwitcher, setShowAccountSwitcher] = useState<boolean>(true);

    const handleChangeLanguage = useCallback((nextLang: "en" | "vi") => {
        setLang(nextLang);
        setLangOpen(false);
        setError("");
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
        } catch {
            // Ignore storage errors
        }
    }, []);

    const [step, setStep] = useState<RecoveryStep>("REQUEST_LINK");
    const [email, setEmail] = useState<string>("locked@scentstation.local");
    const [resetToken, setResetToken] = useState<string>("");
    const [generatedToken, setGeneratedToken] = useState<string>("RST-2026-8842");
    const [tokenSecondsLeft, setTokenSecondsLeft] = useState<number>(300);

    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showNewPw, setShowNewPw] = useState<boolean>(false);
    const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);

    const [error, setError] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});
    const [updatedPasswords, setUpdatedPasswords] = useState<Record<string, string>>({});
    const [unlockedEmails, setUnlockedEmails] = useState<Record<string, boolean>>({});

    const appendAuditLog = useCallback(
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
                    entityType: "PASSWORD_RECOVERY",
                    entityId: entry.entityId,
                    severity: entry.severity,
                    oldValues: null,
                    newValues: entry.details,
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));
            } catch {
                // Safe fallback
            }
        },
        []
    );

    useEffect(() => {
        isMountedRef.current = true;
        if (typeof window === "undefined") return;

        if (!hasInitRef.current) {
            hasInitRef.current = true;

            try {
                const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLang === "vi" || savedLang === "en") {
                    setLang(savedLang);
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
            const emailParam = params.get("email");
            if (emailParam) {
                setEmail(emailParam.trim());
            }
        }

        return () => {
            isMountedRef.current = false;
            timersRef.current.forEach((t) => clearTimeout(t));
            timersRef.current = [];
        };
    }, []);

    useEffect(() => {
        if (step !== "VERIFY_TOKEN" && step !== "RESET_PASSWORD") return;
        if (tokenSecondsLeft <= 0) {
            setError(
                lang === "en"
                    ? "Your password reset token has expired. Please request a new recovery link."
                    : "Mã liên kết khôi phục mật khẩu đã hết hạn. Vui lòng yêu cầu lại mã mới."
            );
            setStep("REQUEST_LINK");
            return;
        }
        const timer = setInterval(() => {
            setTokenSecondsLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [step, tokenSecondsLeft, lang]);

    const matchedAccount = useMemo(
        () =>
            ENTERPRISE_ACCOUNTS.find(
                (a) => a.email.toLowerCase() === email.trim().toLowerCase()
            ) || null,
        [email]
    );

    const passwordPolicyChecks = useMemo(() => {
        return {
            minLength: newPassword.length >= 8,
            hasUpper: /[A-Z]/.test(newPassword),
            hasLower: /[a-z]/.test(newPassword),
            hasDigit: /[0-9]/.test(newPassword),
            hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
            matchesConfirm: newPassword.length > 0 && newPassword === confirmPassword,
        };
    }, [newPassword, confirmPassword]);

    const isPasswordPolicyValid =
        passwordPolicyChecks.minLength &&
        passwordPolicyChecks.hasUpper &&
        passwordPolicyChecks.hasLower &&
        passwordPolicyChecks.hasDigit &&
        passwordPolicyChecks.hasSpecial &&
        passwordPolicyChecks.matchesConfirm;

    const handleRequestResetLink = async (e: FormEvent) => {
        e.preventDefault();
        if (isProcessing) return;
        setError("");

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
            setError(
                lang === "en"
                    ? "Please enter your corporate email address."
                    : "Vui lòng nhập địa chỉ email doanh nghiệp của bạn."
            );
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError(
                lang === "en"
                    ? "Please enter a valid email address (e.g., admin@scentstation.local)."
                    : "Định dạng email không hợp lệ (VD: admin@scentstation.local)."
            );
            return;
        }

        if (!matchedAccount) {
            setError(
                lang === "en"
                    ? `No registered corporate account found for "${cleanEmail}".`
                    : `Không tìm thấy tài khoản doanh nghiệp "${cleanEmail}" trong hệ thống.`
            );
            return;
        }

        setIsProcessing(true);
        await new Promise<void>((resolve) => {
            registerTimeout(() => resolve(), 350);
        });
        if (!isMountedRef.current) return;

        const newToken = `RST-2026-${Math.floor(1000 + Math.random() * 8999)}`;
        setGeneratedToken(newToken);
        setResetToken(newToken);
        setTokenSecondsLeft(300);
        setStep("VERIFY_TOKEN");
        setIsProcessing(false);

        appendAuditLog({
            actor: matchedAccount.accountLabel,
            role: matchedAccount.roleCode,
            tenant: matchedAccount.brandTenant,
            action: "PASSWORD_RESET_LINK_ISSUED",
            entityId: cleanEmail,
            severity: "INFO",
            details: { resetToken: newToken, ttlSeconds: 300 },
        });
    };

    const handleVerifyResetToken = (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (resetToken.trim().toUpperCase() !== generatedToken.toUpperCase()) {
            setError(
                lang === "en"
                    ? `Invalid verification token. Please use "${generatedToken}" to continue.`
                    : `Mã xác thực không khớp. Vui lòng nhập đúng mã "${generatedToken}".`
            );
            return;
        }

        setStep("RESET_PASSWORD");
    };

    const handleConfirmNewPassword = async (e: FormEvent) => {
        e.preventDefault();
        if (isProcessing) return;
        setError("");

        if (!isPasswordPolicyValid) {
            setError(
                lang === "en"
                    ? "Please ensure your new password meets all security criteria and matches the confirmation field."
                    : "Vui lòng đảm bảo mật khẩu mới đáp ứng đủ 6 tiêu chí bảo mật và khớp với ô xác nhận."
            );
            return;
        }

        const cleanEmail = email.trim().toLowerCase();
        setIsProcessing(true);
        await new Promise<void>((resolve) => {
            registerTimeout(() => resolve(), 380);
        });
        if (!isMountedRef.current) return;

        const nextPasswords = { ...updatedPasswords, [cleanEmail]: newPassword };
        const nextFailures = { ...failedAttempts, [cleanEmail]: 0 };
        const nextUnlocked = { ...unlockedEmails, [cleanEmail]: true };

        setUpdatedPasswords(nextPasswords);
        setFailedAttempts(nextFailures);
        setUnlockedEmails(nextUnlocked);

        try {
            localStorage.setItem(
                AUTH_SECURITY_STATE_KEY,
                JSON.stringify({
                    failedAttempts: nextFailures,
                    updatedPasswords: nextPasswords,
                    unlockedEmails: nextUnlocked,
                })
            );

            const rawSessions = localStorage.getItem(ACTIVE_SESSIONS_STORAGE_KEY);
            if (rawSessions) {
                const parsedSessions = JSON.parse(rawSessions);
                if (Array.isArray(parsedSessions)) {
                    const updatedSessions = parsedSessions.map((s: any) =>
                        s.email?.toLowerCase() === cleanEmail
                            ? { ...s, status: "REVOKED_BY_PASSWORD_RESET", isCurrent: false }
                            : s
                    );
                    localStorage.setItem(
                        ACTIVE_SESSIONS_STORAGE_KEY,
                        JSON.stringify(updatedSessions)
                    );
                }
            }
        } catch {
            // Safe fallback
        }

        appendAuditLog({
            actor: matchedAccount?.accountLabel || cleanEmail,
            role: matchedAccount?.roleCode || "USER",
            tenant: matchedAccount?.brandTenant || null,
            action: "PASSWORD_RESET_COMPLETED",
            entityId: cleanEmail,
            severity: "INFO",
            details: {
                lockoutCleared: true,
                previousSessionsRevoked: true,
            },
        });

        setIsProcessing(false);
        setStep("COMPLETED");
    };

    const timerPct = Math.round((tokenSecondsLeft / 300) * 100);

    return (
        <main
            className="fp-viewport notranslate"
            translate="no"
            onClick={() => setLangOpen(false)}
        >
            <div className="fp-video-stage" aria-hidden="true">
                <video
                    ref={videoRef}
                    className="fp-video-element"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    poster="/login-perfume.png"
                >
                    <source src="/video_1.mp4" type="video/mp4" />
                    <source src="/login-bg.mp4" type="video/mp4" />
                    <source src="/videos/video_1.mp4" type="video/mp4" />
                </video>
                <div className="fp-video-overlay" />
            </div>

            <header className="fp-header">
                <div className="fp-header-inner">
                    <div
                        className="fp-brand-block"
                        onClick={() => router.push("/")}
                    >
                        <span className="fp-brand-title" translate="no">
                            ScentStation
                        </span>
                        <span className="fp-brand-sub">
                            {lang === "en"
                                ? "Haute Parfumerie & Automated Sampling Boutiques"
                                : "Hệ Thống Trải Nghiệm Nước Hoa Tự Động Cao Cấp"}
                        </span>
                    </div>

                    <div
                        className="fp-header-actions"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Link href="/login" className="fp-ghost-btn">
                            <ArrowLeft size={14} color="#D4AF37" />
                            <span>
                                {lang === "en" ? "Back to Sign In" : "Về Trang Đăng Nhập"}
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="fp-ghost-btn"
                            title={isMuted ? "Unmute ambient audio" : "Mute ambient audio"}
                        >
                            {isMuted ? (
                                <VolumeX size={15} color="#94A3B8" />
                            ) : (
                                <Volume2 size={15} color="#D4AF37" />
                            )}
                        </button>

                        <div className="fp-lang-wrapper">
                            <button
                                type="button"
                                onClick={() => setLangOpen(!langOpen)}
                                className="fp-lang-btn"
                                aria-expanded={langOpen}
                            >
                                <Globe size={15} color="#D4AF37" />
                                <span>{lang === "en" ? "EN" : "VI"}</span>
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
                                <div className="fp-lang-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => handleChangeLanguage("en")}
                                        className={`fp-lang-option ${
                                            lang === "en" ? "fp-lang-option-active" : ""
                                        }`}
                                    >
                                        <span>English (EN)</span>
                                        {lang === "en" && <Check size={14} color="#D4AF37" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChangeLanguage("vi")}
                                        className={`fp-lang-option ${
                                            lang === "vi" ? "fp-lang-option-active" : ""
                                        }`}
                                    >
                                        <span>Tiếng Việt (VI)</span>
                                        {lang === "vi" && <Check size={14} color="#D4AF37" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="fp-workspace">
                <div className="fp-info-column">
                    <div className="fp-security-pill">
                        <ShieldCheck size={15} color="#34D399" />
                        <span>
                            {lang === "en"
                                ? "IDENTITY VERIFICATION & ACCOUNT RECOVERY"
                                : "XÁC MINH DANH TÍNH & KHÔI PHỤC TÀI KHOẢN"}
                        </span>
                    </div>

                    <h1 className="fp-hero-title">
                        {lang === "en"
                            ? "Credential Recovery & Lockout Resolution"
                            : "Khôi Phục Mật Khẩu & Mở Khóa Bảo Mật"}
                    </h1>

                    <p className="fp-hero-desc">
                        {lang === "en"
                            ? "Securely restore access to your corporate workspace. Completing the verification process updates your credentials, clears temporary security lockouts, and revokes any older active sessions."
                            : "Khôi phục quyền truy cập an toàn vào không gian làm việc của bạn. Sau khi xác minh hoàn tất, hệ thống sẽ cập nhật mật khẩu mới, gỡ bỏ trạng thái tạm khóa và đăng xuất các phiên cũ."}
                    </p>

                    <div className="fp-pillars-list">
                        <div className="fp-pillar-card">
                            <div className="fp-pillar-icon">
                                <Clock size={17} color="#D4AF37" />
                            </div>
                            <div>
                                <div className="fp-pillar-title">
                                    {lang === "en"
                                        ? "Time-Limited Verification Token"
                                        : "Mã Xác Thực Giới Hạn Thời Gian"}
                                </div>
                                <div className="fp-pillar-desc">
                                    {lang === "en"
                                        ? "One-time recovery links expire automatically after 5 minutes to prevent unauthorized access."
                                        : "Liên kết khôi phục dùng một lần tự động hết hạn sau 5 phút nhằm ngăn chặn truy cập trái phép."}
                                </div>
                            </div>
                        </div>

                        <div className="fp-pillar-card">
                            <div className="fp-pillar-icon">
                                <ShieldAlert size={17} color="#34D399" />
                            </div>
                            <div>
                                <div className="fp-pillar-title">
                                    {lang === "en"
                                        ? "Automated Lockout Resolution"
                                        : "Tự Động Gỡ Khóa Tài Khoản"}
                                </div>
                                <div className="fp-pillar-desc">
                                    {lang === "en"
                                        ? "Resetting your password immediately clears failed login counters and restores active status."
                                        : "Đặt lại mật khẩu sẽ xóa bộ đếm nhập sai và kích hoạt lại tài khoản đang bị tạm đình chỉ."}
                                </div>
                            </div>
                        </div>

                        <div className="fp-pillar-card">
                            <div className="fp-pillar-icon">
                                <History size={17} color="#F5E6AD" />
                            </div>
                            <div>
                                <div className="fp-pillar-title">
                                    {lang === "en"
                                        ? "Instant Session Revocation"
                                        : "Thu Hồi Phiên Đăng Nhập Cũ"}
                                </div>
                                <div className="fp-pillar-desc">
                                    {lang === "en"
                                        ? "All previous browser sessions tied to the account are invalidated upon password update."
                                        : "Mọi phiên đăng nhập trước đó trên các thiết bị khác đều bị vô hiệu hóa ngay khi đổi mật khẩu."}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="fp-directory-card">
                        <button
                            type="button"
                            onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
                            className="fp-directory-header-btn"
                        >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                                <Sparkles size={13} color="#D4AF37" />
                                <span>
                                    {lang === "en"
                                        ? "Demo Account Selector (Quick Autofill)"
                                        : "Chọn Nhanh Tài Khoản Demo Cần Khôi Phục"}
                                </span>
                            </span>
                            <ChevronDown
                                size={15}
                                color="#D4AF37"
                                style={{
                                    transform: showAccountSwitcher ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            />
                        </button>

                        {showAccountSwitcher && (
                            <div className="fp-directory-list">
                                {ENTERPRISE_ACCOUNTS.map((acc) => {
                                    const cleanKey = acc.email.toLowerCase();
                                    const isLocked =
                                        (acc.defaultStatus === "LOCKED" && !unlockedEmails[cleanKey]) ||
                                        (failedAttempts[cleanKey] || 0) >= 5;
                                    const hasCustomPw = Boolean(updatedPasswords[cleanKey]);

                                    return (
                                        <button
                                            key={acc.email}
                                            type="button"
                                            onClick={() => {
                                                setEmail(acc.email);
                                                setError("");
                                                if (step === "COMPLETED") {
                                                    setStep("REQUEST_LINK");
                                                }
                                            }}
                                            className={`fp-account-row ${
                                                email.trim().toLowerCase() === cleanKey ? "fp-account-row-active" : ""
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
                                                    background: isLocked
                                                        ? "rgba(248,113,113,0.16)"
                                                        : hasCustomPw
                                                            ? "rgba(212,175,55,0.2)"
                                                            : "rgba(52,211,153,0.14)",
                                                    border: `1px solid ${
                                                        isLocked
                                                            ? "rgba(248,113,113,0.4)"
                                                            : hasCustomPw
                                                                ? "rgba(212,175,55,0.45)"
                                                                : "rgba(52,211,153,0.4)"
                                                    }`,
                                                    color: isLocked
                                                        ? "#F87171"
                                                        : hasCustomPw
                                                            ? "#F5E6AD"
                                                            : "#34D399",
                                                }}
                                            >
                                                {isLocked
                                                    ? "SUSPENDED"
                                                    : hasCustomPw
                                                        ? "UPDATED"
                                                        : acc.roleCode}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <section className="fp-card-container">
                    <div className="fp-card">
                        <span className="fp-card-eyebrow">
                            {lang === "en" ? "ACCOUNT RECOVERY PORTAL" : "CỔNG KHÔI PHỤC TÀI KHOẢN"}
                        </span>

                        <h2 className="fp-card-title">
                            {lang === "en" ? "Reset Corporate Password" : "Đặt Lại Mật Khẩu"}
                        </h2>
                        <p className="fp-card-subtitle">
                            {step === "REQUEST_LINK" &&
                                (lang === "en"
                                    ? "Enter your registered corporate email address to receive a one-time recovery token."
                                    : "Nhập địa chỉ email doanh nghiệp đã đăng ký để nhận mã xác thực khôi phục mật khẩu.")}
                            {step === "VERIFY_TOKEN" &&
                                (lang === "en"
                                    ? `A time-limited verification token has been issued for ${email}. Confirm the token below to continue.`
                                    : `Mã xác thực có thời hạn đã được cấp cho ${email}. Vui lòng xác nhận mã bên dưới để tiếp tục.`)}
                            {step === "RESET_PASSWORD" &&
                                (lang === "en"
                                    ? `Create a strong new password for ${email} (${matchedAccount?.accountLabel || "Account"}).`
                                    : `Thiết lập mật khẩu mới đạt chuẩn bảo mật cho ${email} (${matchedAccount?.accountLabel || "Tài khoản"}).`)}
                            {step === "COMPLETED" &&
                                (lang === "en"
                                    ? "Your password has been updated and your account is ready for sign-in."
                                    : "Mật khẩu của bạn đã được cập nhật và tài khoản đã sẵn sàng đăng nhập.")}
                        </p>

                        <div className="fp-stepper" translate="no">
                            <div
                                className={`fp-step-pill ${
                                    step === "REQUEST_LINK" ? "fp-step-active" : "fp-step-done"
                                }`}
                            >
                                <span>01</span>
                                <span>EMAIL</span>
                            </div>
                            <div
                                className={`fp-step-pill ${
                                    step === "VERIFY_TOKEN"
                                        ? "fp-step-active"
                                        : step === "RESET_PASSWORD" || step === "COMPLETED"
                                            ? "fp-step-done"
                                            : ""
                                }`}
                            >
                                <span>02</span>
                                <span>VERIFY</span>
                            </div>
                            <div
                                className={`fp-step-pill ${
                                    step === "RESET_PASSWORD"
                                        ? "fp-step-active"
                                        : step === "COMPLETED"
                                            ? "fp-step-done"
                                            : ""
                                }`}
                            >
                                <span>03</span>
                                <span>PASSWORD</span>
                            </div>
                            <div
                                className={`fp-step-pill ${
                                    step === "COMPLETED" ? "fp-step-done" : ""
                                }`}
                            >
                                <span>04</span>
                                <span>DONE</span>
                            </div>
                        </div>

                        {error && (
                            <div className="fp-alert-error" role="alert">
                                <AlertOctagon size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                                <span>{error}</span>
                            </div>
                        )}

                        {step === "REQUEST_LINK" && (
                            <form onSubmit={handleRequestResetLink} noValidate>
                                <div className="fp-field-block">
                                    <label htmlFor="fp-email" className="fp-field-label">
                                        <span>
                                            {lang === "en" ? "Corporate Email Address" : "Địa Chỉ Email Doanh Nghiệp"}
                                        </span>
                                    </label>
                                    <div className={`fp-input-shell ${error ? "fp-input-error" : ""}`}>
                                        <span className="fp-input-icon">
                                            <Mail size={17} />
                                        </span>
                                        <input
                                            id="fp-email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError("");
                                            }}
                                            placeholder="name@scentstation.local"
                                            className="fp-input"
                                        />
                                    </div>
                                </div>

                                {matchedAccount && (
                                    <div className="fp-matched-badge">
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#FFF", fontSize: "0.78rem" }}>
                                                {matchedAccount.accountLabel}
                                            </div>
                                            <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                                {matchedAccount.brandScopeDisplay}
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                color: "#34D399",
                                                fontFamily: "Space Grotesk, monospace",
                                                fontSize: "0.68rem",
                                                fontWeight: 700,
                                            }}
                                        >
                                            ✓ {lang === "en" ? "Verified Account" : "Tài khoản hợp lệ"}
                                        </span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="fp-primary-btn"
                                >
                                    <KeyRound size={16} />
                                    <span>
                                        {isProcessing
                                            ? lang === "en"
                                                ? "Sending Verification Token..."
                                                : "Đang gửi mã xác thực..."
                                            : lang === "en"
                                                ? "Send Recovery Token"
                                                : "Gửi Mã Xác Thực Khôi Phục"}
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === "VERIFY_TOKEN" && (
                            <form onSubmit={handleVerifyResetToken}>
                                <div className="fp-simulated-email-box">
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "0.35rem",
                                        }}
                                    >
                                        <strong style={{ color: "#F5E6AD", fontFamily: "Space Grotesk, monospace" }}>
                                            {lang === "en"
                                                ? "✉ Security Dispatch Notification"
                                                : "✉ Thông Báo Mã Khôi Phục Bảo Mật"}
                                        </strong>
                                        <span
                                            style={{
                                                color: tokenSecondsLeft <= 60 ? "#F87171" : "#34D399",
                                                fontFamily: "Space Grotesk, monospace",
                                                fontSize: "0.7rem",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {lang === "en"
                                                ? `Expires in ${tokenSecondsLeft}s`
                                                : `Còn ${tokenSecondsLeft}s`}
                                        </span>
                                    </div>
                                    <div style={{ color: "#CBD5E1", fontSize: "0.75rem" }}>
                                        {lang === "en" ? "Issued for: " : "Cấp cho: "}
                                        <strong>{email}</strong> ({matchedAccount?.accountLabel})
                                    </div>
                                    <div style={{ color: "#CBD5E1", marginTop: "4px", fontSize: "0.75rem" }}>
                                        {lang === "en" ? "Verification Token: " : "Mã xác thực: "}
                                        <code className="fp-token-code">{generatedToken}</code>
                                    </div>
                                    <div className="fp-timer-track">
                                        <div
                                            className="fp-timer-fill"
                                            style={{
                                                width: `${timerPct}%`,
                                                background:
                                                    tokenSecondsLeft <= 60
                                                        ? "#F87171"
                                                        : "linear-gradient(90deg, #D4AF37, #34D399)",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="fp-field-block">
                                    <label htmlFor="fp-token" className="fp-field-label">
                                        <span>
                                            {lang === "en" ? "Recovery Verification Token" : "Mã Xác Thực Khôi Phục"}
                                        </span>
                                    </label>
                                    <div className="fp-input-shell">
                                        <span className="fp-input-icon">
                                            <KeyRound size={17} />
                                        </span>
                                        <input
                                            id="fp-token"
                                            type="text"
                                            value={resetToken}
                                            onChange={(e) => setResetToken(e.target.value)}
                                            className="fp-input"
                                            style={{
                                                fontFamily: "Space Grotesk, monospace",
                                                fontWeight: 700,
                                                letterSpacing: "0.08em",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "0.6rem" }}>
                                    <button
                                        type="button"
                                        onClick={() => setStep("REQUEST_LINK")}
                                        className="fp-ghost-btn"
                                        style={{ flex: 0.55 }}
                                    >
                                        <span>{lang === "en" ? "Change Email" : "Đổi Email"}</span>
                                    </button>
                                    <button type="submit" className="fp-primary-btn" style={{ flex: 1.45 }}>
                                        <Sparkles size={16} />
                                        <span>
                                            {lang === "en"
                                                ? "Verify Token & Continue"
                                                : "Xác Nhận Mã & Tiếp Tục"}
                                        </span>
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === "RESET_PASSWORD" && (
                            <form onSubmit={handleConfirmNewPassword}>
                                <div className="fp-field-block">
                                    <label htmlFor="fp-new-pw" className="fp-field-label">
                                        <span>{lang === "en" ? "New Password" : "Mật Khẩu Mới"}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewPassword("Scent@2026");
                                                setConfirmPassword("Scent@2026");
                                                setError("");
                                            }}
                                            className="fp-autofill-link"
                                        >
                                            {lang === "en"
                                                ? "Fill Strong Password"
                                                : "Điền nhanh mật khẩu chuẩn"}
                                        </button>
                                    </label>
                                    <div className="fp-input-shell">
                                        <span className="fp-input-icon">
                                            <Lock size={17} />
                                        </span>
                                        <input
                                            id="fp-new-pw"
                                            type={showNewPw ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setError("");
                                            }}
                                            placeholder={
                                                lang === "en"
                                                    ? "Enter new password"
                                                    : "Nhập mật khẩu mới"
                                            }
                                            className="fp-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPw(!showNewPw)}
                                            className="fp-eye-btn"
                                            aria-label={showNewPw ? "Hide password" : "Show password"}
                                        >
                                            {showNewPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="fp-field-block">
                                    <label htmlFor="fp-confirm-pw" className="fp-field-label">
                                        <span>
                                            {lang === "en" ? "Confirm New Password" : "Xác Nhận Mật Khẩu Mới"}
                                        </span>
                                    </label>
                                    <div className="fp-input-shell">
                                        <span className="fp-input-icon">
                                            <Lock size={17} />
                                        </span>
                                        <input
                                            id="fp-confirm-pw"
                                            type={showConfirmPw ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                setError("");
                                            }}
                                            placeholder={
                                                lang === "en"
                                                    ? "Re-enter new password"
                                                    : "Nhập lại mật khẩu mới"
                                            }
                                            className="fp-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                                            className="fp-eye-btn"
                                            aria-label={showConfirmPw ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="fp-policy-grid" translate="no">
                                    <div className={`fp-policy-item ${passwordPolicyChecks.minLength ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>8+ characters</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.hasUpper ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>Uppercase (A-Z)</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.hasLower ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>Lowercase (a-z)</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.hasDigit ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>Number (0-9)</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.hasSpecial ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>Special (@#$%!)</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.matchesConfirm ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>Passwords match</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="fp-primary-btn"
                                >
                                    <Unlock size={16} />
                                    <span>
                                        {isProcessing
                                            ? lang === "en"
                                                ? "Updating Credentials..."
                                                : "Đang cập nhật mật khẩu..."
                                            : lang === "en"
                                                ? "Update Password & Unlock Account"
                                                : "Cập Nhật Mật Khẩu & Mở Khóa"}
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === "COMPLETED" && (
                            <div>
                                <div className="fp-alert-success" role="status">
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                        }}
                                    >
                                        <CheckCircle2 size={18} />
                                        <span>
                                            {lang === "en"
                                                ? "Password Updated & Account Unlocked"
                                                : "Đã Cập Nhật Mật Khẩu & Mở Khóa Tài Khoản"}
                                        </span>
                                    </div>
                                    <div style={{ color: "#E2E8F0", fontSize: "0.76rem" }}>
                                        {lang === "en" ? (
                                            <>
                                                Credentials for <strong>{email}</strong> (
                                                {matchedAccount?.accountLabel}) have been updated, security lockouts have been cleared, and previous sessions have been revoked.
                                            </>
                                        ) : (
                                            <>
                                                Mật khẩu mới cho tài khoản <strong>{email}</strong> (
                                                {matchedAccount?.accountLabel}) đã có hiệu lực, trạng thái khóa bảo mật đã được gỡ bỏ và các phiên cũ đã được thu hồi.
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        onClick={() => router.push("/login")}
                                        className="fp-primary-btn"
                                        style={{ flex: 1.4 }}
                                    >
                                        <Lock size={15} />
                                        <span>
                                            {lang === "en"
                                                ? "Continue to Sign In"
                                                : "Quay Về Đăng Nhập Ngay"}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep("REQUEST_LINK");
                                            setNewPassword("");
                                            setConfirmPassword("");
                                        }}
                                        className="fp-ghost-btn"
                                        style={{ flex: 0.6 }}
                                    >
                                        <RefreshCw size={14} />
                                        <span>{lang === "en" ? "Reset Another" : "Khôi Phục Khác"}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="fp-divider">
                            <div className="fp-divider-line" />
                            <span
                                style={{
                                    color: "#D4AF37",
                                    fontSize: "0.68rem",
                                    fontFamily: "Space Grotesk, monospace",
                                    letterSpacing: "0.12em",
                                }}
                            >
                                ✦ ENTERPRISE SECURITY
                            </span>
                            <div className="fp-divider-line" />
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "0.78rem",
                            }}
                        >
                            <Link
                                href="/login"
                                style={{
                                    color: "#F5E6AD",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <ArrowLeft size={14} color="#D4AF37" />
                                <span>
                                    {lang === "en" ? "Return to Sign In" : "Quay lại Đăng nhập"}
                                </span>
                            </Link>

                            <Link
                                href="/"
                                style={{
                                    color: "#94A3B8",
                                    textDecoration: "none",
                                    fontWeight: 500,
                                }}
                            >
                                {lang === "en" ? "Flagship Storefront" : "Trang chủ Trải nghiệm"}
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="fp-footer">
                <div className="fp-footer-inner">
                    <div>
                        <strong>SCENTSTATION</strong> •{" "}
                        {lang === "en"
                            ? "Enterprise Credential Recovery & Session Governance"
                            : "Hệ Thống Khôi Phục Tài Khoản & Quản Trị Phiên Bảo Mật"}
                    </div>
                    <div className="fp-footer-links">
                        <span>One-Time Token Verification</span>
                        <span>•</span>
                        <span>Automated Session Revocation</span>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="fp-footer-btn"
                        >
                            {lang === "en" ? "Partner Sign In" : "Cổng Đăng Nhập"}
                        </button>
                    </div>
                </div>
            </footer>
        </main>
    );
}