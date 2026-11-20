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
    PackageCheck,
    History,
    UserCheck,
    X,
    Play,
    ShieldAlert,
    Edit3,
    Globe,
    Cpu,
    ArrowUpRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";
import LuxurySelect from "@/components/ui/LuxurySelect";

type RefillTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
type RefillActionType = "REFILL" | "REPLACE";
type TaskPriority = "URGENT" | "HIGH" | "NORMAL";
type DrawerTabType = "overview" | "process" | "inventory_test" | "history";
type QuickDatePreset = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "CUSTOM";

interface ProcessStepItem {
    stepNumber: number;
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
    processSteps: ProcessStepItem[];
    history: TaskHistoryEntry[];
}

const AVAILABLE_STAFF = [
    "Lê Minh Khôi (IS)",
    "Nguyễn Hoàng Nam (TE)",
    "Phạm Bảo Ngọc (IS)",
    "Đặng Quốc Bảo (TE)",
];

const WAREHOUSE_OPTIONS = [
    { brand: "Chanel", product: "Bleu de Chanel", kiosk: "KIOSK-SGN-01", loc: "Saigon Centre", slot: "Slot 03", slotNum: 3, currentMl: 12.5, capacityMl: 100, warehouseBottles: 5, batch: "BATCH-2026-C01", wh: "WH-SGN-CENTRAL" },
    { brand: "Creed", product: "Creed Aventus", kiosk: "demo-device", loc: "Diamond Plaza Atrium", slot: "Slot 01", slotNum: 1, currentMl: 11.5, capacityMl: 100, warehouseBottles: 3, batch: "BATCH-2026-CR1", wh: "WH-SGN-CENTRAL" },
    { brand: "Maison Francis Kurkdjian", product: "MFK Baccarat Rouge 540", kiosk: "demo-device", loc: "Diamond Plaza Atrium", slot: "Slot 04", slotNum: 4, currentMl: 9.0, capacityMl: 70, warehouseBottles: 5, batch: "BATCH-2026-FK1", wh: "WH-SGN-CENTRAL" },
    { brand: "Tom Ford", product: "Tom Ford Black Orchid", kiosk: "KIOSK-004", loc: "Aeon Mall Tân Phú", slot: "Slot 01", slotNum: 1, currentMl: 0.0, capacityMl: 100, warehouseBottles: 4, batch: "BATCH-2026-TF1", wh: "WH-SGN-CENTRAL" },
    { brand: "Roja Parfums", product: "Roja Parfums Elysium", kiosk: "KIOSK-SGN-03", loc: "Crescent Mall", slot: "Slot 03", slotNum: 3, currentMl: 11.0, capacityMl: 100, warehouseBottles: 0, batch: "OUT-OF-STOCK", wh: "WH-SGN-CENTRAL" },
    { brand: "Yves Saint Laurent", product: "YSL Libre Eau de Parfum", kiosk: "KIOSK-SGN-01", loc: "Saigon Centre", slot: "Slot 04", slotNum: 4, currentMl: 14.0, capacityMl: 90, warehouseBottles: 3, batch: "BATCH-2026-YS1", wh: "WH-SGN-CENTRAL" },
];

const STEP_LABELS: Record<number, { vi: string; en: string }> = {
    1: { vi: "Mở tủ máy & kích hoạt khóa an toàn (tạm ngưng đơn khách)", en: "Open cabinet & engage safety interlock (pause customer orders)" },
    2: { vi: "Tháo chai cũ & quét mã trả kho", en: "Detach depleted bottle & scan return barcode" },
    3: { vi: "Quét mã chai mới, kiểm tra đúng SKU & lắp vào khoang", en: "Scan new sealed bottle, verify SKU match & install" },
    4: { vi: "Hiệu chuẩn cảm biến cân nặng & đóng cửa tủ", en: "Calibrate load-cell sensor & close cabinet door" },
};

const buildSteps = (allDone = false): ProcessStepItem[] => [
    { stepNumber: 1, completed: allDone },
    { stepNumber: 2, completed: allDone },
    { stepNumber: 3, completed: allDone },
    { stepNumber: 4, completed: allDone },
];

const INITIAL_REFILL_TASKS: RefillTaskRecord[] = [
    {
        id: "RFL-2026-101", kioskCode: "KIOSK-SGN-01", location: "Saigon Centre", slotLabel: "Slot 03", slotNumber: 3, brand: "Chanel", productName: "Bleu de Chanel", bottleCapacityMl: 100, currentLevelMl: 12.5, thresholdMl: 15, actionType: "REPLACE", status: "IN_PROGRESS", priority: "URGENT", scheduledDate: "2026-11-20", technician: "Lê Minh Khôi (IS)", description: "Slot 03 < 15% (12.5ml). Replace 100ml bottle from WH-SGN-CENTRAL.", warehouseSource: "WH-SGN-CENTRAL", batchNumber: "BATCH-2026-C01", oldBottleCode: "BTL-2026-0103", newBottleCode: "BTL-2026-0903", issuedVolumeMl: 100, actualVolumeUsedMl: 100, inventoryConfirmed: true, testSprayStatus: "NOT_TESTED",
        processSteps: [
            { stepNumber: 1, completed: true, recordedValue: "08:40" },
            { stepNumber: 2, completed: true, recordedValue: "BTL-2026-0103" },
            { stepNumber: 3, completed: true, recordedValue: "BTL-2026-0903" },
            { stepNumber: 4, completed: false },
        ],
        history: [
            { id: "TH-01", timestamp: "2026-11-20 08:35:45", actor: "Level Monitor", action: "TASK_CREATED", detail: "Slot 03 dropped to 12.5ml." },
            { id: "TH-02", timestamp: "2026-11-20 08:42:05", actor: "Lê Minh Khôi (IS)", action: "IN_PROGRESS", detail: "Started replacement at Saigon Centre." },
        ],
    },
    {
        id: "RFL-2026-102", kioskCode: "demo-device", location: "Diamond Plaza Atrium", slotLabel: "Slot 04", slotNumber: 4, brand: "Maison Francis Kurkdjian", productName: "MFK Baccarat Rouge 540", bottleCapacityMl: 70, currentLevelMl: 9.0, thresholdMl: 15, actionType: "REPLACE", status: "PENDING", priority: "HIGH", scheduledDate: "2026-11-20", technician: "Phạm Bảo Ngọc (IS)", description: "Replace 70ml MFK Baccarat Rouge 540 in Slot 04.", warehouseSource: "WH-SGN-CENTRAL", batchNumber: "BATCH-2026-FK1", oldBottleCode: "BTL-2026-0119", newBottleCode: "BTL-2026-0919", issuedVolumeMl: 70, actualVolumeUsedMl: 70, inventoryConfirmed: false, testSprayStatus: "NOT_TESTED",
        processSteps: buildSteps(false),
        history: [{ id: "TH-11", timestamp: "2026-11-20 07:20:00", actor: "Operations Manager", action: "TASK_CREATED", detail: "Scheduled replacement for Slot 04." }],
    },
    {
        id: "RFL-2026-103", kioskCode: "KIOSK-004", location: "Aeon Mall Tân Phú", slotLabel: "Slot 01", slotNumber: 1, brand: "Tom Ford", productName: "Tom Ford Black Orchid", bottleCapacityMl: 100, currentLevelMl: 0.0, thresholdMl: 15, actionType: "REPLACE", status: "OVERDUE", priority: "URGENT", scheduledDate: "2026-11-18", technician: "Lê Minh Khôi (IS)", description: "Slot 01 empty (0.0ml). Overdue pending network recovery.", warehouseSource: "WH-SGN-CENTRAL", batchNumber: "BATCH-2026-TF1", oldBottleCode: "BTL-2026-0128", newBottleCode: "BTL-2026-0928", issuedVolumeMl: 100, actualVolumeUsedMl: 100, inventoryConfirmed: false, testSprayStatus: "NOT_TESTED",
        processSteps: buildSteps(false),
        history: [{ id: "TH-21", timestamp: "2026-11-17 09:00:00", actor: "Alert Engine", action: "TASK_CREATED", detail: "Slot 01 reached 0.0ml." }],
    },
    {
        id: "RFL-2026-104", kioskCode: "demo-device", location: "Diamond Plaza Atrium", slotLabel: "Slot 01", slotNumber: 1, brand: "Creed", productName: "Creed Aventus", bottleCapacityMl: 100, currentLevelMl: 11.5, thresholdMl: 15, actionType: "REFILL", status: "PENDING", priority: "HIGH", scheduledDate: "2026-11-19", technician: "Lê Minh Khôi (IS)", description: "Preventive refill before weekend traffic.", warehouseSource: "WH-SGN-CENTRAL", batchNumber: "BATCH-2026-CR1", oldBottleCode: "BTL-2026-0109", newBottleCode: "BTL-2026-0909", issuedVolumeMl: 100, actualVolumeUsedMl: 100, inventoryConfirmed: false, testSprayStatus: "NOT_TESTED",
        processSteps: buildSteps(false),
        history: [{ id: "TH-31", timestamp: "2026-11-18 14:32:00", actor: "Operations Manager", action: "TASK_CREATED", detail: "Created preventive refill task." }],
    },
    {
        id: "RFL-2026-105", kioskCode: "KIOSK-SGN-01", location: "Saigon Centre", slotLabel: "Slot 04", slotNumber: 4, brand: "Yves Saint Laurent", productName: "YSL Libre Eau de Parfum", bottleCapacityMl: 90, currentLevelMl: 14.0, thresholdMl: 15, actionType: "REPLACE", status: "PENDING", priority: "HIGH", scheduledDate: "2026-11-19", technician: "Phạm Bảo Ngọc (IS)", description: "YSL Libre reached 14.0ml / 90ml (15%).", warehouseSource: "WH-SGN-CENTRAL", batchNumber: "BATCH-2026-YS1", oldBottleCode: "BTL-2026-0133", newBottleCode: "BTL-2026-0933", issuedVolumeMl: 90, actualVolumeUsedMl: 90, inventoryConfirmed: false, testSprayStatus: "NOT_TESTED",
        processSteps: buildSteps(false),
        history: [{ id: "TH-51", timestamp: "2026-11-18 10:15:00", actor: "Level Monitor", action: "TASK_CREATED", detail: "Auto-scheduled replacement." }],
    },
    {
        id: "RFL-2026-106", kioskCode: "KIOSK-SGN-03", location: "Crescent Mall", slotLabel: "Slot 03", slotNumber: 3, brand: "Roja Parfums", productName: "Roja Parfums Elysium", bottleCapacityMl: 100, currentLevelMl: 11.0, thresholdMl: 15, actionType: "REPLACE", status: "OVERDUE", priority: "URGENT", scheduledDate: "2026-11-15", technician: "Lê Minh Khôi (IS)", description: "Dropped to 11.0ml / 100ml. Awaiting batch clearance.", warehouseSource: "WH-SGN-CENTRAL", batchNumber: "BATCH-2026-RJ1", oldBottleCode: "BTL-2026-0127", newBottleCode: "BTL-2026-0927", issuedVolumeMl: 100, actualVolumeUsedMl: 100, inventoryConfirmed: false, testSprayStatus: "NOT_TESTED",
        processSteps: buildSteps(false),
        history: [{ id: "TH-61", timestamp: "2026-11-14 16:42:00", actor: "Alert Engine", action: "TASK_CREATED", detail: "Triggered high-priority refill." }],
    },
    {
        id: "RFL-2026-107", kioskCode: "KIOSK-HN-01", location: "Lotte West Lake", slotLabel: "Slot 02", slotNumber: 2, brand: "Dior", productName: "Dior Sauvage", bottleCapacityMl: 100, currentLevelMl: 100.0, thresholdMl: 15, actionType: "REPLACE", status: "COMPLETED", priority: "NORMAL", scheduledDate: "2026-11-12", technician: "Đặng Quốc Bảo (TE)", description: "Completed 100ml bottle replacement and passed spray test.", warehouseSource: "WH-HN-NORTH", batchNumber: "BATCH-2026-D01", oldBottleCode: "BTL-2026-0041", newBottleCode: "BTL-2026-0110", issuedVolumeMl: 100, actualVolumeUsedMl: 100, inventoryConfirmed: true, testSprayStatus: "PASSED",
        processSteps: buildSteps(true),
        history: [{ id: "TH-72", timestamp: "2026-11-12 16:45:22", actor: "Đặng Quốc Bảo (TE)", action: "COMPLETED", detail: "Installed BTL-2026-0110 (100ml)." }],
    },
    {
        id: "RFL-2026-108", kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside", slotLabel: "Slot 01", slotNumber: 1, brand: "Armaf", productName: "Club de Nuit Intense Man", bottleCapacityMl: 105, currentLevelMl: 105.0, thresholdMl: 15, actionType: "REFILL", status: "COMPLETED", priority: "NORMAL", scheduledDate: "2026-11-10", technician: "Nguyễn Hoàng Nam (TE)", description: "Completed 105ml replenishment and sensor calibration.", warehouseSource: "WH-DAD-CENTRAL", batchNumber: "BATCH-2026-AR1", oldBottleCode: "BTL-2026-0018", newBottleCode: "BTL-2026-0418", issuedVolumeMl: 105, actualVolumeUsedMl: 105, inventoryConfirmed: true, testSprayStatus: "PASSED",
        processSteps: buildSteps(true),
        history: [{ id: "TH-81", timestamp: "2026-11-10 14:10:00", actor: "Nguyễn Hoàng Nam (TE)", action: "COMPLETED", detail: "Replenished to 105ml (100%)." }],
    },
];

const REFILL_STORAGE_KEY = "scentstation_refill_tasks_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

function toLocalYmd(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysToYmd(ymd: string, deltaDays: number): string {
    const [y, m, d] = ymd.split("-").map(Number);
    return toLocalYmd(new Date(y, (m || 1) - 1, (d || 1) + deltaDays));
}

function formatNowTimestamp(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

const isExactMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function RefillReplacementPage(): React.ReactElement {
    const router = useRouter();
    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [tasks, setTasks] = useState<RefillTaskRecord[]>(INITIAL_REFILL_TASKS);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [brandFilter, setBrandFilter] = useState<string>("ALL");
    const [locationFilter, setLocationFilter] = useState<string>("ALL");
    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState<DrawerTabType>("overview");
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [newComment, setNewComment] = useState<string>("");

    const [newAssignee, setNewAssignee] = useState<string>(AVAILABLE_STAFF[0]);
    const [newDeadline, setNewDeadline] = useState<string>(todayYmd);
    const [handoverNote, setHandoverNote] = useState<string>("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [selectedCatalogIdx, setSelectedCatalogIdx] = useState<number>(0);
    const [createActionType, setCreateActionType] = useState<RefillActionType>("REPLACE");
    const [createPriority, setCreatePriority] = useState<TaskPriority>("HIGH");
    const [createDeadline, setCreateDeadline] = useState<string>(todayYmd);
    const [createTechnician, setCreateTechnician] = useState<string>(AVAILABLE_STAFF[0]);
    const [createReason, setCreateReason] = useState<string>("");

    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canDispatchTask = currentRole === "OM";
    const canExecuteRefill = currentRole === "IS";
    const canRunDiagnosticTest = currentRole === "TE" || currentRole === "IS";

    const selectedTask = useMemo(() => tasks.find((t) => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

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

    const formatStatus = (st: RefillTaskStatus) => {
        if (lang === "en") return st === "IN_PROGRESS" ? "In Progress" : st === "PENDING" ? "Pending" : st === "COMPLETED" ? "Completed" : "Overdue";
        return st === "IN_PROGRESS" ? "Đang thực hiện" : st === "PENDING" ? "Chờ xử lý" : st === "COMPLETED" ? "Hoàn tất" : "Quá hạn";
    };

    const formatActionType = (type: RefillActionType) => {
        if (lang === "en") return type === "REPLACE" ? "Replace" : "Refill";
        return type === "REPLACE" ? "Thay chai" : "Nạp thêm";
    };

    const formatPriority = (p: TaskPriority) => {
        if (lang === "en") return p === "URGENT" ? "Urgent" : p === "HIGH" ? "High" : "Normal";
        return p === "URGENT" ? "Khẩn cấp" : p === "HIGH" ? "Cao" : "Bình thường";
    };

    const formatTestStatus = (st: "NOT_TESTED" | "PASSED" | "FAILED") => {
        if (lang === "en") return st === "PASSED" ? "Passed" : st === "FAILED" ? "Failed" : "Not Tested";
        return st === "PASSED" ? "Đạt" : st === "FAILED" ? "Không đạt" : "Chưa kiểm tra";
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
            const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (dow === 0 ? -6 : 1 - dow));
            const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
            setStartDate(toLocalYmd(mon));
            setEndDate(toLocalYmd(sun));
        } else if (preset === "THIS_MONTH") {
            setStartDate(toLocalYmd(new Date(now.getFullYear(), now.getMonth(), 1)));
            setEndDate(toLocalYmd(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
        } else if (preset === "LAST_30_DAYS") {
            setStartDate(addDaysToYmd(todayStr, -29));
            setEndDate(todayStr);
        }
    }, []);

    const loadTasks = useCallback(() => {
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
                    setLockedBrandScope(scope);
                    setBrandFilter(scope);
                } else {
                    setLockedBrandScope(null);
                }
            }

            const rawSaved = localStorage.getItem(REFILL_STORAGE_KEY);
            if (rawSaved) {
                const parsed = JSON.parse(rawSaved);
                if (Array.isArray(parsed) && parsed.length > 0) setTasks(parsed);
            }
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadTasks();
        const handleSync = () => loadTasks();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadTasks]);

    const persistTasks = useCallback(
        (nextTasks: RefillTaskRecord[], completedTask?: RefillTaskRecord) => {
            setTasks(nextTasks);
            try {
                localStorage.setItem(REFILL_STORAGE_KEY, JSON.stringify(nextTasks));
                if (completedTask) {
                    const kKey = completedTask.kioskCode.toLowerCase();
                    const pKey = completedTask.productName.trim().toLowerCase();
                    const restoredMl = completedTask.actualVolumeUsedMl;

                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    perKioskMatrix[kKey][pKey] = restoredMl;
                    localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                    const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                    if (rawMachines) {
                        const parsedFleet = JSON.parse(rawMachines);
                        if (Array.isArray(parsedFleet)) {
                            const updated = parsedFleet.map((m: any) =>
                                String(m.code || m.id || "").toLowerCase() === kKey
                                    ? {
                                        ...m,
                                        slots: Array.isArray(m.slots)
                                            ? m.slots.map((sl: any) =>
                                                isExactMatch(sl.fragranceName || "", completedTask.productName)
                                                    ? { ...sl, remainingMl: restoredMl }
                                                    : sl
                                            )
                                            : m.slots,
                                    }
                                    : m
                            );
                            localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updated));
                        }
                    }

                    const rawMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movs = rawMov ? JSON.parse(rawMov) : [];
                    movs.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: completedTask.id,
                        kioskCode: completedTask.kioskCode,
                        slotNumber: completedTask.slotNumber,
                        brand: completedTask.brand,
                        productName: completedTask.productName,
                        movementType: "INSTALL",
                        deltaMl: restoredMl,
                        timestamp: new Date().toISOString(),
                    });
                    localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(movs.slice(0, 300)));

                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const audits = rawAudit ? JSON.parse(rawAudit) : [];
                    audits.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: new Date().toISOString(),
                        actor: currentActorLabel,
                        role: currentRole,
                        tenant: completedTask.brand,
                        action: "REFILL_TASK_COMPLETED",
                        entityType: "REFILL",
                        entityId: completedTask.id,
                        severity: "INFO",
                        sourceIp: "127.0.0.1",
                    });
                    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(audits.slice(0, 250)));
                }
                window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        [currentActorLabel, currentRole]
    );

    const handleCreateTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canDispatchTask) return;
        const chosen = WAREHOUSE_OPTIONS[selectedCatalogIdx];
        const newId = `RFL-2026-${Math.floor(110 + Math.random() * 880)}`;
        const newTask: RefillTaskRecord = {
            id: newId,
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
            status: createDeadline < todayYmd ? "OVERDUE" : "PENDING",
            priority: createPriority,
            scheduledDate: createDeadline,
            technician: createTechnician,
            description: createReason || `${formatActionType(createActionType)} — ${chosen.product}`,
            warehouseSource: chosen.wh,
            batchNumber: chosen.batch,
            oldBottleCode: `BTL-OLD-0${chosen.slotNum}`,
            newBottleCode: `BTL-NEW-${Math.floor(100 + Math.random() * 899)}`,
            issuedVolumeMl: chosen.capacityMl,
            actualVolumeUsedMl: chosen.capacityMl,
            inventoryConfirmed: false,
            testSprayStatus: "NOT_TESTED",
            processSteps: buildSteps(false),
            history: [{ id: `TH-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, action: "TASK_CREATED", detail: `${lang === "en" ? "Assigned to" : "Phân công cho"} ${createTechnician}` }],
        };
        persistTasks([newTask, ...tasks]);
        setIsCreateModalOpen(false);
        showToast(lang === "en" ? `Created task ${newId}.` : `Đã tạo phiếu ${newId}.`);
    };

    const handleUpdateAssignment = () => {
        if (!selectedTask || !canDispatchTask) return;
        const updated: RefillTaskRecord = {
            ...selectedTask,
            technician: newAssignee,
            scheduledDate: newDeadline,
            history: [
                {
                    id: `TH-${Date.now()}`,
                    timestamp: formatNowTimestamp(),
                    actor: currentActorLabel,
                    action: "REASSIGNED",
                    detail: `${newAssignee} (${newDeadline})${handoverNote ? ` — ${handoverNote}` : ""}`,
                },
                ...selectedTask.history,
            ],
        };
        persistTasks(tasks.map((t) => (t.id === selectedTask.id ? updated : t)));
        setHandoverNote("");
        showToast(lang === "en" ? `Updated assignment for ${selectedTask.id}.` : `Đã cập nhật phân công cho ${selectedTask.id}.`);
    };

    const handleToggleProcessStep = (stepNumber: number) => {
        if (!selectedTask || !canExecuteRefill || selectedTask.status === "COMPLETED") return;
        const prevStep = selectedTask.processSteps.find((s) => s.stepNumber === stepNumber - 1);
        if (prevStep && !prevStep.completed) {
            showToast(lang === "en" ? `Complete Step 0${stepNumber - 1} first.` : `Vui lòng hoàn thành Bước 0${stepNumber - 1} trước.`);
            return;
        }
        const updatedSteps = selectedTask.processSteps.map((s) =>
            s.stepNumber === stepNumber ? { ...s, completed: !s.completed, recordedValue: !s.completed ? formatNowTimestamp().slice(11) : undefined } : s
        );
        const updated: RefillTaskRecord = {
            ...selectedTask,
            status: selectedTask.status === "PENDING" || selectedTask.status === "OVERDUE" ? "IN_PROGRESS" : selectedTask.status,
            processSteps: updatedSteps,
        };
        persistTasks(tasks.map((t) => (t.id === selectedTask.id ? updated : t)));
    };

    const handleConfirmInventory = () => {
        if (!selectedTask || !canExecuteRefill) return;
        const updated: RefillTaskRecord = {
            ...selectedTask,
            inventoryConfirmed: true,
            history: [{ id: `TH-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, action: "INVENTORY_CONFIRMED", detail: `${selectedTask.newBottleCode} (${selectedTask.actualVolumeUsedMl}ml)` }, ...selectedTask.history],
        };
        persistTasks(tasks.map((t) => (t.id === selectedTask.id ? updated : t)));
        showToast(lang === "en" ? "Batch & bottle confirmed." : "Đã xác nhận mã lô và chai mới.");
    };

    const handleCompleteTask = () => {
        if (!selectedTask || !canExecuteRefill) return;
        if (!selectedTask.processSteps.every((s) => s.completed)) {
            showToast(lang === "en" ? "All 4 steps must be verified first." : "Cần xác nhận đủ 4 bước trước khi hoàn tất.");
            return;
        }
        if (!selectedTask.inventoryConfirmed) {
            showToast(lang === "en" ? "Confirm batch & bottle usage first." : "Cần xác nhận mã lô và thể tích trước.");
            return;
        }
        if (selectedTask.testSprayStatus !== "PASSED") {
            showToast(lang === "en" ? "Post-refill test spray must PASS first." : "Kiểm tra phun sau nạp phải ĐẠT trước khi hoàn tất.");
            return;
        }
        const updated: RefillTaskRecord = {
            ...selectedTask,
            status: "COMPLETED",
            currentLevelMl: selectedTask.actualVolumeUsedMl,
            history: [{ id: `TH-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, action: "COMPLETED", detail: `${lang === "en" ? "Restored to" : "Đã khôi phục"} ${selectedTask.actualVolumeUsedMl}ml.` }, ...selectedTask.history],
        };
        persistTasks(tasks.map((t) => (t.id === selectedTask.id ? updated : t)), updated);
        showToast(lang === "en" ? `Task ${selectedTask.id} completed.` : `Đã hoàn tất phiếu ${selectedTask.id}.`);
    };

    const uniqueBrands = useMemo(() => Array.from(new Set(tasks.map((t) => t.brand))).sort(), [tasks]);
    const uniqueLocations = useMemo(() => Array.from(new Set(tasks.map((t) => t.location))).sort(), [tasks]);
    const effectiveBrand = lockedBrandScope || brandFilter;

    const filteredTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tasks.filter((t) => {
            const matchDate = t.scheduledDate >= startDate && t.scheduledDate <= endDate;
            const matchSearch = !q || t.id.toLowerCase().includes(q) || t.kioskCode.toLowerCase().includes(q) || t.productName.toLowerCase().includes(q) || t.brand.toLowerCase().includes(q) || t.technician.toLowerCase().includes(q);
            const matchBrand = effectiveBrand === "ALL" || isExactMatch(t.brand, effectiveBrand);
            const matchLoc = locationFilter === "ALL" || t.location === locationFilter;
            const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
            return matchDate && matchSearch && matchBrand && matchLoc && matchStatus;
        });
    }, [tasks, startDate, endDate, searchQuery, effectiveBrand, locationFilter, statusFilter]);

    const overviewCounts = useMemo(() => ({
        ALL: tasks.length,
        PENDING: tasks.filter((t) => t.status === "PENDING").length,
        IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        COMPLETED: tasks.filter((t) => t.status === "COMPLETED").length,
        OVERDUE: tasks.filter((t) => t.status === "OVERDUE").length,
    }), [tasks]);

    const renderStatusBadge = (st: RefillTaskStatus) => {
        const color = st === "COMPLETED" ? "#34D399" : st === "IN_PROGRESS" ? "#38BDF8" : st === "PENDING" ? "#FACC15" : "#F87171";
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.22rem 0.6rem", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 700, color, border: `1px solid ${color}66`, background: `${color}22`, whiteSpace: "nowrap" }}>
                {st === "OVERDUE" && <AlertTriangle size={11} />}
                {st === "COMPLETED" && <CheckCircle2 size={11} />}
                {formatStatus(st)}
            </span>
        );
    };

    const selectedCatalogOption = WAREHOUSE_OPTIONS[selectedCatalogIdx];

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Refill & Replace" : "Nạp & Thay bình"}</h1>
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

                        {canDispatchTask && (
                            <button type="button" onClick={() => setIsCreateModalOpen(true)} className={styles.primaryGoldBtn}>
                                <Plus size={15} />
                                <span>{lang === "en" ? "Create Task" : "Tạo phiếu nạp/thay"}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 5 KPI */}
                <div className={styles.kpiGrid5}>
                    {[
                        { key: "ALL", label: lang === "en" ? "Total" : "Tổng số", val: overviewCounts.ALL, color: "#FFFFFF" },
                        { key: "PENDING", label: formatStatus("PENDING"), val: overviewCounts.PENDING, color: "#FACC15" },
                        { key: "IN_PROGRESS", label: formatStatus("IN_PROGRESS"), val: overviewCounts.IN_PROGRESS, color: "#38BDF8" },
                        { key: "COMPLETED", label: formatStatus("COMPLETED"), val: overviewCounts.COMPLETED, color: "#34D399" },
                        { key: "OVERDUE", label: formatStatus("OVERDUE"), val: overviewCounts.OVERDUE, color: "#F87171" },
                    ].map((c) => (
                        <div key={c.key} onClick={() => setStatusFilter(c.key)} className={`${styles.kpiCard} ${statusFilter === c.key ? styles.kpiCardActive : ""}`}>
                            <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{c.label}</div>
                            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: c.color, marginTop: "0.2rem" }}>{c.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BỘ LỌC */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={lang === "en" ? "Search task ID, station, product, assignee..." : "Tìm mã phiếu, trạm, sản phẩm, người phụ trách..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <button type="button" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.6rem", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}><X size={14} /></button>}
                </div>

                <div style={{ display: "inline-flex", gap: "0.25rem", background: "#0B0D14", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "9px", padding: "0.2rem" }}>
                    {(
                        [
                            { id: "TODAY", label: lang === "en" ? "Today" : "Hôm nay" },
                            { id: "THIS_WEEK", label: lang === "en" ? "Week" : "Tuần này" },
                            { id: "THIS_MONTH", label: lang === "en" ? "Month" : "Tháng này" },
                            { id: "LAST_30_DAYS", label: lang === "en" ? "30d" : "30 ngày" },
                        ] as const
                    ).map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => handleApplyDatePreset(p.id)}
                            style={{ padding: "0.34rem 0.6rem", borderRadius: "7px", border: "none", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", background: datePreset === p.id ? "#D4AF37" : "transparent", color: datePreset === p.id ? "#090A0F" : "#CBD5E1" }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {!lockedBrandScope && (
                    <LuxurySelect
                        value={brandFilter}
                        onChange={setBrandFilter}
                        minWidth="175px"
                        options={[
                            { value: "ALL", label: lang === "en" ? "All Brands" : "Tất cả thương hiệu" },
                            ...uniqueBrands.map((b) => ({ value: b, label: b })),
                        ]}
                    />
                )}

                <LuxurySelect
                    value={locationFilter}
                    onChange={setLocationFilter}
                    minWidth="175px"
                    options={[
                        { value: "ALL", label: lang === "en" ? "All Venues" : "Tất cả địa điểm" },
                        ...uniqueLocations.map((loc) => ({ value: loc, label: loc })),
                    ]}
                />

                <LuxurySelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    minWidth="160px"
                    options={[
                        { value: "ALL", label: lang === "en" ? "All Status" : "Mọi trạng thái" },
                        ...(["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"] as const).map((st) => ({
                            value: st,
                            label: formatStatus(st),
                        })),
                    ]}
                />

                {(searchQuery || (!lockedBrandScope && brandFilter !== "ALL") || locationFilter !== "ALL" || statusFilter !== "ALL") && (
                    <button type="button" onClick={() => { setSearchQuery(""); if (!lockedBrandScope) setBrandFilter("ALL"); setLocationFilter("ALL"); setStatusFilter("ALL"); handleApplyDatePreset("LAST_30_DAYS"); }} className={styles.secondaryGoldBtn}>
                        <RefreshCw size={13} />
                        <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                    </button>
                )}
            </div>

            {/* BẢNG PHIẾU */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>{lang === "en" ? "Task ID" : "Mã phiếu"}</th>
                            <th>{lang === "en" ? "Station" : "Trạm"}</th>
                            <th>{lang === "en" ? "Product" : "Sản phẩm"}</th>
                            <th>{lang === "en" ? "Level" : "Mức tồn"}</th>
                            <th>{lang === "en" ? "Type" : "Loại"}</th>
                            <th>{lang === "en" ? "Priority" : "Ưu tiên"}</th>
                            <th>{lang === "en" ? "Status" : "Trạng thái"}</th>
                            <th>{lang === "en" ? "Schedule" : "Hạn xử lý"}</th>
                            <th>{lang === "en" ? "Assignee" : "Phụ trách"}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTasks.map((task) => (
                            <tr
                                key={task.id}
                                onClick={() => {
                                    setSelectedTaskId(task.id);
                                    setNewAssignee(task.technician);
                                    setNewDeadline(task.scheduledDate);
                                    setDrawerTab("overview");
                                }}
                                className={`${styles.tableRow} ${selectedTask?.id === task.id ? styles.tableRowSelected : ""}`}
                            >
                                <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 700 }}>{task.id}</td>
                                <td className={styles.tableCell}><strong>{task.kioskCode} ({task.slotLabel})</strong><div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{task.location}</div></td>
                                <td className={styles.tableCell}><strong>{task.productName}</strong><div style={{ fontSize: "0.74rem", color: "#D4AF37" }}>{task.brand}</div></td>
                                <td className={styles.tableCell}><strong style={{ color: task.currentLevelMl <= task.thresholdMl ? "#F87171" : "#34D399" }}>{task.currentLevelMl}ml / {task.bottleCapacityMl}ml</strong></td>
                                <td className={styles.tableCell}>{formatActionType(task.actionType)}</td>
                                <td className={styles.tableCell}>{formatPriority(task.priority)}</td>
                                <td className={styles.tableCell}>{renderStatusBadge(task.status)}</td>
                                <td className={styles.tableCell}>{task.scheduledDate}</td>
                                <td className={styles.tableCell}>{task.technician}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CHI TIẾT PHIẾU */}
            {selectedTask && (
                <div className={styles.drawerOverlay} onClick={() => setSelectedTaskId(null)}>
                    <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <strong style={{ color: "#D4AF37" }}>{selectedTask.id}</strong>
                                        <span style={{ fontSize: "0.74rem", color: "#CBD5E1" }}>• {formatActionType(selectedTask.actionType)} • {formatPriority(selectedTask.priority)}</span>
                                        {renderStatusBadge(selectedTask.status)}
                                    </div>
                                    <h2 style={{ margin: "0.15rem 0 0 0", fontSize: "1.2rem" }}>{selectedTask.brand} — {selectedTask.productName}</h2>
                                    <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>{selectedTask.kioskCode} ({selectedTask.slotLabel}) • {selectedTask.scheduledDate}</div>
                                </div>
                                <div style={{ display: "flex", gap: "0.45rem" }}>
                                    {canExecuteRefill && selectedTask.status === "PENDING" && (
                                        <button type="button" onClick={() => { persistTasks(tasks.map((t) => (t.id === selectedTask.id ? { ...t, status: "IN_PROGRESS" } : t))); showToast(lang === "en" ? "Task started." : "Đã bắt đầu thực hiện."); }} className={styles.secondaryGoldBtn}>
                                            <Play size={13} color="#38BDF8" />
                                            <span>{lang === "en" ? "Start" : "Bắt đầu"}</span>
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setSelectedTaskId(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.45rem 0.6rem" }}><X size={16} /></button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerTabsBar}>
                            {[
                                { id: "overview", label: lang === "en" ? "Overview" : "Tổng quan", icon: UserCheck },
                                { id: "process", label: `${lang === "en" ? "Steps" : "Quy trình"} (${selectedTask.processSteps.filter((s) => s.completed).length}/4)`, icon: Wrench },
                                { id: "inventory_test", label: lang === "en" ? "Batch & Test" : "Lô & Kiểm tra", icon: PackageCheck },
                                { id: "history", label: `${lang === "en" ? "History" : "Lịch sử"} (${selectedTask.history.length})`, icon: History },
                            ].map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button key={t.id} type="button" onClick={() => setDrawerTab(t.id as DrawerTabType)} className={`${styles.drawerTabBtn} ${drawerTab === t.id ? styles.drawerTabBtnActive : ""}`}>
                                        <Icon size={13} />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.drawerBody}>
                            {drawerTab === "overview" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    <div className={styles.glassCard}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                            <strong style={{ color: "#D4AF37", fontSize: "0.82rem" }}>{lang === "en" ? "Instructions" : "Mô tả công việc"}</strong>
                                            <button type="button" onClick={() => router.push(`/machines/${encodeURIComponent(selectedTask.kioskCode)}`)} className={styles.secondaryGoldBtn} style={{ padding: "0.3rem 0.6rem", fontSize: "0.74rem" }}>
                                                <Cpu size={12} color="#D4AF37" />
                                                <span>{selectedTask.kioskCode}</span>
                                                <ArrowUpRight size={12} />
                                            </button>
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.86rem", color: "#E2E8F0" }}>{selectedTask.description}</p>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "Outgoing Bottle" : "Chai cũ"}</div>
                                            <strong>{selectedTask.oldBottleCode} ({selectedTask.currentLevelMl}ml)</strong>
                                        </div>
                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "Incoming Bottle & Batch" : "Chai mới & Lô"}</div>
                                            <strong style={{ color: "#34D399" }}>{selectedTask.newBottleCode} • {selectedTask.batchNumber}</strong>
                                        </div>
                                    </div>

                                    {/* PHÂN CÔNG LẠI & ĐỔI HẠN XỬ LÝ (CHỈ OM) — DÙNG LUXURYSELECT */}
                                    {canDispatchTask && selectedTask.status !== "COMPLETED" && (
                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#F5E6AD", marginBottom: "0.6rem" }}>
                                                {lang === "en" ? "Reassign Staff & Deadline" : "Phân công lại & Đổi hạn xử lý"}
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "0.65rem", marginBottom: "0.65rem" }}>
                                                <LuxurySelect
                                                    width="100%"
                                                    value={newAssignee}
                                                    onChange={setNewAssignee}
                                                    options={AVAILABLE_STAFF.map((s) => ({ value: s, label: s }))}
                                                />
                                                <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className={styles.searchInput} style={{ padding: "0.52rem 0.75rem" }} />
                                            </div>
                                            <div style={{ display: "flex", gap: "0.55rem" }}>
                                                <input
                                                    type="text"
                                                    placeholder={lang === "en" ? "Handover note..." : "Ghi chú bàn giao..."}
                                                    value={handoverNote}
                                                    onChange={(e) => setHandoverNote(e.target.value)}
                                                    className={styles.searchInput}
                                                    style={{ padding: "0.5rem 0.85rem", flex: 1 }}
                                                />
                                                <button type="button" onClick={handleUpdateAssignment} className={styles.secondaryGoldBtn}>
                                                    <Edit3 size={13} color="#D4AF37" />
                                                    <span>{lang === "en" ? "Update" : "Cập nhật"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {drawerTab === "process" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                    {selectedTask.processSteps.map((step) => (
                                        <div key={step.stepNumber} onClick={() => handleToggleProcessStep(step.stepNumber)} className={styles.glassCard} style={{ cursor: canExecuteRefill ? "pointer" : "default", borderLeft: `3px solid ${step.completed ? "#34D399" : "#D4AF37"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontSize: "0.74rem", color: "#D4AF37", fontWeight: 700 }}>{lang === "en" ? `Step 0${step.stepNumber}` : `Bước 0${step.stepNumber}`}</div>
                                                <div style={{ fontWeight: 600 }}>{STEP_LABELS[step.stepNumber][lang]}</div>
                                            </div>
                                            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: step.completed ? "#34D399" : "#94A3B8", whiteSpace: "nowrap" }}>
                                                {step.completed ? (lang === "en" ? "✓ Done" : "✓ Đạt") : (lang === "en" ? "Pending" : "Chưa làm")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {drawerTab === "inventory_test" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    <div className={styles.glassCard}>
                                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#D4AF37", marginBottom: "0.5rem" }}>{lang === "en" ? "Actual Volume Confirmation" : "Xác nhận thể tích thực tế"}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem", fontSize: "0.84rem" }}>
                                            <span>{lang === "en" ? "Issued:" : "Xuất kho:"} <strong>{selectedTask.issuedVolumeMl}ml</strong></span>
                                            <span>{lang === "en" ? "Actual:" : "Thực tế:"}</span>
                                            <input
                                                type="number"
                                                disabled={!canExecuteRefill}
                                                value={selectedTask.actualVolumeUsedMl}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, actualVolumeUsedMl: val } : t)));
                                                }}
                                                style={{ width: "75px", padding: "0.3rem 0.5rem", borderRadius: "7px", background: "#121622", border: "1px solid rgba(255,255,255,0.18)", color: "#F5E6AD" }}
                                            />
                                            <span>ml</span>
                                        </div>
                                        {canExecuteRefill && (
                                            <button type="button" onClick={handleConfirmInventory} className={styles.secondaryGoldBtn}>
                                                <PackageCheck size={14} color="#34D399" />
                                                <span>{selectedTask.inventoryConfirmed ? (lang === "en" ? "✓ Confirmed" : "✓ Đã xác nhận lô") : (lang === "en" ? "Confirm Batch" : "Xác nhận lô & chai")}</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className={styles.glassCard}>
                                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#34D399", marginBottom: "0.5rem" }}>{lang === "en" ? "Post-Refill Test Spray" : "Kiểm tra phun sau nạp"}</div>
                                        {canRunDiagnosticTest && (
                                            <div style={{ display: "flex", gap: "0.55rem", marginBottom: "0.85rem" }}>
                                                <button type="button" onClick={() => setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, testSprayStatus: "PASSED" } : t)))} className={styles.actionButton} style={{ color: selectedTask.testSprayStatus === "PASSED" ? "#34D399" : "#CBD5E1", borderColor: selectedTask.testSprayStatus === "PASSED" ? "#34D399" : undefined }}>
                                                    ✓ {lang === "en" ? "Passed" : "Đạt"}
                                                </button>
                                                <button type="button" onClick={() => setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, testSprayStatus: "FAILED" } : t)))} className={styles.actionButton} style={{ color: selectedTask.testSprayStatus === "FAILED" ? "#F87171" : "#CBD5E1", borderColor: selectedTask.testSprayStatus === "FAILED" ? "#F87171" : undefined }}>
                                                    ✕ {lang === "en" ? "Failed" : "Không đạt"}
                                                </button>
                                            </div>
                                        )}
                                        {canExecuteRefill && (
                                            <button type="button" disabled={selectedTask.status === "COMPLETED"} onClick={handleCompleteTask} className={styles.primaryGoldBtn} style={{ width: "100%" }}>
                                                <CheckCircle2 size={14} />
                                                <span>{selectedTask.status === "COMPLETED" ? (lang === "en" ? "Completed" : "Đã hoàn tất") : (lang === "en" ? "Complete Task" : "Hoàn tất & Cập nhật tồn kho")}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {drawerTab === "history" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                    {(canExecuteRefill || canDispatchTask) && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (!newComment.trim()) return;
                                                const updated = { ...selectedTask, history: [{ id: `TH-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, action: "NOTE", detail: newComment.trim() }, ...selectedTask.history] };
                                                persistTasks(tasks.map((t) => (t.id === selectedTask.id ? updated : t)));
                                                setNewComment("");
                                            }}
                                            style={{ display: "flex", gap: "0.5rem" }}
                                        >
                                            <input type="text" placeholder={lang === "en" ? "Add note..." : "Thêm ghi chú..."} value={newComment} onChange={(e) => setNewComment(e.target.value)} className={styles.searchInput} style={{ padding: "0.5rem 0.85rem", flex: 1 }} />
                                            <button type="submit" className={styles.secondaryGoldBtn}>{lang === "en" ? "Add" : "Gửi"}</button>
                                        </form>
                                    )}
                                    {selectedTask.history.map((h) => (
                                        <div key={h.id} className={styles.glassCard} style={{ borderLeft: "3px solid #D4AF37" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}><strong>{h.actor}</strong><span style={{ color: "#F5E6AD" }}>{h.timestamp}</span></div>
                                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.82rem", color: "#CBD5E1" }}>{h.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.drawerFooter}>
                            <div className={styles.footerMetricBox}><span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Slot" : "Khoang"}</span><strong>{selectedTask.slotLabel}</strong></div>
                            <div className={styles.footerMetricBox}><span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Level" : "Mức tồn"}</span><strong style={{ color: selectedTask.currentLevelMl <= selectedTask.thresholdMl ? "#F87171" : "#34D399" }}>{selectedTask.currentLevelMl}ml</strong></div>
                            <div className={styles.footerMetricBox}><span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Batch" : "Lô"}</span><strong style={{ color: "#F5E6AD" }}>{selectedTask.batchNumber}</strong></div>
                            <div className={styles.footerMetricBox}><span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Test" : "Kiểm tra"}</span><strong>{formatTestStatus(selectedTask.testSprayStatus)}</strong></div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TẠO PHIẾU (CHỈ OM) — DÙNG LUXURYSELECT */}
            {isCreateModalOpen && canDispatchTask && (
                <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
                    <div className={styles.modalContent} style={{ overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{lang === "en" ? "Create Refill / Replace Task" : "Tạo phiếu nạp / thay bình"}</h3>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>

                        {selectedCatalogOption.warehouseBottles === 0 && (
                            <div style={{ padding: "0.7rem", borderRadius: "9px", background: "rgba(248,113,113,0.14)", color: "#FCA5A5", fontSize: "0.8rem", marginBottom: "0.85rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <ShieldAlert size={16} color="#F87171" />
                                <span>{lang === "en" ? "0 bottles in warehouse reserve." : "Kho dự trữ đang hết chai sản phẩm này (0 chai)."}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateTaskSubmit}>
                            <div style={{ marginBottom: "0.85rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Station & Product" : "Trạm & Sản phẩm"}</label>
                                <LuxurySelect
                                    width="100%"
                                    value={String(selectedCatalogIdx)}
                                    onChange={(v) => setSelectedCatalogIdx(Number(v))}
                                    options={WAREHOUSE_OPTIONS.map((opt, idx) => ({
                                        value: String(idx),
                                        label: `${opt.kiosk} (${opt.slot}) — ${opt.product} [${opt.currentMl}ml | ${lang === "en" ? "WH" : "Kho"}: ${opt.warehouseBottles}]`,
                                    }))}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Type" : "Loại"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={createActionType}
                                        onChange={(v) => setCreateActionType(v as RefillActionType)}
                                        options={[
                                            { value: "REPLACE", label: formatActionType("REPLACE") },
                                            { value: "REFILL", label: formatActionType("REFILL") },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Priority" : "Ưu tiên"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={createPriority}
                                        onChange={(v) => setCreatePriority(v as TaskPriority)}
                                        options={[
                                            { value: "URGENT", label: formatPriority("URGENT") },
                                            { value: "HIGH", label: formatPriority("HIGH") },
                                            { value: "NORMAL", label: formatPriority("NORMAL") },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Date" : "Hạn xử lý"}</label>
                                    <input type="date" value={createDeadline} onChange={(e) => setCreateDeadline(e.target.value)} className={styles.searchInput} style={{ padding: "0.52rem 0.75rem" }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: "0.85rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Assignee" : "Người phụ trách"}</label>
                                <LuxurySelect
                                    width="100%"
                                    value={createTechnician}
                                    onChange={setCreateTechnician}
                                    options={AVAILABLE_STAFF.map((s) => ({ value: s, label: s }))}
                                />
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Notes" : "Ghi chú"}</label>
                                <textarea rows={2} value={createReason} onChange={(e) => setCreateReason(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem", resize: "none" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.primaryGoldBtn}>{lang === "en" ? "Create" : "Tạo phiếu"}</button>
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