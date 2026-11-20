// noinspection SpellCheckingInspection
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./alerts.module.css";
import {
    Search,
    AlertTriangle,
    AlertOctagon,
    CheckCircle2,
    Clock,
    RefreshCw,
    MoreHorizontal,
    Wrench,
    History,
    Cpu,
    Droplets,
    ShieldAlert,
    X,
    ArrowUpRight,
    MapPin,
    Sparkles,
    Radio,
    Check,
    RotateCcw,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Globe,
    ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type AlertStatus = "OPEN" | "INVESTIGATING" | "RESOLVED";
type AlertCategory = "MACHINE" | "INVENTORY" | "SYSTEM";
type QuickDatePreset =
    | "TODAY"
    | "THIS_WEEK"
    | "LAST_WEEK"
    | "THIS_MONTH"
    | "LAST_30_DAYS"
    | "CUSTOM";

interface AlertHistoryRecord {
    id: string;
    timestamp: string;
    actor: string;
    status: AlertStatus | "TICKET_CREATED" | "SENSOR_DETECTED";
    note: string;
}

interface AlertItem {
    id: string;
    timestamp: string;
    dateStr?: string;
    machineId: string;
    machineLocation: string;
    brand: string;
    productName: string;
    slotNumber: number;
    category: AlertCategory;
    alertType: string;
    description: string;
    severity: AlertSeverity;
    status: AlertStatus;
    remainingVolumeMl: number;
    bottleCapacityMl: number;
    remainingStockPct: number;
    thresholdPct: number;
    lastSensorSync: string;
    isSensorStale: boolean;
    underlyingIssuePersists: boolean;
    activeTicketId?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    history: AlertHistoryRecord[];
}

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

function formatNowTimestamp(): string {
    const now = new Date();
    const ymd = toLocalYmd(now);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${ymd} ${hh}:${mm}:${ss}`;
}

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

const INITIAL_ENTERPRISE_ALERTS: AlertItem[] = [
    {
        id: "ALT-8901",
        timestamp: "2026-11-15 08:52:10",
        dateStr: "2026-11-15",
        machineId: "KIOSK-004",
        machineLocation: "Aeon Mall Tân Phú, TP.HCM",
        brand: "Tom Ford",
        productName: "Tom Ford Black Orchid",
        slotNumber: 1,
        category: "MACHINE",
        alertType: "MQTT_HEARTBEAT_TIMEOUT",
        description: "Mất kết nối mạng > 10 phút và Khoang 01 đã cạn (0.0ml / 100ml).",
        severity: "CRITICAL",
        status: "OPEN",
        remainingVolumeMl: 0.0,
        bottleCapacityMl: 100,
        remainingStockPct: 0,
        thresholdPct: 20,
        lastSensorSync: "2026-11-15 08:40:00",
        isSensorStale: true,
        underlyingIssuePersists: true,
        activeTicketId: "MNT-2026-410",
        history: [
            {
                id: "H-101",
                timestamp: "2026-11-15 08:52:10",
                actor: "MQTT Watchdog",
                status: "SENSOR_DETECTED",
                note: "KIOSK-004 mất 3 nhịp heartbeat liên tiếp.",
            },
            {
                id: "H-102",
                timestamp: "2026-11-15 08:53:00",
                actor: "Alert Engine",
                status: "TICKET_CREATED",
                note: "Tự động liên kết phiếu #MNT-2026-410.",
            },
        ],
    },
    {
        id: "ALT-8902",
        timestamp: "2026-11-15 08:35:42",
        dateStr: "2026-11-15",
        machineId: "KIOSK-SGN-01",
        machineLocation: "Saigon Centre Takashimaya, TP.HCM",
        brand: "Chanel",
        productName: "Bleu de Chanel",
        slotNumber: 3,
        category: "INVENTORY",
        alertType: "LOW_STOCK_SLOT_03",
        description: "Khoang 03 xuống dưới ngưỡng 15% (còn 12.5ml / 100ml).",
        severity: "HIGH",
        status: "OPEN",
        remainingVolumeMl: 12.5,
        bottleCapacityMl: 100,
        remainingStockPct: 13,
        thresholdPct: 15,
        lastSensorSync: "Live (2s)",
        isSensorStale: false,
        underlyingIssuePersists: true,
        history: [
            {
                id: "H-201",
                timestamp: "2026-11-15 08:35:42",
                actor: "Level Sensor #03",
                status: "SENSOR_DETECTED",
                note: "Dung tích còn 12.5ml (dưới ngưỡng 15%).",
            },
        ],
    },
    {
        id: "ALT-8903",
        timestamp: "2026-11-15 07:19:15",
        dateStr: "2026-11-15",
        machineId: "demo-device",
        machineLocation: "Diamond Plaza Atrium, TP.HCM",
        brand: "Maison Francis Kurkdjian",
        productName: "MFK Baccarat Rouge 540",
        slotNumber: 4,
        category: "INVENTORY",
        alertType: "LOW_STOCK_SLOT_04",
        description: "Dung tích còn 9.0ml / 70ml (13%, dưới ngưỡng 15%).",
        severity: "MEDIUM",
        status: "OPEN",
        remainingVolumeMl: 9.0,
        bottleCapacityMl: 70,
        remainingStockPct: 13,
        thresholdPct: 15,
        lastSensorSync: "Live (2s)",
        isSensorStale: false,
        underlyingIssuePersists: true,
        history: [
            {
                id: "H-301",
                timestamp: "2026-11-15 07:19:15",
                actor: "Inventory Monitor",
                status: "SENSOR_DETECTED",
                note: "Còn 9.0ml (~75 lần xịt).",
            },
        ],
    },
    {
        id: "ALT-8904",
        timestamp: "2026-11-14 11:50:19",
        dateStr: "2026-11-14",
        machineId: "KIOSK-HN-02",
        machineLocation: "Tràng Tiền Plaza, Hà Nội",
        brand: "Maison Margiela",
        productName: "Replica By the Fireplace",
        slotNumber: 1,
        category: "MACHINE",
        alertType: "NOZZLE_ACTUATOR_CALIBRATION",
        description: "Áp suất bơm Khoang 01 dưới 1.2 bar. Máy đang ở chế độ bảo trì.",
        severity: "CRITICAL",
        status: "INVESTIGATING",
        remainingVolumeMl: 80.0,
        bottleCapacityMl: 100,
        remainingStockPct: 80,
        thresholdPct: 20,
        lastSensorSync: "2026-11-14 11:55:00",
        isSensorStale: true,
        underlyingIssuePersists: true,
        activeTicketId: "MNT-2026-409",
        history: [
            {
                id: "H-401",
                timestamp: "2026-11-14 11:50:19",
                actor: "Nozzle Controller",
                status: "SENSOR_DETECTED",
                note: "Áp suất đo được: 0.72 bar (chuẩn 1.50 bar).",
            },
            {
                id: "H-402",
                timestamp: "2026-11-14 11:53:00",
                actor: "Operations Manager",
                status: "TICKET_CREATED",
                note: "Đã tạo phiếu bảo trì #MNT-2026-409.",
            },
        ],
    },
    {
        id: "ALT-8906",
        timestamp: "2026-11-12 22:19:08",
        dateStr: "2026-11-12",
        machineId: "KIOSK-SGN-02",
        machineLocation: "Vincom Đồng Khởi, TP.HCM",
        brand: "Chanel",
        productName: "Coco Mademoiselle",
        slotNumber: 1,
        category: "SYSTEM",
        alertType: "WEBHOOK_LATENCY_SPIKE",
        description: "Độ trễ webhook thanh toán đạt 3,850ms (ngưỡng 2,000ms). Đã tự phục hồi.",
        severity: "LOW",
        status: "RESOLVED",
        remainingVolumeMl: 82.0,
        bottleCapacityMl: 100,
        remainingStockPct: 82,
        thresholdPct: 15,
        lastSensorSync: "Live (4s)",
        isSensorStale: false,
        underlyingIssuePersists: false,
        resolvedBy: "Operations Manager",
        resolvedAt: "2026-11-12 22:45:00",
        history: [
            {
                id: "H-601",
                timestamp: "2026-11-12 22:19:08",
                actor: "API Gateway",
                status: "SENSOR_DETECTED",
                note: "Độ trễ phản hồi 3.85s.",
            },
            {
                id: "H-602",
                timestamp: "2026-11-12 22:45:00",
                actor: "Operations Manager",
                status: "RESOLVED",
                note: "Đã kiểm tra kết nối ổn định và đóng cảnh báo.",
            },
        ],
    },
];

const ALERTS_STORAGE_KEY = "scentstation_commercial_alerts_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const MAINTENANCE_STORAGE_KEY = "scentstation_maintenance_tickets_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function AlertsNotificationsPage(): React.ReactElement {
    const router = useRouter();
    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");
    const [lockedTenantBrand, setLockedTenantBrand] = useState<string | null>(null);

    const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ENTERPRISE_ALERTS);
    const [selectedCategory, setSelectedCategory] = useState<"ALL" | AlertCategory>("ALL");
    const [selectedSeverity, setSelectedSeverity] = useState<"ALL" | AlertSeverity>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<"ALL" | AlertStatus>("ALL");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [openDropdown, setOpenDropdown] = useState<
        "CALENDAR" | "SEVERITY" | "STATUS" | "BRAND" | "TICKET_PRIORITY" | "TICKET_TECH" | null
    >(null);

    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState<"details" | "history">("details");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
    const [ticketPriority, setTicketPriority] = useState<"URGENT" | "HIGH" | "NORMAL">("URGENT");
    const [ticketTechnician, setTicketTechnician] = useState<string>("Nguyễn Hoàng Nam (TE)");
    const [ticketNotes, setTicketNotes] = useState<string>("");

    // Phân quyền chuẩn theo 6 vai trò nội bộ
    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canDispatchTicket = currentRole === "OM";
    const canResolveAlert = currentRole === "OM";
    const canRecoverAlert = (alert: AlertItem) => {
        if (alert.category === "INVENTORY") return currentRole === "IS";
        if (alert.category === "MACHINE") return currentRole === "TE" || currentRole === "OM";
        return currentRole === "OM";
    };

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

    const formatSeverity = (sev: AlertSeverity) => {
        if (lang === "en") return sev;
        if (sev === "CRITICAL") return "Khẩn cấp";
        if (sev === "HIGH") return "Cao";
        if (sev === "MEDIUM") return "Trung bình";
        return "Thấp";
    };

    const formatStatus = (st: AlertStatus) => {
        if (lang === "en") return st === "OPEN" ? "Open" : st === "INVESTIGATING" ? "Investigating" : "Resolved";
        return st === "OPEN" ? "Đang mở" : st === "INVESTIGATING" ? "Đang xử lý" : "Đã xử lý";
    };

    const formatCategory = (cat: AlertCategory) => {
        if (lang === "en") return cat === "MACHINE" ? "Machine" : cat === "INVENTORY" ? "Inventory" : "System";
        return cat === "MACHINE" ? "Máy" : cat === "INVENTORY" ? "Tồn kho" : "Hệ thống";
    };

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
            const dt = new Date(calendarViewYear, calendarViewMonth - 1, prevMonthDays - i);
            cells.push({ ymd: toLocalYmd(dt), dayNum: prevMonthDays - i, isCurrentMonth: false });
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
        return dt.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", { month: "long", year: "numeric" });
    }, [calendarViewYear, calendarViewMonth, lang]);

    const selectedAlert = useMemo(() => alerts.find((a) => a.id === selectedAlertId) || null, [alerts, selectedAlertId]);

    const loadAndReconcileAlerts = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            const rawUser = sessionStorage.getItem("scentstation-user") || localStorage.getItem("scentstation-user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                const resolvedRole = normalizeRole(parsedUser.roleCode || parsedUser.role || parsedUser.roles?.[0]);
                setCurrentRole(resolvedRole);
                setCurrentActorLabel(parsedUser.fullName || parsedUser.name || ROLE_PERMISSIONS[resolvedRole].label);
                const scope = parsedUser.brandScope || parsedUser.brand || null;
                if (resolvedRole === "BA" && scope) {
                    setLockedTenantBrand(scope);
                    setSelectedBrand(scope);
                } else {
                    setLockedTenantBrand(null);
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};

            let workingAlerts: AlertItem[] = [...INITIAL_ENTERPRISE_ALERTS];
            const rawSavedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
            if (rawSavedAlerts) {
                const parsedAlerts = JSON.parse(rawSavedAlerts);
                if (Array.isArray(parsedAlerts) && parsedAlerts.length > 0) workingAlerts = parsedAlerts;
            }

            workingAlerts = workingAlerts.map((a) => {
                const matrixMl = perKioskMatrix[a.machineId.toLowerCase()]?.[a.productName.trim().toLowerCase()];
                if (typeof matrixMl === "number") {
                    const nextMl = Number(Math.max(0, matrixMl).toFixed(2));
                    const nextPct = Math.max(0, Math.round((nextMl / (a.bottleCapacityMl || 100)) * 100));
                    const isRecovered = nextPct > a.thresholdPct;
                    if (a.category === "INVENTORY") {
                        return {
                            ...a,
                            remainingVolumeMl: nextMl,
                            remainingStockPct: nextPct,
                            underlyingIssuePersists: !isRecovered,
                            status: isRecovered ? "RESOLVED" : a.status,
                        };
                    }
                    return { ...a, remainingVolumeMl: nextMl, remainingStockPct: nextPct };
                }
                return a;
            });

            setAlerts(workingAlerts);
            localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(workingAlerts));
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadAndReconcileAlerts();
        const handleSync = () => loadAndReconcileAlerts();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadAndReconcileAlerts]);

    const syncResolutionToAllStores = useCallback(
        (resolvedAlert: AlertItem, isHardwareRecovered: boolean, qtyBeforeMl?: number) => {
            try {
                const nextAlerts = alerts.map((a) => (a.id === resolvedAlert.id ? resolvedAlert : a));
                setAlerts(nextAlerts);
                localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(nextAlerts));

                const nowIso = new Date().toISOString();
                const kKey = resolvedAlert.machineId.toLowerCase();
                const pKey = resolvedAlert.productName.trim().toLowerCase();

                if (isHardwareRecovered) {
                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    perKioskMatrix[kKey][pKey] = resolvedAlert.bottleCapacityMl;
                    localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                    const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                    if (rawMachines) {
                        const parsedFleet = JSON.parse(rawMachines);
                        if (Array.isArray(parsedFleet)) {
                            const updatedFleet = parsedFleet.map((fm: any) =>
                                String(fm.code || fm.id || "").toLowerCase() === kKey
                                    ? { ...fm, status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE" }
                                    : fm
                            );
                            localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
                        }
                    }

                    const rawMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movList = rawMov ? JSON.parse(rawMov) : [];
                    movList.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: resolvedAlert.id,
                        kioskCode: resolvedAlert.machineId,
                        slotNumber: resolvedAlert.slotNumber,
                        brand: resolvedAlert.brand,
                        productName: resolvedAlert.productName,
                        movementType: "INSTALL",
                        quantityBeforeMl: qtyBeforeMl ?? 0,
                        quantityAfterMl: resolvedAlert.bottleCapacityMl,
                        deltaMl: Number((resolvedAlert.bottleCapacityMl - (qtyBeforeMl ?? 0)).toFixed(2)),
                        timestamp: nowIso,
                    });
                    localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(movList.slice(0, 300)));
                }

                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                if (rawDash && resolvedAlert.status === "RESOLVED") {
                    const dashData = JSON.parse(rawDash);
                    if (Array.isArray(dashData.alerts)) {
                        dashData.alerts = dashData.alerts.filter((da: any) => da.id !== resolvedAlert.id);
                    }
                    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));
                }

                const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                auditList.unshift({
                    id: `AUD-${Date.now().toString().slice(-4)}`,
                    timestamp: nowIso,
                    actor: currentActorLabel,
                    role: currentRole,
                    tenant: resolvedAlert.brand,
                    action: resolvedAlert.status === "RESOLVED" ? "ALERT_RESOLVED" : "ALERT_UPDATED",
                    entityType: "ALERTS",
                    entityId: resolvedAlert.id,
                    severity: "INFO",
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditList.slice(0, 250)));

                window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        [alerts, currentActorLabel, currentRole]
    );

    const availableBrands = useMemo(() => Array.from(new Set(alerts.map((a) => a.brand))).sort(), [alerts]);
    const effectiveBrand = lockedTenantBrand || selectedBrand;

    const contextFilteredAlerts = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return alerts.filter((a) => {
            const dStr = a.dateStr || (a.timestamp.includes(" ") ? a.timestamp.split(" ")[0] : todayYmd);
            const matchesDate = dStr >= startDate && dStr <= endDate;
            const matchesStatus = selectedStatus === "ALL" || a.status === selectedStatus;
            const matchesBrand = effectiveBrand === "ALL" || a.brand === effectiveBrand;
            const matchesSearch =
                !q ||
                a.id.toLowerCase().includes(q) ||
                a.machineId.toLowerCase().includes(q) ||
                a.productName.toLowerCase().includes(q) ||
                a.alertType.toLowerCase().includes(q) ||
                a.brand.toLowerCase().includes(q);
            return matchesDate && matchesStatus && matchesBrand && matchesSearch;
        });
    }, [alerts, startDate, endDate, todayYmd, selectedStatus, effectiveBrand, searchQuery]);

    const baseFilteredAlerts = useMemo(
        () => contextFilteredAlerts.filter((a) => selectedCategory === "ALL" || a.category === selectedCategory),
        [contextFilteredAlerts, selectedCategory]
    );

    const displayedAlerts = useMemo(
        () => baseFilteredAlerts.filter((a) => selectedSeverity === "ALL" || a.severity === selectedSeverity),
        [baseFilteredAlerts, selectedSeverity]
    );

    const summaryCounts = useMemo(
        () => ({
            ALL: baseFilteredAlerts.length,
            CRITICAL: baseFilteredAlerts.filter((a) => a.severity === "CRITICAL").length,
            HIGH: baseFilteredAlerts.filter((a) => a.severity === "HIGH").length,
            MEDIUM: baseFilteredAlerts.filter((a) => a.severity === "MEDIUM").length,
            LOW: baseFilteredAlerts.filter((a) => a.severity === "LOW").length,
        }),
        [baseFilteredAlerts]
    );

    const handleResetFilters = () => {
        setStartDate(defaultStart30d);
        setEndDate(todayYmd);
        setDatePreset("LAST_30_DAYS");
        setSelectedCategory("ALL");
        setSelectedSeverity("ALL");
        setSelectedStatus("ALL");
        if (!lockedTenantBrand) setSelectedBrand("ALL");
        setSearchQuery("");
        setOpenDropdown(null);
    };

    const handleMarkAsResolved = (alertItem: AlertItem) => {
        if (!canResolveAlert) return;
        if (alertItem.status === "RESOLVED") return;
        if (alertItem.underlyingIssuePersists) {
            setActionFeedback({
                type: "error",
                text:
                    lang === "en"
                        ? `Cannot resolve ${alertItem.id}: sensor still reports active fault (${alertItem.alertType}). Fix hardware/refill first.`
                        : `Không thể đóng ${alertItem.id}: cảm biến vẫn ghi nhận lỗi (${alertItem.alertType}). Cần xử lý thực tế trước.`,
            });
            return;
        }

        const nowStr = formatNowTimestamp();
        const updatedAlert: AlertItem = {
            ...alertItem,
            status: "RESOLVED",
            resolvedBy: currentActorLabel,
            resolvedAt: nowStr,
            history: [
                {
                    id: `H-${Date.now()}`,
                    timestamp: nowStr,
                    actor: currentActorLabel,
                    status: "RESOLVED",
                    note: lang === "en" ? "Verified recovery and closed alert." : "Đã xác nhận khắc phục và đóng cảnh báo.",
                },
                ...alertItem.history,
            ],
        };
        syncResolutionToAllStores(updatedAlert, true, alertItem.remainingVolumeMl);
        const msg = lang === "en" ? `Resolved ${alertItem.id}.` : `Đã đóng cảnh báo ${alertItem.id}.`;
        setActionFeedback({ type: "success", text: msg });
        showToast(msg);
    };

    const handleSimulateHardwareFix = (alertItem: AlertItem) => {
        if (!canRecoverAlert(alertItem)) return;
        const nowStr = formatNowTimestamp();
        const prevMl = alertItem.remainingVolumeMl;
        const updatedAlert: AlertItem = {
            ...alertItem,
            underlyingIssuePersists: false,
            isSensorStale: false,
            remainingVolumeMl: alertItem.bottleCapacityMl,
            remainingStockPct: 100,
            lastSensorSync: `${nowStr}`,
            history: [
                {
                    id: `H-${Date.now()}`,
                    timestamp: nowStr,
                    actor: currentActorLabel,
                    status: "SENSOR_DETECTED",
                    note:
                        alertItem.category === "INVENTORY"
                            ? `${lang === "en" ? "Replenished to" : "Đã nạp đầy"} ${alertItem.bottleCapacityMl}ml (100%).`
                            : `${lang === "en" ? "Restored station" : "Đã khôi phục trạm"} ${alertItem.machineId}.`,
                },
                ...alertItem.history,
            ],
        };
        syncResolutionToAllStores(updatedAlert, true, prevMl);
        const msg =
            lang === "en"
                ? `Updated ${alertItem.machineId} to nominal state. Ready to resolve.`
                : `Đã cập nhật trạng thái ổn định cho ${alertItem.machineId}. Có thể đóng cảnh báo.`;
        setActionFeedback({ type: "success", text: msg });
        showToast(msg);
    };

    const openCreateTicketModal = (alertItem: AlertItem) => {
        setSelectedAlertId(alertItem.id);
        setActionFeedback(null);
        if (!canDispatchTicket) return;
        if (alertItem.activeTicketId) {
            setActionFeedback({
                type: "error",
                text:
                    lang === "en"
                        ? `Ticket #${alertItem.activeTicketId} already exists for this alert.`
                        : `Cảnh báo này đã có phiếu bảo trì #${alertItem.activeTicketId} đang xử lý.`,
            });
            return;
        }
        setTicketPriority(alertItem.severity === "CRITICAL" ? "URGENT" : "HIGH");
        setTicketNotes(`${alertItem.alertType} — ${alertItem.machineId} (Slot ${String(alertItem.slotNumber).padStart(2, "0")})`);
        setOpenDropdown(null);
        setIsTicketModalOpen(true);
    };

    const handleCreateTicketSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedAlert || !canDispatchTicket) return;

        const newTicketCode = `MNT-2026-${Math.floor(500 + Math.random() * 400)}`;
        const nowStr = formatNowTimestamp();
        const updatedAlert: AlertItem = {
            ...selectedAlert,
            status: selectedAlert.status === "OPEN" ? "INVESTIGATING" : selectedAlert.status,
            activeTicketId: newTicketCode,
            history: [
                {
                    id: `H-${Date.now()}`,
                    timestamp: nowStr,
                    actor: currentActorLabel,
                    status: "TICKET_CREATED",
                    note: `#${newTicketCode} [${ticketPriority}] → ${ticketTechnician}`,
                },
                ...selectedAlert.history,
            ],
        };

        try {
            const rawMaint = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
            const maintList = rawMaint ? JSON.parse(rawMaint) : [];
            maintList.unshift({
                id: newTicketCode,
                alertId: selectedAlert.id,
                machineId: selectedAlert.machineId,
                location: selectedAlert.machineLocation,
                brand: selectedAlert.brand,
                productName: selectedAlert.productName,
                slotNumber: selectedAlert.slotNumber,
                issueType: selectedAlert.alertType,
                priority: ticketPriority,
                technician: ticketTechnician,
                status: "IN_PROGRESS",
                notes: ticketNotes,
                createdAt: nowStr,
            });
            localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(maintList));
        } catch {
            // Safe fallback
        }

        syncResolutionToAllStores(updatedAlert, false);
        setIsTicketModalOpen(false);
        showToast(
            lang === "en"
                ? `Created ticket #${newTicketCode}.`
                : `Đã tạo phiếu bảo trì #${newTicketCode}.`
        );
    };

    const renderSeverityBadge = (sev: AlertSeverity) => {
        if (sev === "CRITICAL") return <span className={styles.sevCritical}><AlertOctagon size={12} /> {formatSeverity(sev)}</span>;
        if (sev === "HIGH") return <span className={styles.sevHigh}><AlertTriangle size={12} /> {formatSeverity(sev)}</span>;
        if (sev === "MEDIUM") return <span className={styles.sevMedium}><Clock size={12} /> {formatSeverity(sev)}</span>;
        return <span className={styles.sevLow}><Radio size={12} /> {formatSeverity(sev)}</span>;
    };

    const renderStatusBadge = (st: AlertStatus) => {
        if (st === "OPEN") return <span className={styles.statusOpen}>● {formatStatus(st)}</span>;
        if (st === "INVESTIGATING") return <span className={styles.statusInvestigating}>◐ {formatStatus(st)}</span>;
        return <span className={styles.statusResolved}><CheckCircle2 size={12} /> {formatStatus(st)}</span>;
    };

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => {
                setOpenMenuId(null);
                setOpenDropdown(null);
            }}
        >
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>
                            {lang === "en" ? "Alerts" : "Cảnh báo hệ thống"}
                        </h1>
                        <div className={styles.scopeBadge}>
                            <span>{roleConfig.label}</span>
                            {lockedTenantBrand && <span>• {lockedTenantBrand}</span>}
                        </div>
                    </div>

                    <div className={styles.headerActions} onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={handleToggleLanguage} className={styles.secondaryGoldBtn}>
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem(ALERTS_STORAGE_KEY);
                                setAlerts(INITIAL_ENTERPRISE_ALERTS);
                                setSelectedAlertId(null);
                                showToast(lang === "en" ? "Alert list reset." : "Đã khôi phục danh sách mẫu.");
                            }}
                            className={styles.secondaryGoldBtn}
                        >
                            <RotateCcw size={13} color="#D4AF37" />
                            <span>{lang === "en" ? "Reset" : "Làm mới"}</span>
                        </button>
                    </div>
                </div>

                {/* 5 KPI MỨC ĐỘ */}
                <div className={styles.summaryGrid}>
                    {[
                        { key: "ALL", label: lang === "en" ? "All" : "Tất cả", count: summaryCounts.ALL, color: "#FFFFFF" },
                        { key: "CRITICAL", label: formatSeverity("CRITICAL"), count: summaryCounts.CRITICAL, color: "#F87171" },
                        { key: "HIGH", label: formatSeverity("HIGH"), count: summaryCounts.HIGH, color: "#FB923C" },
                        { key: "MEDIUM", label: formatSeverity("MEDIUM"), count: summaryCounts.MEDIUM, color: "#FACC15" },
                        { key: "LOW", label: formatSeverity("LOW"), count: summaryCounts.LOW, color: "#38BDF8" },
                    ].map((card) => (
                        <div
                            key={card.key}
                            onClick={() => setSelectedSeverity(card.key as any)}
                            className={`${styles.summaryCard} ${selectedSeverity === card.key ? styles.summaryCardActive : ""}`}
                        >
                            <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{card.label}</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: card.color, marginTop: "0.25rem" }}>{card.count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TAB DANH MỤC */}
            <div className={styles.categoryTabsBar}>
                {[
                    { id: "ALL", label: lang === "en" ? "All" : "Tất cả", icon: ShieldAlert, count: contextFilteredAlerts.length },
                    { id: "MACHINE", label: formatCategory("MACHINE"), icon: Cpu, count: contextFilteredAlerts.filter((a) => a.category === "MACHINE").length },
                    { id: "INVENTORY", label: formatCategory("INVENTORY"), icon: Droplets, count: contextFilteredAlerts.filter((a) => a.category === "INVENTORY").length },
                    { id: "SYSTEM", label: formatCategory("SYSTEM"), icon: Radio, count: contextFilteredAlerts.filter((a) => a.category === "SYSTEM").length },
                ].map((tab) => {
                    const IconComp = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedCategory(tab.id as any)}
                            className={`${styles.categoryTabBtn} ${selectedCategory === tab.id ? styles.categoryTabBtnActive : ""}`}
                        >
                            <IconComp size={14} />
                            <span>{tab.label}</span>
                            <span className={styles.categoryBadge}>{tab.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* BỘ LỌC */}
            <div className={styles.filterBar} onClick={(e) => e.stopPropagation()}>
                <div className={styles.filterRowTop}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={lang === "en" ? "Search alert ID, station, brand, product..." : "Tìm mã cảnh báo, trạm, thương hiệu, sản phẩm..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.6rem", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* LỊCH */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === "CALENDAR" ? null : "CALENDAR")}
                            className={`${styles.customDropdownTrigger} ${openDropdown === "CALENDAR" ? styles.customDropdownTriggerActive : ""}`}
                        >
                            <Calendar size={14} color="#D4AF37" />
                            <span>{formatFullDisplayDate(startDate)} — {formatFullDisplayDate(endDate)}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>

                        {openDropdown === "CALENDAR" && (
                            <div className={styles.calendarPopover}>
                                <div className={styles.calendarHeader}>
                                    <button type="button" onClick={() => { if (calendarViewMonth === 0) { setCalendarViewMonth(11); setCalendarViewYear((y) => y - 1); } else { setCalendarViewMonth((m) => m - 1); } }} className={styles.calendarNavBtn}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className={styles.calendarMonthTitle}>{monthTitleText}</span>
                                    <button type="button" onClick={() => { if (calendarViewMonth === 11) { setCalendarViewMonth(0); setCalendarViewYear((y) => y + 1); } else { setCalendarViewMonth((m) => m + 1); } }} className={styles.calendarNavBtn}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                                <div className={styles.calendarWeekdaysGrid}>
                                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((wd) => <span key={wd}>{wd}</span>)}
                                </div>
                                <div className={styles.calendarDaysGrid}>
                                    {calendarGridCells.map((cell) => (
                                        <button
                                            key={cell.ymd}
                                            type="button"
                                            onClick={() => handleSelectCalendarDay(cell.ymd)}
                                            className={`${styles.calendarDayBtn} ${!cell.isCurrentMonth ? styles.calendarDayMuted : ""} ${cell.ymd > startDate && cell.ymd < endDate ? styles.calendarDayInRange : ""} ${cell.ymd === startDate || cell.ymd === endDate ? styles.calendarDaySelected : ""}`}
                                        >
                                            {cell.dayNum}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MỨC ĐỘ */}
                    <div className={styles.customDropdownWrap}>
                        <button type="button" onClick={() => setOpenDropdown(openDropdown === "SEVERITY" ? null : "SEVERITY")} className={styles.customDropdownTrigger}>
                            <span>{selectedSeverity === "ALL" ? (lang === "en" ? "All Severity" : "Mọi mức độ") : formatSeverity(selectedSeverity)}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "SEVERITY" && (
                            <div className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}>
                                {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
                                    <button key={sev} type="button" onClick={() => { setSelectedSeverity(sev); setOpenDropdown(null); }} className={`${styles.customDropdownItem} ${selectedSeverity === sev ? styles.customDropdownItemActive : ""}`}>
                                        <span>{sev === "ALL" ? (lang === "en" ? "All Severity" : "Mọi mức độ") : formatSeverity(sev)}</span>
                                        {selectedSeverity === sev && <Check size={13} color="#D4AF37" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TRẠNG THÁI */}
                    <div className={styles.customDropdownWrap}>
                        <button type="button" onClick={() => setOpenDropdown(openDropdown === "STATUS" ? null : "STATUS")} className={styles.customDropdownTrigger}>
                            <span>{selectedStatus === "ALL" ? (lang === "en" ? "All Status" : "Mọi trạng thái") : formatStatus(selectedStatus)}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}>
                                {(["ALL", "OPEN", "INVESTIGATING", "RESOLVED"] as const).map((st) => (
                                    <button key={st} type="button" onClick={() => { setSelectedStatus(st); setOpenDropdown(null); }} className={`${styles.customDropdownItem} ${selectedStatus === st ? styles.customDropdownItemActive : ""}`}>
                                        <span>{st === "ALL" ? (lang === "en" ? "All Status" : "Mọi trạng thái") : formatStatus(st)}</span>
                                        {selectedStatus === st && <Check size={13} color="#D4AF37" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* THƯƠNG HIỆU (ẨN VỚI BA) */}
                    {!lockedTenantBrand ? (
                        <div className={styles.customDropdownWrap}>
                            <button type="button" onClick={() => setOpenDropdown(openDropdown === "BRAND" ? null : "BRAND")} className={styles.customDropdownTrigger}>
                                <span>{selectedBrand === "ALL" ? (lang === "en" ? "All Brands" : "Tất cả thương hiệu") : selectedBrand}</span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "BRAND" && (
                                <div className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}>
                                    <button type="button" onClick={() => { setSelectedBrand("ALL"); setOpenDropdown(null); }} className={`${styles.customDropdownItem} ${selectedBrand === "ALL" ? styles.customDropdownItemActive : ""}`}>
                                        <span>{lang === "en" ? "All Brands" : "Tất cả thương hiệu"}</span>
                                    </button>
                                    {availableBrands.map((b) => (
                                        <button key={b} type="button" onClick={() => { setSelectedBrand(b); setOpenDropdown(null); }} className={`${styles.customDropdownItem} ${selectedBrand === b ? styles.customDropdownItemActive : ""}`}>
                                            <span>{b}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.secondaryGoldBtn}>
                            <ShieldCheck size={13} color="#34D399" />
                            <span>{lockedTenantBrand}</span>
                        </div>
                    )}
                </div>

                <div className={styles.filterRowBottom}>
                    <div className={styles.quickRangePillsGroup}>
                        {(
                            [
                                { id: "TODAY", label: lang === "en" ? "Today" : "Hôm nay" },
                                { id: "THIS_WEEK", label: lang === "en" ? "This Week" : "Tuần này" },
                                { id: "THIS_MONTH", label: lang === "en" ? "This Month" : "Tháng này" },
                                { id: "LAST_30_DAYS", label: lang === "en" ? "30 Days" : "30 ngày" },
                            ] as const
                        ).map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleApplyDatePreset(preset.id)}
                                className={`${styles.quickRangePill} ${datePreset === preset.id ? styles.quickRangePillActive : ""}`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <button type="button" onClick={handleResetFilters} className={styles.secondaryGoldBtn}>
                        <RefreshCw size={13} />
                        <span>{lang === "en" ? "Clear Filters" : "Xóa lọc"}</span>
                    </button>
                </div>
            </div>

            {/* BẢNG CẢNH BÁO */}
            {displayedAlerts.length > 0 ? (
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>{lang === "en" ? "Time & ID" : "Thời điểm & Mã"}</th>
                                <th>{lang === "en" ? "Station & Product" : "Trạm & Sản phẩm"}</th>
                                <th>{lang === "en" ? "Alert Type" : "Loại cảnh báo"}</th>
                                <th>{lang === "en" ? "Level" : "Mức tồn"}</th>
                                <th>{lang === "en" ? "Severity" : "Mức độ"}</th>
                                <th>{lang === "en" ? "Status" : "Trạng thái"}</th>
                                <th style={{ textAlign: "right" }}>{lang === "en" ? "Actions" : "Thao tác"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {displayedAlerts.map((alert) => (
                                <tr
                                    key={alert.id}
                                    className={`${styles.tableRow} ${selectedAlert?.id === alert.id ? styles.tableRowSelected : ""}`}
                                    onClick={() => {
                                        setSelectedAlertId(alert.id);
                                        setDrawerTab("details");
                                        setActionFeedback(null);
                                    }}
                                >
                                    <td className={styles.tableCell} style={{ whiteSpace: "nowrap" }}>
                                        <div>{alert.timestamp}</div>
                                        <div style={{ fontSize: "0.76rem", color: "#F5E6AD", fontWeight: 700 }}>{alert.id}</div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div style={{ fontWeight: 700 }}>{alert.machineId}</div>
                                        <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>{alert.brand} • {alert.productName}</div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div style={{ fontWeight: 700, color: "#F5E6AD" }}>{alert.alertType}</div>
                                        <div style={{ fontSize: "0.76rem", color: "#CBD5E1", maxWidth: "260px" }}>{alert.description}</div>
                                    </td>
                                    <td className={styles.tableCell} style={{ whiteSpace: "nowrap" }}>
                                        <strong style={{ color: alert.remainingStockPct <= alert.thresholdPct ? "#F87171" : "#34D399" }}>
                                            {alert.remainingVolumeMl}ml / {alert.bottleCapacityMl}ml ({alert.remainingStockPct}%)
                                        </strong>
                                    </td>
                                    <td className={styles.tableCell}>{renderSeverityBadge(alert.severity)}</td>
                                    <td className={styles.tableCell}>
                                        {renderStatusBadge(alert.status)}
                                        {alert.activeTicketId && (
                                            <div style={{ fontSize: "0.72rem", color: "#F5E6AD", marginTop: "3px" }}>#{alert.activeTicketId}</div>
                                        )}
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: "right", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                                        <button type="button" className={styles.actionButton} style={{ padding: "0.38rem 0.55rem" }} onClick={() => setOpenMenuId(openMenuId === alert.id ? null : alert.id)}>
                                            <MoreHorizontal size={15} color="#D4AF37" />
                                        </button>
                                        {openMenuId === alert.id && (
                                            <div className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}>
                                                <button type="button" onClick={() => { setSelectedAlertId(alert.id); setDrawerTab("details"); setOpenMenuId(null); }} className={styles.customDropdownItem}>
                                                    {lang === "en" ? "View Details" : "Xem chi tiết"}
                                                </button>
                                                {canRecoverAlert(alert) && alert.underlyingIssuePersists && alert.status !== "RESOLVED" && (
                                                    <button type="button" onClick={() => { setSelectedAlertId(alert.id); handleSimulateHardwareFix(alert); setOpenMenuId(null); }} className={styles.customDropdownItem} style={{ color: "#38BDF8" }}>
                                                        {alert.category === "INVENTORY" ? (lang === "en" ? "Refill 100%" : "Nạp đầy 100%") : (lang === "en" ? "Recover Hardware" : "Khôi phục máy")}
                                                    </button>
                                                )}
                                                {canResolveAlert && alert.status !== "RESOLVED" && (
                                                    <button type="button" onClick={() => { setSelectedAlertId(alert.id); handleMarkAsResolved(alert); setOpenMenuId(null); }} className={styles.customDropdownItem} style={{ color: "#34D399" }}>
                                                        {lang === "en" ? "Mark Resolved" : "Đánh dấu đã xử lý"}
                                                    </button>
                                                )}
                                                {canDispatchTicket && (
                                                    <button type="button" onClick={() => { openCreateTicketModal(alert); setOpenMenuId(null); }} className={styles.customDropdownItem} style={{ color: "#F5E6AD" }}>
                                                        {lang === "en" ? "Create Ticket" : "Tạo phiếu bảo trì"}
                                                    </button>
                                                )}
                                                <button type="button" onClick={() => { setSelectedAlertId(alert.id); setDrawerTab("history"); setOpenMenuId(null); }} className={styles.customDropdownItem}>
                                                    {lang === "en" ? "View History" : "Xem lịch sử"}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "3rem", background: "#121622", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#F5E6AD", marginBottom: "0.75rem" }}>
                        {lang === "en" ? "No alerts found" : "Không có cảnh báo phù hợp"}
                    </p>
                    <button type="button" onClick={handleResetFilters} className={styles.secondaryGoldBtn}>
                        {lang === "en" ? "Clear Filters" : "Xóa bộ lọc"}
                    </button>
                </div>
            )}

            {/* MODAL CHI TIẾT CẢNH BÁO */}
            {selectedAlert && (
                <div className={styles.drawerOverlay} onClick={() => setSelectedAlertId(null)}>
                    <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                                        <strong style={{ color: "#D4AF37", fontSize: "0.82rem" }}>{selectedAlert.id}</strong>
                                        {renderSeverityBadge(selectedAlert.severity)}
                                        {renderStatusBadge(selectedAlert.status)}
                                    </div>
                                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{selectedAlert.alertType}</h2>
                                    <div style={{ fontSize: "0.78rem", color: "#94A3B8", marginTop: "2px" }}>
                                        {selectedAlert.timestamp} • {selectedAlert.machineId} • {selectedAlert.brand}
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexShrink: 0 }}>
                                    {canDispatchTicket && (
                                        <button type="button" onClick={() => openCreateTicketModal(selectedAlert)} className={styles.secondaryGoldBtn}>
                                            <Wrench size={14} color="#D4AF37" />
                                            <span>{selectedAlert.activeTicketId ? `#${selectedAlert.activeTicketId}` : lang === "en" ? "Ticket" : "Tạo phiếu"}</span>
                                        </button>
                                    )}
                                    {canResolveAlert && (
                                        <button type="button" onClick={() => handleMarkAsResolved(selectedAlert)} disabled={selectedAlert.status === "RESOLVED"} className={styles.primaryGoldBtn}>
                                            <Check size={14} />
                                            <span>{selectedAlert.status === "RESOLVED" ? (lang === "en" ? "Resolved" : "Đã đóng") : lang === "en" ? "Resolve" : "Đóng cảnh báo"}</span>
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setSelectedAlertId(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.45rem 0.6rem" }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerTabsBar}>
                            <button type="button" onClick={() => setDrawerTab("details")} className={`${styles.categoryTabBtn} ${drawerTab === "details" ? styles.categoryTabBtnActive : ""}`} style={{ justifyContent: "center" }}>
                                <Sparkles size={14} />
                                <span>{lang === "en" ? "Details" : "Chi tiết"}</span>
                            </button>
                            <button type="button" onClick={() => setDrawerTab("history")} className={`${styles.categoryTabBtn} ${drawerTab === "history" ? styles.categoryTabBtnActive : ""}`} style={{ justifyContent: "center" }}>
                                <History size={14} />
                                <span>{lang === "en" ? `History (${selectedAlert.history.length})` : `Lịch sử (${selectedAlert.history.length})`}</span>
                            </button>
                        </div>

                        <div className={styles.drawerBody}>
                            {actionFeedback && (
                                <div style={{ marginBottom: "0.85rem", padding: "0.75rem 0.95rem", borderRadius: "10px", background: actionFeedback.type === "success" ? "rgba(52, 211, 153, 0.14)" : "rgba(248, 113, 113, 0.14)", border: `1px solid ${actionFeedback.type === "success" ? "rgba(52, 211, 153, 0.4)" : "rgba(248, 113, 113, 0.45)"}`, color: actionFeedback.type === "success" ? "#34D399" : "#F87171", fontSize: "0.84rem" }}>
                                    {actionFeedback.text}
                                </div>
                            )}

                            {drawerTab === "details" ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    <div className={styles.glassCard}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.35rem" }}>
                                            <strong style={{ color: "#D4AF37" }}>{lang === "en" ? "Description" : "Mô tả sự cố"}</strong>
                                            <span style={{ color: "#94A3B8" }}>{lang === "en" ? "Updated:" : "Cập nhật:"} {selectedAlert.lastSensorSync}</span>
                                        </div>
                                        <p style={{ margin: 0, color: "#E2E8F0", fontSize: "0.88rem", lineHeight: 1.5 }}>{selectedAlert.description}</p>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                        <div className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "Station" : "Trạm Kiosk"}</div>
                                                <div style={{ fontWeight: 700 }}>{selectedAlert.machineId}</div>
                                                <div style={{ fontSize: "0.78rem", color: "#CBD5E1" }}>
                                                    <MapPin size={12} color="#D4AF37" style={{ display: "inline", marginRight: "4px" }} />
                                                    {selectedAlert.machineLocation}
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => router.push(`/machines/${encodeURIComponent(selectedAlert.machineId)}`)} className={styles.secondaryGoldBtn} style={{ padding: "0.4rem 0.65rem", fontSize: "0.76rem" }}>
                                                <span>{lang === "en" ? "Open" : "Mở máy"}</span>
                                                <ArrowUpRight size={12} />
                                            </button>
                                        </div>

                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "Product & Slot" : "Sản phẩm & Khoang"}</div>
                                            <div style={{ fontWeight: 700, color: "#F5E6AD" }}>{selectedAlert.brand} — {selectedAlert.productName}</div>
                                            <div style={{ fontSize: "0.78rem", color: "#CBD5E1" }}>
                                                {lang === "en" ? "Slot" : "Khoang"} #{String(selectedAlert.slotNumber).padStart(2, "0")} • {formatCategory(selectedAlert.category)}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedAlert.underlyingIssuePersists && selectedAlert.status !== "RESOLVED" && canRecoverAlert(selectedAlert) && (
                                        <div className={styles.glassCard} style={{ borderColor: "rgba(212, 175, 55, 0.4)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                                            <div style={{ fontSize: "0.82rem", color: "#CBD5E1" }}>
                                                {lang === "en"
                                                    ? "Hardware/stock fault is still active. Confirm physical fix before resolving."
                                                    : "Lỗi thực tế vẫn còn. Cần xác nhận đã nạp chai / sửa máy trước khi đóng cảnh báo."}
                                            </div>
                                            <button type="button" onClick={() => handleSimulateHardwareFix(selectedAlert)} className={styles.primaryGoldBtn}>
                                                <Droplets size={14} />
                                                <span>{selectedAlert.category === "INVENTORY" ? (lang === "en" ? "Refill 100%" : "Nạp đầy 100%") : (lang === "en" ? "Confirm Fix" : "Xác nhận đã sửa")}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                    {selectedAlert.history.map((h) => (
                                        <div key={h.id} className={styles.glassCard} style={{ borderLeft: "3px solid #D4AF37" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                                                <strong>{h.actor}</strong>
                                                <span style={{ color: "#F5E6AD", fontSize: "0.78rem" }}>{h.timestamp}</span>
                                            </div>
                                            <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.82rem", color: "#CBD5E1" }}>{h.note}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.drawerFooter}>
                            <div className={styles.footerMetricBox}>
                                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Slot" : "Khoang"}</span>
                                <strong>#{String(selectedAlert.slotNumber).padStart(2, "0")}</strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Remaining" : "Còn lại"}</span>
                                <strong style={{ color: selectedAlert.remainingStockPct <= selectedAlert.thresholdPct ? "#F87171" : "#34D399" }}>
                                    {selectedAlert.remainingVolumeMl}ml ({selectedAlert.remainingStockPct}%)
                                </strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Threshold" : "Ngưỡng"}</span>
                                <strong style={{ color: "#F5E6AD" }}>{selectedAlert.thresholdPct}%</strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Sensor" : "Cảm biến"}</span>
                                <strong style={{ color: selectedAlert.underlyingIssuePersists ? "#FBBF24" : "#34D399" }}>
                                    {selectedAlert.underlyingIssuePersists ? (lang === "en" ? "Fault Active" : "Còn lỗi") : (lang === "en" ? "Normal" : "Ổn định")}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TẠO PHIẾU BẢO TRÌ (CHỈ DÀNH CHO OM) */}
            {isTicketModalOpen && selectedAlert && canDispatchTicket && (
                <div className={styles.modalOverlay} onClick={() => setIsTicketModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                                {lang === "en" ? "Create Maintenance Ticket" : "Tạo phiếu bảo trì"}
                            </h3>
                            <button type="button" onClick={() => setIsTicketModalOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicketSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.9rem" }}>
                                <div className={styles.customDropdownWrap}>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.35rem" }}>
                                        {lang === "en" ? "Priority" : "Mức ưu tiên"}
                                    </label>
                                    <button type="button" onClick={() => setOpenDropdown(openDropdown === "TICKET_PRIORITY" ? null : "TICKET_PRIORITY")} className={styles.customDropdownTrigger} style={{ width: "100%" }}>
                                        <span>{ticketPriority}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "TICKET_PRIORITY" && (
                                        <div className={styles.customDropdownMenu} style={{ width: "100%" }}>
                                            {(["URGENT", "HIGH", "NORMAL"] as const).map((p) => (
                                                <button key={p} type="button" onClick={() => { setTicketPriority(p); setOpenDropdown(null); }} className={styles.customDropdownItem}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.customDropdownWrap}>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.35rem" }}>
                                        {lang === "en" ? "Technician" : "Người phụ trách"}
                                    </label>
                                    <button type="button" onClick={() => setOpenDropdown(openDropdown === "TICKET_TECH" ? null : "TICKET_TECH")} className={styles.customDropdownTrigger} style={{ width: "100%" }}>
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ticketTechnician}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "TICKET_TECH" && (
                                        <div className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`} style={{ width: "100%" }}>
                                            {["Nguyễn Hoàng Nam (TE)", "Lê Minh Khôi (IS)", "Phạm Bảo Ngọc (TE)"].map((tech) => (
                                                <button key={tech} type="button" onClick={() => { setTicketTechnician(tech); setOpenDropdown(null); }} className={styles.customDropdownItem}>
                                                    {tech}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: "1.1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.35rem" }}>
                                    {lang === "en" ? "Notes" : "Ghi chú xử lý"}
                                </label>
                                <textarea rows={3} required value={ticketNotes} onChange={(e) => setTicketNotes(e.target.value)} className={styles.searchInput} style={{ padding: "0.6rem 0.85rem", resize: "none" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsTicketModalOpen(false)} className={styles.secondaryGoldBtn}>
                                    {lang === "en" ? "Cancel" : "Hủy"}
                                </button>
                                <button type="submit" className={styles.primaryGoldBtn}>
                                    <Wrench size={14} />
                                    <span>{lang === "en" ? "Create Ticket" : "Xác nhận tạo phiếu"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: "#181D2C", border: "1px solid #D4AF37", padding: "0.85rem 1.15rem", borderRadius: "12px", color: "#F5E6AD", zIndex: 99999, fontWeight: 600, fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "0.55rem" }}>
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}