// noinspection SpellCheckingInspection
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    Search,
    Server,
    MapPin,
    Clock,
    ExternalLink,
    Cpu,
    Activity,
    AlertTriangle,
    WifiOff,
    RefreshCw,
    LayoutGrid,
    List as ListIcon,
    Map as MapIcon,
    ZoomIn,
    ZoomOut,
    X,
    Wrench,
    Terminal,
    Plus,
    Power,
    Zap,
    CheckCircle2,
    Droplets,
    Smartphone,
    Globe,
    SlidersHorizontal,
    ChevronDown,
    Check,
} from "lucide-react";
import Link from "next/link";
import styles from "./machines.module.css";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

interface MachineSlotCartridge {
    slotLabel: string;
    fragranceName: string;
    brand: string;
    remainingMl: number;
    capacityMl: number;
    lowStockThresholdMl?: number;
    productStatus?: "ACTIVE" | "INACTIVE" | "DRAFT";
    pricePerSpray?: number;
}

interface KioskMachineItem {
    id: string;
    code: string;
    serialNumber: string;
    deviceIdentity: string;
    brand: string;
    locationName: string;
    address: string;
    coordinates?: { lat: string; lng: string };
    status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
    connectionStatus: "ONLINE" | "OFFLINE";
    operatingStatus: "ACTIVE" | "MAINTENANCE" | "DISABLED" | "ERROR";
    activeSlots: number;
    totalSlots: number;
    lastActivity: string;
    firmwareVersion: string;
    configVersion: string;
    chamberTemp: string;
    todaySprays: number;
    todayRevenue: number;
    slots: MachineSlotCartridge[];
}

const INITIAL_FLEET_MACHINES: KioskMachineItem[] = [
    {
        id: "demo-device", code: "demo-device", serialNumber: "SN-2026-8801", deviceIdentity: "DEV-SGN-8801", brand: "Creed", locationName: "Diamond Plaza Atrium", address: "34 Lê Duẩn, Q.1, TP.HCM", coordinates: { lat: "10.7801", lng: "106.6983" },
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", activeSlots: 4, totalSlots: 4, lastActivity: "2s", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", chamberTemp: "21.2°C", todaySprays: 42, todayRevenue: 815000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Creed Aventus", brand: "Creed", remainingMl: 11.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 20000 },
            { slotLabel: "Slot 02", fragranceName: "Le Labo Another 13", brand: "Le Labo", remainingMl: 13.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 18000 },
            { slotLabel: "Slot 03", fragranceName: "Parfums de Marly Sedley", brand: "Parfums de Marly", remainingMl: 68.0, capacityMl: 125, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 18500 },
            { slotLabel: "Slot 04", fragranceName: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", remainingMl: 9.0, capacityMl: 70, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 21000 },
        ],
    },
    {
        id: "KIOSK-SGN-01", code: "KIOSK-SGN-01", serialNumber: "SN-2026-8802", deviceIdentity: "DEV-SGN-8802", brand: "Chanel", locationName: "Saigon Centre Takashimaya", address: "65 Lê Lợi, Q.1, TP.HCM", coordinates: { lat: "10.7731", lng: "106.7012" },
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", activeSlots: 4, totalSlots: 4, lastActivity: "4s", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", chamberTemp: "21.4°C", todaySprays: 56, todayRevenue: 840000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Acqua Di Gio", brand: "Giorgio Armani", remainingMl: 78.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12000 },
            { slotLabel: "Slot 02", fragranceName: "Acqua Di Gio Profondo", brand: "Giorgio Armani", remainingMl: 64.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 14000 },
            { slotLabel: "Slot 03", fragranceName: "Bleu de Chanel", brand: "Chanel", remainingMl: 12.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 15000 },
            { slotLabel: "Slot 04", fragranceName: "Miss Dior Blooming Bouquet", brand: "Dior", remainingMl: 76.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13500 },
        ],
    },
    {
        id: "KIOSK-SGN-02", code: "KIOSK-SGN-02", serialNumber: "SN-2026-8803", deviceIdentity: "DEV-SGN-8803", brand: "Yves Saint Laurent", locationName: "Vincom Đồng Khởi", address: "72 Lê Thánh Tôn, Q.1, TP.HCM", coordinates: { lat: "10.7780", lng: "106.7018" },
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", activeSlots: 4, totalSlots: 4, lastActivity: "8s", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", chamberTemp: "21.8°C", todaySprays: 38, todayRevenue: 532000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Coco Mademoiselle", brand: "Chanel", remainingMl: 82.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 15500 },
            { slotLabel: "Slot 02", fragranceName: "Burberry Goddess", brand: "Burberry", remainingMl: 71.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13000 },
            { slotLabel: "Slot 03", fragranceName: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", remainingMl: 77.0, capacityMl: 125, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13000 },
            { slotLabel: "Slot 04", fragranceName: "Versace Eros", brand: "Versace", remainingMl: 83.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12500 },
        ],
    },
    {
        id: "KIOSK-HN-02", code: "KIOSK-HN-02", serialNumber: "SN-2026-8805", deviceIdentity: "DEV-HAN-8805", brand: "Maison Margiela", locationName: "Tràng Tiền Plaza", address: "24 Hai Bà Trưng, Hà Nội", coordinates: { lat: "21.0245", lng: "105.8535" },
        status: "MAINTENANCE", connectionStatus: "ONLINE", operatingStatus: "MAINTENANCE", activeSlots: 0, totalSlots: 4, lastActivity: "18m", firmwareVersion: "v2.4.6-LTS", configVersion: "cfg-2026.10", chamberTemp: "23.1°C", todaySprays: 14, todayRevenue: 203000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Replica By the Fireplace", brand: "Maison Margiela", remainingMl: 80.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 14500 },
            { slotLabel: "Slot 02", fragranceName: "Replica Jazz Club", brand: "Maison Margiela", remainingMl: 67.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 14500 },
            { slotLabel: "Slot 03", fragranceName: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", remainingMl: 74.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13500 },
            { slotLabel: "Slot 04", fragranceName: "Tom Ford Black Orchid", brand: "Tom Ford", remainingMl: 48.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 16000 },
        ],
    },
    {
        id: "KIOSK-004", code: "KIOSK-004", serialNumber: "SN-2026-8807", deviceIdentity: "DEV-SGN-8807", brand: "Tom Ford", locationName: "Aeon Mall Tân Phú", address: "30 Bờ Bao Tân Thắng, TP.HCM", coordinates: undefined,
        status: "OFFLINE", connectionStatus: "OFFLINE", operatingStatus: "ERROR", activeSlots: 0, totalSlots: 4, lastActivity: "2h", firmwareVersion: "v2.4.5-LTS", configVersion: "cfg-2026.09", chamberTemp: "24.2°C", todaySprays: 9, todayRevenue: 144000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Tom Ford Black Orchid", brand: "Tom Ford", remainingMl: 0.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 16000 },
            { slotLabel: "Slot 02", fragranceName: "Valentino Born in Roma", brand: "Valentino", remainingMl: 81.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13000 },
            { slotLabel: "Slot 03", fragranceName: "Versace Bright Crystal", brand: "Versace", remainingMl: 62.0, capacityMl: 90, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 11500 },
            { slotLabel: "Slot 04", fragranceName: "Versace Dylan Blue", brand: "Versace", remainingMl: 77.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12000 },
        ],
    },
];

const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

function computeDynamicActiveSlots(status: KioskMachineItem["status"], slots: MachineSlotCartridge[]): number {
    if (status === "OFFLINE" || status === "MAINTENANCE") return 0;
    return slots.filter((s) => s.remainingMl >= 0.12 && (!s.productStatus || s.productStatus === "ACTIVE")).length;
}

export default function MachinesPage() {
    const brandDropdownRef = useRef<HTMLDivElement | null>(null);
    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [activeUserName, setActiveUserName] = useState<string>("Platform Super Administrator");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [machines, setMachines] = useState<KioskMachineItem[]>(INITIAL_FLEET_MACHINES);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [brandFilter, setBrandFilter] = useState<string>("ALL");
    const [isBrandMenuOpen, setIsBrandMenuOpen] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"cards" | "list" | "map">("cards");
    const [mapZoom, setMapZoom] = useState<number>(1);

    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [mapFocusedId, setMapFocusedId] = useState<string>("demo-device");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [isAddMachineOpen, setIsAddMachineOpen] = useState<boolean>(false);
    const [newMachineCode, setNewMachineCode] = useState<string>("KIOSK-SGN-05");
    const [newMachineSerial, setNewMachineSerial] = useState<string>("SN-2026-8899");
    const [newMachineBrand, setNewMachineBrand] = useState<string>("Chanel");
    const [newMachineLocation, setNewMachineLocation] = useState<string>("Landmark 81, TP.HCM");
    const [newMachineAddress, setNewMachineAddress] = useState<string>("720A Điện Biên Phủ, Bình Thạnh, TP.HCM");
    const [formError, setFormError] = useState<string>("");

    // Phân quyền chuẩn theo 6 vai trò nội bộ (src/lib/rbac.ts)
    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canProvisionMachine = currentRole === "OM";
    const canControlPowerOrOta = currentRole === "OM";
    const canToggleMaintenance = currentRole === "OM" || currentRole === "TE";
    const canDiagnosticSpray = currentRole === "TE";
    const canRefillSlot = currentRole === "IS";

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) setIsBrandMenuOpen(false);
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const selectedMachine = useMemo(
        () => machines.find((m) => m.id.toLowerCase() === String(selectedMachineId || "").toLowerCase()) || null,
        [machines, selectedMachineId]
    );

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

    const formatStatus = (st: KioskMachineItem["status"]) => {
        if (lang === "en") return st === "ONLINE" ? "Online" : st === "MAINTENANCE" ? "Maintenance" : "Offline";
        return st === "ONLINE" ? "Sẵn sàng" : st === "MAINTENANCE" ? "Bảo trì" : "Mất kết nối";
    };

    const appendMachineAuditLog = useCallback(
        (action: string, entityId: string, details: Record<string, unknown>) => {
            try {
                const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const logs = rawLogs ? JSON.parse(rawLogs) : [];
                logs.unshift({
                    id: `AUD-${Date.now().toString().slice(-4)}`,
                    timestamp: new Date().toISOString(),
                    actor: activeUserName,
                    role: currentRole,
                    action,
                    entityType: "MACHINES",
                    entityId,
                    severity: "INFO",
                    newValues: details,
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));
            } catch {
                // Safe fallback
            }
        },
        [activeUserName, currentRole]
    );

    const loadAndReconcileFleet = useCallback(() => {
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
                setActiveUserName(parsedUser.fullName || parsedUser.name || ROLE_PERMISSIONS[resolvedRole].label);
                const scope = parsedUser.brandScope || parsedUser.brand || null;
                if (resolvedRole === "BA" && scope) {
                    setLockedBrandScope(scope);
                    setBrandFilter(scope);
                } else {
                    setLockedBrandScope(null);
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};

            let workingFleet: KioskMachineItem[] = [...INITIAL_FLEET_MACHINES];
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsed = JSON.parse(rawMachines);
                if (Array.isArray(parsed) && parsed.length > 0) workingFleet = parsed;
            }

            workingFleet = workingFleet.map((m) => {
                const kLower = m.code.toLowerCase();
                const syncedSlots = m.slots.map((sl) => {
                    const matrixMl = perKioskMatrix[kLower]?.[sl.fragranceName.trim().toLowerCase()];
                    return typeof matrixMl === "number" ? { ...sl, remainingMl: Number(matrixMl) } : sl;
                });
                return {
                    ...m,
                    slots: syncedSlots,
                    activeSlots: computeDynamicActiveSlots(m.status, syncedSlots),
                };
            });

            setMachines(workingFleet);
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadAndReconcileFleet();
        const handleSync = () => loadAndReconcileFleet();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadAndReconcileFleet]);

    const persistFleet = useCallback((updatedFleet: KioskMachineItem[], modifiedKiosk?: KioskMachineItem) => {
        setMachines(updatedFleet);
        try {
            localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
            if (modifiedKiosk) {
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
                const kKey = modifiedKiosk.code.toLowerCase();
                if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                modifiedKiosk.slots.forEach((sl) => {
                    perKioskMatrix[kKey][sl.fragranceName.trim().toLowerCase()] = Number(sl.remainingMl);
                });
                localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));
            }
            window.dispatchEvent(new Event("scentstation-sync"));
        } catch {
            // Safe fallback
        }
    }, []);

    const handleTogglePower = (target: KioskMachineItem) => {
        if (!canControlPowerOrOta) return;
        const nextStatus: KioskMachineItem["status"] = target.status === "OFFLINE" ? "ONLINE" : "OFFLINE";
        const updatedItem: KioskMachineItem = {
            ...target,
            status: nextStatus,
            connectionStatus: nextStatus === "OFFLINE" ? "OFFLINE" : "ONLINE",
            operatingStatus: nextStatus === "OFFLINE" ? "ERROR" : "ACTIVE",
            activeSlots: computeDynamicActiveSlots(nextStatus, target.slots),
            lastActivity: nextStatus === "ONLINE" ? "Live" : "Offline",
        };
        persistFleet(machines.map((m) => (m.id === target.id ? updatedItem : m)), updatedItem);
        appendMachineAuditLog(`MACHINE_SET_${nextStatus}`, target.code, {});
        showToast(
            lang === "en"
                ? `Command sent to ${target.code} (${nextStatus}).`
                : `Đã gửi lệnh chuyển ${target.code} sang ${formatStatus(nextStatus)}.`
        );
    };

    const handleToggleMaintenance = (target: KioskMachineItem) => {
        if (!canToggleMaintenance) return;
        const nextStatus: KioskMachineItem["status"] = target.status === "MAINTENANCE" ? "ONLINE" : "MAINTENANCE";
        const updatedItem: KioskMachineItem = {
            ...target,
            status: nextStatus,
            connectionStatus: "ONLINE",
            operatingStatus: nextStatus === "MAINTENANCE" ? "MAINTENANCE" : "ACTIVE",
            activeSlots: computeDynamicActiveSlots(nextStatus, target.slots),
        };
        persistFleet(machines.map((m) => (m.id === target.id ? updatedItem : m)), updatedItem);
        appendMachineAuditLog("MACHINE_MAINTENANCE_TOGGLED", target.code, { nextStatus });
        showToast(
            lang === "en"
                ? `Station ${target.code} is now ${nextStatus}.`
                : `Trạm ${target.code} đã chuyển sang ${formatStatus(nextStatus)}.`
        );
    };

    const handleDiagnosticSpray = (target: KioskMachineItem, slotIdx: number) => {
        if (!canDiagnosticSpray) return;
        if (target.status !== "MAINTENANCE") {
            showToast(
                lang === "en"
                    ? "Diagnostic spray requires Maintenance Mode first."
                    : "Chỉ được xịt chẩn đoán khi máy đang ở chế độ Bảo trì."
            );
            return;
        }
        const sl = target.slots[slotIdx];
        if (!sl || sl.remainingMl < 0.12) return;
        const nextMl = Number(Math.max(0, sl.remainingMl - 0.12).toFixed(2));
        const updatedSlots = target.slots.map((s, idx) => (idx === slotIdx ? { ...s, remainingMl: nextMl } : s));
        const updatedItem: KioskMachineItem = { ...target, slots: updatedSlots };
        persistFleet(machines.map((m) => (m.id === target.id ? updatedItem : m)), updatedItem);
        appendMachineAuditLog("DIAGNOSTIC_SPRAY", target.code, { slot: sl.slotLabel, deltaMl: -0.12 });
        showToast(
            lang === "en"
                ? `Diagnostic spray logged (-0.12ml, not counted as sale).`
                : `Đã ghi nhận xịt chẩn đoán (-0.12ml, tách riêng khỏi doanh thu bán hàng).`
        );
    };

    const handleRefillSlot = (target: KioskMachineItem, slotIdx?: number) => {
        if (!canRefillSlot) return;
        const updatedSlots = target.slots.map((sl, idx) =>
            typeof slotIdx === "number" && idx !== slotIdx ? sl : { ...sl, remainingMl: sl.capacityMl }
        );
        const updatedItem: KioskMachineItem = {
            ...target,
            slots: updatedSlots,
            activeSlots: computeDynamicActiveSlots(target.status, updatedSlots),
        };
        persistFleet(machines.map((m) => (m.id === target.id ? updatedItem : m)), updatedItem);
        appendMachineAuditLog("SLOT_REPLENISHED", target.code, { slotIdx: slotIdx ?? "ALL" });
        showToast(lang === "en" ? "Cartridge replenished to 100%." : "Đã nạp đầy bình chứa lên 100%.");
    };

    const handleOtaSync = (target: KioskMachineItem) => {
        if (!canControlPowerOrOta) return;
        showToast(
            lang === "en"
                ? `OTA config queued for ${target.code} (waiting device ACK).`
                : `Đã gửi cấu hình OTA xuống ${target.code} (đang chờ máy xác nhận).`
        );
    };

    const handleCreateMachineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canProvisionMachine) return;
        setFormError("");
        const cleanCode = newMachineCode.trim();
        if (!cleanCode || !newMachineLocation.trim()) {
            setFormError(lang === "en" ? "Code and location are required." : "Vui lòng nhập mã trạm và địa điểm.");
            return;
        }
        if (machines.some((m) => m.code.toLowerCase() === cleanCode.toLowerCase())) {
            setFormError(lang === "en" ? "Station code already exists." : "Mã trạm đã tồn tại.");
            return;
        }
        const newKiosk: KioskMachineItem = {
            ...INITIAL_FLEET_MACHINES[0],
            id: cleanCode,
            code: cleanCode,
            serialNumber: newMachineSerial.trim() || `SN-2026-${Math.floor(8900 + Math.random() * 900)}`,
            brand: newMachineBrand,
            locationName: newMachineLocation.trim(),
            address: newMachineAddress.trim(),
            todaySprays: 0,
            todayRevenue: 0,
            lastActivity: "Live",
        };
        persistFleet([newKiosk, ...machines], newKiosk);
        setIsAddMachineOpen(false);
        showToast(lang === "en" ? `Provisioned ${cleanCode}.` : `Đã thêm trạm ${cleanCode}.`);
    };

    const uniqueBrands = useMemo(() => {
        const s = new Set<string>();
        machines.forEach((m) => { s.add(m.brand); m.slots.forEach((sl) => s.add(sl.brand)); });
        return Array.from(s).sort();
    }, [machines]);

    const effectiveBrand = lockedBrandScope || brandFilter;

    const filteredMachines = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return machines.filter((m) => {
            const matchesSearch = !q || m.code.toLowerCase().includes(q) || m.locationName.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q);
            const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
            const matchesBrand = effectiveBrand === "ALL" || m.brand === effectiveBrand || m.slots.some((sl) => sl.brand === effectiveBrand);
            return matchesSearch && matchesStatus && matchesBrand;
        });
    }, [machines, searchQuery, statusFilter, effectiveBrand]);

    const onlineCount = machines.filter((m) => m.status === "ONLINE").length;
    const maintenanceCount = machines.filter((m) => m.status === "MAINTENANCE").length;
    const offlineCount = machines.filter((m) => m.status === "OFFLINE").length;

    const renderStatusBadge = (status: KioskMachineItem["status"]) => {
        if (status === "ONLINE") return <div className={styles.badgeOnline}><span className={styles.dotOnline} />{formatStatus(status)}</div>;
        if (status === "MAINTENANCE") return <div className={styles.badgeMaintenance}><span className={styles.dotMaintenance} />{formatStatus(status)}</div>;
        return <div className={styles.badgeOffline}><span className={styles.dotOffline} />{formatStatus(status)}</div>;
    };

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <div className={styles.workspaceInner}>
                <div className={styles.heroBannerCard}>
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>{lang === "en" ? "Machines" : "Quản lý đội máy"}</h1>
                            <div className={styles.scopeBadge}>
                                <span>{roleConfig.label}</span>
                                {lockedBrandScope && <span>• {lockedBrandScope}</span>}
                            </div>
                        </div>

                        <div className={styles.headerActionGroup}>
                            <button type="button" onClick={handleToggleLanguage} className={styles.secondaryGoldBtn}>
                                <Globe size={14} color="#D4AF37" />
                                <span>{lang === "en" ? "EN" : "VI"}</span>
                            </button>

                            {canProvisionMachine && (
                                <button type="button" onClick={() => { setFormError(""); setIsAddMachineOpen(true); }} className={styles.primaryGoldBtn}>
                                    <Plus size={15} />
                                    <span>{lang === "en" ? "Add Station" : "Thêm trạm"}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.statsGrid}>
                        <div onClick={() => setStatusFilter("ALL")} className={`${styles.statCard} ${statusFilter === "ALL" ? styles.statCardActive : ""}`}>
                            <div>
                                <p className={styles.statLabel}>{lang === "en" ? "Total" : "Tổng số trạm"}</p>
                                <p className={styles.statValue}>{machines.length}</p>
                            </div>
                            <div className={styles.statIconBox}><Cpu size={18} /></div>
                        </div>

                        <div onClick={() => setStatusFilter("ONLINE")} className={`${styles.statCard} ${statusFilter === "ONLINE" ? styles.statCardActive : ""}`}>
                            <div>
                                <p className={styles.statLabel}>{formatStatus("ONLINE")}</p>
                                <p className={styles.statValue} style={{ color: "#34D399" }}>{onlineCount}</p>
                            </div>
                            <div className={styles.statIconBox} style={{ color: "#34D399", background: "rgba(52,211,153,0.12)" }}><Activity size={18} /></div>
                        </div>

                        <div onClick={() => setStatusFilter("MAINTENANCE")} className={`${styles.statCard} ${statusFilter === "MAINTENANCE" ? styles.statCardActive : ""}`}>
                            <div>
                                <p className={styles.statLabel}>{formatStatus("MAINTENANCE")}</p>
                                <p className={styles.statValue} style={{ color: "#FBBF24" }}>{maintenanceCount}</p>
                            </div>
                            <div className={styles.statIconBox} style={{ color: "#FBBF24", background: "rgba(251,191,36,0.12)" }}><AlertTriangle size={18} /></div>
                        </div>

                        <div onClick={() => setStatusFilter("OFFLINE")} className={`${styles.statCard} ${statusFilter === "OFFLINE" ? styles.statCardActive : ""}`}>
                            <div>
                                <p className={styles.statLabel}>{formatStatus("OFFLINE")}</p>
                                <p className={styles.statValue} style={{ color: "#F87171" }}>{offlineCount}</p>
                            </div>
                            <div className={styles.statIconBox} style={{ color: "#F87171", background: "rgba(248,113,113,0.12)" }}><WifiOff size={18} /></div>
                        </div>
                    </div>
                </div>

                {/* BỘ LỌC */}
                <div className={styles.filterBar}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={lang === "en" ? "Search station code, location, brand..." : "Tìm mã trạm, địa điểm, thương hiệu..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className={styles.clearSearchBtn}><X size={14} /></button>}
                    </div>

                    <div className={styles.pillGroup}>
                        {(["ALL", "ONLINE", "MAINTENANCE", "OFFLINE"] as const).map((st) => (
                            <button key={st} type="button" onClick={() => setStatusFilter(st)} className={`${styles.filterPillBtn} ${statusFilter === st ? styles.filterPillBtnActive : ""}`}>
                                {st === "ALL" ? (lang === "en" ? "All" : "Tất cả") : formatStatus(st)}
                            </button>
                        ))}
                    </div>

                    {!lockedBrandScope && (
                        <div className={styles.customDropdownWrap} ref={brandDropdownRef}>
                            <button type="button" onClick={() => setIsBrandMenuOpen((p) => !p)} className={styles.customDropdownTrigger}>
                                <SlidersHorizontal size={13} color="#D4AF37" />
                                <span>{brandFilter === "ALL" ? (lang === "en" ? "All Brands" : "Tất cả thương hiệu") : brandFilter}</span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {isBrandMenuOpen && (
                                <div className={styles.customDropdownMenu}>
                                    <button type="button" onClick={() => { setBrandFilter("ALL"); setIsBrandMenuOpen(false); }} className={`${styles.customDropdownItem} ${brandFilter === "ALL" ? styles.customDropdownItemActive : ""}`}>
                                        <span>{lang === "en" ? "All Brands" : "Tất cả thương hiệu"}</span>
                                        {brandFilter === "ALL" && <Check size={13} color="#D4AF37" />}
                                    </button>
                                    {uniqueBrands.map((b) => (
                                        <button key={b} type="button" onClick={() => { setBrandFilter(b); setIsBrandMenuOpen(false); }} className={`${styles.customDropdownItem} ${brandFilter === b ? styles.customDropdownItemActive : ""}`}>
                                            <span>{b}</span>
                                            {brandFilter === b && <Check size={13} color="#D4AF37" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.viewToggleGroup}>
                        <button type="button" onClick={() => setViewMode("cards")} className={`${styles.viewToggleBtn} ${viewMode === "cards" ? styles.viewToggleBtnActive : ""}`}><LayoutGrid size={14} /><span>{lang === "en" ? "Cards" : "Thẻ"}</span></button>
                        <button type="button" onClick={() => setViewMode("list")} className={`${styles.viewToggleBtn} ${viewMode === "list" ? styles.viewToggleBtnActive : ""}`}><ListIcon size={14} /><span>{lang === "en" ? "List" : "Bảng"}</span></button>
                        <button type="button" onClick={() => setViewMode("map")} className={`${styles.viewToggleBtn} ${viewMode === "map" ? styles.viewToggleBtnActive : ""}`}><MapIcon size={14} /><span>{lang === "en" ? "Map" : "Bản đồ"}</span></button>
                    </div>
                </div>

                {/* BẢN ĐỒ VỆ TINH */}
                {viewMode === "map" && (() => {
                    const activeMapMachine = filteredMachines.find((m) => m.id === mapFocusedId) || filteredMachines[0] || machines[0];
                    const numericZoom = Math.min(20, Math.max(6, Math.round(16 * mapZoom)));
                    const mapSrc = activeMapMachine?.coordinates
                        ? `https://maps.google.com/maps?q=${activeMapMachine.coordinates.lat},${activeMapMachine.coordinates.lng}&t=h&z=${numericZoom}&ie=UTF8&iwloc=&output=embed`
                        : `https://maps.google.com/maps?q=${encodeURIComponent(activeMapMachine?.address || "Ho Chi Minh City")}&t=h&z=${numericZoom}&ie=UTF8&iwloc=&output=embed`;

                    return (
                        <div className={styles.mapCanvasCard}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                                <strong>{activeMapMachine?.code} — {activeMapMachine?.locationName}</strong>
                                <div style={{ display: "flex", gap: "0.45rem" }}>
                                    <button type="button" onClick={() => setMapZoom((z) => Math.min(1.25, +(z + 0.1).toFixed(2)))} className={styles.secondaryGoldBtn}><ZoomIn size={14} /></button>
                                    <button type="button" onClick={() => setMapZoom((z) => Math.max(0.65, +(z - 0.1).toFixed(2)))} className={styles.secondaryGoldBtn}><ZoomOut size={14} /></button>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "0.9rem", minHeight: "420px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", maxHeight: "420px", overflowY: "auto" }}>
                                    {filteredMachines.map((m) => (
                                        <div key={m.id} onClick={() => setMapFocusedId(m.id)} style={{ padding: "0.7rem 0.85rem", borderRadius: "10px", background: activeMapMachine?.id === m.id ? "rgba(212,175,55,0.16)" : "#0B0D14", border: activeMapMachine?.id === m.id ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700 }}>
                                                <span>{m.code}</span>
                                                <span style={{ fontSize: "0.72rem", color: m.status === "ONLINE" ? "#34D399" : m.status === "MAINTENANCE" ? "#FBBF24" : "#F87171" }}>{formatStatus(m.status)}</span>
                                            </div>
                                            <div style={{ fontSize: "0.76rem", color: "#CBD5E1" }}>{m.locationName}</div>
                                            {!m.coordinates && <div style={{ fontSize: "0.7rem", color: "#FBBF24", marginTop: "2px" }}>{lang === "en" ? "Address fallback (no GPS)" : "Hiển thị theo địa chỉ (chưa có GPS)"}</div>}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", minHeight: "420px" }}>
                                    <iframe key={`${activeMapMachine?.id}-${numericZoom}`} title={activeMapMachine?.code} src={mapSrc} width="100%" height="100%" style={{ border: 0, minHeight: "420px" }} loading="lazy" />
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* DANH SÁCH / THẺ */}
                {viewMode === "list" ? (
                    <div style={{ background: "#121622", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", padding: "0.85rem 1.1rem", overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.12)", fontSize: "0.76rem", color: "#CBD5E1" }}>
                                <th style={{ padding: "0.7rem" }}>{lang === "en" ? "Station" : "Mã trạm"}</th>
                                <th style={{ padding: "0.7rem" }}>{lang === "en" ? "Location" : "Địa điểm"}</th>
                                <th style={{ padding: "0.7rem" }}>{lang === "en" ? "Slots" : "Khoang"}</th>
                                <th style={{ padding: "0.7rem" }}>Firmware</th>
                                <th style={{ padding: "0.7rem" }}>{lang === "en" ? "Status" : "Trạng thái"}</th>
                                <th style={{ padding: "0.7rem", textAlign: "right" }}>{lang === "en" ? "Actions" : "Thao tác"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredMachines.map((m) => (
                                <tr key={m.id} onClick={() => setSelectedMachineId(m.id)} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                                    <td style={{ padding: "0.75rem", fontWeight: 700 }}>{m.code}<div style={{ fontSize: "0.74rem", color: "#D4AF37" }}>{m.brand}</div></td>
                                    <td style={{ padding: "0.75rem" }}>{m.locationName}<div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{m.address}</div></td>
                                    <td style={{ padding: "0.75rem", fontWeight: 700, color: m.activeSlots > 0 ? "#34D399" : "#F87171" }}>{m.activeSlots}/{m.totalSlots}</td>
                                    <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>{m.firmwareVersion}</td>
                                    <td style={{ padding: "0.75rem" }}>{renderStatusBadge(m.status)}</td>
                                    <td style={{ padding: "0.75rem", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                        <Link href={`/machines/${encodeURIComponent(m.id)}`} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.65rem", fontSize: "0.76rem" }}>
                                            {lang === "en" ? "Details" : "Chi tiết"}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.machinesGrid}>
                        {filteredMachines.map((machine) => (
                            <div key={machine.id} onClick={() => setSelectedMachineId(machine.id)} className={`${styles.machineCard} ${selectedMachine?.id === machine.id ? styles.machineCardSelected : ""}`}>
                                <div>
                                    <div className={styles.cardHeader}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                                            <div className={styles.serverIconBox}><Server size={17} color="#D4AF37" /></div>
                                            <div style={{ minWidth: 0 }}>
                                                <h3 className={styles.machineCode}>{machine.code}</h3>
                                                <p className={styles.machineLocation}><MapPin size={12} color="#D4AF37" /><span>{machine.locationName}</span></p>
                                            </div>
                                        </div>
                                        {renderStatusBadge(machine.status)}
                                    </div>

                                    <div className={styles.infoBox}>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>{lang === "en" ? "Ready Slots" : "Khoang sẵn sàng"}</span>
                                            <span className={styles.infoValue}>{machine.activeSlots}/{machine.totalSlots}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>{lang === "en" ? "Last Sync" : "Liên lạc cuối"}</span>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem" }}><Clock size={12} color="#D4AF37" />{machine.lastActivity} • {machine.chamberTemp}</span>
                                        </div>
                                    </div>

                                    <div className={styles.slotMiniGrid}>
                                        {machine.slots.map((sl) => (
                                            <div key={sl.slotLabel} className={styles.slotMiniCard}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                                                    <strong style={{ color: "#D4AF37" }}>{sl.slotLabel}</strong>
                                                    <strong style={{ color: sl.remainingMl <= 15 ? "#F87171" : "#34D399" }}>{sl.remainingMl}ml</strong>
                                                </div>
                                                <div style={{ fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sl.fragranceName}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.cardActionRow} onClick={(e) => e.stopPropagation()}>
                                    <Link href={`/machines/${encodeURIComponent(machine.id)}`} className={styles.detailLink}>
                                        <span>{lang === "en" ? "Machine Details" : "Chi tiết máy"}</span>
                                        <ExternalLink size={14} />
                                    </Link>
                                    <Link href={`/kiosk/${encodeURIComponent(machine.code)}`} className={styles.secondaryGoldBtn} style={{ padding: "0.62rem 0.75rem" }} title="Kiosk">
                                        <Smartphone size={14} color="#34D399" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT 4 KHOANG & THAO TÁC THEO VAI TRÒ */}
            {selectedMachine && (
                <div className={styles.drawerOverlay} onClick={() => setSelectedMachineId(null)}>
                    <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <strong style={{ color: "#D4AF37" }}>{selectedMachine.code}</strong>
                                        {renderStatusBadge(selectedMachine.status)}
                                    </div>
                                    <h2 style={{ margin: "0.15rem 0 0 0", fontSize: "1.2rem", fontWeight: 700 }}>{selectedMachine.locationName}</h2>
                                    <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>{selectedMachine.address} • {selectedMachine.firmwareVersion}</div>
                                </div>
                                <div style={{ display: "flex", gap: "0.45rem" }}>
                                    <Link href={`/machines/${encodeURIComponent(selectedMachine.id)}`} className={styles.primaryGoldBtn}>
                                        <Terminal size={14} />
                                        <span>{lang === "en" ? "Full Console" : "Mở chi tiết"}</span>
                                    </Link>
                                    <button type="button" onClick={() => setSelectedMachineId(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.45rem 0.6rem" }}><X size={16} /></button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerBody}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
                                {selectedMachine.slots.map((sl, idx) => (
                                    <div key={sl.slotLabel} className={styles.slotMiniCard} style={{ padding: "0.8rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem" }}>
                                            <strong style={{ color: "#D4AF37" }}>{sl.slotLabel} • {sl.brand}</strong>
                                            <strong style={{ color: sl.remainingMl <= 15 ? "#F87171" : "#34D399" }}>{sl.remainingMl}ml / {sl.capacityMl}ml</strong>
                                        </div>
                                        <div style={{ fontWeight: 700, margin: "0.25rem 0 0.5rem 0" }}>{sl.fragranceName}</div>
                                        <div style={{ display: "flex", gap: "0.45rem" }}>
                                            {canDiagnosticSpray && (
                                                <button type="button" onClick={() => handleDiagnosticSpray(selectedMachine, idx)} className={styles.secondaryGoldBtn} style={{ flex: 1, padding: "0.35rem 0.5rem", fontSize: "0.74rem" }}>
                                                    <Zap size={12} color="#D4AF37" />
                                                    <span>{lang === "en" ? "Diagnostic Spray" : "Xịt chẩn đoán"}</span>
                                                </button>
                                            )}
                                            {canRefillSlot && (
                                                <button type="button" onClick={() => handleRefillSlot(selectedMachine, idx)} className={styles.secondaryGoldBtn} style={{ flex: 1, padding: "0.35rem 0.5rem", fontSize: "0.74rem", color: "#34D399" }}>
                                                    <Droplets size={12} color="#34D399" />
                                                    <span>{lang === "en" ? "Refill 100%" : "Nạp 100%"}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                                {canControlPowerOrOta && (
                                    <>
                                        <button type="button" onClick={() => handleTogglePower(selectedMachine)} className={styles.secondaryGoldBtn} style={{ color: selectedMachine.status === "OFFLINE" ? "#34D399" : "#F87171" }}>
                                            <Power size={14} />
                                            <span>{selectedMachine.status === "OFFLINE" ? (lang === "en" ? "Restore Online" : "Khôi phục kết nối") : (lang === "en" ? "Set Offline" : "Ngắt kết nối")}</span>
                                        </button>
                                        <button type="button" onClick={() => handleOtaSync(selectedMachine)} className={styles.secondaryGoldBtn}>
                                            <RefreshCw size={14} color="#D4AF37" />
                                            <span>{lang === "en" ? "Push OTA Config" : "Gửi cấu hình OTA"}</span>
                                        </button>
                                    </>
                                )}
                                {canToggleMaintenance && (
                                    <button type="button" onClick={() => handleToggleMaintenance(selectedMachine)} className={styles.secondaryGoldBtn} style={{ color: "#FBBF24" }}>
                                        <Wrench size={14} />
                                        <span>{selectedMachine.status === "MAINTENANCE" ? (lang === "en" ? "Exit Maintenance" : "Thoát bảo trì") : (lang === "en" ? "Maintenance Mode" : "Chế độ bảo trì")}</span>
                                    </button>
                                )}
                                {canRefillSlot && (
                                    <button type="button" onClick={() => handleRefillSlot(selectedMachine)} className={styles.primaryGoldBtn}>
                                        <Droplets size={14} />
                                        <span>{lang === "en" ? "Refill All 4 Slots" : "Nạp đầy cả 4 khoang"}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THÊM TRẠM (CHỈ OM) */}
            {isAddMachineOpen && canProvisionMachine && (
                <div className={styles.modalOverlay} onClick={() => setIsAddMachineOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{lang === "en" ? "Add Station" : "Thêm trạm Kiosk mới"}</h3>
                            <button type="button" onClick={() => setIsAddMachineOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>
                        {formError && <div style={{ padding: "0.65rem", borderRadius: "8px", background: "rgba(248,113,113,0.14)", color: "#F87171", fontSize: "0.82rem", marginBottom: "0.85rem" }}>{formError}</div>}
                        <form onSubmit={handleCreateMachineSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Station Code *" : "Mã trạm *"}</label>
                                    <input type="text" required value={newMachineCode} onChange={(e) => setNewMachineCode(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>Serial *</label>
                                    <input type="text" required value={newMachineSerial} onChange={(e) => setNewMachineSerial(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Brand *" : "Thương hiệu *"}</label>
                                    <input type="text" required value={newMachineBrand} onChange={(e) => setNewMachineBrand(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Location *" : "Địa điểm *"}</label>
                                    <input type="text" required value={newMachineLocation} onChange={(e) => setNewMachineLocation(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Address *" : "Địa chỉ *"}</label>
                                <input type="text" required value={newMachineAddress} onChange={(e) => setNewMachineAddress(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsAddMachineOpen(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.primaryGoldBtn}>{lang === "en" ? "Create" : "Tạo mới"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className={styles.toastBanner}>
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}