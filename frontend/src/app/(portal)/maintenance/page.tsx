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
    MoreHorizontal,
    Calendar,
    ClipboardCheck,
    History,
    Paperclip,
    Play,
    X,
    ArrowUpRight,
    ShieldAlert,
    Cpu,
    Upload,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    Globe,
    RotateCcw,
    ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

type TicketStatus =
    | "OPEN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "OVERDUE"
    | "ON_HOLD"
    | "CANCELLED";

type IssueCategoryType =
    | "Pump Error"
    | "Door Sensor Fault"
    | "Connection Lost"
    | "Payment Device Error"
    | "Spray Nozzle Clogged"
    | "Screen Issue";

type TicketPriority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
type DrawerTab = "details" | "checklist" | "timeline" | "attachments";
type QuickDatePreset =
    | "TODAY"
    | "THIS_WEEK"
    | "LAST_WEEK"
    | "THIS_MONTH"
    | "LAST_30_DAYS"
    | "CUSTOM";

interface ChecklistItem {
    id: string;
    label: string;
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
    dateStr?: string;
    createdAtMs: number;
    completedAtMs?: number;
    deadline: string;
    description: string;
    correctiveAction: string;
    replacedComponents: string;
    repairCostVnd: number;
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
    tasksToPerform: string[];
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

const ISSUE_CATEGORIES: IssueCategoryType[] = [
    "Pump Error",
    "Door Sensor Fault",
    "Connection Lost",
    "Payment Device Error",
    "Spray Nozzle Clogged",
    "Screen Issue",
];

const FLEET_MACHINES_LOOKUP = [
    { code: "KIOSK-HN-02", location: "Trang Tien Plaza Luxury Wing, Hanoi", brand: "Maison Margiela" },
    { code: "KIOSK-004", location: "Aeon Mall Tan Phu Celadon, HCMC", brand: "Tom Ford" },
    { code: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya D1, HCMC", brand: "Chanel" },
    { code: "KIOSK-SGN-02", location: "Vincom Center Dong Khoi, HCMC", brand: "Yves Saint Laurent" },
    { code: "KIOSK-SGN-03", location: "Crescent Mall Luxury Wing D7, HCMC", brand: "Versace" },
    { code: "KIOSK-HN-01", location: "Lotte Center West Lake, Hanoi", brand: "Dior" },
    { code: "KIOSK-DAD-01", location: "IndoChina Riverside Mall Lobby, Da Nang", brand: "Armaf" },
    { code: "demo-device", location: "Diamond Plaza Luxury Atrium, HCMC", brand: "Creed" },
];

const TECHNICIANS_LIST = [
    "Nguyễn Hoàng Nam (Senior IoT Engineer)",
    "Phạm Bảo Ngọc (HCMC Field Operations)",
    "Lê Minh Khôi (Fragrance Cartridge Specialist)",
    "Đặng Quốc Bảo (Northern Region Specialist)",
];

const buildStandardChecklist = (allPassed = false): ChecklistItem[] => [
    {
        id: "CHK-1",
        label: "Power Supply & 24V DC Bus Stability",
        mandatory: true,
        status: allPassed ? "PASSED" : "PENDING",
        note: allPassed ? "24.0V DC verified" : "",
    },
    {
        id: "CHK-2",
        label: "MQTT Broker Connectivity & Heartbeat",
        mandatory: true,
        status: allPassed ? "PASSED" : "PENDING",
        note: allPassed ? "Latency 38ms" : "",
    },
    {
        id: "CHK-3",
        label: "Micro-Pump Pressure (Target 1.50 bar)",
        mandatory: true,
        status: allPassed ? "PASSED" : "PENDING",
        note: allPassed ? "1.50 bar nominal" : "",
    },
    {
        id: "CHK-4",
        label: "Spray Nozzle Atomization Pattern",
        mandatory: true,
        status: allPassed ? "PASSED" : "PENDING",
        note: allPassed ? "Uniform mist cone" : "",
    },
    {
        id: "CHK-5",
        label: "Cabinet Door Magnetic Sensor Interlock",
        mandatory: true,
        status: allPassed ? "PASSED" : "PENDING",
        note: allPassed ? "Safety interlock active" : "",
    },
];

const INITIAL_UPCOMING_SCHEDULES: UpcomingScheduleItem[] = [
    {
        id: "SCH-2026-01",
        kioskCode: "demo-device",
        location: "Diamond Plaza Luxury Atrium, HCMC",
        brand: "Creed",
        scheduledTime: "2026-11-18 08:30",
        maintenanceType: "Preventive",
        technician: "Nguyễn Hoàng Nam (Senior IoT Engineer)",
        tasksToPerform: [
            "Ultrasonic cleaning of 4 micro-atomizer nozzles",
            "Verify load-cell zero-point calibration across Slots 01–04",
            "Check Peltier cooling chamber seal (target 21.2°C)",
        ],
    },
    {
        id: "SCH-2026-02",
        kioskCode: "KIOSK-SGN-02",
        location: "Vincom Center Dong Khoi, HCMC",
        brand: "Yves Saint Laurent",
        scheduledTime: "2026-11-19 09:00",
        maintenanceType: "Inspection",
        technician: "Phạm Bảo Ngọc (HCMC Field Operations)",
        tasksToPerform: [
            "Inspect 21.5-inch capacitive touch screen responsiveness",
            "Verify MQTT TLS 1.3 certificate rotation & 5G failover",
        ],
    },
    {
        id: "SCH-2026-03",
        kioskCode: "KIOSK-HN-01",
        location: "Lotte Center West Lake, Hanoi",
        brand: "Dior",
        scheduledTime: "2026-11-21 08:00",
        maintenanceType: "Calibration",
        technician: "Lê Minh Khôi (Fragrance Cartridge Specialist)",
        tasksToPerform: [
            "Calibrate solenoid pulse duration (1,200ms = 0.12ml dose)",
            "Inspect cabinet door magnetic interlock switch",
        ],
    },
];

const INITIAL_TICKETS: MaintenanceTicketRecord[] = [
    {
        id: "MNT-2026-411",
        kioskCode: "KIOSK-SGN-03",
        location: "Crescent Mall Luxury Wing D7, HCMC",
        brand: "Versace",
        issueType: "Pump Error",
        priority: "HIGH",
        status: "OPEN",
        assignedTo: "Phạm Bảo Ngọc (HCMC Field Operations)",
        createdDate: "2026-11-16 08:25",
        dateStr: "2026-11-16",
        createdAtMs: new Date("2026-11-16T08:25:00").getTime(),
        deadline: "2026-11-17",
        description: "Slot 04 micro-diaphragm pump acoustic vibration slightly elevated during morning diagnostic cycle.",
        correctiveAction: "",
        replacedComponents: "",
        repairCostVnd: 0,
        diagnosticSprayExecuted: false,
        postMaintenanceTestPassed: false,
        checklist: buildStandardChecklist(false),
        timeline: [
            { id: "TL-31", timestamp: "2026-11-16 08:25:00", actor: "Operations Manager", eventType: "TICKET_CREATED", detail: "Scheduled pump inspection for KIOSK-SGN-03." },
        ],
        attachments: [],
    },
    {
        id: "MNT-2026-410",
        kioskCode: "KIOSK-004",
        location: "Aeon Mall Tan Phu Celadon, HCMC",
        brand: "Tom Ford",
        issueType: "Connection Lost",
        priority: "URGENT",
        status: "OVERDUE",
        assignedTo: "Phạm Bảo Ngọc (HCMC Field Operations)",
        createdDate: "2026-11-15 08:53",
        dateStr: "2026-11-15",
        createdAtMs: new Date("2026-11-15T08:53:00").getTime(),
        deadline: "2026-11-15",
        description: "Primary fiber link disconnected and 5G cellular failover SIM timed out (Linked to Alert #ALT-8901).",
        correctiveAction: "Pending 5G antenna module replacement and SIM carrier reset.",
        replacedComponents: "5G Failover Antenna Module",
        repairCostVnd: 350000,
        diagnosticSprayExecuted: false,
        postMaintenanceTestPassed: false,
        checklist: [
            { id: "CHK-1", label: "Power Supply & 24V DC Bus Stability", mandatory: true, status: "PASSED", note: "UPS battery healthy" },
            { id: "CHK-2", label: "MQTT Broker Connectivity & Heartbeat", mandatory: true, status: "FAILED", note: "SIM failover timeout" },
            { id: "CHK-3", label: "Micro-Pump Pressure (Target 1.50 bar)", mandatory: true, status: "PENDING", note: "" },
            { id: "CHK-4", label: "Spray Nozzle Atomization Pattern", mandatory: true, status: "PENDING", note: "" },
            { id: "CHK-5", label: "Cabinet Door Magnetic Sensor Interlock", mandatory: true, status: "PENDING", note: "" },
        ],
        timeline: [
            { id: "TL-11", timestamp: "2026-11-15 08:53:00", actor: "MQTT Broker Watchdog", eventType: "AUTO_CREATED", detail: "Auto-created ticket from Critical Offline Alert #ALT-8901." },
            { id: "TL-12", timestamp: "2026-11-16 00:01:00", actor: "SLA Monitor", eventType: "OVERDUE_ESCALATED", detail: "Ticket exceeded resolution deadline (2026-11-15)." },
        ],
        attachments: [],
    },
    {
        id: "MNT-2026-409",
        kioskCode: "KIOSK-HN-02",
        location: "Trang Tien Plaza Luxury Wing, Hanoi",
        brand: "Maison Margiela",
        issueType: "Spray Nozzle Clogged",
        priority: "URGENT",
        status: "IN_PROGRESS",
        assignedTo: "Nguyễn Hoàng Nam (Senior IoT Engineer)",
        createdDate: "2026-11-14 11:53",
        dateStr: "2026-11-14",
        createdAtMs: new Date("2026-11-14T11:53:00").getTime(),
        deadline: "2026-11-17",
        description: "Micro-pump actuator pressure in Slot 01 fell below 1.2 bar during QR dispensing cycle (Linked to Alert #ALT-8904).",
        correctiveAction: "Flushed nozzle manifold with medical-grade ethanol and replaced Viton O-ring seal.",
        replacedComponents: "Viton Micro O-Ring #VR-02",
        repairCostVnd: 180000,
        diagnosticSprayExecuted: true,
        postMaintenanceTestPassed: false,
        checklist: [
            { id: "CHK-1", label: "Power Supply & 24V DC Bus Stability", mandatory: true, status: "PASSED", note: "24.0V DC verified" },
            { id: "CHK-2", label: "MQTT Broker Connectivity & Heartbeat", mandatory: true, status: "PASSED", note: "Latency 42ms" },
            { id: "CHK-3", label: "Micro-Pump Pressure (Target 1.50 bar)", mandatory: true, status: "PASSED", note: "Restored to 1.51 bar" },
            { id: "CHK-4", label: "Spray Nozzle Atomization Pattern", mandatory: true, status: "PASSED", note: "Clean mist cone" },
            { id: "CHK-5", label: "Cabinet Door Magnetic Sensor Interlock", mandatory: true, status: "PENDING", note: "Awaiting final door closure check" },
        ],
        timeline: [
            { id: "TL-1", timestamp: "2026-11-14 11:53:00", actor: "Operations Manager", eventType: "TICKET_CREATED", detail: "Created ticket from Critical Alert #ALT-8904." },
            { id: "TL-2", timestamp: "2026-11-14 12:10:00", actor: "Operations Manager", eventType: "ASSIGNED", detail: "Assigned to Nguyễn Hoàng Nam (Priority: URGENT)." },
            { id: "TL-3", timestamp: "2026-11-14 13:15:00", actor: "Nguyễn Hoàng Nam", eventType: "MAINTENANCE_STARTED", detail: "Placed KIOSK-HN-02 into Maintenance Mode. Customer orders paused." },
            { id: "TL-4", timestamp: "2026-11-14 13:40:00", actor: "Nguyễn Hoàng Nam", eventType: "DIAGNOSTIC_SPRAY", detail: "Executed 1 controlled diagnostic test spray (0.12ml)." },
        ],
        attachments: [
            { id: "ATT-1", fileName: "nozzle_pressure_telemetry_hn02.png", fileType: "image/png", fileSizeKb: 420, uploadedBy: "Nguyễn Hoàng Nam", uploadedAt: "2026-11-14 13:25" },
        ],
    },
    {
        id: "MNT-2026-408",
        kioskCode: "KIOSK-SGN-02",
        location: "Vincom Center Dong Khoi, HCMC",
        brand: "Yves Saint Laurent",
        issueType: "Screen Issue",
        priority: "LOW",
        status: "ON_HOLD",
        assignedTo: "Phạm Bảo Ngọc (HCMC Field Operations)",
        createdDate: "2026-11-13 16:00",
        dateStr: "2026-11-13",
        createdAtMs: new Date("2026-11-13T16:00:00").getTime(),
        deadline: "2026-11-18",
        description: "Anti-glare tempered glass film has minor cosmetic scratch on bottom bezel; waiting for replacement film batch.",
        correctiveAction: "Waiting for spare anti-glare film delivery.",
        replacedComponents: "21.5-inch Anti-Glare Film",
        repairCostVnd: 150000,
        diagnosticSprayExecuted: false,
        postMaintenanceTestPassed: false,
        checklist: buildStandardChecklist(true),
        timeline: [
            { id: "TL-51", timestamp: "2026-11-13 16:30:00", actor: "Phạm Bảo Ngọc", eventType: "ON_HOLD", detail: "Placed on hold awaiting tempered glass film delivery." },
        ],
        attachments: [],
    },
    {
        id: "MNT-2026-407",
        kioskCode: "KIOSK-SGN-01",
        location: "Saigon Centre Takashimaya D1, HCMC",
        brand: "Chanel",
        issueType: "Door Sensor Fault",
        priority: "HIGH",
        status: "COMPLETED",
        assignedTo: "Lê Minh Khôi (Fragrance Cartridge Specialist)",
        createdDate: "2026-11-11 10:00",
        dateStr: "2026-11-11",
        createdAtMs: new Date("2026-11-11T10:00:00").getTime(),
        completedAtMs: new Date("2026-11-11T12:30:00").getTime(),
        deadline: "2026-11-12",
        description: "Cabinet door reed switch reported intermittent open state after cartridge replacement.",
        correctiveAction: "Realigned magnetic reed switch bracket and verified safety interlock.",
        replacedComponents: "Magnetic Reed Switch Bracket",
        repairCostVnd: 120000,
        diagnosticSprayExecuted: true,
        postMaintenanceTestPassed: true,
        checklist: buildStandardChecklist(true),
        timeline: [
            { id: "TL-21", timestamp: "2026-11-11 10:00:00", actor: "Operations Manager", eventType: "TICKET_CREATED", detail: "Created ticket for door sensor calibration." },
            { id: "TL-22", timestamp: "2026-11-11 12:30:00", actor: "Lê Minh Khôi", eventType: "COMPLETED", detail: "All checklist items passed, post-maintenance test succeeded, machine restored to ACTIVE service." },
        ],
        attachments: [
            { id: "ATT-2", fileName: "door_interlock_calibration_report.pdf", fileType: "application/pdf", fileSizeKb: 315, uploadedBy: "Lê Minh Khôi", uploadedAt: "2026-11-11 12:25" },
        ],
    },
    {
        id: "MNT-2026-406",
        kioskCode: "KIOSK-HN-01",
        location: "Lotte Center West Lake, Hanoi",
        brand: "Dior",
        issueType: "Pump Error",
        priority: "NORMAL",
        status: "COMPLETED",
        assignedTo: "Đặng Quốc Bảo (Northern Region Specialist)",
        createdDate: "2026-11-06 11:20",
        dateStr: "2026-11-06",
        createdAtMs: new Date("2026-11-06T11:20:00").getTime(),
        completedAtMs: new Date("2026-11-06T13:10:00").getTime(),
        deadline: "2026-11-07",
        description: "Peltier thermal fan RPM variance and micro-pump damper check during Hanoi atrium inspection.",
        correctiveAction: "Cleaned Peltier heatsink fins and recalibrated PWM fan controller.",
        replacedComponents: "Thermal Pad #TP-04",
        repairCostVnd: 95000,
        diagnosticSprayExecuted: true,
        postMaintenanceTestPassed: true,
        checklist: buildStandardChecklist(true),
        timeline: [
            { id: "TL-61", timestamp: "2026-11-06 13:10:00", actor: "Đặng Quốc Bảo", eventType: "COMPLETED", detail: "Peltier cooling stabilized at 21.2°C. Ticket closed." },
        ],
        attachments: [],
    },
    {
        id: "MNT-2026-405",
        kioskCode: "KIOSK-DAD-01",
        location: "IndoChina Riverside Mall Lobby, Da Nang",
        brand: "Armaf",
        issueType: "Payment Device Error",
        priority: "NORMAL",
        status: "COMPLETED",
        assignedTo: "Nguyễn Hoàng Nam (Senior IoT Engineer)",
        createdDate: "2026-11-05 14:00",
        dateStr: "2026-11-05",
        createdAtMs: new Date("2026-11-05T14:00:00").getTime(),
        completedAtMs: new Date("2026-11-05T15:50:00").getTime(),
        deadline: "2026-11-06",
        description: "QR display brightness dimmed due to ambient light sensor dust accumulation.",
        correctiveAction: "Cleaned ambient light sensor window and updated display profile.",
        replacedComponents: "None",
        repairCostVnd: 0,
        diagnosticSprayExecuted: true,
        postMaintenanceTestPassed: true,
        checklist: buildStandardChecklist(true),
        timeline: [
            { id: "TL-41", timestamp: "2026-11-05 15:50:00", actor: "Nguyễn Hoàng Nam", eventType: "COMPLETED", detail: "Sensor cleaned and verified." },
        ],
        attachments: [],
    },
    {
        id: "MNT-2026-404",
        kioskCode: "demo-device",
        location: "Diamond Plaza Luxury Atrium, HCMC",
        brand: "Creed",
        issueType: "Spray Nozzle Clogged",
        priority: "LOW",
        status: "CANCELLED",
        assignedTo: "Lê Minh Khôi (Fragrance Cartridge Specialist)",
        createdDate: "2026-11-03 09:30",
        dateStr: "2026-11-03",
        createdAtMs: new Date("2026-11-03T09:30:00").getTime(),
        deadline: "2026-11-04",
        description: "Routine pre-event nozzle inspection request superseded by full cartridge replacement task.",
        correctiveAction: "Merged into scheduled cartridge replacement workflow.",
        replacedComponents: "None",
        repairCostVnd: 0,
        diagnosticSprayExecuted: false,
        postMaintenanceTestPassed: false,
        checklist: buildStandardChecklist(false),
        timeline: [
            { id: "TL-71", timestamp: "2026-11-03 10:15:00", actor: "Operations Manager", eventType: "CANCELLED", detail: "Cancelled duplicate inspection request." },
        ],
        attachments: [],
    },
];

const MAINTENANCE_STORAGE_KEY = "scentstation_maintenance_tickets_v2";
const ALERTS_STORAGE_KEY = "scentstation_commercial_alerts_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function MaintenancePage(): React.ReactElement {
    const router = useRouter();
    const attachmentInputRef = useRef<HTMLInputElement | null>(null);

    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [tickets, setTickets] = useState<MaintenanceTicketRecord[]>(INITIAL_TICKETS);
    const [schedules] = useState<UpcomingScheduleItem[]>(INITIAL_UPCOMING_SCHEDULES);

    // Bộ lọc Trend, Tabs, Search, Dropdowns & Lịch thực tế
    const [trendView, setTrendView] = useState<"DAILY" | "MONTHLY">("DAILY");
    const [selectedChartBar, setSelectedChartBar] = useState<string | null>(null);
    const [hoveredChartBar, setHoveredChartBar] = useState<{
        label: string;
        created: number;
        done: number;
        over: number;
    } | null>(null);
    const [activeStatusTab, setActiveStatusTab] = useState<"ALL" | TicketStatus>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
    const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
    const [selectedIssueType, setSelectedIssueType] = useState<string>("ALL");

    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [openDropdown, setOpenDropdown] = useState<
        | "CALENDAR"
        | "BRAND"
        | "LOCATION"
        | "PRIORITY"
        | "ISSUE_TYPE"
        | "ASSIGN_TECH"
        | "CREATE_MACHINE"
        | "CREATE_ISSUE"
        | "CREATE_PRIORITY"
        | "CREATE_DATE"
        | "CREATE_TECH"
        | null
    >(null);

    // Đồng bộ RBAC từ /login & /users
    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");
    const [isViewerReadOnly, setIsViewerReadOnly] = useState<boolean>(false);
    const [brandTenantScope, setBrandTenantScope] = useState<string | null>(null);

    // Modal chi tiết Ticket & Menu 3 chấm
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [selectedScheduleDetail, setSelectedScheduleDetail] =
        useState<UpcomingScheduleItem | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [newTimelineComment, setNewTimelineComment] = useState<string>("");

    // State Modal tạo Ticket mới
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [createMachineCode, setCreateMachineCode] = useState<string>("KIOSK-HN-02");
    const [createIssueType, setCreateIssueType] =
        useState<IssueCategoryType>("Spray Nozzle Clogged");
    const [createPriority, setCreatePriority] = useState<TicketPriority>("HIGH");
    const [createAssignee, setCreateAssignee] = useState<string>(TECHNICIANS_LIST[0]);
    const [createDeadline, setCreateDeadline] = useState<string>(todayYmd);
    const [createDesc, setCreateDesc] = useState<string>(
        "Inspect micro-pump pressure sensor and perform nozzle ultrasonic cleaning."
    );
    const [createWarning, setCreateWarning] = useState<string>("");

    const selectedTicket = useMemo(
        () => tickets.find((t) => t.id === selectedTicketId) || null,
        [tickets, selectedTicketId]
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
        setSelectedChartBar(null);

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
        setSelectedChartBar(null);
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

    /* --- 1. ĐỌC & ĐỐI SOÁT DỮ LIỆU ĐỒNG BỘ 2 CHIỀU VỚI TOÀN BỘ 16 MÀN HÌNH --- */
    const loadAndReconcileMaintenance = useCallback(() => {
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
                    setSelectedBrand(parsedUser.brandScope);
                } else {
                    setBrandTenantScope(null);
                }
            }

            // B. Đọc danh sách Tickets từ MAINTENANCE_STORAGE_KEY
            let workingTickets: MaintenanceTicketRecord[] = [...INITIAL_TICKETS];
            const rawSaved = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
            if (rawSaved) {
                const parsed = JSON.parse(rawSaved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const seenIds = new Set<string>();
                    const mergedList: MaintenanceTicketRecord[] = [];

                    parsed.forEach((item: any, idx: number) => {
                        const tkId = item.id || `MNT-2026-${500 + idx}`;
                        if (seenIds.has(tkId)) return;
                        seenIds.add(tkId);

                        const kCode = item.kioskCode || item.machineId || "demo-device";
                        const rawCreated = String(item.createdDate || item.createdAt || todayYmd);
                        const dStr =
                            item.dateStr ||
                            (rawCreated.includes(" ")
                                ? rawCreated.split(" ")[0]
                                : rawCreated.slice(0, 10));

                        const mappedIssue: IssueCategoryType = ISSUE_CATEGORIES.includes(
                            item.issueType
                        )
                            ? item.issueType
                            : String(item.issueType || "").includes("MQTT") ||
                            String(item.issueType || "").includes("HEARTBEAT")
                                ? "Connection Lost"
                                : String(item.issueType || "").includes("NOZZLE")
                                    ? "Spray Nozzle Clogged"
                                    : "Pump Error";

                        mergedList.push({
                            id: tkId,
                            kioskCode: kCode,
                            location:
                                item.location ||
                                FLEET_MACHINES_LOOKUP.find((m) =>
                                    isExactMatch(m.code, kCode)
                                )?.location ||
                                "Flagship Kiosk Atrium",
                            brand:
                                item.brand ||
                                FLEET_MACHINES_LOOKUP.find((m) =>
                                    isExactMatch(m.code, kCode)
                                )?.brand ||
                                "Luxury Maison",
                            issueType: mappedIssue,
                            priority: item.priority || "HIGH",
                            status: item.status || "OPEN",
                            assignedTo:
                                item.assignedTo ||
                                item.technician ||
                                TECHNICIANS_LIST[0],
                            createdDate: rawCreated.slice(0, 16),
                            dateStr: dStr,
                            createdAtMs:
                                item.createdAtMs ||
                                new Date(dStr).getTime() ||
                                Date.now() - 7200000,
                            completedAtMs: item.completedAtMs,
                            deadline: item.deadline || todayYmd,
                            description:
                                item.description ||
                                item.notes ||
                                `Technical inspection dispatched for ${kCode}.`,
                            correctiveAction: item.correctiveAction || "",
                            replacedComponents: item.replacedComponents || "",
                            repairCostVnd: Number(item.repairCostVnd || 0),
                            diagnosticSprayExecuted: Boolean(
                                item.diagnosticSprayExecuted
                            ),
                            postMaintenanceTestPassed: Boolean(
                                item.postMaintenanceTestPassed
                            ),
                            checklist:
                                Array.isArray(item.checklist) &&
                                item.checklist.length > 0
                                    ? item.checklist
                                    : buildStandardChecklist(
                                        item.status === "COMPLETED"
                                    ),
                            timeline:
                                Array.isArray(item.timeline) &&
                                item.timeline.length > 0
                                    ? item.timeline
                                    : [
                                        {
                                            id: `TL-INIT-${tkId}`,
                                            timestamp: `${rawCreated.slice(0, 16)}:00`,
                                            actor: "Operations Dispatch",
                                            eventType: "TICKET_CREATED",
                                            detail:
                                                item.notes ||
                                                `Dispatched maintenance ticket for ${kCode}.`,
                                        },
                                    ],
                            attachments: Array.isArray(item.attachments)
                                ? item.attachments
                                : [],
                        });
                    });

                    INITIAL_TICKETS.forEach((seedTk) => {
                        if (!seenIds.has(seedTk.id)) {
                            seenIds.add(seedTk.id);
                            mergedList.push(seedTk);
                        }
                    });

                    workingTickets = mergedList;
                }
            }

            // C. Đồng bộ trạng thái với MACHINES_STORAGE_KEY
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    workingTickets = workingTickets.map((tk) => {
                        const matchedMachine = parsedMachines.find((m: any) =>
                            isExactMatch(m.code || m.id || "", tk.kioskCode)
                        );
                        if (
                            matchedMachine &&
                            matchedMachine.status === "ONLINE" &&
                            (tk.kioskCode === "KIOSK-004" ||
                                tk.kioskCode === "KIOSK-HN-02") &&
                            tk.status !== "COMPLETED"
                        ) {
                            return {
                                ...tk,
                                status: "COMPLETED",
                                completedAtMs: tk.completedAtMs || Date.now(),
                                correctiveAction:
                                    tk.correctiveAction ||
                                    "Verified station telemetry recovery and restored active service.",
                                diagnosticSprayExecuted: true,
                                postMaintenanceTestPassed: true,
                                checklist: buildStandardChecklist(true),
                            };
                        }
                        return tk;
                    });
                }
            }

            setTickets(workingTickets);
            localStorage.setItem(
                MAINTENANCE_STORAGE_KEY,
                JSON.stringify(workingTickets)
            );
        } catch {
            // Safe fallback
        }
    }, [todayYmd]);

    useEffect(() => {
        loadAndReconcileMaintenance();

        const handleCrossTabSync = () => {
            loadAndReconcileMaintenance();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileMaintenance();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileMaintenance]);

    /* --- 2. GHI & ĐỒNG BỘ NGƯỢC TỪ MAINTENANCE SANG TOÀN BỘ 16 MÀN HÌNH KIA --- */
    const persistTicketsAndSyncAllModules = useCallback(
        (
            nextTickets: MaintenanceTicketRecord[],
            affectedTicket?: MaintenanceTicketRecord,
            machineTargetStatus?: "MAINTENANCE" | "ONLINE",
            auditEvent?: { action: string; target: string; detail: string }
        ) => {
            setTickets(nextTickets);
            try {
                localStorage.setItem(
                    MAINTENANCE_STORAGE_KEY,
                    JSON.stringify(nextTickets)
                );
                const nowIso = new Date().toISOString();

                if (affectedTicket && machineTargetStatus) {
                    const kKey = affectedTicket.kioskCode.toLowerCase();

                    const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                    if (rawMachines) {
                        const parsedFleet = JSON.parse(rawMachines);
                        if (Array.isArray(parsedFleet)) {
                            const updatedFleet = parsedFleet.map((fm: any) => {
                                if (
                                    String(fm.code || fm.id || "").toLowerCase() !==
                                    kKey
                                ) {
                                    return fm;
                                }
                                return {
                                    ...fm,
                                    status: machineTargetStatus,
                                    connectionStatus: "ONLINE",
                                    operatingStatus:
                                        machineTargetStatus === "ONLINE"
                                            ? "ACTIVE"
                                            : "MAINTENANCE",
                                    manualAdminOverride: true,
                                    lastActivity: `Just now (Ticket ${affectedTicket.id})`,
                                };
                            });
                            localStorage.setItem(
                                MACHINES_STORAGE_KEY,
                                JSON.stringify(updatedFleet)
                            );
                        }
                    }

                    if (machineTargetStatus === "ONLINE") {
                        const rawAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
                        if (rawAlerts) {
                            const parsedAlerts = JSON.parse(rawAlerts);
                            if (Array.isArray(parsedAlerts)) {
                                const updatedAlerts = parsedAlerts.map((al: any) => {
                                    if (
                                        isExactMatch(
                                            al.machineId || "",
                                            affectedTicket.kioskCode
                                        ) &&
                                        (al.category === "MACHINE" ||
                                            al.activeTicketId === affectedTicket.id)
                                    ) {
                                        return {
                                            ...al,
                                            isSensorStale: false,
                                            underlyingIssuePersists: false,
                                            status: "RESOLVED",
                                            resolvedBy: affectedTicket.assignedTo,
                                            resolvedAt: formatNowTimestamp(),
                                            lastSensorSync: `Live (Restored via ${affectedTicket.id})`,
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
                    }

                    const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                    if (rawDash) {
                        const dashData = JSON.parse(rawDash);
                        if (Array.isArray(dashData.machines)) {
                            dashData.machines = dashData.machines.map((dm: any) =>
                                String(dm.id || "").toLowerCase() === kKey
                                    ? {
                                        ...dm,
                                        status: machineTargetStatus,
                                        lastSeen: `Just now (${affectedTicket.id})`,
                                    }
                                    : dm
                            );
                        }
                        localStorage.setItem(
                            DASHBOARD_STORAGE_KEY,
                            JSON.stringify(dashData)
                        );
                    }
                }

                if (auditEvent) {
                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                    auditList.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: nowIso,
                        actor: currentActorLabel,
                        role: "PSA",
                        tenant: auditEvent.target,
                        action: auditEvent.action,
                        entityType: "MAINTENANCE",
                        entityId: auditEvent.target,
                        severity: "INFO",
                        oldValues: null,
                        newValues: { detail: auditEvent.detail },
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
        () => Array.from(new Set(tickets.map((t) => t.brand))).sort(),
        [tickets]
    );
    const uniqueLocations = useMemo(
        () => Array.from(new Set(tickets.map((t) => t.location))).sort(),
        [tickets]
    );

    const dateAndAttrFilteredTickets = useMemo(() => {
        const effectiveBrand = brandTenantScope || selectedBrand;
        const q = searchQuery.trim().toLowerCase();

        return tickets.filter((t) => {
            const dStr =
                t.dateStr ||
                (t.createdDate && t.createdDate.includes(" ")
                    ? t.createdDate.split(" ")[0]
                    : todayYmd);
            const matchesDate = dStr >= startDate && dStr <= endDate;
            const matchesBrand =
                effectiveBrand === "ALL" || isExactMatch(t.brand, effectiveBrand);
            const matchesLoc =
                selectedLocation === "ALL" || t.location === selectedLocation;
            const matchesPriority =
                selectedPriority === "ALL" || t.priority === selectedPriority;
            const matchesIssue =
                selectedIssueType === "ALL" || t.issueType === selectedIssueType;
            const matchesSearch =
                !q ||
                t.id.toLowerCase().includes(q) ||
                t.kioskCode.toLowerCase().includes(q) ||
                t.location.toLowerCase().includes(q) ||
                t.issueType.toLowerCase().includes(q) ||
                t.assignedTo.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q);

            return (
                matchesDate &&
                matchesBrand &&
                matchesLoc &&
                matchesPriority &&
                matchesIssue &&
                matchesSearch
            );
        });
    }, [
        tickets,
        startDate,
        endDate,
        todayYmd,
        brandTenantScope,
        selectedBrand,
        selectedLocation,
        selectedPriority,
        selectedIssueType,
        searchQuery,
    ]);

    const summaryMetrics = useMemo(() => {
        const completedTickets = dateAndAttrFilteredTickets.filter(
            (t) => t.status === "COMPLETED" && t.completedAtMs
        );
        const avgHours =
            completedTickets.length > 0
                ? completedTickets.reduce(
                (sum, t) =>
                    sum +
                    Math.max(
                        0.5,
                        (t.completedAtMs! - t.createdAtMs) / 3600000
                    ),
                0
            ) / completedTickets.length
                : 2.1;

        return {
            total: dateAndAttrFilteredTickets.length,
            open: dateAndAttrFilteredTickets.filter((t) => t.status === "OPEN")
                .length,
            inProgress: dateAndAttrFilteredTickets.filter(
                (t) => t.status === "IN_PROGRESS"
            ).length,
            completed: dateAndAttrFilteredTickets.filter(
                (t) => t.status === "COMPLETED"
            ).length,
            overdue: dateAndAttrFilteredTickets.filter(
                (t) => t.status === "OVERDUE"
            ).length,
            onHold: dateAndAttrFilteredTickets.filter(
                (t) => t.status === "ON_HOLD"
            ).length,
            cancelled: dateAndAttrFilteredTickets.filter(
                (t) => t.status === "CANCELLED"
            ).length,
            avgResolutionHours: avgHours.toFixed(1),
        };
    }, [dateAndAttrFilteredTickets]);

    const issueTypeCounts = useMemo(() => {
        return ISSUE_CATEGORIES.map((cat) => ({
            category: cat,
            count: dateAndAttrFilteredTickets.filter((t) => t.issueType === cat)
                .length,
        }));
    }, [dateAndAttrFilteredTickets]);

    // Tính toán động 100% cho biểu đồ Maintenance Incident Velocity (Daily vs Monthly)
    const dynamicTrendBars = useMemo(() => {
        if (trendView === "DAILY") {
            const buckets = [
                {
                    id: "D1",
                    label: "03–06/11",
                    startYmd: "2026-11-03",
                    endYmd: "2026-11-06",
                },
                {
                    id: "D2",
                    label: "11–13/11",
                    startYmd: "2026-11-07",
                    endYmd: "2026-11-13",
                },
                {
                    id: "D3",
                    label: "14/11",
                    startYmd: "2026-11-14",
                    endYmd: "2026-11-14",
                },
                {
                    id: "D4",
                    label: "15/11",
                    startYmd: "2026-11-15",
                    endYmd: "2026-11-15",
                },
                {
                    id: "D5",
                    label: "16/11 (Live)",
                    startYmd: "2026-11-16",
                    endYmd: todayYmd > "2026-11-16" ? todayYmd : "2026-11-16",
                },
            ];

            const rawCounts = buckets.map((b) => {
                const inBucket = tickets.filter((t) => {
                    const d =
                        t.dateStr ||
                        (t.createdDate && t.createdDate.includes(" ")
                            ? t.createdDate.split(" ")[0]
                            : todayYmd);
                    return d >= b.startYmd && d <= b.endYmd;
                });
                const created = inBucket.length;
                const done = inBucket.filter((t) => t.status === "COMPLETED").length;
                const over = inBucket.filter((t) => t.status === "OVERDUE").length;
                return { ...b, created, done, over };
            });

            const maxCreated = Math.max(1, ...rawCounts.map((r) => r.created));
            return rawCounts.map((r) => ({
                ...r,
                pct: Math.max(26, Math.round((r.created / maxCreated) * 92)),
            }));
        } else {
            const novCreated = tickets.length;
            const novDone = tickets.filter((t) => t.status === "COMPLETED").length;
            const novOver = tickets.filter((t) => t.status === "OVERDUE").length;

            const monthlyBuckets = [
                {
                    id: "M1",
                    label: "Jul 2026",
                    startYmd: "2026-07-01",
                    endYmd: "2026-07-31",
                    created: 5,
                    done: 5,
                    over: 0,
                },
                {
                    id: "M2",
                    label: "Aug 2026",
                    startYmd: "2026-08-01",
                    endYmd: "2026-08-31",
                    created: 7,
                    done: 6,
                    over: 1,
                },
                {
                    id: "M3",
                    label: "Sep 2026",
                    startYmd: "2026-09-01",
                    endYmd: "2026-09-30",
                    created: 6,
                    done: 6,
                    over: 0,
                },
                {
                    id: "M4",
                    label: "Oct 2026",
                    startYmd: "2026-10-01",
                    endYmd: "2026-10-31",
                    created: 11,
                    done: 10,
                    over: 1,
                },
                {
                    id: "M5",
                    label: "Nov 2026",
                    startYmd: "2026-11-01",
                    endYmd: "2026-11-30",
                    created: novCreated,
                    done: novDone,
                    over: novOver,
                },
            ];

            const maxM = Math.max(1, ...monthlyBuckets.map((m) => m.created));
            return monthlyBuckets.map((m) => ({
                ...m,
                pct: Math.max(32, Math.round((m.created / maxM) * 94)),
            }));
        }
    }, [trendView, tickets, todayYmd]);

    const filteredTickets = useMemo(() => {
        return dateAndAttrFilteredTickets.filter(
            (t) => activeStatusTab === "ALL" || t.status === activeStatusTab
        );
    }, [dateAndAttrFilteredTickets, activeStatusTab]);

    const handleResetFilters = () => {
        setStartDate(defaultStart30d);
        setEndDate(todayYmd);
        setDatePreset("LAST_30_DAYS");
        setSelectedChartBar(null);
        setActiveStatusTab("ALL");
        setSearchQuery("");
        setSelectedBrand(brandTenantScope || "ALL");
        setSelectedLocation("ALL");
        setSelectedPriority("ALL");
        setSelectedIssueType("ALL");
        setOpenDropdown(null);
    };

    const handleResetSeedTickets = () => {
        localStorage.removeItem(MAINTENANCE_STORAGE_KEY);
        setTickets(INITIAL_TICKETS);
        setSelectedTicketId(null);
        setSelectedChartBar(null);
        showToast(
            lang === "en"
                ? "Restored default maintenance ticket feed!"
                : "Đã khôi phục danh sách phiếu bảo trì chuẩn ban đầu!"
        );
    };

    const handleCreateTicketSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isViewerReadOnly) return;
        setCreateWarning("");

        const duplicateTicket = tickets.find(
            (t) =>
                isExactMatch(t.kioskCode, createMachineCode) &&
                t.issueType === createIssueType &&
                t.status !== "COMPLETED" &&
                t.status !== "CANCELLED"
        );

        if (duplicateTicket) {
            setCreateWarning(
                `Duplicate Ticket Prevented: Unresolved ticket #${duplicateTicket.id} (${duplicateTicket.status}) already exists for "${createIssueType}" on ${createMachineCode}.`
            );
            return;
        }

        const machineMeta =
            FLEET_MACHINES_LOOKUP.find((m) => m.code === createMachineCode) ||
            FLEET_MACHINES_LOOKUP[0];
        const newId = `MNT-2026-${Math.floor(412 + Math.random() * 500)}`;
        const nowFull = formatNowTimestamp();

        const newTicket: MaintenanceTicketRecord = {
            id: newId,
            kioskCode: machineMeta.code,
            location: machineMeta.location,
            brand: machineMeta.brand,
            issueType: createIssueType,
            priority: createPriority,
            status: "OPEN",
            assignedTo: createAssignee,
            createdDate: nowFull.slice(0, 16),
            dateStr: todayYmd,
            createdAtMs: Date.now(),
            deadline: createDeadline,
            description: createDesc,
            correctiveAction: "",
            replacedComponents: "",
            repairCostVnd: 0,
            diagnosticSprayExecuted: false,
            postMaintenanceTestPassed: false,
            checklist: buildStandardChecklist(false),
            timeline: [
                {
                    id: `TL-${Date.now()}`,
                    timestamp: nowFull,
                    actor: currentActorLabel,
                    eventType: "TICKET_CREATED",
                    detail: `Dispatched ${createPriority} ticket for ${createIssueType} assigned to ${createAssignee}.`,
                },
            ],
            attachments: [],
        };

        const nextList = [newTicket, ...tickets];
        persistTicketsAndSyncAllModules(nextList, undefined, undefined, {
            action: "MAINTENANCE_TICKET_CREATED",
            target: newId,
            detail: `Created ticket ${newId} (${createIssueType}) for ${machineMeta.code}.`,
        });

        setIsCreateModalOpen(false);
        showToast(`Dispatched Maintenance Ticket #${newId} for ${machineMeta.code}!`);
    };

    const handleStartMaintenance = (ticket: MaintenanceTicketRecord) => {
        if (isViewerReadOnly || ticket.status === "COMPLETED") return;
        const nowStr = formatNowTimestamp();
        const updated: MaintenanceTicketRecord = {
            ...ticket,
            status: "IN_PROGRESS",
            timeline: [
                {
                    id: `TL-${Date.now()}`,
                    timestamp: nowStr,
                    actor: ticket.assignedTo,
                    eventType: "MAINTENANCE_STARTED",
                    detail: `Field engineer started maintenance. ${ticket.kioskCode} placed into Maintenance Mode; incoming customer orders paused.`,
                },
                ...ticket.timeline,
            ],
        };
        const nextList = tickets.map((t) => (t.id === ticket.id ? updated : t));
        persistTicketsAndSyncAllModules(nextList, updated, "MAINTENANCE", {
            action: "MAINTENANCE_MODE_ENGAGED",
            target: ticket.kioskCode,
            detail: `Placed ${ticket.kioskCode} into MAINTENANCE mode under ticket ${ticket.id}.`,
        });
        showToast(
            `Started maintenance on ${ticket.id}. Station ${ticket.kioskCode} is now in Maintenance Mode across all screens!`
        );
    };

    const handleToggleChecklistItem = (
        chkId: string,
        nextStatus: "PASSED" | "FAILED"
    ) => {
        if (!selectedTicket || isViewerReadOnly || selectedTicket.status === "COMPLETED")
            return;
        const updatedChecklist = selectedTicket.checklist.map((item) =>
            item.id === chkId
                ? {
                    ...item,
                    status: nextStatus,
                    note:
                        nextStatus === "PASSED"
                            ? "Verified nominal operating range"
                            : "Requires component replacement",
                }
                : item
        );

        const updated: MaintenanceTicketRecord = {
            ...selectedTicket,
            checklist: updatedChecklist,
        };
        const nextList = tickets.map((t) =>
            t.id === selectedTicket.id ? updated : t
        );
        persistTicketsAndSyncAllModules(nextList);
    };

    const handleRunPostMaintenanceTest = () => {
        if (!selectedTicket || isViewerReadOnly) return;
        const allMandatoryPassed = selectedTicket.checklist
            .filter((c) => c.mandatory)
            .every((c) => c.status === "PASSED");

        if (!allMandatoryPassed) {
            showToast(
                "Checklist Incomplete: All 5 mandatory hardware checklist items must PASS before running the post-repair test."
            );
            return;
        }

        const nowStr = formatNowTimestamp();
        const updated: MaintenanceTicketRecord = {
            ...selectedTicket,
            diagnosticSprayExecuted: true,
            postMaintenanceTestPassed: true,
            correctiveAction:
                selectedTicket.correctiveAction ||
                "Verified hardware telemetry, cleaned manifold, and calibrated micro-pump pressure to 1.50 bar.",
            timeline: [
                {
                    id: `TL-${Date.now()}`,
                    timestamp: nowStr,
                    actor: selectedTicket.assignedTo,
                    eventType: "POST_MAINTENANCE_TEST_PASSED",
                    detail: "Heartbeat, sensor telemetry, and 1 controlled diagnostic spray (0.12ml, excluded from commercial sales) verified successfully.",
                },
                ...selectedTicket.timeline,
            ],
        };
        const nextList = tickets.map((t) =>
            t.id === selectedTicket.id ? updated : t
        );
        persistTicketsAndSyncAllModules(nextList);
        showToast(
            "Post-Maintenance Test & Diagnostic Spray PASSED! You may now Complete Ticket."
        );
    };

    const handleMarkAsCompleted = (forceQuickComplete = false) => {
        if (!selectedTicket || isViewerReadOnly) return;

        if (!forceQuickComplete) {
            const allMandatoryPassed = selectedTicket.checklist
                .filter((c) => c.mandatory)
                .every((c) => c.status === "PASSED");

            if (!allMandatoryPassed) {
                showToast(
                    "Cannot Complete Ticket: One or more mandatory inspection checklist items have not passed (or click 'Quick Complete & Restore Online')."
                );
                return;
            }
            if (!selectedTicket.postMaintenanceTestPassed) {
                showToast(
                    "Cannot Complete Ticket: Please execute and pass the Post-Maintenance Test before returning the station to active service."
                );
                return;
            }
            if (!selectedTicket.correctiveAction.trim()) {
                showToast(
                    "Cannot Complete Ticket: Please record the Corrective Action / Repair Summary first."
                );
                return;
            }
        }

        const nowStr = formatNowTimestamp();
        const finalAction =
            selectedTicket.correctiveAction.trim() ||
            "Completed full hardware diagnostic, calibrated actuator pressure (1.50 bar), and verified MQTT heartbeat.";

        const updated: MaintenanceTicketRecord = {
            ...selectedTicket,
            status: "COMPLETED",
            completedAtMs: Date.now(),
            correctiveAction: finalAction,
            diagnosticSprayExecuted: true,
            postMaintenanceTestPassed: true,
            checklist: buildStandardChecklist(true),
            timeline: [
                {
                    id: `TL-${Date.now()}`,
                    timestamp: nowStr,
                    actor: selectedTicket.assignedTo,
                    eventType: "TICKET_COMPLETED",
                    detail: `Ticket closed. Repair recorded: "${finalAction}". Station ${selectedTicket.kioskCode} restored to ONLINE customer service.`,
                },
                ...selectedTicket.timeline,
            ],
        };

        const nextList = tickets.map((t) =>
            t.id === selectedTicket.id ? updated : t
        );
        persistTicketsAndSyncAllModules(nextList, updated, "ONLINE", {
            action: "MAINTENANCE_COMPLETED_ONLINE",
            target: selectedTicket.kioskCode,
            detail: `Completed ticket ${selectedTicket.id} and restored ${selectedTicket.kioskCode} to ONLINE service.`,
        });

        showToast(
            `Ticket ${selectedTicket.id} COMPLETED! Station ${selectedTicket.kioskCode} restored to ONLINE service across all 17 screens!`
        );
    };

    const handleAddTimelineComment = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedTicket || !newTimelineComment.trim() || isViewerReadOnly)
            return;
        const nowStr = formatNowTimestamp();
        const updated: MaintenanceTicketRecord = {
            ...selectedTicket,
            timeline: [
                {
                    id: `TL-${Date.now()}`,
                    timestamp: nowStr,
                    actor: selectedTicket.assignedTo,
                    eventType: "TECHNICIAN_COMMENT",
                    detail: newTimelineComment.trim(),
                },
                ...selectedTicket.timeline,
            ],
        };
        const nextList = tickets.map((t) =>
            t.id === selectedTicket.id ? updated : t
        );
        persistTicketsAndSyncAllModules(nextList);
        setNewTimelineComment("");
        showToast("Added progress note to immutable maintenance timeline.");
    };

    const handleFileAttachmentUpload = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTicket || isViewerReadOnly) return;

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp",
            "video/mp4",
            "application/pdf",
        ];
        if (!allowedTypes.includes(file.type)) {
            showToast(
                "Attachment Rejected: Unsupported file format. Only PNG, JPG, WEBP, MP4, or PDF files are permitted."
            );
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast("Attachment Rejected: File size exceeds 10MB limit.");
            return;
        }

        const nowStr = formatNowTimestamp();
        const newAtt: TicketAttachment = {
            id: `ATT-${Date.now()}`,
            fileName: file.name,
            fileType: file.type,
            fileSizeKb: Math.max(12, Math.round(file.size / 1024)),
            uploadedBy: selectedTicket.assignedTo.split(" (")[0],
            uploadedAt: nowStr.slice(0, 16),
        };

        const updated: MaintenanceTicketRecord = {
            ...selectedTicket,
            attachments: [newAtt, ...selectedTicket.attachments],
            timeline: [
                {
                    id: `TL-${Date.now()}`,
                    timestamp: nowStr,
                    actor: selectedTicket.assignedTo,
                    eventType: "ATTACHMENT_UPLOADED",
                    detail: `Attached diagnostic evidence file "${file.name}" (${newAtt.fileSizeKb} KB).`,
                },
                ...selectedTicket.timeline,
            ],
        };

        const nextList = tickets.map((t) =>
            t.id === selectedTicket.id ? updated : t
        );
        persistTicketsAndSyncAllModules(nextList);
        showToast(
            `Uploaded attachment "${file.name}" to ticket ${selectedTicket.id}!`
        );
    };

    const renderStatusBadge = (st: TicketStatus) => {
        const map: Record<
            TicketStatus,
            { bg: string; color: string; border: string }
        > = {
            OPEN: {
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
            ON_HOLD: {
                bg: "rgba(168, 85, 247, 0.14)",
                color: "#C084FC",
                border: "rgba(168, 85, 247, 0.4)",
            },
            CANCELLED: {
                bg: "rgba(148, 163, 184, 0.14)",
                color: "#94A3B8",
                border: "rgba(148, 163, 184, 0.35)",
            },
        };
        const cur = map[st];
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

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => {
                setOpenMenuId(null);
                setOpenDropdown(null);
            }}
        >
            <input
                type="file"
                ref={attachmentInputRef}
                onChange={handleFileAttachmentUpload}
                accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
                style={{ display: "none" }}
            />

            {/* LUXURY HERO BANNER CARD */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? "IOT HARDWARE DIAGNOSTICS & FIELD SLA GOVERNANCE"
                                : "QUẢN TRỊ BẢO TRÌ PHẦN CỨNG IOT & ĐIỀU PHỐI KỸ THUẬT VIÊN"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Maintenance & Technical Incident Management"
                                : "Quản Trị Bảo Trì & Sự Cố Kỹ Thuật Trạm Kiosk"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? "End-to-end field maintenance tickets, mandatory 5-point hardware inspection checklists, controlled diagnostic sprays, and real-time Kiosk recovery synchronized across all modules."
                                : "Quản lý phiếu bảo trì hiện trường, danh mục kiểm tra phần cứng 5 bước bắt buộc, xịt thử nghiệm chuẩn đoán và đồng bộ trạng thái máy Kiosk theo thời gian thực."}
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
                            onClick={handleResetSeedTickets}
                            className={styles.secondaryGoldBtn}
                            title="Restore default maintenance tickets"
                        >
                            <RotateCcw size={13} color="#D4AF37" />
                            <span>{lang === "en" ? "Reset Feed" : "Khôi Phục Mẫu"}</span>
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
                                    setCreateWarning("");
                                    setOpenDropdown(null);
                                    setIsCreateModalOpen(true);
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                <Plus size={15} />
                                <span>
                                    {lang === "en"
                                        ? "Create Maintenance Ticket"
                                        : "Tạo Phiếu Bảo Trì"}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 1. MAINTENANCE SUMMARY 6 KPI CARDS */}
                <div className={styles.kpiGrid6}>
                    {[
                        {
                            key: "ALL",
                            label: lang === "en" ? "TOTAL TICKETS" : "TỔNG SỐ PHIẾU",
                            val: summaryMetrics.total,
                            color: "#FFFFFF",
                            sub: lang === "en" ? "All recorded incidents" : "Tổng sự cố trong kỳ",
                        },
                        {
                            key: "OPEN",
                            label: "OPEN",
                            val: summaryMetrics.open,
                            color: "#FACC15",
                            sub: lang === "en" ? "Awaiting engineer start" : "Chờ kỹ thuật xử lý",
                        },
                        {
                            key: "IN_PROGRESS",
                            label: "IN PROGRESS",
                            val: summaryMetrics.inProgress,
                            color: "#60A5FA",
                            sub: lang === "en" ? "Station in Maintenance" : "Đang bảo trì tại trạm",
                        },
                        {
                            key: "COMPLETED",
                            label: "COMPLETED",
                            val: summaryMetrics.completed,
                            color: "#34D399",
                            sub: lang === "en" ? "Passed post-repair test" : "Đã nghiệm thu & Online",
                        },
                        {
                            key: "AVG_TIME",
                            label: lang === "en" ? "AVG. RESOLUTION" : "THỜI GIAN XỬ LÝ TB",
                            val: `${summaryMetrics.avgResolutionHours} hrs`,
                            color: "#F5E6AD",
                            sub: lang === "en" ? "Dynamic SLA average" : "Tính động từ phiếu đóng",
                        },
                        {
                            key: "OVERDUE",
                            label: "OVERDUE",
                            val: summaryMetrics.overdue,
                            color: "#F87171",
                            sub: lang === "en" ? "Exceeded SLA deadline" : "Quá hạn SLA cần ưu tiên",
                        },
                    ].map((c) => (
                        <div
                            key={c.key}
                            onClick={() => {
                                if (c.key !== "AVG_TIME") {
                                    setActiveStatusTab(c.key as any);
                                }
                            }}
                            className={`${styles.kpiCard} ${
                                activeStatusTab === c.key ? styles.kpiCardActive : ""
                            }`}
                        >
                            <div
                                style={{
                                    fontSize: "0.64rem",
                                    color: "#94A3B8",
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                    letterSpacing: "0.09em",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                {c.label}
                            </div>
                            <div
                                style={{
                                    fontSize: "1.55rem",
                                    fontWeight: 700,
                                    color: c.color,
                                    fontFamily: "Space Grotesk, monospace",
                                    margin: "0.28rem 0",
                                }}
                            >
                                {c.val}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                                {c.sub}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2, 3 & 4. ANALYTICS ROW: INTERACTIVE MAINTENANCE TREND + TICKETS BY ISSUE TYPE + UPCOMING MAINTENANCE */}
            <div className={styles.analyticsGrid3}>
                {/* 2. Maintenance Trend Chart (INTERACTIVE DRILL-DOWN & ZERO LAYOUT SHIFT) */}
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "nowrap",
                            marginBottom: "0.75rem",
                            gap: "0.75rem",
                        }}
                    >
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "1rem",
                                    color: "#FFF",
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {lang === "en"
                                    ? "Maintenance Incident Velocity"
                                    : "Xu Hướng Phiếu Bảo Trì"}
                            </h3>
                            <div
                                style={{
                                    fontSize: "0.71rem",
                                    color: "#94A3B8",
                                    marginTop: "0.15rem",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    height: "1.05rem",
                                }}
                            >
                                {hoveredChartBar ? (
                                    <strong
                                        style={{
                                            color: "#F5E6AD",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {hoveredChartBar.label}:{" "}
                                        {hoveredChartBar.created} Created •{" "}
                                        {hoveredChartBar.done} Done •{" "}
                                        {hoveredChartBar.over} Overdue
                                    </strong>
                                ) : selectedChartBar ? (
                                    <span style={{ color: "#34D399" }}>
                                        Filtered by selected bar (Click bar again to reset)
                                    </span>
                                ) : (
                                    "Click any bar to filter tickets by period"
                                )}
                            </div>
                        </div>

                        <div
                            className={styles.quickRangePillsGroup}
                            style={{
                                flexWrap: "nowrap",
                                flexShrink: 0,
                            }}
                        >
                            {(["DAILY", "MONTHLY"] as const).map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => {
                                        setTrendView(v);
                                        setSelectedChartBar(null);
                                        handleApplyDatePreset("LAST_30_DAYS");
                                    }}
                                    className={`${styles.quickRangePill} ${
                                        trendView === v
                                            ? styles.quickRangePillActive
                                            : ""
                                    }`}
                                >
                                    {v === "DAILY" ? "Daily" : "Monthly"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            height: "150px",
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            gap: "0.65rem",
                            alignItems: "end",
                            paddingTop: "1rem",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {dynamicTrendBars.map((bar) => {
                            const isSelectedBar = selectedChartBar === bar.id;
                            return (
                                <div
                                    key={bar.id}
                                    onClick={() => {
                                        if (selectedChartBar === bar.id) {
                                            setSelectedChartBar(null);
                                            handleApplyDatePreset("LAST_30_DAYS");
                                        } else {
                                            setSelectedChartBar(bar.id);
                                            setDatePreset("CUSTOM");
                                            setStartDate(bar.startYmd);
                                            setEndDate(bar.endYmd);
                                        }
                                    }}
                                    onMouseEnter={() =>
                                        setHoveredChartBar({
                                            label: bar.label,
                                            created: bar.created,
                                            done: bar.done,
                                            over: bar.over,
                                        })
                                    }
                                    onMouseLeave={() => setHoveredChartBar(null)}
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        opacity:
                                            selectedChartBar && !isSelectedBar
                                                ? 0.45
                                                : 1,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "0.66rem",
                                            color: isSelectedBar
                                                ? "#FFFFFF"
                                                : "#F5E6AD",
                                            fontFamily: "Space Grotesk, monospace",
                                            fontWeight: 700,
                                            marginBottom: "4px",
                                        }}
                                    >
                                        {bar.created}/{bar.done}
                                    </span>
                                    <div
                                        style={{
                                            width: "100%",
                                            height: `${bar.pct}%`,
                                            background: isSelectedBar
                                                ? "linear-gradient(180deg, #F5E6AD 0%, #D4AF37 100%)"
                                                : "linear-gradient(180deg, #34D399 0%, #D4AF37 65%, rgba(248,113,113,0.35) 100%)",
                                            borderRadius: "6px 6px 2px 2px",
                                            border: isSelectedBar
                                                ? "1px solid #FFFFFF"
                                                : "1px solid rgba(212,175,55,0.25)",
                                            boxShadow: isSelectedBar
                                                ? "0 0 16px rgba(212,175,55,0.55)"
                                                : "none",
                                            transition: "all 0.25s ease",
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: "0.66rem",
                                            color: isSelectedBar
                                                ? "#F5E6AD"
                                                : "#94A3B8",
                                            fontWeight: isSelectedBar ? 700 : 500,
                                            fontFamily: "Space Grotesk, monospace",
                                            marginTop: "5px",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {bar.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Tickets by Issue Type */}
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.65rem",
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "1rem",
                                    color: "#FFF",
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                }}
                            >
                                {lang === "en"
                                    ? "Tickets by Issue Category"
                                    : "Phân Loại Theo Nhóm Lỗi"}
                            </h3>
                            <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                                Select a hardware fault category to filter
                            </span>
                        </div>
                        {selectedIssueType !== "ALL" && (
                            <button
                                type="button"
                                onClick={() => setSelectedIssueType("ALL")}
                                className={styles.secondaryGoldBtn}
                                style={{
                                    padding: "0.22rem 0.55rem",
                                    fontSize: "0.68rem",
                                }}
                            >
                                <span>Clear</span>
                            </button>
                        )}
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.45rem",
                        }}
                    >
                        {issueTypeCounts.map((item) => (
                            <div
                                key={item.category}
                                onClick={() =>
                                    setSelectedIssueType(
                                        selectedIssueType === item.category
                                            ? "ALL"
                                            : item.category
                                    )
                                }
                                style={{
                                    padding: "0.52rem 0.7rem",
                                    borderRadius: "10px",
                                    background:
                                        selectedIssueType === item.category
                                            ? "rgba(212,175,55,0.2)"
                                            : "rgba(255,255,255,0.025)",
                                    border:
                                        selectedIssueType === item.category
                                            ? "1px solid #D4AF37"
                                            : "1px solid rgba(255,255,255,0.06)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    transition: "all 0.18s ease",
                                }}
                            >
                                <span
                                    style={{
                                        color: "#E2E8F0",
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {item.category}
                                </span>
                                <strong
                                    style={{
                                        color: "#F5E6AD",
                                        fontFamily: "Space Grotesk, monospace",
                                        marginLeft: "6px",
                                    }}
                                >
                                    {item.count}
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Upcoming Maintenance */}
                <div className={styles.analyticsCard}>
                    <h3
                        style={{
                            margin: "0 0 0.2rem 0",
                            fontSize: "1rem",
                            color: "#FFF",
                            fontFamily: "Bodoni Moda, Georgia, serif",
                        }}
                    >
                        {lang === "en"
                            ? "Upcoming Preventive Schedule"
                            : "Lịch Bảo Trì Định Kỳ Sắp Tới"}
                    </h3>
                    <p
                        style={{
                            margin: "0 0 0.65rem 0",
                            fontSize: "0.72rem",
                            color: "#94A3B8",
                        }}
                    >
                        Select a scheduled Preventive / Calibration window
                    </p>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.48rem",
                        }}
                    >
                        {schedules.map((sch) => (
                            <div
                                key={sch.id}
                                onClick={() => setSelectedScheduleDetail(sch)}
                                style={{
                                    padding: "0.52rem 0.75rem",
                                    borderRadius: "10px",
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "0.76rem",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <strong
                                        style={{
                                            color: "#F5E6AD",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {sch.kioskCode}
                                    </strong>{" "}
                                    <span
                                        style={{
                                            color: "#FFF",
                                            fontWeight: 600,
                                        }}
                                    >
                                        ({sch.maintenanceType})
                                    </span>
                                    <div
                                        style={{
                                            fontSize: "0.7rem",
                                            color: "#94A3B8",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {sch.location}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        color: "#34D399",
                                        fontFamily: "Space Grotesk, monospace",
                                        fontSize: "0.71rem",
                                        whiteSpace: "nowrap",
                                        marginLeft: "8px",
                                    }}
                                >
                                    {sch.scheduledTime}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 6. TICKET TABS BAR (7 Status Tabs) */}
            <div className={styles.tabsBar}>
                {(
                    [
                        {
                            id: "ALL",
                            label: `All Tickets (${summaryMetrics.total})`,
                        },
                        {
                            id: "OPEN",
                            label: `Open (${summaryMetrics.open})`,
                        },
                        {
                            id: "IN_PROGRESS",
                            label: `In Progress (${summaryMetrics.inProgress})`,
                        },
                        {
                            id: "COMPLETED",
                            label: `Completed (${summaryMetrics.completed})`,
                        },
                        {
                            id: "OVERDUE",
                            label: `Overdue (${summaryMetrics.overdue})`,
                        },
                        {
                            id: "ON_HOLD",
                            label: `On Hold (${summaryMetrics.onHold})`,
                        },
                        {
                            id: "CANCELLED",
                            label: `Cancelled (${summaryMetrics.cancelled})`,
                        },
                    ] as const
                ).map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveStatusTab(t.id)}
                        className={`${styles.tabBtn} ${
                            activeStatusTab === t.id ? styles.tabBtnActive : ""
                        }`}
                    >
                        <span>{t.label}</span>
                    </button>
                ))}
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
                                    ? "Search by Ticket ID (e.g. MNT-2026-409), Station Code, Engineer, or diagnostic note..."
                                    : "Tìm theo Mã phiếu, Mã trạm Kiosk, Kỹ thuật viên hoặc mô tả lỗi..."
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

                    {/* 3. Custom Dropdown: Brand */}
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
                                    ? `All Maisons (${uniqueBrands.length})`
                                    : selectedBrand}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "BRAND" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "210px" }}
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
                                    <span>All Maisons ({uniqueBrands.length})</span>
                                    {selectedBrand === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {uniqueBrands.map((b) => (
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

                    {/* 4. Custom Dropdown: Location */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "LOCATION" ? null : "LOCATION"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedLocation !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {selectedLocation === "ALL"
                                    ? "All Venues"
                                    : selectedLocation.split(",")[0]}
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
                                        setSelectedLocation("ALL");
                                        setOpenDropdown(null);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        selectedLocation === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>All Venues ({uniqueLocations.length})</span>
                                    {selectedLocation === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {uniqueLocations.map((loc) => (
                                    <button
                                        key={loc}
                                        type="button"
                                        onClick={() => {
                                            setSelectedLocation(loc);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedLocation === loc
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{loc}</span>
                                        {selectedLocation === loc && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. Custom Dropdown: Priority */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "PRIORITY" ? null : "PRIORITY"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedPriority !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {selectedPriority === "ALL"
                                    ? "All Priorities"
                                    : selectedPriority}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "PRIORITY" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "175px" }}
                            >
                                {(
                                    ["ALL", "URGENT", "HIGH", "NORMAL", "LOW"] as const
                                ).map((pr) => (
                                    <button
                                        key={pr}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPriority(pr);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedPriority === pr
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>
                                            {pr === "ALL" ? "All Priorities" : pr}
                                        </span>
                                        {selectedPriority === pr && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 6. Custom Dropdown: Issue Type */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "ISSUE_TYPE"
                                        ? null
                                        : "ISSUE_TYPE"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedIssueType !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {selectedIssueType === "ALL"
                                    ? "All Issue Types"
                                    : selectedIssueType}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "ISSUE_TYPE" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "225px" }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedIssueType("ALL");
                                        setOpenDropdown(null);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        selectedIssueType === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>All Issue Types (6)</span>
                                    {selectedIssueType === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {ISSUE_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            setSelectedIssueType(cat);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedIssueType === cat
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{cat}</span>
                                        {selectedIssueType === cat && (
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

            {/* 7. MAINTENANCE TICKET TABLE */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>TICKET ID</th>
                            <th>STATION & MAISON</th>
                            <th>DEPLOYMENT VENUE</th>
                            <th>ISSUE CATEGORY</th>
                            <th>PRIORITY</th>
                            <th>STATUS</th>
                            <th>ASSIGNED ENGINEER</th>
                            <th>CREATED TIMESTAMP</th>
                            <th style={{ textAlign: "right" }}>ACTIONS</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTickets.length > 0 ? (
                            filteredTickets.map((tk) => {
                                const isSelected = selectedTicket?.id === tk.id;
                                return (
                                    <tr
                                        key={tk.id}
                                        onClick={() => {
                                            setSelectedTicketId(tk.id);
                                            setDrawerTab("details");
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
                                            {tk.id}
                                        </td>

                                        <td className={styles.tableCell}>
                                            <strong
                                                style={{
                                                    color: "#FFF",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.85rem",
                                                }}
                                            >
                                                {tk.kioskCode}
                                            </strong>
                                            <div
                                                style={{
                                                    fontSize: "0.73rem",
                                                    color: "#D4AF37",
                                                    marginTop: "0.15rem",
                                                }}
                                            >
                                                {tk.brand}
                                            </div>
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{ color: "#CBD5E1" }}
                                        >
                                            {tk.location}
                                        </td>

                                        <td className={styles.tableCell}>
                                            <strong
                                                style={{
                                                    color: "#F5E6AD",
                                                    fontSize: "0.82rem",
                                                }}
                                            >
                                                {tk.issueType}
                                            </strong>
                                        </td>

                                        <td className={styles.tableCell}>
                                                <span
                                                    style={{
                                                        color:
                                                            tk.priority === "URGENT"
                                                                ? "#F87171"
                                                                : tk.priority ===
                                                                "HIGH"
                                                                    ? "#FB923C"
                                                                    : "#60A5FA",
                                                        fontWeight: 700,
                                                        fontSize: "0.74rem",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {tk.priority}
                                                </span>
                                        </td>

                                        <td className={styles.tableCell}>
                                            {renderStatusBadge(tk.status)}
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#E2E8F0",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {tk.assignedTo.split(" (")[0]}
                                        </td>

                                        <td
                                            className={styles.tableCell}
                                            style={{
                                                fontSize: "0.78rem",
                                                color: "#94A3B8",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {tk.createdDate}
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
                                                        openMenuId === tk.id
                                                            ? null
                                                            : tk.id
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

                                            {openMenuId === tk.id && (
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
                                                            setSelectedTicketId(
                                                                tk.id
                                                            );
                                                            setDrawerTab(
                                                                "details"
                                                            );
                                                            setOpenMenuId(null);
                                                        }}
                                                        className={
                                                            styles.customDropdownItem
                                                        }
                                                    >
                                                            <span>
                                                                Inspect Ticket Dossier
                                                            </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTicketId(
                                                                tk.id
                                                            );
                                                            setDrawerTab(
                                                                "checklist"
                                                            );
                                                            setOpenMenuId(null);
                                                        }}
                                                        className={
                                                            styles.customDropdownItem
                                                        }
                                                        style={{ color: "#F5E6AD" }}
                                                    >
                                                            <span>
                                                                Open 5-Point Checklist
                                                            </span>
                                                    </button>

                                                    {!isViewerReadOnly &&
                                                        tk.status !==
                                                        "COMPLETED" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleStartMaintenance(
                                                                        tk
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
                                                                        Start
                                                                        Maintenance
                                                                    </span>
                                                            </button>
                                                        )}
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
                                        No maintenance tickets found.
                                    </strong>
                                    No tickets match your current calendar range, search keyword, or filter criteria.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* =========================================================
               CENTERED LUXURY MODAL: MAINTENANCE TICKET DOSSIER (4 TABS + 4-METRIC FOOTER)
            ========================================================= */}
            {selectedTicket && (
                <div
                    className={styles.drawerOverlay}
                    onClick={() => setSelectedTicketId(null)}
                >
                    <div
                        className={styles.drawerPanel}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                        }}
                    >
                        {/* HEADER 2 CỘT PHẲNG TẮP GIỐNG HỆT MÀN 13, 14, 15 */}
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
                                        <Wrench size={24} color="#D4AF37" />
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
                                                MAINTENANCE DOSSIER •{" "}
                                                {selectedTicket.id}
                                            </span>
                                            {renderStatusBadge(
                                                selectedTicket.status
                                            )}
                                            <span
                                                style={{
                                                    fontSize: "0.65rem",
                                                    color: "#F87171",
                                                    fontWeight: 700,
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    background:
                                                        "rgba(248,113,113,0.12)",
                                                    padding: "0.18rem 0.55rem",
                                                    borderRadius: "6px",
                                                    border: "1px solid rgba(248,113,113,0.35)",
                                                }}
                                            >
                                                {selectedTicket.priority}
                                            </span>
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
                                            {selectedTicket.issueType} —{" "}
                                            {selectedTicket.kioskCode}
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
                                            MAISON:{" "}
                                            <strong style={{ color: "#F5E6AD" }}>
                                                {selectedTicket.brand}
                                            </strong>{" "}
                                            • VENUE:{" "}
                                            <strong style={{ color: "#E2E8F0" }}>
                                                {selectedTicket.location}
                                            </strong>{" "}
                                            • SLA DUE:{" "}
                                            <strong style={{ color: "#34D399" }}>
                                                {selectedTicket.deadline}
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
                                        selectedTicket.status !== "COMPLETED" && (
                                            <>
                                                {selectedTicket.status !==
                                                    "IN_PROGRESS" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleStartMaintenance(
                                                                    selectedTicket
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
                                                            <span>
                                                            Start Maintenance
                                                        </span>
                                                        </button>
                                                    )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleMarkAsCompleted(true)
                                                    }
                                                    className={styles.primaryGoldBtn}
                                                    style={{
                                                        padding: "0.48rem 0.88rem",
                                                        fontSize: "0.73rem",
                                                    }}
                                                >
                                                    <Check size={14} />
                                                    <span>
                                                        Quick Complete & Online
                                                    </span>
                                                </button>
                                            </>
                                        )}

                                    <button
                                        type="button"
                                        onClick={() => setSelectedTicketId(null)}
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
                                    id: "details",
                                    label: "Diagnosis & Repair",
                                    icon: Wrench,
                                },
                                {
                                    id: "checklist",
                                    label: `5-Point Checklist (${
                                        selectedTicket.checklist.filter(
                                            (c) => c.status === "PASSED"
                                        ).length
                                    }/${selectedTicket.checklist.length})`,
                                    icon: ClipboardCheck,
                                },
                                {
                                    id: "timeline",
                                    label: `Audit Timeline (${selectedTicket.timeline.length})`,
                                    icon: History,
                                },
                                {
                                    id: "attachments",
                                    label: `Attachments (${selectedTicket.attachments.length})`,
                                    icon: Paperclip,
                                },
                            ].map((t) => {
                                const IconComp = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() =>
                                            setDrawerTab(t.id as DrawerTab)
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
                            {/* TAB 1: DIAGNOSIS & REPAIR */}
                            {drawerTab === "details" && (
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
                                                Reported Incident Description
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/machines/${encodeURIComponent(
                                                            selectedTicket.kioskCode
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
                                                    Station{" "}
                                                    {selectedTicket.kioskCode}
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
                                            {selectedTicket.description}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "0.85rem",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className={styles.glassCard}>
                                            <label
                                                style={{
                                                    display: "block",
                                                    fontSize: "0.68rem",
                                                    color: "#94A3B8",
                                                    marginBottom: "0.35rem",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                ASSIGNED FIELD ENGINEER
                                            </label>
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
                                                    className={
                                                        styles.customDropdownTrigger
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        padding: "0.58rem 0.85rem",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                        }}
                                                    >
                                                        {selectedTicket.assignedTo}
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
                                                            style={{ width: "100%" }}
                                                        >
                                                            {TECHNICIANS_LIST.map(
                                                                (tech) => (
                                                                    <button
                                                                        key={tech}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated: MaintenanceTicketRecord =
                                                                                {
                                                                                    ...selectedTicket,
                                                                                    assignedTo:
                                                                                    tech,
                                                                                    timeline:
                                                                                        [
                                                                                            {
                                                                                                id: `TL-${Date.now()}`,
                                                                                                timestamp:
                                                                                                    formatNowTimestamp(),
                                                                                                actor: currentActorLabel,
                                                                                                eventType:
                                                                                                    "REASSIGNED",
                                                                                                detail: `Reassigned ticket to ${tech}.`,
                                                                                            },
                                                                                            ...selectedTicket.timeline,
                                                                                        ],
                                                                                };
                                                                            const nextList =
                                                                                tickets.map(
                                                                                    (
                                                                                        t
                                                                                    ) =>
                                                                                        t.id ===
                                                                                        selectedTicket.id
                                                                                            ? updated
                                                                                            : t
                                                                                );
                                                                            persistTicketsAndSyncAllModules(
                                                                                nextList
                                                                            );
                                                                            setOpenDropdown(
                                                                                null
                                                                            );
                                                                            showToast(
                                                                                `Assigned ${selectedTicket.id} to ${tech}!`
                                                                            );
                                                                        }}
                                                                        className={`${
                                                                            styles.customDropdownItem
                                                                        } ${
                                                                            selectedTicket.assignedTo ===
                                                                            tech
                                                                                ? styles.customDropdownItemActive
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                    <span>
                                                                        {tech}
                                                                    </span>
                                                                        {selectedTicket.assignedTo ===
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
                                        </div>

                                        <div className={styles.glassCard}>
                                            <label
                                                style={{
                                                    display: "block",
                                                    fontSize: "0.68rem",
                                                    color: "#94A3B8",
                                                    marginBottom: "0.35rem",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                REPLACED SPARE PARTS
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Viton O-Ring Seal #VR-02"
                                                value={
                                                    selectedTicket.replacedComponents
                                                }
                                                onChange={(e) => {
                                                    const updated = {
                                                        ...selectedTicket,
                                                        replacedComponents:
                                                        e.target.value,
                                                    };
                                                    setTickets((prev) =>
                                                        prev.map((t) =>
                                                            t.id ===
                                                            selectedTicket.id
                                                                ? updated
                                                                : t
                                                        )
                                                    );
                                                }}
                                                className={styles.searchInput}
                                                style={{
                                                    padding: "0.58rem 0.85rem",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.glassCard}>
                                        <label
                                            style={{
                                                display: "block",
                                                fontSize: "0.7rem",
                                                color: "#F5E6AD",
                                                fontWeight: 700,
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                marginBottom: "0.35rem",
                                            }}
                                        >
                                            CORRECTIVE ACTION & REPAIR SUMMARY *
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="Record root-cause diagnosis, corrective actions performed, and verification notes..."
                                            value={selectedTicket.correctiveAction}
                                            onChange={(e) => {
                                                const updated = {
                                                    ...selectedTicket,
                                                    correctiveAction:
                                                    e.target.value,
                                                };
                                                setTickets((prev) =>
                                                    prev.map((t) =>
                                                        t.id === selectedTicket.id
                                                            ? updated
                                                            : t
                                                    )
                                                );
                                            }}
                                            className={styles.searchInput}
                                            style={{
                                                padding: "0.6rem 0.9rem",
                                                resize: "none",
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: 5-POINT HARDWARE CHECKLIST & COMPLETION */}
                            {drawerTab === "checklist" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.7rem",
                                    }}
                                >
                                    {selectedTicket.checklist.map((item) => (
                                        <div
                                            key={item.id}
                                            className={styles.glassCard}
                                            style={{
                                                padding: "0.75rem 1rem",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                borderLeft: `4px solid ${
                                                    item.status === "PASSED"
                                                        ? "#34D399"
                                                        : item.status === "FAILED"
                                                            ? "#F87171"
                                                            : "#D4AF37"
                                                }`,
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#FFF",
                                                        fontSize: "0.86rem",
                                                    }}
                                                >
                                                    {item.label}{" "}
                                                    {item.mandatory && (
                                                        <span
                                                            style={{
                                                                fontSize: "0.66rem",
                                                                color: "#D4AF37",
                                                            }}
                                                        >
                                                            (Mandatory)
                                                        </span>
                                                    )}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.74rem",
                                                        color: "#94A3B8",
                                                        marginTop: "0.15rem",
                                                    }}
                                                >
                                                    Status:{" "}
                                                    <strong>{item.status}</strong>{" "}
                                                    {item.note && `— ${item.note}`}
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.4rem",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleChecklistItem(
                                                            item.id,
                                                            "PASSED"
                                                        )
                                                    }
                                                    className={styles.actionButton}
                                                    style={{
                                                        padding: "0.35rem 0.65rem",
                                                        color:
                                                            item.status === "PASSED"
                                                                ? "#34D399"
                                                                : "#CBD5E1",
                                                        borderColor:
                                                            item.status === "PASSED"
                                                                ? "#34D399"
                                                                : "rgba(255,255,255,0.15)",
                                                    }}
                                                >
                                                    <span>✓ Pass</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleChecklistItem(
                                                            item.id,
                                                            "FAILED"
                                                        )
                                                    }
                                                    className={styles.actionButton}
                                                    style={{
                                                        padding: "0.35rem 0.65rem",
                                                        color:
                                                            item.status === "FAILED"
                                                                ? "#F87171"
                                                                : "#CBD5E1",
                                                        borderColor:
                                                            item.status === "FAILED"
                                                                ? "#F87171"
                                                                : "rgba(255,255,255,0.15)",
                                                    }}
                                                >
                                                    <span>✕ Fail</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className={styles.glassCard}
                                        style={{
                                            border: "1px solid rgba(212,175,55,0.4)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            gap: "0.75rem",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    color: "#F5E6AD",
                                                    fontSize: "0.86rem",
                                                }}
                                            >
                                                Post-Maintenance Test &
                                                Controlled Diagnostic Spray
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#94A3B8",
                                                    marginTop: "0.15rem",
                                                }}
                                            >
                                                Executes 1 calibrated test spray (0.12ml) and verifies MQTT heartbeat before restoring active service.
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={
                                                    handleRunPostMaintenanceTest
                                                }
                                                className={styles.secondaryGoldBtn}
                                                style={{
                                                    borderColor:
                                                        selectedTicket.postMaintenanceTestPassed
                                                            ? "#34D399"
                                                            : "#D4AF37",
                                                    color: selectedTicket.postMaintenanceTestPassed
                                                        ? "#34D399"
                                                        : "#F5E6AD",
                                                }}
                                            >
                                                <span>
                                                    {selectedTicket.postMaintenanceTestPassed
                                                        ? "✓ Diagnostic Test PASSED"
                                                        : "Run Diagnostic Test"}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    selectedTicket.status ===
                                                    "COMPLETED"
                                                }
                                                onClick={() =>
                                                    handleMarkAsCompleted(false)
                                                }
                                                className={styles.primaryGoldBtn}
                                            >
                                                <CheckCircle2 size={14} />
                                                <span>
                                                    {selectedTicket.status ===
                                                    "COMPLETED"
                                                        ? "Ticket Completed"
                                                        : "Complete & Restore Online"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: AUDIT TIMELINE */}
                            {drawerTab === "timeline" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
                                    {!isViewerReadOnly && (
                                        <form
                                            onSubmit={handleAddTimelineComment}
                                            style={{
                                                display: "flex",
                                                gap: "0.6rem",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                placeholder="Add field engineer progress note or spare-part update..."
                                                value={newTimelineComment}
                                                onChange={(e) =>
                                                    setNewTimelineComment(
                                                        e.target.value
                                                    )
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
                                                <span>Add Comment</span>
                                            </button>
                                        </form>
                                    )}

                                    {selectedTicket.timeline.map((ev) => (
                                        <div
                                            key={ev.id}
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
                                                    {ev.actor}
                                                </strong>
                                                <span
                                                    style={{
                                                        color: "#F5E6AD",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        fontSize: "0.73rem",
                                                    }}
                                                >
                                                    {ev.timestamp}
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
                                                {ev.eventType}
                                            </div>
                                            <p
                                                style={{
                                                    margin: "0.3rem 0 0 0",
                                                    fontSize: "0.8rem",
                                                    color: "#CBD5E1",
                                                }}
                                            >
                                                {ev.detail}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TAB 4: ATTACHMENTS */}
                            {drawerTab === "attachments" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.85rem",
                                    }}
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
                                                fontSize: "0.8rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            Attach inspection photos, videos, or diagnostic PDF reports (Max 10MB):
                                        </span>
                                        {!isViewerReadOnly && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    attachmentInputRef.current?.click()
                                                }
                                                className={styles.secondaryGoldBtn}
                                            >
                                                <Upload
                                                    size={13}
                                                    color="#D4AF37"
                                                />
                                                <span>Upload Evidence</span>
                                            </button>
                                        )}
                                    </div>

                                    {selectedTicket.attachments.length > 0 ? (
                                        selectedTicket.attachments.map((att) => (
                                            <div
                                                key={att.id}
                                                className={styles.glassCard}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <div>
                                                    <strong
                                                        style={{
                                                            color: "#FFF",
                                                            fontSize: "0.86rem",
                                                        }}
                                                    >
                                                        {att.fileName}
                                                    </strong>
                                                    <div
                                                        style={{
                                                            fontSize: "0.74rem",
                                                            color: "#94A3B8",
                                                            marginTop: "0.18rem",
                                                        }}
                                                    >
                                                        {att.fileType} •{" "}
                                                        {att.fileSizeKb} KB •
                                                        Uploaded by{" "}
                                                        <strong>
                                                            {att.uploadedBy}
                                                        </strong>{" "}
                                                        at {att.uploadedAt}
                                                    </div>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: "0.7rem",
                                                        color: "#34D399",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    VERIFIED ✓
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            className={styles.glassCard}
                                            style={{
                                                textAlign: "center",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            No diagnostic attachments uploaded for this ticket yet.
                                        </div>
                                    )}
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
                                    Target Station
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#FFF",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTicket.kioskCode}
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
                                    5-Point Checklist
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#34D399",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {
                                        selectedTicket.checklist.filter(
                                            (c) => c.status === "PASSED"
                                        ).length
                                    }{" "}
                                    / {selectedTicket.checklist.length} Passed
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
                                        color: selectedTicket.diagnosticSprayExecuted
                                            ? "#34D399"
                                            : "#FBBF24",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTicket.diagnosticSprayExecuted
                                        ? "EXECUTED (0.12ml)"
                                        : "PENDING"}
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
                                    Post-Repair Sign-Off
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.85rem",
                                        color: selectedTicket.postMaintenanceTestPassed
                                            ? "#34D399"
                                            : "#F87171",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTicket.postMaintenanceTestPassed
                                        ? "VERIFIED OK"
                                        : "AWAITING TEST"}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: UPCOMING SCHEDULE DETAILS */}
            {selectedScheduleDetail && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedScheduleDetail(null)}
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
                                    PREVENTIVE MAINTENANCE WINDOW
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        color: "#FFF",
                                        fontFamily: "Bodoni Moda, Georgia, serif",
                                        fontSize: "1.35rem",
                                    }}
                                >
                                    {selectedScheduleDetail.kioskCode} —{" "}
                                    {selectedScheduleDetail.maintenanceType}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedScheduleDetail(null)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div
                            style={{
                                fontSize: "0.84rem",
                                color: "#CBD5E1",
                                lineHeight: 1.7,
                                marginBottom: "1rem",
                            }}
                        >
                            <div>
                                <strong>Venue & Maison:</strong>{" "}
                                {selectedScheduleDetail.location} (
                                {selectedScheduleDetail.brand})
                            </div>
                            <div>
                                <strong>Scheduled Window:</strong>{" "}
                                <span
                                    style={{
                                        color: "#34D399",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedScheduleDetail.scheduledTime}
                                </span>
                            </div>
                            <div>
                                <strong>Assigned Engineer:</strong>{" "}
                                {selectedScheduleDetail.technician}
                            </div>
                        </div>

                        <div
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: "12px",
                                padding: "1rem",
                                marginBottom: "1.25rem",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <strong
                                style={{
                                    fontSize: "0.74rem",
                                    color: "#F5E6AD",
                                    textTransform: "uppercase",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                Preventive Tasks to Perform:
                            </strong>
                            <ul
                                style={{
                                    margin: "0.5rem 0 0 1.2rem",
                                    padding: 0,
                                    fontSize: "0.82rem",
                                    color: "#E2E8F0",
                                    lineHeight: 1.6,
                                }}
                            >
                                {selectedScheduleDetail.tasksToPerform.map(
                                    (task, idx) => (
                                        <li key={idx}>{task}</li>
                                    )
                                )}
                            </ul>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedScheduleDetail(null)}
                            className={styles.primaryGoldBtn}
                            style={{ width: "100%" }}
                        >
                            <span>Close Schedule Dossier</span>
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 2: CREATE MAINTENANCE TICKET */}
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
                                    TECHNICAL INCIDENT DISPATCH
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        color: "#FFF",
                                        fontSize: "1.35rem",
                                        fontFamily: "Bodoni Moda, Georgia, serif",
                                    }}
                                >
                                    Create Maintenance Ticket
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {createWarning && (
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
                                <span>{createWarning}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateTicketSubmit}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.9rem",
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
                                        Select Kiosk Station *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "CREATE_MACHINE"
                                                    ? null
                                                    : "CREATE_MACHINE"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{
                                            width: "100%",
                                            padding: "0.65rem 0.9rem",
                                        }}
                                    >
                                        <span>{createMachineCode}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "CREATE_MACHINE" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ width: "100%" }}
                                        >
                                            {FLEET_MACHINES_LOOKUP.map((m) => (
                                                <button
                                                    key={m.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setCreateMachineCode(
                                                            m.code
                                                        );
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        createMachineCode ===
                                                        m.code
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>
                                                        {m.code} ({m.brand})
                                                    </span>
                                                    {createMachineCode ===
                                                        m.code && (
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
                                        Issue Category *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "CREATE_ISSUE"
                                                    ? null
                                                    : "CREATE_ISSUE"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{
                                            width: "100%",
                                            padding: "0.65rem 0.9rem",
                                        }}
                                    >
                                        <span>{createIssueType}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "CREATE_ISSUE" && (
                                        <div
                                            className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                            style={{ width: "100%" }}
                                        >
                                            {ISSUE_CATEGORIES.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => {
                                                        setCreateIssueType(cat);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        createIssueType === cat
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{cat}</span>
                                                    {createIssueType === cat && (
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

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.9rem",
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
                                                [
                                                    "URGENT",
                                                    "HIGH",
                                                    "NORMAL",
                                                    "LOW",
                                                ] as const
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
                                        Resolution Deadline *
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
                                        className={styles.customDropdownTrigger}
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
                                        <span>{createAssignee}</span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "CREATE_TECH" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ width: "100%" }}
                                        >
                                            {TECHNICIANS_LIST.map((tech) => (
                                                <button
                                                    key={tech}
                                                    type="button"
                                                    onClick={() => {
                                                        setCreateAssignee(tech);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        createAssignee === tech
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{tech}</span>
                                                    {createAssignee ===
                                                        tech && (
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
                                    Issue Description & Dispatch Instructions *
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    value={createDesc}
                                    onChange={(e) =>
                                        setCreateDesc(e.target.value)
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