// noinspection SpellCheckingInspection
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    ArrowLeft,
    MapPin,
    Cpu,
    Activity,
    Thermometer,
    Zap,
    RotateCcw,
    Wrench,
    Power,
    Edit3,
    Terminal,
    FileText,
    CheckCircle2,
    X,
    Droplets,
    AlertOctagon,
    Smartphone,
    WifiOff,
    Globe,
    ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "./machine-detail.module.css";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

interface MachineSlotConfig {
    slotNumber: number;
    productName: string;
    brand: string;
    bottleCode: string;
    pricePerSpray: number;
    sprayDurationMs: number;
    remainingVolumeMl: number;
    capacityMl: number;
    thresholdMl: number;
    enabled: boolean;
}

interface DeviceLogEntry {
    id: string;
    timestamp: string;
    type: "HEARTBEAT" | "COMMAND" | "ERROR" | "EVENT";
    severity: "INFO" | "WARNING" | "CRITICAL";
    message: string;
}

interface CatalogPerfumeOption {
    slot: number;
    name: string;
    brand: string;
    price: number;
    cap: number;
}

const DEFAULT_CATALOG_OPTIONS: CatalogPerfumeOption[] = [
    { slot: 1, name: "Acqua Di Gio", brand: "Giorgio Armani", price: 12000, cap: 100 },
    { slot: 2, name: "Acqua Di Gio Profondo", brand: "Giorgio Armani", price: 14000, cap: 100 },
    { slot: 3, name: "Bleu de Chanel", brand: "Chanel", price: 15000, cap: 100 },
    { slot: 4, name: "Coco Mademoiselle", brand: "Chanel", price: 15500, cap: 100 },
    { slot: 5, name: "Burberry Goddess", brand: "Burberry", price: 13000, cap: 100 },
    { slot: 9, name: "Creed Aventus", brand: "Creed", price: 20000, cap: 100 },
    { slot: 10, name: "Dior Sauvage", brand: "Dior", price: 14500, cap: 100 },
    { slot: 14, name: "Le Labo Another 13", brand: "Le Labo", price: 18000, cap: 100 },
    { slot: 19, name: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", price: 21000, cap: 70 },
    { slot: 28, name: "Tom Ford Black Orchid", brand: "Tom Ford", price: 16000, cap: 100 },
    { slot: 33, name: "YSL Libre Eau de Parfum", brand: "Yves Saint Laurent", price: 14000, cap: 90 },
];

const DEFAULT_SLOTS: MachineSlotConfig[] = [
    { slotNumber: 1, productName: "Creed Aventus", brand: "Creed", bottleCode: "BTL-2026-0109", pricePerSpray: 20000, sprayDurationMs: 1200, remainingVolumeMl: 11.5, capacityMl: 100, thresholdMl: 15, enabled: true },
    { slotNumber: 2, productName: "Le Labo Another 13", brand: "Le Labo", bottleCode: "BTL-2026-0114", pricePerSpray: 18000, sprayDurationMs: 1200, remainingVolumeMl: 13.5, capacityMl: 100, thresholdMl: 15, enabled: true },
    { slotNumber: 3, productName: "Parfums de Marly Sedley", brand: "Parfums de Marly", bottleCode: "BTL-2026-0126", pricePerSpray: 18500, sprayDurationMs: 1200, remainingVolumeMl: 68.0, capacityMl: 125, thresholdMl: 15, enabled: true },
    { slotNumber: 4, productName: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", bottleCode: "BTL-2026-0119", pricePerSpray: 21000, sprayDurationMs: 1200, remainingVolumeMl: 9.0, capacityMl: 70, thresholdMl: 15, enabled: true },
];

const INITIAL_DEVICE_LOGS: DeviceLogEntry[] = [
    { id: "LOG-901", timestamp: "2026-11-15 09:42:10", type: "HEARTBEAT", severity: "INFO", message: "MQTT heartbeat received (QoS 1). Door: CLOSED." },
    { id: "LOG-902", timestamp: "2026-11-15 09:38:52", type: "COMMAND", severity: "INFO", message: "CMD-8821A on Slot 01 (1,200ms = 0.12ml) → DISPENSED." },
    { id: "LOG-903", timestamp: "2026-11-15 08:45:00", type: "EVENT", severity: "WARNING", message: "Low-stock warning triggered (< 15ml)." },
];

const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

function formatNowStr(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

const isExactMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function MachineDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const rawId = decodeURIComponent(params?.id || "demo-device");

    const assignMenuRef = useRef<HTMLDivElement | null>(null);
    const cmdMenuRef = useRef<HTMLDivElement | null>(null);
    const priorityMenuRef = useRef<HTMLDivElement | null>(null);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");

    const [canonicalCode, setCanonicalCode] = useState<string>(rawId);
    const [serialNumber, setSerialNumber] = useState<string>("SN-2026-8801");
    const [connectionStatus, setConnectionStatus] = useState<"ONLINE" | "OFFLINE">("ONLINE");
    const [operatingMode, setOperatingMode] = useState<"ACTIVE" | "MAINTENANCE" | "DISABLED">("ACTIVE");
    const [locationName, setLocationName] = useState<string>("Diamond Plaza Atrium");
    const [streetAddress, setStreetAddress] = useState<string>("34 Lê Duẩn, Q.1, TP.HCM");
    const [brandTenant, setBrandTenant] = useState<string>("Creed");
    const [firmwareVersion, setFirmwareVersion] = useState<string>("v2.4.8-LTS");
    const [configVersion, setConfigVersion] = useState<string>("cfg-2026.11");
    const [chamberTemp, setChamberTemp] = useState<string>("21.2°C");
    const [syncState, setSyncState] = useState<"SYNCED" | "PENDING_ACK">("SYNCED");

    const [slots, setSlots] = useState<MachineSlotConfig[]>(DEFAULT_SLOTS);
    const [logs, setLogs] = useState<DeviceLogEntry[]>(INITIAL_DEVICE_LOGS);

    const [activeModal, setActiveModal] = useState<"RESTART" | "EDIT_INFO" | "REMOTE_CONTROL" | "LOGS" | "TICKET" | "ASSIGN_SLOT" | null>(null);
    const [selectedSlotForAssign, setSelectedSlotForAssign] = useState<MachineSlotConfig | null>(null);
    const [assignPerfumeName, setAssignPerfumeName] = useState<string>("Bleu de Chanel");
    const [isAssignMenuOpen, setIsAssignMenuOpen] = useState<boolean>(false);
    const [assignPrice, setAssignPrice] = useState<number>(15000);
    const [assignDurationMs, setAssignDurationMs] = useState<number>(1200);
    const [assignThresholdMl, setAssignThresholdMl] = useState<number>(15);

    const [selectedCommand, setSelectedCommand] = useState<string>("STATUS_PING");
    const [isCmdMenuOpen, setIsCmdMenuOpen] = useState<boolean>(false);
    const [commandFeedback, setCommandFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [hasOpenTicket, setHasOpenTicket] = useState<boolean>(false);
    const [activeTicketCode, setActiveTicketCode] = useState<string | null>(null);
    const [ticketPriority, setTicketPriority] = useState<"URGENT" | "HIGH" | "NORMAL">("HIGH");
    const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState<boolean>(false);
    const [ticketDesc, setTicketDesc] = useState<string>("");
    const [logFilterType, setLogFilterType] = useState<string>("ALL");

    // Phân quyền chuẩn 6 vai trò nội bộ
    const canOperateMachine = currentRole === "OM";
    const canToggleMaintenance = currentRole === "OM" || currentRole === "TE";
    const canDiagnosticSpray = currentRole === "TE";
    const canRefillSlot = currentRole === "IS";
    const canAssignSlot = currentRole === "BA" || currentRole === "OM";
    const canCreateTicket = currentRole === "OM";

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (assignMenuRef.current && !assignMenuRef.current.contains(e.target as Node)) setIsAssignMenuOpen(false);
            if (cmdMenuRef.current && !cmdMenuRef.current.contains(e.target as Node)) setIsCmdMenuOpen(false);
            if (priorityMenuRef.current && !priorityMenuRef.current.contains(e.target as Node)) setIsPriorityMenuOpen(false);
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const showBanner = useCallback((text: string, type: "success" | "error" = "success") => {
        setCommandFeedback({ type, text });
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

    const formatModeLabel = (mode: "ACTIVE" | "MAINTENANCE" | "DISABLED") => {
        if (lang === "en") return mode === "ACTIVE" ? "Active" : mode === "MAINTENANCE" ? "Maintenance" : "Disabled";
        return mode === "ACTIVE" ? "Hoạt động" : mode === "MAINTENANCE" ? "Bảo trì" : "Tạm ngưng";
    };

    const loadMachineData = useCallback(() => {
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
            }

            const kioskLower = rawId.toLowerCase();
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
            const thisKioskMatrix = perKioskMatrix[kioskLower] || {};

            const rawFleet = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawFleet) {
                const parsedFleet = JSON.parse(rawFleet);
                if (Array.isArray(parsedFleet)) {
                    const found = parsedFleet.find(
                        (m: any) => String(m.id || "").toLowerCase() === kioskLower || String(m.code || "").toLowerCase() === kioskLower
                    );
                    if (found) {
                        setCanonicalCode(found.code || rawId);
                        setSerialNumber(found.serialNumber || "SN-2026-8801");
                        setBrandTenant(found.brand || "Creed");
                        setLocationName(found.locationName || rawId);
                        setStreetAddress(found.address || "TP.HCM");
                        setFirmwareVersion(found.firmwareVersion || "v2.4.8-LTS");
                        setConfigVersion(found.configVersion || "cfg-2026.11");
                        setChamberTemp(found.chamberTemp || "21.4°C");

                        const nextConn: "ONLINE" | "OFFLINE" = found.status === "OFFLINE" || found.connectionStatus === "OFFLINE" ? "OFFLINE" : "ONLINE";
                        const nextMode: "ACTIVE" | "MAINTENANCE" | "DISABLED" =
                            found.status === "MAINTENANCE" || found.operatingStatus === "MAINTENANCE"
                                ? "MAINTENANCE"
                                : nextConn === "OFFLINE"
                                    ? "DISABLED"
                                    : "ACTIVE";
                        setConnectionStatus(nextConn);
                        setOperatingMode(nextMode);

                        if (Array.isArray(found.slots) && found.slots.length === 4) {
                            setSlots(
                                found.slots.map((s: any, idx: number) => {
                                    const nameStr = String(s.fragranceName || `Slot 0${idx + 1}`);
                                    const matrixMl = thisKioskMatrix[nameStr.trim().toLowerCase()];
                                    const remMl = typeof matrixMl === "number" ? matrixMl : Number(s.remainingMl ?? 70);
                                    return {
                                        slotNumber: idx + 1,
                                        productName: nameStr,
                                        brand: s.brand || found.brand || "Brand",
                                        bottleCode: s.bottleCode || `BTL-2026-0${idx + 1}`,
                                        pricePerSpray: Number(s.pricePerSpray || 15000),
                                        sprayDurationMs: Number(s.sprayDurationMs || 1200),
                                        remainingVolumeMl: Number(Math.max(0, remMl).toFixed(2)),
                                        capacityMl: Number(s.capacityMl || 100),
                                        thresholdMl: Number(s.lowStockThresholdMl || 15),
                                        enabled: s.slotEnabled !== false && remMl >= 0.12 && nextConn === "ONLINE" && nextMode === "ACTIVE",
                                    };
                                })
                            );
                        }
                    }
                }
            }
        } catch {
            // Safe fallback
        }
    }, [rawId]);

    useEffect(() => {
        loadMachineData();
        const handleSync = () => loadMachineData();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadMachineData]);

    const persistMachineState = useCallback(
        (nextSlots: MachineSlotConfig[], nextConn: "ONLINE" | "OFFLINE", nextMode: "ACTIVE" | "MAINTENANCE" | "DISABLED", actionName: string) => {
            try {
                const kKey = canonicalCode.toLowerCase();
                const fleetStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" =
                    nextConn === "OFFLINE" ? "OFFLINE" : nextMode === "MAINTENANCE" ? "MAINTENANCE" : "ONLINE";

                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
                if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                nextSlots.forEach((sl) => {
                    perKioskMatrix[kKey][sl.productName.trim().toLowerCase()] = Number(sl.remainingVolumeMl);
                });
                localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                const rawFleet = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawFleet) {
                    const parsedFleet = JSON.parse(rawFleet);
                    if (Array.isArray(parsedFleet)) {
                        const updatedFleet = parsedFleet.map((m: any) =>
                            String(m.code || m.id || "").toLowerCase() === kKey
                                ? {
                                    ...m,
                                    locationName,
                                    address: streetAddress,
                                    status: fleetStatus,
                                    connectionStatus: nextConn,
                                    operatingStatus: nextMode,
                                    slots: nextSlots.map((sl) => ({
                                        slotLabel: `Slot 0${sl.slotNumber}`,
                                        fragranceName: sl.productName,
                                        brand: sl.brand,
                                        bottleCode: sl.bottleCode,
                                        sprayDurationMs: sl.sprayDurationMs,
                                        remainingMl: sl.remainingVolumeMl,
                                        capacityMl: sl.capacityMl,
                                        lowStockThresholdMl: sl.thresholdMl,
                                        slotEnabled: sl.enabled,
                                        pricePerSpray: sl.pricePerSpray,
                                    })),
                                }
                                : m
                        );
                        localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
                    }
                }

                const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                auditList.unshift({
                    id: `AUD-${Date.now().toString().slice(-4)}`,
                    timestamp: new Date().toISOString(),
                    actor: currentActorLabel,
                    role: currentRole,
                    action: actionName,
                    entityType: "MACHINES",
                    entityId: canonicalCode,
                    severity: "INFO",
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditList.slice(0, 250)));

                window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        [canonicalCode, currentActorLabel, currentRole, locationName, streetAddress]
    );

    const handleToggleMaintenance = () => {
        if (!canToggleMaintenance) return;
        const nextMode: "ACTIVE" | "MAINTENANCE" = operatingMode === "ACTIVE" ? "MAINTENANCE" : "ACTIVE";
        const nextConn: "ONLINE" | "OFFLINE" = nextMode === "ACTIVE" ? "ONLINE" : connectionStatus;
        const nextSlots = slots.map((s) => ({ ...s, enabled: nextMode === "ACTIVE" && s.remainingVolumeMl >= 0.12 }));
        setOperatingMode(nextMode);
        setConnectionStatus(nextConn);
        setSlots(nextSlots);
        persistMachineState(nextSlots, nextConn, nextMode, `MACHINE_MODE_${nextMode}`);
        showBanner(
            lang === "en"
                ? `Station switched to ${nextMode}.`
                : `Đã chuyển trạm sang chế độ ${formatModeLabel(nextMode)}.`
        );
    };

    const handleToggleConnection = () => {
        if (!canOperateMachine) return;
        const nextConn: "ONLINE" | "OFFLINE" = connectionStatus === "ONLINE" ? "OFFLINE" : "ONLINE";
        const nextMode: "ACTIVE" | "DISABLED" = nextConn === "ONLINE" ? "ACTIVE" : "DISABLED";
        const nextSlots = slots.map((s) => ({ ...s, enabled: nextConn === "ONLINE" && s.remainingVolumeMl >= 0.12 }));
        setConnectionStatus(nextConn);
        setOperatingMode(nextMode);
        setSlots(nextSlots);
        persistMachineState(nextSlots, nextConn, nextMode, `MACHINE_CONN_${nextConn}`);
        showBanner(
            lang === "en" ? `Station is now ${nextConn}.` : `Trạm đã chuyển sang ${nextConn === "ONLINE" ? "Trực tuyến" : "Ngoại tuyến"}.`,
            nextConn === "OFFLINE" ? "error" : "success"
        );
    };

    const handleDiagnosticSpray = (slotNum: number) => {
        if (!canDiagnosticSpray) return;
        if (operatingMode !== "MAINTENANCE") {
            showBanner(
                lang === "en"
                    ? "Diagnostic spray is only allowed in Maintenance Mode."
                    : "Chỉ được thực hiện xịt chẩn đoán khi máy đang ở chế độ Bảo trì.",
                "error"
            );
            return;
        }
        const target = slots.find((s) => s.slotNumber === slotNum);
        if (!target || target.remainingVolumeMl < 0.12) return;
        const nextMl = Number(Math.max(0, target.remainingVolumeMl - 0.12).toFixed(2));
        const nextSlots = slots.map((s) => (s.slotNumber === slotNum ? { ...s, remainingVolumeMl: nextMl } : s));
        setSlots(nextSlots);
        persistMachineState(nextSlots, connectionStatus, operatingMode, "DIAGNOSTIC_SPRAY");

        try {
            const rawMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
            const movs = rawMov ? JSON.parse(rawMov) : [];
            movs.unshift({
                movementId: `DIAG-${Date.now()}`,
                kioskCode: canonicalCode,
                slotNumber: slotNum,
                productName: target.productName,
                movementType: "DIAGNOSTIC",
                deltaMl: -0.12,
                timestamp: new Date().toISOString(),
            });
            localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(movs.slice(0, 300)));
        } catch {
            // Safe fallback
        }

        setLogs((prev) => [
            { id: `LOG-${Date.now().toString().slice(-3)}`, timestamp: formatNowStr(), type: "COMMAND", severity: "INFO", message: `Diagnostic spray Slot 0${slotNum} (-0.12ml, non-revenue).` },
            ...prev,
        ]);
        showBanner(
            lang === "en"
                ? `Diagnostic spray logged on Slot 0${slotNum} (-0.12ml, separate from sales).`
                : `Đã xịt chẩn đoán Khoang 0${slotNum} (-0.12ml, ghi nhận riêng khỏi doanh thu).`
        );
    };

    const handleQuickRefillSlot = (slotNum: number) => {
        if (!canRefillSlot) return;
        const nextSlots = slots.map((s) => (s.slotNumber === slotNum ? { ...s, remainingVolumeMl: s.capacityMl } : s));
        setSlots(nextSlots);
        persistMachineState(nextSlots, connectionStatus, operatingMode, "SLOT_REFILL");
        showBanner(lang === "en" ? `Slot 0${slotNum} refilled to 100%.` : `Đã nạp đầy 100% cho Khoang 0${slotNum}.`);
    };

    const handleToggleSlotLock = (slotNum: number) => {
        if (!canOperateMachine) return;
        const nextSlots = slots.map((s) => (s.slotNumber === slotNum ? { ...s, enabled: !s.enabled } : s));
        setSlots(nextSlots);
        persistMachineState(nextSlots, connectionStatus, operatingMode, "SLOT_LOCK_TOGGLED");
        showBanner(lang === "en" ? `Updated Slot 0${slotNum} lock state.` : `Đã cập nhật trạng thái khóa Khoang 0${slotNum}.`);
    };

    const handleSaveSlotAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlotForAssign || !canAssignSlot) return;
        const found = DEFAULT_CATALOG_OPTIONS.find((c) => isExactMatch(c.name, assignPerfumeName)) || DEFAULT_CATALOG_OPTIONS[0];
        const nextSlots = slots.map((s) =>
            s.slotNumber === selectedSlotForAssign.slotNumber
                ? { ...s, productName: found.name, brand: found.brand, capacityMl: found.cap, pricePerSpray: assignPrice, sprayDurationMs: assignDurationMs, thresholdMl: assignThresholdMl }
                : s
        );
        setSlots(nextSlots);
        setSyncState("PENDING_ACK");
        persistMachineState(nextSlots, connectionStatus, operatingMode, "SLOT_CONFIG_SAVED");
        setActiveModal(null);
        showBanner(
            lang === "en"
                ? `Saved Slot 0${selectedSlotForAssign.slotNumber} config. Status: Pending device confirmation.`
                : `Đã lưu cấu hình Khoang 0${selectedSlotForAssign.slotNumber}. Trạng thái: Đang chờ máy xác nhận.`
        );
    };

    const handleExecuteRemoteCommand = () => {
        if (!canOperateMachine) return;
        if (connectionStatus === "OFFLINE") {
            showBanner(lang === "en" ? "Station is offline. Command rejected." : "Trạm đang ngoại tuyến. Không thể gửi lệnh.", "error");
            setActiveModal(null);
            return;
        }
        setSyncState("PENDING_ACK");
        setLogs((prev) => [
            { id: `LOG-${Date.now().toString().slice(-3)}`, timestamp: formatNowStr(), type: "COMMAND", severity: "INFO", message: `Dispatched [${selectedCommand}] — Waiting device ACK.` },
            ...prev,
        ]);
        showBanner(
            lang === "en"
                ? `Command [${selectedCommand}] sent. Waiting for device ACK.`
                : `Đã gửi lệnh [${selectedCommand}]. Đang chờ máy xác nhận.`
        );
        setActiveModal(null);
    };

    const handleCreateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCreateTicket || hasOpenTicket) return;
        const code = `MNT-2026-${Math.floor(810 + Math.random() * 180)}`;
        setHasOpenTicket(true);
        setActiveTicketCode(code);
        setOperatingMode("MAINTENANCE");
        persistMachineState(slots, connectionStatus, "MAINTENANCE", "TICKET_CREATED");
        setActiveModal(null);
        showBanner(lang === "en" ? `Created ticket #${code}.` : `Đã tạo phiếu bảo trì #${code}.`);
    };

    const filteredLogs = useMemo(() => logs.filter((l) => logFilterType === "ALL" || l.type === logFilterType), [logs, logFilterType]);
    const selectedAssignMeta = DEFAULT_CATALOG_OPTIONS.find((c) => isExactMatch(c.name, assignPerfumeName)) || DEFAULT_CATALOG_OPTIONS[0];

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <div className={styles.topBarRow}>
                <Link href="/machines" className={styles.backLink}>
                    <ArrowLeft size={15} />
                    <span>{lang === "en" ? "Back to Machines" : "Quay lại đội máy"}</span>
                </Link>

                <div style={{ display: "flex", gap: "0.55rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span className={styles.syncBadge}>
                        {syncState === "SYNCED"
                            ? lang === "en" ? "Config: Synced" : "Cấu hình: Đã đồng bộ"
                            : lang === "en" ? "Config: Pending ACK" : "Cấu hình: Chờ máy xác nhận"}
                    </span>

                    <button type="button" onClick={handleToggleLanguage} className={styles.restartBtn}>
                        <Globe size={14} color="#D4AF37" />
                        <span>{lang === "en" ? "EN" : "VI"}</span>
                    </button>

                    <button type="button" onClick={() => router.push(`/kiosk/${encodeURIComponent(canonicalCode)}`)} className={styles.restartBtn}>
                        <Smartphone size={14} color="#34D399" />
                        <span>{lang === "en" ? "Kiosk Screen" : "Màn hình Kiosk"}</span>
                    </button>
                </div>
            </div>

            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <div className={styles.titleGroup}>
                            <h1 className={styles.machineTitle}>{locationName} ({canonicalCode})</h1>
                            <span className={connectionStatus === "OFFLINE" ? styles.offlineBadge : operatingMode === "MAINTENANCE" ? styles.maintenanceBadge : styles.onlineBadge}>
                                <span className={styles.dotOnline} />
                                {connectionStatus === "OFFLINE" ? (lang === "en" ? "Offline" : "Mất kết nối") : formatModeLabel(operatingMode)}
                            </span>
                        </div>
                        <p className={styles.addressText}>
                            <MapPin size={14} color="#D4AF37" />
                            <span>{streetAddress} • {brandTenant} • {serialNumber}</span>
                        </p>
                    </div>

                    <div className={styles.actionsGroup}>
                        {canToggleMaintenance && (
                            <button type="button" onClick={handleToggleMaintenance} className={styles.restartBtn}>
                                <Power size={14} color="#34D399" />
                                <span>{operatingMode === "ACTIVE" ? (lang === "en" ? "Maintenance Mode" : "Bật bảo trì") : (lang === "en" ? "Exit Maintenance" : "Thoát bảo trì")}</span>
                            </button>
                        )}
                        {canOperateMachine && (
                            <>
                                <button type="button" onClick={handleToggleConnection} className={styles.restartBtn} style={{ color: connectionStatus === "ONLINE" ? "#F87171" : "#34D399" }}>
                                    <WifiOff size={14} />
                                    <span>{connectionStatus === "ONLINE" ? (lang === "en" ? "Disconnect" : "Ngắt kết nối") : (lang === "en" ? "Reconnect" : "Kết nối lại")}</span>
                                </button>
                                <button type="button" onClick={() => setActiveModal("REMOTE_CONTROL")} className={styles.restartBtn}>
                                    <Terminal size={14} color="#D4AF37" />
                                    <span>{lang === "en" ? "Command" : "Lệnh từ xa"}</span>
                                </button>
                                <button type="button" onClick={() => setActiveModal("RESTART")} className={styles.restartBtn}>
                                    <RotateCcw size={14} color="#D4AF37" />
                                    <span>{lang === "en" ? "Restart" : "Khởi động lại"}</span>
                                </button>
                            </>
                        )}
                        <button type="button" onClick={() => setActiveModal("LOGS")} className={styles.restartBtn}>
                            <FileText size={14} color="#38BDF8" />
                            <span>{lang === "en" ? `Logs (${logs.length})` : `Nhật ký (${logs.length})`}</span>
                        </button>
                        {canCreateTicket && (
                            <button type="button" onClick={() => setActiveModal("TICKET")} className={styles.maintenanceBtn}>
                                <Wrench size={14} />
                                <span>{hasOpenTicket ? `#${activeTicketCode}` : lang === "en" ? "Create Ticket" : "Tạo phiếu bảo trì"}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {commandFeedback && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "10px", background: commandFeedback.type === "error" ? "rgba(248,113,113,0.14)" : "rgba(52,211,153,0.12)", border: `1px solid ${commandFeedback.type === "error" ? "rgba(248,113,113,0.4)" : "rgba(52,211,153,0.4)"}`, color: commandFeedback.type === "error" ? "#FCA5A5" : "#34D399", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.84rem", fontWeight: 600 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {commandFeedback.type === "error" ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
                        {commandFeedback.text}
                    </span>
                    <button type="button" onClick={() => setCommandFeedback(null)} style={{ background: "none", border: "none", color: "#FFF", cursor: "pointer" }}><X size={15} /></button>
                </div>
            )}

            {/* THÔNG SỐ & CẢM BIẾN */}
            <div className={styles.gridSection}>
                <div className={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                        <h2 className={styles.cardTitle} style={{ margin: 0 }}><Cpu size={16} color="#D4AF37" />{lang === "en" ? "Hardware Info" : "Thông tin thiết bị"}</h2>
                        {canOperateMachine && (
                            <button type="button" onClick={() => setActiveModal("EDIT_INFO")} className={styles.toggleSlotBtn} style={{ background: "#0B0D14", color: "#F5E6AD" }}>
                                <Edit3 size={13} />
                                <span>{lang === "en" ? "Edit Venue" : "Sửa địa điểm"}</span>
                            </button>
                        )}
                    </div>
                    <div className={styles.infoCardGrid}>
                        <div className={styles.infoBoxItem}><span className={styles.infoBoxLabel}>Serial</span><span className={styles.infoBoxValue}>{serialNumber}</span></div>
                        <div className={styles.infoBoxItem}><span className={styles.infoBoxLabel}>{lang === "en" ? "Brand" : "Thương hiệu"}</span><span className={styles.infoBoxValue}>{brandTenant}</span></div>
                        <div className={styles.infoBoxItem}><span className={styles.infoBoxLabel}>Firmware / Config</span><span className={styles.infoBoxValue} style={{ color: "#F5E6AD" }}>{firmwareVersion} • {configVersion}</span></div>
                        <div className={styles.infoBoxItem}><span className={styles.infoBoxLabel}>MQTT</span><span className={styles.infoBoxValue} style={{ color: connectionStatus === "ONLINE" ? "#34D399" : "#F87171" }}>{connectionStatus}</span></div>
                    </div>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}><Activity size={16} color="#34D399" />{lang === "en" ? "Sensors" : "Cảm biến"}</h2>
                    {connectionStatus === "OFFLINE" && (
                        <div style={{ padding: "0.55rem 0.75rem", borderRadius: "8px", background: "rgba(251,191,36,0.14)", color: "#FBBF24", fontSize: "0.76rem", marginBottom: "0.75rem" }}>
                            {lang === "en" ? "Offline: showing last recorded readings." : "Ngoại tuyến: đang hiển thị số đo ghi nhận lần cuối."}
                        </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                        <div className={styles.infoBoxItem}><span className={styles.infoBoxLabel}><Thermometer size={12} style={{ display: "inline", marginRight: "4px" }} />{lang === "en" ? "Temperature" : "Nhiệt độ"}</span><span className={styles.infoBoxValue} style={{ color: "#34D399" }}>{chamberTemp}</span></div>
                        <div className={styles.infoBoxItem}><span className={styles.infoBoxLabel}><Zap size={12} style={{ display: "inline", marginRight: "4px" }} />{lang === "en" ? "Power & Door" : "Nguồn & Cửa"}</span><span className={styles.infoBoxValue}>{connectionStatus === "ONLINE" ? "24.0V" : "0.0V"} • {lang === "en" ? "Closed" : "Đóng"}</span></div>
                    </div>
                </div>
            </div>

            {/* 4 KHOANG CHỨA */}
            <div className={styles.card}>
                <h2 className={styles.cardTitle}><Droplets size={16} color="#D4AF37" />{lang === "en" ? "4 Fragrance Slots" : "4 Khoang nước hoa"}</h2>
                <div className={styles.slotsGrid}>
                    {slots.map((slot) => {
                        const pct = Math.round((slot.remainingVolumeMl / slot.capacityMl) * 100);
                        const isLow = slot.remainingVolumeMl <= slot.thresholdMl;
                        return (
                            <div key={slot.slotNumber} className={styles.slotCard}>
                                <div>
                                    <div className={styles.slotHeader}>
                                        <span className={styles.slotNumberTag}>{lang === "en" ? `Slot 0${slot.slotNumber}` : `Khoang 0${slot.slotNumber}`}</span>
                                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: slot.enabled ? "#34D399" : "#F87171" }}>
                                            {slot.enabled ? (lang === "en" ? "Active" : "Mở") : (lang === "en" ? "Locked" : "Khóa")}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "#D4AF37", fontWeight: 700 }}>{slot.brand}</div>
                                    <h3 style={{ margin: "0.15rem 0", fontSize: "0.98rem", color: "#FFF" }}>{slot.productName}</h3>
                                    <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                                        {slot.pricePerSpray.toLocaleString("vi-VN")} VND • {slot.sprayDurationMs}ms
                                    </div>
                                    <div className={styles.progressBarContainer}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: "0.3rem" }}>
                                            <span style={{ color: "#94A3B8" }}>{lang === "en" ? "Remaining" : "Còn lại"}</span>
                                            <strong style={{ color: isLow ? "#F87171" : "#34D399" }}>{slot.remainingVolumeMl}ml / {slot.capacityMl}ml ({pct}%)</strong>
                                        </div>
                                        <div className={styles.progressBarTrack}>
                                            <div style={{ width: `${pct}%`, height: "100%", background: isLow ? "#F87171" : "#34D399" }} />
                                        </div>
                                    </div>
                                </div>

                                {(canAssignSlot || canDiagnosticSpray || canRefillSlot || canOperateMachine) && (
                                    <div className={styles.slotActionGrid}>
                                        {canAssignSlot && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedSlotForAssign(slot);
                                                    setAssignPerfumeName(slot.productName);
                                                    setAssignPrice(slot.pricePerSpray);
                                                    setAssignDurationMs(slot.sprayDurationMs);
                                                    setAssignThresholdMl(slot.thresholdMl);
                                                    setActiveModal("ASSIGN_SLOT");
                                                }}
                                                className={styles.toggleSlotBtn}
                                                style={{ background: "rgba(212,175,55,0.14)", color: "#F5E6AD" }}
                                            >
                                                {lang === "en" ? "Assign" : "Đổi mùi"}
                                            </button>
                                        )}
                                        {canDiagnosticSpray && (
                                            <button type="button" onClick={() => handleDiagnosticSpray(slot.slotNumber)} className={styles.toggleSlotBtn} style={{ background: "#181D2C", color: "#FFF" }}>
                                                <Zap size={12} color="#D4AF37" />
                                                <span>{lang === "en" ? "Diag Spray" : "Xịt thử"}</span>
                                            </button>
                                        )}
                                        {canRefillSlot && (
                                            <button type="button" onClick={() => handleQuickRefillSlot(slot.slotNumber)} className={styles.toggleSlotBtn} style={{ background: "rgba(52,211,153,0.14)", color: "#34D399" }}>
                                                <Droplets size={12} />
                                                <span>{lang === "en" ? "Refill" : "Nạp 100%"}</span>
                                            </button>
                                        )}
                                        {canOperateMachine && (
                                            <button type="button" onClick={() => handleToggleSlotLock(slot.slotNumber)} className={styles.toggleSlotBtn} style={{ background: "#181D2C", color: slot.enabled ? "#F87171" : "#34D399" }}>
                                                {slot.enabled ? (lang === "en" ? "Lock" : "Khóa") : (lang === "en" ? "Unlock" : "Mở")}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL KHỞI ĐỘNG LẠI */}
            {activeModal === "RESTART" && canOperateMachine && (
                <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? `Restart ${canonicalCode}?` : `Khởi động lại ${canonicalCode}?`}</h3>
                        <p style={{ color: "#CBD5E1", fontSize: "0.86rem" }}>
                            {lang === "en" ? "Active QR sessions will pause for ~15s." : "Các phiên quét QR sẽ tạm dừng khoảng 15 giây."}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.1rem" }}>
                            <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                            <button type="button" onClick={() => { setConnectionStatus("ONLINE"); setOperatingMode("ACTIVE"); persistMachineState(slots, "ONLINE", "ACTIVE", "MACHINE_RESTARTED"); setActiveModal(null); showBanner(lang === "en" ? "Restart command sent." : "Đã gửi lệnh khởi động lại."); }} className={styles.confirmBtn}>{lang === "en" ? "Confirm" : "Xác nhận"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL LỆNH TỪ XA */}
            {activeModal === "REMOTE_CONTROL" && canOperateMachine && (
                <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? "Remote Command" : "Gửi lệnh từ xa"}</h3>
                        <div className={styles.customDropdownWrap} ref={cmdMenuRef} style={{ marginBottom: "1rem" }}>
                            <button type="button" onClick={() => setIsCmdMenuOpen((p) => !p)} className={styles.customDropdownTrigger}>
                                <span>{selectedCommand}</span>
                                <ChevronDown size={14} color="#D4AF37" />
                            </button>
                            {isCmdMenuOpen && (
                                <div className={styles.customDropdownMenu}>
                                    {["STATUS_PING", "SYNC_SLOT_CONFIG"].map((cmd) => (
                                        <button key={cmd} type="button" onClick={() => { setSelectedCommand(cmd); setIsCmdMenuOpen(false); }} className={styles.customDropdownItem}>{cmd}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                            <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                            <button type="button" onClick={handleExecuteRemoteCommand} className={styles.confirmBtn}>{lang === "en" ? "Send" : "Gửi lệnh"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NHẬT KÝ */}
            {activeModal === "LOGS" && (
                <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
                    <div className={styles.modalContent} style={{ maxWidth: "42rem" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                            <h3 style={{ margin: 0 }}>{lang === "en" ? "Device Logs" : "Nhật ký thiết bị"}</h3>
                            <div style={{ display: "flex", gap: "0.3rem" }}>
                                {(["ALL", "HEARTBEAT", "COMMAND", "EVENT", "ERROR"] as const).map((t) => (
                                    <button key={t} type="button" onClick={() => setLogFilterType(t)} className={styles.cancelBtn} style={{ padding: "0.28rem 0.55rem", fontSize: "0.72rem", borderColor: logFilterType === t ? "#D4AF37" : undefined }}>{t}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                            {filteredLogs.map((l) => (
                                <div key={l.id} style={{ padding: "0.65rem 0.85rem", borderRadius: "8px", background: "#0B0D14", borderLeft: `3px solid ${l.severity === "CRITICAL" ? "#F87171" : l.severity === "WARNING" ? "#FBBF24" : "#34D399"}`, fontSize: "0.82rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "#94A3B8" }}><span>{l.type}</span><span>{l.timestamp}</span></div>
                                    <div style={{ marginTop: "2px" }}>{l.message}</div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => setActiveModal(null)} className={styles.confirmBtn} style={{ width: "100%" }}>{lang === "en" ? "Close" : "Đóng"}</button>
                    </div>
                </div>
            )}

            {/* MODAL SỬA ĐỊA ĐIỂM */}
            {activeModal === "EDIT_INFO" && canOperateMachine && (
                <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? "Edit Venue" : "Sửa địa điểm"}</h3>
                        <form onSubmit={(e) => { e.preventDefault(); persistMachineState(slots, connectionStatus, operatingMode, "VENUE_UPDATED"); setActiveModal(null); showBanner(lang === "en" ? "Venue updated." : "Đã cập nhật địa điểm."); }}>
                            <div style={{ marginBottom: "0.85rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Venue Name" : "Tên địa điểm"}</label>
                                <input type="text" required value={locationName} onChange={(e) => setLocationName(e.target.value)} className={styles.inputField} />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Address" : "Địa chỉ"}</label>
                                <input type="text" required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className={styles.inputField} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.confirmBtn}>{lang === "en" ? "Save" : "Lưu"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ĐỔI MÙI HƯƠNG KHOANG */}
            {activeModal === "ASSIGN_SLOT" && selectedSlotForAssign && canAssignSlot && (
                <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? `Configure Slot 0${selectedSlotForAssign.slotNumber}` : `Cấu hình Khoang 0${selectedSlotForAssign.slotNumber}`}</h3>
                        <form onSubmit={handleSaveSlotAssignment}>
                            <div style={{ marginBottom: "0.85rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Fragrance" : "Mùi hương"}</label>
                                <div className={styles.customDropdownWrap} ref={assignMenuRef}>
                                    <button type="button" onClick={() => setIsAssignMenuOpen((p) => !p)} className={styles.customDropdownTrigger}>
                                        <span>{selectedAssignMeta.brand} — {selectedAssignMeta.name}</span>
                                        <ChevronDown size={14} color="#D4AF37" />
                                    </button>
                                    {isAssignMenuOpen && (
                                        <div className={styles.customDropdownMenu}>
                                            {DEFAULT_CATALOG_OPTIONS.map((c) => (
                                                <button key={c.name} type="button" onClick={() => { setAssignPerfumeName(c.name); setAssignPrice(c.price); setIsAssignMenuOpen(false); }} className={styles.customDropdownItem}>
                                                    <span>{c.brand} — {c.name}</span>
                                                    <span>{c.price.toLocaleString("vi-VN")}đ</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.65rem", marginBottom: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.74rem", color: "#CBD5E1", marginBottom: "0.25rem" }}>{lang === "en" ? "Price (VND)" : "Giá (VND)"}</label>
                                    <input type="number" min={1000} step={500} value={assignPrice} onChange={(e) => setAssignPrice(Number(e.target.value))} className={styles.inputField} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.74rem", color: "#CBD5E1", marginBottom: "0.25rem" }}>Pulse (ms)</label>
                                    <input type="number" min={800} max={2000} step={50} value={assignDurationMs} onChange={(e) => setAssignDurationMs(Number(e.target.value))} className={styles.inputField} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.74rem", color: "#CBD5E1", marginBottom: "0.25rem" }}>{lang === "en" ? "Min Alert (ml)" : "Ngưỡng (ml)"}</label>
                                    <input type="number" min={5} max={40} value={assignThresholdMl} onChange={(e) => setAssignThresholdMl(Number(e.target.value))} className={styles.inputField} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.confirmBtn}>{lang === "en" ? "Save Config" : "Lưu cấu hình"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL TẠO PHIẾU BẢO TRÌ */}
            {activeModal === "TICKET" && canCreateTicket && (
                <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{lang === "en" ? "Create Maintenance Ticket" : "Tạo phiếu bảo trì"}</h3>
                        <form onSubmit={handleCreateTicket}>
                            <div style={{ marginBottom: "0.85rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Priority" : "Ưu tiên"}</label>
                                <div className={styles.customDropdownWrap} ref={priorityMenuRef}>
                                    <button type="button" onClick={() => setIsPriorityMenuOpen((p) => !p)} className={styles.customDropdownTrigger}>
                                        <span>{ticketPriority}</span>
                                        <ChevronDown size={14} color="#D4AF37" />
                                    </button>
                                    {isPriorityMenuOpen && (
                                        <div className={styles.customDropdownMenu}>
                                            {(["URGENT", "HIGH", "NORMAL"] as const).map((p) => (
                                                <button key={p} type="button" onClick={() => { setTicketPriority(p); setIsPriorityMenuOpen(false); }} className={styles.customDropdownItem}>{p}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Description *" : "Mô tả lỗi *"}</label>
                                <textarea rows={3} required value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} className={styles.inputField} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setActiveModal(null)} className={styles.cancelBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.confirmBtn}>{lang === "en" ? "Create" : "Tạo phiếu"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}