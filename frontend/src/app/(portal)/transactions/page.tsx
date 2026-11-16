// noinspection SpellCheckingInspection
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    Download,
    RefreshCw,
    CheckCircle2,
    AlertOctagon,
    Clock,
    Eye,
    RotateCcw,
    Zap,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Check,
    Globe,
    X,
    Sparkles,
    Cpu,
    Building2,
    HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./transactions.module.css";

interface MasterCatalogSku {
    slotNumber: number;
    skuCode: string;
    brand: string;
    productName: string;
    sprayPrice: number;
    bottleCapacityMl: number;
    remainingVolumeMl: number;
    kioskCode: string;
    physicalSlotLabel: string;
    location: string;
}

const DEFAULT_34_CATALOG_SKUS: MasterCatalogSku[] = [
    { slotNumber: 1, skuCode: "SKU-ARM-01", brand: "Giorgio Armani", productName: "Acqua Di Gio", sprayPrice: 12000, bottleCapacityMl: 100, remainingVolumeMl: 78.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 01", location: "Saigon Centre Takashimaya Flagship, HCMC" },
    { slotNumber: 2, skuCode: "SKU-ARM-02", brand: "Giorgio Armani", productName: "Acqua Di Gio Profondo", sprayPrice: 14000, bottleCapacityMl: 100, remainingVolumeMl: 64.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 02", location: "Saigon Centre Takashimaya Flagship, HCMC" },
    { slotNumber: 3, skuCode: "SKU-CHA-03", brand: "Chanel", productName: "Bleu de Chanel", sprayPrice: 15000, bottleCapacityMl: 100, remainingVolumeMl: 12.5, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 03", location: "Saigon Centre Takashimaya Flagship, HCMC" },
    { slotNumber: 4, skuCode: "SKU-CHA-04", brand: "Chanel", productName: "Coco Mademoiselle", sprayPrice: 15500, bottleCapacityMl: 100, remainingVolumeMl: 82.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 01", location: "Vincom Center Dong Khoi, HCMC" },
    { slotNumber: 5, skuCode: "SKU-BUR-05", brand: "Burberry", productName: "Burberry Goddess", sprayPrice: 13000, bottleCapacityMl: 100, remainingVolumeMl: 71.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 02", location: "Vincom Center Dong Khoi, HCMC" },
    { slotNumber: 6, skuCode: "SKU-BUR-06", brand: "Burberry", productName: "Burberry Her", sprayPrice: 12500, bottleCapacityMl: 100, remainingVolumeMl: 55.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 01", location: "Lotte Center West Lake Lounge, Hanoi" },
    { slotNumber: 7, skuCode: "SKU-CH-07", brand: "Carolina Herrera", productName: "Carolina Herrera Good Girl", sprayPrice: 13500, bottleCapacityMl: 80, remainingVolumeMl: 54.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 02", location: "Lotte Center West Lake Lounge, Hanoi" },
    { slotNumber: 8, skuCode: "SKU-ARMF-08", brand: "Armaf", productName: "Club de Nuit Intense Man", sprayPrice: 10000, bottleCapacityMl: 105, remainingVolumeMl: 92.0, kioskCode: "KIOSK-DAD-01", physicalSlotLabel: "Slot 01", location: "IndoChina Riverside Mall Lobby, Da Nang" },
    { slotNumber: 9, skuCode: "SKU-CRD-09", brand: "Creed", productName: "Creed Aventus", sprayPrice: 20000, bottleCapacityMl: 100, remainingVolumeMl: 11.5, kioskCode: "demo-device", physicalSlotLabel: "Slot 01", location: "Diamond Plaza Luxury Atrium, HCMC" },
    { slotNumber: 10, skuCode: "SKU-DIO-10", brand: "Dior", productName: "Dior Sauvage", sprayPrice: 14500, bottleCapacityMl: 100, remainingVolumeMl: 84.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 03", location: "Lotte Center West Lake Lounge, Hanoi" },
    { slotNumber: 11, skuCode: "SKU-DIO-11", brand: "Dior", productName: "Miss Dior Blooming Bouquet", sprayPrice: 13500, bottleCapacityMl: 100, remainingVolumeMl: 76.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 04", location: "Saigon Centre Takashimaya Flagship, HCMC" },
    { slotNumber: 12, skuCode: "SKU-JPG-12", brand: "Jean Paul Gaultier", productName: "Jean Paul Gaultier Le Male", sprayPrice: 13000, bottleCapacityMl: 125, remainingVolumeMl: 77.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 03", location: "Vincom Center Dong Khoi, HCMC" },
    { slotNumber: 13, skuCode: "SKU-JPG-13", brand: "Jean Paul Gaultier", productName: "Jean Paul Gaultier Scandal", sprayPrice: 13500, bottleCapacityMl: 80, remainingVolumeMl: 47.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 01", location: "Vincom Center Dong Khoi, HCMC" },
    { slotNumber: 14, skuCode: "SKU-LLB-14", brand: "Le Labo", productName: "Le Labo Another 13", sprayPrice: 18000, bottleCapacityMl: 100, remainingVolumeMl: 13.5, kioskCode: "demo-device", physicalSlotLabel: "Slot 02", location: "Diamond Plaza Luxury Atrium, HCMC" },
    { slotNumber: 15, skuCode: "SKU-LLB-15", brand: "Le Labo", productName: "Le Labo Santal 33", sprayPrice: 18500, bottleCapacityMl: 100, remainingVolumeMl: 73.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 03", location: "Saigon Centre Takashimaya Flagship, HCMC" },
    { slotNumber: 16, skuCode: "SKU-MMG-16", brand: "Maison Margiela", productName: "Replica By the Fireplace", sprayPrice: 14500, bottleCapacityMl: 100, remainingVolumeMl: 80.0, kioskCode: "KIOSK-HN-02", physicalSlotLabel: "Slot 01", location: "Trang Tien Plaza Luxury Wing, Hanoi" },
    { slotNumber: 17, skuCode: "SKU-MMG-17", brand: "Maison Margiela", productName: "Replica Jazz Club", sprayPrice: 14500, bottleCapacityMl: 100, remainingVolumeMl: 67.0, kioskCode: "KIOSK-HN-02", physicalSlotLabel: "Slot 02", location: "Trang Tien Plaza Luxury Wing, Hanoi" },
    { slotNumber: 18, skuCode: "SKU-MCM-18", brand: "MCM Worldwide", productName: "MCM Eau de Parfum", sprayPrice: 12000, bottleCapacityMl: 75, remainingVolumeMl: 66.0, kioskCode: "KIOSK-DAD-01", physicalSlotLabel: "Slot 02", location: "IndoChina Riverside Mall Lobby, Da Nang" },
    { slotNumber: 19, skuCode: "SKU-MFK-19", brand: "Maison Francis Kurkdjian", productName: "MFK Baccarat Rouge 540", sprayPrice: 21000, bottleCapacityMl: 70, remainingVolumeMl: 9.0, kioskCode: "demo-device", physicalSlotLabel: "Slot 04", location: "Diamond Plaza Luxury Atrium, HCMC" },
    { slotNumber: 20, skuCode: "SKU-MTB-20", brand: "Montblanc", productName: "Montblanc Explorer", sprayPrice: 11500, bottleCapacityMl: 100, remainingVolumeMl: 79.0, kioskCode: "KIOSK-SGN-03", physicalSlotLabel: "Slot 01", location: "Crescent Mall Luxury Wing, HCMC" },
    { slotNumber: 21, skuCode: "SKU-MTB-21", brand: "Montblanc", productName: "Montblanc Legend", sprayPrice: 11000, bottleCapacityMl: 100, remainingVolumeMl: 85.0, kioskCode: "KIOSK-SGN-03", physicalSlotLabel: "Slot 02", location: "Crescent Mall Luxury Wing, HCMC" },
    { slotNumber: 22, skuCode: "SKU-NAR-22", brand: "Narciso Rodriguez", productName: "Narciso Rodriguez For Her EDP", sprayPrice: 13000, bottleCapacityMl: 100, remainingVolumeMl: 61.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 04", location: "Lotte Center West Lake Lounge, Hanoi" },
    { slotNumber: 23, skuCode: "SKU-NAR-23", brand: "Narciso Rodriguez", productName: "Narciso Rodriguez Pure Musc", sprayPrice: 13500, bottleCapacityMl: 100, remainingVolumeMl: 74.0, kioskCode: "KIOSK-HN-02", physicalSlotLabel: "Slot 03", location: "Trang Tien Plaza Luxury Wing, Hanoi" },
    { slotNumber: 24, skuCode: "SKU-PRB-24", brand: "Paco Rabanne", productName: "Paco Rabanne 1 Million", sprayPrice: 12500, bottleCapacityMl: 100, remainingVolumeMl: 66.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 04", location: "Vincom Center Dong Khoi, HCMC" },
    { slotNumber: 25, skuCode: "SKU-PRB-25", brand: "Paco Rabanne", productName: "Paco Rabanne Invictus", sprayPrice: 12500, bottleCapacityMl: 100, remainingVolumeMl: 72.0, kioskCode: "KIOSK-DAD-01", physicalSlotLabel: "Slot 03", location: "IndoChina Riverside Mall Lobby, Da Nang" },
    { slotNumber: 26, skuCode: "SKU-PDM-26", brand: "Parfums de Marly", productName: "Parfums de Marly Sedley", sprayPrice: 18500, bottleCapacityMl: 125, remainingVolumeMl: 68.0, kioskCode: "demo-device", physicalSlotLabel: "Slot 03", location: "Diamond Plaza Luxury Atrium, HCMC" },
    { slotNumber: 27, skuCode: "SKU-ROJ-27", brand: "Roja Parfums", productName: "Roja Parfums Elysium", sprayPrice: 22000, bottleCapacityMl: 100, remainingVolumeMl: 11.0, kioskCode: "KIOSK-SGN-03", physicalSlotLabel: "Slot 04", location: "Crescent Mall Luxury Wing, HCMC" },
    { slotNumber: 28, skuCode: "SKU-TF-28", brand: "Tom Ford", productName: "Tom Ford Black Orchid", sprayPrice: 16000, bottleCapacityMl: 100, remainingVolumeMl: 48.0, kioskCode: "KIOSK-HN-02", physicalSlotLabel: "Slot 04", location: "Trang Tien Plaza Luxury Wing, Hanoi" },
    { slotNumber: 29, skuCode: "SKU-VAL-29", brand: "Valentino", productName: "Valentino Born in Roma", sprayPrice: 13000, bottleCapacityMl: 100, remainingVolumeMl: 81.0, kioskCode: "KIOSK-SGN-03", physicalSlotLabel: "Slot 03", location: "Crescent Mall Luxury Wing, HCMC" },
    { slotNumber: 30, skuCode: "SKU-VER-30", brand: "Versace", productName: "Versace Bright Crystal", sprayPrice: 11500, bottleCapacityMl: 90, remainingVolumeMl: 62.0, kioskCode: "KIOSK-004", physicalSlotLabel: "Slot 03", location: "Aeon Mall Tan Phu Celadon, HCMC" },
    { slotNumber: 31, skuCode: "SKU-VER-31", brand: "Versace", productName: "Versace Dylan Blue", sprayPrice: 12000, bottleCapacityMl: 100, remainingVolumeMl: 77.0, kioskCode: "KIOSK-DAD-01", physicalSlotLabel: "Slot 04", location: "IndoChina Riverside Mall Lobby, Da Nang" },
    { slotNumber: 32, skuCode: "SKU-VER-32", brand: "Versace", productName: "Versace Eros", sprayPrice: 12500, bottleCapacityMl: 100, remainingVolumeMl: 83.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 04", location: "Vincom Center Dong Khoi, HCMC" },
    { slotNumber: 33, skuCode: "SKU-YSL-33", brand: "Yves Saint Laurent", productName: "YSL Libre Eau de Parfum", sprayPrice: 14000, bottleCapacityMl: 90, remainingVolumeMl: 14.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 04", location: "Saigon Centre Takashimaya Flagship, HCMC" },
    { slotNumber: 34, skuCode: "SKU-YSL-34", brand: "Yves Saint Laurent", productName: "YSL Y Eau de Parfum", sprayPrice: 14000, bottleCapacityMl: 100, remainingVolumeMl: 63.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 04", location: "Lotte Center West Lake Lounge, Hanoi" },
];

export type TxLifecycleStatus =
    | "DISPENSED"
    | "PAID"
    | "PENDING"
    | "FAILED"
    | "UNCERTAIN"
    | "REFUNDED"
    | "CANCELLED"
    | "EXPIRED";

export interface TransactionLedgerItem {
    id: string;
    dateStr: string;
    timestamp: string;
    kioskCode: string;
    location: string;
    brand: string;
    productName: string;
    slotNumber: number;
    physicalSlotLabel: string;
    priceSnapshot: number;
    recognizedAmount: number;
    paidAmount: number;
    volumeDeductedMl: number;
    paymentMethod: "VietQR" | "MoMo" | "VNPay" | "ZaloPay";
    providerReference: string;
    commandReference: string;
    customerHash: string;
    status: TxLifecycleStatus;
    failureReason: string | null;
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

function formatShortDdMm(ymd: string): string {
    const parts = ymd.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : ymd;
}

function formatFullDisplayDate(ymd: string): string {
    const parts = ymd.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
}

function buildSeedTransactions(catalog: MasterCatalogSku[]): TransactionLedgerItem[] {
    const now = new Date();
    const gateways: TransactionLedgerItem["paymentMethod"][] = ["VietQR", "MoMo", "VNPay", "ZaloPay"];

    return catalog.map((sku, idx) => {
        const dayOffset = idx % 28;
        const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
        const dateStr = toLocalYmd(dt);
        const hour = String(10 + (idx % 12)).padStart(2, "0");
        const min = String(11 + ((idx * 7) % 45)).padStart(2, "0");
        const gw = gateways[idx % gateways.length];
        const txId = `TXN-2026-${String(9100 + idx)}`;

        const status: TxLifecycleStatus =
            idx === 18
                ? "UNCERTAIN"
                : idx === 29
                    ? "FAILED"
                    : "DISPENSED";

        return {
            id: txId,
            dateStr,
            timestamp: `${dateStr} ${hour}:${min}:15`,
            kioskCode: sku.kioskCode,
            location: sku.location,
            brand: sku.brand,
            productName: sku.productName,
            slotNumber: sku.slotNumber,
            physicalSlotLabel: sku.physicalSlotLabel,
            priceSnapshot: sku.sprayPrice,
            recognizedAmount: status === "DISPENSED" ? sku.sprayPrice : 0,
            paidAmount: sku.sprayPrice,
            volumeDeductedMl: status === "DISPENSED" ? 0.12 : 0,
            paymentMethod: gw,
            providerReference: `PAY-${gw.toUpperCase()}-${txId}`,
            commandReference: `CMD-${txId}`,
            customerHash: `CUST-${String(1040 + (idx % 19))}`,
            status,
            failureReason:
                status === "UNCERTAIN"
                    ? "MQTT execution result timeout — awaiting operator reconciliation"
                    : status === "FAILED"
                        ? "Chamber safety interlock blocked actuation — eligible for refund"
                        : null,
        };
    });
}

const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type ViewTabMode = "ALL" | "NEEDS_REVIEW" | "BY_MACHINE" | "BY_BRAND";
type QuickDatePreset = "TODAY" | "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "CUSTOM";

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

function normalizeGateway(raw?: string): TransactionLedgerItem["paymentMethod"] {
    const up = String(raw || "VIETQR").toUpperCase();
    if (up.includes("MOMO")) return "MoMo";
    if (up.includes("VNPAY")) return "VNPay";
    if (up.includes("ZALO")) return "ZaloPay";
    return "VietQR";
}

export default function TransactionsPage() {
    const router = useRouter();
    const filterBarRef = useRef<HTMLDivElement | null>(null);

    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [isViewerReadOnly, setIsViewerReadOnly] = useState<boolean>(false);
    const [actorName, setActorName] = useState<string>("Operations Manager");

    const [catalogSkus, setCatalogSkus] = useState<MasterCatalogSku[]>(DEFAULT_34_CATALOG_SKUS);
    const [transactions, setTransactions] = useState<TransactionLedgerItem[]>(() =>
        buildSeedTransactions(DEFAULT_34_CATALOG_SKUS)
    );

    // LỊCH THỰC TẾ GIỐNG HỆT MÀN 9 REPORTS
    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [brandFilter, setBrandFilter] = useState<string>("ALL");
    const [kioskFilter, setKioskFilter] = useState<string>("ALL");
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
    const [viewTab, setViewTab] = useState<ViewTabMode>("ALL");

    const [openDropdown, setOpenDropdown] = useState<
        "CALENDAR" | "STATUS" | "BRAND" | "KIOSK" | "PAYMENT" | null
    >(null);
    const [selectedTx, setSelectedTx] = useState<TransactionLedgerItem | null>(null);
    const [isNewSprayModalOpen, setIsNewSprayModalOpen] = useState<boolean>(false);
    const [newSpraySlotNum, setNewSpraySlotNum] = useState<number>(9);
    const [newSprayGateway, setNewSprayGateway] = useState<"VietQR" | "MoMo" | "VNPay">("VietQR");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
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

    /* --- HÀM CHỌN LỊCH THỰC TẾ (HÔM NAY, TUẦN NÀY, TUẦN TRƯỚC, THÁNG NÀY, 30 NGÀY QUA) --- */
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

    // Lưới 42 ô ngày của tháng đang mở trên Custom Luxury Dark Calendar Popover
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

    /* --- 1. ĐỒNG BỘ 2 CHIỀU TOÀN DIỆN VỚI MÀN 1, 2, 4, 5, 6, 7, 8, 9 --- */
    const loadAndReconcileTransactions = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                const roleCode = parsedUser.roleCode || parsedUser.role || parsedUser.roles?.[0] || "PSA";
                setActorName(parsedUser.fullName || parsedUser.name || roleCode);
                setIsViewerReadOnly(roleCode === "VW" || roleCode === "VIEWER");
                if (roleCode === "BA" && parsedUser.brandScope) {
                    setBrandFilter(parsedUser.brandScope);
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            // Đọc cấu hình 4 khoang từ MACHINES_STORAGE_KEY
            const machineSlotLookup = new Map<
                string,
                {
                    kioskCode: string;
                    location: string;
                    slotLabel: string;
                    remainingMl: number;
                    pricePerSpray?: number;
                }
            >();
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedFleet = JSON.parse(rawMachines);
                if (Array.isArray(parsedFleet)) {
                    parsedFleet.forEach((fm: any) => {
                        const code = String(fm.code || fm.id || "demo-device");
                        if (Array.isArray(fm.slots)) {
                            fm.slots.forEach((sl: any, sIdx: number) => {
                                const fKey = String(sl.fragranceName || "").trim().toLowerCase();
                                if (fKey) {
                                    machineSlotLookup.set(fKey, {
                                        kioskCode: code,
                                        location: fm.locationName || code,
                                        slotLabel: sl.slotLabel || `Slot 0${sIdx + 1}`,
                                        remainingMl: Number(sl.remainingMl ?? 100),
                                        pricePerSpray: sl.pricePerSpray
                                            ? Number(sl.pricePerSpray)
                                            : undefined,
                                    });
                                }
                            });
                        }
                    });
                }
            }

            let syncedCatalog: MasterCatalogSku[] = [...DEFAULT_34_CATALOG_SKUS];
            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds) && parsedProds.length > 0) {
                    syncedCatalog = parsedProds.map((p: any, idx: number) => {
                        const pKey = String(p.name || "").trim().toLowerCase();
                        const fromMachine = machineSlotLookup.get(pKey);
                        const primaryAssigned =
                            Array.isArray(p.assignedMachines) && p.assignedMachines.length > 0
                                ? p.assignedMachines[0]
                                : null;
                        const kCode =
                            fromMachine?.kioskCode ||
                            primaryAssigned?.kioskCode ||
                            "demo-device";
                        const kLower = kCode.toLowerCase();
                        const capMl = Number(p.bottleVolumeMl || 100);
                        const matrixMl = perKioskMatrix[kLower]?.[pKey];
                        const remMl =
                            typeof matrixMl === "number"
                                ? matrixMl
                                : typeof fromMachine?.remainingMl === "number"
                                    ? fromMachine.remainingMl
                                    : Number(primaryAssigned?.remainingVolumeMl ?? capMl);

                        return {
                            slotNumber: Number(p.slotNumber || idx + 1),
                            skuCode: p.skuCode || `SKU-NEW-${idx + 1}`,
                            brand: p.brand || "Luxury Maison",
                            productName: p.name || "Signature Scent",
                            sprayPrice: Number(
                                p.pricePerSpray || fromMachine?.pricePerSpray || 15000
                            ),
                            bottleCapacityMl: capMl,
                            remainingVolumeMl: Number(Math.max(0, remMl).toFixed(2)),
                            kioskCode: kCode,
                            physicalSlotLabel:
                                fromMachine?.slotLabel ||
                                primaryAssigned?.physicalSlotLabel ||
                                "Slot 01",
                            location:
                                fromMachine?.location ||
                                primaryAssigned?.location ||
                                "Diamond Plaza Luxury Atrium, HCMC",
                        };
                    });
                }
            } else {
                syncedCatalog = syncedCatalog.map((sku) => {
                    const pKey = sku.productName.trim().toLowerCase();
                    const fromMachine = machineSlotLookup.get(pKey);
                    const kCode = fromMachine?.kioskCode || sku.kioskCode;
                    const kLower = kCode.toLowerCase();
                    const matrixMl = perKioskMatrix[kLower]?.[pKey];
                    const remMl =
                        typeof matrixMl === "number"
                            ? matrixMl
                            : typeof fromMachine?.remainingMl === "number"
                                ? fromMachine.remainingMl
                                : sku.remainingVolumeMl;
                    return {
                        ...sku,
                        kioskCode: kCode,
                        location: fromMachine?.location || sku.location,
                        physicalSlotLabel: fromMachine?.slotLabel || sku.physicalSlotLabel,
                        sprayPrice: fromMachine?.pricePerSpray || sku.sprayPrice,
                        remainingVolumeMl: Number(Math.max(0, remMl).toFixed(2)),
                    };
                });
            }
            setCatalogSkus(syncedCatalog);

            const seedList = buildSeedTransactions(syncedCatalog);
            let mergedTxs: TransactionLedgerItem[] = [...seedList];

            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            if (rawDash) {
                const parsedDash = JSON.parse(rawDash);
                if (Array.isArray(parsedDash.transactions) && parsedDash.transactions.length > 0) {
                    const nowObj = new Date();
                    const todayStr = toLocalYmd(nowObj);

                    // Chỉ nhận các đơn chuẩn (TXN-2026-9100..9133 hoặc các đơn thật ORD-2026-...) để lọc bỏ rác cũ TXN-2026-880
                    const cleanRawList = parsedDash.transactions.filter((tx: any) => {
                        const idStr = String(tx?.id || "");
                        return (
                            idStr.startsWith("ORD-2026-") ||
                            (idStr.startsWith("TXN-2026-91") && idStr.length === 13)
                        );
                    });

                    const liveMapped: TransactionLedgerItem[] = cleanRawList.map(
                        (tx: any, idx: number) => {
                            const txId = String(tx.id);
                            const rawStatus = String(tx.status || "DISPENSED").toUpperCase() as TxLifecycleStatus;
                            const prodName = tx.product || tx.productName || "Creed Aventus";
                            const matchedSku =
                                syncedCatalog.find((s) =>
                                    isExactMatch(s.productName, prodName)
                                ) || syncedCatalog[0];

                            const isSeedTx = txId.startsWith("TXN-2026-91");
                            let datePart = todayStr;
                            let timePart = "14:25:10";

                            if (isSeedTx) {
                                const seedIdx = Math.max(
                                    0,
                                    parseInt(txId.replace("TXN-2026-91", ""), 10) || idx
                                );
                                const dOffset = seedIdx % 28;
                                const seedDate = new Date(
                                    nowObj.getFullYear(),
                                    nowObj.getMonth(),
                                    nowObj.getDate() - dOffset
                                );
                                datePart = toLocalYmd(seedDate);
                                timePart = `${String(10 + (seedIdx % 11)).padStart(2, "0")}:${String(
                                    12 + ((seedIdx * 5) % 45)
                                ).padStart(2, "0")}:15`;
                            } else {
                                const createdIso = tx.createdAt || tx.executedAt || "";
                                if (createdIso && createdIso.includes("T")) {
                                    datePart = createdIso.split("T")[0];
                                    timePart = createdIso.split("T")[1].slice(0, 8);
                                }
                            }

                            const isDispensed =
                                rawStatus === "DISPENSED" || rawStatus === "PAID";
                            const priceSnap = Number(
                                tx.priceSnapshot ??
                                tx.amount ??
                                tx.paidAmount ??
                                matchedSku.sprayPrice
                            );
                            const gw = normalizeGateway(tx.paymentMethod);

                            return {
                                id: txId,
                                dateStr: datePart,
                                timestamp: `${datePart} ${timePart}`,
                                kioskCode: tx.kiosk || tx.kioskCode || matchedSku.kioskCode,
                                location: tx.location || matchedSku.location,
                                brand: tx.brand || matchedSku.brand,
                                productName: prodName,
                                slotNumber: Number(tx.slotNumber || matchedSku.slotNumber || 1),
                                physicalSlotLabel:
                                    matchedSku.physicalSlotLabel ||
                                    `Slot 0${((Number(tx.slotNumber || 1) - 1) % 4) + 1}`,
                                priceSnapshot: priceSnap,
                                recognizedAmount: isDispensed ? priceSnap : 0,
                                paidAmount:
                                    rawStatus === "CANCELLED" || rawStatus === "EXPIRED"
                                        ? 0
                                        : priceSnap,
                                volumeDeductedMl: rawStatus === "DISPENSED" ? 0.12 : 0,
                                paymentMethod: gw,
                                providerReference:
                                    tx.providerReference || `PAY-${gw.toUpperCase()}-${txId}`,
                                commandReference: tx.commandReference || `CMD-${txId}`,
                                customerHash: `CUST-${String(
                                    1010 + ((idx + prodName.length) % 35)
                                )}`,
                                status: rawStatus,
                                failureReason: tx.failureReason || null,
                            };
                        }
                    );

                    const seenIds = new Set<string>();
                    const deduplicated: TransactionLedgerItem[] = [];
                    [...liveMapped, ...seedList].forEach((item) => {
                        if (!seenIds.has(item.id)) {
                            seenIds.add(item.id);
                            deduplicated.push(item);
                        }
                    });
                    mergedTxs = deduplicated;
                }
            }
            setTransactions(mergedTxs);
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadAndReconcileTransactions();

        const handleCrossTabSync = () => {
            loadAndReconcileTransactions();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileTransactions();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileTransactions]);

    /* --- 2. TẠO ĐƠN HÀNG & XỊT THỬ (-0.12ML) TỪ MÀN 10 ĐỒNG BỘ NGƯỢC VỀ 9 MÀN KIA --- */
    const handleCreateLiveSprayOrderFromTransactions = useCallback(() => {
        if (isViewerReadOnly) return;
        const chosenSku =
            catalogSkus.find((s) => s.slotNumber === newSpraySlotNum) || catalogSkus[0];
        if (!chosenSku) return;

        if (chosenSku.remainingVolumeMl < 0.12) {
            showToast(
                lang === "en"
                    ? `Cartridge ${chosenSku.productName} on ${chosenSku.kioskCode} is depleted (0ml)!`
                    : `Bình ${chosenSku.productName} tại trạm ${chosenSku.kioskCode} đã cạn (0ml)!`
            );
            return;
        }

        const kKey = chosenSku.kioskCode.toLowerCase();
        const pKey = chosenSku.productName.trim().toLowerCase();
        const qtyBefore = chosenSku.remainingVolumeMl;
        const qtyAfter = Number(Math.max(0, qtyBefore - 0.12).toFixed(2));
        const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
        const nowIso = new Date().toISOString();

        try {
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};
            if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
            perKioskMatrix[kKey][pKey] = qtyAfter;
            localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

            const rawFleet = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawFleet) {
                const parsedFleet = JSON.parse(rawFleet);
                if (Array.isArray(parsedFleet)) {
                    const updatedFleet = parsedFleet.map((fm: any) => {
                        if (String(fm.code || fm.id || "").toLowerCase() !== kKey) {
                            return fm;
                        }
                        return {
                            ...fm,
                            todaySprays: (fm.todaySprays || 0) + 1,
                            todayRevenue: (fm.todayRevenue || 0) + chosenSku.sprayPrice,
                            slots: Array.isArray(fm.slots)
                                ? fm.slots.map((sl: any) =>
                                    isExactMatch(
                                        sl.fragranceName || "",
                                        chosenSku.productName
                                    )
                                        ? { ...sl, remainingMl: qtyAfter }
                                        : sl
                                )
                                : fm.slots,
                        };
                    });
                    localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
                }
            }

            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds)) {
                    const updatedProds = parsedProds.map((p: any) => {
                        if (!isExactMatch(p.name || "", chosenSku.productName)) return p;
                        const nextExtra = Number(p.liveExtraSprays || 0) + 1;
                        const base30d = Number(p.baseSessions30d || 300);
                        return {
                            ...p,
                            liveExtraSprays: nextExtra,
                            samplingSessions30d: base30d + nextExtra,
                            assignedMachines: Array.isArray(p.assignedMachines)
                                ? p.assignedMachines.map((am: any) =>
                                    String(am.kioskCode || "").toLowerCase() === kKey
                                        ? { ...am, remainingVolumeMl: qtyAfter }
                                        : am
                                )
                                : p.assignedMachines,
                        };
                    });
                    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProds));
                }
            }

            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            const dashData = rawDash
                ? JSON.parse(rawDash)
                : { transactions: [], incidents: [], alerts: [] };
            if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
            dashData.transactions.unshift({
                id: newOrderId,
                time: `Completed (${chosenSku.kioskCode})`,
                kiosk: chosenSku.kioskCode,
                location: chosenSku.location,
                slotNumber: chosenSku.slotNumber,
                brand: chosenSku.brand,
                product: chosenSku.productName,
                priceSnapshot: chosenSku.sprayPrice,
                amount: chosenSku.sprayPrice,
                paidAmount: chosenSku.sprayPrice,
                paymentMethod: newSprayGateway.toUpperCase(),
                providerReference: `PAY-${newSprayGateway.toUpperCase()}-${newOrderId}`,
                status: "DISPENSED",
                commandReference: `CMD-${newOrderId}`,
                ackedAt: nowIso,
                executedAt: nowIso,
                createdAt: nowIso,
                dateType: "TODAY",
            });
            localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));

            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("scentstation-sync"));
            }
            loadAndReconcileTransactions();
            setIsNewSprayModalOpen(false);
            showToast(
                lang === "en"
                    ? `Dispatched Order ${newOrderId}: ${chosenSku.productName} on ${chosenSku.kioskCode} (${qtyBefore}ml → ${qtyAfter}ml, +${chosenSku.sprayPrice.toLocaleString("vi-VN")} VND) synced across all 10 screens!`
                    : `Đã tạo đơn ${newOrderId}: ${chosenSku.productName} trên ${chosenSku.kioskCode} (${qtyBefore}ml → ${qtyAfter}ml, +${chosenSku.sprayPrice.toLocaleString("vi-VN")}đ) đồng bộ cả 10 màn hình!`
            );
        } catch {
            // Safe fallback
        }
    }, [
        catalogSkus,
        isViewerReadOnly,
        lang,
        loadAndReconcileTransactions,
        newSprayGateway,
        newSpraySlotNum,
        showToast,
    ]);

    /* --- 3. ĐỐI SOÁT ĐƠN HÀNG (UC-16 / FR3.13 / FR9.5): HOÀN TIỀN HOẶC XÁC NHẬN ĐÃ PHUN (-0.12ML) ĐỒNG BỘ 10 MÀN --- */
    const handleReconcileTransaction = useCallback(
        (targetTx: TransactionLedgerItem, resolution: "CONFIRM_DISPENSED" | "ISSUE_REFUND") => {
            if (isViewerReadOnly) return;

            const nextStatus: TxLifecycleStatus =
                resolution === "CONFIRM_DISPENSED" ? "DISPENSED" : "REFUNDED";
            const nowIso = new Date().toISOString();

            const updatedList = transactions.map((t) =>
                t.id === targetTx.id
                    ? {
                        ...t,
                        status: nextStatus,
                        recognizedAmount:
                            nextStatus === "DISPENSED" ? t.priceSnapshot : 0,
                        volumeDeductedMl: nextStatus === "DISPENSED" ? 0.12 : 0,
                        failureReason:
                            nextStatus === "REFUNDED"
                                ? `Refunded by ${actorName}`
                                : null,
                    }
                    : t
            );
            setTransactions(updatedList);
            if (selectedTx?.id === targetTx.id) {
                setSelectedTx({
                    ...targetTx,
                    status: nextStatus,
                    recognizedAmount:
                        nextStatus === "DISPENSED" ? targetTx.priceSnapshot : 0,
                    volumeDeductedMl: nextStatus === "DISPENSED" ? 0.12 : 0,
                });
            }

            try {
                const kKey = targetTx.kioskCode.toLowerCase();
                const pKey = targetTx.productName.trim().toLowerCase();

                if (resolution === "CONFIRM_DISPENSED") {
                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                        ? JSON.parse(rawMatrix)
                        : {};
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    const currentMl = Number(perKioskMatrix[kKey][pKey] ?? 75);
                    const nextMl = Number(Math.max(0, currentMl - 0.12).toFixed(2));
                    perKioskMatrix[kKey][pKey] = nextMl;
                    localStorage.setItem(
                        KIOSK_PER_UNIT_STOCK_KEY,
                        JSON.stringify(perKioskMatrix)
                    );

                    const rawFleet = localStorage.getItem(MACHINES_STORAGE_KEY);
                    if (rawFleet) {
                        const parsedFleet = JSON.parse(rawFleet);
                        if (Array.isArray(parsedFleet)) {
                            const updatedFleet = parsedFleet.map((fm: any) => {
                                if (String(fm.code || fm.id || "").toLowerCase() !== kKey) {
                                    return fm;
                                }
                                return {
                                    ...fm,
                                    todaySprays: (fm.todaySprays || 0) + 1,
                                    todayRevenue:
                                        (fm.todayRevenue || 0) + targetTx.priceSnapshot,
                                    slots: Array.isArray(fm.slots)
                                        ? fm.slots.map((sl: any) =>
                                            isExactMatch(
                                                sl.fragranceName || "",
                                                targetTx.productName
                                            )
                                                ? { ...sl, remainingMl: nextMl }
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
                                if (!isExactMatch(p.name || "", targetTx.productName)) {
                                    return p;
                                }
                                const nextExtra = Number(p.liveExtraSprays || 0) + 1;
                                const base30d = Number(p.baseSessions30d || 300);
                                return {
                                    ...p,
                                    liveExtraSprays: nextExtra,
                                    samplingSessions30d: base30d + nextExtra,
                                    assignedMachines: Array.isArray(p.assignedMachines)
                                        ? p.assignedMachines.map((am: any) =>
                                            String(am.kioskCode || "").toLowerCase() === kKey
                                                ? { ...am, remainingVolumeMl: nextMl }
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
                    movList.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: targetTx.id,
                        kioskCode: targetTx.kioskCode,
                        slotNumber: targetTx.slotNumber,
                        brand: targetTx.brand,
                        productName: targetTx.productName,
                        movementType: "SALE",
                        quantityBeforeMl: currentMl,
                        quantityAfterMl: nextMl,
                        deltaMl: -0.12,
                        reason: `Reconciled order ${targetTx.id} as DISPENSED`,
                        timestamp: nowIso,
                    });
                    localStorage.setItem(
                        INVENTORY_MOVEMENTS_KEY,
                        JSON.stringify(movList.slice(0, 300))
                    );
                }

                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                const dashData = rawDash
                    ? JSON.parse(rawDash)
                    : { transactions: [], incidents: [], alerts: [] };
                if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                if (!Array.isArray(dashData.incidents)) dashData.incidents = [];

                const existingIdx = dashData.transactions.findIndex(
                    (tx: any) => String(tx.id) === targetTx.id
                );
                const updatedTxRecord = {
                    id: targetTx.id,
                    time: `Reconciled (${nextStatus})`,
                    kiosk: targetTx.kioskCode,
                    location: targetTx.location,
                    slotNumber: targetTx.slotNumber,
                    brand: targetTx.brand,
                    product: targetTx.productName,
                    priceSnapshot: targetTx.priceSnapshot,
                    amount: nextStatus === "DISPENSED" ? targetTx.priceSnapshot : 0,
                    paidAmount: targetTx.priceSnapshot,
                    paymentMethod: targetTx.paymentMethod,
                    providerReference: targetTx.providerReference,
                    status: nextStatus,
                    commandReference: targetTx.commandReference,
                    requiresHumanReview: false,
                    updatedAt: nowIso,
                };

                if (existingIdx >= 0) {
                    dashData.transactions[existingIdx] = {
                        ...dashData.transactions[existingIdx],
                        ...updatedTxRecord,
                    };
                } else {
                    dashData.transactions.unshift({
                        ...updatedTxRecord,
                        createdAt: nowIso,
                    });
                }

                dashData.incidents = dashData.incidents.map((inc: any) =>
                    inc.orderId === targetTx.id
                        ? { ...inc, status: "RESOLVED", orderState: nextStatus }
                        : inc
                );
                localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));

                const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                auditList.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: nowIso,
                    actor: actorName,
                    role: "OM",
                    tenant: targetTx.brand,
                    action:
                        nextStatus === "DISPENSED"
                            ? "TRANSACTION_RECONCILED_DISPENSED"
                            : "TRANSACTION_REFUND_ISSUED",
                    entityType: "ORDERS",
                    entityId: targetTx.id,
                    severity: "INFO",
                    oldValues: { status: targetTx.status },
                    newValues: {
                        status: nextStatus,
                        recognizedAmount:
                            nextStatus === "DISPENSED" ? targetTx.priceSnapshot : 0,
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

                showToast(
                    nextStatus === "DISPENSED"
                        ? lang === "en"
                            ? `Reconciled Order ${targetTx.id} as DISPENSED (-0.12ml deducted on ${targetTx.kioskCode} & +${targetTx.priceSnapshot.toLocaleString("vi-VN")} VND recognized across all 10 screens)!`
                            : `Đã đối soát xác nhận đơn ${targetTx.id} hoàn tất phun (-0.12ml tại ${targetTx.kioskCode} & cộng +${targetTx.priceSnapshot.toLocaleString("vi-VN")}đ đồng bộ 10 màn hình)!`
                        : lang === "en"
                            ? `Issued full refund (${targetTx.priceSnapshot.toLocaleString("vi-VN")} VND) for Order ${targetTx.id} and updated all screens!`
                            : `Đã hoàn tiền (${targetTx.priceSnapshot.toLocaleString("vi-VN")}đ) cho đơn ${targetTx.id} và đồng bộ toàn hệ thống!`
                );
            } catch {
                // Safe fallback
            }
        },
        [actorName, isViewerReadOnly, lang, selectedTx, showToast, transactions]
    );

    const uniqueBrands = useMemo(
        () => Array.from(new Set(catalogSkus.map((s) => s.brand))).sort(),
        [catalogSkus]
    );
    const uniqueKiosks = useMemo(
        () => Array.from(new Set(catalogSkus.map((s) => s.kioskCode))).sort(),
        [catalogSkus]
    );

    const filteredTransactions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return transactions.filter((tx) => {
            const matchDate = tx.dateStr >= startDate && tx.dateStr <= endDate;
            const matchStatus =
                statusFilter === "ALL" || tx.status === statusFilter;
            const matchTab =
                viewTab !== "NEEDS_REVIEW" ||
                tx.status === "UNCERTAIN" ||
                tx.status === "FAILED" ||
                tx.status === "PENDING";
            const matchBrand =
                brandFilter === "ALL" || isExactMatch(tx.brand, brandFilter);
            const matchKiosk =
                kioskFilter === "ALL" || isExactMatch(tx.kioskCode, kioskFilter);
            const matchPayment =
                paymentFilter === "ALL" || tx.paymentMethod === paymentFilter;
            const matchSearch =
                !q ||
                tx.id.toLowerCase().includes(q) ||
                tx.productName.toLowerCase().includes(q) ||
                tx.brand.toLowerCase().includes(q) ||
                tx.kioskCode.toLowerCase().includes(q) ||
                tx.providerReference.toLowerCase().includes(q);

            return (
                matchDate &&
                matchStatus &&
                matchTab &&
                matchBrand &&
                matchKiosk &&
                matchPayment &&
                matchSearch
            );
        });
    }, [
        transactions,
        startDate,
        endDate,
        statusFilter,
        viewTab,
        brandFilter,
        kioskFilter,
        paymentFilter,
        searchQuery,
    ]);

    const summaryMetrics = useMemo(() => {
        const dispensed = filteredTransactions.filter(
            (t) => t.status === "DISPENSED" || t.status === "PAID"
        );
        const totalRevenue = dispensed.reduce((s, t) => s + t.recognizedAmount, 0);
        const uniqueCustomers = new Set(
            filteredTransactions.map((t) => t.customerHash)
        ).size;
        const reviewCount = filteredTransactions.filter(
            (t) =>
                t.status === "UNCERTAIN" ||
                t.status === "FAILED" ||
                t.status === "PENDING"
        ).length;

        const prodMap = new Map<string, { name: string; count: number; rev: number }>();
        dispensed.forEach((t) => {
            const cur = prodMap.get(t.productName) || {
                name: t.productName,
                count: 0,
                rev: 0,
            };
            cur.count += 1;
            cur.rev += t.recognizedAmount;
            prodMap.set(t.productName, cur);
        });
        const topProd = Array.from(prodMap.values()).sort((a, b) => b.rev - a.rev)[0];

        return {
            totalTransactions: filteredTransactions.length,
            dispensedCount: dispensed.length,
            totalRevenue,
            uniqueCustomers,
            reviewCount,
            topProduct: topProd?.name || "MFK Baccarat Rouge 540",
            topProductSprays: topProd?.count || 0,
        };
    }, [filteredTransactions]);

    const topProductsAndMachines = useMemo(() => {
        const pMap = new Map<string, { name: string; brand: string; rev: number; sp: number }>();
        const mMap = new Map<string, { kiosk: string; location: string; rev: number; sp: number }>();

        filteredTransactions
            .filter((t) => t.status === "DISPENSED" || t.status === "PAID")
            .forEach((t) => {
                const pCur = pMap.get(t.productName) || {
                    name: t.productName,
                    brand: t.brand,
                    rev: 0,
                    sp: 0,
                };
                pCur.rev += t.recognizedAmount;
                pCur.sp += 1;
                pMap.set(t.productName, pCur);

                const mCur = mMap.get(t.kioskCode) || {
                    kiosk: t.kioskCode,
                    location: t.location,
                    rev: 0,
                    sp: 0,
                };
                mCur.rev += t.recognizedAmount;
                mCur.sp += 1;
                mMap.set(t.kioskCode, mCur);
            });

        return {
            topProducts: Array.from(pMap.values())
                .sort((a, b) => b.rev - a.rev)
                .slice(0, 5),
            topMachines: Array.from(mMap.values())
                .sort((a, b) => b.rev - a.rev)
                .slice(0, 5),
        };
    }, [filteredTransactions]);

    const handleResetFilters = () => {
        setStartDate(defaultStart30d);
        setEndDate(todayYmd);
        setDatePreset("LAST_30_DAYS");
        setSearchQuery("");
        setStatusFilter("ALL");
        setBrandFilter("ALL");
        setKioskFilter("ALL");
        setPaymentFilter("ALL");
        setViewTab("ALL");
        setOpenDropdown(null);
    };

    const handleExportCSV = () => {
        const header =
            "Transaction ID;Timestamp;Station Code;Chamber;Maison;Fragrance;Payment Gateway;Provider Reference;Price Snapshot (VND);Recognized Revenue (VND);Status\n";
        const rows = filteredTransactions
            .map(
                (t) =>
                    `"${t.id}";"${t.timestamp}";"${t.kioskCode}";"${t.physicalSlotLabel}";"${t.brand}";"${t.productName}";"${t.paymentMethod}";"${t.providerReference}";"${t.priceSnapshot}";"${t.recognizedAmount}";"${t.status}"`
            )
            .join("\n");

        const blob = new Blob(["\ufeff" + header + rows], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "ScentStation_Transactions_Ledger.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(
            lang === "en"
                ? `Exported ${filteredTransactions.length} transaction records to CSV!`
                : `Đã xuất ${filteredTransactions.length} bản ghi giao dịch ra file CSV!`
        );
    };

    const renderStatusBadge = (st: TxLifecycleStatus) => {
        if (st === "DISPENSED" || st === "PAID") {
            return (
                <span className={styles.badgeSuccess}>
                    <CheckCircle2 size={12} />
                    <span>{st}</span>
                </span>
            );
        }
        if (st === "PENDING" || st === "UNCERTAIN" || st === "REFUNDED") {
            return (
                <span className={styles.badgeWarning}>
                    <Clock size={12} />
                    <span>{st}</span>
                </span>
            );
        }
        return (
            <span className={styles.badgeFailed}>
                <AlertOctagon size={12} />
                <span>{st}</span>
            </span>
        );
    };

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => setOpenDropdown(null)}
        >
            {/* LUXURY HERO BANNER CARD */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? "FINANCIAL LEDGER & QR PAYMENT RECONCILIATION"
                                : "SỔ CÁI GIAO DỊCH & ĐỐI SOÁT THANH TOÁN QR THỜI GIAN THỰC"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Transactions & Order Reconciliation"
                                : "Quản Trị Giao Dịch & Đối Soát Đơn Hàng"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? `Real-time payment verification, immutable price snapshots, and operational anomaly reconciliation across ${uniqueBrands.length} luxury partner maisons.`
                                : `Xác thực thanh toán QR thời gian thực, khóa giá tại thời điểm tạo đơn và đối soát hoàn tiền tự động trên ${uniqueBrands.length} thương hiệu đối tác.`}
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

                        {!isViewerReadOnly && (
                            <button
                                type="button"
                                onClick={() => setIsNewSprayModalOpen(true)}
                                className={styles.secondaryGoldBtn}
                                style={{
                                    borderColor: "rgba(52,211,153,0.45)",
                                    color: "#34D399",
                                }}
                            >
                                <Zap size={14} color="#34D399" />
                                <span>
                                    {lang === "en"
                                        ? "+1 Live Order & Spray"
                                        : "+1 Tạo Đơn & Xịt Thử"}
                                </span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className={styles.primaryGoldBtn}
                        >
                            <Download size={15} />
                            <span>
                                {lang === "en" ? "Export Ledger CSV" : "Xuất Sổ Cái CSV"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* 4 KPI SUMMARY CARDS */}
                <div className={styles.kpiGrid4}>
                    <div
                        className={`${styles.kpiCard} ${
                            viewTab === "ALL" && statusFilter === "ALL"
                                ? styles.kpiCardActive
                                : ""
                        }`}
                        onClick={() => {
                            setViewTab("ALL");
                            setStatusFilter("ALL");
                        }}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "TOTAL TRANSACTIONS" : "TỔNG SỐ GIAO DỊCH"}
                        </div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#FFFFFF", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {summaryMetrics.totalTransactions} Orders
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399", fontWeight: 600 }}>
                            {summaryMetrics.dispensedCount} dispensed • {summaryMetrics.reviewCount} pending review
                        </div>
                    </div>

                    <div
                        className={`${styles.kpiCard} ${
                            statusFilter === "DISPENSED" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() => {
                            setViewTab("ALL");
                            setStatusFilter(
                                statusFilter === "DISPENSED" ? "ALL" : "DISPENSED"
                            );
                        }}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "RECOGNIZED REVENUE" : "DOANH THU THỰC NHẬN"}
                        </div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#F5E6AD", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {summaryMetrics.totalRevenue.toLocaleString("vi-VN")} VND
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {formatShortDdMm(startDate)} – {formatShortDdMm(endDate)}
                        </div>
                    </div>

                    <div
                        className={`${styles.kpiCard} ${
                            viewTab === "NEEDS_REVIEW" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() =>
                            setViewTab(
                                viewTab === "NEEDS_REVIEW" ? "ALL" : "NEEDS_REVIEW"
                            )
                        }
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en"
                                ? "UNIQUE CUSTOMERS & REVIEW QUEUE"
                                : "KHÁCH HÀNG & ĐƠN CẦN ĐỐI SOÁT"}
                        </div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#34D399", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {summaryMetrics.uniqueCustomers} Guests
                        </div>
                        <div style={{ fontSize: "0.72rem", color: summaryMetrics.reviewCount > 0 ? "#FBBF24" : "#94A3B8", fontWeight: 600 }}>
                            {summaryMetrics.reviewCount}{" "}
                            {lang === "en"
                                ? "orders awaiting reconciliation"
                                : "đơn cần nhân viên đối soát"}
                        </div>
                    </div>

                    <div
                        className={styles.kpiCard}
                        onClick={() => setSearchQuery(summaryMetrics.topProduct)}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "TOP PERFORMING PRODUCT" : "SẢN PHẨM GIAO DỊCH ĐẦU BẢNG"}
                        </div>
                        <div
                            style={{
                                fontSize: "1.15rem",
                                fontWeight: 700,
                                color: "#FFFFFF",
                                margin: "0.45rem 0 0.35rem 0",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {summaryMetrics.topProduct}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#F5E6AD", fontFamily: "Space Grotesk, monospace", fontWeight: 700 }}>
                            {summaryMetrics.topProductSprays} verified sprays in period
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER BAR 2 TẦNG CHUẨN — KHÔNG BỊ NHÂN ĐÔI NÚT & KHÔNG TRÀN MÀN HÌNH */}
            <div
                className={styles.filterBar}
                ref={filterBarRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.filterRowTop}>
                    {/* 1. Ô Tìm kiếm */}
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={
                                lang === "en"
                                    ? "Search Transaction ID, station code, fragrance, or provider ref..."
                                    : "Tìm theo mã giao dịch, mã trạm, tên nước hoa hoặc mã tham chiếu..."
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

                    {/* 2. Nút Lịch Thực Tế (Custom Luxury Dark Calendar) */}
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

                    {/* 3. Nút All Statuses (1 nút duy nhất) */}
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
                            <span>
                                {statusFilter === "ALL"
                                    ? lang === "en"
                                        ? "All Statuses"
                                        : "Mọi Trạng Thái"
                                    : statusFilter}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div
                                className={styles.customDropdownMenu}
                                style={{ right: 0, left: "auto" }}
                            >
                                {(
                                    [
                                        "ALL",
                                        "DISPENSED",
                                        "PENDING",
                                        "UNCERTAIN",
                                        "FAILED",
                                        "REFUNDED",
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
                                        <span>
                                            {st === "ALL"
                                                ? lang === "en"
                                                    ? "All Statuses"
                                                    : "Mọi Trạng Thái"
                                                : st}
                                        </span>
                                        {statusFilter === st && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. Nút All Maisons (1 nút duy nhất, căn lề phải chống tràn) */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(openDropdown === "BRAND" ? null : "BRAND")
                            }
                            className={`${styles.customDropdownTrigger} ${
                                brandFilter !== "ALL" ? styles.customDropdownTriggerActive : ""
                            }`}
                        >
                            <span>
                                {brandFilter === "ALL"
                                    ? lang === "en"
                                        ? `All Maisons (${uniqueBrands.length})`
                                        : `Mọi Thương Hiệu (${uniqueBrands.length})`
                                    : brandFilter}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "BRAND" && (
                            <div
                                className={styles.customDropdownMenu}
                                style={{ right: 0, left: "auto" }}
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
                                    <span>
                                        {lang === "en"
                                            ? `All Maisons (${uniqueBrands.length})`
                                            : `Mọi Thương Hiệu (${uniqueBrands.length})`}
                                    </span>
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

                    {/* 5. Nút All Stations (1 nút duy nhất, căn lề phải chống tràn) */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(openDropdown === "KIOSK" ? null : "KIOSK")
                            }
                            className={`${styles.customDropdownTrigger} ${
                                kioskFilter !== "ALL" ? styles.customDropdownTriggerActive : ""
                            }`}
                        >
                            <span>
                                {kioskFilter === "ALL"
                                    ? lang === "en"
                                        ? `All Stations (${uniqueKiosks.length})`
                                        : `Mọi Trạm Kiosk (${uniqueKiosks.length})`
                                    : kioskFilter}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "KIOSK" && (
                            <div
                                className={styles.customDropdownMenu}
                                style={{ right: 0, left: "auto" }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKioskFilter("ALL");
                                        setOpenDropdown(null);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        kioskFilter === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>
                                        {lang === "en"
                                            ? `All Stations (${uniqueKiosks.length})`
                                            : `Mọi Trạm Kiosk (${uniqueKiosks.length})`}
                                    </span>
                                    {kioskFilter === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {uniqueKiosks.map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => {
                                            setKioskFilter(k);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            kioskFilter === k
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{k}</span>
                                        {kioskFilter === k && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Dòng dưới: Chọn nhanh Lịch + Cổng QR + Nút Reset */}
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

                    <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                        <div className={styles.customDropdownWrap}>
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(
                                        openDropdown === "PAYMENT" ? null : "PAYMENT"
                                    )
                                }
                                className={`${styles.customDropdownTrigger} ${
                                    paymentFilter !== "ALL"
                                        ? styles.customDropdownTriggerActive
                                        : ""
                                }`}
                            >
                                <span>
                                    {paymentFilter === "ALL"
                                        ? lang === "en"
                                            ? "All Gateways"
                                            : "Mọi Cổng QR"
                                        : paymentFilter}
                                </span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "PAYMENT" && (
                                <div
                                    className={styles.customDropdownMenu}
                                    style={{ right: 0, left: "auto", minWidth: "180px" }}
                                >
                                    {(["ALL", "VietQR", "MoMo", "VNPay", "ZaloPay"] as const).map(
                                        (pm) => (
                                            <button
                                                key={pm}
                                                type="button"
                                                onClick={() => {
                                                    setPaymentFilter(pm);
                                                    setOpenDropdown(null);
                                                }}
                                                className={`${styles.customDropdownItem} ${
                                                    paymentFilter === pm
                                                        ? styles.customDropdownItemActive
                                                        : ""
                                                }`}
                                            >
                                                <span>
                                                    {pm === "ALL"
                                                        ? lang === "en"
                                                            ? "All Gateways"
                                                            : "Mọi Cổng QR"
                                                        : pm}
                                                </span>
                                                {paymentFilter === pm && (
                                                    <Check size={13} color="#D4AF37" />
                                                )}
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

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

            {/* TOP PRODUCTS & TOP MACHINES */}
            <div className={styles.analyticsGrid2}>
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.8rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? "Top Products by Transaction Volume"
                                    : "Sản Phẩm Có Lượng Giao Dịch Cao Nhất"}
                            </h3>
                            <span style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Select a fragrance below to filter the transaction table"
                                    : "Chạm vào một mùi hương để lọc bảng giao dịch"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/products")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.72rem" }}
                        >
                            <span>{lang === "en" ? "Open Catalog" : "Mở Danh Mục"}</span>
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {topProductsAndMachines.topProducts.map((p, i) => (
                            <div
                                key={p.name}
                                onClick={() =>
                                    setSearchQuery(searchQuery === p.name ? "" : p.name)
                                }
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.55rem 0.8rem",
                                    borderRadius: "10px",
                                    background:
                                        searchQuery === p.name
                                            ? "rgba(212,175,55,0.16)"
                                            : "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    cursor: "pointer",
                                }}
                            >
                                <div>
                                    <strong style={{ color: "#FFF", fontSize: "0.82rem" }}>
                                        #{i + 1} {p.name}
                                    </strong>
                                    <span
                                        style={{
                                            fontSize: "0.72rem",
                                            color: "#D4AF37",
                                            marginLeft: "8px",
                                        }}
                                    >
                                        ({p.brand})
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontFamily: "Space Grotesk, monospace",
                                        fontSize: "0.78rem",
                                        color: "#F5E6AD",
                                        fontWeight: 700,
                                    }}
                                >
                                    {p.rev.toLocaleString("vi-VN")} VND ({p.sp} txns)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.8rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? "Top Stations by Transaction Volume"
                                    : "Trạm Kiosk Có Lượng Giao Dịch Cao Nhất"}
                            </h3>
                            <span style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Select a station code to filter transactions"
                                    : "Chạm vào mã trạm để lọc danh sách giao dịch"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/machines")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.72rem" }}
                        >
                            <span>{lang === "en" ? "Open Fleet" : "Mở Đội Máy"}</span>
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {topProductsAndMachines.topMachines.map((m, i) => (
                            <div
                                key={m.kiosk}
                                onClick={() =>
                                    setKioskFilter(
                                        kioskFilter === m.kiosk ? "ALL" : m.kiosk
                                    )
                                }
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.55rem 0.8rem",
                                    borderRadius: "10px",
                                    background:
                                        kioskFilter === m.kiosk
                                            ? "rgba(212,175,55,0.16)"
                                            : "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    cursor: "pointer",
                                }}
                            >
                                <div>
                                    <strong
                                        style={{
                                            color: "#F5E6AD",
                                            fontSize: "0.82rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        #{i + 1} {m.kiosk}
                                    </strong>
                                    <span
                                        style={{
                                            fontSize: "0.72rem",
                                            color: "#94A3B8",
                                            marginLeft: "8px",
                                        }}
                                    >
                                        {m.location}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontFamily: "Space Grotesk, monospace",
                                        fontSize: "0.78rem",
                                        color: "#34D399",
                                        fontWeight: 700,
                                    }}
                                >
                                    {m.rev.toLocaleString("vi-VN")} VND ({m.sp} txns)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TABS PHÂN LOẠI GÓC NHÌN GIAO DỊCH (CÓ KHUNG PILLS TÁCH RỜI SANG TRỌNG) */}
            <div className={styles.viewTabsBar}>
                {(
                    [
                        {
                            id: "ALL",
                            label:
                                lang === "en"
                                    ? `All Transactions (${filteredTransactions.length})`
                                    : `Tất Cả Giao Dịch (${filteredTransactions.length})`,
                            icon: Sparkles,
                        },
                        {
                            id: "NEEDS_REVIEW",
                            label:
                                lang === "en"
                                    ? `Reconciliation Queue (${summaryMetrics.reviewCount})`
                                    : `Hàng Đợi Đối Soát & Hoàn Tiền (${summaryMetrics.reviewCount})`,
                            icon: HelpCircle,
                        },
                        {
                            id: "BY_MACHINE",
                            label: lang === "en" ? "By Station" : "Theo Trạm Kiosk",
                            icon: Cpu,
                        },
                        {
                            id: "BY_BRAND",
                            label: lang === "en" ? "By Maison" : "Theo Thương Hiệu",
                            icon: Building2,
                        },
                    ] as const
                ).map((t) => {
                    const IconComp = t.icon;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setViewTab(t.id as ViewTabMode)}
                            className={`${styles.viewTabBtn} ${
                                viewTab === t.id ? styles.viewTabBtnActive : ""
                            }`}
                        >
                            <IconComp size={14} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* MAIN TRANSACTIONS TABLE */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Date & Time</th>
                            <th>Fragrance & Maison</th>
                            <th>Station & Chamber</th>
                            <th>Gateway & Ref</th>
                            <th style={{ textAlign: "right" }}>Recognized Amount</th>
                            <th style={{ textAlign: "center" }}>Status</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx, idx) => (
                                <tr
                                    key={`${tx.id}-${idx}`}
                                    className={styles.tableRow}
                                    onClick={() => setSelectedTx(tx)}
                                >
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {tx.id}
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#94A3B8",
                                            fontSize: "0.78rem",
                                        }}
                                    >
                                        {tx.timestamp}
                                    </td>
                                    <td className={styles.tableCell}>
                                        <strong style={{ color: "#FFF" }}>
                                            {tx.productName}
                                        </strong>
                                        <div
                                            style={{
                                                fontSize: "0.72rem",
                                                color: "#D4AF37",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {tx.brand}
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <strong
                                            style={{
                                                color: "#FFF",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            {tx.kioskCode} ({tx.physicalSlotLabel})
                                        </strong>
                                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                                            {tx.location}
                                        </div>
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{ fontFamily: "Space Grotesk, monospace" }}
                                    >
                                        <strong style={{ color: "#E2E8F0" }}>
                                            {tx.paymentMethod}
                                        </strong>
                                        <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                                            {tx.providerReference}
                                        </div>
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            textAlign: "right",
                                            fontFamily: "Space Grotesk, monospace",
                                            fontWeight: 700,
                                            color:
                                                tx.status === "DISPENSED" ||
                                                tx.status === "PAID"
                                                    ? "#F5E6AD"
                                                    : "#F87171",
                                        }}
                                    >
                                        {tx.recognizedAmount.toLocaleString("vi-VN")} VND
                                        {tx.status !== "DISPENSED" &&
                                            tx.status !== "PAID" && (
                                                <div
                                                    style={{
                                                        fontSize: "0.68rem",
                                                        color: "#94A3B8",
                                                    }}
                                                >
                                                    Paid: {tx.paidAmount.toLocaleString("vi-VN")}đ
                                                </div>
                                            )}
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{ textAlign: "center" }}
                                    >
                                        {renderStatusBadge(tx.status)}
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{ textAlign: "right", whiteSpace: "nowrap" }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                gap: "0.35rem",
                                                alignItems: "center",
                                            }}
                                        >
                                            {!isViewerReadOnly &&
                                                (tx.status === "UNCERTAIN" ||
                                                    tx.status === "FAILED" ||
                                                    tx.status === "PENDING") && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleReconcileTransaction(
                                                                    tx,
                                                                    "CONFIRM_DISPENSED"
                                                                )
                                                            }
                                                            className={styles.badgeSuccess}
                                                            style={{ cursor: "pointer" }}
                                                            title="Confirm spray happened & deduct -0.12ml"
                                                        >
                                                            <Zap size={11} />
                                                            <span>Verify Spray</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleReconcileTransaction(
                                                                    tx,
                                                                    "ISSUE_REFUND"
                                                                )
                                                            }
                                                            className={styles.badgeWarning}
                                                            style={{ cursor: "pointer" }}
                                                            title="Issue refund to customer"
                                                        >
                                                            <RotateCcw size={11} />
                                                            <span>Refund</span>
                                                        </button>
                                                    </>
                                                )}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTx(tx)}
                                                className={styles.secondaryGoldBtn}
                                                style={{ padding: "0.35rem 0.65rem" }}
                                            >
                                                <Eye size={13} color="#D4AF37" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={8}
                                    style={{
                                        textAlign: "center",
                                        color: "#94A3B8",
                                        padding: "3rem",
                                    }}
                                >
                                    {lang === "en"
                                        ? "No transactions found for the selected calendar range."
                                        : "Không tìm thấy giao dịch nào trong khoảng lịch đã chọn."}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 0: TẠO ĐƠN HÀNG & XỊT THỬ (-0.12ML) TỪ MÀN 10 ĐỒNG BỘ 10 MÀN */}
            {isNewSprayModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsNewSprayModalOpen(false)}
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
                                paddingBottom: "0.75rem",
                                borderBottom: "1px solid rgba(212,175,55,0.25)",
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
                                    DISPATCH LIVE KIOSK ORDER & SPRAY (-0.12ML)
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        fontFamily: "Bodoni Moda, Georgia, serif",
                                        fontSize: "1.35rem",
                                    }}
                                >
                                    {lang === "en"
                                        ? "Select Fragrance & Station to Dispense"
                                        : "Chọn Mùi Hương & Trạm Kiosk Để Tạo Đơn"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsNewSprayModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                                style={{ padding: "0.4rem 0.55rem" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#CBD5E1",
                                    fontWeight: 700,
                                    marginBottom: "0.4rem",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                SELECT INSTALLED FRAGRANCE CARTRIDGE
                            </label>
                            <div
                                style={{
                                    maxHeight: "220px",
                                    overflowY: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.35rem",
                                    paddingRight: "0.25rem",
                                }}
                            >
                                {catalogSkus.map((sku) => {
                                    const active = newSpraySlotNum === sku.slotNumber;
                                    return (
                                        <div
                                            key={sku.slotNumber}
                                            onClick={() => setNewSpraySlotNum(sku.slotNumber)}
                                            style={{
                                                padding: "0.55rem 0.85rem",
                                                borderRadius: "10px",
                                                background: active
                                                    ? "rgba(212,175,55,0.22)"
                                                    : "rgba(255,255,255,0.03)",
                                                border: active
                                                    ? "1px solid #D4AF37"
                                                    : "1px solid rgba(255,255,255,0.08)",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                cursor: "pointer",
                                                fontSize: "0.78rem",
                                            }}
                                        >
                                            <span>
                                                <strong
                                                    style={{
                                                        color: "#F5E6AD",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    [{sku.kioskCode} • {sku.physicalSlotLabel}]
                                                </strong>{" "}
                                                {sku.brand} — <strong>{sku.productName}</strong>
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: "Space Grotesk, monospace",
                                                    color: "#34D399",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {sku.remainingVolumeMl}ml •{" "}
                                                {sku.sprayPrice.toLocaleString("vi-VN")}đ
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ marginBottom: "1.25rem" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#CBD5E1",
                                    fontWeight: 700,
                                    marginBottom: "0.4rem",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                PAYMENT GATEWAY
                            </label>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                {(["VietQR", "MoMo", "VNPay"] as const).map((gw) => (
                                    <button
                                        key={gw}
                                        type="button"
                                        onClick={() => setNewSprayGateway(gw)}
                                        className={
                                            newSprayGateway === gw
                                                ? styles.primaryGoldBtn
                                                : styles.secondaryGoldBtn
                                        }
                                        style={{ flex: 1 }}
                                    >
                                        <span>{gw}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.65rem" }}>
                            <button
                                type="button"
                                onClick={() => setIsNewSprayModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                                style={{ flex: 1 }}
                            >
                                <span>Cancel</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateLiveSprayOrderFromTransactions}
                                className={styles.primaryGoldBtn}
                                style={{ flex: 1.5 }}
                            >
                                <Zap size={14} />
                                <span>Confirm Order & Deduct -0.12ml</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TRANSACTION DETAILS & RECONCILIATION MODAL */}
            {selectedTx && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedTx(null)}
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
                                paddingBottom: "0.75rem",
                                borderBottom: "1px solid rgba(212,175,55,0.25)",
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
                                    END-TO-END ORDER TRACEABILITY • {selectedTx.commandReference}
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        fontFamily: "Bodoni Moda, Georgia, serif",
                                        fontSize: "1.4rem",
                                    }}
                                >
                                    {selectedTx.id}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTx(null)}
                                className={styles.secondaryGoldBtn}
                                style={{ padding: "0.4rem 0.55rem" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.65rem",
                                fontSize: "0.84rem",
                                marginBottom: "1.25rem",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>Execution Status:</span>
                                {renderStatusBadge(selectedTx.status)}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>Maison & Fragrance:</span>
                                <strong>
                                    {selectedTx.brand} — {selectedTx.productName}
                                </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>Station & Chamber:</span>
                                <strong style={{ fontFamily: "Space Grotesk, monospace" }}>
                                    {selectedTx.kioskCode} ({selectedTx.physicalSlotLabel}) —{" "}
                                    {selectedTx.location}
                                </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>Payment Gateway & Ref:</span>
                                <strong style={{ fontFamily: "Space Grotesk, monospace" }}>
                                    {selectedTx.paymentMethod} • {selectedTx.providerReference}
                                </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>Locked Price Snapshot:</span>
                                <strong
                                    style={{
                                        color: "#F5E6AD",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTx.priceSnapshot.toLocaleString("vi-VN")} VND
                                </strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#94A3B8" }}>Recognized Revenue:</span>
                                <strong
                                    style={{
                                        color:
                                            selectedTx.recognizedAmount > 0
                                                ? "#34D399"
                                                : "#F87171",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTx.recognizedAmount.toLocaleString("vi-VN")} VND (
                                    {selectedTx.volumeDeductedMl} ml)
                                </strong>
                            </div>
                            {selectedTx.failureReason && (
                                <div
                                    style={{
                                        padding: "0.75rem",
                                        borderRadius: "10px",
                                        background: "rgba(248,113,113,0.12)",
                                        border: "1px solid rgba(248,113,113,0.4)",
                                        color: "#FCA5A5",
                                        fontSize: "0.78rem",
                                    }}
                                >
                                    <strong>Diagnostic / Reconciliation Note:</strong>{" "}
                                    {selectedTx.failureReason}
                                </div>
                            )}
                        </div>

                        {!isViewerReadOnly &&
                            (selectedTx.status === "UNCERTAIN" ||
                                selectedTx.status === "FAILED" ||
                                selectedTx.status === "PENDING") && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.65rem",
                                        marginBottom: "0.85rem",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleReconcileTransaction(
                                                selectedTx,
                                                "CONFIRM_DISPENSED"
                                            )
                                        }
                                        className={styles.primaryGoldBtn}
                                        style={{ flex: 1 }}
                                    >
                                        <Zap size={14} />
                                        <span>Confirm Dispensed (-0.12ml)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleReconcileTransaction(
                                                selectedTx,
                                                "ISSUE_REFUND"
                                            )
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            flex: 1,
                                            borderColor: "rgba(248,113,113,0.5)",
                                            color: "#F87171",
                                        }}
                                    >
                                        <RotateCcw size={14} />
                                        <span>Issue Full Refund</span>
                                    </button>
                                </div>
                            )}

                        <div style={{ display: "flex", gap: "0.65rem" }}>
                            <button
                                type="button"
                                onClick={() => router.push("/products")}
                                className={styles.secondaryGoldBtn}
                                style={{ flex: 1 }}
                            >
                                <span>View Product</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/machines/${encodeURIComponent(
                                            selectedTx.kioskCode
                                        )}`
                                    )
                                }
                                className={styles.secondaryGoldBtn}
                                style={{ flex: 1 }}
                            >
                                <span>View Station</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTx(null)}
                                className={styles.primaryGoldBtn}
                                style={{ flex: 1 }}
                            >
                                <span>Close</span>
                            </button>
                        </div>
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
                        border: "1px solid rgba(212,175,55,0.6)",
                        borderRadius: "14px",
                        padding: "0.95rem 1.35rem",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.92)",
                        color: "#F5E6AD",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                        zIndex: 99999,
                    }}
                >
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}