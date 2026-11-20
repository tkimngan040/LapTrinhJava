// noinspection SpellCheckingInspection
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
    ShoppingBag,
    ArrowUpRight,
    Search,
    ChevronDown,
    AlertOctagon,
    Building2,
    MapPin,
    Eye,
    Sparkles,
    X,
    RefreshCw,
    Play,
    Pause,
    Zap,
    CheckCircle2,
    Globe,
    Droplets,
    Cpu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import RealTimeChart from "./RealTimeChart";
import styles from "./dashboard.module.css";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

interface CatalogPerfumeItem {
    slotNumber: number;
    skuCode: string;
    brand: string;
    product: string;
    sprayPrice: number;
    retail10ml: number;
    fullBottlePrice: number;
    bottleCapacityMl: number;
    remainingVolumeMl: number;
    kioskId: string;
    physicalSlotLabel?: string;
    location: string;
    remainingStockPct: number;
    thresholdPct: number;
    status?: "ACTIVE" | "INACTIVE" | "DRAFT";
}

const INITIAL_MASTER_CATALOG: CatalogPerfumeItem[] = [
    { slotNumber: 1, skuCode: "SKU-ARM-01", brand: "Giorgio Armani", product: "Acqua Di Gio", sprayPrice: 12000, retail10ml: 360000, fullBottlePrice: 3200000, bottleCapacityMl: 100, remainingVolumeMl: 78.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 01", location: "Saigon Centre Takashimaya", remainingStockPct: 78, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 2, skuCode: "SKU-ARM-02", brand: "Giorgio Armani", product: "Acqua Di Gio Profondo", sprayPrice: 14000, retail10ml: 420000, fullBottlePrice: 3650000, bottleCapacityMl: 100, remainingVolumeMl: 64.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 02", location: "Saigon Centre Takashimaya", remainingStockPct: 64, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 3, skuCode: "SKU-CHA-03", brand: "Chanel", product: "Bleu de Chanel", sprayPrice: 15000, retail10ml: 450000, fullBottlePrice: 4250000, bottleCapacityMl: 100, remainingVolumeMl: 12.5, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 03", location: "Saigon Centre Takashimaya", remainingStockPct: 13, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 4, skuCode: "SKU-CHA-04", brand: "Chanel", product: "Coco Mademoiselle", sprayPrice: 15500, retail10ml: 465000, fullBottlePrice: 4400000, bottleCapacityMl: 100, remainingVolumeMl: 82.0, kioskId: "KIOSK-SGN-02", physicalSlotLabel: "Slot 01", location: "Vincom Đồng Khởi", remainingStockPct: 82, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 5, skuCode: "SKU-BUR-05", brand: "Burberry", product: "Burberry Goddess", sprayPrice: 13000, retail10ml: 390000, fullBottlePrice: 3500000, bottleCapacityMl: 100, remainingVolumeMl: 71.0, kioskId: "KIOSK-SGN-02", physicalSlotLabel: "Slot 02", location: "Vincom Đồng Khởi", remainingStockPct: 71, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 6, skuCode: "SKU-BUR-06", brand: "Burberry", product: "Burberry Her", sprayPrice: 12500, retail10ml: 375000, fullBottlePrice: 3350000, bottleCapacityMl: 100, remainingVolumeMl: 55.0, kioskId: "KIOSK-HN-01", physicalSlotLabel: "Slot 01", location: "Lotte West Lake", remainingStockPct: 55, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 7, skuCode: "SKU-CH-07", brand: "Carolina Herrera", product: "Carolina Herrera Good Girl", sprayPrice: 13500, retail10ml: 405000, fullBottlePrice: 3450000, bottleCapacityMl: 80, remainingVolumeMl: 54.0, kioskId: "KIOSK-HN-01", physicalSlotLabel: "Slot 02", location: "Lotte West Lake", remainingStockPct: 68, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 8, skuCode: "SKU-ARMF-08", brand: "Armaf", product: "Club de Nuit Intense Man", sprayPrice: 10000, retail10ml: 300000, fullBottlePrice: 1650000, bottleCapacityMl: 105, remainingVolumeMl: 92.0, kioskId: "KIOSK-DAD-01", physicalSlotLabel: "Slot 01", location: "IndoChina Riverside", remainingStockPct: 88, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 9, skuCode: "SKU-CRD-09", brand: "Creed", product: "Creed Aventus", sprayPrice: 20000, retail10ml: 600000, fullBottlePrice: 7800000, bottleCapacityMl: 100, remainingVolumeMl: 11.5, kioskId: "demo-device", physicalSlotLabel: "Slot 01", location: "Diamond Plaza Atrium", remainingStockPct: 12, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 10, skuCode: "SKU-DIO-10", brand: "Dior", product: "Dior Sauvage", sprayPrice: 14500, retail10ml: 435000, fullBottlePrice: 3950000, bottleCapacityMl: 100, remainingVolumeMl: 84.0, kioskId: "KIOSK-HN-01", physicalSlotLabel: "Slot 03", location: "Lotte West Lake", remainingStockPct: 84, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 11, skuCode: "SKU-DIO-11", brand: "Dior", product: "Miss Dior Blooming Bouquet", sprayPrice: 13500, retail10ml: 405000, fullBottlePrice: 3600000, bottleCapacityMl: 100, remainingVolumeMl: 76.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 04", location: "Saigon Centre Takashimaya", remainingStockPct: 76, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 14, skuCode: "SKU-LLB-14", brand: "Le Labo", product: "Le Labo Another 13", sprayPrice: 18000, retail10ml: 540000, fullBottlePrice: 6500000, bottleCapacityMl: 100, remainingVolumeMl: 13.5, kioskId: "demo-device", physicalSlotLabel: "Slot 02", location: "Diamond Plaza Atrium", remainingStockPct: 14, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 19, skuCode: "SKU-MFK-19", brand: "Maison Francis Kurkdjian", product: "MFK Baccarat Rouge 540", sprayPrice: 21000, retail10ml: 630000, fullBottlePrice: 7900000, bottleCapacityMl: 70, remainingVolumeMl: 9.0, kioskId: "demo-device", physicalSlotLabel: "Slot 04", location: "Diamond Plaza Atrium", remainingStockPct: 13, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 27, skuCode: "SKU-ROJ-27", brand: "Roja Parfums", product: "Roja Parfums Elysium", sprayPrice: 22000, retail10ml: 660000, fullBottlePrice: 7600000, bottleCapacityMl: 100, remainingVolumeMl: 11.0, kioskId: "KIOSK-SGN-03", physicalSlotLabel: "Slot 04", location: "Crescent Mall", remainingStockPct: 11, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 33, skuCode: "SKU-YSL-33", brand: "Yves Saint Laurent", product: "YSL Libre Eau de Parfum", sprayPrice: 14000, retail10ml: 420000, fullBottlePrice: 3750000, bottleCapacityMl: 90, remainingVolumeMl: 14.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 04", location: "Saigon Centre Takashimaya", remainingStockPct: 16, thresholdPct: 15, status: "ACTIVE" },
];

interface Transaction {
    id: string;
    kiosk: string;
    location: string;
    brand: string;
    product: string;
    slotNumber: number;
    amount: number;
    volumeDeductedMl: number;
    paymentMethod: string;
    timestamp: string;
    status: "DISPENSED" | "PAID" | "PENDING" | "FAILED" | "UNCERTAIN" | "REFUNDED" | "CANCELLED" | "EXPIRED";
    dateType: "TODAY" | "7D" | "30D";
}

interface MachineFleetUnit {
    id: string;
    name: string;
    location: string;
    coords: string;
    status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
    temp: string;
    slotsReady: string;
    lastSeen: string;
}

interface AlertIncidentItem {
    id: string;
    kiosk: string;
    location: string;
    type: string;
    cause: string;
    recommendation: string;
    severity: "CRITICAL" | "HIGH" | "WARNING";
    time: string;
}

interface MaintenanceTicketItem {
    id: string;
    kiosk: string;
    issue: string;
    status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
    technician: string;
    progress: number;
}

const INITIAL_SEED_TRANSACTIONS: Transaction[] = INITIAL_MASTER_CATALOG.map((item, index) => ({
    id: `TXN-2026-${String(9100 + index)}`,
    kiosk: item.kioskId,
    location: item.location,
    brand: item.brand,
    product: item.product,
    slotNumber: item.slotNumber,
    amount: item.sprayPrice,
    volumeDeductedMl: 0.12,
    paymentMethod: index % 3 === 0 ? "VIETQR" : index % 2 === 0 ? "MOMO" : "VNPAY",
    timestamp: index < 6 ? `Today, ${10 + (index % 8)}:${String(12 + index).padStart(2, "0")}` : `${(index % 12) + 2}d ago`,
    status: "DISPENSED",
    dateType: index < 6 ? "TODAY" : index < 11 ? "7D" : "30D",
}));

const INITIAL_FLEET_MACHINES: MachineFleetUnit[] = [
    { id: "demo-device", name: "Diamond Plaza Atrium", location: "34 Lê Duẩn, Q.1, TP.HCM", coords: "10.7801, 106.6983", status: "ONLINE", temp: "21.2°C", slotsReady: "4/4", lastSeen: "2s" },
    { id: "KIOSK-SGN-01", name: "Saigon Centre Takashimaya", location: "65 Lê Lợi, Q.1, TP.HCM", coords: "10.7731, 106.7012", status: "ONLINE", temp: "21.4°C", slotsReady: "4/4", lastSeen: "4s" },
    { id: "KIOSK-SGN-02", name: "Vincom Đồng Khởi", location: "72 Lê Thánh Tôn, Q.1, TP.HCM", coords: "10.7780, 106.7018", status: "ONLINE", temp: "21.8°C", slotsReady: "4/4", lastSeen: "5s" },
    { id: "KIOSK-SGN-03", name: "Crescent Mall", location: "101 Tôn Dật Tiên, Q.7, TP.HCM", coords: "10.7289, 106.7180", status: "ONLINE", temp: "21.6°C", slotsReady: "4/4", lastSeen: "3s" },
    { id: "KIOSK-HN-01", name: "Lotte West Lake", location: "272 Võ Chí Công, Hà Nội", coords: "21.0754, 105.8115", status: "ONLINE", temp: "22.0°C", slotsReady: "4/4", lastSeen: "3s" },
    { id: "KIOSK-HN-02", name: "Tràng Tiền Plaza", location: "24 Hai Bà Trưng, Hà Nội", coords: "21.0245, 105.8535", status: "MAINTENANCE", temp: "23.1°C", slotsReady: "0/4", lastSeen: "18m" },
    { id: "KIOSK-DAD-01", name: "IndoChina Riverside", location: "74 Bạch Đằng, Đà Nẵng", coords: "16.0680, 108.2245", status: "ONLINE", temp: "21.9°C", slotsReady: "4/4", lastSeen: "6s" },
    { id: "KIOSK-004", name: "Aeon Mall Tân Phú", location: "30 Bờ Bao Tân Thắng, TP.HCM", coords: "10.8016, 106.6174", status: "OFFLINE", temp: "24.0°C", slotsReady: "0/4", lastSeen: "2h" },
];

const INITIAL_ALERTS_LIST: AlertIncidentItem[] = [
    { id: "ALT-8901", kiosk: "KIOSK-004", location: "Aeon Mall Tân Phú", type: "MQTT_HEARTBEAT_TIMEOUT", cause: "Mất kết nối mạng quá 10 phút.", recommendation: "Kiểm tra nguồn router hoặc khởi động lại trạm.", severity: "CRITICAL", time: "12m" },
    { id: "ALT-8902", kiosk: "KIOSK-SGN-01", location: "Saigon Centre", type: "LOW_STOCK_SLOT_03", cause: "Bleu de Chanel còn 12.5ml (dưới ngưỡng 15ml).", recommendation: "Điều phối nhân viên kho nạp chai.", severity: "HIGH", time: "28m" },
    { id: "ALT-8903", kiosk: "demo-device", location: "Diamond Plaza", type: "LOW_STOCK_SLOT_04", cause: "MFK Baccarat Rouge 540 còn 9.0ml.", recommendation: "Lên lịch thay chai tại phân hệ Nạp/Thay.", severity: "WARNING", time: "45m" },
];

const INITIAL_MAINTENANCE_TICKETS: MaintenanceTicketItem[] = [
    { id: "MNT-2026-409", kiosk: "KIOSK-HN-02", issue: "Hiệu chuẩn vòi phun", status: "IN_PROGRESS", technician: "Nguyễn Hoàng Nam", progress: 70 },
    { id: "MNT-2026-410", kiosk: "KIOSK-004", issue: "Kiểm tra modem 5G", status: "OPEN", technician: "Phạm Bảo Ngọc", progress: 20 },
    { id: "MNT-2026-402", kiosk: "KIOSK-SGN-01", issue: "Kiểm tra gioăng buồng xịt", status: "COMPLETED", technician: "Lê Minh Khôi", progress: 100 },
];

const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

const isExactMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

function normalizeTransactionRecord(rawTx: any, index: number): Transaction {
    const rawStatus = String(rawTx.status || "DISPENSED").toUpperCase();
    const validStatus: Transaction["status"] =
        (["FAILED", "UNCERTAIN", "REFUNDED", "CANCELLED", "EXPIRED", "PENDING", "PAID", "DISPENSED"].includes(rawStatus)
            ? rawStatus
            : "DISPENSED") as Transaction["status"];

    const timeLabel = rawTx.timestamp || rawTx.time || "Just now";
    const inferredDateType: Transaction["dateType"] =
        rawTx.dateType ||
        (String(timeLabel).toLowerCase().includes("just now") ||
        String(timeLabel).toLowerCase().includes("today") ||
        String(timeLabel).toLowerCase().includes("hoàn tất")
            ? "TODAY"
            : "30D");

    const catalogMatch = INITIAL_MASTER_CATALOG.find(
        (c) =>
            c.product.toLowerCase() === String(rawTx.product || rawTx.productName || "").trim().toLowerCase() ||
            c.slotNumber === Number(rawTx.slotNumber)
    );

    const effectivePrice = Number(
        rawTx.priceSnapshot ?? rawTx.amount ?? rawTx.paidAmount ?? catalogMatch?.sprayPrice ?? 15000
    );

    return {
        id: String(rawTx.id || `ORD-2026-${9100 + index}`),
        kiosk: rawTx.kiosk || rawTx.kioskCode || catalogMatch?.kioskId || "demo-device",
        location: rawTx.location || catalogMatch?.location || "Diamond Plaza Atrium",
        brand: rawTx.brand || catalogMatch?.brand || "Chanel",
        product: rawTx.product || rawTx.productName || catalogMatch?.product || "Signature Scent",
        slotNumber: Number(rawTx.slotNumber || catalogMatch?.slotNumber || 1),
        amount: validStatus === "DISPENSED" || validStatus === "PAID" ? effectivePrice : 0,
        volumeDeductedMl: validStatus === "DISPENSED" ? Number(rawTx.volumeDeductedMl ?? 0.12) : 0,
        paymentMethod: rawTx.paymentMethod || "VIETQR",
        timestamp: timeLabel,
        status: validStatus,
        dateType: inferredDateType,
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const nextSequenceRef = useRef<number>(9250);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("ALL");
    const [brandOpen, setBrandOpen] = useState(false);

    const [selectedDateRange, setSelectedDateRange] = useState<"TODAY" | "7D" | "30D">("30D");
    const [dateOpen, setDateOpen] = useState(false);

    const [machineFilter, setMachineFilter] = useState<"ALL" | "ONLINE" | "OFFLINE" | "MAINTENANCE">("ALL");
    const [maintenanceFilter, setMaintenanceFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "COMPLETED">("ALL");

    const [catalogStock, setCatalogStock] = useState<CatalogPerfumeItem[]>(INITIAL_MASTER_CATALOG);
    const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_SEED_TRANSACTIONS);
    const [machines, setMachines] = useState<MachineFleetUnit[]>(INITIAL_FLEET_MACHINES);
    const [alerts, setAlerts] = useState<AlertIncidentItem[]>(INITIAL_ALERTS_LIST);
    const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicketItem[]>(INITIAL_MAINTENANCE_TICKETS);

    const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);
    const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string>("");
    const [toastBanner, setToastBanner] = useState<string | null>(null);

    const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
    const [selectedAlertDetail, setSelectedAlertDetail] = useState<AlertIncidentItem | null>(null);
    const [selectedMapMachineId, setSelectedMapMachineId] = useState<string>("demo-device");

    const [isSprayModalOpen, setIsSprayModalOpen] = useState<boolean>(false);
    const [sprayModalKioskId, setSprayModalKioskId] = useState<string>("ALL_ONLINE");
    const [sprayModalSlotNum, setSprayModalSlotNum] = useState<number>(9);
    const [sprayModalGateway, setSprayModalGateway] = useState<"VIETQR" | "MOMO" | "VNPAY">("VIETQR");
    const [isSprayPerfumeMenuOpen, setIsSprayPerfumeMenuOpen] = useState<boolean>(false);

    // Quyền theo 6 vai trò nội bộ (khớp src/lib/rbac.ts)
    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canOperateAlerts = currentRole === "OM";
    const canReplenishStock = currentRole === "IS";
    const canSimulateSpray = currentRole === "OM" || currentRole === "TE";

    const showToast = useCallback((msg: string) => {
        setToastBanner(msg);
        setTimeout(() => setToastBanner(null), 4000);
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

    const formatMachineStatus = (st: "ONLINE" | "OFFLINE" | "MAINTENANCE") => {
        if (lang === "en") return st === "ONLINE" ? "Online" : st === "MAINTENANCE" ? "Maintenance" : "Offline";
        return st === "ONLINE" ? "Sẵn sàng" : st === "MAINTENANCE" ? "Bảo trì" : "Mất kết nối";
    };

    const formatTxStatus = (st: Transaction["status"]) => {
        const map: Record<Transaction["status"], { en: string; vi: string }> = {
            DISPENSED: { en: "Dispensed", vi: "Đã phun" },
            PAID: { en: "Paid", vi: "Đã trả" },
            PENDING: { en: "Pending", vi: "Đang chờ" },
            FAILED: { en: "Failed", vi: "Thất bại" },
            UNCERTAIN: { en: "Uncertain", vi: "Chờ đối soát" },
            REFUNDED: { en: "Refunded", vi: "Đã hoàn" },
            CANCELLED: { en: "Cancelled", vi: "Đã hủy" },
            EXPIRED: { en: "Expired", vi: "Hết hạn" },
        };
        return map[st][lang];
    };

    const formatTicketStatus = (st: MaintenanceTicketItem["status"]) => {
        if (lang === "en") return st === "COMPLETED" ? "Done" : st === "IN_PROGRESS" ? "In Progress" : "Open";
        return st === "COMPLETED" ? "Hoàn tất" : st === "IN_PROGRESS" ? "Đang xử lý" : "Mới mở";
    };

    const loadAndReconcileAllStores = useCallback(() => {
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
                const scope = parsedUser.brandScope || parsedUser.brand || null;
                if (resolvedRole === "BA" && scope) {
                    setLockedBrandScope(scope);
                    setSelectedBrand(scope);
                } else {
                    setLockedBrandScope(null);
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};

            let nextMachines: MachineFleetUnit[] = [...INITIAL_FLEET_MACHINES];
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedFleet = JSON.parse(rawMachines);
                if (Array.isArray(parsedFleet) && parsedFleet.length > 0) {
                    nextMachines = parsedFleet.map((fm: any) => {
                        const code = String(fm.code || fm.id || "demo-device");
                        const seedMatch = INITIAL_FLEET_MACHINES.find((im) => im.id.toLowerCase() === code.toLowerCase());
                        const conn = fm.connectionStatus || (fm.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                        const oper = fm.operatingStatus || (fm.status === "MAINTENANCE" ? "MAINTENANCE" : fm.status === "OFFLINE" ? "ERROR" : "ACTIVE");
                        const unifiedStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" =
                            conn === "OFFLINE" ? "OFFLINE" : oper === "MAINTENANCE" ? "MAINTENANCE" : oper === "ACTIVE" ? "ONLINE" : "OFFLINE";
                        const readySlotsCount = unifiedStatus !== "ONLINE" ? 0 : Array.isArray(fm.slots) ? fm.slots.filter((s: any) => Number(s.remainingMl ?? 100) >= 0.12).length : 4;
                        return {
                            id: code,
                            name: fm.locationName || seedMatch?.name || code,
                            location: fm.address || seedMatch?.location || "TP.HCM",
                            coords: seedMatch?.coords || "10.7801, 106.6983",
                            status: unifiedStatus,
                            temp: fm.chamberTemp || seedMatch?.temp || "21.4°C",
                            slotsReady: `${readySlotsCount}/4`,
                            lastSeen: fm.lastActivity || seedMatch?.lastSeen || "2s",
                        };
                    });
                }
            }

            const nextCatalog = INITIAL_MASTER_CATALOG.map((item) => {
                const kLower = item.kioskId.toLowerCase();
                const pKey = item.product.trim().toLowerCase();
                const matrixMl = perKioskMatrix[kLower]?.[pKey];
                const remMl = typeof matrixMl === "number" ? matrixMl : item.remainingVolumeMl;
                return {
                    ...item,
                    remainingVolumeMl: Number(Math.max(0, remMl).toFixed(2)),
                    remainingStockPct: Math.max(0, Math.round((remMl / item.bottleCapacityMl) * 100)),
                };
            });

            let nextTxs: Transaction[] = [...INITIAL_SEED_TRANSACTIONS];
            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            if (rawDash) {
                const parsedDash = JSON.parse(rawDash);
                if (Array.isArray(parsedDash.transactions) && parsedDash.transactions.length > 0) {
                    const normalizedLive = parsedDash.transactions.map((t: any, idx: number) => normalizeTransactionRecord(t, idx));
                    const existingIds = new Set(normalizedLive.map((t: Transaction) => t.id));
                    nextTxs = [...normalizedLive, ...INITIAL_SEED_TRANSACTIONS.filter((s) => !existingIds.has(s.id))];
                }
            }

            setCatalogStock(nextCatalog);
            setMachines(nextMachines);
            setTransactions(nextTxs);
            setLastUpdatedLabel(new Date().toLocaleTimeString("vi-VN", { hour12: false }));
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadAndReconcileAllStores();
        const handleCrossSync = () => loadAndReconcileAllStores();
        window.addEventListener("storage", handleCrossSync);
        window.addEventListener("focus", handleCrossSync);
        window.addEventListener("scentstation-sync", handleCrossSync);
        const timer = setInterval(() => loadAndReconcileAllStores(), 3000);
        return () => {
            window.removeEventListener("storage", handleCrossSync);
            window.removeEventListener("focus", handleCrossSync);
            window.removeEventListener("scentstation-sync", handleCrossSync);
            clearInterval(timer);
        };
    }, [loadAndReconcileAllStores]);

    const propagateStockAndMachineToOtherStores = useCallback(
        (updatedCatalog: CatalogPerfumeItem[], updatedMachines: MachineFleetUnit[], sprayedItem?: CatalogPerfumeItem, newTxRecord?: Transaction) => {
            try {
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
                updatedCatalog.forEach((c) => {
                    const kKey = c.kioskId.toLowerCase();
                    const pKey = c.product.trim().toLowerCase();
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    perKioskMatrix[kKey][pKey] = Number(c.remainingVolumeMl);
                });
                localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                const dashData = rawDash ? JSON.parse(rawDash) : { transactions: [], incidents: [], alerts: [] };
                if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                if (newTxRecord && sprayedItem) {
                    const nowIso = new Date().toISOString();
                    dashData.transactions.unshift({
                        id: newTxRecord.id,
                        time: newTxRecord.timestamp,
                        kiosk: newTxRecord.kiosk,
                        location: newTxRecord.location,
                        slotNumber: newTxRecord.slotNumber,
                        brand: newTxRecord.brand,
                        product: newTxRecord.product,
                        priceSnapshot: newTxRecord.amount,
                        amount: newTxRecord.amount,
                        paidAmount: newTxRecord.amount,
                        paymentMethod: newTxRecord.paymentMethod,
                        status: "DISPENSED",
                        createdAt: nowIso,
                        dateType: "TODAY",
                    });
                    const rawMovements = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movements = rawMovements ? JSON.parse(rawMovements) : [];
                    movements.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: newTxRecord.id,
                        kioskCode: sprayedItem.kioskId,
                        slotNumber: sprayedItem.slotNumber,
                        brand: sprayedItem.brand,
                        productName: sprayedItem.product,
                        movementType: "SALE",
                        deltaMl: -0.12,
                        timestamp: nowIso,
                    });
                    localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(movements.slice(0, 300)));
                }
                localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));
                window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        []
    );

    const executeTargetedSprayOrder = useCallback(
        (targetSlotNumber?: number, preferredGateway: "VIETQR" | "MOMO" | "VNPAY" = "VIETQR", showFeedbackToast: boolean = true) => {
            if (!canSimulateSpray) return;
            const onlineSet = new Set(machines.filter((m) => m.status === "ONLINE").map((m) => m.id.toLowerCase()));
            const chosen =
                typeof targetSlotNumber === "number"
                    ? catalogStock.find((item) => item.slotNumber === targetSlotNumber)
                    : catalogStock.find((item) => onlineSet.has(item.kioskId.toLowerCase()) && item.remainingVolumeMl >= 0.12);
            if (!chosen || !onlineSet.has(chosen.kioskId.toLowerCase()) || chosen.remainingVolumeMl < 0.12) return;

            const txnId = `ORD-2026-${nextSequenceRef.current++}`;
            const nextRemainingMl = Number(Math.max(0, chosen.remainingVolumeMl - 0.12).toFixed(2));
            const nextPct = Math.max(0, Math.round((nextRemainingMl / chosen.bottleCapacityMl) * 100));

            const newTx: Transaction = {
                id: txnId,
                kiosk: chosen.kioskId,
                location: chosen.location,
                brand: chosen.brand,
                product: chosen.product,
                slotNumber: chosen.slotNumber,
                amount: chosen.sprayPrice,
                volumeDeductedMl: 0.12,
                paymentMethod: preferredGateway,
                timestamp: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
                status: "DISPENSED",
                dateType: "TODAY",
            };

            const nextCatalog = catalogStock.map((item) =>
                item.slotNumber === chosen.slotNumber ? { ...item, remainingVolumeMl: nextRemainingMl, remainingStockPct: nextPct } : item
            );
            setTransactions((prev) => [newTx, ...prev]);
            setCatalogStock(nextCatalog);
            propagateStockAndMachineToOtherStores(nextCatalog, machines, { ...chosen, remainingVolumeMl: nextRemainingMl }, newTx);

            if (showFeedbackToast) {
                showToast(
                    lang === "en"
                        ? `Dispensed -0.12ml (${chosen.product} on ${chosen.kioskId}).`
                        : `Đã xịt -0.12ml (${chosen.product} tại ${chosen.kioskId}).`
                );
            }
        },
        [canSimulateSpray, catalogStock, lang, machines, propagateStockAndMachineToOtherStores, showToast]
    );

    useEffect(() => {
        if (!isLiveStreamActive || !canSimulateSpray) return;
        const interval = setInterval(() => executeTargetedSprayOrder(undefined, "VIETQR", false), 5000);
        return () => clearInterval(interval);
    }, [isLiveStreamActive, canSimulateSpray, executeTargetedSprayOrder]);

    const handleResolveAlertAndReboot = (alertItem: AlertIncidentItem) => {
        if (!canOperateAlerts) return;
        const nextMachines = machines.map((m) =>
            m.id.toLowerCase() === alertItem.kiosk.toLowerCase() ? { ...m, status: "ONLINE" as const, slotsReady: "4/4", lastSeen: "2s" } : m
        );
        setMachines(nextMachines);
        setAlerts((prev) => prev.filter((a) => a.id !== alertItem.id));
        propagateStockAndMachineToOtherStores(catalogStock, nextMachines);
        setSelectedAlertDetail(null);
        showToast(lang === "en" ? `Resolved ${alertItem.id}.` : `Đã xử lý ${alertItem.id}.`);
    };

    const handleQuickReplenishSlot = (slotNum: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!canReplenishStock) return;
        const nextCatalog = catalogStock.map((item) =>
            item.slotNumber === slotNum ? { ...item, remainingVolumeMl: item.bottleCapacityMl, remainingStockPct: 100 } : item
        );
        setCatalogStock(nextCatalog);
        propagateStockAndMachineToOtherStores(nextCatalog, machines);
        showToast(lang === "en" ? "Replenished to 100%." : "Đã nạp đầy 100%.");
    };

    const uniqueBrands = useMemo(() => Array.from(new Set(catalogStock.map((i) => i.brand))).sort(), [catalogStock]);
    const effectiveBrandFilter = lockedBrandScope || selectedBrand;

    const rangeTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            if (selectedDateRange === "TODAY") return tx.dateType === "TODAY";
            if (selectedDateRange === "7D") return tx.dateType === "TODAY" || tx.dateType === "7D";
            return true;
        });
    }, [transactions, selectedDateRange]);

    const finalFilteredTransactions = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return rangeTransactions.filter((tx) => {
            const matchesSearch = !q || tx.id.toLowerCase().includes(q) || tx.product.toLowerCase().includes(q) || tx.kiosk.toLowerCase().includes(q) || tx.brand.toLowerCase().includes(q);
            const matchesBrand = effectiveBrandFilter === "ALL" || tx.brand === effectiveBrandFilter;
            return matchesSearch && matchesBrand;
        });
    }, [rangeTransactions, searchQuery, effectiveBrandFilter]);

    const verifiedDispensedTransactions = useMemo(
        () => finalFilteredTransactions.filter((tx) => tx.status === "DISPENSED" || tx.status === "PAID"),
        [finalFilteredTransactions]
    );

    const totalRevenueNum = useMemo(() => verifiedDispensedTransactions.reduce((sum, tx) => sum + tx.amount, 0), [verifiedDispensedTransactions]);
    const totalOrdersCount = verifiedDispensedTransactions.length;

    const topPerformingBrands = useMemo(() => {
        const map = new Map<string, { brand: string; revenue: number; sprays: number }>();
        verifiedDispensedTransactions.forEach((tx) => {
            const cur = map.get(tx.brand) || { brand: tx.brand, revenue: 0, sprays: 0 };
            cur.revenue += tx.amount;
            cur.sprays += 1;
            map.set(tx.brand, cur);
        });
        return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    }, [verifiedDispensedTransactions]);

    const lowStockItems = useMemo(() => {
        return catalogStock.filter((item) => {
            const matchesBrand = effectiveBrandFilter === "ALL" || item.brand === effectiveBrandFilter;
            return matchesBrand && (item.remainingVolumeMl <= 15 || item.remainingStockPct <= item.thresholdPct);
        });
    }, [catalogStock, effectiveBrandFilter]);

    const filteredMachines = useMemo(() => machines.filter((m) => machineFilter === "ALL" || m.status === machineFilter), [machines, machineFilter]);
    const selectedMapMachine = useMemo(() => machines.find((m) => m.id.toLowerCase() === selectedMapMachineId.toLowerCase()) || machines[0], [machines, selectedMapMachineId]);
    const onlineMachinesList = useMemo(() => machines.filter((m) => m.status === "ONLINE"), [machines]);

    const sprayModalFilteredCatalog = useMemo(() => {
        const onlineSet = new Set(onlineMachinesList.map((m) => m.id.toLowerCase()));
        return catalogStock.filter((item) => {
            if (item.remainingVolumeMl < 0.12) return false;
            if (sprayModalKioskId === "ALL_ONLINE") return onlineSet.has(item.kioskId.toLowerCase());
            return item.kioskId.toLowerCase() === sprayModalKioskId.toLowerCase();
        });
    }, [catalogStock, onlineMachinesList, sprayModalKioskId]);

    const selectedSprayModalProduct = useMemo(
        () => sprayModalFilteredCatalog.find((item) => item.slotNumber === sprayModalSlotNum) || sprayModalFilteredCatalog[0] || catalogStock[0],
        [catalogStock, sprayModalFilteredCatalog, sprayModalSlotNum]
    );

    const dateOptions = [
        { label: lang === "en" ? "Today" : "Hôm nay", value: "TODAY" },
        { label: lang === "en" ? "Last 7 Days" : "7 ngày qua", value: "7D" },
        { label: lang === "en" ? "Last 30 Days" : "30 ngày qua", value: "30D" },
    ];

    const googleSatelliteEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(selectedMapMachine?.coords || "10.7801, 106.6983")}&t=h&z=16&ie=UTF8&iwloc=&output=embed`;

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => {
                setBrandOpen(false);
                setDateOpen(false);
            }}
        >
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Dashboard" : "Tổng quan hệ thống"}</h1>
                        <div className={styles.scopeBadge}>
                            <span>{roleConfig.label}</span>
                            {lockedBrandScope && <span>• {lockedBrandScope}</span>}
                            {lastUpdatedLabel && (
                                <span style={{ color: "#94A3B8", fontWeight: 500 }}>
                                    • {lang === "en" ? "Updated" : "Cập nhật"}: {lastUpdatedLabel}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.headerActionGroup}>
                        <button type="button" onClick={handleToggleLanguage} className={styles.secondaryGoldBtn}>
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        {canSimulateSpray && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSprayPerfumeMenuOpen(false);
                                        setIsSprayModalOpen(true);
                                    }}
                                    className={styles.primaryGoldBtn}
                                    title={lang === "en" ? "Simulate 1 calibrated spray (-0.12ml)" : "Mô phỏng 1 lần xịt định lượng (-0.12ml)"}
                                >
                                    <Zap size={14} />
                                    <span>{lang === "en" ? "Test Spray" : "Mô phỏng xịt"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsLiveStreamActive(!isLiveStreamActive);
                                    }}
                                    className={styles.secondaryGoldBtn}
                                    style={{ color: isLiveStreamActive ? "#34D399" : "#FBBF24" }}
                                >
                                    {isLiveStreamActive ? <Pause size={13} /> : <Play size={13} />}
                                    <span>
                                        {isLiveStreamActive
                                            ? lang === "en" ? "Auto: ON" : "Tự động: Bật"
                                            : lang === "en" ? "Auto: OFF" : "Tự động: Tắt"}
                                    </span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 4 KPI CHÍNH */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard} onClick={() => router.push("/reports")}>
                        <div>
                            <p className={styles.statLabel}>
                                {lang === "en" ? `Recognized Revenue (${selectedDateRange})` : `Doanh thu ghi nhận (${selectedDateRange})`}
                            </p>
                            <p className={styles.statValue}>{totalRevenueNum.toLocaleString("vi-VN")} VND</p>
                            <span className={styles.statTrend}>
                                <ArrowUpRight size={14} />
                                <span>{lang === "en" ? `${totalOrdersCount} verified sprays` : `${totalOrdersCount} lượt xịt xác nhận`}</span>
                            </span>
                        </div>
                        <div className={styles.statIconBox} style={{ color: "#D4AF37", background: "rgba(212, 175, 55, 0.12)" }}>
                            <Sparkles size={18} />
                        </div>
                    </div>

                    <div className={styles.statCard} onClick={() => router.push("/transactions")}>
                        <div>
                            <p className={styles.statLabel}>{lang === "en" ? "Dispensed Orders" : "Đơn đã phun"}</p>
                            <p className={styles.statValue}>{totalOrdersCount.toLocaleString("vi-VN")}</p>
                            <span className={styles.statTrend}>
                                <span>{lang === "en" ? "Excludes failed/refunded" : "Không tính đơn lỗi/hoàn"}</span>
                            </span>
                        </div>
                        <div className={styles.statIconBox} style={{ color: "#34D399", background: "rgba(52, 211, 153, 0.12)" }}>
                            <ShoppingBag size={18} />
                        </div>
                    </div>

                    <div className={styles.statCard} onClick={() => router.push("/products")}>
                        <div>
                            <p className={styles.statLabel}>{lang === "en" ? "Catalog & Low Stock" : "Danh mục & Tồn thấp"}</p>
                            <p className={styles.statValue}>{catalogStock.length} SKUs</p>
                            <span className={styles.statTrend} style={{ color: lowStockItems.length > 0 ? "#FBBF24" : "#34D399" }}>
                                <span>{lowStockItems.length} {lang === "en" ? "low stock (≤ 15ml)" : "bình sắp cạn (≤ 15ml)"}</span>
                            </span>
                        </div>
                        <div className={styles.statIconBox} style={{ color: "#F5E6AD", background: "rgba(245, 230, 173, 0.12)" }}>
                            <Building2 size={18} />
                        </div>
                    </div>

                    <div className={styles.statCard} onClick={() => router.push("/machines")}>
                        <div>
                            <p className={styles.statLabel}>{lang === "en" ? "Stations & Alerts" : "Trạm & Cảnh báo"}</p>
                            <p className={styles.statValue}>
                                {onlineMachinesList.length}/{machines.length} {lang === "en" ? "Online" : "Sẵn sàng"}
                            </p>
                            <span className={styles.statTrend} style={{ color: alerts.length > 0 ? "#F87171" : "#34D399" }}>
                                <span>{alerts.length} {lang === "en" ? "open alerts" : "cảnh báo đang mở"}</span>
                            </span>
                        </div>
                        <div className={styles.statIconBox} style={{ color: "#F87171", background: "rgba(248, 113, 113, 0.12)" }}>
                            <AlertOctagon size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* BỘ LỌC */}
            <div className={styles.filterBar} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={lang === "en" ? "Search order ID, station, fragrance, brand..." : "Tìm mã đơn, trạm, nước hoa, thương hiệu..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.customSelectWrapper}>
                    <div className={styles.customSelectHeader} onClick={() => { setDateOpen(!dateOpen); setBrandOpen(false); }}>
                        <span>{dateOptions.find((o) => o.value === selectedDateRange)?.label}</span>
                        <ChevronDown size={14} color="#D4AF37" />
                    </div>
                    {dateOpen && (
                        <div className={styles.customDropdownList}>
                            {dateOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`${styles.customDropdownItem} ${selectedDateRange === opt.value ? styles.customDropdownItemSelected : ""}`}
                                    onClick={() => { setSelectedDateRange(opt.value as any); setDateOpen(false); }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chỉ hiện bộ lọc thương hiệu nếu tài khoản KHÔNG bị khóa theo 1 brand (BA không thấy "Tất cả thương hiệu") */}
                {!lockedBrandScope && (
                    <div className={styles.customSelectWrapper}>
                        <div className={styles.customSelectHeader} onClick={() => { setBrandOpen(!brandOpen); setDateOpen(false); }}>
                            <span>
                                {selectedBrand === "ALL"
                                    ? lang === "en" ? `All Brands (${uniqueBrands.length})` : `Tất cả thương hiệu (${uniqueBrands.length})`
                                    : selectedBrand}
                            </span>
                            <ChevronDown size={14} color="#D4AF37" />
                        </div>
                        {brandOpen && (
                            <div className={styles.customDropdownList} style={{ maxHeight: "260px", overflowY: "auto" }}>
                                <div
                                    className={`${styles.customDropdownItem} ${selectedBrand === "ALL" ? styles.customDropdownItemSelected : ""}`}
                                    onClick={() => { setSelectedBrand("ALL"); setBrandOpen(false); }}
                                >
                                    {lang === "en" ? `All Brands (${uniqueBrands.length})` : `Tất cả thương hiệu (${uniqueBrands.length})`}
                                </div>
                                {uniqueBrands.map((b) => (
                                    <div
                                        key={b}
                                        className={`${styles.customDropdownItem} ${selectedBrand === b ? styles.customDropdownItemSelected : ""}`}
                                        onClick={() => { setSelectedBrand(b); setBrandOpen(false); }}
                                    >
                                        {b}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {(searchQuery || (!lockedBrandScope && selectedBrand !== "ALL")) && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery("");
                            if (!lockedBrandScope) setSelectedBrand("ALL");
                        }}
                        className={styles.secondaryGoldBtn}
                    >
                        <RefreshCw size={13} />
                        <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                    </button>
                )}
            </div>

            {/* BIỂU ĐỒ XU HƯỚNG */}
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <h2 className={styles.chartTitle}>
                        {lang === "en" ? `Revenue & Dispense Trend (${selectedDateRange})` : `Xu hướng doanh thu & lượt xịt (${selectedDateRange})`}
                    </h2>
                    <span className={styles.chartSub}>
                        {effectiveBrandFilter === "ALL" ? (lang === "en" ? "All Brands" : "Tất cả thương hiệu") : effectiveBrandFilter} • {totalOrdersCount} {lang === "en" ? "orders" : "đơn"}
                    </span>
                </div>
                <RealTimeChart
                    selectedDateRange={selectedDateRange}
                    selectedBrand={effectiveBrandFilter}
                    latestOrderAmount={verifiedDispensedTransactions[0]?.amount || 15000}
                    totalOrdersCount={totalOrdersCount}
                    lang={lang}
                />
            </div>

            {/* GIAO DỊCH GẦN ĐÂY + THƯƠNG HIỆU HÀNG ĐẦU */}
            <div className={styles.gridTwoCols}>
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>
                            {lang === "en" ? `Recent Transactions (${finalFilteredTransactions.length})` : `Giao dịch gần đây (${finalFilteredTransactions.length})`}
                        </h3>
                        <button type="button" onClick={() => router.push("/transactions")} className={styles.secondaryGoldBtn} style={{ padding: "0.38rem 0.75rem", fontSize: "0.78rem" }}>
                            {lang === "en" ? "View All" : "Xem tất cả"}
                        </button>
                    </div>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>{lang === "en" ? "Order" : "Mã đơn"}</th>
                                <th>{lang === "en" ? "Station" : "Trạm"}</th>
                                <th>{lang === "en" ? "Fragrance" : "Sản phẩm"}</th>
                                <th>{lang === "en" ? "Amount" : "Số tiền"}</th>
                                <th>{lang === "en" ? "Status" : "Trạng thái"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {finalFilteredTransactions.map((tx, idx) => (
                                <tr key={`${tx.id}-${idx}`} style={{ cursor: "pointer" }} onClick={() => setSelectedTxDetail(tx)}>
                                    <td style={{ color: "#F5E6AD", fontWeight: 700 }}>{tx.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{tx.kiosk}</div>
                                        <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{tx.timestamp}</div>
                                    </td>
                                    <td>
                                        <strong>{tx.product}</strong>
                                        <div style={{ fontSize: "0.74rem", color: "#D4AF37" }}>{tx.brand}</div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{tx.amount.toLocaleString("vi-VN")} VND</td>
                                    <td>
                                            <span className={tx.status === "FAILED" || tx.status === "CANCELLED" ? styles.badgeDanger : tx.status === "DISPENSED" || tx.status === "PAID" ? styles.badgeSuccess : styles.badgeWarning}>
                                                {formatTxStatus(tx.status)}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>{lang === "en" ? "Top Brands" : "Thương hiệu nổi bật"}</h3>
                        {!lockedBrandScope && (
                            <button type="button" onClick={() => router.push("/brands")} className={styles.secondaryGoldBtn} style={{ padding: "0.38rem 0.75rem", fontSize: "0.78rem" }}>
                                {lang === "en" ? "All Brands" : "Xem tất cả"}
                            </button>
                        )}
                    </div>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>{lang === "en" ? "Brand" : "Thương hiệu"}</th>
                                <th>{lang === "en" ? "Sprays" : "Lượt xịt"}</th>
                                <th>{lang === "en" ? "Revenue" : "Doanh thu"}</th>
                                <th>{lang === "en" ? "Filter" : "Lọc"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topPerformingBrands.map((b) => (
                                <tr
                                    key={b.brand}
                                    style={{ cursor: lockedBrandScope ? "default" : "pointer" }}
                                    onClick={() => {
                                        if (lockedBrandScope) return;
                                        setSelectedBrand(selectedBrand === b.brand ? "ALL" : b.brand);
                                    }}
                                >
                                    <td style={{ fontWeight: 700 }}>{b.brand}</td>
                                    <td>{b.sprays}</td>
                                    <td style={{ color: "#F5E6AD", fontWeight: 700 }}>{b.revenue.toLocaleString("vi-VN")} VND</td>
                                    <td>
                                            <span className={styles.badgeSuccess}>
                                                <Eye size={12} />
                                                <span>{lang === "en" ? "View" : "Xem"}</span>
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CẢNH BÁO + TỒN KHO THẤP */}
            <div className={styles.gridTwoCols}>
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>
                            {lang === "en" ? `Active Alerts (${alerts.length})` : `Cảnh báo đang mở (${alerts.length})`}
                        </h3>
                        <button type="button" onClick={() => router.push("/alerts")} className={styles.secondaryGoldBtn} style={{ padding: "0.38rem 0.75rem", fontSize: "0.78rem" }}>
                            {lang === "en" ? "Open Alerts" : "Mở cảnh báo"}
                        </button>
                    </div>
                    <div className={styles.tableScrollContainer} style={{ maxHeight: "250px" }}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>{lang === "en" ? "ID" : "Mã"}</th>
                                <th>{lang === "en" ? "Station" : "Trạm"}</th>
                                <th>{lang === "en" ? "Type" : "Loại"}</th>
                                <th>{lang === "en" ? "Severity" : "Mức độ"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {alerts.map((al) => (
                                <tr key={al.id} style={{ cursor: "pointer" }} onClick={() => setSelectedAlertDetail(al)}>
                                    <td style={{ color: "#F87171", fontWeight: 700 }}>{al.id}</td>
                                    <td>
                                        <strong>{al.kiosk}</strong>
                                        <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{al.location}</div>
                                    </td>
                                    <td>{al.type}</td>
                                    <td>
                                            <span className={al.severity === "CRITICAL" ? styles.badgeDanger : styles.badgeWarning}>
                                                {al.severity}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>
                            {lang === "en" ? `Low Stock (${lowStockItems.length})` : `Tồn kho thấp (${lowStockItems.length})`}
                        </h3>
                        <button type="button" onClick={() => router.push("/inventory")} className={styles.secondaryGoldBtn} style={{ padding: "0.38rem 0.75rem", fontSize: "0.78rem" }}>
                            {lang === "en" ? "Inventory" : "Mở kho"}
                        </button>
                    </div>
                    <div className={styles.tableScrollContainer} style={{ maxHeight: "250px" }}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>{lang === "en" ? "Station" : "Trạm"}</th>
                                <th>{lang === "en" ? "Fragrance" : "Sản phẩm"}</th>
                                <th>{lang === "en" ? "Remaining" : "Còn lại"}</th>
                                {canReplenishStock && <th>{lang === "en" ? "Action" : "Thao tác"}</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {lowStockItems.map((item) => (
                                <tr key={`${item.kioskId}-${item.slotNumber}`}>
                                    <td style={{ color: "#F5E6AD", fontWeight: 700 }}>{item.kioskId}</td>
                                    <td>
                                        <strong>{item.product}</strong>
                                        <div style={{ fontSize: "0.74rem", color: "#D4AF37" }}>{item.brand}</div>
                                    </td>
                                    <td style={{ color: "#F87171", fontWeight: 700 }}>
                                        {item.remainingVolumeMl}ml / {item.bottleCapacityMl}ml ({item.remainingStockPct}%)
                                    </td>
                                    {canReplenishStock && (
                                        <td>
                                            <button
                                                type="button"
                                                onClick={(e) => handleQuickReplenishSlot(item.slotNumber, e)}
                                                className={styles.badgeWarning}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <Droplets size={11} />
                                                <span>{lang === "en" ? "Refill 100%" : "Nạp 100%"}</span>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* TRẠNG THÁI MÁY & BẢO TRÌ */}
            <div className={styles.gridTwoCols}>
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>{lang === "en" ? "Stations & Map" : "Đội máy & Bản đồ"}</h3>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                            {(["ALL", "ONLINE", "OFFLINE", "MAINTENANCE"] as const).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setMachineFilter(st)}
                                    className={styles.secondaryGoldBtn}
                                    style={{
                                        padding: "0.3rem 0.6rem",
                                        fontSize: "0.74rem",
                                        borderColor: machineFilter === st ? "#D4AF37" : undefined,
                                        color: machineFilter === st ? "#F5E6AD" : undefined,
                                    }}
                                >
                                    {st === "ALL" ? (lang === "en" ? "All" : "Tất cả") : formatMachineStatus(st)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedMapMachine && (
                        <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", marginBottom: "0.85rem" }}>
                            <div style={{ height: "155px", width: "100%" }}>
                                <iframe
                                    key={selectedMapMachine.id}
                                    title={selectedMapMachine.id}
                                    src={googleSatelliteEmbedUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, display: "block" }}
                                    loading="lazy"
                                />
                            </div>
                            <div style={{ padding: "0.6rem 0.85rem", background: "#0B0D14", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem" }}>
                                <span>
                                    <MapPin size={13} color="#D4AF37" style={{ display: "inline", marginRight: "4px" }} />
                                    <strong>{selectedMapMachine.id}</strong> — {selectedMapMachine.name} ({selectedMapMachine.temp})
                                </span>
                                <button type="button" onClick={() => router.push(`/machines/${encodeURIComponent(selectedMapMachine.id)}`)} className={styles.secondaryGoldBtn} style={{ padding: "0.28rem 0.6rem", fontSize: "0.74rem" }}>
                                    {lang === "en" ? "Details" : "Chi tiết"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.tableScrollContainer} style={{ maxHeight: "190px" }}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>{lang === "en" ? "Station" : "Mã trạm"}</th>
                                <th>{lang === "en" ? "Location" : "Địa điểm"}</th>
                                <th>{lang === "en" ? "Slots" : "Khoang"}</th>
                                <th>{lang === "en" ? "Status" : "Trạng thái"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredMachines.map((m) => (
                                <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => setSelectedMapMachineId(m.id)}>
                                    <td style={{ color: "#F5E6AD", fontWeight: 700 }}>{m.id}</td>
                                    <td>{m.name}</td>
                                    <td>{m.slotsReady}</td>
                                    <td>
                                            <span className={m.status === "ONLINE" ? styles.badgeSuccess : m.status === "MAINTENANCE" ? styles.badgeWarning : styles.badgeDanger}>
                                                {formatMachineStatus(m.status)}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>{lang === "en" ? "Maintenance Tickets" : "Phiếu bảo trì"}</h3>
                        <button type="button" onClick={() => router.push("/maintenance")} className={styles.secondaryGoldBtn} style={{ padding: "0.38rem 0.75rem", fontSize: "0.78rem" }}>
                            {lang === "en" ? "View All" : "Xem tất cả"}
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
                        {(["ALL", "OPEN", "IN_PROGRESS", "COMPLETED"] as const).map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setMaintenanceFilter(st)}
                                className={styles.secondaryGoldBtn}
                                style={{
                                    padding: "0.3rem 0.6rem",
                                    fontSize: "0.74rem",
                                    borderColor: maintenanceFilter === st ? "#D4AF37" : undefined,
                                    color: maintenanceFilter === st ? "#F5E6AD" : undefined,
                                }}
                            >
                                {st === "ALL" ? (lang === "en" ? "All" : "Tất cả") : formatTicketStatus(st)}
                            </button>
                        ))}
                    </div>

                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>{lang === "en" ? "Ticket" : "Mã phiếu"}</th>
                            <th>{lang === "en" ? "Station & Issue" : "Trạm & Lỗi"}</th>
                            <th>{lang === "en" ? "Technician" : "Kỹ thuật viên"}</th>
                            <th>{lang === "en" ? "Status" : "Trạng thái"}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {maintenanceTickets
                            .filter((t) => maintenanceFilter === "ALL" || t.status === maintenanceFilter)
                            .map((tk) => (
                                <tr key={tk.id} style={{ cursor: "pointer" }} onClick={() => router.push("/maintenance")}>
                                    <td style={{ color: "#F5E6AD", fontWeight: 700 }}>{tk.id}</td>
                                    <td>
                                        <strong>{tk.kiosk}</strong>
                                        <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{tk.issue}</div>
                                    </td>
                                    <td>{tk.technician}</td>
                                    <td>
                                            <span className={tk.status === "COMPLETED" ? styles.badgeSuccess : tk.status === "IN_PROGRESS" ? styles.badgeWarning : styles.badgeDanger}>
                                                {formatTicketStatus(tk.status)} ({tk.progress}%)
                                            </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL MÔ PHỎNG XỊT (CHỈ DÀNH CHO OM / TE) */}
            {isSprayModalOpen && canSimulateSpray && (
                <div className={styles.modalOverlay} onClick={() => setIsSprayModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.12rem", fontWeight: 700 }}>
                                {lang === "en" ? "Test Spray (-0.12ml)" : "Mô phỏng xịt (-0.12ml)"}
                            </h3>
                            <button type="button" onClick={() => setIsSprayModalOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}>
                                <X size={15} />
                            </button>
                        </div>

                        <div style={{ marginBottom: "0.85rem" }}>
                            <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.4rem" }}>
                                {lang === "en" ? "Online Station" : "Trạm đang hoạt động"}
                            </label>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    onClick={() => setSprayModalKioskId("ALL_ONLINE")}
                                    className={sprayModalKioskId === "ALL_ONLINE" ? styles.primaryGoldBtn : styles.secondaryGoldBtn}
                                    style={{ padding: "0.38rem 0.7rem", fontSize: "0.76rem" }}
                                >
                                    {lang === "en" ? "All" : "Tất cả"}
                                </button>
                                {onlineMachinesList.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setSprayModalKioskId(m.id)}
                                        className={sprayModalKioskId === m.id ? styles.primaryGoldBtn : styles.secondaryGoldBtn}
                                        style={{ padding: "0.38rem 0.7rem", fontSize: "0.76rem" }}
                                    >
                                        <Cpu size={12} />
                                        <span>{m.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "1rem", position: "relative" }}>
                            <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.4rem" }}>
                                {lang === "en" ? "Fragrance" : "Mùi hương"}
                            </label>
                            <div className={styles.customSelectHeader} onClick={() => setIsSprayPerfumeMenuOpen(!isSprayPerfumeMenuOpen)}>
                                <span>
                                    {selectedSprayModalProduct
                                        ? `${selectedSprayModalProduct.kioskId} — ${selectedSprayModalProduct.product} (${selectedSprayModalProduct.remainingVolumeMl}ml)`
                                        : "—"}
                                </span>
                                <ChevronDown size={14} color="#D4AF37" />
                            </div>
                            {isSprayPerfumeMenuOpen && (
                                <div className={styles.customDropdownList} style={{ maxHeight: "200px", overflowY: "auto" }}>
                                    {sprayModalFilteredCatalog.map((item) => (
                                        <div
                                            key={`${item.kioskId}-${item.slotNumber}`}
                                            className={`${styles.customDropdownItem} ${selectedSprayModalProduct?.slotNumber === item.slotNumber ? styles.customDropdownItemSelected : ""}`}
                                            onClick={() => { setSprayModalSlotNum(item.slotNumber); setIsSprayPerfumeMenuOpen(false); }}
                                        >
                                            [{item.kioskId}] {item.product} ({item.remainingVolumeMl}ml)
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "0.6rem" }}>
                            <button type="button" onClick={() => setIsSprayModalOpen(false)} className={styles.secondaryGoldBtn} style={{ flex: 1 }}>
                                {lang === "en" ? "Cancel" : "Hủy"}
                            </button>
                            <button
                                type="button"
                                disabled={!selectedSprayModalProduct}
                                onClick={() => {
                                    if (!selectedSprayModalProduct) return;
                                    executeTargetedSprayOrder(selectedSprayModalProduct.slotNumber, sprayModalGateway, true);
                                    setIsSprayModalOpen(false);
                                }}
                                className={styles.primaryGoldBtn}
                                style={{ flex: 1.5 }}
                            >
                                <Zap size={14} />
                                <span>{lang === "en" ? "Confirm Spray" : "Xác nhận xịt"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT GIAO DỊCH */}
            {selectedTxDetail && (
                <div className={styles.modalOverlay} onClick={() => setSelectedTxDetail(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{selectedTxDetail.id}</h3>
                            <button type="button" onClick={() => setSelectedTxDetail(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}>
                                <X size={15} />
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", fontSize: "0.86rem", marginBottom: "1.2rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>{lang === "en" ? "Product" : "Sản phẩm"}:</span>
                                <strong>{selectedTxDetail.brand} — {selectedTxDetail.product}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>{lang === "en" ? "Station" : "Trạm"}:</span>
                                <strong>{selectedTxDetail.kiosk}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>{lang === "en" ? "Payment" : "Thanh toán"}:</span>
                                <strong>{selectedTxDetail.paymentMethod} • {selectedTxDetail.amount.toLocaleString("vi-VN")} VND</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>{lang === "en" ? "Status" : "Trạng thái"}:</span>
                                <strong>{formatTxStatus(selectedTxDetail.status)}</strong>
                            </div>
                        </div>
                        <button type="button" onClick={() => setSelectedTxDetail(null)} className={styles.primaryGoldBtn} style={{ width: "100%" }}>
                            {lang === "en" ? "Close" : "Đóng"}
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT CẢNH BÁO */}
            {selectedAlertDetail && (
                <div className={styles.modalOverlay} onClick={() => setSelectedAlertDetail(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                            <h3 style={{ margin: 0, color: "#F87171" }}>{selectedAlertDetail.id} — {selectedAlertDetail.type}</h3>
                            <button type="button" onClick={() => setSelectedAlertDetail(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}>
                                <X size={15} />
                            </button>
                        </div>
                        <p style={{ fontSize: "0.86rem", color: "#CBD5E1", lineHeight: 1.6, margin: "0 0 1.1rem 0" }}>
                            <strong>{lang === "en" ? "Station" : "Trạm"}:</strong> {selectedAlertDetail.kiosk} ({selectedAlertDetail.location})<br />
                            <strong>{lang === "en" ? "Cause" : "Nguyên nhân"}:</strong> {selectedAlertDetail.cause}<br />
                            <strong>{lang === "en" ? "Action" : "Khuyến nghị"}:</strong> <span style={{ color: "#F5E6AD" }}>{selectedAlertDetail.recommendation}</span>
                        </p>
                        {canOperateAlerts && (
                            <button type="button" onClick={() => handleResolveAlertAndReboot(selectedAlertDetail)} className={styles.primaryGoldBtn} style={{ width: "100%", marginBottom: "0.6rem" }}>
                                <CheckCircle2 size={15} />
                                <span>{lang === "en" ? "Resolve Alert" : "Xác nhận đã xử lý"}</span>
                            </button>
                        )}
                        <button type="button" onClick={() => setSelectedAlertDetail(null)} className={styles.secondaryGoldBtn} style={{ width: "100%" }}>
                            {lang === "en" ? "Close" : "Đóng"}
                        </button>
                    </div>
                </div>
            )}

            {toastBanner && (
                <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: "#181D2C", border: "1px solid #D4AF37", padding: "0.85rem 1.15rem", borderRadius: "12px", color: "#F5E6AD", zIndex: 100002, fontWeight: 600, fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "0.55rem" }}>
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastBanner}</span>
                </div>
            )}
        </div>
    );
}