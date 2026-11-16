// noinspection SpellCheckingInspection
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Download,
    Search,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Calendar,
    ArrowUpRight,
    BarChart3,
    PieChart,
    MapPin,
    Cpu,
    Sparkles,
    ShieldCheck,
    SlidersHorizontal,
    FileSpreadsheet,
    Clock,
    Globe,
    Zap,
    Droplets,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./reports.module.css";

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
    status: "ACTIVE" | "INACTIVE" | "DRAFT";
}

const DEFAULT_34_CATALOG_SKUS: MasterCatalogSku[] = [
    { slotNumber: 1, skuCode: "SKU-ARM-01", brand: "Giorgio Armani", productName: "Acqua Di Gio", sprayPrice: 12000, bottleCapacityMl: 100, remainingVolumeMl: 78.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 01", location: "Saigon Centre Takashimaya Flagship, HCMC", status: "ACTIVE" },
    { slotNumber: 2, skuCode: "SKU-ARM-02", brand: "Giorgio Armani", productName: "Acqua Di Gio Profondo", sprayPrice: 14000, bottleCapacityMl: 100, remainingVolumeMl: 64.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 02", location: "Saigon Centre Takashimaya Flagship, HCMC", status: "ACTIVE" },
    { slotNumber: 3, skuCode: "SKU-CHA-03", brand: "Chanel", productName: "Bleu de Chanel", sprayPrice: 15000, bottleCapacityMl: 100, remainingVolumeMl: 12.5, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 03", location: "Saigon Centre Takashimaya Flagship, HCMC", status: "ACTIVE" },
    { slotNumber: 4, skuCode: "SKU-CHA-04", brand: "Chanel", productName: "Coco Mademoiselle", sprayPrice: 15500, bottleCapacityMl: 100, remainingVolumeMl: 82.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 01", location: "Vincom Center Dong Khoi, HCMC", status: "ACTIVE" },
    { slotNumber: 5, skuCode: "SKU-BUR-05", brand: "Burberry", productName: "Burberry Goddess", sprayPrice: 13000, bottleCapacityMl: 100, remainingVolumeMl: 71.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 02", location: "Vincom Center Dong Khoi, HCMC", status: "ACTIVE" },
    { slotNumber: 6, skuCode: "SKU-BUR-06", brand: "Burberry", productName: "Burberry Her", sprayPrice: 12500, bottleCapacityMl: 100, remainingVolumeMl: 55.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 01", location: "Lotte Center West Lake Lounge, Hanoi", status: "ACTIVE" },
    { slotNumber: 7, skuCode: "SKU-CH-07", brand: "Carolina Herrera", productName: "Carolina Herrera Good Girl", sprayPrice: 13500, bottleCapacityMl: 80, remainingVolumeMl: 54.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 02", location: "Lotte Center West Lake Lounge, Hanoi", status: "ACTIVE" },
    { slotNumber: 8, skuCode: "SKU-ARMF-08", brand: "Armaf", productName: "Club de Nuit Intense Man", sprayPrice: 10000, bottleCapacityMl: 105, remainingVolumeMl: 92.0, kioskCode: "KIOSK-DAD-01", physicalSlotLabel: "Slot 01", location: "IndoChina Riverside Mall Lobby, Da Nang", status: "ACTIVE" },
    { slotNumber: 9, skuCode: "SKU-CRD-09", brand: "Creed", productName: "Creed Aventus", sprayPrice: 20000, bottleCapacityMl: 100, remainingVolumeMl: 11.5, kioskCode: "demo-device", physicalSlotLabel: "Slot 01", location: "Diamond Plaza Luxury Atrium, HCMC", status: "ACTIVE" },
    { slotNumber: 10, skuCode: "SKU-DIO-10", brand: "Dior", productName: "Dior Sauvage", sprayPrice: 14500, bottleCapacityMl: 100, remainingVolumeMl: 84.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 03", location: "Lotte Center West Lake Lounge, Hanoi", status: "ACTIVE" },
    { slotNumber: 11, skuCode: "SKU-DIO-11", brand: "Dior", productName: "Miss Dior Blooming Bouquet", sprayPrice: 13500, bottleCapacityMl: 100, remainingVolumeMl: 76.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 04", location: "Saigon Centre Takashimaya Flagship, HCMC", status: "ACTIVE" },
    { slotNumber: 12, skuCode: "SKU-JPG-12", brand: "Jean Paul Gaultier", productName: "Jean Paul Gaultier Le Male", sprayPrice: 13000, bottleCapacityMl: 125, remainingVolumeMl: 77.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 03", location: "Vincom Center Dong Khoi, HCMC", status: "ACTIVE" },
    { slotNumber: 13, skuCode: "SKU-JPG-13", brand: "Jean Paul Gaultier", productName: "Jean Paul Gaultier Scandal", sprayPrice: 13500, bottleCapacityMl: 80, remainingVolumeMl: 47.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 01", location: "Vincom Center Dong Khoi, HCMC", status: "ACTIVE" },
    { slotNumber: 14, skuCode: "SKU-LLB-14", brand: "Le Labo", productName: "Le Labo Another 13", sprayPrice: 18000, bottleCapacityMl: 100, remainingVolumeMl: 13.5, kioskCode: "demo-device", physicalSlotLabel: "Slot 02", location: "Diamond Plaza Luxury Atrium, HCMC", status: "ACTIVE" },
    { slotNumber: 15, skuCode: "SKU-LLB-15", brand: "Le Labo", productName: "Le Labo Santal 33", sprayPrice: 18500, bottleCapacityMl: 100, remainingVolumeMl: 73.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 03", location: "Saigon Centre Takashimaya Flagship, HCMC", status: "ACTIVE" },
    { slotNumber: 16, skuCode: "SKU-MMG-16", brand: "Maison Margiela", productName: "Replica By the Fireplace", sprayPrice: 14500, bottleCapacityMl: 100, remainingVolumeMl: 80.0, kioskCode: "KIOSK-HN-02", physicalSlotLabel: "Slot 01", location: "Trang Tien Plaza Luxury Wing, Hanoi", status: "ACTIVE" },
    { slotNumber: 17, skuCode: "SKU-MMG-17", brand: "Maison Margiela", productName: "Replica Jazz Club", sprayPrice: 14500, bottleCapacityMl: 100, remainingVolumeMl: 67.0, kioskCode: "KIOSK-HN-02", physicalSlotLabel: "Slot 02", location: "Trang Tien Plaza Luxury Wing, Hanoi", status: "ACTIVE" },
    { slotNumber: 18, skuCode: "SKU-MCM-18", brand: "MCM Worldwide", productName: "MCM Eau de Parfum", sprayPrice: 12000, bottleCapacityMl: 75, remainingVolumeMl: 66.0, kioskCode: "KIOSK-DAD-01", physicalSlotLabel: "Slot 02", location: "IndoChina Riverside Mall Lobby, Da Nang", status: "ACTIVE" },
    { slotNumber: 19, skuCode: "SKU-MFK-19", brand: "Maison Francis Kurkdjian", productName: "MFK Baccarat Rouge 540", sprayPrice: 21000, bottleCapacityMl: 70, remainingVolumeMl: 9.0, kioskCode: "demo-device", physicalSlotLabel: "Slot 04", location: "Diamond Plaza Luxury Atrium, HCMC", status: "ACTIVE" },
    { slotNumber: 20, skuCode: "SKU-MTB-20", brand: "Montblanc", productName: "Montblanc Explorer", sprayPrice: 11500, bottleCapacityMl: 100, remainingVolumeMl: 79.0, kioskCode: "KIOSK-SGN-03", physicalSlotLabel: "Slot 01", location: "Crescent Mall Luxury Wing, HCMC", status: "ACTIVE" },
    { slotNumber: 21, skuCode: "SKU-MTB-21", brand: "Montblanc", productName: "Montblanc Legend", sprayPrice: 11000, bottleCapacityMl: 100, remainingVolumeMl: 85.0, kioskCode: "KIOSK-SGN-03", physicalSlotLabel: "Slot 02", location: "Crescent Mall Luxury Wing, HCMC", status: "ACTIVE" },
    { slotNumber: 22, skuCode: "SKU-NAR-22", brand: "Narciso Rodriguez", productName: "Narciso Rodriguez For Her EDP", sprayPrice: 13000, bottleCapacityMl: 100, remainingVolumeMl: 61.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 04", location: "Lotte Center West Lake Lounge, Hanoi", status: "ACTIVE" },
    { slotNumber: 23, skuCode: "SKU-NAR-23", brand: "Narciso Rodriguez", productName: "Narciso Rodriguez Pure Musc", sprayPrice: 13500, bottleCapacityMl: 100, remainingVolumeMl: 74.0, kioskCode: "KIOSK-HN-02", physicalSlotLabel: "Slot 03", location: "Trang Tien Plaza Luxury Wing, Hanoi", status: "ACTIVE" },
    { slotNumber: 24, skuCode: "SKU-PRB-24", brand: "Paco Rabanne", productName: "Paco Rabanne 1 Million", sprayPrice: 12500, bottleCapacityMl: 100, remainingVolumeMl: 66.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 04", location: "Vincom Center Dong Khoi, HCMC", status: "ACTIVE" },
    { slotNumber: 25, skuCode: "SKU-PRB-25", brand: "Paco Rabanne", productName: "Paco Rabanne Invictus", sprayPrice: 12500, bottleCapacityMl: 100, remainingVolumeMl: 72.0, kioskCode: "KIOSK-DAD-01", physicalSlotLabel: "Slot 03", location: "IndoChina Riverside Mall Lobby, Da Nang", status: "ACTIVE" },
    { slotNumber: 26, skuCode: "SKU-PDM-26", brand: "Parfums de Marly", productName: "Parfums de Marly Sedley", sprayPrice: 18500, bottleCapacityMl: 125, remainingVolumeMl: 68.0, kioskCode: "demo-device", physicalSlotLabel: "Slot 03", location: "Diamond Plaza Luxury Atrium, HCMC", status: "ACTIVE" },
    { slotNumber: 27, skuCode: "SKU-ROJ-27", brand: "Roja Parfums", productName: "Roja Parfums Elysium", sprayPrice: 22000, bottleCapacityMl: 100, remainingVolumeMl: 11.0, kioskCode: "KIOSK-SGN-03", physicalSlotLabel: "Slot 04", location: "Crescent Mall Luxury Wing, HCMC", status: "ACTIVE" },
    { slotNumber: 28, skuCode: "SKU-TF-28", brand: "Tom Ford", productName: "Tom Ford Black Orchid", sprayPrice: 16000, bottleCapacityMl: 100, remainingVolumeMl: 48.0, kioskCode: "KIOSK-HN-02", physicalSlotLabel: "Slot 04", location: "Trang Tien Plaza Luxury Wing, Hanoi", status: "ACTIVE" },
    { slotNumber: 29, skuCode: "SKU-VAL-29", brand: "Valentino", productName: "Valentino Born in Roma", sprayPrice: 13000, bottleCapacityMl: 100, remainingVolumeMl: 81.0, kioskCode: "KIOSK-SGN-03", physicalSlotLabel: "Slot 03", location: "Crescent Mall Luxury Wing, HCMC", status: "ACTIVE" },
    { slotNumber: 30, skuCode: "SKU-VER-30", brand: "Versace", productName: "Versace Bright Crystal", sprayPrice: 11500, bottleCapacityMl: 90, remainingVolumeMl: 62.0, kioskCode: "KIOSK-004", physicalSlotLabel: "Slot 03", location: "Aeon Mall Tan Phu Celadon, HCMC", status: "ACTIVE" },
    { slotNumber: 31, skuCode: "SKU-VER-31", brand: "Versace", productName: "Versace Dylan Blue", sprayPrice: 12000, bottleCapacityMl: 100, remainingVolumeMl: 77.0, kioskCode: "KIOSK-DAD-01", physicalSlotLabel: "Slot 04", location: "IndoChina Riverside Mall Lobby, Da Nang", status: "ACTIVE" },
    { slotNumber: 32, skuCode: "SKU-VER-32", brand: "Versace", productName: "Versace Eros", sprayPrice: 12500, bottleCapacityMl: 100, remainingVolumeMl: 83.0, kioskCode: "KIOSK-SGN-02", physicalSlotLabel: "Slot 04", location: "Vincom Center Dong Khoi, HCMC", status: "ACTIVE" },
    { slotNumber: 33, skuCode: "SKU-YSL-33", brand: "Yves Saint Laurent", productName: "YSL Libre Eau de Parfum", sprayPrice: 14000, bottleCapacityMl: 90, remainingVolumeMl: 14.0, kioskCode: "KIOSK-SGN-01", physicalSlotLabel: "Slot 04", location: "Saigon Centre Takashimaya Flagship, HCMC", status: "ACTIVE" },
    { slotNumber: 34, skuCode: "SKU-YSL-34", brand: "Yves Saint Laurent", productName: "YSL Y Eau de Parfum", sprayPrice: 14000, bottleCapacityMl: 100, remainingVolumeMl: 63.0, kioskCode: "KIOSK-HN-01", physicalSlotLabel: "Slot 04", location: "Lotte Center West Lake Lounge, Hanoi", status: "INACTIVE" },
];

export interface ReportRecord {
    id: string;
    dateStr: string;
    timestamp: string;
    kioskCode: string;
    location: string;
    brand: string;
    productName: string;
    slotNumber: number;
    volumeMl: number;
    spraysCount: number;
    amountVnd: number;
    paymentMethod: "VietQR" | "MoMo" | "VNPay" | "ZaloPay";
    customerHash: string;
    status: "DISPENSED" | "PAID" | "PENDING" | "FAILED" | "UNCERTAIN" | "REFUNDED" | "CANCELLED" | "EXPIRED";
}

interface SyncedMachineSummary {
    code: string;
    locationName: string;
    brand: string;
    status: "ONLINE" | "MAINTENANCE" | "OFFLINE";
    todaySprays: number;
    todayRevenue: number;
    chamberTemp: string;
}

const DEFAULT_8_MACHINES_SUMMARY: SyncedMachineSummary[] = [
    { code: "demo-device", locationName: "Diamond Plaza Luxury Atrium, HCMC", brand: "Creed", status: "ONLINE", todaySprays: 42, todayRevenue: 815000, chamberTemp: "21.2°C" },
    { code: "KIOSK-SGN-01", locationName: "Saigon Centre Takashimaya Flagship, HCMC", brand: "Chanel", status: "ONLINE", todaySprays: 56, todayRevenue: 840000, chamberTemp: "21.4°C" },
    { code: "KIOSK-SGN-02", locationName: "Vincom Center Dong Khoi, HCMC", brand: "Yves Saint Laurent", status: "ONLINE", todaySprays: 38, todayRevenue: 532000, chamberTemp: "21.8°C" },
    { code: "KIOSK-SGN-03", locationName: "Crescent Mall Luxury Wing, HCMC", brand: "Montblanc", status: "ONLINE", todaySprays: 34, todayRevenue: 412000, chamberTemp: "21.6°C" },
    { code: "KIOSK-HN-01", locationName: "Lotte Center West Lake Lounge, Hanoi", brand: "Dior", status: "ONLINE", todaySprays: 49, todayRevenue: 710500, chamberTemp: "22.0°C" },
    { code: "KIOSK-HN-02", locationName: "Trang Tien Plaza Luxury Wing, Hanoi", brand: "Maison Margiela", status: "MAINTENANCE", todaySprays: 14, todayRevenue: 203000, chamberTemp: "23.1°C" },
    { code: "KIOSK-DAD-01", locationName: "IndoChina Riverside Mall Lobby, Da Nang", brand: "Versace", status: "ONLINE", todaySprays: 31, todayRevenue: 372000, chamberTemp: "21.9°C" },
    { code: "KIOSK-004", locationName: "Aeon Mall Tan Phu Celadon, HCMC", brand: "Tom Ford", status: "OFFLINE", todaySprays: 9, todayRevenue: 144000, chamberTemp: "24.2°C" },
];

// Hàm hỗ trợ định dạng ngày thực tế theo chuẩn YYYY-MM-DD (Local Time)
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
    if (parts.length !== 3) return ymd;
    return `${parts[2]}/${parts[1]}`;
}

function formatFullDisplayDate(ymd: string): string {
    const parts = ymd.split("-");
    if (parts.length !== 3) return ymd;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Tạo 34 bản ghi Seed neo trực tiếp vào ngày thực tế hôm nay (new Date()) lùi về 28 ngày qua để lịch thực tế luôn khớp 100%
function buildRealCalendarSeedReports(catalog: MasterCatalogSku[]): ReportRecord[] {
    const now = new Date();
    const paymentMethods: ReportRecord["paymentMethod"][] = ["VietQR", "MoMo", "VNPay", "ZaloPay"];

    return catalog.map((sku, idx) => {
        const dayOffset = idx % 28;
        const recordDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
        const dateStr = toLocalYmd(recordDate);
        const hour = String(10 + (idx % 12)).padStart(2, "0");
        const min = String(11 + ((idx * 7) % 45)).padStart(2, "0");
        const isFailed = idx === 18 || idx === 29;

        return {
            id: `TXN-2026-${String(9100 + idx)}`,
            dateStr,
            timestamp: `${dateStr} ${hour}:${min}:15`,
            kioskCode: sku.kioskCode,
            location: sku.location,
            brand: sku.brand,
            productName: sku.productName,
            slotNumber: sku.slotNumber,
            volumeMl: isFailed ? 0 : 0.12,
            spraysCount: isFailed ? 0 : 1,
            amountVnd: isFailed ? 0 : sku.sprayPrice,
            paymentMethod: paymentMethods[idx % paymentMethods.length],
            customerHash: `CUST-${String(1040 + (idx % 19))}`,
            status: isFailed ? "REFUNDED" : "DISPENSED",
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

type ReportTabCategory =
    | "OVERVIEW"
    | "SALES"
    | "MACHINES"
    | "PRODUCTS"
    | "INVENTORY"
    | "MAINTENANCE"
    | "USER_ACTIVITY"
    | "CUSTOM_REPORT";

type QuickCalendarPreset = "TODAY" | "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "CUSTOM";

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

function normalizePaymentLabel(rawMethod?: string): ReportRecord["paymentMethod"] {
    const up = String(rawMethod || "VIETQR").toUpperCase();
    if (up.includes("MOMO")) return "MoMo";
    if (up.includes("VNPAY")) return "VNPay";
    if (up.includes("ZALO")) return "ZaloPay";
    return "VietQR";
}

export default function ReportsPage() {
    const router = useRouter();
    const filterBarRef = useRef<HTMLDivElement | null>(null);

    const todayRealYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayRealYmd, -29), [todayRealYmd]);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [userRole, setUserRole] = useState<"VIEWER" | "PSA_ADMIN">("PSA_ADMIN");
    const [viewerCanExport] = useState<boolean>(true);

    const [catalogSkus, setCatalogSkus] = useState<MasterCatalogSku[]>(DEFAULT_34_CATALOG_SKUS);
    const [fleetMachines, setFleetMachines] = useState<SyncedMachineSummary[]>(DEFAULT_8_MACHINES_SUMMARY);
    const [reportRecords, setReportRecords] = useState<ReportRecord[]>(() =>
        buildRealCalendarSeedReports(DEFAULT_34_CATALOG_SKUS)
    );
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // Lịch thực tế 100%
    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayRealYmd);
    const [quickPreset, setQuickPreset] = useState<QuickCalendarPreset>("LAST_30_DAYS");

    // Quản lý mở/đóng từng Custom Dropdown & Luxury Calendar Popover
    const [openDropdown, setOpenDropdown] = useState<
        "CALENDAR" | "BRAND" | "KIOSK" | "PRODUCT" | "LOCATION" | "EXPORT" | null
    >(null);
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
    const [selectedKiosk, setSelectedKiosk] = useState<string>("ALL");
    const [selectedProduct, setSelectedProduct] = useState<string>("ALL");
    const [selectedPayment, setSelectedPayment] = useState<string>("ALL");

    const [activeTab, setActiveTab] = useState<ReportTabCategory>("OVERVIEW");
    const [trendGrouping, setTrendGrouping] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
    const [heatmapMetric, setHeatmapMetric] = useState<"SPRAYS" | "TRANSACTIONS">("SPRAYS");
    const [exportFormat, setExportFormat] = useState<"CSV" | "EXCEL">("CSV");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [customGroupBy, setCustomGroupBy] = useState<"BRAND" | "MACHINE" | "PRODUCT" | "LOCATION">("BRAND");
    const [includeFailedInReport, setIncludeFailedInReport] = useState<boolean>(false);

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

    /* --- HÀM CHỌN NHANH LỊCH THỰC TẾ (HÔM NAY, TUẦN NÀY, TUẦN TRƯỚC, THÁNG NÀY, 30 NGÀY QUA) --- */
    const handleApplyCalendarPreset = useCallback((preset: QuickCalendarPreset) => {
        const now = new Date();
        const todayStr = toLocalYmd(now);
        setQuickPreset(preset);

        if (preset === "TODAY") {
            setStartDate(todayStr);
            setEndDate(todayStr);
            setTrendGrouping("DAILY");
        } else if (preset === "THIS_WEEK") {
            const dayOfWeek = now.getDay(); // 0 (CN) -> 6 (T7)
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
            const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
            setStartDate(toLocalYmd(monday));
            setEndDate(toLocalYmd(sunday));
            setTrendGrouping("DAILY");
        } else if (preset === "LAST_WEEK") {
            const dayOfWeek = now.getDay();
            const diffToThisMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const lastMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToThisMonday - 7);
            const lastSunday = new Date(lastMonday.getFullYear(), lastMonday.getMonth(), lastMonday.getDate() + 6);
            setStartDate(toLocalYmd(lastMonday));
            setEndDate(toLocalYmd(lastSunday));
            setTrendGrouping("DAILY");
        } else if (preset === "THIS_MONTH") {
            const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(toLocalYmd(firstOfMonth));
            setEndDate(toLocalYmd(lastOfMonth));
            setTrendGrouping("WEEKLY");
        } else if (preset === "LAST_30_DAYS") {
            setStartDate(addDaysToYmd(todayStr, -29));
            setEndDate(todayStr);
            setTrendGrouping("DAILY");
        }
    }, []);

    /* --- 1. ĐỒNG BỘ 2 CHIỀU TOÀN DIỆN VỚI MÀN 1, 2, 4, 5, 6, 7, 8 --- */
    const loadAndReconcileReportsData = useCallback(() => {
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
                if (roleCode === "VW" || roleCode === "VIEWER") {
                    setUserRole("VIEWER");
                } else {
                    setUserRole("PSA_ADMIN");
                }
                if (roleCode === "BA" && parsedUser.brandScope) {
                    setSelectedBrand(parsedUser.brandScope);
                }
            }

            // B. Đọc KIOSK_PER_UNIT_STOCK_KEY
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            // C. Đọc MACHINES_STORAGE_KEY (/machines & /machines/[id])
            let syncedMachines: SyncedMachineSummary[] = [...DEFAULT_8_MACHINES_SUMMARY];
            const machineSlotLookup = new Map<
                string,
                {
                    kioskCode: string;
                    location: string;
                    slotLabel: string;
                    remainingMl: number;
                    capacityMl: number;
                    pricePerSpray?: number;
                    status?: "ACTIVE" | "INACTIVE" | "DRAFT";
                }
            >();

            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedFleet = JSON.parse(rawMachines);
                if (Array.isArray(parsedFleet) && parsedFleet.length > 0) {
                    syncedMachines = parsedFleet.map((fm: any) => {
                        const code = String(fm.code || fm.id || "demo-device");
                        const conn =
                            fm.connectionStatus ||
                            (fm.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                        const oper =
                            fm.operatingStatus ||
                            (fm.status === "MAINTENANCE"
                                ? "MAINTENANCE"
                                : fm.status === "OFFLINE"
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

                        if (Array.isArray(fm.slots)) {
                            fm.slots.forEach((sl: any, sIdx: number) => {
                                const fKey = String(sl.fragranceName || "").trim().toLowerCase();
                                if (fKey) {
                                    machineSlotLookup.set(fKey, {
                                        kioskCode: code,
                                        location: fm.locationName || code,
                                        slotLabel: sl.slotLabel || `Slot 0${sIdx + 1}`,
                                        remainingMl: Number(sl.remainingMl ?? 100),
                                        capacityMl: Number(sl.capacityMl ?? 100),
                                        pricePerSpray: sl.pricePerSpray
                                            ? Number(sl.pricePerSpray)
                                            : undefined,
                                        status: sl.productStatus || "ACTIVE",
                                    });
                                }
                            });
                        }

                        return {
                            code,
                            locationName: fm.locationName || code,
                            brand: fm.brand || "Luxury Maison",
                            status: unifiedStatus,
                            todaySprays: Number(fm.todaySprays || 0),
                            todayRevenue: Number(fm.todayRevenue || 0),
                            chamberTemp: fm.chamberTemp || "21.4°C",
                        };
                    });
                }
            }
            setFleetMachines(syncedMachines);

            // D. Đọc PRODUCTS_STORAGE_KEY (/products) kết hợp với machineSlotLookup & perKioskMatrix
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
                        const capMl = Number(
                            p.bottleVolumeMl || fromMachine?.capacityMl || 100
                        );
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
                            status: p.status || fromMachine?.status || "ACTIVE",
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

            // E. Đọc DASHBOARD_STORAGE_KEY và gắn ngày thực tế chuẩn xác cho cả 34 đơn Seed lẫn đơn Live mới xịt
            const dynamicSeedReports = buildRealCalendarSeedReports(syncedCatalog);
            let combinedRecords: ReportRecord[] = [...dynamicSeedReports];

            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            if (rawDash) {
                const parsedDash = JSON.parse(rawDash);
                if (Array.isArray(parsedDash.transactions) && parsedDash.transactions.length > 0) {
                    const nowObj = new Date();
                    const todayStr = toLocalYmd(nowObj);

                    // Chỉ lấy tối đa 60 đơn Live mới nhất để tránh trường hợp Auto Stream cũ tạo ra 900 đơn rác
                    const recentTransactions = parsedDash.transactions.slice(0, 60);

                    const liveConverted: ReportRecord[] = recentTransactions.map(
                        (tx: any, idx: number) => {
                            const txId = String(tx.id || `ORD-2026-${9200 + idx}`);
                            const rawStatus = String(tx.status || "DISPENSED").toUpperCase();
                            const prodName =
                                tx.product || tx.productName || "Creed Aventus";
                            const matchedSku =
                                syncedCatalog.find((s) =>
                                    isExactMatch(s.productName, prodName)
                                ) || syncedCatalog[0];

                            // Nếu là 34 đơn Seed (TXN-2026-9100..9133), trải đều vào 28 ngày thực tế trên lịch
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
                                ).padStart(2, "0")}:00`;
                            } else {
                                const createdIso = tx.createdAt || tx.executedAt || "";
                                if (createdIso && createdIso.includes("T")) {
                                    datePart = createdIso.split("T")[0];
                                    timePart = createdIso.split("T")[1].slice(0, 8);
                                }
                            }

                            const isSuccess =
                                rawStatus === "DISPENSED" || rawStatus === "PAID";
                            const effectiveAmount = isSuccess
                                ? Number(
                                    tx.priceSnapshot ??
                                    tx.amount ??
                                    tx.paidAmount ??
                                    matchedSku.sprayPrice
                                )
                                : 0;

                            return {
                                id: txId,
                                dateStr: datePart,
                                timestamp: `${datePart} ${timePart}`,
                                kioskCode:
                                    tx.kiosk || tx.kioskCode || matchedSku.kioskCode,
                                location: tx.location || matchedSku.location,
                                brand: tx.brand || matchedSku.brand,
                                productName: prodName,
                                slotNumber: Number(
                                    tx.slotNumber || matchedSku.slotNumber || 1
                                ),
                                volumeMl: isSuccess ? 0.12 : 0,
                                spraysCount: isSuccess ? 1 : 0,
                                amountVnd: effectiveAmount,
                                paymentMethod: normalizePaymentLabel(tx.paymentMethod),
                                customerHash: `CUST-${String(
                                    1010 + ((idx + prodName.length) % 35)
                                )}`,
                                status: (rawStatus as ReportRecord["status"]) || "DISPENSED",
                            };
                        }
                    );

                    const seenIds = new Set<string>();
                    const deduplicated: ReportRecord[] = [];
                    [...liveConverted, ...dynamicSeedReports].forEach((rec) => {
                        if (!seenIds.has(rec.id)) {
                            seenIds.add(rec.id);
                            deduplicated.push(rec);
                        }
                    });
                    combinedRecords = deduplicated;
                }
            }
            setReportRecords(combinedRecords);

            // F. Đọc AUDIT_LOGS_STORAGE_KEY
            const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
            if (rawAudit) {
                const parsedAudit = JSON.parse(rawAudit);
                if (Array.isArray(parsedAudit)) {
                    setAuditLogs(parsedAudit);
                }
            }
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadAndReconcileReportsData();

        const handleCrossTabSync = () => {
            loadAndReconcileReportsData();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileReportsData();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileReportsData]);

    /* --- 2. TÁC VỤ NẠP BÌNH (100%) HOẶC XỊT THỬ (-0.12ML) TỪ BÁO CÁO ĐỒNG BỘ NGƯỢC VỀ 8 MÀN KIA --- */
    const handleReportInventoryAction = useCallback(
        (sku: MasterCatalogSku, actionType: "SPRAY" | "REFILL") => {
            if (userRole === "VIEWER") return;

            const kKey = sku.kioskCode.toLowerCase();
            const pKey = sku.productName.trim().toLowerCase();
            const qtyBefore = sku.remainingVolumeMl;

            if (actionType === "SPRAY" && qtyBefore < 0.12) {
                showToast(
                    lang === "en"
                        ? `Cartridge ${sku.productName} on ${sku.kioskCode} is empty (0ml). Please replenish first!`
                        : `Bình ${sku.productName} tại trạm ${sku.kioskCode} đã cạn (0ml). Vui lòng nạp đầy trước!`
                );
                return;
            }

            const qtyAfter =
                actionType === "REFILL"
                    ? sku.bottleCapacityMl
                    : Number(Math.max(0, qtyBefore - 0.12).toFixed(2));

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
                                todaySprays:
                                    actionType === "SPRAY"
                                        ? (fm.todaySprays || 0) + 1
                                        : fm.todaySprays,
                                todayRevenue:
                                    actionType === "SPRAY"
                                        ? (fm.todayRevenue || 0) + sku.sprayPrice
                                        : fm.todayRevenue,
                                slots: Array.isArray(fm.slots)
                                    ? fm.slots.map((sl: any) =>
                                        isExactMatch(sl.fragranceName || "", sku.productName)
                                            ? {
                                                ...sl,
                                                remainingMl: qtyAfter,
                                                available: qtyAfter >= 0.12,
                                            }
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
                            if (!isExactMatch(p.name || "", sku.productName)) return p;
                            const nextExtra =
                                actionType === "SPRAY"
                                    ? Number(p.liveExtraSprays || 0) + 1
                                    : Number(p.liveExtraSprays || 0);
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

                if (actionType === "SPRAY") {
                    const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
                    const nowIso = new Date().toISOString();
                    const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                    const dashData = rawDash
                        ? JSON.parse(rawDash)
                        : { transactions: [], incidents: [], alerts: [] };
                    if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                    dashData.transactions.unshift({
                        id: newOrderId,
                        time: `Completed (${sku.kioskCode})`,
                        kiosk: sku.kioskCode,
                        location: sku.location,
                        slotNumber: sku.slotNumber,
                        brand: sku.brand,
                        product: sku.productName,
                        priceSnapshot: sku.sprayPrice,
                        amount: sku.sprayPrice,
                        paidAmount: sku.sprayPrice,
                        paymentMethod: "VIETQR",
                        providerReference: `PAY-VIETQR-${newOrderId}`,
                        status: "DISPENSED",
                        commandReference: `CMD-${newOrderId}`,
                        ackedAt: nowIso,
                        executedAt: nowIso,
                        createdAt: nowIso,
                        dateType: "TODAY",
                    });
                    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));

                    const rawMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movList = rawMov ? JSON.parse(rawMov) : [];
                    movList.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: newOrderId,
                        kioskCode: sku.kioskCode,
                        slotNumber: sku.slotNumber,
                        brand: sku.brand,
                        productName: sku.productName,
                        movementType: "SALE",
                        quantityBeforeMl: qtyBefore,
                        quantityAfterMl: qtyAfter,
                        deltaMl: -0.12,
                        reason: `Report inventory spray on ${sku.kioskCode}`,
                        timestamp: nowIso,
                    });
                    localStorage.setItem(
                        INVENTORY_MOVEMENTS_KEY,
                        JSON.stringify(movList.slice(0, 300))
                    );
                }

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
                loadAndReconcileReportsData();

                showToast(
                    actionType === "SPRAY"
                        ? lang === "en"
                            ? `Dispensed 1 spray (-0.12ml) of ${sku.productName} on ${sku.kioskCode}: ${qtyBefore}ml → ${qtyAfter}ml (+${sku.sprayPrice.toLocaleString("vi-VN")} VND). Synchronized across all 9 screens!`
                            : `Đã xịt 1 lần (-0.12ml) chai ${sku.productName} trên ${sku.kioskCode}: ${qtyBefore}ml → ${qtyAfter}ml (+${sku.sprayPrice.toLocaleString("vi-VN")}đ). Đã đồng bộ cả 9 màn hình!`
                        : lang === "en"
                            ? `Replenished ${sku.productName} on ${sku.kioskCode} to ${sku.bottleCapacityMl}ml (100%) and synchronized across all 9 screens!`
                            : `Đã nạp đầy 100% (${sku.bottleCapacityMl}ml) cho ${sku.productName} trên ${sku.kioskCode} và đồng bộ cả 9 màn hình!`
                );
            } catch {
                // Safe fallback
            }
        },
        [lang, loadAndReconcileReportsData, showToast, userRole]
    );

    const uniqueBrands = useMemo(
        () => Array.from(new Set(catalogSkus.map((s) => s.brand))).sort(),
        [catalogSkus]
    );
    const uniqueLocations = useMemo(
        () => Array.from(new Set(catalogSkus.map((s) => s.location))).sort(),
        [catalogSkus]
    );
    const uniqueKiosks = useMemo(
        () => Array.from(new Set(fleetMachines.map((m) => m.code))).sort(),
        [fleetMachines]
    );
    const uniqueProducts = useMemo(
        () => Array.from(new Set(catalogSkus.map((s) => s.productName))).sort(),
        [catalogSkus]
    );

    // Lọc dữ liệu nhất quán theo đúng khoảng ngày thực tế [startDate .. endDate]
    const filteredReports = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return reportRecords.filter((r) => {
            const matchesDate = r.dateStr >= startDate && r.dateStr <= endDate;
            const matchesBrand = selectedBrand === "ALL" || isExactMatch(r.brand, selectedBrand);
            const matchesLocation =
                selectedLocation === "ALL" ||
                r.location.toLowerCase().includes(selectedLocation.toLowerCase()) ||
                selectedLocation.toLowerCase().includes(r.location.toLowerCase());
            const matchesKiosk =
                selectedKiosk === "ALL" || isExactMatch(r.kioskCode, selectedKiosk);
            const matchesProduct =
                selectedProduct === "ALL" || isExactMatch(r.productName, selectedProduct);
            const matchesPayment =
                selectedPayment === "ALL" || r.paymentMethod === selectedPayment;
            const matchesSearch =
                !q ||
                r.id.toLowerCase().includes(q) ||
                r.productName.toLowerCase().includes(q) ||
                r.brand.toLowerCase().includes(q) ||
                r.kioskCode.toLowerCase().includes(q) ||
                r.location.toLowerCase().includes(q);

            return (
                matchesDate &&
                matchesBrand &&
                matchesLocation &&
                matchesKiosk &&
                matchesProduct &&
                matchesPayment &&
                matchesSearch
            );
        });
    }, [
        reportRecords,
        startDate,
        endDate,
        selectedBrand,
        selectedLocation,
        selectedKiosk,
        selectedProduct,
        selectedPayment,
        searchQuery,
    ]);

    // 2. Tính toán 5 KPI Cards từ dữ liệu thực tế
    const kpiMetrics = useMemo(() => {
        const dispensedRows = filteredReports.filter(
            (r) => r.status === "DISPENSED" || r.status === "PAID"
        );
        const recognizedRevenue = dispensedRows.reduce((sum, r) => sum + r.amountVnd, 0);
        const totalTransactions = filteredReports.length;
        const totalSprays = dispensedRows.reduce((sum, r) => sum + r.spraysCount, 0);
        const onlineFleetCount = fleetMachines.filter((m) => m.status === "ONLINE").length;
        const uniqueCustomersCount = new Set(filteredReports.map((r) => r.customerHash)).size;

        return {
            recognizedRevenue,
            totalTransactions,
            totalSprays,
            onlineFleetCount,
            totalFleetCount: fleetMachines.length,
            uniqueCustomersCount,
        };
    }, [filteredReports, fleetMachines]);

    // 4. BIỂU ĐỒ XU HƯỚNG CHẠY THEO ĐÚNG LỊCH THỰC TẾ 100% (DAILY / WEEKLY / MONTHLY)
    const dynamicTrendBars = useMemo(() => {
        const dispensedRows = filteredReports.filter(
            (r) => r.status === "DISPENSED" || r.status === "PAID"
        );

        const buckets: {
            label: string;
            rev: number;
            sp: number;
            isTodayOrCurrent: boolean;
        }[] = [];

        if (trendGrouping === "DAILY") {
            // Hiển thị 7 ngày thực tế kết thúc tại endDate (VD: 09/11, 10/11, ..., 15/11)
            for (let i = 6; i >= 0; i--) {
                const dayYmd = addDaysToYmd(endDate, -i);
                const dayRows = dispensedRows.filter((r) => r.dateStr === dayYmd);
                const rev = dayRows.reduce((s, r) => s + r.amountVnd, 0);
                const sp = dayRows.reduce((s, r) => s + r.spraysCount, 0);
                buckets.push({
                    label: formatShortDdMm(dayYmd),
                    rev,
                    sp,
                    isTodayOrCurrent: dayYmd === todayRealYmd || i === 0,
                });
            }
        } else if (trendGrouping === "WEEKLY") {
            // Hiển thị 4 tuần thực tế trên lịch kết thúc tại endDate
            for (let w = 3; w >= 0; w--) {
                const wEnd = addDaysToYmd(endDate, -w * 7);
                const wStart = addDaysToYmd(wEnd, -6);
                const weekRows = dispensedRows.filter(
                    (r) => r.dateStr >= wStart && r.dateStr <= wEnd
                );
                const rev = weekRows.reduce((s, r) => s + r.amountVnd, 0);
                const sp = weekRows.reduce((s, r) => s + r.spraysCount, 0);
                buckets.push({
                    label: `${formatShortDdMm(wStart)}–${formatShortDdMm(wEnd)}`,
                    rev,
                    sp,
                    isTodayOrCurrent: w === 0,
                });
            }
        } else {
            // MONTHLY: Hiển thị 6 tháng thực tế gần nhất tính tới tháng của endDate
            const [endY, endM] = endDate.split("-").map(Number);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            for (let mOff = 5; mOff >= 0; mOff--) {
                const dt = new Date(endY, (endM || 1) - 1 - mOff, 1);
                const ymPrefix = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
                const mRows = dispensedRows.filter((r) => r.dateStr.startsWith(ymPrefix));
                const rev = mRows.reduce((s, r) => s + r.amountVnd, 0);
                const sp = mRows.reduce((s, r) => s + r.spraysCount, 0);
                buckets.push({
                    label: `${monthNames[dt.getMonth()]} ${dt.getFullYear()}`,
                    rev,
                    sp,
                    isTodayOrCurrent: mOff === 0,
                });
            }
        }

        const maxRev = Math.max(...buckets.map((b) => b.rev), 15000);
        return buckets.map((b) => ({
            ...b,
            pct: b.rev === 0 ? 8 : Math.max(18, Math.min(96, Math.round((b.rev / maxRev) * 92))),
        }));
    }, [filteredReports, trendGrouping, endDate, todayRealYmd]);

    // 5. Revenue by Brand
    const revenueByBrandList = useMemo(() => {
        const map = new Map<string, { brand: string; revenue: number; sprays: number }>();
        filteredReports
            .filter((r) => r.status === "DISPENSED" || r.status === "PAID")
            .forEach((r) => {
                const cur = map.get(r.brand) || { brand: r.brand, revenue: 0, sprays: 0 };
                cur.revenue += r.amountVnd;
                cur.sprays += r.spraysCount;
                map.set(r.brand, cur);
            });
        const list = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
        const totalRev = list.reduce((s, i) => s + i.revenue, 0) || 1;
        return list.map((item) => ({
            ...item,
            sharePct: +((item.revenue / totalRev) * 100).toFixed(1),
        }));
    }, [filteredReports]);

    // 7. Top Performing Machines
    const topMachinesList = useMemo(() => {
        const map = new Map<
            string,
            { kioskCode: string; location: string; revenue: number; sprays: number; txCount: number }
        >();
        filteredReports.forEach((r) => {
            const cur = map.get(r.kioskCode) || {
                kioskCode: r.kioskCode,
                location: r.location,
                revenue: 0,
                sprays: 0,
                txCount: 0,
            };
            cur.txCount += 1;
            if (r.status === "DISPENSED" || r.status === "PAID") {
                cur.revenue += r.amountVnd;
                cur.sprays += r.spraysCount;
            }
            map.set(r.kioskCode, cur);
        });
        return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    }, [filteredReports]);

    // 8. Top Perfume Products
    const topProductsList = useMemo(() => {
        const map = new Map<
            string,
            { productName: string; brand: string; sprays: number; txCount: number; revenue: number }
        >();
        filteredReports.forEach((r) => {
            const cur = map.get(r.productName) || {
                productName: r.productName,
                brand: r.brand,
                sprays: 0,
                txCount: 0,
                revenue: 0,
            };
            cur.txCount += 1;
            if (r.status === "DISPENSED" || r.status === "PAID") {
                cur.sprays += r.spraysCount;
                cur.revenue += r.amountVnd;
            }
            map.set(r.productName, cur);
        });
        return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    }, [filteredReports]);

    // 9. Transactions by Payment Method
    const paymentBreakdown = useMemo(() => {
        const methods: ReportRecord["paymentMethod"][] = ["VietQR", "MoMo", "VNPay", "ZaloPay"];
        const total = filteredReports.length || 1;
        return methods.map((m) => {
            const rows = filteredReports.filter((r) => r.paymentMethod === m);
            const revenue = rows
                .filter((r) => r.status === "DISPENSED" || r.status === "PAID")
                .reduce((s, r) => s + r.amountVnd, 0);
            return {
                method: m,
                count: rows.length,
                pct: Math.round((rows.length / total) * 100),
                revenue,
            };
        });
    }, [filteredReports]);

    // 10. Sales by Location
    const salesByLocation = useMemo(() => {
        const map = new Map<string, { location: string; revenue: number; sprays: number }>();
        filteredReports
            .filter((r) => r.status === "DISPENSED" || r.status === "PAID")
            .forEach((r) => {
                const cur = map.get(r.location) || { location: r.location, revenue: 0, sprays: 0 };
                cur.revenue += r.amountVnd;
                cur.sprays += r.spraysCount;
                map.set(r.location, cur);
            });
        return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    }, [filteredReports]);

    // Lưới 42 ô ngày của tháng đang mở trên Custom Luxury Calendar
    const calendarGridCells = useMemo(() => {
        const firstDay = new Date(calendarViewYear, calendarViewMonth, 1);
        const startWeekday = (firstDay.getDay() + 6) % 7; // Thứ 2 = 0 .. Chủ Nhật = 6
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
        setQuickPreset("CUSTOM");
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

    const handleResetAllFilters = () => {
        setStartDate(defaultStart30d);
        setEndDate(todayRealYmd);
        setQuickPreset("LAST_30_DAYS");
        setSearchQuery("");
        setSelectedBrand("ALL");
        setSelectedLocation("ALL");
        setSelectedKiosk("ALL");
        setSelectedProduct("ALL");
        setSelectedPayment("ALL");
        setOpenDropdown(null);
    };

    const handleExportCSV = () => {
        if (userRole === "VIEWER" && !viewerCanExport) {
            showToast(
                lang === "en"
                    ? "Access Restricted: Your Viewer account does not hold export permission."
                    : "Giới hạn quyền: Tài khoản Viewer chưa được cấp quyền xuất file."
            );
            return;
        }

        const csvHeader =
            "Order ID;Timestamp;Station Code;Location;Maison;Fragrance Name;Slot;Calibrated Volume (ml);Dispensed Sprays;Payment Gateway;Recognized Amount (VND);Status\n";

        const csvRows = filteredReports
            .map(
                (r) =>
                    `"${r.id}";"${r.timestamp}";"${r.kioskCode}";"${r.location}";"${r.brand}";"${r.productName}";"SLOT-${String(
                        r.slotNumber
                    ).padStart(2, "0")}";"${r.volumeMl}";"${r.spraysCount}";"${r.paymentMethod}";"${
                        r.amountVnd
                    }";"${r.status}"`
            )
            .join("\n");

        const blob = new Blob(["\ufeff" + csvHeader + csvRows], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            exportFormat === "CSV" ? "ScentStation_Reports.csv" : "ScentStation_Reports_Excel.csv"
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(
            lang === "en"
                ? `Exported ${filteredReports.length} verified records (${exportFormat} format)!`
                : `Đã xuất thành công ${filteredReports.length} bản ghi báo cáo (${exportFormat})!`
        );
    };

    const monthTitleText = useMemo(() => {
        const dt = new Date(calendarViewYear, calendarViewMonth, 1);
        return dt.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
            month: "long",
            year: "numeric",
        });
    }, [calendarViewYear, calendarViewMonth, lang]);

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
                                ? "ENTERPRISE BUSINESS INTELLIGENCE & FINANCIAL RECONCILIATION"
                                : "PHÂN TÍCH DOANH THU ĐA CHIỀU & ĐỐI SOÁT VẬN HÀNH HỆ THỐNG"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Operational & Financial Reports"
                                : "Báo Cáo Tài Chính & Vận Hành Trạm"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? `Real-time multi-tenant analytics across ${uniqueBrands.length} luxury partner maisons, ${catalogSkus.length} curated fragrances, and ${fleetMachines.length} automated sampling stations.`
                                : `Phân tích số liệu thời gian thực trên ${uniqueBrands.length} thương hiệu đối tác, ${catalogSkus.length} mùi hương tuyển chọn và ${fleetMachines.length} trạm Kiosk tự động.`}
                        </p>
                    </div>

                    <div
                        style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}
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

                        {(userRole !== "VIEWER" || viewerCanExport) && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                {/* CUSTOM DROPDOWN CHO EXPORT FORMAT (KHÔNG HIỆN HỘP TRẮNG/XANH WINDOWS) */}
                                <div className={styles.customDropdownWrap}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "EXPORT" ? null : "EXPORT"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                    >
                                        <span>
                                            {exportFormat === "CSV"
                                                ? "CSV (.csv)"
                                                : "Excel (.csv)"}
                                        </span>
                                        <ChevronDown size={13} color="#D4AF37" />
                                    </button>
                                    {openDropdown === "EXPORT" && (
                                        <div
                                            className={styles.customDropdownMenu}
                                            style={{ minWidth: "150px" }}
                                        >
                                            {(["CSV", "EXCEL"] as const).map((fmt) => (
                                                <button
                                                    key={fmt}
                                                    type="button"
                                                    onClick={() => {
                                                        setExportFormat(fmt);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${styles.customDropdownItem} ${
                                                        exportFormat === fmt
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>
                                                        {fmt === "CSV"
                                                            ? "CSV (.csv)"
                                                            : "Excel (.csv)"}
                                                    </span>
                                                    {exportFormat === fmt && (
                                                        <Check size={13} color="#D4AF37" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={handleExportCSV} className={styles.exportButton}>
                                    <Download size={15} />
                                    <span>
                                        {lang === "en" ? "Export Report" : "Xuất Báo Cáo"}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5 KPI CARDS */}
                <div className={styles.kpiGrid5}>
                    <div
                        className={`${styles.kpiCard} ${
                            activeTab === "SALES" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() => setActiveTab("SALES")}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "RECOGNIZED REVENUE" : "DOANH THU GHI NHẬN"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#F5E6AD", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {kpiMetrics.recognizedRevenue.toLocaleString("vi-VN")} VND
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}>
                            <ArrowUpRight size={13} />
                            <span>
                                {formatShortDdMm(startDate)} – {formatShortDdMm(endDate)}
                            </span>
                        </div>
                    </div>

                    <div
                        className={`${styles.kpiCard} ${
                            activeTab === "OVERVIEW" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() => setActiveTab("OVERVIEW")}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "TOTAL TRANSACTIONS" : "TỔNG SỐ ĐƠN HÀNG"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#FFFFFF", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {kpiMetrics.totalTransactions} Orders
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {lang === "en"
                                ? "Dispensed, Pending & Refunded"
                                : "Bao gồm hoàn tất & hoàn tiền"}
                        </div>
                    </div>

                    <div
                        className={`${styles.kpiCard} ${
                            activeTab === "PRODUCTS" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() => setActiveTab("PRODUCTS")}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "VERIFIED SPRAYS" : "LƯỢT XỊT XÁC THỰC"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#34D399", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {kpiMetrics.totalSprays} Sprays
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399", fontFamily: "Space Grotesk, monospace" }}>
                            {(kpiMetrics.totalSprays * 0.12).toFixed(2)} ml dispensed
                        </div>
                    </div>

                    <div
                        className={`${styles.kpiCard} ${
                            activeTab === "MACHINES" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() => setActiveTab("MACHINES")}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "ACTIVE STATIONS" : "TRẠM ĐANG HOẠT ĐỘNG"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#60A5FA", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {kpiMetrics.onlineFleetCount} / {kpiMetrics.totalFleetCount} Ready
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {lang === "en" ? "Online & Operational" : "Kết nối MQTT trực tuyến"}
                        </div>
                    </div>

                    <div
                        className={`${styles.kpiCard} ${
                            activeTab === "INVENTORY" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() => setActiveTab("INVENTORY")}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "UNIQUE CUSTOMERS" : "KHÁCH HÀNG TRẢI NGHIỆM"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#F5E6AD", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {kpiMetrics.uniqueCustomersCount} Guests
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}>
                            <ArrowUpRight size={13} />
                            <span>+12.1% repeat sampling</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER BAR 2 TẦNG GỌN ĐẸP + CUSTOM DARK CALENDAR POPOVER + 4 CUSTOM LUXURY DROPDOWNS */}
            <div
                className={styles.filterBar}
                ref={filterBarRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.filterRowTop}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={
                                lang === "en"
                                    ? "Search Order ID, fragrance, maison, or station..."
                                    : "Tìm mã đơn, tên nước hoa, thương hiệu hoặc mã trạm..."
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

                    {/* 1. CUSTOM LUXURY DARK CALENDAR POPOVER (THAY THẾ HOÀN TOÀN LỊCH TRẮNG CHROME) */}
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
                                            handleApplyCalendarPreset("TODAY");
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
                                        className={styles.exportButton}
                                        style={{ padding: "0.35rem 0.85rem", fontSize: "0.72rem" }}
                                    >
                                        <span>{lang === "en" ? "Apply" : "Áp dụng"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. CUSTOM DROPDOWN: ALL MAISONS */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(openDropdown === "BRAND" ? null : "BRAND")
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedBrand !== "ALL" ? styles.customDropdownTriggerActive : ""
                            }`}
                        >
                            <span>
                                {selectedBrand === "ALL"
                                    ? lang === "en"
                                        ? `All Maisons (${uniqueBrands.length})`
                                        : `Mọi Thương Hiệu (${uniqueBrands.length})`
                                    : selectedBrand}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "BRAND" && (
                            <div className={styles.customDropdownMenu}>
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
                                        {lang === "en"
                                            ? `All Maisons (${uniqueBrands.length})`
                                            : `Mọi Thương Hiệu (${uniqueBrands.length})`}
                                    </span>
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

                    {/* 3. CUSTOM DROPDOWN: ALL STATIONS */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(openDropdown === "KIOSK" ? null : "KIOSK")
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedKiosk !== "ALL" ? styles.customDropdownTriggerActive : ""
                            }`}
                        >
                            <span>
                                {selectedKiosk === "ALL"
                                    ? lang === "en"
                                        ? `All Stations (${uniqueKiosks.length})`
                                        : `Mọi Trạm Kiosk (${uniqueKiosks.length})`
                                    : selectedKiosk}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "KIOSK" && (
                            <div className={styles.customDropdownMenu}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedKiosk("ALL");
                                        setOpenDropdown(null);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        selectedKiosk === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>
                                        {lang === "en"
                                            ? `All Stations (${uniqueKiosks.length})`
                                            : `Mọi Trạm Kiosk (${uniqueKiosks.length})`}
                                    </span>
                                    {selectedKiosk === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {uniqueKiosks.map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => {
                                            setSelectedKiosk(k);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedKiosk === k
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{k}</span>
                                        {selectedKiosk === k && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. CUSTOM DROPDOWN: ALL FRAGRANCES */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "PRODUCT" ? null : "PRODUCT"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedProduct !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {selectedProduct === "ALL"
                                    ? lang === "en"
                                        ? `All Fragrances (${uniqueProducts.length})`
                                        : `Mọi Mùi Hương (${uniqueProducts.length})`
                                    : selectedProduct}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "PRODUCT" && (
                            <div
                                className={styles.customDropdownMenu}
                                style={{ minWidth: "260px" }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedProduct("ALL");
                                        setOpenDropdown(null);
                                    }}
                                    className={`${styles.customDropdownItem} ${
                                        selectedProduct === "ALL"
                                            ? styles.customDropdownItemActive
                                            : ""
                                    }`}
                                >
                                    <span>
                                        {lang === "en"
                                            ? `All Fragrances (${uniqueProducts.length})`
                                            : `Mọi Mùi Hương (${uniqueProducts.length})`}
                                    </span>
                                    {selectedProduct === "ALL" && (
                                        <Check size={13} color="#D4AF37" />
                                    )}
                                </button>
                                {uniqueProducts.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => {
                                            setSelectedProduct(p);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedProduct === p
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{p}</span>
                                        {selectedProduct === p && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* DÒNG DƯỚI CỦA FILTER BAR: CHỌN NHANH TUẦN NÀY / TUẦN TRƯỚC / THÁNG NÀY + ĐỊA ĐIỂM BOUTIQUE */}
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
                        ).map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleApplyCalendarPreset(preset.id)}
                                className={`${styles.quickRangePill} ${
                                    quickPreset === preset.id ? styles.quickRangePillActive : ""
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                        {/* 5. CUSTOM DROPDOWN: ALL BOUTIQUES */}
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
                                <MapPin size={13} color="#D4AF37" />
                                <span>
                                    {selectedLocation === "ALL"
                                        ? lang === "en"
                                            ? "All Boutiques"
                                            : "Mọi Địa Điểm"
                                        : selectedLocation}
                                </span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "LOCATION" && (
                                <div
                                    className={styles.customDropdownMenu}
                                    style={{ right: 0, left: "auto", minWidth: "280px" }}
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
                                        <span>
                                            {lang === "en" ? "All Boutiques" : "Mọi Địa Điểm"}
                                        </span>
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

                        <button
                            type="button"
                            onClick={handleResetAllFilters}
                            className={styles.secondaryGoldBtn}
                        >
                            <RefreshCw size={13} />
                            <span>{lang === "en" ? "Reset" : "Đặt lại"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* REPORT CATEGORIES TABS */}
            <div className={styles.categoryTabsBar}>
                {(
                    [
                        { id: "OVERVIEW", label: lang === "en" ? "Overview" : "Tổng Quan", icon: BarChart3 },
                        { id: "SALES", label: lang === "en" ? "Sales Performance" : "Hiệu Suất Doanh Thu", icon: Sparkles },
                        { id: "MACHINES", label: lang === "en" ? `Station Performance (${fleetMachines.length})` : `Hiệu Suất Đội Máy (${fleetMachines.length})`, icon: Cpu },
                        { id: "PRODUCTS", label: lang === "en" ? `Product Insights (${catalogSkus.length})` : `Phân Tích Mùi Hương (${catalogSkus.length})`, icon: PieChart },
                        { id: "INVENTORY", label: lang === "en" ? "Live Cartridge Inventory" : "Báo Cáo Tồn Kho Bình", icon: FileSpreadsheet },
                        { id: "MAINTENANCE", label: lang === "en" ? "Maintenance & Uptime" : "Bảo Trì & Uptime", icon: Clock },
                        { id: "USER_ACTIVITY", label: lang === "en" ? "Audit & User Activity" : "Nhật Ký Hoạt Động", icon: ShieldCheck },
                        ...(userRole !== "VIEWER"
                            ? [{ id: "CUSTOM_REPORT", label: lang === "en" ? "Custom Report Builder" : "Tạo Báo Cáo Tùy Chỉnh", icon: SlidersHorizontal }]
                            : []),
                    ] as const
                ).map((tab) => {
                    const IconComp = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as ReportTabCategory)}
                            className={`${styles.categoryTabBtn} ${
                                active ? styles.categoryTabBtnActive : ""
                            }`}
                        >
                            <IconComp size={14} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 8: CUSTOM REPORT BUILDER */}
            {activeTab === "CUSTOM_REPORT" && userRole !== "VIEWER" && (
                <div
                    className={styles.analyticsCard}
                    style={{
                        marginBottom: "1.35rem",
                        border: "1px solid rgba(212,175,55,0.55)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.75rem",
                            marginBottom: "1rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? "Custom Report Builder"
                                    : "Trình Khởi Tạo Báo Cáo Tùy Chỉnh"}
                            </h3>
                            <p
                                style={{
                                    margin: "0.2rem 0 0 0",
                                    fontSize: "0.78rem",
                                    color: "#94A3B8",
                                }}
                            >
                                {lang === "en"
                                    ? "Select aggregation dimension and transaction status inclusion rules before exporting."
                                    : "Chọn chiều gom nhóm dữ liệu và phạm vi trạng thái đơn hàng trước khi xuất báo cáo."}
                            </p>
                        </div>
                        <button onClick={handleExportCSV} className={styles.exportButton}>
                            <Download size={14} />
                            <span>
                                {lang === "en"
                                    ? "Generate & Export Custom CSV"
                                    : "Tạo & Xuất Báo Cáo CSV"}
                            </span>
                        </button>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "1rem",
                        }}
                    >
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#D4AF37",
                                    marginBottom: "0.35rem",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                GROUP BY DIMENSION
                            </label>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                {(["BRAND", "MACHINE", "PRODUCT", "LOCATION"] as const).map(
                                    (dim) => (
                                        <button
                                            key={dim}
                                            type="button"
                                            onClick={() => setCustomGroupBy(dim)}
                                            className={`${styles.quickRangePill} ${
                                                customGroupBy === dim
                                                    ? styles.quickRangePillActive
                                                    : ""
                                            }`}
                                            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                                        >
                                            {dim}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#D4AF37",
                                    marginBottom: "0.35rem",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                TRANSACTION SCOPE
                            </label>
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setIncludeFailedInReport(false)}
                                    className={`${styles.quickRangePill} ${
                                        !includeFailedInReport
                                            ? styles.quickRangePillActive
                                            : ""
                                    }`}
                                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                                >
                                    DISPENSED ONLY
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIncludeFailedInReport(true)}
                                    className={`${styles.quickRangePill} ${
                                        includeFailedInReport
                                            ? styles.quickRangePillActive
                                            : ""
                                    }`}
                                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                                >
                                    INCLUDE ALL
                                </button>
                            </div>
                        </div>

                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.7rem",
                                    color: "#D4AF37",
                                    marginBottom: "0.35rem",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                MATCHED RECORDS
                            </label>
                            <div
                                style={{
                                    color: "#34D399",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                    fontSize: "0.9rem",
                                    paddingTop: "0.35rem",
                                }}
                            >
                                {filteredReports.length} verified records ready
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB INVENTORY: BẢNG TỒN KHO BÌNH NƯỚC HOA THỜI GIAN THỰC */}
            {activeTab === "INVENTORY" && (
                <div
                    className={styles.tableCard}
                    style={{ marginBottom: "1.35rem", border: "1px solid rgba(52,211,153,0.4)" }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.75rem",
                            padding: "0.5rem 0.5rem 1rem 0.5rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? `Live Cartridge Inventory Report (${catalogSkus.length} Installed SKUs)`
                                    : `Báo Cáo Tồn Kho Bình Nước Hoa Thời Gian Thực (${catalogSkus.length} Bình)`}
                            </h3>
                            <span style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Synchronized in real time with Storefront (/), Kiosk (/kiosk), Products (/products), Machines (/machines) & Dashboard (/dashboard)"
                                    : "Đồng bộ thời gian thực 2 chiều với Trang chủ, Kiosk, Sản phẩm, Đội máy & Dashboard"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/inventory")}
                            className={styles.secondaryGoldBtn}
                        >
                            <span>
                                {lang === "en" ? "Open Full Inventory Module" : "Mở Quản Trị Kho Hàng"}
                            </span>
                        </button>
                    </div>

                    <div className={styles.tableScrollContainer} style={{ maxHeight: "340px" }}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>SKU & Slot</th>
                                <th>Fragrance & Maison</th>
                                <th>Installed Station</th>
                                <th>Remaining Volume</th>
                                <th>Spray Price</th>
                                <th>Status</th>
                                {userRole !== "VIEWER" && (
                                    <th style={{ textAlign: "right" }}>Live Actions</th>
                                )}
                            </tr>
                            </thead>
                            <tbody>
                            {catalogSkus
                                .filter(
                                    (s) =>
                                        (selectedBrand === "ALL" ||
                                            isExactMatch(s.brand, selectedBrand)) &&
                                        (selectedKiosk === "ALL" ||
                                            isExactMatch(s.kioskCode, selectedKiosk))
                                )
                                .map((sku) => {
                                    const pct = Math.round(
                                        (sku.remainingVolumeMl / sku.bottleCapacityMl) * 100
                                    );
                                    const isLow = sku.remainingVolumeMl <= 15;
                                    return (
                                        <tr key={`${sku.skuCode}-${sku.slotNumber}`} className={styles.tableRow}>
                                            <td
                                                className={styles.tableCell}
                                                style={{
                                                    fontFamily: "Space Grotesk, monospace",
                                                    color: "#F5E6AD",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {sku.skuCode} ({sku.physicalSlotLabel})
                                            </td>
                                            <td className={styles.tableCell}>
                                                <strong style={{ color: "#FFF" }}>
                                                    {sku.productName}
                                                </strong>
                                                <div style={{ fontSize: "0.72rem", color: "#D4AF37" }}>
                                                    {sku.brand}
                                                </div>
                                            </td>
                                            <td className={styles.tableCell}>
                                                <strong
                                                    style={{
                                                        color: "#FFF",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {sku.kioskCode}
                                                </strong>
                                                <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                                                    {sku.location}
                                                </div>
                                            </td>
                                            <td
                                                className={styles.tableCell}
                                                style={{
                                                    fontFamily: "Space Grotesk, monospace",
                                                    fontWeight: 700,
                                                    color: isLow ? "#F87171" : "#34D399",
                                                }}
                                            >
                                                {sku.remainingVolumeMl}ml / {sku.bottleCapacityMl}ml ({pct}%)
                                            </td>
                                            <td
                                                className={styles.tableCell}
                                                style={{
                                                    fontFamily: "Space Grotesk, monospace",
                                                    color: "#F5E6AD",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {sku.sprayPrice.toLocaleString("vi-VN")} VND
                                            </td>
                                            <td className={styles.tableCell}>
                                                    <span
                                                        className={
                                                            sku.status !== "ACTIVE"
                                                                ? styles.badgeFailed
                                                                : isLow
                                                                    ? styles.badgeWarning
                                                                    : styles.badgeSuccess
                                                        }
                                                    >
                                                        {sku.status !== "ACTIVE"
                                                            ? "INACTIVE"
                                                            : isLow
                                                                ? "LOW STOCK"
                                                                : "OPTIMAL"}
                                                    </span>
                                            </td>
                                            {userRole !== "VIEWER" && (
                                                <td
                                                    className={styles.tableCell}
                                                    style={{ textAlign: "right", whiteSpace: "nowrap" }}
                                                >
                                                    <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleReportInventoryAction(
                                                                    sku,
                                                                    "SPRAY"
                                                                )
                                                            }
                                                            className={styles.badgeSuccess}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <Zap size={11} />
                                                            <span>Spray (-0.12ml)</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleReportInventoryAction(
                                                                    sku,
                                                                    "REFILL"
                                                                )
                                                            }
                                                            className={styles.badgeWarning}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <Droplets size={11} />
                                                            <span>Refill 100%</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB USER ACTIVITY: NHẬT KÝ KIỂM TOÁN HỆ THỐNG THỜI GIAN THỰC */}
            {activeTab === "USER_ACTIVITY" && auditLogs.length > 0 && (
                <div
                    className={styles.tableCard}
                    style={{ marginBottom: "1.35rem", border: "1px solid rgba(212,175,55,0.45)" }}
                >
                    <div style={{ padding: "0.5rem 0.5rem 1rem 0.5rem" }}>
                        <h3 className={styles.cardTitle}>
                            {lang === "en"
                                ? `Real-Time System Audit Trail (${auditLogs.length} Events)`
                                : `Nhật Ký Hoạt Động & Kiểm Toán Thời Gian Thực (${auditLogs.length} Sự Kiện)`}
                        </h3>
                    </div>
                    <div className={styles.tableScrollContainer} style={{ maxHeight: "260px" }}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>Audit ID</th>
                                <th>Timestamp</th>
                                <th>Actor & Role</th>
                                <th>Action</th>
                                <th>Target Entity</th>
                            </tr>
                            </thead>
                            <tbody>
                            {auditLogs.slice(0, 25).map((log, i) => (
                                <tr key={log.id || i} className={styles.tableRow}>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {log.id}
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#94A3B8",
                                        }}
                                    >
                                        {String(log.timestamp || "").replace("T", " ").slice(0, 19)}
                                    </td>
                                    <td className={styles.tableCell}>
                                        <strong style={{ color: "#FFF" }}>{log.actor}</strong> (
                                        <span style={{ color: "#D4AF37" }}>{log.role}</span>)
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#34D399",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {log.action}
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{ fontFamily: "Space Grotesk, monospace" }}
                                    >
                                        {log.entityType} • {log.entityId}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* REVENUE TREND (CHẠY THEO ĐÚNG LỊCH THỰC TẾ) + REVENUE BY BRAND */}
            <div className={styles.analyticsGrid2}>
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            marginBottom: "1rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? `Revenue & Transaction Trend (${formatFullDisplayDate(startDate)} – ${formatFullDisplayDate(endDate)})`
                                    : `Biểu Đồ Doanh Thu Theo Lịch Thực Tế (${formatFullDisplayDate(startDate)} – ${formatFullDisplayDate(endDate)})`}
                            </h3>
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Columns reflect actual calendar dates/weeks and live Kiosk spray transactions"
                                    : "Các cột biểu diễn đúng ngày/tuần thực tế trên lịch và đơn hàng Kiosk trực tuyến"}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                            {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setTrendGrouping(g)}
                                    style={{
                                        background:
                                            trendGrouping === g
                                                ? "rgba(212,175,55,0.22)"
                                                : "rgba(255,255,255,0.04)",
                                        border:
                                            trendGrouping === g
                                                ? "1px solid #D4AF37"
                                                : "1px solid rgba(255,255,255,0.1)",
                                        color: trendGrouping === g ? "#F5E6AD" : "#94A3B8",
                                        padding: "0.3rem 0.65rem",
                                        borderRadius: "8px",
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                        cursor: "pointer",
                                    }}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            height: "195px",
                            display: "grid",
                            gridTemplateColumns: `repeat(${dynamicTrendBars.length}, 1fr)`,
                            gap: "0.65rem",
                            alignItems: "end",
                            paddingTop: "1.5rem",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {dynamicTrendBars.map((bar) => (
                            <div
                                key={bar.label}
                                style={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                }}
                                title={`${bar.label}: ${bar.rev.toLocaleString("vi-VN")} VND (${bar.sp} sprays)`}
                            >
                                <span
                                    style={{
                                        fontSize: "0.66rem",
                                        color: bar.isTodayOrCurrent ? "#34D399" : "#F5E6AD",
                                        fontWeight: bar.isTodayOrCurrent ? 700 : 600,
                                        fontFamily: "Space Grotesk, monospace",
                                        marginBottom: "4px",
                                    }}
                                >
                                    {(bar.rev / 1000).toFixed(0)}k
                                </span>
                                <div
                                    style={{
                                        width: "100%",
                                        height: `${bar.pct}%`,
                                        background: bar.isTodayOrCurrent
                                            ? "linear-gradient(180deg, #34D399 0%, #D4AF37 65%, rgba(52,211,153,0.2) 100%)"
                                            : "linear-gradient(180deg, #F5E6AD 0%, #D4AF37 45%, rgba(212,175,55,0.2) 100%)",
                                        borderRadius: "8px 8px 2px 2px",
                                        boxShadow: "0 4px 15px rgba(212,175,55,0.25)",
                                        transition: "height 0.35s ease",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "0.65rem",
                                        color: bar.isTodayOrCurrent ? "#FFFFFF" : "#94A3B8",
                                        marginTop: "6px",
                                        fontFamily: "Space Grotesk, monospace",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {bar.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue by Brand */}
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.85rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? "Revenue Share by Maison"
                                    : "Tỷ Trọng Doanh Thu Theo Thương Hiệu"}
                            </h3>
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Select a maison below to filter report tables"
                                    : "Chọn một thương hiệu bên dưới để lọc báo cáo"}
                            </span>
                        </div>
                        {selectedBrand !== "ALL" && (
                            <button
                                type="button"
                                onClick={() => setSelectedBrand("ALL")}
                                className={styles.secondaryGoldBtn}
                                style={{ padding: "0.28rem 0.6rem", fontSize: "0.7rem" }}
                            >
                                <span>Clear</span>
                            </button>
                        )}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.6rem",
                            maxHeight: "205px",
                            overflowY: "auto",
                        }}
                    >
                        {revenueByBrandList.slice(0, 8).map((item) => (
                            <div
                                key={item.brand}
                                onClick={() =>
                                    setSelectedBrand(
                                        selectedBrand === item.brand ? "ALL" : item.brand
                                    )
                                }
                                style={{
                                    cursor: "pointer",
                                    padding: "0.48rem 0.65rem",
                                    borderRadius: "10px",
                                    background:
                                        selectedBrand === item.brand
                                            ? "rgba(212,175,55,0.16)"
                                            : "rgba(255,255,255,0.02)",
                                    border:
                                        selectedBrand === item.brand
                                            ? "1px solid #D4AF37"
                                            : "1px solid rgba(255,255,255,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "0.79rem",
                                        marginBottom: "4px",
                                    }}
                                >
                                    <strong style={{ color: "#FFF" }}>{item.brand}</strong>
                                    <span
                                        style={{
                                            color: "#F5E6AD",
                                            fontFamily: "Space Grotesk, monospace",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {item.revenue.toLocaleString("vi-VN")} VND ({item.sharePct}%)
                                    </span>
                                </div>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "5px",
                                        background: "rgba(255,255,255,0.08)",
                                        borderRadius: "999px",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${Math.max(8, item.sharePct * 2.2)}%`,
                                            height: "100%",
                                            background:
                                                "linear-gradient(90deg, #D4AF37, #34D399)",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TOP PERFORMING MACHINES + TOP PERFUME PRODUCTS */}
            <div className={styles.analyticsGridEqual}>
                {/* Top Performing Machines */}
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.85rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? "Top Performing Stations"
                                    : "Xếp Hạng Doanh Thu Trạm Kiosk"}
                            </h3>
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Ranked by recognized revenue • Select a station to filter"
                                    : "Xếp hạng theo doanh thu thực nhận • Chạm vào trạm để lọc"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/machines")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.72rem" }}
                        >
                            <span>{lang === "en" ? "All Stations" : "Mở Đội Máy"}</span>
                        </button>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.55rem",
                            maxHeight: "235px",
                            overflowY: "auto",
                        }}
                    >
                        {topMachinesList.map((m, idx) => (
                            <div
                                key={m.kioskCode}
                                onClick={() =>
                                    setSelectedKiosk(
                                        selectedKiosk === m.kioskCode ? "ALL" : m.kioskCode
                                    )
                                }
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.62rem 0.85rem",
                                    borderRadius: "10px",
                                    background:
                                        selectedKiosk === m.kioskCode
                                            ? "rgba(212,175,55,0.16)"
                                            : "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    cursor: "pointer",
                                }}
                            >
                                <div>
                                    <span
                                        style={{
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                            fontFamily: "Space Grotesk, monospace",
                                            marginRight: "8px",
                                        }}
                                    >
                                        #{idx + 1} {m.kioskCode}
                                    </span>
                                    <span style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                                        {m.location}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        textAlign: "right",
                                        fontFamily: "Space Grotesk, monospace",
                                        fontSize: "0.8rem",
                                    }}
                                >
                                    <strong style={{ color: "#FFF" }}>
                                        {m.revenue.toLocaleString("vi-VN")} VND
                                    </strong>
                                    <span style={{ color: "#34D399", marginLeft: "8px" }}>
                                        ({m.sprays} sprays)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Perfume Products */}
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.85rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? "Top Sampled Fragrances"
                                    : "Mùi Hương Bán Chạy Nhất"}
                            </h3>
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Distinguishes confirmed sprays vs total payment transactions"
                                    : "Phân biệt rõ số lượt xịt thành công và tổng giao dịch"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/products")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.72rem" }}
                        >
                            <span>
                                {lang === "en"
                                    ? `All ${catalogSkus.length} SKUs`
                                    : `Xem ${catalogSkus.length} Mùi`}
                            </span>
                        </button>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.55rem",
                            maxHeight: "235px",
                            overflowY: "auto",
                        }}
                    >
                        {topProductsList.slice(0, 10).map((p, idx) => (
                            <div
                                key={p.productName}
                                onClick={() =>
                                    setSelectedProduct(
                                        selectedProduct === p.productName
                                            ? "ALL"
                                            : p.productName
                                    )
                                }
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.58rem 0.85rem",
                                    borderRadius: "10px",
                                    background:
                                        selectedProduct === p.productName
                                            ? "rgba(212,175,55,0.16)"
                                            : "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    cursor: "pointer",
                                }}
                            >
                                <div>
                                    <strong style={{ color: "#FFF", fontSize: "0.83rem" }}>
                                        #{idx + 1} {p.productName}
                                    </strong>
                                    <div style={{ fontSize: "0.71rem", color: "#D4AF37" }}>
                                        {p.brand}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        textAlign: "right",
                                        fontFamily: "Space Grotesk, monospace",
                                        fontSize: "0.79rem",
                                    }}
                                >
                                    <div style={{ color: "#F5E6AD", fontWeight: 700 }}>
                                        {p.revenue.toLocaleString("vi-VN")} VND
                                    </div>
                                    <div style={{ fontSize: "0.69rem", color: "#34D399" }}>
                                        {p.sprays} Sprays / {p.txCount} Txns
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PAYMENT METHODS, SALES BY LOCATION & DAILY PERFORMANCE HEATMAP */}
            <div className={styles.analyticsGridEqual}>
                {/* Transactions by Payment Method + Sales by Location */}
                <div className={styles.analyticsCard}>
                    <h3 className={styles.cardTitle} style={{ marginBottom: "0.25rem" }}>
                        {lang === "en"
                            ? "Transactions by Payment Gateway & Boutique Location"
                            : "Phân Bổ Theo Cổng Thanh Toán & Địa Điểm Boutique"}
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginBottom: "0.85rem" }}>
                        {lang === "en"
                            ? "Select a payment gateway or boutique venue below to filter the report ledger:"
                            : "Chạm vào cổng thanh toán hoặc địa điểm bên dưới để lọc sổ cái báo cáo:"}
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "0.5rem",
                            marginBottom: "1rem",
                        }}
                    >
                        {paymentBreakdown.map((pm) => (
                            <div
                                key={pm.method}
                                onClick={() =>
                                    setSelectedPayment(
                                        selectedPayment === pm.method ? "ALL" : pm.method
                                    )
                                }
                                style={{
                                    padding: "0.65rem",
                                    borderRadius: "10px",
                                    background:
                                        selectedPayment === pm.method
                                            ? "rgba(212,175,55,0.18)"
                                            : "rgba(255,255,255,0.03)",
                                    border:
                                        selectedPayment === pm.method
                                            ? "1px solid #D4AF37"
                                            : "1px solid rgba(255,255,255,0.08)",
                                    cursor: "pointer",
                                    textAlign: "center",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "0.73rem",
                                        fontWeight: 700,
                                        color: "#D4AF37",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {pm.method}
                                </div>
                                <div
                                    style={{
                                        fontSize: "1.02rem",
                                        fontWeight: 700,
                                        color: "#FFF",
                                        margin: "2px 0",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {pm.pct}%
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                    {pm.count} txns
                                </div>
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.45rem",
                            maxHeight: "155px",
                            overflowY: "auto",
                        }}
                    >
                        {salesByLocation.map((loc) => (
                            <div
                                key={loc.location}
                                onClick={() =>
                                    setSelectedLocation(
                                        selectedLocation === loc.location
                                            ? "ALL"
                                            : loc.location
                                    )
                                }
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "0.45rem 0.65rem",
                                    borderRadius: "8px",
                                    background: "rgba(255,255,255,0.02)",
                                    fontSize: "0.79rem",
                                    cursor: "pointer",
                                }}
                            >
                                <span style={{ color: "#CBD5E1" }}>
                                    <MapPin
                                        size={12}
                                        color="#D4AF37"
                                        style={{ display: "inline", marginRight: "4px" }}
                                    />
                                    {loc.location}
                                </span>
                                <strong
                                    style={{
                                        color: "#34D399",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {loc.revenue.toLocaleString("vi-VN")} VND ({loc.sprays} sp)
                                </strong>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Performance Heatmap & Revenue vs Sprays Correlation */}
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? "Daily Performance Heatmap & Spray Correlation"
                                    : "Biểu Đồ Nhiệt Khung Giờ Cao Điểm & Tương Quan Doanh Thu"}
                            </h3>
                            <span style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Peak sampling intensity by day of week and time slot"
                                    : "Mật độ trải nghiệm mùi hương theo ngày trong tuần và khung giờ"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                setHeatmapMetric(
                                    heatmapMetric === "SPRAYS" ? "TRANSACTIONS" : "SPRAYS"
                                )
                            }
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.3rem 0.65rem", fontSize: "0.7rem" }}
                        >
                            <span>Metric: {heatmapMetric}</span>
                        </button>
                    </div>

                    <div className={styles.heatmapGrid}>
                        <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>Day / Time</div>
                        {["10:00", "12:00", "15:00", "18:00", "20:00", "22:00"].map((slot) => (
                            <div
                                key={slot}
                                style={{
                                    fontSize: "0.68rem",
                                    color: "#94A3B8",
                                    textAlign: "center",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                {slot}
                            </div>
                        ))}

                        {[
                            { day: "Mon–Thu", vals: [14, 22, 19, 31, 38, 21] },
                            { day: "Friday", vals: [18, 28, 26, 44, 52, 34] },
                            {
                                day: "Sat–Sun",
                                vals: [
                                    25,
                                    39,
                                    42,
                                    58,
                                    64 + Math.max(0, filteredReports.length - 34),
                                    41,
                                ],
                            },
                        ].map((row) => (
                            <React.Fragment key={row.day}>
                                <div
                                    style={{
                                        fontSize: "0.74rem",
                                        fontWeight: 700,
                                        color: "#E2E8F0",
                                    }}
                                >
                                    {row.day}
                                </div>
                                {row.vals.map((v, i) => {
                                    const alpha = Math.min(0.88, Math.max(0.15, v / 70));
                                    return (
                                        <div
                                            key={i}
                                            className={styles.heatmapCell}
                                            style={{
                                                background: `rgba(212, 175, 55, ${alpha})`,
                                                color: alpha > 0.5 ? "#050508" : "#F8FAFC",
                                            }}
                                            title={`${row.day} @ Slot #${i + 1}: ${v} ${heatmapMetric.toLowerCase()} (~${(
                                                v * 15
                                            ).toLocaleString()}k VND)`}
                                        >
                                            {v}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                    <p
                        style={{
                            fontSize: "0.72rem",
                            color: "#94A3B8",
                            marginTop: "0.75rem",
                            marginBottom: 0,
                        }}
                    >
                        {lang === "en"
                            ? "Peak evening hours (18:00–21:00) record the highest niche fragrance selection (avg. 18,500 VND / calibrated spray)."
                            : "Khung giờ tối (18:00–21:00) ghi nhận tỷ lệ chọn nước hoa Niche cao nhất (trung bình 18.500đ / lần xịt)."}
                    </p>
                </div>
            </div>

            {/* DETAILED TRANSACTION & DISPENSING LEDGER */}
            <div className={styles.tableCard}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        padding: "0.5rem 0.5rem 1rem 0.5rem",
                    }}
                >
                    <div>
                        <h3 className={styles.cardTitle}>
                            {lang === "en"
                                ? `Detailed Transaction & Dispensing Ledger (${filteredReports.length} Records)`
                                : `Sổ Cái Giao Dịch & Lịch Sử Phun Chi Tiết (${filteredReports.length} Bản Ghi)`}
                        </h3>
                        <span style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                            {lang === "en"
                                ? "Automatically merges real-calendar historical seed with live Kiosk & Dashboard spray orders"
                                : "Tự động hợp nhất dữ liệu theo lịch thực tế với toàn bộ đơn hàng xịt mới từ Kiosk & Dashboard"}
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: "0.8rem",
                            color: "#F5E6AD",
                            fontWeight: 700,
                            fontFamily: "Space Grotesk, monospace",
                        }}
                    >
                        Recognized Revenue: {kpiMetrics.recognizedRevenue.toLocaleString("vi-VN")} VND
                    </span>
                </div>

                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th style={{ width: "130px" }}>Order ID</th>
                            <th style={{ width: "165px" }}>Timestamp</th>
                            <th style={{ width: "165px" }}>Station & Chamber</th>
                            <th style={{ width: "170px" }}>Maison</th>
                            <th style={{ minWidth: "200px" }}>Fragrance Name</th>
                            <th style={{ width: "120px", textAlign: "right" }}>Dose / Gateway</th>
                            <th style={{ width: "145px", textAlign: "right" }}>Recognized Amount</th>
                            <th style={{ width: "130px", textAlign: "center" }}>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredReports.length > 0 ? (
                            filteredReports.map((row, idx) => (
                                <tr key={`${row.id}-${idx}`} className={styles.tableRow}>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {row.id}
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            color: "#94A3B8",
                                            fontSize: "0.79rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {row.timestamp}
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div
                                            style={{
                                                fontFamily: "Space Grotesk, monospace",
                                                fontWeight: 700,
                                                color: "#FFF",
                                            }}
                                        >
                                            {row.kioskCode}
                                        </div>
                                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                                            SLOT {String(row.slotNumber).padStart(2, "0")} •{" "}
                                            {row.location}
                                        </div>
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{ color: "#E2E8F0", fontWeight: 600 }}
                                    >
                                        {row.brand}
                                    </td>
                                    <td className={styles.tableCell}>
                                        <strong style={{ color: "#FFF" }}>
                                            {row.productName}
                                        </strong>
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            textAlign: "right",
                                            color: "#CBD5E1",
                                            fontSize: "0.79rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        <div>{row.volumeMl} ml</div>
                                        <div style={{ fontSize: "0.71rem", color: "#D4AF37" }}>
                                            {row.paymentMethod}
                                        </div>
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            textAlign: "right",
                                            color:
                                                row.status === "DISPENSED" ||
                                                row.status === "PAID"
                                                    ? "#F5E6AD"
                                                    : "#F87171",
                                            fontWeight: 700,
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {row.amountVnd.toLocaleString("vi-VN")} VND
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{ textAlign: "center" }}
                                    >
                                            <span
                                                className={
                                                    row.status === "DISPENSED" ||
                                                    row.status === "PAID"
                                                        ? styles.badgeSuccess
                                                        : row.status === "REFUNDED" ||
                                                        row.status === "UNCERTAIN" ||
                                                        row.status === "PENDING"
                                                            ? styles.badgeWarning
                                                            : styles.badgeFailed
                                                }
                                            >
                                                {row.status === "DISPENSED" ||
                                                row.status === "PAID" ? (
                                                    <CheckCircle2 size={13} />
                                                ) : (
                                                    <AlertCircle size={13} />
                                                )}
                                                <span>{row.status}</span>
                                            </span>
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
                                        ? "No matching dispensing reports found for the selected calendar range or filter criteria."
                                        : "Không tìm thấy bản ghi báo cáo nào trong khoảng lịch hoặc bộ lọc đã chọn."}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

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