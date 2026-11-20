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
    ArrowLeft,
    CheckCircle2,
    AlertOctagon,
    KeyRound,
    RefreshCw,
    Volume2,
    VolumeX,
    Check,
    Unlock,
    ChevronDown,
    Users,
} from "lucide-react";
import "./forgot-password.css";

export type AuthenticatedRoleCode = "PSA" | "BA" | "OM" | "TE" | "IS" | "VW";
export type RecoveryStep = "REQUEST_LINK" | "VERIFY_TOKEN" | "RESET_PASSWORD" | "COMPLETED";

interface SeedAccountDirectoryItem {
    id: number;
    email: string;
    roleCode: AuthenticatedRoleCode;
    accountLabelEn: string;
    accountLabelVi: string;
    brandTenant: string | null;
    scopeEn: string;
    scopeVi: string;
    defaultStatus: "ACTIVE" | "LOCKED";
}

const ENTERPRISE_ACCOUNTS: SeedAccountDirectoryItem[] = [
    {
        id: 1,
        email: "admin@scentstation.local",
        roleCode: "PSA",
        accountLabelEn: "Platform Super Administrator",
        accountLabelVi: "Quản trị viên nền tảng",
        brandTenant: null,
        scopeEn: "Tenants/Brands, platform users, settings & audit",
        scopeVi: "Quản trị thương hiệu, tài khoản nền tảng, cài đặt & audit",
        defaultStatus: "ACTIVE",
    },
    {
        id: 2,
        email: "brand.admin@scentstation.local",
        roleCode: "BA",
        accountLabelEn: "Brand Administrator (Chanel)",
        accountLabelVi: "Quản trị viên thương hiệu (Chanel)",
        brandTenant: "Chanel",
        scopeEn: "Chanel products, slots, staff & reports",
        scopeVi: "Sản phẩm, khoang máy, nhân sự & báo cáo Chanel",
        defaultStatus: "ACTIVE",
    },
    {
        id: 3,
        email: "ops.manager@scentstation.local",
        roleCode: "OM",
        accountLabelEn: "Operations Manager",
        accountLabelVi: "Quản lý vận hành",
        brandTenant: null,
        scopeEn: "Machines, alerts, tickets & reconciliation",
        scopeVi: "Giám sát máy, cảnh báo, điều phối ticket & đối soát đơn",
        defaultStatus: "ACTIVE",
    },
    {
        id: 4,
        email: "tech@scentstation.local",
        roleCode: "TE",
        accountLabelEn: "Technician",
        accountLabelVi: "Kỹ thuật viên",
        brandTenant: null,
        scopeEn: "Assigned tickets, checklist & post-repair test",
        scopeVi: "Ticket được giao, checklist bảo trì & kiểm tra sau sửa",
        defaultStatus: "ACTIVE",
    },
    {
        id: 5,
        email: "inventory@scentstation.local",
        roleCode: "IS",
        accountLabelEn: "Inventory Staff",
        accountLabelVi: "Nhân viên kho",
        brandTenant: null,
        scopeEn: "Batches, bottles, refill/replace & stock check",
        scopeVi: "Quản lý lô, chai, nạp/thay & đối soát tồn kho",
        defaultStatus: "ACTIVE",
    },
    {
        id: 6,
        email: "viewer@scentstation.local",
        roleCode: "VW",
        accountLabelEn: "Viewer",
        accountLabelVi: "Người xem (Chỉ đọc)",
        brandTenant: null,
        scopeEn: "Read-only dashboard & reports",
        scopeVi: "Chỉ xem dashboard và báo cáo trong phạm vi được cấp",
        defaultStatus: "ACTIVE",
    },
    {
        id: 7,
        email: "locked@scentstation.local",
        roleCode: "TE",
        accountLabelEn: "Locked Account (Test)",
        accountLabelVi: "Tài khoản bị khóa (Kiểm thử)",
        brandTenant: null,
        scopeEn: "Locked by security policy",
        scopeVi: "Bị khóa do chính sách bảo mật",
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

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [langOpen, setLangOpen] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [showAccountSwitcher, setShowAccountSwitcher] = useState<boolean>(true);

    const handleChangeLanguage = useCallback((nextLang: "en" | "vi") => {
        setLang(nextLang);
        setLangOpen(false);
        setError("");
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
            window.dispatchEvent(new Event("scentstation-sync"));
        } catch {
            // Ignore
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
                if (savedLang === "vi" || savedLang === "en") setLang(savedLang);
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
            if (emailParam) setEmail(emailParam.trim());
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
                    ? "Recovery token expired. Please request a new one."
                    : "Mã khôi phục đã hết hạn. Vui lòng yêu cầu mã mới."
            );
            setStep("REQUEST_LINK");
            return;
        }
        const timer = setInterval(() => setTokenSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(timer);
    }, [step, tokenSecondsLeft, lang]);

    const matchedAccount = useMemo(
        () => ENTERPRISE_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()) || null,
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
            setError(lang === "en" ? "Please enter your email." : "Vui lòng nhập email.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError(
                lang === "en"
                    ? "Invalid email format (e.g. admin@scentstation.local)."
                    : "Định dạng email không hợp lệ (VD: admin@scentstation.local)."
            );
            return;
        }
        if (!matchedAccount) {
            setError(
                lang === "en"
                    ? `No account found for "${cleanEmail}".`
                    : `Không tìm thấy tài khoản "${cleanEmail}".`
            );
            return;
        }

        setIsProcessing(true);
        await new Promise<void>((resolve) => {
            registerTimeout(() => resolve(), 300);
        });
        if (!isMountedRef.current) return;

        const newToken = `RST-2026-${Math.floor(1000 + Math.random() * 8999)}`;
        setGeneratedToken(newToken);
        setResetToken(newToken);
        setTokenSecondsLeft(300);
        setStep("VERIFY_TOKEN");
        setIsProcessing(false);

        appendAuditLog({
            actor: lang === "en" ? matchedAccount.accountLabelEn : matchedAccount.accountLabelVi,
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
                    ? `Invalid token. Use "${generatedToken}".`
                    : `Mã xác thực không khớp. Nhập đúng mã "${generatedToken}".`
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
                    ? "Password must meet all 6 criteria below."
                    : "Mật khẩu mới cần đáp ứng đủ 6 tiêu chí bên dưới."
            );
            return;
        }

        const cleanEmail = email.trim().toLowerCase();
        setIsProcessing(true);
        await new Promise<void>((resolve) => {
            registerTimeout(() => resolve(), 320);
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
                    localStorage.setItem(ACTIVE_SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
                }
            }
        } catch {
            // Safe fallback
        }

        appendAuditLog({
            actor: matchedAccount
                ? lang === "en"
                    ? matchedAccount.accountLabelEn
                    : matchedAccount.accountLabelVi
                : cleanEmail,
            role: matchedAccount?.roleCode || "USER",
            tenant: matchedAccount?.brandTenant || null,
            action: "PASSWORD_RESET_COMPLETED",
            entityId: cleanEmail,
            severity: "INFO",
            details: { lockoutCleared: true, previousSessionsRevoked: true },
        });

        setIsProcessing(false);
        setStep("COMPLETED");
    };

    const timerPct = Math.round((tokenSecondsLeft / 300) * 100);

    return (
        <main className="fp-viewport notranslate" translate="no" onClick={() => setLangOpen(false)}>
            {/* GIỮ VIDEO NỀN */}
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
                    <div className="fp-brand-block" onClick={() => router.push("/")}>
                        <span className="fp-brand-title" translate="no">
                            ScentStation
                        </span>
                    </div>

                    <div className="fp-header-actions" onClick={(e) => e.stopPropagation()}>
                        <Link href="/login" className="fp-ghost-btn">
                            <ArrowLeft size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "Back to Sign In" : "Về trang đăng nhập"}</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="fp-ghost-btn"
                            title={
                                lang === "en"
                                    ? isMuted
                                        ? "Unmute background audio"
                                        : "Mute background audio"
                                    : isMuted
                                        ? "Bật âm thanh nền"
                                        : "Tắt âm thanh nền"
                            }
                        >
                            {isMuted ? <VolumeX size={15} color="#94A3B8" /> : <Volume2 size={15} color="#D4AF37" />}
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
                                        onClick={() => handleChangeLanguage("vi")}
                                        className={`fp-lang-option ${lang === "vi" ? "fp-lang-option-active" : ""}`}
                                    >
                                        <span>Tiếng Việt (VI)</span>
                                        {lang === "vi" && <Check size={14} color="#D4AF37" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChangeLanguage("en")}
                                        className={`fp-lang-option ${lang === "en" ? "fp-lang-option-active" : ""}`}
                                    >
                                        <span>English (EN)</span>
                                        {lang === "en" && <Check size={14} color="#D4AF37" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="fp-workspace">
                {/* CỘT TRÁI: CHỌN NHANH TÀI KHOẢN */}
                <div className="fp-info-column">
                    <h1 className="fp-hero-title">
                        {lang === "en" ? "Password Recovery" : "Khôi phục mật khẩu"}
                    </h1>

                    <p className="fp-hero-desc">
                        {lang === "en"
                            ? "Resetting your password clears security lockouts and revokes older active sessions."
                            : "Đặt lại mật khẩu sẽ gỡ trạng thái khóa tài khoản và thu hồi các phiên đăng nhập cũ."}
                    </p>

                    <div className="fp-directory-card">
                        <button
                            type="button"
                            onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
                            className="fp-directory-header-btn"
                        >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                                <Users size={14} color="#D4AF37" />
                                <span>
                                    {lang === "en"
                                        ? "Demo Accounts (Click to Autofill)"
                                        : "Tài khoản kiểm thử (Bấm để điền nhanh)"}
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
                                                if (step === "COMPLETED") setStep("REQUEST_LINK");
                                            }}
                                            className={`fp-account-row ${
                                                email.trim().toLowerCase() === cleanKey ? "fp-account-row-active" : ""
                                            }`}
                                        >
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                                                    <strong style={{ color: "#FFF", fontSize: "0.84rem" }}>
                                                        {lang === "en" ? acc.accountLabelEn : acc.accountLabelVi}
                                                    </strong>
                                                    <span style={{ fontSize: "0.75rem", color: "#F5E6AD" }}>
                                                        {acc.email}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: "2px" }}>
                                                    {lang === "en" ? acc.scopeEn : acc.scopeVi}
                                                </div>
                                            </div>

                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
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
                                                    color: isLocked ? "#F87171" : hasCustomPw ? "#F5E6AD" : "#34D399",
                                                }}
                                            >
                                                {isLocked
                                                    ? lang === "en"
                                                        ? "LOCKED"
                                                        : "BỊ KHÓA"
                                                    : hasCustomPw
                                                        ? lang === "en"
                                                            ? "UPDATED"
                                                            : "ĐÃ ĐỔI"
                                                        : acc.roleCode}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI: FORM KHÔI PHỤC 4 BƯỚC */}
                <section className="fp-card-container">
                    <div className="fp-card">
                        <h2 className="fp-card-title">
                            {lang === "en" ? "Reset Password" : "Đặt lại mật khẩu"}
                        </h2>
                        <p className="fp-card-subtitle">
                            {step === "REQUEST_LINK" &&
                                (lang === "en"
                                    ? "Enter your email to generate a 5-minute recovery token."
                                    : "Nhập email để nhận mã xác thực có hiệu lực trong 5 phút.")}
                            {step === "VERIFY_TOKEN" &&
                                (lang === "en"
                                    ? `Confirm the verification token issued for ${email}.`
                                    : `Xác nhận mã khôi phục đã cấp cho ${email}.`)}
                            {step === "RESET_PASSWORD" &&
                                (lang === "en"
                                    ? `Set a new password for ${email}.`
                                    : `Thiết lập mật khẩu mới cho ${email}.`)}
                            {step === "COMPLETED" &&
                                (lang === "en"
                                    ? "Password updated. You can sign in now."
                                    : "Đã cập nhật mật khẩu. Bạn có thể đăng nhập ngay.")}
                        </p>

                        <div className="fp-stepper">
                            <div className={`fp-step-pill ${step === "REQUEST_LINK" ? "fp-step-active" : "fp-step-done"}`}>
                                <span>01</span>
                                <span>{lang === "en" ? "EMAIL" : "EMAIL"}</span>
                            </div>
                            <div className={`fp-step-pill ${step === "VERIFY_TOKEN" ? "fp-step-active" : step === "RESET_PASSWORD" || step === "COMPLETED" ? "fp-step-done" : ""}`}>
                                <span>02</span>
                                <span>{lang === "en" ? "VERIFY" : "XÁC THỰC"}</span>
                            </div>
                            <div className={`fp-step-pill ${step === "RESET_PASSWORD" ? "fp-step-active" : step === "COMPLETED" ? "fp-step-done" : ""}`}>
                                <span>03</span>
                                <span>{lang === "en" ? "PASSWORD" : "MẬT KHẨU"}</span>
                            </div>
                            <div className={`fp-step-pill ${step === "COMPLETED" ? "fp-step-done" : ""}`}>
                                <span>04</span>
                                <span>{lang === "en" ? "DONE" : "XONG"}</span>
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
                                        <span>{lang === "en" ? "Email" : "Email nội bộ"}</span>
                                    </label>
                                    <div className={`fp-input-shell ${error ? "fp-input-error" : ""}`}>
                                        <span className="fp-input-icon">
                                            <Mail size={16} />
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
                                            <div style={{ fontWeight: 700, color: "#FFF", fontSize: "0.84rem" }}>
                                                {lang === "en" ? matchedAccount.accountLabelEn : matchedAccount.accountLabelVi}
                                            </div>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                                                {lang === "en" ? matchedAccount.scopeEn : matchedAccount.scopeVi}
                                            </div>
                                        </div>
                                        <span style={{ color: "#34D399", fontSize: "0.74rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                            ✓ {lang === "en" ? "Valid" : "Hợp lệ"}
                                        </span>
                                    </div>
                                )}

                                <button type="submit" disabled={isProcessing} className="fp-primary-btn">
                                    <KeyRound size={15} />
                                    <span>
                                        {isProcessing
                                            ? lang === "en"
                                                ? "Sending..."
                                                : "Đang gửi..."
                                            : lang === "en"
                                                ? "Send Recovery Token"
                                                : "Gửi mã xác thực"}
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === "VERIFY_TOKEN" && (
                            <form onSubmit={handleVerifyResetToken}>
                                <div className="fp-simulated-email-box">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                                        <strong style={{ color: "#F5E6AD" }}>
                                            {lang === "en" ? "Simulated Email Token" : "Mã xác thực (Mô phỏng)"}
                                        </strong>
                                        <span style={{ color: tokenSecondsLeft <= 60 ? "#F87171" : "#34D399", fontSize: "0.76rem", fontWeight: 700 }}>
                                            {lang === "en" ? `Expires in ${tokenSecondsLeft}s` : `Còn ${tokenSecondsLeft}s`}
                                        </span>
                                    </div>
                                    <div style={{ color: "#CBD5E1" }}>
                                        {lang === "en" ? "Token: " : "Mã xác thực: "}
                                        <code className="fp-token-code">{generatedToken}</code>
                                    </div>
                                    <div className="fp-timer-track">
                                        <div
                                            className="fp-timer-fill"
                                            style={{
                                                width: `${timerPct}%`,
                                                background: tokenSecondsLeft <= 60 ? "#F87171" : "#34D399",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="fp-field-block">
                                    <label htmlFor="fp-token" className="fp-field-label">
                                        <span>{lang === "en" ? "Verification Token" : "Nhập mã xác thực"}</span>
                                    </label>
                                    <div className="fp-input-shell">
                                        <span className="fp-input-icon">
                                            <KeyRound size={16} />
                                        </span>
                                        <input
                                            id="fp-token"
                                            type="text"
                                            value={resetToken}
                                            onChange={(e) => setResetToken(e.target.value)}
                                            className="fp-input"
                                            style={{ fontWeight: 700, letterSpacing: "0.06em" }}
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
                                        <span>{lang === "en" ? "Back" : "Quay lại"}</span>
                                    </button>
                                    <button type="submit" className="fp-primary-btn" style={{ flex: 1.45 }}>
                                        <span>{lang === "en" ? "Verify & Continue" : "Xác nhận & Tiếp tục"}</span>
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === "RESET_PASSWORD" && (
                            <form onSubmit={handleConfirmNewPassword}>
                                <div className="fp-field-block">
                                    <label htmlFor="fp-new-pw" className="fp-field-label">
                                        <span>{lang === "en" ? "New Password" : "Mật khẩu mới"}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewPassword("Scent@2026");
                                                setConfirmPassword("Scent@2026");
                                                setError("");
                                            }}
                                            className="fp-autofill-link"
                                        >
                                            {lang === "en" ? "Autofill Sample" : "Điền mật khẩu mẫu"}
                                        </button>
                                    </label>
                                    <div className="fp-input-shell">
                                        <span className="fp-input-icon">
                                            <Lock size={16} />
                                        </span>
                                        <input
                                            id="fp-new-pw"
                                            type={showNewPw ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setError("");
                                            }}
                                            placeholder={lang === "en" ? "Enter new password" : "Nhập mật khẩu mới"}
                                            className="fp-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPw(!showNewPw)}
                                            className="fp-eye-btn"
                                            aria-label={
                                                lang === "en"
                                                    ? showNewPw
                                                        ? "Hide password"
                                                        : "Show password"
                                                    : showNewPw
                                                        ? "Ẩn mật khẩu"
                                                        : "Hiện mật khẩu"
                                            }
                                        >
                                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="fp-field-block">
                                    <label htmlFor="fp-confirm-pw" className="fp-field-label">
                                        <span>{lang === "en" ? "Confirm Password" : "Xác nhận mật khẩu mới"}</span>
                                    </label>
                                    <div className="fp-input-shell">
                                        <span className="fp-input-icon">
                                            <Lock size={16} />
                                        </span>
                                        <input
                                            id="fp-confirm-pw"
                                            type={showConfirmPw ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                setError("");
                                            }}
                                            placeholder={lang === "en" ? "Re-enter new password" : "Nhập lại mật khẩu mới"}
                                            className="fp-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                                            className="fp-eye-btn"
                                            aria-label={
                                                lang === "en"
                                                    ? showConfirmPw
                                                        ? "Hide password"
                                                        : "Show password"
                                                    : showConfirmPw
                                                        ? "Ẩn mật khẩu"
                                                        : "Hiện mật khẩu"
                                            }
                                        >
                                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="fp-policy-grid">
                                    <div className={`fp-policy-item ${passwordPolicyChecks.minLength ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>{lang === "en" ? "8+ characters" : "Tối thiểu 8 ký tự"}</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.hasUpper ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>{lang === "en" ? "Uppercase (A-Z)" : "Chữ hoa (A-Z)"}</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.hasLower ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>{lang === "en" ? "Lowercase (a-z)" : "Chữ thường (a-z)"}</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.hasDigit ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>{lang === "en" ? "Number (0-9)" : "Chữ số (0-9)"}</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.hasSpecial ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>{lang === "en" ? "Symbol (@#$%!)" : "Ký tự đặc biệt"}</span>
                                    </div>
                                    <div className={`fp-policy-item ${passwordPolicyChecks.matchesConfirm ? "fp-policy-pass" : ""}`}>
                                        <Check size={13} />
                                        <span>{lang === "en" ? "Passwords match" : "Khớp mật khẩu"}</span>
                                    </div>
                                </div>

                                <button type="submit" disabled={isProcessing} className="fp-primary-btn">
                                    <Unlock size={15} />
                                    <span>
                                        {isProcessing
                                            ? lang === "en"
                                                ? "Updating..."
                                                : "Đang cập nhật..."
                                            : lang === "en"
                                                ? "Save & Unlock Account"
                                                : "Lưu & Mở khóa tài khoản"}
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === "COMPLETED" && (
                            <div>
                                <div className="fp-alert-success" role="status">
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                                        <CheckCircle2 size={17} />
                                        <span>{lang === "en" ? "Password Updated" : "Đã cập nhật mật khẩu"}</span>
                                    </div>
                                    <div style={{ color: "#E2E8F0", fontSize: "0.82rem" }}>
                                        {lang === "en"
                                            ? `Account ${email} is unlocked and previous sessions have been revoked.`
                                            : `Tài khoản ${email} đã được mở khóa và các phiên đăng nhập cũ đã bị thu hồi.`}
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
                                        <span>{lang === "en" ? "Go to Sign In" : "Về trang đăng nhập"}</span>
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
                                        <span>{lang === "en" ? "Reset Another" : "Đổi tài khoản khác"}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="fp-card-footer">
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
                                <span>{lang === "en" ? "Return to Sign In" : "Quay lại đăng nhập"}</span>
                            </Link>

                            <Link href="/" style={{ color: "#94A3B8", textDecoration: "none", fontWeight: 500 }}>
                                {lang === "en" ? "Kiosk Network" : "Mạng lưới Kiosk"}
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="fp-footer">
                <div className="fp-footer-inner">
                    <strong>SCENTSTATION</strong>
                    <button type="button" onClick={() => router.push("/login")} className="fp-footer-btn">
                        {lang === "en" ? "Staff Sign In" : "Đăng nhập nội bộ"}
                    </button>
                </div>
            </footer>
        </main>
    );
}