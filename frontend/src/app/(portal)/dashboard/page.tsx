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
    { slotNumber: 1, skuCode: "SKU-ARM-01", brand: "Giorgio Armani", product: "Acqua Di Gio", sprayPrice: 12000, retail10ml: 360000, fullBottlePrice: 3200000, bottleCapacityMl: 100, remainingVolumeMl: 78.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 01", location: "Saigon Centre Takashimaya Flagship, HCMC", remainingStockPct: 78, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 2, skuCode: "SKU-ARM-02", brand: "Giorgio Armani", product: "Acqua Di Gio Profondo", sprayPrice: 14000, retail10ml: 420000, fullBottlePrice: 3650000, bottleCapacityMl: 100, remainingVolumeMl: 64.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 02", location: "Saigon Centre Takashimaya Flagship, HCMC", remainingStockPct: 64, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 3, skuCode: "SKU-CHA-03", brand: "Chanel", product: "Bleu de Chanel", sprayPrice: 15000, retail10ml: 450000, fullBottlePrice: 4250000, bottleCapacityMl: 100, remainingVolumeMl: 12.5, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 03", location: "Saigon Centre Takashimaya Flagship, HCMC", remainingStockPct: 13, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 4, skuCode: "SKU-CHA-04", brand: "Chanel", product: "Coco Mademoiselle", sprayPrice: 15500, retail10ml: 465000, fullBottlePrice: 4400000, bottleCapacityMl: 100, remainingVolumeMl: 82.0, kioskId: "KIOSK-SGN-02", physicalSlotLabel: "Slot 01", location: "Vincom Center Dong Khoi, HCMC", remainingStockPct: 82, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 5, skuCode: "SKU-BUR-05", brand: "Burberry", product: "Burberry Goddess", sprayPrice: 13000, retail10ml: 390000, fullBottlePrice: 3500000, bottleCapacityMl: 100, remainingVolumeMl: 71.0, kioskId: "KIOSK-SGN-02", physicalSlotLabel: "Slot 02", location: "Vincom Center Dong Khoi, HCMC", remainingStockPct: 71, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 6, skuCode: "SKU-BUR-06", brand: "Burberry", product: "Burberry Her", sprayPrice: 12500, retail10ml: 375000, fullBottlePrice: 3350000, bottleCapacityMl: 100, remainingVolumeMl: 55.0, kioskId: "KIOSK-HN-01", physicalSlotLabel: "Slot 01", location: "Lotte Center West Lake Lounge, Hanoi", remainingStockPct: 55, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 7, skuCode: "SKU-CH-07", brand: "Carolina Herrera", product: "Carolina Herrera Good Girl", sprayPrice: 13500, retail10ml: 405000, fullBottlePrice: 3450000, bottleCapacityMl: 80, remainingVolumeMl: 54.0, kioskId: "KIOSK-HN-01", physicalSlotLabel: "Slot 02", location: "Lotte Center West Lake Lounge, Hanoi", remainingStockPct: 68, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 8, skuCode: "SKU-ARMF-08", brand: "Armaf", product: "Club de Nuit Intense Man", sprayPrice: 10000, retail10ml: 300000, fullBottlePrice: 1650000, bottleCapacityMl: 105, remainingVolumeMl: 92.0, kioskId: "KIOSK-DAD-01", physicalSlotLabel: "Slot 01", location: "IndoChina Riverside Mall Lobby, Da Nang", remainingStockPct: 88, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 9, skuCode: "SKU-CRD-09", brand: "Creed", product: "Creed Aventus", sprayPrice: 20000, retail10ml: 600000, fullBottlePrice: 7800000, bottleCapacityMl: 100, remainingVolumeMl: 11.5, kioskId: "demo-device", physicalSlotLabel: "Slot 01", location: "Diamond Plaza Luxury Atrium, HCMC", remainingStockPct: 12, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 10, skuCode: "SKU-DIO-10", brand: "Dior", product: "Dior Sauvage", sprayPrice: 14500, retail10ml: 435000, fullBottlePrice: 3950000, bottleCapacityMl: 100, remainingVolumeMl: 84.0, kioskId: "KIOSK-HN-01", physicalSlotLabel: "Slot 03", location: "Lotte Center West Lake Lounge, Hanoi", remainingStockPct: 84, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 11, skuCode: "SKU-DIO-11", brand: "Dior", product: "Miss Dior Blooming Bouquet", sprayPrice: 13500, retail10ml: 405000, fullBottlePrice: 3600000, bottleCapacityMl: 100, remainingVolumeMl: 76.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 04", location: "Saigon Centre Takashimaya Flagship, HCMC", remainingStockPct: 76, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 12, skuCode: "SKU-JPG-12", brand: "Jean Paul Gaultier", product: "Jean Paul Gaultier Le Male", sprayPrice: 13000, retail10ml: 390000, fullBottlePrice: 3300000, bottleCapacityMl: 125, remainingVolumeMl: 77.0, kioskId: "KIOSK-SGN-02", physicalSlotLabel: "Slot 03", location: "Vincom Center Dong Khoi, HCMC", remainingStockPct: 62, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 13, skuCode: "SKU-JPG-13", brand: "Jean Paul Gaultier", product: "Jean Paul Gaultier Scandal", sprayPrice: 13500, retail10ml: 405000, fullBottlePrice: 3450000, bottleCapacityMl: 80, remainingVolumeMl: 47.0, kioskId: "KIOSK-SGN-02", physicalSlotLabel: "Slot 01", location: "Vincom Center Dong Khoi, HCMC", remainingStockPct: 59, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 14, skuCode: "SKU-LLB-14", brand: "Le Labo", product: "Le Labo Another 13", sprayPrice: 18000, retail10ml: 540000, fullBottlePrice: 6500000, bottleCapacityMl: 100, remainingVolumeMl: 13.5, kioskId: "demo-device", physicalSlotLabel: "Slot 02", location: "Diamond Plaza Luxury Atrium, HCMC", remainingStockPct: 14, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 15, skuCode: "SKU-LLB-15", brand: "Le Labo", product: "Le Labo Santal 33", sprayPrice: 18500, retail10ml: 555000, fullBottlePrice: 6600000, bottleCapacityMl: 100, remainingVolumeMl: 73.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 03", location: "Saigon Centre Takashimaya Flagship, HCMC", remainingStockPct: 73, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 16, skuCode: "SKU-MMG-16", brand: "Maison Margiela", product: "Replica By the Fireplace", sprayPrice: 14500, retail10ml: 435000, fullBottlePrice: 3650000, bottleCapacityMl: 100, remainingVolumeMl: 80.0, kioskId: "KIOSK-HN-02", physicalSlotLabel: "Slot 01", location: "Trang Tien Plaza Luxury Wing, Hanoi", remainingStockPct: 80, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 17, skuCode: "SKU-MMG-17", brand: "Maison Margiela", product: "Replica Jazz Club", sprayPrice: 14500, retail10ml: 435000, fullBottlePrice: 3650000, bottleCapacityMl: 100, remainingVolumeMl: 67.0, kioskId: "KIOSK-HN-02", physicalSlotLabel: "Slot 02", location: "Trang Tien Plaza Luxury Wing, Hanoi", remainingStockPct: 67, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 18, skuCode: "SKU-MCM-18", brand: "MCM Worldwide", product: "MCM Eau de Parfum", sprayPrice: 12000, retail10ml: 360000, fullBottlePrice: 2650000, bottleCapacityMl: 75, remainingVolumeMl: 66.0, kioskId: "KIOSK-DAD-01", physicalSlotLabel: "Slot 02", location: "IndoChina Riverside Mall Lobby, Da Nang", remainingStockPct: 88, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 19, skuCode: "SKU-MFK-19", brand: "Maison Francis Kurkdjian", product: "MFK Baccarat Rouge 540", sprayPrice: 21000, retail10ml: 630000, fullBottlePrice: 7900000, bottleCapacityMl: 70, remainingVolumeMl: 9.0, kioskId: "demo-device", physicalSlotLabel: "Slot 04", location: "Diamond Plaza Luxury Atrium, HCMC", remainingStockPct: 13, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 20, skuCode: "SKU-MTB-20", brand: "Montblanc", product: "Montblanc Explorer", sprayPrice: 11500, retail10ml: 345000, fullBottlePrice: 2350000, bottleCapacityMl: 100, remainingVolumeMl: 79.0, kioskId: "KIOSK-SGN-03", physicalSlotLabel: "Slot 01", location: "Crescent Mall Luxury Wing, HCMC", remainingStockPct: 79, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 21, skuCode: "SKU-MTB-21", brand: "Montblanc", product: "Montblanc Legend", sprayPrice: 11000, retail10ml: 330000, fullBottlePrice: 2200000, bottleCapacityMl: 100, remainingVolumeMl: 85.0, kioskId: "KIOSK-SGN-03", physicalSlotLabel: "Slot 02", location: "Crescent Mall Luxury Wing, HCMC", remainingStockPct: 85, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 22, skuCode: "SKU-NAR-22", brand: "Narciso Rodriguez", product: "Narciso Rodriguez For Her EDP", sprayPrice: 13000, retail10ml: 390000, fullBottlePrice: 3350000, bottleCapacityMl: 100, remainingVolumeMl: 61.0, kioskId: "KIOSK-HN-01", physicalSlotLabel: "Slot 04", location: "Lotte Center West Lake Lounge, Hanoi", remainingStockPct: 61, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 23, skuCode: "SKU-NAR-23", brand: "Narciso Rodriguez", product: "Narciso Rodriguez Pure Musc", sprayPrice: 13500, retail10ml: 405000, fullBottlePrice: 3450000, bottleCapacityMl: 100, remainingVolumeMl: 74.0, kioskId: "KIOSK-HN-02", physicalSlotLabel: "Slot 03", location: "Trang Tien Plaza Luxury Wing, Hanoi", remainingStockPct: 74, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 24, skuCode: "SKU-PRB-24", brand: "Paco Rabanne", product: "Paco Rabanne 1 Million", sprayPrice: 12500, retail10ml: 375000, fullBottlePrice: 2850000, bottleCapacityMl: 100, remainingVolumeMl: 66.0, kioskId: "KIOSK-SGN-02", physicalSlotLabel: "Slot 04", location: "Vincom Center Dong Khoi, HCMC", remainingStockPct: 66, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 25, skuCode: "SKU-PRB-25", brand: "Paco Rabanne", product: "Paco Rabanne Invictus", sprayPrice: 12500, retail10ml: 375000, fullBottlePrice: 2800000, bottleCapacityMl: 100, remainingVolumeMl: 72.0, kioskId: "KIOSK-DAD-01", physicalSlotLabel: "Slot 03", location: "IndoChina Riverside Mall Lobby, Da Nang", remainingStockPct: 72, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 26, skuCode: "SKU-PDM-26", brand: "Parfums de Marly", product: "Parfums de Marly Sedley", sprayPrice: 18500, retail10ml: 555000, fullBottlePrice: 6400000, bottleCapacityMl: 125, remainingVolumeMl: 68.0, kioskId: "demo-device", physicalSlotLabel: "Slot 03", location: "Diamond Plaza Luxury Atrium, HCMC", remainingStockPct: 54, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 27, skuCode: "SKU-ROJ-27", brand: "Roja Parfums", product: "Roja Parfums Elysium", sprayPrice: 22000, retail10ml: 660000, fullBottlePrice: 7600000, bottleCapacityMl: 100, remainingVolumeMl: 11.0, kioskId: "KIOSK-SGN-03", physicalSlotLabel: "Slot 04", location: "Crescent Mall Luxury Wing, HCMC", remainingStockPct: 11, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 28, skuCode: "SKU-TF-28", brand: "Tom Ford", product: "Tom Ford Black Orchid", sprayPrice: 16000, retail10ml: 480000, fullBottlePrice: 4350000, bottleCapacityMl: 100, remainingVolumeMl: 48.0, kioskId: "KIOSK-HN-02", physicalSlotLabel: "Slot 04", location: "Trang Tien Plaza Luxury Wing, Hanoi", remainingStockPct: 48, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 29, skuCode: "SKU-VAL-29", brand: "Valentino", product: "Valentino Born in Roma", sprayPrice: 13000, retail10ml: 390000, fullBottlePrice: 3400000, bottleCapacityMl: 100, remainingVolumeMl: 81.0, kioskId: "KIOSK-SGN-03", physicalSlotLabel: "Slot 03", location: "Crescent Mall Luxury Wing, HCMC", remainingStockPct: 81, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 30, skuCode: "SKU-VER-30", brand: "Versace", product: "Versace Bright Crystal", sprayPrice: 11500, retail10ml: 345000, fullBottlePrice: 2450000, bottleCapacityMl: 90, remainingVolumeMl: 62.0, kioskId: "KIOSK-004", physicalSlotLabel: "Slot 03", location: "Aeon Mall Tan Phu Celadon, HCMC", remainingStockPct: 69, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 31, skuCode: "SKU-VER-31", brand: "Versace", product: "Versace Dylan Blue", sprayPrice: 12000, retail10ml: 360000, fullBottlePrice: 2550000, bottleCapacityMl: 100, remainingVolumeMl: 77.0, kioskId: "KIOSK-DAD-01", physicalSlotLabel: "Slot 04", location: "IndoChina Riverside Mall Lobby, Da Nang", remainingStockPct: 77, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 32, skuCode: "SKU-VER-32", brand: "Versace", product: "Versace Eros", sprayPrice: 12500, retail10ml: 375000, fullBottlePrice: 2700000, bottleCapacityMl: 100, remainingVolumeMl: 83.0, kioskId: "KIOSK-SGN-02", physicalSlotLabel: "Slot 04", location: "Vincom Center Dong Khoi, HCMC", remainingStockPct: 83, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 33, skuCode: "SKU-YSL-33", brand: "Yves Saint Laurent", product: "YSL Libre Eau de Parfum", sprayPrice: 14000, retail10ml: 420000, fullBottlePrice: 3750000, bottleCapacityMl: 90, remainingVolumeMl: 14.0, kioskId: "KIOSK-SGN-01", physicalSlotLabel: "Slot 04", location: "Saigon Centre Takashimaya Flagship, HCMC", remainingStockPct: 16, thresholdPct: 15, status: "ACTIVE" },
    { slotNumber: 34, skuCode: "SKU-YSL-34", brand: "Yves Saint Laurent", product: "YSL Y Eau de Parfum", sprayPrice: 14000, retail10ml: 420000, fullBottlePrice: 3700000, bottleCapacityMl: 100, remainingVolumeMl: 63.0, kioskId: "KIOSK-HN-01", physicalSlotLabel: "Slot 04", location: "Lotte Center West Lake Lounge, Hanoi", remainingStockPct: 63, thresholdPct: 15, status: "INACTIVE" },
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
    timestamp:
        index < 10
            ? `Today, ${10 + (index % 8)}:${String(12 + index).padStart(2, "0")}`
            : index < 22
                ? `${(index % 6) + 1} days ago`
                : `${(index % 18) + 8} days ago`,
    status: "DISPENSED",
    dateType: index < 10 ? "TODAY" : index < 22 ? "7D" : "30D",
}));

const INITIAL_FLEET_MACHINES: MachineFleetUnit[] = [
    { id: "demo-device", name: "Diamond Plaza Luxury Atrium", location: "34 Le Duan, District 1, HCMC", coords: "10.7801, 106.6983", status: "ONLINE", temp: "21.2°C", slotsReady: "4/4 Chambers", lastSeen: "Live (2s ago)" },
    { id: "KIOSK-SGN-01", name: "Saigon Centre Takashimaya Flagship", location: "65 Le Loi, District 1, HCMC", coords: "10.7731, 106.7012", status: "ONLINE", temp: "21.4°C", slotsReady: "4/4 Chambers", lastSeen: "Live (4s ago)" },
    { id: "KIOSK-SGN-02", name: "Vincom Center Dong Khoi", location: "72 Le Thanh Ton, District 1, HCMC", coords: "10.7780, 106.7018", status: "ONLINE", temp: "21.8°C", slotsReady: "4/4 Chambers", lastSeen: "Live (5s ago)" },
    { id: "KIOSK-SGN-03", name: "Crescent Mall Luxury Wing", location: "101 Ton Dat Tien, District 7, HCMC", coords: "10.7289, 106.7180", status: "ONLINE", temp: "21.6°C", slotsReady: "4/4 Chambers", lastSeen: "Live (3s ago)" },
    { id: "KIOSK-HN-01", name: "Lotte Center West Lake Lounge", location: "272 Vo Chi Cong, Tay Ho, Hanoi", coords: "21.0754, 105.8115", status: "ONLINE", temp: "22.0°C", slotsReady: "4/4 Chambers", lastSeen: "Live (3s ago)" },
    { id: "KIOSK-HN-02", name: "Trang Tien Plaza Luxury Wing", location: "24 Hai Ba Trung, Hoan Kiem, Hanoi", coords: "21.0245, 105.8535", status: "MAINTENANCE", temp: "23.1°C", slotsReady: "0/4 Chambers", lastSeen: "18m ago" },
    { id: "KIOSK-DAD-01", name: "IndoChina Riverside Mall Lobby", location: "74 Bach Dang, Hai Chau, Da Nang", coords: "16.0680, 108.2245", status: "ONLINE", temp: "21.9°C", slotsReady: "4/4 Chambers", lastSeen: "Live (6s ago)" },
    { id: "KIOSK-004", name: "Aeon Mall Tan Phu Celadon", location: "30 Bo Bao Tan Thang, Tan Phu, HCMC", coords: "10.8016, 106.6174", status: "OFFLINE", temp: "24.0°C", slotsReady: "0/4 Chambers", lastSeen: "2h ago" },
];

const INITIAL_ALERTS_LIST: AlertIncidentItem[] = [
    { id: "ALT-8901", kiosk: "KIOSK-004", location: "Aeon Mall Tan Phu, HCMC", type: "MQTT_HEARTBEAT_TIMEOUT", cause: "Primary fiber link disconnected for > 10 minutes.", recommendation: "Verify router power or trigger remote MQTT Reboot.", severity: "CRITICAL", time: "12 mins ago" },
    { id: "ALT-8902", kiosk: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya, HCMC", type: "LOW_STOCK_SLOT_03", cause: "Bleu de Chanel cartridge dropped to 12.5ml (below 15ml threshold).", recommendation: "Dispatch Inventory Staff to replenish Slot 03.", severity: "HIGH", time: "28 mins ago" },
    { id: "ALT-8903", kiosk: "demo-device", location: "Diamond Plaza D1, HCMC", type: "LOW_STOCK_SLOT_04", cause: "MFK Baccarat Rouge 540 volume at 9.0ml (13%) remaining.", recommendation: "Schedule cartridge replacement task in Refill module.", severity: "WARNING", time: "45 mins ago" },
];

const INITIAL_MAINTENANCE_TICKETS: MaintenanceTicketItem[] = [
    { id: "MNT-2026-409", kiosk: "KIOSK-HN-02", issue: "Nozzle Actuator Calibration", status: "IN_PROGRESS", technician: "Nguyễn Hoàng Nam", progress: 70 },
    { id: "MNT-2026-410", kiosk: "KIOSK-004", issue: "5G Failover Modem Inspection", status: "OPEN", technician: "Phạm Bảo Ngọc", progress: 20 },
    { id: "MNT-2026-402", kiosk: "KIOSK-SGN-01", issue: "Preventive Chamber Seal Check", status: "COMPLETED", technician: "Lê Minh Khôi", progress: 100 },
];

const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

function normalizeTransactionRecord(rawTx: any, index: number): Transaction {
    const rawStatus = String(rawTx.status || "DISPENSED").toUpperCase();
    const validStatus: Transaction["status"] =
        rawStatus === "FAILED"
            ? "FAILED"
            : rawStatus === "UNCERTAIN"
                ? "UNCERTAIN"
                : rawStatus === "REFUNDED"
                    ? "REFUNDED"
                    : rawStatus === "CANCELLED"
                        ? "CANCELLED"
                        : rawStatus === "EXPIRED"
                            ? "EXPIRED"
                            : rawStatus === "PENDING"
                                ? "PENDING"
                                : rawStatus === "PAID"
                                    ? "PAID"
                                    : "DISPENSED";

    const timeLabel = rawTx.timestamp || rawTx.time || "Just now";
    const inferredDateType: Transaction["dateType"] =
        rawTx.dateType ||
        (String(timeLabel).toLowerCase().includes("just now") ||
        String(timeLabel).toLowerCase().includes("today") ||
        String(timeLabel).toLowerCase().includes("completed")
            ? "TODAY"
            : "30D");

    const catalogMatch = INITIAL_MASTER_CATALOG.find(
        (c) =>
            c.product.toLowerCase() ===
            String(rawTx.product || rawTx.productName || "").trim().toLowerCase() ||
            c.slotNumber === Number(rawTx.slotNumber)
    );

    const effectivePrice = Number(
        rawTx.priceSnapshot ??
        rawTx.amount ??
        rawTx.paidAmount ??
        rawTx.amountVnd ??
        catalogMatch?.sprayPrice ??
        15000
    );

    return {
        id: String(rawTx.id || `ORD-2026-${9100 + index}`),
        kiosk: rawTx.kiosk || rawTx.kioskCode || catalogMatch?.kioskId || "demo-device",
        location: rawTx.location || catalogMatch?.location || "Flagship Atrium, HCMC",
        brand: rawTx.brand || catalogMatch?.brand || "Luxury Maison",
        product: rawTx.product || rawTx.productName || catalogMatch?.product || "Signature Scent",
        slotNumber: Number(rawTx.slotNumber || catalogMatch?.slotNumber || 1),
        amount:
            validStatus === "DISPENSED" || validStatus === "PAID" ? effectivePrice : 0,
        volumeDeductedMl:
            validStatus === "DISPENSED" ? Number(rawTx.volumeDeductedMl ?? 0.12) : 0,
        paymentMethod: rawTx.paymentMethod || "VIETQR",
        timestamp: timeLabel,
        status: validStatus,
        dateType: inferredDateType,
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const nextSequenceRef = useRef<number>(9250);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [userRole, setUserRole] = useState<"VIEWER" | "OPS_MANAGER">("OPS_MANAGER");
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
    const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicketItem[]>(
        INITIAL_MAINTENANCE_TICKETS
    );

    const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(false);
    const [isUpdatingLive, setIsUpdatingLive] = useState(false);
    const [lastAddedSpray, setLastAddedSpray] = useState<{
        id: string;
        product: string;
        brand: string;
        kiosk: string;
        amount: number;
        remainingMl: number;
    } | null>(null);
    const [successRate, setSuccessRate] = useState(99.6);
    const [toastBanner, setToastBanner] = useState<string | null>(null);

    const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
    const [selectedAlertDetail, setSelectedAlertDetail] = useState<AlertIncidentItem | null>(null);
    const [selectedMapMachineId, setSelectedMapMachineId] = useState<string>("demo-device");

    // STATE CHO HỘP THOẠI CHỌN TRẠM & CHỌN MÙI HƯƠNG KHI BẤM "+1 LIVE SPRAY"
    const [isSprayModalOpen, setIsSprayModalOpen] = useState<boolean>(false);
    const [sprayModalKioskId, setSprayModalKioskId] = useState<string>("ALL_ONLINE");
    const [sprayModalSlotNum, setSprayModalSlotNum] = useState<number>(9); // Mặc định Creed Aventus (Slot 9)
    const [sprayModalGateway, setSprayModalGateway] = useState<"VIETQR" | "MOMO" | "VNPAY">("VIETQR");
    const [isSprayPerfumeMenuOpen, setIsSprayPerfumeMenuOpen] = useState<boolean>(false);

    const showToast = useCallback((msg: string) => {
        setToastBanner(msg);
        setTimeout(() => setToastBanner(null), 4200);
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

    /* --- 1. ĐỒNG BỘ 2 CHIỀU TOÀN DIỆN VỚI MÀN 1, 2, 4, 5, 6, 7 (KHÔNG BỎ SÓT BẤT KỲ KHO NÀO) --- */
    const loadAndReconcileAllStores = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            // A. Đọc thông tin Role từ phiên đăng nhập (/login)
            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                const roleCode = parsedUser.roleCode || parsedUser.role || parsedUser.roles?.[0] || "PSA";
                if (roleCode === "VW" || roleCode === "VIEWER") {
                    setUserRole("VIEWER");
                } else {
                    setUserRole("OPS_MANAGER");
                }
                if (roleCode === "BA" && parsedUser.brandScope) {
                    setSelectedBrand(parsedUser.brandScope);
                }
            }

            // B. Đọc KIOSK_PER_UNIT_STOCK_KEY (Ma trận tồn kho từng máy dùng chung với Màn 1, 4, 5, 6, 7)
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            // C. Đọc MACHINES_STORAGE_KEY trước để lấy trạng thái máy & cấu hình 4 khoang vật lý mới nhất từ Màn 6 & Màn 7
            let nextMachines: MachineFleetUnit[] = [...INITIAL_FLEET_MACHINES];
            const machineSlotVolumeLookup = new Map<
                string,
                {
                    kioskId: string;
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
                    nextMachines = parsedFleet.map((fm: any) => {
                        const code = String(fm.code || fm.id || "demo-device");
                        const seedMatch = INITIAL_FLEET_MACHINES.find(
                            (im) => im.id.toLowerCase() === code.toLowerCase()
                        );
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
                                const fName = String(sl.fragranceName || "").trim().toLowerCase();
                                if (fName) {
                                    machineSlotVolumeLookup.set(fName, {
                                        kioskId: code,
                                        location: fm.locationName || seedMatch?.name || code,
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

                        const readySlotsCount =
                            unifiedStatus !== "ONLINE"
                                ? 0
                                : Array.isArray(fm.slots)
                                    ? fm.slots.filter(
                                        (s: any) =>
                                            Number(s.remainingMl ?? 100) >= 0.12 &&
                                            (!s.productStatus || s.productStatus === "ACTIVE") &&
                                            s.slotEnabled !== false
                                    ).length
                                    : Number(fm.activeSlots ?? 4);

                        const coordStr = fm.coordinates
                            ? `${fm.coordinates.lat.replace(/[^0-9.-]/g, "")}, ${fm.coordinates.lng.replace(/[^0-9.-]/g, "")}`
                            : seedMatch?.coords || "10.7801, 106.6983";

                        return {
                            id: code,
                            name: fm.locationName || seedMatch?.name || code,
                            location: fm.address || seedMatch?.location || "Ho Chi Minh City",
                            coords: coordStr,
                            status: unifiedStatus,
                            temp: fm.chamberTemp || seedMatch?.temp || "21.4°C",
                            slotsReady: `${readySlotsCount}/4 Chambers`,
                            lastSeen: fm.lastActivity || seedMatch?.lastSeen || "Live",
                        };
                    });
                }
            }

            // D. Đọc PRODUCTS_STORAGE_KEY (/products) kết hợp với machineSlotVolumeLookup & perKioskMatrix
            let nextCatalog: CatalogPerfumeItem[] = [...INITIAL_MASTER_CATALOG];
            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds) && parsedProds.length > 0) {
                    nextCatalog = parsedProds.map((p: any, idx: number) => {
                        const pKey = String(p.name || "").trim().toLowerCase();
                        const fromMachineSlot = machineSlotVolumeLookup.get(pKey);
                        const primaryAssigned =
                            Array.isArray(p.assignedMachines) && p.assignedMachines.length > 0
                                ? p.assignedMachines[0]
                                : null;

                        const kCode =
                            fromMachineSlot?.kioskId ||
                            primaryAssigned?.kioskCode ||
                            "demo-device";
                        const kLower = kCode.toLowerCase();
                        const capMl = Number(
                            p.bottleVolumeMl || fromMachineSlot?.capacityMl || 100
                        );
                        const matrixMl = perKioskMatrix[kLower]?.[pKey];
                        const remMl =
                            typeof matrixMl === "number"
                                ? matrixMl
                                : typeof fromMachineSlot?.remainingMl === "number"
                                    ? fromMachineSlot.remainingMl
                                    : Number(primaryAssigned?.remainingVolumeMl ?? capMl);

                        const price = Number(
                            p.pricePerSpray || fromMachineSlot?.pricePerSpray || 15000
                        );

                        return {
                            slotNumber: Number(p.slotNumber || idx + 1),
                            skuCode: p.skuCode || `SKU-NEW-${idx + 1}`,
                            brand: p.brand || "Luxury Maison",
                            product: p.name || "Signature Scent",
                            sprayPrice: price,
                            retail10ml: price * 30,
                            fullBottlePrice: Number(p.fullBottlePrice || price * 240),
                            bottleCapacityMl: capMl,
                            remainingVolumeMl: Number(Math.max(0, remMl).toFixed(2)),
                            kioskId: kCode,
                            physicalSlotLabel:
                                fromMachineSlot?.slotLabel ||
                                primaryAssigned?.physicalSlotLabel ||
                                "Slot 01",
                            location:
                                fromMachineSlot?.location ||
                                primaryAssigned?.location ||
                                "Diamond Plaza Luxury Atrium, HCMC",
                            remainingStockPct: Math.max(0, Math.round((remMl / capMl) * 100)),
                            thresholdPct: 15,
                            status: p.status || fromMachineSlot?.status || "ACTIVE",
                        };
                    });
                }
            } else {
                nextCatalog = nextCatalog.map((item) => {
                    const pKey = item.product.trim().toLowerCase();
                    const fromMachineSlot = machineSlotVolumeLookup.get(pKey);
                    const kCode = fromMachineSlot?.kioskId || item.kioskId;
                    const kLower = kCode.toLowerCase();
                    const matrixMl = perKioskMatrix[kLower]?.[pKey];
                    const remMl =
                        typeof matrixMl === "number"
                            ? matrixMl
                            : typeof fromMachineSlot?.remainingMl === "number"
                                ? fromMachineSlot.remainingMl
                                : item.remainingVolumeMl;
                    const price = fromMachineSlot?.pricePerSpray || item.sprayPrice;

                    return {
                        ...item,
                        kioskId: kCode,
                        location: fromMachineSlot?.location || item.location,
                        physicalSlotLabel:
                            fromMachineSlot?.slotLabel || item.physicalSlotLabel,
                        sprayPrice: price,
                        remainingVolumeMl: Number(Math.max(0, remMl).toFixed(2)),
                        remainingStockPct: Math.max(
                            0,
                            Math.round((remMl / item.bottleCapacityMl) * 100)
                        ),
                        status: fromMachineSlot?.status || item.status || "ACTIVE",
                    };
                });
            }

            // E. Đọc DASHBOARD_STORAGE_KEY — Hợp nhất các đơn hàng thật vừa phát sinh từ Màn 1, 4, 5, 6, 7 với 34 đơn Seed
            let nextTxs: Transaction[] = [...INITIAL_SEED_TRANSACTIONS];
            let nextAlerts: AlertIncidentItem[] = [...INITIAL_ALERTS_LIST];

            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            if (rawDash) {
                const parsedDash = JSON.parse(rawDash);
                if (Array.isArray(parsedDash.transactions) && parsedDash.transactions.length > 0) {
                    const normalizedLive = parsedDash.transactions.map((t: any, idx: number) =>
                        normalizeTransactionRecord(t, idx)
                    );
                    const existingIds = new Set(normalizedLive.map((t: Transaction) => t.id));
                    const missingSeeds = INITIAL_SEED_TRANSACTIONS.filter(
                        (s) => !existingIds.has(s.id)
                    );
                    nextTxs = [...normalizedLive, ...missingSeeds];
                }
                if (Array.isArray(parsedDash.alerts) && parsedDash.alerts.length > 0) {
                    const openDynamicAlerts: AlertIncidentItem[] = parsedDash.alerts
                        .filter((a: any) => a && a.status !== "RESOLVED")
                        .map((a: any, idx: number) => ({
                            id: String(a.id || `ALT-89${10 + idx}`),
                            kiosk: String(a.kiosk || a.machineId || "demo-device"),
                            location: String(a.location || "Boutique Station"),
                            type: String(a.type || a.alertType || "LOW_STOCK"),
                            cause: String(a.cause || a.description || "Cartridge below threshold."),
                            recommendation: String(
                                a.recommendation || "Replenish cartridge or verify station."
                            ),
                            severity:
                                a.severity === "CRITICAL"
                                    ? "CRITICAL"
                                    : a.severity === "HIGH"
                                        ? "HIGH"
                                        : "WARNING",
                            time: String(a.time || "Just now"),
                        }));
                    if (openDynamicAlerts.length > 0) {
                        nextAlerts = openDynamicAlerts;
                    }
                }
            }

            const onlineKioskSet = new Set(
                nextMachines.filter((m) => m.status === "ONLINE").map((m) => m.id.toLowerCase())
            );
            nextAlerts = nextAlerts.filter(
                (a) =>
                    !(
                        a.type === "MQTT_HEARTBEAT_TIMEOUT" &&
                        onlineKioskSet.has(a.kiosk.toLowerCase())
                    )
            );

            setCatalogStock(nextCatalog);
            setMachines(nextMachines);
            setTransactions(nextTxs);
            setAlerts(nextAlerts);
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadAndReconcileAllStores();

        const handleCrossTabSync = () => {
            loadAndReconcileAllStores();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileAllStores();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileAllStores]);

    /* --- 2. ĐỒNG BỘ NGƯỢC TỪ DASHBOARD SANG TẤT CẢ 7 MÀN HÌNH KIA --- */
    const propagateStockAndMachineToOtherStores = useCallback(
        (
            updatedCatalog: CatalogPerfumeItem[],
            updatedMachines: MachineFleetUnit[],
            sprayedItem?: CatalogPerfumeItem,
            newTxRecord?: Transaction,
            replenishedSlotNumber?: number
        ) => {
            try {
                // 1. Đồng bộ KIOSK_PER_UNIT_STOCK_KEY
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                    ? JSON.parse(rawMatrix)
                    : {};

                updatedCatalog.forEach((c) => {
                    const kKey = c.kioskId.toLowerCase();
                    const pKey = c.product.trim().toLowerCase();
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    perKioskMatrix[kKey][pKey] = Number(c.remainingVolumeMl);
                });
                localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                // 2. Đồng bộ MACHINES_STORAGE_KEY
                const rawFleet = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawFleet) {
                    const parsedFleet = JSON.parse(rawFleet);
                    if (Array.isArray(parsedFleet)) {
                        const syncedFleet = parsedFleet.map((fm: any) => {
                            const fCodeLower = String(fm.code || fm.id || "").toLowerCase();
                            const dashM = updatedMachines.find(
                                (m) => m.id.toLowerCase() === fCodeLower
                            );
                            const nextStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" = dashM
                                ? dashM.status
                                : fm.status;
                            const nextConn: "ONLINE" | "OFFLINE" =
                                nextStatus === "OFFLINE" ? "OFFLINE" : "ONLINE";
                            const nextOper =
                                nextStatus === "OFFLINE"
                                    ? "ERROR"
                                    : nextStatus === "MAINTENANCE"
                                        ? "MAINTENANCE"
                                        : "ACTIVE";

                            const gotSprayed =
                                sprayedItem &&
                                sprayedItem.kioskId.toLowerCase() === fCodeLower;

                            return {
                                ...fm,
                                status: nextStatus,
                                connectionStatus: nextConn,
                                operatingStatus: nextOper,
                                manualAdminOverride: true,
                                activeSlots: nextStatus === "ONLINE" ? 4 : 0,
                                todaySprays: gotSprayed
                                    ? (fm.todaySprays || 0) + 1
                                    : fm.todaySprays,
                                todayRevenue: gotSprayed
                                    ? (fm.todayRevenue || 0) + sprayedItem.sprayPrice
                                    : fm.todayRevenue,
                                slots: Array.isArray(fm.slots)
                                    ? fm.slots.map((sl: any) => {
                                        const sKey = String(sl.fragranceName || "")
                                            .trim()
                                            .toLowerCase();
                                        const latestMl = perKioskMatrix[fCodeLower]?.[sKey];
                                        return typeof latestMl === "number"
                                            ? {
                                                ...sl,
                                                remainingMl: latestMl,
                                                available: latestMl >= 0.12,
                                            }
                                            : sl;
                                    })
                                    : fm.slots,
                            };
                        });
                        localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(syncedFleet));
                    }
                }

                // 3. Đồng bộ PRODUCTS_STORAGE_KEY
                const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                if (rawProds) {
                    const parsedProds = JSON.parse(rawProds);
                    if (Array.isArray(parsedProds)) {
                        const syncedProds = parsedProds.map((p: any) => {
                            const catMatch = updatedCatalog.find(
                                (c) =>
                                    c.slotNumber === p.slotNumber ||
                                    isExactMatch(c.product, p.name || "")
                            );
                            if (!catMatch) return p;
                            const gotSprayed =
                                sprayedItem &&
                                isExactMatch(sprayedItem.product, p.name || "");
                            const nextExtra = gotSprayed
                                ? Number(p.liveExtraSprays || 0) + 1
                                : Number(p.liveExtraSprays || 0);
                            const base30d = Number(p.baseSessions30d || 300);

                            return {
                                ...p,
                                liveExtraSprays: nextExtra,
                                samplingSessions30d: base30d + nextExtra,
                                assignedMachines: Array.isArray(p.assignedMachines)
                                    ? p.assignedMachines.map((am: any) => {
                                        const amKey = String(am.kioskCode || "").toLowerCase();
                                        if (amKey === catMatch.kioskId.toLowerCase()) {
                                            return {
                                                ...am,
                                                remainingVolumeMl: catMatch.remainingVolumeMl,
                                            };
                                        }
                                        return am;
                                    })
                                    : p.assignedMachines,
                            };
                        });
                        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(syncedProds));
                    }
                }

                // 4. Lưu vào DASHBOARD_STORAGE_KEY & INVENTORY_MOVEMENTS_KEY
                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                const dashData = rawDash
                    ? JSON.parse(rawDash)
                    : { transactions: [], incidents: [], alerts: [] };
                if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                if (!Array.isArray(dashData.incidents)) dashData.incidents = [];
                if (!Array.isArray(dashData.alerts)) dashData.alerts = [];

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
                        providerReference: `PAY-${newTxRecord.paymentMethod}-${newTxRecord.id}`,
                        status: "DISPENSED",
                        commandReference: `CMD-${newTxRecord.id}`,
                        ackedAt: nowIso,
                        executedAt: nowIso,
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
                        quantityBeforeMl: Number((sprayedItem.remainingVolumeMl + 0.12).toFixed(2)),
                        quantityAfterMl: sprayedItem.remainingVolumeMl,
                        deltaMl: -0.12,
                        reason: `Live spray order (${newTxRecord.id})`,
                        timestamp: nowIso,
                    });
                    localStorage.setItem(
                        INVENTORY_MOVEMENTS_KEY,
                        JSON.stringify(movements.slice(0, 300))
                    );
                }

                if (typeof replenishedSlotNumber === "number") {
                    const refilledItem = updatedCatalog.find(
                        (c) => c.slotNumber === replenishedSlotNumber
                    );
                    if (refilledItem) {
                        dashData.alerts = dashData.alerts.map((a: any) =>
                            isExactMatch(a.product || "", refilledItem.product)
                                ? { ...a, status: "RESOLVED", resolvedAt: new Date().toISOString() }
                                : a
                        );
                    }
                }

                localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        []
    );

    const uniqueBrands = useMemo(
        () => Array.from(new Set(catalogStock.map((i) => i.brand))).sort(),
        [catalogStock]
    );

    const brandOptions = [
        {
            label:
                lang === "en"
                    ? `All Maisons (${uniqueBrands.length} Partner Houses)`
                    : `Tất Cả Thương Hiệu (${uniqueBrands.length})`,
            value: "ALL",
        },
        ...uniqueBrands.map((b) => ({ label: b, value: b })),
    ];

    const dateOptions = [
        {
            label: lang === "en" ? "Today (Live Telemetry)" : "Hôm Nay (Trực Tuyến)",
            value: "TODAY",
        },
        {
            label: lang === "en" ? "Past 7 Days" : "7 Ngày Qua",
            value: "7D",
        },
        {
            label: lang === "en" ? "Past 30 Days" : "30 Ngày Qua",
            value: "30D",
        },
    ];

    // 3. HÀM XỊT & TẠO ĐƠN HÀNG CHO CHÍNH XÁC CHAI NƯỚC HOA ĐƯỢC CHỌN (HOẶC AUTO STREAM)
    const executeTargetedSprayOrder = useCallback(
        (
            targetSlotNumber?: number,
            preferredGateway: "VIETQR" | "MOMO" | "VNPAY" = "VIETQR",
            showFeedbackToast: boolean = true
        ) => {
            const onlineKioskIds = new Set(
                machines.filter((m) => m.status === "ONLINE").map((m) => m.id.toLowerCase())
            );

            let chosen: CatalogPerfumeItem | undefined;

            if (typeof targetSlotNumber === "number") {
                chosen = catalogStock.find((item) => item.slotNumber === targetSlotNumber);
                if (!chosen) return;
                if (!onlineKioskIds.has(chosen.kioskId.toLowerCase())) {
                    showToast(
                        lang === "en"
                            ? `Action Blocked: Station ${chosen.kioskId} (${chosen.product}) is currently not ONLINE.`
                            : `Từ chối: Trạm ${chosen.kioskId} (chứa ${chosen.product}) hiện không ở trạng thái ONLINE.`
                    );
                    return;
                }
                if (chosen.remainingVolumeMl < 0.12) {
                    showToast(
                        lang === "en"
                            ? `Cartridge Depleted: ${chosen.product} on ${chosen.kioskId} has 0ml remaining. Click "Replenish 100%" first!`
                            : `Bình đã cạn: ${chosen.product} trên ${chosen.kioskId} đã hết dung dịch. Vui lòng bấm Nạp đầy 100% trước!`
                    );
                    return;
                }
            } else {
                const eligiblePool = catalogStock.filter((item) => {
                    const isOnline = onlineKioskIds.has(item.kioskId.toLowerCase());
                    const isActive = !item.status || item.status === "ACTIVE";
                    const hasLiquid = item.remainingVolumeMl >= 0.12;
                    const matchesBrand =
                        selectedBrand === "ALL" || item.brand === selectedBrand;
                    return isOnline && isActive && hasLiquid && matchesBrand;
                });
                if (eligiblePool.length === 0) return;
                chosen = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
            }

            const uniqueSuffix = `${nextSequenceRef.current}-${Date.now().toString().slice(-3)}`;
            nextSequenceRef.current += 1;
            const txnId = `ORD-2026-${uniqueSuffix}`;

            const qtyBefore = chosen.remainingVolumeMl;
            const nextRemainingMl = Number(Math.max(0, qtyBefore - 0.12).toFixed(2));
            const nextPct = Math.max(
                0,
                Math.round((nextRemainingMl / chosen.bottleCapacityMl) * 100)
            );

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
                timestamp: `Just now (${new Date().toLocaleTimeString("vi-VN", {
                    hour12: false,
                })})`,
                status: "DISPENSED",
                dateType: "TODAY",
            };

            const nextCatalog = catalogStock.map((item) =>
                item.slotNumber === chosen!.slotNumber
                    ? {
                        ...item,
                        remainingVolumeMl: nextRemainingMl,
                        remainingStockPct: nextPct,
                    }
                    : item
            );

            setTransactions((prev) => [newTx, ...prev]);
            setCatalogStock(nextCatalog);

            propagateStockAndMachineToOtherStores(
                nextCatalog,
                machines,
                {
                    ...chosen,
                    remainingVolumeMl: nextRemainingMl,
                },
                newTx
            );

            setLastAddedSpray({
                id: txnId,
                product: chosen.product,
                brand: chosen.brand,
                kiosk: chosen.kioskId,
                amount: chosen.sprayPrice,
                remainingMl: nextRemainingMl,
            });
            setIsUpdatingLive(true);
            setTimeout(() => setIsUpdatingLive(false), 950);
            setSuccessRate(+(99.3 + Math.random() * 0.6).toFixed(1));

            if (showFeedbackToast) {
                showToast(
                    lang === "en"
                        ? `Dispensed 1 spray (-0.12ml) of ${chosen.brand} — ${chosen.product} on ${chosen.kioskId}: ${qtyBefore}ml → ${nextRemainingMl}ml (+${chosen.sprayPrice.toLocaleString("vi-VN")} VND). Synchronized across all 8 screens!`
                        : `Đã xịt 1 lần (-0.12ml) chai ${chosen.brand} — ${chosen.product} tại trạm ${chosen.kioskId}: từ ${qtyBefore}ml còn ${nextRemainingMl}ml (+${chosen.sprayPrice.toLocaleString("vi-VN")}đ). Đã đồng bộ sang toàn bộ 8 màn hình!`
                );
            }
        },
        [catalogStock, lang, machines, propagateStockAndMachineToOtherStores, selectedBrand, showToast]
    );

    useEffect(() => {
        if (!isLiveStreamActive) return;
        const interval = setInterval(() => {
            executeTargetedSprayOrder(undefined, "VIETQR", false);
        }, 5000);

        return () => clearInterval(interval);
    }, [isLiveStreamActive, executeTargetedSprayOrder]);

    const handleResolveAlertAndReboot = (alertItem: AlertIncidentItem) => {
        if (userRole === "VIEWER") return;

        const nextMachines = machines.map((m) =>
            m.id.toLowerCase() === alertItem.kiosk.toLowerCase()
                ? {
                    ...m,
                    status: "ONLINE" as const,
                    slotsReady: "4/4 Chambers",
                    lastSeen: "Live (Restored)",
                }
                : m
        );
        setMachines(nextMachines);
        setMaintenanceTickets((prev) =>
            prev.map((tk) =>
                tk.kiosk.toLowerCase() === alertItem.kiosk.toLowerCase()
                    ? { ...tk, status: "COMPLETED", progress: 100 }
                    : tk
            )
        );

        setAlerts((prev) => prev.filter((a) => a.id !== alertItem.id));
        propagateStockAndMachineToOtherStores(catalogStock, nextMachines);
        setSelectedAlertDetail(null);
        showToast(
            lang === "en"
                ? `Resolved Alert ${alertItem.id} on ${alertItem.kiosk}! Station restored to ONLINE across all screens.`
                : `Đã xử lý cảnh báo ${alertItem.id} trên ${alertItem.kiosk}! Trạm đã khôi phục ONLINE toàn hệ thống.`
        );
    };

    const handleQuickReplenishSlot = (slotNum: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (userRole === "VIEWER") {
            router.push("/inventory");
            return;
        }
        const targetProd = catalogStock.find((i) => i.slotNumber === slotNum);
        const nextCatalog = catalogStock.map((item) =>
            item.slotNumber === slotNum
                ? {
                    ...item,
                    remainingVolumeMl: item.bottleCapacityMl,
                    remainingStockPct: 100,
                }
                : item
        );
        setCatalogStock(nextCatalog);

        const alertTypeKey = `LOW_STOCK_SLOT_${String(slotNum).padStart(2, "0")}`;
        setAlerts((prev) => prev.filter((a) => a.type !== alertTypeKey));

        propagateStockAndMachineToOtherStores(
            nextCatalog,
            machines,
            undefined,
            undefined,
            slotNum
        );
        showToast(
            lang === "en"
                ? `Replenished ${targetProd?.product || `SKU #${slotNum}`} on ${targetProd?.kioskId || "station"} to 100% capacity & synchronized across Storefront, Kiosk, Products & Fleet!`
                : `Đã nạp đầy 100% cho ${targetProd?.product || `SKU #${slotNum}`} trên trạm ${targetProd?.kioskId || ""} và đồng bộ toàn hệ thống!`
        );
    };

    const rangeTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            if (selectedDateRange === "TODAY") return tx.dateType === "TODAY";
            if (selectedDateRange === "7D")
                return tx.dateType === "TODAY" || tx.dateType === "7D";
            return true;
        });
    }, [transactions, selectedDateRange]);

    const finalFilteredTransactions = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return rangeTransactions.filter((tx) => {
            const matchesSearch =
                !q ||
                tx.id.toLowerCase().includes(q) ||
                tx.product.toLowerCase().includes(q) ||
                tx.kiosk.toLowerCase().includes(q) ||
                tx.brand.toLowerCase().includes(q) ||
                tx.status.toLowerCase().includes(q);
            const matchesBrand = selectedBrand === "ALL" || tx.brand === selectedBrand;
            return matchesSearch && matchesBrand;
        });
    }, [rangeTransactions, searchQuery, selectedBrand]);

    const verifiedDispensedTransactions = useMemo(
        () =>
            finalFilteredTransactions.filter(
                (tx) => tx.status === "DISPENSED" || tx.status === "PAID"
            ),
        [finalFilteredTransactions]
    );

    const totalRevenueNum = useMemo(
        () => verifiedDispensedTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        [verifiedDispensedTransactions]
    );
    const totalOrdersCount = verifiedDispensedTransactions.length;

    const topPerformingBrands = useMemo(() => {
        const map = new Map<string, { brand: string; revenue: number; sprays: number }>();
        rangeTransactions
            .filter((tx) => tx.status === "DISPENSED" || tx.status === "PAID")
            .forEach((tx) => {
                const cur = map.get(tx.brand) || { brand: tx.brand, revenue: 0, sprays: 0 };
                cur.revenue += tx.amount;
                cur.sprays += 1;
                map.set(tx.brand, cur);
            });
        return Array.from(map.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);
    }, [rangeTransactions]);

    const lowStockItems = useMemo(() => {
        return catalogStock.filter((item) => {
            const matchesBrand = selectedBrand === "ALL" || item.brand === selectedBrand;
            return (
                matchesBrand &&
                (item.remainingVolumeMl <= 15 || item.remainingStockPct <= item.thresholdPct)
            );
        });
    }, [catalogStock, selectedBrand]);

    const filteredMachines = useMemo(() => {
        return machines.filter((m) => {
            if (machineFilter === "ALL") return true;
            return m.status === machineFilter;
        });
    }, [machines, machineFilter]);

    const selectedMapMachine = useMemo(
        () =>
            machines.find(
                (m) => m.id.toLowerCase() === selectedMapMachineId.toLowerCase()
            ) || machines[0],
        [machines, selectedMapMachineId]
    );

    const offlineMachinesCount = useMemo(
        () => machines.filter((m) => m.status === "OFFLINE").length,
        [machines]
    );

    // Danh sách sản phẩm hiển thị trong Modal Chọn Chai Xịt (lọc theo Trạm Kiosk đang chọn)
    const onlineMachinesList = useMemo(
        () => machines.filter((m) => m.status === "ONLINE"),
        [machines]
    );

    const sprayModalFilteredCatalog = useMemo(() => {
        const onlineSet = new Set(onlineMachinesList.map((m) => m.id.toLowerCase()));
        return catalogStock.filter((item) => {
            const isActive = !item.status || item.status === "ACTIVE";
            if (!isActive || item.remainingVolumeMl < 0.12) return false;
            if (sprayModalKioskId === "ALL_ONLINE") {
                return onlineSet.has(item.kioskId.toLowerCase());
            }
            return item.kioskId.toLowerCase() === sprayModalKioskId.toLowerCase();
        });
    }, [catalogStock, onlineMachinesList, sprayModalKioskId]);

    const selectedSprayModalProduct = useMemo(() => {
        return (
            sprayModalFilteredCatalog.find(
                (item) => item.slotNumber === sprayModalSlotNum
            ) ||
            sprayModalFilteredCatalog[0] ||
            catalogStock[0]
        );
    }, [catalogStock, sprayModalFilteredCatalog, sprayModalSlotNum]);

    const renderTxStatusBadge = (status: Transaction["status"]) => {
        if (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") {
            return (
                <span className={styles.badgeDanger}>
                    <span>{status} (0đ)</span>
                </span>
            );
        }
        if (status === "REFUNDED" || status === "UNCERTAIN" || status === "PENDING") {
            return (
                <span className={styles.badgeWarning}>
                    <span>{status}</span>
                </span>
            );
        }
        return (
            <span className={styles.badgeSuccess}>
                <span>{status}</span>
            </span>
        );
    };

    const googleSatelliteEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
        selectedMapMachine?.coords || "10.7801, 106.6983"
    )}&t=h&z=16&ie=UTF8&iwloc=&output=embed`;

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            suppressHydrationWarning
            onClick={() => {
                setBrandOpen(false);
                setDateOpen(false);
            }}
        >
            {/* LUXURY HERO BANNER CARD */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? "EXECUTIVE COMMAND CENTER & REAL-TIME IOT ANALYTICS"
                                : "TRUNG TÂM ĐIỀU HÀNH DOANH NGHIỆP & PHÂN TÍCH IOT THỜI GIAN THỰC"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Executive Analytics Dashboard"
                                : "Bảng Điều Hành Phân Tích Hệ Thống"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? `Real-time operational intelligence across ${uniqueBrands.length} luxury partner maisons, ${catalogStock.length} signature fragrances, and ${machines.length} automated sampling stations.`
                                : `Giám sát vận hành thời gian thực trên ${uniqueBrands.length} thương hiệu đối tác, ${catalogStock.length} mùi hương tuyển chọn và ${machines.length} trạm Kiosk tự động.`}
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

                        {userRole !== "VIEWER" && (
                            <>
                                {/* BẤM NÚT NÀY SẼ MỞ MODAL CHỌN ĐÍCH DANH MÁY KIOSK & CHAI NƯỚC HOA ĐỂ XỊT THỬ */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSprayPerfumeMenuOpen(false);
                                        setIsSprayModalOpen(true);
                                    }}
                                    className={styles.primaryGoldBtn}
                                >
                                    <Zap size={14} />
                                    <span>
                                        {lang === "en"
                                            ? "+1 Live Spray (Select Scent)"
                                            : "+1 Xịt Thử (Chọn Mùi Hương)"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsLiveStreamActive(!isLiveStreamActive);
                                    }}
                                    className={styles.secondaryGoldBtn}
                                    style={{
                                        borderColor: isLiveStreamActive
                                            ? "rgba(52,211,153,0.45)"
                                            : "rgba(251,191,36,0.45)",
                                        color: isLiveStreamActive ? "#34D399" : "#FBBF24",
                                    }}
                                >
                                    {isLiveStreamActive ? (
                                        <Pause size={13} />
                                    ) : (
                                        <Play size={13} />
                                    )}
                                    <span>
                                        {isLiveStreamActive
                                            ? lang === "en"
                                                ? "Auto Stream: ON"
                                                : "Luồng Tự Động: BẬT"
                                            : lang === "en"
                                                ? "Auto Stream: PAUSED"
                                                : "Luồng Tự Động: TẠM DỪNG"}
                                    </span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 4 KPI SUMMARY CARDS */}
                <div className={styles.statsGrid}>
                    <div
                        className={styles.statCard}
                        onClick={() => router.push("/reports")}
                    >
                        <div>
                            <p className={styles.statLabel}>
                                {lang === "en"
                                    ? `RECOGNIZED REVENUE (${selectedDateRange})`
                                    : `DOANH THU GHI NHẬN (${selectedDateRange})`}
                            </p>
                            <p
                                className={styles.statValue}
                                style={{
                                    color: isUpdatingLive ? "#F5E6AD" : "#FFFFFF",
                                    transition: "color 0.3s ease",
                                }}
                            >
                                {totalRevenueNum.toLocaleString("vi-VN")} VND
                            </p>
                            <span className={styles.statTrend}>
                                <ArrowUpRight size={14} />
                                <span>
                                    {isUpdatingLive && lastAddedSpray
                                        ? `+${lastAddedSpray.amount.toLocaleString("vi-VN")}đ (${lastAddedSpray.product})`
                                        : lang === "en"
                                            ? `From ${totalOrdersCount} verified sprays`
                                            : `Từ ${totalOrdersCount} lượt xịt xác thực`}
                                </span>
                            </span>
                        </div>
                        <div
                            className={styles.statIconBox}
                            style={{
                                color: "#D4AF37",
                                background: "rgba(212, 175, 55, 0.12)",
                            }}
                        >
                            <Sparkles size={20} />
                        </div>
                    </div>

                    <div
                        className={styles.statCard}
                        onClick={() => router.push("/transactions")}
                    >
                        <div>
                            <p className={styles.statLabel}>
                                {lang === "en"
                                    ? "VERIFIED DISPENSES"
                                    : "TỔNG LƯỢT XỊT THÀNH CÔNG"}
                            </p>
                            <p
                                className={styles.statValue}
                                style={{
                                    color: isUpdatingLive ? "#34D399" : "#FFFFFF",
                                    transition: "color 0.3s ease",
                                }}
                            >
                                {totalOrdersCount.toLocaleString("vi-VN")} Sprays
                            </p>
                            <span className={styles.statTrend}>
                                <ArrowUpRight size={14} />
                                <span>
                                    {successRate}%{" "}
                                    {lang === "en"
                                        ? "Dispense Success Rate"
                                        : "Tỉ lệ phun thành công"}
                                </span>
                            </span>
                        </div>
                        <div
                            className={styles.statIconBox}
                            style={{
                                color: "#34D399",
                                background: "rgba(52, 211, 153, 0.12)",
                            }}
                        >
                            <ShoppingBag size={20} />
                        </div>
                    </div>

                    <div
                        className={styles.statCard}
                        onClick={() => router.push("/products")}
                    >
                        <div>
                            <p className={styles.statLabel}>
                                {lang === "en"
                                    ? "PARTNER MAISONS & CATALOG"
                                    : "THƯƠNG HIỆU & MÙI HƯƠNG"}
                            </p>
                            <p className={styles.statValue}>
                                {uniqueBrands.length} Maisons
                            </p>
                            <span
                                className={styles.statTrend}
                                style={{ color: "#F5E6AD" }}
                            >
                                <span>
                                    {catalogStock.length} SKUs ({lowStockItems.length}{" "}
                                    {lang === "en" ? "Low-Stock" : "Sắp hết"})
                                </span>
                            </span>
                        </div>
                        <div
                            className={styles.statIconBox}
                            style={{
                                color: "#F5E6AD",
                                background: "rgba(245, 230, 173, 0.12)",
                            }}
                        >
                            <Building2 size={20} />
                        </div>
                    </div>

                    <div
                        className={styles.statCard}
                        onClick={() => router.push("/machines")}
                    >
                        <div>
                            <p className={styles.statLabel}>
                                {lang === "en"
                                    ? "STATION FLEET & ALERTS"
                                    : "TRẠNG THÁI TRẠM & CẢNH BÁO"}
                            </p>
                            <p
                                className={styles.statValue}
                                style={{
                                    color:
                                        offlineMachinesCount === 0
                                            ? "#34D399"
                                            : "#F87171",
                                }}
                            >
                                {
                                    machines.filter((m) => m.status === "ONLINE")
                                        .length
                                }
                                /{machines.length} Online
                            </p>
                            <span
                                className={styles.statTrend}
                                style={{
                                    color:
                                        offlineMachinesCount === 0
                                            ? "#34D399"
                                            : "#F87171",
                                }}
                            >
                                <span>
                                    {offlineMachinesCount} Offline •{" "}
                                    {
                                        machines.filter(
                                            (m) => m.status === "MAINTENANCE"
                                        ).length
                                    }{" "}
                                    Maint • {alerts.length} Alerts
                                </span>
                            </span>
                        </div>
                        <div
                            className={styles.statIconBox}
                            style={{
                                color: "#F87171",
                                background: "rgba(248, 113, 113, 0.12)",
                            }}
                        >
                            <AlertOctagon size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH + DATE & BRAND FILTERS */}
            <div className={styles.filterBar} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={
                            lang === "en"
                                ? "Search station code, fragrance name, maison, or order ID..."
                                : "Tìm theo mã trạm, tên nước hoa, thương hiệu hoặc mã đơn hàng..."
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.customSelectWrapper}>
                    <div
                        className={styles.customSelectHeader}
                        onClick={() => {
                            setDateOpen(!dateOpen);
                            setBrandOpen(false);
                        }}
                    >
                        <span>
                            {dateOptions.find((o) => o.value === selectedDateRange)?.label}
                        </span>
                        <ChevronDown size={14} color="#D4AF37" />
                    </div>
                    {dateOpen && (
                        <div className={styles.customDropdownList}>
                            {dateOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`${styles.customDropdownItem} ${
                                        selectedDateRange === opt.value
                                            ? styles.customDropdownItemSelected
                                            : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedDateRange(opt.value as any);
                                        setDateOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.customSelectWrapper}>
                    <div
                        className={styles.customSelectHeader}
                        onClick={() => {
                            setBrandOpen(!brandOpen);
                            setDateOpen(false);
                        }}
                    >
                        <span>
                            {brandOptions.find((o) => o.value === selectedBrand)?.label}
                        </span>
                        <ChevronDown size={14} color="#D4AF37" />
                    </div>
                    {brandOpen && (
                        <div
                            className={styles.customDropdownList}
                            style={{ maxHeight: "280px", overflowY: "auto" }}
                        >
                            {brandOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`${styles.customDropdownItem} ${
                                        selectedBrand === opt.value
                                            ? styles.customDropdownItemSelected
                                            : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedBrand(opt.value);
                                        setBrandOpen(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {(searchQuery || selectedBrand !== "ALL") && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedBrand("ALL");
                        }}
                        className={styles.secondaryGoldBtn}
                    >
                        <RefreshCw size={13} />
                        <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                    </button>
                )}
            </div>

            {/* TRANSACTION & REVENUE TREND CHART */}
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <div>
                        <h2 className={styles.chartTitle}>
                            {lang === "en"
                                ? `Transaction & Revenue Trend (${selectedDateRange})`
                                : `Xu Hướng Giao Dịch & Doanh Thu (${selectedDateRange})`}
                        </h2>
                        <p
                            style={{
                                fontSize: "0.78rem",
                                color: "#94A3B8",
                                margin: "0.2rem 0 0 0",
                            }}
                        >
                            {lang === "en"
                                ? "Hover over any time point on the chart to inspect real-time Revenue (VND), Dispensed Sprays, and Success Rate."
                                : "Rê chuột lên bất kỳ điểm thời gian nào trên biểu đồ để xem Doanh thu (VND), Số lượt xịt và Tỉ lệ hoàn tất."}
                        </p>
                    </div>
                    <span className={styles.chartSub}>
                        {selectedBrand === "ALL"
                            ? `${uniqueBrands.length} Maisons`
                            : selectedBrand}{" "}
                        • {totalOrdersCount} Sprays
                    </span>
                </div>
                <RealTimeChart
                    selectedDateRange={selectedDateRange}
                    selectedBrand={selectedBrand}
                    latestOrderAmount={
                        verifiedDispensedTransactions[0]?.amount || 15000
                    }
                    totalOrdersCount={totalOrdersCount}
                />
            </div>

            {/* RECENT TRANSACTIONS + TOP PERFORMING BRANDS */}
            <div className={styles.gridTwoCols}>
                {/* Recent Transactions */}
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <div>
                            <h3 className={styles.chartTitle}>
                                {lang === "en"
                                    ? `Recent Kiosk Transactions (${finalFilteredTransactions.length})`
                                    : `Giao Dịch Kiosk Gần Đây (${finalFilteredTransactions.length})`}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94A3B8",
                                    margin: "0.2rem 0 0 0",
                                }}
                            >
                                {lang === "en"
                                    ? "Select any transaction row to inspect payment & telemetry details"
                                    : "Chạm vào bất kỳ dòng giao dịch nào để kiểm tra biên nhận thanh toán"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/transactions")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.4rem 0.85rem", fontSize: "0.73rem" }}
                        >
                            <span>{lang === "en" ? "View All" : "Xem Tất Cả"}</span>
                        </button>
                    </div>

                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Station & Chamber</th>
                                <th>Fragrance</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {finalFilteredTransactions.map((tx, idx) => (
                                <tr
                                    key={`${tx.id}-${idx}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setSelectedTxDetail(tx)}
                                >
                                    <td
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {tx.id}
                                    </td>
                                    <td>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                color: "#FFF",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            {tx.kiosk}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.71rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            Slot {String(tx.slotNumber).padStart(2, "0")} •{" "}
                                            {tx.timestamp}
                                        </div>
                                    </td>
                                    <td>
                                        <strong style={{ color: "#FFF" }}>
                                            {tx.product}
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
                                    <td
                                        style={{
                                            fontWeight: 700,
                                            fontFamily: "Space Grotesk, monospace",
                                            color:
                                                tx.status === "FAILED" ||
                                                tx.status === "REFUNDED"
                                                    ? "#F87171"
                                                    : "#F5E6AD",
                                        }}
                                    >
                                        {tx.amount.toLocaleString("vi-VN")} VND
                                    </td>
                                    <td>{renderTxStatusBadge(tx.status)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Performing Brands */}
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <div>
                            <h3 className={styles.chartTitle}>
                                {lang === "en"
                                    ? "Top Performing Maisons"
                                    : "Thương Hiệu Doanh Thu Cao Nhất"}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94A3B8",
                                    margin: "0.2rem 0 0 0",
                                }}
                            >
                                {lang === "en"
                                    ? "Select a brand row to filter dashboard metrics by that partner house"
                                    : "Chọn một thương hiệu để lọc toàn bộ số liệu theo nhà hương đó"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/brands")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.4rem 0.85rem", fontSize: "0.73rem" }}
                        >
                            <span>
                                {lang === "en"
                                    ? `All ${uniqueBrands.length} Maisons`
                                    : `Xem ${uniqueBrands.length} Hãng`}
                            </span>
                        </button>
                    </div>

                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Maison</th>
                                <th>Verified Sprays</th>
                                <th>Recognized Revenue</th>
                                <th>Filter</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topPerformingBrands.map((b) => (
                                <tr
                                    key={b.brand}
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                        setSelectedBrand(
                                            selectedBrand === b.brand
                                                ? "ALL"
                                                : b.brand
                                        )
                                    }
                                >
                                    <td
                                        style={{
                                            fontWeight: 700,
                                            color: "#FFF",
                                        }}
                                    >
                                        <span>{b.brand}</span>
                                        {selectedBrand === b.brand && (
                                            <span
                                                style={{
                                                    marginLeft: "8px",
                                                    fontSize: "0.68rem",
                                                    color: "#D4AF37",
                                                }}
                                            >
                                                    (Active)
                                                </span>
                                        )}
                                    </td>
                                    <td style={{ fontFamily: "Space Grotesk, monospace" }}>
                                        {b.sprays} sprays
                                    </td>
                                    <td
                                        style={{
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {b.revenue.toLocaleString("vi-VN")} VND
                                    </td>
                                    <td>
                                            <span className={styles.badgeSuccess}>
                                                <Eye size={12} />
                                                <span>Inspect</span>
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ACTIVE ALERTS + FRAGRANCE INVENTORY STATUS (LOW STOCK) */}
            <div className={styles.gridTwoCols}>
                {/* Active Alerts */}
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <div>
                            <h3 className={styles.chartTitle}>
                                {lang === "en"
                                    ? `Active Alerts & Incidents (${alerts.length})`
                                    : `Cảnh Báo & Sự Cố Đang Mở (${alerts.length})`}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94A3B8",
                                    margin: "0.2rem 0 0 0",
                                }}
                            >
                                {lang === "en"
                                    ? "Select an alert to inspect root cause and execute recovery actions"
                                    : "Chọn một cảnh báo để kiểm tra nguyên nhân và thực thi khôi phục"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/alerts")}
                            className={styles.secondaryGoldBtn}
                            style={{
                                padding: "0.4rem 0.85rem",
                                fontSize: "0.73rem",
                                color: "#F87171",
                                borderColor: "rgba(248,113,113,0.4)",
                            }}
                        >
                            <span>{lang === "en" ? "Open Alerts" : "Mở Cảnh Báo"}</span>
                        </button>
                    </div>
                    <div
                        className={styles.tableScrollContainer}
                        style={{ maxHeight: "260px" }}
                    >
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Alert ID</th>
                                <th>Station</th>
                                <th>Alert Type</th>
                                <th>Severity</th>
                                <th>Time</th>
                            </tr>
                            </thead>
                            <tbody>
                            {alerts.map((al, idx) => (
                                <tr
                                    key={`${al.id}-${idx}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setSelectedAlertDetail(al)}
                                >
                                    <td
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#F87171",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {al.id}
                                    </td>
                                    <td>
                                        <strong
                                            style={{
                                                color: "#FFF",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            {al.kiosk}
                                        </strong>
                                        <div
                                            style={{
                                                fontSize: "0.71rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            {al.location}
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            fontSize: "0.76rem",
                                        }}
                                    >
                                        {al.type}
                                    </td>
                                    <td>
                                            <span
                                                className={
                                                    al.severity === "CRITICAL"
                                                        ? styles.badgeDanger
                                                        : styles.badgeWarning
                                                }
                                            >
                                                {al.severity}
                                            </span>
                                    </td>
                                    <td
                                        style={{
                                            color: "#94A3B8",
                                            fontSize: "0.76rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {al.time}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fragrance Inventory Status (Có nút Xịt thử -0.12ml & Nạp đầy 100% cho từng chai cụ thể) */}
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <div>
                            <h3 className={styles.chartTitle}>
                                {lang === "en"
                                    ? `Fragrance Inventory Status (${lowStockItems.length} Low-Stock)`
                                    : `Tồn Kho Bình Nước Hoa (${lowStockItems.length} Bình Sắp Cạn)`}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94A3B8",
                                    margin: "0.2rem 0 0 0",
                                }}
                            >
                                {lang === "en"
                                    ? "Dispense (-0.12ml) or replenish (100%) any specific cartridge below"
                                    : "Bấm Xịt (-0.12ml) hoặc Nạp 100% trực tiếp cho đúng chai nước hoa bên dưới"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/inventory")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.4rem 0.85rem", fontSize: "0.73rem" }}
                        >
                            <span>{lang === "en" ? "Open Inventory" : "Mở Kho Hàng"}</span>
                        </button>
                    </div>
                    <div
                        className={styles.tableScrollContainer}
                        style={{ maxHeight: "260px" }}
                    >
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Station & Chamber</th>
                                <th>Fragrance & Maison</th>
                                <th>Remaining Level</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {lowStockItems.map((item) => (
                                <tr key={`${item.kioskId}-${item.slotNumber}`}>
                                    <td
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {item.kioskId} •{" "}
                                        {item.physicalSlotLabel ||
                                            `Slot ${String(item.slotNumber).padStart(2, "0")}`}
                                    </td>
                                    <td>
                                        <strong style={{ color: "#FFF" }}>
                                            {item.product}
                                        </strong>
                                        <div
                                            style={{
                                                fontSize: "0.72rem",
                                                color: "#D4AF37",
                                            }}
                                        >
                                            {item.brand}
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: "Space Grotesk, monospace" }}>
                                        <strong style={{ color: "#F87171" }}>
                                            {item.remainingVolumeMl}ml /{" "}
                                            {item.bottleCapacityMl}ml (
                                            {item.remainingStockPct}%)
                                        </strong>
                                    </td>
                                    <td>
                                        {userRole === "OPS_MANAGER" ? (
                                            <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        executeTargetedSprayOrder(
                                                            item.slotNumber,
                                                            "VIETQR",
                                                            true
                                                        );
                                                    }}
                                                    className={styles.badgeSuccess}
                                                    style={{ cursor: "pointer" }}
                                                    title={`Dispense 1 spray (-0.12ml) of ${item.product}`}
                                                >
                                                    <Zap size={11} />
                                                    <span>-0.12ml</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) =>
                                                        handleQuickReplenishSlot(
                                                            item.slotNumber,
                                                            e
                                                        )
                                                    }
                                                    className={styles.badgeWarning}
                                                    style={{ cursor: "pointer" }}
                                                    title={`Replenish ${item.product} to 100%`}
                                                >
                                                    <Droplets size={11} />
                                                    <span>100%</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={styles.badgeWarning}>
                                                    <span>Low Stock</span>
                                                </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MACHINE STATUS + SATELLITE MAP & MAINTENANCE OVERVIEW */}
            <div className={styles.gridTwoCols}>
                {/* Machine Status & Google Satellite Map Selector */}
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <div>
                            <h3 className={styles.chartTitle}>
                                {lang === "en"
                                    ? "Station Status & Live Satellite Locations"
                                    : "Trạng Thái Đội Máy & Định Vị Vệ Tinh"}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94A3B8",
                                    margin: "0.2rem 0 0 0",
                                }}
                            >
                                {lang === "en"
                                    ? "Select a station below to focus satellite radar or double-click to open 4-Slot Console"
                                    : "Chọn một trạm để bay camera vệ tinh tới hoặc nhấp đúp để mở cấu hình 4 khoang"}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                            {(
                                [
                                    "ALL",
                                    "ONLINE",
                                    "OFFLINE",
                                    "MAINTENANCE",
                                ] as const
                            ).map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setMachineFilter(st)}
                                    style={{
                                        background:
                                            machineFilter === st
                                                ? "rgba(212,175,55,0.22)"
                                                : "rgba(255,255,255,0.04)",
                                        border:
                                            machineFilter === st
                                                ? "1px solid #D4AF37"
                                                : "1px solid rgba(255,255,255,0.1)",
                                        color:
                                            machineFilter === st
                                                ? "#F5E6AD"
                                                : "#CBD5E1",
                                        padding: "0.28rem 0.6rem",
                                        borderRadius: "7px",
                                        fontSize: "0.68rem",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                        cursor: "pointer",
                                    }}
                                >
                                    <span>{st}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedMapMachine && (
                        <div
                            style={{
                                borderRadius: "14px",
                                overflow: "hidden",
                                border: "1px solid rgba(212,175,55,0.4)",
                                marginBottom: "0.85rem",
                                background: "#050509",
                            }}
                        >
                            <div style={{ position: "relative", height: "165px", width: "100%" }}>
                                <iframe
                                    key={selectedMapMachine.id}
                                    title={`Dashboard Satellite - ${selectedMapMachine.id}`}
                                    src={googleSatelliteEmbedUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, display: "block" }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                            <div
                                style={{
                                    padding: "0.65rem 0.95rem",
                                    background: "rgba(10,10,16,0.95)",
                                    borderTop: "1px solid rgba(212,175,55,0.28)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                    fontSize: "0.78rem",
                                }}
                            >
                                <div>
                                    <span style={{ color: "#F5E6AD", fontWeight: 700, fontFamily: "Space Grotesk, monospace" }}>
                                        <MapPin
                                            size={13}
                                            color="#D4AF37"
                                            style={{ display: "inline", marginRight: "4px" }}
                                        />
                                        {selectedMapMachine.id} — {selectedMapMachine.name}
                                    </span>
                                    <div style={{ fontSize: "0.7rem", color: "#94A3B8", fontFamily: "Space Grotesk, monospace" }}>
                                        GPS: {selectedMapMachine.coords} • Climate: {selectedMapMachine.temp} • {selectedMapMachine.lastSeen}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                                    <span
                                        className={
                                            selectedMapMachine.status === "ONLINE"
                                                ? styles.badgeSuccess
                                                : selectedMapMachine.status === "MAINTENANCE"
                                                    ? styles.badgeWarning
                                                    : styles.badgeDanger
                                        }
                                    >
                                        <span>{selectedMapMachine.status}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                `/machines/${encodeURIComponent(
                                                    selectedMapMachine.id
                                                )}`
                                            )
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{ padding: "0.3rem 0.65rem", fontSize: "0.7rem" }}
                                    >
                                        <span>Console</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        className={styles.tableScrollContainer}
                        style={{ maxHeight: "200px" }}
                    >
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Station ID</th>
                                <th>Boutique Venue</th>
                                <th>Chambers</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredMachines.map((m) => (
                                <tr
                                    key={m.id}
                                    style={{
                                        cursor: "pointer",
                                        background:
                                            selectedMapMachine?.id === m.id
                                                ? "rgba(212,175,55,0.12)"
                                                : undefined,
                                    }}
                                    onClick={() => setSelectedMapMachineId(m.id)}
                                    onDoubleClick={() =>
                                        router.push(`/machines/${encodeURIComponent(m.id)}`)
                                    }
                                >
                                    <td
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {m.id}
                                    </td>
                                    <td>
                                        <strong style={{ color: "#FFF" }}>
                                            {m.name}
                                        </strong>
                                        <div
                                            style={{
                                                fontSize: "0.71rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            {m.location}
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: "Space Grotesk, monospace" }}>
                                        {m.slotsReady}
                                    </td>
                                    <td>
                                            <span
                                                className={
                                                    m.status === "ONLINE"
                                                        ? styles.badgeSuccess
                                                        : m.status === "MAINTENANCE"
                                                            ? styles.badgeWarning
                                                            : styles.badgeDanger
                                                }
                                            >
                                                <span>{m.status}</span>
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Maintenance Overview */}
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <div>
                            <h3 className={styles.chartTitle}>
                                {lang === "en"
                                    ? "Maintenance Overview"
                                    : "Tiến Độ Bảo Trì Kỹ Thuật"}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94A3B8",
                                    margin: "0.2rem 0 0 0",
                                }}
                            >
                                {lang === "en"
                                    ? "Track field service tickets and post-maintenance verification"
                                    : "Theo dõi phiếu bảo trì hiện trường và kiểm chuẩn sau sửa chữa"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/maintenance")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.4rem 0.85rem", fontSize: "0.73rem" }}
                        >
                            <span>{lang === "en" ? "All Tickets" : "Xem Tất Cả"}</span>
                        </button>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "0.45rem",
                            marginBottom: "0.75rem",
                        }}
                    >
                        {(
                            [
                                "ALL",
                                "OPEN",
                                "IN_PROGRESS",
                                "COMPLETED",
                            ] as const
                        ).map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setMaintenanceFilter(st)}
                                style={{
                                    background:
                                        maintenanceFilter === st
                                            ? "rgba(212,175,55,0.22)"
                                            : "rgba(255,255,255,0.04)",
                                    border:
                                        maintenanceFilter === st
                                            ? "1px solid #D4AF37"
                                            : "1px solid rgba(255,255,255,0.1)",
                                    color:
                                        maintenanceFilter === st
                                            ? "#F5E6AD"
                                            : "#CBD5E1",
                                    padding: "0.32rem 0.7rem",
                                    borderRadius: "8px",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                    cursor: "pointer",
                                }}
                            >
                                <span>{st.replace("_", " ")}</span>
                            </button>
                        ))}
                    </div>

                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Station & Issue</th>
                            <th>Technician</th>
                            <th>Progress</th>
                        </tr>
                        </thead>
                        <tbody>
                        {maintenanceTickets
                            .filter(
                                (t) =>
                                    maintenanceFilter === "ALL" ||
                                    t.status === maintenanceFilter
                            )
                            .map((tk) => (
                                <tr
                                    key={tk.id}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => router.push("/maintenance")}
                                >
                                    <td
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                            color: "#F5E6AD",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {tk.id}
                                    </td>
                                    <td>
                                        <strong
                                            style={{
                                                color: "#FFF",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            {tk.kiosk}
                                        </strong>
                                        <div
                                            style={{
                                                fontSize: "0.73rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            {tk.issue}
                                        </div>
                                    </td>
                                    <td>{tk.technician}</td>
                                    <td>
                                            <span
                                                className={
                                                    tk.status === "COMPLETED"
                                                        ? styles.badgeSuccess
                                                        : tk.status === "IN_PROGRESS"
                                                            ? styles.badgeWarning
                                                            : styles.badgeDanger
                                                }
                                            >
                                                <span>
                                                    {tk.status} ({tk.progress}%)
                                                </span>
                                            </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 0: CHỌN ĐÍCH DANH TRẠM KIOSK & CHAI NƯỚC HOA ĐỂ XỊT THỬ (-0.12ML) */}
            {isSprayModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsSprayModalOpen(false)}
                >
                    <div
                        className={styles.modalContent}
                        style={{ maxWidth: "38rem" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1rem",
                                borderBottom: "1px solid rgba(212,175,55,0.25)",
                                paddingBottom: "0.75rem",
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        fontSize: "0.68rem",
                                        color: "#D4AF37",
                                        letterSpacing: "0.14em",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    TARGETED KIOSK SPRAY DISPATCHER (0.12ML)
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        fontFamily: "Bodoni Moda, Georgia, serif",
                                        fontSize: "1.35rem",
                                        color: "#FFF",
                                    }}
                                >
                                    {lang === "en"
                                        ? "Select Station & Fragrance to Dispense"
                                        : "Chọn Trạm Kiosk & Chai Nước Hoa Cần Xịt"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSprayModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                                style={{ padding: "0.4rem 0.55rem" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* BƯỚC 1: LỌC THEO TRẠM KIOSK ĐANG ONLINE */}
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
                                1. {lang === "en" ? "SELECT ONLINE STATION" : "CHỌN TRẠM KIOSK ĐANG ONLINE"}
                            </label>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSprayModalKioskId("ALL_ONLINE");
                                        setIsSprayPerfumeMenuOpen(false);
                                    }}
                                    style={{
                                        padding: "0.42rem 0.75rem",
                                        borderRadius: "8px",
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                        cursor: "pointer",
                                        background:
                                            sprayModalKioskId === "ALL_ONLINE"
                                                ? "linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)"
                                                : "rgba(255,255,255,0.04)",
                                        color:
                                            sprayModalKioskId === "ALL_ONLINE"
                                                ? "#050508"
                                                : "#CBD5E1",
                                        border:
                                            sprayModalKioskId === "ALL_ONLINE"
                                                ? "1px solid #D4AF37"
                                                : "1px solid rgba(255,255,255,0.12)",
                                    }}
                                >
                                    {lang === "en" ? "All Online Stations" : "Tất Cả Trạm Online"}
                                </button>
                                {onlineMachinesList.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            setSprayModalKioskId(m.id);
                                            const firstOnKiosk = catalogStock.find(
                                                (c) =>
                                                    c.kioskId.toLowerCase() ===
                                                    m.id.toLowerCase() &&
                                                    c.remainingVolumeMl >= 0.12
                                            );
                                            if (firstOnKiosk) {
                                                setSprayModalSlotNum(firstOnKiosk.slotNumber);
                                            }
                                            setIsSprayPerfumeMenuOpen(false);
                                        }}
                                        style={{
                                            padding: "0.42rem 0.75rem",
                                            borderRadius: "8px",
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            fontFamily: "Space Grotesk, monospace",
                                            cursor: "pointer",
                                            background:
                                                sprayModalKioskId === m.id
                                                    ? "linear-gradient(135deg, #D4AF37 0%, #F5E6AD 100%)"
                                                    : "rgba(255,255,255,0.04)",
                                            color:
                                                sprayModalKioskId === m.id
                                                    ? "#050508"
                                                    : "#CBD5E1",
                                            border:
                                                sprayModalKioskId === m.id
                                                    ? "1px solid #D4AF37"
                                                    : "1px solid rgba(255,255,255,0.12)",
                                        }}
                                    >
                                        <Cpu
                                            size={11}
                                            style={{ display: "inline", marginRight: "4px" }}
                                        />
                                        {m.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* BƯỚC 2: CHỌN ĐÍCH DANH CHAI NƯỚC HOA CẦN XỊT (-0.12ML) */}
                        <div style={{ marginBottom: "1rem", position: "relative" }}>
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
                                2.{" "}
                                {lang === "en"
                                    ? `SELECT FRAGRANCE CARTRIDGE TO DEDUCT (-0.12ML) (${sprayModalFilteredCatalog.length} AVAILABLE)`
                                    : `CHỌN ĐÍCH DANH CHAI NƯỚC HOA CẦN TRỪ (-0.12ML) (${sprayModalFilteredCatalog.length} CHAI SẴN SÀNG)`}
                            </label>
                            <div
                                className={styles.customSelectHeader}
                                onClick={() =>
                                    setIsSprayPerfumeMenuOpen(!isSprayPerfumeMenuOpen)
                                }
                            >
                                {selectedSprayModalProduct ? (
                                    <span>
                                        <strong style={{ color: "#F5E6AD" }}>
                                            [{selectedSprayModalProduct.kioskId} •{" "}
                                            {selectedSprayModalProduct.physicalSlotLabel ||
                                                `Slot 0${((selectedSprayModalProduct.slotNumber - 1) % 4) + 1}`}
                                            ]
                                        </strong>{" "}
                                        {selectedSprayModalProduct.brand} —{" "}
                                        <strong>{selectedSprayModalProduct.product}</strong> (
                                        <span style={{ color: "#34D399" }}>
                                            {selectedSprayModalProduct.remainingVolumeMl}ml
                                        </span>{" "}
                                        •{" "}
                                        {selectedSprayModalProduct.sprayPrice.toLocaleString(
                                            "vi-VN"
                                        )}
                                        đ)
                                    </span>
                                ) : (
                                    <span>No available fragrance</span>
                                )}
                                <ChevronDown size={14} color="#D4AF37" />
                            </div>

                            {isSprayPerfumeMenuOpen && (
                                <div
                                    className={styles.customDropdownList}
                                    style={{ maxHeight: "230px", overflowY: "auto" }}
                                >
                                    {sprayModalFilteredCatalog.map((item) => (
                                        <div
                                            key={`${item.kioskId}-${item.slotNumber}`}
                                            className={`${styles.customDropdownItem} ${
                                                selectedSprayModalProduct?.slotNumber ===
                                                item.slotNumber
                                                    ? styles.customDropdownItemSelected
                                                    : ""
                                            }`}
                                            onClick={() => {
                                                setSprayModalSlotNum(item.slotNumber);
                                                setIsSprayPerfumeMenuOpen(false);
                                            }}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span>
                                                <strong
                                                    style={{
                                                        color: "#D4AF37",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    [{item.kioskId}]
                                                </strong>{" "}
                                                {item.brand} — <strong>{item.product}</strong>
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: "Space Grotesk, monospace",
                                                    fontSize: "0.73rem",
                                                    color: "#34D399",
                                                }}
                                            >
                                                {item.remainingVolumeMl}ml •{" "}
                                                {item.sprayPrice.toLocaleString("vi-VN")}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* BƯỚC 3: CHỌN CỔNG THANH TOÁN QR */}
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
                                3. {lang === "en" ? "PAYMENT GATEWAY" : "PHƯƠNG THỨC THANH TOÁN"}
                            </label>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                {(["VIETQR", "MOMO", "VNPAY"] as const).map((gw) => (
                                    <button
                                        key={gw}
                                        type="button"
                                        onClick={() => setSprayModalGateway(gw)}
                                        style={{
                                            flex: 1,
                                            padding: "0.55rem",
                                            borderRadius: "9px",
                                            fontFamily: "Space Grotesk, monospace",
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            background:
                                                sprayModalGateway === gw
                                                    ? "rgba(212,175,55,0.22)"
                                                    : "rgba(255,255,255,0.04)",
                                            color:
                                                sprayModalGateway === gw
                                                    ? "#F5E6AD"
                                                    : "#94A3B8",
                                            border:
                                                sprayModalGateway === gw
                                                    ? "1px solid #D4AF37"
                                                    : "1px solid rgba(255,255,255,0.1)",
                                        }}
                                    >
                                        {gw}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TÓM TẮT TRƯỚC KHI TRỪ ML */}
                        {selectedSprayModalProduct && (
                            <div
                                style={{
                                    padding: "0.85rem 1rem",
                                    borderRadius: "12px",
                                    background: "rgba(212,175,55,0.08)",
                                    border: "1px dashed rgba(212,175,55,0.38)",
                                    fontSize: "0.78rem",
                                    color: "#E2E8F0",
                                    marginBottom: "1.25rem",
                                    lineHeight: 1.55,
                                }}
                            >
                                {lang === "en" ? (
                                    <>
                                        <strong>Execution Preview:</strong> Deducting{" "}
                                        <strong style={{ color: "#F87171" }}>-0.12ml</strong> from{" "}
                                        <strong style={{ color: "#F5E6AD" }}>
                                            {selectedSprayModalProduct.product}
                                        </strong>{" "}
                                        on station{" "}
                                        <strong>{selectedSprayModalProduct.kioskId}</strong> (
                                        {selectedSprayModalProduct.remainingVolumeMl}ml →{" "}
                                        <strong style={{ color: "#34D399" }}>
                                            {Number(
                                                Math.max(
                                                    0,
                                                    selectedSprayModalProduct.remainingVolumeMl -
                                                    0.12
                                                ).toFixed(2)
                                            )}
                                            ml
                                        </strong>
                                        ) and recording{" "}
                                        <strong style={{ color: "#F5E6AD" }}>
                                            +{selectedSprayModalProduct.sprayPrice.toLocaleString("vi-VN")} VND
                                        </strong>{" "}
                                        revenue across all screens.
                                    </>
                                ) : (
                                    <>
                                        <strong>Chi tiết thực thi:</strong> Trừ đích danh{" "}
                                        <strong style={{ color: "#F87171" }}>-0.12ml</strong> của chai{" "}
                                        <strong style={{ color: "#F5E6AD" }}>
                                            {selectedSprayModalProduct.product}
                                        </strong>{" "}
                                        tại trạm{" "}
                                        <strong>{selectedSprayModalProduct.kioskId}</strong> (từ{" "}
                                        {selectedSprayModalProduct.remainingVolumeMl}ml xuống còn{" "}
                                        <strong style={{ color: "#34D399" }}>
                                            {Number(
                                                Math.max(
                                                    0,
                                                    selectedSprayModalProduct.remainingVolumeMl -
                                                    0.12
                                                ).toFixed(2)
                                            )}
                                            ml
                                        </strong>
                                        ) và cộng{" "}
                                        <strong style={{ color: "#F5E6AD" }}>
                                            +{selectedSprayModalProduct.sprayPrice.toLocaleString("vi-VN")} VND
                                        </strong>{" "}
                                        doanh thu đồng bộ trên cả 8 màn hình.
                                    </>
                                )}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.65rem" }}>
                            <button
                                type="button"
                                onClick={() => setIsSprayModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                                style={{ flex: 1 }}
                            >
                                <span>{lang === "en" ? "Cancel" : "Hủy"}</span>
                            </button>
                            <button
                                type="button"
                                disabled={!selectedSprayModalProduct}
                                onClick={() => {
                                    if (!selectedSprayModalProduct) return;
                                    executeTargetedSprayOrder(
                                        selectedSprayModalProduct.slotNumber,
                                        sprayModalGateway,
                                        true
                                    );
                                    setIsSprayModalOpen(false);
                                }}
                                className={styles.primaryGoldBtn}
                                style={{ flex: 1.6 }}
                            >
                                <Zap size={14} />
                                <span>
                                    {lang === "en"
                                        ? `Confirm Spray & Deduct -0.12ml`
                                        : `Xác Nhận Xịt & Trừ -0.12ml`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 1: TRANSACTION DETAILS */}
            {selectedTxDetail && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedTxDetail(null)}
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
                                paddingBottom: "0.75rem",
                            }}
                        >
                            <div>
                                <span
                                    style={{
                                        fontSize: "0.68rem",
                                        color: "#D4AF37",
                                        letterSpacing: "0.14em",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    TRANSACTION TELEMETRY DETAIL
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTxDetail.id}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTxDetail(null)}
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
                                fontSize: "0.86rem",
                                marginBottom: "1.4rem",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span style={{ color: "#94A3B8" }}>
                                    Maison & Fragrance:
                                </span>
                                <strong>
                                    {selectedTxDetail.brand} —{" "}
                                    {selectedTxDetail.product}
                                </strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span style={{ color: "#94A3B8" }}>
                                    Station & Chamber:
                                </span>
                                <strong style={{ fontFamily: "Space Grotesk, monospace" }}>
                                    {selectedTxDetail.kiosk} (Slot{" "}
                                    {String(
                                        selectedTxDetail.slotNumber
                                    ).padStart(2, "0")}
                                    )
                                </strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span style={{ color: "#94A3B8" }}>
                                    Boutique Venue:
                                </span>
                                <strong>{selectedTxDetail.location}</strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span style={{ color: "#94A3B8" }}>
                                    Payment Gateway:
                                </span>
                                <strong style={{ fontFamily: "Space Grotesk, monospace" }}>
                                    {selectedTxDetail.paymentMethod}
                                </strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span style={{ color: "#94A3B8" }}>
                                    Recognized Amount:
                                </span>
                                <strong
                                    style={{
                                        color: "#F5E6AD",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTxDetail.amount.toLocaleString(
                                        "vi-VN"
                                    )}{" "}
                                    VND
                                </strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span style={{ color: "#94A3B8" }}>
                                    Execution Status:
                                </span>
                                {renderTxStatusBadge(selectedTxDetail.status)}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.65rem" }}>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/machines/${encodeURIComponent(
                                            selectedTxDetail.kiosk
                                        )}`
                                    )
                                }
                                className={styles.secondaryGoldBtn}
                                style={{ flex: 1 }}
                            >
                                <span>Open Station</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedTxDetail(null)}
                                className={styles.primaryGoldBtn}
                                style={{ flex: 1 }}
                            >
                                <span>Close Detail</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ALERT ROOT CAUSE & RECOMMENDED ACTIONS */}
            {selectedAlertDetail && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedAlertDetail(null)}
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
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    color: "#F87171",
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                    fontSize: "1.35rem",
                                }}
                            >
                                Alert {selectedAlertDetail.id}:{" "}
                                {selectedAlertDetail.type}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedAlertDetail(null)}
                                className={styles.secondaryGoldBtn}
                                style={{ padding: "0.4rem 0.55rem" }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p
                            style={{
                                fontSize: "0.86rem",
                                color: "#CBD5E1",
                                lineHeight: 1.65,
                            }}
                        >
                            <strong>Related Station:</strong>{" "}
                            {selectedAlertDetail.kiosk} (
                            {selectedAlertDetail.location})
                            <br />
                            <strong>Root Cause:</strong>{" "}
                            {selectedAlertDetail.cause}
                            <br />
                            <strong>Recommended Action:</strong>{" "}
                            <span style={{ color: "#F5E6AD" }}>
                                {selectedAlertDetail.recommendation}
                            </span>
                        </p>

                        {userRole !== "VIEWER" && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "0.65rem",
                                    marginTop: "1.25rem",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleResolveAlertAndReboot(
                                            selectedAlertDetail
                                        )
                                    }
                                    className={styles.primaryGoldBtn}
                                    style={{ flex: 1 }}
                                >
                                    <CheckCircle2 size={15} />
                                    <span>Execute Recovery & Resolve</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push("/alerts")}
                                    className={styles.secondaryGoldBtn}
                                    style={{ flex: 1 }}
                                >
                                    <span>Open Alerts Module</span>
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setSelectedAlertDetail(null)}
                            className={styles.secondaryGoldBtn}
                            style={{ width: "100%" }}
                        >
                            <span>Close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toastBanner && (
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
                        zIndex: 100002,
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                    }}
                >
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastBanner}</span>
                </div>
            )}
        </div>
    );
}