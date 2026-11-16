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
    MoreHorizontal,
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
import { useRouter } from "next/navigation";
import styles from "./machines.module.css";

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
    coordinates?: { lat: string; lng: string; xPct: number; yPct: number };
    status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
    connectionStatus: "ONLINE" | "OFFLINE";
    operatingStatus: "ACTIVE" | "MAINTENANCE" | "DISABLED" | "ERROR";
    manualAdminOverride?: boolean;
    doorOpen: boolean;
    leakDetected: boolean;
    activeSlots: number;
    totalSlots: number;
    lastActivity: string;
    firmwareVersion: string;
    configVersion: string;
    installedAt: string;
    chamberTemp: string;
    voltage: string;
    todaySprays: number;
    todayRevenue: number;
    slots: MachineSlotCartridge[];
}

const INITIAL_FLEET_MACHINES: KioskMachineItem[] = [
    {
        id: "demo-device",
        code: "demo-device",
        serialNumber: "SN-2026-8801",
        deviceIdentity: "DEV-SGN-8801",
        brand: "Creed",
        locationName: "Diamond Plaza Luxury Atrium",
        address: "34 Le Duan, District 1, Ho Chi Minh City",
        coordinates: { lat: "10.7801° N", lng: "106.6983° E", xPct: 68, yPct: 72 },
        status: "ONLINE",
        connectionStatus: "ONLINE",
        operatingStatus: "ACTIVE",
        doorOpen: false,
        leakDetected: false,
        activeSlots: 4,
        totalSlots: 4,
        lastActivity: "Live (2s ago)",
        firmwareVersion: "v2.4.8-LTS",
        configVersion: "cfg-2026.11",
        installedAt: "2026-01-15",
        chamberTemp: "21.2°C",
        voltage: "24.1V DC",
        todaySprays: 42,
        todayRevenue: 815000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Creed Aventus", brand: "Creed", remainingMl: 11.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 20000 },
            { slotLabel: "Slot 02", fragranceName: "Le Labo Another 13", brand: "Le Labo", remainingMl: 13.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 18000 },
            { slotLabel: "Slot 03", fragranceName: "Parfums de Marly Sedley", brand: "Parfums de Marly", remainingMl: 68.0, capacityMl: 125, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 18500 },
            { slotLabel: "Slot 04", fragranceName: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", remainingMl: 9.0, capacityMl: 70, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 21000 },
        ],
    },
    {
        id: "KIOSK-SGN-01",
        code: "KIOSK-SGN-01",
        serialNumber: "SN-2026-8802",
        deviceIdentity: "DEV-SGN-8802",
        brand: "Chanel",
        locationName: "Saigon Centre Takashimaya Flagship",
        address: "65 Le Loi, District 1, Ho Chi Minh City",
        coordinates: { lat: "10.7731° N", lng: "106.7012° E", xPct: 62, yPct: 78 },
        status: "ONLINE",
        connectionStatus: "ONLINE",
        operatingStatus: "ACTIVE",
        doorOpen: false,
        leakDetected: false,
        activeSlots: 4,
        totalSlots: 4,
        lastActivity: "Live (4s ago)",
        firmwareVersion: "v2.4.8-LTS",
        configVersion: "cfg-2026.11",
        installedAt: "2026-01-18",
        chamberTemp: "21.4°C",
        voltage: "24.0V DC",
        todaySprays: 56,
        todayRevenue: 840000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Acqua Di Gio", brand: "Giorgio Armani", remainingMl: 78.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12000 },
            { slotLabel: "Slot 02", fragranceName: "Acqua Di Gio Profondo", brand: "Giorgio Armani", remainingMl: 64.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 14000 },
            { slotLabel: "Slot 03", fragranceName: "Bleu de Chanel", brand: "Chanel", remainingMl: 12.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 15000 },
            { slotLabel: "Slot 04", fragranceName: "Miss Dior Blooming Bouquet", brand: "Dior", remainingMl: 76.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13500 },
        ],
    },
    {
        id: "KIOSK-SGN-02",
        code: "KIOSK-SGN-02",
        serialNumber: "SN-2026-8803",
        deviceIdentity: "DEV-SGN-8803",
        brand: "Yves Saint Laurent",
        locationName: "Vincom Center Dong Khoi",
        address: "72 Le Thanh Ton, District 1, Ho Chi Minh City",
        coordinates: { lat: "10.7780° N", lng: "106.7018° E", xPct: 74, yPct: 68 },
        status: "ONLINE",
        connectionStatus: "ONLINE",
        operatingStatus: "ACTIVE",
        doorOpen: false,
        leakDetected: false,
        activeSlots: 4,
        totalSlots: 4,
        lastActivity: "Live (8s ago)",
        firmwareVersion: "v2.4.8-LTS",
        configVersion: "cfg-2026.11",
        installedAt: "2026-02-02",
        chamberTemp: "21.8°C",
        voltage: "23.9V DC",
        todaySprays: 38,
        todayRevenue: 532000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Coco Mademoiselle", brand: "Chanel", remainingMl: 82.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 15500 },
            { slotLabel: "Slot 02", fragranceName: "Burberry Goddess", brand: "Burberry", remainingMl: 71.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13000 },
            { slotLabel: "Slot 03", fragranceName: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", remainingMl: 77.0, capacityMl: 125, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13000 },
            { slotLabel: "Slot 04", fragranceName: "Versace Eros", brand: "Versace", remainingMl: 83.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12500 },
        ],
    },
    {
        id: "KIOSK-SGN-03",
        code: "KIOSK-SGN-03",
        serialNumber: "SN-2026-8808",
        deviceIdentity: "DEV-SGN-8808",
        brand: "Montblanc",
        locationName: "Crescent Mall Luxury Wing",
        address: "101 Ton Dat Tien, District 7, Ho Chi Minh City",
        coordinates: { lat: "10.7289° N", lng: "106.7180° E", xPct: 65, yPct: 84 },
        status: "ONLINE",
        connectionStatus: "ONLINE",
        operatingStatus: "ACTIVE",
        doorOpen: false,
        leakDetected: false,
        activeSlots: 4,
        totalSlots: 4,
        lastActivity: "Live (5s ago)",
        firmwareVersion: "v2.4.8-LTS",
        configVersion: "cfg-2026.11",
        installedAt: "2026-02-06",
        chamberTemp: "21.6°C",
        voltage: "24.0V DC",
        todaySprays: 34,
        todayRevenue: 412000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Montblanc Explorer", brand: "Montblanc", remainingMl: 79.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 11500 },
            { slotLabel: "Slot 02", fragranceName: "Montblanc Legend", brand: "Montblanc", remainingMl: 85.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 11000 },
            { slotLabel: "Slot 03", fragranceName: "Valentino Born in Roma", brand: "Valentino", remainingMl: 81.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13000 },
            { slotLabel: "Slot 04", fragranceName: "Roja Parfums Elysium", brand: "Roja Parfums", remainingMl: 11.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 22000 },
        ],
    },
    {
        id: "KIOSK-HN-01",
        code: "KIOSK-HN-01",
        serialNumber: "SN-2026-8804",
        deviceIdentity: "DEV-HAN-8804",
        brand: "Dior",
        locationName: "Lotte Center West Lake Lounge",
        address: "272 Vo Chi Cong, Tay Ho, Hanoi",
        coordinates: { lat: "21.0754° N", lng: "105.8115° E", xPct: 48, yPct: 22 },
        status: "ONLINE",
        connectionStatus: "ONLINE",
        operatingStatus: "ACTIVE",
        doorOpen: false,
        leakDetected: false,
        activeSlots: 4,
        totalSlots: 4,
        lastActivity: "Live (6s ago)",
        firmwareVersion: "v2.4.8-LTS",
        configVersion: "cfg-2026.11",
        installedAt: "2026-02-10",
        chamberTemp: "22.0°C",
        voltage: "24.0V DC",
        todaySprays: 49,
        todayRevenue: 710500,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Burberry Her", brand: "Burberry", remainingMl: 55.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12500 },
            { slotLabel: "Slot 02", fragranceName: "Carolina Herrera Good Girl", brand: "Carolina Herrera", remainingMl: 54.0, capacityMl: 80, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13500 },
            { slotLabel: "Slot 03", fragranceName: "Dior Sauvage", brand: "Dior", remainingMl: 84.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 14500 },
            { slotLabel: "Slot 04", fragranceName: "Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", remainingMl: 61.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13000 },
        ],
    },
    {
        id: "KIOSK-HN-02",
        code: "KIOSK-HN-02",
        serialNumber: "SN-2026-8805",
        deviceIdentity: "DEV-HAN-8805",
        brand: "Maison Margiela",
        locationName: "Trang Tien Plaza Luxury Wing",
        address: "24 Hai Ba Trung, Hoan Kiem, Hanoi",
        coordinates: { lat: "21.0245° N", lng: "105.8535° E", xPct: 55, yPct: 28 },
        status: "MAINTENANCE",
        connectionStatus: "ONLINE",
        operatingStatus: "MAINTENANCE",
        doorOpen: false,
        leakDetected: false,
        activeSlots: 0,
        totalSlots: 4,
        lastActivity: "18 mins ago",
        firmwareVersion: "v2.4.6-LTS",
        configVersion: "cfg-2026.10",
        installedAt: "2026-02-19",
        chamberTemp: "23.1°C",
        voltage: "23.8V DC",
        todaySprays: 14,
        todayRevenue: 203000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Replica By the Fireplace", brand: "Maison Margiela", remainingMl: 80.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 14500 },
            { slotLabel: "Slot 02", fragranceName: "Replica Jazz Club", brand: "Maison Margiela", remainingMl: 67.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 14500 },
            { slotLabel: "Slot 03", fragranceName: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", remainingMl: 74.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13500 },
            { slotLabel: "Slot 04", fragranceName: "Tom Ford Black Orchid", brand: "Tom Ford", remainingMl: 48.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 16000 },
        ],
    },
    {
        id: "KIOSK-DAD-01",
        code: "KIOSK-DAD-01",
        serialNumber: "SN-2026-8806",
        deviceIdentity: "DEV-DAD-8806",
        brand: "Versace",
        locationName: "IndoChina Riverside Mall Lobby",
        address: "74 Bach Dang, Hai Chau, Da Nang",
        coordinates: { lat: "16.0680° N", lng: "108.2245° E", xPct: 58, yPct: 48 },
        status: "ONLINE",
        connectionStatus: "ONLINE",
        operatingStatus: "ACTIVE",
        doorOpen: false,
        leakDetected: false,
        activeSlots: 4,
        totalSlots: 4,
        lastActivity: "Live (9s ago)",
        firmwareVersion: "v2.4.8-LTS",
        configVersion: "cfg-2026.11",
        installedAt: "2026-03-01",
        chamberTemp: "21.9°C",
        voltage: "24.0V DC",
        todaySprays: 31,
        todayRevenue: 372000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Club de Nuit Intense Man", brand: "Armaf", remainingMl: 92.0, capacityMl: 105, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 10000 },
            { slotLabel: "Slot 02", fragranceName: "MCM Eau de Parfum", brand: "MCM Worldwide", remainingMl: 66.0, capacityMl: 75, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12000 },
            { slotLabel: "Slot 03", fragranceName: "Paco Rabanne Invictus", brand: "Paco Rabanne", remainingMl: 72.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12500 },
            { slotLabel: "Slot 04", fragranceName: "Versace Dylan Blue", brand: "Versace", remainingMl: 77.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12000 },
        ],
    },
    {
        id: "KIOSK-004",
        code: "KIOSK-004",
        serialNumber: "SN-2026-8807",
        deviceIdentity: "DEV-SGN-8807",
        brand: "Tom Ford",
        locationName: "Aeon Mall Tan Phu Celadon",
        address: "30 Bo Bao Tan Thang, Tan Phu, Ho Chi Minh City",
        coordinates: undefined,
        status: "OFFLINE",
        connectionStatus: "OFFLINE",
        operatingStatus: "ERROR",
        doorOpen: false,
        leakDetected: false,
        activeSlots: 0,
        totalSlots: 4,
        lastActivity: "2 hours ago",
        firmwareVersion: "v2.4.5-LTS",
        configVersion: "cfg-2026.09",
        installedAt: "2026-03-12",
        chamberTemp: "24.2°C",
        voltage: "0.0V",
        todaySprays: 9,
        todayRevenue: 144000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Tom Ford Black Orchid", brand: "Tom Ford", remainingMl: 0.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 16000 },
            { slotLabel: "Slot 02", fragranceName: "Valentino Born in Roma", brand: "Valentino", remainingMl: 81.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 13000 },
            { slotLabel: "Slot 03", fragranceName: "Versace Bright Crystal", brand: "Versace", remainingMl: 62.0, capacityMl: 90, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 11500 },
            { slotLabel: "Slot 04", fragranceName: "Versace Dylan Blue", brand: "Versace", remainingMl: 77.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE", pricePerSpray: 12000 },
        ],
    },
];

const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

function computeDynamicActiveSlots(
    status: KioskMachineItem["status"],
    slots: MachineSlotCartridge[]
): number {
    if (status === "OFFLINE" || status === "MAINTENANCE") return 0;
    return slots.filter(
        (s) => s.remainingMl >= 0.12 && (!s.productStatus || s.productStatus === "ACTIVE")
    ).length;
}

export default function MachinesPage() {
    const router = useRouter();
    const brandDropdownRef = useRef<HTMLDivElement | null>(null);
    const locDropdownRef = useRef<HTMLDivElement | null>(null);
    const hasParsedUrlParamsRef = useRef<boolean>(false);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [machines, setMachines] = useState<KioskMachineItem[]>(INITIAL_FLEET_MACHINES);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [brandFilter, setBrandFilter] = useState<string>("ALL");
    const [isBrandMenuOpen, setIsBrandMenuOpen] = useState<boolean>(false);
    const [locationFilter, setLocationFilter] = useState<string>("ALL");
    const [isLocMenuOpen, setIsLocMenuOpen] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"cards" | "list" | "map">("cards");
    const [mapZoom, setMapZoom] = useState<number>(1);

    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [mapFocusedId, setMapFocusedId] = useState<string>("demo-device");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const [userScope, setUserScope] = useState<"OPS_MANAGER" | "INVENTORY_READ">("OPS_MANAGER");
    const [activeUserName, setActiveUserName] = useState<string>("Platform Super Administrator");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [isAddMachineOpen, setIsAddMachineOpen] = useState<boolean>(false);
    const [newMachineCode, setNewMachineCode] = useState<string>("KIOSK-SGN-05");
    const [newMachineSerial, setNewMachineSerial] = useState<string>("SN-2026-8899");
    const [newMachineBrand, setNewMachineBrand] = useState<string>("Chanel");
    const [newMachineLocation, setNewMachineLocation] = useState<string>("Landmark 81 Luxury Atrium, HCMC");
    const [newMachineAddress, setNewMachineAddress] = useState<string>("720A Dien Bien Phu, Binh Thanh, HCMC");
    const [formError, setFormError] = useState<string>("");

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
                setIsBrandMenuOpen(false);
            }
            if (locDropdownRef.current && !locDropdownRef.current.contains(e.target as Node)) {
                setIsLocMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const selectedMachine = useMemo(
        () =>
            machines.find(
                (m) =>
                    m.id.toLowerCase() === String(selectedMachineId || "").toLowerCase() ||
                    m.code.toLowerCase() === String(selectedMachineId || "").toLowerCase()
            ) || null,
        [machines, selectedMachineId]
    );

    const showToast = useCallback((msg: string) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastMessage(msg);
        toastTimerRef.current = setTimeout(() => {
            setToastMessage(null);
            toastTimerRef.current = null;
        }, 4200);
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

    const appendMachineAuditLog = useCallback(
        (action: string, entityId: string, details: Record<string, unknown>) => {
            try {
                const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const logs = rawLogs ? JSON.parse(rawLogs) : [];
                logs.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: new Date().toISOString(),
                    actor: activeUserName,
                    role: userScope === "OPS_MANAGER" ? "OM" : "IS",
                    tenant: null,
                    action,
                    entityType: "MACHINES",
                    entityId,
                    severity: "INFO",
                    oldValues: null,
                    newValues: details,
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));
            } catch {
                // Safe fallback
            }
        },
        [activeUserName, userScope]
    );

    /* --- 1. ĐỒNG BỘ 2 CHIỀU TOÀN DIỆN VỚI MÀN 1 (/), MÀN 2 (/login), MÀN 4 (/kiosk) & MÀN 5 (/products) --- */
    const loadAndReconcileFleet = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            // A. Đọc quyền RBAC từ phiên đăng nhập (/login)
            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                const roleCode = parsedUser.roleCode || parsedUser.role || parsedUser.roles?.[0] || "PSA";
                setActiveUserName(parsedUser.fullName || parsedUser.name || "Portal Administrator");
                if (roleCode === "VW" || roleCode === "VIEWER" || roleCode === "IS") {
                    setUserScope("INVENTORY_READ");
                } else {
                    setUserScope("OPS_MANAGER");
                }
                if (roleCode === "BA" && parsedUser.brandScope) {
                    setBrandFilter(parsedUser.brandScope);
                }
            }

            // B. Hỗ trợ mở trực tiếp máy từ URL (?machineId=... hoặc ?brand=...)
            if (!hasParsedUrlParamsRef.current && typeof window !== "undefined") {
                hasParsedUrlParamsRef.current = true;
                const params = new URLSearchParams(window.location.search);
                const machineIdParam = params.get("machineId");
                const brandParam = params.get("brand");
                if (machineIdParam) setSelectedMachineId(machineIdParam);
                if (brandParam) setBrandFilter(brandParam);
            }

            // C. Đọc PRODUCTS_STORAGE_KEY (/products)
            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            let hasSavedProductsCatalog = false;
            const productMetaMap = new Map<
                string,
                {
                    name: string;
                    brand: string;
                    status: "ACTIVE" | "INACTIVE" | "DRAFT";
                    capacityMl: number;
                    pricePerSpray: number;
                    hasAssignedOnKioskSet: Set<string>;
                }
            >();
            const assignedSlotOverrideMap = new Map<
                string,
                {
                    fragranceName: string;
                    brand: string;
                    remainingMl: number;
                    capacityMl: number;
                    productStatus: "ACTIVE" | "INACTIVE" | "DRAFT";
                    pricePerSpray: number;
                }
            >();

            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds) && parsedProds.length > 0) {
                    hasSavedProductsCatalog = true;
                    parsedProds.forEach((p: any) => {
                        if (!p || !p.name) return;
                        const pKey = String(p.name).trim().toLowerCase();
                        const st: "ACTIVE" | "INACTIVE" | "DRAFT" = p.status || "ACTIVE";
                        const cap = Number(p.bottleVolumeMl || 100);
                        const price = Number(p.pricePerSpray || 15000);
                        const kioskSet = new Set<string>();

                        if (Array.isArray(p.assignedMachines)) {
                            p.assignedMachines.forEach((am: any) => {
                                if (am && am.kioskCode) {
                                    const kLower = String(am.kioskCode).toLowerCase();
                                    kioskSet.add(kLower);
                                    const sNum = Number(am.slotNumber || 1);
                                    assignedSlotOverrideMap.set(`${kLower}__${sNum}`, {
                                        fragranceName: p.name,
                                        brand: p.brand || "Luxury Maison",
                                        remainingMl: Number(am.remainingVolumeMl ?? cap),
                                        capacityMl: cap,
                                        productStatus: st,
                                        pricePerSpray: price,
                                    });
                                }
                            });
                        }

                        productMetaMap.set(pKey, {
                            name: p.name,
                            brand: p.brand || "Luxury Maison",
                            status: st,
                            capacityMl: cap,
                            pricePerSpray: price,
                            hasAssignedOnKioskSet: kioskSet,
                        });
                    });
                }
            }

            // D. Đọc ma trận tồn kho từng máy (KIOSK_PER_UNIT_STOCK_KEY)
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            // E. Đọc danh sách máy từ MACHINES_STORAGE_KEY (giữ cả các máy mới Provision qua F5)
            let savedFleet: any[] = [];
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                try {
                    const parsed = JSON.parse(rawMachines);
                    if (Array.isArray(parsed)) savedFleet = parsed;
                } catch {
                    savedFleet = [];
                }
            }

            let mergedFleet: KioskMachineItem[] = INITIAL_FLEET_MACHINES.map((seedM) => {
                const matched = savedFleet.find(
                    (sm: any) =>
                        String(sm.code || sm.id || "").toLowerCase() === seedM.code.toLowerCase()
                );
                if (!matched) return seedM;

                const conn: "ONLINE" | "OFFLINE" =
                    matched.connectionStatus ||
                    (matched.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                const oper: "ACTIVE" | "MAINTENANCE" | "DISABLED" | "ERROR" =
                    matched.operatingStatus ||
                    (matched.status === "MAINTENANCE"
                        ? "MAINTENANCE"
                        : matched.status === "OFFLINE"
                            ? "ERROR"
                            : "ACTIVE");
                const unifiedStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" =
                    conn === "OFFLINE"
                        ? "OFFLINE"
                        : oper === "MAINTENANCE"
                            ? "MAINTENANCE"
                            : oper === "ACTIVE"
                                ? "ONLINE"
                                : "OFFLINE";

                return {
                    ...seedM,
                    ...matched,
                    id: seedM.id,
                    code: seedM.code,
                    coordinates: matched.coordinates || seedM.coordinates,
                    status: unifiedStatus,
                    connectionStatus: conn,
                    operatingStatus: oper,
                    manualAdminOverride: Boolean(matched.manualAdminOverride),
                    doorOpen: Boolean(matched.doorOpen),
                    leakDetected: Boolean(matched.leakDetected),
                    slots:
                        Array.isArray(matched.slots) && matched.slots.length === 4
                            ? matched.slots
                            : seedM.slots,
                };
            });

            // Nối thêm các máy Kiosk mới do Admin bấm "+ Provision Kiosk" tạo thêm
            const seedCodes = new Set(INITIAL_FLEET_MACHINES.map((m) => m.code.toLowerCase()));
            const customProvisioned = savedFleet.filter(
                (sm: any) =>
                    sm &&
                    sm.code &&
                    !seedCodes.has(String(sm.code).toLowerCase())
            );
            customProvisioned.forEach((cm: any) => {
                const conn: "ONLINE" | "OFFLINE" =
                    cm.connectionStatus || (cm.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                const oper: "ACTIVE" | "MAINTENANCE" | "DISABLED" | "ERROR" =
                    cm.operatingStatus ||
                    (cm.status === "MAINTENANCE"
                        ? "MAINTENANCE"
                        : cm.status === "OFFLINE"
                            ? "ERROR"
                            : "ACTIVE");
                const unifiedStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" =
                    conn === "OFFLINE"
                        ? "OFFLINE"
                        : oper === "MAINTENANCE"
                            ? "MAINTENANCE"
                            : "ONLINE";

                mergedFleet.unshift({
                    ...INITIAL_FLEET_MACHINES[0],
                    ...cm,
                    id: cm.id || cm.code,
                    code: cm.code,
                    status: unifiedStatus,
                    connectionStatus: conn,
                    operatingStatus: oper,
                });
            });

            // F. Đồng bộ dung tích bình (ml), trạng thái sản phẩm (ACTIVE/INACTIVE) cho từng Slot của từng máy
            mergedFleet = mergedFleet.map((m) => {
                const kLower = m.code.toLowerCase();
                const syncedSlots: MachineSlotCartridge[] = m.slots.map((sl, idx) => {
                    const slotNum = idx + 1;
                    const assignedFromProducts = assignedSlotOverrideMap.get(
                        `${kLower}__${slotNum}`
                    );

                    const effectiveFragranceName =
                        assignedFromProducts?.fragranceName || sl.fragranceName;
                    const fKey = effectiveFragranceName.trim().toLowerCase();
                    const pMeta = productMetaMap.get(fKey);

                    const matrixMl = perKioskMatrix[kLower]?.[fKey];

                    // Nếu ở /products đã gỡ chai này ra khỏi trạm này -> hiển thị 0ml & INACTIVE
                    const wasUnassignedInProducts =
                        hasSavedProductsCatalog &&
                        pMeta &&
                        !pMeta.hasAssignedOnKioskSet.has(kLower) &&
                        !assignedFromProducts;

                    const nextMl = wasUnassignedInProducts
                        ? 0
                        : typeof matrixMl === "number"
                            ? matrixMl
                            : assignedFromProducts
                                ? assignedFromProducts.remainingMl
                                : sl.remainingMl;

                    const nextCap =
                        pMeta?.capacityMl ||
                        assignedFromProducts?.capacityMl ||
                        sl.capacityMl ||
                        100;

                    const nextProdStatus = wasUnassignedInProducts
                        ? "INACTIVE"
                        : pMeta?.status ||
                        assignedFromProducts?.productStatus ||
                        sl.productStatus ||
                        "ACTIVE";

                    return {
                        ...sl,
                        slotLabel: `Slot 0${slotNum}`,
                        fragranceName: effectiveFragranceName,
                        brand: pMeta?.brand || assignedFromProducts?.brand || sl.brand,
                        remainingMl: Number(Math.max(0, nextMl).toFixed(2)),
                        capacityMl: nextCap,
                        lowStockThresholdMl: sl.lowStockThresholdMl || 15,
                        productStatus: nextProdStatus,
                        pricePerSpray: pMeta?.pricePerSpray || sl.pricePerSpray || 15000,
                    };
                });

                return {
                    ...m,
                    slots: syncedSlots,
                    activeSlots: computeDynamicActiveSlots(m.status, syncedSlots),
                };
            });

            setMachines(mergedFleet);
            localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(mergedFleet));
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadAndReconcileFleet();

        const handleCrossTabSync = () => {
            loadAndReconcileFleet();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileFleet();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [loadAndReconcileFleet]);

    /* --- 2. LƯU & PHÁT TÍN HIỆU ĐỒNG BỘ TỨC THÌ SANG MÀN 1, MÀN 4, MÀN 5, DASHBOARD & ALERTS --- */
    const persistFleetAndPropagateAll = useCallback(
        (
            updatedFleet: KioskMachineItem[],
            modifiedKiosk?: KioskMachineItem,
            didRefillOrReboot?: boolean,
            sprayedSlotMeta?: {
                slotNumber: number;
                slotLabel: string;
                fragranceName: string;
                brand: string;
                pricePerSpray: number;
                qtyBeforeMl: number;
                qtyAfterMl: number;
            }
        ) => {
            setMachines(updatedFleet);
            try {
                // 1. Lưu kho MACHINES_STORAGE_KEY
                localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));

                if (modifiedKiosk) {
                    const kKey = modifiedKiosk.code.toLowerCase();

                    // 2. Đồng bộ sang KIOSK_PER_UNIT_STOCK_KEY (Để Màn 1 & Màn 4 nhận đúng số ml ngay lập tức)
                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                        ? JSON.parse(rawMatrix)
                        : {};
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    modifiedKiosk.slots.forEach((sl) => {
                        const fKey = sl.fragranceName.trim().toLowerCase();
                        perKioskMatrix[kKey][fKey] = Number(sl.remainingMl);
                    });
                    localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                    // 3. Đồng bộ sang PRODUCTS_STORAGE_KEY (Cập nhật machineStatus, remainingVolumeMl & liveExtraSprays cho Màn 5 /products)
                    const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                    if (rawProds) {
                        const parsedProds = JSON.parse(rawProds);
                        if (Array.isArray(parsedProds)) {
                            const syncedProds = parsedProds.map((p: any) => {
                                const slotIdx = modifiedKiosk.slots.findIndex((sl) =>
                                    isExactMatch(sl.fragranceName, p.name || "")
                                );
                                const slotMatch = slotIdx >= 0 ? modifiedKiosk.slots[slotIdx] : undefined;
                                const isSprayedProduct =
                                    sprayedSlotMeta &&
                                    isExactMatch(sprayedSlotMeta.fragranceName, p.name || "");

                                const nextExtra = isSprayedProduct
                                    ? Number(p.liveExtraSprays || 0) + 1
                                    : Number(p.liveExtraSprays || 0);
                                const base30d = Number(p.baseSessions30d || 300);

                                let nextAssigned = Array.isArray(p.assignedMachines)
                                    ? p.assignedMachines.map((am: any) => {
                                        if (String(am.kioskCode || "").toLowerCase() !== kKey) {
                                            return am;
                                        }
                                        return {
                                            ...am,
                                            machineStatus: modifiedKiosk.status,
                                            remainingVolumeMl: slotMatch
                                                ? slotMatch.remainingMl
                                                : am.remainingVolumeMl,
                                        };
                                    })
                                    : [];

                                // Nếu máy mới được Provision có chứa sản phẩm này mà chưa có trong assignedMachines -> tự động thêm vào
                                if (
                                    slotMatch &&
                                    !nextAssigned.some(
                                        (am: any) => String(am.kioskCode || "").toLowerCase() === kKey
                                    )
                                ) {
                                    nextAssigned = [
                                        ...nextAssigned,
                                        {
                                            kioskCode: modifiedKiosk.code,
                                            location: modifiedKiosk.locationName,
                                            slotNumber: slotIdx + 1,
                                            physicalSlotLabel: slotMatch.slotLabel,
                                            machineStatus: modifiedKiosk.status,
                                            bottleCode: `BTL-2026-${Math.floor(1000 + Math.random() * 8999)}`,
                                            remainingVolumeMl: slotMatch.remainingMl,
                                            thresholdPct: 15,
                                            lastRefilled: new Date().toISOString().split("T")[0],
                                        },
                                    ];
                                }

                                return {
                                    ...p,
                                    liveExtraSprays: nextExtra,
                                    samplingSessions30d: base30d + nextExtra,
                                    assignedMachines: nextAssigned,
                                };
                            });
                            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(syncedProds));
                        }
                    }

                    // 4. Đồng bộ sang DASHBOARD_STORAGE_KEY
                    const dashRaw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                    const dashData = dashRaw
                        ? JSON.parse(dashRaw)
                        : { transactions: [], incidents: [], alerts: [] };
                    if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                    if (!Array.isArray(dashData.alerts)) dashData.alerts = [];

                    if (sprayedSlotMeta) {
                        const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
                        const nowIso = new Date().toISOString();
                        dashData.transactions.unshift({
                            id: newOrderId,
                            time: `Completed (${modifiedKiosk.code})`,
                            kiosk: modifiedKiosk.code,
                            slotNumber: sprayedSlotMeta.slotNumber,
                            brand: sprayedSlotMeta.brand,
                            product: sprayedSlotMeta.fragranceName,
                            priceSnapshot: sprayedSlotMeta.pricePerSpray,
                            amount: sprayedSlotMeta.pricePerSpray,
                            paidAmount: sprayedSlotMeta.pricePerSpray,
                            paymentMethod: "VIETQR",
                            providerReference: `PAY-VIETQR-${newOrderId}`,
                            status: "DISPENSED",
                            commandReference: `CMD-${newOrderId}`,
                            ackedAt: nowIso,
                            executedAt: nowIso,
                            createdAt: nowIso,
                        });
                    }

                    if (didRefillOrReboot && modifiedKiosk.status === "ONLINE") {
                        dashData.alerts = dashData.alerts.map((a: any) =>
                            String(a.machineId || a.kiosk || "").toLowerCase() === kKey
                                ? { ...a, status: "RESOLVED", resolvedAt: new Date().toISOString() }
                                : a
                        );
                    }
                    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));
                }

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        []
    );

    // THAO TÁC 1: Khởi động lại từ xa (Remote MQTT Reboot: Đưa máy OFFLINE / MAINTENANCE -> ONLINE & ACTIVE)
    const handleRemoteRebootMachine = (target: KioskMachineItem) => {
        if (userScope !== "OPS_MANAGER") return;

        const recoveredSlots = target.slots.map((sl) =>
            sl.remainingMl < 0.12
                ? { ...sl, remainingMl: sl.capacityMl, productStatus: "ACTIVE" as const }
                : sl
        );

        const updatedItem: KioskMachineItem = {
            ...target,
            status: "ONLINE",
            connectionStatus: "ONLINE",
            operatingStatus: "ACTIVE",
            manualAdminOverride: true,
            doorOpen: false,
            leakDetected: false,
            slots: recoveredSlots,
            activeSlots: computeDynamicActiveSlots("ONLINE", recoveredSlots),
            lastActivity: "Live (MQTT Reconnected)",
            chamberTemp: "21.5°C",
            voltage: "24.0V DC",
            configVersion: "cfg-2026.11",
        };

        const updatedFleet = machines.map((m) =>
            m.id === target.id ? updatedItem : m
        );
        persistFleetAndPropagateAll(updatedFleet, updatedItem, true);
        appendMachineAuditLog("MACHINE_REMOTE_REBOOT_ONLINE", target.code, {
            newStatus: "ONLINE",
            location: target.locationName,
        });
        showToast(
            lang === "en"
                ? `Station ${target.code} (${target.locationName}) restored to ONLINE service and synchronized to Storefront & Kiosk!`
                : `Đã kích hoạt lại trạm ${target.code} (${target.locationName}) sang trạng thái ONLINE và đồng bộ lên Trang chủ & Kiosk!`
        );
    };

    // THAO TÁC 2: Ngắt kết nối trạm (Disconnect Station -> OFFLINE: Khóa nhận đơn mới trên Màn 1 & Màn 4)
    const handleForceOfflineMachine = (target: KioskMachineItem) => {
        if (userScope !== "OPS_MANAGER") return;

        const updatedItem: KioskMachineItem = {
            ...target,
            status: "OFFLINE",
            connectionStatus: "OFFLINE",
            operatingStatus: "ERROR",
            manualAdminOverride: true,
            activeSlots: 0,
            lastActivity: "Disconnected",
            voltage: "0.0V",
        };

        const updatedFleet = machines.map((m) =>
            m.id === target.id ? updatedItem : m
        );
        persistFleetAndPropagateAll(updatedFleet, updatedItem, false);
        appendMachineAuditLog("MACHINE_SET_OFFLINE", target.code, {
            newStatus: "OFFLINE",
            location: target.locationName,
        });
        showToast(
            lang === "en"
                ? `Station ${target.code} is now OFFLINE. New customer orders on Storefront & Kiosk are locked.`
                : `Trạm ${target.code} đã chuyển sang OFFLINE. Đã khóa nhận đơn mới trên Trang chủ & Kiosk.`
        );
    };

    // THAO TÁC 3: Chuyển đổi chế độ Bảo trì (Toggle Maintenance Mode: Tạm ngưng nhận đơn trên Màn 1 & Màn 4)
    const handleToggleMaintenanceMode = (target: KioskMachineItem) => {
        if (userScope !== "OPS_MANAGER") return;

        const isEnteringMaint = target.status !== "MAINTENANCE";
        const nextStatus: KioskMachineItem["status"] = isEnteringMaint
            ? "MAINTENANCE"
            : "ONLINE";

        const updatedItem: KioskMachineItem = {
            ...target,
            status: nextStatus,
            connectionStatus: "ONLINE",
            operatingStatus: isEnteringMaint ? "MAINTENANCE" : "ACTIVE",
            manualAdminOverride: true,
            activeSlots: computeDynamicActiveSlots(nextStatus, target.slots),
            lastActivity: isEnteringMaint
                ? "Maintenance Mode Active"
                : "Live (Restored to Service)",
            voltage: "24.0V DC",
        };

        const updatedFleet = machines.map((m) =>
            m.id === target.id ? updatedItem : m
        );
        persistFleetAndPropagateAll(updatedFleet, updatedItem, !isEnteringMaint);
        appendMachineAuditLog("MACHINE_MAINTENANCE_TOGGLED", target.code, {
            newStatus: nextStatus,
            location: target.locationName,
        });
        showToast(
            lang === "en"
                ? `Station ${target.code} transitioned to ${nextStatus} and synchronized across all screens.`
                : `Đã chuyển trạm ${target.code} sang trạng thái ${nextStatus} và đồng bộ toàn hệ thống.`
        );
    };

    // THAO TÁC 4: Xịt thử (-0.12ml) trên một khoang cụ thể (hoặc khoang đầu tiên còn dung dịch) & đồng bộ sang Màn 1, 4, 5
    const handleDiagnosticTestSpray = (
        target: KioskMachineItem,
        specificSlotIdx?: number
    ) => {
        if (userScope !== "OPS_MANAGER") return;
        if (target.status === "OFFLINE") {
            showToast(
                lang === "en"
                    ? `Cannot execute spray while station ${target.code} is OFFLINE.`
                    : `Không thể xịt khi trạm ${target.code} đang OFFLINE.`
            );
            return;
        }

        const slotIdxToSpray =
            typeof specificSlotIdx === "number"
                ? specificSlotIdx
                : target.slots.findIndex(
                    (s) =>
                        s.remainingMl >= 0.12 &&
                        (!s.productStatus || s.productStatus === "ACTIVE")
                );

        if (slotIdxToSpray === -1 || target.slots[slotIdxToSpray].remainingMl < 0.12) {
            showToast(
                lang === "en"
                    ? `Selected chamber on ${target.code} is depleted (0ml). Please replenish first.`
                    : `Khoang đã chọn trên trạm ${target.code} đã cạn (0ml). Vui lòng nạp đầy trước.`
            );
            return;
        }

        const testedSlot = target.slots[slotIdxToSpray];
        const qtyBefore = testedSlot.remainingMl;
        const qtyAfter = Number(Math.max(0, qtyBefore - 0.12).toFixed(2));
        const sprayPrice = Number(testedSlot.pricePerSpray || 15000);

        const updatedSlots = target.slots.map((s, idx) =>
            idx === slotIdxToSpray ? { ...s, remainingMl: qtyAfter } : s
        );

        const updatedItem: KioskMachineItem = {
            ...target,
            todaySprays: (target.todaySprays || 0) + 1,
            todayRevenue: (target.todayRevenue || 0) + sprayPrice,
            activeSlots: computeDynamicActiveSlots(target.status, updatedSlots),
            lastActivity: `Live (Dispensed ${testedSlot.slotLabel})`,
            slots: updatedSlots,
        };

        const updatedFleet = machines.map((m) =>
            m.id === target.id ? updatedItem : m
        );

        try {
            const rawMovements = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
            const movements = rawMovements ? JSON.parse(rawMovements) : [];
            movements.unshift({
                movementId: `MOV-${Date.now()}`,
                orderId: `ORD-2026-${Date.now().toString().slice(-4)}`,
                kioskCode: target.code,
                slotNumber: slotIdxToSpray + 1,
                brand: testedSlot.brand,
                productName: testedSlot.fragranceName,
                movementType: "SALE",
                quantityBeforeMl: qtyBefore,
                quantityAfterMl: qtyAfter,
                deltaMl: -0.12,
                reason: `Fleet console calibrated spray on ${target.code} (${testedSlot.slotLabel})`,
                timestamp: new Date().toISOString(),
            });
            localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(movements.slice(0, 300)));
        } catch {
            // Safe fallback
        }

        persistFleetAndPropagateAll(updatedFleet, updatedItem, false, {
            slotNumber: slotIdxToSpray + 1,
            slotLabel: testedSlot.slotLabel,
            fragranceName: testedSlot.fragranceName,
            brand: testedSlot.brand,
            pricePerSpray: sprayPrice,
            qtyBeforeMl: qtyBefore,
            qtyAfterMl: qtyAfter,
        });
        appendMachineAuditLog("MACHINE_CALIBRATED_SPRAY", target.code, {
            slotLabel: testedSlot.slotLabel,
            fragranceName: testedSlot.fragranceName,
            qtyBeforeMl: qtyBefore,
            qtyAfterMl: qtyAfter,
        });
        showToast(
            lang === "en"
                ? `Dispensed 1 spray (-0.12ml) on ${target.code} ${testedSlot.slotLabel} (${testedSlot.fragranceName}: ${qtyAfter}ml). Synchronized to Storefront, Kiosk & Products!`
                : `Đã xịt 1 lần (-0.12ml) tại ${target.code} ${testedSlot.slotLabel} (${testedSlot.fragranceName}: còn ${qtyAfter}ml). Đã đồng bộ sang Màn 1, 4 & 5!`
        );
    };

    // THAO TÁC 5: Nạp đầy 1 khoang cụ thể hoặc cả 4 khoang lên 100% (Đồng bộ sang Màn 1, 4, 5)
    const handleRefillAllSlots = (
        target: KioskMachineItem,
        specificSlotIdx?: number
    ) => {
        if (userScope !== "OPS_MANAGER") return;

        const refilledSlots = target.slots.map((sl, idx) => {
            if (typeof specificSlotIdx === "number" && idx !== specificSlotIdx) {
                return sl;
            }
            return {
                ...sl,
                remainingMl: sl.capacityMl,
                productStatus: "ACTIVE" as const,
            };
        });

        const updatedItem: KioskMachineItem = {
            ...target,
            slots: refilledSlots,
            activeSlots: computeDynamicActiveSlots(target.status, refilledSlots),
            lastActivity:
                typeof specificSlotIdx === "number"
                    ? `Live (${target.slots[specificSlotIdx].slotLabel} Replenished 100%)`
                    : "Live (All 4 Chambers Replenished)",
        };

        const updatedFleet = machines.map((m) =>
            m.id === target.id ? updatedItem : m
        );
        persistFleetAndPropagateAll(updatedFleet, updatedItem, true);
        appendMachineAuditLog("MACHINE_SLOTS_REPLENISHED", target.code, {
            location: target.locationName,
            slot:
                typeof specificSlotIdx === "number"
                    ? target.slots[specificSlotIdx].slotLabel
                    : "ALL_4_SLOTS",
        });
        showToast(
            typeof specificSlotIdx === "number"
                ? lang === "en"
                    ? `Replenished ${target.code} ${target.slots[specificSlotIdx].slotLabel} (${target.slots[specificSlotIdx].fragranceName}) to ${target.slots[specificSlotIdx].capacityMl}ml (100%)!`
                    : `Đã nạp đầy ${target.code} ${target.slots[specificSlotIdx].slotLabel} (${target.slots[specificSlotIdx].fragranceName}) lên ${target.slots[specificSlotIdx].capacityMl}ml (100%)!`
                : lang === "en"
                    ? `Replenished all 4 fragrance chambers on ${target.code} to 100% capacity and synchronized across Storefront, Kiosk & Products!`
                    : `Đã nạp đầy 100% cho cả 4 khoang chứa của trạm ${target.code} và đồng bộ sang Màn 1, 4 & 5!`
        );
    };

    // THAO TÁC 6: Đồng bộ cấu hình & Firmware OTA
    const handleOtaFirmwareSync = (target: KioskMachineItem) => {
        if (userScope !== "OPS_MANAGER") return;
        if (target.status === "OFFLINE") {
            showToast(
                lang === "en"
                    ? `OTA Sync Queued: ${target.code} is currently offline and will update upon reconnection.`
                    : `Đã xếp hàng cập nhật OTA: Trạm ${target.code} đang ngoại tuyến, sẽ tự cập nhật khi kết nối lại.`
            );
            return;
        }

        const updatedItem: KioskMachineItem = {
            ...target,
            firmwareVersion: "v2.4.9-LTS",
            configVersion: "cfg-2026.12",
            lastActivity: "Live (OTA Config Synced)",
        };

        const updatedFleet = machines.map((m) =>
            m.id === target.id ? updatedItem : m
        );
        persistFleetAndPropagateAll(updatedFleet, updatedItem, false);
        appendMachineAuditLog("MACHINE_OTA_FIRMWARE_SYNCED", target.code, {
            firmwareVersion: "v2.4.9-LTS",
            configVersion: "cfg-2026.12",
        });
        showToast(
            lang === "en"
                ? `Synchronized Firmware v2.4.9-LTS & Configuration cfg-2026.12 to ${target.code}!`
                : `Đã đồng bộ Firmware v2.4.9-LTS & Cấu hình cfg-2026.12 xuống trạm ${target.code}!`
        );
    };

    // THAO TÁC 7: Đăng ký máy Kiosk mới (+ Provision Kiosk)
    const handleCreateMachineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        const cleanCode = newMachineCode.trim();
        if (!cleanCode || !newMachineLocation.trim()) {
            setFormError(
                lang === "en"
                    ? "Machine Code and Installation Venue are required."
                    : "Mã trạm và Địa điểm lắp đặt là bắt buộc."
            );
            return;
        }
        if (
            machines.some(
                (m) => m.code.toLowerCase() === cleanCode.toLowerCase()
            )
        ) {
            setFormError(
                lang === "en"
                    ? `Duplicate Machine Code: "${cleanCode}" already exists in the fleet.`
                    : `Mã trạm "${cleanCode}" đã tồn tại trên hệ thống.`
            );
            return;
        }

        const newKiosk: KioskMachineItem = {
            id: cleanCode,
            code: cleanCode,
            serialNumber:
                newMachineSerial.trim() ||
                `SN-2026-${Math.floor(8900 + Math.random() * 900)}`,
            deviceIdentity: `DEV-${cleanCode.toUpperCase()}`,
            brand: newMachineBrand,
            locationName: newMachineLocation.trim(),
            address: newMachineAddress.trim() || "Ho Chi Minh City, Vietnam",
            coordinates: {
                lat: "10.7950° N",
                lng: "106.7218° E",
                xPct: 71,
                yPct: 64,
            },
            status: "ONLINE",
            connectionStatus: "ONLINE",
            operatingStatus: "ACTIVE",
            manualAdminOverride: true,
            doorOpen: false,
            leakDetected: false,
            activeSlots: 4,
            totalSlots: 4,
            lastActivity: "Live (Provisioned)",
            firmwareVersion: "v2.4.8-LTS",
            configVersion: "cfg-2026.11",
            installedAt: new Date().toISOString().split("T")[0],
            chamberTemp: "21.3°C",
            voltage: "24.0V DC",
            todaySprays: 0,
            todayRevenue: 0,
            slots: [
                {
                    slotLabel: "Slot 01",
                    fragranceName: "Bleu de Chanel",
                    brand: "Chanel",
                    remainingMl: 100,
                    capacityMl: 100,
                    lowStockThresholdMl: 15,
                    productStatus: "ACTIVE",
                    pricePerSpray: 15000,
                },
                {
                    slotLabel: "Slot 02",
                    fragranceName: "Coco Mademoiselle",
                    brand: "Chanel",
                    remainingMl: 100,
                    capacityMl: 100,
                    lowStockThresholdMl: 15,
                    productStatus: "ACTIVE",
                    pricePerSpray: 15500,
                },
                {
                    slotLabel: "Slot 03",
                    fragranceName: "Creed Aventus",
                    brand: "Creed",
                    remainingMl: 100,
                    capacityMl: 100,
                    lowStockThresholdMl: 15,
                    productStatus: "ACTIVE",
                    pricePerSpray: 20000,
                },
                {
                    slotLabel: "Slot 04",
                    fragranceName: "Dior Sauvage",
                    brand: "Dior",
                    remainingMl: 100,
                    capacityMl: 100,
                    lowStockThresholdMl: 15,
                    productStatus: "ACTIVE",
                    pricePerSpray: 14500,
                },
            ],
        };

        const updatedFleet = [newKiosk, ...machines];
        persistFleetAndPropagateAll(updatedFleet, newKiosk, false);
        appendMachineAuditLog("MACHINE_PROVISIONED", cleanCode, {
            serialNumber: newKiosk.serialNumber,
            brand: newKiosk.brand,
            locationName: newKiosk.locationName,
        });
        setIsAddMachineOpen(false);
        showToast(
            lang === "en"
                ? `Provisioned new station "${cleanCode}" at ${newKiosk.locationName} and synchronized across all screens!`
                : `Đã khởi tạo trạm Kiosk mới "${cleanCode}" tại ${newKiosk.locationName} và đồng bộ toàn hệ thống!`
        );
    };

    const onlineCount = machines.filter((m) => m.status === "ONLINE").length;
    const offlineCount = machines.filter((m) => m.status === "OFFLINE").length;
    const maintenanceCount = machines.filter(
        (m) => m.status === "MAINTENANCE"
    ).length;

    const uniqueBrands = useMemo(() => {
        const brandSet = new Set<string>();
        machines.forEach((m) => {
            brandSet.add(m.brand);
            m.slots.forEach((sl) => brandSet.add(sl.brand));
        });
        return Array.from(brandSet).sort();
    }, [machines]);

    const uniqueLocations = useMemo(
        () => Array.from(new Set(machines.map((m) => m.locationName))).sort(),
        [machines]
    );

    const filteredMachines = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return machines.filter((m) => {
            const matchesSearch =
                !q ||
                m.code.toLowerCase().includes(q) ||
                m.serialNumber.toLowerCase().includes(q) ||
                m.locationName.toLowerCase().includes(q) ||
                m.address.toLowerCase().includes(q) ||
                m.brand.toLowerCase().includes(q) ||
                m.slots.some(
                    (sl) =>
                        sl.fragranceName.toLowerCase().includes(q) ||
                        sl.brand.toLowerCase().includes(q)
                );
            const matchesStatus =
                statusFilter === "ALL" || m.status === statusFilter;
            const matchesBrand =
                brandFilter === "ALL" ||
                m.brand === brandFilter ||
                m.slots.some((sl) => sl.brand === brandFilter);
            const matchesLoc =
                locationFilter === "ALL" || m.locationName === locationFilter;

            return matchesSearch && matchesStatus && matchesBrand && matchesLoc;
        });
    }, [machines, searchQuery, statusFilter, brandFilter, locationFilter]);

    const handleResetFilters = () => {
        setSearchQuery("");
        setStatusFilter("ALL");
        setBrandFilter("ALL");
        setLocationFilter("ALL");
    };

    const renderStatusBadge = (status: KioskMachineItem["status"]) => {
        if (status === "ONLINE") {
            return (
                <div className={styles.badgeOnline}>
                    <span className={styles.dotOnline} />
                    ONLINE
                </div>
            );
        }
        if (status === "MAINTENANCE") {
            return (
                <div className={styles.badgeMaintenance}>
                    <span className={styles.dotMaintenance} />
                    MAINTENANCE
                </div>
            );
        }
        return (
            <div className={styles.badgeOffline}>
                <span className={styles.dotOffline} />
                OFFLINE
            </div>
        );
    };

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => setOpenMenuId(null)}
        >
            <div className={styles.workspaceInner}>
                {/* LUXURY HERO BANNER CARD */}
                <div className={styles.heroBannerCard}>
                    <div className={styles.header}>
                        <div>
                            <span className={styles.eyebrowTag}>
                                {lang === "en"
                                    ? "IOT SAMPLING NETWORK & CHAMBER TELEMETRY"
                                    : "QUẢN TRỊ MẠNG LƯỚI TRẠM KIOSK & CẢM BIẾN BUỒNG XỊT"}
                            </span>
                            <h1 className={styles.title}>
                                {lang === "en"
                                    ? "IoT Machine Fleet Management"
                                    : "Quản Trị Đội Máy Kiosk Trải Nghiệm"}
                            </h1>
                            <p className={styles.subtitle}>
                                {lang === "en"
                                    ? `Real-time heartbeat monitoring across ${machines.length} automated sampling stations, climate-controlled chamber diagnostics, and 4-slot cartridge telemetry.`
                                    : `Giám sát tín hiệu kết nối thời gian thực trên ${machines.length} trạm Kiosk tự động, kiểm soát nhiệt độ bảo quản và dung tích 4 khoang chứa nước hoa.`}
                            </p>
                        </div>

                        <div className={styles.headerActionGroup}>
                            <button
                                type="button"
                                onClick={handleToggleLanguage}
                                className={styles.secondaryGoldBtn}
                            >
                                <Globe size={14} color="#D4AF37" />
                                <span>{lang === "en" ? "EN" : "VI"}</span>
                            </button>

                            {userScope === "OPS_MANAGER" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormError("");
                                        setIsAddMachineOpen(true);
                                    }}
                                    className={styles.primaryGoldBtn}
                                >
                                    <Plus size={16} />
                                    <span>
                                        {lang === "en" ? "Provision Kiosk" : "Thêm Trạm Kiosk"}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 4 KPI SUMMARY CARDS */}
                    <div className={styles.statsGrid}>
                        <div
                            onClick={() => setStatusFilter("ALL")}
                            className={`${styles.statCard} ${
                                statusFilter === "ALL" ? styles.statCardActive : ""
                            }`}
                        >
                            <div>
                                <p className={styles.statLabel}>
                                    {lang === "en" ? "Total Stations" : "Tổng Số Trạm Kiosk"}
                                </p>
                                <p className={styles.statValue}>{machines.length} Units</p>
                                <div className={styles.statSubHint} style={{ color: "#F5E6AD" }}>
                                    {lang === "en"
                                        ? `${machines.length * 4} fragrance chambers`
                                        : `${machines.length * 4} khoang chứa định lượng`}
                                </div>
                            </div>
                            <div className={styles.statIconBox}>
                                <Cpu size={20} />
                            </div>
                        </div>

                        <div
                            onClick={() => setStatusFilter("ONLINE")}
                            className={`${styles.statCard} ${styles.statOnline} ${
                                statusFilter === "ONLINE" ? styles.statCardActive : ""
                            }`}
                        >
                            <div>
                                <p className={styles.statLabel}>
                                    {lang === "en" ? "Online & Operational" : "Đang Hoạt Động"}
                                </p>
                                <p className={styles.statValue} style={{ color: "#34D399" }}>
                                    {onlineCount} Online
                                </p>
                                <div className={styles.statSubHint}>
                                    {lang === "en"
                                        ? "Ready for QR sampling"
                                        : "Sẵn sàng nhận đơn quét QR"}
                                </div>
                            </div>
                            <div className={styles.statIconBox}>
                                <Activity size={20} />
                            </div>
                        </div>

                        <div
                            onClick={() => setStatusFilter("MAINTENANCE")}
                            className={`${styles.statCard} ${styles.statMaintenance} ${
                                statusFilter === "MAINTENANCE" ? styles.statCardActive : ""
                            }`}
                        >
                            <div>
                                <p className={styles.statLabel}>
                                    {lang === "en" ? "Under Maintenance" : "Đang Bảo Trì"}
                                </p>
                                <p className={styles.statValue} style={{ color: "#FBBF24" }}>
                                    {maintenanceCount} Paused
                                </p>
                                <div className={styles.statSubHint}>
                                    {lang === "en"
                                        ? "Scheduled calibration"
                                        : "Tạm khóa để kiểm chuẩn"}
                                </div>
                            </div>
                            <div className={styles.statIconBox}>
                                <AlertTriangle size={20} />
                            </div>
                        </div>

                        <div
                            onClick={() => setStatusFilter("OFFLINE")}
                            className={`${styles.statCard} ${styles.statOffline} ${
                                statusFilter === "OFFLINE" ? styles.statCardActive : ""
                            }`}
                        >
                            <div>
                                <p className={styles.statLabel}>
                                    {lang === "en" ? "Offline / Disconnected" : "Mất Kết Nối"}
                                </p>
                                <p className={styles.statValue} style={{ color: "#F87171" }}>
                                    {offlineCount} Offline
                                </p>
                                <div className={styles.statSubHint}>
                                    {lang === "en"
                                        ? "Requires remote reboot"
                                        : "Cần khởi động lại kết nối"}
                                </div>
                            </div>
                            <div className={styles.statIconBox}>
                                <WifiOff size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILTER BAR & CUSTOM DROPDOWNS */}
                <div className={styles.filterBar}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={
                                lang === "en"
                                    ? "Search station code (KIOSK-SGN-01), serial, venue, or installed fragrance..."
                                    : "Tìm mã trạm (KIOSK-SGN-01), số serial, địa điểm hoặc mùi hương trong khoang..."
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className={styles.clearSearchBtn}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className={styles.pillGroup}>
                        {(["ALL", "ONLINE", "MAINTENANCE", "OFFLINE"] as const).map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setStatusFilter(st)}
                                className={`${styles.filterPillBtn} ${
                                    statusFilter === st ? styles.filterPillBtnActive : ""
                                }`}
                            >
                                {st === "ALL"
                                    ? lang === "en"
                                        ? "All Status"
                                        : "Tất cả"
                                    : st}
                            </button>
                        ))}
                    </div>

                    {/* Custom Brand Dropdown */}
                    <div className={styles.customDropdownWrap} ref={brandDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsBrandMenuOpen((prev) => !prev)}
                            className={`${styles.customDropdownTrigger} ${
                                brandFilter !== "ALL" ? styles.customDropdownTriggerActive : ""
                            }`}
                        >
                            <SlidersHorizontal size={13} color="#D4AF37" />
                            <span>
                                {brandFilter === "ALL"
                                    ? lang === "en"
                                        ? `All Maisons (${uniqueBrands.length})`
                                        : `Mọi Thương Hiệu (${uniqueBrands.length})`
                                    : brandFilter}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>

                        {isBrandMenuOpen && (
                            <div className={styles.customDropdownMenu}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBrandFilter("ALL");
                                        setIsBrandMenuOpen(false);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        brandFilter === "ALL" ? styles.customDropdownItemActive : ""
                                    }`}
                                >
                                    <span>
                                        {lang === "en"
                                            ? `All Maisons (${uniqueBrands.length})`
                                            : `Mọi Thương Hiệu (${uniqueBrands.length})`}
                                    </span>
                                    {brandFilter === "ALL" && <Check size={14} color="#D4AF37" />}
                                </button>
                                {uniqueBrands.map((b) => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => {
                                            setBrandFilter(b);
                                            setIsBrandMenuOpen(false);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            brandFilter === b ? styles.customDropdownItemActive : ""
                                        }`}
                                    >
                                        <span>{b}</span>
                                        {brandFilter === b && <Check size={14} color="#D4AF37" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Custom Location Dropdown */}
                    <div className={styles.customDropdownWrap} ref={locDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsLocMenuOpen((prev) => !prev)}
                            className={`${styles.customDropdownTrigger} ${
                                locationFilter !== "ALL" ? styles.customDropdownTriggerActive : ""
                            }`}
                        >
                            <MapPin size={13} color="#D4AF37" />
                            <span>
                                {locationFilter === "ALL"
                                    ? lang === "en"
                                        ? `All Boutiques (${uniqueLocations.length})`
                                        : `Mọi Địa Điểm (${uniqueLocations.length})`
                                    : locationFilter}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>

                        {isLocMenuOpen && (
                            <div className={styles.customDropdownMenu}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLocationFilter("ALL");
                                        setIsLocMenuOpen(false);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        locationFilter === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>
                                        {lang === "en"
                                            ? `All Boutiques (${uniqueLocations.length})`
                                            : `Mọi Địa Điểm (${uniqueLocations.length})`}
                                    </span>
                                    {locationFilter === "ALL" && <Check size={14} color="#D4AF37" />}
                                </button>
                                {uniqueLocations.map((loc) => (
                                    <button
                                        key={loc}
                                        type="button"
                                        onClick={() => {
                                            setLocationFilter(loc);
                                            setIsLocMenuOpen(false);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            locationFilter === loc
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{loc}</span>
                                        {locationFilter === loc && <Check size={14} color="#D4AF37" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {(searchQuery ||
                        statusFilter !== "ALL" ||
                        brandFilter !== "ALL" ||
                        locationFilter !== "ALL") && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className={styles.secondaryGoldBtn}
                        >
                            <RefreshCw size={13} />
                            <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                        </button>
                    )}

                    <div className={styles.viewToggleGroup}>
                        <button
                            type="button"
                            onClick={() => setViewMode("cards")}
                            className={`${styles.viewToggleBtn} ${
                                viewMode === "cards" ? styles.viewToggleBtnActive : ""
                            }`}
                        >
                            <LayoutGrid size={14} />
                            <span>{lang === "en" ? "Cards" : "Thẻ"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            className={`${styles.viewToggleBtn} ${
                                viewMode === "list" ? styles.viewToggleBtnActive : ""
                            }`}
                        >
                            <ListIcon size={14} />
                            <span>{lang === "en" ? "List" : "Bảng"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("map")}
                            className={`${styles.viewToggleBtn} ${
                                viewMode === "map" ? styles.viewToggleBtnActive : ""
                            }`}
                        >
                            <MapIcon size={14} />
                            <span>{lang === "en" ? "Map" : "Bản Đồ"}</span>
                        </button>
                    </div>
                </div>

                {/* INTERACTIVE GOOGLE MAPS SATELLITE VIEW — BAY CAMERA QUA TẤT CẢ CÁC MÁY KHÔNG BỊ POPUP CHE */}
                {viewMode === "map" && (() => {
                    const activeMapMachine =
                        filteredMachines.find(
                            (m) =>
                                m.id.toLowerCase() === mapFocusedId.toLowerCase() ||
                                m.code.toLowerCase() === mapFocusedId.toLowerCase()
                        ) ||
                        filteredMachines.find((m) => m.coordinates) ||
                        filteredMachines[0] ||
                        machines[0];

                    const numericZoom = Math.min(
                        20,
                        Math.max(6, Math.round(16 * mapZoom))
                    );

                    const cleanLat = activeMapMachine?.coordinates
                        ? activeMapMachine.coordinates.lat.replace(/[^0-9.-]/g, "")
                        : null;
                    const cleanLng = activeMapMachine?.coordinates
                        ? activeMapMachine.coordinates.lng.replace(/[^0-9.-]/g, "")
                        : null;

                    // Google Maps Hybrid Satellite thật (t=h: Ảnh vệ tinh + Tên tòa nhà/đường phố rõ nét)
                    const googleSatelliteSrc =
                        cleanLat && cleanLng
                            ? `https://maps.google.com/maps?q=${cleanLat},${cleanLng}&t=h&z=${numericZoom}&ie=UTF8&iwloc=&output=embed`
                            : `https://maps.google.com/maps?q=${encodeURIComponent(
                                activeMapMachine
                                    ? `${activeMapMachine.locationName}, ${activeMapMachine.address}`
                                    : "Diamond Plaza, Ho Chi Minh City"
                            )}&t=h&z=${numericZoom}&ie=UTF8&iwloc=&output=embed`;

                    return (
                        <div className={styles.mapCanvasCard}>
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "0.75rem",
                                    marginBottom: "0.9rem",
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
                                        LIVE SATELLITE TELEMETRY MAP • {filteredMachines.length} STATIONS ONLINE RADAR
                                    </span>
                                    <h3
                                        style={{
                                            margin: "0.2rem 0 0 0",
                                            color: "#FFF",
                                            fontFamily: "Bodoni Moda, Georgia, serif",
                                            fontSize: "1.25rem",
                                        }}
                                    >
                                        {activeMapMachine
                                            ? `${activeMapMachine.locationName} (${activeMapMachine.code}) — ${
                                                lang === "en" ? "Satellite Zoom" : "Thu phóng vệ tinh"
                                            }: ${numericZoom}x`
                                            : lang === "en"
                                                ? "Select a station to focus satellite camera"
                                                : "Chọn một trạm để bay camera vệ tinh tới"}
                                    </h3>
                                </div>

                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMapZoom((z) => Math.min(1.25, +(z + 0.1).toFixed(2)))
                                        }
                                        className={styles.secondaryGoldBtn}
                                    >
                                        <ZoomIn size={15} color="#D4AF37" />
                                        <span>{lang === "en" ? "Zoom In" : "Phóng to"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMapZoom((z) => Math.max(0.65, +(z - 0.1).toFixed(2)))
                                        }
                                        className={styles.secondaryGoldBtn}
                                    >
                                        <ZoomOut size={15} color="#D4AF37" />
                                        <span>{lang === "en" ? "Zoom Out" : "Thu nhỏ"}</span>
                                    </button>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "310px 1fr",
                                    gap: "1rem",
                                    minHeight: "460px",
                                    position: "relative",
                                    zIndex: 2,
                                }}
                            >
                                {/* CỘT BÊN TRÁI: CLICK ĐỂ BAY CAMERA VỆ TINH TỚI MÁY ĐÓ (KHÔNG BẬT POPUP CHE BẢN ĐỒ) */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.55rem",
                                        maxHeight: "460px",
                                        overflowY: "auto",
                                        paddingRight: "0.3rem",
                                    }}
                                >
                                    {filteredMachines.map((m) => {
                                        const isFocused = activeMapMachine?.id === m.id;
                                        const statusColor =
                                            m.status === "ONLINE"
                                                ? "#34D399"
                                                : m.status === "MAINTENANCE"
                                                    ? "#FBBF24"
                                                    : "#F87171";

                                        return (
                                            <div
                                                key={m.id}
                                                onClick={() => setMapFocusedId(m.id)}
                                                style={{
                                                    textAlign: "left",
                                                    padding: "0.8rem 0.95rem",
                                                    borderRadius: "13px",
                                                    background: isFocused
                                                        ? "linear-gradient(135deg, rgba(212,175,55,0.24) 0%, rgba(16,16,26,0.96) 100%)"
                                                        : "rgba(10,10,16,0.88)",
                                                    border: isFocused
                                                        ? "1px solid #D4AF37"
                                                        : "1px solid rgba(255,255,255,0.08)",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    boxShadow: isFocused
                                                        ? "0 8px 24px rgba(212,175,55,0.2)"
                                                        : "none",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        marginBottom: "0.25rem",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontSize: "0.8rem",
                                                            fontWeight: 700,
                                                            color: isFocused ? "#F5E6AD" : "#FFF",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "0.4rem",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: "7px",
                                                                height: "7px",
                                                                borderRadius: "50%",
                                                                background: statusColor,
                                                                boxShadow: `0 0 8px ${statusColor}`,
                                                            }}
                                                        />
                                                        {m.code}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: "0.62rem",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontWeight: 700,
                                                            color: statusColor,
                                                            padding: "0.12rem 0.45rem",
                                                            borderRadius: "99px",
                                                            background: "rgba(255,255,255,0.04)",
                                                            border: `1px solid ${statusColor}44`,
                                                        }}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: "0.78rem",
                                                        fontWeight: 600,
                                                        color: "#E2E8F0",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {m.locationName}
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        marginTop: "0.35rem",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "0.67rem",
                                                            color: m.coordinates ? "#D4AF37" : "#FBBF24",
                                                            fontFamily: "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        {m.coordinates
                                                            ? `${m.coordinates.lat}, ${m.coordinates.lng}`
                                                            : "Định vị theo địa chỉ"}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedMachineId(m.id);
                                                        }}
                                                        style={{
                                                            background: "rgba(212,175,55,0.15)",
                                                            border: "1px solid rgba(212,175,55,0.4)",
                                                            color: "#F5E6AD",
                                                            borderRadius: "6px",
                                                            padding: "0.15rem 0.5rem",
                                                            fontSize: "0.65rem",
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {lang === "en" ? "4 Slots" : "4 Khoang"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* KHUNG BẢN ĐỒ VỆ TINH GOOGLE MAPS THẬT BÊN PHẢI */}
                                <div
                                    style={{
                                        position: "relative",
                                        borderRadius: "16px",
                                        overflow: "hidden",
                                        border: "1px solid rgba(212,175,55,0.45)",
                                        background: "#050509",
                                        minHeight: "460px",
                                        boxShadow: "0 18px 45px rgba(0,0,0,0.85)",
                                    }}
                                >
                                    {/* THANH PIN ĐỊNH VỊ NHANH TẤT CẢ CÁC TRẠM NỔI PHÍA TRÊN BẢN ĐỒ VỆ TINH */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "0.85rem",
                                            left: "0.85rem",
                                            right: "0.85rem",
                                            zIndex: 5,
                                            display: "flex",
                                            gap: "0.45rem",
                                            overflowX: "auto",
                                            paddingBottom: "0.25rem",
                                            scrollbarWidth: "none",
                                        }}
                                    >
                                        {filteredMachines.map((m) => {
                                            const isPinActive = activeMapMachine?.id === m.id;
                                            const pinColor =
                                                m.status === "ONLINE"
                                                    ? "#34D399"
                                                    : m.status === "MAINTENANCE"
                                                        ? "#FBBF24"
                                                        : "#F87171";
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => setMapFocusedId(m.id)}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.38rem",
                                                        padding: "0.4rem 0.78rem",
                                                        borderRadius: "999px",
                                                        background: isPinActive
                                                            ? "linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)"
                                                            : "rgba(9, 9, 15, 0.9)",
                                                        color: isPinActive ? "#050508" : "#F8FAFC",
                                                        border: isPinActive
                                                            ? "1px solid #FFFFFF"
                                                            : `1px solid ${pinColor}`,
                                                        fontFamily: "Space Grotesk, monospace",
                                                        fontSize: "0.72rem",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        whiteSpace: "nowrap",
                                                        boxShadow: "0 6px 18px rgba(0,0,0,0.75)",
                                                        backdropFilter: "blur(12px)",
                                                    }}
                                                >
                                                    <MapPin
                                                        size={12}
                                                        color={isPinActive ? "#050508" : pinColor}
                                                    />
                                                    <span>{m.code}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <iframe
                                        key={`${activeMapMachine?.id}-${numericZoom}`}
                                        title={`Google Satellite Map - ${activeMapMachine?.code || "ScentStation"}`}
                                        src={googleSatelliteSrc}
                                        width="100%"
                                        height="100%"
                                        style={{
                                            border: 0,
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />

                                    {/* THANH OVERLAY THÔNG TIN TRẠM NỔI Ở ĐÁY BẢN ĐỒ VỆ TINH */}
                                    {activeMapMachine && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: "1rem",
                                                right: "1rem",
                                                bottom: "1rem",
                                                zIndex: 5,
                                                background: "rgba(9, 9, 15, 0.92)",
                                                backdropFilter: "blur(16px)",
                                                border: "1px solid rgba(212,175,55,0.55)",
                                                borderRadius: "14px",
                                                padding: "0.85rem 1.15rem",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: "0.75rem",
                                                boxShadow: "0 15px 35px rgba(0,0,0,0.9)",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                        marginBottom: "0.18rem",
                                                    }}
                                                >
                                                    <strong
                                                        style={{
                                                            color: "#F5E6AD",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontSize: "0.9rem",
                                                        }}
                                                    >
                                                        {activeMapMachine.code} • {activeMapMachine.brand}
                                                    </strong>
                                                    {renderStatusBadge(activeMapMachine.status)}
                                                </div>
                                                <div style={{ fontSize: "0.78rem", color: "#E2E8F0" }}>
                                                    {activeMapMachine.locationName} — {activeMapMachine.address}
                                                </div>
                                                {!activeMapMachine.coordinates && (
                                                    <div
                                                        style={{
                                                            fontSize: "0.72rem",
                                                            color: "#FBBF24",
                                                            marginTop: "0.2rem",
                                                        }}
                                                    >
                                                        {lang === "en"
                                                            ? "Note: GPS coordinates unavailable for this unit; displaying verified street address."
                                                            : "Lưu ý: Trạm chưa có tọa độ GPS; đang định vị vệ tinh theo địa chỉ đăng ký."}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedMachineId(activeMapMachine.id)}
                                                    className={styles.secondaryGoldBtn}
                                                    style={{ padding: "0.55rem 0.9rem" }}
                                                >
                                                    <SlidersHorizontal size={14} color="#D4AF37" />
                                                    <span>
                                                        {lang === "en"
                                                            ? "Control 4 Chambers"
                                                            : "Điều Khiển 4 Khoang"}
                                                    </span>
                                                </button>
                                                <Link
                                                    href={`/machines/${encodeURIComponent(activeMapMachine.id)}`}
                                                    className={styles.primaryGoldBtn}
                                                    style={{ textDecoration: "none", padding: "0.55rem 0.95rem" }}
                                                >
                                                    <Terminal size={14} />
                                                    <span>
                                                        {lang === "en"
                                                            ? "Full Hardware Detail"
                                                            : "Chi Tiết Phần Cứng"}
                                                    </span>
                                                </Link>
                                                <Link
                                                    href={`/kiosk/${encodeURIComponent(activeMapMachine.code)}`}
                                                    className={styles.secondaryGoldBtn}
                                                    style={{ textDecoration: "none", padding: "0.55rem 0.85rem" }}
                                                >
                                                    <Smartphone size={14} color="#34D399" />
                                                    <span>Kiosk</span>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* EMPTY STATE */}
                {filteredMachines.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "3.5rem 1.5rem",
                            background: "rgba(14,14,22,0.92)",
                            borderRadius: "18px",
                            border: "1px dashed rgba(212,175,55,0.35)",
                        }}
                    >
                        <h3
                            style={{
                                fontFamily: "Bodoni Moda, Georgia, serif",
                                fontSize: "1.45rem",
                                color: "#F5E6AD",
                                margin: "0 0 0.4rem 0",
                            }}
                        >
                            {lang === "en" ? "No machines found." : "Không tìm thấy trạm Kiosk phù hợp."}
                        </h3>
                        <p
                            style={{
                                color: "#94A3B8",
                                fontSize: "0.85rem",
                                marginBottom: "1.2rem",
                            }}
                        >
                            {lang === "en"
                                ? "No Kiosk stations match your current search keyword or active filter criteria."
                                : "Không có trạm Kiosk nào khớp với từ khóa hoặc bộ lọc hiện tại."}
                        </p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className={styles.primaryGoldBtn}
                        >
                            <RefreshCw size={14} />
                            <span>{lang === "en" ? "Reset All Filters" : "Xóa Bộ Lọc"}</span>
                        </button>
                    </div>
                ) : viewMode === "list" ? (
                    /* TABULAR LIST VIEW */
                    <div
                        style={{
                            background: "rgba(14,14,22,0.94)",
                            border: "1px solid rgba(212,175,55,0.34)",
                            borderRadius: "18px",
                            padding: "0.85rem 1.15rem",
                            overflowX: "auto",
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                textAlign: "left",
                            }}
                        >
                            <thead>
                            <tr
                                style={{
                                    borderBottom: "1px solid rgba(212,175,55,0.28)",
                                    color: "#F5E6AD",
                                    fontSize: "0.7rem",
                                    textTransform: "uppercase",
                                    fontFamily: "Space Grotesk, monospace",
                                    letterSpacing: "0.09em",
                                }}
                            >
                                <th style={{ padding: "0.95rem" }}>Station Code & Serial</th>
                                <th style={{ padding: "0.95rem" }}>Primary Maison</th>
                                <th style={{ padding: "0.95rem" }}>Boutique Venue</th>
                                <th style={{ padding: "0.95rem" }}>Ready Chambers</th>
                                <th style={{ padding: "0.95rem" }}>Firmware & Config</th>
                                <th style={{ padding: "0.95rem" }}>Today Performance</th>
                                <th style={{ padding: "0.95rem" }}>Status</th>
                                <th style={{ padding: "0.95rem", textAlign: "right" }}>Manage</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredMachines.map((m) => (
                                <tr
                                    key={m.id}
                                    onClick={() => setSelectedMachineId(m.id)}
                                    style={{
                                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                                        background:
                                            selectedMachine?.id === m.id
                                                ? "rgba(212,175,55,0.1)"
                                                : "transparent",
                                        cursor: "pointer",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "0.95rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        <strong style={{ color: "#FFF", fontSize: "0.88rem" }}>
                                            {m.code}
                                        </strong>
                                        <div style={{ fontSize: "0.72rem", color: "#D4AF37" }}>
                                            {m.serialNumber}
                                        </div>
                                    </td>
                                    <td style={{ padding: "0.95rem", fontWeight: 700, color: "#FFF" }}>
                                        {m.brand}
                                    </td>
                                    <td style={{ padding: "0.95rem" }}>
                                        <div style={{ color: "#E2E8F0", fontSize: "0.84rem", fontWeight: 600 }}>
                                            {m.locationName}
                                        </div>
                                        <div style={{ fontSize: "0.73rem", color: "#94A3B8" }}>
                                            {m.address}
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: "0.95rem",
                                            fontFamily: "Space Grotesk, monospace",
                                            color: m.activeSlots > 0 ? "#34D399" : "#F87171",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {m.activeSlots} / {m.totalSlots} Ready
                                    </td>
                                    <td style={{ padding: "0.95rem" }}>
                                        <span className={styles.firmwareTag}>{m.firmwareVersion}</span>
                                        <div
                                            style={{
                                                fontSize: "0.71rem",
                                                color: "#94A3B8",
                                                marginTop: "3px",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            {m.configVersion}
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: "0.95rem",
                                            fontFamily: "Space Grotesk, monospace",
                                            fontSize: "0.8rem",
                                        }}
                                    >
                                        <strong style={{ color: "#F5E6AD" }}>
                                            {m.todayRevenue.toLocaleString("vi-VN")} VND
                                        </strong>
                                        <div style={{ color: "#34D399", fontSize: "0.72rem" }}>
                                            {m.todaySprays} sprays • {m.chamberTemp}
                                        </div>
                                    </td>
                                    <td style={{ padding: "0.95rem" }}>{renderStatusBadge(m.status)}</td>
                                    <td
                                        style={{
                                            padding: "0.95rem",
                                            textAlign: "right",
                                            whiteSpace: "nowrap",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div style={{ display: "inline-flex", gap: "0.45rem" }}>
                                            <Link
                                                href={`/machines/${encodeURIComponent(m.id)}`}
                                                className={styles.secondaryGoldBtn}
                                                style={{ textDecoration: "none", padding: "0.45rem 0.8rem" }}
                                            >
                                                <Terminal size={13} color="#D4AF37" />
                                                <span>Console</span>
                                            </Link>
                                            <Link
                                                href={`/kiosk/${encodeURIComponent(m.code)}`}
                                                className={styles.secondaryGoldBtn}
                                                style={{ textDecoration: "none", padding: "0.45rem 0.8rem" }}
                                            >
                                                <Smartphone size={13} color="#34D399" />
                                                <span>Kiosk</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* MACHINE CARDS GRID VIEW */
                    <div className={styles.machinesGrid}>
                        {filteredMachines.map((machine) => {
                            const slotPercentage =
                                (machine.activeSlots / machine.totalSlots) * 100;
                            const isSelected = selectedMachine?.id === machine.id;

                            return (
                                <div
                                    key={machine.id}
                                    onClick={() => setSelectedMachineId(machine.id)}
                                    className={`${styles.machineCard} ${
                                        isSelected ? styles.machineCardSelected : ""
                                    }`}
                                >
                                    <div>
                                        <div className={styles.cardHeader}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.85rem",
                                                    minWidth: 0,
                                                }}
                                            >
                                                <div className={styles.serverIconBox}>
                                                    <Server size={19} color="#D4AF37" />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "0.45rem",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <h3 className={styles.machineCode}>
                                                            {machine.code}
                                                        </h3>
                                                        <span
                                                            style={{
                                                                fontSize: "0.66rem",
                                                                color: "#F5E6AD",
                                                                background: "rgba(212,175,55,0.14)",
                                                                border: "1px solid rgba(212,175,55,0.35)",
                                                                padding: "0.1rem 0.45rem",
                                                                borderRadius: "5px",
                                                                fontFamily: "Space Grotesk, monospace",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {machine.brand}
                                                        </span>
                                                    </div>
                                                    <p className={styles.machineLocation}>
                                                        <MapPin size={13} color="#D4AF37" style={{ flexShrink: 0 }} />
                                                        <span
                                                            style={{
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                        >
                                                            {machine.locationName}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.4rem",
                                                    position: "relative",
                                                    flexShrink: 0,
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {renderStatusBadge(machine.status)}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenMenuId(
                                                            openMenuId === machine.id
                                                                ? null
                                                                : machine.id
                                                        )
                                                    }
                                                    style={{
                                                        background: "rgba(255,255,255,0.05)",
                                                        border: "1px solid rgba(255,255,255,0.12)",
                                                        borderRadius: "8px",
                                                        padding: "0.35rem",
                                                        color: "#CBD5E1",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                    }}
                                                >
                                                    <MoreHorizontal size={15} />
                                                </button>

                                                {openMenuId === machine.id && (
                                                    <div
                                                        className={styles.customDropdownMenu}
                                                        style={{
                                                            right: 0,
                                                            left: "auto",
                                                            minWidth: "235px",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/machines/${encodeURIComponent(
                                                                        machine.id
                                                                    )}`
                                                                )
                                                            }
                                                            className={styles.customDropdownItem}
                                                        >
                                                            <span>Open 4-Slot Hardware Console</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                router.push(
                                                                    `/kiosk/${encodeURIComponent(
                                                                        machine.code
                                                                    )}`
                                                                )
                                                            }
                                                            className={styles.customDropdownItem}
                                                        >
                                                            <span>Launch Customer Touch Screen</span>
                                                        </button>
                                                        {userScope === "OPS_MANAGER" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleRemoteRebootMachine(
                                                                            machine
                                                                        );
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className={styles.customDropdownItem}
                                                                    style={{ color: "#34D399" }}
                                                                >
                                                                    <span>Remote Reboot & Restore Online</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleRefillAllSlots(machine);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className={styles.customDropdownItem}
                                                                    style={{ color: "#F5E6AD" }}
                                                                >
                                                                    <span>Replenish All 4 Chambers (100%)</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleToggleMaintenanceMode(
                                                                            machine
                                                                        );
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className={styles.customDropdownItem}
                                                                    style={{ color: "#FBBF24" }}
                                                                >
                                                                    <span>
                                                                        {machine.status === "MAINTENANCE"
                                                                            ? "Exit Maintenance Mode"
                                                                            : "Enter Maintenance Mode"}
                                                                    </span>
                                                                </button>
                                                                {machine.status !== "OFFLINE" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleForceOfflineMachine(
                                                                                machine
                                                                            );
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                        className={styles.customDropdownItem}
                                                                        style={{ color: "#F87171" }}
                                                                    >
                                                                        <span>Disconnect Station (Set Offline)</span>
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.infoBox}>
                                            <div className={styles.infoRow}>
                                                <span className={styles.infoLabel}>
                                                    {lang === "en" ? "Ready Chambers" : "Khoang Sẵn Sàng"}
                                                </span>
                                                <span className={styles.infoValue}>
                                                    {machine.activeSlots} / {machine.totalSlots} Chambers
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "5px",
                                                    background: "rgba(255,255,255,0.08)",
                                                    borderRadius: "99px",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${slotPercentage}%`,
                                                        height: "100%",
                                                        background:
                                                            slotPercentage === 100
                                                                ? "linear-gradient(90deg, #D4AF37, #34D399)"
                                                                : slotPercentage > 0
                                                                    ? "#FBBF24"
                                                                    : "#F87171",
                                                        transition: "width 0.4s ease",
                                                    }}
                                                />
                                            </div>

                                            <div className={styles.infoRow}>
                                                <span className={styles.infoLabel}>
                                                    {lang === "en" ? "Firmware & Config" : "Phiên Bản Phần Cứng"}
                                                </span>
                                                <span className={styles.firmwareTag}>
                                                    {machine.firmwareVersion} • {machine.configVersion}
                                                </span>
                                            </div>

                                            <div className={styles.infoRow}>
                                                <span className={styles.infoLabel}>
                                                    {lang === "en" ? "Climate & Today Sales" : "Nhiệt Độ & Doanh Thu"}
                                                </span>
                                                <span
                                                    className={styles.infoValue}
                                                    style={{ fontSize: "0.78rem", color: "#F5E6AD" }}
                                                >
                                                    {machine.chamberTemp} • {machine.todaySprays} sprays (
                                                    {machine.todayRevenue.toLocaleString("vi-VN")} VND)
                                                </span>
                                            </div>

                                            <div className={styles.infoRow}>
                                                <span className={styles.infoLabel}>
                                                    {lang === "en" ? "Last Heartbeat" : "Tín Hiệu Cuối"}
                                                </span>
                                                <span className={styles.lastSeenText}>
                                                    <Clock size={13} color="#D4AF37" />
                                                    <span>{machine.lastActivity}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* 4-SLOT LIVE PREVIEW TRÊN THẺ MÁY */}
                                        <div className={styles.slotMiniGrid}>
                                            {machine.slots.map((sl) => {
                                                const pct = Math.round(
                                                    (sl.remainingMl / sl.capacityMl) * 100
                                                );
                                                const isBlocked =
                                                    sl.remainingMl < 0.12 ||
                                                    (sl.productStatus && sl.productStatus !== "ACTIVE");
                                                const isLow = sl.remainingMl <= (sl.lowStockThresholdMl || 15);
                                                return (
                                                    <div key={sl.slotLabel} className={styles.slotMiniCard}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                fontSize: "0.66rem",
                                                                fontFamily: "Space Grotesk, monospace",
                                                            }}
                                                        >
                                                            <strong style={{ color: "#D4AF37" }}>
                                                                {sl.slotLabel.toUpperCase()}
                                                            </strong>
                                                            <span
                                                                style={{
                                                                    color: isBlocked
                                                                        ? "#F87171"
                                                                        : isLow
                                                                            ? "#FBBF24"
                                                                            : "#34D399",
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {sl.productStatus && sl.productStatus !== "ACTIVE"
                                                                    ? "INACTIVE"
                                                                    : `${sl.remainingMl}ml (${pct}%)`}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "0.76rem",
                                                                fontWeight: 700,
                                                                color: isBlocked ? "#94A3B8" : "#FFF",
                                                                marginTop: "2px",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                        >
                                                            {sl.fragranceName}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div
                                        className={styles.cardActionRow}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Link
                                            href={`/machines/${encodeURIComponent(machine.id)}`}
                                            className={styles.detailLink}
                                        >
                                            <span>
                                                {lang === "en"
                                                    ? "Configure 4-Slot Hardware"
                                                    : "Cấu Hình 4 Khoang Chứa"}
                                            </span>
                                            <ExternalLink size={14} />
                                        </Link>
                                        <Link
                                            href={`/kiosk/${encodeURIComponent(machine.code)}`}
                                            className={styles.secondaryGoldBtn}
                                            style={{
                                                textDecoration: "none",
                                                padding: "0.72rem 0.85rem",
                                            }}
                                            title="Open Customer Kiosk Touch Screen"
                                        >
                                            <Smartphone size={15} color="#34D399" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* CENTERED LUXURY EXECUTIVE MACHINE INSPECTOR MODAL (CÓ NÚT XỊT & NẠP CHO TỪNG KHOANG SLOT 01..04) */}
            {selectedMachine && (
                <div
                    className={styles.drawerOverlay}
                    onClick={() => setSelectedMachineId(null)}
                >
                    <div
                        className={styles.drawerPanel}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.drawerHeader}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    gap: "1rem",
                                    flexWrap: "wrap",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.6rem",
                                            marginBottom: "0.3rem",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "0.68rem",
                                                color: "#D4AF37",
                                                fontWeight: 700,
                                                letterSpacing: "0.14em",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            STATION TELEMETRY & 4-CHAMBER CONTROL • {selectedMachine.serialNumber}
                                        </span>
                                        {renderStatusBadge(selectedMachine.status)}
                                    </div>
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: "1.55rem",
                                            color: "#FFF",
                                            fontFamily: "Bodoni Moda, Georgia, serif",
                                        }}
                                    >
                                        {selectedMachine.locationName} ({selectedMachine.code})
                                    </h2>
                                    <div
                                        style={{
                                            fontSize: "0.78rem",
                                            color: "#94A3B8",
                                            marginTop: "0.22rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {selectedMachine.address} • Primary Maison:{" "}
                                        <strong style={{ color: "#F5E6AD" }}>
                                            {selectedMachine.brand}
                                        </strong>{" "}
                                        • Today:{" "}
                                        <strong style={{ color: "#34D399" }}>
                                            {selectedMachine.todaySprays} sprays (
                                            {selectedMachine.todayRevenue.toLocaleString("vi-VN")} VND)
                                        </strong>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <Link
                                        href={`/kiosk/${encodeURIComponent(selectedMachine.code)}`}
                                        className={styles.secondaryGoldBtn}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Smartphone size={14} color="#34D399" />
                                        <span>
                                            {lang === "en" ? "Open Kiosk Screen" : "Mở Màn Hình Kiosk"}
                                        </span>
                                    </Link>
                                    <Link
                                        href={`/machines/${encodeURIComponent(selectedMachine.id)}`}
                                        className={styles.primaryGoldBtn}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Terminal size={14} />
                                        <span>
                                            {lang === "en" ? "Full Hardware Detail" : "Chi Tiết Phần Cứng"}
                                        </span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMachineId(null)}
                                        className={styles.secondaryGoldBtn}
                                        style={{ padding: "0.55rem" }}
                                    >
                                        <X size={17} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerBody}>
                            {selectedMachine.status === "OFFLINE" && (
                                <div
                                    style={{
                                        padding: "0.85rem 1.1rem",
                                        borderRadius: "12px",
                                        background: "rgba(248,113,113,0.12)",
                                        border: "1px solid rgba(248,113,113,0.4)",
                                        color: "#F87171",
                                        fontSize: "0.8rem",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    <strong>Offline Telemetry Notice:</strong> This station is currently disconnected ({selectedMachine.lastActivity}). Displayed sensor metrics reflect the last recorded values. Click <strong>Remote Reboot & Restore Online</strong> below to resume service.
                                </div>
                            )}

                            {/* 4-CHAMBER LIVE CARTRIDGE MATRIX VỚI NÚT XỊT / NẠP RIÊNG CHO TỪNG SLOT */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                    gap: "0.85rem",
                                    marginBottom: "1.15rem",
                                }}
                            >
                                {selectedMachine.slots.map((sl, slotIdx) => {
                                    const pct = Math.round(
                                        (sl.remainingMl / sl.capacityMl) * 100
                                    );
                                    const isBlocked =
                                        sl.remainingMl < 0.12 ||
                                        (sl.productStatus && sl.productStatus !== "ACTIVE");
                                    const isLow = sl.remainingMl <= (sl.lowStockThresholdMl || 15);
                                    return (
                                        <div
                                            key={sl.slotLabel}
                                            className={styles.slotMiniCard}
                                            style={{
                                                padding: "0.85rem 1rem",
                                                borderColor: isBlocked
                                                    ? "rgba(248,113,113,0.4)"
                                                    : "rgba(212,175,55,0.26)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontSize: "0.72rem",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                <strong style={{ color: "#D4AF37" }}>
                                                    {sl.slotLabel.toUpperCase()} • {sl.brand}
                                                </strong>
                                                <span
                                                    style={{
                                                        color: isBlocked
                                                            ? "#F87171"
                                                            : isLow
                                                                ? "#FBBF24"
                                                                : "#34D399",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {sl.productStatus && sl.productStatus !== "ACTIVE"
                                                        ? "INACTIVE"
                                                        : `${sl.remainingMl}ml / ${sl.capacityMl}ml (${pct}%)`}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.92rem",
                                                    fontWeight: 700,
                                                    color: "#FFF",
                                                    margin: "0.25rem 0 0.45rem 0",
                                                }}
                                            >
                                                {sl.fragranceName}
                                            </div>
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "5px",
                                                    background: "rgba(255,255,255,0.1)",
                                                    borderRadius: "99px",
                                                    overflow: "hidden",
                                                    marginBottom:
                                                        userScope === "OPS_MANAGER" ? "0.65rem" : 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${pct}%`,
                                                        height: "100%",
                                                        background: isBlocked
                                                            ? "#F87171"
                                                            : isLow
                                                                ? "#FBBF24"
                                                                : "linear-gradient(90deg, #D4AF37, #34D399)",
                                                    }}
                                                />
                                            </div>

                                            {userScope === "OPS_MANAGER" && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "0.45rem",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            selectedMachine.status === "OFFLINE" ||
                                                            sl.remainingMl < 0.12
                                                        }
                                                        onClick={() =>
                                                            handleDiagnosticTestSpray(
                                                                selectedMachine,
                                                                slotIdx
                                                            )
                                                        }
                                                        className={styles.secondaryGoldBtn}
                                                        style={{
                                                            flex: 1,
                                                            padding: "0.35rem 0.55rem",
                                                            fontSize: "0.7rem",
                                                            opacity:
                                                                selectedMachine.status === "OFFLINE" ||
                                                                sl.remainingMl < 0.12
                                                                    ? 0.45
                                                                    : 1,
                                                        }}
                                                    >
                                                        <Zap size={12} color="#D4AF37" />
                                                        <span>Spray (-0.12ml)</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRefillAllSlots(
                                                                selectedMachine,
                                                                slotIdx
                                                            )
                                                        }
                                                        className={styles.secondaryGoldBtn}
                                                        style={{
                                                            flex: 1,
                                                            padding: "0.35rem 0.55rem",
                                                            fontSize: "0.7rem",
                                                            borderColor: "rgba(52,211,153,0.4)",
                                                            color: "#34D399",
                                                        }}
                                                    >
                                                        <Droplets size={12} color="#34D399" />
                                                        <span>Refill (100%)</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* REMOTE HARDWARE COMMAND BAR */}
                            {userScope === "OPS_MANAGER" && (
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))",
                                        gap: "0.65rem",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            selectedMachine.status === "OFFLINE"
                                                ? handleRemoteRebootMachine(selectedMachine)
                                                : handleForceOfflineMachine(selectedMachine)
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            borderColor:
                                                selectedMachine.status === "OFFLINE"
                                                    ? "rgba(52,211,153,0.5)"
                                                    : "rgba(248,113,113,0.5)",
                                            color:
                                                selectedMachine.status === "OFFLINE"
                                                    ? "#34D399"
                                                    : "#F87171",
                                        }}
                                    >
                                        {selectedMachine.status === "OFFLINE" ? (
                                            <>
                                                <Power size={14} />
                                                <span>Remote Reboot & Restore Online</span>
                                            </>
                                        ) : (
                                            <>
                                                <WifiOff size={14} />
                                                <span>Disconnect Station (Set Offline)</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleToggleMaintenanceMode(selectedMachine)
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            borderColor: "rgba(251,191,36,0.45)",
                                            color: "#FBBF24",
                                        }}
                                    >
                                        <Wrench size={14} />
                                        <span>
                                            {selectedMachine.status === "MAINTENANCE"
                                                ? "Restore to Active Service"
                                                : "Enter Maintenance Mode"}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleRefillAllSlots(selectedMachine)}
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            borderColor: "rgba(212,175,55,0.55)",
                                            color: "#F5E6AD",
                                        }}
                                    >
                                        <Droplets size={14} color="#34D399" />
                                        <span>Replenish All 4 Chambers (100%)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOtaFirmwareSync(selectedMachine)
                                        }
                                        className={styles.secondaryGoldBtn}
                                    >
                                        <RefreshCw size={14} color="#D4AF37" />
                                        <span>Sync Firmware v2.4.9-LTS</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: PROVISION NEW KIOSK MACHINE */}
            {isAddMachineOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsAddMachineOpen(false)}
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
                                marginBottom: "1.15rem",
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    color: "#FFF",
                                    fontSize: "1.4rem",
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                }}
                            >
                                {lang === "en"
                                    ? "Provision New IoT Sampling Station"
                                    : "Khởi Tạo Trạm Kiosk Trải Nghiệm Mới"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddMachineOpen(false)}
                                className={styles.secondaryGoldBtn}
                                style={{ padding: "0.4rem 0.6rem" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {formError && (
                            <div
                                style={{
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    background: "rgba(248,113,113,0.14)",
                                    border: "1px solid rgba(248,113,113,0.4)",
                                    color: "#F87171",
                                    fontSize: "0.8rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleCreateMachineSubmit}>
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
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        STATION CODE *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newMachineCode}
                                        onChange={(e) => setNewMachineCode(e.target.value)}
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        SERIAL NUMBER *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newMachineSerial}
                                        onChange={(e) => setNewMachineSerial(e.target.value)}
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
                                    />
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1.5fr",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        PRIMARY MAISON *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newMachineBrand}
                                        onChange={(e) => setNewMachineBrand(e.target.value)}
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        BOUTIQUE VENUE NAME *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newMachineLocation}
                                        onChange={(e) => setNewMachineLocation(e.target.value)}
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: "1.25rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        fontWeight: 700,
                                        marginBottom: "0.35rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    STREET ADDRESS *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newMachineAddress}
                                    onChange={(e) => setNewMachineAddress(e.target.value)}
                                    className={styles.searchInput}
                                    style={{ padding: "0.7rem 0.95rem" }}
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
                                    onClick={() => setIsAddMachineOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles.primaryGoldBtn}>
                                    Provision Station
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className={styles.toastBanner}>
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}