// noinspection SpellCheckingInspection
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import {
    Sparkles,
    ArrowLeft,
    CheckCircle2,
    QrCode,
    ChevronDown,
    Check,
    X,
    AlertOctagon,
    Ban,
    RefreshCw,
    HelpCircle,
    AlertTriangle,
    SlidersHorizontal,
    Cpu,
    Droplets,
} from "lucide-react";
import styles from "./page.module.css";

export interface ExtendedKioskSlot {
    slotNumber: number;
    physicalSlotLabel: string;
    skuCode: string;
    productName: string;
    brand: string;
    price: number;
    available: boolean;
    availabilityReason: "READY" | "SOLD_OUT" | "MAINTENANCE" | "OFFLINE" | "INACTIVE";
    remainingMl: number;
    capacityMl: number;
    lowStockThresholdMl: number;
    sprayDurationMs: number;
    imageUrl?: string;
    notes?: string;
    concentration?: string;
    audience?: "Women" | "Men" | "Unisex";
    isNiche?: boolean;
    isBestSeller?: boolean;
    fragranceFamily?: string;
    description?: string;
    retailPrice10ml?: number | null;
    kioskCode: string;
    kioskLocation: string;
    isPrimaryChamberSlot: boolean;
    productStatus?: "ACTIVE" | "INACTIVE" | "DRAFT";
}

type KioskLanguage = "EN" | "VI";
type KioskCategory = "ALL" | "WOMEN" | "MEN" | "UNISEX" | "NICHE" | "BEST_SELLER";
type PaymentProviderMethod = "VIETQR" | "MOMO" | "VNPAY" | "ZALOPAY";

type KioskStep =
    | "SELECT"
    | "QR_WAITING"
    | "PAID_GUIDANCE"
    | "DISPENSING"
    | "SUCCESS"
    | "FAILED"
    | "UNCERTAIN";

type OrderStatus =
    | "PENDING"
    | "PAID"
    | "DISPENSING"
    | "DISPENSED"
    | "FAILED"
    | "UNCERTAIN"
    | "CANCELLED"
    | "EXPIRED";

interface OrderSnapshot {
    orderId: string;
    qrContent: string;
    product: ExtendedKioskSlot;
    price: number;
    expiresAt: number;
    status: OrderStatus;
    commandUuid: string;
    idempotencyKey: string;
    hmacSignature: string;
    completedAt?: string;
    failureReason?: string;
}

interface SyncedKioskUnit {
    id: string;
    code: string;
    serialNumber: string;
    deviceIdentity: string;
    brand: string;
    locationName: string;
    address: string;
    addressEn?: string;
    status: "ONLINE" | "MAINTENANCE" | "OFFLINE";
    connectionStatus: "ONLINE" | "OFFLINE";
    operatingStatus: "ACTIVE" | "MAINTENANCE" | "DISABLED" | "ERROR";
    doorOpen: boolean;
    leakDetected: boolean;
    chamberTemp: string;
    firmwareVersion: string;
    configVersion: string;
    todaySprays: number;
    todayRevenue: number;
    slots: {
        slotLabel: string;
        fragranceName: string;
        brand: string;
        remainingMl: number;
        capacityMl: number;
        lowStockThresholdMl?: number;
        productStatus?: "ACTIVE" | "INACTIVE" | "DRAFT";
    }[];
}

const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

const FALLBACK_8_KIOSKS: SyncedKioskUnit[] = [
    {
        id: "demo-device", code: "demo-device", serialNumber: "SN-2026-8801", deviceIdentity: "DEV-SGN-8801", brand: "Creed", locationName: "Diamond Plaza Atrium",
        address: "34 Lê Duẩn, Quận 1, TP.HCM", addressEn: "34 Le Duan, District 1, HCMC",
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", doorOpen: false, leakDetected: false,
        chamberTemp: "21.2°C", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", todaySprays: 42, todayRevenue: 815000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Creed Aventus", brand: "Creed", remainingMl: 11.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 02", fragranceName: "Le Labo Another 13", brand: "Le Labo", remainingMl: 13.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 03", fragranceName: "Parfums de Marly Sedley", brand: "Parfums de Marly", remainingMl: 68.0, capacityMl: 125, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 04", fragranceName: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", remainingMl: 9.0, capacityMl: 70, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
        ],
    },
    {
        id: "KIOSK-SGN-01", code: "KIOSK-SGN-01", serialNumber: "SN-2026-8802", deviceIdentity: "DEV-SGN-8802", brand: "Chanel", locationName: "Saigon Centre Takashimaya",
        address: "65 Lê Lợi, Quận 1, TP.HCM", addressEn: "65 Le Loi, District 1, HCMC",
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", doorOpen: false, leakDetected: false,
        chamberTemp: "21.4°C", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", todaySprays: 56, todayRevenue: 840000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Acqua Di Gio", brand: "Giorgio Armani", remainingMl: 78.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 02", fragranceName: "Acqua Di Gio Profondo", brand: "Giorgio Armani", remainingMl: 64.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 03", fragranceName: "Bleu de Chanel", brand: "Chanel", remainingMl: 12.5, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 04", fragranceName: "Miss Dior Blooming Bouquet", brand: "Dior", remainingMl: 76.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
        ],
    },
    {
        id: "KIOSK-SGN-02", code: "KIOSK-SGN-02", serialNumber: "SN-2026-8803", deviceIdentity: "DEV-SGN-8803", brand: "Yves Saint Laurent", locationName: "Vincom Center Đồng Khởi",
        address: "72 Lê Thánh Tôn, Quận 1, TP.HCM", addressEn: "72 Le Thanh Ton, District 1, HCMC",
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", doorOpen: false, leakDetected: false,
        chamberTemp: "21.8°C", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", todaySprays: 38, todayRevenue: 532000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Coco Mademoiselle", brand: "Chanel", remainingMl: 82.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 02", fragranceName: "Burberry Goddess", brand: "Burberry", remainingMl: 71.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 03", fragranceName: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", remainingMl: 77.0, capacityMl: 125, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 04", fragranceName: "Versace Eros", brand: "Versace", remainingMl: 83.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
        ],
    },
    {
        id: "KIOSK-SGN-03", code: "KIOSK-SGN-03", serialNumber: "SN-2026-8808", deviceIdentity: "DEV-SGN-8808", brand: "Montblanc", locationName: "Crescent Mall",
        address: "101 Tôn Dật Tiên, Quận 7, TP.HCM", addressEn: "101 Ton Dat Tien, District 7, HCMC",
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", doorOpen: false, leakDetected: false,
        chamberTemp: "21.6°C", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", todaySprays: 34, todayRevenue: 412000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Montblanc Explorer", brand: "Montblanc", remainingMl: 79.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 02", fragranceName: "Montblanc Legend", brand: "Montblanc", remainingMl: 85.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 03", fragranceName: "Valentino Born in Roma", brand: "Valentino", remainingMl: 81.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 04", fragranceName: "Roja Parfums Elysium", brand: "Roja Parfums", remainingMl: 11.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
        ],
    },
    {
        id: "KIOSK-HN-01", code: "KIOSK-HN-01", serialNumber: "SN-2026-8804", deviceIdentity: "DEV-HAN-8804", brand: "Dior", locationName: "Lotte West Lake",
        address: "272 Võ Chí Công, Tây Hồ, Hà Nội", addressEn: "272 Vo Chi Cong, Tay Ho, Hanoi",
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", doorOpen: false, leakDetected: false,
        chamberTemp: "22.0°C", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", todaySprays: 49, todayRevenue: 710500,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Burberry Her", brand: "Burberry", remainingMl: 55.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 02", fragranceName: "Carolina Herrera Good Girl", brand: "Carolina Herrera", remainingMl: 54.0, capacityMl: 80, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 03", fragranceName: "Dior Sauvage", brand: "Dior", remainingMl: 84.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 04", fragranceName: "Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", remainingMl: 61.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
        ],
    },
    {
        id: "KIOSK-HN-02", code: "KIOSK-HN-02", serialNumber: "SN-2026-8805", deviceIdentity: "DEV-HAN-8805", brand: "Maison Margiela", locationName: "Tràng Tiền Plaza",
        address: "24 Hai Bà Trưng, Hoàn Kiếm, Hà Nội", addressEn: "24 Hai Ba Trung, Hoan Kiem, Hanoi",
        status: "MAINTENANCE", connectionStatus: "ONLINE", operatingStatus: "MAINTENANCE", doorOpen: false, leakDetected: false,
        chamberTemp: "23.1°C", firmwareVersion: "v2.4.6-LTS", configVersion: "cfg-2026.10", todaySprays: 14, todayRevenue: 203000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Replica By the Fireplace", brand: "Maison Margiela", remainingMl: 80.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 02", fragranceName: "Replica Jazz Club", brand: "Maison Margiela", remainingMl: 67.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 03", fragranceName: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", remainingMl: 74.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 04", fragranceName: "Tom Ford Black Orchid", brand: "Tom Ford", remainingMl: 48.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
        ],
    },
    {
        id: "KIOSK-DAD-01", code: "KIOSK-DAD-01", serialNumber: "SN-2026-8806", deviceIdentity: "DEV-DAD-8806", brand: "Versace", locationName: "IndoChina Riverside",
        address: "74 Bạch Đằng, Hải Châu, Đà Nẵng", addressEn: "74 Bach Dang, Hai Chau, Da Nang",
        status: "ONLINE", connectionStatus: "ONLINE", operatingStatus: "ACTIVE", doorOpen: false, leakDetected: false,
        chamberTemp: "21.9°C", firmwareVersion: "v2.4.8-LTS", configVersion: "cfg-2026.11", todaySprays: 31, todayRevenue: 372000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Club de Nuit Intense Man", brand: "Armaf", remainingMl: 92.0, capacityMl: 105, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 02", fragranceName: "MCM Eau de Parfum", brand: "MCM Worldwide", remainingMl: 66.0, capacityMl: 75, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 03", fragranceName: "Paco Rabanne Invictus", brand: "Paco Rabanne", remainingMl: 72.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 04", fragranceName: "Versace Dylan Blue", brand: "Versace", remainingMl: 77.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
        ],
    },
    {
        id: "KIOSK-004", code: "KIOSK-004", serialNumber: "SN-2026-8807", deviceIdentity: "DEV-SGN-8807", brand: "Tom Ford", locationName: "Aeon Mall Tân Phú",
        address: "30 Bờ Bao Tân Thắng, Tân Phú, TP.HCM", addressEn: "30 Bo Bao Tan Thang, Tan Phu, HCMC",
        status: "OFFLINE", connectionStatus: "OFFLINE", operatingStatus: "ERROR", doorOpen: false, leakDetected: false,
        chamberTemp: "24.2°C", firmwareVersion: "v2.4.5-LTS", configVersion: "cfg-2026.09", todaySprays: 9, todayRevenue: 144000,
        slots: [
            { slotLabel: "Slot 01", fragranceName: "Tom Ford Black Orchid", brand: "Tom Ford", remainingMl: 0.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 02", fragranceName: "Valentino Born in Roma", brand: "Valentino", remainingMl: 81.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 03", fragranceName: "Versace Bright Crystal", brand: "Versace", remainingMl: 62.0, capacityMl: 90, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
            { slotLabel: "Slot 04", fragranceName: "Versace Dylan Blue", brand: "Versace", remainingMl: 77.0, capacityMl: 100, lowStockThresholdMl: 15, productStatus: "ACTIVE" },
        ],
    },
];

const MASTER_34_CATALOG_METADATA: Record<
    string,
    {
        slotNumber: number;
        skuCode: string;
        brand: string;
        price: number;
        capacityMl: number;
        defaultRemainingMl: number;
        audience: "Men" | "Women" | "Unisex";
        isNiche: boolean;
        family: string;
        notes: string;
        imageUrl: string;
        defaultKioskCode: string;
        defaultStatus: "ACTIVE" | "INACTIVE";
    }
> = {
    "acqua di gio": { slotNumber: 1, skuCode: "SKU-ARM-01", brand: "GIORGIO ARMANI", price: 12000, capacityMl: 100, defaultRemainingMl: 78.0, audience: "Men", isNiche: false, family: "Aquatic Aromatic", notes: "Bergamot, Sea Notes, Jasmine, Cedar", imageUrl: "/images/acqua-di-gio.jpg", defaultKioskCode: "KIOSK-SGN-01", defaultStatus: "ACTIVE" },
    "acqua di gio profondo": { slotNumber: 2, skuCode: "SKU-ARM-02", brand: "GIORGIO ARMANI", price: 14000, capacityMl: 100, defaultRemainingMl: 64.0, audience: "Men", isNiche: false, family: "Aquatic Mineral", notes: "Marine Notes, Rosemary, Patchouli", imageUrl: "/images/acqua-di-gio-profondo.jpg", defaultKioskCode: "KIOSK-SGN-01", defaultStatus: "ACTIVE" },
    "bleu de chanel": { slotNumber: 3, skuCode: "SKU-CHA-03", brand: "CHANEL", price: 15000, capacityMl: 100, defaultRemainingMl: 12.5, audience: "Men", isNiche: false, family: "Woody Aromatic", notes: "Lemon, Mint, Pink Pepper, Sandalwood", imageUrl: "/images/bleu-de-chanel.png", defaultKioskCode: "KIOSK-SGN-01", defaultStatus: "ACTIVE" },
    "coco mademoiselle": { slotNumber: 4, skuCode: "SKU-CHA-04", brand: "CHANEL", price: 15500, capacityMl: 100, defaultRemainingMl: 82.0, audience: "Women", isNiche: false, family: "Oriental Floral", notes: "Orange, Patchouli, Turkish Rose", imageUrl: "/images/coco-mademoiselle.jpg", defaultKioskCode: "KIOSK-SGN-02", defaultStatus: "ACTIVE" },
    "burberry goddess": { slotNumber: 5, skuCode: "SKU-BUR-05", brand: "BURBERRY", price: 13000, capacityMl: 100, defaultRemainingMl: 71.0, audience: "Women", isNiche: false, family: "Aromatic Vanilla", notes: "Vanilla Infusion, Lavender, Cocoa", imageUrl: "/images/burberry-goddess.jpg", defaultKioskCode: "KIOSK-SGN-02", defaultStatus: "ACTIVE" },
    "burberry her": { slotNumber: 6, skuCode: "SKU-BUR-06", brand: "BURBERRY", price: 12500, capacityMl: 100, defaultRemainingMl: 55.0, audience: "Women", isNiche: false, family: "Floral Fruity", notes: "Red & Dark Berries, Jasmine, Musk", imageUrl: "/images/burberry-her.jpg", defaultKioskCode: "KIOSK-HN-01", defaultStatus: "ACTIVE" },
    "carolina herrera good girl": { slotNumber: 7, skuCode: "SKU-CH-07", brand: "CAROLINA HERRERA", price: 13500, capacityMl: 80, defaultRemainingMl: 54.0, audience: "Women", isNiche: false, family: "Oriental Floral", notes: "Almond, Coffee, Tuberose, Tonka Bean", imageUrl: "/images/carolina-herrera-good-girl.jpg", defaultKioskCode: "KIOSK-HN-01", defaultStatus: "ACTIVE" },
    "club de nuit intense man": { slotNumber: 8, skuCode: "SKU-ARMF-08", brand: "ARMAF", price: 10000, capacityMl: 105, defaultRemainingMl: 92.0, audience: "Men", isNiche: false, family: "Woody Spicy", notes: "Lemon, Pineapple, Birch, Ambroxan", imageUrl: "/images/club-de-nuit-intense.jpg", defaultKioskCode: "KIOSK-DAD-01", defaultStatus: "ACTIVE" },
    "creed aventus": { slotNumber: 9, skuCode: "SKU-CRD-09", brand: "CREED", price: 20000, capacityMl: 100, defaultRemainingMl: 11.5, audience: "Men", isNiche: true, family: "Chypre Fruity", notes: "Pineapple, Birch, Musk, Oakmoss", imageUrl: "/images/creed-aventus.jpg", defaultKioskCode: "demo-device", defaultStatus: "ACTIVE" },
    "dior sauvage": { slotNumber: 10, skuCode: "SKU-DIO-10", brand: "DIOR", price: 14500, capacityMl: 100, defaultRemainingMl: 84.0, audience: "Men", isNiche: false, family: "Aromatic Fougere", notes: "Calabrian Bergamot, Sichuan Pepper, Ambroxan", imageUrl: "/images/dior-sauvage.jpg", defaultKioskCode: "KIOSK-HN-01", defaultStatus: "ACTIVE" },
    "miss dior blooming bouquet": { slotNumber: 11, skuCode: "SKU-DIO-11", brand: "DIOR", price: 13500, capacityMl: 100, defaultRemainingMl: 76.0, audience: "Women", isNiche: false, family: "Floral", notes: "Sweet Pea, Damask Rose, White Musk", imageUrl: "/images/miss-dior-blooming-bouquet.jpg", defaultKioskCode: "KIOSK-SGN-01", defaultStatus: "ACTIVE" },
    "jean paul gaultier le male": { slotNumber: 12, skuCode: "SKU-JPG-12", brand: "JEAN PAUL GAULTIER", price: 13000, capacityMl: 125, defaultRemainingMl: 77.0, audience: "Men", isNiche: false, family: "Oriental Fougere", notes: "Lavender, Mint, Cardamom, Vanilla", imageUrl: "/images/jean-paul-gaultier-le-male.jpg", defaultKioskCode: "KIOSK-SGN-02", defaultStatus: "ACTIVE" },
    "jean paul gaultier scandal": { slotNumber: 13, skuCode: "SKU-JPG-13", brand: "JEAN PAUL GAULTIER", price: 13500, capacityMl: 80, defaultRemainingMl: 47.0, audience: "Women", isNiche: false, family: "Chypre Floral", notes: "Blood Orange, Honey, Gardenia, Patchouli", imageUrl: "/images/jean-paul-gaultier-scandal.jpg", defaultKioskCode: "KIOSK-SGN-02", defaultStatus: "ACTIVE" },
    "le labo another 13": { slotNumber: 14, skuCode: "SKU-LLB-14", brand: "LE LABO", price: 18000, capacityMl: 100, defaultRemainingMl: 13.5, audience: "Unisex", isNiche: true, family: "Woody Oriental", notes: "Ambroxan, Pear, Jasmine Petals, Ambrette", imageUrl: "/images/le-labo-another-13.jpg", defaultKioskCode: "demo-device", defaultStatus: "ACTIVE" },
    "le labo santal 33": { slotNumber: 15, skuCode: "SKU-LLB-15", brand: "LE LABO", price: 18500, capacityMl: 100, defaultRemainingMl: 73.0, audience: "Unisex", isNiche: true, family: "Woody Aromatic", notes: "Australian Sandalwood, Cedar, Cardamom, Leather", imageUrl: "/images/le-labo-another-13.jpg", defaultKioskCode: "KIOSK-SGN-01", defaultStatus: "ACTIVE" },
    "replica by the fireplace": { slotNumber: 16, skuCode: "SKU-MMG-16", brand: "MAISON MARGIELA", price: 14500, capacityMl: 100, defaultRemainingMl: 80.0, audience: "Unisex", isNiche: true, family: "Woody Amber", notes: "Cloves, Chestnut, Guaiac Wood, Vanilla", imageUrl: "/images/maison-margiela-by-the-fireplace.jpg", defaultKioskCode: "KIOSK-HN-02", defaultStatus: "ACTIVE" },
    "replica jazz club": { slotNumber: 17, skuCode: "SKU-MMG-17", brand: "MAISON MARGIELA", price: 14500, capacityMl: 100, defaultRemainingMl: 67.0, audience: "Men", isNiche: true, family: "Leather Woody", notes: "Pink Pepper, Rum Absolute, Tobacco Leaf", imageUrl: "/images/maison-margiela-by-the-fireplace.jpg", defaultKioskCode: "KIOSK-HN-02", defaultStatus: "ACTIVE" },
    "mcm eau de parfum": { slotNumber: 18, skuCode: "SKU-MCM-18", brand: "MCM WORLDWIDE", price: 12000, capacityMl: 75, defaultRemainingMl: 66.0, audience: "Unisex", isNiche: false, family: "Floral Woody", notes: "Raspberry, Apricot, White Peony, Ambrox", imageUrl: "/images/mcm-edp.jpg", defaultKioskCode: "KIOSK-DAD-01", defaultStatus: "ACTIVE" },
    "mfk baccarat rouge 540": { slotNumber: 19, skuCode: "SKU-MFK-19", brand: "MAISON FRANCIS KURKDJIAN", price: 21000, capacityMl: 70, defaultRemainingMl: 9.0, audience: "Unisex", isNiche: true, family: "Oriental Floral", notes: "Saffron, Jasmine, Amberwood, Fir Resin", imageUrl: "/images/mfk-baccarat-rouge-540.jpg", defaultKioskCode: "demo-device", defaultStatus: "ACTIVE" },
    "montblanc explorer": { slotNumber: 20, skuCode: "SKU-MTB-20", brand: "MONTBLANC", price: 11500, capacityMl: 100, defaultRemainingMl: 79.0, audience: "Men", isNiche: false, family: "Woody Aromatic", notes: "Italian Bergamot, Vetiver, Patchouli", imageUrl: "/images/montblanc-explorer.jpg", defaultKioskCode: "KIOSK-SGN-03", defaultStatus: "ACTIVE" },
    "montblanc legend": { slotNumber: 21, skuCode: "SKU-MTB-21", brand: "MONTBLANC", price: 11000, capacityMl: 100, defaultRemainingMl: 85.0, audience: "Men", isNiche: false, family: "Aromatic Fougere", notes: "Lavender, Pineapple, Red Apple, Tonka", imageUrl: "/images/montblanc-legend.jpg", defaultKioskCode: "KIOSK-SGN-03", defaultStatus: "ACTIVE" },
    "narciso rodriguez for her edp": { slotNumber: 22, skuCode: "SKU-NAR-22", brand: "NARCISO RODRIGUEZ", price: 13000, capacityMl: 100, defaultRemainingMl: 61.0, audience: "Women", isNiche: false, family: "Floral Woody Musk", notes: "Rose, Peach Pulp, Heart of Musc, Amber", imageUrl: "/images/narciso-rodriguez-for-her.jpg", defaultKioskCode: "KIOSK-HN-01", defaultStatus: "ACTIVE" },
    "narciso rodriguez pure musc": { slotNumber: 23, skuCode: "SKU-NAR-23", brand: "NARCISO RODRIGUEZ", price: 13500, capacityMl: 100, defaultRemainingMl: 74.0, audience: "Women", isNiche: false, family: "Floral Woody Musk", notes: "Pure Musk, White Flowers, Cashmeran", imageUrl: "/images/narciso-rodriguez-pure-musc.jpg", defaultKioskCode: "KIOSK-HN-02", defaultStatus: "ACTIVE" },
    "paco rabanne 1 million": { slotNumber: 24, skuCode: "SKU-PRB-24", brand: "PACO RABANNE", price: 12500, capacityMl: 100, defaultRemainingMl: 66.0, audience: "Men", isNiche: false, family: "Woody Spicy", notes: "Blood Mandarin, Cinnamon, Leather, Amber", imageUrl: "/images/paco-rabanne-1-million.jpg", defaultKioskCode: "KIOSK-SGN-02", defaultStatus: "ACTIVE" },
    "paco rabanne invictus": { slotNumber: 25, skuCode: "SKU-PRB-25", brand: "PACO RABANNE", price: 12500, capacityMl: 100, defaultRemainingMl: 72.0, audience: "Men", isNiche: false, family: "Woody Aquatic", notes: "Sea Notes, Grapefruit, Bay Leaf, Ambergris", imageUrl: "/images/paco-rabanne-invictus.jpg", defaultKioskCode: "KIOSK-DAD-01", defaultStatus: "ACTIVE" },
    "parfums de marly sedley": { slotNumber: 26, skuCode: "SKU-PDM-26", brand: "PARFUMS DE MARLY", price: 18500, capacityMl: 125, defaultRemainingMl: 68.0, audience: "Unisex", isNiche: true, family: "Woody Aromatic", notes: "Spearmint, Bergamot, Lavender, Sandalwood", imageUrl: "/images/parfums-de-marly-sedley.jpg", defaultKioskCode: "demo-device", defaultStatus: "ACTIVE" },
    "roja parfums elysium": { slotNumber: 27, skuCode: "SKU-ROJ-27", brand: "ROJA PARFUMS", price: 22000, capacityMl: 100, defaultRemainingMl: 11.0, audience: "Men", isNiche: true, family: "Aromatic Fougere", notes: "Grapefruit, Lime, Vetiver, Ambergris", imageUrl: "/images/roja-elysium.jpg", defaultKioskCode: "KIOSK-SGN-03", defaultStatus: "ACTIVE" },
    "tom ford black orchid": { slotNumber: 28, skuCode: "SKU-TF-28", brand: "TOM FORD", price: 16000, capacityMl: 100, defaultRemainingMl: 48.0, audience: "Unisex", isNiche: true, family: "Oriental Chypre", notes: "Black Truffle, Black Orchid, Patchouli", imageUrl: "/images/tom-ford-black-orchid.jpg", defaultKioskCode: "KIOSK-HN-02", defaultStatus: "ACTIVE" },
    "valentino born in roma": { slotNumber: 29, skuCode: "SKU-VAL-29", brand: "VALENTINO", price: 13000, capacityMl: 100, defaultRemainingMl: 81.0, audience: "Women", isNiche: false, family: "Oriental Floral", notes: "Blackcurrant, Jasmine, Bourbon Vanilla", imageUrl: "/images/valentino-born-in-roma.jpg", defaultKioskCode: "KIOSK-SGN-03", defaultStatus: "ACTIVE" },
    "versace bright crystal": { slotNumber: 30, skuCode: "SKU-VER-30", brand: "VERSACE", price: 11500, capacityMl: 90, defaultRemainingMl: 62.0, audience: "Women", isNiche: false, family: "Floral Fruity", notes: "Yuzu, Pomegranate, Peony, Lotus", imageUrl: "/images/versace-bright-crystal.jpg", defaultKioskCode: "KIOSK-004", defaultStatus: "ACTIVE" },
    "versace dylan blue": { slotNumber: 31, skuCode: "SKU-VER-31", brand: "VERSACE", price: 12000, capacityMl: 100, defaultRemainingMl: 77.0, audience: "Men", isNiche: false, family: "Aromatic Fougere", notes: "Bergamot, Grapefruit, Ambroxan, Incense", imageUrl: "/images/versace-dylan-blue.jpg", defaultKioskCode: "KIOSK-DAD-01", defaultStatus: "ACTIVE" },
    "versace eros": { slotNumber: 32, skuCode: "SKU-VER-32", brand: "VERSACE", price: 12500, capacityMl: 100, defaultRemainingMl: 83.0, audience: "Men", isNiche: false, family: "Aromatic Fougere", notes: "Mint Leaves, Green Apple, Tonka Bean", imageUrl: "/images/versace-eros.jpg", defaultKioskCode: "KIOSK-SGN-02", defaultStatus: "ACTIVE" },
    "ysl libre eau de parfum": { slotNumber: 33, skuCode: "SKU-YSL-33", brand: "YVES SAINT LAURENT", price: 14000, capacityMl: 90, defaultRemainingMl: 14.0, audience: "Women", isNiche: false, family: "Oriental Fougere", notes: "French Lavender, Orange Blossom, Vanilla", imageUrl: "/images/ysl-libre.jpg", defaultKioskCode: "KIOSK-SGN-01", defaultStatus: "ACTIVE" },
    "ysl y eau de parfum": { slotNumber: 34, skuCode: "SKU-YSL-34", brand: "YVES SAINT LAURENT", price: 14000, capacityMl: 100, defaultRemainingMl: 63.0, audience: "Men", isNiche: false, family: "Aromatic Fougere", notes: "Apple, Ginger, Sage, Tonka Bean", imageUrl: "/images/ysl-y-edp.jpg", defaultKioskCode: "KIOSK-HN-01", defaultStatus: "INACTIVE" },
};

const TRANSLATIONS = {
    EN: {
        heroTitle: "Touchscreen Sampling Kiosk",
        heroDesc: "Select a fragrance, scan QR to pay, and receive 1 calibrated spray (0.12ml).",
        usageTitle: "How to Use",
        usageRule: "0.12 ml / spray",
        step1Title: "1. Select Fragrance",
        step1Desc: "Pick a scent from the station catalog.",
        step2Title: "2. Scan QR Code",
        step2Desc: "Pay via VietQR, MoMo, VNPay, or ZaloPay.",
        step3Title: "3. Position Wrist",
        step3Desc: "Hold wrist 3–5 cm below the nozzle.",
        availableFragrances: "Station Catalog",
        itemsReady: "scents available",
        searchPlaceholder: "Search fragrance, brand, SKU, or notes...",
        clearSearch: "Reset Filters",
        noResultsTitle: "No Matching Fragrances",
        noResultsDesc: "Try another keyword or category.",
        pricePerSpray: "0.12ml / spray",
        viewDetails: "Details",
        selectBtn: "Select",
        selectedBtn: "Selected",
        backToCatalogue: "Back to Catalog",
        family: "Family",
        concentration: "Concentration",
        audience: "Audience",
        machineSlot: "Slot",
        topNotes: "Top Notes",
        heartNotes: "Heart Notes",
        baseNotes: "Base Notes",
        decantRef: "10ml Reference",
        experiencePrice: "Price",
        onePreciseSpray: "1 spray (0.12ml)",
        experienceNow: "Proceed to QR Payment",
        initializingOrder: "Creating QR...",
        singleSprayNotice: "Each order dispenses 1 calibrated spray (0.12ml).",
        selectedProductsTitle: "Selected",
        totalAmount: "Total",
        payByQrBtn: "Pay via QR",
        reviewBtn: "Details",
        scanQrTitle: "Scan QR to Pay",
        timeRemaining: "Expires in",
        simulatePaid: "Confirm Paid",
        simulateFail: "Simulate Sensor Fault",
        simulateUncertain: "Simulate Timeout (Uncertain)",
        cancelOrder: "Cancel",
        paymentConfirmed: "Payment Verified",
        getReadyTitle: "Position Your Wrist or Scent Strip",
        guidanceMain: "Hold your wrist or test strip 3–5 cm below the nozzle.",
        guidanceSub: "Press the button below when ready to dispense.",
        readySprayNowBtn: "Dispense Now (0.12ml)",
        dispensingTitle: "Dispensing...",
        preciseSprayProgress: "Spraying 0.12ml",
        dispensingHint: "Keep wrist steady inside the chamber.",
        completeTitle: "Dispense Complete",
        thankYouText: "Thank you for using ScentStation.",
        doneBtn: "Finish",
        autoReturnIn: "Returning in",
        failedTitle: "Dispense Interrupted",
        uncertainTitle: "Unconfirmed Result — Logged for Review",
        retryQrBtn: "New QR Code",
        backToFragrances: "Back to Home",
        exploreBtn: "Browse Catalog",
        categories: {
            ALL: "All",
            WOMEN: "Women",
            MEN: "Men",
            UNISEX: "Unisex",
            NICHE: "Niche",
            BEST_SELLER: "Featured",
        },
    },
    VI: {
        heroTitle: "Màn hình Kiosk xịt thử nước hoa",
        heroDesc: "Chọn mùi hương, quét mã QR thanh toán và nhận 1 lần xịt định lượng (0.12ml).",
        usageTitle: "Hướng dẫn sử dụng",
        usageRule: "0.12 ml / lần xịt",
        step1Title: "1. Chọn mùi hương",
        step1Desc: "Chọn nước hoa từ danh mục của trạm.",
        step2Title: "2. Quét mã QR",
        step2Desc: "Thanh toán qua VietQR, MoMo, VNPay hoặc ZaloPay.",
        step3Title: "3. Đặt cổ tay",
        step3Desc: "Đặt cổ tay hoặc giấy thử cách vòi phun 3–5 cm.",
        availableFragrances: "Danh mục tại trạm",
        itemsReady: "mùi đang mở bán",
        searchPlaceholder: "Tìm tên nước hoa, thương hiệu, mã SKU...",
        clearSearch: "Xóa bộ lọc",
        noResultsTitle: "Không có mùi hương phù hợp",
        noResultsDesc: "Thử từ khóa hoặc danh mục khác.",
        pricePerSpray: "0.12ml / lần xịt",
        viewDetails: "Chi tiết",
        selectBtn: "Chọn",
        selectedBtn: "Đã chọn",
        backToCatalogue: "Quay lại danh mục",
        family: "Nhóm hương",
        concentration: "Nồng độ",
        audience: "Phân loại",
        machineSlot: "Khoang chứa",
        topNotes: "Hương đầu",
        heartNotes: "Hương giữa",
        baseNotes: "Hương cuối",
        decantRef: "Giá tham khảo 10ml",
        experiencePrice: "Giá xịt thử",
        onePreciseSpray: "1 lần xịt (0.12ml)",
        experienceNow: "Thanh toán mã QR",
        initializingOrder: "Đang tạo QR...",
        singleSprayNotice: "Mỗi đơn thực hiện 1 lần xịt định lượng (0.12ml).",
        selectedProductsTitle: "Đã chọn",
        totalAmount: "Tổng tiền",
        payByQrBtn: "Thanh toán QR",
        reviewBtn: "Chi tiết",
        scanQrTitle: "Quét mã QR để thanh toán",
        timeRemaining: "Hết hạn sau",
        simulatePaid: "Xác nhận đã thanh toán",
        simulateFail: "Giả lập lỗi cảm biến",
        simulateUncertain: "Giả lập mất kết nối (Chờ đối soát)",
        cancelOrder: "Hủy đơn",
        paymentConfirmed: "Đã xác nhận thanh toán",
        getReadyTitle: "Đặt cổ tay hoặc giấy thử vào buồng xịt",
        guidanceMain: "Đặt cổ tay hoặc giấy thử cách vòi phun 3–5 cm.",
        guidanceSub: "Bấm nút bên dưới khi đã sẵn sàng.",
        readySprayNowBtn: "Xịt nước hoa ngay (0.12ml)",
        dispensingTitle: "Đang phun nước hoa...",
        preciseSprayProgress: "Đang phun 0.12ml",
        dispensingHint: "Giữ yên cổ tay trong buồng xịt.",
        completeTitle: "Đã phun hoàn tất",
        thankYouText: "Cảm ơn bạn đã sử dụng ScentStation.",
        doneBtn: "Hoàn tất",
        autoReturnIn: "Tự động quay về sau",
        failedTitle: "Gián đoạn giao dịch",
        uncertainTitle: "Chưa xác nhận kết quả — Đã chuyển đối soát",
        retryQrBtn: "Tạo lại mã QR",
        backToFragrances: "Về màn hình chính",
        exploreBtn: "Xem danh mục",
        categories: {
            ALL: "Tất cả",
            WOMEN: "Nữ",
            MEN: "Nam",
            UNISEX: "Nam & Nữ",
            NICHE: "Cao cấp",
            BEST_SELLER: "Nổi bật",
        },
    },
} as const;

const formatPrice = (price: number): string =>
    new Intl.NumberFormat("vi-VN").format(price) + " VND";

const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const isExactFragranceMatch = (nameA: string, nameB: string): boolean =>
    nameA.trim().toLowerCase() === nameB.trim().toLowerCase();

const formatSlotLabel = (raw: string, lang: KioskLanguage): string => {
    const clean = raw.trim().toUpperCase();
    return lang === "VI" ? clean.replace("SLOT", "KHOANG") : clean.replace("KHOANG", "SLOT");
};

const formatAudienceLabel = (aud: string | undefined, lang: KioskLanguage): string => {
    if (!aud) return "";
    if (lang === "EN") return aud;
    if (aud === "Men") return "Nam";
    if (aud === "Women") return "Nữ";
    return "Nam & Nữ";
};

const formatKioskStatus = (status: "ONLINE" | "MAINTENANCE" | "OFFLINE", lang: KioskLanguage): string => {
    if (lang === "EN") {
        return status === "ONLINE" ? "Online" : status === "MAINTENANCE" ? "Maintenance" : "Offline";
    }
    return status === "ONLINE" ? "Sẵn sàng" : status === "MAINTENANCE" ? "Bảo trì" : "Mất kết nối";
};

const parseNotesFallback = (notesString?: string) => {
    if (!notesString) {
        return { top: ["Bergamot"], heart: ["Jasmine"], base: ["Sandalwood"] };
    }
    const items = notesString.split(",").map((s) => s.trim()).filter(Boolean);
    if (items.length >= 3) {
        const third = Math.ceil(items.length / 3);
        return {
            top: items.slice(0, third),
            heart: items.slice(third, third * 2),
            base: items.slice(third * 2),
        };
    }
    return { top: [items[0] || "Bergamot"], heart: [items[1] || "Floral"], base: ["Amber & Wood"] };
};

const ALWAYS_ONLINE_DEMO_CODES = new Set([
    "demo-device",
    "kiosk-sgn-01",
    "kiosk-sgn-02",
    "kiosk-sgn-03",
    "kiosk-hn-01",
    "kiosk-dad-01",
]);

export default function KioskPage() {
    const router = useRouter();
    const params = useParams<{ deviceId: string }>();
    const initialParamId = decodeURIComponent(params.deviceId || "demo-device");

    const [activeDeviceId, setActiveDeviceId] = useState<string>(initialParamId);
    useEffect(() => {
        const nextParam = decodeURIComponent(params.deviceId || "demo-device");
        if (nextParam && nextParam !== activeDeviceId) setActiveDeviceId(nextParam);
    }, [params.deviceId, activeDeviceId]);

    const catalogueRef = useRef<HTMLElement | null>(null);
    const [lang, setLang] = useState<KioskLanguage>("VI");
    const t = TRANSLATIONS[lang];

    const handleSwitchLanguage = useCallback((nextLang: KioskLanguage) => {
        setLang(nextLang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang.toLowerCase());
            window.dispatchEvent(new Event("scentstation-sync"));
        } catch {
            // Ignore
        }
    }, []);

    useEffect(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang) setLang(savedLang.toUpperCase() === "EN" ? "EN" : "VI");
        } catch {
            // Safe fallback
        }
    }, []);

    const [kioskFleet, setKioskFleet] = useState<SyncedKioskUnit[]>(FALLBACK_8_KIOSKS);
    const [showFull34Catalog, setShowFull34Catalog] = useState<boolean>(true);
    const [isUnitMenuOpen, setIsUnitMenuOpen] = useState<boolean>(false);
    const unitMenuRef = useRef<HTMLDivElement | null>(null);

    const [activeCategory, setActiveCategory] = useState<KioskCategory>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [step, setStep] = useState<KioskStep>("SELECT");
    const [cartProduct, setCartProduct] = useState<ExtendedKioskSlot | null>(null);
    const [detailProduct, setDetailProduct] = useState<ExtendedKioskSlot | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentProviderMethod>("VIETQR");
    const [showDiagnosticsDrawer, setShowDiagnosticsDrawer] = useState<boolean>(false);

    const [activeVideoIndex, setActiveVideoIndex] = useState(1);
    const [order, setOrder] = useState<OrderSnapshot | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(120);
    const [autoReturnSeconds, setAutoReturnSeconds] = useState(15);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [availableProducts, setAvailableProducts] = useState<ExtendedKioskSlot[]>([]);
    const [isMenuLoading, setIsMenuLoading] = useState(true);

    const stepSequenceTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoReturnRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimers = useCallback(() => {
        stepSequenceTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
        stepSequenceTimeoutsRef.current = [];
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        if (autoReturnRef.current) {
            clearInterval(autoReturnRef.current);
            autoReturnRef.current = null;
        }
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (unitMenuRef.current && !unitMenuRef.current.contains(e.target as Node)) {
                setIsUnitMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const currentKioskUnit = useMemo(() => {
        return kioskFleet.find((k) => k.code.toLowerCase() === activeDeviceId.toLowerCase()) || kioskFleet[0];
    }, [kioskFleet, activeDeviceId]);

    const isKioskOnlineAndActive =
        currentKioskUnit.connectionStatus === "ONLINE" &&
        currentKioskUnit.operatingStatus === "ACTIVE" &&
        currentKioskUnit.status === "ONLINE" &&
        !currentKioskUnit.doorOpen &&
        !currentKioskUnit.leakDetected;

    const getAvailabilityBadgeText = useCallback(
        (reason: ExtendedKioskSlot["availabilityReason"]) => {
            if (reason === "INACTIVE") return lang === "VI" ? "TẠM ẨN" : "INACTIVE";
            if (reason === "SOLD_OUT") return lang === "VI" ? "HẾT BÌNH" : "EMPTY";
            if (reason === "MAINTENANCE") return lang === "VI" ? "BẢO TRÌ" : "MAINTENANCE";
            if (reason === "OFFLINE") return lang === "VI" ? "MẤT KẾT NỐI" : "OFFLINE";
            return lang === "VI" ? "SẴN SÀNG" : "READY";
        },
        [lang]
    );

    const syncKioskDataFromStorage = useCallback(
        (overrideKioskCode?: string) => {
            const targetCode = (overrideKioskCode || activeDeviceId).toLowerCase();
            try {
                const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLang) setLang(savedLang.toUpperCase() === "EN" ? "EN" : "VI");

                const customProductsMap: Record<string, any> = {};
                const customBySlotMap: Record<number, any> = {};
                const customBySkuMap: Record<string, any> = {};
                let parsedProdsList: any[] = [];
                const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                if (rawProds) {
                    const parsedProds = JSON.parse(rawProds);
                    if (Array.isArray(parsedProds)) {
                        parsedProdsList = parsedProds;
                        parsedProds.forEach((p: any) => {
                            if (p) {
                                if (p.name) customProductsMap[String(p.name).trim().toLowerCase()] = p;
                                if (typeof p.slotNumber === "number") customBySlotMap[p.slotNumber] = p;
                                if (p.skuCode) customBySkuMap[String(p.skuCode).trim().toLowerCase()] = p;
                            }
                        });
                    }
                }

                let perKioskMatrix: Record<string, Record<string, number>> = {};
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                if (rawMatrix) perKioskMatrix = JSON.parse(rawMatrix) || {};

                parsedProdsList.forEach((p: any) => {
                    if (p && p.name && Array.isArray(p.assignedMachines)) {
                        const pKey = String(p.name).trim().toLowerCase();
                        p.assignedMachines.forEach((am: any) => {
                            if (am && am.kioskCode && typeof am.remainingVolumeMl === "number") {
                                const kKey = String(am.kioskCode).toLowerCase();
                                if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                                perKioskMatrix[kKey][pKey] = Number(am.remainingVolumeMl);
                            }
                        });
                    }
                });

                let currentFleet = FALLBACK_8_KIOSKS;
                const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawMachines) {
                    const parsed = JSON.parse(rawMachines);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        currentFleet = FALLBACK_8_KIOSKS.map((defaultUnit) => {
                            const savedUnit = parsed.find(
                                (m: any) => String(m.code || "").toLowerCase() === defaultUnit.code.toLowerCase()
                            );
                            if (!savedUnit) return defaultUnit;

                            const isPrimaryOnlineDemo = ALWAYS_ONLINE_DEMO_CODES.has(defaultUnit.code.toLowerCase());
                            let conn = savedUnit.connectionStatus || (savedUnit.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                            let oper =
                                savedUnit.operatingStatus ||
                                (savedUnit.status === "MAINTENANCE" ? "MAINTENANCE" : savedUnit.status === "OFFLINE" ? "ERROR" : "ACTIVE");
                            if (isPrimaryOnlineDemo && (conn === "OFFLINE" || oper === "ERROR") && !savedUnit.manualAdminOverride) {
                                conn = "ONLINE";
                                oper = "ACTIVE";
                            }
                            const unifiedStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" =
                                conn === "OFFLINE" ? "OFFLINE" : oper === "MAINTENANCE" ? "MAINTENANCE" : oper === "ACTIVE" ? "ONLINE" : "OFFLINE";
                            const rawSlots = Array.isArray(savedUnit.slots) && savedUnit.slots.length > 0 ? savedUnit.slots : defaultUnit.slots;
                            const kKey = defaultUnit.code.toLowerCase();

                            return {
                                ...defaultUnit,
                                ...savedUnit,
                                addressEn: savedUnit.addressEn || defaultUnit.addressEn,
                                status: unifiedStatus,
                                connectionStatus: conn,
                                operatingStatus: oper,
                                doorOpen: Boolean(savedUnit.doorOpen),
                                leakDetected: Boolean(savedUnit.leakDetected),
                                slots: rawSlots.map((sl: any) => {
                                    const sKey = String(sl.fragranceName || "").trim().toLowerCase();
                                    const prodStatus =
                                        customProductsMap[sKey]?.status || sl.productStatus || MASTER_34_CATALOG_METADATA[sKey]?.defaultStatus || "ACTIVE";
                                    const syncedMl =
                                        typeof perKioskMatrix[kKey]?.[sKey] === "number" ? perKioskMatrix[kKey][sKey] : Number(sl.remainingMl);
                                    return { ...sl, remainingMl: syncedMl, productStatus: prodStatus };
                                }),
                            };
                        });
                    }
                }
                setKioskFleet(currentFleet);

                const matchedUnit = currentFleet.find((k) => k.code.toLowerCase() === targetCode) || currentFleet[0];
                const unitReady =
                    matchedUnit.connectionStatus === "ONLINE" &&
                    matchedUnit.operatingStatus === "ACTIVE" &&
                    matchedUnit.status === "ONLINE" &&
                    !matchedUnit.doorOpen &&
                    !matchedUnit.leakDetected;

                const currentKioskKey = matchedUnit.code.toLowerCase();
                const currentKioskStockMap = perKioskMatrix[currentKioskKey] || {};

                const resolveSavedProductRecord = (fragranceKey: string, slotNumber?: number, skuCode?: string) =>
                    customProductsMap[fragranceKey] ||
                    (typeof slotNumber === "number" ? customBySlotMap[slotNumber] : undefined) ||
                    (skuCode ? customBySkuMap[skuCode.toLowerCase()] : undefined);

                const resolveUnifiedRemainingMl = (
                    fragranceKey: string,
                    defaultFallbackMl: number,
                    directSlotMl?: number,
                    slotNumber?: number,
                    skuCode?: string
                ): number => {
                    const savedCustom = resolveSavedProductRecord(fragranceKey, slotNumber, skuCode);
                    if (savedCustom && Array.isArray(savedCustom.assignedMachines)) {
                        if (savedCustom.assignedMachines.length === 0) return 0;
                        const matchOnCurrent = savedCustom.assignedMachines.find(
                            (am: any) => String(am.kioskCode || "").toLowerCase() === currentKioskKey
                        );
                        if (matchOnCurrent && typeof matchOnCurrent.remainingVolumeMl === "number") {
                            return Number(matchOnCurrent.remainingVolumeMl);
                        }
                        if (typeof savedCustom.assignedMachines[0].remainingVolumeMl === "number") {
                            return Number(savedCustom.assignedMachines[0].remainingVolumeMl);
                        }
                    }
                    if (typeof currentKioskStockMap[fragranceKey] === "number") return Number(currentKioskStockMap[fragranceKey]);
                    if (typeof directSlotMl === "number") return Number(directSlotMl);
                    return defaultFallbackMl;
                };

                if (!showFull34Catalog) {
                    const unitSlots: ExtendedKioskSlot[] = matchedUnit.slots.map((sl, idx) => {
                        const key = sl.fragranceName.trim().toLowerCase();
                        const meta = MASTER_34_CATALOG_METADATA[key] || {
                            slotNumber: idx + 1,
                            skuCode: `SKU-0${idx + 1}`,
                            brand: sl.brand.toUpperCase(),
                            price: 15000,
                            capacityMl: sl.capacityMl || 100,
                            defaultRemainingMl: sl.remainingMl,
                            audience: "Unisex" as const,
                            isNiche: false,
                            family: "Perfume",
                            notes: "Bergamot, Jasmine, Sandalwood",
                            imageUrl: "/images/bleu-de-chanel.png",
                            defaultKioskCode: matchedUnit.code,
                            defaultStatus: "ACTIVE" as const,
                        };
                        const savedCustom = resolveSavedProductRecord(key, meta.slotNumber, meta.skuCode);
                        const hasAssignedOnThisKiosk =
                            !savedCustom ||
                            !Array.isArray(savedCustom.assignedMachines) ||
                            savedCustom.assignedMachines.some(
                                (am: any) => String(am.kioskCode || "").toLowerCase() === currentKioskKey
                            );
                        const prodStatus: "ACTIVE" | "INACTIVE" | "DRAFT" = !hasAssignedOnThisKiosk
                            ? "INACTIVE"
                            : savedCustom?.status || sl.productStatus || meta.defaultStatus || "ACTIVE";
                        const isProductActive = prodStatus === "ACTIVE";
                        const effectivePrice = Number(savedCustom?.pricePerSpray ?? meta.price);
                        const remMl = resolveUnifiedRemainingMl(key, meta.defaultRemainingMl, sl.remainingMl, meta.slotNumber, meta.skuCode);
                        const isSlotEnoughMl = remMl >= 0.12;
                        const availabilityReason: ExtendedKioskSlot["availabilityReason"] = !isProductActive
                            ? "INACTIVE"
                            : !isSlotEnoughMl
                                ? "SOLD_OUT"
                                : matchedUnit.connectionStatus === "OFFLINE"
                                    ? "OFFLINE"
                                    : !unitReady
                                        ? "MAINTENANCE"
                                        : "READY";

                        return {
                            slotNumber: meta.slotNumber,
                            physicalSlotLabel: sl.slotLabel.toUpperCase(),
                            skuCode: savedCustom?.skuCode || meta.skuCode,
                            productName: savedCustom?.name || sl.fragranceName,
                            brand: (savedCustom?.brand || meta.brand).toUpperCase(),
                            price: effectivePrice,
                            available: unitReady && isSlotEnoughMl && isProductActive,
                            availabilityReason,
                            remainingMl: remMl,
                            capacityMl: Number(savedCustom?.bottleVolumeMl || sl.capacityMl || meta.capacityMl),
                            lowStockThresholdMl: Number(sl.lowStockThresholdMl || 15),
                            sprayDurationMs: 1200,
                            imageUrl: savedCustom?.image || meta.imageUrl,
                            notes: savedCustom?.notes || meta.notes,
                            concentration: "EDP",
                            audience:
                                savedCustom?.category === "Men" || savedCustom?.category === "Women" || savedCustom?.category === "Unisex"
                                    ? savedCustom.category
                                    : meta.audience,
                            isNiche: savedCustom?.category === "Niche" ? true : meta.isNiche,
                            isBestSeller: true,
                            fragranceFamily: savedCustom?.family || meta.family,
                            description: savedCustom?.description,
                            retailPrice10ml: effectivePrice * 30,
                            kioskCode: matchedUnit.code,
                            kioskLocation: matchedUnit.locationName,
                            isPrimaryChamberSlot: true,
                            productStatus: prodStatus,
                        };
                    });
                    setAvailableProducts(unitSlots);
                } else {
                    const allActiveForCurrentKiosk: ExtendedKioskSlot[] = Object.entries(MASTER_34_CATALOG_METADATA)
                        .filter(([key, meta]) => {
                            const savedCustom = resolveSavedProductRecord(key, meta.slotNumber, meta.skuCode);
                            const effectiveStatus = savedCustom?.status || meta.defaultStatus || "ACTIVE";
                            const hasAssignedMachine =
                                !savedCustom || !Array.isArray(savedCustom.assignedMachines) || savedCustom.assignedMachines.length > 0;
                            return effectiveStatus === "ACTIVE" && hasAssignedMachine;
                        })
                        .map(([key, meta]) => {
                            const savedCustom = resolveSavedProductRecord(key, meta.slotNumber, meta.skuCode);
                            const effectiveName =
                                savedCustom?.name ||
                                key
                                    .split(" ")
                                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                    .join(" ");
                            const effectiveNameKey = effectiveName.trim().toLowerCase();
                            const directSlotIdx = matchedUnit.slots.findIndex(
                                (s) => isExactFragranceMatch(s.fragranceName, key) || isExactFragranceMatch(s.fragranceName, effectiveName)
                            );
                            const directSlotInCurrentKiosk = directSlotIdx >= 0 ? matchedUnit.slots[directSlotIdx] : undefined;
                            const effectivePrice = Number(savedCustom?.pricePerSpray ?? meta.price);
                            const remMl = resolveUnifiedRemainingMl(
                                effectiveNameKey,
                                meta.defaultRemainingMl,
                                directSlotInCurrentKiosk?.remainingMl,
                                meta.slotNumber,
                                meta.skuCode
                            );
                            const capMl = Number(savedCustom?.bottleVolumeMl ?? directSlotInCurrentKiosk?.capacityMl ?? meta.capacityMl);
                            const isEnoughMl = remMl >= 0.12;
                            const availabilityReason: ExtendedKioskSlot["availabilityReason"] = !isEnoughMl
                                ? "SOLD_OUT"
                                : matchedUnit.connectionStatus === "OFFLINE" || matchedUnit.status === "OFFLINE"
                                    ? "OFFLINE"
                                    : !unitReady
                                        ? "MAINTENANCE"
                                        : "READY";
                            const assignedOnCurrent = savedCustom?.assignedMachines?.find(
                                (am: any) => String(am.kioskCode || "").toLowerCase() === currentKioskKey
                            );
                            const primaryAssigned = savedCustom?.assignedMachines?.[0];
                            const assignedChamberLabel = directSlotInCurrentKiosk
                                ? directSlotInCurrentKiosk.slotLabel.toUpperCase()
                                : assignedOnCurrent?.physicalSlotLabel?.toUpperCase() ||
                                primaryAssigned?.physicalSlotLabel?.toUpperCase() ||
                                `SLOT 0${((meta.slotNumber - 1) % 4) + 1}`;
                            const effectiveKioskCode = assignedOnCurrent
                                ? assignedOnCurrent.kioskCode
                                : primaryAssigned?.kioskCode || meta.defaultKioskCode || matchedUnit.code;

                            return {
                                slotNumber: meta.slotNumber,
                                physicalSlotLabel: assignedChamberLabel,
                                skuCode: savedCustom?.skuCode || meta.skuCode,
                                productName: effectiveName,
                                brand: (savedCustom?.brand || meta.brand).toUpperCase(),
                                price: effectivePrice,
                                available: unitReady && isEnoughMl,
                                availabilityReason,
                                remainingMl: remMl,
                                capacityMl: capMl,
                                lowStockThresholdMl: 15,
                                sprayDurationMs: 1200,
                                imageUrl: savedCustom?.image || meta.imageUrl,
                                notes: savedCustom?.notes || meta.notes,
                                concentration: "EDP",
                                audience:
                                    savedCustom?.category === "Men" || savedCustom?.category === "Women" || savedCustom?.category === "Unisex"
                                        ? savedCustom.category
                                        : meta.audience,
                                isNiche: savedCustom?.category === "Niche" ? true : meta.isNiche,
                                isBestSeller: Boolean(directSlotInCurrentKiosk) || Boolean(assignedOnCurrent) || meta.slotNumber <= 12,
                                fragranceFamily: savedCustom?.family || meta.family,
                                description: savedCustom?.description,
                                retailPrice10ml: effectivePrice * 30,
                                kioskCode: effectiveKioskCode,
                                kioskLocation: matchedUnit.locationName,
                                isPrimaryChamberSlot: Boolean(directSlotInCurrentKiosk) || Boolean(assignedOnCurrent),
                                productStatus: "ACTIVE",
                            };
                        });

                    allActiveForCurrentKiosk.sort((a, b) => {
                        const scoreA = a.isPrimaryChamberSlot ? -100 + a.slotNumber : a.slotNumber;
                        const scoreB = b.isPrimaryChamberSlot ? -100 + b.slotNumber : b.slotNumber;
                        return scoreA - scoreB;
                    });
                    setAvailableProducts(allActiveForCurrentKiosk);
                }
            } catch {
                // Safe fallback
            } finally {
                setIsMenuLoading(false);
            }
        },
        [activeDeviceId, showFull34Catalog]
    );

    useEffect(() => {
        syncKioskDataFromStorage();
        const handleStorage = () => syncKioskDataFromStorage();
        window.addEventListener("storage", handleStorage);
        window.addEventListener("focus", handleStorage);
        window.addEventListener("scentstation-sync", handleStorage);
        const syncTimer = setInterval(() => syncKioskDataFromStorage(), 2000);
        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("focus", handleStorage);
            window.removeEventListener("scentstation-sync", handleStorage);
            clearInterval(syncTimer);
        };
    }, [syncKioskDataFromStorage]);

    const handleSwitchActiveKioskUnit = useCallback(
        (newKioskCode: string) => {
            clearTimers();
            setIsUnitMenuOpen(false);
            setStep("SELECT");
            setDetailProduct(null);
            setCartProduct(null);
            setOrder(null);
            setErrorMessage(null);
            setActiveDeviceId(newKioskCode);
            syncKioskDataFromStorage(newKioskCode);
            if (typeof window !== "undefined") {
                window.history.pushState(null, "", `/kiosk/${encodeURIComponent(newKioskCode)}`);
            }
            router.push(`/kiosk/${encodeURIComponent(newKioskCode)}`);
        },
        [clearTimers, router, syncKioskDataFromStorage]
    );

    const handleForceReconnectCurrentKiosk = useCallback(() => {
        const healedFleet = kioskFleet.map((k) => {
            if (k.code.toLowerCase() !== currentKioskUnit.code.toLowerCase()) return k;
            return {
                ...k,
                status: "ONLINE" as const,
                connectionStatus: "ONLINE" as const,
                operatingStatus: "ACTIVE" as const,
                doorOpen: false,
                leakDetected: false,
                chamberTemp: "21.5°C",
                slots: k.slots.map((sl) => ({ ...sl, remainingMl: sl.remainingMl < 5 ? 75.0 : sl.remainingMl })),
            };
        });
        setKioskFleet(healedFleet);
        localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(healedFleet));
        syncKioskDataFromStorage(currentKioskUnit.code);
    }, [currentKioskUnit.code, kioskFleet, syncKioskDataFromStorage]);

    const upsertKioskOrderToSharedStorage = useCallback(
        (
            snap: OrderSnapshot,
            nextStatus: OrderStatus,
            options?: {
                deductStock?: boolean;
                failureReason?: string;
                requiresHumanReview?: boolean;
                overridePaymentMethod?: PaymentProviderMethod;
            }
        ) => {
            try {
                const activeMethod = options?.overridePaymentMethod || paymentMethod;
                const executingKioskCode = snap.product.kioskCode || currentKioskUnit.code;
                const executingKioskKey = executingKioskCode.toLowerCase();
                const perfumeKey = snap.product.productName.trim().toLowerCase();
                const qtyBefore = snap.product.remainingMl;
                let qtyAfter = qtyBefore;

                if (options?.deductStock) {
                    qtyAfter = Number(Math.max(0, qtyBefore - 0.12).toFixed(2));
                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
                    if (!perKioskMatrix[executingKioskKey]) perKioskMatrix[executingKioskKey] = {};
                    perKioskMatrix[executingKioskKey][perfumeKey] = qtyAfter;
                    localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                    const updatedFleet = kioskFleet.map((k) => {
                        if (k.code.toLowerCase() !== executingKioskKey) return k;
                        return {
                            ...k,
                            todaySprays: (k.todaySprays || 0) + 1,
                            todayRevenue: (k.todayRevenue || 0) + snap.price,
                            slots: k.slots.map((sl) =>
                                isExactFragranceMatch(sl.fragranceName, snap.product.productName) ? { ...sl, remainingMl: qtyAfter } : sl
                            ),
                        };
                    });
                    setKioskFleet(updatedFleet);
                    localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));

                    const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                    if (rawProds) {
                        const parsedProds = JSON.parse(rawProds);
                        if (Array.isArray(parsedProds)) {
                            const syncedProds = parsedProds.map((p: any) => {
                                if (!isExactFragranceMatch(p.name || "", snap.product.productName) && p.skuCode !== snap.product.skuCode) {
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
                                            String(am.kioskCode || "").toLowerCase() === executingKioskKey
                                                ? { ...am, remainingVolumeMl: qtyAfter }
                                                : am
                                        )
                                        : [],
                                };
                            });
                            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(syncedProds));
                        }
                    }

                    setAvailableProducts((prev) =>
                        prev.map((item) =>
                            isExactFragranceMatch(item.productName, snap.product.productName)
                                ? {
                                    ...item,
                                    remainingMl: qtyAfter,
                                    available: item.available && qtyAfter >= 0.12,
                                    availabilityReason: qtyAfter < 0.12 ? "SOLD_OUT" : item.availabilityReason,
                                }
                                : item
                        )
                    );

                    const rawMovements = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movements = rawMovements ? JSON.parse(rawMovements) : [];
                    movements.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: snap.orderId,
                        commandReference: snap.commandUuid,
                        kioskCode: executingKioskCode,
                        slotNumber: snap.product.slotNumber,
                        brand: snap.product.brand,
                        productName: snap.product.productName,
                        movementType: "SALE",
                        quantityBeforeMl: qtyBefore,
                        quantityAfterMl: qtyAfter,
                        deltaMl: -0.12,
                        reason: `Kiosk spray ${executingKioskCode} (${snap.orderId})`,
                        timestamp: new Date().toISOString(),
                    });
                    localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(movements.slice(0, 300)));
                }

                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                const dashData = rawDash ? JSON.parse(rawDash) : { transactions: [], incidents: [], alerts: [] };
                if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                if (!Array.isArray(dashData.incidents)) dashData.incidents = [];
                if (!Array.isArray(dashData.alerts)) dashData.alerts = [];

                const txRecord = {
                    id: snap.orderId,
                    time: `${executingKioskCode} (${nextStatus})`,
                    kiosk: executingKioskCode,
                    slotNumber: snap.product.slotNumber,
                    brand: snap.product.brand,
                    product: snap.product.productName,
                    priceSnapshot: snap.price,
                    amount: nextStatus === "DISPENSED" ? snap.price : 0,
                    paidAmount: ["PAID", "DISPENSING", "DISPENSED", "FAILED", "UNCERTAIN"].includes(nextStatus) ? snap.price : 0,
                    paymentMethod: activeMethod,
                    providerReference: `PAY-${activeMethod}-${snap.orderId}`,
                    status: nextStatus,
                    commandReference: snap.commandUuid,
                    idempotencyKey: snap.idempotencyKey,
                    signature: snap.hmacSignature,
                    ackedAt: nextStatus !== "PENDING" ? new Date().toISOString() : null,
                    executedAt: nextStatus === "DISPENSED" ? new Date().toISOString() : null,
                    failureReason: options?.failureReason || null,
                    requiresHumanReview: Boolean(options?.requiresHumanReview),
                    updatedAt: new Date().toISOString(),
                };

                const existingIdx = dashData.transactions.findIndex((tx: any) => tx.id === snap.orderId);
                if (existingIdx >= 0) {
                    dashData.transactions[existingIdx] = { ...dashData.transactions[existingIdx], ...txRecord };
                } else {
                    dashData.transactions.unshift({ ...txRecord, createdAt: new Date().toISOString() });
                }

                if (options?.requiresHumanReview && !dashData.incidents.some((inc: any) => inc.orderId === snap.orderId)) {
                    dashData.incidents.unshift({
                        incidentId: `INC-2026-${Math.floor(1000 + Math.random() * 8999)}`,
                        orderId: snap.orderId,
                        kioskCode: executingKioskCode,
                        brand: snap.product.brand,
                        product: snap.product.productName,
                        paidAmount: snap.price,
                        orderState: nextStatus,
                        severity: nextStatus === "UNCERTAIN" ? "HIGH" : "CRITICAL",
                        status: "OPEN_FOR_OM_REVIEW",
                        reason: options.failureReason || `Unconfirmed result on ${executingKioskCode}`,
                        createdAt: new Date().toISOString(),
                    });
                }

                localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));

                const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const logs = rawLogs ? JSON.parse(rawLogs) : [];
                logs.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: new Date().toISOString(),
                    actor: `Kiosk (${executingKioskCode})`,
                    role: "CU",
                    tenant: snap.product.brand,
                    action: `KIOSK_ORDER_${nextStatus}`,
                    entityType: "ORDERS",
                    entityId: snap.orderId,
                    oldValues: { kioskCode: executingKioskCode, remainingMl: qtyBefore },
                    newValues: { kioskCode: executingKioskCode, status: nextStatus, remainingMl: qtyAfter },
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));

                if (typeof window !== "undefined") window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        [currentKioskUnit.code, kioskFleet, paymentMethod]
    );

    const categoryCounts = useMemo(() => ({
        ALL: availableProducts.length,
        WOMEN: availableProducts.filter((i) => i.audience?.toLowerCase() === "women").length,
        MEN: availableProducts.filter((i) => i.audience?.toLowerCase() === "men").length,
        UNISEX: availableProducts.filter((i) => i.audience?.toLowerCase() === "unisex").length,
        NICHE: availableProducts.filter((i) => Boolean(i.isNiche)).length,
        BEST_SELLER: availableProducts.filter((i) => Boolean(i.isBestSeller)).length,
    }), [availableProducts]);

    const filteredCatalogue = useMemo(() => {
        return availableProducts.filter((item) => {
            const matchesCategory =
                activeCategory === "ALL" ||
                (activeCategory === "WOMEN" && item.audience?.toLowerCase() === "women") ||
                (activeCategory === "MEN" && item.audience?.toLowerCase() === "men") ||
                (activeCategory === "UNISEX" && item.audience?.toLowerCase() === "unisex") ||
                (activeCategory === "NICHE" && Boolean(item.isNiche)) ||
                (activeCategory === "BEST_SELLER" && Boolean(item.isBestSeller));

            const q = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !q ||
                item.productName.toLowerCase().includes(q) ||
                item.skuCode.toLowerCase().includes(q) ||
                item.brand.toLowerCase().includes(q) ||
                (item.notes && item.notes.toLowerCase().includes(q));

            return matchesCategory && matchesSearch;
        });
    }, [availableProducts, activeCategory, searchQuery]);

    const resetToSelect = useCallback(() => {
        clearTimers();
        setStep("SELECT");
        setCartProduct(null);
        setDetailProduct(null);
        setOrder(null);
        setRemainingSeconds(120);
        setAutoReturnSeconds(15);
        setErrorMessage(null);
        setIsCreatingOrder(false);
        setShowDiagnosticsDrawer(false);
    }, [clearTimers]);

    useEffect(() => {
        if (step !== "SUCCESS") return;
        setAutoReturnSeconds(15);
        autoReturnRef.current = setInterval(() => {
            setAutoReturnSeconds((prev) => {
                if (prev <= 1) {
                    resetToSelect();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (autoReturnRef.current) {
                clearInterval(autoReturnRef.current);
                autoReturnRef.current = null;
            }
        };
    }, [step, resetToSelect]);

    const handleSelectForCart = (product: ExtendedKioskSlot, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (step !== "SELECT") return;
        if (!product.available || product.remainingMl < 0.12 || !isKioskOnlineAndActive) return;
        setCartProduct(product);
        setErrorMessage(null);
    };

    const handleOpenProductDetail = (product: ExtendedKioskSlot) => {
        if (step !== "SELECT") return;
        setDetailProduct(product);
        if (product.available && product.remainingMl >= 0.12) setCartProduct(product);
        setErrorMessage(null);
    };

    const handleConfirmSelection = async (targetOverride?: ExtendedKioskSlot) => {
        const targetProduct = targetOverride || detailProduct || cartProduct;
        if (!targetProduct || !isKioskOnlineAndActive || isCreatingOrder || !targetProduct.available) return;

        setIsCreatingOrder(true);
        setErrorMessage(null);
        setShowDiagnosticsDrawer(false);
        clearTimers();

        const now = Date.now();
        const expiresAt = now + 120 * 1000;
        const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
        const cmdUuid = `CMD-${newOrderId}`;
        const stationForOrder = targetProduct.kioskCode || currentKioskUnit.code;
        const idempotencyKey = `IDEMP-${newOrderId}-${stationForOrder}`;
        const hmacSignature = `HMAC_SHA256_${btoa(`${cmdUuid}|${stationForOrder}|${targetProduct.slotNumber}`).slice(0, 24)}`;

        const newOrder: OrderSnapshot = {
            orderId: newOrderId,
            qrContent: `SCENTSTATION_PAY|${newOrderId}|${paymentMethod}|${targetProduct.skuCode}|${stationForOrder}|${targetProduct.price}VND`,
            product: { ...targetProduct, kioskCode: stationForOrder, kioskLocation: currentKioskUnit.locationName },
            price: targetProduct.price,
            expiresAt,
            status: "PENDING",
            commandUuid: cmdUuid,
            idempotencyKey,
            hmacSignature,
        };

        setOrder(newOrder);
        setRemainingSeconds(120);
        setStep("QR_WAITING");
        setIsCreatingOrder(false);
        upsertKioskOrderToSharedStorage(newOrder, "PENDING");

        countdownRef.current = setInterval(() => {
            const secondsLeft = Math.max(0, Math.ceil((newOrder.expiresAt - Date.now()) / 1000));
            setRemainingSeconds(secondsLeft);
            if (secondsLeft <= 0) {
                clearTimers();
                setOrder((current) => (current ? { ...current, status: "EXPIRED" } : current));
                upsertKioskOrderToSharedStorage(newOrder, "EXPIRED", { failureReason: "ORDER_PAYMENT_TIMEOUT_EXPIRED" });
                setStep("FAILED");
                setErrorMessage(
                    lang === "VI"
                        ? `Đơn ${newOrderId} đã hết hạn (120s). Không trừ tiền.`
                        : `Order ${newOrderId} expired (120s). No charge made.`
                );
            }
        }, 1000);
    };

    const handleSimulateWebhookPaid = () => {
        if (!order || step !== "QR_WAITING") return;
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        const paidOrder: OrderSnapshot = { ...order, status: "PAID" };
        setOrder(paidOrder);
        setStep("PAID_GUIDANCE");
        upsertKioskOrderToSharedStorage(paidOrder, "PAID");
    };

    const handleTriggerCalibratedSpray = () => {
        if (!order || step !== "PAID_GUIDANCE") return;
        clearTimers();
        const dispensingOrder: OrderSnapshot = { ...order, status: "DISPENSING" };
        setOrder(dispensingOrder);
        setStep("DISPENSING");

        const t1 = setTimeout(() => {
            const completedOrder: OrderSnapshot = {
                ...dispensingOrder,
                status: "DISPENSED",
                completedAt: new Date().toLocaleTimeString("vi-VN"),
            };
            setOrder(completedOrder);
            upsertKioskOrderToSharedStorage(completedOrder, "DISPENSED", { deductStock: true });
            setStep("SUCCESS");
        }, 1400);
        stepSequenceTimeoutsRef.current.push(t1);
    };

    const handleDemoAnomaly = (anomalyStatus: "FAILED" | "UNCERTAIN") => {
        if (!order || step !== "QR_WAITING") return;
        clearTimers();
        const reason =
            anomalyStatus === "FAILED"
                ? lang === "VI"
                    ? `Cảm biến an toàn tại ${currentKioskUnit.locationName} đã ngắt lệnh phun. Đơn ${order.orderId} đã chuyển OM đối soát hoàn tiền.`
                    : `Safety sensor at ${currentKioskUnit.locationName} blocked dispensing. Order ${order.orderId} logged for OM review.`
                : lang === "VI"
                    ? `Trạm ${currentKioskUnit.locationName} quá hạn phản hồi. Không tự phun lại; đơn ${order.orderId} đang chờ đối soát.`
                    : `Station ${currentKioskUnit.locationName} timed out after ACK. No auto-retry; Order ${order.orderId} held for review.`;

        const updated: OrderSnapshot = { ...order, status: anomalyStatus, failureReason: reason };
        setOrder(updated);
        setErrorMessage(reason);
        upsertKioskOrderToSharedStorage(updated, anomalyStatus, {
            failureReason: anomalyStatus === "FAILED" ? "SAFETY_INTERLOCK_REJECTED" : "MQTT_RESULT_TIMEOUT_UNCERTAIN",
            requiresHumanReview: true,
        });
        setStep(anomalyStatus);
    };

    const handleCancelOrder = () => {
        if (!order || step !== "QR_WAITING") return;
        clearTimers();
        upsertKioskOrderToSharedStorage(order, "CANCELLED", { failureReason: "CUSTOMER_CANCELLED_AT_KIOSK" });
        setStep("SELECT");
    };

    if (isMenuLoading) {
        return (
            <main className={`${styles.unavailablePage} notranslate`} translate="no">
                <div className={styles.unavailableContent} style={{ borderColor: "rgba(212,175,55,0.45)" }}>
                    <h2 style={{ margin: "0 0 0.5rem 0" }}>
                        {lang === "VI" ? "Đang kết nối trạm Kiosk..." : "Connecting to Kiosk..."}
                    </h2>
                </div>
            </main>
        );
    }

    if (!isKioskOnlineAndActive) {
        return (
            <main className={`${styles.unavailablePage} notranslate`} translate="no">
                <div className={styles.unavailableContent}>
                    <AlertTriangle size={32} color="#F87171" style={{ margin: "0 auto 0.75rem auto" }} />
                    <h1 style={{ fontSize: "1.45rem", margin: "0 0 0.5rem 0" }}>
                        {currentKioskUnit.operatingStatus === "MAINTENANCE"
                            ? lang === "VI"
                                ? "Trạm đang bảo trì"
                                : "Station Under Maintenance"
                            : lang === "VI"
                                ? "Trạm mất kết nối"
                                : "Station Offline"}
                    </h1>
                    <p className={styles.unavailableMessage}>
                        {lang === "VI"
                            ? `Trạm ${currentKioskUnit.locationName} (${currentKioskUnit.code}) tạm ngưng nhận đơn.`
                            : `Station ${currentKioskUnit.locationName} (${currentKioskUnit.code}) is currently unavailable.`}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        <button type="button" onClick={handleForceReconnectCurrentKiosk} className={styles.primaryDemoButton}>
                            {lang === "VI" ? "Kích hoạt lại trạm (Demo)" : "Restore Station (Demo)"}
                        </button>
                        <div style={{ display: "flex", gap: "0.6rem" }}>
                            <button type="button" onClick={() => handleSwitchActiveKioskUnit("demo-device")} className={styles.secondaryButton} style={{ flex: 1 }}>
                                Diamond Plaza
                            </button>
                            <button type="button" onClick={() => router.push("/")} className={styles.secondaryButton} style={{ flex: 1 }}>
                                {lang === "VI" ? "Về trang chủ" : "Home"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (step !== "SELECT") {
        return (
            <main className={`${styles.kioskPage} notranslate`} translate="no">
                <header className={styles.kioskHeader}>
                    <div className={styles.headerInner}>
                        <div className={styles.brandGroup} onClick={resetToSelect}>
                            <h1 className={styles.brandName}>ScentStation</h1>
                        </div>
                        <div className={styles.langSwitcher}>
                            <button type="button" onClick={() => handleSwitchLanguage("VI")} className={`${styles.langBtn} ${lang === "VI" ? styles.langBtnActive : ""}`}>VI</button>
                            <button type="button" onClick={() => handleSwitchLanguage("EN")} className={`${styles.langBtn} ${lang === "EN" ? styles.langBtnActive : ""}`}>EN</button>
                        </div>
                    </div>
                </header>

                <section className={styles.flowSection}>
                    <div className={styles.flowCard}>
                        <div className={styles.kioskStateStepper}>
                            <div className={`${styles.kioskStepItem} ${step === "QR_WAITING" ? styles.kioskStepActive : step === "PAID_GUIDANCE" || step === "DISPENSING" || step === "SUCCESS" ? styles.kioskStepDone : styles.kioskStepError}`}>
                                <span>01</span>
                                <span>{lang === "VI" ? "QUÉT QR" : "SCAN QR"}</span>
                            </div>
                            <div className={`${styles.kioskStepItem} ${step === "PAID_GUIDANCE" ? styles.kioskStepActive : step === "DISPENSING" || step === "SUCCESS" || step === "FAILED" || step === "UNCERTAIN" ? styles.kioskStepDone : ""}`}>
                                <span>02</span>
                                <span>{lang === "VI" ? "ĐẶT CỔ TAY" : "POSITION"}</span>
                            </div>
                            <div className={`${styles.kioskStepItem} ${step === "DISPENSING" ? styles.kioskStepActive : step === "SUCCESS" ? styles.kioskStepDone : step === "FAILED" || step === "UNCERTAIN" ? styles.kioskStepError : ""}`}>
                                <span>03</span>
                                <span>{lang === "VI" ? "ĐANG PHUN" : "SPRAYING"}</span>
                            </div>
                            <div className={`${styles.kioskStepItem} ${step === "SUCCESS" ? styles.kioskStepDone : step === "FAILED" || step === "UNCERTAIN" ? styles.kioskStepError : ""}`}>
                                <span>04</span>
                                <span>{lang === "VI" ? "HOÀN TẤT" : "DONE"}</span>
                            </div>
                        </div>

                        {step === "QR_WAITING" && order && (
                            <>
                                <h2 className={styles.flowTitle}>{t.scanQrTitle} ({order.orderId})</h2>

                                <div className={styles.kioskCheckoutProductSummary}>
                                    <div className={styles.kioskCheckoutThumb}>
                                        {order.product.imageUrl && <img src={order.product.imageUrl} alt={order.product.productName} />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span className={styles.paymentBrandName}>{order.product.brand}</span>
                                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFF" }}>{order.product.productName}</div>
                                        <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                                            {currentKioskUnit.locationName} • <strong style={{ color: "#34D399" }}>{formatSlotLabel(order.product.physicalSlotLabel, lang)}</strong>
                                        </div>
                                    </div>
                                    <strong className={styles.paymentPriceValue}>{formatPrice(order.price)}</strong>
                                </div>

                                <div className={styles.kioskGatewayGrid}>
                                    {(["VIETQR", "MOMO", "VNPAY", "ZALOPAY"] as const).map((pm) => (
                                        <button
                                            key={pm}
                                            type="button"
                                            onClick={() => {
                                                setPaymentMethod(pm);
                                                upsertKioskOrderToSharedStorage(order, "PENDING", { overridePaymentMethod: pm });
                                            }}
                                            className={`${styles.kioskGatewayBtn} ${paymentMethod === pm ? styles.kioskGatewayBtnActive : ""}`}
                                        >
                                            {pm}
                                        </button>
                                    ))}
                                </div>

                                <div className={styles.kioskQrShowcase}>
                                    <div className={styles.kioskQrFrame}>
                                        <span className={styles.qrProviderHeader}>{paymentMethod}</span>
                                        <QRCode value={`${order.qrContent}|METHOD:${paymentMethod}`} size={130} bgColor="#FFFFFF" fgColor="#090A0F" level="M" />
                                    </div>

                                    <div className={styles.kioskInvoiceMeta}>
                                        <div className={styles.kioskInvoiceRow}>
                                            <span style={{ color: "#94A3B8" }}>{lang === "VI" ? "Trạm:" : "Station:"}</span>
                                            <strong>{currentKioskUnit.code}</strong>
                                        </div>
                                        <div className={styles.kioskInvoiceRow}>
                                            <span style={{ color: "#94A3B8" }}>{lang === "VI" ? "Định lượng:" : "Dosage:"}</span>
                                            <strong style={{ color: "#F5E6AD" }}>0.12 ml</strong>
                                        </div>
                                        <div style={{ marginTop: "0.2rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                                                <span style={{ color: "#FBBF24" }}>{t.timeRemaining}</span>
                                                <strong style={{ color: remainingSeconds <= 30 ? "#F87171" : "#F5E6AD" }}>{formatCountdown(remainingSeconds)}</strong>
                                            </div>
                                            <div className={styles.kioskCountdownTrack}>
                                                <div className={styles.kioskCountdownFill} style={{ width: `${Math.round((remainingSeconds / 120) * 100)}%`, background: remainingSeconds <= 30 ? "#F87171" : "#34D399" }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "0.6rem" }}>
                                    <button type="button" className={styles.primaryDemoButton} style={{ flex: 1.6, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }} onClick={handleSimulateWebhookPaid}>
                                        <CheckCircle2 size={16} />
                                        <span>{t.simulatePaid}</span>
                                    </button>
                                    <button type="button" className={styles.secondaryButton} style={{ flex: 0.7, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }} onClick={handleCancelOrder}>
                                        <Ban size={14} />
                                        <span>{t.cancelOrder}</span>
                                    </button>
                                </div>

                                <div style={{ marginTop: "0.8rem", textAlign: "right" }}>
                                    <button type="button" onClick={() => setShowDiagnosticsDrawer(!showDiagnosticsDrawer)} className={styles.diagnosticToggleBtn}>
                                        <SlidersHorizontal size={12} />
                                        <span>{lang === "VI" ? "Mô phỏng lỗi phần cứng" : "Test Fault Scenarios"}</span>
                                    </button>
                                </div>

                                {showDiagnosticsDrawer && (
                                    <div className={styles.kioskSimulatorDrawer}>
                                        <div className={styles.kioskSimulatorHeader}>
                                            {lang === "VI" ? "Kiểm thử ngoại lệ (không tự phun lại)" : "Fault Simulation (No Auto-Retry)"}
                                        </div>
                                        <div className={styles.demoButtonGroup}>
                                            <button type="button" className={styles.subDemoButton} style={{ borderColor: "rgba(248,113,113,0.4)", color: "#FCA5A5" }} onClick={() => handleDemoAnomaly("FAILED")}>
                                                {t.simulateFail}
                                            </button>
                                            <button type="button" className={styles.subDemoButton} style={{ borderColor: "rgba(192,132,252,0.4)", color: "#E9D5FF" }} onClick={() => handleDemoAnomaly("UNCERTAIN")}>
                                                {t.simulateUncertain}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {step === "PAID_GUIDANCE" && order && (
                            <>
                                <div className={styles.successBadgeGlow}>{t.paymentConfirmed}</div>
                                <h2 className={styles.flowTitle}>{t.getReadyTitle}</h2>

                                <div className={styles.interlockBar}>
                                    <div className={styles.interlockChip}>{lang === "VI" ? "BUỒNG SẴN SÀNG" : "CHAMBER READY"}</div>
                                    <div className={styles.interlockChip}>{currentKioskUnit.chamberTemp}</div>
                                    <div className={styles.interlockChip}>{lang === "VI" ? "CHUẨN 0.12ML" : "0.12ML READY"}</div>
                                    <div className={styles.interlockChip}>{lang === "VI" ? "ĐÃ XÁC THỰC" : "VERIFIED"}</div>
                                </div>

                                <div className={styles.nozzleGuideBox}>
                                    <p className={styles.guidanceText}>{t.guidanceMain}</p>
                                    <p className={styles.guidanceSub}>{t.guidanceSub}</p>
                                </div>

                                <button type="button" onClick={handleTriggerCalibratedSpray} className={styles.primaryDemoButton} style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}>
                                    <Sparkles size={16} />
                                    <span>{t.readySprayNowBtn}</span>
                                </button>
                            </>
                        )}

                        {step === "DISPENSING" && order && (
                            <>
                                <Droplets size={34} color="#D4AF37" style={{ margin: "0 auto 0.75rem auto" }} />
                                <h2 className={styles.flowTitle}>{t.dispensingTitle}</h2>
                                <div className={styles.dispensingProductBadge}>
                                    <span className={styles.badgeSubText}>{t.preciseSprayProgress}</span>
                                    <p className={styles.badgeProductName}>
                                        {order.product.productName} • {formatSlotLabel(order.product.physicalSlotLabel, lang)}
                                    </p>
                                    <div className={styles.dispensingProgressBar}>
                                        <div className={styles.dispensingProgressFill} />
                                    </div>
                                </div>
                                <p className={styles.flowHint}>{t.dispensingHint}</p>
                            </>
                        )}

                        {step === "SUCCESS" && order && (
                            <>
                                <CheckCircle2 size={40} color="#34D399" style={{ margin: "0 auto 0.75rem auto" }} />
                                <h2 className={styles.flowTitle}>{t.completeTitle}</h2>
                                <div className={styles.receiptCard}>
                                    <div className={styles.receiptRow}>
                                        <span>{lang === "VI" ? "Mã đơn" : "Order ID"}</span>
                                        <strong>{order.orderId}</strong>
                                    </div>
                                    <div className={styles.receiptRow}>
                                        <span>{lang === "VI" ? "Sản phẩm" : "Fragrance"}</span>
                                        <strong>{order.product.productName}</strong>
                                    </div>
                                    <div className={styles.receiptRow}>
                                        <span>{lang === "VI" ? "Thanh toán" : "Payment"}</span>
                                        <strong>{paymentMethod} • {formatPrice(order.price)}</strong>
                                    </div>
                                    <div className={styles.receiptRow}>
                                        <span>{lang === "VI" ? "Còn lại tại khoang" : "Remaining"}</span>
                                        <strong style={{ color: "#34D399" }}>{Number(Math.max(0, order.product.remainingMl - 0.12).toFixed(2))} ml</strong>
                                    </div>
                                </div>
                                <p className={styles.flowHint}>
                                    {t.thankYouText} ({t.autoReturnIn} {autoReturnSeconds}s)
                                </p>
                                <button type="button" className={styles.primaryDemoButton} style={{ width: "100%" }} onClick={resetToSelect}>
                                    {t.doneBtn}
                                </button>
                            </>
                        )}

                        {(step === "FAILED" || step === "UNCERTAIN") && (
                            <>
                                {step === "FAILED" ? (
                                    <AlertOctagon size={38} color="#F87171" style={{ margin: "0 auto 0.75rem auto" }} />
                                ) : (
                                    <HelpCircle size={38} color="#C084FC" style={{ margin: "0 auto 0.75rem auto" }} />
                                )}
                                <h2 className={styles.flowTitle}>{step === "FAILED" ? t.failedTitle : t.uncertainTitle}</h2>
                                <p className={styles.flowHint}>{errorMessage}</p>
                                <div className={styles.flowActions}>
                                    {step === "FAILED" && order?.product && (
                                        <button type="button" className={styles.primaryDemoButton} onClick={() => void handleConfirmSelection(order.product)}>
                                            {t.retryQrBtn}
                                        </button>
                                    )}
                                    <button type="button" className={styles.secondaryButton} onClick={resetToSelect}>
                                        {t.backToFragrances}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </main>
        );
    }

    const parsedNotes = detailProduct ? parseNotesFallback(detailProduct.notes) : null;

    return (
        <main className={`${styles.kioskPage} notranslate`} translate="no">
            <header className={styles.kioskHeader}>
                <div className={styles.headerInner}>
                    <div className={styles.brandGroup} onClick={() => { setDetailProduct(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                        <h1 className={styles.brandName}>ScentStation</h1>
                    </div>

                    <div className={styles.headerRightGroup}>
                        <button type="button" onClick={() => router.push("/")} className={styles.headerGhostBtn}>
                            <ArrowLeft size={14} color="#D4AF37" />
                            <span>{lang === "VI" ? "Trang chủ" : "Home"}</span>
                        </button>

                        <div className={styles.kioskSwitcherWrap} ref={unitMenuRef}>
                            <button type="button" onClick={() => setIsUnitMenuOpen((prev) => !prev)} className={styles.kioskSwitcherTrigger}>
                                <Cpu size={14} color="#D4AF37" />
                                <span>{currentKioskUnit.code} — {currentKioskUnit.locationName}</span>
                                <ChevronDown size={14} color="#D4AF37" style={{ transform: isUnitMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                            </button>

                            {isUnitMenuOpen && (
                                <div className={styles.kioskSwitcherMenu}>
                                    {kioskFleet.map((k) => {
                                        const isSelected = k.code === currentKioskUnit.code;
                                        return (
                                            <button key={k.code} type="button" onClick={() => handleSwitchActiveKioskUnit(k.code)} className={`${styles.kioskSwitcherOption} ${isSelected ? styles.kioskSwitcherOptionActive : ""}`}>
                                                <div>
                                                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isSelected ? "#F5E6AD" : "#FFF" }}>
                                                        {k.code} — {k.locationName}
                                                    </div>
                                                    <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                                                        {lang === "EN" && k.addressEn ? k.addressEn : k.address}
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: k.status === "ONLINE" ? "#34D399" : k.status === "MAINTENANCE" ? "#FBBF24" : "#F87171" }}>
                                                    {formatKioskStatus(k.status, lang)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className={styles.langSwitcher}>
                            <button type="button" onClick={() => handleSwitchLanguage("VI")} className={`${styles.langBtn} ${lang === "VI" ? styles.langBtnActive : ""}`}>VI</button>
                            <button type="button" onClick={() => handleSwitchLanguage("EN")} className={`${styles.langBtn} ${lang === "EN" ? styles.langBtnActive : ""}`}>EN</button>
                        </div>

                        <div className={styles.statusContainer}>
                            <button type="button" className={styles.machineStatus} onClick={() => setIsStatusOpen((prev) => !prev)}>
                                <span className={styles.statusDot} />
                                <span>{lang === "VI" ? "Sẵn sàng" : "Ready"} • {currentKioskUnit.chamberTemp}</span>
                            </button>

                            {isStatusOpen && (
                                <div className={styles.statusPanel}>
                                    <div className={styles.statusPanelHeader}>
                                        <span className={styles.statusPanelEyebrow}>{lang === "VI" ? "Thông tin trạm" : "Station Info"}</span>
                                        <button type="button" className={styles.statusCloseButton} onClick={() => setIsStatusOpen(false)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className={styles.statusPanelBody}>
                                        <div className={styles.statusDetailRow}>
                                            <span>{lang === "VI" ? "Mã trạm" : "Station ID"}</span>
                                            <strong>{currentKioskUnit.code}</strong>
                                        </div>
                                        <div className={styles.statusDetailRow}>
                                            <span>{lang === "VI" ? "Vị trí" : "Location"}</span>
                                            <strong>{currentKioskUnit.locationName}</strong>
                                        </div>
                                        <div className={styles.statusDetailRow}>
                                            <span>{lang === "VI" ? "Nhiệt độ" : "Temp"}</span>
                                            <strong style={{ color: "#34D399" }}>{currentKioskUnit.chamberTemp}</strong>
                                        </div>
                                        <div className={styles.statusDetailRow}>
                                            <span>{lang === "VI" ? "Định lượng" : "Dosage"}</span>
                                            <strong style={{ color: "#F5E6AD" }}>0.12 ml</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {detailProduct ? (
                <section className={styles.detailSection}>
                    <button type="button" className={styles.backButton} onClick={() => { setDetailProduct(null); setErrorMessage(null); }}>
                        <ArrowLeft size={15} />
                        <span>{t.backToCatalogue}</span>
                    </button>
                    <div className={styles.detailLayout}>
                        <div className={styles.detailImagePanel}>
                            {detailProduct.imageUrl ? (
                                <img src={detailProduct.imageUrl} alt={detailProduct.productName} className={styles.detailImage} />
                            ) : (
                                <div className={styles.imagePlaceholder}>{detailProduct.productName}</div>
                            )}
                        </div>
                        <div className={styles.detailContent}>
                            <p className={styles.detailBrand}>{detailProduct.brand} • {currentKioskUnit.locationName}</p>
                            <h2 className={styles.detailTitle}>{detailProduct.productName}</h2>
                            {detailProduct.description && <p className={styles.detailDescription}>{detailProduct.description}</p>}

                            <div className={styles.detailFacts}>
                                <div><span>{t.family}</span><strong>{detailProduct.fragranceFamily}</strong></div>
                                <div><span>{t.concentration}</span><strong>{detailProduct.concentration}</strong></div>
                                <div><span>{t.audience}</span><strong>{formatAudienceLabel(detailProduct.audience, lang)}</strong></div>
                                <div>
                                    <span>{t.machineSlot}</span>
                                    <strong style={{ color: detailProduct.available ? "#34D399" : "#F87171" }}>
                                        {formatSlotLabel(detailProduct.physicalSlotLabel, lang)} ({detailProduct.remainingMl}ml / {detailProduct.capacityMl}ml)
                                    </strong>
                                </div>
                            </div>

                            <div className={styles.scentProfile}>
                                <div><span>{t.topNotes}</span><strong>{parsedNotes?.top.join(", ")}</strong></div>
                                <div><span>{t.heartNotes}</span><strong>{parsedNotes?.heart.join(", ")}</strong></div>
                                <div><span>{t.baseNotes}</span><strong>{parsedNotes?.base.join(", ")}</strong></div>
                                <div className={styles.sourcePriceRow}>
                                    <span>{t.decantRef}</span>
                                    <strong>{formatPrice(detailProduct.retailPrice10ml || detailProduct.price * 30)}</strong>
                                </div>
                            </div>

                            <div className={styles.detailPriceBlock}>
                                <div><span>{t.experiencePrice}</span><strong>{formatPrice(detailProduct.price)}</strong></div>
                                <span className={styles.slotNumber}>{t.onePreciseSpray}</span>
                            </div>

                            <button type="button" onClick={() => void handleConfirmSelection(detailProduct)} disabled={isCreatingOrder || !detailProduct.available} className={styles.detailConfirmButton}>
                                {!detailProduct.available
                                    ? getAvailabilityBadgeText(detailProduct.availabilityReason)
                                    : isCreatingOrder
                                        ? t.initializingOrder
                                        : t.experienceNow}
                            </button>
                            <p className={styles.detailDisclaimer}>{t.singleSprayNotice}</p>
                        </div>
                    </div>
                </section>
            ) : (
                <>
                    <section className={styles.heroSection}>
                        <div className={styles.heroTopGrid}>
                            <div>
                                <h1 className={styles.heroTitle}>{t.heroTitle}</h1>
                                <p className={styles.heroDescription}>{t.heroDesc}</p>
                                <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
                                    <button type="button" className={styles.primaryDemoButton} onClick={() => catalogueRef.current?.scrollIntoView({ behavior: "smooth" })}>
                                        {t.exploreBtn}
                                    </button>
                                    <button type="button" className={styles.headerGhostBtn} onClick={() => setShowFull34Catalog((prev) => !prev)}>
                                        {showFull34Catalog
                                            ? lang === "VI" ? "Chỉ hiện 4 khoang chính" : "Show 4 Primary Slots"
                                            : lang === "VI" ? "Hiện toàn bộ danh mục" : "Show Full Catalog"}
                                    </button>
                                </div>
                            </div>

                            <aside className={styles.usageInstructionCard}>
                                <div className={styles.usageHeader}>
                                    <span className={styles.usageEyebrow}>{t.usageTitle}</span>
                                    <span className={styles.usageRuleBadge}>{t.usageRule}</span>
                                </div>
                                <div className={styles.usageStepsList}>
                                    <div className={styles.usageStepItem}>
                                        <span className={styles.usageStepNum}>1</span>
                                        <div className={styles.usageStepText}><strong>{t.step1Title}</strong><p>{t.step1Desc}</p></div>
                                    </div>
                                    <div className={styles.usageStepItem}>
                                        <span className={styles.usageStepNum}>2</span>
                                        <div className={styles.usageStepText}><strong>{t.step2Title}</strong><p>{t.step2Desc}</p></div>
                                    </div>
                                    <div className={styles.usageStepItem}>
                                        <span className={styles.usageStepNum}>3</span>
                                        <div className={styles.usageStepText}><strong>{t.step3Title}</strong><p>{t.step3Desc}</p></div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        {/* GIỮ NGUYÊN 3 VIDEO CAROUSEL */}
                        <div className={styles.carouselContainer}>
                            <div className={styles.carouselTrack}>
                                {(() => {
                                    const videoList = [
                                        { id: 0, src: "/videos/guerlain-vetiver.mp4", fallbackSrc: "/video_1.mp4", title: "VÉTIVER FAUVE", subtitle: "L’ART & LA MATIÈRE" },
                                        { id: 1, src: "/videos/guerlain-peche.mp4", fallbackSrc: "/video_1.mp4", title: "PÊCHE MIRAGE", subtitle: "SCENTSTATION" },
                                        { id: 2, src: "/videos/guerlain-heritage.mp4", fallbackSrc: "/video_1.mp4", title: "MAISON HERITAGE", subtitle: "SCENTSTATION" },
                                    ];
                                    const reordered = [
                                        videoList[(activeVideoIndex - 1 + videoList.length) % videoList.length],
                                        videoList[activeVideoIndex],
                                        videoList[(activeVideoIndex + 1) % videoList.length],
                                    ];
                                    return reordered.map((item, idx) => {
                                        const isActive = idx === 1;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`${styles.carouselItem} ${isActive ? styles.activeItem : styles.inactiveItem}`}
                                                onClick={() => setActiveVideoIndex(videoList.findIndex((v) => v.id === item.id))}
                                            >
                                                <video autoPlay loop muted playsInline poster="/login-perfume.png" className={styles.carouselVideo}>
                                                    <source src={item.src} type="video/mp4" />
                                                    <source src={item.fallbackSrc} type="video/mp4" />
                                                </video>
                                                <div className={styles.carouselOverlay} />
                                                {isActive && (
                                                    <div className={styles.carouselCaption}>
                                                        <span className={styles.captionSubtitle}>{item.subtitle}</span>
                                                        <h3 className={styles.captionTitle}>{item.title}</h3>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                            <div className={styles.carouselDots}>
                                {[0, 1, 2].map((index) => (
                                    <button key={index} type="button" aria-label={`Video ${index + 1}`} className={`${styles.dot} ${index === activeVideoIndex ? styles.activeDot : ""}`} onClick={() => setActiveVideoIndex(index)} />
                                ))}
                            </div>
                        </div>

                        <div className={styles.deviceInfoRow}>
                            <div className={styles.deviceInfo}>
                                <span>{lang === "VI" ? "Trạm:" : "Station:"}</span>
                                <strong>{currentKioskUnit.code} — {currentKioskUnit.locationName}</strong>
                            </div>
                            <div className={styles.deviceInfo}>
                                <span>{lang === "VI" ? "Nhiệt độ:" : "Temp:"}</span>
                                <strong>{currentKioskUnit.chamberTemp}</strong>
                                <span>•</span>
                                <strong style={{ color: "#34D399" }}>{formatKioskStatus(currentKioskUnit.status, lang)}</strong>
                            </div>
                        </div>
                    </section>

                    <section ref={catalogueRef} className={styles.collectionSection}>
                        <div className={styles.sectionHeading}>
                            <h2>{t.availableFragrances} — {currentKioskUnit.locationName}</h2>
                            <span className={styles.productCount}>
                                {filteredCatalogue.length} / {availableProducts.length} {t.itemsReady}
                            </span>
                        </div>

                        <div className={styles.catalogueControlsBar}>
                            <div className={styles.categoryPills} role="tablist">
                                {(["ALL", "WOMEN", "MEN", "UNISEX", "NICHE", "BEST_SELLER"] as KioskCategory[]).map((cat) => (
                                    <button key={cat} type="button" role="tab" aria-selected={activeCategory === cat} onClick={() => setActiveCategory(cat)} className={`${styles.categoryPill} ${activeCategory === cat ? styles.categoryPillActive : ""}`}>
                                        <span>{t.categories[cat]}</span>
                                        <span style={{ opacity: 0.75 }}>({categoryCounts[cat]})</span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.kioskSearchBox}>
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} className={styles.kioskSearchInput} />
                                {searchQuery && (
                                    <button type="button" onClick={() => setSearchQuery("")} className={styles.kioskSearchClear}>
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {filteredCatalogue.length > 0 ? (
                            <div className={styles.productGrid}>
                                {filteredCatalogue.map((product) => {
                                    const isSelected = cartProduct && isExactFragranceMatch(cartProduct.productName, product.productName);
                                    const pct = Math.round((product.remainingMl / product.capacityMl) * 100);
                                    const isSelectable = product.available && product.remainingMl >= 0.12 && (!product.productStatus || product.productStatus === "ACTIVE");
                                    const isLow = product.remainingMl <= product.lowStockThresholdMl;

                                    return (
                                        <article
                                            key={`${currentKioskUnit.code}-${product.slotNumber}-${product.productName}`}
                                            onClick={() => handleOpenProductDetail(product)}
                                            className={`${styles.productCard} ${isSelected ? styles.productCardSelected : !isSelectable ? styles.productCardUnavailable : ""}`}
                                        >
                                            <div>
                                                <div className={styles.productTopRow}>
                                                    <div className={styles.productThumb}>
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt={product.productName} />
                                                        ) : (
                                                            <div className={styles.imagePlaceholder}>{product.brand}</div>
                                                        )}
                                                    </div>

                                                    <div className={styles.cardHeaderInfo}>
                                                        <div className={styles.cardTopMeta}>
                                                            <span className={styles.cardBrandLabel}>{product.brand}</span>
                                                            <span className={`${styles.slotNumber} ${!isSelectable ? styles.slotBadgeLocked : product.isPrimaryChamberSlot ? styles.slotBadgeLocal : ""}`}>
                                                                {!isSelectable ? getAvailabilityBadgeText(product.availabilityReason) : formatSlotLabel(product.physicalSlotLabel, lang)}
                                                            </span>
                                                        </div>
                                                        <h3 className={styles.cardTitle}>{product.productName}</h3>
                                                        <div className={styles.cardSkuSub}>{formatAudienceLabel(product.audience, lang)} • {product.skuCode}</div>
                                                    </div>
                                                </div>

                                                <div className={styles.volumeMetaRow}>
                                                    <span style={{ color: "#94A3B8" }}>{product.fragranceFamily}</span>
                                                    <strong style={{ color: !isSelectable ? "#F87171" : isLow ? "#FBBF24" : "#34D399" }}>
                                                        {product.remainingMl}ml / {product.capacityMl}ml ({pct}%)
                                                    </strong>
                                                </div>

                                                <div className={styles.volumeTrack}>
                                                    <div className={styles.volumeFill} style={{ width: `${pct}%`, background: !isSelectable ? "#F87171" : isLow ? "#FBBF24" : "#34D399" }} />
                                                </div>
                                            </div>

                                            <div className={styles.productFooter} onClick={(e) => e.stopPropagation()}>
                                                <div>
                                                    <span className={styles.priceLabel}>{t.pricePerSpray}</span>
                                                    <p className={styles.price}>{formatPrice(product.price)}</p>
                                                </div>

                                                <div className={styles.cardButtonRow}>
                                                    <button type="button" className={styles.selectButton} onClick={() => handleOpenProductDetail(product)}>
                                                        {t.viewDetails}
                                                    </button>
                                                    <button type="button" disabled={!isSelectable} className={styles.quickSelectBtn} onClick={(e) => handleSelectForCart(product, e)}>
                                                        {!isSelectable ? getAvailabilityBadgeText(product.availabilityReason) : isSelected ? t.selectedBtn : t.selectBtn}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h3>{t.noResultsTitle}</h3>
                                <p style={{ marginBottom: "16px", color: "#94A3B8" }}>{t.noResultsDesc}</p>
                                <button type="button" className={styles.backButton} style={{ marginBottom: 0 }} onClick={() => { setActiveCategory("ALL"); setSearchQuery(""); }}>
                                    <RefreshCw size={14} />
                                    <span>{t.clearSearch}</span>
                                </button>
                            </div>
                        )}
                    </section>
                </>
            )}

            {cartProduct && !detailProduct && (
                <div className={styles.selectedDock}>
                    <div className={styles.selectedDockInfo}>
                        <span className={styles.selectedDockCount}>{t.selectedProductsTitle}</span>
                        <div>
                            <div style={{ fontSize: "0.76rem", color: "#D4AF37", fontWeight: 700 }}>
                                {cartProduct.brand} • {formatSlotLabel(cartProduct.physicalSlotLabel, lang)} ({cartProduct.remainingMl}ml)
                            </div>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF" }}>{cartProduct.productName}</div>
                        </div>
                    </div>

                    <div className={styles.selectedDockActions}>
                        <div style={{ textAlign: "right", marginRight: "6px" }}>
                            <span style={{ display: "block", fontSize: "0.7rem", color: "#94A3B8" }}>{t.totalAmount}</span>
                            <strong style={{ fontSize: "1.12rem", color: "#F5E6AD" }}>{formatPrice(cartProduct.price)}</strong>
                        </div>
                        <button type="button" className={styles.secondaryButton} onClick={() => setDetailProduct(cartProduct)}>
                            {t.reviewBtn}
                        </button>
                        <button type="button" className={styles.dockProceedBtn} disabled={isCreatingOrder} onClick={() => void handleConfirmSelection(cartProduct)}>
                            <QrCode size={15} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
                            <span>{isCreatingOrder ? t.initializingOrder : t.payByQrBtn}</span>
                        </button>
                    </div>
                </div>
            )}

            <footer className={styles.footer}>
                <div className={styles.footerBottom}>
                    <strong>SCENTSTATION</strong>
                    <span>
                        {currentKioskUnit.code} — {currentKioskUnit.locationName} • {currentKioskUnit.chamberTemp}
                    </span>
                </div>
            </footer>
        </main>
    );
}