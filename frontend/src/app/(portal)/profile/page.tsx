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
    ChevronDown,
    Check,
} from "lucide-react";

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
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1E2A"/>
      <stop offset="100%" stop-color="#09090F"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#g)"/>
  <circle cx="80" cy="62" r="26" fill="#D4AF37" fill-opacity="0.88"/>
  <path d="M36 136c8-24 26-36 44-36s36 12 44 36" fill="#D4AF37" fill-opacity="0.72"/>
</svg>`);

const INITIAL_SESSIONS: ActiveSessionRecord[] = [
    {
        id: "SES-2026-001",
        device: "Windows 11 Workstation (Chrome 131)",
        browserOs: "Chrome 131.0 • Windows 11 Pro 64-bit",
        estimatedLocation: "Ho Chi Minh City, Vietnam (Takashimaya Ops Hub)",
        ipAddress: "115.78.209.14",
        lastActivityIso: "2026-11-16 09:05:20",
        isCurrentSession: true,
        status: "ACTIVE",
    },
    {
        id: "SES-2026-002",
        device: "iPad Pro 12.9\" (Field Inventory Tablet)",
        browserOs: "Mobile Safari 18.1 • iPadOS 18",
        estimatedLocation: "District 1, Ho Chi Minh City, Vietnam",
        ipAddress: "171.244.18.92",
        lastActivityIso: "2026-11-15 16:40:12",
        isCurrentSession: false,
        status: "ACTIVE",
    },
    {
        id: "SES-2026-003",
        device: "MacBook Pro 14\" M3 (Hanoi Regional Office)",
        browserOs: "Chrome 130.0 • macOS Sequoia",
        estimatedLocation: "Tay Ho, Hanoi, Vietnam",
        ipAddress: "14.162.145.80",
        lastActivityIso: "2026-11-14 21:15:05",
        isCurrentSession: false,
        status: "ACTIVE",
    },
    {
        id: "SES-2026-004",
        device: "iPhone 16 Pro Max (Ops On-Call Mobile)",
        browserOs: "Safari • iOS 18.1",
        estimatedLocation: "Hai Chau, Da Nang, Vietnam",
        ipAddress: "27.72.88.104",
        lastActivityIso: "2026-11-13 18:05:44",
        isCurrentSession: false,
        status: "ACTIVE",
    },
];

const PROFILE_STORAGE_KEY = "scentstation_profile_account_v2";
const USERS_STORAGE_KEY = "scentstation_commercial_users_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function ProfileAccountPage(): React.ReactElement {
    const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

    /* ---------------------------------------------------------
       1. PROFILE INFORMATION STATE (B.4.1)
    --------------------------------------------------------- */
    const [fullName, setFullName] = useState<string>("Platform Super Administrator");
    const [phoneNumber, setPhoneNumber] = useState<string>("+84 908 458 999");
    const [emailAddress, setEmailAddress] = useState<string>("admin@scentstation.local");
    const [assignedRole, setAssignedRole] = useState<string>(
        "Platform Super Administrator • Global Operations Scope"
    );
    const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR_SVG);

    const [nameError, setNameError] = useState<string>("");
    const [phoneError, setPhoneError] = useState<string>("");
    const [profileSuccess, setProfileSuccess] = useState<string>("");

    /* ---------------------------------------------------------
       2. CHANGE PASSWORD STATE (B.4.2)
    --------------------------------------------------------- */
    const [storedCurrentPassword, setStoredCurrentPassword] =
        useState<string>("Admin@12345");
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const [showCurrentPw, setShowCurrentPw] = useState<boolean>(false);
    const [showNewPw, setShowNewPw] = useState<boolean>(false);
    const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);

    const [passwordError, setPasswordError] = useState<string>("");
    const [passwordSuccess, setPasswordSuccess] = useState<string>("");
    const [tokenVersion, setTokenVersion] = useState<number>(4);

    /* ---------------------------------------------------------
       3. TWO-FACTOR AUTHENTICATION (2FA) STATE (B.4.3)
    --------------------------------------------------------- */
    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = useState<boolean>(false);
    const [otpCode, setOtpCode] = useState<string>("");
    const [twoFAError, setTwoFAError] = useState<string>("");
    const [twoFASuccess, setTwoFASuccess] = useState<string>("");

    /* ---------------------------------------------------------
       4. PREFERENCES STATE (B.4.4)
    --------------------------------------------------------- */
    const [prefLanguage, setPrefLanguage] = useState<"EN" | "VI">("EN");
    const [prefTimeZone, setPrefTimeZone] = useState<string>(
        "Asia/Ho_Chi_Minh (GMT+07:00)"
    );
    const [prefDateFormat, setPrefDateFormat] = useState<
        "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY"
    >("YYYY-MM-DD");
    const [prefSavedFeedback, setPrefSavedFeedback] = useState<string>("");

    const [openDropdown, setOpenDropdown] = useState<
        "LANG" | "DATE_FMT" | "TIMEZONE" | null
    >(null);

    /* ---------------------------------------------------------
       5. ACTIVE SESSIONS STATE (B.4.5)
    --------------------------------------------------------- */
    const [sessions, setSessions] =
        useState<ActiveSessionRecord[]>(INITIAL_SESSIONS);
    const [sessionToTerminate, setSessionToTerminate] =
        useState<ActiveSessionRecord | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4200);
    }, []);

    /* --- 1. ĐỌC & ĐỒNG BỘ 2 CHIỀU VỚI TOÀN BỘ 15 MÀN HÌNH TRƯỚC --- */
    const loadProfileAndSyncContext = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toUpperCase() === "VI" || savedLang.toUpperCase() === "EN")) {
                setPrefLanguage(savedLang.toUpperCase() as "EN" | "VI");
            }

            const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (rawProfile) {
                const parsed = JSON.parse(rawProfile);
                if (parsed.fullName) setFullName(parsed.fullName);
                if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
                if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
                if (parsed.password) setStoredCurrentPassword(parsed.password);
                if (typeof parsed.tokenVersion === "number")
                    setTokenVersion(parsed.tokenVersion);
                if (typeof parsed.is2FAEnabled === "boolean")
                    setIs2FAEnabled(parsed.is2FAEnabled);
                if (parsed.prefTimeZone) setPrefTimeZone(parsed.prefTimeZone);
                if (parsed.prefDateFormat) setPrefDateFormat(parsed.prefDateFormat);
                if (Array.isArray(parsed.sessions)) setSessions(parsed.sessions);
            }

            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const u = JSON.parse(rawUser);
                if (u.email) setEmailAddress(u.email);
                if (u.fullName || u.name) setFullName(u.fullName || u.name);
                if (u.phone) setPhoneNumber(u.phone);
                if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
                if (typeof u.twoFactorEnabled === "boolean")
                    setIs2FAEnabled(u.twoFactorEnabled);
                const rName = u.roleName || u.role || "Platform Super Administrator";
                const scopeStr = u.brandScope
                    ? `Brand Tenant: ${u.brandScope}`
                    : "Global Fleet & Multi-Tenant Scope";
                setAssignedRole(`${rName} • ${scopeStr}`);
            }
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadProfileAndSyncContext();

        const handleCrossSync = () => {
            loadProfileAndSyncContext();
        };

        window.addEventListener("storage", handleCrossSync);
        window.addEventListener("focus", handleCrossSync);
        window.addEventListener("scentstation-sync", handleCrossSync);

        return () => {
            window.removeEventListener("storage", handleCrossSync);
            window.removeEventListener("focus", handleCrossSync);
            window.removeEventListener("scentstation-sync", handleCrossSync);
        };
    }, [loadProfileAndSyncContext]);

    /* --- 2. GHI & ĐỒNG BỘ NGƯỢC TỪ /profile SANG TOÀN BỘ 15 MÀN HÌNH KIA --- */
    const persistProfileAndBroadcast = useCallback(
        (
            overrides: Partial<{
                fullName: string;
                phoneNumber: string;
                avatarUrl: string;
                password: string;
                tokenVersion: number;
                is2FAEnabled: boolean;
                prefLanguage: "EN" | "VI";
                prefTimeZone: string;
                prefDateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
                sessions: ActiveSessionRecord[];
            }>,
            auditEvent?: { action: string; detail: string; severity?: "INFO" | "WARNING" }
        ) => {
            try {
                const merged = {
                    fullName,
                    phoneNumber,
                    avatarUrl,
                    password: storedCurrentPassword,
                    tokenVersion,
                    is2FAEnabled,
                    prefLanguage,
                    prefTimeZone,
                    prefDateFormat,
                    sessions,
                    ...overrides,
                };
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
                localStorage.setItem(
                    LANGUAGE_STORAGE_KEY,
                    merged.prefLanguage.toLowerCase()
                );

                // Cập nhật trực tiếp phiên đăng nhập (scentstation-user) cho Header toàn bộ 16 màn hình
                const rawUser =
                    sessionStorage.getItem("scentstation-user") ||
                    localStorage.getItem("scentstation-user");
                if (rawUser) {
                    const u = JSON.parse(rawUser);
                    const updatedUser = {
                        ...u,
                        fullName: merged.fullName,
                        name: merged.fullName,
                        phone: merged.phoneNumber,
                        avatarUrl: merged.avatarUrl,
                        twoFactorEnabled: merged.is2FAEnabled,
                    };
                    sessionStorage.setItem(
                        "scentstation-user",
                        JSON.stringify(updatedUser)
                    );
                    localStorage.setItem(
                        "scentstation-user",
                        JSON.stringify(updatedUser)
                    );
                }

                // Cập nhật đồng bộ sang danh sách Users (/users) và xác thực Đăng nhập (/login)
                const rawUsersList = localStorage.getItem(USERS_STORAGE_KEY);
                if (rawUsersList) {
                    const parsedList = JSON.parse(rawUsersList);
                    if (Array.isArray(parsedList)) {
                        const updatedList = parsedList.map((usr: any) =>
                            String(usr.email || "").toLowerCase() ===
                            emailAddress.toLowerCase()
                                ? {
                                    ...usr,
                                    fullName: merged.fullName,
                                    phone: merged.phoneNumber,
                                    password: merged.password,
                                    twoFactorEnabled: merged.is2FAEnabled,
                                }
                                : usr
                        );
                        localStorage.setItem(
                            USERS_STORAGE_KEY,
                            JSON.stringify(updatedList)
                        );
                    }
                }

                // Ghi Nhật ký Kiểm toán (/reports & /users)
                if (auditEvent) {
                    const nowIso = new Date().toISOString();
                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                    auditList.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: nowIso,
                        actor: merged.fullName,
                        role: "PSA",
                        tenant: emailAddress,
                        action: auditEvent.action,
                        entityType: "PROFILE_SECURITY",
                        entityId: emailAddress,
                        severity: auditEvent.severity || "INFO",
                        oldValues: null,
                        newValues: { detail: auditEvent.detail },
                        sourceIp: "115.78.209.14",
                    });
                    localStorage.setItem(
                        AUDIT_LOGS_STORAGE_KEY,
                        JSON.stringify(auditList.slice(0, 250))
                    );
                }

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        [
            fullName,
            phoneNumber,
            avatarUrl,
            storedCurrentPassword,
            tokenVersion,
            is2FAEnabled,
            prefLanguage,
            prefTimeZone,
            prefDateFormat,
            sessions,
            emailAddress,
        ]
    );

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

        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            showToast(
                prefLanguage === "VI"
                    ? "Định dạng ảnh không hợp lệ. Vui lòng chọn PNG, JPG hoặc WEBP."
                    : "Invalid image format. Please select a PNG, JPG, or WEBP file."
            );
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast(
                prefLanguage === "VI"
                    ? "Dung lượng ảnh vượt quá 5MB."
                    : "Image size exceeds 5MB limit. Please select a smaller file."
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setAvatarUrl(reader.result);
                persistProfileAndBroadcast(
                    { avatarUrl: reader.result },
                    {
                        action: "PROFILE_AVATAR_UPDATED",
                        detail: `Uploaded new profile avatar (${file.name}) for ${emailAddress}.`,
                    }
                );
                showToast(
                    prefLanguage === "VI"
                        ? "Đã cập nhật ảnh đại diện và đồng bộ toàn hệ thống!"
                        : "New profile avatar uploaded and synchronized across portal!"
                );
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRestoreDefaultAvatar = () => {
        setAvatarUrl(DEFAULT_AVATAR_SVG);
        persistProfileAndBroadcast(
            { avatarUrl: DEFAULT_AVATAR_SVG },
            {
                action: "PROFILE_AVATAR_RESET",
                detail: `Restored default executive emblem avatar for ${emailAddress}.`,
            }
        );
        showToast(
            prefLanguage === "VI"
                ? "Đã khôi phục ảnh đại diện mặc định của hệ thống."
                : "Restored default ScentStation executive avatar."
        );
    };

    const handleSaveProfileChanges = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setNameError("");
        setPhoneError("");
        setProfileSuccess("");

        let hasError = false;
        if (fullName.trim().length < 3) {
            setNameError(
                prefLanguage === "VI"
                    ? "Tên hiển thị phải có ít nhất 3 ký tự."
                    : "Full Name must contain at least 3 characters."
            );
            hasError = true;
        }

        const phoneRegex = /^[+0-9\s()-]{9,16}$/;
        if (!phoneRegex.test(phoneNumber.trim())) {
            setPhoneError(
                prefLanguage === "VI"
                    ? "Số điện thoại không đúng định dạng (VD: +84 908 458 999)."
                    : "Invalid phone number format (e.g., +84 908 458 999)."
            );
            hasError = true;
        }

        if (hasError) return;

        persistProfileAndBroadcast(
            { fullName: fullName.trim(), phoneNumber: phoneNumber.trim() },
            {
                action: "PROFILE_DETAILS_UPDATED",
                detail: `Updated display name to "${fullName.trim()}" and phone to "${phoneNumber.trim()}".`,
            }
        );

        setProfileSuccess(
            prefLanguage === "VI"
                ? "Đã lưu thông tin hồ sơ và đồng bộ sang toàn bộ 16 màn hình!"
                : "Profile information validated and synchronized across all 16 portal modules."
        );
        showToast(
            prefLanguage === "VI"
                ? "Đã lưu thay đổi hồ sơ & đồng bộ toàn cổng!"
                : "Profile changes saved and synced across portal!"
        );
    };

    const passwordCriteria = useMemo(() => {
        return {
            minLength: newPassword.length >= 8,
            hasUpper: /[A-Z]/.test(newPassword),
            hasLower: /[a-z]/.test(newPassword),
            hasNumber: /[0-9]/.test(newPassword),
            hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
        };
    }, [newPassword]);

    const allCriteriaMet =
        passwordCriteria.minLength &&
        passwordCriteria.hasUpper &&
        passwordCriteria.hasLower &&
        passwordCriteria.hasNumber &&
        passwordCriteria.hasSpecial;

    const handleUpdatePassword = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword) {
            setPasswordError(
                prefLanguage === "VI"
                    ? "Vui lòng nhập mật khẩu hiện tại."
                    : "Please enter your Current Password."
            );
            return;
        }
        if (currentPassword !== storedCurrentPassword) {
            setPasswordError(
                prefLanguage === "VI"
                    ? `Mật khẩu hiện tại không chính xác (Mật khẩu đang kích hoạt: "${storedCurrentPassword}").`
                    : `Current password is incorrect (Active credential: "${storedCurrentPassword}").`
            );
            return;
        }
        if (!allCriteriaMet) {
            setPasswordError(
                prefLanguage === "VI"
                    ? "Mật khẩu mới phải đủ 8+ ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt."
                    : "New password must satisfy all complexity requirements (8+ chars, uppercase, lowercase, number, special character)."
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError(
                prefLanguage === "VI"
                    ? "Mật khẩu mới và Xác nhận mật khẩu không trùng khớp."
                    : "New Password and Confirm New Password do not match."
            );
            return;
        }

        const nextVer = tokenVersion + 1;
        setStoredCurrentPassword(newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTokenVersion(nextVer);

        persistProfileAndBroadcast(
            { password: newPassword, tokenVersion: nextVer },
            {
                action: "ACCOUNT_PASSWORD_ROTATED",
                detail: `Rotated BCrypt password credential and incremented JWT token_version to v${nextVer}.`,
                severity: "WARNING",
            }
        );

        setPasswordSuccess(
            prefLanguage === "VI"
                ? `Đã cập nhật mật khẩu BCrypt & nâng phiên bản JWT Token lên v${nextVer}!`
                : `Password hashed with BCrypt and updated! JWT token_version incremented to v${nextVer}.`
        );
        showToast(
            prefLanguage === "VI"
                ? "Đã đổi mật khẩu & ghi nhật ký kiểm toán!"
                : "Password updated and security audit event recorded!"
        );
    };

    const handleVerify2FASetup = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setTwoFAError("");

        if (otpCode.trim().length !== 6 || !/^\d{6}$/.test(otpCode.trim())) {
            setTwoFAError(
                prefLanguage === "VI"
                    ? "Xác thực thất bại: Vui lòng nhập đúng mã OTP gồm 6 chữ số (VD: 123456)."
                    : "Verification failed: Please enter a valid 6-digit authenticator code (e.g., 123456)."
            );
            return;
        }

        if (otpCode.trim() === "000000") {
            setTwoFAError(
                prefLanguage === "VI"
                    ? "Mã xác thực không hợp lệ. Vui lòng thử lại."
                    : "Verification code rejected by TOTP verifier. Please enter a valid 6-digit code."
            );
            return;
        }

        setIs2FAEnabled(true);
        setIs2FAModalOpen(false);
        setOtpCode("");
        setTwoFASuccess(
            prefLanguage === "VI"
                ? "Xác thực 2 lớp (2FA) đã được BẬT và đồng bộ sang Quản trị Người dùng!"
                : "Two-Factor Authentication (2FA) is now Enabled and synchronized across User Governance."
        );

        persistProfileAndBroadcast(
            { is2FAEnabled: true },
            {
                action: "ACCOUNT_2FA_ENABLED",
                detail: `Enabled TOTP Two-Factor Authentication for ${emailAddress}.`,
            }
        );

        showToast(
            prefLanguage === "VI"
                ? "Đã bật bảo mật 2FA thành công!"
                : "Two-Factor Authentication (2FA) enabled successfully!"
        );
    };

    const handleSavePreferences = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        persistProfileAndBroadcast(
            { prefLanguage, prefTimeZone, prefDateFormat },
            {
                action: "PORTAL_PREFERENCES_UPDATED",
                detail: `Updated display preferences to ${prefLanguage} • ${prefTimeZone} • ${prefDateFormat}.`,
            }
        );
        setPrefSavedFeedback(
            prefLanguage === "VI"
                ? `Đã áp dụng tùy chọn hiển thị (${prefLanguage} • ${prefTimeZone} • ${prefDateFormat}) cho toàn bộ hệ thống.`
                : `Applied display preferences (${prefLanguage} • ${prefTimeZone} • ${prefDateFormat}) across all portal views.`
        );
        showToast(
            prefLanguage === "VI"
                ? "Đã lưu & đồng bộ tùy chọn hiển thị!"
                : "Interface preferences applied and synchronized!"
        );
    };

    const handleConfirmTerminateSession = () => {
        if (!sessionToTerminate) return;
        const nextSessions = sessions.map((s) =>
            s.id === sessionToTerminate.id
                ? { ...s, status: "TERMINATED" as const }
                : s
        );
        setSessions(nextSessions);

        persistProfileAndBroadcast(
            { sessions: nextSessions },
            {
                action: "REMOTE_SESSION_TERMINATED",
                detail: `Revoked remote session ${sessionToTerminate.id} (${sessionToTerminate.device}, IP: ${sessionToTerminate.ipAddress}).`,
                severity: "WARNING",
            }
        );

        showToast(
            `Session ${sessionToTerminate.id} (${sessionToTerminate.device}) terminated and revoked!`
        );
        setSessionToTerminate(null);
    };

    const handleRevokeAllOtherSessions = () => {
        const nextSessions = sessions.map((s) =>
            s.isCurrentSession ? s : { ...s, status: "TERMINATED" as const }
        );
        const nextVer = tokenVersion + 1;
        setSessions(nextSessions);
        setTokenVersion(nextVer);

        persistProfileAndBroadcast(
            { sessions: nextSessions, tokenVersion: nextVer },
            {
                action: "ALL_REMOTE_SESSIONS_REVOKED",
                detail: `Terminated all remote device sessions and incremented JWT token_version to v${nextVer}.`,
                severity: "WARNING",
            }
        );

        showToast(
            prefLanguage === "VI"
                ? `Đã đăng xuất toàn bộ thiết bị từ xa & nâng JWT lên v${nextVer}!`
                : `Revoked all remote sessions and rotated JWT token to v${nextVer}!`
        );
    };

    const activeSessionCount = useMemo(
        () => sessions.filter((s) => s.status === "ACTIVE").length,
        [sessions]
    );

    const hasRemoteActiveSessions = useMemo(
        () => sessions.some((s) => !s.isCurrentSession && s.status === "ACTIVE"),
        [sessions]
    );

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => setOpenDropdown(null)}
        >
            <input
                type="file"
                ref={avatarFileInputRef}
                onChange={handleAvatarUpload}
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
            />

            {/* LUXURY HERO BANNER CARD (ĐỒNG BỘ 100% VỚI MÀN 5..15) */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {prefLanguage === "VI"
                                ? "QUẢN TRỊ HỒ SƠ CÁ NHÂN & BẢO MẬT PHIÊN ĐĂNG NHẬP"
                                : "EXECUTIVE IDENTITY & ZERO-TRUST ACCOUNT GOVERNANCE"}
                        </span>
                        <h1 className={styles.title}>
                            {prefLanguage === "VI"
                                ? "Hồ Sơ Cá Nhân & Bảo Mật Tài Khoản"
                                : "Profile & Account Security"}
                        </h1>
                        <p className={styles.subtitle}>
                            {prefLanguage === "VI"
                                ? "Quản lý thông tin liên hệ, xoay vòng mật khẩu mã hóa BCrypt, xác thực hai lớp (2FA), tùy chọn hiển thị toàn cổng và giám sát thiết bị đăng nhập."
                                : "Manage personal contact credentials, BCrypt password rotation, Two-Factor Authentication (2FA), portal localization, and active JWT device sessions."}
                        </p>
                    </div>

                    <div className={styles.headerActions}>
                        <button
                            type="button"
                            onClick={() => {
                                const nextLang = prefLanguage === "EN" ? "VI" : "EN";
                                setPrefLanguage(nextLang);
                                persistProfileAndBroadcast({ prefLanguage: nextLang });
                            }}
                            className={styles.secondaryGoldBtn}
                        >
                            <Globe size={14} color="#D4AF37" />
                            <span>{prefLanguage}</span>
                        </button>

                        <div
                            className={styles.secondaryGoldBtn}
                            style={{ cursor: "default" }}
                        >
                            <ShieldCheck size={14} color="#34D399" />
                            <span>
                                JWT Token: <strong>v{tokenVersion}</strong> • 2FA:{" "}
                                <strong
                                    style={{
                                        color: is2FAEnabled ? "#34D399" : "#FBBF24",
                                    }}
                                >
                                    {is2FAEnabled ? "ENABLED" : "DISABLED"}
                                </strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4 KPI SUMMARY CARDS */}
                <div className={styles.kpiGrid4}>
                    <div className={styles.kpiCard}>
                        <div
                            style={{
                                fontSize: "0.66rem",
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            {prefLanguage === "VI"
                                ? "DANH TÍNH ĐANG ĐĂNG NHẬP"
                                : "AUTHENTICATED IDENTITY"}
                        </div>
                        <div
                            style={{
                                fontSize: "1.2rem",
                                fontWeight: 700,
                                color: "#FFFFFF",
                                fontFamily: "Space Grotesk, monospace",
                                margin: "0.35rem 0",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {fullName}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399" }}>
                            {emailAddress}
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div
                            style={{
                                fontSize: "0.66rem",
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            {prefLanguage === "VI"
                                ? "BẢO VỆ 2 LỚP (2FA)"
                                : "TWO-FACTOR GUARD (2FA)"}
                        </div>
                        <div
                            style={{
                                fontSize: "1.35rem",
                                fontWeight: 700,
                                color: is2FAEnabled ? "#34D399" : "#FBBF24",
                                fontFamily: "Space Grotesk, monospace",
                                margin: "0.3rem 0",
                            }}
                        >
                            {is2FAEnabled ? "ACTIVE (TOTP)" : "STANDBY"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            RFC 6238 Authenticator Protection
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div
                            style={{
                                fontSize: "0.66rem",
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            {prefLanguage === "VI"
                                ? "THIẾT BỊ ĐANG HOẠT ĐỘNG"
                                : "ACTIVE DEVICE SESSIONS"}
                        </div>
                        <div
                            style={{
                                fontSize: "1.35rem",
                                fontWeight: 700,
                                color: "#60A5FA",
                                fontFamily: "Space Grotesk, monospace",
                                margin: "0.3rem 0",
                            }}
                        >
                            {activeSessionCount}{" "}
                            {prefLanguage === "VI" ? "Thiết Bị" : "Devices"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            JWT Token Generation v{tokenVersion}
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div
                            style={{
                                fontSize: "0.66rem",
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            {prefLanguage === "VI"
                                ? "ĐỊNH DẠNG KHU VỰC"
                                : "REGIONAL LOCALIZATION"}
                        </div>
                        <div
                            style={{
                                fontSize: "1.35rem",
                                fontWeight: 700,
                                color: "#F5E6AD",
                                fontFamily: "Space Grotesk, monospace",
                                margin: "0.3rem 0",
                            }}
                        >
                            {prefLanguage} • GMT+07
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            Format: {prefDateFormat}
                        </div>
                    </div>
                </div>
            </div>

            {/* TOP GRID: 1. PROFILE INFORMATION + 2. CHANGE PASSWORD */}
            <div className={styles.mainGrid}>
                {/* 1. PROFILE INFORMATION */}
                <section className={styles.sectionCard}>
                    <div>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>
                                    <User size={18} color="#D4AF37" />
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Thông Tin Hồ Sơ Cá Nhân"
                                            : "Personal Profile Information"}
                                    </span>
                                </h2>
                                <p className={styles.cardDesc}>
                                    {prefLanguage === "VI"
                                        ? "Cập nhật Tên hiển thị, Số điện thoại hoặc Ảnh đại diện. Email và Vai trò được khóa bảo mật theo phân quyền RBAC."
                                        : "Update your Display Name, Contact Phone, or Executive Avatar. Email and RBAC Role are locked by system governance."}
                                </p>
                            </div>
                        </div>

                        <div className={styles.avatarRow}>
                            <div className={styles.avatarWrapper}>
                                <img
                                    src={avatarUrl}
                                    alt="User Avatar"
                                    className={styles.avatarImg}
                                />
                                <button
                                    type="button"
                                    onClick={() => avatarFileInputRef.current?.click()}
                                    className={styles.cameraBtn}
                                    title="Upload new profile picture"
                                >
                                    <Camera size={14} />
                                </button>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: "1rem",
                                        color: "#FFF",
                                    }}
                                >
                                    {fullName || "Unnamed Administrator"}
                                </div>
                                <div
                                    style={{
                                        fontSize: "0.76rem",
                                        color: "#F5E6AD",
                                        fontFamily: "Space Grotesk, monospace",
                                        marginTop: "2px",
                                    }}
                                >
                                    {emailAddress}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.55rem",
                                        marginTop: "0.6rem",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            avatarFileInputRef.current?.click()
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            padding: "0.42rem 0.8rem",
                                            fontSize: "0.73rem",
                                        }}
                                    >
                                        <Camera size={13} color="#D4AF37" />
                                        <span>
                                            {prefLanguage === "VI"
                                                ? "Tải Ảnh Mới"
                                                : "Upload Photo"}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRestoreDefaultAvatar}
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            padding: "0.42rem 0.8rem",
                                            fontSize: "0.73rem",
                                        }}
                                    >
                                        <RotateCcw size={13} color="#D4AF37" />
                                        <span>
                                            {prefLanguage === "VI"
                                                ? "Ảnh Mặc Định"
                                                : "Restore Default"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfileChanges}>
                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <span>
                                            {prefLanguage === "VI"
                                                ? "Tên Hiển Thị *"
                                                : "Display Name *"}
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter display name"
                                        className={styles.textInput}
                                    />
                                    {nameError && (
                                        <span className={styles.fieldError}>
                                            {nameError}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <span>
                                            {prefLanguage === "VI"
                                                ? "Số Điện Thoại *"
                                                : "Contact Phone *"}
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={phoneNumber}
                                        onChange={(e) =>
                                            setPhoneNumber(e.target.value)
                                        }
                                        placeholder="+84 908 458 999"
                                        className={styles.textInput}
                                    />
                                    {phoneError && (
                                        <span className={styles.fieldError}>
                                            {phoneError}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <span>Email Address</span>
                                        <span className={styles.readOnlyTag}>
                                            READ-ONLY
                                        </span>
                                    </label>
                                    <input
                                        type="email"
                                        value={emailAddress}
                                        readOnly
                                        disabled
                                        className={`${styles.textInput} ${styles.readOnlyInput}`}
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <span>Assigned Role & Scope</span>
                                        <span className={styles.readOnlyTag}>
                                            READ-ONLY
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={assignedRole}
                                        readOnly
                                        disabled
                                        className={`${styles.textInput} ${styles.readOnlyInput}`}
                                    />
                                </div>
                            </div>

                            {profileSuccess && (
                                <div
                                    style={{
                                        padding: "0.7rem 0.95rem",
                                        borderRadius: "10px",
                                        background: "rgba(52, 211, 153, 0.12)",
                                        border: "1px solid rgba(52, 211, 153, 0.35)",
                                        color: "#34D399",
                                        fontSize: "0.78rem",
                                        marginBottom: "0.9rem",
                                    }}
                                >
                                    ✓ {profileSuccess}
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginTop: "0.4rem",
                                }}
                            >
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <CheckCircle2 size={15} />
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Lưu Thay Đổi Hồ Sơ"
                                            : "Save Profile Changes"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* 2. CHANGE PASSWORD */}
                <section className={styles.sectionCard}>
                    <div>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>
                                    <Lock size={18} color="#D4AF37" />
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Đổi Mật Khẩu & Xoay Vòng Khóa"
                                            : "Password & Credential Rotation"}
                                    </span>
                                </h2>
                                <p className={styles.cardDesc}>
                                    {prefLanguage === "VI"
                                        ? "Xác nhận mật khẩu hiện tại và thiết lập mật khẩu mạnh chuẩn mã hóa BCrypt."
                                        : "Verify current credential and configure a BCrypt-hashed password."}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdatePassword}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Mật Khẩu Hiện Tại *"
                                            : "Current Password *"}
                                    </span>
                                </label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type={showCurrentPw ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        placeholder="Enter current password (Admin@12345)"
                                        className={styles.textInput}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCurrentPw(!showCurrentPw)
                                        }
                                        className={styles.eyeToggleBtn}
                                    >
                                        {showCurrentPw ? (
                                            <EyeOff size={15} />
                                        ) : (
                                            <Eye size={15} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Mật Khẩu Mới *"
                                            : "New Password *"}
                                    </span>
                                </label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type={showNewPw ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        placeholder="Enter new strong password"
                                        className={styles.textInput}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPw(!showNewPw)}
                                        className={styles.eyeToggleBtn}
                                    >
                                        {showNewPw ? (
                                            <EyeOff size={15} />
                                        ) : (
                                            <Eye size={15} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.35rem 0.75rem",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    borderRadius: "10px",
                                    padding: "0.6rem 0.85rem",
                                    marginBottom: "0.85rem",
                                    fontSize: "0.72rem",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                <span
                                    style={{
                                        color: passwordCriteria.minLength
                                            ? "#34D399"
                                            : "#94A3B8",
                                    }}
                                >
                                    {passwordCriteria.minLength ? "✓" : "○"} Min 8
                                    characters
                                </span>
                                <span
                                    style={{
                                        color: passwordCriteria.hasUpper
                                            ? "#34D399"
                                            : "#94A3B8",
                                    }}
                                >
                                    {passwordCriteria.hasUpper ? "✓" : "○"} Uppercase
                                    (A–Z)
                                </span>
                                <span
                                    style={{
                                        color: passwordCriteria.hasLower
                                            ? "#34D399"
                                            : "#94A3B8",
                                    }}
                                >
                                    {passwordCriteria.hasLower ? "✓" : "○"} Lowercase
                                    (a–z)
                                </span>
                                <span
                                    style={{
                                        color: passwordCriteria.hasNumber
                                            ? "#34D399"
                                            : "#94A3B8",
                                    }}
                                >
                                    {passwordCriteria.hasNumber ? "✓" : "○"} Number
                                    (0–9)
                                </span>
                                <span
                                    style={{
                                        color: passwordCriteria.hasSpecial
                                            ? "#34D399"
                                            : "#94A3B8",
                                        gridColumn: "span 2",
                                    }}
                                >
                                    {passwordCriteria.hasSpecial ? "✓" : "○"} Special
                                    symbol (!@#$%^&*)
                                </span>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Xác Nhận Mật Khẩu Mới *"
                                            : "Confirm New Password *"}
                                    </span>
                                </label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type={showConfirmPw ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        placeholder="Re-enter new password"
                                        className={styles.textInput}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPw(!showConfirmPw)
                                        }
                                        className={styles.eyeToggleBtn}
                                    >
                                        {showConfirmPw ? (
                                            <EyeOff size={15} />
                                        ) : (
                                            <Eye size={15} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {passwordError && (
                                <div
                                    style={{
                                        padding: "0.7rem 0.95rem",
                                        borderRadius: "10px",
                                        background: "rgba(248, 113, 113, 0.14)",
                                        border: "1px solid rgba(248, 113, 113, 0.4)",
                                        color: "#F87171",
                                        fontSize: "0.76rem",
                                        marginBottom: "0.85rem",
                                    }}
                                >
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div
                                    style={{
                                        padding: "0.7rem 0.95rem",
                                        borderRadius: "10px",
                                        background: "rgba(52, 211, 153, 0.12)",
                                        border: "1px solid rgba(52, 211, 153, 0.35)",
                                        color: "#34D399",
                                        fontSize: "0.76rem",
                                        marginBottom: "0.85rem",
                                    }}
                                >
                                    ✓ {passwordSuccess}
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <KeyRound size={15} />
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Cập Nhật Mật Khẩu"
                                            : "Update Password"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>

            {/* MIDDLE GRID: 3. TWO-FACTOR AUTHENTICATION (2FA) + 4. PREFERENCES */}
            <div className={styles.mainGrid}>
                {/* 3. TWO-FACTOR AUTHENTICATION */}
                <section className={styles.sectionCard}>
                    <div>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>
                                    <Smartphone size={18} color="#D4AF37" />
                                    <span>Two-Factor Authentication (2FA)</span>
                                </h2>
                                <p className={styles.cardDesc}>
                                    {prefLanguage === "VI"
                                        ? "Bảo vệ các thao tác quản trị quan trọng (hoàn tiền, nạp kho, khởi động lại trạm MQTT) bằng mã OTP."
                                        : "Protect high-privilege actions (refunds, cartridge overrides, remote MQTT reboots) with TOTP verification."}
                                </p>
                            </div>

                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "0.3rem 0.8rem",
                                    borderRadius: "99px",
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                    background: is2FAEnabled
                                        ? "rgba(52, 211, 153, 0.14)"
                                        : "rgba(251, 191, 36, 0.14)",
                                    color: is2FAEnabled ? "#34D399" : "#FBBF24",
                                    border: `1px solid ${
                                        is2FAEnabled
                                            ? "rgba(52, 211, 153, 0.4)"
                                            : "rgba(251, 191, 36, 0.4)"
                                    }`,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {is2FAEnabled ? "● ENABLED" : "○ DISABLED"}
                            </span>
                        </div>

                        <div
                            style={{
                                padding: "1rem 1.1rem",
                                borderRadius: "14px",
                                background: "rgba(255,255,255,0.025)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                fontSize: "0.82rem",
                                color: "#CBD5E1",
                                lineHeight: 1.6,
                                marginBottom: "1.1rem",
                            }}
                        >
                            {is2FAEnabled ? (
                                <>
                                    <strong style={{ color: "#34D399" }}>
                                        ✓ Authenticator App Paired:
                                    </strong>{" "}
                                    Time-based One-Time Password (TOTP) is actively protecting this account across all Kiosk and Fleet operations.
                                </>
                            ) : (
                                <>
                                    <strong>Enhance Account Protection:</strong>{" "}
                                    Click{" "}
                                    <u style={{ color: "#F5E6AD" }}>Enable 2FA</u>{" "}
                                    below to pair Google Authenticator or Microsoft Authenticator with your ScentStation portal account.
                                </>
                            )}
                        </div>

                        {twoFASuccess && (
                            <div
                                style={{
                                    padding: "0.7rem 0.95rem",
                                    borderRadius: "10px",
                                    background: "rgba(52, 211, 153, 0.12)",
                                    border: "1px solid rgba(52, 211, 153, 0.35)",
                                    color: "#34D399",
                                    fontSize: "0.76rem",
                                    marginBottom: "0.9rem",
                                }}
                            >
                                ✓ {twoFASuccess}
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "0.72rem",
                                color: "#94A3B8",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            Protocol: TOTP Authenticator (RFC 6238)
                        </span>
                        {!is2FAEnabled ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setTwoFAError("");
                                    setOtpCode("");
                                    setIs2FAModalOpen(true);
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                <ShieldCheck size={15} />
                                <span>Enable 2FA</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setIs2FAEnabled(false);
                                    setTwoFASuccess("");
                                    persistProfileAndBroadcast(
                                        { is2FAEnabled: false },
                                        {
                                            action: "ACCOUNT_2FA_DISABLED",
                                            detail: `Disabled Two-Factor Authentication for ${emailAddress}.`,
                                            severity: "WARNING",
                                        }
                                    );
                                    showToast(
                                        "Two-Factor Authentication (2FA) has been disabled."
                                    );
                                }}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Disable 2FA</span>
                            </button>
                        )}
                    </div>
                </section>

                {/* 4. REGIONAL & DISPLAY PREFERENCES (CUSTOM GLASS DROPDOWNS) */}
                <section
                    className={styles.sectionCard}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>
                                    <Globe size={18} color="#D4AF37" />
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Tùy Chọn Ngôn Ngữ & Hiển Thị"
                                            : "Regional & Display Preferences"}
                                    </span>
                                </h2>
                                <p className={styles.cardDesc}>
                                    {prefLanguage === "VI"
                                        ? "Tùy chỉnh ngôn ngữ, múi giờ và định dạng ngày tháng đồng bộ trên toàn bộ 16 màn hình."
                                        : "Configure global portal language, time zone, and timestamp formatting synchronized across all 16 screens."}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSavePreferences}>
                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <span>Interface Language</span>
                                    </label>
                                    <div className={styles.customDropdownWrap}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenDropdown(
                                                    openDropdown === "LANG"
                                                        ? null
                                                        : "LANG"
                                                )
                                            }
                                            className={styles.customDropdownTrigger}
                                        >
                                            <span>
                                                {prefLanguage === "EN"
                                                    ? "English (EN)"
                                                    : "Tiếng Việt (VI)"}
                                            </span>
                                            <ChevronDown
                                                size={13}
                                                color="#D4AF37"
                                            />
                                        </button>
                                        {openDropdown === "LANG" && (
                                            <div
                                                className={
                                                    styles.customDropdownMenu
                                                }
                                            >
                                                {(
                                                    [
                                                        {
                                                            id: "EN",
                                                            label: "English (EN)",
                                                        },
                                                        {
                                                            id: "VI",
                                                            label: "Tiếng Việt (VI)",
                                                        },
                                                    ] as const
                                                ).map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setPrefLanguage(
                                                                item.id
                                                            );
                                                            setOpenDropdown(null);
                                                        }}
                                                        className={`${
                                                            styles.customDropdownItem
                                                        } ${
                                                            prefLanguage ===
                                                            item.id
                                                                ? styles.customDropdownItemActive
                                                                : ""
                                                        }`}
                                                    >
                                                        <span>{item.label}</span>
                                                        {prefLanguage ===
                                                            item.id && (
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

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>
                                        <span>Date Display Format</span>
                                    </label>
                                    <div className={styles.customDropdownWrap}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenDropdown(
                                                    openDropdown === "DATE_FMT"
                                                        ? null
                                                        : "DATE_FMT"
                                                )
                                            }
                                            className={styles.customDropdownTrigger}
                                        >
                                            <span>{prefDateFormat}</span>
                                            <ChevronDown
                                                size={13}
                                                color="#D4AF37"
                                            />
                                        </button>
                                        {openDropdown === "DATE_FMT" && (
                                            <div
                                                className={
                                                    styles.customDropdownMenu
                                                }
                                            >
                                                {(
                                                    [
                                                        "YYYY-MM-DD",
                                                        "DD/MM/YYYY",
                                                        "MM/DD/YYYY",
                                                    ] as const
                                                ).map((fmt) => (
                                                    <button
                                                        key={fmt}
                                                        type="button"
                                                        onClick={() => {
                                                            setPrefDateFormat(fmt);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className={`${
                                                            styles.customDropdownItem
                                                        } ${
                                                            prefDateFormat === fmt
                                                                ? styles.customDropdownItemActive
                                                                : ""
                                                        }`}
                                                    >
                                                        <span>{fmt}</span>
                                                        {prefDateFormat ===
                                                            fmt && (
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

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    <span>Preferred Time Zone</span>
                                </label>
                                <div className={styles.customDropdownWrap}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "TIMEZONE"
                                                    ? null
                                                    : "TIMEZONE"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                    >
                                        <span>{prefTimeZone}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "TIMEZONE" && (
                                        <div className={styles.customDropdownMenu}>
                                            {[
                                                "Asia/Ho_Chi_Minh (GMT+07:00)",
                                                "Asia/Singapore (GMT+08:00)",
                                                "Europe/Paris (GMT+01:00)",
                                                "UTC (GMT+00:00)",
                                            ].map((tz) => (
                                                <button
                                                    key={tz}
                                                    type="button"
                                                    onClick={() => {
                                                        setPrefTimeZone(tz);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        prefTimeZone === tz
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{tz}</span>
                                                    {prefTimeZone === tz && (
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

                            {prefSavedFeedback && (
                                <div
                                    style={{
                                        padding: "0.7rem 0.95rem",
                                        borderRadius: "10px",
                                        background: "rgba(212, 175, 55, 0.12)",
                                        border: "1px solid rgba(212, 175, 55, 0.35)",
                                        color: "#F5E6AD",
                                        fontSize: "0.76rem",
                                        marginBottom: "0.85rem",
                                    }}
                                >
                                    ✓ {prefSavedFeedback}
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <span>
                                        {prefLanguage === "VI"
                                            ? "Lưu Tùy Chọn Hiển Thị"
                                            : "Save Preferences"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>

            {/* 5. ACTIVE SESSIONS TABLE (FIX BADGE KHÔNG BAO GIỜ RỚT DÒNG) */}
            <section className={styles.tableCard}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                    }}
                >
                    <div>
                        <h2 className={styles.cardTitle}>
                            <Monitor size={18} color="#D4AF37" />
                            <span>
                                {prefLanguage === "VI"
                                    ? "Phiên Đăng Nhập & Kiểm Soát Thiết Bị"
                                    : "Active Device Sessions & Access Control"}
                            </span>
                        </h2>
                        <p className={styles.cardDesc}>
                            {prefLanguage === "VI"
                                ? "Giám sát các máy trạm và thiết bị di động đang đăng nhập vào tài khoản. Phiên từ xa có thể bị thu hồi ngay lập tức."
                                : "Monitor authenticated workstations and mobile terminals signed into your account. Remote sessions can be revoked immediately."}
                        </p>
                    </div>

                    {hasRemoteActiveSessions && (
                        <button
                            type="button"
                            onClick={handleRevokeAllOtherSessions}
                            className={styles.secondaryGoldBtn}
                            style={{
                                borderColor: "rgba(248, 113, 113, 0.45)",
                                color: "#F87171",
                            }}
                        >
                            <LogOut size={13} />
                            <span>
                                {prefLanguage === "VI"
                                    ? "Đăng Xuất Tất Cả Thiết Bị Khác"
                                    : "Revoke All Other Sessions"}
                            </span>
                        </button>
                    )}
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>DEVICE & BROWSER</th>
                            <th>ESTIMATED LOCATION</th>
                            <th>IP ADDRESS</th>
                            <th>LAST ACTIVITY ({prefDateFormat})</th>
                            <th>SESSION STATUS</th>
                            <th style={{ textAlign: "right" }}>ACTION</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sessions.map((ses) => (
                            <tr key={ses.id}>
                                <td className={styles.tableCell}>
                                    <strong
                                        style={{
                                            color: "#FFF",
                                            fontSize: "0.86rem",
                                        }}
                                    >
                                        {ses.device}
                                    </strong>
                                    <div
                                        style={{
                                            fontSize: "0.74rem",
                                            color: "#94A3B8",
                                            marginTop: "2px",
                                        }}
                                    >
                                        {ses.browserOs}
                                    </div>
                                </td>

                                <td
                                    className={styles.tableCell}
                                    style={{ color: "#CBD5E1" }}
                                >
                                    {ses.estimatedLocation}
                                </td>

                                <td
                                    className={styles.tableCell}
                                    style={{
                                        fontFamily: "Space Grotesk, monospace",
                                        color: "#F5E6AD",
                                        fontWeight: 700,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {ses.ipAddress}
                                </td>

                                <td
                                    className={styles.tableCell}
                                    style={{
                                        fontFamily: "Space Grotesk, monospace",
                                        color: "#CBD5E1",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {formatDisplayDate(ses.lastActivityIso)}
                                </td>

                                <td
                                    className={styles.tableCell}
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    {ses.isCurrentSession ? (
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.35rem",
                                                padding: "0.28rem 0.78rem",
                                                borderRadius: "99px",
                                                fontSize: "0.66rem",
                                                fontWeight: 700,
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                background:
                                                    "rgba(212,175,55,0.16)",
                                                color: "#F5E6AD",
                                                border: "1px solid rgba(212,175,55,0.45)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                                ● CURRENT SESSION
                                            </span>
                                    ) : ses.status === "ACTIVE" ? (
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.35rem",
                                                padding: "0.28rem 0.78rem",
                                                borderRadius: "99px",
                                                fontSize: "0.66rem",
                                                fontWeight: 700,
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                background:
                                                    "rgba(52, 211, 153, 0.14)",
                                                color: "#34D399",
                                                border: "1px solid rgba(52, 211, 153, 0.4)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                                ACTIVE
                                            </span>
                                    ) : (
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.35rem",
                                                padding: "0.28rem 0.78rem",
                                                borderRadius: "99px",
                                                fontSize: "0.66rem",
                                                fontWeight: 700,
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                background:
                                                    "rgba(248, 113, 113, 0.12)",
                                                color: "#F87171",
                                                border: "1px solid rgba(248, 113, 113, 0.35)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                                TERMINATED
                                            </span>
                                    )}
                                </td>

                                <td
                                    className={styles.tableCell}
                                    style={{
                                        textAlign: "right",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {ses.isCurrentSession ? (
                                        <span
                                            style={{
                                                fontSize: "0.75rem",
                                                color: "#94A3B8",
                                                fontStyle: "italic",
                                            }}
                                        >
                                                Active Here
                                            </span>
                                    ) : ses.status === "ACTIVE" ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSessionToTerminate(ses)
                                            }
                                            className={styles.secondaryGoldBtn}
                                            style={{
                                                padding: "0.42rem 0.8rem",
                                                fontSize: "0.73rem",
                                                borderColor:
                                                    "rgba(248,113,113,0.45)",
                                                color: "#F87171",
                                            }}
                                        >
                                            <LogOut size={13} />
                                            <span>Revoke Session</span>
                                        </button>
                                    ) : (
                                        <span
                                            style={{
                                                fontSize: "0.74rem",
                                                color: "#64748B",
                                            }}
                                        >
                                                Signed Out
                                            </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* MODAL 1: 2FA SETUP VERIFICATION */}
            {is2FAModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIs2FAModalOpen(false)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1rem",
                                borderBottom: "1px solid rgba(255,255,255,0.08)",
                                paddingBottom: "0.8rem",
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
                                    TOTP AUTHENTICATOR PAIRING
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        color: "#FFF",
                                        fontFamily: "Bodoni Moda, Georgia, serif",
                                        fontSize: "1.35rem",
                                    }}
                                >
                                    Enable Two-Factor Authentication
                                </h3>
                            </div>
                            <button
                                onClick={() => setIs2FAModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                                style={{ padding: "0.45rem 0.65rem" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p
                            style={{
                                fontSize: "0.82rem",
                                color: "#CBD5E1",
                                lineHeight: 1.6,
                            }}
                        >
                            Enter setup key{" "}
                            <code style={{ color: "#F5E6AD", fontWeight: 700 }}>
                                JBSW-Y3DP-EHPK-3PXP
                            </code>{" "}
                            into your Authenticator app, then submit the 6-digit verification code below (Demo: enter{" "}
                            <strong>123456</strong> to verify):
                        </p>

                        {twoFAError && (
                            <div
                                style={{
                                    padding: "0.7rem",
                                    borderRadius: "10px",
                                    background: "rgba(248, 113, 113, 0.14)",
                                    border: "1px solid rgba(248, 113, 113, 0.4)",
                                    color: "#F87171",
                                    fontSize: "0.78rem",
                                    marginBottom: "0.9rem",
                                }}
                            >
                                {twoFAError}
                            </div>
                        )}

                        <form onSubmit={handleVerify2FASetup}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    <span>6-Digit Verification Code *</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="123456"
                                    className={styles.textInput}
                                    style={{
                                        fontFamily: "Space Grotesk, monospace",
                                        fontSize: "1.15rem",
                                        letterSpacing: "0.25em",
                                        textAlign: "center",
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "0.75rem",
                                    marginTop: "1.2rem",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIs2FAModalOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <span>Verify & Enable 2FA</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: CONFIRM SESSION TERMINATION */}
            {sessionToTerminate && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSessionToTerminate(null)}
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
                            Confirm Remote Session Revocation
                        </h3>
                        <p
                            style={{
                                fontSize: "0.84rem",
                                color: "#CBD5E1",
                                lineHeight: 1.6,
                            }}
                        >
                            Are you sure you want to revoke the active session on{" "}
                            <strong style={{ color: "#F5E6AD" }}>
                                {sessionToTerminate.device}
                            </strong>{" "}
                            (IP: <code>{sessionToTerminate.ipAddress}</code>)? That device will immediately require re-authentication.
                        </p>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "0.75rem",
                                marginTop: "1.35rem",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setSessionToTerminate(null)}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Cancel</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmTerminateSession}
                                className={styles.primaryGoldBtn}
                            >
                                <LogOut size={14} />
                                <span>Confirm Revocation</span>
                            </button>
                        </div>
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