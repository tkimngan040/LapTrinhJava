// noinspection SpellCheckingInspection
"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import styles from "./maintenance.module.css";
import {
    Search,
    Plus,
    RefreshCw,
    Wrench,
    CheckCircle2,
    AlertTriangle,
    ClipboardCheck,
    History,
    Paperclip,
    Play,
    X,
    ArrowUpRight,
    ShieldAlert,
    Cpu,
    Upload,
    Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";
import LuxurySelect from "@/components/ui/LuxurySelect";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "ON_HOLD" | "CANCELLED";
type IssueCategoryType =
    | "Pump Error"
    | "Door Sensor Fault"
    | "Connection Lost"
    | "Payment Device Error"
    | "Spray Nozzle Clogged"
    | "Screen Issue";
type TicketPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
type DrawerTab = "details" | "checklist" | "timeline" | "attachments";
type QuickDatePreset = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_30_DAYS";

interface ChecklistItem {
    id: string;
    mandatory: boolean;
    status: "PENDING" | "PASSED" | "FAILED";
    note: string;
}

interface TimelineActivity {
    id: string;
    timestamp: string;
    actor: string;
    eventType: string;
    detail: string;
}

interface TicketAttachment {
    id: string;
    fileName: string;
    fileType: string;
    fileSizeKb: number;
    uploadedBy: string;
    uploadedAt: string;
}

interface MaintenanceTicketRecord {
    id: string;
    kioskCode: string;
    location: string;
    brand: string;
    issueType: IssueCategoryType;
    priority: TicketPriority;
    status: TicketStatus;
    assignedTo: string;
    createdDate: string;
    dateStr: string;
    createdAtMs: number;
    completedAtMs?: number;
    deadline: string;
    description: string;
    correctiveAction: string;
    replacedComponents: string;
    diagnosticSprayExecuted: boolean;
    postMaintenanceTestPassed: boolean;
    checklist: ChecklistItem[];
    timeline: TimelineActivity[];
    attachments: TicketAttachment[];
}

interface UpcomingScheduleItem {
    id: string;
    kioskCode: string;
    location: string;
    brand: string;
    scheduledTime: string;
    maintenanceType: "Preventive" | "Inspection" | "Calibration";
    technician: string;
}

const ISSUE_CATEGORIES: IssueCategoryType[] = [
    "Pump Error",
    "Door Sensor Fault",
    "Connection Lost",
    "Payment Device Error",
    "Spray Nozzle Clogged",
    "Screen Issue",
];

const CHECKLIST_LABELS: Record<string, { vi: string; en: string }> = {
    "CHK-1": { vi: "Nguồn điện & ổn định bus 24V DC", en: "Power Supply & 24V DC Bus Stability" },
    "CHK-2": { vi: "Kết nối MQTT Broker & tín hiệu Heartbeat", en: "MQTT Broker Connectivity & Heartbeat" },
    "CHK-3": { vi: "Áp suất bơm vi lượng (chuẩn 1.50 bar)", en: "Micro-Pump Pressure (Target 1.50 bar)" },
    "CHK-4": { vi: "Độ mịn & tia phun vòi xịt", en: "Spray Nozzle Atomization Pattern" },
    "CHK-5": { vi: "Cảm biến từ khóa an toàn cửa tủ", en: "Cabinet Door Magnetic Sensor Interlock" },
};

const FLEET_MACHINES_LOOKUP = [
    { code: "KIOSK-HN-02", location: "Tràng Tiền Plaza, Hà Nội", brand: "Maison Margiela" },
    { code: "KIOSK-004", location: "Aeon Mall Tân Phú, TP.HCM", brand: "Tom Ford" },
    { code: "KIOSK-SGN-01", location: "Saigon Centre, TP.HCM", brand: "Chanel" },
    { code: "KIOSK-SGN-02", location: "Vincom Đồng Khởi, TP.HCM", brand: "Yves Saint Laurent" },
    { code: "KIOSK-SGN-03", location: "Crescent Mall, TP.HCM", brand: "Versace" },
    { code: "KIOSK-HN-01", location: "Lotte West Lake, Hà Nội", brand: "Dior" },
    { code: "KIOSK-DAD-01", location: "IndoChina Riverside, Đà Nẵng", brand: "Armaf" },
    { code: "demo-device", location: "Diamond Plaza Atrium, TP.HCM", brand: "Creed" },
];

const TECHNICIANS_LIST = [
    "Nguyễn Hoàng Nam (TE)",
    "Phạm Bảo Ngọc (TE)",
    "Lê Minh Khôi (TE)",
    "Đặng Quốc Bảo (TE)",
];

const buildChecklist = (allPassed = false): ChecklistItem[] => [
    { id: "CHK-1", mandatory: true, status: allPassed ? "PASSED" : "PENDING", note: "" },
    { id: "CHK-2", mandatory: true, status: allPassed ? "PASSED" : "PENDING", note: "" },
    { id: "CHK-3", mandatory: true, status: allPassed ? "PASSED" : "PENDING", note: "" },
    { id: "CHK-4", mandatory: true, status: allPassed ? "PASSED" : "PENDING", note: "" },
    { id: "CHK-5", mandatory: true, status: allPassed ? "PASSED" : "PENDING", note: "" },
];

const INITIAL_UPCOMING_SCHEDULES: UpcomingScheduleItem[] = [
    { id: "SCH-2026-01", kioskCode: "demo-device", location: "Diamond Plaza Atrium", brand: "Creed", scheduledTime: "2026-11-22 08:30", maintenanceType: "Preventive", technician: "Nguyễn Hoàng Nam (TE)" },
    { id: "SCH-2026-02", kioskCode: "KIOSK-SGN-02", location: "Vincom Đồng Khởi", brand: "Yves Saint Laurent", scheduledTime: "2026-11-23 09:00", maintenanceType: "Inspection", technician: "Phạm Bảo Ngọc (TE)" },
    { id: "SCH-2026-03", kioskCode: "KIOSK-HN-01", location: "Lotte West Lake", brand: "Dior", scheduledTime: "2026-11-25 08:00", maintenanceType: "Calibration", technician: "Đặng Quốc Bảo (TE)" },
];

const INITIAL_TICKETS: MaintenanceTicketRecord[] = [
    {
        id: "MNT-2026-411", kioskCode: "KIOSK-SGN-03", location: "Crescent Mall, TP.HCM", brand: "Versace", issueType: "Pump Error", priority: "HIGH", status: "OPEN", assignedTo: "Phạm Bảo Ngọc (TE)", createdDate: "2026-11-20 08:25", dateStr: "2026-11-20", createdAtMs: new Date("2026-11-20T08:25:00").getTime(), deadline: "2026-11-21", description: "Slot 04 micro-pump vibration elevated during morning check.", correctiveAction: "", replacedComponents: "", diagnosticSprayExecuted: false, postMaintenanceTestPassed: false, checklist: buildChecklist(false),
        timeline: [{ id: "TL-31", timestamp: "2026-11-20 08:25:00", actor: "Operations Manager", eventType: "TICKET_CREATED", detail: "Scheduled pump inspection for KIOSK-SGN-03." }],
        attachments: [],
    },
    {
        id: "MNT-2026-410", kioskCode: "KIOSK-004", location: "Aeon Mall Tân Phú, TP.HCM", brand: "Tom Ford", issueType: "Connection Lost", priority: "URGENT", status: "OVERDUE", assignedTo: "Phạm Bảo Ngọc (TE)", createdDate: "2026-11-18 08:53", dateStr: "2026-11-18", createdAtMs: new Date("2026-11-18T08:53:00").getTime(), deadline: "2026-11-19", description: "Primary fiber link disconnected and 5G failover SIM timed out (Alert #ALT-8901).", correctiveAction: "", replacedComponents: "5G Antenna Module", diagnosticSprayExecuted: false, postMaintenanceTestPassed: false,
        checklist: [
            { id: "CHK-1", mandatory: true, status: "PASSED", note: "24V OK" },
            { id: "CHK-2", mandatory: true, status: "FAILED", note: "SIM timeout" },
            { id: "CHK-3", mandatory: true, status: "PENDING", note: "" },
            { id: "CHK-4", mandatory: true, status: "PENDING", note: "" },
            { id: "CHK-5", mandatory: true, status: "PENDING", note: "" },
        ],
        timeline: [{ id: "TL-11", timestamp: "2026-11-18 08:53:00", actor: "MQTT Watchdog", eventType: "AUTO_CREATED", detail: "Auto-created from Alert #ALT-8901." }],
        attachments: [],
    },
    {
        id: "MNT-2026-409", kioskCode: "KIOSK-HN-02", location: "Tràng Tiền Plaza, Hà Nội", brand: "Maison Margiela", issueType: "Spray Nozzle Clogged", priority: "URGENT", status: "IN_PROGRESS", assignedTo: "Nguyễn Hoàng Nam (TE)", createdDate: "2026-11-19 11:53", dateStr: "2026-11-19", createdAtMs: new Date("2026-11-19T11:53:00").getTime(), deadline: "2026-11-21", description: "Slot 01 actuator pressure below 1.2 bar (Alert #ALT-8904).", correctiveAction: "Flushed nozzle manifold & replaced Viton O-ring seal.", replacedComponents: "Viton O-Ring #VR-02", diagnosticSprayExecuted: true, postMaintenanceTestPassed: false,
        checklist: [
            { id: "CHK-1", mandatory: true, status: "PASSED", note: "24.0V" },
            { id: "CHK-2", mandatory: true, status: "PASSED", note: "42ms" },
            { id: "CHK-3", mandatory: true, status: "PASSED", note: "1.51 bar" },
            { id: "CHK-4", mandatory: true, status: "PASSED", note: "Clean mist" },
            { id: "CHK-5", mandatory: true, status: "PENDING", note: "" },
        ],
        timeline: [{ id: "TL-1", timestamp: "2026-11-19 13:15:00", actor: "Nguyễn Hoàng Nam (TE)", eventType: "MAINTENANCE_STARTED", detail: "KIOSK-HN-02 placed in Maintenance Mode." }],
        attachments: [{ id: "ATT-1", fileName: "nozzle_pressure_hn02.png", fileType: "image/png", fileSizeKb: 420, uploadedBy: "Nguyễn Hoàng Nam", uploadedAt: "2026-11-19 13:25" }],
    },
    {
        id: "MNT-2026-408", kioskCode: "KIOSK-SGN-02", location: "Vincom Đồng Khởi, TP.HCM", brand: "Yves Saint Laurent", issueType: "Screen Issue", priority: "LOW", status: "ON_HOLD", assignedTo: "Phạm Bảo Ngọc (TE)", createdDate: "2026-11-17 16:00", dateStr: "2026-11-17", createdAtMs: new Date("2026-11-17T16:00:00").getTime(), deadline: "2026-11-22", description: "Anti-glare film scratch on bottom bezel; awaiting spare part.", correctiveAction: "Waiting for spare film delivery.", replacedComponents: "21.5\" Anti-Glare Film", diagnosticSprayExecuted: false, postMaintenanceTestPassed: false, checklist: buildChecklist(true),
        timeline: [{ id: "TL-51", timestamp: "2026-11-17 16:30:00", actor: "Phạm Bảo Ngọc (TE)", eventType: "ON_HOLD", detail: "Awaiting spare part." }],
        attachments: [],
    },
    {
        id: "MNT-2026-407", kioskCode: "KIOSK-SGN-01", location: "Saigon Centre, TP.HCM", brand: "Chanel", issueType: "Door Sensor Fault", priority: "HIGH", status: "COMPLETED", assignedTo: "Lê Minh Khôi (TE)", createdDate: "2026-11-14 10:00", dateStr: "2026-11-14", createdAtMs: new Date("2026-11-14T10:00:00").getTime(), completedAtMs: new Date("2026-11-14T12:30:00").getTime(), deadline: "2026-11-15", description: "Cabinet door reed switch reported intermittent open state.", correctiveAction: "Realigned magnetic reed switch bracket.", replacedComponents: "Reed Switch Bracket", diagnosticSprayExecuted: true, postMaintenanceTestPassed: true, checklist: buildChecklist(true),
        timeline: [{ id: "TL-22", timestamp: "2026-11-14 12:30:00", actor: "Lê Minh Khôi (TE)", eventType: "COMPLETED", detail: "Passed post-repair test; machine restored to Online." }],
        attachments: [],
    },
    {
        id: "MNT-2026-404", kioskCode: "demo-device", location: "Diamond Plaza Atrium, TP.HCM", brand: "Creed", issueType: "Spray Nozzle Clogged", priority: "LOW", status: "CANCELLED", assignedTo: "Lê Minh Khôi (TE)", createdDate: "2026-11-10 09:30", dateStr: "2026-11-10", createdAtMs: new Date("2026-11-10T09:30:00").getTime(), deadline: "2026-11-11", description: "Superseded by scheduled cartridge replacement.", correctiveAction: "", replacedComponents: "", diagnosticSprayExecuted: false, postMaintenanceTestPassed: false, checklist: buildChecklist(false),
        timeline: [{ id: "TL-71", timestamp: "2026-11-10 10:15:00", actor: "Operations Manager", eventType: "CANCELLED", detail: "Cancelled duplicate request." }],
        attachments: [],
    },
];

const MAINTENANCE_STORAGE_KEY = "scentstation_maintenance_tickets_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
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

export default function MaintenancePage(): React.ReactElement {
    const router = useRouter();
    const attachmentInputRef = useRef<HTMLInputElement | null>(null);
    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [tickets, setTickets] = useState<MaintenanceTicketRecord[]>(INITIAL_TICKETS);
    const [activeStatusTab, setActiveStatusTab] = useState<"ALL" | TicketStatus>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
    const [selectedIssueType, setSelectedIssueType] = useState<string>("ALL");
    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");

    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");
    const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<UpcomingScheduleItem | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [newTimelineComment, setNewTimelineComment] = useState<string>("");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [createMachineCode, setCreateMachineCode] = useState<string>("KIOSK-HN-02");
    const [createIssueType, setCreateIssueType] = useState<IssueCategoryType>("Spray Nozzle Clogged");
    const [createPriority, setCreatePriority] = useState<TicketPriority>("HIGH");
    const [createAssignee, setCreateAssignee] = useState<string>(TECHNICIANS_LIST[0]);
    const [createDeadline, setCreateDeadline] = useState<string>(todayYmd);
    const [createDesc, setCreateDesc] = useState<string>("");
    const [createWarning, setCreateWarning] = useState<string>("");

    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canCreateOrAssignTicket = currentRole === "OM";
    const canExecuteMaintenance = currentRole === "TE";

    const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedTicketId) || null, [tickets, selectedTicketId]);

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

    const formatStatus = (st: TicketStatus) => {
        const map: Record<TicketStatus, { en: string; vi: string }> = {
            OPEN: { en: "Open", vi: "Mới mở" },
            IN_PROGRESS: { en: "In Progress", vi: "Đang xử lý" },
            COMPLETED: { en: "Completed", vi: "Hoàn tất" },
            OVERDUE: { en: "Overdue", vi: "Quá hạn" },
            ON_HOLD: { en: "On Hold", vi: "Tạm hoãn" },
            CANCELLED: { en: "Cancelled", vi: "Đã hủy" },
        };
        return map[st]?.[lang] || st;
    };

    const formatPriority = (p: TicketPriority) => {
        const map: Record<TicketPriority, { en: string; vi: string }> = {
            URGENT: { en: "Urgent", vi: "Khẩn cấp" },
            HIGH: { en: "High", vi: "Cao" },
            NORMAL: { en: "Normal", vi: "Bình thường" },
            LOW: { en: "Low", vi: "Thấp" },
        };
        return map[p]?.[lang] || p;
    };

    const formatIssueType = (cat: IssueCategoryType) => {
        const map: Record<IssueCategoryType, { en: string; vi: string }> = {
            "Pump Error": { en: "Pump Error", vi: "Lỗi bơm vi lượng" },
            "Door Sensor Fault": { en: "Door Sensor Fault", vi: "Lỗi cảm biến cửa" },
            "Connection Lost": { en: "Connection Lost", vi: "Mất kết nối mạng" },
            "Payment Device Error": { en: "Payment Device Error", vi: "Lỗi thiết bị QR" },
            "Spray Nozzle Clogged": { en: "Spray Nozzle Clogged", vi: "Nghẹt vòi phun" },
            "Screen Issue": { en: "Screen Issue", vi: "Lỗi màn hình" },
        };
        return map[cat]?.[lang] || cat;
    };

    const formatScheduleType = (tp: UpcomingScheduleItem["maintenanceType"]) => {
        if (lang === "en") return tp;
        return tp === "Preventive" ? "Định kỳ" : tp === "Inspection" ? "Kiểm tra" : "Hiệu chuẩn";
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
        } else {
            setStartDate(addDaysToYmd(todayStr, -29));
            setEndDate(todayStr);
        }
    }, []);

    const loadTickets = useCallback(() => {
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
                    setSelectedBrand(scope);
                } else {
                    setLockedBrandScope(null);
                }
            }

            const rawSaved = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
            if (rawSaved) {
                const parsed = JSON.parse(rawSaved);
                if (Array.isArray(parsed) && parsed.length > 0) setTickets(parsed);
            }
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadTickets();
        const handleSync = () => loadTickets();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadTickets]);

    const persistTickets = useCallback(
        (nextTickets: MaintenanceTicketRecord[], affectedTicket?: MaintenanceTicketRecord, machineTargetStatus?: "MAINTENANCE" | "ONLINE") => {
            setTickets(nextTickets);
            try {
                localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(nextTickets));
                if (affectedTicket && machineTargetStatus) {
                    const kKey = affectedTicket.kioskCode.toLowerCase();
                    const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                    if (rawMachines) {
                        const parsedFleet = JSON.parse(rawMachines);
                        if (Array.isArray(parsedFleet)) {
                            const updatedFleet = parsedFleet.map((m: any) =>
                                String(m.code || m.id || "").toLowerCase() === kKey
                                    ? { ...m, status: machineTargetStatus, operatingStatus: machineTargetStatus === "ONLINE" ? "ACTIVE" : "MAINTENANCE" }
                                    : m
                            );
                            localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
                        }
                    }

                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const audits = rawAudit ? JSON.parse(rawAudit) : [];
                    audits.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: new Date().toISOString(),
                        actor: currentActorLabel,
                        role: currentRole,
                        tenant: affectedTicket.brand,
                        action: machineTargetStatus === "ONLINE" ? "MAINTENANCE_COMPLETED_ONLINE" : "MAINTENANCE_STARTED",
                        entityType: "MAINTENANCE",
                        entityId: affectedTicket.id,
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

    const handleCreateTicketSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCreateOrAssignTicket) return;
        setCreateWarning("");

        const dup = tickets.find(
            (t) => isExactMatch(t.kioskCode, createMachineCode) && t.issueType === createIssueType && t.status !== "COMPLETED" && t.status !== "CANCELLED"
        );
        if (dup) {
            setCreateWarning(
                lang === "en"
                    ? `Duplicate prevented: Ticket #${dup.id} (${formatStatus(dup.status)}) already exists for this issue.`
                    : `Tránh tạo trùng: Đã có phiếu #${dup.id} (${formatStatus(dup.status)}) đang xử lý lỗi này.`
            );
            return;
        }

        const meta = FLEET_MACHINES_LOOKUP.find((m) => m.code === createMachineCode) || FLEET_MACHINES_LOOKUP[0];
        const newId = `MNT-2026-${Math.floor(420 + Math.random() * 500)}`;
        const newTicket: MaintenanceTicketRecord = {
            id: newId,
            kioskCode: meta.code,
            location: meta.location,
            brand: meta.brand,
            issueType: createIssueType,
            priority: createPriority,
            status: "OPEN",
            assignedTo: createAssignee,
            createdDate: formatNowTimestamp().slice(0, 16),
            dateStr: todayYmd,
            createdAtMs: Date.now(),
            deadline: createDeadline,
            description: createDesc || `${formatIssueType(createIssueType)} — ${meta.code}`,
            correctiveAction: "",
            replacedComponents: "",
            diagnosticSprayExecuted: false,
            postMaintenanceTestPassed: false,
            checklist: buildChecklist(false),
            timeline: [{ id: `TL-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, eventType: "TICKET_CREATED", detail: `${createAssignee}` }],
            attachments: [],
        };
        persistTickets([newTicket, ...tickets]);
        setIsCreateModalOpen(false);
        showToast(lang === "en" ? `Created ticket #${newId}.` : `Đã tạo phiếu bảo trì #${newId}.`);
    };

    const handleStartMaintenance = (ticket: MaintenanceTicketRecord) => {
        if (!canExecuteMaintenance || ticket.status === "COMPLETED") return;
        const updated: MaintenanceTicketRecord = {
            ...ticket,
            status: "IN_PROGRESS",
            timeline: [{ id: `TL-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, eventType: "MAINTENANCE_STARTED", detail: `${ticket.kioskCode} → MAINTENANCE` }, ...ticket.timeline],
        };
        persistTickets(tickets.map((t) => (t.id === ticket.id ? updated : t)), updated, "MAINTENANCE");
        showToast(lang === "en" ? `${ticket.kioskCode} is now in Maintenance Mode.` : `Đã đưa ${ticket.kioskCode} vào chế độ Bảo trì.`);
    };

    const handleToggleChecklist = (chkId: string, nextStatus: "PASSED" | "FAILED") => {
        if (!selectedTicket || !canExecuteMaintenance || selectedTicket.status === "COMPLETED") return;
        const updatedChecklist = selectedTicket.checklist.map((item) => (item.id === chkId ? { ...item, status: nextStatus } : item));
        persistTickets(tickets.map((t) => (t.id === selectedTicket.id ? { ...t, checklist: updatedChecklist } : t)));
    };

    const handleRunPostRepairTest = () => {
        if (!selectedTicket || !canExecuteMaintenance) return;
        const allPassed = selectedTicket.checklist.filter((c) => c.mandatory).every((c) => c.status === "PASSED");
        if (!allPassed) {
            showToast(lang === "en" ? "All 5 mandatory checklist items must PASS first." : "Cần đạt đủ 5 mục kiểm tra bắt buộc trước.");
            return;
        }
        const updated: MaintenanceTicketRecord = {
            ...selectedTicket,
            diagnosticSprayExecuted: true,
            postMaintenanceTestPassed: true,
            timeline: [{ id: `TL-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, eventType: "POST_TEST_PASSED", detail: "0.12ml diagnostic spray (non-revenue) PASSED." }, ...selectedTicket.timeline],
        };
        persistTickets(tickets.map((t) => (t.id === selectedTicket.id ? updated : t)));
        showToast(lang === "en" ? "Post-repair diagnostic test PASSED." : "Kiểm tra sau sửa & xịt chẩn đoán ĐẠT.");
    };

    const handleCompleteTicket = () => {
        if (!selectedTicket || !canExecuteMaintenance) return;
        if (!selectedTicket.checklist.filter((c) => c.mandatory).every((c) => c.status === "PASSED")) {
            showToast(lang === "en" ? "Complete all 5 checklist items first." : "Cần hoàn tất 5 mục kiểm tra trước.");
            return;
        }
        if (!selectedTicket.postMaintenanceTestPassed) {
            showToast(lang === "en" ? "Run and pass the post-repair test first." : "Cần chạy và đạt kiểm tra sau sửa trước.");
            return;
        }
        if (!selectedTicket.correctiveAction.trim()) {
            showToast(lang === "en" ? "Enter corrective action summary first." : "Cần nhập nội dung biện pháp sửa chữa.");
            return;
        }
        const updated: MaintenanceTicketRecord = {
            ...selectedTicket,
            status: "COMPLETED",
            completedAtMs: Date.now(),
            timeline: [{ id: `TL-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, eventType: "COMPLETED", detail: `${selectedTicket.kioskCode} → ONLINE` }, ...selectedTicket.timeline],
        };
        persistTickets(tickets.map((t) => (t.id === selectedTicket.id ? updated : t)), updated, "ONLINE");
        showToast(lang === "en" ? `Completed ${selectedTicket.id}. Station restored Online.` : `Đã đóng phiếu ${selectedTicket.id} và bật lại máy.`);
    };

    const handleUploadAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTicket || !canExecuteMaintenance) return;
        const newAtt: TicketAttachment = {
            id: `ATT-${Date.now()}`,
            fileName: file.name,
            fileType: file.type,
            fileSizeKb: Math.max(10, Math.round(file.size / 1024)),
            uploadedBy: currentActorLabel,
            uploadedAt: formatNowTimestamp().slice(0, 16),
        };
        const updated: MaintenanceTicketRecord = {
            ...selectedTicket,
            attachments: [newAtt, ...selectedTicket.attachments],
        };
        persistTickets(tickets.map((t) => (t.id === selectedTicket.id ? updated : t)));
        showToast(lang === "en" ? `Uploaded ${file.name}.` : `Đã đính kèm tệp ${file.name}.`);
    };

    const uniqueBrands = useMemo(() => Array.from(new Set(tickets.map((t) => t.brand))).sort(), [tickets]);
    const effectiveBrand = lockedBrandScope || selectedBrand;

    const dateFilteredTickets = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tickets.filter((t) => {
            const matchDate = t.dateStr >= startDate && t.dateStr <= endDate;
            const matchBrand = effectiveBrand === "ALL" || isExactMatch(t.brand, effectiveBrand);
            const matchPriority = selectedPriority === "ALL" || t.priority === selectedPriority;
            const matchIssue = selectedIssueType === "ALL" || t.issueType === selectedIssueType;
            const matchSearch = !q || t.id.toLowerCase().includes(q) || t.kioskCode.toLowerCase().includes(q) || t.assignedTo.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
            return matchDate && matchBrand && matchPriority && matchIssue && matchSearch;
        });
    }, [tickets, startDate, endDate, effectiveBrand, selectedPriority, selectedIssueType, searchQuery]);

    const filteredTickets = useMemo(
        () => dateFilteredTickets.filter((t) => activeStatusTab === "ALL" || t.status === activeStatusTab),
        [dateFilteredTickets, activeStatusTab]
    );

    const summaryMetrics = useMemo(() => {
        const completed = dateFilteredTickets.filter((t) => t.status === "COMPLETED" && t.completedAtMs);
        const avgHrs = completed.length > 0 ? (completed.reduce((s, t) => s + Math.max(0.5, (t.completedAtMs! - t.createdAtMs) / 3600000), 0) / completed.length).toFixed(1) : "2.1";
        return {
            total: dateFilteredTickets.length,
            open: dateFilteredTickets.filter((t) => t.status === "OPEN").length,
            inProgress: dateFilteredTickets.filter((t) => t.status === "IN_PROGRESS").length,
            completed: dateFilteredTickets.filter((t) => t.status === "COMPLETED").length,
            overdue: dateFilteredTickets.filter((t) => t.status === "OVERDUE").length,
            onHold: dateFilteredTickets.filter((t) => t.status === "ON_HOLD").length,
            cancelled: dateFilteredTickets.filter((t) => t.status === "CANCELLED").length,
            avgHrs,
        };
    }, [dateFilteredTickets]);

    const renderStatusBadge = (st: TicketStatus) => {
        const color = st === "COMPLETED" ? "#34D399" : st === "IN_PROGRESS" ? "#38BDF8" : st === "OPEN" ? "#FACC15" : st === "OVERDUE" ? "#F87171" : st === "ON_HOLD" ? "#C084FC" : "#94A3B8";
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.22rem 0.6rem", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 700, color, border: `1px solid ${color}66`, background: `${color}22`, whiteSpace: "nowrap" }}>
                {st === "OVERDUE" && <AlertTriangle size={11} />}
                {st === "COMPLETED" && <CheckCircle2 size={11} />}
                {formatStatus(st)}
            </span>
        );
    };

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <input type="file" ref={attachmentInputRef} onChange={handleUploadAttachment} accept="image/png,image/jpeg,image/webp,application/pdf" style={{ display: "none" }} />

            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Maintenance" : "Bảo trì & Sự cố kỹ thuật"}</h1>
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

                        {canCreateOrAssignTicket && (
                            <button type="button" onClick={() => { setCreateWarning(""); setIsCreateModalOpen(true); }} className={styles.primaryGoldBtn}>
                                <Plus size={15} />
                                <span>{lang === "en" ? "Create Ticket" : "Tạo phiếu bảo trì"}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 6 KPI */}
                <div className={styles.kpiGrid6}>
                    {[
                        { key: "ALL", label: lang === "en" ? "Total" : "Tổng phiếu", val: summaryMetrics.total, color: "#FFFFFF" },
                        { key: "OPEN", label: formatStatus("OPEN"), val: summaryMetrics.open, color: "#FACC15" },
                        { key: "IN_PROGRESS", label: formatStatus("IN_PROGRESS"), val: summaryMetrics.inProgress, color: "#38BDF8" },
                        { key: "COMPLETED", label: formatStatus("COMPLETED"), val: summaryMetrics.completed, color: "#34D399" },
                        { key: "AVG", label: lang === "en" ? "Avg Time" : "TB xử lý", val: `${summaryMetrics.avgHrs}h`, color: "#F5E6AD" },
                        { key: "OVERDUE", label: formatStatus("OVERDUE"), val: summaryMetrics.overdue, color: "#F87171" },
                    ].map((c) => (
                        <div key={c.key} onClick={() => { if (c.key !== "AVG") setActiveStatusTab(c.key as any); }} className={`${styles.kpiCard} ${activeStatusTab === c.key ? styles.kpiCardActive : ""}`}>
                            <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{c.label}</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color, marginTop: "0.2rem" }}>{c.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* NHÓM LỖI & LỊCH ĐỊNH KỲ */}
            <div className={styles.analyticsGrid2}>
                <div className={styles.analyticsCard}>
                    <div style={{ fontWeight: 700, marginBottom: "0.65rem" }}>{lang === "en" ? "By Issue Category" : "Theo nhóm lỗi"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                        {ISSUE_CATEGORIES.map((cat) => (
                            <div
                                key={cat}
                                onClick={() => setSelectedIssueType(selectedIssueType === cat ? "ALL" : cat)}
                                style={{ padding: "0.5rem 0.7rem", borderRadius: "8px", background: selectedIssueType === cat ? "rgba(212,175,55,0.18)" : "#0B0D14", border: selectedIssueType === cat ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", fontSize: "0.8rem", cursor: "pointer" }}
                            >
                                <span>{formatIssueType(cat)}</span>
                                <strong style={{ color: "#F5E6AD" }}>{dateFilteredTickets.filter((t) => t.issueType === cat).length}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.analyticsCard}>
                    <div style={{ fontWeight: 700, marginBottom: "0.65rem" }}>{lang === "en" ? "Upcoming Preventive Schedule" : "Lịch bảo trì định kỳ"}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                        {INITIAL_UPCOMING_SCHEDULES.map((sch) => (
                            <div key={sch.id} onClick={() => setSelectedScheduleDetail(sch)} style={{ padding: "0.52rem 0.75rem", borderRadius: "8px", background: "#0B0D14", border: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", cursor: "pointer" }}>
                                <div><strong style={{ color: "#F5E6AD" }}>{sch.kioskCode}</strong> ({formatScheduleType(sch.maintenanceType)}) — {sch.location}</div>
                                <span style={{ color: "#34D399", fontSize: "0.76rem", whiteSpace: "nowrap" }}>{sch.scheduledTime}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 7 TAB TRẠNG THÁI */}
            <div className={styles.tabsBar}>
                {(["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE", "ON_HOLD", "CANCELLED"] as const).map((st) => (
                    <button key={st} type="button" onClick={() => setActiveStatusTab(st)} className={`${styles.tabBtn} ${activeStatusTab === st ? styles.tabBtnActive : ""}`}>
                        {st === "ALL" ? (lang === "en" ? `All (${summaryMetrics.total})` : `Tất cả (${summaryMetrics.total})`) : formatStatus(st)}
                    </button>
                ))}
            </div>

            {/* BỘ LỌC — DÙNG LUXURYSELECT */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={lang === "en" ? "Search ticket ID, station, technician..." : "Tìm mã phiếu, trạm, kỹ thuật viên..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <button type="button" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.6rem", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}><X size={14} /></button>}
                </div>

                <div style={{ display: "inline-flex", gap: "0.2rem", background: "#0B0D14", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "9px", padding: "0.2rem" }}>
                    {(
                        [
                            { id: "TODAY", label: lang === "en" ? "Today" : "Hôm nay" },
                            { id: "THIS_WEEK", label: lang === "en" ? "Week" : "Tuần này" },
                            { id: "THIS_MONTH", label: lang === "en" ? "Month" : "Tháng này" },
                            { id: "LAST_30_DAYS", label: lang === "en" ? "30d" : "30 ngày" },
                        ] as const
                    ).map((p) => (
                        <button key={p.id} type="button" onClick={() => handleApplyDatePreset(p.id)} style={{ padding: "0.34rem 0.6rem", borderRadius: "7px", border: "none", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", background: datePreset === p.id ? "#D4AF37" : "transparent", color: datePreset === p.id ? "#090A0F" : "#CBD5E1" }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {!lockedBrandScope && (
                    <LuxurySelect
                        value={selectedBrand}
                        onChange={setSelectedBrand}
                        minWidth="175px"
                        options={[
                            { value: "ALL", label: lang === "en" ? "All Brands" : "Tất cả thương hiệu" },
                            ...uniqueBrands.map((b) => ({ value: b, label: b })),
                        ]}
                    />
                )}

                <LuxurySelect
                    value={selectedPriority}
                    onChange={setSelectedPriority}
                    minWidth="155px"
                    options={[
                        { value: "ALL", label: lang === "en" ? "All Priority" : "Mọi ưu tiên" },
                        ...(["URGENT", "HIGH", "NORMAL", "LOW"] as const).map((p) => ({ value: p, label: formatPriority(p) })),
                    ]}
                />

                {(searchQuery || (!lockedBrandScope && selectedBrand !== "ALL") || selectedPriority !== "ALL" || selectedIssueType !== "ALL" || activeStatusTab !== "ALL") && (
                    <button type="button" onClick={() => { setSearchQuery(""); if (!lockedBrandScope) setSelectedBrand("ALL"); setSelectedPriority("ALL"); setSelectedIssueType("ALL"); setActiveStatusTab("ALL"); handleApplyDatePreset("LAST_30_DAYS"); }} className={styles.secondaryGoldBtn}>
                        <RefreshCw size={13} />
                        <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                    </button>
                )}
            </div>

            {/* BẢNG PHIẾU BẢO TRÌ */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>{lang === "en" ? "Ticket ID" : "Mã phiếu"}</th>
                            <th>{lang === "en" ? "Station" : "Trạm"}</th>
                            <th>{lang === "en" ? "Issue" : "Loại lỗi"}</th>
                            <th>{lang === "en" ? "Priority" : "Ưu tiên"}</th>
                            <th>{lang === "en" ? "Status" : "Trạng thái"}</th>
                            <th>{lang === "en" ? "Technician" : "Kỹ thuật viên"}</th>
                            <th>{lang === "en" ? "Deadline" : "Hạn xử lý"}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTickets.map((tk) => (
                            <tr key={tk.id} onClick={() => { setSelectedTicketId(tk.id); setDrawerTab("details"); }} className={`${styles.tableRow} ${selectedTicket?.id === tk.id ? styles.tableRowSelected : ""}`}>
                                <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 700 }}>{tk.id}</td>
                                <td className={styles.tableCell}><strong>{tk.kioskCode}</strong><div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{tk.location}</div></td>
                                <td className={styles.tableCell}><strong>{formatIssueType(tk.issueType)}</strong></td>
                                <td className={styles.tableCell} style={{ fontWeight: 700, color: tk.priority === "URGENT" ? "#F87171" : tk.priority === "HIGH" ? "#FB923C" : "#38BDF8" }}>{formatPriority(tk.priority)}</td>
                                <td className={styles.tableCell}>{renderStatusBadge(tk.status)}</td>
                                <td className={styles.tableCell}>{tk.assignedTo}</td>
                                <td className={styles.tableCell}>{tk.deadline}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CHI TIẾT PHIẾU */}
            {selectedTicket && (
                <div className={styles.drawerOverlay} onClick={() => setSelectedTicketId(null)}>
                    <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <strong style={{ color: "#D4AF37" }}>{selectedTicket.id}</strong>
                                        {renderStatusBadge(selectedTicket.status)}
                                        <span style={{ fontSize: "0.74rem", color: "#F87171", fontWeight: 700 }}>{formatPriority(selectedTicket.priority)}</span>
                                    </div>
                                    <h2 style={{ margin: "0.15rem 0 0 0", fontSize: "1.2rem" }}>{formatIssueType(selectedTicket.issueType)} — {selectedTicket.kioskCode}</h2>
                                    <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>{selectedTicket.location} • {lang === "en" ? "Due:" : "Hạn:"} {selectedTicket.deadline}</div>
                                </div>
                                <div style={{ display: "flex", gap: "0.45rem" }}>
                                    {canExecuteMaintenance && (selectedTicket.status === "OPEN" || selectedTicket.status === "OVERDUE") && (
                                        <button type="button" onClick={() => handleStartMaintenance(selectedTicket)} className={styles.secondaryGoldBtn}>
                                            <Play size={13} color="#38BDF8" />
                                            <span>{lang === "en" ? "Start" : "Bắt đầu"}</span>
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setSelectedTicketId(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.45rem 0.6rem" }}><X size={16} /></button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerTabsBar}>
                            {[
                                { id: "details", label: lang === "en" ? "Details" : "Chi tiết", icon: Wrench },
                                { id: "checklist", label: `${lang === "en" ? "Checklist" : "Kiểm tra"} (${selectedTicket.checklist.filter((c) => c.status === "PASSED").length}/5)`, icon: ClipboardCheck },
                                { id: "timeline", label: `${lang === "en" ? "History" : "Lịch sử"} (${selectedTicket.timeline.length})`, icon: History },
                                { id: "attachments", label: `${lang === "en" ? "Files" : "Tệp"} (${selectedTicket.attachments.length})`, icon: Paperclip },
                            ].map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button key={t.id} type="button" onClick={() => setDrawerTab(t.id as DrawerTab)} className={`${styles.drawerTabBtn} ${drawerTab === t.id ? styles.drawerTabBtnActive : ""}`}>
                                        <Icon size={13} />
                                        <span>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.drawerBody}>
                            {drawerTab === "details" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    <div className={styles.glassCard}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                            <strong style={{ color: "#D4AF37", fontSize: "0.82rem" }}>{lang === "en" ? "Description" : "Mô tả sự cố"}</strong>
                                            <button type="button" onClick={() => router.push(`/machines/${encodeURIComponent(selectedTicket.kioskCode)}`)} className={styles.secondaryGoldBtn} style={{ padding: "0.3rem 0.6rem", fontSize: "0.74rem" }}>
                                                <Cpu size={12} color="#D4AF37" />
                                                <span>{selectedTicket.kioskCode}</span>
                                                <ArrowUpRight size={12} />
                                            </button>
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.86rem", color: "#E2E8F0" }}>{selectedTicket.description}</p>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                        <div className={styles.glassCard}>
                                            <label style={{ display: "block", fontSize: "0.74rem", color: "#94A3B8", marginBottom: "0.3rem" }}>{lang === "en" ? "Technician" : "Kỹ thuật viên"}</label>
                                            {canCreateOrAssignTicket && selectedTicket.status !== "COMPLETED" ? (
                                                <LuxurySelect
                                                    width="100%"
                                                    value={selectedTicket.assignedTo}
                                                    onChange={(tech) => {
                                                        persistTickets(tickets.map((t) => (t.id === selectedTicket.id ? { ...t, assignedTo: tech } : t)));
                                                        showToast(lang === "en" ? `Assigned to ${tech}.` : `Đã phân công cho ${tech}.`);
                                                    }}
                                                    options={TECHNICIANS_LIST.map((s) => ({ value: s, label: s }))}
                                                />
                                            ) : (
                                                <strong>{selectedTicket.assignedTo}</strong>
                                            )}
                                        </div>
                                        <div className={styles.glassCard}>
                                            <label style={{ display: "block", fontSize: "0.74rem", color: "#94A3B8", marginBottom: "0.3rem" }}>{lang === "en" ? "Replaced Parts" : "Linh kiện thay thế"}</label>
                                            <input
                                                type="text"
                                                disabled={!canExecuteMaintenance || selectedTicket.status === "COMPLETED"}
                                                value={selectedTicket.replacedComponents}
                                                onChange={(e) => setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, replacedComponents: e.target.value } : t)))}
                                                className={styles.searchInput}
                                                style={{ padding: "0.5rem 0.75rem" }}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.glassCard}>
                                        <label style={{ display: "block", fontSize: "0.78rem", color: "#F5E6AD", fontWeight: 700, marginBottom: "0.35rem" }}>{lang === "en" ? "Corrective Action *" : "Biện pháp khắc phục *"}</label>
                                        <textarea
                                            rows={2}
                                            disabled={!canExecuteMaintenance || selectedTicket.status === "COMPLETED"}
                                            value={selectedTicket.correctiveAction}
                                            onChange={(e) => setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, correctiveAction: e.target.value } : t)))}
                                            className={styles.searchInput}
                                            style={{ padding: "0.55rem 0.85rem", resize: "none" }}
                                        />
                                    </div>
                                </div>
                            )}

                            {drawerTab === "checklist" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                    {selectedTicket.checklist.map((item) => (
                                        <div key={item.id} className={styles.glassCard} style={{ borderLeft: `3px solid ${item.status === "PASSED" ? "#34D399" : item.status === "FAILED" ? "#F87171" : "#D4AF37"}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{CHECKLIST_LABELS[item.id][lang]}</div>
                                                <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                                                    {item.status === "PASSED" ? (lang === "en" ? "Passed" : "Đạt") : item.status === "FAILED" ? (lang === "en" ? "Failed" : "Không đạt") : (lang === "en" ? "Pending" : "Chưa kiểm tra")}
                                                </div>
                                            </div>
                                            {canExecuteMaintenance && selectedTicket.status !== "COMPLETED" && (
                                                <div style={{ display: "flex", gap: "0.35rem" }}>
                                                    <button type="button" onClick={() => handleToggleChecklist(item.id, "PASSED")} className={styles.actionButton} style={{ padding: "0.32rem 0.6rem", color: item.status === "PASSED" ? "#34D399" : "#CBD5E1" }}>✓ {lang === "en" ? "Pass" : "Đạt"}</button>
                                                    <button type="button" onClick={() => handleToggleChecklist(item.id, "FAILED")} className={styles.actionButton} style={{ padding: "0.32rem 0.6rem", color: item.status === "FAILED" ? "#F87171" : "#CBD5E1" }}>✕ {lang === "en" ? "Fail" : "Lỗi"}</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {canExecuteMaintenance && (
                                        <div className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                                            <div style={{ fontSize: "0.82rem", color: "#CBD5E1" }}>
                                                {lang === "en" ? "Post-repair diagnostic spray (0.12ml, non-revenue)." : "Xịt chẩn đoán sau sửa (0.12ml, tách riêng khỏi doanh thu)."}
                                            </div>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button type="button" onClick={handleRunPostRepairTest} className={styles.secondaryGoldBtn} style={{ color: selectedTicket.postMaintenanceTestPassed ? "#34D399" : "#F5E6AD" }}>
                                                    {selectedTicket.postMaintenanceTestPassed ? (lang === "en" ? "✓ Test Passed" : "✓ Đã đạt") : (lang === "en" ? "Run Test" : "Chạy kiểm tra")}
                                                </button>
                                                <button type="button" disabled={selectedTicket.status === "COMPLETED"} onClick={handleCompleteTicket} className={styles.primaryGoldBtn}>
                                                    <CheckCircle2 size={14} />
                                                    <span>{selectedTicket.status === "COMPLETED" ? (lang === "en" ? "Completed" : "Đã đóng") : (lang === "en" ? "Complete & Restore Online" : "Hoàn tất & Bật lại máy")}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {drawerTab === "timeline" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                    {(canExecuteMaintenance || canCreateOrAssignTicket) && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (!newTimelineComment.trim()) return;
                                                const updated = { ...selectedTicket, timeline: [{ id: `TL-${Date.now()}`, timestamp: formatNowTimestamp(), actor: currentActorLabel, eventType: "NOTE", detail: newTimelineComment.trim() }, ...selectedTicket.timeline] };
                                                persistTickets(tickets.map((t) => (t.id === selectedTicket.id ? updated : t)));
                                                setNewTimelineComment("");
                                            }}
                                            style={{ display: "flex", gap: "0.5rem" }}
                                        >
                                            <input type="text" placeholder={lang === "en" ? "Add note..." : "Thêm ghi chú..."} value={newTimelineComment} onChange={(e) => setNewTimelineComment(e.target.value)} className={styles.searchInput} style={{ padding: "0.5rem 0.85rem", flex: 1 }} />
                                            <button type="submit" className={styles.secondaryGoldBtn}>{lang === "en" ? "Add" : "Gửi"}</button>
                                        </form>
                                    )}
                                    {selectedTicket.timeline.map((ev) => (
                                        <div key={ev.id} className={styles.glassCard} style={{ borderLeft: "3px solid #D4AF37" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}><strong>{ev.actor}</strong><span style={{ color: "#F5E6AD" }}>{ev.timestamp}</span></div>
                                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.82rem", color: "#CBD5E1" }}>{ev.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {drawerTab === "attachments" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {canExecuteMaintenance && (
                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <button type="button" onClick={() => attachmentInputRef.current?.click()} className={styles.secondaryGoldBtn}>
                                                <Upload size={13} color="#D4AF37" />
                                                <span>{lang === "en" ? "Upload File" : "Tải tệp bằng chứng"}</span>
                                            </button>
                                        </div>
                                    )}
                                    {selectedTicket.attachments.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "1.5rem", color: "#94A3B8" }}>{lang === "en" ? "No attachments." : "Chưa có tệp đính kèm."}</div>
                                    ) : (
                                        selectedTicket.attachments.map((att) => (
                                            <div key={att.id} className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div><strong>{att.fileName}</strong><div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{att.fileSizeKb} KB • {att.uploadedBy} • {att.uploadedAt}</div></div>
                                                <span style={{ color: "#34D399", fontSize: "0.76rem", fontWeight: 700 }}>✓</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.drawerFooter}>
                            <div className={styles.footerMetricBox}><span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Station" : "Trạm"}</span><strong>{selectedTicket.kioskCode}</strong></div>
                            <div className={styles.footerMetricBox}><span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Checklist" : "Kiểm tra"}</span><strong style={{ color: "#34D399" }}>{selectedTicket.checklist.filter((c) => c.status === "PASSED").length}/5</strong></div>
                            <div className={styles.footerMetricBox}><span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Diag Spray" : "Xịt thử"}</span><strong>{selectedTicket.diagnosticSprayExecuted ? (lang === "en" ? "Done" : "Đã xịt") : (lang === "en" ? "Pending" : "Chưa")}</strong></div>
                            <div className={styles.footerMetricBox}><span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Post-Test" : "Nghiệm thu"}</span><strong style={{ color: selectedTicket.postMaintenanceTestPassed ? "#34D399" : "#F87171" }}>{selectedTicket.postMaintenanceTestPassed ? (lang === "en" ? "Passed" : "Đạt") : (lang === "en" ? "Pending" : "Chờ")}</strong></div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL LỊCH BẢO TRÌ ĐỊNH KỲ */}
            {selectedScheduleDetail && (
                <div className={styles.modalOverlay} onClick={() => setSelectedScheduleDetail(null)}>
                    <div className={styles.modalContent} style={{ maxWidth: "28rem" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{selectedScheduleDetail.kioskCode} — {formatScheduleType(selectedScheduleDetail.maintenanceType)}</h3>
                            <button type="button" onClick={() => setSelectedScheduleDetail(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>
                        <div style={{ fontSize: "0.86rem", color: "#CBD5E1", lineHeight: 1.7, marginBottom: "1rem" }}>
                            <div><strong>{lang === "en" ? "Location:" : "Địa điểm:"}</strong> {selectedScheduleDetail.location}</div>
                            <div><strong>{lang === "en" ? "Time:" : "Thời gian:"}</strong> {selectedScheduleDetail.scheduledTime}</div>
                            <div><strong>{lang === "en" ? "Technician:" : "Kỹ thuật viên:"}</strong> {selectedScheduleDetail.technician}</div>
                        </div>
                        <button type="button" onClick={() => setSelectedScheduleDetail(null)} className={styles.primaryGoldBtn} style={{ width: "100%" }}>{lang === "en" ? "Close" : "Đóng"}</button>
                    </div>
                </div>
            )}

            {/* MODAL TẠO PHIẾU BẢO TRÌ (CHỈ OM) — DÙNG LUXURYSELECT */}
            {isCreateModalOpen && canCreateOrAssignTicket && (
                <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
                    <div className={styles.modalContent} style={{ overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{lang === "en" ? "Create Maintenance Ticket" : "Tạo phiếu bảo trì"}</h3>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>

                        {createWarning && (
                            <div style={{ padding: "0.7rem", borderRadius: "9px", background: "rgba(248,113,113,0.14)", color: "#FCA5A5", fontSize: "0.8rem", marginBottom: "0.85rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <ShieldAlert size={16} color="#F87171" />
                                <span>{createWarning}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateTicketSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Station" : "Trạm Kiosk"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={createMachineCode}
                                        onChange={setCreateMachineCode}
                                        options={FLEET_MACHINES_LOOKUP.map((m) => ({ value: m.code, label: `${m.code} (${m.brand})` }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Issue Type" : "Loại lỗi"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={createIssueType}
                                        onChange={(v) => setCreateIssueType(v as IssueCategoryType)}
                                        options={ISSUE_CATEGORIES.map((c) => ({ value: c, label: formatIssueType(c) }))}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Priority" : "Ưu tiên"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={createPriority}
                                        onChange={(v) => setCreatePriority(v as TicketPriority)}
                                        options={(["URGENT", "HIGH", "NORMAL", "LOW"] as const).map((p) => ({ value: p, label: formatPriority(p) }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Deadline" : "Hạn xử lý"}</label>
                                    <input type="date" value={createDeadline} onChange={(e) => setCreateDeadline(e.target.value)} className={styles.searchInput} style={{ padding: "0.52rem 0.75rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Technician" : "Kỹ thuật viên"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={createAssignee}
                                        onChange={setCreateAssignee}
                                        options={TECHNICIANS_LIST.map((s) => ({ value: s, label: s }))}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Description *" : "Mô tả lỗi *"}</label>
                                <textarea rows={2} required value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem", resize: "none" }} />
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