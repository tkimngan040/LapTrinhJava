// noinspection SpellCheckingInspection
"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import styles from "./profile.module.css";
import {
    User,
    Camera,
    RotateCcw,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    Globe,
    Monitor,
    LogOut,
    CheckCircle2,
    Smartphone,
    X,
    KeyRound,
} from "lucide-react";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";
import LuxurySelect from "@/components/ui/LuxurySelect";

interface ActiveSessionRecord {
    id: string;
    device: string;
    browserOs: string;
    estimatedLocation: string;
    ipAddress: string;
    lastActivityIso: string;
    isCurrentSession: boolean;
    status: "ACTIVE" | "TERMINATED";
}

const DEFAULT_AVATAR_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" rx="80" fill="#181D2C"/>
  <circle cx="80" cy="62" r="26" fill="#D4AF37" fill-opacity="0.9"/>
  <path d="M36 136c8-24 26-36 44-36s36 12 44 36" fill="#D4AF37" fill-opacity="0.72"/>
</svg>`);

const INITIAL_SESSIONS: ActiveSessionRecord[] = [
    { id: "SES-2026-001", device: "Windows 11 Workstation (Chrome 131)", browserOs: "Chrome 131 • Windows 11", estimatedLocation: "TP.HCM, Vietnam", ipAddress: "115.78.209.14", lastActivityIso: "2026-11-20 09:05:20", isCurrentSession: true, status: "ACTIVE" },
    { id: "SES-2026-002", device: "iPad Pro 12.9\" (Field Tablet)", browserOs: "Safari • iPadOS 18", estimatedLocation: "Quận 1, TP.HCM", ipAddress: "171.244.18.92", lastActivityIso: "2026-11-19 16:40:12", isCurrentSession: false, status: "ACTIVE" },
    { id: "SES-2026-003", device: "MacBook Pro 14\" M3", browserOs: "Chrome • macOS", estimatedLocation: "Tây Hồ, Hà Nội", ipAddress: "14.162.145.80", lastActivityIso: "2026-11-18 21:15:05", isCurrentSession: false, status: "ACTIVE" },
];

const PROFILE_STORAGE_KEY = "scentstation_profile_account_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function ProfileAccountPage(): React.ReactElement {
    const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [fullName, setFullName] = useState<string>("Lê Hoàng Bách");
    const [phoneNumber, setPhoneNumber] = useState<string>("+84 908 458 999");
    const [emailAddress, setEmailAddress] = useState<string>("admin@scentstation.local");
    const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR_SVG);

    const [nameError, setNameError] = useState<string>("");
    const [phoneError, setPhoneError] = useState<string>("");
    const [profileSuccess, setProfileSuccess] = useState<string>("");

    const [storedCurrentPassword, setStoredCurrentPassword] = useState<string>("Admin@12345");
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showCurrentPw, setShowCurrentPw] = useState<boolean>(false);
    const [showNewPw, setShowNewPw] = useState<boolean>(false);
    const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<string>("");
    const [passwordSuccess, setPasswordSuccess] = useState<string>("");
    const [tokenVersion, setTokenVersion] = useState<number>(4);

    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = useState<boolean>(false);
    const [otpCode, setOtpCode] = useState<string>("");
    const [twoFAError, setTwoFAError] = useState<string>("");

    const [prefTimeZone, setPrefTimeZone] = useState<string>("Asia/Ho_Chi_Minh (GMT+07:00)");
    const [prefDateFormat, setPrefDateFormat] = useState<"YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY">("DD/MM/YYYY");

    const [sessions, setSessions] = useState<ActiveSessionRecord[]>(INITIAL_SESSIONS);
    const [sessionToTerminate, setSessionToTerminate] = useState<ActiveSessionRecord | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const roleConfig = ROLE_PERMISSIONS[currentRole];

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    }, []);

    const loadProfile = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (rawProfile) {
                const p = JSON.parse(rawProfile);
                if (p.fullName) setFullName(p.fullName);
                if (p.phoneNumber) setPhoneNumber(p.phoneNumber);
                if (p.avatarUrl) setAvatarUrl(p.avatarUrl);
                if (p.password) setStoredCurrentPassword(p.password);
                if (typeof p.tokenVersion === "number") setTokenVersion(p.tokenVersion);
                if (typeof p.is2FAEnabled === "boolean") setIs2FAEnabled(p.is2FAEnabled);
                if (p.prefTimeZone) setPrefTimeZone(p.prefTimeZone);
                if (p.prefDateFormat) setPrefDateFormat(p.prefDateFormat);
                if (Array.isArray(p.sessions)) setSessions(p.sessions);
            }

            const rawUser = sessionStorage.getItem("scentstation-user") || localStorage.getItem("scentstation-user");
            if (rawUser) {
                const u = JSON.parse(rawUser);
                setCurrentRole(normalizeRole(u.roleCode || u.role || u.roles?.[0]));
                if (u.email) setEmailAddress(u.email);
                if (u.fullName || u.name) setFullName(u.fullName || u.name);
                if (u.phone) setPhoneNumber(u.phone);
                if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
            }
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadProfile();
        const handleSync = () => loadProfile();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadProfile]);

    const persistProfile = useCallback(
        (overrides: Record<string, unknown>, auditAction?: string) => {
            try {
                const merged = {
                    fullName,
                    phoneNumber,
                    avatarUrl,
                    password: storedCurrentPassword,
                    tokenVersion,
                    is2FAEnabled,
                    prefTimeZone,
                    prefDateFormat,
                    sessions,
                    ...overrides,
                };
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));

                const rawUser = sessionStorage.getItem("scentstation-user") || localStorage.getItem("scentstation-user");
                if (rawUser) {
                    const u = JSON.parse(rawUser);
                    const updatedUser = { ...u, fullName: merged.fullName, name: merged.fullName, phone: merged.phoneNumber, avatarUrl: merged.avatarUrl };
                    sessionStorage.setItem("scentstation-user", JSON.stringify(updatedUser));
                    localStorage.setItem("scentstation-user", JSON.stringify(updatedUser));
                }

                if (auditAction) {
                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const list = rawAudit ? JSON.parse(rawAudit) : [];
                    list.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: new Date().toISOString(),
                        actor: String(merged.fullName),
                        role: currentRole,
                        action: auditAction,
                        entityType: "PROFILE",
                        entityId: emailAddress,
                        sourceIp: "115.78.209.14",
                    });
                    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(list.slice(0, 250)));
                }
                window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        [fullName, phoneNumber, avatarUrl, storedCurrentPassword, tokenVersion, is2FAEnabled, prefTimeZone, prefDateFormat, sessions, currentRole, emailAddress]
    );

    const handleChangeLanguage = (nextLang: "en" | "vi") => {
        setLang(nextLang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
            window.dispatchEvent(new Event("scentstation-sync"));
        } catch {
            // Safe fallback
        }
    };

    const formatDisplayDate = (isoStr: string) => {
        const [datePart, timePart] = isoStr.split(" ");
        if (!datePart) return isoStr;
        const [yyyy, mm, dd] = datePart.split("-");
        if (prefDateFormat === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy} ${timePart}`;
        if (prefDateFormat === "MM/DD/YYYY") return `${mm}/${dd}/${yyyy} ${timePart}`;
        return `${yyyy}-${mm}-${dd} ${timePart}`;
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setAvatarUrl(reader.result);
                persistProfile({ avatarUrl: reader.result }, "AVATAR_UPDATED");
                showToast(lang === "en" ? "Avatar updated." : "Đã cập nhật ảnh đại diện.");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setNameError("");
        setPhoneError("");
        setProfileSuccess("");

        if (fullName.trim().length < 3) {
            setNameError(lang === "en" ? "Name must be at least 3 characters." : "Họ tên phải có ít nhất 3 ký tự.");
            return;
        }
        if (!/^[+0-9\s()-]{9,16}$/.test(phoneNumber.trim())) {
            setPhoneError(lang === "en" ? "Invalid phone number." : "Số điện thoại không hợp lệ.");
            return;
        }
        persistProfile({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() }, "PROFILE_UPDATED");
        setProfileSuccess(lang === "en" ? "Profile saved." : "Đã lưu thông tin hồ sơ.");
        showToast(lang === "en" ? "Profile saved." : "Đã lưu thông tin hồ sơ.");
    };

    const pwCriteria = useMemo(() => ({
        minLength: newPassword.length >= 8,
        hasUpper: /[A-Z]/.test(newPassword),
        hasLower: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    }), [newPassword]);

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");
        if (currentPassword !== storedCurrentPassword) {
            setPasswordError(lang === "en" ? "Current password is incorrect." : "Mật khẩu hiện tại không đúng.");
            return;
        }
        if (!Object.values(pwCriteria).every(Boolean)) {
            setPasswordError(lang === "en" ? "New password does not meet complexity rules." : "Mật khẩu mới chưa đáp ứng đủ 5 tiêu chí.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError(lang === "en" ? "Passwords do not match." : "Mật khẩu xác nhận không khớp.");
            return;
        }
        const nextVer = tokenVersion + 1;
        setStoredCurrentPassword(newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTokenVersion(nextVer);
        persistProfile({ password: newPassword, tokenVersion: nextVer }, "PASSWORD_UPDATED");
        setPasswordSuccess(lang === "en" ? `Password updated (JWT v${nextVer}).` : `Đã đổi mật khẩu (JWT v${nextVer}).`);
        showToast(lang === "en" ? "Password updated." : "Đã cập nhật mật khẩu.");
    };

    const handleVerify2FA = (e: React.FormEvent) => {
        e.preventDefault();
        setTwoFAError("");
        if (!/^\d{6}$/.test(otpCode.trim()) || otpCode.trim() === "000000") {
            setTwoFAError(lang === "en" ? "Enter a valid 6-digit code (e.g. 123456)." : "Vui lòng nhập mã 6 chữ số hợp lệ (VD: 123456).");
            return;
        }
        setIs2FAEnabled(true);
        setIs2FAModalOpen(false);
        setOtpCode("");
        persistProfile({ is2FAEnabled: true }, "2FA_ENABLED");
        showToast(lang === "en" ? "2FA enabled." : "Đã bật xác thực 2 lớp (2FA).");
    };

    const activeSessionCount = useMemo(() => sessions.filter((s) => s.status === "ACTIVE").length, [sessions]);
    const hasRemoteActive = useMemo(() => sessions.some((s) => !s.isCurrentSession && s.status === "ACTIVE"), [sessions]);

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <input type="file" ref={avatarFileInputRef} onChange={handleAvatarUpload} accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} />

            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Profile & Security" : "Hồ sơ & Bảo mật"}</h1>
                        <div className={styles.scopeBadge}>
                            <span>{lang === "en" ? roleConfig.labelEn : roleConfig.labelVi}</span>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button type="button" onClick={() => handleChangeLanguage(lang === "en" ? "vi" : "en")} className={styles.secondaryGoldBtn}>
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>
                    </div>
                </div>

                {/* 4 KPI */}
                <div className={styles.kpiGrid4}>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Account" : "Tài khoản"}</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.2rem" }}>{fullName}</div>
                        <div style={{ fontSize: "0.74rem", color: "#34D399" }}>{emailAddress}</div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Two-Factor (2FA)" : "Bảo mật 2 lớp (2FA)"}</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: is2FAEnabled ? "#34D399" : "#FBBF24", marginTop: "0.2rem" }}>
                            {is2FAEnabled ? (lang === "en" ? "Enabled" : "Đang bật") : (lang === "en" ? "Disabled" : "Đang tắt")}
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Active Sessions" : "Thiết bị đang mở"}</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#38BDF8", marginTop: "0.2rem" }}>{activeSessionCount}</div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>JWT Token</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#F5E6AD", marginTop: "0.2rem" }}>v{tokenVersion}</div>
                    </div>
                </div>
            </div>

            {/* 1. THÔNG TIN CÁ NHÂN + 2. ĐỔI MẬT KHẨU */}
            <div className={styles.mainGrid}>
                <section className={styles.sectionCard}>
                    <div>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}><User size={16} color="#D4AF37" />{lang === "en" ? "Personal Information" : "Thông tin cá nhân"}</h2>
                        </div>

                        <div className={styles.avatarRow}>
                            <div className={styles.avatarWrapper}>
                                <img src={avatarUrl} alt="Avatar" className={styles.avatarImg} />
                                <button type="button" onClick={() => avatarFileInputRef.current?.click()} className={styles.cameraBtn}><Camera size={13} /></button>
                            </div>
                            <div>
                                <div style={{ fontWeight: 700 }}>{fullName}</div>
                                <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>{emailAddress}</div>
                                <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.5rem" }}>
                                    <button type="button" onClick={() => avatarFileInputRef.current?.click()} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.65rem", fontSize: "0.76rem" }}>
                                        <Camera size={12} color="#D4AF37" /><span>{lang === "en" ? "Upload" : "Đổi ảnh"}</span>
                                    </button>
                                    <button type="button" onClick={() => { setAvatarUrl(DEFAULT_AVATAR_SVG); persistProfile({ avatarUrl: DEFAULT_AVATAR_SVG }); }} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.65rem", fontSize: "0.76rem" }}>
                                        <RotateCcw size={12} color="#D4AF37" /><span>{lang === "en" ? "Default" : "Mặc định"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile}>
                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>{lang === "en" ? "Display Name *" : "Tên hiển thị *"}</label>
                                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={styles.textInput} />
                                    {nameError && <span className={styles.fieldError}>{nameError}</span>}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>{lang === "en" ? "Phone *" : "Số điện thoại *"}</label>
                                    <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={styles.textInput} />
                                    {phoneError && <span className={styles.fieldError}>{phoneError}</span>}
                                </div>
                            </div>
                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}><span>Email</span><span className={styles.readOnlyTag}>{lang === "en" ? "Read-Only" : "Chỉ đọc"}</span></label>
                                    <input type="email" value={emailAddress} readOnly disabled className={`${styles.textInput} ${styles.readOnlyInput}`} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}><span>{lang === "en" ? "Role" : "Vai trò"}</span><span className={styles.readOnlyTag}>{lang === "en" ? "Read-Only" : "Chỉ đọc"}</span></label>
                                    <input type="text" value={lang === "en" ? roleConfig.labelEn : roleConfig.labelVi} readOnly disabled className={`${styles.textInput} ${styles.readOnlyInput}`} />
                                </div>
                            </div>
                            {profileSuccess && <div style={{ color: "#34D399", fontSize: "0.8rem", marginBottom: "0.75rem" }}>✓ {profileSuccess}</div>}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button type="submit" className={styles.primaryGoldBtn}><CheckCircle2 size={14} /><span>{lang === "en" ? "Save Profile" : "Lưu hồ sơ"}</span></button>
                            </div>
                        </form>
                    </div>
                </section>

                <section className={styles.sectionCard}>
                    <div>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}><Lock size={16} color="#D4AF37" />{lang === "en" ? "Change Password" : "Đổi mật khẩu"}</h2>
                        </div>

                        <form onSubmit={handleUpdatePassword}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Current Password *" : "Mật khẩu hiện tại *"}</label>
                                <div className={styles.inputWrapper}>
                                    <input type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={styles.textInput} />
                                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className={styles.eyeToggleBtn}>{showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                                </div>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>{lang === "en" ? "New Password *" : "Mật khẩu mới *"}</label>
                                <div className={styles.inputWrapper}>
                                    <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={styles.textInput} />
                                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className={styles.eyeToggleBtn}>{showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.3rem", background: "#0B0D14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "9px", padding: "0.55rem 0.75rem", marginBottom: "0.85rem", fontSize: "0.74rem" }}>
                                <span style={{ color: pwCriteria.minLength ? "#34D399" : "#94A3B8" }}>{pwCriteria.minLength ? "✓" : "○"} {lang === "en" ? "Min 8 chars" : "Tối thiểu 8 ký tự"}</span>
                                <span style={{ color: pwCriteria.hasUpper ? "#34D399" : "#94A3B8" }}>{pwCriteria.hasUpper ? "✓" : "○"} {lang === "en" ? "Uppercase (A–Z)" : "Chữ hoa (A–Z)"}</span>
                                <span style={{ color: pwCriteria.hasLower ? "#34D399" : "#94A3B8" }}>{pwCriteria.hasLower ? "✓" : "○"} {lang === "en" ? "Lowercase (a–z)" : "Chữ thường (a–z)"}</span>
                                <span style={{ color: pwCriteria.hasNumber ? "#34D399" : "#94A3B8" }}>{pwCriteria.hasNumber ? "✓" : "○"} {lang === "en" ? "Number (0–9)" : "Chữ số (0–9)"}</span>
                                <span style={{ color: pwCriteria.hasSpecial ? "#34D399" : "#94A3B8", gridColumn: "span 2" }}>{pwCriteria.hasSpecial ? "✓" : "○"} {lang === "en" ? "Special character (!@#$%)" : "Ký tự đặc biệt (!@#$%)"}</span>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Confirm New Password *" : "Xác nhận mật khẩu mới *"}</label>
                                <div className={styles.inputWrapper}>
                                    <input type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={styles.textInput} />
                                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className={styles.eyeToggleBtn}>{showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                                </div>
                            </div>
                            {passwordError && <div style={{ color: "#F87171", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{passwordError}</div>}
                            {passwordSuccess && <div style={{ color: "#34D399", fontSize: "0.8rem", marginBottom: "0.75rem" }}>✓ {passwordSuccess}</div>}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button type="submit" className={styles.primaryGoldBtn}><KeyRound size={14} /><span>{lang === "en" ? "Update Password" : "Đổi mật khẩu"}</span></button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>

            {/* 3. BẢO MẬT 2 LỚP + 4. TÙY CHỌN HIỂN THỊ */}
            <div className={styles.mainGrid}>
                <section className={styles.sectionCard}>
                    <div>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}><Smartphone size={16} color="#D4AF37" />{lang === "en" ? "Two-Factor Authentication (2FA)" : "Xác thực 2 lớp (2FA)"}</h2>
                            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: is2FAEnabled ? "#34D399" : "#FBBF24" }}>
                                {is2FAEnabled ? (lang === "en" ? "Enabled" : "Đang bật") : (lang === "en" ? "Disabled" : "Đang tắt")}
                            </span>
                        </div>
                        <p style={{ fontSize: "0.84rem", color: "#CBD5E1", marginTop: 0 }}>
                            {is2FAEnabled
                                ? lang === "en" ? "TOTP authenticator app is actively protecting this account." : "Ứng dụng xác thực TOTP đang bảo vệ tài khoản này."
                                : lang === "en" ? "Enable 2FA to protect sensitive actions with a 6-digit code." : "Bật 2FA để bảo vệ các thao tác quản trị bằng mã 6 chữ số."}
                        </p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        {!is2FAEnabled ? (
                            <button type="button" onClick={() => { setTwoFAError(""); setOtpCode(""); setIs2FAModalOpen(true); }} className={styles.primaryGoldBtn}>
                                <ShieldCheck size={14} /><span>{lang === "en" ? "Enable 2FA" : "Bật 2FA"}</span>
                            </button>
                        ) : (
                            <button type="button" onClick={() => { setIs2FAEnabled(false); persistProfile({ is2FAEnabled: false }, "2FA_DISABLED"); showToast(lang === "en" ? "2FA disabled." : "Đã tắt 2FA."); }} className={styles.secondaryGoldBtn}>
                                {lang === "en" ? "Disable 2FA" : "Tắt 2FA"}
                            </button>
                        )}
                    </div>
                </section>

                <section className={styles.sectionCard}>
                    <div>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}><Globe size={16} color="#D4AF37" />{lang === "en" ? "Display Preferences" : "Tùy chọn hiển thị"}</h2>
                        </div>
                        <div className={styles.formGrid2}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Language" : "Ngôn ngữ"}</label>
                                <LuxurySelect
                                    width="100%"
                                    value={lang}
                                    onChange={(v) => handleChangeLanguage(v as "en" | "vi")}
                                    options={[
                                        { value: "vi", label: "Tiếng Việt (VI)" },
                                        { value: "en", label: "English (EN)" },
                                    ]}
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Date Format" : "Định dạng ngày"}</label>
                                <LuxurySelect
                                    width="100%"
                                    value={prefDateFormat}
                                    onChange={(v) => setPrefDateFormat(v as "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY")}
                                    options={[
                                        { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                                        { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                                        { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>{lang === "en" ? "Time Zone" : "Múi giờ"}</label>
                            <LuxurySelect
                                width="100%"
                                value={prefTimeZone}
                                onChange={setPrefTimeZone}
                                options={[
                                    { value: "Asia/Ho_Chi_Minh (GMT+07:00)", label: "Asia/Ho_Chi_Minh (GMT+07:00)" },
                                    { value: "Asia/Singapore (GMT+08:00)", label: "Asia/Singapore (GMT+08:00)" },
                                    { value: "UTC (GMT+00:00)", label: "UTC (GMT+00:00)" },
                                ]}
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => { persistProfile({ prefTimeZone, prefDateFormat }, "PREFERENCES_UPDATED"); showToast(lang === "en" ? "Preferences saved." : "Đã lưu tùy chọn hiển thị."); }} className={styles.primaryGoldBtn}>
                                {lang === "en" ? "Save Preferences" : "Lưu tùy chọn"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* 5. PHIÊN ĐĂNG NHẬP THIẾT BỊ */}
            <section className={styles.tableCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <h2 className={styles.cardTitle}><Monitor size={16} color="#D4AF37" />{lang === "en" ? "Active Device Sessions" : "Phiên đăng nhập thiết bị"}</h2>
                    {hasRemoteActive && (
                        <button
                            type="button"
                            onClick={() => {
                                const next = sessions.map((s) => (s.isCurrentSession ? s : { ...s, status: "TERMINATED" as const }));
                                setSessions(next);
                                persistProfile({ sessions: next }, "REVOKE_ALL_SESSIONS");
                                showToast(lang === "en" ? "Revoked all other sessions." : "Đã đăng xuất tất cả thiết bị khác.");
                            }}
                            className={styles.secondaryGoldBtn}
                            style={{ color: "#F87171" }}
                        >
                            <LogOut size={13} /><span>{lang === "en" ? "Revoke Others" : "Đăng xuất thiết bị khác"}</span>
                        </button>
                    )}
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>{lang === "en" ? "Device" : "Thiết bị"}</th>
                            <th>{lang === "en" ? "Location" : "Vị trí"}</th>
                            <th>IP</th>
                            <th>{lang === "en" ? "Last Activity" : "Hoạt động cuối"}</th>
                            <th>{lang === "en" ? "Status" : "Trạng thái"}</th>
                            <th style={{ textAlign: "right" }}>{lang === "en" ? "Action" : "Thao tác"}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sessions.map((ses) => (
                            <tr key={ses.id}>
                                <td className={styles.tableCell}><strong>{ses.device}</strong><div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{ses.browserOs}</div></td>
                                <td className={styles.tableCell}>{ses.estimatedLocation}</td>
                                <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 700 }}>{ses.ipAddress}</td>
                                <td className={styles.tableCell}>{formatDisplayDate(ses.lastActivityIso)}</td>
                                <td className={styles.tableCell}>
                                        <span style={{ fontSize: "0.74rem", fontWeight: 700, color: ses.isCurrentSession ? "#F5E6AD" : ses.status === "ACTIVE" ? "#34D399" : "#F87171" }}>
                                            {ses.isCurrentSession ? (lang === "en" ? "Current" : "Hiện tại") : ses.status === "ACTIVE" ? (lang === "en" ? "Active" : "Đang mở") : (lang === "en" ? "Revoked" : "Đã thoát")}
                                        </span>
                                </td>
                                <td className={styles.tableCell} style={{ textAlign: "right" }}>
                                    {!ses.isCurrentSession && ses.status === "ACTIVE" ? (
                                        <button type="button" onClick={() => setSessionToTerminate(ses)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.65rem", fontSize: "0.76rem", color: "#F87171" }}>
                                            {lang === "en" ? "Revoke" : "Đăng xuất"}
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: "0.76rem", color: "#64748B" }}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* MODAL BẬT 2FA */}
            {is2FAModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIs2FAModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{lang === "en" ? "Enable 2FA" : "Bật xác thực 2 lớp (2FA)"}</h3>
                            <button type="button" onClick={() => setIs2FAModalOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>
                        <p style={{ fontSize: "0.84rem", color: "#CBD5E1" }}>
                            {lang === "en" ? "Setup key: JBSW-Y3DP-EHPK-3PXP. Enter 6-digit code (demo: 123456):" : "Khóa thiết lập: JBSW-Y3DP-EHPK-3PXP. Nhập mã 6 chữ số (mẫu: 123456):"}
                        </p>
                        {twoFAError && <div style={{ color: "#F87171", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{twoFAError}</div>}
                        <form onSubmit={handleVerify2FA}>
                            <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" className={styles.textInput} style={{ textAlign: "center", letterSpacing: "0.25em", fontSize: "1.1rem", marginBottom: "1rem" }} />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIs2FAModalOpen(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.primaryGoldBtn}>{lang === "en" ? "Verify" : "Xác nhận"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN ĐĂNG XUẤT THIẾT BỊ */}
            {sessionToTerminate && (
                <div className={styles.modalOverlay} onClick={() => setSessionToTerminate(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? "Revoke Session?" : "Đăng xuất thiết bị này?"}</h3>
                        <p style={{ fontSize: "0.86rem", color: "#CBD5E1" }}>{sessionToTerminate.device} ({sessionToTerminate.ipAddress})</p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                            <button type="button" onClick={() => setSessionToTerminate(null)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = sessions.map((s) => (s.id === sessionToTerminate.id ? { ...s, status: "TERMINATED" as const } : s));
                                    setSessions(next);
                                    persistProfile({ sessions: next }, "REVOKE_SESSION");
                                    setSessionToTerminate(null);
                                    showToast(lang === "en" ? "Session revoked." : "Đã đăng xuất thiết bị.");
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                {lang === "en" ? "Confirm" : "Xác nhận"}
                            </button>
                        </div>
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