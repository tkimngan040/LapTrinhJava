// noinspection SpellCheckingInspection
"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import styles from "./refill.module.css";
import {
    Search,
    Plus,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    Wrench,
    Droplets,
    PackageCheck,
    History,
    MoreHorizontal,
    UserCheck,
    X,
    Play,
    ShieldAlert,
    Edit3,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    Globe,
    RotateCcw,
    Cpu,
    ArrowUpRight,
    ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

type RefillTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
type RefillActionType = "REFILL" | "REPLACE";
type TaskPriority = "URGENT" | "HIGH" | "NORMAL";
type DrawerTabType = "overview" | "process" | "inventory_test" | "history";
type QuickDatePreset =
    | "TODAY"
    | "THIS_WEEK"
    | "LAST_WEEK"
    | "THIS_MONTH"
    | "LAST_30_DAYS"
    | "CUSTOM";

interface ProcessStepItem {
    stepNumber: number;
    title: string;
    description: string;
    completed: boolean;
    recordedValue?: string;
}

interface TaskHistoryEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    detail: string;
}

interface RefillTaskRecord {
    id: string;
    kioskCode: string;
    location: string;
    slotLabel: string;
    slotNumber: number;
    brand: string;
    productName: string;
    bottleCapacityMl: number;
    currentLevelMl: number;
    thresholdMl: number;
    actionType: RefillActionType;
    status: RefillTaskStatus;
    priority: TaskPriority;
    scheduledDate: string;
    technician: string;
    description: string;
    warehouseSource: string;
    batchNumber: string;
    oldBottleCode: string;
    newBottleCode: string;
    issuedVolumeMl: number;
    actualVolumeUsedMl: number;
    inventoryConfirmed: boolean;
    testSprayStatus: "NOT_TESTED" | "PASSED" | "FAILED";
    testNotes: string;
    processSteps: ProcessStepItem[];
    history: TaskHistoryEntry[];
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

const AVAILABLE_TECHNICIANS = [
    "Lê Minh Khôi (Fragrance Cartridge Specialist)",
    "Nguyễn Hoàng Nam (Senior IoT Engineer)",
    "Phạm Bảo Ngọc (HCMC Field Operations)",
    "Đặng Quốc Bảo (Northern Region Specialist)",
];

const WAREHOUSE_CATALOG_OPTIONS = [
    { brand: "Chanel", product: "Bleu de Chanel", kiosk: "KIOSK-SGN-01", loc: "Saigon Centre Takashimaya D1, HCMC", slot: "Slot 03", slotNum: 3, currentMl: 12.5, capacityMl: 100, warehouseBottles: 5, batch: "BATCH-2026-C01", wh: "WH-SGN-CENTRAL" },
    { brand: "Creed", product: "Creed Aventus", kiosk: "demo-device", loc: "Diamond Plaza Luxury Atrium, HCMC", slot: "Slot 01", slotNum: 1, currentMl: 11.5, capacityMl: 100, warehouseBottles: 3, batch: "BATCH-2026-CR1", wh: "WH-SGN-CENTRAL" },
    { brand: "Maison Francis Kurkdjian", product: "MFK Baccarat Rouge 540", kiosk: "demo-device", loc: "Diamond Plaza Luxury Atrium, HCMC", slot: "Slot 04", slotNum: 4, currentMl: 9.0, capacityMl: 70, warehouseBottles: 5, batch: "BATCH-2026-FK1", wh: "WH-SGN-CENTRAL" },
    { brand: "Tom Ford", product: "Tom Ford Black Orchid", kiosk: "KIOSK-004", loc: "Aeon Mall Tan Phu Celadon, HCMC", slot: "Slot 01", slotNum: 1, currentMl: 0.0, capacityMl: 100, warehouseBottles: 4, batch: "BATCH-2026-TF1", wh: "WH-SGN-CENTRAL" },
    { brand: "Le Labo", product: "Le Labo Another 13", kiosk: "demo-device", loc: "Diamond Plaza Luxury Atrium, HCMC", slot: "Slot 02", slotNum: 2, currentMl: 13.5, capacityMl: 100, warehouseBottles: 4, batch: "BATCH-2026-L01", wh: "WH-SGN-CENTRAL" },
    { brand: "Roja Parfums", product: "Roja Parfums Elysium", kiosk: "KIOSK-SGN-03", loc: "Crescent Mall Luxury Wing D7, HCMC", slot: "Slot 03", slotNum: 3, currentMl: 11.0, capacityMl: 100, warehouseBottles: 0, batch: "OUT-OF-STOCK", wh: "WH-SGN-CENTRAL" },
    { brand: "Yves Saint Laurent", product: "YSL Libre Eau de Parfum", kiosk: "KIOSK-SGN-01", loc: "Saigon Centre Takashimaya D1, HCMC", slot: "Slot 04", slotNum: 4, currentMl: 14.0, capacityMl: 90, warehouseBottles: 3, batch: "BATCH-2026-YS1", wh: "WH-SGN-CENTRAL" },
    { brand: "Dior", product: "Dior Sauvage", kiosk: "KIOSK-HN-01", loc: "Lotte Center West Lake, Hanoi", slot: "Slot 02", slotNum: 2, currentMl: 84.0, capacityMl: 100, warehouseBottles: 5, batch: "BATCH-2026-D01", wh: "WH-HN-NORTH" },
];

const buildStandardSteps = (allDone = false): ProcessStepItem[] => [
    {
        stepNumber: 1,
        title: "Open Kiosk Cabinet & Engage Safety Interlock",
        description: "Open cabinet door and verify the station automatically pauses incoming customer spray orders.",
        completed: allDone,
        recordedValue: allDone ? "Cabinet Interlock Engaged • Orders Paused" : undefined,
    },
    {
        stepNumber: 2,
        title: "Detach Depleted Cartridge & Scan Return Barcode",
        description: "Disconnect residual bottle from the micro-pump manifold and scan barcode for warehouse return.",
        completed: allDone,
        recordedValue: allDone ? "Residual Cartridge Scanned & Sealed" : undefined,
    },
    {
        stepNumber: 3,
        title: "Scan New Sealed Bottle & Verify Olfactory SKU Match",
        description: "Verify replacement bottle barcode matches the assigned chamber fragrance SKU and install into manifold.",
        completed: allDone,
        recordedValue: allDone ? "SKU Match Verified • Manifold Locked" : undefined,
    },
    {
        stepNumber: 4,
        title: "Calibrate Load-Cell Weight & Close Cabinet Door",
        description: "Confirm ultrasonic & load-cell starting volume (100%) and close cabinet door to resume station service.",
        completed: allDone,
        recordedValue: allDone ? "Load-Cell Calibrated • Station Online" : undefined,
    },
];

const INITIAL_REFILL_TASKS: RefillTaskRecord[] = [
    {
        id: "RFL-2026-101",
        kioskCode: "KIOSK-SGN-01",
        location: "Saigon Centre Takashimaya D1, HCMC",
        slotLabel: "Slot 03",
        slotNumber: 3,
        brand: "Chanel",
        productName: "Bleu de Chanel",
        bottleCapacityMl: 100,
        currentLevelMl: 12.5,
        thresholdMl: 15,
        actionType: "REPLACE",
        status: "IN_PROGRESS",
        priority: "URGENT",
        scheduledDate: "2026-11-15",
        technician: "Lê Minh Khôi (Fragrance Cartridge Specialist)",
        description: "Slot 03 crossed 15% reserve threshold (12.5ml remaining). Replace with fresh 100ml sealed bottle from WH-SGN-CENTRAL.",
        warehouseSource: "WH-SGN-CENTRAL",
        batchNumber: "BATCH-2026-C01",
        oldBottleCode: "BTL-2026-0103",
        newBottleCode: "BTL-2026-0903",
        issuedVolumeMl: 100,
        actualVolumeUsedMl: 100,
        inventoryConfirmed: true,
        testSprayStatus: "NOT_TESTED",
        testNotes: "Awaiting post-installation diagnostic spray verification.",
        processSteps: [
            { stepNumber: 1, title: "Open Kiosk Cabinet & Engage Safety Interlock", description: "Open cabinet door and verify the station automatically pauses incoming customer spray orders.", completed: true, recordedValue: "Door state: OPEN | Orders paused at 08:40" },
            { stepNumber: 2, title: "Detach Depleted Cartridge & Scan Return Barcode", description: "Disconnect residual bottle from the micro-pump manifold and scan barcode for warehouse return.", completed: true, recordedValue: "Scanned Old Bottle: BTL-2026-0103 (12.5ml residual)" },
            { stepNumber: 3, title: "Scan New Sealed Bottle & Verify Olfactory SKU Match", description: "Verify replacement bottle barcode matches the assigned chamber fragrance SKU and install into manifold.", completed: true, recordedValue: "Verified New Bottle: BTL-2026-0903 (Batch: BATCH-2026-C01)" },
            { stepNumber: 4, title: "Calibrate Load-Cell Weight & Close Cabinet Door", description: "Confirm ultrasonic & load-cell starting volume (100%) and close cabinet door to resume station service.", completed: false },
        ],
        history: [
            { id: "TH-01", timestamp: "2026-11-15 08:35:45", actor: "Ultrasonic Level Monitor", action: "TASK_CREATED", detail: "Auto-generated replacement task when Slot 03 dropped to 12.5ml." },
            { id: "TH-02", timestamp: "2026-11-15 08:38:10", actor: "Operations Manager", action: "ASSIGNED", detail: "Dispatched to Lê Minh Khôi with URGENT priority." },
            { id: "TH-03", timestamp: "2026-11-15 08:42:05", actor: "Lê Minh Khôi", action: "IN_PROGRESS", detail: "Arrived at Takashimaya D1, opened cabinet and scanned bottle BTL-2026-0903." },
        ],
    },
    {
        id: "RFL-2026-102",
        kioskCode: "demo-device",
        location: "Diamond Plaza Luxury Atrium, HCMC",
        slotLabel: "Slot 04",
        slotNumber: 4,
        brand: "Maison Francis Kurkdjian",
        productName: "MFK Baccarat Rouge 540",
        bottleCapacityMl: 70,
        currentLevelMl: 9.0,
        thresholdMl: 15,
        actionType: "REPLACE",
        status: "PENDING",
        priority: "HIGH",
        scheduledDate: "2026-11-15",
        technician: "Phạm Bảo Ngọc (HCMC Field Operations)",
        description: "Replace 70ml MFK Baccarat Rouge 540 cartridge in Slot 04 and inspect nozzle O-ring seal.",
        warehouseSource: "WH-SGN-CENTRAL",
        batchNumber: "BATCH-2026-FK1",
        oldBottleCode: "BTL-2026-0119",
        newBottleCode: "BTL-2026-0919",
        issuedVolumeMl: 70,
        actualVolumeUsedMl: 70,
        inventoryConfirmed: false,
        testSprayStatus: "NOT_TESTED",
        testNotes: "",
        processSteps: buildStandardSteps(false),
        history: [
            { id: "TH-11", timestamp: "2026-11-15 07:20:00", actor: "Operations Manager", action: "TASK_CREATED", detail: "Scheduled cartridge replacement for demo-device Slot 04." },
        ],
    },
    {
        id: "RFL-2026-103",
        kioskCode: "KIOSK-004",
        location: "Aeon Mall Tan Phu Celadon, HCMC",
        slotLabel: "Slot 01",
        slotNumber: 1,
        brand: "Tom Ford",
        productName: "Tom Ford Black Orchid",
        bottleCapacityMl: 100,
        currentLevelMl: 0.0,
        thresholdMl: 15,
        actionType: "REPLACE",
        status: "OVERDUE",
        priority: "URGENT",
        scheduledDate: "2026-11-14",
        technician: "Nguyễn Hoàng Nam (Senior IoT Engineer)",
        description: "Slot 01 is completely depleted (0.0ml). Overdue due to KIOSK-004 cellular gateway maintenance.",
        warehouseSource: "WH-SGN-CENTRAL",
        batchNumber: "BATCH-2026-TF1",
        oldBottleCode: "BTL-2026-0128",
        newBottleCode: "BTL-2026-0928",
        issuedVolumeMl: 100,
        actualVolumeUsedMl: 100,
        inventoryConfirmed: false,
        testSprayStatus: "NOT_TESTED",
        testNotes: "",
        processSteps: buildStandardSteps(false),
        history: [
            { id: "TH-21", timestamp: "2026-11-13 09:00:00", actor: "Telemetry Alert Engine", action: "TASK_CREATED", detail: "Slot 01 reached 0.0ml (EMPTY). Deadline set to 2026-11-14." },
            { id: "TH-22", timestamp: "2026-11-15 00:01:00", actor: "SLA Watchdog", action: "OVERDUE_FLAGGED", detail: "Task passed scheduled deadline without completion." },
        ],
    },
    {
        id: "RFL-2026-104",
        kioskCode: "demo-device",
        location: "Diamond Plaza Luxury Atrium, HCMC",
        slotLabel: "Slot 01",
        slotNumber: 1,
        brand: "Creed",
        productName: "Creed Aventus",
        bottleCapacityMl: 100,
        currentLevelMl: 11.5,
        thresholdMl: 15,
        actionType: "REFILL",
        status: "PENDING",
        priority: "HIGH",
        scheduledDate: "2026-11-13",
        technician: "Lê Minh Khôi (Fragrance Cartridge Specialist)",
        description: "Replenish Creed Aventus chamber before weekend peak foot traffic at Diamond Plaza.",
        warehouseSource: "WH-SGN-CENTRAL",
        batchNumber: "BATCH-2026-CR1",
        oldBottleCode: "BTL-2026-0109",
        newBottleCode: "BTL-2026-0909",
        issuedVolumeMl: 100,
        actualVolumeUsedMl: 100,
        inventoryConfirmed: false,
        testSprayStatus: "NOT_TESTED",
        testNotes: "",
        processSteps: buildStandardSteps(false),
        history: [
            { id: "TH-31", timestamp: "2026-11-13 14:32:00", actor: "Operations Manager", action: "TASK_CREATED", detail: "Created preventive refill task for Creed Aventus." },
        ],
    },
    {
        id: "RFL-2026-105",
        kioskCode: "KIOSK-SGN-01",
        location: "Saigon Centre Takashimaya D1, HCMC",
        slotLabel: "Slot 04",
        slotNumber: 4,
        brand: "Yves Saint Laurent",
        productName: "YSL Libre Eau de Parfum",
        bottleCapacityMl: 90,
        currentLevelMl: 14.0,
        thresholdMl: 15,
        actionType: "REPLACE",
        status: "PENDING",
        priority: "HIGH",
        scheduledDate: "2026-11-12",
        technician: "Phạm Bảo Ngọc (HCMC Field Operations)",
        description: "YSL Libre Eau de Parfum reached 14.0ml / 90ml (15%). Prepare fresh 90ml bottle from WH-SGN-CENTRAL.",
        warehouseSource: "WH-SGN-CENTRAL",
        batchNumber: "BATCH-2026-YS1",
        oldBottleCode: "BTL-2026-0133",
        newBottleCode: "BTL-2026-0933",
        issuedVolumeMl: 90,
        actualVolumeUsedMl: 90,
        inventoryConfirmed: false,
        testSprayStatus: "NOT_TESTED",
        testNotes: "",
        processSteps: buildStandardSteps(false),
        history: [
            { id: "TH-51", timestamp: "2026-11-12 10:15:00", actor: "Ultrasonic Level Monitor", action: "TASK_CREATED", detail: "Auto-scheduled replacement for YSL Libre EDP." },
        ],
    },
    {
        id: "RFL-2026-106",
        kioskCode: "KIOSK-SGN-03",
        location: "Crescent Mall Luxury Wing D7, HCMC",
        slotLabel: "Slot 03",
        slotNumber: 3,
        brand: "Roja Parfums",
        productName: "Roja Parfums Elysium",
        bottleCapacityMl: 100,
        currentLevelMl: 11.0,
        thresholdMl: 15,
        actionType: "REPLACE",
        status: "OVERDUE",
        priority: "URGENT",
        scheduledDate: "2026-11-07",
        technician: "Lê Minh Khôi (Fragrance Cartridge Specialist)",
        description: "Roja Parfums Elysium dropped to 11.0ml / 100ml (11%). Awaiting luxury niche batch clearance.",
        warehouseSource: "WH-SGN-CENTRAL",
        batchNumber: "BATCH-2026-RJ1",
        oldBottleCode: "BTL-2026-0127",
        newBottleCode: "BTL-2026-0927",
        issuedVolumeMl: 100,
        actualVolumeUsedMl: 100,
        inventoryConfirmed: false,
        testSprayStatus: "NOT_TESTED",
        testNotes: "",
        processSteps: buildStandardSteps(false),
        history: [
            { id: "TH-61", timestamp: "2026-11-07 16:42:00", actor: "Telemetry Alert Engine", action: "TASK_CREATED", detail: "Triggered high-priority refill task for Crescent Mall Kiosk." },
        ],
    },
    {
        id: "RFL-2026-107",
        kioskCode: "KIOSK-HN-01",
        location: "Lotte Center West Lake, Hanoi",
        slotLabel: "Slot 02",
        slotNumber: 2,
        brand: "Dior",
        productName: "Dior Sauvage",
        bottleCapacityMl: 100,
        currentLevelMl: 100.0,
        thresholdMl: 15,
        actionType: "REPLACE",
        status: "COMPLETED",
        priority: "NORMAL",
        scheduledDate: "2026-11-06",
        technician: "Đặng Quốc Bảo (Northern Region Specialist)",
        description: "Completed full 100ml bottle replacement and passed post-refill nozzle pressure test.",
        warehouseSource: "WH-HN-NORTH",
        batchNumber: "BATCH-2026-D01",
        oldBottleCode: "BTL-2026-0041",
        newBottleCode: "BTL-2026-0110",
        issuedVolumeMl: 100,
        actualVolumeUsedMl: 100,
        inventoryConfirmed: true,
        testSprayStatus: "PASSED",
        testNotes: "1 calibrated diagnostic spray executed (0.12ml). Load-cell reading 99.88g verified.",
        processSteps: buildStandardSteps(true),
        history: [
            { id: "TH-71", timestamp: "2026-11-06 16:20:00", actor: "Đặng Quốc Bảo", action: "IN_PROGRESS", detail: "Started bottle replacement at Lotte West Lake." },
            { id: "TH-72", timestamp: "2026-11-06 16:45:22", actor: "Đặng Quốc Bảo", action: "COMPLETED", detail: "Installed BTL-2026-0110 (100ml), passed diagnostic spray test, closed task." },
        ],
    },
    {
        id: "RFL-2026-108",
        kioskCode: "KIOSK-DAD-01",
        location: "IndoChina Riverside Mall Lobby, Da Nang",
        slotLabel: "Slot 01",
        slotNumber: 1,
        brand: "Armaf",
        productName: "Club de Nuit Intense Man",
        bottleCapacityMl: 105,
        currentLevelMl: 105.0,
        thresholdMl: 15,
        actionType: "REFILL",
        status: "COMPLETED",
        priority: "NORMAL",
        scheduledDate: "2026-11-04",
        technician: "Nguyễn Hoàng Nam (Senior IoT Engineer)",
        description: "Completed scheduled 105ml cartridge replenishment and ultrasonic sensor calibration.",
        warehouseSource: "WH-DAD-CENTRAL",
        batchNumber: "BATCH-2026-AR1",
        oldBottleCode: "BTL-2026-0018",
        newBottleCode: "BTL-2026-0418",
        issuedVolumeMl: 105,
        actualVolumeUsedMl: 105,
        inventoryConfirmed: true,
        testSprayStatus: "PASSED",
        testNotes: "Diagnostic actuation verified at 1.50 bar.",
        processSteps: buildStandardSteps(true),
        history: [
            { id: "TH-81", timestamp: "2026-11-04 14:10:00", actor: "Nguyễn Hoàng Nam", action: "COMPLETED", detail: "Replenished Club de Nuit Intense Man to 105ml (100%)." },
        ],
    },
];

const REFILL_STORAGE_KEY = "scentstation_refill_tasks_v2";
const ALERTS_STORAGE_KEY = "scentstation_commercial_alerts_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function RefillReplacementPage(): React.ReactElement {
    const router = useRouter();

    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [tasks, setTasks] = useState<RefillTaskRecord[]>(INITIAL_REFILL_TASKS);

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [brandFilter, setBrandFilter] = useState<string>("ALL");
    const [locationFilter, setLocationFilter] = useState<string>("ALL");

    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [openDropdown, setOpenDropdown] = useState<
        | "CALENDAR"
        | "BRAND"
        | "STATUS"
        | "LOCATION"
        | "ASSIGN_TECH"
        | "ASSIGN_DATE"
        | "CREATE_CATALOG"
        | "CREATE_TYPE"
        | "CREATE_PRIORITY"
        | "CREATE_DATE"
        | "CREATE_TECH"
        | null
    >(null);

    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");
    const [isViewerReadOnly, setIsViewerReadOnly] = useState<boolean>(false);
    const [brandTenantScope, setBrandTenantScope] = useState<string | null>(null);

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState<DrawerTabType>("overview");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [newAssignee, setNewAssignee] = useState<string>(AVAILABLE_TECHNICIANS[0]);
    const [newDeadline, setNewDeadline] = useState<string>(todayYmd);
    const [handoverNote, setHandoverNote] = useState<string>("");
    const [newComment, setNewComment] = useState<string>("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [selectedCatalogIdx, setSelectedCatalogIdx] = useState<number>(0);
    const [createActionType, setCreateActionType] = useState<RefillActionType>("REPLACE");
    const [createPriority, setCreatePriority] = useState<TaskPriority>("HIGH");
    const [createDeadline, setCreateDeadline] = useState<string>(todayYmd);
    const [createTechnician, setCreateTechnician] = useState<string>(AVAILABLE_TECHNICIANS[0]);
    const [createReason, setCreateReason] = useState<string>(
        "Low-stock reserve threshold triggered; replace cartridge and verify nozzle calibration."
    );

    const selectedTask = useMemo(
        () => tasks.find((t) => t.id === selectedTaskId) || null,
        [tasks, selectedTaskId]
    );

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

    /* --- 1. ĐỌC & ĐỐI SOÁT DỮ LIỆU ĐỒNG BỘ 2 CHIỀU VỚI TOÀN BỘ 14 MÀN HÌNH --- */
    const loadAndReconcileRefillTasks = useCallback(() => {
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
                    setBrandTenantScope(parsedUser.brandScope);
                    setBrandFilter(parsedUser.brandScope);
                } else {
                    setBrandTenantScope(null);
                }
            }

            // B. Đọc ma trận tồn kho từng máy KIOSK_PER_UNIT_STOCK_KEY
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            // C. Đọc danh sách Refill Tasks đã lưu
            let workingTasks: RefillTaskRecord[] = [...INITIAL_REFILL_TASKS];
            const rawSavedTasks = localStorage.getItem(REFILL_STORAGE_KEY);
            if (rawSavedTasks) {
                const parsedTasks = JSON.parse(rawSavedTasks);
                if (Array.isArray(parsedTasks) && parsedTasks.length >= 8) {
                    workingTasks = parsedTasks.map((t: RefillTaskRecord, idx: number) => ({
                        ...t,
                        scheduledDate:
                            INITIAL_REFILL_TASKS[idx]?.scheduledDate ||
                            t.scheduledDate ||
                            todayYmd,
                    }));
                }
            }

            // D. Đối soát trực tiếp với KIOSK_PER_UNIT_STOCK_KEY
            workingTasks = workingTasks.map((t) => {
                const kLower = t.kioskCode.toLowerCase();
                const pLower = t.productName.trim().toLowerCase();
                const matrixMl = perKioskMatrix[kLower]?.[pLower];

                if (typeof matrixMl === "number") {
                    const nextMl = Number(Math.max(0, matrixMl).toFixed(2));
                    const isFullyRestored = nextMl >= t.bottleCapacityMl * 0.9;

                    if (isFullyRestored && t.status !== "COMPLETED") {
                        return {
                            ...t,
                            currentLevelMl: nextMl,
                            status: "COMPLETED",
                            inventoryConfirmed: true,
                            testSprayStatus: "PASSED",
                            processSteps: buildStandardSteps(true),
                        };
                    }

                    return {
                        ...t,
                        currentLevelMl: nextMl,
                    };
                }
                return t;
            });

            // E. Tự động sinh Refill Task mới nếu trên đội máy (/machines) có khoang bất kỳ tụt <= 15ml mà chưa có Task
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    parsedMachines.forEach((m: any) => {
                        const kCode = String(m.code || m.id || "");
                        if (!kCode || !Array.isArray(m.slots)) return;

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

                            if (remMl <= 15) {
                                const alreadyHasTask = workingTasks.some(
                                    (t) =>
                                        isExactMatch(t.kioskCode, kCode) &&
                                        isExactMatch(t.productName, fName) &&
                                        t.status !== "COMPLETED"
                                );
                                if (!alreadyHasTask) {
                                    const newId = `RFL-2026-${110 + workingTasks.length}`;
                                    workingTasks.unshift({
                                        id: newId,
                                        kioskCode: kCode,
                                        location:
                                            m.locationName ||
                                            m.address ||
                                            "Flagship Kiosk Atrium",
                                        slotLabel:
                                            sl.slotLabel || `Slot 0${sIdx + 1}`,
                                        slotNumber: Number(sl.slotNumber || sIdx + 1),
                                        brand: sl.brand || "Luxury Maison",
                                        productName: fName,
                                        bottleCapacityMl: capMl,
                                        currentLevelMl: Number(remMl.toFixed(2)),
                                        thresholdMl: 15,
                                        actionType: "REPLACE",
                                        status: "PENDING",
                                        priority: remMl < 0.12 ? "URGENT" : "HIGH",
                                        scheduledDate: todayYmd,
                                        technician: AVAILABLE_TECHNICIANS[0],
                                        description: `Auto-dispatched cartridge replacement: ${fName} dropped to ${remMl.toFixed(
                                            2
                                        )}ml / ${capMl}ml.`,
                                        warehouseSource: "WH-SGN-CENTRAL",
                                        batchNumber: "BATCH-2026-AUTO",
                                        oldBottleCode: `BTL-OLD-0${sIdx + 1}`,
                                        newBottleCode: `BTL-NEW-9${sIdx + 1}`,
                                        issuedVolumeMl: capMl,
                                        actualVolumeUsedMl: capMl,
                                        inventoryConfirmed: false,
                                        testSprayStatus: "NOT_TESTED",
                                        testNotes: "",
                                        processSteps: buildStandardSteps(false),
                                        history: [
                                            {
                                                id: `TH-AUTO-${Date.now()}`,
                                                timestamp: formatNowTimestamp(),
                                                actor: "Ultrasonic Level Sensor",
                                                action: "TASK_CREATED",
                                                detail: `Live dispensing reduced ${fName} to ${remMl.toFixed(
                                                    2
                                                )}ml. Auto-created refill task.`,
                                            },
                                        ],
                                    });
                                }
                            }
                        });
                    });
                }
            }

            setTasks(workingTasks);
            localStorage.setItem(REFILL_STORAGE_KEY, JSON.stringify(workingTasks));
        } catch {
            // Safe fallback
        }
    }, [todayYmd]);

    useEffect(() => {
        loadAndReconcileRefillTasks();

        const handleCrossTabSync = () => {
            loadAndReconcileRefillTasks();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileRefillTasks();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileRefillTasks]);

    /* --- 2. GHI & ĐỒNG BỘ NGƯỢC TỪ REFILL SANG TOÀN BỘ 14 MÀN HÌNH KIA --- */
    const persistTasksAndSyncAllModules = useCallback(
        (
            nextTasks: RefillTaskRecord[],
            completedTask?: RefillTaskRecord,
            qtyBeforeMl?: number,
            auditDetail?: { action: string; target: string; detail: string }
        ) => {
            setTasks(nextTasks);
            try {
                localStorage.setItem(REFILL_STORAGE_KEY, JSON.stringify(nextTasks));
                const nowIso = new Date().toISOString();

                if (completedTask) {
                    const kKey = completedTask.kioskCode.toLowerCase();
                    const pKey = completedTask.productName.trim().toLowerCase();
                    const restoredMl = completedTask.actualVolumeUsedMl;

                    // A. Cập nhật KIOSK_PER_UNIT_STOCK_KEY
                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                        ? JSON.parse(rawMatrix)
                        : {};
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    perKioskMatrix[kKey][pKey] = restoredMl;
                    localStorage.setItem(
                        KIOSK_PER_UNIT_STOCK_KEY,
                        JSON.stringify(perKioskMatrix)
                    );

                    // B. Cập nhật MACHINES_STORAGE_KEY (/machines & /machines/[id])
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
                                    lastActivity: `Just now (Refill ${completedTask.id})`,
                                    slots: Array.isArray(fm.slots)
                                        ? fm.slots.map((sl: any) =>
                                            isExactMatch(
                                                sl.fragranceName || "",
                                                completedTask.productName
                                            )
                                                ? {
                                                    ...sl,
                                                    remainingMl: restoredMl,
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

                    // C. Cập nhật PRODUCTS_STORAGE_KEY (/products)
                    const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                    if (rawProds) {
                        const parsedProds = JSON.parse(rawProds);
                        if (Array.isArray(parsedProds)) {
                            const updatedProds = parsedProds.map((p: any) => {
                                if (
                                    !isExactMatch(
                                        p.name || "",
                                        completedTask.productName
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
                                                    remainingVolumeMl: restoredMl,
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

                    // D. Cập nhật ALERTS_STORAGE_KEY (Đóng cảnh báo hết nước trên Màn 14 /alerts)
                    const rawAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
                    if (rawAlerts) {
                        const parsedAlerts = JSON.parse(rawAlerts);
                        if (Array.isArray(parsedAlerts)) {
                            const updatedAlerts = parsedAlerts.map((al: any) => {
                                if (
                                    isExactMatch(
                                        al.machineId || "",
                                        completedTask.kioskCode
                                    ) &&
                                    isExactMatch(
                                        al.productName || "",
                                        completedTask.productName
                                    )
                                ) {
                                    return {
                                        ...al,
                                        remainingVolumeMl: restoredMl,
                                        remainingStockPct: 100,
                                        underlyingIssuePersists: false,
                                        isSensorStale: false,
                                        status: "RESOLVED",
                                        resolvedBy: completedTask.technician,
                                        resolvedAt: formatNowTimestamp(),
                                        lastSensorSync: `Live (Restored via ${completedTask.id})`,
                                    };
                                }
                                return al;
                            });
                            localStorage.setItem(
                                ALERTS_STORAGE_KEY,
                                JSON.stringify(updatedAlerts)
                            );
                        }
                    }

                    // E. Ghi vào INVENTORY_MOVEMENTS_KEY cho Màn 11 (/inventory)
                    const rawMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movList = rawMov ? JSON.parse(rawMov) : [];
                    const prevMl = qtyBeforeMl ?? 0;
                    movList.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: completedTask.id,
                        kioskCode: completedTask.kioskCode,
                        slotNumber: completedTask.slotNumber,
                        brand: completedTask.brand,
                        productName: completedTask.productName,
                        movementType: "INSTALL",
                        quantityBeforeMl: prevMl,
                        quantityAfterMl: restoredMl,
                        deltaMl: Number((restoredMl - prevMl).toFixed(2)),
                        reason: `Completed ${completedTask.actionType} task ${completedTask.id} (${completedTask.newBottleCode})`,
                        timestamp: nowIso,
                    });
                    localStorage.setItem(
                        INVENTORY_MOVEMENTS_KEY,
                        JSON.stringify(movList.slice(0, 300))
                    );
                }

                // F. Ghi vào AUDIT_LOGS_STORAGE_KEY cho Màn 9 (/reports) & Màn 12 (/users)
                if (auditDetail) {
                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                    auditList.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: nowIso,
                        actor: currentActorLabel,
                        role: "PSA",
                        tenant: auditDetail.target,
                        action: auditDetail.action,
                        entityType: "REFILL",
                        entityId: auditDetail.target,
                        severity: "INFO",
                        oldValues: null,
                        newValues: { detail: auditDetail.detail },
                        sourceIp: "127.0.0.1",
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
        [currentActorLabel]
    );

    const uniqueBrands = useMemo(
        () => Array.from(new Set(tasks.map((t) => t.brand))).sort(),
        [tasks]
    );
    const uniqueLocations = useMemo(
        () => Array.from(new Set(tasks.map((t) => t.location))).sort(),
        [tasks]
    );

    const dateScopedTasks = useMemo(() => {
        const effectiveBrand = brandTenantScope || brandFilter;
        const q = searchQuery.trim().toLowerCase();

        return tasks.filter((t) => {
            const matchesDate =
                t.scheduledDate >= startDate && t.scheduledDate <= endDate;
            const matchesSearch =
                !q ||
                t.id.toLowerCase().includes(q) ||
                t.kioskCode.toLowerCase().includes(q) ||
                t.productName.toLowerCase().includes(q) ||
                t.brand.toLowerCase().includes(q) ||
                t.location.toLowerCase().includes(q) ||
                t.technician.toLowerCase().includes(q);
            const matchesBrand =
                effectiveBrand === "ALL" || isExactMatch(t.brand, effectiveBrand);
            const matchesLoc =
                locationFilter === "ALL" || t.location === locationFilter;

            return matchesDate && matchesSearch && matchesBrand && matchesLoc;
        });
    }, [
        tasks,
        startDate,
        endDate,
        searchQuery,
        brandTenantScope,
        brandFilter,
        locationFilter,
    ]);

    const overviewCounts = useMemo(() => {
        return {
            ALL: dateScopedTasks.length,
            PENDING: dateScopedTasks.filter((t) => t.status === "PENDING").length,
            IN_PROGRESS: dateScopedTasks.filter((t) => t.status === "IN_PROGRESS")
                .length,
            COMPLETED: dateScopedTasks.filter((t) => t.status === "COMPLETED")
                .length,
            OVERDUE: dateScopedTasks.filter((t) => t.status === "OVERDUE").length,
        };
    }, [dateScopedTasks]);

    const filteredTasks = useMemo(() => {
        return dateScopedTasks.filter(
            (t) => statusFilter === "ALL" || t.status === statusFilter
        );
    }, [dateScopedTasks, statusFilter]);

    const handleResetFilters = () => {
        setStartDate(defaultStart30d);
        setEndDate(todayYmd);
        setDatePreset("LAST_30_DAYS");
        setSearchQuery("");
        setStatusFilter("ALL");
        setBrandFilter(brandTenantScope || "ALL");
        setLocationFilter("ALL");
        setOpenDropdown(null);
    };

    const handleResetSeedTasks = () => {
        localStorage.removeItem(REFILL_STORAGE_KEY);
        setTasks(INITIAL_REFILL_TASKS);
        setSelectedTaskId(null);
        showToast(
            lang === "en"
                ? "Restored default cartridge refill & replacement schedule!"
                : "Đã khôi phục lịch trình thay bình nước hoa mẫu!"
        );
    };

    const handleCreateTaskSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isViewerReadOnly) return;

        const chosen = WAREHOUSE_CATALOG_OPTIONS[selectedCatalogIdx];
        const newTaskId = `RFL-2026-${Math.floor(109 + Math.random() * 880)}`;
        const nowStr = formatNowTimestamp();
        const isOverdue = createDeadline < todayYmd;

        const newTask: RefillTaskRecord = {
            id: newTaskId,
            kioskCode: chosen.kiosk,
            location: chosen.loc,
            slotLabel: chosen.slot,
            slotNumber: chosen.slotNum,
            brand: chosen.brand,
            productName: chosen.product,
            bottleCapacityMl: chosen.capacityMl,
            currentLevelMl: chosen.currentMl,
            thresholdMl: 15,
            actionType: createActionType,
            status: isOverdue ? "OVERDUE" : "PENDING",
            priority: createPriority,
            scheduledDate: createDeadline,
            technician: createTechnician,
            description: createReason,
            warehouseSource: chosen.wh,
            batchNumber: chosen.batch,
            oldBottleCode: `BTL-OLD-0${chosen.slotNum}`,
            newBottleCode: `BTL-NEW-${Math.floor(100 + Math.random() * 899)}`,
            issuedVolumeMl: chosen.capacityMl,
            actualVolumeUsedMl: chosen.capacityMl,
            inventoryConfirmed: false,
            testSprayStatus: "NOT_TESTED",
            testNotes: "",
            processSteps: buildStandardSteps(false),
            history: [
                {
                    id: `TH-${Date.now()}`,
                    timestamp: nowStr,
                    actor: currentActorLabel,
                    action: "TASK_CREATED",
                    detail: `Dispatched ${createActionType} task assigned to ${createTechnician} (Scheduled: ${createDeadline}).`,
                },
            ],
        };

        const nextList = [newTask, ...tasks];
        persistTasksAndSyncAllModules(nextList, undefined, undefined, {
            action: "REFILL_TASK_CREATED",
            target: newTaskId,
            detail: `Created ${createActionType} task ${newTaskId} for ${chosen.product} on ${chosen.kiosk}.`,
        });

        setIsCreateModalOpen(false);
        showToast(
            `Dispatched task ${newTaskId} for ${chosen.product} (${chosen.kiosk}) to ${createTechnician}!`
        );
    };

    const handleMarkInProgress = (task: RefillTaskRecord) => {
        if (isViewerReadOnly || task.status === "COMPLETED") return;
        const nowStr = formatNowTimestamp();
        const updated: RefillTaskRecord = {
            ...task,
            status: "IN_PROGRESS",
            history: [
                {
                    id: `TH-${Date.now()}`,
                    timestamp: nowStr,
                    actor: task.technician,
                    action: "STATUS_CHANGED",
                    detail: "Field engineer started on-site execution (Status → IN_PROGRESS).",
                },
                ...task.history,
            ],
        };
        const nextList = tasks.map((t) => (t.id === task.id ? updated : t));
        persistTasksAndSyncAllModules(nextList, undefined, undefined, {
            action: "REFILL_TASK_STARTED",
            target: task.id,
            detail: `Started execution for ${task.id} (${task.productName}) on ${task.kioskCode}.`,
        });
        showToast(`Task ${task.id} marked as IN PROGRESS.`);
    };

    const handleUpdateAssignment = () => {
        if (!selectedTask || isViewerReadOnly) return;
        const nowStr = formatNowTimestamp();
        const updated: RefillTaskRecord = {
            ...selectedTask,
            technician: newAssignee,
            scheduledDate: newDeadline,
            history: [
                {
                    id: `TH-${Date.now()}`,
                    timestamp: nowStr,
                    actor: currentActorLabel,
                    action: "REASSIGNED",
                    detail: `Assigned to ${newAssignee} (Deadline: ${newDeadline}). Note: ${
                        handoverNote || "Standard SLA dispatch handover."
                    }`,
                },
                ...selectedTask.history,
            ],
        };
        const nextList = tasks.map((t) => (t.id === selectedTask.id ? updated : t));
        persistTasksAndSyncAllModules(nextList, undefined, undefined, {
            action: "REFILL_TASK_REASSIGNED",
            target: selectedTask.id,
            detail: `Reassigned ${selectedTask.id} to ${newAssignee}.`,
        });
        setHandoverNote("");
        showToast(`Updated field engineer assignment for ${selectedTask.id}!`);
    };

    const handleToggleProcessStep = (stepNumber: number) => {
        if (!selectedTask || isViewerReadOnly || selectedTask.status === "COMPLETED")
            return;

        const prevStep = selectedTask.processSteps.find(
            (s) => s.stepNumber === stepNumber - 1
        );
        if (prevStep && !prevStep.completed) {
            showToast(
                `Sequential Protocol Guard: Please complete Step 0${
                    stepNumber - 1
                } before proceeding to Step 0${stepNumber}.`
            );
            return;
        }

        const nowStr = formatNowTimestamp();
        const updatedSteps = selectedTask.processSteps.map((s) =>
            s.stepNumber === stepNumber
                ? {
                    ...s,
                    completed: !s.completed,
                    recordedValue: !s.completed
                        ? `Verified by ${
                            selectedTask.technician.split(" (")[0]
                        } at ${nowStr.split(" ")[1]}`
                        : undefined,
                }
                : s
        );

        const updated: RefillTaskRecord = {
            ...selectedTask,
            status:
                selectedTask.status === "PENDING" ||
                selectedTask.status === "OVERDUE"
                    ? "IN_PROGRESS"
                    : selectedTask.status,
            processSteps: updatedSteps,
            history: [
                {
                    id: `TH-${Date.now()}`,
                    timestamp: nowStr,
                    actor: selectedTask.technician,
                    action: `STEP_0${stepNumber}_VERIFIED`,
                    detail: `Verified Step 0${stepNumber}: ${
                        selectedTask.processSteps.find(
                            (s) => s.stepNumber === stepNumber
                        )?.title
                    }`,
                },
                ...selectedTask.history,
            ],
        };

        const nextList = tasks.map((t) => (t.id === selectedTask.id ? updated : t));
        persistTasksAndSyncAllModules(nextList);
    };

    const handleConfirmInventoryUsage = () => {
        if (!selectedTask || isViewerReadOnly) return;
        const nowStr = formatNowTimestamp();
        const hasDiscrepancy =
            selectedTask.actualVolumeUsedMl !== selectedTask.issuedVolumeMl;

        const updated: RefillTaskRecord = {
            ...selectedTask,
            inventoryConfirmed: true,
            history: [
                {
                    id: `TH-${Date.now()}`,
                    timestamp: nowStr,
                    actor: selectedTask.technician,
                    action: "INVENTORY_CONFIRMED",
                    detail: `Confirmed bottle ${selectedTask.newBottleCode} from ${
                        selectedTask.warehouseSource
                    } (${selectedTask.batchNumber}). Issued: ${
                        selectedTask.issuedVolumeMl
                    }ml | Actual Used: ${selectedTask.actualVolumeUsedMl}ml.${
                        hasDiscrepancy
                            ? " [Volume variance logged for audit review]"
                            : ""
                    }`,
                },
                ...selectedTask.history,
            ],
        };
        const nextList = tasks.map((t) => (t.id === selectedTask.id ? updated : t));
        persistTasksAndSyncAllModules(nextList);
        showToast(
            `Confirmed warehouse batch ${selectedTask.batchNumber} for task ${selectedTask.id}!`
        );
    };

    const handleCompleteTask = (forceQuickComplete = false) => {
        if (!selectedTask || isViewerReadOnly) return;

        if (!forceQuickComplete) {
            const allStepsDone = selectedTask.processSteps.every((s) => s.completed);
            if (!allStepsDone) {
                showToast(
                    "Cannot Complete Task: All 4 replacement protocol steps must be verified first (or click 'Quick Complete (100%)')."
                );
                return;
            }
            if (!selectedTask.inventoryConfirmed) {
                showToast(
                    "Cannot Complete Task: Please confirm warehouse bottle & batch usage first."
                );
                return;
            }
            if (selectedTask.testSprayStatus !== "PASSED") {
                showToast(
                    "Cannot Complete Task: Post-refill diagnostic spray test must PASS before returning chamber to active service."
                );
                return;
            }
        }

        const nowStr = formatNowTimestamp();
        const prevMl = selectedTask.currentLevelMl;
        const restoredMl = selectedTask.actualVolumeUsedMl || selectedTask.bottleCapacityMl;

        const updated: RefillTaskRecord = {
            ...selectedTask,
            status: "COMPLETED",
            currentLevelMl: restoredMl,
            inventoryConfirmed: true,
            testSprayStatus: "PASSED",
            testNotes:
                selectedTask.testNotes ||
                "Diagnostic spray (0.12ml) PASSED. Load-cell weight & nozzle pressure (1.50 bar) verified.",
            processSteps: buildStandardSteps(true),
            history: [
                {
                    id: `TH-${Date.now()}`,
                    timestamp: nowStr,
                    actor: selectedTask.technician,
                    action: "TASK_COMPLETED",
                    detail: `Post-refill test PASSED. Chamber restored from ${prevMl}ml to ${restoredMl}ml (100%). Task marked as COMPLETED.`,
                },
                ...selectedTask.history,
            ],
        };

        const nextList = tasks.map((t) => (t.id === selectedTask.id ? updated : t));
        persistTasksAndSyncAllModules(nextList, updated, prevMl, {
            action: "REFILL_TASK_COMPLETED",
            target: selectedTask.id,
            detail: `Completed ${selectedTask.id}: Restored ${selectedTask.productName} on ${selectedTask.kioskCode} to ${restoredMl}ml (100%).`,
        });

        showToast(
            `Task ${selectedTask.id} COMPLETED! Restored ${selectedTask.productName} on ${selectedTask.kioskCode} (${selectedTask.slotLabel}) to ${restoredMl}ml!`
        );
    };

    const handleAddNote = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedTask || !newComment.trim() || isViewerReadOnly) return;
        const nowStr = formatNowTimestamp();
        const updated: RefillTaskRecord = {
            ...selectedTask,
            history: [
                {
                    id: `TH-${Date.now()}`,
                    timestamp: nowStr,
                    actor: selectedTask.technician,
                    action: "TECHNICIAN_NOTE",
                    detail: newComment.trim(),
                },
                ...selectedTask.history,
            ],
        };
        const nextList = tasks.map((t) => (t.id === selectedTask.id ? updated : t));
        persistTasksAndSyncAllModules(nextList);
        setNewComment("");
        showToast("Recorded field engineer note in immutable task timeline.");
    };

    const renderStatusBadge = (st: RefillTaskStatus) => {
        const cfg: Record<
            RefillTaskStatus,
            { bg: string; color: string; border: string }
        > = {
            PENDING: {
                bg: "rgba(234, 179, 8, 0.14)",
                color: "#FACC15",
                border: "rgba(234, 179, 8, 0.4)",
            },
            IN_PROGRESS: {
                bg: "rgba(59, 130, 246, 0.14)",
                color: "#60A5FA",
                border: "rgba(59, 130, 246, 0.4)",
            },
            COMPLETED: {
                bg: "rgba(52, 211, 153, 0.14)",
                color: "#34D399",
                border: "rgba(52, 211, 153, 0.4)",
            },
            OVERDUE: {
                bg: "rgba(248, 113, 113, 0.16)",
                color: "#F87171",
                border: "rgba(248, 113, 113, 0.5)",
            },
        };
        const cur = cfg[st];
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.24rem 0.68rem",
                    borderRadius: "99px",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    fontFamily: "Space Grotesk, monospace",
                    background: cur.bg,
                    color: cur.color,
                    border: `1px solid ${cur.border}`,
                    whiteSpace: "nowrap",
                }}
            >
                {st === "OVERDUE" && <AlertTriangle size={11} />}
                {st === "COMPLETED" && <CheckCircle2 size={11} />}
                {st}
            </span>
        );
    };

    const statusLabels: Record<string, string> = {
        ALL: lang === "en" ? "All Statuses" : "Mọi Trạng Thái",
        PENDING: "PENDING",
        IN_PROGRESS: "IN_PROGRESS",
        COMPLETED: "COMPLETED",
        OVERDUE: "OVERDUE",
    };

    const selectedCatalogOption = WAREHOUSE_CATALOG_OPTIONS[selectedCatalogIdx];

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => {
                setOpenMenuId(null);
                setOpenDropdown(null);
            }}
        >
            {/* LUXURY HERO BANNER CARD */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? "FIELD CARTRIDGE LOGISTICS & SINGLE-BOTTLE SLOT GOVERNANCE"
                                : "ĐIỀU PHỐI NẠP BÌNH NƯỚC HOA & QUẢN TRỊ LÔ HÀNG KHO TRUNG TÂM"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Refill & Cartridge Replacement"
                                : "Quản Trị Thay Bình & Tiếp Liệu Nước Hoa"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? "Dispatch field specialists, enforce 4-step safety interlock replacement protocols, verify warehouse batch barcodes, and synchronize restored chamber volumes across all Kiosk stations."
                                : "Điều phối kỹ thuật viên hiện trường, thực thi quy trình 4 bước khóa an toàn khi thay bình, đối soát mã lô xuất kho và đồng bộ dung tích 100% trên toàn mạng lưới Kiosk."}
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
                            onClick={handleResetSeedTasks}
                            className={styles.secondaryGoldBtn}
                            title="Restore default refill schedule"
                        >
                            <RotateCcw size={13} color="#D4AF37" />
                            <span>{lang === "en" ? "Reset Schedule" : "Khôi Phục Mẫu"}</span>
                        </button>

                        <div
                            className={styles.secondaryGoldBtn}
                            style={{ cursor: "default" }}
                        >
                            <ShieldCheck size={14} color="#34D399" />
                            <span>
                                {isViewerReadOnly
                                    ? "Viewer (Read-Only)"
                                    : brandTenantScope
                                        ? `Maison: ${brandTenantScope}`
                                        : currentActorLabel}
                            </span>
                        </div>

                        {!isViewerReadOnly && (
                            <button
                                type="button"
                                onClick={() => {
                                    setOpenDropdown(null);
                                    setIsCreateModalOpen(true);
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                <Plus size={15} />
                                <span>
                                    {lang === "en"
                                        ? "Dispatch Refill Task"
                                        : "Tạo Phiếu Thay Bình"}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 5 KPI SUMMARY CARDS */}
                <div className={styles.kpiGrid5}>
                    {[
                        {
                            key: "ALL",
                            label: lang === "en" ? "TOTAL TASKS" : "TỔNG NHIỆM VỤ",
                            val: overviewCounts.ALL,
                            color: "#FFFFFF",
                            sub: lang === "en" ? "All scheduled dispatches" : "Tổng phiếu trong kỳ",
                        },
                        {
                            key: "PENDING",
                            label: "PENDING",
                            val: overviewCounts.PENDING,
                            color: "#FACC15",
                            sub: lang === "en" ? "Awaiting engineer start" : "Chờ kỹ thuật tiếp nhận",
                        },
                        {
                            key: "IN_PROGRESS",
                            label: "IN PROGRESS",
                            val: overviewCounts.IN_PROGRESS,
                            color: "#60A5FA",
                            sub: lang === "en" ? "Active on-site execution" : "Đang thao tác tại trạm",
                        },
                        {
                            key: "COMPLETED",
                            label: "COMPLETED",
                            val: overviewCounts.COMPLETED,
                            color: "#34D399",
                            sub: lang === "en" ? "Verified & spray tested" : "Đã nạp 100% & nghiệm thu",
                        },
                        {
                            key: "OVERDUE",
                            label: "OVERDUE",
                            val: overviewCounts.OVERDUE,
                            color: "#F87171",
                            sub: lang === "en" ? "Past scheduled SLA date" : "Quá hạn SLA cần ưu tiên",
                        },
                    ].map((c) => (
                        <div
                            key={c.key}
                            onClick={() => setStatusFilter(c.key)}
                            className={`${styles.kpiCard} ${
                                statusFilter === c.key ? styles.kpiCardActive : ""
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
                                {c.label}
                            </div>
                            <div
                                style={{
                                    fontSize: "1.65rem",
                                    fontWeight: 700,
                                    color: c.color,
                                    fontFamily: "Space Grotesk, monospace",
                                    margin: "0.3rem 0",
                                }}
                            >
                                {c.val}
                            </div>
                            <div style={{ fontSize: "0.71rem", color: "#94A3B8" }}>
                                {c.sub}
                            </div>
                        </div>
                    ))}
                </div>
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
                                    ? "Search by Task ID, Station Code, Fragrance, Maison, Venue, or Field Engineer..."
                                    : "Tìm theo Mã phiếu, Mã trạm Kiosk, Mùi hương, Thương hiệu hoặc Kỹ thuật viên..."
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

                    {/* 3. Custom Dropdown: Brand Filter */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "BRAND" ? null : "BRAND"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                brandFilter !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {brandFilter === "ALL"
                                    ? `All Maisons (${uniqueBrands.length})`
                                    : brandFilter}
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
                                        setBrandFilter("ALL");
                                        setOpenDropdown(null);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        brandFilter === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>All Maisons ({uniqueBrands.length})</span>
                                    {brandFilter === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {uniqueBrands.map((b) => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => {
                                            setBrandFilter(b);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            brandFilter === b
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{b}</span>
                                        {brandFilter === b && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. Custom Dropdown: Status Filter */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "STATUS" ? null : "STATUS"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                statusFilter !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>{statusLabels[statusFilter]}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "185px" }}
                            >
                                {(
                                    [
                                        "ALL",
                                        "PENDING",
                                        "IN_PROGRESS",
                                        "COMPLETED",
                                        "OVERDUE",
                                    ] as const
                                ).map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter(st);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            statusFilter === st
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{statusLabels[st]}</span>
                                        {statusFilter === st && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. Custom Dropdown: Location Filter */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "LOCATION" ? null : "LOCATION"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                locationFilter !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {locationFilter === "ALL"
                                    ? `All Venues (${uniqueLocations.length})`
                                    : locationFilter}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "LOCATION" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "255px" }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLocationFilter("ALL");
                                        setOpenDropdown(null);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        locationFilter === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>All Venues ({uniqueLocations.length})</span>
                                    {locationFilter === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {uniqueLocations.map((loc) => (
                                    <button
                                        key={loc}
                                        type="button"
                                        onClick={() => {
                                            setLocationFilter(loc);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            locationFilter === loc
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{loc}</span>
                                        {locationFilter === loc && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
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

            {/* REFILL TASK LIST TABLE */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>TASK ID</th>
                            <th>STATION & CHAMBER</th>
                            <th>FRAGRANCE & MAISON</th>
                            <th>CHAMBER LEVEL</th>
                            <th>OPERATION TYPE</th>
                            <th>STATUS</th>
                            <th>SCHEDULED DATE</th>
                            <th>FIELD ENGINEER</th>
                            <th style={{ textAlign: "right" }}>ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task) => {
                                const pct = Math.max(
                                    0,
                                    Math.round(
                                        (task.currentLevelMl /
                                            task.bottleCapacityMl) *
                                        100
                                    )
                                );
                                const isSelected = selectedTask?.id === task.id;
                                return (
                                    <tr
                                        key={task.id}
                                        onClick={() => {
                                            setSelectedTaskId(task.id);
                                            setNewAssignee(task.technician);
                                            setNewDeadline(task.scheduledDate);
                                            setDrawerTab("overview");
                                        }}
                                        className={`${styles.tableRow} ${
                                            isSelected
                                                ? styles.tableRowSelected
                                                : ""
                                        }`}
                                    >
                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                color: "#F5E6AD",
                                                fontWeight: 700,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {task.id}
                                        </td>

                                        <td className={styles.tableCell}>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    color: "#FFF",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.85rem",
                                                }}
                                            >
                                                {task.kioskCode} ({task.slotLabel})
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.73rem",
                                                    color: "#94A3B8",
                                                    marginTop: "0.15rem",
                                                }}
                                            >
                                                {task.location}
                                            </div>
                                        </td>

                                        <td className={styles.tableCell}>
                                            <strong
                                                style={{
                                                    color: "#FFF",
                                                    fontSize: "0.84rem",
                                                }}
                                            >
                                                {task.productName}
                                            </strong>
                                            <div
                                                style={{
                                                    fontSize: "0.73rem",
                                                    color: "#D4AF37",
                                                    marginTop: "0.15rem",
                                                }}
                                            >
                                                {task.brand}
                                            </div>
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{ minWidth: "155px" }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    fontSize: "0.78rem",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                <strong
                                                    style={{
                                                        color:
                                                            task.currentLevelMl <=
                                                            task.thresholdMl
                                                                ? "#F87171"
                                                                : "#34D399",
                                                    }}
                                                >
                                                    {task.currentLevelMl}ml /{" "}
                                                    {task.bottleCapacityMl}ml
                                                </strong>
                                                <span style={{ color: "#94A3B8" }}>
                                                        {pct}%
                                                    </span>
                                            </div>
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "5px",
                                                    background:
                                                        "rgba(255,255,255,0.08)",
                                                    borderRadius: "99px",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${pct}%`,
                                                        height: "100%",
                                                        background:
                                                            task.currentLevelMl <=
                                                            task.thresholdMl
                                                                ? "#F87171"
                                                                : "linear-gradient(90deg, #D4AF37, #34D399)",
                                                    }}
                                                />
                                            </div>
                                        </td>

                                        <td className={styles.tableCell}>
                                                <span
                                                    style={{
                                                        padding: "0.24rem 0.65rem",
                                                        borderRadius: "6px",
                                                        fontSize: "0.68rem",
                                                        fontWeight: 700,
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        background:
                                                            "rgba(212,175,55,0.14)",
                                                        color: "#F5E6AD",
                                                        border: "1px solid rgba(212,175,55,0.3)",
                                                    }}
                                                >
                                                    {task.actionType}
                                                </span>
                                        </td>

                                        <td className={styles.tableCell}>
                                            {renderStatusBadge(task.status)}
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                fontSize: "0.8rem",
                                                color:
                                                    task.status === "OVERDUE"
                                                        ? "#F87171"
                                                        : "#CBD5E1",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {task.scheduledDate}
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#E2E8F0",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {task.technician.split(" (")[0]}
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
                                                onClick={() =>
                                                    setOpenMenuId(
                                                        openMenuId === task.id
                                                            ? null
                                                            : task.id
                                                    )
                                                }
                                                className={styles.actionButton}
                                                style={{ padding: "0.4rem 0.6rem" }}
                                            >
                                                <MoreHorizontal
                                                    size={15}
                                                    color="#D4AF37"
                                                />
                                            </button>

                                            {openMenuId === task.id && (
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
                                                            setSelectedTaskId(
                                                                task.id
                                                            );
                                                            setNewAssignee(
                                                                task.technician
                                                            );
                                                            setNewDeadline(
                                                                task.scheduledDate
                                                            );
                                                            setDrawerTab(
                                                                "overview"
                                                            );
                                                            setOpenMenuId(null);
                                                        }}
                                                        className={
                                                            styles.customDropdownItem
                                                        }
                                                    >
                                                            <span>
                                                                Inspect Task Dossier
                                                            </span>
                                                    </button>

                                                    {!isViewerReadOnly &&
                                                        task.status !==
                                                        "COMPLETED" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleMarkInProgress(
                                                                        task
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
                                                                        Mark as In
                                                                        Progress
                                                                    </span>
                                                            </button>
                                                        )}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTaskId(
                                                                task.id
                                                            );
                                                            setDrawerTab(
                                                                "process"
                                                            );
                                                            setOpenMenuId(null);
                                                        }}
                                                        className={
                                                            styles.customDropdownItem
                                                        }
                                                        style={{ color: "#F5E6AD" }}
                                                    >
                                                            <span>
                                                                Execute 4-Step
                                                                Protocol
                                                            </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTaskId(
                                                                task.id
                                                            );
                                                            setDrawerTab(
                                                                "history"
                                                            );
                                                            setOpenMenuId(null);
                                                        }}
                                                        className={
                                                            styles.customDropdownItem
                                                        }
                                                        style={{ color: "#34D399" }}
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
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={9}
                                    style={{
                                        textAlign: "center",
                                        color: "#94A3B8",
                                        padding: "3.5rem",
                                    }}
                                >
                                    <strong
                                        style={{
                                            color: "#F5E6AD",
                                            fontSize: "1.1rem",
                                            display: "block",
                                            marginBottom: "0.35rem",
                                        }}
                                    >
                                        No tasks found.
                                    </strong>
                                    No refill or replacement tasks match your current calendar range, search keyword, or filter criteria.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* =========================================================
               CENTERED LUXURY MODAL: REFILL TASK DOSSIER (4 TABS + 4-METRIC FOOTER)
            ========================================================= */}
            {selectedTask && (
                <div
                    className={styles.drawerOverlay}
                    onClick={() => setSelectedTaskId(null)}
                >
                    <div
                        className={styles.drawerPanel}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                        }}
                    >
                        {/* HEADER 2 CỘT PHẲNG TẮP */}
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
                                            background: "rgba(212, 175, 55, 0.14)",
                                            border: "1px solid rgba(212, 175, 55, 0.45)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Droplets size={24} color="#D4AF37" />
                                    </div>

                                    <div style={{ minWidth: 0, flex: 1 }}>
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
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.66rem",
                                                    color: "#D4AF37",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.12em",
                                                }}
                                            >
                                                DISPATCH DOSSIER • {selectedTask.id}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "0.65rem",
                                                    color: "#F5E6AD",
                                                    background:
                                                        "rgba(212,175,55,0.14)",
                                                    padding: "0.18rem 0.55rem",
                                                    borderRadius: "6px",
                                                    fontWeight: 700,
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                {selectedTask.actionType}
                                            </span>
                                            {renderStatusBadge(selectedTask.status)}
                                        </div>

                                        <h2
                                            style={{
                                                margin: "0 0 0.2rem 0",
                                                fontSize: "1.32rem",
                                                fontWeight: 600,
                                                color: "#FFFFFF",
                                                fontFamily:
                                                    "Bodoni Moda, Georgia, serif",
                                                lineHeight: 1.15,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {selectedTask.brand} —{" "}
                                            {selectedTask.productName}
                                        </h2>

                                        <div
                                            style={{
                                                fontSize: "0.73rem",
                                                color: "#94A3B8",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            STATION:{" "}
                                            <strong style={{ color: "#F5E6AD" }}>
                                                {selectedTask.kioskCode} (
                                                {selectedTask.slotLabel})
                                            </strong>{" "}
                                            • SLA:{" "}
                                            <strong style={{ color: "#E2E8F0" }}>
                                                {selectedTask.scheduledDate}
                                            </strong>{" "}
                                            • PRIORITY:{" "}
                                            <strong style={{ color: "#34D399" }}>
                                                {selectedTask.priority}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.42rem",
                                        flexShrink: 0,
                                    }}
                                >
                                    {!isViewerReadOnly &&
                                        selectedTask.status !== "COMPLETED" && (
                                            <>
                                                {selectedTask.status !==
                                                    "IN_PROGRESS" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleMarkInProgress(
                                                                    selectedTask
                                                                )
                                                            }
                                                            className={
                                                                styles.secondaryGoldBtn
                                                            }
                                                            style={{
                                                                padding:
                                                                    "0.48rem 0.78rem",
                                                                fontSize: "0.73rem",
                                                            }}
                                                        >
                                                            <Play
                                                                size={13}
                                                                color="#60A5FA"
                                                            />
                                                            <span>Start Task</span>
                                                        </button>
                                                    )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCompleteTask(true)
                                                    }
                                                    className={styles.primaryGoldBtn}
                                                    style={{
                                                        padding: "0.48rem 0.88rem",
                                                        fontSize: "0.73rem",
                                                    }}
                                                >
                                                    <Check size={14} />
                                                    <span>
                                                        Quick Complete (100%)
                                                    </span>
                                                </button>
                                            </>
                                        )}

                                    <button
                                        type="button"
                                        onClick={() => setSelectedTaskId(null)}
                                        className={styles.secondaryGoldBtn}
                                        style={{ padding: "0.48rem 0.65rem" }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4 TABS CHIA ĐỀU 4 CỘT */}
                        <div className={styles.drawerTabsBar}>
                            {[
                                {
                                    id: "overview",
                                    label: "Assignment & Scope",
                                    icon: UserCheck,
                                },
                                {
                                    id: "process",
                                    label: `4-Step Protocol (${
                                        selectedTask.processSteps.filter(
                                            (s) => s.completed
                                        ).length
                                    }/4)`,
                                    icon: Wrench,
                                },
                                {
                                    id: "inventory_test",
                                    label: "Batch & Spray Test",
                                    icon: PackageCheck,
                                },
                                {
                                    id: "history",
                                    label: `Audit Timeline (${selectedTask.history.length})`,
                                    icon: History,
                                },
                            ].map((t) => {
                                const IconComp = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() =>
                                            setDrawerTab(t.id as DrawerTabType)
                                        }
                                        className={`${styles.drawerTabBtn} ${
                                            drawerTab === t.id
                                                ? styles.drawerTabBtnActive
                                                : ""
                                        }`}
                                    >
                                        <IconComp size={14} />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* BODY NỘI DUNG */}
                        <div className={styles.drawerBody}>
                            {/* TAB 1: ASSIGNMENT & SCOPE */}
                            {drawerTab === "overview" && (
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
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                Operational Scope & Field
                                                Instructions
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/machines/${encodeURIComponent(
                                                            selectedTask.kioskCode
                                                        )}`
                                                    )
                                                }
                                                className={styles.secondaryGoldBtn}
                                                style={{
                                                    padding: "0.32rem 0.65rem",
                                                    fontSize: "0.7rem",
                                                }}
                                            >
                                                <Cpu size={12} color="#D4AF37" />
                                                <span>
                                                    Station {selectedTask.kioskCode}
                                                </span>
                                                <ArrowUpRight size={12} />
                                            </button>
                                        </div>
                                        <p
                                            style={{
                                                margin: 0,
                                                color: "#E2E8F0",
                                                fontSize: "0.85rem",
                                                lineHeight: 1.55,
                                            }}
                                        >
                                            {selectedTask.description}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "0.85rem",
                                        }}
                                    >
                                        <div className={styles.glassCard}>
                                            <div
                                                style={{
                                                    fontSize: "0.66rem",
                                                    color: "#94A3B8",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                CURRENT CHAMBER VOLUME
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "1.2rem",
                                                    fontWeight: 700,
                                                    color:
                                                        selectedTask.currentLevelMl <=
                                                        selectedTask.thresholdMl
                                                            ? "#F87171"
                                                            : "#34D399",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    marginTop: "0.2rem",
                                                }}
                                            >
                                                {selectedTask.currentLevelMl}ml /{" "}
                                                {selectedTask.bottleCapacityMl}ml
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#94A3B8",
                                                    marginTop: "0.18rem",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                Outgoing Bottle:{" "}
                                                <strong style={{ color: "#E2E8F0" }}>
                                                    {selectedTask.oldBottleCode}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className={styles.glassCard}>
                                            <div
                                                style={{
                                                    fontSize: "0.66rem",
                                                    color: "#94A3B8",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                ALLOCATED WAREHOUSE BATCH
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "1.05rem",
                                                    fontWeight: 700,
                                                    color: "#34D399",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    marginTop: "0.2rem",
                                                }}
                                            >
                                                {selectedTask.warehouseSource} •{" "}
                                                {selectedTask.batchNumber}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#F5E6AD",
                                                    marginTop: "0.18rem",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                Incoming Bottle:{" "}
                                                <strong>
                                                    {selectedTask.newBottleCode}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {!isViewerReadOnly && (
                                        <div
                                            className={styles.glassCard}
                                            style={{
                                                border: "1px solid rgba(212,175,55,0.35)",
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "0.72rem",
                                                    color: "#F5E6AD",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    marginBottom: "0.65rem",
                                                }}
                                            >
                                                Field Engineer Assignment & SLA
                                                Handover
                                            </div>

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "1.35fr 0.65fr",
                                                    gap: "0.75rem",
                                                    marginBottom: "0.75rem",
                                                }}
                                            >
                                                {/* Ô TRÁI: CUSTOM DROPDOWN CHỌN KỸ THUẬT VIÊN */}
                                                <div
                                                    className={
                                                        styles.customDropdownWrap
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenDropdown(
                                                                openDropdown ===
                                                                "ASSIGN_TECH"
                                                                    ? null
                                                                    : "ASSIGN_TECH"
                                                            )
                                                        }
                                                        className={`${
                                                            styles.customDropdownTrigger
                                                        } ${
                                                            openDropdown ===
                                                            "ASSIGN_TECH"
                                                                ? styles.customDropdownTriggerActive
                                                                : ""
                                                        }`}
                                                        style={{
                                                            width: "100%",
                                                            padding:
                                                                "0.58rem 0.85rem",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                overflow: "hidden",
                                                                textOverflow:
                                                                    "ellipsis",
                                                            }}
                                                        >
                                                            {newAssignee}
                                                        </span>
                                                        <ChevronDown
                                                            size={13}
                                                            color="#D4AF37"
                                                        />
                                                    </button>
                                                    {openDropdown ===
                                                        "ASSIGN_TECH" && (
                                                            <div
                                                                className={
                                                                    styles.customDropdownMenu
                                                                }
                                                                style={{
                                                                    width: "100%",
                                                                    bottom: "calc(100% + 8px)",
                                                                    top: "auto",
                                                                }}
                                                            >
                                                                {AVAILABLE_TECHNICIANS.map(
                                                                    (tech) => (
                                                                        <button
                                                                            key={tech}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setNewAssignee(
                                                                                    tech
                                                                                );
                                                                                setOpenDropdown(
                                                                                    null
                                                                                );
                                                                            }}
                                                                            className={`${
                                                                                styles.customDropdownItem
                                                                            } ${
                                                                                newAssignee ===
                                                                                tech
                                                                                    ? styles.customDropdownItemActive
                                                                                    : ""
                                                                            }`}
                                                                        >
                                                                        <span>
                                                                            {tech}
                                                                        </span>
                                                                            {newAssignee ===
                                                                                tech && (
                                                                                    <Check
                                                                                        size={
                                                                                            13
                                                                                        }
                                                                                        color="#D4AF37"
                                                                                    />
                                                                                )}
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        )}
                                                </div>

                                                {/* Ô PHẢI: CUSTOM LUXURY DARK CALENDAR POPOVER (FIXED CENTERED — KHÔNG BỊ CẮT ĐẦU) */}
                                                <div
                                                    className={
                                                        styles.customDropdownWrap
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenDropdown(
                                                                openDropdown ===
                                                                "ASSIGN_DATE"
                                                                    ? null
                                                                    : "ASSIGN_DATE"
                                                            )
                                                        }
                                                        className={`${
                                                            styles.customDropdownTrigger
                                                        } ${
                                                            openDropdown ===
                                                            "ASSIGN_DATE"
                                                                ? styles.customDropdownTriggerActive
                                                                : ""
                                                        }`}
                                                        style={{
                                                            width: "100%",
                                                            padding:
                                                                "0.58rem 0.85rem",
                                                        }}
                                                    >
                                                        <Calendar
                                                            size={13}
                                                            color="#D4AF37"
                                                        />
                                                        <span
                                                            style={{
                                                                fontFamily:
                                                                    "Space Grotesk, monospace",
                                                            }}
                                                        >
                                                            {formatFullDisplayDate(
                                                                newDeadline
                                                            )}
                                                        </span>
                                                        <ChevronDown
                                                            size={13}
                                                            color="#D4AF37"
                                                        />
                                                    </button>

                                                    {openDropdown ===
                                                        "ASSIGN_DATE" && (
                                                            <div
                                                                className={
                                                                    styles.calendarPopover
                                                                }
                                                                style={{
                                                                    position: "fixed",
                                                                    top: "50%",
                                                                    left: "50%",
                                                                    transform:
                                                                        "translate(-50%, -50%)",
                                                                    width: "320px",
                                                                    zIndex: 999999,
                                                                    boxShadow:
                                                                        "0 30px 90px rgba(0,0,0,0.98), 0 0 30px rgba(212,175,55,0.28)",
                                                                }}
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.calendarHeader
                                                                    }
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (
                                                                                calendarViewMonth ===
                                                                                0
                                                                            ) {
                                                                                setCalendarViewMonth(
                                                                                    11
                                                                                );
                                                                                setCalendarViewYear(
                                                                                    (
                                                                                        y
                                                                                    ) =>
                                                                                        y -
                                                                                        1
                                                                                );
                                                                            } else {
                                                                                setCalendarViewMonth(
                                                                                    (
                                                                                        m
                                                                                    ) =>
                                                                                        m -
                                                                                        1
                                                                                );
                                                                            }
                                                                        }}
                                                                        className={
                                                                            styles.calendarNavBtn
                                                                        }
                                                                    >
                                                                        <ChevronLeft
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                    <span
                                                                        className={
                                                                            styles.calendarMonthTitle
                                                                        }
                                                                    >
                                                                    {
                                                                        monthTitleText
                                                                    }
                                                                </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (
                                                                                calendarViewMonth ===
                                                                                11
                                                                            ) {
                                                                                setCalendarViewMonth(
                                                                                    0
                                                                                );
                                                                                setCalendarViewYear(
                                                                                    (
                                                                                        y
                                                                                    ) =>
                                                                                        y +
                                                                                        1
                                                                                );
                                                                            } else {
                                                                                setCalendarViewMonth(
                                                                                    (
                                                                                        m
                                                                                    ) =>
                                                                                        m +
                                                                                        1
                                                                                );
                                                                            }
                                                                        }}
                                                                        className={
                                                                            styles.calendarNavBtn
                                                                        }
                                                                    >
                                                                        <ChevronRight
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>

                                                                <div
                                                                    className={
                                                                        styles.calendarWeekdaysGrid
                                                                    }
                                                                >
                                                                    {[
                                                                        "T2",
                                                                        "T3",
                                                                        "T4",
                                                                        "T5",
                                                                        "T6",
                                                                        "T7",
                                                                        "CN",
                                                                    ].map((wd) => (
                                                                        <span
                                                                            key={wd}
                                                                        >
                                                                        {wd}
                                                                    </span>
                                                                    ))}
                                                                </div>

                                                                <div
                                                                    className={
                                                                        styles.calendarDaysGrid
                                                                    }
                                                                >
                                                                    {calendarGridCells.map(
                                                                        (cell) => (
                                                                            <button
                                                                                key={
                                                                                    cell.ymd
                                                                                }
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setNewDeadline(
                                                                                        cell.ymd
                                                                                    );
                                                                                    setOpenDropdown(
                                                                                        null
                                                                                    );
                                                                                }}
                                                                                className={`${
                                                                                    styles.calendarDayBtn
                                                                                } ${
                                                                                    !cell.isCurrentMonth
                                                                                        ? styles.calendarDayMuted
                                                                                        : ""
                                                                                } ${
                                                                                    cell.ymd ===
                                                                                    newDeadline
                                                                                        ? styles.calendarDaySelected
                                                                                        : ""
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    cell.dayNum
                                                                                }
                                                                            </button>
                                                                        )
                                                                    )}
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        marginTop:
                                                                            "0.75rem",
                                                                        paddingTop:
                                                                            "0.55rem",
                                                                        borderTop:
                                                                            "1px solid rgba(255,255,255,0.08)",
                                                                    }}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setNewDeadline(
                                                                                todayYmd
                                                                            );
                                                                            setOpenDropdown(
                                                                                null
                                                                            );
                                                                        }}
                                                                        className={
                                                                            styles.secondaryGoldBtn
                                                                        }
                                                                        style={{
                                                                            padding:
                                                                                "0.32rem 0.65rem",
                                                                            fontSize:
                                                                                "0.7rem",
                                                                        }}
                                                                    >
                                                                    <span>
                                                                        {lang ===
                                                                        "en"
                                                                            ? "Today"
                                                                            : "Hôm nay"}
                                                                    </span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setOpenDropdown(
                                                                                null
                                                                            )
                                                                        }
                                                                        className={
                                                                            styles.primaryGoldBtn
                                                                        }
                                                                        style={{
                                                                            padding:
                                                                                "0.32rem 0.8rem",
                                                                            fontSize:
                                                                                "0.7rem",
                                                                        }}
                                                                    >
                                                                    <span>
                                                                        {lang ===
                                                                        "en"
                                                                            ? "Done"
                                                                            : "Xong"}
                                                                    </span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.65rem",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="Enter handover instructions for the assigned field engineer..."
                                                    value={handoverNote}
                                                    onChange={(e) =>
                                                        setHandoverNote(
                                                            e.target.value
                                                        )
                                                    }
                                                    className={styles.searchInput}
                                                    style={{
                                                        padding: "0.55rem 0.9rem",
                                                        flex: 1,
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleUpdateAssignment}
                                                    className={
                                                        styles.secondaryGoldBtn
                                                    }
                                                >
                                                    <Edit3
                                                        size={13}
                                                        color="#D4AF37"
                                                    />
                                                    <span>Update Dispatch</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: 4-STEP REPLACEMENT PROTOCOL */}
                            {drawerTab === "process" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            color: "#94A3B8",
                                        }}
                                    >
                                        Execute the sequential 4-step cartridge replacement protocol below:
                                    </div>

                                    {selectedTask.processSteps.map((step) => (
                                        <div
                                            key={step.stepNumber}
                                            onClick={() =>
                                                handleToggleProcessStep(
                                                    step.stepNumber
                                                )
                                            }
                                            className={styles.glassCard}
                                            style={{
                                                cursor: "pointer",
                                                borderLeft: `4px solid ${
                                                    step.completed
                                                        ? "#34D399"
                                                        : "#D4AF37"
                                                }`,
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: "1rem",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "0.68rem",
                                                        color: "#D4AF37",
                                                        fontWeight: 700,
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    STEP 0{step.stepNumber}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.88rem",
                                                        fontWeight: 700,
                                                        color: "#FFF",
                                                        marginTop: "0.12rem",
                                                    }}
                                                >
                                                    {step.title}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.76rem",
                                                        color: "#94A3B8",
                                                        marginTop: "0.15rem",
                                                    }}
                                                >
                                                    {step.description}
                                                </div>
                                                {step.recordedValue && (
                                                    <div
                                                        style={{
                                                            fontSize: "0.72rem",
                                                            color: "#34D399",
                                                            marginTop: "0.25rem",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        ✓ {step.recordedValue}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.actionButton}
                                                style={{
                                                    background: step.completed
                                                        ? "rgba(52,211,153,0.14)"
                                                        : "rgba(212,175,55,0.14)",
                                                    color: step.completed
                                                        ? "#34D399"
                                                        : "#F5E6AD",
                                                    borderColor: step.completed
                                                        ? "rgba(52,211,153,0.4)"
                                                        : "rgba(212,175,55,0.4)",
                                                }}
                                            >
                                                <span>
                                                    {step.completed
                                                        ? "✓ Verified"
                                                        : "Verify Step"}
                                                </span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TAB 3: BATCH CONFIRMATION & POST-REFILL TESTING */}
                            {drawerTab === "inventory_test" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.9rem",
                                    }}
                                >
                                    <div className={styles.glassCard}>
                                        <div
                                            style={{
                                                fontSize: "0.72rem",
                                                color: "#D4AF37",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                marginBottom: "0.6rem",
                                            }}
                                        >
                                            Warehouse Batch & Volume
                                            Confirmation
                                        </div>
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "1rem",
                                                marginBottom: "0.75rem",
                                                fontSize: "0.82rem",
                                            }}
                                        >
                                            <div>
                                                <span
                                                    style={{
                                                        color: "#94A3B8",
                                                        display: "block",
                                                        fontSize: "0.72rem",
                                                    }}
                                                >
                                                    Source Warehouse & Batch
                                                </span>
                                                <strong
                                                    style={{
                                                        color: "#FFF",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {selectedTask.warehouseSource} •{" "}
                                                    {selectedTask.batchNumber}
                                                </strong>
                                            </div>
                                            <div>
                                                <span
                                                    style={{
                                                        color: "#94A3B8",
                                                        display: "block",
                                                        fontSize: "0.72rem",
                                                    }}
                                                >
                                                    Issued Volume vs Actual Installed
                                                    (ml)
                                                </span>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                        marginTop: "0.2rem",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    <span>
                                                        Issued:{" "}
                                                        {selectedTask.issuedVolumeMl}
                                                        ml
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={
                                                            selectedTask.actualVolumeUsedMl
                                                        }
                                                        onChange={(e) => {
                                                            const val = Number(
                                                                e.target.value
                                                            );
                                                            const updated = {
                                                                ...selectedTask,
                                                                actualVolumeUsedMl:
                                                                val,
                                                            };
                                                            setTasks((prev) =>
                                                                prev.map((t) =>
                                                                    t.id ===
                                                                    selectedTask.id
                                                                        ? updated
                                                                        : t
                                                                )
                                                            );
                                                        }}
                                                        style={{
                                                            width: "78px",
                                                            padding:
                                                                "0.3rem 0.5rem",
                                                            borderRadius: "8px",
                                                            background: "#08080D",
                                                            border: "1px solid rgba(212,175,55,0.4)",
                                                            color: "#F5E6AD",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                        }}
                                                    />
                                                    <span>ml</span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedTask.actualVolumeUsedMl !==
                                            selectedTask.issuedVolumeMl && (
                                                <div
                                                    style={{
                                                        padding: "0.65rem 0.85rem",
                                                        borderRadius: "10px",
                                                        background:
                                                            "rgba(245,158,11,0.14)",
                                                        border: "1px solid rgba(245,158,11,0.4)",
                                                        color: "#FBBF24",
                                                        fontSize: "0.76rem",
                                                        marginBottom: "0.75rem",
                                                    }}
                                                >
                                                    <strong>
                                                        Volume Variance Detected:
                                                    </strong>{" "}
                                                    Actual installed volume (
                                                    {selectedTask.actualVolumeUsedMl}
                                                    ml) differs from issued bottle
                                                    volume (
                                                    {selectedTask.issuedVolumeMl}
                                                    ml). Variance will be logged in
                                                    Inventory Audit.
                                                </div>
                                            )}

                                        <button
                                            type="button"
                                            onClick={handleConfirmInventoryUsage}
                                            className={styles.secondaryGoldBtn}
                                        >
                                            <PackageCheck
                                                size={14}
                                                color="#34D399"
                                            />
                                            <span>
                                                {selectedTask.inventoryConfirmed
                                                    ? "✓ Batch & Bottle Usage Confirmed"
                                                    : "Confirm Bottle & Batch Usage"}
                                            </span>
                                        </button>
                                    </div>

                                    <div
                                        className={styles.glassCard}
                                        style={{
                                            border: "1px solid rgba(52,211,153,0.35)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "0.72rem",
                                                color: "#34D399",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                marginBottom: "0.35rem",
                                            }}
                                        >
                                            Post-Refill Diagnostic Actuation &
                                            Sign-Off
                                        </div>
                                        <p
                                            style={{
                                                fontSize: "0.78rem",
                                                color: "#94A3B8",
                                                marginTop: 0,
                                                marginBottom: "0.75rem",
                                            }}
                                        >
                                            Execute 1 calibrated test spray (0.12ml) and verify nozzle pressure (1.50 bar) before returning the chamber to active Kiosk service:
                                        </p>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "0.65rem",
                                                marginBottom: "0.85rem",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated: RefillTaskRecord =
                                                        {
                                                            ...selectedTask,
                                                            testSprayStatus:
                                                                "PASSED",
                                                            testNotes:
                                                                "Diagnostic spray (0.12ml) PASSED. Load-cell weight & nozzle pressure (1.50 bar) verified.",
                                                        };
                                                    setTasks((prev) =>
                                                        prev.map((t) =>
                                                            t.id ===
                                                            selectedTask.id
                                                                ? updated
                                                                : t
                                                        )
                                                    );
                                                }}
                                                className={styles.actionButton}
                                                style={{
                                                    borderColor:
                                                        selectedTask.testSprayStatus ===
                                                        "PASSED"
                                                            ? "#34D399"
                                                            : "rgba(255,255,255,0.15)",
                                                    color:
                                                        selectedTask.testSprayStatus ===
                                                        "PASSED"
                                                            ? "#34D399"
                                                            : "#CBD5E1",
                                                }}
                                            >
                                                <span>
                                                    ✓ Diagnostic Spray: PASSED
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated: RefillTaskRecord =
                                                        {
                                                            ...selectedTask,
                                                            testSprayStatus:
                                                                "FAILED",
                                                            testNotes:
                                                                "Nozzle pressure variance detected during post-refill test.",
                                                        };
                                                    setTasks((prev) =>
                                                        prev.map((t) =>
                                                            t.id ===
                                                            selectedTask.id
                                                                ? updated
                                                                : t
                                                        )
                                                    );
                                                }}
                                                className={styles.actionButton}
                                                style={{
                                                    borderColor:
                                                        selectedTask.testSprayStatus ===
                                                        "FAILED"
                                                            ? "#F87171"
                                                            : "rgba(255,255,255,0.15)",
                                                    color:
                                                        selectedTask.testSprayStatus ===
                                                        "FAILED"
                                                            ? "#F87171"
                                                            : "#CBD5E1",
                                                }}
                                            >
                                                <span>
                                                    ✕ Diagnostic Spray: FAILED
                                                </span>
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={
                                                selectedTask.status === "COMPLETED"
                                            }
                                            onClick={() => handleCompleteTask(false)}
                                            className={styles.primaryGoldBtn}
                                            style={{ width: "100%" }}
                                        >
                                            <CheckCircle2 size={15} />
                                            <span>
                                                {selectedTask.status === "COMPLETED"
                                                    ? "Task Completed & Chamber Restored (100%)"
                                                    : "Complete Task & Synchronize 100% Volume"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: AUDIT TIMELINE & NOTES */}
                            {drawerTab === "history" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
                                    {!isViewerReadOnly && (
                                        <form
                                            onSubmit={handleAddNote}
                                            style={{
                                                display: "flex",
                                                gap: "0.6rem",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                placeholder="Add field engineer inspection note or handover remark..."
                                                value={newComment}
                                                onChange={(e) =>
                                                    setNewComment(e.target.value)
                                                }
                                                className={styles.searchInput}
                                                style={{
                                                    padding: "0.58rem 0.9rem",
                                                    flex: 1,
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                className={styles.secondaryGoldBtn}
                                            >
                                                <span>Add Note</span>
                                            </button>
                                        </form>
                                    )}

                                    {selectedTask.history.map((h) => (
                                        <div
                                            key={h.id}
                                            className={styles.glassCard}
                                            style={{
                                                borderLeft: "3px solid #D4AF37",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontSize: "0.8rem",
                                                }}
                                            >
                                                <strong style={{ color: "#FFF" }}>
                                                    {h.actor}
                                                </strong>
                                                <span
                                                    style={{
                                                        color: "#F5E6AD",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        fontSize: "0.73rem",
                                                    }}
                                                >
                                                    {h.timestamp}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.69rem",
                                                    color: "#34D399",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    marginTop: "2px",
                                                }}
                                            >
                                                {h.action}
                                            </div>
                                            <p
                                                style={{
                                                    margin: "0.3rem 0 0 0",
                                                    fontSize: "0.8rem",
                                                    color: "#CBD5E1",
                                                }}
                                            >
                                                {h.detail}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 4-METRIC FOOTER CỐ ĐỊNH DƯỚI ĐÁY MODAL */}
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
                                    Station Chamber
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#FFF",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTask.kioskCode} •{" "}
                                    {selectedTask.slotLabel}
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
                                    Chamber Volume
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.85rem",
                                        color:
                                            selectedTask.currentLevelMl <=
                                            selectedTask.thresholdMl
                                                ? "#F87171"
                                                : "#34D399",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTask.currentLevelMl}ml /{" "}
                                    {selectedTask.bottleCapacityMl}ml
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
                                    Warehouse Batch
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#F5E6AD",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTask.batchNumber}
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
                                    Diagnostic Spray
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.85rem",
                                        color:
                                            selectedTask.testSprayStatus ===
                                            "PASSED"
                                                ? "#34D399"
                                                : selectedTask.testSprayStatus ===
                                                "FAILED"
                                                    ? "#F87171"
                                                    : "#FBBF24",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTask.testSprayStatus}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               CREATE REFILL TASK MODAL (CUSTOM LUXURY DROPDOWNS + DARK CALENDAR)
            ========================================================= */}
            {isCreateModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => {
                        setOpenDropdown(null);
                        setIsCreateModalOpen(false);
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
                                marginBottom: "1.1rem",
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
                                    CARTRIDGE REPLENISHMENT DISPATCH
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        color: "#FFF",
                                        fontSize: "1.35rem",
                                        fontFamily: "Bodoni Moda, Georgia, serif",
                                    }}
                                >
                                    Dispatch Refill / Replacement Task
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {selectedCatalogOption.warehouseBottles === 0 && (
                            <div
                                style={{
                                    padding: "0.8rem 1rem",
                                    borderRadius: "12px",
                                    background: "rgba(248,113,113,0.15)",
                                    border: "1px solid rgba(248,113,113,0.45)",
                                    color: "#FCA5A5",
                                    fontSize: "0.78rem",
                                    marginBottom: "1rem",
                                    display: "flex",
                                    gap: "0.65rem",
                                    alignItems: "center",
                                }}
                            >
                                <ShieldAlert size={18} color="#F87171" />
                                <div>
                                    <strong>Warehouse Stock Alert:</strong> No
                                    sealed bottle of{" "}
                                    <u>{selectedCatalogOption.product}</u> is
                                    currently available in{" "}
                                    {selectedCatalogOption.wh} (0 bottles in
                                    stock). Please receive a batch in Inventory
                                    before executing this task.
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleCreateTaskSubmit}>
                            <div
                                style={{ marginBottom: "0.95rem" }}
                                onClick={(e) => e.stopPropagation()}
                            >
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
                                    Select Kiosk Chamber & Fragrance *
                                </label>
                                <div className={styles.customDropdownWrap}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "CREATE_CATALOG"
                                                    ? null
                                                    : "CREATE_CATALOG"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{
                                            width: "100%",
                                            padding: "0.65rem 0.9rem",
                                        }}
                                    >
                                        <span>
                                            {selectedCatalogOption.kiosk} (
                                            {selectedCatalogOption.slot}) —{" "}
                                            {selectedCatalogOption.brand}:{" "}
                                            {selectedCatalogOption.product} [
                                            {selectedCatalogOption.currentMl}ml |
                                            WH:{" "}
                                            {
                                                selectedCatalogOption.warehouseBottles
                                            }{" "}
                                            btl]
                                        </span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "CREATE_CATALOG" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ width: "100%" }}
                                        >
                                            {WAREHOUSE_CATALOG_OPTIONS.map(
                                                (opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCatalogIdx(
                                                                idx
                                                            );
                                                            setOpenDropdown(null);
                                                        }}
                                                        className={`${
                                                            styles.customDropdownItem
                                                        } ${
                                                            selectedCatalogIdx ===
                                                            idx
                                                                ? styles.customDropdownItemActive
                                                                : ""
                                                        }`}
                                                    >
                                                        <span>
                                                            {opt.kiosk} ({opt.slot}
                                                            ) — {opt.brand}:{" "}
                                                            {opt.product} [
                                                            {opt.currentMl}ml | WH:{" "}
                                                            {opt.warehouseBottles}{" "}
                                                            btl]
                                                        </span>
                                                        {selectedCatalogIdx ===
                                                            idx && (
                                                                <Check
                                                                    size={13}
                                                                    color="#D4AF37"
                                                                />
                                                            )}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "0.85rem",
                                    marginBottom: "0.95rem",
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
                                        Operation Type *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "CREATE_TYPE"
                                                    ? null
                                                    : "CREATE_TYPE"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{
                                            width: "100%",
                                            padding: "0.65rem 0.9rem",
                                        }}
                                    >
                                        <span>{createActionType}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "CREATE_TYPE" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ width: "100%" }}
                                        >
                                            {(
                                                ["REPLACE", "REFILL"] as const
                                            ).map((tp) => (
                                                <button
                                                    key={tp}
                                                    type="button"
                                                    onClick={() => {
                                                        setCreateActionType(tp);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        createActionType === tp
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{tp}</span>
                                                    {createActionType === tp && (
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
                                        SLA Priority *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "CREATE_PRIORITY"
                                                    ? null
                                                    : "CREATE_PRIORITY"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{
                                            width: "100%",
                                            padding: "0.65rem 0.9rem",
                                        }}
                                    >
                                        <span>{createPriority}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "CREATE_PRIORITY" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ width: "100%" }}
                                        >
                                            {(
                                                ["URGENT", "HIGH", "NORMAL"] as const
                                            ).map((pr) => (
                                                <button
                                                    key={pr}
                                                    type="button"
                                                    onClick={() => {
                                                        setCreatePriority(pr);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        createPriority === pr
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{pr}</span>
                                                    {createPriority === pr && (
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

                                {/* CUSTOM LUXURY DARK CALENDAR CHO SCHEDULED DATE */}
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
                                        Scheduled Date *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "CREATE_DATE"
                                                    ? null
                                                    : "CREATE_DATE"
                                            )
                                        }
                                        className={`${
                                            styles.customDropdownTrigger
                                        } ${
                                            openDropdown === "CREATE_DATE"
                                                ? styles.customDropdownTriggerActive
                                                : ""
                                        }`}
                                        style={{
                                            width: "100%",
                                            padding: "0.65rem 0.9rem",
                                        }}
                                    >
                                        <Calendar size={13} color="#D4AF37" />
                                        <span
                                            style={{
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            {formatFullDisplayDate(
                                                createDeadline
                                            )}
                                        </span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>

                                    {openDropdown === "CREATE_DATE" && (
                                        <div
                                            className={styles.calendarPopover}
                                            style={{
                                                position: "fixed",
                                                top: "50%",
                                                left: "50%",
                                                transform:
                                                    "translate(-50%, -50%)",
                                                width: "320px",
                                                zIndex: 999999,
                                                boxShadow:
                                                    "0 30px 90px rgba(0,0,0,0.98), 0 0 30px rgba(212,175,55,0.28)",
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles.calendarHeader
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            calendarViewMonth ===
                                                            0
                                                        ) {
                                                            setCalendarViewMonth(
                                                                11
                                                            );
                                                            setCalendarViewYear(
                                                                (y) => y - 1
                                                            );
                                                        } else {
                                                            setCalendarViewMonth(
                                                                (m) => m - 1
                                                            );
                                                        }
                                                    }}
                                                    className={
                                                        styles.calendarNavBtn
                                                    }
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>
                                                <span
                                                    className={
                                                        styles.calendarMonthTitle
                                                    }
                                                >
                                                    {monthTitleText}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (
                                                            calendarViewMonth ===
                                                            11
                                                        ) {
                                                            setCalendarViewMonth(
                                                                0
                                                            );
                                                            setCalendarViewYear(
                                                                (y) => y + 1
                                                            );
                                                        } else {
                                                            setCalendarViewMonth(
                                                                (m) => m + 1
                                                            );
                                                        }
                                                    }}
                                                    className={
                                                        styles.calendarNavBtn
                                                    }
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>

                                            <div
                                                className={
                                                    styles.calendarWeekdaysGrid
                                                }
                                            >
                                                {[
                                                    "T2",
                                                    "T3",
                                                    "T4",
                                                    "T5",
                                                    "T6",
                                                    "T7",
                                                    "CN",
                                                ].map((wd) => (
                                                    <span key={wd}>{wd}</span>
                                                ))}
                                            </div>

                                            <div
                                                className={
                                                    styles.calendarDaysGrid
                                                }
                                            >
                                                {calendarGridCells.map(
                                                    (cell) => (
                                                        <button
                                                            key={cell.ymd}
                                                            type="button"
                                                            onClick={() => {
                                                                setCreateDeadline(
                                                                    cell.ymd
                                                                );
                                                                setOpenDropdown(
                                                                    null
                                                                );
                                                            }}
                                                            className={`${
                                                                styles.calendarDayBtn
                                                            } ${
                                                                !cell.isCurrentMonth
                                                                    ? styles.calendarDayMuted
                                                                    : ""
                                                            } ${
                                                                cell.ymd ===
                                                                createDeadline
                                                                    ? styles.calendarDaySelected
                                                                    : ""
                                                            }`}
                                                        >
                                                            {cell.dayNum}
                                                        </button>
                                                    )
                                                )}
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginTop: "0.75rem",
                                                    paddingTop: "0.55rem",
                                                    borderTop:
                                                        "1px solid rgba(255,255,255,0.08)",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCreateDeadline(
                                                            todayYmd
                                                        );
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={
                                                        styles.secondaryGoldBtn
                                                    }
                                                    style={{
                                                        padding:
                                                            "0.32rem 0.65rem",
                                                        fontSize: "0.7rem",
                                                    }}
                                                >
                                                    <span>
                                                        {lang === "en"
                                                            ? "Today"
                                                            : "Hôm nay"}
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenDropdown(null)
                                                    }
                                                    className={
                                                        styles.primaryGoldBtn
                                                    }
                                                    style={{
                                                        padding:
                                                            "0.32rem 0.8rem",
                                                        fontSize: "0.7rem",
                                                    }}
                                                >
                                                    <span>
                                                        {lang === "en"
                                                            ? "Done"
                                                            : "Xong"}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                style={{ marginBottom: "0.95rem" }}
                                onClick={(e) => e.stopPropagation()}
                            >
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
                                <div className={styles.customDropdownWrap}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "CREATE_TECH"
                                                    ? null
                                                    : "CREATE_TECH"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{
                                            width: "100%",
                                            padding: "0.65rem 0.9rem",
                                        }}
                                    >
                                        <span>{createTechnician}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "CREATE_TECH" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ width: "100%" }}
                                        >
                                            {AVAILABLE_TECHNICIANS.map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => {
                                                        setCreateTechnician(t);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        createTechnician === t
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{t}</span>
                                                    {createTechnician === t && (
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
                                        color: "#CBD5E1",
                                        marginBottom: "0.35rem",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Dispatch Reason & Field Instructions *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    value={createReason}
                                    onChange={(e) =>
                                        setCreateReason(e.target.value)
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
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <Plus size={14} />
                                    <span>Confirm Task Dispatch</span>
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