// noinspection SpellCheckingInspection
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styles from "./inventory.module.css";
import {
    Search,
    AlertTriangle,
    RefreshCw,
    Plus,
    ArrowLeftRight,
    Package,
    Droplets,
    Cpu,
    Warehouse,
    History,
    MoreHorizontal,
    X,
    ArrowUpRight,
    CheckCircle2,
    ShieldCheck,
    Layers,
    Download,
    Zap,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";

type BottleStatus =
    | "INSTALLED"
    | "AVAILABLE"
    | "NEARLY_EMPTY"
    | "EMPTY"
    | "DAMAGED"
    | "EXPIRED";

interface InventorySkuRecord {
    id: string;
    skuCode: string;
    slotNumber: number;
    productName: string;
    brand: string;
    sprayPrice: number;
    image: string;
    bottleCapacityMl: number;
    kioskCode: string;
    kioskLocation: string;
    slotLabel: string;
    installedBottleCode: string;
    machineRemainingMl: number;
    sensorLoadCellMl: number;
    thresholdMl: number;
    warehouseCode: "WH-SGN-CENTRAL" | "WH-HN-NORTH" | "WH-DAD-CENTRAL";
    warehouseLocation: string;
    warehouseBottlesCount: number;
    batchNumber: string;
    receivedDate: string;
    expirationDate: string;
    status: BottleStatus;
}

interface StockMovementRecord {
    id: string;
    dateStr: string;
    timestamp: string;
    movementType:
        | "RECEIPT"
        | "INSTALL"
        | "SALE_SPRAY"
        | "DIAGNOSTIC_SPRAY"
        | "TRANSFER"
        | "ADJUSTMENT"
        | "DISPOSAL";
    skuCode: string;
    productName: string;
    brand: string;
    bottleCode: string;
    sourceLocation: string;
    targetLocation: string;
    quantityBeforeMl: number;
    quantityAfterMl: number;
    deltaMl: number;
    actor: string;
    reason: string;
    referenceDoc: string;
}

const WAREHOUSE_LABELS: Record<InventorySkuRecord["warehouseCode"], string> = {
    "WH-SGN-CENTRAL": "Saigon Hi-Tech Warehouse",
    "WH-HN-NORTH": "Hanoi Logistics Hub",
    "WH-DAD-CENTRAL": "Da Nang Coastal Depot",
};

const INITIAL_34_INVENTORY_ITEMS: InventorySkuRecord[] = [
    { id: "INV-001", skuCode: "SKU-ARM-01", slotNumber: 1, productName: "Acqua Di Gio", brand: "Giorgio Armani", sprayPrice: 12000, image: "/images/acqua-di-gio.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0101", machineRemainingMl: 78.0, sensorLoadCellMl: 78.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-A01", receivedDate: "2026-10-18", expirationDate: "2028-09-10", status: "INSTALLED" },
    { id: "INV-002", skuCode: "SKU-ARM-02", slotNumber: 2, productName: "Acqua Di Gio Profondo", brand: "Giorgio Armani", sprayPrice: 14000, image: "/images/acqua-di-gio-profondo.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", slotLabel: "Slot 02", installedBottleCode: "BTL-2026-0102", machineRemainingMl: 64.0, sensorLoadCellMl: 64.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-A02", receivedDate: "2026-10-19", expirationDate: "2028-09-10", status: "INSTALLED" },
    { id: "INV-003", skuCode: "SKU-CHA-03", slotNumber: 3, productName: "Bleu de Chanel", brand: "Chanel", sprayPrice: 15000, image: "/images/bleu-de-chanel.png", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0103", machineRemainingMl: 12.5, sensorLoadCellMl: 12.5, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 5, batchNumber: "BATCH-2026-C01", receivedDate: "2026-10-20", expirationDate: "2028-09-12", status: "NEARLY_EMPTY" },
    { id: "INV-004", skuCode: "SKU-CHA-04", slotNumber: 4, productName: "Coco Mademoiselle", brand: "Chanel", sprayPrice: 15500, image: "/images/coco-mademoiselle.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0104", machineRemainingMl: 82.0, sensorLoadCellMl: 82.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-C02", receivedDate: "2026-10-21", expirationDate: "2028-09-12", status: "INSTALLED" },
    { id: "INV-005", skuCode: "SKU-BUR-05", slotNumber: 5, productName: "Burberry Goddess", brand: "Burberry", sprayPrice: 13000, image: "/images/burberry-goddess.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", slotLabel: "Slot 02", installedBottleCode: "BTL-2026-0105", machineRemainingMl: 71.0, sensorLoadCellMl: 71.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-B01", receivedDate: "2026-10-22", expirationDate: "2028-09-15", status: "INSTALLED" },
    { id: "INV-006", skuCode: "SKU-BUR-06", slotNumber: 6, productName: "Burberry Her", brand: "Burberry", sprayPrice: 12500, image: "/images/burberry-her.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0106", machineRemainingMl: 55.0, sensorLoadCellMl: 55.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-B02", receivedDate: "2026-10-23", expirationDate: "2028-09-15", status: "INSTALLED" },
    { id: "INV-007", skuCode: "SKU-CH-07", slotNumber: 7, productName: "Carolina Herrera Good Girl", brand: "Carolina Herrera", sprayPrice: 13500, image: "/images/carolina-herrera-good-girl.jpg", bottleCapacityMl: 80, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", slotLabel: "Slot 02", installedBottleCode: "BTL-2026-0107", machineRemainingMl: 54.0, sensorLoadCellMl: 54.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-H01", receivedDate: "2026-10-24", expirationDate: "2028-09-18", status: "INSTALLED" },
    { id: "INV-008", skuCode: "SKU-ARMF-08", slotNumber: 8, productName: "Club de Nuit Intense Man", brand: "Armaf", sprayPrice: 10000, image: "/images/club-de-nuit-intense.jpg", bottleCapacityMl: 105, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside Mall Lobby, Da Nang", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0108", machineRemainingMl: 92.0, sensorLoadCellMl: 92.0, thresholdMl: 15, warehouseCode: "WH-DAD-CENTRAL", warehouseLocation: "Da Nang Coastal Depot", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-AF1", receivedDate: "2026-10-25", expirationDate: "2028-09-20", status: "INSTALLED" },
    { id: "INV-009", skuCode: "SKU-CRD-09", slotNumber: 9, productName: "Creed Aventus", brand: "Creed", sprayPrice: 20000, image: "/images/creed-aventus.jpg", bottleCapacityMl: 100, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Luxury Atrium, HCMC", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0109", machineRemainingMl: 11.5, sensorLoadCellMl: 11.5, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-CR1", receivedDate: "2026-10-26", expirationDate: "2028-09-22", status: "NEARLY_EMPTY" },
    { id: "INV-010", skuCode: "SKU-DIO-10", slotNumber: 10, productName: "Dior Sauvage", brand: "Dior", sprayPrice: 14500, image: "/images/dior-sauvage.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0110", machineRemainingMl: 84.0, sensorLoadCellMl: 84.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 5, batchNumber: "BATCH-2026-D01", receivedDate: "2026-10-27", expirationDate: "2028-09-25", status: "INSTALLED" },
    { id: "INV-011", skuCode: "SKU-DIO-11", slotNumber: 11, productName: "Miss Dior Blooming Bouquet", brand: "Dior", sprayPrice: 13500, image: "/images/miss-dior-blooming-bouquet.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0111", machineRemainingMl: 76.0, sensorLoadCellMl: 76.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-D02", receivedDate: "2026-10-28", expirationDate: "2028-09-25", status: "INSTALLED" },
    { id: "INV-012", skuCode: "SKU-JPG-12", slotNumber: 12, productName: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", sprayPrice: 13000, image: "/images/jean-paul-gaultier-le-male.jpg", bottleCapacityMl: 125, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0112", machineRemainingMl: 77.0, sensorLoadCellMl: 77.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-J01", receivedDate: "2026-10-29", expirationDate: "2028-09-28", status: "INSTALLED" },
    { id: "INV-013", skuCode: "SKU-JPG-13", slotNumber: 13, productName: "Jean Paul Gaultier Scandal", brand: "Jean Paul Gaultier", sprayPrice: 13500, image: "/images/jean-paul-gaultier-scandal.jpg", bottleCapacityMl: 80, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0113", machineRemainingMl: 47.0, sensorLoadCellMl: 47.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-J02", receivedDate: "2026-10-30", expirationDate: "2028-09-28", status: "INSTALLED" },
    { id: "INV-014", skuCode: "SKU-LLB-14", slotNumber: 14, productName: "Le Labo Another 13", brand: "Le Labo", sprayPrice: 18000, image: "/images/le-labo-another-13.jpg", bottleCapacityMl: 100, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Luxury Atrium, HCMC", slotLabel: "Slot 02", installedBottleCode: "BTL-2026-0114", machineRemainingMl: 13.5, sensorLoadCellMl: 13.5, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-L01", receivedDate: "2026-11-01", expirationDate: "2028-10-01", status: "NEARLY_EMPTY" },
    { id: "INV-015", skuCode: "SKU-LLB-15", slotNumber: 15, productName: "Le Labo Santal 33", brand: "Le Labo", sprayPrice: 18500, image: "/images/le-labo-another-13.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0115", machineRemainingMl: 73.0, sensorLoadCellMl: 73.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-L02", receivedDate: "2026-11-02", expirationDate: "2028-10-01", status: "INSTALLED" },
    { id: "INV-016", skuCode: "SKU-MMG-16", slotNumber: 16, productName: "Replica By the Fireplace", brand: "Maison Margiela", sprayPrice: 14500, image: "/images/maison-margiela-by-the-fireplace.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-HN-02", kioskLocation: "Trang Tien Plaza Luxury Wing, Hanoi", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0116", machineRemainingMl: 80.0, sensorLoadCellMl: 80.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-M01", receivedDate: "2026-11-03", expirationDate: "2028-10-03", status: "INSTALLED" },
    { id: "INV-017", skuCode: "SKU-MMG-17", slotNumber: 17, productName: "Replica Jazz Club", brand: "Maison Margiela", sprayPrice: 14500, image: "/images/maison-margiela-by-the-fireplace.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-HN-02", kioskLocation: "Trang Tien Plaza Luxury Wing, Hanoi", slotLabel: "Slot 02", installedBottleCode: "BTL-2026-0117", machineRemainingMl: 67.0, sensorLoadCellMl: 67.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-M02", receivedDate: "2026-11-04", expirationDate: "2028-10-03", status: "INSTALLED" },
    { id: "INV-018", skuCode: "SKU-MCM-18", slotNumber: 18, productName: "MCM Eau de Parfum", brand: "MCM Worldwide", sprayPrice: 12000, image: "/images/mcm-edp.jpg", bottleCapacityMl: 75, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside Mall Lobby, Da Nang", slotLabel: "Slot 02", installedBottleCode: "BTL-2026-0118", machineRemainingMl: 66.0, sensorLoadCellMl: 66.0, thresholdMl: 15, warehouseCode: "WH-DAD-CENTRAL", warehouseLocation: "Da Nang Coastal Depot", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-MC1", receivedDate: "2026-11-05", expirationDate: "2028-10-05", status: "INSTALLED" },
    { id: "INV-019", skuCode: "SKU-MFK-19", slotNumber: 19, productName: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", sprayPrice: 21000, image: "/images/mfk-baccarat-rouge-540.jpg", bottleCapacityMl: 70, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Luxury Atrium, HCMC", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0119", machineRemainingMl: 9.0, sensorLoadCellMl: 6.2, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 5, batchNumber: "BATCH-2026-FK1", receivedDate: "2026-11-06", expirationDate: "2028-10-06", status: "NEARLY_EMPTY" },
    { id: "INV-020", skuCode: "SKU-MTB-20", slotNumber: 20, productName: "Montblanc Explorer", brand: "Montblanc", sprayPrice: 11500, image: "/images/montblanc-explorer.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0120", machineRemainingMl: 79.0, sensorLoadCellMl: 79.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-MB1", receivedDate: "2026-11-07", expirationDate: "2028-10-08", status: "INSTALLED" },
    { id: "INV-021", skuCode: "SKU-MTB-21", slotNumber: 21, productName: "Montblanc Legend", brand: "Montblanc", sprayPrice: 11000, image: "/images/montblanc-legend.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", slotLabel: "Slot 02", installedBottleCode: "BTL-2026-0121", machineRemainingMl: 85.0, sensorLoadCellMl: 85.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-MB2", receivedDate: "2026-11-08", expirationDate: "2028-10-08", status: "INSTALLED" },
    { id: "INV-022", skuCode: "SKU-NAR-22", slotNumber: 22, productName: "Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", sprayPrice: 13000, image: "/images/narciso-rodriguez-for-her.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0122", machineRemainingMl: 61.0, sensorLoadCellMl: 61.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-NR1", receivedDate: "2026-11-09", expirationDate: "2028-10-10", status: "INSTALLED" },
    { id: "INV-023", skuCode: "SKU-NAR-23", slotNumber: 23, productName: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", sprayPrice: 13500, image: "/images/narciso-rodriguez-pure-musc.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-HN-02", kioskLocation: "Trang Tien Plaza Luxury Wing, Hanoi", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0123", machineRemainingMl: 74.0, sensorLoadCellMl: 74.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-NR2", receivedDate: "2026-11-10", expirationDate: "2028-10-10", status: "INSTALLED" },
    { id: "INV-024", skuCode: "SKU-PRB-24", slotNumber: 24, productName: "Paco Rabanne 1 Million", brand: "Paco Rabanne", sprayPrice: 12500, image: "/images/paco-rabanne-1-million.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0124", machineRemainingMl: 66.0, sensorLoadCellMl: 66.0, thresholdMl: 15, warehouseCode: "WH-DAD-CENTRAL", warehouseLocation: "Da Nang Coastal Depot", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-PR1", receivedDate: "2026-11-11", expirationDate: "2028-10-12", status: "INSTALLED" },
    { id: "INV-025", skuCode: "SKU-PRB-25", slotNumber: 25, productName: "Paco Rabanne Invictus", brand: "Paco Rabanne", sprayPrice: 12500, image: "/images/paco-rabanne-invictus.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside Mall Lobby, Da Nang", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0125", machineRemainingMl: 72.0, sensorLoadCellMl: 72.0, thresholdMl: 15, warehouseCode: "WH-DAD-CENTRAL", warehouseLocation: "Da Nang Coastal Depot", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-PR2", receivedDate: "2026-11-11", expirationDate: "2028-10-12", status: "INSTALLED" },
    { id: "INV-026", skuCode: "SKU-PDM-26", slotNumber: 26, productName: "Parfums de Marly Sedley", brand: "Parfums de Marly", sprayPrice: 18500, image: "/images/parfums-de-marly-sedley.jpg", bottleCapacityMl: 125, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Luxury Atrium, HCMC", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0126", machineRemainingMl: 68.0, sensorLoadCellMl: 68.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-PM1", receivedDate: "2026-11-12", expirationDate: "2028-10-14", status: "INSTALLED" },
    { id: "INV-027", skuCode: "SKU-ROJ-27", slotNumber: 27, productName: "Roja Parfums Elysium", brand: "Roja Parfums", sprayPrice: 22000, image: "/images/roja-elysium.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0127", machineRemainingMl: 11.0, sensorLoadCellMl: 11.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-RJ1", receivedDate: "2026-11-12", expirationDate: "2028-10-15", status: "NEARLY_EMPTY" },
    { id: "INV-028", skuCode: "SKU-TF-28", slotNumber: 28, productName: "Tom Ford Black Orchid", brand: "Tom Ford", sprayPrice: 16000, image: "/images/tom-ford-black-orchid.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-004", kioskLocation: "Aeon Mall Tan Phu Celadon, HCMC", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0128", machineRemainingMl: 0.0, sensorLoadCellMl: 0.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-TF1", receivedDate: "2026-11-13", expirationDate: "2028-10-16", status: "EMPTY" },
    { id: "INV-029", skuCode: "SKU-VAL-29", slotNumber: 29, productName: "Valentino Born in Roma", brand: "Valentino", sprayPrice: 13000, image: "/images/valentino-born-in-roma.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0129", machineRemainingMl: 81.0, sensorLoadCellMl: 81.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 2, batchNumber: "BATCH-2026-VL1", receivedDate: "2026-11-13", expirationDate: "2028-10-18", status: "INSTALLED" },
    { id: "INV-030", skuCode: "SKU-VER-30", slotNumber: 30, productName: "Versace Bright Crystal", brand: "Versace", sprayPrice: 11500, image: "/images/versace-bright-crystal.jpg", bottleCapacityMl: 90, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0130", machineRemainingMl: 62.0, sensorLoadCellMl: 62.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-VS1", receivedDate: "2026-11-14", expirationDate: "2028-10-19", status: "INSTALLED" },
    { id: "INV-031", skuCode: "SKU-VER-31", slotNumber: 31, productName: "Versace Dylan Blue", brand: "Versace", sprayPrice: 12000, image: "/images/versace-dylan-blue.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside Mall Lobby, Da Nang", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0131", machineRemainingMl: 77.0, sensorLoadCellMl: 77.0, thresholdMl: 15, warehouseCode: "WH-DAD-CENTRAL", warehouseLocation: "Da Nang Coastal Depot", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-VS2", receivedDate: "2026-11-14", expirationDate: "2028-10-19", status: "INSTALLED" },
    { id: "INV-032", skuCode: "SKU-VER-32", slotNumber: 32, productName: "Versace Eros", brand: "Versace", sprayPrice: 12500, image: "/images/versace-eros.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0132", machineRemainingMl: 83.0, sensorLoadCellMl: 83.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-VS3", receivedDate: "2026-11-14", expirationDate: "2028-10-20", status: "INSTALLED" },
    { id: "INV-033", skuCode: "SKU-YSL-33", slotNumber: 33, productName: "YSL Libre Eau de Parfum", brand: "Yves Saint Laurent", sprayPrice: 14000, image: "/images/ysl-libre.jpg", bottleCapacityMl: 90, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0133", machineRemainingMl: 14.0, sensorLoadCellMl: 14.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Saigon Hi-Tech Warehouse", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-YS1", receivedDate: "2026-11-15", expirationDate: "2028-10-22", status: "NEARLY_EMPTY" },
    { id: "INV-034", skuCode: "SKU-YSL-34", slotNumber: 34, productName: "YSL Y Eau de Parfum", brand: "Yves Saint Laurent", sprayPrice: 14000, image: "/images/ysl-y-edp.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0134", machineRemainingMl: 63.0, sensorLoadCellMl: 63.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Hanoi Logistics Hub", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-YS2", receivedDate: "2026-11-15", expirationDate: "2028-10-22", status: "AVAILABLE" },
];

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

function buildSeedMovements(): StockMovementRecord[] {
    const now = new Date();
    const d0 = toLocalYmd(now);
    const d1 = toLocalYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    const d2 = toLocalYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2));
    const d3 = toLocalYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4));

    return [
        {
            id: "MOV-2026-501",
            dateStr: d0,
            timestamp: `${d0} 09:12:05`,
            movementType: "SALE_SPRAY",
            skuCode: "SKU-CHA-03",
            productName: "Bleu de Chanel",
            brand: "Chanel",
            bottleCode: "BTL-2026-0103",
            sourceLocation: "KIOSK-SGN-01 (Slot 03)",
            targetLocation: "Customer Order #TXN-2026-9102",
            quantityBeforeMl: 12.62,
            quantityAfterMl: 12.5,
            deltaMl: -0.12,
            actor: "IoT Dispense Engine",
            reason: "Verified customer Kiosk spray deduction",
            referenceDoc: "CMD-8812A",
        },
        {
            id: "MOV-2026-502",
            dateStr: d0,
            timestamp: `${d0} 08:30:00`,
            movementType: "RECEIPT",
            skuCode: "SKU-MFK-19",
            productName: "MFK Baccarat Rouge 540",
            brand: "Maison Francis Kurkdjian",
            bottleCode: "BATCH-2026-FK1 (5 Bottles)",
            sourceLocation: "MFK Paris Supplier",
            targetLocation: "WH-SGN-CENTRAL",
            quantityBeforeMl: 0,
            quantityAfterMl: 350,
            deltaMl: 350,
            actor: "Inventory Operations Staff",
            reason: "Batch stock receipt verified",
            referenceDoc: "PO-2026-992",
        },
        {
            id: "MOV-2026-503",
            dateStr: d1,
            timestamp: `${d1} 16:45:22`,
            movementType: "INSTALL",
            skuCode: "SKU-DIO-10",
            productName: "Dior Sauvage",
            brand: "Dior",
            bottleCode: "BTL-2026-0110",
            sourceLocation: "WH-HN-NORTH",
            targetLocation: "KIOSK-HN-01 (Slot 03)",
            quantityBeforeMl: 14.0,
            quantityAfterMl: 100,
            deltaMl: 86.0,
            actor: "Field Technician",
            reason: "Installed fresh 100ml cartridge into Kiosk slot",
            referenceDoc: "RFL-2026-108",
        },
        {
            id: "MOV-2026-504",
            dateStr: d2,
            timestamp: `${d2} 09:20:10`,
            movementType: "ADJUSTMENT",
            skuCode: "SKU-MFK-19",
            productName: "MFK Baccarat Rouge 540",
            brand: "Maison Francis Kurkdjian",
            bottleCode: "BTL-2026-0119",
            sourceLocation: "demo-device (Slot 04)",
            targetLocation: "demo-device (Slot 04)",
            quantityBeforeMl: 11.8,
            quantityAfterMl: 9.0,
            deltaMl: -2.8,
            actor: "Operations Manager",
            reason: "Reconciled load-cell sensor variance",
            referenceDoc: "ADJ-2026-041",
        },
        {
            id: "MOV-2026-505",
            dateStr: d3,
            timestamp: `${d3} 18:15:00`,
            movementType: "SALE_SPRAY",
            skuCode: "SKU-CRD-09",
            productName: "Creed Aventus",
            brand: "Creed",
            bottleCode: "BTL-2026-0109",
            sourceLocation: "demo-device (Slot 01)",
            targetLocation: "Customer Batch Orders",
            quantityBeforeMl: 16.0,
            quantityAfterMl: 11.5,
            deltaMl: -4.5,
            actor: "IoT Dispense Engine",
            reason: "Cumulative verified Kiosk sprays",
            referenceDoc: "BATCH-SPRAY-09",
        },
    ];
}

const INVENTORY_STORAGE_KEY = "scentstation_commercial_inventory_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const ALERTS_STORAGE_KEY = "scentstation_commercial_alerts_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type InventoryTab =
    | "ALL"
    | "BY_PRODUCT"
    | "BY_BRAND"
    | "BY_LOCATION"
    | "MACHINE_STOCK"
    | "WAREHOUSE_STOCK"
    | "MOVEMENTS";

type SummaryFilterCard = "ALL" | "LOW_STOCK" | "IN_MACHINES" | "IN_WAREHOUSE";
type TrendScopeMode = "MACHINE_ONLY" | "TOTAL_NET" | "WAREHOUSE_ONLY";
type QuickDatePreset = "TODAY" | "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "CUSTOM";

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

function computeBottleStatus(
    remMl: number,
    thresholdMl: number,
    currentStatus: BottleStatus = "INSTALLED"
): BottleStatus {
    if (currentStatus === "DAMAGED" || currentStatus === "EXPIRED") {
        return currentStatus;
    }
    if (remMl < 0.12) return "EMPTY";
    if (remMl <= thresholdMl) return "NEARLY_EMPTY";
    return currentStatus === "AVAILABLE" ? "AVAILABLE" : "INSTALLED";
}

function formatNowStr(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export default function InventoryPage() {
    const router = useRouter();
    const filterBarRef = useRef<HTMLDivElement | null>(null);

    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [currentActorRole, setCurrentActorRole] = useState<string>("Platform Super Administrator");
    const [isViewerReadOnly, setIsViewerReadOnly] = useState<boolean>(false);

    const [inventory, setInventory] = useState<InventorySkuRecord[]>(INITIAL_34_INVENTORY_ITEMS);
    const [movements, setMovements] = useState<StockMovementRecord[]>(() => buildSeedMovements());

    // LỊCH THỰC TẾ GIỐNG HỆT MÀN 9 & MÀN 10
    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [activeTab, setActiveTab] = useState<InventoryTab>("ALL");
    const [summaryFilter, setSummaryFilter] = useState<SummaryFilterCard>("ALL");

    const [openDropdown, setOpenDropdown] = useState<
        "CALENDAR" | "BRAND" | "LOCATION" | "STATUS" | null
    >(null);

    const [trendUnit, setTrendUnit] = useState<"VOLUME_ML" | "BOTTLES">("VOLUME_ML");
    const [trendScope, setTrendScope] = useState<TrendScopeMode>("MACHINE_ONLY");
    const [selectedChartBarIdx, setSelectedChartBarIdx] = useState<number>(5);

    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modal Add Stock
    const [isAddStockOpen, setIsAddStockOpen] = useState<boolean>(false);
    const [addSkuId, setAddSkuId] = useState<string>("INV-003");
    const [addWarehouse, setAddWarehouse] =
        useState<InventorySkuRecord["warehouseCode"]>("WH-SGN-CENTRAL");
    const [addBottlesQty, setAddBottlesQty] = useState<number>(5);
    const [addBatchNumber, setAddBatchNumber] = useState<string>("BATCH-2026-NEW99");
    const [addExpiryDate, setAddExpiryDate] = useState<string>("2028-12-31");
    const [modalError, setModalError] = useState<string>("");

    // Modal Manage Stock
    const [isManageStockOpen, setIsManageStockOpen] = useState<boolean>(false);
    const [manageType, setManageType] = useState<
        | "ALLOCATE_TO_KIOSK"
        | "WAREHOUSE_TRANSFER"
        | "MANUAL_ADJUSTMENT"
        | "DAMAGE_DISPOSAL"
    >("ALLOCATE_TO_KIOSK");
    const [manageSkuId, setManageSkuId] = useState<string>("INV-003");
    const [manageTargetWarehouse, setManageTargetWarehouse] =
        useState<InventorySkuRecord["warehouseCode"]>("WH-HN-NORTH");
    const [manageDeltaMl, setManageDeltaMl] = useState<number>(100);
    const [manageReason, setManageReason] = useState<string>("");

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const selectedItem = useMemo(
        () => inventory.find((i) => i.id === selectedItemId) || null,
        [inventory, selectedItemId]
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

    /* --- 1. ĐỒNG BỘ 2 CHIỀU TOÀN DIỆN VỚI MÀN 1, 2, 4, 5, 6, 7, 8, 9, 10 --- */
    const loadAndReconcileInventory = useCallback(() => {
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
                setCurrentActorRole(parsedUser.fullName || parsedUser.name || roleCode);
                setIsViewerReadOnly(roleCode === "VW" || roleCode === "VIEWER");
                if (roleCode === "BA" && parsedUser.brandScope) {
                    setSelectedBrand(parsedUser.brandScope);
                }
            }

            // A. Đọc KIOSK_PER_UNIT_STOCK_KEY (Ma trận tồn kho từng máy dùng chung với Màn 1, 4, 5, 6, 7, 8, 9, 10)
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            let workingInv = [...INITIAL_34_INVENTORY_ITEMS];
            let workingMovements = [...buildSeedMovements()];

            const rawSavedInv = localStorage.getItem(INVENTORY_STORAGE_KEY);
            if (rawSavedInv) {
                const parsedInv = JSON.parse(rawSavedInv);
                if (Array.isArray(parsedInv.inventory) && parsedInv.inventory.length >= 34) {
                    workingInv = parsedInv.inventory;
                }
                if (Array.isArray(parsedInv.movements) && parsedInv.movements.length > 0) {
                    workingMovements = parsedInv.movements.map((mv: any) => ({
                        ...mv,
                        dateStr: mv.dateStr || String(mv.timestamp || todayYmd).slice(0, 10),
                    }));
                }
            }

            // B. Đọc MACHINES_STORAGE_KEY (/machines & /machines/[id])
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            const machineSlotLookup = new Map<
                string,
                {
                    kioskCode: string;
                    kioskLoc: string;
                    slotLabel: string;
                    remMl: number;
                    pricePerSpray?: number;
                }
            >();
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    parsedMachines.forEach((m: any) => {
                        const kCode = m.code || m.id || "demo-device";
                        const kLoc = m.locationName || "Diamond Plaza Luxury Atrium, HCMC";
                        if (Array.isArray(m.slots)) {
                            m.slots.forEach((sl: any, sIdx: number) => {
                                if (sl.fragranceName) {
                                    machineSlotLookup.set(
                                        String(sl.fragranceName).trim().toLowerCase(),
                                        {
                                            kioskCode: kCode,
                                            kioskLoc: kLoc,
                                            slotLabel: sl.slotLabel || `Slot 0${sIdx + 1}`,
                                            remMl: Number(sl.remainingMl ?? 100),
                                            pricePerSpray: sl.pricePerSpray
                                                ? Number(sl.pricePerSpray)
                                                : undefined,
                                        }
                                    );
                                }
                            });
                        }
                    });
                }
            }

            // C. Đọc PRODUCTS_STORAGE_KEY (/products) — Tự động thêm cả các SKU thứ 35+ mới tạo từ Màn 5
            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            const prodLookup = new Map<
                string,
                {
                    remMl?: number;
                    whBottles?: number;
                    whHub?: InventorySkuRecord["warehouseCode"];
                    price?: number;
                    capMl?: number;
                }
            >();
            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds)) {
                    parsedProds.forEach((p: any, idx: number) => {
                        if (!p || !p.name) return;
                        const lowerP = String(p.name).trim().toLowerCase();
                        prodLookup.set(lowerP, {
                            remMl: p.assignedMachines?.[0]?.remainingVolumeMl,
                            whBottles: p.warehouseReserveBottles,
                            whHub: p.warehouseHub,
                            price: Number(p.pricePerSpray || 15000),
                            capMl: Number(p.bottleVolumeMl || 100),
                        });

                        // Nếu đây là sản phẩm thứ 35+ mới được tạo ở Màn 5 -> tự động nạp vào Inventory
                        const existsInInv = workingInv.some(
                            (inv) =>
                                isExactMatch(inv.productName, p.name) ||
                                inv.slotNumber === Number(p.slotNumber)
                        );
                        if (!existsInInv) {
                            const primaryAssigned = p.assignedMachines?.[0];
                            const kCode = primaryAssigned?.kioskCode || "demo-device";
                            const cap = Number(p.bottleVolumeMl || 100);
                            const rem = Number(
                                perKioskMatrix[kCode.toLowerCase()]?.[lowerP] ??
                                primaryAssigned?.remainingVolumeMl ??
                                cap
                            );
                            workingInv.push({
                                id: `INV-0${workingInv.length + 1}`,
                                skuCode: p.skuCode || `SKU-NEW-${idx + 1}`,
                                slotNumber: Number(p.slotNumber || workingInv.length + 1),
                                productName: p.name,
                                brand: p.brand || "Luxury Maison",
                                sprayPrice: Number(p.pricePerSpray || 15000),
                                image: p.image || "/images/creed-aventus.jpg",
                                bottleCapacityMl: cap,
                                kioskCode: kCode,
                                kioskLocation:
                                    primaryAssigned?.location ||
                                    "Diamond Plaza Luxury Atrium, HCMC",
                                slotLabel: primaryAssigned?.physicalSlotLabel || "Slot 04",
                                installedBottleCode:
                                    primaryAssigned?.bottleCode || `BTL-2026-01${idx + 1}`,
                                machineRemainingMl: rem,
                                sensorLoadCellMl: rem,
                                thresholdMl: 15,
                                warehouseCode: "WH-SGN-CENTRAL",
                                warehouseLocation: "Saigon Hi-Tech Warehouse",
                                warehouseBottlesCount: Number(p.warehouseReserveBottles ?? 3),
                                batchNumber: p.batchNumber || `BATCH-2026-N${idx + 1}`,
                                receivedDate: todayYmd,
                                expirationDate: "2028-12-31",
                                status: computeBottleStatus(rem, 15),
                            });
                        }
                    });
                }
            }

            // D. Hợp nhất lịch sử biến động từ INVENTORY_MOVEMENTS_KEY chung của hệ thống
            const rawSharedMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
            if (rawSharedMov) {
                const parsedShared = JSON.parse(rawSharedMov);
                if (Array.isArray(parsedShared) && parsedShared.length > 0) {
                    const existingRefs = new Set(workingMovements.map((m) => m.referenceDoc));
                    parsedShared.slice(0, 15).forEach((sm: any) => {
                        const refDoc = String(sm.orderId || sm.movementId || "");
                        if (!refDoc || existingRefs.has(refDoc)) return;
                        const tsIso = String(sm.timestamp || new Date().toISOString());
                        const dPart = tsIso.includes("T") ? tsIso.split("T")[0] : todayYmd;
                        const tPart = tsIso.includes("T")
                            ? tsIso.split("T")[1].slice(0, 8)
                            : "14:20:00";

                        workingMovements.unshift({
                            id: `MOV-${refDoc.slice(-4)}`,
                            dateStr: dPart,
                            timestamp: `${dPart} ${tPart}`,
                            movementType: sm.deltaMl > 0 ? "INSTALL" : "SALE_SPRAY",
                            skuCode: `SKU-0${sm.slotNumber || 1}`,
                            productName: sm.productName || "Signature Scent",
                            brand: sm.brand || "Luxury Maison",
                            bottleCode: `BTL-2026-01${String(sm.slotNumber || 1).padStart(2, "0")}`,
                            sourceLocation: `${sm.kioskCode || "demo-device"} (Slot 0${sm.slotNumber || 1})`,
                            targetLocation: `Order #${refDoc}`,
                            quantityBeforeMl: Number(sm.quantityBeforeMl || 75),
                            quantityAfterMl: Number(sm.quantityAfterMl || 74.88),
                            deltaMl: Number(sm.deltaMl || -0.12),
                            actor: "IoT Dispense Engine",
                            reason: sm.reason || "Synchronized live spray deduction",
                            referenceDoc: refDoc,
                        });
                        existingRefs.add(refDoc);
                    });
                }
            }

            // E. Cập nhật dung tích thực tế từng SKU từ perKioskMatrix + machineSlotLookup + prodLookup
            workingInv = workingInv.map((item) => {
                const lowerName = item.productName.trim().toLowerCase();
                const machineInfo = machineSlotLookup.get(lowerName);
                const prodInfo = prodLookup.get(lowerName);
                const kCode = machineInfo?.kioskCode || item.kioskCode;
                const kLower = kCode.toLowerCase();
                const matrixMl = perKioskMatrix[kLower]?.[lowerName];

                let nextMachineMl = item.machineRemainingMl;
                if (typeof matrixMl === "number") {
                    nextMachineMl = matrixMl;
                } else if (machineInfo && typeof machineInfo.remMl === "number") {
                    nextMachineMl = machineInfo.remMl;
                } else if (typeof prodInfo?.remMl === "number") {
                    nextMachineMl = prodInfo.remMl;
                }
                nextMachineMl = Number(Math.max(0, nextMachineMl).toFixed(2));

                const nextWhBottles =
                    typeof prodInfo?.whBottles === "number"
                        ? prodInfo.whBottles
                        : item.warehouseBottlesCount;

                const nextSensorMl =
                    item.id === "INV-019" &&
                    Math.abs(item.machineRemainingMl - item.sensorLoadCellMl) >= 2.0 &&
                    nextMachineMl === 9.0
                        ? 6.2
                        : nextMachineMl;

                return {
                    ...item,
                    sprayPrice:
                        prodInfo?.price || machineInfo?.pricePerSpray || item.sprayPrice,
                    kioskCode: kCode,
                    kioskLocation: machineInfo?.kioskLoc || item.kioskLocation,
                    slotLabel: machineInfo?.slotLabel || item.slotLabel,
                    machineRemainingMl: nextMachineMl,
                    sensorLoadCellMl: nextSensorMl,
                    warehouseBottlesCount: nextWhBottles,
                    status: computeBottleStatus(
                        nextMachineMl,
                        item.thresholdMl,
                        item.status
                    ),
                };
            });

            setInventory(workingInv);
            setMovements(workingMovements);
        } catch {
            // Safe fallback
        }
    }, [todayYmd]);

    useEffect(() => {
        loadAndReconcileInventory();

        const handleCrossTabSync = () => {
            loadAndReconcileInventory();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileInventory();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileInventory]);

    /* --- 2. GHI & ĐỒNG BỘ NGƯỢC TỪ INVENTORY SANG TẤT CẢ 10 MÀN HÌNH KIA --- */
    const persistInventoryAndPropagateAll = useCallback(
        (
            nextInv: InventorySkuRecord[],
            nextMovements: StockMovementRecord[],
            modifiedItem?: InventorySkuRecord,
            options?: {
                didReplenishFull?: boolean;
                recordedSpraySale?: boolean;
                deltaMl?: number;
            }
        ) => {
            setInventory(nextInv);
            setMovements(nextMovements);
            setSelectedChartBarIdx(5);

            try {
                localStorage.setItem(
                    INVENTORY_STORAGE_KEY,
                    JSON.stringify({
                        inventory: nextInv,
                        movements: nextMovements,
                    })
                );

                if (!modifiedItem) return;
                const lowerProdName = modifiedItem.productName.trim().toLowerCase();
                const kKey = modifiedItem.kioskCode.toLowerCase();
                const nowIso = new Date().toISOString();

                // 1. Cập nhật KIOSK_PER_UNIT_STOCK_KEY (Để Màn 1, 4, 5, 6, 7, 8, 9, 10 nhận đúng số ml ngay tức khắc)
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                    ? JSON.parse(rawMatrix)
                    : {};
                if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                perKioskMatrix[kKey][lowerProdName] = Number(modifiedItem.machineRemainingMl);
                localStorage.setItem(
                    KIOSK_PER_UNIT_STOCK_KEY,
                    JSON.stringify(perKioskMatrix)
                );

                // 2. Cập nhật PRODUCTS_STORAGE_KEY (Cộng cả liveExtraSprays & samplingSessions30d cho Màn 5)
                const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                if (rawProds) {
                    const parsedProds = JSON.parse(rawProds);
                    if (Array.isArray(parsedProds)) {
                        const syncedProds = parsedProds.map((p: any) => {
                            if (
                                p.slotNumber !== modifiedItem.slotNumber &&
                                !isExactMatch(p.name || "", modifiedItem.productName)
                            ) {
                                return p;
                            }
                            const nextExtra = options?.recordedSpraySale
                                ? Number(p.liveExtraSprays || 0) + 1
                                : Number(p.liveExtraSprays || 0);
                            const base30d = Number(p.baseSessions30d || 300);

                            return {
                                ...p,
                                warehouseHub: modifiedItem.warehouseCode,
                                warehouseReserveBottles:
                                modifiedItem.warehouseBottlesCount,
                                batchNumber: modifiedItem.batchNumber,
                                liveExtraSprays: nextExtra,
                                samplingSessions30d: base30d + nextExtra,
                                assignedMachines: Array.isArray(p.assignedMachines)
                                    ? p.assignedMachines.map((am: any, idx: number) =>
                                        idx === 0 ||
                                        String(am.kioskCode || "").toLowerCase() === kKey
                                            ? {
                                                ...am,
                                                bottleCode:
                                                modifiedItem.installedBottleCode,
                                                remainingVolumeMl:
                                                modifiedItem.machineRemainingMl,
                                            }
                                            : am
                                    )
                                    : p.assignedMachines,
                            };
                        });
                        localStorage.setItem(
                            PRODUCTS_STORAGE_KEY,
                            JSON.stringify(syncedProds)
                        );
                    }
                }

                // 3. Cập nhật MACHINES_STORAGE_KEY (Cho Màn 1, 4, 6, 7)
                const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawMachines) {
                    const parsedMachines = JSON.parse(rawMachines);
                    if (Array.isArray(parsedMachines)) {
                        const syncedMachines = parsedMachines.map((m: any) => {
                            if (String(m.code || m.id || "").toLowerCase() !== kKey) {
                                return m;
                            }
                            return {
                                ...m,
                                status:
                                    options?.didReplenishFull && m.status === "OFFLINE"
                                        ? "ONLINE"
                                        : m.status,
                                connectionStatus:
                                    options?.didReplenishFull && m.status === "OFFLINE"
                                        ? "ONLINE"
                                        : m.connectionStatus || "ONLINE",
                                operatingStatus:
                                    options?.didReplenishFull && m.status === "OFFLINE"
                                        ? "ACTIVE"
                                        : m.operatingStatus || "ACTIVE",
                                manualAdminOverride: true,
                                todaySprays: options?.recordedSpraySale
                                    ? (m.todaySprays || 0) + 1
                                    : m.todaySprays,
                                todayRevenue: options?.recordedSpraySale
                                    ? (m.todayRevenue || 0) + modifiedItem.sprayPrice
                                    : m.todayRevenue,
                                slots: Array.isArray(m.slots)
                                    ? m.slots.map((sl: any) =>
                                        isExactMatch(
                                            sl.fragranceName || "",
                                            modifiedItem.productName
                                        )
                                            ? {
                                                ...sl,
                                                remainingMl:
                                                modifiedItem.machineRemainingMl,
                                                available:
                                                    modifiedItem.machineRemainingMl >=
                                                    0.12,
                                            }
                                            : sl
                                    )
                                    : m.slots,
                            };
                        });
                        localStorage.setItem(
                            MACHINES_STORAGE_KEY,
                            JSON.stringify(syncedMachines)
                        );
                    }
                }

                // 4. Cập nhật DASHBOARD_STORAGE_KEY & INVENTORY_MOVEMENTS_KEY (Cho Màn 8, 9, 10)
                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                const dashData = rawDash
                    ? JSON.parse(rawDash)
                    : { transactions: [], incidents: [], alerts: [] };
                if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                if (!Array.isArray(dashData.alerts)) dashData.alerts = [];

                if (options?.recordedSpraySale) {
                    const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
                    dashData.transactions.unshift({
                        id: newOrderId,
                        time: `Completed (${modifiedItem.kioskCode})`,
                        kiosk: modifiedItem.kioskCode,
                        location: modifiedItem.kioskLocation,
                        brand: modifiedItem.brand,
                        product: modifiedItem.productName,
                        slotNumber: modifiedItem.slotNumber,
                        priceSnapshot: modifiedItem.sprayPrice,
                        amount: modifiedItem.sprayPrice,
                        paidAmount: modifiedItem.sprayPrice,
                        volumeDeductedMl: 0.12,
                        paymentMethod: "VIETQR",
                        providerReference: `PAY-VIETQR-${newOrderId}`,
                        status: "DISPENSED",
                        commandReference: `CMD-${newOrderId}`,
                        ackedAt: nowIso,
                        executedAt: nowIso,
                        createdAt: nowIso,
                        dateType: "TODAY",
                    });

                    const rawMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movList = rawMov ? JSON.parse(rawMov) : [];
                    movList.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: newOrderId,
                        kioskCode: modifiedItem.kioskCode,
                        slotNumber: modifiedItem.slotNumber,
                        brand: modifiedItem.brand,
                        productName: modifiedItem.productName,
                        movementType: "SALE",
                        quantityBeforeMl: Number(
                            (modifiedItem.machineRemainingMl + 0.12).toFixed(2)
                        ),
                        quantityAfterMl: modifiedItem.machineRemainingMl,
                        deltaMl: -0.12,
                        reason: `Inventory module spray on ${modifiedItem.kioskCode}`,
                        timestamp: nowIso,
                    });
                    localStorage.setItem(
                        INVENTORY_MOVEMENTS_KEY,
                        JSON.stringify(movList.slice(0, 300))
                    );
                }

                const alertTypeKey = `LOW_STOCK_SLOT_${String(
                    modifiedItem.slotNumber
                ).padStart(2, "0")}`;
                if (modifiedItem.machineRemainingMl > modifiedItem.thresholdMl) {
                    dashData.alerts = dashData.alerts.filter(
                        (a: any) => a.type !== alertTypeKey
                    );
                }
                localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));

                // 5. Ghi Audit Log (BR11)
                const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                auditList.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: nowIso,
                    actor: currentActorRole,
                    role: "IS",
                    tenant: modifiedItem.brand,
                    action: options?.didReplenishFull
                        ? "INVENTORY_SLOT_REPLENISHED"
                        : options?.recordedSpraySale
                            ? "INVENTORY_SPRAY_DEDUCTED"
                            : "INVENTORY_STOCK_UPDATED",
                    entityType: "INVENTORY",
                    entityId: modifiedItem.skuCode,
                    severity: "INFO",
                    oldValues: null,
                    newValues: {
                        machineRemainingMl: modifiedItem.machineRemainingMl,
                        warehouseBottlesCount: modifiedItem.warehouseBottlesCount,
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
            } catch {
                // Safe fallback
            }
        },
        [currentActorRole]
    );

    const uniqueBrands = useMemo(
        () => Array.from(new Set(inventory.map((i) => i.brand))).sort(),
        [inventory]
    );
    const uniqueLocations = useMemo(
        () =>
            Array.from(
                new Set([
                    ...inventory.map((i) => i.kioskCode),
                    ...inventory.map((i) => i.warehouseCode),
                ])
            ).sort(),
        [inventory]
    );

    // 1. Tính toán 5 thẻ KPI Summary Cards (No Double-Counting)
    const overviewMetrics = useMemo(() => {
        const installedBottles = inventory.filter(
            (i) => i.machineRemainingMl >= 0.12
        ).length;
        const warehouseBottles = inventory.reduce(
            (sum, i) => sum + i.warehouseBottlesCount,
            0
        );
        const totalBottles = installedBottles + warehouseBottles;

        const machineVolumeMl = inventory.reduce(
            (sum, i) => sum + i.machineRemainingMl,
            0
        );
        const warehouseVolumeMl = inventory.reduce(
            (sum, i) => sum + i.warehouseBottlesCount * i.bottleCapacityMl,
            0
        );
        const totalVolumeMl = +(machineVolumeMl + warehouseVolumeMl).toFixed(2);

        const lowStockCount = inventory.filter(
            (i) => i.machineRemainingMl <= i.thresholdMl
        ).length;

        return {
            totalBottles,
            installedBottles,
            warehouseBottles,
            totalVolumeMl,
            machineVolumeMl: +machineVolumeMl.toFixed(2),
            warehouseVolumeMl,
            lowStockCount,
        };
    }, [inventory]);

    // Lọc danh sách theo Search, Dropdown Filters, Summary Card & Active Tab
    const filteredInventory = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = inventory.filter((item) => {
            const matchesSearch =
                !q ||
                item.productName.toLowerCase().includes(q) ||
                item.brand.toLowerCase().includes(q) ||
                item.skuCode.toLowerCase().includes(q) ||
                item.installedBottleCode.toLowerCase().includes(q) ||
                item.batchNumber.toLowerCase().includes(q) ||
                item.kioskCode.toLowerCase().includes(q) ||
                item.warehouseCode.toLowerCase().includes(q);

            const matchesBrand =
                selectedBrand === "ALL" || isExactMatch(item.brand, selectedBrand);
            const matchesLoc =
                selectedLocation === "ALL" ||
                isExactMatch(item.kioskCode, selectedLocation) ||
                isExactMatch(item.warehouseCode, selectedLocation);
            const matchesStatus =
                selectedStatus === "ALL" || item.status === selectedStatus;

            const matchesSummary =
                summaryFilter === "ALL" ||
                (summaryFilter === "LOW_STOCK" &&
                    item.machineRemainingMl <= item.thresholdMl) ||
                (summaryFilter === "IN_MACHINES" &&
                    item.machineRemainingMl >= 0.12) ||
                (summaryFilter === "IN_WAREHOUSE" &&
                    item.warehouseBottlesCount > 0);

            const matchesTab =
                activeTab === "MACHINE_STOCK"
                    ? item.machineRemainingMl >= 0.12
                    : activeTab === "WAREHOUSE_STOCK"
                        ? item.warehouseBottlesCount > 0
                        : true;

            return (
                matchesSearch &&
                matchesBrand &&
                matchesLoc &&
                matchesStatus &&
                matchesSummary &&
                matchesTab
            );
        });

        if (activeTab === "BY_PRODUCT") {
            return [...filtered].sort(
                (a, b) => a.machineRemainingMl - b.machineRemainingMl
            );
        }
        return filtered;
    }, [
        inventory,
        searchQuery,
        selectedBrand,
        selectedLocation,
        selectedStatus,
        summaryFilter,
        activeTab,
    ]);

    // Lọc danh sách Stock Movements theo cả Lịch thực tế [startDate..endDate], Search, Brand, Location
    const filteredMovements = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return movements.filter((mv) => {
            const dStr = mv.dateStr || mv.timestamp.slice(0, 10);
            const matchesDate = dStr >= startDate && dStr <= endDate;
            const matchesSearch =
                !q ||
                mv.id.toLowerCase().includes(q) ||
                mv.productName.toLowerCase().includes(q) ||
                mv.brand.toLowerCase().includes(q) ||
                mv.skuCode.toLowerCase().includes(q) ||
                mv.bottleCode.toLowerCase().includes(q) ||
                mv.sourceLocation.toLowerCase().includes(q) ||
                mv.targetLocation.toLowerCase().includes(q) ||
                mv.reason.toLowerCase().includes(q);
            const matchesBrand =
                selectedBrand === "ALL" || isExactMatch(mv.brand, selectedBrand);
            const matchesLoc =
                selectedLocation === "ALL" ||
                mv.sourceLocation.includes(selectedLocation) ||
                mv.targetLocation.includes(selectedLocation);
            return matchesDate && matchesSearch && matchesBrand && matchesLoc;
        });
    }, [movements, startDate, endDate, searchQuery, selectedBrand, selectedLocation]);

    // Biểu đồ Động thời gian thực từ Sổ cái Biến động Kho
    const dynamicStockTrendBars = useMemo(() => {
        const curMachineMl = +filteredInventory
            .reduce((s, i) => s + i.machineRemainingMl, 0)
            .toFixed(2);
        const curWarehouseMl = +filteredInventory
            .reduce((s, i) => s + i.warehouseBottlesCount * i.bottleCapacityMl, 0)
            .toFixed(2);
        const curTotalMl = +(curMachineMl + curWarehouseMl).toFixed(2);

        const curMachineBtl = filteredInventory.filter(
            (i) => i.machineRemainingMl >= 0.12
        ).length;
        const curWarehouseBtl = filteredInventory.reduce(
            (s, i) => s + i.warehouseBottlesCount,
            0
        );
        const curTotalBtl = curMachineBtl + curWarehouseBtl;

        const currentActiveMl =
            trendScope === "MACHINE_ONLY"
                ? curMachineMl
                : trendScope === "WAREHOUSE_ONLY"
                    ? curWarehouseMl
                    : curTotalMl;

        const currentActiveBtl =
            trendScope === "MACHINE_ONLY"
                ? curMachineBtl
                : trendScope === "WAREHOUSE_ONLY"
                    ? curWarehouseBtl
                    : curTotalBtl;

        const relevantMoves = filteredMovements
            .filter((mv) => {
                if (trendScope === "MACHINE_ONLY") {
                    return mv.movementType !== "RECEIPT" && mv.movementType !== "TRANSFER";
                }
                if (trendScope === "WAREHOUSE_ONLY") {
                    return mv.movementType === "RECEIPT" || mv.movementType === "INSTALL";
                }
                return true;
            })
            .slice(0, 5);

        const snapshots: {
            label: string;
            ml: number;
            btl: number;
            deltaMl: number;
            moveEvent: string;
        }[] = [];

        let runningMl = currentActiveMl;
        let runningBtl = currentActiveBtl;

        const latestMove = relevantMoves[0];
        const latestEffectiveDelta = latestMove
            ? trendScope === "WAREHOUSE_ONLY" &&
            latestMove.movementType === "INSTALL"
                ? -100
                : trendScope === "TOTAL_NET" &&
                latestMove.movementType === "INSTALL"
                    ? +(latestMove.deltaMl - 100).toFixed(2)
                    : latestMove.deltaMl
            : 0;

        snapshots.unshift({
            label: "Live Now",
            ml: +runningMl.toFixed(2),
            btl: Math.max(0, runningBtl),
            deltaMl: latestEffectiveDelta,
            moveEvent: latestMove
                ? `${latestMove.movementType}: ${latestMove.productName} (${
                    latestEffectiveDelta >= 0
                        ? `+${latestEffectiveDelta}`
                        : latestEffectiveDelta
                }ml)`
                : "Current Synchronized Balance",
        });

        for (let step = 0; step < 5; step++) {
            const mv = relevantMoves[step];
            let stepDeltaMl = 0;
            let stepDeltaBtl = 0;

            if (mv) {
                if (trendScope === "MACHINE_ONLY") {
                    stepDeltaMl = mv.deltaMl;
                    stepDeltaBtl =
                        mv.movementType === "INSTALL"
                            ? 1
                            : mv.movementType === "DISPOSAL"
                                ? -1
                                : 0;
                } else if (trendScope === "WAREHOUSE_ONLY") {
                    stepDeltaMl =
                        mv.movementType === "RECEIPT"
                            ? mv.deltaMl
                            : mv.movementType === "INSTALL"
                                ? -100
                                : 0;
                    stepDeltaBtl =
                        mv.movementType === "RECEIPT"
                            ? Math.max(1, Math.round(mv.deltaMl / 100))
                            : mv.movementType === "INSTALL"
                                ? -1
                                : 0;
                } else {
                    stepDeltaMl =
                        mv.movementType === "INSTALL"
                            ? +(mv.deltaMl - 100).toFixed(2)
                            : mv.deltaMl;
                    stepDeltaBtl =
                        mv.movementType === "RECEIPT"
                            ? Math.max(1, Math.round(mv.deltaMl / 100))
                            : 0;
                }
            } else {
                stepDeltaMl = -(step + 1) * 2.4;
                stepDeltaBtl = 0;
            }

            runningMl = Math.max(0, +(runningMl - stepDeltaMl).toFixed(2));
            runningBtl = Math.max(0, runningBtl - stepDeltaBtl);

            const prevMv = relevantMoves[step + 1];
            const dayLabel = formatShortDdMm(addDaysToYmd(endDate, -(step + 1)));
            snapshots.unshift({
                label: prevMv ? `${dayLabel} (${prevMv.id.slice(-3)})` : dayLabel,
                ml: runningMl,
                btl: runningBtl,
                deltaMl: prevMv ? prevMv.deltaMl : 0,
                moveEvent: prevMv
                    ? `${prevMv.movementType}: ${prevMv.productName} (${prevMv.timestamp.slice(
                        11
                    )})`
                    : `Historical Checkpoint (${dayLabel})`,
            });
        }

        const values = snapshots.map((s) =>
            trendUnit === "VOLUME_ML" ? s.ml : s.btl
        );
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const span = maxVal - minVal;

        return snapshots.map((s, idx) => {
            const val = trendUnit === "VOLUME_ML" ? s.ml : s.btl;
            let computedPct = 78;
            if (span > 0) {
                computedPct = Math.round(36 + ((val - minVal) / span) * 60);
            } else {
                computedPct = 75 + (idx % 3) * 4;
            }
            return {
                ...s,
                pct: Math.max(28, Math.min(96, computedPct)),
            };
        });
    }, [filteredInventory, filteredMovements, trendScope, trendUnit, endDate]);

    const groupedInventoryBreakdown = useMemo(() => {
        if (activeTab !== "BY_BRAND" && activeTab !== "BY_LOCATION") return [];

        const map = new Map<
            string,
            {
                groupKey: string;
                subText: string;
                skusCount: number;
                machineMl: number;
                warehouseBottles: number;
                warehouseMl: number;
                lowStockSlots: number;
            }
        >();

        filteredInventory.forEach((item) => {
            if (activeTab === "BY_BRAND") {
                const cur = map.get(item.brand) || {
                    groupKey: item.brand,
                    subText: `Warehouse: ${item.warehouseCode}`,
                    skusCount: 0,
                    machineMl: 0,
                    warehouseBottles: 0,
                    warehouseMl: 0,
                    lowStockSlots: 0,
                };
                cur.skusCount += 1;
                cur.machineMl = +(cur.machineMl + item.machineRemainingMl).toFixed(2);
                cur.warehouseBottles += item.warehouseBottlesCount;
                cur.warehouseMl += item.warehouseBottlesCount * item.bottleCapacityMl;
                if (item.machineRemainingMl <= item.thresholdMl) cur.lowStockSlots += 1;
                map.set(item.brand, cur);
            } else {
                const kKey = item.kioskCode;
                const curK = map.get(kKey) || {
                    groupKey: kKey,
                    subText: item.kioskLocation,
                    skusCount: 0,
                    machineMl: 0,
                    warehouseBottles: 0,
                    warehouseMl: 0,
                    lowStockSlots: 0,
                };
                curK.skusCount += 1;
                curK.machineMl = +(curK.machineMl + item.machineRemainingMl).toFixed(2);
                if (item.machineRemainingMl <= item.thresholdMl) curK.lowStockSlots += 1;
                map.set(kKey, curK);

                const wKey = item.warehouseCode;
                const curW = map.get(wKey) || {
                    groupKey: wKey,
                    subText: item.warehouseLocation,
                    skusCount: 0,
                    machineMl: 0,
                    warehouseBottles: 0,
                    warehouseMl: 0,
                    lowStockSlots: 0,
                };
                curW.skusCount += 1;
                curW.warehouseBottles += item.warehouseBottlesCount;
                curW.warehouseMl += item.warehouseBottlesCount * item.bottleCapacityMl;
                map.set(wKey, curW);
            }
        });

        return Array.from(map.values());
    }, [filteredInventory, activeTab]);

    const handleResetFilters = () => {
        setStartDate(defaultStart30d);
        setEndDate(todayYmd);
        setDatePreset("LAST_30_DAYS");
        setSearchQuery("");
        setSelectedBrand("ALL");
        setSelectedLocation("ALL");
        setSelectedStatus("ALL");
        setSummaryFilter("ALL");
        setActiveTab("ALL");
        setOpenDropdown(null);
    };

    const handleSimulateSprayDeduction = (
        item: InventorySkuRecord,
        doseMl: number = 0.12,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        if (isViewerReadOnly) return;

        if (item.machineRemainingMl < 0.12) {
            showToast(
                lang === "en"
                    ? `Slot ${item.slotLabel} on ${item.kioskCode} is depleted (${item.machineRemainingMl}ml). Click "Refill 100%" first!`
                    : `Khoang ${item.slotLabel} trên ${item.kioskCode} đã cạn (${item.machineRemainingMl}ml). Vui lòng bấm Nạp 100% trước!`
            );
            return;
        }

        const beforeMl = item.machineRemainingMl;
        const afterMl = Number(Math.max(0, beforeMl - doseMl).toFixed(2));
        const nextStatus = computeBottleStatus(afterMl, item.thresholdMl);

        const updatedItem: InventorySkuRecord = {
            ...item,
            machineRemainingMl: afterMl,
            sensorLoadCellMl: afterMl,
            status: nextStatus,
        };

        const nextInv = inventory.map((r) => (r.id === item.id ? updatedItem : r));

        const newMovement: StockMovementRecord = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            dateStr: todayYmd,
            timestamp: formatNowStr(),
            movementType: "SALE_SPRAY",
            skuCode: item.skuCode,
            productName: item.productName,
            brand: item.brand,
            bottleCode: item.installedBottleCode,
            sourceLocation: `${item.kioskCode} (${item.slotLabel})`,
            targetLocation: "Customer Kiosk Spray",
            quantityBeforeMl: beforeMl,
            quantityAfterMl: afterMl,
            deltaMl: -doseMl,
            actor: "IoT Dispense Engine",
            reason: `Confirmed Kiosk spray deduction (-${doseMl}ml)`,
            referenceDoc: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        const nextMovements = [newMovement, ...movements];

        persistInventoryAndPropagateAll(nextInv, nextMovements, updatedItem, {
            recordedSpraySale: true,
        });

        showToast(
            lang === "en"
                ? `Dispensed spray on ${item.productName}: Volume ${beforeMl}ml → ${afterMl}ml (-${doseMl}ml) & synchronized across all 11 screens!`
                : `Đã xịt ${item.productName}: Dung tích ${beforeMl}ml → ${afterMl}ml (-${doseMl}ml) & đồng bộ cả 11 màn hình!`
        );
    };

    const handleQuickAllocateRefill = (
        item: InventorySkuRecord,
        e?: React.MouseEvent
    ) => {
        if (e) e.stopPropagation();
        if (isViewerReadOnly) return;

        if (item.warehouseBottlesCount <= 0) {
            showToast(
                lang === "en"
                    ? `Insufficient Warehouse Reserve: ${item.warehouseCode} has 0 sealed bottles of ${item.productName}. Click "+ Add Stock Batch" first!`
                    : `Kho dự trữ ${item.warehouseCode} đã hết bình ${item.productName}. Vui lòng bấm "+ Nhập Lô Hàng Mới" trước!`
            );
            return;
        }

        const beforeMl = item.machineRemainingMl;
        const afterMl = item.bottleCapacityMl;
        const newBottleCode = `BTL-2026-R${item.slotNumber}${Math.floor(
            10 + Math.random() * 89
        )}`;

        const updatedItem: InventorySkuRecord = {
            ...item,
            warehouseBottlesCount: item.warehouseBottlesCount - 1,
            machineRemainingMl: afterMl,
            sensorLoadCellMl: afterMl,
            installedBottleCode: newBottleCode,
            status: "INSTALLED",
        };

        const nextInv = inventory.map((r) => (r.id === item.id ? updatedItem : r));

        const newMovement: StockMovementRecord = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            dateStr: todayYmd,
            timestamp: formatNowStr(),
            movementType: "INSTALL",
            skuCode: item.skuCode,
            productName: item.productName,
            brand: item.brand,
            bottleCode: newBottleCode,
            sourceLocation: item.warehouseCode,
            targetLocation: `${item.kioskCode} (${item.slotLabel})`,
            quantityBeforeMl: beforeMl,
            quantityAfterMl: afterMl,
            deltaMl: +(afterMl - beforeMl).toFixed(2),
            actor: currentActorRole,
            reason: `Allocated 1 sealed bottle from ${item.warehouseCode} & replenished ${item.kioskCode} to 100%`,
            referenceDoc: `RFL-${Date.now().toString().slice(-4)}`,
        };
        const nextMovements = [newMovement, ...movements];

        persistInventoryAndPropagateAll(nextInv, nextMovements, updatedItem, {
            didReplenishFull: true,
        });

        showToast(
            lang === "en"
                ? `Allocated 1 bottle from ${item.warehouseCode} → Replenished ${item.productName} on ${item.kioskCode} to ${afterMl}ml (100%) & synchronized across all 11 screens!`
                : `Đã xuất 1 bình từ ${item.warehouseCode} → Nạp đầy 100% (${afterMl}ml) cho ${item.productName} trên ${item.kioskCode} & đồng bộ cả 11 màn hình!`
        );
    };

    const handleReconcileLoadCellSensor = (item: InventorySkuRecord) => {
        if (isViewerReadOnly) return;
        const beforeMl = item.machineRemainingMl;
        const afterMl = item.sensorLoadCellMl;

        const updatedItem: InventorySkuRecord = {
            ...item,
            machineRemainingMl: afterMl,
            status: computeBottleStatus(afterMl, item.thresholdMl),
        };

        const nextInv = inventory.map((r) => (r.id === item.id ? updatedItem : r));

        const newMovement: StockMovementRecord = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            dateStr: todayYmd,
            timestamp: formatNowStr(),
            movementType: "ADJUSTMENT",
            skuCode: item.skuCode,
            productName: item.productName,
            brand: item.brand,
            bottleCode: item.installedBottleCode,
            sourceLocation: `${item.kioskCode} (${item.slotLabel})`,
            targetLocation: `${item.kioskCode} (${item.slotLabel})`,
            quantityBeforeMl: beforeMl,
            quantityAfterMl: afterMl,
            deltaMl: +(afterMl - beforeMl).toFixed(2),
            actor: currentActorRole,
            reason: "Reconciled estimated volume to physical load-cell sensor reading",
            referenceDoc: `ADJ-${Date.now().toString().slice(-4)}`,
        };
        const nextMovements = [newMovement, ...movements];

        persistInventoryAndPropagateAll(nextInv, nextMovements, updatedItem);

        showToast(
            lang === "en"
                ? `Reconciled ${item.productName} volume (${beforeMl}ml → ${afterMl}ml) to match Load-Cell Sensor!`
                : `Đã cân bằng dung tích ${item.productName} (${beforeMl}ml → ${afterMl}ml) khớp với cảm biến Load-Cell!`
        );
    };

    const handleAddStockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewerReadOnly) return;
        setModalError("");

        if (addBottlesQty <= 0 || !addBatchNumber.trim()) {
            setModalError("Please enter a valid bottle quantity and batch number.");
            return;
        }
        if (new Date(addExpiryDate).getTime() <= Date.now()) {
            setModalError("Expiration date must be in the future.");
            return;
        }

        const target = inventory.find((i) => i.id === addSkuId);
        if (!target) return;

        const addedVolumeMl = addBottlesQty * target.bottleCapacityMl;
        const beforeWhMl = target.warehouseBottlesCount * target.bottleCapacityMl;
        const afterWhMl = beforeWhMl + addedVolumeMl;

        const updatedItem: InventorySkuRecord = {
            ...target,
            warehouseCode: addWarehouse,
            warehouseLocation: WAREHOUSE_LABELS[addWarehouse],
            warehouseBottlesCount: target.warehouseBottlesCount + addBottlesQty,
            batchNumber: addBatchNumber.trim().toUpperCase(),
            expirationDate: addExpiryDate,
        };

        const nextInv = inventory.map((i) => (i.id === addSkuId ? updatedItem : i));

        const newMovement: StockMovementRecord = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            dateStr: todayYmd,
            timestamp: formatNowStr(),
            movementType: "RECEIPT",
            skuCode: target.skuCode,
            productName: target.productName,
            brand: target.brand,
            bottleCode: `${addBatchNumber.trim().toUpperCase()} (${addBottlesQty} Bottles)`,
            sourceLocation: `${target.brand} Supplier`,
            targetLocation: addWarehouse,
            quantityBeforeMl: beforeWhMl,
            quantityAfterMl: afterWhMl,
            deltaMl: addedVolumeMl,
            actor: currentActorRole,
            reason: `Received ${addBottlesQty} sealed bottles into ${addWarehouse}`,
            referenceDoc: `GRN-${Date.now().toString().slice(-4)}`,
        };
        const nextMovements = [newMovement, ...movements];

        setTrendScope("TOTAL_NET");
        persistInventoryAndPropagateAll(nextInv, nextMovements, updatedItem);

        setIsAddStockOpen(false);
        showToast(
            lang === "en"
                ? `Added ${addBottlesQty} bottles (+${addedVolumeMl}ml) of ${target.productName} to ${addWarehouse} & synchronized across all screens!`
                : `Đã nhập kho ${addBottlesQty} bình (+${addedVolumeMl}ml) ${target.productName} vào ${addWarehouse} & đồng bộ toàn hệ thống!`
        );
    };

    const handleManageStockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewerReadOnly) return;
        setModalError("");

        const target = inventory.find((i) => i.id === manageSkuId);
        if (!target) return;

        if (!manageReason.trim()) {
            setModalError("Please provide an audit reason for this stock movement.");
            return;
        }

        if (manageType === "ALLOCATE_TO_KIOSK") {
            if (target.warehouseBottlesCount <= 0) {
                setModalError("No sealed bottles available in warehouse to allocate.");
                return;
            }

            const beforeMl = target.machineRemainingMl;
            const afterMl = target.bottleCapacityMl;
            const newBottleId = `BTL-2026-R${Math.floor(100 + Math.random() * 899)}`;

            const updatedItem: InventorySkuRecord = {
                ...target,
                warehouseBottlesCount: target.warehouseBottlesCount - 1,
                machineRemainingMl: afterMl,
                sensorLoadCellMl: afterMl,
                installedBottleCode: newBottleId,
                status: "INSTALLED",
            };

            const nextInv = inventory.map((i) =>
                i.id === manageSkuId ? updatedItem : i
            );

            const newMovement: StockMovementRecord = {
                id: `MOV-${Date.now().toString().slice(-4)}`,
                dateStr: todayYmd,
                timestamp: formatNowStr(),
                movementType: "INSTALL",
                skuCode: target.skuCode,
                productName: target.productName,
                brand: target.brand,
                bottleCode: newBottleId,
                sourceLocation: target.warehouseCode,
                targetLocation: `${target.kioskCode} (${target.slotLabel})`,
                quantityBeforeMl: beforeMl,
                quantityAfterMl: afterMl,
                deltaMl: +(afterMl - beforeMl).toFixed(2),
                actor: currentActorRole,
                reason: manageReason.trim(),
                referenceDoc: `ALC-${Date.now().toString().slice(-4)}`,
            };

            setTrendScope("MACHINE_ONLY");
            persistInventoryAndPropagateAll(
                nextInv,
                [newMovement, ...movements],
                updatedItem,
                { didReplenishFull: true }
            );

            showToast(
                `Allocated 1 bottle (${afterMl}ml) of ${target.productName} from ${target.warehouseCode} to ${target.kioskCode} & synced across all 11 screens!`
            );
        } else if (manageType === "WAREHOUSE_TRANSFER") {
            if (target.warehouseCode === manageTargetWarehouse) {
                setModalError("Source and destination warehouse cannot be identical.");
                return;
            }
            if (target.warehouseBottlesCount <= 0) {
                setModalError("No sealed bottles available in source warehouse.");
                return;
            }

            const whMl = target.warehouseBottlesCount * target.bottleCapacityMl;
            const updatedItem: InventorySkuRecord = {
                ...target,
                warehouseCode: manageTargetWarehouse,
                warehouseLocation: WAREHOUSE_LABELS[manageTargetWarehouse],
            };

            const nextInv = inventory.map((i) =>
                i.id === manageSkuId ? updatedItem : i
            );

            const newMovement: StockMovementRecord = {
                id: `MOV-${Date.now().toString().slice(-4)}`,
                dateStr: todayYmd,
                timestamp: formatNowStr(),
                movementType: "TRANSFER",
                skuCode: target.skuCode,
                productName: target.productName,
                brand: target.brand,
                bottleCode: `${target.batchNumber} (${target.warehouseBottlesCount} Bottles)`,
                sourceLocation: target.warehouseCode,
                targetLocation: manageTargetWarehouse,
                quantityBeforeMl: whMl,
                quantityAfterMl: whMl,
                deltaMl: 0,
                actor: currentActorRole,
                reason: manageReason.trim(),
                referenceDoc: `TRF-${Date.now().toString().slice(-4)}`,
            };

            persistInventoryAndPropagateAll(
                nextInv,
                [newMovement, ...movements],
                updatedItem
            );

            showToast(
                `Transferred ${target.warehouseBottlesCount} bottles (${whMl}ml) of ${target.productName} from ${target.warehouseCode} → ${manageTargetWarehouse}!`
            );
        } else if (manageType === "DAMAGE_DISPOSAL") {
            const beforeMl = target.machineRemainingMl;
            const updatedItem: InventorySkuRecord = {
                ...target,
                machineRemainingMl: 0,
                sensorLoadCellMl: 0,
                status: "DAMAGED",
            };

            const nextInv = inventory.map((i) =>
                i.id === manageSkuId ? updatedItem : i
            );

            const newMovement: StockMovementRecord = {
                id: `MOV-${Date.now().toString().slice(-4)}`,
                dateStr: todayYmd,
                timestamp: formatNowStr(),
                movementType: "DISPOSAL",
                skuCode: target.skuCode,
                productName: target.productName,
                brand: target.brand,
                bottleCode: target.installedBottleCode,
                sourceLocation: `${target.kioskCode} (${target.slotLabel})`,
                targetLocation: "Damaged Write-Off",
                quantityBeforeMl: beforeMl,
                quantityAfterMl: 0,
                deltaMl: -beforeMl,
                actor: currentActorRole,
                reason: manageReason.trim(),
                referenceDoc: `DSP-${Date.now().toString().slice(-4)}`,
            };

            persistInventoryAndPropagateAll(
                nextInv,
                [newMovement, ...movements],
                updatedItem
            );

            showToast(
                `Marked cartridge ${target.installedBottleCode} (${target.productName}) as DAMAGED (0ml) & synced across all screens!`
            );
        } else {
            const beforeMl = target.machineRemainingMl;
            const afterMl = Number(
                Math.max(
                    0,
                    Math.min(target.bottleCapacityMl, manageDeltaMl)
                ).toFixed(2)
            );

            const updatedItem: InventorySkuRecord = {
                ...target,
                machineRemainingMl: afterMl,
                sensorLoadCellMl: afterMl,
                status: computeBottleStatus(afterMl, target.thresholdMl),
            };

            const nextInv = inventory.map((i) =>
                i.id === manageSkuId ? updatedItem : i
            );

            const newMovement: StockMovementRecord = {
                id: `MOV-${Date.now().toString().slice(-4)}`,
                dateStr: todayYmd,
                timestamp: formatNowStr(),
                movementType: "ADJUSTMENT",
                skuCode: target.skuCode,
                productName: target.productName,
                brand: target.brand,
                bottleCode: target.installedBottleCode,
                sourceLocation: `${target.kioskCode} (${target.slotLabel})`,
                targetLocation: `${target.kioskCode} (${target.slotLabel})`,
                quantityBeforeMl: beforeMl,
                quantityAfterMl: afterMl,
                deltaMl: +(afterMl - beforeMl).toFixed(2),
                actor: currentActorRole,
                reason: manageReason.trim(),
                referenceDoc: `ADJ-${Date.now().toString().slice(-4)}`,
            };

            persistInventoryAndPropagateAll(
                nextInv,
                [newMovement, ...movements],
                updatedItem,
                { didReplenishFull: afterMl > target.thresholdMl }
            );

            showToast(
                `Recorded inventory adjustment on ${target.productName} (${beforeMl}ml → ${afterMl}ml) & synced across all 11 screens!`
            );
        }

        setIsManageStockOpen(false);
        setManageReason("");
    };

    const handleExportInventoryCSV = () => {
        const header =
            "SKU Code;Product Name;Brand;Kiosk Code;Slot;Installed Bottle ID;Machine Remaining (ml);Bottle Capacity (ml);Warehouse Hub;Warehouse Bottles;Batch Number;Expiry Date;Total Net Volume (ml);Status\n";
        const rows = filteredInventory
            .map((i) => {
                const whMl = i.warehouseBottlesCount * i.bottleCapacityMl;
                const totalMl = +(i.machineRemainingMl + whMl).toFixed(2);
                return `"${i.skuCode}";"${i.productName}";"${i.brand}";"${i.kioskCode}";"${i.slotLabel}";"${i.installedBottleCode}";"${i.machineRemainingMl}";"${i.bottleCapacityMl}";"${i.warehouseCode}";"${i.warehouseBottlesCount}";"${i.batchNumber}";"${i.expirationDate}";"${totalMl}";"${i.status}"`;
            })
            .join("\n");

        const blob = new Blob(["\ufeff" + header + rows], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "ScentStation_Inventory_Report.csv";
        link.click();

        showToast(
            lang === "en"
                ? `Exported ${filteredInventory.length} inventory SKUs to CSV!`
                : `Đã xuất ${filteredInventory.length} bản ghi tồn kho ra file CSV!`
        );
    };

    const renderStatusBadge = (status: BottleStatus) => {
        const isAlert =
            status === "NEARLY_EMPTY" ||
            status === "EMPTY" ||
            status === "DAMAGED" ||
            status === "EXPIRED";
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.26rem 0.72rem",
                    borderRadius: "99px",
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    fontFamily: "Space Grotesk, monospace",
                    background:
                        status === "INSTALLED" || status === "AVAILABLE"
                            ? "rgba(52, 211, 153, 0.14)"
                            : status === "NEARLY_EMPTY"
                                ? "rgba(251, 191, 36, 0.14)"
                                : "rgba(248, 113, 113, 0.14)",
                    color:
                        status === "INSTALLED" || status === "AVAILABLE"
                            ? "#34D399"
                            : status === "NEARLY_EMPTY"
                                ? "#FBBF24"
                                : "#F87171",
                    border: `1px solid ${
                        status === "INSTALLED" || status === "AVAILABLE"
                            ? "rgba(52, 211, 153, 0.38)"
                            : status === "NEARLY_EMPTY"
                                ? "rgba(251, 191, 36, 0.4)"
                                : "rgba(248, 113, 113, 0.4)"
                    }`,
                }}
            >
                {isAlert && <AlertTriangle size={11} />}
                <span>{status}</span>
            </span>
        );
    };

    const activeBarInfo =
        dynamicStockTrendBars[selectedChartBarIdx] ||
        dynamicStockTrendBars[dynamicStockTrendBars.length - 1];

    return (
        <div
            className={`${styles.container} notranslate`}
            onClick={() => {
                setOpenMenuId(null);
                setOpenDropdown(null);
            }}
            translate="no"
            suppressHydrationWarning
        >
            {/* LUXURY HERO BANNER CARD */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? "CARTRIDGE TELEMETRY & MULTI-WAREHOUSE LOGISTICS"
                                : "GIÁM SÁT MỨC DUNG DỊCH BUỒNG XỊT & ĐIỀU PHỐI KHO DỰ TRỮ"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Perfume Inventory & Level Monitoring"
                                : "Quản Trị Tồn Kho & Định Lượng Nước Hoa"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? `Real-time cartridge level telemetry, batch traceability, and warehouse reserve allocation across ${inventory.length} curated fragrances and 3 regional hubs.`
                                : `Đồng bộ thời gian thực dung tích bình chứa trên từng máy Kiosk, truy xuất lô sản xuất và điều phối kho dự trữ trên ${inventory.length} mùi hương.`}
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
                            onClick={handleExportInventoryCSV}
                            className={styles.secondaryGoldBtn}
                        >
                            <Download size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "Export CSV" : "Xuất CSV"}</span>
                        </button>

                        {!isViewerReadOnly && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalError("");
                                        setIsManageStockOpen(true);
                                    }}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <ArrowLeftRight size={15} color="#D4AF37" />
                                    <span>
                                        {lang === "en"
                                            ? "Manage Stock"
                                            : "Điều Chuyển / Kiểm Kê"}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalError("");
                                        setIsAddStockOpen(true);
                                    }}
                                    className={styles.primaryGoldBtn}
                                >
                                    <Plus size={15} />
                                    <span>
    {lang === "en"
        ? "Add Stock Batch"
        : "Nhập Lô Hàng Mới"}
</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 5 KPI SUMMARY CARDS */}
                <div className={styles.kpiGrid5}>
                    <div
                        onClick={() => {
                            setSummaryFilter("ALL");
                            setActiveTab("ALL");
                            setTrendScope("TOTAL_NET");
                        }}
                        className={`${styles.kpiCard} ${
                            summaryFilter === "ALL" && trendScope === "TOTAL_NET"
                                ? styles.kpiCardActive
                                : ""
                        }`}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "TOTAL BOTTLES" : "TỔNG SỐ BÌNH CHỨA"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#FFF", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {overviewMetrics.totalBottles} Bottles
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#F5E6AD" }}>
                            {overviewMetrics.installedBottles} in Kiosks +{" "}
                            {overviewMetrics.warehouseBottles} in Reserve
                        </div>
                    </div>

                    <div
                        onClick={() => {
                            setSummaryFilter("ALL");
                            setActiveTab("ALL");
                            setTrendScope("TOTAL_NET");
                        }}
                        className={styles.kpiCard}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "TOTAL NET VOLUME" : "TỔNG DUNG TÍCH THỰC"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#F5E6AD", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {overviewMetrics.totalVolumeMl.toLocaleString("en-US", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 2,
                            })}{" "}
                            ml
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399" }}>
                            {lang === "en"
                                ? "Exact sum of Kiosk + Warehouse ml"
                                : "Tổng cộng thực tế Kiosk + Kho"}
                        </div>
                    </div>

                    <div
                        onClick={() => {
                            setSummaryFilter("LOW_STOCK");
                            setActiveTab("ALL");
                            setTrendScope("MACHINE_ONLY");
                        }}
                        className={`${styles.kpiCard} ${
                            summaryFilter === "LOW_STOCK" ? styles.kpiCardActive : ""
                        }`}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "LOW STOCK ITEMS" : "KHOANG SẮP CẠN (≤15ML)"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#F87171", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {overviewMetrics.lowStockCount} Slots
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#F87171" }}>
                            {lang === "en"
                                ? "Select to filter slots needing refill"
                                : "Chạm để lọc các khoang cần nạp ngay"}
                        </div>
                    </div>

                    <div
                        onClick={() => {
                            setSummaryFilter("IN_MACHINES");
                            setActiveTab("MACHINE_STOCK");
                            setTrendScope("MACHINE_ONLY");
                        }}
                        className={`${styles.kpiCard} ${
                            summaryFilter === "IN_MACHINES" ||
                            trendScope === "MACHINE_ONLY"
                                ? styles.kpiCardActive
                                : ""
                        }`}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "IN KIOSK CHAMBERS" : "ĐANG LẮP TRÊN KIOSK"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#34D399", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {overviewMetrics.machineVolumeMl.toLocaleString("en-US", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 2,
                            })}{" "}
                            ml
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            Across {overviewMetrics.installedBottles} active Kiosk slots
                        </div>
                    </div>

                    <div
                        onClick={() => {
                            setSummaryFilter("IN_WAREHOUSE");
                            setActiveTab("WAREHOUSE_STOCK");
                            setTrendScope("WAREHOUSE_ONLY");
                        }}
                        className={`${styles.kpiCard} ${
                            summaryFilter === "IN_WAREHOUSE" ||
                            trendScope === "WAREHOUSE_ONLY"
                                ? styles.kpiCardActive
                                : ""
                        }`}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "WAREHOUSE RESERVE" : "TỒN KHO DỰ TRỮ"}
                        </div>
                        <div style={{ fontSize: "1.55rem", fontWeight: 700, color: "#60A5FA", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {overviewMetrics.warehouseVolumeMl.toLocaleString()} ml
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {overviewMetrics.warehouseBottles} sealed bottles in 3 hubs
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER BAR 2 TẦNG CÓ BẢNG LỊCH THỰC TẾ GIỐNG HỆT MÀN 9 & MÀN 10 */}
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
                                    ? "Search fragrance name, maison, SKU code, bottle ID, or batch number..."
                                    : "Tìm theo tên nước hoa, thương hiệu, mã SKU, mã bình hoặc số lô..."
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

                    {/* 2. Nút Lịch Thực Tế (Custom Luxury Dark Calendar Popover giống Màn 9 & Màn 10) */}
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

                    {/* 3. Custom Dropdown: All Maisons */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(openDropdown === "BRAND" ? null : "BRAND")
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedBrand !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
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
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
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

                    {/* 4. Custom Dropdown: All Locations (Kiosks & Warehouses) */}
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
                                    ? lang === "en"
                                        ? `All Locations (${uniqueLocations.length})`
                                        : `Mọi Vị Trí (${uniqueLocations.length})`
                                    : selectedLocation}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "LOCATION" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
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
                                        {lang === "en"
                                            ? `All Locations (${uniqueLocations.length})`
                                            : `Mọi Vị Trí (${uniqueLocations.length})`}
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

                    {/* 5. Custom Dropdown: All Statuses */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "STATUS" ? null : "STATUS"
                                )
                            }
                            className={`${styles.customDropdownTrigger} ${
                                selectedStatus !== "ALL"
                                    ? styles.customDropdownTriggerActive
                                    : ""
                            }`}
                        >
                            <span>
                                {selectedStatus === "ALL"
                                    ? lang === "en"
                                        ? "All Statuses"
                                        : "Mọi Trạng Thái"
                                    : selectedStatus}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                            >
                                {(
                                    [
                                        "ALL",
                                        "INSTALLED",
                                        "AVAILABLE",
                                        "NEARLY_EMPTY",
                                        "EMPTY",
                                        "DAMAGED",
                                        "EXPIRED",
                                    ] as const
                                ).map((st) => (
                                    <button
                                        key={st}
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatus(st);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedStatus === st
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
                                        {selectedStatus === st && (
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

            {/* LIVE STOCK CONSUMPTION TREND CHART + LOW-STOCK & LEAKAGE ALERTS */}
            <div className={styles.analyticsGrid2}>
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? "Live Stock Consumption & Replenishment Trend"
                                    : "Biểu Đồ Biến Động Tiêu Hao & Bổ Sung Tồn Kho"}
                            </h3>
                            <span
                                style={{
                                    fontSize: "0.73rem",
                                    color: "#34D399",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                ● [{activeBarInfo.label}]:{" "}
                                <strong>{activeBarInfo.moveEvent}</strong>
                            </span>
                        </div>

                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                onClick={() => setTrendScope("MACHINE_ONLY")}
                                className={`${styles.tabBtn} ${
                                    trendScope === "MACHINE_ONLY"
                                        ? styles.tabBtnActive
                                        : ""
                                }`}
                                style={{ padding: "0.3rem 0.65rem", fontSize: "0.7rem" }}
                            >
                                <span>Kiosk Stock</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrendScope("TOTAL_NET")}
                                className={`${styles.tabBtn} ${
                                    trendScope === "TOTAL_NET"
                                        ? styles.tabBtnActive
                                        : ""
                                }`}
                                style={{ padding: "0.3rem 0.65rem", fontSize: "0.7rem" }}
                            >
                                <span>Total Net</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTrendScope("WAREHOUSE_ONLY")}
                                className={`${styles.tabBtn} ${
                                    trendScope === "WAREHOUSE_ONLY"
                                        ? styles.tabBtnActive
                                        : ""
                                }`}
                                style={{ padding: "0.3rem 0.65rem", fontSize: "0.7rem" }}
                            >
                                <span>Warehouse</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setTrendUnit(
                                        trendUnit === "VOLUME_ML"
                                            ? "BOTTLES"
                                            : "VOLUME_ML"
                                    )
                                }
                                className={styles.secondaryGoldBtn}
                                style={{ padding: "0.3rem 0.65rem", fontSize: "0.7rem" }}
                            >
                                <span>
                                    Unit:{" "}
                                    {trendUnit === "VOLUME_ML" ? "ml" : "Bottles"}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div
                        style={{
                            height: "155px",
                            display: "grid",
                            gridTemplateColumns: "repeat(6, 1fr)",
                            gap: "0.75rem",
                            alignItems: "end",
                            paddingTop: "1.4rem",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {dynamicStockTrendBars.map((d, idx) => {
                            const isSelectedBar = selectedChartBarIdx === idx;
                            const isLiveBar = idx === 5;
                            return (
                                <div
                                    key={`${d.label}-${idx}`}
                                    onClick={() => setSelectedChartBarIdx(idx)}
                                    onMouseEnter={() => setSelectedChartBarIdx(idx)}
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                        cursor: "pointer",
                                    }}
                                    title={`${d.label}: ${d.ml}ml (${d.btl} bottles) — ${d.moveEvent}`}
                                >
                                    <span
                                        style={{
                                            fontSize: "0.68rem",
                                            color: isLiveBar ? "#34D399" : "#F5E6AD",
                                            fontWeight: isLiveBar ? 800 : 600,
                                            fontFamily: "Space Grotesk, monospace",
                                            marginBottom: "2px",
                                        }}
                                    >
                                        {trendUnit === "VOLUME_ML"
                                            ? `${d.ml}ml`
                                            : `${d.btl} btl`}
                                    </span>

                                    {d.deltaMl !== 0 && (
                                        <span
                                            style={{
                                                fontSize: "0.6rem",
                                                color:
                                                    d.deltaMl > 0
                                                        ? "#34D399"
                                                        : "#F87171",
                                                fontFamily: "Space Grotesk, monospace",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            {d.deltaMl > 0
                                                ? `+${d.deltaMl}ml`
                                                : `${d.deltaMl}ml`}
                                        </span>
                                    )}

                                    <div
                                        style={{
                                            width: "100%",
                                            height: `${d.pct}%`,
                                            background: isLiveBar
                                                ? "linear-gradient(180deg, #34D399 0%, #D4AF37 65%, rgba(212,175,55,0.25) 100%)"
                                                : isSelectedBar
                                                    ? "linear-gradient(180deg, #FFF 0%, #D4AF37 60%, rgba(212,175,55,0.25) 100%)"
                                                    : "linear-gradient(180deg, #F5E6AD 0%, #D4AF37 50%, rgba(212,175,55,0.18) 100%)",
                                            borderRadius: "8px 8px 2px 2px",
                                            boxShadow: isSelectedBar
                                                ? "0 0 18px rgba(212,175,55,0.45)"
                                                : "none",
                                            transition:
                                                "height 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: "0.66rem",
                                            color: isLiveBar
                                                ? "#34D399"
                                                : isSelectedBar
                                                    ? "#F5E6AD"
                                                    : "#94A3B8",
                                            fontWeight:
                                                isLiveBar || isSelectedBar
                                                    ? 700
                                                    : 500,
                                            marginTop: "6px",
                                            fontFamily: "Space Grotesk, monospace",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {d.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Low-Stock & Load-Cell Leakage Alerts */}
                <div className={styles.analyticsCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle} style={{ color: "#F87171" }}>
                                {lang === "en"
                                    ? "Low-Stock & Load-Cell Leakage Alerts"
                                    : "Cảnh Báo Bình Sắp Cạn & Chênh Lệch Cảm Biến"}
                            </h3>
                            <span style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Select an alert item to inspect chamber or replenish 100%"
                                    : "Chọn một mục cảnh báo để kiểm tra khoang hoặc nạp đầy 100%"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/refill")}
                            className={styles.secondaryGoldBtn}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.72rem" }}
                        >
                            <span>{lang === "en" ? "Refill Module" : "Mở Nạp Bình"}</span>
                        </button>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.55rem",
                            maxHeight: "155px",
                            overflowY: "auto",
                        }}
                    >
                        {inventory
                            .filter((i) => i.machineRemainingMl <= i.thresholdMl)
                            .map((item) => {
                                const hasLeakage =
                                    Math.abs(
                                        item.machineRemainingMl -
                                        item.sensorLoadCellMl
                                    ) >= 2.0;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItemId(item.id)}
                                        style={{
                                            padding: "0.55rem 0.8rem",
                                            borderRadius: "10px",
                                            background: "rgba(248,113,113,0.08)",
                                            border: "1px solid rgba(248,113,113,0.3)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                        }}
                                    >
                                        <div>
                                            <strong style={{ color: "#FFF" }}>
                                                {item.productName}
                                            </strong>{" "}
                                            <span
                                                style={{
                                                    color: "#F5E6AD",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                ({item.kioskCode} • {item.slotLabel})
                                            </span>
                                            {hasLeakage && (
                                                <div
                                                    style={{
                                                        fontSize: "0.7rem",
                                                        color: "#FBBF24",
                                                    }}
                                                >
                                                    Load-Cell Variance: Est.{" "}
                                                    {item.machineRemainingMl}ml vs Sensor{" "}
                                                    {item.sensorLoadCellMl}ml
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <strong
                                                style={{
                                                    color: "#F87171",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                {item.machineRemainingMl}ml /{" "}
                                                {item.thresholdMl}ml
                                            </strong>
                                            {!isViewerReadOnly && (
                                                <button
                                                    type="button"
                                                    onClick={(e) =>
                                                        handleQuickAllocateRefill(
                                                            item,
                                                            e
                                                        )
                                                    }
                                                    className={styles.actionButton}
                                                    style={{
                                                        padding: "0.28rem 0.6rem",
                                                        fontSize: "0.7rem",
                                                        color: "#34D399",
                                                        borderColor:
                                                            "rgba(52,211,153,0.45)",
                                                    }}
                                                >
                                                    <span>Refill 100%</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* 7 INVENTORY TABS */}
            <div className={styles.tabsBar}>
                {(
                    [
                        {
                            id: "ALL",
                            label:
                                lang === "en"
                                    ? `All Inventory (${inventory.length} SKUs)`
                                    : `Tất Cả Tồn Kho (${inventory.length} Mùi)`,
                            icon: Layers,
                        },
                        {
                            id: "BY_PRODUCT",
                            label:
                                lang === "en"
                                    ? "By Product (Urgency Sort)"
                                    : "Theo Sản Phẩm (Ưu Tiên Sắp Hết)",
                            icon: Package,
                        },
                        {
                            id: "BY_BRAND",
                            label:
                                lang === "en"
                                    ? `By Maison (${uniqueBrands.length})`
                                    : `Theo Thương Hiệu (${uniqueBrands.length})`,
                            icon: ShieldCheck,
                        },
                        {
                            id: "BY_LOCATION",
                            label:
                                lang === "en"
                                    ? "By Location (Stations & Hubs)"
                                    : "Theo Trạm & Kho Dự Trữ",
                            icon: Warehouse,
                        },
                        {
                            id: "MACHINE_STOCK",
                            label:
                                lang === "en"
                                    ? "Station Stock"
                                    : "Bình Đang Lắp Trên Trạm",
                            icon: Cpu,
                        },
                        {
                            id: "WAREHOUSE_STOCK",
                            label:
                                lang === "en"
                                    ? "Warehouse Reserve"
                                    : "Tồn Kho Dự Trữ",
                            icon: Droplets,
                        },
                        {
                            id: "MOVEMENTS",
                            label:
                                lang === "en"
                                    ? `Stock Movements (${filteredMovements.length})`
                                    : `Lịch Sử Biến Động Kho (${filteredMovements.length})`,
                            icon: History,
                        },
                    ] as const
                ).map((t) => {
                    const IconComp = t.icon;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`${styles.tabBtn} ${
                                activeTab === t.id ? styles.tabBtnActive : ""
                            }`}
                        >
                            <IconComp size={14} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* BẢNG TỔNG HỢP NHÓM KHI CHỌN TAB BY_BRAND HOẶC BY_LOCATION */}
            {(activeTab === "BY_BRAND" || activeTab === "BY_LOCATION") &&
                groupedInventoryBreakdown.length > 0 && (
                    <div
                        className={styles.analyticsCard}
                        style={{ marginBottom: "1.25rem" }}
                    >
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
                                    {activeTab === "BY_BRAND"
                                        ? "Multi-Tenant Maison Inventory Breakdown"
                                        : "Station & Warehouse Stock Breakdown"}
                                </h3>
                                <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                    Select any group card below to filter the inventory table
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedBrand("ALL");
                                    setSelectedLocation("ALL");
                                    setActiveTab("ALL");
                                }}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Show All SKUs</span>
                            </button>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill, minmax(240px, 1fr))",
                                gap: "0.8rem",
                                maxHeight: "235px",
                                overflowY: "auto",
                            }}
                        >
                            {groupedInventoryBreakdown.map((g) => {
                                const isSelected =
                                    (activeTab === "BY_BRAND" &&
                                        selectedBrand === g.groupKey) ||
                                    (activeTab === "BY_LOCATION" &&
                                        selectedLocation === g.groupKey);
                                return (
                                    <div
                                        key={g.groupKey}
                                        onClick={() => {
                                            if (activeTab === "BY_BRAND") {
                                                setSelectedBrand(
                                                    selectedBrand === g.groupKey
                                                        ? "ALL"
                                                        : g.groupKey
                                                );
                                            } else {
                                                setSelectedLocation(
                                                    selectedLocation === g.groupKey
                                                        ? "ALL"
                                                        : g.groupKey
                                                );
                                            }
                                        }}
                                        style={{
                                            padding: "0.8rem 1rem",
                                            borderRadius: "12px",
                                            background: isSelected
                                                ? "rgba(212,175,55,0.18)"
                                                : "rgba(255,255,255,0.025)",
                                            border: isSelected
                                                ? "1px solid #D4AF37"
                                                : "1px solid rgba(255,255,255,0.08)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                color: "#FFF",
                                                fontSize: "0.86rem",
                                            }}
                                        >
                                            {g.groupKey} ({g.skusCount} SKUs)
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.72rem",
                                                color: "#94A3B8",
                                                marginBottom: "0.45rem",
                                            }}
                                        >
                                            {g.subText}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: "0.74rem",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            <span style={{ color: "#34D399" }}>
                                                Kiosk: {g.machineMl}ml
                                            </span>
                                            <strong style={{ color: "#60A5FA" }}>
                                                Wh: {g.warehouseBottles} btl (
                                                {g.warehouseMl}ml)
                                            </strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            {/* STOCK MOVEMENTS / HISTORY TAB VIEW */}
            {activeTab === "MOVEMENTS" ? (
                <div className={styles.tableCard}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.5rem 0.5rem 1rem 0.5rem",
                        }}
                    >
                        <div>
                            <h3 className={styles.cardTitle}>
                                {lang === "en"
                                    ? `Immutable Stock Movement & Audit Ledger (${filteredMovements.length} Records)`
                                    : `Sổ Cái Biến Động Tồn Kho & Kiểm Toán (${filteredMovements.length} Bản Ghi)`}
                            </h3>
                            <span style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                                {lang === "en"
                                    ? "Records receipts, installations, customer spray deductions, transfers, and authorized adjustments with Before/After quantities."
                                    : "Ghi nhận đầy đủ phiếu nhập kho, lắp đặt bình, khấu trừ xịt khách hàng, chuyển kho và điều chỉnh kiểm kê."}
                            </span>
                        </div>
                    </div>

                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>Movement ID & Time</th>
                                <th>Type</th>
                                <th>Fragrance & Bottle ID</th>
                                <th>Source → Destination</th>
                                <th>Before → After (Delta)</th>
                                <th>Responsible Actor & Reason</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredMovements.map((mv, idx) => (
                                <tr key={`${mv.id}-${idx}`} className={styles.tableRow}>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        <strong style={{ color: "#F5E6AD" }}>
                                            {mv.id}
                                        </strong>
                                        <div
                                            style={{
                                                fontSize: "0.74rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            {mv.timestamp}
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                            <span
                                                style={{
                                                    padding: "0.25rem 0.65rem",
                                                    borderRadius: "6px",
                                                    fontSize: "0.68rem",
                                                    fontWeight: 700,
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    background:
                                                        mv.movementType ===
                                                        "DISPOSAL"
                                                            ? "rgba(248,113,113,0.16)"
                                                            : "rgba(212,175,55,0.14)",
                                                    color:
                                                        mv.movementType ===
                                                        "DISPOSAL"
                                                            ? "#F87171"
                                                            : "#F5E6AD",
                                                }}
                                            >
                                                {mv.movementType}
                                            </span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <strong style={{ color: "#FFF" }}>
                                            {mv.productName}
                                        </strong>
                                        <div
                                            style={{
                                                fontSize: "0.73rem",
                                                color: "#D4AF37",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            {mv.bottleCode} ({mv.skuCode})
                                        </div>
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontSize: "0.8rem",
                                            color: "#CBD5E1",
                                        }}
                                    >
                                        <span>{mv.sourceLocation} → </span>
                                        <strong>{mv.targetLocation}</strong>
                                    </td>
                                    <td
                                        className={styles.tableCell}
                                        style={{
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        <span>{mv.quantityBeforeMl}ml → </span>
                                        <strong>{mv.quantityAfterMl}ml</strong>{" "}
                                        <span
                                            style={{
                                                color:
                                                    mv.deltaMl >= 0
                                                        ? "#34D399"
                                                        : "#F87171",
                                                fontWeight: 700,
                                            }}
                                        >
                                                (
                                            {mv.deltaMl >= 0
                                                ? `+${mv.deltaMl}`
                                                : mv.deltaMl}
                                            ml)
                                            </span>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div
                                            style={{
                                                color: "#FFF",
                                                fontWeight: 600,
                                                fontSize: "0.8rem",
                                            }}
                                        >
                                            {mv.actor}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "0.73rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            {mv.reason} (Ref: {mv.referenceDoc})
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* MAIN INVENTORY TABLE */
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>FRAGRANCE & SKU</th>
                                <th>STATION CHAMBER (ALLOCATED)</th>
                                <th>STATION REMAINING ML</th>
                                <th>WAREHOUSE RESERVE</th>
                                <th>TOTAL ACTUAL VOLUME</th>
                                <th style={{ textAlign: "center" }}>STATUS</th>
                                <th style={{ textAlign: "right" }}>ACTIONS</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredInventory.length > 0 ? (
                                filteredInventory.map((item) => {
                                    const pct = Math.round(
                                        (item.machineRemainingMl /
                                            item.bottleCapacityMl) *
                                        100
                                    );
                                    const isLow =
                                        item.machineRemainingMl <=
                                        item.thresholdMl;
                                    const warehouseMl =
                                        item.warehouseBottlesCount *
                                        item.bottleCapacityMl;
                                    const totalActualMl = +(
                                        item.machineRemainingMl +
                                        warehouseMl
                                    ).toFixed(2);

                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() =>
                                                setSelectedItemId(item.id)
                                            }
                                            className={`${
                                                styles.tableRow
                                            } ${
                                                isLow
                                                    ? styles.lowStockHighlight
                                                    : ""
                                            }`}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <td className={styles.tableCell}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.85rem",
                                                    }}
                                                >
                                                    <div
                                                        className={
                                                            styles.productThumb
                                                        }
                                                    >
                                                        <img
                                                            src={item.image}
                                                            alt={
                                                                item.productName
                                                            }
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <strong
                                                            style={{
                                                                color: "#FFF",
                                                                fontSize:
                                                                    "0.88rem",
                                                            }}
                                                        >
                                                            {item.productName}
                                                        </strong>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.73rem",
                                                                color: "#D4AF37",
                                                            }}
                                                        >
                                                            {item.brand} •{" "}
                                                            <span
                                                                style={{
                                                                    fontFamily:
                                                                        "Space Grotesk, monospace",
                                                                    color: "#94A3B8",
                                                                }}
                                                            >
                                                                    {item.skuCode}
                                                                </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className={styles.tableCell}>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#FFF",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {item.kioskCode} (
                                                    {item.slotLabel})
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.72rem",
                                                        color: "#94A3B8",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    Bottle:{" "}
                                                    {item.installedBottleCode}
                                                </div>
                                            </td>

                                            <td
                                                className={styles.tableCell}
                                                style={{ minWidth: "180px" }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        marginBottom: "0.3rem",
                                                        fontSize: "0.8rem",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    <strong
                                                        style={{
                                                            color: isLow
                                                                ? "#F87171"
                                                                : "#34D399",
                                                        }}
                                                    >
                                                        {
                                                            item.machineRemainingMl
                                                        }{" "}
                                                        /{" "}
                                                        {item.bottleCapacityMl}{" "}
                                                        ml
                                                    </strong>
                                                    <span
                                                        style={{
                                                            color: "#94A3B8",
                                                        }}
                                                    >
                                                            {pct}%
                                                        </span>
                                                </div>
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "6px",
                                                        background:
                                                            "rgba(255,255,255,0.1)",
                                                        borderRadius: "99px",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${pct}%`,
                                                            height: "100%",
                                                            background: isLow
                                                                ? "#F87171"
                                                                : "linear-gradient(90deg, #D4AF37, #34D399)",
                                                            transition:
                                                                "width 0.3s ease",
                                                        }}
                                                    />
                                                </div>
                                            </td>

                                            <td className={styles.tableCell}>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#60A5FA",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {
                                                        item.warehouseBottlesCount
                                                    }{" "}
                                                    Bottles ({warehouseMl} ml)
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.72rem",
                                                        color: "#94A3B8",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {item.warehouseCode} •{" "}
                                                    {item.batchNumber}
                                                </div>
                                            </td>

                                            <td className={styles.tableCell}>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#F5E6AD",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        fontSize: "0.9rem",
                                                    }}
                                                >
                                                    {totalActualMl} ml
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.71rem",
                                                        color: "#94A3B8",
                                                    }}
                                                >
                                                    {item.warehouseBottlesCount +
                                                        (item.machineRemainingMl >=
                                                        0.12
                                                            ? 1
                                                            : 0)}{" "}
                                                    total bottles
                                                </div>
                                            </td>

                                            <td
                                                className={styles.tableCell}
                                                style={{ textAlign: "center" }}
                                            >
                                                {renderStatusBadge(
                                                    item.status
                                                )}
                                            </td>

                                            <td
                                                className={styles.tableCell}
                                                style={{
                                                    textAlign: "right",
                                                    position: "relative",
                                                }}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.4rem",
                                                    }}
                                                >
                                                    {!isViewerReadOnly && (
                                                        <>
                                                            {isLow ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        handleQuickAllocateRefill(
                                                                            item,
                                                                            e
                                                                        )
                                                                    }
                                                                    className={
                                                                        styles.actionButton
                                                                    }
                                                                    style={{
                                                                        color: "#34D399",
                                                                        borderColor:
                                                                            "rgba(52,211,153,0.45)",
                                                                        padding:
                                                                            "0.4rem 0.75rem",
                                                                    }}
                                                                >
                                                                    <Zap
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                    <span>
                                                                            Refill
                                                                            100%
                                                                        </span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        handleSimulateSprayDeduction(
                                                                            item,
                                                                            0.12,
                                                                            e
                                                                        )
                                                                    }
                                                                    className={
                                                                        styles.actionButton
                                                                    }
                                                                    style={{
                                                                        padding:
                                                                            "0.4rem 0.75rem",
                                                                    }}
                                                                >
                                                                    <Zap
                                                                        size={
                                                                            12
                                                                        }
                                                                        color="#D4AF37"
                                                                    />
                                                                    <span>
                                                                            Spray
                                                                            (-0.12ml)
                                                                        </span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenMenuId(
                                                                openMenuId ===
                                                                item.id
                                                                    ? null
                                                                    : item.id
                                                            )
                                                        }
                                                        className={
                                                            styles.actionButton
                                                        }
                                                        style={{
                                                            padding:
                                                                "0.4rem 0.55rem",
                                                        }}
                                                    >
                                                        <MoreHorizontal
                                                            size={15}
                                                        />
                                                    </button>
                                                </div>

                                                {openMenuId === item.id && (
                                                    <div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            right: "1rem",
                                                            top: "calc(100% - 4px)",
                                                            width: "225px",
                                                            background:
                                                                "#13131E",
                                                            border: "1px solid rgba(212,175,55,0.5)",
                                                            borderRadius:
                                                                "12px",
                                                            boxShadow:
                                                                "0 20px 50px rgba(0,0,0,0.95)",
                                                            zIndex: 9999,
                                                            textAlign: "left",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            onClick={() => {
                                                                setSelectedItemId(
                                                                    item.id
                                                                );
                                                                setOpenMenuId(
                                                                    null
                                                                );
                                                            }}
                                                            style={{
                                                                padding:
                                                                    "0.68rem 1rem",
                                                                fontSize:
                                                                    "0.78rem",
                                                                color: "#FFF",
                                                                cursor: "pointer",
                                                                borderBottom:
                                                                    "1px solid rgba(255,255,255,0.06)",
                                                            }}
                                                        >
                                                            View Inventory
                                                            Details
                                                        </div>
                                                        {!isViewerReadOnly && (
                                                            <>
                                                                <div
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        handleQuickAllocateRefill(
                                                                            item,
                                                                            e
                                                                        );
                                                                        setOpenMenuId(
                                                                            null
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        padding:
                                                                            "0.68rem 1rem",
                                                                        fontSize:
                                                                            "0.78rem",
                                                                        color: "#34D399",
                                                                        cursor: "pointer",
                                                                        borderBottom:
                                                                            "1px solid rgba(255,255,255,0.06)",
                                                                    }}
                                                                >
                                                                    Allocate
                                                                    &
                                                                    Refill
                                                                    Slot
                                                                    (100%)
                                                                </div>
                                                                <div
                                                                    onClick={() => {
                                                                        setManageSkuId(
                                                                            item.id
                                                                        );
                                                                        setManageDeltaMl(
                                                                            item.machineRemainingMl
                                                                        );
                                                                        setIsManageStockOpen(
                                                                            true
                                                                        );
                                                                        setOpenMenuId(
                                                                            null
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        padding:
                                                                            "0.68rem 1rem",
                                                                        fontSize:
                                                                            "0.78rem",
                                                                        color: "#F5E6AD",
                                                                        cursor: "pointer",
                                                                        borderBottom:
                                                                            "1px solid rgba(255,255,255,0.06)",
                                                                    }}
                                                                >
                                                                    Stock
                                                                    Movement
                                                                    / Adjust
                                                                </div>
                                                            </>
                                                        )}
                                                        <div
                                                            onClick={() => {
                                                                setActiveTab(
                                                                    "MOVEMENTS"
                                                                );
                                                                setOpenMenuId(
                                                                    null
                                                                );
                                                            }}
                                                            style={{
                                                                padding:
                                                                    "0.68rem 1rem",
                                                                fontSize:
                                                                    "0.78rem",
                                                                color: "#60A5FA",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            View Stock
                                                            History
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            textAlign: "center",
                                            color: "#94A3B8",
                                            padding: "3.5rem",
                                        }}
                                    >
                                        <strong
                                            style={{
                                                color: "#F5E6AD",
                                                fontSize: "1.05rem",
                                                display: "block",
                                                marginBottom: "0.35rem",
                                            }}
                                        >
                                            No inventory items found.
                                        </strong>
                                        <span>
                                                No perfume stock records match
                                                your current search keyword or
                                                filter criteria.
                                            </span>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SLIDE-OVER INVENTORY DETAILS PANEL */}
            {selectedItem && (
                <div
                    className={styles.drawerOverlay}
                    onClick={() => setSelectedItemId(null)}
                >
                    <div
                        className={styles.drawerPanel}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.08)",
                                paddingBottom: "1.25rem",
                                marginBottom: "1.5rem",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    className={styles.productThumb}
                                    style={{ width: "64px", height: "64px" }}
                                >
                                    <img
                                        src={selectedItem.image}
                                        alt={selectedItem.productName}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                                <div>
                                    <span
                                        style={{
                                            fontSize: "0.7rem",
                                            color: "#D4AF37",
                                            fontWeight: 700,
                                            letterSpacing: "0.14em",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {selectedItem.brand} •{" "}
                                        {selectedItem.skuCode}
                                    </span>
                                    <h2
                                        style={{
                                            margin: "0.2rem 0",
                                            color: "#FFF",
                                            fontSize: "1.5rem",
                                            fontFamily:
                                                "Bodoni Moda, Georgia, serif",
                                        }}
                                    >
                                        {selectedItem.productName}
                                    </h2>
                                    {renderStatusBadge(selectedItem.status)}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedItemId(null)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div
                            className={styles.analyticsCard}
                            style={{ marginBottom: "1.25rem" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <h3 className={styles.cardTitle}>
                                    Station Chamber Telemetry
                                </h3>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/machines/${encodeURIComponent(
                                                selectedItem.kioskCode
                                            )}`
                                        )
                                    }
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>
                                        Open Station ({selectedItem.kioskCode})
                                    </span>
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                            <div
                                style={{
                                    fontSize: "0.85rem",
                                    color: "#E2E8F0",
                                    lineHeight: 1.7,
                                }}
                            >
                                <div>
                                    <strong>Station & Chamber:</strong>{" "}
                                    <span
                                        style={{
                                            color: "#F5E6AD",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        {selectedItem.kioskCode} (
                                        {selectedItem.slotLabel})
                                    </span>{" "}
                                    — {selectedItem.kioskLocation}
                                </div>
                                <div>
                                    <strong>Active Cartridge ID:</strong>{" "}
                                    {selectedItem.installedBottleCode}
                                </div>
                                <div>
                                    <strong>
                                        Remaining Volume vs Load-Cell Sensor:
                                    </strong>{" "}
                                    <strong style={{ color: "#34D399" }}>
                                        {selectedItem.machineRemainingMl} ml
                                    </strong>{" "}
                                    / {selectedItem.bottleCapacityMl} ml
                                    (Sensor: {selectedItem.sensorLoadCellMl} ml)
                                </div>
                            </div>

                            {Math.abs(
                                    selectedItem.machineRemainingMl -
                                    selectedItem.sensorLoadCellMl
                                ) >= 1.0 &&
                                !isViewerReadOnly && (
                                    <div
                                        style={{
                                            marginTop: "0.85rem",
                                            padding: "0.75rem 1rem",
                                            borderRadius: "10px",
                                            background:
                                                "rgba(251,191,36,0.12)",
                                            border: "1px solid rgba(251,191,36,0.4)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "0.78rem",
                                                color: "#FBBF24",
                                            }}
                                        >
                                            Load-Cell discrepancy detected (Est.{" "}
                                            {selectedItem.machineRemainingMl}ml
                                            vs Physical{" "}
                                            {selectedItem.sensorLoadCellMl}ml).
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleReconcileLoadCellSensor(
                                                    selectedItem
                                                )
                                            }
                                            className={styles.secondaryGoldBtn}
                                            style={{
                                                color: "#FBBF24",
                                                borderColor: "#FBBF24",
                                            }}
                                        >
                                            <span>Reconcile Sensor</span>
                                        </button>
                                    </div>
                                )}
                        </div>

                        <div
                            className={styles.analyticsCard}
                            style={{ marginBottom: "1.25rem" }}
                        >
                            <h3
                                className={styles.cardTitle}
                                style={{ marginBottom: "0.75rem" }}
                            >
                                Warehouse Reserve Stock & Batch Metadata
                            </h3>
                            <div
                                style={{
                                    fontSize: "0.85rem",
                                    color: "#E2E8F0",
                                    lineHeight: 1.7,
                                }}
                            >
                                <div>
                                    <strong>Storage Warehouse:</strong>{" "}
                                    {selectedItem.warehouseCode} (
                                    {selectedItem.warehouseLocation})
                                </div>
                                <div>
                                    <strong>Available Sealed Bottles:</strong>{" "}
                                    <strong style={{ color: "#60A5FA" }}>
                                        {selectedItem.warehouseBottlesCount}{" "}
                                        Bottles (
                                        {selectedItem.warehouseBottlesCount *
                                            selectedItem.bottleCapacityMl}{" "}
                                        ml)
                                    </strong>
                                </div>
                                <div>
                                    <strong>Batch Number & Expiry:</strong>{" "}
                                    {selectedItem.batchNumber} (Received:{" "}
                                    {selectedItem.receivedDate} • Expires:{" "}
                                    {selectedItem.expirationDate})
                                </div>
                            </div>
                        </div>

                        {!isViewerReadOnly && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "0.75rem",
                                    marginTop: "auto",
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleQuickAllocateRefill(selectedItem)
                                    }
                                    className={styles.primaryGoldBtn}
                                    style={{ flex: 1 }}
                                >
                                    <Zap size={15} />
                                    <span>
                                        Allocate 1 Bottle & Refill Slot
                                        (100%)
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSimulateSprayDeduction(
                                            selectedItem,
                                            0.12
                                        )
                                    }
                                    className={styles.secondaryGoldBtn}
                                    style={{ flex: 1 }}
                                >
                                    <RefreshCw size={15} />
                                    <span>Spray (-0.12ml)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADD STOCK BATCH MODAL */}
            {isAddStockOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsAddStockOpen(false)}
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
                                marginBottom: "1.25rem",
                            }}
                        >
                            <h3 className={styles.cardTitle}>
                                Add Stock — Warehouse Batch Receipt
                            </h3>
                            <button
                                onClick={() => setIsAddStockOpen(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {modalError && (
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    background: "rgba(248,113,113,0.15)",
                                    border: "1px solid rgba(248,113,113,0.4)",
                                    color: "#F87171",
                                    fontSize: "0.82rem",
                                }}
                            >
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleAddStockSubmit}>
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
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        SELECT FRAGRANCE PRODUCT *
                                    </label>
                                    <select
                                        value={addSkuId}
                                        onChange={(e) =>
                                            setAddSkuId(e.target.value)
                                        }
                                        className={styles.selectInput}
                                        style={{ width: "100%" }}
                                    >
                                        {inventory.map((i) => (
                                            <option key={i.id} value={i.id}>
                                                {i.brand} — {i.productName} (
                                                {i.bottleCapacityMl}ml)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        RECEIVING WAREHOUSE *
                                    </label>
                                    <select
                                        value={addWarehouse}
                                        onChange={(e) =>
                                            setAddWarehouse(
                                                e.target.value as any
                                            )
                                        }
                                        className={styles.selectInput}
                                        style={{ width: "100%" }}
                                    >
                                        <option value="WH-SGN-CENTRAL">
                                            WH-SGN-CENTRAL (Ho Chi Minh City)
                                        </option>
                                        <option value="WH-HN-NORTH">
                                            WH-HN-NORTH (Hanoi)
                                        </option>
                                        <option value="WH-DAD-CENTRAL">
                                            WH-DAD-CENTRAL (Da Nang)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "1rem",
                                    marginBottom: "1.25rem",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        BOTTLES QUANTITY *
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={addBottlesQty}
                                        onChange={(e) =>
                                            setAddBottlesQty(
                                                Number(e.target.value)
                                            )
                                        }
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        BATCH NUMBER *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={addBatchNumber}
                                        onChange={(e) =>
                                            setAddBatchNumber(e.target.value)
                                        }
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        EXPIRATION DATE *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="YYYY-MM-DD"
                                        value={addExpiryDate}
                                        onChange={(e) =>
                                            setAddExpiryDate(e.target.value)
                                        }
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
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
                                    onClick={() => setIsAddStockOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <span>Confirm Stock Receipt</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MANAGE STOCK / ADJUSTMENT MODAL */}
            {isManageStockOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsManageStockOpen(false)}
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
                                marginBottom: "1.25rem",
                            }}
                        >
                            <h3 className={styles.cardTitle}>
                                Manage Stock — Allocation, Transfer &
                                Verified Adjustment
                            </h3>
                            <button
                                onClick={() => setIsManageStockOpen(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {modalError && (
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    background: "rgba(248,113,113,0.15)",
                                    border: "1px solid rgba(248,113,113,0.4)",
                                    color: "#F87171",
                                    fontSize: "0.82rem",
                                }}
                            >
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleManageStockSubmit}>
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
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        MOVEMENT TYPE *
                                    </label>
                                    <select
                                        value={manageType}
                                        onChange={(e) =>
                                            setManageType(e.target.value as any)
                                        }
                                        className={styles.selectInput}
                                        style={{ width: "100%" }}
                                    >
                                        <option value="ALLOCATE_TO_KIOSK">
                                            Allocate 1 Bottle from Warehouse →
                                            Station Slot
                                        </option>
                                        <option value="MANUAL_ADJUSTMENT">
                                            Manual Volume Adjustment (Reconcile
                                            Load-Cell)
                                        </option>
                                        <option value="WAREHOUSE_TRANSFER">
                                            Inter-Warehouse Stock Transfer
                                        </option>
                                        <option value="DAMAGE_DISPOSAL">
                                            Report Damaged / Write-Off Cartridge
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        SELECT TARGET FRAGRANCE SKU *
                                    </label>
                                    <select
                                        value={manageSkuId}
                                        onChange={(e) =>
                                            setManageSkuId(e.target.value)
                                        }
                                        className={styles.selectInput}
                                        style={{ width: "100%" }}
                                    >
                                        {inventory.map((i) => (
                                            <option key={i.id} value={i.id}>
                                                {i.productName} ({i.kioskCode} •{" "}
                                                {i.machineRemainingMl}ml |{" "}
                                                {i.warehouseCode}:{" "}
                                                {i.warehouseBottlesCount} btl)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {manageType === "WAREHOUSE_TRANSFER" && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        DESTINATION WAREHOUSE HUB *
                                    </label>
                                    <select
                                        value={manageTargetWarehouse}
                                        onChange={(e) =>
                                            setManageTargetWarehouse(
                                                e.target.value as any
                                            )
                                        }
                                        className={styles.selectInput}
                                        style={{ width: "100%" }}
                                    >
                                        <option value="WH-SGN-CENTRAL">
                                            WH-SGN-CENTRAL (Ho Chi Minh City)
                                        </option>
                                        <option value="WH-HN-NORTH">
                                            WH-HN-NORTH (Hanoi)
                                        </option>
                                        <option value="WH-DAD-CENTRAL">
                                            WH-DAD-CENTRAL (Da Nang)
                                        </option>
                                    </select>
                                </div>
                            )}

                            {manageType === "MANUAL_ADJUSTMENT" && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.72rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.35rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        CORRECTED REMAINING VOLUME (ML) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        max={125}
                                        value={manageDeltaMl}
                                        onChange={(e) =>
                                            setManageDeltaMl(
                                                Number(e.target.value)
                                            )
                                        }
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: "1.25rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.72rem",
                                        color: "#D4AF37",
                                        marginBottom: "0.35rem",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    MANDATORY AUDIT REASON *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Reconciled load-cell sensor reading after technician inspection..."
                                    value={manageReason}
                                    onChange={(e) =>
                                        setManageReason(e.target.value)
                                    }
                                    className={styles.searchInput}
                                    style={{ padding: "0.65rem 0.9rem" }}
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
                                    onClick={() => setIsManageStockOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <span>Confirm & Sync Movement</span>
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