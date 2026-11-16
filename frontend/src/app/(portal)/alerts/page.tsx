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
    UserCheck,
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

// Bảng ánh xạ chuẩn Mùi hương -> Thương hiệu đúng (chống lệch hãng như Dior - Burberry Her)
function resolveCanonicalBrand(productName: string, fallbackBrand: string): string {
    const p = productName.toLowerCase();
    if (p.includes("burberry")) return "Burberry";
    if (p.includes("sauvage") || p.includes("miss dior")) return "Dior";
    if (p.includes("bleu de chanel") || p.includes("coco mademoiselle")) return "Chanel";
    if (p.includes("acqua di gio")) return "Giorgio Armani";
    if (p.includes("good girl")) return "Carolina Herrera";
    if (p.includes("club de nuit")) return "Armaf";
    if (p.includes("aventus")) return "Creed";
    if (p.includes("le male") || p.includes("scandal")) return "Jean Paul Gaultier";
    if (p.includes("another 13") || p.includes("santal 33")) return "Le Labo";
    if (p.includes("fireplace") || p.includes("jazz club") || p.includes("replica")) return "Maison Margiela";
    if (p.includes("mcm")) return "MCM Worldwide";
    if (p.includes("baccarat rouge")) return "Maison Francis Kurkdjian";
    if (p.includes("explorer") || p.includes("legend")) return "Montblanc";
    if (p.includes("narciso") || p.includes("pure musc")) return "Narciso Rodriguez";
    if (p.includes("1 million") || p.includes("invictus")) return "Paco Rabanne";
    if (p.includes("sedley")) return "Parfums de Marly";
    if (p.includes("elysium")) return "Roja Parfums";
    if (p.includes("black orchid")) return "Tom Ford";
    if (p.includes("born in roma")) return "Valentino";
    if (p.includes("bright crystal") || p.includes("dylan blue") || p.includes("eros")) return "Versace";
    if (p.includes("libre") || p.includes("ysl")) return "Yves Saint Laurent";
    return fallbackBrand || "Luxury Maison";
}

// Làm sạch mọi chữ "per BR9", "(B.3.x)" từ localStorage cũ
function sanitizeCommercialDescription(desc: string): string {
    return String(desc || "")
        .replace(/\s*per\s+BR\d+\.?/gi, ".")
        .replace(/\s*\(B\.\d+\.\d+\)/gi, "")
        .replace(/\.\.+/g, ".")
        .trim();
}

const INITIAL_ENTERPRISE_ALERTS: AlertItem[] = [
    {
        id: "ALT-8901",
        timestamp: "2026-11-15 08:52:10",
        dateStr: "2026-11-15",
        machineId: "KIOSK-004",
        machineLocation: "Aeon Mall Tan Phu Celadon (Tan Phu, HCMC)",
        brand: "Tom Ford",
        productName: "Tom Ford Black Orchid",
        slotNumber: 1,
        category: "MACHINE",
        alertType: "MQTT_HEARTBEAT_TIMEOUT",
        description:
            "Primary fiber link disconnected for > 10 minutes AND Slot 01 cartridge depleted (0.0ml / 100ml).",
        severity: "CRITICAL",
        status: "OPEN",
        remainingVolumeMl: 0.0,
        bottleCapacityMl: 100,
        remainingStockPct: 0,
        thresholdPct: 20,
        lastSensorSync: "2026-11-15 08:40:00 (12m ago - Stale)",
        isSensorStale: true,
        underlyingIssuePersists: true,
        activeTicketId: "MNT-2026-410",
        history: [
            {
                id: "H-101",
                timestamp: "2026-11-15 08:52:10",
                actor: "MQTT Broker Watchdog",
                status: "SENSOR_DETECTED",
                note: "Device KIOSK-004 missed 3 consecutive QoS-1 heartbeats. Connection marked OFFLINE.",
            },
            {
                id: "H-102",
                timestamp: "2026-11-15 08:53:00",
                actor: "ScentStation Alert Engine",
                status: "TICKET_CREATED",
                note: "Auto-linked field inspection Ticket #MNT-2026-410 for 5G Failover Modem check.",
            },
        ],
    },
    {
        id: "ALT-8902",
        timestamp: "2026-11-15 08:35:42",
        dateStr: "2026-11-15",
        machineId: "KIOSK-SGN-01",
        machineLocation: "Saigon Centre Takashimaya Flagship (District 1, HCMC)",
        brand: "Chanel",
        productName: "Bleu de Chanel",
        slotNumber: 3,
        category: "INVENTORY",
        alertType: "LOW_STOCK_SLOT_03",
        description:
            "Perfume cartridge in Slot 03 dropped below 15% reserve threshold (12.5ml / 100ml remaining).",
        severity: "HIGH",
        status: "OPEN",
        remainingVolumeMl: 12.5,
        bottleCapacityMl: 100,
        remainingStockPct: 13,
        thresholdPct: 15,
        lastSensorSync: "Live (Synced 2s ago)",
        isSensorStale: false,
        underlyingIssuePersists: true,
        history: [
            {
                id: "H-201",
                timestamp: "2026-11-15 08:35:42",
                actor: "Ultrasonic Level Sensor #03",
                status: "SENSOR_DETECTED",
                note: "Remaining volume crossed 15% threshold (12.5ml left).",
            },
            {
                id: "H-202",
                timestamp: "2026-11-15 08:35:45",
                actor: "ScentStation Alert Engine",
                status: "OPEN",
                note: "Dispatched High-Severity Inventory Alert for Batch #BATCH-2026-C01.",
            },
        ],
    },
    {
        id: "ALT-8903",
        timestamp: "2026-11-15 07:19:15",
        dateStr: "2026-11-15",
        machineId: "demo-device",
        machineLocation: "Diamond Plaza Luxury Atrium (District 1, HCMC)",
        brand: "Maison Francis Kurkdjian",
        productName: "MFK Baccarat Rouge 540",
        slotNumber: 19,
        category: "INVENTORY",
        alertType: "LOW_STOCK_SLOT_19",
        description:
            "MFK Baccarat Rouge 540 volume at 9.0ml / 70ml (13% remaining, below 15% threshold).",
        severity: "MEDIUM",
        status: "OPEN",
        remainingVolumeMl: 9.0,
        bottleCapacityMl: 70,
        remainingStockPct: 13,
        thresholdPct: 15,
        lastSensorSync: "Live (Synced 2s ago)",
        isSensorStale: false,
        underlyingIssuePersists: true,
        history: [
            {
                id: "H-301",
                timestamp: "2026-11-15 07:19:15",
                actor: "Inventory Telemetry Monitor",
                status: "SENSOR_DETECTED",
                note: "Cartridge volume reached 9.0ml (75 sprays remaining).",
            },
        ],
    },
    {
        id: "ALT-8904",
        timestamp: "2026-11-14 11:50:19",
        dateStr: "2026-11-14",
        machineId: "KIOSK-HN-02",
        machineLocation: "Trang Tien Plaza Luxury Wing (Hoan Kiem, Hanoi)",
        brand: "Maison Margiela",
        productName: "Replica By the Fireplace",
        slotNumber: 16,
        category: "MACHINE",
        alertType: "NOZZLE_ACTUATOR_CALIBRATION",
        description:
            "Micro-pump actuator pressure in Slot 01 fell below 1.2 bar during diagnostic cycle. Machine placed in Maintenance.",
        severity: "CRITICAL",
        status: "INVESTIGATING",
        remainingVolumeMl: 80.0,
        bottleCapacityMl: 100,
        remainingStockPct: 80,
        thresholdPct: 20,
        lastSensorSync: "2026-11-14 11:55:00 (Maintenance Mode)",
        isSensorStale: true,
        underlyingIssuePersists: true,
        activeTicketId: "MNT-2026-409",
        history: [
            {
                id: "H-401",
                timestamp: "2026-11-14 11:50:19",
                actor: "Nozzle Telemetry Controller",
                status: "SENSOR_DETECTED",
                note: "Pressure variance detected: 0.72 bar (Target: 1.50 bar).",
            },
            {
                id: "H-402",
                timestamp: "2026-11-14 11:52:11",
                actor: "Operations Manager",
                status: "INVESTIGATING",
                note: "Assigned field technician to inspect nozzle valve.",
            },
            {
                id: "H-403",
                timestamp: "2026-11-14 11:53:00",
                actor: "Operations Manager",
                status: "TICKET_CREATED",
                note: "Created Maintenance Ticket #MNT-2026-409 (Priority: URGENT).",
            },
        ],
    },
    {
        id: "ALT-8905",
        timestamp: "2026-11-13 14:30:12",
        dateStr: "2026-11-13",
        machineId: "demo-device",
        machineLocation: "Diamond Plaza Luxury Atrium (District 1, HCMC)",
        brand: "Creed",
        productName: "Creed Aventus",
        slotNumber: 9,
        category: "INVENTORY",
        alertType: "LOW_STOCK_SLOT_09",
        description:
            "Creed Aventus cartridge volume reached 11.5ml / 100ml (12%, below 20% warning threshold).",
        severity: "MEDIUM",
        status: "OPEN",
        remainingVolumeMl: 11.5,
        bottleCapacityMl: 100,
        remainingStockPct: 12,
        thresholdPct: 20,
        lastSensorSync: "Live (Synced 2s ago)",
        isSensorStale: false,
        underlyingIssuePersists: true,
        history: [
            {
                id: "H-501",
                timestamp: "2026-11-13 14:30:12",
                actor: "Inventory Monitor",
                status: "SENSOR_DETECTED",
                note: "Stock dipped below 20% replenishment warning threshold.",
            },
        ],
    },
    {
        id: "ALT-8906",
        timestamp: "2026-11-12 22:19:08",
        dateStr: "2026-11-12",
        machineId: "KIOSK-SGN-02",
        machineLocation: "Vincom Center Dong Khoi (District 1, HCMC)",
        brand: "Chanel",
        productName: "Coco Mademoiselle",
        slotNumber: 4,
        category: "SYSTEM",
        alertType: "WEBHOOK_LATENCY_SPIKE",
        description:
            "VietQR / MoMo callback took 3,850ms (SLA threshold: 2,000ms). Auto-recovered.",
        severity: "LOW",
        status: "RESOLVED",
        remainingVolumeMl: 82.0,
        bottleCapacityMl: 100,
        remainingStockPct: 82,
        thresholdPct: 15,
        lastSensorSync: "Live (Synced 4s ago)",
        isSensorStale: false,
        underlyingIssuePersists: false,
        resolvedBy: "Platform Super Administrator",
        resolvedAt: "2026-11-12 22:45:00",
        history: [
            {
                id: "H-601",
                timestamp: "2026-11-12 22:19:08",
                actor: "API Gateway Monitor",
                status: "SENSOR_DETECTED",
                note: "Webhook response latency spiked to 3.85s.",
            },
            {
                id: "H-602",
                timestamp: "2026-11-12 22:45:00",
                actor: "Platform Super Administrator",
                status: "RESOLVED",
                note: "Verified TLS 1.3 handshake & endpoint stability. Marked as Resolved.",
            },
        ],
    },
    {
        id: "ALT-8907",
        timestamp: "2026-11-07 16:40:22",
        dateStr: "2026-11-07",
        machineId: "KIOSK-SGN-03",
        machineLocation: "Crescent Mall Luxury Wing (District 7, HCMC)",
        brand: "Roja Parfums",
        productName: "Roja Parfums Elysium",
        slotNumber: 27,
        category: "INVENTORY",
        alertType: "LOW_STOCK_SLOT_03",
        description:
            "Roja Parfums Elysium cartridge dropped to 11.0ml / 100ml (11%, below 15% threshold).",
        severity: "HIGH",
        status: "OPEN",
        remainingVolumeMl: 11.0,
        bottleCapacityMl: 100,
        remainingStockPct: 11,
        thresholdPct: 15,
        lastSensorSync: "Live (Synced 3s ago)",
        isSensorStale: false,
        underlyingIssuePersists: true,
        history: [
            {
                id: "H-701",
                timestamp: "2026-11-07 16:40:22",
                actor: "Ultrasonic Level Sensor #03",
                status: "SENSOR_DETECTED",
                note: "Cartridge level crossed 15% reserve threshold (11.0ml remaining).",
            },
        ],
    },
    {
        id: "ALT-8908",
        timestamp: "2026-11-06 11:15:05",
        dateStr: "2026-11-06",
        machineId: "KIOSK-HN-01",
        machineLocation: "Lotte Center West Lake Lounge (Ba Dinh, Hanoi)",
        brand: "Dior",
        productName: "Dior Sauvage",
        slotNumber: 10,
        category: "MACHINE",
        alertType: "PELTIER_THERMAL_VARIANCE",
        description:
            "Chamber cooling sensor recorded 23.8°C (Target SLA: 18°C–22°C). Fan RPM auto-boosted to 100%.",
        severity: "MEDIUM",
        status: "RESOLVED",
        remainingVolumeMl: 84.0,
        bottleCapacityMl: 100,
        remainingStockPct: 84,
        thresholdPct: 15,
        lastSensorSync: "Live (21.2°C Stabilized)",
        isSensorStale: false,
        underlyingIssuePersists: false,
        resolvedBy: "Operations Manager",
        resolvedAt: "2026-11-06 12:05:00",
        history: [
            {
                id: "H-801",
                timestamp: "2026-11-06 11:15:05",
                actor: "Thermal Telemetry Controller",
                status: "SENSOR_DETECTED",
                note: "Ambient temperature spike detected in Hanoi West Lake atrium.",
            },
            {
                id: "H-802",
                timestamp: "2026-11-06 12:05:00",
                actor: "Operations Manager",
                status: "RESOLVED",
                note: "Peltier cooling stabilized chamber at 21.2°C. Alert closed.",
            },
        ],
    },
    {
        id: "ALT-8909",
        timestamp: "2026-11-04 19:28:40",
        dateStr: "2026-11-04",
        machineId: "KIOSK-DAD-01",
        machineLocation: "IndoChina Riverside Mall Lobby (Hai Chau, Da Nang)",
        brand: "Armaf",
        productName: "Club de Nuit Intense Man",
        slotNumber: 8,
        category: "SYSTEM",
        alertType: "MQTT_RECONNECT_FAILOVER",
        description:
            "Station switched to 5G cellular failover for 180 seconds during ISP maintenance window.",
        severity: "LOW",
        status: "RESOLVED",
        remainingVolumeMl: 92.0,
        bottleCapacityMl: 105,
        remainingStockPct: 88,
        thresholdPct: 15,
        lastSensorSync: "Live (Primary Fiber Active)",
        isSensorStale: false,
        underlyingIssuePersists: false,
        resolvedBy: "Platform Super Administrator",
        resolvedAt: "2026-11-04 19:35:00",
        history: [
            {
                id: "H-901",
                timestamp: "2026-11-04 19:28:40",
                actor: "Network Watchdog",
                status: "SENSOR_DETECTED",
                note: "Seamless failover to backup 5G eSIM completed in 420ms.",
            },
            {
                id: "H-902",
                timestamp: "2026-11-04 19:35:00",
                actor: "Platform Super Administrator",
                status: "RESOLVED",
                note: "Primary fiber link restored. Verified zero packet loss.",
            },
        ],
    },
    {
        id: "ALT-8910",
        timestamp: "2026-11-03 10:12:30",
        dateStr: "2026-11-03",
        machineId: "KIOSK-SGN-01",
        machineLocation: "Saigon Centre Takashimaya Flagship (District 1, HCMC)",
        brand: "Yves Saint Laurent",
        productName: "YSL Libre Eau de Parfum",
        slotNumber: 33,
        category: "INVENTORY",
        alertType: "LOW_STOCK_SLOT_04",
        description:
            "YSL Libre Eau de Parfum cartridge volume at 14.0ml / 90ml (15% reserve threshold).",
        severity: "HIGH",
        status: "OPEN",
        remainingVolumeMl: 14.0,
        bottleCapacityMl: 90,
        remainingStockPct: 15,
        thresholdPct: 15,
        lastSensorSync: "Live (Synced 2s ago)",
        isSensorStale: false,
        underlyingIssuePersists: true,
        history: [
            {
                id: "H-1001",
                timestamp: "2026-11-03 10:12:30",
                actor: "Ultrasonic Level Sensor #04",
                status: "SENSOR_DETECTED",
                note: "Cartridge volume reached 14.0ml / 90ml (15%).",
            },
        ],
    },
];

const ALERTS_STORAGE_KEY = "scentstation_commercial_alerts_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const MAINTENANCE_STORAGE_KEY = "scentstation_maintenance_tickets_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function AlertsNotificationsPage(): React.ReactElement {
    const router = useRouter();

    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("en");
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
        | "CALENDAR"
        | "SEVERITY"
        | "STATUS"
        | "BRAND"
        | "TICKET_PRIORITY"
        | "TICKET_TECH"
        | null
    >(null);

    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");
    const [isViewerReadOnly, setIsViewerReadOnly] = useState<boolean>(false);
    const [isMultiBrandAuthorized, setIsMultiBrandAuthorized] = useState<boolean>(true);
    const [lockedTenantBrand, setLockedTenantBrand] = useState<string>("Chanel");

    const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState<"details" | "history">("details");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [actionFeedback, setActionFeedback] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
    const [ticketPriority, setTicketPriority] = useState<"URGENT" | "HIGH" | "NORMAL">("URGENT");
    const [ticketTechnician, setTicketTechnician] = useState<string>(
        "Nguyễn Hoàng Nam (Senior IoT Engineer)"
    );
    const [ticketNotes, setTicketNotes] = useState<string>("");

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

    const selectedAlert = useMemo(
        () => alerts.find((a) => a.id === selectedAlertId) || null,
        [alerts, selectedAlertId]
    );

    /* --- 1. ĐỌC & ĐỐI SOÁT DỮ LIỆU ĐỒNG BỘ 2 CHIỀU VỚI TOÀN BỘ 13 MÀN HÌNH --- */
    const loadAndReconcileAlerts = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            // A. Đọc quyền RBAC từ /login & /users
            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                const roleCode = parsedUser.roleCode || parsedUser.role || parsedUser.roles?.[0] || "PSA";
                setCurrentActorLabel(parsedUser.fullName || parsedUser.name || "Operations Manager");
                setIsViewerReadOnly(roleCode === "VW" || roleCode === "VIEWER");

                if (roleCode === "BA" && parsedUser.brandScope) {
                    setIsMultiBrandAuthorized(false);
                    setLockedTenantBrand(parsedUser.brandScope);
                    setSelectedBrand(parsedUser.brandScope);
                } else {
                    setIsMultiBrandAuthorized(true);
                }
            }

            // B. Đọc ma trận tồn kho từng máy KIOSK_PER_UNIT_STOCK_KEY
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            // C. Đọc danh sách Alerts đã lưu + Làm sạch mọi chữ "per BR9" hoặc lệch hãng từ localStorage cũ
            let workingAlerts: AlertItem[] = [...INITIAL_ENTERPRISE_ALERTS];
            const rawSavedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
            if (rawSavedAlerts) {
                const parsedAlerts = JSON.parse(rawSavedAlerts);
                if (Array.isArray(parsedAlerts) && parsedAlerts.length >= 10) {
                    workingAlerts = parsedAlerts.map((a: AlertItem, idx: number) => ({
                        ...a,
                        brand: resolveCanonicalBrand(a.productName || "", a.brand || ""),
                        description: sanitizeCommercialDescription(a.description || ""),
                        dateStr:
                            INITIAL_ENTERPRISE_ALERTS[idx]?.dateStr ||
                            a.dateStr ||
                            todayYmd,
                        timestamp:
                            INITIAL_ENTERPRISE_ALERTS[idx]?.timestamp ||
                            a.timestamp,
                    }));
                }
            }

            // D. Đối soát trực tiếp với KIOSK_PER_UNIT_STOCK_KEY
            workingAlerts = workingAlerts.map((a) => {
                const kLower = a.machineId.toLowerCase();
                const pLower = a.productName.trim().toLowerCase();
                const matrixMl = perKioskMatrix[kLower]?.[pLower];

                if (typeof matrixMl === "number") {
                    const nextMl = Number(Math.max(0, matrixMl).toFixed(2));
                    const nextPct = Math.max(
                        0,
                        Math.round((nextMl / (a.bottleCapacityMl || 100)) * 100)
                    );
                    const isRecovered = nextPct > a.thresholdPct;

                    if (a.category === "INVENTORY") {
                        return {
                            ...a,
                            remainingVolumeMl: nextMl,
                            remainingStockPct: nextPct,
                            underlyingIssuePersists: !isRecovered,
                            status: isRecovered ? "RESOLVED" : a.status,
                            resolvedBy: isRecovered
                                ? a.resolvedBy || "Automated Telemetry Sync"
                                : a.resolvedBy,
                            resolvedAt: isRecovered
                                ? a.resolvedAt || formatNowTimestamp()
                                : a.resolvedAt,
                            lastSensorSync: "Live (Synced from Kiosk Matrix)",
                        };
                    }
                    return {
                        ...a,
                        remainingVolumeMl: nextMl,
                        remainingStockPct: nextPct,
                    };
                }
                return a;
            });

            // E. Đồng bộ với MACHINES_STORAGE_KEY (/machines & /machines/[id])
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    parsedMachines.forEach((m: any) => {
                        const kCode = String(m.code || m.id || "");
                        if (!kCode) return;

                        if (m.status === "ONLINE") {
                            workingAlerts = workingAlerts.map((a) =>
                                isExactMatch(a.machineId, kCode) && a.category === "MACHINE"
                                    ? {
                                        ...a,
                                        isSensorStale: false,
                                        underlyingIssuePersists: false,
                                        status: "RESOLVED",
                                        resolvedBy: a.resolvedBy || currentActorLabel,
                                        resolvedAt: a.resolvedAt || formatNowTimestamp(),
                                        lastSensorSync: "Live (Station Online)",
                                    }
                                    : a
                            );
                        }

                        if (Array.isArray(m.slots)) {
                            m.slots.forEach((sl: any, sIdx: number) => {
                                const fName = String(sl.fragranceName || "");
                                if (!fName) return;
                                const kLower = kCode.toLowerCase();
                                const matrixMl = perKioskMatrix[kLower]?.[fName.toLowerCase()];
                                const remMl =
                                    typeof matrixMl === "number"
                                        ? matrixMl
                                        : Number(sl.remainingMl ?? 75);
                                const capMl = Number(sl.capacityMl ?? 100);
                                const pct = Math.max(0, Math.round((remMl / capMl) * 100));

                                if (pct <= 15) {
                                    const alreadyExists = workingAlerts.some(
                                        (a) =>
                                            isExactMatch(a.machineId, kCode) &&
                                            isExactMatch(a.productName, fName)
                                    );
                                    if (!alreadyExists) {
                                        const newId = `ALT-${8910 + workingAlerts.length}`;
                                        const nowTs = formatNowTimestamp();
                                        const trueBrand = resolveCanonicalBrand(
                                            fName,
                                            sl.brand || "Luxury Maison"
                                        );
                                        workingAlerts.unshift({
                                            id: newId,
                                            timestamp: nowTs,
                                            dateStr: todayYmd,
                                            machineId: kCode,
                                            machineLocation:
                                                m.locationName ||
                                                m.address ||
                                                "Flagship Kiosk Atrium",
                                            brand: trueBrand,
                                            productName: fName,
                                            slotNumber: Number(sl.slotNumber || sIdx + 1),
                                            category: "INVENTORY",
                                            alertType: `LOW_STOCK_SLOT_${String(
                                                sl.slotNumber || sIdx + 1
                                            ).padStart(2, "0")}`,
                                            description: `${fName} cartridge dropped to ${remMl.toFixed(
                                                2
                                            )}ml / ${capMl}ml (${pct}%, threshold 15%).`,
                                            severity: remMl < 0.12 ? "CRITICAL" : "HIGH",
                                            status: "OPEN",
                                            remainingVolumeMl: Number(remMl.toFixed(2)),
                                            bottleCapacityMl: capMl,
                                            remainingStockPct: pct,
                                            thresholdPct: 15,
                                            lastSensorSync: "Live (Synced from Kiosk)",
                                            isSensorStale: false,
                                            underlyingIssuePersists: true,
                                            history: [
                                                {
                                                    id: `H-AUTO-${Date.now()}`,
                                                    timestamp: nowTs,
                                                    actor: "Ultrasonic Level Sensor",
                                                    status: "SENSOR_DETECTED",
                                                    note: `Live dispensing reduced ${fName} volume to ${remMl.toFixed(
                                                        2
                                                    )}ml (${pct}%).`,
                                                },
                                            ],
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            }

            setAlerts(workingAlerts);
            localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(workingAlerts));
        } catch {
            // Safe fallback
        }
    }, [currentActorLabel, todayYmd]);

    useEffect(() => {
        loadAndReconcileAlerts();

        const handleCrossTabSync = () => {
            loadAndReconcileAlerts();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileAlerts();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileAlerts]);

    /* --- 2. GHI & ĐỒNG BỘ NGƯỢC TỪ ALERTS SANG TOÀN BỘ 13 MÀN HÌNH KIA --- */
    const syncResolutionToAllStores = useCallback(
        (
            resolvedAlert: AlertItem,
            isHardwareRecovered: boolean,
            qtyBeforeMl?: number
        ) => {
            try {
                const nextAlerts = alerts.map((a) =>
                    a.id === resolvedAlert.id ? resolvedAlert : a
                );
                setAlerts(nextAlerts);
                localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(nextAlerts));

                const nowIso = new Date().toISOString();
                const kKey = resolvedAlert.machineId.toLowerCase();
                const pKey = resolvedAlert.productName.trim().toLowerCase();

                if (isHardwareRecovered) {
                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                        ? JSON.parse(rawMatrix)
                        : {};
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    perKioskMatrix[kKey][pKey] = resolvedAlert.bottleCapacityMl;
                    localStorage.setItem(
                        KIOSK_PER_UNIT_STOCK_KEY,
                        JSON.stringify(perKioskMatrix)
                    );

                    const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                    if (rawMachines) {
                        const parsedFleet = JSON.parse(rawMachines);
                        if (Array.isArray(parsedFleet)) {
                            const updatedFleet = parsedFleet.map((fm: any) => {
                                if (
                                    String(fm.code || fm.id || "").toLowerCase() !== kKey
                                ) {
                                    return fm;
                                }
                                return {
                                    ...fm,
                                    status: "ONLINE",
                                    connectionStatus: "ONLINE",
                                    operatingStatus: "ACTIVE",
                                    manualAdminOverride: true,
                                    activeSlots: 4,
                                    lastActivity: "Just now (Alert Resolved)",
                                    slots: Array.isArray(fm.slots)
                                        ? fm.slots.map((sl: any) =>
                                            isExactMatch(
                                                sl.fragranceName || "",
                                                resolvedAlert.productName
                                            )
                                                ? {
                                                    ...sl,
                                                    remainingMl:
                                                    resolvedAlert.bottleCapacityMl,
                                                    available: true,
                                                }
                                                : sl
                                        )
                                        : fm.slots,
                                };
                            });
                            localStorage.setItem(
                                MACHINES_STORAGE_KEY,
                                JSON.stringify(updatedFleet)
                            );
                        }
                    }

                    const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                    if (rawProds) {
                        const parsedProds = JSON.parse(rawProds);
                        if (Array.isArray(parsedProds)) {
                            const updatedProds = parsedProds.map((p: any) => {
                                if (
                                    !isExactMatch(
                                        p.name || "",
                                        resolvedAlert.productName
                                    )
                                ) {
                                    return p;
                                }
                                return {
                                    ...p,
                                    assignedMachines: Array.isArray(p.assignedMachines)
                                        ? p.assignedMachines.map((am: any) =>
                                            String(
                                                am.kioskCode || ""
                                            ).toLowerCase() === kKey
                                                ? {
                                                    ...am,
                                                    remainingVolumeMl:
                                                    resolvedAlert.bottleCapacityMl,
                                                    machineStatus: "ONLINE",
                                                }
                                                : am
                                        )
                                        : p.assignedMachines,
                                };
                            });
                            localStorage.setItem(
                                PRODUCTS_STORAGE_KEY,
                                JSON.stringify(updatedProds)
                            );
                        }
                    }

                    const rawMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movList = rawMov ? JSON.parse(rawMov) : [];
                    const prevMl = qtyBeforeMl ?? 0;
                    movList.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: resolvedAlert.id,
                        kioskCode: resolvedAlert.machineId,
                        slotNumber: resolvedAlert.slotNumber,
                        brand: resolvedAlert.brand,
                        productName: resolvedAlert.productName,
                        movementType: "INSTALL",
                        quantityBeforeMl: prevMl,
                        quantityAfterMl: resolvedAlert.bottleCapacityMl,
                        deltaMl: Number(
                            (resolvedAlert.bottleCapacityMl - prevMl).toFixed(2)
                        ),
                        reason: `Telemetry alert ${resolvedAlert.id} replenishment & recovery`,
                        timestamp: nowIso,
                    });
                    localStorage.setItem(
                        INVENTORY_MOVEMENTS_KEY,
                        JSON.stringify(movList.slice(0, 300))
                    );
                }

                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                if (rawDash) {
                    const dashData = JSON.parse(rawDash);
                    if (
                        resolvedAlert.status === "RESOLVED" &&
                        Array.isArray(dashData.alerts)
                    ) {
                        dashData.alerts = dashData.alerts.filter(
                            (da: any) =>
                                da.id !== resolvedAlert.id &&
                                da.type !== resolvedAlert.alertType
                        );
                    }
                    if (isHardwareRecovered && Array.isArray(dashData.machines)) {
                        dashData.machines = dashData.machines.map((dm: any) =>
                            String(dm.id || "").toLowerCase() === kKey
                                ? {
                                    ...dm,
                                    status: "ONLINE",
                                    slotsReady: "4/4 Slots",
                                    lastSeen: "Just now (Recovered)",
                                }
                                : dm
                        );
                    }
                    localStorage.setItem(
                        DASHBOARD_STORAGE_KEY,
                        JSON.stringify(dashData)
                    );
                }

                const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                auditList.unshift({
                    id: `AUD-${Date.now().toString().slice(-4)}`,
                    timestamp: nowIso,
                    actor: currentActorLabel,
                    role: "PSA",
                    tenant: resolvedAlert.brand,
                    action:
                        resolvedAlert.status === "RESOLVED"
                            ? "ALERT_RESOLVED"
                            : "ALERT_TELEMETRY_RECOVERED",
                    entityType: "ALERTS",
                    entityId: `${resolvedAlert.id} • ${resolvedAlert.machineId}`,
                    severity: "INFO",
                    oldValues: null,
                    newValues: {
                        detail: `Updated ${resolvedAlert.id} (${resolvedAlert.alertType}) on ${resolvedAlert.machineId} to ${resolvedAlert.status}.`,
                    },
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(
                    AUDIT_LOGS_STORAGE_KEY,
                    JSON.stringify(auditList.slice(0, 250))
                );

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        [alerts, currentActorLabel]
    );

    const availableBrands = useMemo(
        () => Array.from(new Set(alerts.map((a) => a.brand))).sort(),
        [alerts]
    );

    const contextFilteredAlerts = useMemo(() => {
        const effectiveBrand = isMultiBrandAuthorized ? selectedBrand : lockedTenantBrand;
        const q = searchQuery.toLowerCase().trim();

        return alerts.filter((a) => {
            const dStr =
                a.dateStr ||
                (a.timestamp && a.timestamp.includes(" ")
                    ? a.timestamp.split(" ")[0]
                    : todayYmd);
            const matchesDate = dStr >= startDate && dStr <= endDate;
            const matchesStatus = selectedStatus === "ALL" || a.status === selectedStatus;
            const matchesBrand = effectiveBrand === "ALL" || a.brand === effectiveBrand;
            const matchesSearch =
                !q ||
                a.id.toLowerCase().includes(q) ||
                a.machineId.toLowerCase().includes(q) ||
                a.productName.toLowerCase().includes(q) ||
                a.alertType.toLowerCase().includes(q) ||
                a.brand.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q);
            return matchesDate && matchesStatus && matchesBrand && matchesSearch;
        });
    }, [
        alerts,
        startDate,
        endDate,
        todayYmd,
        selectedStatus,
        selectedBrand,
        isMultiBrandAuthorized,
        lockedTenantBrand,
        searchQuery,
    ]);

    const baseFilteredAlerts = useMemo(() => {
        return contextFilteredAlerts.filter(
            (a) => selectedCategory === "ALL" || a.category === selectedCategory
        );
    }, [contextFilteredAlerts, selectedCategory]);

    const displayedAlerts = useMemo(() => {
        return baseFilteredAlerts.filter(
            (a) => selectedSeverity === "ALL" || a.severity === selectedSeverity
        );
    }, [baseFilteredAlerts, selectedSeverity]);

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
        setSelectedBrand(isMultiBrandAuthorized ? "ALL" : lockedTenantBrand);
        setSearchQuery("");
        setOpenDropdown(null);
    };

    const handleResetSeedAlerts = () => {
        localStorage.removeItem(ALERTS_STORAGE_KEY);
        setAlerts(INITIAL_ENTERPRISE_ALERTS);
        setSelectedAlertId(null);
        setActionFeedback(null);
        showToast(
            lang === "en"
                ? "Restored default IoT telemetry alert feed!"
                : "Đã khôi phục danh sách cảnh báo chuẩn ban đầu!"
        );
    };

    const handleMarkAsResolved = (alertItem: AlertItem) => {
        if (isViewerReadOnly) {
            setActionFeedback({
                type: "error",
                text: "Permission Denied: Viewer accounts operate in Read-Only mode and cannot resolve telemetry alerts.",
            });
            return;
        }

        if (alertItem.status === "RESOLVED") return;

        if (alertItem.underlyingIssuePersists) {
            setActionFeedback({
                type: "error",
                text: `Cannot mark ${alertItem.id} as Resolved: Live sensor telemetry indicates the physical condition (${alertItem.alertType}) is still active on ${alertItem.machineId}. Click "Replenish 100% & Recover" below or dispatch a Maintenance Ticket first.`,
            });
            return;
        }

        const nowStr = formatNowTimestamp();

        const newHistoryEntry: AlertHistoryRecord = {
            id: `H-${Date.now()}`,
            timestamp: nowStr,
            actor: currentActorLabel,
            status: "RESOLVED",
            note: "Verified sensor telemetry recovery and marked alert as Resolved.",
        };

        const updatedAlert: AlertItem = {
            ...alertItem,
            status: "RESOLVED",
            resolvedBy: currentActorLabel,
            resolvedAt: nowStr,
            history: [newHistoryEntry, ...alertItem.history],
        };

        syncResolutionToAllStores(updatedAlert, true, alertItem.remainingVolumeMl);

        const msg =
            lang === "en"
                ? `Alert ${alertItem.id} marked as RESOLVED by ${currentActorLabel} at ${nowStr}!`
                : `Cảnh báo ${alertItem.id} đã được đóng (RESOLVED) bởi ${currentActorLabel}!`;
        setActionFeedback({ type: "success", text: msg });
        showToast(msg);
    };

    const handleSimulateHardwareFix = (alertItem: AlertItem) => {
        if (isViewerReadOnly) return;

        const nowStr = formatNowTimestamp();
        const prevMl = alertItem.remainingVolumeMl;
        const updatedAlert: AlertItem = {
            ...alertItem,
            underlyingIssuePersists: false,
            isSensorStale: false,
            remainingVolumeMl: alertItem.bottleCapacityMl,
            remainingStockPct: 100,
            lastSensorSync: `${nowStr} (Live Verified)`,
            history: [
                {
                    id: `H-${Date.now()}`,
                    timestamp: nowStr,
                    actor: "IoT Telemetry Node",
                    status: "SENSOR_DETECTED",
                    note:
                        alertItem.category === "INVENTORY"
                            ? `Fresh ${alertItem.bottleCapacityMl}ml cartridge installed (100% capacity restored).`
                            : `Hardware heartbeat, actuator pressure & cartridge level (${alertItem.bottleCapacityMl}ml) restored to normal operating range on ${alertItem.machineId}.`,
                },
                ...alertItem.history,
            ],
        };

        syncResolutionToAllStores(updatedAlert, true, prevMl);

        const msg =
            lang === "en"
                ? `Replenished ${alertItem.productName} to ${alertItem.bottleCapacityMl}ml (100%) & recovered station ${alertItem.machineId}. You may now click "Resolve"!`
                : `Đã nạp đầy 100% (${alertItem.bottleCapacityMl}ml) cho ${alertItem.productName} và khôi phục trạm ${alertItem.machineId}. Bạn có thể bấm "Resolve" ngay!`;
        setActionFeedback({ type: "success", text: msg });
        showToast(msg);
    };

    const openCreateTicketModal = (alertItem: AlertItem) => {
        setSelectedAlertId(alertItem.id);
        setActionFeedback(null);

        if (isViewerReadOnly) {
            setActionFeedback({
                type: "error",
                text: "Permission Denied: Viewer accounts cannot create maintenance tickets.",
            });
            return;
        }

        if (alertItem.activeTicketId) {
            setActionFeedback({
                type: "error",
                text: `Duplicate Ticket Prevented: Alert ${alertItem.id} already has an active Maintenance Ticket (#${alertItem.activeTicketId}) being processed.`,
            });
            return;
        }

        setTicketPriority(alertItem.severity === "CRITICAL" ? "URGENT" : "HIGH");
        setTicketNotes(
            `Inspect ${alertItem.alertType} on ${alertItem.machineId} (Slot ${String(
                alertItem.slotNumber
            ).padStart(2, "0")} - ${alertItem.productName}).`
        );
        setOpenDropdown(null);
        setIsTicketModalOpen(true);
    };

    const handleCreateTicketSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedAlert) return;

        const newTicketCode = `MNT-2026-${Math.floor(500 + Math.random() * 400)}`;
        const nowStr = formatNowTimestamp();

        const updatedAlert: AlertItem = {
            ...selectedAlert,
            status:
                selectedAlert.status === "OPEN" ? "INVESTIGATING" : selectedAlert.status,
            activeTicketId: newTicketCode,
            history: [
                {
                    id: `H-${Date.now()}`,
                    timestamp: nowStr,
                    actor: currentActorLabel,
                    status: "TICKET_CREATED",
                    note: `Created Maintenance Ticket #${newTicketCode} [Priority: ${ticketPriority}] assigned to ${ticketTechnician}. Note: ${ticketNotes}`,
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
        const msg = `Maintenance Ticket #${newTicketCode} created and assigned to ${ticketTechnician}. Alert status updated to INVESTIGATING.`;
        setActionFeedback({ type: "success", text: msg });
        showToast(msg);
    };

    const renderSeverityBadge = (sev: AlertSeverity) => {
        if (sev === "CRITICAL")
            return (
                <span className={styles.sevCritical}>
                    <AlertOctagon size={12} /> CRITICAL
                </span>
            );
        if (sev === "HIGH")
            return (
                <span className={styles.sevHigh}>
                    <AlertTriangle size={12} /> HIGH
                </span>
            );
        if (sev === "MEDIUM")
            return (
                <span className={styles.sevMedium}>
                    <Clock size={12} /> MEDIUM
                </span>
            );
        return (
            <span className={styles.sevLow}>
                <Radio size={12} /> LOW
            </span>
        );
    };

    const renderStatusBadge = (st: AlertStatus) => {
        if (st === "OPEN") return <span className={styles.statusOpen}>● OPEN</span>;
        if (st === "INVESTIGATING")
            return (
                <span className={styles.statusInvestigating}>◐ INVESTIGATING</span>
            );
        return (
            <span className={styles.statusResolved}>
                <CheckCircle2 size={12} /> RESOLVED
            </span>
        );
    };

    const severityLabels: Record<"ALL" | AlertSeverity, string> = {
        ALL: lang === "en" ? "All Severity" : "Mọi Mức Độ",
        CRITICAL: "CRITICAL",
        HIGH: "HIGH",
        MEDIUM: "MEDIUM",
        LOW: "LOW",
    };

    const statusLabels: Record<"ALL" | AlertStatus, string> = {
        ALL: lang === "en" ? "All Statuses" : "Mọi Trạng Thái",
        OPEN: "OPEN",
        INVESTIGATING: "INVESTIGATING",
        RESOLVED: "RESOLVED",
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
            {/* LUXURY HERO BANNER CARD (ĐỒNG BỘ 100% VỚI MÀN 5..13) */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? "REAL-TIME IOT TELEMETRY & AUTOMATED INCIDENT RESPONSE"
                                : "GIÁM SÁT CẢNH BÁO IOT & ĐIỀU PHỐI KỸ THUẬT TỰ ĐỘNG"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Notifications & IoT Telemetry Alerts"
                                : "Trung Tâm Cảnh Báo & Giám Sát Cảm Biến IoT"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? "Live hardware diagnostics, fragrance cartridge reserve thresholds, and automated SLA incident dispatch synchronized across all deployed Kiosk stations."
                                : "Chẩn đoán phần cứng trực tiếp, cảnh báo ngưỡng dung tích bình chứa nước hoa và điều phối phiếu bảo trì tự động đồng bộ trên toàn mạng lưới Kiosk."}
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
                            onClick={handleResetSeedAlerts}
                            className={styles.secondaryGoldBtn}
                            title="Restore initial seed alerts"
                        >
                            <RotateCcw size={13} color="#D4AF37" />
                            <span>{lang === "en" ? "Reset Feed" : "Khôi Phục Mẫu"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const nextMulti = !isMultiBrandAuthorized;
                                setIsMultiBrandAuthorized(nextMulti);
                                setSelectedBrand(nextMulti ? "ALL" : lockedTenantBrand);
                            }}
                            className={styles.primaryGoldBtn}
                        >
                            <UserCheck size={14} />
                            <span>
                                {isMultiBrandAuthorized
                                    ? `${currentActorLabel} (All 21 Maisons)`
                                    : `Tenant Scope: ${lockedTenantBrand}`}
                            </span>
                        </button>
                    </div>
                </div>

                {/* 5 KPI SUMMARY CARDS */}
                <div className={styles.summaryGrid}>
                    {[
                        {
                            key: "ALL",
                            label: lang === "en" ? "ALL ALERTS" : "TỔNG CẢNH BÁO",
                            count: summaryCounts.ALL,
                            color: "#FFFFFF",
                            sub: lang === "en" ? "Total active & resolved events" : "Tổng sự kiện trong kỳ",
                        },
                        {
                            key: "CRITICAL",
                            label: "CRITICAL",
                            count: summaryCounts.CRITICAL,
                            color: "#F87171",
                            sub: lang === "en" ? "Immediate SLA < 1 hour" : "Xử lý khẩn cấp < 1 giờ",
                        },
                        {
                            key: "HIGH",
                            label: "HIGH SEVERITY",
                            count: summaryCounts.HIGH,
                            color: "#FB923C",
                            sub: lang === "en" ? "SLA response < 2 hours" : "Phản hồi SLA < 2 giờ",
                        },
                        {
                            key: "MEDIUM",
                            label: "MEDIUM",
                            count: summaryCounts.MEDIUM,
                            color: "#FACC15",
                            sub: lang === "en" ? "Replenishment warning" : "Cảnh báo nạp bình",
                        },
                        {
                            key: "LOW",
                            label: "LOW / INFO",
                            count: summaryCounts.LOW,
                            color: "#38BDF8",
                            sub: lang === "en" ? "Auto-healing telemetry" : "Tự động khôi phục",
                        },
                    ].map((card) => {
                        const isActive = selectedSeverity === card.key;
                        return (
                            <div
                                key={card.key}
                                onClick={() => setSelectedSeverity(card.key as any)}
                                className={`${styles.summaryCard} ${
                                    isActive ? styles.summaryCardActive : ""
                                }`}
                            >
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
                                    {card.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: "1.65rem",
                                        fontWeight: 700,
                                        color: card.color,
                                        fontFamily: "Space Grotesk, monospace",
                                        margin: "0.3rem 0",
                                    }}
                                >
                                    {card.count}
                                </div>
                                <div
                                    style={{
                                        fontSize: "0.71rem",
                                        color: "#94A3B8",
                                    }}
                                >
                                    {card.sub}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CATEGORY TABS BAR */}
            <div className={styles.categoryTabsBar}>
                {[
                    {
                        id: "ALL",
                        label: lang === "en" ? "All Alerts" : "Tất Cả Cảnh Báo",
                        icon: ShieldAlert,
                        count: contextFilteredAlerts.length,
                    },
                    {
                        id: "MACHINE",
                        label: lang === "en" ? "Machine & Hardware" : "Cảnh Báo Phần Cứng Máy",
                        icon: Cpu,
                        count: contextFilteredAlerts.filter((a) => a.category === "MACHINE")
                            .length,
                    },
                    {
                        id: "INVENTORY",
                        label: lang === "en" ? "Cartridge & Inventory" : "Cảnh Báo Dung Tích Bình",
                        icon: Droplets,
                        count: contextFilteredAlerts.filter((a) => a.category === "INVENTORY")
                            .length,
                    },
                    {
                        id: "SYSTEM",
                        label: lang === "en" ? "Network & Gateway" : "Cảnh Báo Mạng & Cổng TT",
                        icon: Radio,
                        count: contextFilteredAlerts.filter((a) => a.category === "SYSTEM")
                            .length,
                    },
                ].map((tab) => {
                    const IconComp = tab.icon;
                    const active = selectedCategory === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedCategory(tab.id as any)}
                            className={`${styles.categoryTabBtn} ${
                                active ? styles.categoryTabBtnActive : ""
                            }`}
                        >
                            <IconComp size={14} />
                            <span>{tab.label}</span>
                            <span className={styles.categoryBadge}>{tab.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* FILTER BAR 2 TẦNG CÓ BẢNG LỊCH THỰC TẾ & CUSTOM GLASS DROPDOWNS */}
            <div
                className={styles.filterBar}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.filterRowTop}>
                    {/* 1. Search Input */}
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={
                                lang === "en"
                                    ? "Search by Alert ID, Station Code, Maison, Fragrance, or diagnostic keyword..."
                                    : "Tìm theo Mã cảnh báo, Mã trạm Kiosk, Thương hiệu, Mùi hương..."
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

                    {/* 2. Custom Luxury Dark Calendar Popover */}
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

                    {/* 3. Custom Dropdown: Severity */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "SEVERITY" ? null : "SEVERITY"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedSeverity !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>{severityLabels[selectedSeverity]}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "SEVERITY" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "185px" }}
                            >
                                {(
                                    ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const
                                ).map((sev) => (
                                    <button
                                        key={sev}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSeverity(sev);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedSeverity === sev
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{severityLabels[sev]}</span>
                                        {selectedSeverity === sev && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. Custom Dropdown: Status */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "STATUS" ? null : "STATUS"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedStatus !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>{statusLabels[selectedStatus]}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "185px" }}
                            >
                                {(
                                    ["ALL", "OPEN", "INVESTIGATING", "RESOLVED"] as const
                                ).map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatus(st);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedStatus === st
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{statusLabels[st]}</span>
                                        {selectedStatus === st && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. Custom Dropdown: Brand Scope */}
                    {isMultiBrandAuthorized ? (
                        <div className={styles.customDropdownWrap}>
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(
                                        openDropdown === "BRAND" ? null : "BRAND"
                                    )
                                }
                                className={`${styles.customDropdownTrigger} ${
                                    selectedBrand !== "ALL"
                                        ? styles.customDropdownTriggerActive
                                        : ""
                                }`}
                            >
                                <span>
                                    {selectedBrand === "ALL"
                                        ? `All Maisons (${availableBrands.length})`
                                        : selectedBrand}
                                </span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "BRAND" && (
                                <div
                                    className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                    style={{ minWidth: "215px" }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedBrand("ALL");
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedBrand === "ALL"
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>
                                            All Maisons ({availableBrands.length})
                                        </span>
                                        {selectedBrand === "ALL" && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                    {availableBrands.map((b) => (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => {
                                                setSelectedBrand(b);
                                                setOpenDropdown(null);
                                            }}
                                            className={`${styles.customDropdownItem} ${
                                                selectedBrand === b
                                                    ? styles.customDropdownItemActive
                                                    : ""
                                            }`}
                                        >
                                            <span>{b}</span>
                                            {selectedBrand === b && (
                                                <Check size={13} color="#D4AF37" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.secondaryGoldBtn}>
                            <ShieldCheck size={13} color="#34D399" />
                            <span>
                                Maison Scope: <strong>{lockedTenantBrand}</strong>
                            </span>
                        </div>
                    )}
                </div>

                {/* Dòng dưới: Chọn nhanh Lịch thực tế + Nút Reset */}
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

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span
                            style={{
                                fontSize: "0.75rem",
                                color: "#F5E6AD",
                                fontFamily: "Space Grotesk, monospace",
                                fontWeight: 700,
                            }}
                        >
                            {formatFullDisplayDate(startDate)} — {formatFullDisplayDate(endDate)}
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

            {/* ALERT DATA TABLE */}
            {displayedAlerts.length > 0 ? (
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>TIMESTAMP & ALERT ID</th>
                                <th>STATION & MAISON</th>
                                <th>TELEMETRY EVENT TYPE</th>
                                <th>DIAGNOSTIC SUMMARY</th>
                                <th>CARTRIDGE LEVEL</th>
                                <th>SEVERITY</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: "right" }}>ACTIONS</th>
                            </tr>
                            </thead>
                            <tbody>
                            {displayedAlerts.map((alert) => {
                                const isSelected = selectedAlert?.id === alert.id;
                                return (
                                    <tr
                                        key={alert.id}
                                        className={`${styles.tableRow} ${
                                            isSelected ? styles.tableRowSelected : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedAlertId(alert.id);
                                            setDrawerTab("details");
                                            setActionFeedback(null);
                                        }}
                                    >
                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                fontFamily: "Space Grotesk, monospace",
                                                fontSize: "0.8rem",
                                                color: "#CBD5E1",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <div>{alert.timestamp}</div>
                                            <div
                                                style={{
                                                    fontSize: "0.72rem",
                                                    color: "#F5E6AD",
                                                    fontWeight: 700,
                                                    marginTop: "0.15rem",
                                                }}
                                            >
                                                {alert.id}
                                            </div>
                                        </td>

                                        <td className={styles.tableCell}>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    color: "#FFF",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.86rem",
                                                }}
                                            >
                                                {alert.machineId}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#94A3B8",
                                                    marginTop: "0.15rem",
                                                }}
                                            >
                                                {alert.brand} • {alert.productName}
                                            </div>
                                        </td>

                                        <td className={styles.tableCell}>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    color: "#F5E6AD",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.82rem",
                                                }}
                                            >
                                                {alert.alertType}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.72rem",
                                                    color: "#94A3B8",
                                                    marginTop: "0.15rem",
                                                }}
                                            >
                                                {alert.category} • Slot{" "}
                                                {String(alert.slotNumber).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </div>
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                maxWidth: "290px",
                                                color: "#CBD5E1",
                                                fontSize: "0.79rem",
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {alert.description}
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                fontFamily: "Space Grotesk, monospace",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    color:
                                                        alert.remainingStockPct <=
                                                        alert.thresholdPct
                                                            ? "#F87171"
                                                            : "#34D399",
                                                    fontSize: "0.82rem",
                                                }}
                                            >
                                                {alert.remainingVolumeMl}ml /{" "}
                                                {alert.bottleCapacityMl}ml
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.7rem",
                                                    color: "#94A3B8",
                                                }}
                                            >
                                                {alert.remainingStockPct}% (Min{" "}
                                                {alert.thresholdPct}%)
                                            </div>
                                        </td>

                                        <td className={styles.tableCell}>
                                            {renderSeverityBadge(alert.severity)}
                                        </td>

                                        <td className={styles.tableCell}>
                                            {renderStatusBadge(alert.status)}
                                            {alert.activeTicketId && (
                                                <div
                                                    style={{
                                                        fontSize: "0.69rem",
                                                        color: "#F5E6AD",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        marginTop: "0.22rem",
                                                    }}
                                                >
                                                    Ticket: #{alert.activeTicketId}
                                                </div>
                                            )}
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                textAlign: "right",
                                                position: "relative",
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                className={styles.actionButton}
                                                style={{ padding: "0.4rem 0.6rem" }}
                                                onClick={() =>
                                                    setOpenMenuId(
                                                        openMenuId === alert.id
                                                            ? null
                                                            : alert.id
                                                    )
                                                }
                                            >
                                                <MoreHorizontal
                                                    size={15}
                                                    color="#D4AF37"
                                                />
                                            </button>

                                            {openMenuId === alert.id && (
                                                <div
                                                    className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                                    style={{
                                                        minWidth: "225px",
                                                        top: "calc(100% - 4px)",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedAlertId(
                                                                alert.id
                                                            );
                                                            setDrawerTab("details");
                                                            setOpenMenuId(null);
                                                        }}
                                                        className={
                                                            styles.customDropdownItem
                                                        }
                                                    >
                                                            <span>
                                                                Inspect Telemetry Dossier
                                                            </span>
                                                    </button>

                                                    {!isViewerReadOnly && (
                                                        <>
                                                            {alert.underlyingIssuePersists &&
                                                                alert.status !==
                                                                "RESOLVED" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedAlertId(
                                                                                alert.id
                                                                            );
                                                                            setDrawerTab(
                                                                                "details"
                                                                            );
                                                                            handleSimulateHardwareFix(
                                                                                alert
                                                                            );
                                                                            setOpenMenuId(
                                                                                null
                                                                            );
                                                                        }}
                                                                        className={
                                                                            styles.customDropdownItem
                                                                        }
                                                                        style={{
                                                                            color: "#60A5FA",
                                                                        }}
                                                                    >
                                                                            <span>
                                                                                Replenish
                                                                                100% &
                                                                                Recover
                                                                            </span>
                                                                    </button>
                                                                )}

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedAlertId(
                                                                        alert.id
                                                                    );
                                                                    setDrawerTab(
                                                                        "details"
                                                                    );
                                                                    handleMarkAsResolved(
                                                                        alert
                                                                    );
                                                                    setOpenMenuId(
                                                                        null
                                                                    );
                                                                }}
                                                                className={
                                                                    styles.customDropdownItem
                                                                }
                                                                style={{
                                                                    color: "#34D399",
                                                                }}
                                                            >
                                                                    <span>
                                                                        Mark as Resolved
                                                                    </span>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    openCreateTicketModal(
                                                                        alert
                                                                    );
                                                                    setOpenMenuId(
                                                                        null
                                                                    );
                                                                }}
                                                                className={
                                                                    styles.customDropdownItem
                                                                }
                                                                style={{
                                                                    color: "#F5E6AD",
                                                                }}
                                                            >
                                                                    <span>
                                                                        Dispatch
                                                                        Maintenance
                                                                        Ticket
                                                                    </span>
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedAlertId(
                                                                alert.id
                                                            );
                                                            setDrawerTab("history");
                                                            setOpenMenuId(null);
                                                        }}
                                                        className={
                                                            styles.customDropdownItem
                                                        }
                                                    >
                                                            <span>
                                                                View Audit Timeline
                                                            </span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        padding: "3.5rem",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "16px",
                        border: "1px solid rgba(212,175,55,0.2)",
                    }}
                >
                    <p
                        style={{
                            fontSize: "1.15rem",
                            fontWeight: 700,
                            color: "#F5E6AD",
                            marginBottom: "0.4rem",
                        }}
                    >
                        No alerts found
                    </p>
                    <p
                        style={{
                            fontSize: "0.85rem",
                            color: "#94A3B8",
                            marginBottom: "1.2rem",
                        }}
                    >
                        No telemetry alerts match your current date range, search keyword, or filter criteria.
                    </p>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className={styles.secondaryGoldBtn}
                    >
                        <span>Clear All Filters</span>
                    </button>
                </div>
            )}

            {/* =========================================================
               CENTERED LUXURY MODAL: ALERT TELEMETRY DOSSIER & TIMELINE
               (ĐỒNG BỘ 100% CẤU TRÚC HEADER 3 NÚT + GLASS CARDS + 4-METRIC FOOTER VỚI MÀN 13 BRANDS)
            ========================================================= */}
            {selectedAlert && (
                <div
                    className={styles.drawerOverlay}
                    onClick={() => setSelectedAlertId(null)}
                >
                    <div
                        className={styles.drawerPanel}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER 2 CỘT PHẲNG TẮP: BÊN TRÁI 3 DÒNG KHÔNG BAO GIỜ RỚT CHỮ, BÊN PHẢI 3 NÚT GỌN GÀNG */}
                        <div className={styles.drawerHeader}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "nowrap",
                                    gap: "1rem",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.9rem",
                                        minWidth: 0,
                                        flex: 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "54px",
                                            height: "54px",
                                            minWidth: "54px",
                                            borderRadius: "14px",
                                            background:
                                                selectedAlert.severity === "CRITICAL"
                                                    ? "rgba(239, 68, 68, 0.14)"
                                                    : "rgba(212, 175, 55, 0.12)",
                                            border:
                                                selectedAlert.severity === "CRITICAL"
                                                    ? "1px solid rgba(239, 68, 68, 0.45)"
                                                    : "1px solid rgba(212, 175, 55, 0.42)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {selectedAlert.category === "INVENTORY" ? (
                                            <Droplets size={24} color="#D4AF37" />
                                        ) : selectedAlert.category === "MACHINE" ? (
                                            <Cpu size={24} color="#F87171" />
                                        ) : (
                                            <Radio size={24} color="#38BDF8" />
                                        )}
                                    </div>

                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        {/* DÒNG 1: LUÔN TRÊN 1 HÀNG DUY NHẤT */}
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.45rem",
                                                marginBottom: "0.2rem",
                                                flexWrap: "nowrap",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily: "Space Grotesk, monospace",
                                                    fontSize: "0.66rem",
                                                    color: "#D4AF37",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.12em",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                VERIFIED TELEMETRY • {selectedAlert.id}
                                            </span>
                                            {renderSeverityBadge(selectedAlert.severity)}
                                            {renderStatusBadge(selectedAlert.status)}
                                        </div>

                                        {/* DÒNG 2: TIÊU ĐỀ CẢNH BÁO */}
                                        <h2
                                            style={{
                                                fontSize: "1.32rem",
                                                fontWeight: 600,
                                                color: "#FFFFFF",
                                                margin: "0 0 0.2rem 0",
                                                fontFamily: "Bodoni Moda, Georgia, serif",
                                                lineHeight: 1.15,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {selectedAlert.alertType}
                                        </h2>

                                        {/* DÒNG 3: THỜI GIAN • MÃ TRẠM • THƯƠNG HIỆU LUÔN TRÊN 1 HÀNG DUY NHẤT */}
                                        <div
                                            style={{
                                                fontSize: "0.73rem",
                                                color: "#94A3B8",
                                                fontFamily: "Space Grotesk, monospace",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            DETECTED:{" "}
                                            <strong style={{ color: "#E2E8F0" }}>
                                                {selectedAlert.timestamp}
                                            </strong>{" "}
                                            • STATION:{" "}
                                            <strong style={{ color: "#F5E6AD" }}>
                                                {selectedAlert.machineId}
                                            </strong>{" "}
                                            • MAISON:{" "}
                                            <strong style={{ color: "#34D399" }}>
                                                {selectedAlert.brand}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {/* CỘT PHẢI: ĐÚNG 3 NÚT GỌN GÀNG NHƯ MÀN 13 BRANDS */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.42rem",
                                        flexShrink: 0,
                                    }}
                                >
                                    {!isViewerReadOnly && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openCreateTicketModal(selectedAlert)
                                                }
                                                className={styles.secondaryGoldBtn}
                                                style={{
                                                    padding: "0.48rem 0.78rem",
                                                    fontSize: "0.73rem",
                                                }}
                                            >
                                                <Wrench size={13} color="#D4AF37" />
                                                <span>
                                                    {selectedAlert.activeTicketId
                                                        ? `#${selectedAlert.activeTicketId}`
                                                        : "Dispatch Ticket"}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleMarkAsResolved(selectedAlert)
                                                }
                                                disabled={
                                                    selectedAlert.status === "RESOLVED"
                                                }
                                                className={styles.primaryGoldBtn}
                                                style={{
                                                    padding: "0.48rem 0.88rem",
                                                    fontSize: "0.73rem",
                                                }}
                                            >
                                                <Check size={14} />
                                                <span>
                                                    {selectedAlert.status === "RESOLVED"
                                                        ? "Resolved"
                                                        : "Resolve"}
                                                </span>
                                            </button>
                                        </>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setSelectedAlertId(null)}
                                        className={styles.secondaryGoldBtn}
                                        style={{ padding: "0.48rem 0.65rem" }}
                                        title="Close Dossier"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2 TABS CHIA ĐỀU 2 CỘT */}
                        <div className={styles.drawerTabsBar}>
                            <button
                                type="button"
                                onClick={() => setDrawerTab("details")}
                                className={`${styles.categoryTabBtn} ${
                                    drawerTab === "details"
                                        ? styles.categoryTabBtnActive
                                        : ""
                                }`}
                                style={{ justifyContent: "center" }}
                            >
                                <Sparkles size={14} />
                                <span>Telemetry Diagnostic Dossier</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDrawerTab("history")}
                                className={`${styles.categoryTabBtn} ${
                                    drawerTab === "history"
                                        ? styles.categoryTabBtnActive
                                        : ""
                                }`}
                                style={{ justifyContent: "center" }}
                            >
                                <History size={14} />
                                <span>
                                    Immutable Audit Timeline ({selectedAlert.history.length})
                                </span>
                            </button>
                        </div>

                        {/* BODY NỘI DUNG CÓ ĐẦY ĐỦ KHUNG GLASS CARD CHUẨN */}
                        <div className={styles.drawerBody}>
                            {actionFeedback && (
                                <div
                                    style={{
                                        marginBottom: "0.85rem",
                                        padding: "0.75rem 1rem",
                                        borderRadius: "12px",
                                        background:
                                            actionFeedback.type === "success"
                                                ? "rgba(52, 211, 153, 0.14)"
                                                : "rgba(248, 113, 113, 0.14)",
                                        border: `1px solid ${
                                            actionFeedback.type === "success"
                                                ? "rgba(52, 211, 153, 0.4)"
                                                : "rgba(248, 113, 113, 0.45)"
                                        }`,
                                        color:
                                            actionFeedback.type === "success"
                                                ? "#34D399"
                                                : "#F87171",
                                        fontSize: "0.8rem",
                                        lineHeight: 1.45,
                                    }}
                                >
                                    {actionFeedback.text}
                                </div>
                            )}

                            {drawerTab === "details" ? (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.85rem",
                                    }}
                                >
                                    <div className={styles.glassCard}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "0.35rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "0.68rem",
                                                    color: "#D4AF37",
                                                    textTransform: "uppercase",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.1em",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                Incident Diagnostic Summary
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "0.72rem",
                                                    color: selectedAlert.underlyingIssuePersists
                                                        ? "#FBBF24"
                                                        : "#34D399",
                                                    fontWeight: 600,
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                {selectedAlert.lastSensorSync}
                                            </span>
                                        </div>
                                        <p
                                            style={{
                                                margin: 0,
                                                color: "#E2E8F0",
                                                fontSize: "0.85rem",
                                                lineHeight: 1.55,
                                            }}
                                        >
                                            {sanitizeCommercialDescription(
                                                selectedAlert.description
                                            )}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "0.85rem",
                                        }}
                                    >
                                        <div
                                            className={styles.glassCard}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: "0.65rem",
                                            }}
                                        >
                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontSize: "0.66rem",
                                                        color: "#94A3B8",
                                                        textTransform: "uppercase",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    STATION ID & DEPLOYMENT VENUE
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#FFF",
                                                        fontSize: "0.88rem",
                                                        marginTop: "0.18rem",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {selectedAlert.machineId}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#CBD5E1",
                                                        marginTop: "0.15rem",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    <MapPin
                                                        size={11}
                                                        color="#D4AF37"
                                                        style={{
                                                            display: "inline",
                                                            marginRight: "4px",
                                                        }}
                                                    />
                                                    {selectedAlert.machineLocation}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/machines/${encodeURIComponent(
                                                            selectedAlert.machineId
                                                        )}`
                                                    )
                                                }
                                                className={styles.secondaryGoldBtn}
                                                style={{
                                                    padding: "0.42rem 0.7rem",
                                                    fontSize: "0.72rem",
                                                    flexShrink: 0,
                                                }}
                                                title="Inspect Kiosk 4-Slot Hardware"
                                            >
                                                <Cpu size={13} color="#D4AF37" />
                                                <span>Station</span>
                                                <ArrowUpRight size={12} />
                                            </button>
                                        </div>

                                        <div className={styles.glassCard}>
                                            <div
                                                style={{
                                                    fontSize: "0.66rem",
                                                    color: "#94A3B8",
                                                    textTransform: "uppercase",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                PARTNER MAISON & CHAMBER SLOT
                                            </div>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    color: "#F5E6AD",
                                                    fontSize: "0.88rem",
                                                    marginTop: "0.18rem",
                                                }}
                                            >
                                                {selectedAlert.brand} —{" "}
                                                {selectedAlert.productName}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#CBD5E1",
                                                    marginTop: "0.15rem",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                Chamber Slot #
                                                {String(
                                                    selectedAlert.slotNumber
                                                ).padStart(2, "0")}{" "}
                                                • Category: {selectedAlert.category}
                                            </div>
                                        </div>
                                    </div>

                                    {/* THANH TIẾN TRÌNH DUNG TÍCH BÌNH CHỨA */}
                                    <div className={styles.glassCard}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                fontSize: "0.74rem",
                                                fontFamily: "Space Grotesk, monospace",
                                                marginBottom: "0.4rem",
                                            }}
                                        >
                                            <span style={{ color: "#CBD5E1" }}>
                                                CARTRIDGE VOLUME VS SLA RESERVE THRESHOLD:{" "}
                                                <strong
                                                    style={{
                                                        color:
                                                            selectedAlert.remainingStockPct <=
                                                            selectedAlert.thresholdPct
                                                                ? "#F87171"
                                                                : "#34D399",
                                                    }}
                                                >
                                                    {selectedAlert.remainingVolumeMl}ml /{" "}
                                                    {selectedAlert.bottleCapacityMl}ml (
                                                    {selectedAlert.remainingStockPct}%)
                                                </strong>
                                            </span>
                                            <span style={{ color: "#F5E6AD" }}>
                                                Min Reserve: {selectedAlert.thresholdPct}%
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                width: "100%",
                                                height: "6px",
                                                background: "rgba(255,255,255,0.08)",
                                                borderRadius: "999px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${selectedAlert.remainingStockPct}%`,
                                                    height: "100%",
                                                    background:
                                                        selectedAlert.remainingStockPct <=
                                                        selectedAlert.thresholdPct
                                                            ? "#EF4444"
                                                            : "linear-gradient(90deg, #D4AF37, #34D399)",
                                                    borderRadius: "999px",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {selectedAlert.underlyingIssuePersists &&
                                    selectedAlert.status !== "RESOLVED" &&
                                    !isViewerReadOnly ? (
                                        <div
                                            className={styles.glassCard}
                                            style={{
                                                border: "1px solid rgba(212, 175, 55, 0.38)",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: "0.75rem",
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: "220px" }}>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#F5E6AD",
                                                        fontSize: "0.84rem",
                                                    }}
                                                >
                                                    Physical Telemetry Verification Guard
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#94A3B8",
                                                        marginTop: "0.15rem",
                                                    }}
                                                >
                                                    Replenish cartridge to 100% capacity and restore station telemetry across all modules before closing this alert.
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSimulateHardwareFix(
                                                        selectedAlert
                                                    )
                                                }
                                                className={styles.primaryGoldBtn}
                                            >
                                                <Droplets size={14} />
                                                <span>
                                                    Replenish 100% & Recover
                                                </span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className={styles.glassCard}
                                            style={{
                                                border: "1px solid rgba(52, 211, 153, 0.35)",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "0.68rem",
                                                        color: "#34D399",
                                                        textTransform: "uppercase",
                                                        fontWeight: 700,
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    VERIFIED TELEMETRY & RESOLUTION SIGN-OFF
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.82rem",
                                                        color: "#E2E8F0",
                                                        marginTop: "0.2rem",
                                                    }}
                                                >
                                                    Verified by{" "}
                                                    <strong>
                                                        {selectedAlert.resolvedBy ||
                                                            currentActorLabel}
                                                    </strong>{" "}
                                                    • All 4 Kiosk chambers operating within nominal SLA parameters.
                                                </div>
                                            </div>
                                            <span className={styles.statusResolved}>
                                                <CheckCircle2 size={12} /> NOMINAL
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
                                    {selectedAlert.history.map((h) => (
                                        <div
                                            key={h.id}
                                            className={styles.glassCard}
                                            style={{ borderLeft: "3px solid #D4AF37" }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#FFF",
                                                        fontSize: "0.84rem",
                                                    }}
                                                >
                                                    {h.actor}
                                                </span>
                                                <span
                                                    style={{
                                                        fontFamily: "Space Grotesk, monospace",
                                                        fontSize: "0.73rem",
                                                        color: "#F5E6AD",
                                                    }}
                                                >
                                                    {h.timestamp}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.69rem",
                                                    color: "#94A3B8",
                                                    marginTop: "0.12rem",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                EVENT STATUS:{" "}
                                                <strong style={{ color: "#34D399" }}>
                                                    {h.status}
                                                </strong>
                                            </div>
                                            <p
                                                style={{
                                                    margin: "0.35rem 0 0 0",
                                                    fontSize: "0.8rem",
                                                    color: "#CBD5E1",
                                                    lineHeight: 1.45,
                                                }}
                                            >
                                                {h.note}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 4-METRIC FOOTER CỐ ĐỊNH DƯỚI ĐÁY MODAL GIỐNG HỆT MÀN 13 BRANDS */}
                        <div className={styles.drawerFooter}>
                            <div className={styles.footerMetricBox}>
                                <span
                                    style={{
                                        fontSize: "0.64rem",
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Chamber Slot
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.86rem",
                                        color: "#FFF",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Slot #{String(selectedAlert.slotNumber).padStart(2, "0")}
                                </strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span
                                    style={{
                                        fontSize: "0.64rem",
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Cartridge Level
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.86rem",
                                        color:
                                            selectedAlert.remainingStockPct <=
                                            selectedAlert.thresholdPct
                                                ? "#F87171"
                                                : "#34D399",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedAlert.remainingVolumeMl}ml /{" "}
                                    {selectedAlert.bottleCapacityMl}ml (
                                    {selectedAlert.remainingStockPct}%)
                                </strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span
                                    style={{
                                        fontSize: "0.64rem",
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    SLA Threshold
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.86rem",
                                        color: "#F5E6AD",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Min {selectedAlert.thresholdPct}% Reserve
                                </strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span
                                    style={{
                                        fontSize: "0.64rem",
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Hardware State
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.86rem",
                                        color: selectedAlert.underlyingIssuePersists
                                            ? "#FBBF24"
                                            : "#34D399",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedAlert.underlyingIssuePersists
                                        ? "Anomaly Active"
                                        : "Nominal OK"}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               CREATE MAINTENANCE TICKET MODAL (CUSTOM LUXURY DROPDOWNS)
            ========================================================= */}
            {isTicketModalOpen && selectedAlert && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => {
                        setOpenDropdown(null);
                        setIsTicketModalOpen(false);
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
                                marginBottom: "1.2rem",
                                borderBottom: "1px solid rgba(255,255,255,0.08)",
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
                                    FIELD OPERATIONS DISPATCH
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        fontSize: "1.35rem",
                                        color: "#FFF",
                                        fontFamily: "Bodoni Moda, Georgia, serif",
                                    }}
                                >
                                    Dispatch Maintenance Ticket
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsTicketModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicketSubmit}>
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
                                            color: "#94A3B8",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Station & Maison
                                    </label>
                                    <input
                                        type="text"
                                        value={`${selectedAlert.machineId} (${selectedAlert.brand})`}
                                        disabled
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem", opacity: 0.7 }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#94A3B8",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                            fontWeight: 700,
                                        }}
                                    >
                                        Linked Alert ID
                                    </label>
                                    <input
                                        type="text"
                                        value={`${selectedAlert.id} • ${selectedAlert.alertType}`}
                                        disabled
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem", opacity: 0.7 }}
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
                                <div className={styles.customDropdownWrap}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        SLA Priority Level *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "TICKET_PRIORITY"
                                                    ? null
                                                    : "TICKET_PRIORITY"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{ width: "100%", padding: "0.65rem 0.9rem" }}
                                    >
                                        <span>
                                            {ticketPriority === "URGENT"
                                                ? "URGENT (SLA < 1 Hour)"
                                                : ticketPriority === "HIGH"
                                                    ? "HIGH (SLA < 4 Hours)"
                                                    : "NORMAL (Next Scheduled Visit)"}
                                        </span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "TICKET_PRIORITY" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ width: "100%" }}
                                        >
                                            {(
                                                [
                                                    {
                                                        id: "URGENT",
                                                        label: "URGENT (SLA < 1 Hour)",
                                                    },
                                                    {
                                                        id: "HIGH",
                                                        label: "HIGH (SLA < 4 Hours)",
                                                    },
                                                    {
                                                        id: "NORMAL",
                                                        label: "NORMAL (Next Scheduled Visit)",
                                                    },
                                                ] as const
                                            ).map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setTicketPriority(p.id);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${styles.customDropdownItem} ${
                                                        ticketPriority === p.id
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{p.label}</span>
                                                    {ticketPriority === p.id && (
                                                        <Check size={13} color="#D4AF37" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.customDropdownWrap}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Assigned Field Engineer *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "TICKET_TECH"
                                                    ? null
                                                    : "TICKET_TECH"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{ width: "100%", padding: "0.65rem 0.9rem" }}
                                    >
                                        <span
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {ticketTechnician}
                                        </span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "TICKET_TECH" && (
                                        <div
                                            className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                            style={{ width: "100%" }}
                                        >
                                            {[
                                                "Nguyễn Hoàng Nam (Senior IoT Engineer)",
                                                "Lê Minh Khôi (Fragrance Cartridge Specialist)",
                                                "Phạm Bảo Ngọc (HCMC Field Ops)",
                                            ].map((tech) => (
                                                <button
                                                    key={tech}
                                                    type="button"
                                                    onClick={() => {
                                                        setTicketTechnician(tech);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${styles.customDropdownItem} ${
                                                        ticketTechnician === tech
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{tech}</span>
                                                    {ticketTechnician === tech && (
                                                        <Check size={13} color="#D4AF37" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: "1.2rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        marginBottom: "0.35rem",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Dispatch Instructions & Diagnostic Notes *
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={ticketNotes}
                                    onChange={(e) => setTicketNotes(e.target.value)}
                                    className={styles.searchInput}
                                    style={{ padding: "0.65rem 0.9rem", resize: "none" }}
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
                                    onClick={() => setIsTicketModalOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Cancel</span>
                                </button>
                                <button type="submit" className={styles.primaryGoldBtn}>
                                    <Wrench size={14} />
                                    <span>Confirm Ticket Dispatch</span>
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