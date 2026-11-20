// noinspection SpellCheckingInspection
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import styles from "./settings.module.css";
import {
    Settings,
    Building2,
    Cpu,
    CreditCard,
    Bell,
    Server,
    ShieldCheck,
    Plug,
    FileText,
    CheckCircle2,
    Eye,
    EyeOff,
    Download,
    ArrowUpRight,
    Globe,
    Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { InternalRole, ROLE_PERMISSIONS, SettingsTabId, normalizeRole } from "@/lib/rbac";
import LuxurySelect from "@/components/ui/LuxurySelect";

interface BrandSettingItem {
    code: string;
    name: string;
    status: "ACTIVE" | "PENDING" | "INACTIVE";
    machinesCount: number;
    maxMachinesLimit: number;
    maxLocationsLimit: number;
}

interface MachineSettingItem {
    code: string;
    name: string;
    brand: string;
    location: string;
    status: "ONLINE" | "LOW_REFILL" | "OFFLINE" | "MAINTENANCE";
    dispenseDurationMs: number;
    cooldownSeconds: number;
    syncStatus: "SAVED_ONLY" | "SYNCED_WITH_DEVICE";
}

interface AuditLogRecord {
    id: string;
    timestamp: string;
    eventType: string;
    user: string;
    module: string;
    severity: "INFO" | "WARNING" | "ERROR";
    description: string;
}

const INITIAL_BRANDS: BrandSettingItem[] = [
    { code: "BRD-CHANEL", name: "Chanel", status: "ACTIVE", machinesCount: 2, maxMachinesLimit: 4, maxLocationsLimit: 5 },
    { code: "BRD-DIOR", name: "Dior", status: "ACTIVE", machinesCount: 2, maxMachinesLimit: 4, maxLocationsLimit: 5 },
    { code: "BRD-CREED", name: "Creed", status: "ACTIVE", machinesCount: 1, maxMachinesLimit: 3, maxLocationsLimit: 4 },
    { code: "BRD-MFK", name: "Maison Francis Kurkdjian", status: "ACTIVE", machinesCount: 1, maxMachinesLimit: 3, maxLocationsLimit: 3 },
    { code: "BRD-TOMFORD", name: "Tom Ford", status: "ACTIVE", machinesCount: 2, maxMachinesLimit: 4, maxLocationsLimit: 4 },
    { code: "BRD-YSL", name: "Yves Saint Laurent", status: "ACTIVE", machinesCount: 2, maxMachinesLimit: 4, maxLocationsLimit: 4 },
];

const INITIAL_MACHINES: MachineSettingItem[] = [
    { code: "demo-device", name: "Diamond Plaza Atrium", brand: "Creed", location: "Q.1, TP.HCM", status: "ONLINE", dispenseDurationMs: 1200, cooldownSeconds: 5, syncStatus: "SYNCED_WITH_DEVICE" },
    { code: "KIOSK-SGN-01", name: "Saigon Centre Takashimaya", brand: "Chanel", location: "Q.1, TP.HCM", status: "LOW_REFILL", dispenseDurationMs: 1200, cooldownSeconds: 5, syncStatus: "SYNCED_WITH_DEVICE" },
    { code: "KIOSK-SGN-02", name: "Vincom Đồng Khởi", brand: "Yves Saint Laurent", location: "Q.1, TP.HCM", status: "ONLINE", dispenseDurationMs: 1200, cooldownSeconds: 5, syncStatus: "SYNCED_WITH_DEVICE" },
    { code: "KIOSK-HN-01", name: "Lotte West Lake", brand: "Dior", location: "Tây Hồ, Hà Nội", status: "ONLINE", dispenseDurationMs: 1200, cooldownSeconds: 5, syncStatus: "SYNCED_WITH_DEVICE" },
    { code: "KIOSK-HN-02", name: "Tràng Tiền Plaza", brand: "Maison Margiela", location: "Hoàn Kiếm, Hà Nội", status: "MAINTENANCE", dispenseDurationMs: 1150, cooldownSeconds: 6, syncStatus: "SAVED_ONLY" },
    { code: "KIOSK-004", name: "Aeon Mall Tân Phú", brand: "Tom Ford", location: "Tân Phú, TP.HCM", status: "OFFLINE", dispenseDurationMs: 1200, cooldownSeconds: 5, syncStatus: "SAVED_ONLY" },
];

const INITIAL_AUDIT: AuditLogRecord[] = [
    { id: "LOG-9901", timestamp: "2026-11-20 09:42:15", eventType: "DISPENSE_CMD_SIGNED", user: "IoT Gateway", module: "Machines", severity: "INFO", description: "Signed command CMD-8821A for KIOSK-SGN-01." },
    { id: "LOG-9902", timestamp: "2026-11-20 09:15:40", eventType: "PAYMENT_VERIFIED", user: "VietQR Webhook", module: "Payment", severity: "INFO", description: "Verified NAPAS247 VietQR signature." },
    { id: "LOG-9903", timestamp: "2026-11-19 17:42:10", eventType: "MACHINE_OFFLINE", user: "Watchdog", module: "Machines", severity: "ERROR", description: "KIOSK-004 missed 3 consecutive heartbeats." },
];

const SETTINGS_STORAGE_KEY = "scentstation_platform_settings_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function SettingsPage(): React.ReactElement {
    const router = useRouter();

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [currentActor, setCurrentActor] = useState<string>("Platform Super Administrator");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<SettingsTabId>("general");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Tab 1: General
    const [platformName, setPlatformName] = useState<string>("ScentStation");
    const [platformSlogan, setPlatformSlogan] = useState<string>("Automated Fragrance Experience Platform");
    const [sysPrefs, setSysPrefs] = useState({ multiBrandMode: true, machineMonitoring: true, inviteOnly: true, dataExport: true });

    // Tab 2: Brands
    const [brandsList, setBrandsList] = useState<BrandSettingItem[]>(INITIAL_BRANDS);
    const [selectedBrandCode, setSelectedBrandCode] = useState<string>("BRD-CHANEL");

    // Tab 3: Machines
    const [machinesList, setMachinesList] = useState<MachineSettingItem[]>(INITIAL_MACHINES);
    const [selectedMachineCode, setSelectedMachineCode] = useState<string>("KIOSK-SGN-01");

    // Tab 4: Payment
    const [paymentMethods, setPaymentMethods] = useState([
        { id: "VIETQR", name: "VietQR (NAPAS 247)", active: true },
        { id: "MOMO", name: "MoMo Business", active: true },
        { id: "VNPAY", name: "VNPay Smart QR", active: true },
        { id: "ZALOPAY", name: "ZaloPay", active: false },
    ]);
    const [paymentTimeoutSec, setPaymentTimeoutSec] = useState<number>(180);
    const [vatRatePct, setVatRatePct] = useState<number>(8);

    // Tab 5: Notifications
    const [templateBody, setTemplateBody] = useState<string>("Station {{machine_code}} alert at {{timestamp}}.");

    // Tab 6: System
    const [systemMaintenanceMode, setSystemMaintenanceMode] = useState<boolean>(false);
    const [confirmMaintDialog, setConfirmMaintDialog] = useState<boolean>(false);

    // Tab 7: Security
    const [minPwLength, setMinPwLength] = useState<number>(8);
    const [sessionTimeoutMin, setSessionTimeoutMin] = useState<number>(30);
    const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState<boolean>(false);

    // Tab 8: Integrations
    const [showApiSecret, setShowApiSecret] = useState<boolean>(false);
    const [mqttHost, setMqttHost] = useState<string>("mqtt.scentstation.vn");
    const [mqttPort, setMqttPort] = useState<string>("8883");

    // Tab 9: Audit
    const [auditRecords, setAuditRecords] = useState<AuditLogRecord[]>(INITIAL_AUDIT);
    const [auditSearch, setAuditSearch] = useState<string>("");
    const [auditSeverity, setAuditSeverity] = useState<string>("ALL");

    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const allowedTabs = roleConfig.allowedSettingsTabs;

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

    const loadSettings = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            const rawUser = sessionStorage.getItem("scentstation-user") || localStorage.getItem("scentstation-user");
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                const resolvedRole = normalizeRole(parsed.roleCode || parsed.role || parsed.roles?.[0]);
                setCurrentRole(resolvedRole);
                setCurrentActor(parsed.fullName || parsed.name || ROLE_PERMISSIONS[resolvedRole].label);
                const scope = parsed.brandScope || parsed.brand || null;
                setLockedBrandScope(resolvedRole === "BA" && scope ? scope : null);

                const tabsForRole = ROLE_PERMISSIONS[resolvedRole].allowedSettingsTabs;
                if (tabsForRole.length > 0 && !tabsForRole.includes(activeTab)) {
                    setActiveTab(tabsForRole[0]);
                }
            }

            const rawSaved = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (rawSaved) {
                const s = JSON.parse(rawSaved);
                if (s.platformName) setPlatformName(s.platformName);
                if (s.platformSlogan) setPlatformSlogan(s.platformSlogan);
            }

            const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
            if (rawAudit) {
                const list = JSON.parse(rawAudit);
                if (Array.isArray(list) && list.length > 0) {
                    const mapped: AuditLogRecord[] = list.slice(0, 20).map((it: any, i: number) => ({
                        id: it.id || `LOG-${9910 + i}`,
                        timestamp: String(it.timestamp || "").replace("T", " ").slice(0, 19),
                        eventType: it.action || "SYSTEM_EVENT",
                        user: it.actor || "System",
                        module: it.entityType || "Settings",
                        severity: it.severity === "ERROR" || it.severity === "WARNING" ? it.severity : "INFO",
                        description: it.newValues?.detail || `${it.action} (${it.entityId || ""})`,
                    }));
                    setAuditRecords([...mapped, ...INITIAL_AUDIT]);
                }
            }
        } catch {
            // Safe fallback
        }
    }, [activeTab]);

    useEffect(() => {
        loadSettings();
        const handleSync = () => loadSettings();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadSettings]);

    const appendAudit = (action: string, moduleName: string, description: string) => {
        const item: AuditLogRecord = {
            id: `LOG-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
            eventType: action,
            user: currentActor,
            module: moduleName,
            severity: "INFO",
            description,
        };
        setAuditRecords((prev) => [item, ...prev]);
        try {
            const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            list.unshift({ ...item, actor: currentActor, action, entityType: moduleName, entityId: item.id });
            localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(list.slice(0, 250)));
            window.dispatchEvent(new Event("scentstation-sync"));
        } catch {
            // Safe fallback
        }
    };

    const scopedBrands = useMemo(
        () => (lockedBrandScope ? brandsList.filter((b) => b.name.toLowerCase() === lockedBrandScope.toLowerCase()) : brandsList),
        [brandsList, lockedBrandScope]
    );
    const scopedMachines = useMemo(
        () => (lockedBrandScope ? machinesList.filter((m) => m.brand.toLowerCase() === lockedBrandScope.toLowerCase()) : machinesList),
        [machinesList, lockedBrandScope]
    );

    const selectedBrand = scopedBrands.find((b) => b.code === selectedBrandCode) || scopedBrands[0];
    const selectedMachine = scopedMachines.find((m) => m.code === selectedMachineCode) || scopedMachines[0];

    const filteredAudit = useMemo(() => {
        const q = auditSearch.trim().toLowerCase();
        return auditRecords.filter((r) => {
            const matchSev = auditSeverity === "ALL" || r.severity === auditSeverity;
            const matchQ = !q || r.id.toLowerCase().includes(q) || r.eventType.toLowerCase().includes(q) || r.user.toLowerCase().includes(q);
            return matchSev && matchQ;
        });
    }, [auditRecords, auditSearch, auditSeverity]);

    const ALL_TABS: { id: SettingsTabId; labelVi: string; labelEn: string; icon: React.ElementType }[] = [
        { id: "general", labelVi: "Chung", labelEn: "General", icon: Settings },
        { id: "brands", labelVi: "Thương hiệu", labelEn: "Brands", icon: Building2 },
        { id: "machines", labelVi: "Đội máy", labelEn: "Machines", icon: Cpu },
        { id: "payment", labelVi: "Thanh toán", labelEn: "Payment", icon: CreditCard },
        { id: "notifications", labelVi: "Thông báo", labelEn: "Notifications", icon: Bell },
        { id: "system", labelVi: "Hệ thống", labelEn: "System", icon: Server },
        { id: "security", labelVi: "Bảo mật", labelEn: "Security", icon: ShieldCheck },
        { id: "integrations", labelVi: "Tích hợp", labelEn: "Integrations", icon: Plug },
        { id: "audit", labelVi: "Nhật ký", labelEn: "Audit Logs", icon: FileText },
    ];

    const visibleTabs = ALL_TABS.filter((t) => allowedTabs.includes(t.id));

    if (visibleTabs.length === 0) {
        return (
            <div className={`${styles.container} notranslate`} translate="no">
                <div className={styles.card} style={{ textAlign: "center", padding: "3rem" }}>
                    <Lock size={28} color="#D4AF37" style={{ marginBottom: "0.75rem" }} />
                    <h2 style={{ margin: "0 0 0.4rem 0" }}>{lang === "en" ? "Access Restricted" : "Giới hạn quyền truy cập"}</h2>
                    <p style={{ color: "#94A3B8", margin: 0 }}>
                        {lang === "en" ? "Your role does not have access to system settings." : "Vai trò hiện tại không có quyền truy cập mục Cài đặt hệ thống."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Settings" : "Cài đặt hệ thống"}</h1>
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
                    </div>
                </div>

                {/* 4 KPI */}
                <div className={styles.kpiGrid4}>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Brands" : "Thương hiệu"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "0.2rem" }}>{scopedBrands.length}</div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Stations" : "Đội máy"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#38BDF8", marginTop: "0.2rem" }}>{scopedMachines.length}</div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Payment Gateways" : "Cổng thanh toán"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F5E6AD", marginTop: "0.2rem" }}>{paymentMethods.filter((p) => p.active).length}/{paymentMethods.length}</div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Audit Events" : "Sự kiện nhật ký"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34D399", marginTop: "0.2rem" }}>{auditRecords.length}</div>
                    </div>
                </div>
            </div>

            {/* TABS THEO QUYỀN */}
            <div className={styles.tabsBar}>
                {visibleTabs.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ""}`}>
                            <Icon size={14} />
                            <span>{lang === "en" ? t.labelEn : t.labelVi}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: CHUNG */}
            {activeTab === "general" && (
                <div className={styles.grid2Cols}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>{lang === "en" ? "Platform Identity" : "Định danh nền tảng"}</h2></div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>{lang === "en" ? "Platform Name" : "Tên nền tảng"}</label>
                            <input type="text" value={platformName} onChange={(e) => setPlatformName(e.target.value)} className={styles.textInput} />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>{lang === "en" ? "Tagline" : "Khẩu hiệu"}</label>
                            <input type="text" value={platformSlogan} onChange={(e) => setPlatformSlogan(e.target.value)} className={styles.textInput} />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ platformName, platformSlogan }));
                                appendAudit("GENERAL_SETTINGS_SAVED", "Settings", `Updated ${platformName}`);
                                showToast(lang === "en" ? "Saved general settings." : "Đã lưu cấu hình chung.");
                            }}
                            className={styles.primaryGoldBtn}
                        >
                            {lang === "en" ? "Save" : "Lưu thay đổi"}
                        </button>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>{lang === "en" ? "System Preferences" : "Tùy chọn hệ thống"}</h2></div>
                        {[
                            { key: "multiBrandMode", vi: "Chế độ đa thương hiệu", en: "Multi-brand mode" },
                            { key: "machineMonitoring", vi: "Giám sát đội máy MQTT", en: "Real-time MQTT monitoring" },
                            { key: "inviteOnly", vi: "Chỉ tạo tài khoản qua lời mời", en: "Invite-only registration" },
                            { key: "dataExport", vi: "Cho phép xuất báo cáo CSV", en: "Allow CSV data export" },
                        ].map((sw) => {
                            const isOn = sysPrefs[sw.key as keyof typeof sysPrefs];
                            return (
                                <div key={sw.key} className={styles.switchRow}>
                                    <span>{lang === "en" ? sw.en : sw.vi}</span>
                                    <button type="button" onClick={() => setSysPrefs((p) => ({ ...p, [sw.key]: !isOn }))} className={`${styles.toggleSwitch} ${isOn ? styles.toggleSwitchOn : ""}`}>
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: THƯƠNG HIỆU */}
            {activeTab === "brands" && selectedBrand && (
                <div className={styles.splitMasterDetail}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{lang === "en" ? "Brands" : "Thương hiệu"}</h3></div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            {scopedBrands.map((b) => (
                                <div key={b.code} onClick={() => setSelectedBrandCode(b.code)} style={{ padding: "0.65rem 0.85rem", borderRadius: "9px", background: selectedBrand.code === b.code ? "rgba(212,175,55,0.16)" : "#0B0D14", border: selectedBrand.code === b.code ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                                    <strong>{b.name}</strong>
                                    <span style={{ color: b.status === "ACTIVE" ? "#34D399" : "#F87171", fontSize: "0.74rem", fontWeight: 700 }}>{b.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{selectedBrand.name} ({selectedBrand.code})</h3>
                            <button type="button" onClick={() => router.push("/brands")} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.65rem", fontSize: "0.76rem" }}>
                                <span>{lang === "en" ? "Open Brands" : "Mở trang thương hiệu"}</span><ArrowUpRight size={13} />
                            </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                            <div>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Max Locations" : "Số điểm tối đa"}</label>
                                <input type="number" min={1} value={selectedBrand.maxLocationsLimit} onChange={(e) => setBrandsList((p) => p.map((b) => (b.code === selectedBrand.code ? { ...b, maxLocationsLimit: Number(e.target.value) } : b)))} className={styles.textInput} />
                            </div>
                            <div>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Max Machines" : "Số máy tối đa"}</label>
                                <input type="number" min={1} value={selectedBrand.maxMachinesLimit} onChange={(e) => setBrandsList((p) => p.map((b) => (b.code === selectedBrand.code ? { ...b, maxMachinesLimit: Number(e.target.value) } : b)))} className={styles.textInput} />
                            </div>
                            <div>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Status" : "Trạng thái"}</label>
                                <LuxurySelect
                                    width="100%"
                                    value={selectedBrand.status}
                                    onChange={(v) => setBrandsList((p) => p.map((b) => (b.code === selectedBrand.code ? { ...b, status: v as BrandSettingItem["status"] } : b)))}
                                    options={[
                                        { value: "ACTIVE", label: lang === "en" ? "Active" : "Hoạt động" },
                                        { value: "PENDING", label: lang === "en" ? "Pending" : "Chờ duyệt" },
                                        { value: "INACTIVE", label: lang === "en" ? "Inactive" : "Tạm ngưng" },
                                    ]}
                                />
                            </div>
                        </div>
                        <button type="button" onClick={() => { appendAudit("BRAND_SETTINGS_SAVED", "Brands", selectedBrand.name); showToast(lang === "en" ? "Brand settings saved." : "Đã lưu cấu hình thương hiệu."); }} className={styles.primaryGoldBtn}>
                            {lang === "en" ? "Save Brand Config" : "Lưu cấu hình"}
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 3: ĐỘI MÁY */}
            {activeTab === "machines" && selectedMachine && (
                <div className={styles.splitMasterDetail}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{lang === "en" ? "Stations" : "Đội máy"}</h3></div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            {scopedMachines.map((m) => (
                                <div key={m.code} onClick={() => setSelectedMachineCode(m.code)} style={{ padding: "0.65rem 0.85rem", borderRadius: "9px", background: selectedMachine.code === m.code ? "rgba(212,175,55,0.16)" : "#0B0D14", border: selectedMachine.code === m.code ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                                    <strong>{m.code}</strong>
                                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: m.status === "ONLINE" ? "#34D399" : m.status === "OFFLINE" ? "#F87171" : "#FBBF24" }}>{m.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>{selectedMachine.code} — {selectedMachine.name}</h3>
                            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: selectedMachine.syncStatus === "SYNCED_WITH_DEVICE" ? "#34D399" : "#FBBF24" }}>
                                {selectedMachine.syncStatus === "SYNCED_WITH_DEVICE" ? (lang === "en" ? "Synced" : "Đã đồng bộ") : (lang === "en" ? "Pending ACK" : "Chờ máy xác nhận")}
                            </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                            <div>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Spray Duration (ms)" : "Thời gian phun (ms)"}</label>
                                <input type="number" min={800} max={2000} value={selectedMachine.dispenseDurationMs} onChange={(e) => setMachinesList((p) => p.map((m) => (m.code === selectedMachine.code ? { ...m, dispenseDurationMs: Number(e.target.value), syncStatus: "SAVED_ONLY" } : m)))} className={styles.textInput} />
                            </div>
                            <div>
                                <label className={styles.fieldLabel}>{lang === "en" ? "Cooldown (sec)" : "Thời gian chờ (giây)"}</label>
                                <input type="number" min={1} value={selectedMachine.cooldownSeconds} onChange={(e) => setMachinesList((p) => p.map((m) => (m.code === selectedMachine.code ? { ...m, cooldownSeconds: Number(e.target.value), syncStatus: "SAVED_ONLY" } : m)))} className={styles.textInput} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                            <button type="button" onClick={() => { appendAudit("MACHINE_CONFIG_SAVED", "Machines", selectedMachine.code); showToast(lang === "en" ? "Saved to DB (Pending ACK)." : "Đã lưu cấu hình (Chờ máy xác nhận)."); }} className={styles.secondaryGoldBtn}>
                                {lang === "en" ? "Save Config" : "Lưu cấu hình"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedMachine.status === "OFFLINE") {
                                        showToast(lang === "en" ? "Station is offline. Sync queued." : "Máy đang ngoại tuyến. Sẽ đồng bộ khi kết nối lại.");
                                        return;
                                    }
                                    setMachinesList((p) => p.map((m) => (m.code === selectedMachine.code ? { ...m, syncStatus: "SYNCED_WITH_DEVICE" } : m)));
                                    appendAudit("MACHINE_MQTT_SYNC", "Machines", selectedMachine.code);
                                    showToast(lang === "en" ? "Synced via MQTT." : "Đã đồng bộ xuống máy qua MQTT.");
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                {lang === "en" ? "Push via MQTT" : "Đồng bộ MQTT"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: THANH TOÁN */}
            {activeTab === "payment" && (
                <div className={styles.grid2Cols}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{lang === "en" ? "Payment Gateways" : "Cổng thanh toán"}</h3></div>
                        {paymentMethods.map((pm) => (
                            <div key={pm.id} className={styles.switchRow}>
                                <strong>{pm.name}</strong>
                                <button type="button" onClick={() => setPaymentMethods((p) => p.map((i) => (i.id === pm.id ? { ...i, active: !i.active } : i)))} className={`${styles.toggleSwitch} ${pm.active ? styles.toggleSwitchOn : ""}`}>
                                    <span className={styles.toggleKnob} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{lang === "en" ? "QR Timeout & VAT" : "Thời hạn QR & Thuế VAT"}</h3></div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                            <div>
                                <label className={styles.fieldLabel}>{lang === "en" ? "QR Timeout (sec)" : "Hết hạn QR (giây)"}</label>
                                <input type="number" value={paymentTimeoutSec} onChange={(e) => setPaymentTimeoutSec(Number(e.target.value))} className={styles.textInput} />
                            </div>
                            <div>
                                <label className={styles.fieldLabel}>{lang === "en" ? "VAT Rate (%)" : "Thuế VAT (%)"}</label>
                                <input type="number" value={vatRatePct} onChange={(e) => setVatRatePct(Number(e.target.value))} className={styles.textInput} />
                            </div>
                        </div>
                        <button type="button" onClick={() => { appendAudit("PAYMENT_SETTINGS_SAVED", "Payment", `Timeout ${paymentTimeoutSec}s, VAT ${vatRatePct}%`); showToast(lang === "en" ? "Payment settings saved." : "Đã lưu cấu hình thanh toán."); }} className={styles.primaryGoldBtn}>
                            {lang === "en" ? "Save" : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 5: THÔNG BÁO */}
            {activeTab === "notifications" && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{lang === "en" ? "Alert Email Template" : "Mẫu email cảnh báo"}</h3></div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>{lang === "en" ? "Template (requires {{machine_code}} & {{timestamp}})" : "Nội dung (bắt buộc có {{machine_code}} và {{timestamp}})"}</label>
                        <textarea rows={3} value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} className={styles.textInput} />
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (!templateBody.includes("{{machine_code}}") || !templateBody.includes("{{timestamp}}")) {
                                showToast(lang === "en" ? "Missing required template variables." : "Thiếu biến bắt buộc {{machine_code}} hoặc {{timestamp}}.");
                                return;
                            }
                            appendAudit("TEMPLATE_SAVED", "Notifications", "Updated alert email template");
                            showToast(lang === "en" ? "Template saved." : "Đã lưu mẫu thông báo.");
                        }}
                        className={styles.primaryGoldBtn}
                    >
                        {lang === "en" ? "Validate & Save" : "Kiểm tra & Lưu"}
                    </button>
                </div>
            )}

            {/* TAB 6: HỆ THỐNG */}
            {activeTab === "system" && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{lang === "en" ? "System Operations" : "Vận hành hệ thống"}</h3></div>
                    <div className={styles.switchRow}>
                        <div>
                            <strong>{lang === "en" ? "Global Maintenance Mode" : "Chế độ bảo trì toàn hệ thống"}</strong>
                            <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>{lang === "en" ? "Pauses customer sessions across all stations" : "Tạm ngưng phiên khách hàng trên toàn mạng lưới"}</div>
                        </div>
                        <button type="button" onClick={() => setConfirmMaintDialog(true)} className={`${styles.toggleSwitch} ${systemMaintenanceMode ? styles.toggleSwitchOn : ""}`}>
                            <span className={styles.toggleKnob} />
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: "0.55rem", marginTop: "0.85rem" }}>
                        <button type="button" onClick={() => { appendAudit("BACKUP_RUN", "System", "Manual DB backup"); showToast(lang === "en" ? "Backup completed." : "Đã sao lưu dữ liệu thành công."); }} className={styles.primaryGoldBtn}>{lang === "en" ? "Run Backup" : "Sao lưu ngay"}</button>
                        <button type="button" onClick={() => { appendAudit("CACHE_CLEARED", "System", "Cleared app cache"); showToast(lang === "en" ? "Cache cleared." : "Đã xóa bộ nhớ đệm."); }} className={styles.secondaryGoldBtn}>{lang === "en" ? "Clear Cache" : "Xóa cache"}</button>
                    </div>
                </div>
            )}

            {/* TAB 7: BẢO MẬT */}
            {activeTab === "security" && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}><h3 className={styles.cardTitle}>{lang === "en" ? "Security Policy" : "Chính sách bảo mật"}</h3></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                        <div>
                            <label className={styles.fieldLabel}>{lang === "en" ? "Min Password Length" : "Độ dài mật khẩu tối thiểu"}</label>
                            <input type="number" min={8} value={minPwLength} onChange={(e) => setMinPwLength(Number(e.target.value))} className={styles.textInput} />
                        </div>
                        <div>
                            <label className={styles.fieldLabel}>{lang === "en" ? "Session Timeout (min)" : "Hết hạn phiên (phút)"}</label>
                            <input type="number" min={5} value={sessionTimeoutMin} onChange={(e) => setSessionTimeoutMin(Number(e.target.value))} className={styles.textInput} />
                        </div>
                    </div>
                    <div className={styles.switchRow}>
                        <span>{lang === "en" ? "IP Whitelist Enforcement" : "Bật danh sách IP được phép"}</span>
                        <button type="button" onClick={() => setIpWhitelistEnabled(!ipWhitelistEnabled)} className={`${styles.toggleSwitch} ${ipWhitelistEnabled ? styles.toggleSwitchOn : ""}`}>
                            <span className={styles.toggleKnob} />
                        </button>
                    </div>
                    <button type="button" onClick={() => { appendAudit("SECURITY_POLICY_SAVED", "Security", `MinPW ${minPwLength}, Timeout ${sessionTimeoutMin}m`); showToast(lang === "en" ? "Security policy saved." : "Đã lưu chính sách bảo mật."); }} className={styles.primaryGoldBtn} style={{ marginTop: "0.5rem" }}>
                        {lang === "en" ? "Save Policy" : "Lưu chính sách"}
                    </button>
                </div>
            )}

            {/* TAB 8: TÍCH HỢP */}
            {activeTab === "integrations" && (
                <div className={styles.grid2Cols}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>VietQR / VNPay API</h3></div>
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
                            <input type={showApiSecret ? "text" : "password"} readOnly value="vnp_prod_hmac_sha256_99887766" className={styles.textInput} />
                            <button type="button" onClick={() => setShowApiSecret(!showApiSecret)} className={styles.secondaryGoldBtn}>{showApiSecret ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                        </div>
                        <button type="button" onClick={() => showToast(lang === "en" ? "Gateway connection OK (200)." : "Kết nối cổng thanh toán ổn định (200 OK).")} className={styles.primaryGoldBtn}>
                            {lang === "en" ? "Test Connection" : "Kiểm tra kết nối"}
                        </button>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>MQTT Broker (IoT)</h3></div>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                            <input type="text" value={mqttHost} onChange={(e) => setMqttHost(e.target.value)} className={styles.textInput} />
                            <input type="text" value={mqttPort} onChange={(e) => setMqttPort(e.target.value)} className={styles.textInput} />
                        </div>
                        <button type="button" onClick={() => showToast(lang === "en" ? `MQTT ${mqttHost}:${mqttPort} connected.` : `Đã kết nối MQTT ${mqttHost}:${mqttPort}.`)} className={styles.primaryGoldBtn}>
                            {lang === "en" ? "Test Broker" : "Kiểm tra Broker"}
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 9: NHẬT KÝ */}
            {activeTab === "audit" && (
                <div className={styles.card}>
                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.85rem" }}>
                        <input type="text" placeholder={lang === "en" ? "Search logs..." : "Tìm nhật ký..."} value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} className={styles.textInput} style={{ flex: 1, minWidth: "200px" }} />
                        <LuxurySelect
                            value={auditSeverity}
                            onChange={setAuditSeverity}
                            minWidth="160px"
                            options={[
                                { value: "ALL", label: lang === "en" ? "All Severity" : "Mọi mức độ" },
                                { value: "INFO", label: "INFO" },
                                { value: "WARNING", label: "WARNING" },
                                { value: "ERROR", label: "ERROR" },
                            ]}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const csv = "ID;Time;Event;User;Module;Severity\n" + filteredAudit.map((r) => `"${r.id}";"${r.timestamp}";"${r.eventType}";"${r.user}";"${r.module}";"${r.severity}"`).join("\n");
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }));
                                link.download = "ScentStation_Audit.csv";
                                link.click();
                                showToast(lang === "en" ? "Exported CSV." : "Đã xuất nhật ký ra CSV.");
                            }}
                            className={styles.primaryGoldBtn}
                        >
                            <Download size={14} /><span>{lang === "en" ? "Export CSV" : "Xuất CSV"}</span>
                        </button>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>{lang === "en" ? "Time" : "Thời điểm"}</th>
                                <th>{lang === "en" ? "Event" : "Sự kiện"}</th>
                                <th>{lang === "en" ? "Actor" : "Người thực hiện"}</th>
                                <th>{lang === "en" ? "Severity" : "Mức độ"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredAudit.slice(0, 20).map((log) => (
                                <tr key={log.id}>
                                    <td style={{ color: "#F5E6AD", whiteSpace: "nowrap" }}>{log.timestamp}</td>
                                    <td><strong>{log.eventType}</strong><div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{log.description}</div></td>
                                    <td>{log.user}</td>
                                    <td style={{ fontWeight: 700, color: log.severity === "ERROR" ? "#F87171" : log.severity === "WARNING" ? "#FACC15" : "#34D399" }}>{log.severity}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN BẢO TRÌ HỆ THỐNG */}
            {confirmMaintDialog && (
                <div className={styles.modalOverlay} onClick={() => setConfirmMaintDialog(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? "Toggle Global Maintenance Mode?" : "Chuyển chế độ bảo trì toàn hệ thống?"}</h3>
                        <p style={{ fontSize: "0.86rem", color: "#FBBF24" }}>
                            {lang === "en" ? "Customer sessions will be paused while enabled." : "Các phiên khách hàng sẽ tạm ngưng khi chế độ này được bật."}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                            <button type="button" onClick={() => setConfirmMaintDialog(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = !systemMaintenanceMode;
                                    setSystemMaintenanceMode(next);
                                    setConfirmMaintDialog(false);
                                    appendAudit("SYSTEM_MAINTENANCE_TOGGLED", "System", `Maintenance → ${next}`);
                                    showToast(next ? (lang === "en" ? "Maintenance mode enabled." : "Đã bật bảo trì hệ thống.") : (lang === "en" ? "Maintenance mode disabled." : "Đã tắt bảo trì hệ thống."));
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