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
    topNotes?: string[] | null;
    heartNotes?: string[] | null;
    baseNotes?: string[] | null;
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
        id: "demo-device", code: "demo-device", serialNumber: "SN-2026-8801", deviceIdentity: "DEV-SGN-8801", brand: "Creed", locationName: "Diamond Plaza Luxury Atrium", address: "34 Le Duan, District 1, Ho Chi Minh City",
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
        id: "KIOSK-SGN-01", code: "KIOSK-SGN-01", serialNumber: "SN-2026-8802", deviceIdentity: "DEV-SGN-8802", brand: "Chanel", locationName: "Saigon Centre Takashimaya Flagship", address: "65 Le Loi, District 1, Ho Chi Minh City",
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
        id: "KIOSK-SGN-02", code: "KIOSK-SGN-02", serialNumber: "SN-2026-8803", deviceIdentity: "DEV-SGN-8803", brand: "Yves Saint Laurent", locationName: "Vincom Center Dong Khoi", address: "72 Le Thanh Ton, District 1, Ho Chi Minh City",
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
        id: "KIOSK-SGN-03", code: "KIOSK-SGN-03", serialNumber: "SN-2026-8808", deviceIdentity: "DEV-SGN-8808", brand: "Montblanc", locationName: "Crescent Mall Luxury Wing", address: "101 Ton Dat Tien, District 7, Ho Chi Minh City",
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
        id: "KIOSK-HN-01", code: "KIOSK-HN-01", serialNumber: "SN-2026-8804", deviceIdentity: "DEV-HAN-8804", brand: "Dior", locationName: "Lotte Center West Lake Lounge", address: "272 Vo Chi Cong, Tay Ho, Hanoi",
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
        id: "KIOSK-HN-02", code: "KIOSK-HN-02", serialNumber: "SN-2026-8805", deviceIdentity: "DEV-HAN-8805", brand: "Maison Margiela", locationName: "Trang Tien Plaza Luxury Wing", address: "24 Hai Ba Trung, Hoan Kiem, Hanoi",
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
        id: "KIOSK-DAD-01", code: "KIOSK-DAD-01", serialNumber: "SN-2026-8806", deviceIdentity: "DEV-DAD-8806", brand: "Versace", locationName: "IndoChina Riverside Mall Lobby", address: "74 Bach Dang, Hai Chau, Da Nang",
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
        id: "KIOSK-004", code: "KIOSK-004", serialNumber: "SN-2026-8807", deviceIdentity: "DEV-SGN-8807", brand: "Tom Ford", locationName: "Aeon Mall Tan Phu Celadon", address: "30 Bo Bao Tan Thang, Tan Phu, HCMC",
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

const computeKioskRegionalSortScore = (
    kioskCode: string,
    slotNumber: number,
    isPrimaryChamberSlot: boolean
): number => {
    if (isPrimaryChamberSlot) {
        return -100 + slotNumber;
    }
    return slotNumber;
};

const TRANSLATIONS = {
    EN: {
        tagline: "INTERACTIVE FRAGRANCE SAMPLING BOUTIQUE",
        eyebrow: "HAUTE PARFUMERIE ATELIER",
        heroTitle1: "Discover Your",
        heroTitle2: "Signature Scent.",
        heroDesc:
            "Experience iconic creations from the world's finest fragrance houses. Select your preferred scent, scan to pay seamlessly via QR code, and enjoy an instant calibrated mist directly from this station.",
        usageTitle: "HOW TO SAMPLE AT THIS STATION",
        usageRule: "0.12 ML CALIBRATED MIST",
        step1Title: "1. Browse & Select Your Scent",
        step1Desc: "Explore fragrance notes by category or maison, then tap Select on your desired creation.",
        step2Title: "2. Scan Dynamic QR Code",
        step2Desc: "Complete instant cashless payment using any VietQR banking app, MoMo, or VNPay.",
        step3Title: "3. Position Wrist or Scent Strip",
        step3Desc: "Place your wrist or test strip at the illuminated chamber to receive your calibrated spray.",
        activeKioskUnit: "ACTIVE BOUTIQUE STATION",
        catalogueEyebrow: "STATION FRAGRANCE COLLECTION",
        availableFragrances: "Curated Fragrances",
        itemsReady: "active scents at this station",
        searchPlaceholder: "Search by fragrance name, maison (Chanel, Dior, Creed) or scent notes...",
        clearSearch: "Reset All Filters",
        noResultsTitle: "No Matching Fragrances Found",
        noResultsDesc: "No fragrances match your selected category or search keyword.",
        pricePerSpray: "1 CALIBRATED SPRAY (0.12ML)",
        viewDetails: "Notes",
        selectBtn: "Select",
        selectedBtn: "Selected",
        backToCatalogue: "Back to Station Collection",
        fragranceSpec: "OLFACTORY COMPOSITION",
        family: "FRAGRANCE FAMILY",
        concentration: "CONCENTRATION",
        audience: "CLASSIFICATION",
        machineSlot: "CHAMBER POSITION",
        topNotes: "TOP NOTES",
        heartNotes: "HEART NOTES",
        baseNotes: "BASE NOTES",
        decantRef: "10ML BOUTIQUE REFERENCE",
        experiencePrice: "SAMPLING PRICE",
        onePreciseSpray: "1 CALIBRATED SPRAY (0.12ML)",
        experienceNow: "Proceed to QR Checkout",
        initializingOrder: "Generating Secure QR Code...",
        singleSprayNotice:
            "Each transaction dispenses 1 calibrated spray (0.12ml) directly from this station.",
        selectedProductsTitle: "SELECTED FRAGRANCE",
        totalAmount: "AMOUNT DUE",
        payByQrBtn: "Pay via QR Code",
        reviewBtn: "View Notes",
        securePayment: "INSTANT QR CHECKOUT",
        scanQrTitle: "Scan QR Code to Pay",
        experienceFee: "TOTAL AMOUNT",
        timeRemaining: "SESSION EXPIRES IN",
        supportedMethods: "SELECT PAYMENT METHOD",
        backendVerifyNotice:
            "The spraying nozzle unlocks automatically as soon as your payment is confirmed.",
        qrScanHint:
            "Scan with any banking app or e-wallet. Your screen will update automatically.",
        simulatePaid: "I Have Scanned & Paid",
        simulateFail: "Simulate Chamber Sensor Fault",
        simulateUncertain: "Simulate Connection Timeout During Spray",
        cancelOrder: "Cancel",
        paymentConfirmed: "PAYMENT VERIFIED",
        getReadyTitle: "Position Your Wrist or Scent Strip",
        curatedFragrance: "READY TO DISPENSE",
        guidanceMain:
            "Please hold your wrist or scent strip 3–5 cm below the illuminated spraying chamber.",
        guidanceSub:
            "All chamber safety sensors verified. Press the button below when your wrist or strip is in position.",
        initiatingSpray: "Preparing calibrated atomizer...",
        readySprayNowBtn: "Dispense Fragrance Now (0.12ml)",
        dispensingTitle: "Dispensing Your Fragrance...",
        preciseSprayProgress: "ATOMIZING CALIBRATED MIST (0.12ML)",
        dispensingHint: "Please hold your wrist or scent strip steady inside the chamber...",
        completeTitle: "Sampling Experience Complete",
        successfullyDispensed: "FRAGRANCE DISPENSED",
        thankYouText:
            "Thank you for experiencing ScentStation. Enjoy your signature fragrance.",
        doneBtn: "Finish & Return to Home Screen",
        autoReturnIn: "Returning to home screen in",
        failedTitle: "Session Interrupted",
        uncertainTitle: "Status Unconfirmed — Logged for Support",
        retryQrBtn: "Generate New QR Code",
        backToFragrances: "Return to Station Home",
        exploreBtn: "Explore Collection",
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
        tagline: "MÀN HÌNH TRẢI NGHIỆM NƯỚC HOA TỰ ĐỘNG",
        eyebrow: "NGHỆ THUẬT CHẾ TÁC HƯƠNG THƠM",
        heroTitle1: "Khám Phá",
        heroTitle2: "Dấu Ấn Hương Thơm.",
        heroDesc:
            "Trải nghiệm những tuyệt tác nước hoa từ các nhà chế tác danh tiếng. Chọn mùi hương yêu thích, quét mã QR thanh toán nhanh chóng và nhận ngay làn hương định lượng chuẩn 0.12ml tại trạm.",
        usageTitle: "HƯỚNG DẪN TRẢI NGHIỆM TẠI TRẠM",
        usageRule: "ĐỊNH LƯỢNG CHUẨN 0.12 ML",
        step1Title: "1. Khám Phá & Chọn Mùi Hương",
        step1Desc: "Chạm chọn danh mục hoặc tìm kiếm thương hiệu yêu thích, sau đó bấm Chọn Mùi.",
        step2Title: "2. Quét Mã QR Thanh Toán",
        step2Desc: "Thanh toán không tiền mặt qua ứng dụng ngân hàng (VietQR), MoMo hoặc VNPay.",
        step3Title: "3. Đặt Cổ Tay Hoặc Giấy Thử",
        step3Desc: "Đưa cổ tay hoặc que thử mùi vào buồng xịt có đèn dẫn hướng để nhận hương thơm.",
        activeKioskUnit: "TRẠM TRẢI NGHIỆM ĐANG MỞ",
        catalogueEyebrow: "BỘ SƯU TẬP TẠI TRẠM",
        availableFragrances: "Bộ Sưu Tập Mùi Hương",
        itemsReady: "mùi hương đang mở bán",
        searchPlaceholder: "Tìm theo tên nước hoa, thương hiệu (Chanel, Dior, Creed) hoặc nốt hương...",
        clearSearch: "Xóa Bộ Lọc",
        noResultsTitle: "Không Tìm Thấy Mùi Hương Phù Hợp",
        noResultsDesc: "Không có sản phẩm nào khớp với danh mục hoặc từ khóa bạn vừa nhập.",
        pricePerSpray: "1 LẦN XỊT TIÊU CHUẨN (0.12ML)",
        viewDetails: "Nốt Hương",
        selectBtn: "Chọn Mùi",
        selectedBtn: "Đã Chọn",
        backToCatalogue: "Quay Lại Bộ Sưu Tập",
        fragranceSpec: "CẤU TRÚC TẦNG HƯƠNG",
        family: "NHÓM HƯƠNG",
        concentration: "NỒNG ĐỘ",
        audience: "PHÂN LOẠI",
        machineSlot: "VỊ TRÍ KHOANG CHỨA",
        topNotes: "HƯƠNG ĐẦU (TOP)",
        heartNotes: "HƯƠNG GIỮA (HEART)",
        baseNotes: "HƯƠNG CUỐI (BASE)",
        decantRef: "GIÁ THAM KHẢO CHIẾT 10ML",
        experiencePrice: "GIÁ TRẢI NGHIỆM",
        onePreciseSpray: "1 LẦN XỊT ĐỊNH LƯỢNG (0.12ML)",
        experienceNow: "Tiếp Tục Thanh Toán Mã QR",
        initializingOrder: "Đang khởi tạo mã QR...",
        singleSprayNotice:
            "Mỗi giao dịch thực hiện 1 lần xịt định lượng (0.12ml) trực tiếp trên trạm Kiosk này.",
        selectedProductsTitle: "MÙI HƯƠNG ĐÃ CHỌN",
        totalAmount: "TỔNG THANH TOÁN",
        payByQrBtn: "Thanh Toán Mã QR",
        reviewBtn: "Xem Nốt Hương",
        securePayment: "THANH TOÁN QR TỨC THÌ",
        scanQrTitle: "Quét Mã QR Để Thanh Toán",
        experienceFee: "TỔNG SỐ TIỀN",
        timeRemaining: "THỜI GIAN CÒN LẠI",
        supportedMethods: "CHỌN PHƯƠNG THỨC THANH TOÁN",
        backendVerifyNotice:
            "Vòi phun sẽ tự động mở khóa ngay sau khi giao dịch quét mã được xác nhận.",
        qrScanHint:
            "Mở ứng dụng ngân hàng hoặc Ví điện tử để quét mã. Màn hình sẽ tự động chuyển bước.",
        simulatePaid: "Xác Nhận Đã Quét Mã QR",
        simulateFail: "Giả lập lỗi cảm biến buồng xịt",
        simulateUncertain: "Giả lập mất kết nối sau khi nhận lệnh",
        cancelOrder: "Hủy Đơn",
        paymentConfirmed: "ĐÃ XÁC NHẬN THANH TOÁN",
        getReadyTitle: "Đặt Cổ Tay Hoặc Giấy Thử Vào Buồng Xịt",
        curatedFragrance: "SẴN SÀNG PHUN HƯƠNG",
        guidanceMain:
            "Vui lòng đặt cổ tay hoặc giấy thử cách vòi phun có đèn dẫn hướng khoảng 3–5 cm.",
        guidanceSub:
            "Cảm biến buồng xịt đã sẵn sàng. Bấm nút bên dưới ngay khi bạn đã đặt cổ tay vào vị trí.",
        initiatingSpray: "Đang chuẩn bị vòi phun định lượng...",
        readySprayNowBtn: "Bấm Để Xịt Nước Hoa Ngay (0.12ml)",
        dispensingTitle: "Đang Phun Nước Hoa...",
        preciseSprayProgress: "ĐANG PHUN SƯƠNG ĐỊNH LƯỢNG (0.12ML)",
        dispensingHint: "Vui lòng giữ yên cổ tay hoặc giấy thử trong buồng xịt...",
        completeTitle: "Trải Nghiệm Hoàn Tất",
        successfullyDispensed: "ĐÃ PHUN HOÀN TẤT",
        thankYouText:
            "Cảm ơn quý khách đã trải nghiệm tại ScentStation. Chúc quý khách một ngày tuyệt vời.",
        doneBtn: "Hoàn Tất & Về Màn Hình Chính",
        autoReturnIn: "Tự động quay về màn hình chính sau",
        failedTitle: "Gián Đoạn Phiên Giao Dịch",
        uncertainTitle: "Chưa Xác Nhận Kết Quả — Đã Ghi Nhận Hỗ Trợ",
        retryQrBtn: "Tạo Lại Mã QR Mới",
        backToFragrances: "Quay Về Màn Hình Chính",
        exploreBtn: "Khám Phá Bộ Sưu Tập",
        categories: {
            ALL: "Tất cả",
            WOMEN: "Nữ",
            MEN: "Nam",
            UNISEX: "Unisex",
            NICHE: "Niche",
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

const parseNotesFallback = (notesString?: string) => {
    if (!notesString) {
        return {
            top: ["Calabrian Bergamot", "Citrus Accords"],
            heart: ["Jasmine Petals", "Aromatic Spices"],
            base: ["Sandalwood", "Ambroxan & Musk"],
        };
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
    return {
        top: [items[0] || "Bergamot"],
        heart: [items[1] || "Floral Heart"],
        base: ["Precious Woods & Amber"],
    };
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
        if (nextParam && nextParam !== activeDeviceId) {
            setActiveDeviceId(nextParam);
        }
    }, [params.deviceId, activeDeviceId]);

    const catalogueRef = useRef<HTMLElement | null>(null);

    const [lang, setLang] = useState<KioskLanguage>("EN");
    const t = TRANSLATIONS[lang];

    const handleSwitchLanguage = useCallback((nextLang: KioskLanguage) => {
        setLang(nextLang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang.toLowerCase());
        } catch {
            // Ignore storage errors
        }
    }, []);

    useEffect(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang) {
                setLang(savedLang.toUpperCase() === "VI" ? "VI" : "EN");
            }
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
        return (
            kioskFleet.find((k) => k.code.toLowerCase() === activeDeviceId.toLowerCase()) ||
            kioskFleet[0]
        );
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
            if (reason === "SOLD_OUT") return lang === "VI" ? "HẾT BÌNH" : "SOLD OUT";
            if (reason === "MAINTENANCE") return lang === "VI" ? "BẢO TRÌ" : "MAINTENANCE";
            if (reason === "OFFLINE") return lang === "VI" ? "TẠM NGƯNG" : "OFFLINE";
            return lang === "VI" ? "SẴN SÀNG" : "READY";
        },
        [lang]
    );

    /* --- ĐỒNG BỘ 100% DUNG TÍCH ML & TRẠNG THÁI GIỮA MÀN 1, MÀN 4 VÀ MÀN 5 (/products) --- */
    const syncKioskDataFromStorage = useCallback(
        (overrideKioskCode?: string) => {
            const targetCode = (overrideKioskCode || activeDeviceId).toLowerCase();
            try {
                const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (savedLang) {
                    setLang(savedLang.toUpperCase() === "VI" ? "VI" : "EN");
                }

                // 1. Đọc danh mục sản phẩm chuẩn từ PRODUCTS_STORAGE_KEY (Ánh xạ theo cả Tên, SlotNumber và SKU để đổi tên vẫn nhận diện đúng)
                let customProductsMap: Record<string, any> = {};
                let customBySlotMap: Record<number, any> = {};
                let customBySkuMap: Record<string, any> = {};
                let parsedProdsList: any[] = [];
                const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                if (rawProds) {
                    try {
                        const parsedProds = JSON.parse(rawProds);
                        if (Array.isArray(parsedProds)) {
                            parsedProdsList = parsedProds;
                            parsedProds.forEach((p: any) => {
                                if (p) {
                                    if (p.name) {
                                        customProductsMap[String(p.name).trim().toLowerCase()] = p;
                                    }
                                    if (typeof p.slotNumber === "number") {
                                        customBySlotMap[p.slotNumber] = p;
                                    }
                                    if (p.skuCode) {
                                        customBySkuMap[String(p.skuCode).trim().toLowerCase()] = p;
                                    }
                                }
                            });
                        }
                    } catch {
                        customProductsMap = {};
                    }
                }

                // 2. Đọc ma trận tồn kho từng máy (KIOSK_PER_UNIT_STOCK_KEY) & cập nhật từ assignedMachines của /products
                let perKioskMatrix: Record<string, Record<string, number>> = {};
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                if (rawMatrix) {
                    try {
                        perKioskMatrix = JSON.parse(rawMatrix) || {};
                    } catch {
                        perKioskMatrix = {};
                    }
                }

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

                // 3. Đọc danh sách 8 máy Kiosk và gắn trạng thái productStatus + số ml chuẩn
                let currentFleet = FALLBACK_8_KIOSKS;
                const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawMachines) {
                    const parsed = JSON.parse(rawMachines);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        currentFleet = FALLBACK_8_KIOSKS.map((defaultUnit) => {
                            const savedUnit = parsed.find(
                                (m: any) =>
                                    String(m.code || "").toLowerCase() === defaultUnit.code.toLowerCase()
                            );
                            if (!savedUnit) {
                                return defaultUnit;
                            }

                            const isPrimaryOnlineDemo = ALWAYS_ONLINE_DEMO_CODES.has(
                                defaultUnit.code.toLowerCase()
                            );
                            let conn =
                                savedUnit.connectionStatus ||
                                (savedUnit.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                            let oper =
                                savedUnit.operatingStatus ||
                                (savedUnit.status === "MAINTENANCE"
                                    ? "MAINTENANCE"
                                    : savedUnit.status === "OFFLINE"
                                        ? "ERROR"
                                        : "ACTIVE");

                            if (
                                isPrimaryOnlineDemo &&
                                (conn === "OFFLINE" || oper === "ERROR") &&
                                !savedUnit.manualAdminOverride
                            ) {
                                conn = "ONLINE";
                                oper = "ACTIVE";
                            }

                            const unifiedStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" =
                                conn === "OFFLINE"
                                    ? "OFFLINE"
                                    : oper === "MAINTENANCE"
                                        ? "MAINTENANCE"
                                        : oper === "ACTIVE"
                                            ? "ONLINE"
                                            : "OFFLINE";

                            const rawSlots =
                                Array.isArray(savedUnit.slots) && savedUnit.slots.length > 0
                                    ? savedUnit.slots
                                    : defaultUnit.slots;

                            const kKey = defaultUnit.code.toLowerCase();

                            return {
                                ...defaultUnit,
                                ...savedUnit,
                                status: unifiedStatus,
                                connectionStatus: conn,
                                operatingStatus: oper,
                                doorOpen: Boolean(savedUnit.doorOpen),
                                leakDetected: Boolean(savedUnit.leakDetected),
                                slots: rawSlots.map((sl: any) => {
                                    const sKey = String(sl.fragranceName || "").trim().toLowerCase();
                                    const prodStatus =
                                        customProductsMap[sKey]?.status ||
                                        sl.productStatus ||
                                        MASTER_34_CATALOG_METADATA[sKey]?.defaultStatus ||
                                        "ACTIVE";
                                    const syncedMl =
                                        typeof perKioskMatrix[kKey]?.[sKey] === "number"
                                            ? perKioskMatrix[kKey][sKey]
                                            : Number(sl.remainingMl);
                                    return {
                                        ...sl,
                                        remainingMl: syncedMl,
                                        productStatus: prodStatus,
                                    };
                                }),
                            };
                        });
                    }
                }
                setKioskFleet(currentFleet);

                const matchedUnit =
                    currentFleet.find((k) => k.code.toLowerCase() === targetCode) ||
                    currentFleet[0];

                const unitReady =
                    matchedUnit.connectionStatus === "ONLINE" &&
                    matchedUnit.operatingStatus === "ACTIVE" &&
                    matchedUnit.status === "ONLINE" &&
                    !matchedUnit.doorOpen &&
                    !matchedUnit.leakDetected;

                const currentKioskKey = matchedUnit.code.toLowerCase();
                const currentKioskStockMap = perKioskMatrix[currentKioskKey] || {};

                const resolveSavedProductRecord = (
                    fragranceKey: string,
                    slotNumber?: number,
                    skuCode?: string
                ) => {
                    return (
                        customProductsMap[fragranceKey] ||
                        (typeof slotNumber === "number" ? customBySlotMap[slotNumber] : undefined) ||
                        (skuCode ? customBySkuMap[skuCode.toLowerCase()] : undefined)
                    );
                };

                // Hàm lấy đúng số ml khớp 100% với Màn 1 & Màn 5 (/products)
                const resolveUnifiedRemainingMl = (
                    fragranceKey: string,
                    defaultFallbackMl: number,
                    directSlotMl?: number,
                    slotNumber?: number,
                    skuCode?: string
                ): number => {
                    const savedCustom = resolveSavedProductRecord(fragranceKey, slotNumber, skuCode);
                    if (savedCustom && Array.isArray(savedCustom.assignedMachines)) {
                        if (savedCustom.assignedMachines.length === 0) {
                            return 0;
                        }
                        const matchOnCurrentKiosk = savedCustom.assignedMachines.find(
                            (am: any) =>
                                String(am.kioskCode || "").toLowerCase() === currentKioskKey
                        );
                        if (matchOnCurrentKiosk && typeof matchOnCurrentKiosk.remainingVolumeMl === "number") {
                            return Number(matchOnCurrentKiosk.remainingVolumeMl);
                        }
                        if (typeof savedCustom.assignedMachines[0].remainingVolumeMl === "number") {
                            return Number(savedCustom.assignedMachines[0].remainingVolumeMl);
                        }
                    }
                    if (typeof currentKioskStockMap[fragranceKey] === "number") {
                        return Number(currentKioskStockMap[fragranceKey]);
                    }
                    if (typeof directSlotMl === "number") {
                        return Number(directSlotMl);
                    }
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
                            family: "Luxury Olfactory",
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
                                (am: any) =>
                                    String(am.kioskCode || "").toLowerCase() === currentKioskKey
                            );
                        const prodStatus: "ACTIVE" | "INACTIVE" | "DRAFT" =
                            !hasAssignedOnThisKiosk
                                ? "INACTIVE"
                                : savedCustom?.status || sl.productStatus || meta.defaultStatus || "ACTIVE";
                        const isProductActive = prodStatus === "ACTIVE";

                        const effectivePrice = Number(savedCustom?.pricePerSpray ?? meta.price);
                        const remMl = resolveUnifiedRemainingMl(
                            key,
                            meta.defaultRemainingMl,
                            sl.remainingMl,
                            meta.slotNumber,
                            meta.skuCode
                        );
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
                            concentration: "EAU DE PARFUM",
                            audience:
                                savedCustom?.category === "Men" ||
                                savedCustom?.category === "Women" ||
                                savedCustom?.category === "Unisex"
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
                    const allActiveForCurrentKiosk: ExtendedKioskSlot[] = Object.entries(
                        MASTER_34_CATALOG_METADATA
                    )
                        .filter(([key, meta]) => {
                            const savedCustom = resolveSavedProductRecord(
                                key,
                                meta.slotNumber,
                                meta.skuCode
                            );
                            const effectiveStatus =
                                savedCustom?.status || meta.defaultStatus || "ACTIVE";
                            const hasAssignedMachine =
                                !savedCustom ||
                                !Array.isArray(savedCustom.assignedMachines) ||
                                savedCustom.assignedMachines.length > 0;
                            return effectiveStatus === "ACTIVE" && hasAssignedMachine;
                        })
                        .map(([key, meta]) => {
                            const savedCustom = resolveSavedProductRecord(
                                key,
                                meta.slotNumber,
                                meta.skuCode
                            );
                            const effectiveName =
                                savedCustom?.name ||
                                key
                                    .split(" ")
                                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                    .join(" ");
                            const effectiveNameKey = effectiveName.trim().toLowerCase();

                            const directSlotIdx = matchedUnit.slots.findIndex(
                                (s) =>
                                    isExactFragranceMatch(s.fragranceName, key) ||
                                    isExactFragranceMatch(s.fragranceName, effectiveName)
                            );
                            const directSlotInCurrentKiosk =
                                directSlotIdx >= 0 ? matchedUnit.slots[directSlotIdx] : undefined;

                            const effectivePrice = Number(savedCustom?.pricePerSpray ?? meta.price);

                            const remMl = resolveUnifiedRemainingMl(
                                effectiveNameKey,
                                meta.defaultRemainingMl,
                                directSlotInCurrentKiosk?.remainingMl,
                                meta.slotNumber,
                                meta.skuCode
                            );

                            const capMl = Number(
                                savedCustom?.bottleVolumeMl ??
                                directSlotInCurrentKiosk?.capacityMl ??
                                meta.capacityMl
                            );

                            const isEnoughMl = remMl >= 0.12;
                            const availabilityReason: ExtendedKioskSlot["availabilityReason"] = !isEnoughMl
                                ? "SOLD_OUT"
                                : matchedUnit.connectionStatus === "OFFLINE" || matchedUnit.status === "OFFLINE"
                                    ? "OFFLINE"
                                    : !unitReady
                                        ? "MAINTENANCE"
                                        : "READY";

                            const assignedOnCurrent = savedCustom?.assignedMachines?.find(
                                (am: any) =>
                                    String(am.kioskCode || "").toLowerCase() === currentKioskKey
                            );
                            const primaryAssigned = savedCustom?.assignedMachines?.[0];

                            const assignedChamberLabel = directSlotInCurrentKiosk
                                ? directSlotInCurrentKiosk.slotLabel.toUpperCase()
                                : assignedOnCurrent?.physicalSlotLabel?.toUpperCase() ||
                                primaryAssigned?.physicalSlotLabel?.toUpperCase() ||
                                `SLOT 0${((meta.slotNumber - 1) % 4) + 1}`;

                            const effectiveKioskCode = assignedOnCurrent
                                ? assignedOnCurrent.kioskCode
                                : primaryAssigned?.kioskCode ||
                                meta.defaultKioskCode ||
                                matchedUnit.code;

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
                                concentration: "EAU DE PARFUM",
                                audience:
                                    savedCustom?.category === "Men" ||
                                    savedCustom?.category === "Women" ||
                                    savedCustom?.category === "Unisex"
                                        ? savedCustom.category
                                        : meta.audience,
                                isNiche: savedCustom?.category === "Niche" ? true : meta.isNiche,
                                isBestSeller:
                                    Boolean(directSlotInCurrentKiosk) ||
                                    Boolean(assignedOnCurrent) ||
                                    meta.slotNumber <= 12,
                                fragranceFamily: savedCustom?.family || meta.family,
                                description: savedCustom?.description,
                                retailPrice10ml: effectivePrice * 30,
                                kioskCode: effectiveKioskCode,
                                kioskLocation: matchedUnit.locationName,
                                isPrimaryChamberSlot:
                                    Boolean(directSlotInCurrentKiosk) || Boolean(assignedOnCurrent),
                                productStatus: "ACTIVE",
                            };
                        });

                    // Nối thêm các sản phẩm mới (slotNumber > 34) do Admin tạo ở /products nếu đang ACTIVE và có lắp trong máy
                    const seedSlotNumbers = new Set(
                        Object.values(MASTER_34_CATALOG_METADATA).map((m) => m.slotNumber)
                    );
                    const seedSkuCodes = new Set(
                        Object.values(MASTER_34_CATALOG_METADATA).map((m) => m.skuCode.toLowerCase())
                    );

                    const customAddedProducts = parsedProdsList.filter((p: any) => {
                        if (!p || !p.name || p.status !== "ACTIVE") return false;
                        const hasAssigned =
                            !Array.isArray(p.assignedMachines) || p.assignedMachines.length > 0;
                        if (!hasAssigned) return false;
                        const nKey = String(p.name).trim().toLowerCase();
                        const sKey = String(p.skuCode || "").trim().toLowerCase();
                        return (
                            !MASTER_34_CATALOG_METADATA[nKey] &&
                            !seedSlotNumbers.has(Number(p.slotNumber)) &&
                            !seedSkuCodes.has(sKey)
                        );
                    });

                    customAddedProducts.forEach((customP: any, idx: number) => {
                        const cKey = String(customP.name).trim().toLowerCase();
                        const directSlotIdx = matchedUnit.slots.findIndex((s) =>
                            isExactFragranceMatch(s.fragranceName, cKey)
                        );
                        const directSlotInCurrentKiosk =
                            directSlotIdx >= 0 ? matchedUnit.slots[directSlotIdx] : undefined;

                        const assignedOnCurrent = customP.assignedMachines?.find(
                            (am: any) =>
                                String(am.kioskCode || "").toLowerCase() === currentKioskKey
                        );
                        const primaryAssigned = customP.assignedMachines?.[0];

                        const capMl = Number(customP.bottleVolumeMl || 100);
                        const remMl = resolveUnifiedRemainingMl(
                            cKey,
                            capMl,
                            directSlotInCurrentKiosk?.remainingMl,
                            customP.slotNumber,
                            customP.skuCode
                        );
                        const isEnoughMl = remMl >= 0.12;
                        allActiveForCurrentKiosk.unshift({
                            slotNumber: Number(customP.slotNumber || 35 + idx),
                            physicalSlotLabel: directSlotInCurrentKiosk
                                ? directSlotInCurrentKiosk.slotLabel.toUpperCase()
                                : assignedOnCurrent?.physicalSlotLabel?.toUpperCase() ||
                                primaryAssigned?.physicalSlotLabel?.toUpperCase() ||
                                "SLOT 04",
                            skuCode: customP.skuCode || `SKU-NEW-${35 + idx}`,
                            productName: customP.name,
                            brand: String(customP.brand || "LUXURY MAISON").toUpperCase(),
                            price: Number(customP.pricePerSpray || 15000),
                            available: unitReady && isEnoughMl,
                            availabilityReason: isEnoughMl ? "READY" : "SOLD_OUT",
                            remainingMl: remMl,
                            capacityMl: capMl,
                            lowStockThresholdMl: 15,
                            sprayDurationMs: 1200,
                            imageUrl: customP.image || "/images/dior-sauvage.jpg",
                            notes: customP.notes || "Bergamot, Amber, Musk",
                            concentration: String(customP.concentration || "EAU DE PARFUM").toUpperCase(),
                            audience:
                                customP.category === "Men" || customP.category === "Women"
                                    ? customP.category
                                    : "Unisex",
                            isNiche: customP.category === "Niche",
                            isBestSeller: true,
                            fragranceFamily: customP.family || "Luxury Olfactory",
                            description: customP.description,
                            retailPrice10ml: Number(customP.pricePerSpray || 15000) * 30,
                            kioskCode: assignedOnCurrent
                                ? assignedOnCurrent.kioskCode
                                : primaryAssigned?.kioskCode || matchedUnit.code,
                            kioskLocation: matchedUnit.locationName,
                            isPrimaryChamberSlot:
                                Boolean(directSlotInCurrentKiosk) || Boolean(assignedOnCurrent),
                            productStatus: "ACTIVE",
                        });
                    });

                    allActiveForCurrentKiosk.sort((a, b) => {
                        const scoreA = computeKioskRegionalSortScore(
                            matchedUnit.code,
                            a.slotNumber,
                            a.isPrimaryChamberSlot
                        );
                        const scoreB = computeKioskRegionalSortScore(
                            matchedUnit.code,
                            b.slotNumber,
                            b.isPrimaryChamberSlot
                        );
                        return scoreA - scoreB;
                    });

                    setAvailableProducts(allActiveForCurrentKiosk);
                }

                // Cập nhật luôn số ml, giá và trạng thái mới nhất cho cartProduct và detailProduct nếu đang mở
                setCartProduct((prev) => {
                    if (!prev) return null;
                    const key = prev.productName.trim().toLowerCase();
                    const savedCustom = resolveSavedProductRecord(
                        key,
                        prev.slotNumber,
                        prev.skuCode
                    );
                    if (
                        (savedCustom?.status && savedCustom.status !== "ACTIVE") ||
                        (savedCustom &&
                            Array.isArray(savedCustom.assignedMachines) &&
                            savedCustom.assignedMachines.length === 0)
                    ) {
                        return null;
                    }
                    const latestMl = resolveUnifiedRemainingMl(
                        key,
                        prev.remainingMl,
                        undefined,
                        prev.slotNumber,
                        prev.skuCode
                    );
                    const latestPrice = Number(savedCustom?.pricePerSpray ?? prev.price);
                    return { ...prev, remainingMl: latestMl, price: latestPrice };
                });
                setDetailProduct((prev) => {
                    if (!prev) return null;
                    const key = prev.productName.trim().toLowerCase();
                    const savedCustom = resolveSavedProductRecord(
                        key,
                        prev.slotNumber,
                        prev.skuCode
                    );
                    if (
                        (savedCustom?.status && savedCustom.status !== "ACTIVE") ||
                        (savedCustom &&
                            Array.isArray(savedCustom.assignedMachines) &&
                            savedCustom.assignedMachines.length === 0)
                    ) {
                        return null;
                    }
                    const latestMl = resolveUnifiedRemainingMl(
                        key,
                        prev.remainingMl,
                        undefined,
                        prev.slotNumber,
                        prev.skuCode
                    );
                    const latestPrice = Number(savedCustom?.pricePerSpray ?? prev.price);
                    return { ...prev, remainingMl: latestMl, price: latestPrice };
                });
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

        const syncTimer = setInterval(() => {
            syncKioskDataFromStorage();
        }, 2000);

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
                slots: k.slots.map((sl) => ({
                    ...sl,
                    remainingMl: sl.remainingMl < 5 ? 75.0 : sl.remainingMl,
                })),
            };
        });
        setKioskFleet(healedFleet);
        localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(healedFleet));
        syncKioskDataFromStorage(currentKioskUnit.code);
    }, [currentKioskUnit.code, kioskFleet, syncKioskDataFromStorage]);

    /* --- CẬP NHẬT ĐƠN HÀNG & TRỪ -0.12ML CHỈ TRÊN ĐÚNG MÁY KIOSK CHỨA SẢN PHẨM ĐÓ --- */
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
                // Xác định chính xác chiếc máy thực hiện lệnh phun cho sản phẩm này
                const executingKioskCode = snap.product.kioskCode || currentKioskUnit.code;
                const executingKioskKey = executingKioskCode.toLowerCase();
                const perfumeKey = snap.product.productName.trim().toLowerCase();
                const qtyBefore = snap.product.remainingMl;
                let qtyAfter = qtyBefore;

                if (options?.deductStock) {
                    qtyAfter = Number(Math.max(0, qtyBefore - 0.12).toFixed(2));

                    // 1. Chỉ cập nhật đúng máy executingKioskKey trong KIOSK_PER_UNIT_STOCK_KEY
                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                        ? JSON.parse(rawMatrix)
                        : {};
                    if (!perKioskMatrix[executingKioskKey]) perKioskMatrix[executingKioskKey] = {};
                    perKioskMatrix[executingKioskKey][perfumeKey] = qtyAfter;
                    localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                    // 2. Chỉ cập nhật đúng máy executingKioskKey trong MACHINES_STORAGE_KEY (các máy khác giữ nguyên 100%)
                    const updatedFleet = kioskFleet.map((k) => {
                        const kCode = k.code.toLowerCase();
                        if (kCode !== executingKioskKey) return k;
                        return {
                            ...k,
                            todaySprays: (k.todaySprays || 0) + 1,
                            todayRevenue: (k.todayRevenue || 0) + snap.price,
                            slots: k.slots.map((sl) =>
                                isExactFragranceMatch(sl.fragranceName, snap.product.productName)
                                    ? { ...sl, remainingMl: qtyAfter }
                                    : sl
                            ),
                        };
                    });
                    setKioskFleet(updatedFleet);
                    localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));

                    // 3. Đồng bộ sang PRODUCTS_STORAGE_KEY: chỉ trừ remainingVolumeMl của đúng trạm executingKioskKey
                    const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                    if (rawProds) {
                        const parsedProds = JSON.parse(rawProds);
                        if (Array.isArray(parsedProds)) {
                            const syncedProds = parsedProds.map((p: any) => {
                                if (
                                    !isExactFragranceMatch(p.name || "", snap.product.productName) &&
                                    p.skuCode !== snap.product.skuCode
                                ) {
                                    return p;
                                }
                                const nextExtra = Number(p.liveExtraSprays || 0) + 1;
                                const base30d = Number(p.baseSessions30d || 300);
                                return {
                                    ...p,
                                    liveExtraSprays: nextExtra,
                                    samplingSessions30d: base30d + nextExtra,
                                    assignedMachines: Array.isArray(p.assignedMachines)
                                        ? p.assignedMachines.map((am: any) => {
                                            const amKey = String(am.kioskCode || "").toLowerCase();
                                            if (amKey === executingKioskKey) {
                                                return { ...am, remainingVolumeMl: qtyAfter };
                                            }
                                            return am;
                                        })
                                        : [],
                                };
                            });
                            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(syncedProds));
                        }
                    }

                    // 4. Cập nhật state ngay trên màn hình Kiosk
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

                    // 5. Ghi lịch sử biến động tồn kho (SALE)
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
                        reason: `Customer spray at station ${executingKioskCode} (${snap.orderId})`,
                        timestamp: new Date().toISOString(),
                    });
                    localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(movements.slice(0, 300)));
                }

                // 6. Ghi đơn hàng và cảnh báo vào DASHBOARD_STORAGE_KEY
                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                const dashData = rawDash
                    ? JSON.parse(rawDash)
                    : { transactions: [], incidents: [], alerts: [] };
                if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                if (!Array.isArray(dashData.incidents)) dashData.incidents = [];
                if (!Array.isArray(dashData.alerts)) dashData.alerts = [];

                const txRecord = {
                    id: snap.orderId,
                    time:
                        nextStatus === "DISPENSED"
                            ? `Completed (${executingKioskCode})`
                            : `${executingKioskCode} (${nextStatus})`,
                    kiosk: executingKioskCode,
                    slotNumber: snap.product.slotNumber,
                    brand: snap.product.brand,
                    product: snap.product.productName,
                    priceSnapshot: snap.price,
                    amount: nextStatus === "DISPENSED" ? snap.price : 0,
                    paidAmount:
                        nextStatus === "PAID" ||
                        nextStatus === "DISPENSING" ||
                        nextStatus === "DISPENSED" ||
                        nextStatus === "FAILED" ||
                        nextStatus === "UNCERTAIN"
                            ? snap.price
                            : 0,
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
                    dashData.transactions[existingIdx] = {
                        ...dashData.transactions[existingIdx],
                        ...txRecord,
                    };
                } else {
                    dashData.transactions.unshift({
                        ...txRecord,
                        createdAt: new Date().toISOString(),
                    });
                }

                if (options?.requiresHumanReview) {
                    const hasInc = dashData.incidents.some((inc: any) => inc.orderId === snap.orderId);
                    if (!hasInc) {
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
                            reason: options.failureReason || `Hardware execution unconfirmed on ${executingKioskCode}`,
                            createdAt: new Date().toISOString(),
                        });
                    }
                }

                if (options?.deductStock && qtyAfter <= snap.product.lowStockThresholdMl) {
                    const alertType = qtyAfter < 0.12 ? "SLOT_EMPTY" : "LOW_STOCK";
                    const dupAlert = dashData.alerts.find(
                        (a: any) =>
                            String(a.machineId || "").toLowerCase() === executingKioskKey &&
                            a.slotNumber === snap.product.slotNumber &&
                            a.alertType === alertType &&
                            a.status !== "RESOLVED"
                    );
                    if (dupAlert) {
                        dupAlert.remainingMl = qtyAfter;
                        dupAlert.updatedAt = new Date().toISOString();
                    } else {
                        dashData.alerts.unshift({
                            id: `ALT-2026-${Math.floor(1000 + Math.random() * 8999)}`,
                            timestamp: new Date().toISOString(),
                            machineId: executingKioskCode,
                            slotNumber: snap.product.slotNumber,
                            brand: snap.product.brand,
                            product: snap.product.productName,
                            alertType,
                            category: "Inventory Alerts",
                            severity: qtyAfter < 0.12 ? "CRITICAL" : "HIGH",
                            status: "OPEN",
                            remainingMl: qtyAfter,
                            thresholdMl: snap.product.lowStockThresholdMl,
                            description: `Station ${executingKioskCode} (${snap.product.physicalSlotLabel} - ${snap.product.productName}) is at ${qtyAfter}ml (Threshold: ${snap.product.lowStockThresholdMl}ml).`,
                        });
                    }
                }

                localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));

                const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const logs = rawLogs ? JSON.parse(rawLogs) : [];
                logs.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: new Date().toISOString(),
                    actor: `Kiosk Customer (${executingKioskCode})`,
                    role: "CU",
                    tenant: snap.product.brand,
                    action: `KIOSK_ORDER_${nextStatus}`,
                    entityType: "ORDERS",
                    entityId: snap.orderId,
                    oldValues: { kioskCode: executingKioskCode, remainingMl: qtyBefore },
                    newValues: {
                        kioskCode: executingKioskCode,
                        status: nextStatus,
                        remainingMl: qtyAfter,
                        priceSnapshot: snap.price,
                    },
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        [currentKioskUnit.code, kioskFleet, paymentMethod]
    );

    const categoryCounts = useMemo(() => {
        return {
            ALL: availableProducts.length,
            WOMEN: availableProducts.filter((i) => i.audience?.toLowerCase() === "women").length,
            MEN: availableProducts.filter((i) => i.audience?.toLowerCase() === "men").length,
            UNISEX: availableProducts.filter((i) => i.audience?.toLowerCase() === "unisex").length,
            NICHE: availableProducts.filter((i) => Boolean(i.isNiche)).length,
            BEST_SELLER: availableProducts.filter((i) => Boolean(i.isBestSeller)).length,
        };
    }, [availableProducts]);

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
                item.kioskCode.toLowerCase().includes(q) ||
                (item.notes && item.notes.toLowerCase().includes(q)) ||
                (item.fragranceFamily && item.fragranceFamily.toLowerCase().includes(q));

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
        if (step !== "SELECT" || (!detailProduct && !cartProduct)) return;
        const idleTimer = setTimeout(() => {
            setDetailProduct(null);
            setCartProduct(null);
        }, 90000);
        return () => clearTimeout(idleTimer);
    }, [step, detailProduct, cartProduct]);

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
        if (
            !product.available ||
            product.remainingMl < 0.12 ||
            !isKioskOnlineAndActive ||
            (product.productStatus && product.productStatus !== "ACTIVE")
        ) {
            setErrorMessage(
                lang === "VI"
                    ? `Mùi hương ${product.productName} tại trạm ${currentKioskUnit.locationName} hiện đang ${getAvailabilityBadgeText(product.availabilityReason)}.`
                    : `${product.productName} at ${currentKioskUnit.locationName} is currently ${getAvailabilityBadgeText(product.availabilityReason)}.`
            );
            return;
        }
        setCartProduct(product);
        setErrorMessage(null);
    };

    const handleOpenProductDetail = (product: ExtendedKioskSlot) => {
        if (step !== "SELECT") return;
        setDetailProduct(product);
        if (
            product.available &&
            product.remainingMl >= 0.12 &&
            (!product.productStatus || product.productStatus === "ACTIVE")
        ) {
            setCartProduct(product);
        }
        setErrorMessage(null);
    };

    const handleConfirmSelection = async (targetOverride?: ExtendedKioskSlot) => {
        const targetProduct = targetOverride || detailProduct || cartProduct;
        if (!targetProduct || !isKioskOnlineAndActive || isCreatingOrder) return;

        if (
            !targetProduct.available ||
            targetProduct.remainingMl < 0.12 ||
            (targetProduct.productStatus && targetProduct.productStatus !== "ACTIVE")
        ) {
            setErrorMessage(
                lang === "VI"
                    ? `Mùi hương ${targetProduct.productName} tại trạm ${currentKioskUnit.locationName} hiện đang ${getAvailabilityBadgeText(targetProduct.availabilityReason)}.`
                    : `Fragrance ${targetProduct.productName} at ${currentKioskUnit.locationName} is currently ${getAvailabilityBadgeText(targetProduct.availabilityReason)}.`
            );
            return;
        }

        setIsCreatingOrder(true);
        setErrorMessage(null);
        setShowDiagnosticsDrawer(false);
        clearTimers();

        const now = Date.now();
        const expiresAt = now + 120 * 1000;
        const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
        const cmdUuid = `CMD-${newOrderId}`;
        const stationForOrder = targetProduct.kioskCode || currentKioskUnit.code;
        const idempotencyKey = `IDEMP-${newOrderId}-${stationForOrder}-${targetProduct.physicalSlotLabel.replace(/\s+/g, "")}`;
        const hmacSignature = `HMAC_SHA256_${btoa(
            `${cmdUuid}|${stationForOrder}|${targetProduct.slotNumber}|${targetProduct.price}`
        ).slice(0, 24)}`;

        const scopedProduct: ExtendedKioskSlot = {
            ...targetProduct,
            kioskCode: stationForOrder,
            kioskLocation: currentKioskUnit.locationName,
        };

        const newOrder: OrderSnapshot = {
            orderId: newOrderId,
            qrContent: `SCENTSTATION_PAY|${newOrderId}|${paymentMethod}|${scopedProduct.skuCode}|${stationForOrder}|${scopedProduct.price}VND`,
            product: scopedProduct,
            price: scopedProduct.price,
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
                upsertKioskOrderToSharedStorage(newOrder, "EXPIRED", {
                    failureReason: "ORDER_PAYMENT_TIMEOUT_EXPIRED",
                });
                setStep("FAILED");
                setErrorMessage(
                    lang === "VI"
                        ? `Phiên thanh toán cho đơn hàng ${newOrderId} tại trạm ${currentKioskUnit.locationName} đã hết hạn sau 120 giây. Không phát sinh trừ tiền và vòi phun đã được khóa an toàn.`
                        : `Payment session for Order ${newOrderId} at ${currentKioskUnit.locationName} expired after 120 seconds. No charge was applied and no spray was triggered.`
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
            upsertKioskOrderToSharedStorage(completedOrder, "DISPENSED", {
                deductStock: true,
            });
            setStep("SUCCESS");
        }, 1450);

        stepSequenceTimeoutsRef.current.push(t1);
    };

    const handleDemoAnomaly = (anomalyStatus: "FAILED" | "UNCERTAIN") => {
        if (!order || step !== "QR_WAITING") return;
        clearTimers();

        const reason =
            anomalyStatus === "FAILED"
                ? lang === "VI"
                    ? `Cảm biến an toàn buồng xịt tại trạm ${currentKioskUnit.locationName} đã ngắt lệnh phun để bảo vệ khách hàng. Dung tích bình được giữ nguyên. Khoản thanh toán (${formatPrice(order.price)}) của mã đơn ${order.orderId} đã được chuyển tới bộ phận vận hành để hoàn tiền tự động.`
                    : `Chamber safety interlock on station ${currentKioskUnit.locationName} prevented actuation. 0ml was dispensed. Your payment (${formatPrice(order.price)}) under Reference ${order.orderId} has been routed to Operations Support for an automatic refund.`
                : lang === "VI"
                    ? `Trạm ${currentKioskUnit.locationName} đã nhận lệnh nhưng phản hồi kết quả trễ hạn. Để đảm bảo an toàn không phun lặp lần 2, đơn hàng ${order.orderId} đã được ghi nhận để bộ phận vận hành kiểm tra và hỗ trợ hoàn tiền.`
                    : `Station ${currentKioskUnit.locationName} acknowledged command ${order.commandUuid} but did not confirm completion within the safety window. To prevent accidental double-spraying, Order ${order.orderId} has been logged for staff verification and refund review.`;

        const updated: OrderSnapshot = {
            ...order,
            status: anomalyStatus,
            failureReason: reason,
        };
        setOrder(updated);
        setErrorMessage(reason);
        upsertKioskOrderToSharedStorage(updated, anomalyStatus, {
            failureReason:
                anomalyStatus === "FAILED"
                    ? "SAFETY_INTERLOCK_REJECTED"
                    : "MQTT_RESULT_TIMEOUT_UNCERTAIN",
            requiresHumanReview: true,
        });
        setStep(anomalyStatus);
    };

    const handleCancelOrder = () => {
        if (!order || step !== "QR_WAITING") return;
        clearTimers();
        upsertKioskOrderToSharedStorage(order, "CANCELLED", {
            failureReason: "CUSTOMER_CANCELLED_AT_KIOSK",
        });
        setOrder((o) => (o ? { ...o, status: "CANCELLED" } : o));
        setStep("SELECT");
    };

    if (isMenuLoading) {
        return (
            <main className={`${styles.unavailablePage} notranslate`} translate="no">
                <div className={styles.unavailableContent} style={{ borderColor: "rgba(212,175,55,0.45)" }}>
                    <p className={styles.brandName}>SCENTSTATION</p>
                    <h2 style={{ fontFamily: "Bodoni Moda, Georgia, serif", margin: "0.5rem 0" }}>
                        {lang === "VI" ? "Đang Kết Nối Trạm Trải Nghiệm..." : "Connecting to Boutique Station..."}
                    </h2>
                    <p className={styles.unavailableMessage}>
                        {lang === "VI"
                            ? "Đang đồng bộ danh mục mùi hương và kiểm tra cảm biến buồng xịt..."
                            : "Synchronizing fragrance chambers and verifying station readiness..."}
                    </p>
                </div>
            </main>
        );
    }

    if (!isKioskOnlineAndActive) {
        return (
            <main className={`${styles.unavailablePage} notranslate`} translate="no">
                <div className={styles.unavailableContent}>
                    <div className={styles.unavailableIcon}>
                        <AlertTriangle size={28} color="#F87171" />
                    </div>
                    <p className={styles.brandName}>SCENTSTATION</p>
                    <h1 style={{ fontFamily: "Bodoni Moda, Georgia, serif", fontSize: "1.8rem", margin: "0.4rem 0" }}>
                        {currentKioskUnit.operatingStatus === "MAINTENANCE"
                            ? lang === "VI"
                                ? "Trạm Đang Bảo Trì Định Kỳ"
                                : "Station Under Scheduled Maintenance"
                            : lang === "VI"
                                ? "Trạm Đang Tạm Ngưng Kết Nối"
                                : "Station Temporarily Offline"}
                    </h1>
                    <p className={styles.unavailableMessage}>
                        {lang === "VI" ? (
                            <>
                                Trạm trải nghiệm tại <strong>{currentKioskUnit.locationName}</strong> (
                                <code>{currentKioskUnit.code}</code>) hiện đang tạm khóa nhận đơn mới để đảm bảo an toàn. Bạn có thể kích hoạt kết nối lại cho trạm này hoặc chuyển sang trạm trải nghiệm khác:
                            </>
                        ) : (
                            <>
                                The sampling station at <strong>{currentKioskUnit.locationName}</strong> (
                                <code>{currentKioskUnit.code}</code>) is currently paused for safety. You may restore station connectivity below or switch to an active boutique station:
                            </>
                        )}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                        <button
                            type="button"
                            onClick={handleForceReconnectCurrentKiosk}
                            className={styles.primaryDemoButton}
                            style={{ width: "100%" }}
                        >
                            <RefreshCw size={15} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
                            <span>
                                {lang === "VI"
                                    ? `Kích Hoạt Lại Trạm ${currentKioskUnit.locationName}`
                                    : `Restore Station ${currentKioskUnit.locationName} to Active Service`}
                            </span>
                        </button>

                        <div style={{ display: "flex", gap: "0.6rem" }}>
                            <button
                                type="button"
                                onClick={() => handleSwitchActiveKioskUnit("demo-device")}
                                className={styles.secondaryButton}
                                style={{ flex: 1 }}
                            >
                                {lang === "VI" ? "Chuyển Sang Diamond Plaza" : "Switch to Diamond Plaza"}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className={styles.secondaryButton}
                                style={{ flex: 1 }}
                            >
                                {lang === "VI" ? "Về Trang Chủ" : "Back to Flagship Store"}
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
                            <h1 className={styles.brandName} translate="no">
                                SCENTSTATION
                            </h1>
                            <p className={styles.brandTagline}>{t.tagline}</p>
                        </div>

                        <div className={styles.headerRightGroup}>
                            <div className={styles.langSwitcher}>
                                <button
                                    type="button"
                                    onClick={() => handleSwitchLanguage("VI")}
                                    className={`${styles.langBtn} ${lang === "VI" ? styles.langBtnActive : ""}`}
                                >
                                    VI
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitchLanguage("EN")}
                                    className={`${styles.langBtn} ${lang === "EN" ? styles.langBtnActive : ""}`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <section className={styles.flowSection}>
                    <div className={styles.flowCard}>
                        <div className={styles.kioskStateStepper} translate="no">
                            <div
                                className={`${styles.kioskStepItem} ${
                                    step === "QR_WAITING"
                                        ? styles.kioskStepActive
                                        : step === "PAID_GUIDANCE" ||
                                        step === "DISPENSING" ||
                                        step === "SUCCESS"
                                            ? styles.kioskStepDone
                                            : styles.kioskStepError
                                }`}
                            >
                                <span>01</span>
                                <span>SCAN QR</span>
                            </div>
                            <div
                                className={`${styles.kioskStepItem} ${
                                    step === "PAID_GUIDANCE"
                                        ? styles.kioskStepActive
                                        : step === "DISPENSING" ||
                                        step === "SUCCESS" ||
                                        step === "FAILED" ||
                                        step === "UNCERTAIN"
                                            ? styles.kioskStepDone
                                            : ""
                                }`}
                            >
                                <span>02</span>
                                <span>POSITION WRIST</span>
                            </div>
                            <div
                                className={`${styles.kioskStepItem} ${
                                    step === "DISPENSING"
                                        ? styles.kioskStepActive
                                        : step === "SUCCESS"
                                            ? styles.kioskStepDone
                                            : step === "FAILED" || step === "UNCERTAIN"
                                                ? styles.kioskStepError
                                                : ""
                                }`}
                            >
                                <span>03</span>
                                <span>SPRAYING</span>
                            </div>
                            <div
                                className={`${styles.kioskStepItem} ${
                                    step === "SUCCESS"
                                        ? styles.kioskStepDone
                                        : step === "FAILED" || step === "UNCERTAIN"
                                            ? styles.kioskStepError
                                            : ""
                                }`}
                            >
                                <span>04</span>
                                <span>
                                    {step === "FAILED" || step === "UNCERTAIN" ? step : "COMPLETE"}
                                </span>
                            </div>
                        </div>

                        {step === "QR_WAITING" && order && (
                            <>
                                <p className={styles.flowEyebrow} translate="no">
                                    {t.securePayment} • {order.orderId}
                                </p>
                                <h2 className={styles.flowTitle}>{t.scanQrTitle}</h2>

                                <div className={styles.kioskCheckoutProductSummary}>
                                    <div className={styles.kioskCheckoutThumb}>
                                        {order.product.imageUrl ? (
                                            <img
                                                src={order.product.imageUrl}
                                                alt={order.product.productName}
                                            />
                                        ) : null}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span className={styles.paymentBrandName} translate="no">
                                            {order.product.brand}
                                        </span>
                                        <div
                                            translate="no"
                                            style={{
                                                fontSize: "1.04rem",
                                                fontWeight: 700,
                                                color: "#FFFFFF",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {order.product.productName}
                                        </div>
                                        <div
                                            translate="no"
                                            style={{
                                                fontSize: "0.72rem",
                                                color: "#94A3B8",
                                                fontFamily: "Space Grotesk, monospace",
                                                marginTop: "2px",
                                            }}
                                        >
                                            {currentKioskUnit.locationName} •{" "}
                                            <strong style={{ color: "#34D399" }}>{order.product.physicalSlotLabel}</strong> ({order.product.remainingMl}ml available)
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", flexShrink: 0 }} translate="no">
                                        <span
                                            style={{
                                                display: "block",
                                                fontSize: "0.62rem",
                                                color: "#94A3B8",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            {t.experienceFee}
                                        </span>
                                        <strong className={styles.paymentPriceValue}>
                                            {formatPrice(order.price)}
                                        </strong>
                                    </div>
                                </div>

                                <div className={styles.kioskGatewayGrid} translate="no">
                                    {(
                                        [
                                            { id: "VIETQR", title: "VIETQR", sub: "NAPAS 24/7" },
                                            { id: "MOMO", title: "MOMO", sub: "E-Wallet" },
                                            { id: "VNPAY", title: "VNPAY", sub: "Smart QR" },
                                            { id: "ZALOPAY", title: "ZALOPAY", sub: "Instant QR" },
                                        ] as const
                                    ).map((pm) => (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            onClick={() => {
                                                setPaymentMethod(pm.id);
                                                upsertKioskOrderToSharedStorage(order, "PENDING", {
                                                    overridePaymentMethod: pm.id,
                                                });
                                            }}
                                            className={`${styles.kioskGatewayBtn} ${
                                                paymentMethod === pm.id ? styles.kioskGatewayBtnActive : ""
                                            }`}
                                        >
                                            <span>{pm.title}</span>
                                            <span style={{ fontSize: "0.58rem", fontWeight: 500, opacity: 0.8 }}>
                                                {pm.sub}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className={styles.kioskQrShowcase}>
                                    <div className={styles.kioskQrFrame}>
                                        <span className={styles.qrProviderHeader} translate="no">
                                            {paymentMethod} • {currentKioskUnit.code}
                                        </span>
                                        <QRCode
                                            value={`${order.qrContent}|METHOD:${paymentMethod}`}
                                            size={138}
                                            bgColor="#FFFFFF"
                                            fgColor="#050508"
                                            level="M"
                                        />
                                    </div>

                                    <div className={styles.kioskInvoiceMeta}>
                                        <div className={styles.kioskInvoiceRow}>
                                            <span style={{ color: "#94A3B8" }}>
                                                {lang === "VI" ? "Trạm phục vụ:" : "Boutique Station:"}
                                            </span>
                                            <strong translate="no" style={{ color: "#F5E6AD", fontFamily: "Space Grotesk, monospace" }}>
                                                {currentKioskUnit.locationName}
                                            </strong>
                                        </div>
                                        <div className={styles.kioskInvoiceRow}>
                                            <span style={{ color: "#94A3B8" }}>
                                                {lang === "VI" ? "Khoang & Định lượng:" : "Chamber & Dosage:"}
                                            </span>
                                            <strong translate="no" style={{ color: "#F8FAFC", fontFamily: "Space Grotesk, monospace" }}>
                                                {order.product.physicalSlotLabel} • 1 Spray (0.12ml)
                                            </strong>
                                        </div>
                                        <div className={styles.kioskInvoiceRow}>
                                            <span style={{ color: "#94A3B8" }}>
                                                {lang === "VI" ? "Trạng thái buồng xịt:" : "Chamber Status:"}
                                            </span>
                                            <strong translate="no" style={{ color: "#34D399", fontFamily: "Space Grotesk, monospace" }}>
                                                {lang === "VI" ? "Cảm biến sẵn sàng" : "Safety Verified"}
                                            </strong>
                                        </div>

                                        <div style={{ marginTop: "0.25rem" }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    fontFamily: "Space Grotesk, monospace",
                                                    fontSize: "0.72rem",
                                                }}
                                            >
                                                <span style={{ color: "#FBBF24" }}>● {t.timeRemaining}</span>
                                                <strong
                                                    className={
                                                        remainingSeconds <= 30 ? styles.countdownUrgent : ""
                                                    }
                                                    style={{
                                                        color: remainingSeconds <= 30 ? "#F87171" : "#F5E6AD",
                                                        fontSize: "0.95rem",
                                                    }}
                                                >
                                                    {formatCountdown(remainingSeconds)}
                                                </strong>
                                            </div>
                                            <div className={styles.kioskCountdownTrack}>
                                                <div
                                                    className={styles.kioskCountdownFill}
                                                    style={{
                                                        width: `${Math.round((remainingSeconds / 120) * 100)}%`,
                                                        background:
                                                            remainingSeconds <= 30
                                                                ? "#F87171"
                                                                : "linear-gradient(90deg, #D4AF37, #34D399)",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.securityVerifyNote}>{t.backendVerifyNotice}</div>

                                <div style={{ display: "flex", gap: "0.6rem" }}>
                                    <button
                                        type="button"
                                        className={styles.primaryDemoButton}
                                        style={{ flex: 1.6, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                                        onClick={handleSimulateWebhookPaid}
                                    >
                                        <CheckCircle2 size={16} />
                                        <span>{t.simulatePaid}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        style={{ flex: 0.7, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                                        onClick={handleCancelOrder}
                                    >
                                        <Ban size={14} />
                                        <span>{t.cancelOrder}</span>
                                    </button>
                                </div>

                                <div style={{ marginTop: "0.85rem", textAlign: "right" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowDiagnosticsDrawer(!showDiagnosticsDrawer)}
                                        className={styles.diagnosticToggleBtn}
                                    >
                                        <SlidersHorizontal size={12} />
                                        <span>
                                            {lang === "VI"
                                                ? "Mô phỏng tình huống phần cứng"
                                                : "Hardware & Sensor Simulation"}
                                        </span>
                                    </button>
                                </div>

                                {showDiagnosticsDrawer && (
                                    <div className={styles.kioskSimulatorDrawer}>
                                        <div className={styles.kioskSimulatorHeader}>
                                            <span>
                                                {lang === "VI"
                                                    ? "Kiểm Thử Kịch Bản Ngoại Lệ Tại Trạm"
                                                    : "Station Fault Simulation"}
                                            </span>
                                        </div>
                                        <div className={styles.demoButtonGroup}>
                                            <button
                                                type="button"
                                                className={styles.subDemoButton}
                                                style={{ borderColor: "rgba(248,113,113,0.4)", color: "#FCA5A5" }}
                                                onClick={() => handleDemoAnomaly("FAILED")}
                                            >
                                                {t.simulateFail}
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.subDemoButton}
                                                style={{ borderColor: "rgba(192,132,252,0.4)", color: "#E9D5FF" }}
                                                onClick={() => handleDemoAnomaly("UNCERTAIN")}
                                            >
                                                {t.simulateUncertain}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {step === "PAID_GUIDANCE" && order && (
                            <>
                                <div className={styles.successBadgeGlow}>
                                    <span className={styles.successDotPulse} />
                                    <span>{t.paymentConfirmed}</span>
                                </div>

                                <h2 className={styles.flowTitle}>{t.getReadyTitle}</h2>

                                <div className={styles.kioskCheckoutProductSummary} style={{ margin: "0 auto 1rem auto" }}>
                                    {order.product.imageUrl && (
                                        <div className={styles.kioskCheckoutThumb} style={{ width: "52px", height: "52px", minWidth: "52px" }}>
                                            <img src={order.product.imageUrl} alt={order.product.productName} />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span className={styles.guidanceSubLabel}>{t.curatedFragrance}</span>
                                        <p className={styles.guidanceProductName} translate="no" style={{ margin: 0 }}>
                                            {order.product.brand} — {order.product.productName}
                                        </p>
                                    </div>
                                    <span className={`${styles.slotNumber} ${styles.slotBadgeLocal}`} translate="no">
                                        {order.product.physicalSlotLabel}
                                    </span>
                                </div>

                                <div className={styles.interlockBar} translate="no">
                                    <div className={styles.interlockChip}>CHAMBER READY</div>
                                    <div className={styles.interlockChip}>{currentKioskUnit.chamberTemp}</div>
                                    <div className={styles.interlockChip}>0.12ML CALIBRATED</div>
                                    <div className={styles.interlockChip}>VERIFIED</div>
                                </div>

                                <div className={styles.nozzleGuideBox}>
                                    <div className={styles.nozzleSensorRing}>
                                        <div className={styles.sensorCore} />
                                    </div>
                                    <p className={styles.guidanceText}>{t.guidanceMain}</p>
                                    <p className={styles.guidanceSub}>{t.guidanceSub}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleTriggerCalibratedSpray}
                                    className={styles.primaryDemoButton}
                                    style={{ width: "100%", marginBottom: "10px", padding: "0.95rem 1.2rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                                >
                                    <Sparkles size={16} />
                                    <span>{t.readySprayNowBtn}</span>
                                </button>
                            </>
                        )}

                        {step === "DISPENSING" && order && (
                            <>
                                <div className={styles.dispensingVisualWrapper}>
                                    <div className={styles.pulseRingOuter} />
                                    <div className={styles.pulseRingInner} />
                                    <div className={styles.dispensingCoreIcon}>
                                        <Droplets size={20} color="#050508" />
                                    </div>
                                </div>

                                <h2 className={styles.flowTitle}>{t.dispensingTitle}</h2>

                                <div className={styles.dispensingProductBadge}>
                                    <span className={styles.badgeSubText}>{t.preciseSprayProgress}</span>
                                    <p className={styles.badgeProductName} translate="no">
                                        {order.product.productName} • {order.product.physicalSlotLabel}
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
                                <div className={styles.successCompleteIconWrapper}>
                                    <div className={styles.successPulseRing} />
                                    <div className={styles.successCheckSymbol}>
                                        <Check size={24} />
                                    </div>
                                </div>

                                <h2 className={styles.flowTitle}>{t.completeTitle}</h2>

                                <div className={styles.completeProductBadge}>
                                    <span className={styles.completeSubLabel}>{t.successfullyDispensed}</span>
                                    <p className={styles.completeProductName} translate="no">
                                        {order.product.productName}
                                    </p>
                                </div>

                                <div className={styles.receiptCard} translate="no">
                                    <div className={styles.receiptRow}>
                                        <span>{lang === "VI" ? "MÃ BIÊN NHẬN" : "RECEIPT REFERENCE"}</span>
                                        <strong>{order.orderId}</strong>
                                    </div>
                                    <div className={styles.receiptRow}>
                                        <span>{lang === "VI" ? "TRẠM PHỤC VỤ" : "BOUTIQUE STATION"}</span>
                                        <strong style={{ color: "#F5E6AD" }}>
                                            {currentKioskUnit.locationName} ({order.product.physicalSlotLabel})
                                        </strong>
                                    </div>
                                    <div className={styles.receiptRow}>
                                        <span>{lang === "VI" ? "PHƯƠNG THỨC THANH TOÁN" : "PAYMENT METHOD"}</span>
                                        <strong>
                                            {paymentMethod} • {formatPrice(order.price)}
                                        </strong>
                                    </div>
                                    <div className={styles.receiptRow}>
                                        <span>{lang === "VI" ? "DUNG TÍCH BÌNH CÒN LẠI TẠI TRẠM" : "REMAINING STATION VOLUME"}</span>
                                        <strong style={{ color: "#34D399" }}>
                                            {Number(Math.max(0, order.product.remainingMl - 0.12).toFixed(2))} ml (-0.12 ml)
                                        </strong>
                                    </div>
                                </div>

                                <p className={styles.completeThankYouText}>
                                    {t.thankYouText}
                                    <br />
                                    <strong style={{ color: "#F5E6AD" }}>
                                        ({t.autoReturnIn} {autoReturnSeconds}s)
                                    </strong>
                                </p>

                                <button
                                    type="button"
                                    className={styles.completeFinishButton}
                                    onClick={resetToSelect}
                                >
                                    {t.doneBtn}
                                </button>
                            </>
                        )}

                        {step === "FAILED" && (
                            <>
                                <div className={styles.errorIconWrapper}>
                                    <div className={styles.errorPulseRing} />
                                    <div className={styles.errorSymbol}>
                                        <AlertOctagon size={24} />
                                    </div>
                                </div>

                                <h2 className={styles.flowTitle}>{t.failedTitle}</h2>
                                <p className={styles.flowHint}>{errorMessage}</p>

                                {order && (
                                    <div className={styles.referenceBadge}>
                                        <span className={styles.referenceLabel}>
                                            {lang === "VI" ? "MÃ TRA CỨU HỖ TRỢ" : "SUPPORT REFERENCE"}
                                        </span>
                                        <span className={styles.referenceValue}>{order.orderId}</span>
                                    </div>
                                )}

                                <div className={styles.flowActions}>
                                    {order?.product && (
                                        <button
                                            type="button"
                                            className={styles.primaryDemoButton}
                                            onClick={() => void handleConfirmSelection(order.product)}
                                        >
                                            {t.retryQrBtn}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={resetToSelect}
                                    >
                                        {t.backToFragrances}
                                    </button>
                                </div>
                            </>
                        )}

                        {step === "UNCERTAIN" && (
                            <>
                                <div className={styles.errorIconWrapper}>
                                    <div className={styles.uncertainPulseRing} />
                                    <div className={styles.uncertainSymbol}>
                                        <HelpCircle size={24} />
                                    </div>
                                </div>

                                <h2 className={styles.flowTitle}>{t.uncertainTitle}</h2>
                                <p className={styles.flowHint}>{errorMessage}</p>

                                {order && (
                                    <div className={styles.referenceBadge}>
                                        <span className={styles.referenceLabel}>
                                            {lang === "VI" ? "MÃ ĐỐI SOÁT HỖ TRỢ" : "VERIFICATION REFERENCE"}
                                        </span>
                                        <span className={styles.referenceValue}>{order.orderId}</span>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className={styles.errorActionButton}
                                    onClick={resetToSelect}
                                >
                                    {t.backToFragrances}
                                </button>
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
                    <div
                        className={styles.brandGroup}
                        onClick={() => {
                            setDetailProduct(null);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    >
                        <h1 className={styles.brandName} translate="no">
                            SCENTSTATION
                        </h1>
                        <p className={styles.brandTagline}>{t.tagline}</p>
                    </div>

                    <div className={styles.headerRightGroup}>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className={styles.headerGhostBtn}
                        >
                            <ArrowLeft size={14} color="#D4AF37" />
                            <span>{lang === "VI" ? "Về Trang Chủ" : "Flagship Store"}</span>
                        </button>

                        <div className={styles.kioskSwitcherWrap} ref={unitMenuRef} translate="no">
                            <button
                                type="button"
                                onClick={() => setIsUnitMenuOpen((prev) => !prev)}
                                className={styles.kioskSwitcherTrigger}
                            >
                                <Cpu size={14} color="#D4AF37" />
                                <span>
                                    {currentKioskUnit.locationName} ({currentKioskUnit.brand})
                                </span>
                                <ChevronDown
                                    size={14}
                                    color="#D4AF37"
                                    style={{
                                        transform: isUnitMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease",
                                    }}
                                />
                            </button>

                            {isUnitMenuOpen && (
                                <div className={styles.kioskSwitcherMenu}>
                                    {kioskFleet.map((k) => {
                                        const isSelected = k.code === currentKioskUnit.code;
                                        return (
                                            <button
                                                key={k.code}
                                                type="button"
                                                onClick={() => handleSwitchActiveKioskUnit(k.code)}
                                                className={`${styles.kioskSwitcherOption} ${
                                                    isSelected ? styles.kioskSwitcherOptionActive : ""
                                                }`}
                                            >
                                                <div>
                                                    <div
                                                        style={{
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 700,
                                                            color: isSelected ? "#F5E6AD" : "#FFF",
                                                        }}
                                                    >
                                                        {k.locationName} ({k.brand})
                                                    </div>
                                                    <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                                        {k.address}
                                                    </div>
                                                </div>
                                                <span
                                                    style={{
                                                        fontFamily: "Space Grotesk, monospace",
                                                        fontSize: "0.62rem",
                                                        fontWeight: 700,
                                                        padding: "0.18rem 0.5rem",
                                                        borderRadius: "999px",
                                                        background:
                                                            k.status === "ONLINE"
                                                                ? "rgba(52,211,153,0.14)"
                                                                : k.status === "MAINTENANCE"
                                                                    ? "rgba(251,191,36,0.16)"
                                                                    : "rgba(248,113,113,0.16)",
                                                        color:
                                                            k.status === "ONLINE"
                                                                ? "#34D399"
                                                                : k.status === "MAINTENANCE"
                                                                    ? "#FBBF24"
                                                                    : "#F87171",
                                                    }}
                                                >
                                                    {k.status}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className={styles.langSwitcher} aria-label="Language selection">
                            <button
                                type="button"
                                onClick={() => handleSwitchLanguage("VI")}
                                className={`${styles.langBtn} ${lang === "VI" ? styles.langBtnActive : ""}`}
                            >
                                VI
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchLanguage("EN")}
                                className={`${styles.langBtn} ${lang === "EN" ? styles.langBtnActive : ""}`}
                            >
                                EN
                            </button>
                        </div>

                        <div className={styles.statusContainer}>
                            <button
                                type="button"
                                className={styles.machineStatus}
                                onClick={() => setIsStatusOpen((prev) => !prev)}
                                aria-expanded={isStatusOpen}
                            >
                                <span className={styles.statusPulse}>
                                    <span className={styles.statusDot} />
                                </span>
                                <span translate="no">
                                    {lang === "VI" ? "Trạm Sẵn Sàng" : "Station Ready"} • {currentKioskUnit.chamberTemp}
                                </span>
                            </button>

                            {isStatusOpen && (
                                <div className={styles.statusPanel}>
                                    <div className={styles.statusPanelHeader}>
                                        <span className={styles.statusPanelEyebrow}>
                                            {lang === "VI" ? "THÔNG TIN TRẠM KIOSK" : "STATION DIAGNOSTICS"}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.statusCloseButton}
                                            onClick={() => setIsStatusOpen(false)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className={styles.statusPanelBody}>
                                        <div className={styles.statusDetailRow}>
                                            <span>{lang === "VI" ? "Mã trạm" : "Station ID"}</span>
                                            <strong>{currentKioskUnit.code}</strong>
                                        </div>
                                        <div className={styles.statusDetailRow}>
                                            <span>{lang === "VI" ? "Địa điểm" : "Boutique"}</span>
                                            <strong>{currentKioskUnit.locationName}</strong>
                                        </div>
                                        <div className={styles.statusDetailRow}>
                                            <span>{lang === "VI" ? "Nhiệt độ bảo quản" : "Chamber Climate"}</span>
                                            <strong style={{ color: "#34D399" }}>
                                                {currentKioskUnit.chamberTemp} • {lang === "VI" ? "Ổn định" : "Optimal"}
                                            </strong>
                                        </div>
                                        <div className={styles.statusDetailRow}>
                                            <span>{lang === "VI" ? "Định lượng mỗi lần xịt" : "Calibrated Dosage"}</span>
                                            <strong style={{ color: "#F5E6AD" }}>0.12 ml / Spray</strong>
                                        </div>
                                    </div>
                                    <p className={styles.statusDescription}>
                                        {lang === "VI"
                                            ? "Bình chứa tại trạm được kiểm soát nhiệt độ tiêu chuẩn giúp bảo toàn nguyên vẹn cấu trúc nốt hương."
                                            : "Climate-controlled chambers preserve the authentic molecular profile of every fragrance."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {detailProduct ? (
                <section className={styles.detailSection}>
                    <button
                        type="button"
                        className={styles.backButton}
                        onClick={() => {
                            setDetailProduct(null);
                            setErrorMessage(null);
                        }}
                    >
                        <ArrowLeft size={15} />
                        <span>{t.backToCatalogue}</span>
                    </button>
                    <div className={styles.detailLayout}>
                        <div className={styles.detailImagePanel}>
                            {detailProduct.imageUrl ? (
                                <img
                                    src={detailProduct.imageUrl}
                                    alt={detailProduct.productName}
                                    className={styles.detailImage}
                                />
                            ) : (
                                <div className={styles.imagePlaceholder}>
                                    <span>{detailProduct.brand}</span>
                                    <strong>{detailProduct.productName}</strong>
                                </div>
                            )}
                        </div>
                        <div className={styles.detailContent}>
                            <p className={styles.eyebrow}>{t.fragranceSpec}</p>
                            <p className={styles.detailBrand} translate="no">
                                {detailProduct.brand} • {currentKioskUnit.locationName}
                            </p>
                            <h2 className={styles.detailTitle} translate="no">
                                {detailProduct.productName}
                            </h2>
                            <p className={styles.detailDescription}>
                                {detailProduct.description ||
                                    (lang === "VI"
                                        ? `Tuyệt tác hương thơm thuộc nhóm ${detailProduct.fragranceFamily} với sự kết hợp tinh tế của ${detailProduct.notes}. Được hiệu chuẩn chính xác ở định lượng 0.12ml cho một lần xịt thử tại trạm ${currentKioskUnit.locationName}.`
                                        : `An exquisite ${detailProduct.fragranceFamily} composition featuring ${detailProduct.notes}. Calibrated for a 0.12ml micro-atomized trial spray at ${currentKioskUnit.locationName}.`)}
                            </p>
                            <div className={styles.detailFacts}>
                                <div>
                                    <span>{t.family}</span>
                                    <strong>{detailProduct.fragranceFamily}</strong>
                                </div>
                                <div>
                                    <span>{t.concentration}</span>
                                    <strong>{detailProduct.concentration}</strong>
                                </div>
                                <div>
                                    <span>{t.audience}</span>
                                    <strong>{detailProduct.audience}</strong>
                                </div>
                                <div>
                                    <span>{t.machineSlot}</span>
                                    <strong
                                        style={{
                                            color: detailProduct.available ? "#34D399" : "#F87171",
                                        }}
                                    >
                                        {detailProduct.physicalSlotLabel} ({detailProduct.remainingMl}ml / {detailProduct.capacityMl}ml)
                                    </strong>
                                </div>
                            </div>
                            <div className={styles.scentProfile}>
                                <div>
                                    <span>{t.topNotes}</span>
                                    <strong>{parsedNotes?.top.join(", ")}</strong>
                                </div>
                                <div>
                                    <span>{t.heartNotes}</span>
                                    <strong>{parsedNotes?.heart.join(", ")}</strong>
                                </div>
                                <div>
                                    <span>{t.baseNotes}</span>
                                    <strong>{parsedNotes?.base.join(", ")}</strong>
                                </div>
                                <div className={styles.sourcePriceRow}>
                                    <span>{t.decantRef}</span>
                                    <strong>{formatPrice(detailProduct.retailPrice10ml || detailProduct.price * 30)}</strong>
                                </div>
                            </div>
                            <div className={styles.detailPriceBlock}>
                                <div>
                                    <span>{t.experiencePrice}</span>
                                    <strong>{formatPrice(detailProduct.price)}</strong>
                                </div>
                                <span className={styles.slotNumber}>{t.onePreciseSpray}</span>
                            </div>
                            {errorMessage && (
                                <p style={{ color: "#F87171", fontSize: "0.82rem", marginBottom: "0.8rem" }}>
                                    {errorMessage}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => void handleConfirmSelection(detailProduct)}
                                disabled={isCreatingOrder || !detailProduct.available}
                                className={styles.detailConfirmButton}
                            >
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
                                <p className={styles.eyebrow}>{t.eyebrow}</p>
                                <h1 className={styles.heroTitle}>
                                    {t.heroTitle1}{" "}
                                    <span>{t.heroTitle2}</span>
                                </h1>
                                <p className={styles.heroDescription}>{t.heroDesc}</p>
                                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        className={styles.backButton}
                                        style={{ marginBottom: 0 }}
                                        onClick={() =>
                                            catalogueRef.current?.scrollIntoView({ behavior: "smooth" })
                                        }
                                    >
                                        <Sparkles size={15} />
                                        <span>{t.exploreBtn}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.headerGhostBtn}
                                        onClick={() => setShowFull34Catalog((prev) => !prev)}
                                        style={{
                                            borderColor: !showFull34Catalog ? "#34D399" : "rgba(212,175,55,0.5)",
                                            color: !showFull34Catalog ? "#34D399" : "#F5E6AD",
                                        }}
                                    >
                                        <span>
                                            {showFull34Catalog
                                                ? lang === "VI"
                                                    ? "Chỉ Hiện 4 Khoang Tiêu Điểm Tại Trạm"
                                                    : "Show 4 Featured Station Chambers"
                                                : lang === "VI"
                                                    ? "Xem Toàn Bộ Mùi Hương Đang Mở Bán"
                                                    : "Show All Active Station Scents"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <aside className={styles.usageInstructionCard} aria-label="Usage instructions">
                                <div className={styles.usageHeader}>
                                    <span className={styles.usageEyebrow}>{t.usageTitle}</span>
                                    <span className={styles.usageRuleBadge}>{t.usageRule}</span>
                                </div>
                                <div className={styles.usageStepsList}>
                                    <div className={styles.usageStepItem}>
                                        <span className={styles.usageStepNum}>1</span>
                                        <div className={styles.usageStepText}>
                                            <strong>{t.step1Title}</strong>
                                            <p>{t.step1Desc}</p>
                                        </div>
                                    </div>
                                    <div className={styles.usageStepItem}>
                                        <span className={styles.usageStepNum}>2</span>
                                        <div className={styles.usageStepText}>
                                            <strong>{t.step2Title}</strong>
                                            <p>{t.step2Desc}</p>
                                        </div>
                                    </div>
                                    <div className={styles.usageStepItem}>
                                        <span className={styles.usageStepNum}>3</span>
                                        <div className={styles.usageStepText}>
                                            <strong>{t.step3Title}</strong>
                                            <p>{t.step3Desc}</p>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <div className={styles.carouselContainer}>
                            <div className={styles.carouselTrack}>
                                {(() => {
                                    const videoList = [
                                        {
                                            id: 0,
                                            src: "/videos/guerlain-vetiver.mp4",
                                            fallbackSrc: "/video_1.mp4",
                                            title: "VÉTIVER FAUVE",
                                            subtitle: "L’ART & LA MATIÈRE",
                                        },
                                        {
                                            id: 1,
                                            src: "/videos/guerlain-peche.mp4",
                                            fallbackSrc: "/video_1.mp4",
                                            title: "PÊCHE MIRAGE",
                                            subtitle: "HAUTE PARFUMERIE COLLECTION",
                                        },
                                        {
                                            id: 2,
                                            src: "/videos/guerlain-heritage.mp4",
                                            fallbackSrc: "/video_1.mp4",
                                            title: "MAISON HERITAGE",
                                            subtitle: "SCENTSTATION ATELIER",
                                        },
                                    ];

                                    const reorderedVideos = [
                                        videoList[(activeVideoIndex - 1 + videoList.length) % videoList.length],
                                        videoList[activeVideoIndex],
                                        videoList[(activeVideoIndex + 1) % videoList.length],
                                    ];

                                    return reorderedVideos.map((item, positionIndex) => {
                                        const isActive = positionIndex === 1;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`${styles.carouselItem} ${
                                                    isActive ? styles.activeItem : styles.inactiveItem
                                                }`}
                                                onClick={() => {
                                                    const originalIndex = videoList.findIndex((v) => v.id === item.id);
                                                    setActiveVideoIndex(originalIndex);
                                                }}
                                            >
                                                <video
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    poster="/login-perfume.png"
                                                    className={styles.carouselVideo}
                                                >
                                                    <source src={item.src} type="video/mp4" />
                                                    <source src={item.fallbackSrc} type="video/mp4" />
                                                </video>
                                                <div className={styles.carouselOverlay} />
                                                {isActive && (
                                                    <div className={styles.carouselCaption}>
                                                        <div>
                                                            <span className={styles.captionSubtitle}>{item.subtitle}</span>
                                                            <h3 className={styles.captionTitle}>{item.title}</h3>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            <div className={styles.carouselDots}>
                                {[0, 1, 2].map((index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        aria-label={`Slide ${index + 1}`}
                                        className={`${styles.dot} ${index === activeVideoIndex ? styles.activeDot : ""}`}
                                        onClick={() => setActiveVideoIndex(index)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.editorialMarquee}>
                            <div className={styles.editorialMarqueeTrack}>
                                <span>CHANEL • DIOR • CREED • LE LABO • MAISON FRANCIS KURKDJIAN • TOM FORD • ROJA PARFUMS • PARFUMS DE MARLY</span>
                                <span>INSTANT QR CHECKOUT • CLIMATE-CONTROLLED CHAMBERS • 0.12ML CALIBRATED ATOMIZER • 100% AUTHENTIC MAISONS</span>
                            </div>
                        </div>

                        <div className={styles.deviceInfoRow}>
                            <div className={styles.deviceInfo}>
                                <span>{t.activeKioskUnit}:</span>
                                <strong translate="no">
                                    {currentKioskUnit.locationName} ({currentKioskUnit.brand} Flagship)
                                </strong>
                            </div>
                            <div className={styles.deviceInfo} translate="no">
                                <span>CHAMBER CLIMATE:</span>
                                <strong>{currentKioskUnit.chamberTemp}</strong>
                                <span>• DOSAGE:</span>
                                <strong>0.12 ML / SPRAY</strong>
                                <span>• STATUS:</span>
                                <strong style={{ color: "#34D399" }}>ONLINE & READY</strong>
                            </div>
                        </div>
                    </section>

                    <section ref={catalogueRef} className={styles.collectionSection}>
                        <div className={styles.sectionHeading}>
                            <div>
                                <p className={styles.sectionEyebrow}>
                                    {`${t.catalogueEyebrow} • ${currentKioskUnit.locationName.toUpperCase()}`}
                                </p>
                                <h2>
                                    {showFull34Catalog
                                        ? `${t.availableFragrances} — ${currentKioskUnit.locationName}`
                                        : lang === "VI"
                                            ? `4 Khoang Hương Tiêu Điểm — ${currentKioskUnit.locationName}`
                                            : `4 Featured Chambers — ${currentKioskUnit.locationName}`}
                                </h2>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowFull34Catalog(false)}
                                    className={styles.headerGhostBtn}
                                    style={{
                                        borderColor: !showFull34Catalog ? "#34D399" : undefined,
                                        background: !showFull34Catalog ? "rgba(52,211,153,0.16)" : undefined,
                                        color: !showFull34Catalog ? "#34D399" : undefined,
                                    }}
                                >
                                    <span>{lang === "VI" ? "4 Khoang Tiêu Điểm" : "4 Featured Chambers"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowFull34Catalog(true)}
                                    className={styles.headerGhostBtn}
                                    style={{
                                        borderColor: showFull34Catalog ? "#D4AF37" : undefined,
                                        background: showFull34Catalog ? "rgba(212,175,55,0.2)" : undefined,
                                        color: showFull34Catalog ? "#F5E6AD" : undefined,
                                    }}
                                >
                                    <span>
                                        {lang === "VI"
                                            ? `Toàn Bộ Mùi Hương (${availableProducts.length})`
                                            : `All Active Scents (${availableProducts.length})`}
                                    </span>
                                </button>
                                <span className={styles.productCount}>
                                    {filteredCatalogue.length} / {availableProducts.length} {t.itemsReady}
                                </span>
                            </div>
                        </div>

                        <div className={styles.catalogueControlsBar}>
                            <div className={styles.categoryPills} role="tablist">
                                {(
                                    ["ALL", "WOMEN", "MEN", "UNISEX", "NICHE", "BEST_SELLER"] as KioskCategory[]
                                ).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeCategory === cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`${styles.categoryPill} ${
                                            activeCategory === cat ? styles.categoryPillActive : ""
                                        }`}
                                    >
                                        <span>{t.categories[cat]}</span>
                                        <span style={{ opacity: 0.75, fontSize: "0.68rem" }}>
                                            ({categoryCounts[cat]})
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles.kioskSearchBox}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t.searchPlaceholder}
                                    className={styles.kioskSearchInput}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className={styles.kioskSearchClear}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {filteredCatalogue.length > 0 ? (
                            <div className={styles.productGrid}>
                                {filteredCatalogue.map((product) => {
                                    const isSelected =
                                        cartProduct &&
                                        isExactFragranceMatch(cartProduct.productName, product.productName);
                                    const pct = Math.round((product.remainingMl / product.capacityMl) * 100);
                                    const isSelectable =
                                        product.available &&
                                        product.remainingMl >= 0.12 &&
                                        (!product.productStatus || product.productStatus === "ACTIVE");
                                    const isLow = product.remainingMl <= product.lowStockThresholdMl;

                                    return (
                                        <article
                                            key={`${currentKioskUnit.code}-${product.slotNumber}-${product.productName}`}
                                            onClick={() => handleOpenProductDetail(product)}
                                            className={`${styles.productCard} ${
                                                isSelected
                                                    ? styles.productCardSelected
                                                    : !isSelectable
                                                        ? styles.productCardUnavailable
                                                        : ""
                                            }`}
                                        >
                                            <div>
                                                <div className={styles.productTopRow}>
                                                    <div className={styles.productThumb}>
                                                        {product.imageUrl ? (
                                                            <img
                                                                src={product.imageUrl}
                                                                alt={product.productName}
                                                            />
                                                        ) : (
                                                            <div className={styles.imagePlaceholder}>
                                                                <span>{product.brand}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={styles.cardHeaderInfo}>
                                                        <div className={styles.cardTopMeta}>
                                                            <span className={styles.cardBrandLabel} translate="no">
                                                                {product.brand}
                                                            </span>
                                                            <span
                                                                translate="no"
                                                                className={`${styles.slotNumber} ${
                                                                    !isSelectable
                                                                        ? styles.slotBadgeLocked
                                                                        : product.isPrimaryChamberSlot
                                                                            ? styles.slotBadgeLocal
                                                                            : ""
                                                                }`}
                                                            >
                                                                {!isSelectable
                                                                    ? getAvailabilityBadgeText(product.availabilityReason)
                                                                    : product.physicalSlotLabel}
                                                            </span>
                                                        </div>

                                                        <h3 className={styles.cardTitle} translate="no">
                                                            {product.productName}
                                                        </h3>

                                                        <div className={styles.cardSkuSub} translate="no">
                                                            {product.audience} • {currentKioskUnit.locationName}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={styles.volumeMetaRow}>
                                                    <span style={{ color: "#CBD5E1" }}>
                                                        {product.fragranceFamily}
                                                        {product.isNiche ? " • Niche" : ""}
                                                    </span>
                                                    <strong
                                                        translate="no"
                                                        style={{
                                                            color: !isSelectable
                                                                ? "#F87171"
                                                                : isLow
                                                                    ? "#FBBF24"
                                                                    : "#34D399",
                                                        }}
                                                    >
                                                        {product.remainingMl}ml / {product.capacityMl}ml ({pct}%)
                                                    </strong>
                                                </div>

                                                <div className={styles.volumeTrack}>
                                                    <div
                                                        className={styles.volumeFill}
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: !isSelectable
                                                                ? "#F87171"
                                                                : isLow
                                                                    ? "#FBBF24"
                                                                    : "linear-gradient(90deg, #D4AF37, #34D399)",
                                                        }}
                                                    />
                                                </div>

                                                <p className={styles.productNotes}>✦ {product.notes}</p>
                                            </div>

                                            <div
                                                className={styles.productFooter}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div translate="no">
                                                    <span className={styles.priceLabel}>{t.pricePerSpray}</span>
                                                    <p className={styles.price}>{formatPrice(product.price)}</p>
                                                </div>

                                                <div className={styles.cardButtonRow}>
                                                    <button
                                                        type="button"
                                                        className={styles.selectButton}
                                                        onClick={() => handleOpenProductDetail(product)}
                                                    >
                                                        {t.viewDetails}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={!isSelectable}
                                                        className={styles.quickSelectBtn}
                                                        onClick={(e) => handleSelectForCart(product, e)}
                                                    >
                                                        {!isSelectable
                                                            ? getAvailabilityBadgeText(product.availabilityReason)
                                                            : isSelected
                                                                ? t.selectedBtn
                                                                : t.selectBtn}
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
                                <p style={{ marginBottom: "18px", color: "#94A3B8" }}>{t.noResultsDesc}</p>
                                <button
                                    type="button"
                                    className={styles.backButton}
                                    style={{ marginBottom: 0 }}
                                    onClick={() => {
                                        setActiveCategory("ALL");
                                        setSearchQuery("");
                                    }}
                                >
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
                            <div
                                translate="no"
                                style={{
                                    fontSize: "0.68rem",
                                    color: "#D4AF37",
                                    letterSpacing: "0.14em",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                {cartProduct.brand} • {currentKioskUnit.locationName} ({cartProduct.physicalSlotLabel} • {cartProduct.remainingMl}ml)
                            </div>
                            <div
                                translate="no"
                                style={{ fontSize: "1.02rem", fontWeight: 700, color: "#FFFFFF" }}
                            >
                                {cartProduct.productName}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                                {t.singleSprayNotice}
                            </div>
                        </div>
                    </div>

                    <div className={styles.selectedDockActions}>
                        <div style={{ textAlign: "right", marginRight: "8px" }} translate="no">
                            <span
                                style={{
                                    display: "block",
                                    fontSize: "0.62rem",
                                    color: "#94A3B8",
                                    letterSpacing: "0.14em",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                {t.totalAmount}
                            </span>
                            <strong
                                style={{
                                    fontSize: "1.2rem",
                                    color: "#F5E6AD",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                {formatPrice(cartProduct.price)}
                            </strong>
                        </div>

                        <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => setDetailProduct(cartProduct)}
                        >
                            {t.reviewBtn}
                        </button>

                        <button
                            type="button"
                            className={styles.dockProceedBtn}
                            disabled={isCreatingOrder}
                            onClick={() => void handleConfirmSelection(cartProduct)}
                        >
                            <QrCode size={15} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
                            <span>{isCreatingOrder ? t.initializingOrder : t.payByQrBtn}</span>
                        </button>
                    </div>
                </div>
            )}

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div>
                        <p className={styles.footerBrandName} translate="no">
                            SCENTSTATION
                        </p>
                        <p className={styles.footerBrandDesc}>
                            {lang === "VI"
                                ? "HỆ THỐNG BOUTIQUE TRẢI NGHIỆM NƯỚC HOA TỰ ĐỘNG CAO CẤP"
                                : "HAUTE PARFUMERIE & AUTOMATED SAMPLING BOUTIQUES"}
                        </p>
                        <span className={styles.footerUnitBadge} translate="no">
                            STATION: <strong>{currentKioskUnit.locationName}</strong> ({currentKioskUnit.code})
                        </span>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>{lang === "VI" ? "HỖ TRỢ KHÁCH HÀNG" : "CONCIERGE SUPPORT"}</h4>
                        <p>Hotline: 1900-SCENT (72368)</p>
                        <p>Email: concierge@scentstation.com</p>
                        <p>{lang === "VI" ? "Giờ mở cửa: 08:00 - 22:00" : "Boutique Hours: 08:00 - 22:00"}</p>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>{lang === "VI" ? "QUY TRÌNH 3 BƯỚC" : "SAMPLING EXPERIENCE"}</h4>
                        <p>{lang === "VI" ? "1. Chọn Mùi Hương Yêu Thích" : "1. Select Signature Scent"}</p>
                        <p>{lang === "VI" ? "2. Quét Mã QR Thanh Toán" : "2. Instant Digital QR Checkout"}</p>
                        <p>{lang === "VI" ? "3. Nhận 1 Lần Xịt Chuẩn 0.12ml" : "3. Receive 0.12ml Calibrated Mist"}</p>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>{lang === "VI" ? "CAM KẾT CHẤT LƯỢNG" : "AUTHENTICITY GUARANTEE"}</h4>
                        <p>{lang === "VI" ? "100% Nước Hoa Chính Hãng" : "100% Authorized Maison Bottles"}</p>
                        <p>{lang === "VI" ? "Bảo Quản Lạnh Tiêu Chuẩn" : "Climate-Controlled Chambers"}</p>
                        <p>{lang === "VI" ? "Định Lượng Chính Xác Từng Giọt" : "Precision Micro-Atomization"}</p>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <span>SCENTSTATION LUXURY RETAIL NETWORK</span>
                    <span>
                        {currentKioskUnit.locationName.toUpperCase()} • CHAMBER {currentKioskUnit.chamberTemp}
                    </span>
                </div>
            </footer>
        </main>
    );
}