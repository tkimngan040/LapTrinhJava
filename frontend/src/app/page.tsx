// noinspection SpellCheckingInspection
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    MapPin,
    Volume2,
    VolumeX,
    Globe,
    LogIn,
    LayoutDashboard,
    CheckCircle2,
    QrCode,
    Search,
    Zap,
    Cpu,
    ChevronDown,
    Check,
    X,
    AlertOctagon,
    Ban,
    RefreshCw,
    HelpCircle,
    Lock,
    AlertTriangle,
    Filter,
    SlidersHorizontal,
} from "lucide-react";
import styles from "./landing.module.css";

export type OrderLifecycleState =
    | "PENDING"
    | "PAID"
    | "DISPENSING"
    | "DISPENSED"
    | "FAILED"
    | "UNCERTAIN"
    | "CANCELLED"
    | "EXPIRED"
    | "REFUNDED";

export type RoleCode = "PSA" | "BA" | "OM" | "TE" | "IS" | "VW" | "CU";
export type ToastVariant = "success" | "warning" | "error";

export interface AssignedStationMeta {
    kioskCode: string;
    location: string;
    slotNumber: number;
    physicalSlotLabel: string;
    remainingVolumeMl: number;
}

export interface SyncedCatalogItem {
    slotNumber: number;
    skuCode: string;
    name: string;
    brand: string;
    category: "Men" | "Women" | "Unisex" | "Niche";
    family: string;
    notes: string;
    bottleVolumeMl: number;
    pricePerSpray: number;
    retail10ml: number;
    fullBottlePrice: number;
    kioskCode: string;
    location: string;
    physicalSlotLabel?: string;
    remainingVolumeMl: number;
    lowStockThresholdMl: number;
    sprayDurationMs: number;
    image: string;
    status?: "ACTIVE" | "INACTIVE" | "DRAFT";
    assignedMachines?: AssignedStationMeta[];
}

export interface SyncedKioskUnit {
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
        pricePerSpray?: number;
    }[];
}

// Khớp ma trận 6 nhóm người dùng nội bộ (PSA, BA, OM, TE, IS, VW)
const ROLE_ACCESS_MAP: Record<string, RoleCode[]> = {
    "/dashboard": ["PSA", "BA", "OM", "VW"],
    "/alerts": ["PSA", "BA", "OM", "TE", "IS"],
    "/profile": ["PSA", "BA", "OM", "TE", "IS", "VW"],
    "/brands": ["PSA", "BA"],
    "/products": ["PSA", "BA", "OM", "TE", "IS"],
    "/machines": ["PSA", "BA", "OM", "TE", "IS"],
    "/transactions": ["PSA", "BA", "OM", "VW"],
    "/inventory": ["PSA", "BA", "OM", "IS"],
    "/refill": ["PSA", "BA", "OM", "TE", "IS"],
    "/maintenance": ["PSA", "BA", "OM", "TE"],
    "/users": ["PSA", "BA"],
    "/reports": ["PSA", "BA", "OM", "VW"],
    "/settings": ["PSA", "BA", "OM"],
};

const ROLE_DEFAULT_HOME: Record<RoleCode, string> = {
    PSA: "/dashboard",
    BA: "/dashboard",
    OM: "/dashboard",
    VW: "/dashboard",
    TE: "/maintenance",
    IS: "/inventory",
    CU: "/",
};

const DEFAULT_34_CATALOG: SyncedCatalogItem[] = [
    { slotNumber: 1, skuCode: "SKU-ARM-01", name: "Acqua Di Gio", brand: "Giorgio Armani", category: "Men", family: "Aquatic Aromatic", notes: "Bergamot, Sea Notes, Jasmine, Cedar", bottleVolumeMl: 100, pricePerSpray: 12000, retail10ml: 360000, fullBottlePrice: 3200000, kioskCode: "KIOSK-SGN-01", location: "Takashimaya D1, HCMC", remainingVolumeMl: 78.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/acqua-di-gio.jpg", status: "ACTIVE" },
    { slotNumber: 2, skuCode: "SKU-ARM-02", name: "Acqua Di Gio Profondo", brand: "Giorgio Armani", category: "Men", family: "Aquatic Mineral", notes: "Marine Notes, Rosemary, Patchouli", bottleVolumeMl: 100, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3650000, kioskCode: "KIOSK-SGN-01", location: "Takashimaya D1, HCMC", remainingVolumeMl: 64.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/acqua-di-gio-profondo.jpg", status: "ACTIVE" },
    { slotNumber: 3, skuCode: "SKU-CHA-03", name: "Bleu de Chanel", brand: "Chanel", category: "Men", family: "Woody Aromatic", notes: "Lemon, Mint, Pink Pepper, Sandalwood", bottleVolumeMl: 100, pricePerSpray: 15000, retail10ml: 450000, fullBottlePrice: 4250000, kioskCode: "KIOSK-SGN-01", location: "Takashimaya D1, HCMC", remainingVolumeMl: 12.5, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/bleu-de-chanel.png", status: "ACTIVE" },
    { slotNumber: 4, skuCode: "SKU-CHA-04", name: "Coco Mademoiselle", brand: "Chanel", category: "Women", family: "Oriental Floral", notes: "Orange, Patchouli, Turkish Rose", bottleVolumeMl: 100, pricePerSpray: 15500, retail10ml: 465000, fullBottlePrice: 4400000, kioskCode: "KIOSK-SGN-02", location: "Vincom Dong Khoi, HCMC", remainingVolumeMl: 82.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/coco-mademoiselle.jpg", status: "ACTIVE" },
    { slotNumber: 5, skuCode: "SKU-BUR-05", name: "Burberry Goddess", brand: "Burberry", category: "Women", family: "Aromatic Vanilla", notes: "Vanilla Infusion, Lavender, Cocoa", bottleVolumeMl: 100, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3500000, kioskCode: "KIOSK-SGN-02", location: "Vincom Dong Khoi, HCMC", remainingVolumeMl: 71.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/burberry-goddess.jpg", status: "ACTIVE" },
    { slotNumber: 6, skuCode: "SKU-BUR-06", name: "Burberry Her", brand: "Burberry", category: "Women", family: "Floral Fruity", notes: "Red & Dark Berries, Jasmine, Musk", bottleVolumeMl: 100, pricePerSpray: 12500, retail10ml: 375000, fullBottlePrice: 3350000, kioskCode: "KIOSK-HN-01", location: "Lotte West Lake, Hanoi", remainingVolumeMl: 55.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/burberry-her.jpg", status: "ACTIVE" },
    { slotNumber: 7, skuCode: "SKU-CH-07", name: "Carolina Herrera Good Girl", brand: "Carolina Herrera", category: "Women", family: "Oriental Floral", notes: "Almond, Coffee, Tuberose, Tonka Bean", bottleVolumeMl: 80, pricePerSpray: 13500, retail10ml: 405000, fullBottlePrice: 3450000, kioskCode: "KIOSK-HN-01", location: "Lotte West Lake, Hanoi", remainingVolumeMl: 54.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/carolina-herrera-good-girl.jpg", status: "ACTIVE" },
    { slotNumber: 8, skuCode: "SKU-ARMF-08", name: "Club de Nuit Intense Man", brand: "Armaf", category: "Men", family: "Woody Spicy", notes: "Lemon, Pineapple, Birch, Ambroxan", bottleVolumeMl: 105, pricePerSpray: 10000, retail10ml: 300000, fullBottlePrice: 1650000, kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside, Da Nang", remainingVolumeMl: 92.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/club-de-nuit-intense.jpg", status: "ACTIVE" },
    { slotNumber: 9, skuCode: "SKU-CRD-09", name: "Creed Aventus", brand: "Creed", category: "Niche", family: "Chypre Fruity", notes: "Pineapple, Birch, Musk, Oakmoss", bottleVolumeMl: 100, pricePerSpray: 20000, retail10ml: 600000, fullBottlePrice: 7800000, kioskCode: "demo-device", location: "Diamond Plaza Atrium, HCMC", remainingVolumeMl: 11.5, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/creed-aventus.jpg", status: "ACTIVE" },
    { slotNumber: 10, skuCode: "SKU-DIO-10", name: "Dior Sauvage", brand: "Dior", category: "Men", family: "Aromatic Fougere", notes: "Calabrian Bergamot, Sichuan Pepper, Ambroxan", bottleVolumeMl: 100, pricePerSpray: 14500, retail10ml: 435000, fullBottlePrice: 3950000, kioskCode: "KIOSK-HN-01", location: "Lotte West Lake, Hanoi", remainingVolumeMl: 84.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/dior-sauvage.jpg", status: "ACTIVE" },
    { slotNumber: 11, skuCode: "SKU-DIO-11", name: "Miss Dior Blooming Bouquet", brand: "Dior", category: "Women", family: "Floral", notes: "Sweet Pea, Damask Rose, White Musk", bottleVolumeMl: 100, pricePerSpray: 13500, retail10ml: 405000, fullBottlePrice: 3600000, kioskCode: "KIOSK-SGN-01", location: "Takashimaya D1, HCMC", remainingVolumeMl: 76.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/miss-dior-blooming-bouquet.jpg", status: "ACTIVE" },
    { slotNumber: 12, skuCode: "SKU-JPG-12", name: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", category: "Men", family: "Oriental Fougere", notes: "Lavender, Mint, Cardamom, Vanilla", bottleVolumeMl: 125, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3300000, kioskCode: "KIOSK-SGN-02", location: "Vincom Dong Khoi, HCMC", remainingVolumeMl: 77.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/jean-paul-gaultier-le-male.jpg", status: "ACTIVE" },
    { slotNumber: 13, skuCode: "SKU-JPG-13", name: "Jean Paul Gaultier Scandal", brand: "Jean Paul Gaultier", category: "Women", family: "Chypre Floral", notes: "Blood Orange, Honey, Gardenia, Patchouli", bottleVolumeMl: 80, pricePerSpray: 13500, retail10ml: 405000, fullBottlePrice: 3450000, kioskCode: "KIOSK-SGN-02", location: "Vincom Dong Khoi, HCMC", remainingVolumeMl: 47.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/jean-paul-gaultier-scandal.jpg", status: "ACTIVE" },
    { slotNumber: 14, skuCode: "SKU-LLB-14", name: "Le Labo Another 13", brand: "Le Labo", category: "Niche", family: "Woody Oriental", notes: "Ambroxan, Pear, Jasmine Petals, Ambrette", bottleVolumeMl: 100, pricePerSpray: 18000, retail10ml: 540000, fullBottlePrice: 6500000, kioskCode: "demo-device", location: "Diamond Plaza Atrium, HCMC", remainingVolumeMl: 13.5, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/le-labo-another-13.jpg", status: "ACTIVE" },
    { slotNumber: 15, skuCode: "SKU-LLB-15", name: "Le Labo Santal 33", brand: "Le Labo", category: "Niche", family: "Woody Aromatic", notes: "Australian Sandalwood, Cedar, Cardamom, Leather", bottleVolumeMl: 100, pricePerSpray: 18500, retail10ml: 555000, fullBottlePrice: 6600000, kioskCode: "KIOSK-SGN-01", location: "Takashimaya D1, HCMC", remainingVolumeMl: 73.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/le-labo-another-13.jpg", status: "ACTIVE" },
    { slotNumber: 16, skuCode: "SKU-MMG-16", name: "Replica By the Fireplace", brand: "Maison Margiela", category: "Unisex", family: "Woody Amber", notes: "Cloves, Chestnut, Guaiac Wood, Vanilla", bottleVolumeMl: 100, pricePerSpray: 14500, retail10ml: 435000, fullBottlePrice: 3650000, kioskCode: "KIOSK-HN-02", location: "Trang Tien Plaza, Hanoi", remainingVolumeMl: 80.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/maison-margiela-by-the-fireplace.jpg", status: "ACTIVE" },
    { slotNumber: 17, skuCode: "SKU-MMG-17", name: "Replica Jazz Club", brand: "Maison Margiela", category: "Men", family: "Leather Woody", notes: "Pink Pepper, Rum Absolute, Tobacco Leaf", bottleVolumeMl: 100, pricePerSpray: 14500, retail10ml: 435000, fullBottlePrice: 3650000, kioskCode: "KIOSK-HN-02", location: "Trang Tien Plaza, Hanoi", remainingVolumeMl: 67.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/maison-margiela-by-the-fireplace.jpg", status: "ACTIVE" },
    { slotNumber: 18, skuCode: "SKU-MCM-18", name: "MCM Eau de Parfum", brand: "MCM Worldwide", category: "Unisex", family: "Floral Woody", notes: "Raspberry, Apricot, White Peony, Ambrox", bottleVolumeMl: 75, pricePerSpray: 12000, retail10ml: 360000, fullBottlePrice: 2650000, kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside, Da Nang", remainingVolumeMl: 66.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/mcm-edp.jpg", status: "ACTIVE" },
    { slotNumber: 19, skuCode: "SKU-MFK-19", name: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", category: "Niche", family: "Oriental Floral", notes: "Saffron, Jasmine, Amberwood, Fir Resin", bottleVolumeMl: 70, pricePerSpray: 21000, retail10ml: 630000, fullBottlePrice: 7900000, kioskCode: "demo-device", location: "Diamond Plaza Atrium, HCMC", remainingVolumeMl: 9.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/mfk-baccarat-rouge-540.jpg", status: "ACTIVE" },
    { slotNumber: 20, skuCode: "SKU-MTB-20", name: "Montblanc Explorer", brand: "Montblanc", category: "Men", family: "Woody Aromatic", notes: "Italian Bergamot, Vetiver, Patchouli", bottleVolumeMl: 100, pricePerSpray: 11500, retail10ml: 345000, fullBottlePrice: 2350000, kioskCode: "KIOSK-SGN-03", location: "Crescent Mall D7, HCMC", remainingVolumeMl: 79.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/montblanc-explorer.jpg", status: "ACTIVE" },
    { slotNumber: 21, skuCode: "SKU-MTB-21", name: "Montblanc Legend", brand: "Montblanc", category: "Men", family: "Aromatic Fougere", notes: "Lavender, Pineapple, Red Apple, Tonka", bottleVolumeMl: 100, pricePerSpray: 11000, retail10ml: 330000, fullBottlePrice: 2200000, kioskCode: "KIOSK-SGN-03", location: "Crescent Mall D7, HCMC", remainingVolumeMl: 85.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/montblanc-legend.jpg", status: "ACTIVE" },
    { slotNumber: 22, skuCode: "SKU-NAR-22", name: "Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", category: "Women", family: "Floral Woody Musk", notes: "Rose, Peach Pulp, Heart of Musc, Amber", bottleVolumeMl: 100, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3350000, kioskCode: "KIOSK-HN-01", location: "Lotte West Lake, Hanoi", remainingVolumeMl: 61.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/narciso-rodriguez-for-her.jpg", status: "ACTIVE" },
    { slotNumber: 23, skuCode: "SKU-NAR-23", name: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", category: "Women", family: "Floral Woody Musk", notes: "Pure Musk, White Flowers, Cashmeran", bottleVolumeMl: 100, pricePerSpray: 13500, retail10ml: 405000, fullBottlePrice: 3450000, kioskCode: "KIOSK-HN-02", location: "Trang Tien Plaza, Hanoi", remainingVolumeMl: 74.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/narciso-rodriguez-pure-musc.jpg", status: "ACTIVE" },
    { slotNumber: 24, skuCode: "SKU-PRB-24", name: "Paco Rabanne 1 Million", brand: "Paco Rabanne", category: "Men", family: "Woody Spicy", notes: "Blood Mandarin, Cinnamon, Leather, Amber", bottleVolumeMl: 100, pricePerSpray: 12500, retail10ml: 375000, fullBottlePrice: 2850000, kioskCode: "KIOSK-SGN-02", location: "Vincom Dong Khoi, HCMC", remainingVolumeMl: 66.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/paco-rabanne-1-million.jpg", status: "ACTIVE" },
    { slotNumber: 25, skuCode: "SKU-PRB-25", name: "Paco Rabanne Invictus", brand: "Paco Rabanne", category: "Men", family: "Woody Aquatic", notes: "Sea Notes, Grapefruit, Bay Leaf, Ambergris", bottleVolumeMl: 100, pricePerSpray: 12500, retail10ml: 375000, fullBottlePrice: 2800000, kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside, Da Nang", remainingVolumeMl: 72.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/paco-rabanne-invictus.jpg", status: "ACTIVE" },
    { slotNumber: 26, skuCode: "SKU-PDM-26", name: "Parfums de Marly Sedley", brand: "Parfums de Marly", category: "Niche", family: "Woody Aromatic", notes: "Spearmint, Bergamot, Lavender, Sandalwood", bottleVolumeMl: 125, pricePerSpray: 18500, retail10ml: 555000, fullBottlePrice: 6400000, kioskCode: "demo-device", location: "Diamond Plaza Atrium, HCMC", remainingVolumeMl: 68.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/parfums-de-marly-sedley.jpg", status: "ACTIVE" },
    { slotNumber: 27, skuCode: "SKU-ROJ-27", name: "Roja Parfums Elysium", brand: "Roja Parfums", category: "Niche", family: "Aromatic Fougere", notes: "Grapefruit, Lime, Vetiver, Ambergris", bottleVolumeMl: 100, pricePerSpray: 22000, retail10ml: 660000, fullBottlePrice: 7600000, kioskCode: "KIOSK-SGN-03", location: "Crescent Mall D7, HCMC", remainingVolumeMl: 11.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/roja-elysium.jpg", status: "ACTIVE" },
    { slotNumber: 28, skuCode: "SKU-TF-28", name: "Tom Ford Black Orchid", brand: "Tom Ford", category: "Unisex", family: "Oriental Chypre", notes: "Black Truffle, Black Orchid, Patchouli", bottleVolumeMl: 100, pricePerSpray: 16000, retail10ml: 480000, fullBottlePrice: 4350000, kioskCode: "KIOSK-HN-02", location: "Trang Tien Plaza, Hanoi", remainingVolumeMl: 48.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/tom-ford-black-orchid.jpg", status: "ACTIVE" },
    { slotNumber: 29, skuCode: "SKU-VAL-29", name: "Valentino Born in Roma", brand: "Valentino", category: "Women", family: "Oriental Floral", notes: "Blackcurrant, Jasmine, Bourbon Vanilla", bottleVolumeMl: 100, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3400000, kioskCode: "KIOSK-SGN-03", location: "Crescent Mall D7, HCMC", remainingVolumeMl: 81.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/valentino-born-in-roma.jpg", status: "ACTIVE" },
    { slotNumber: 30, skuCode: "SKU-VER-30", name: "Versace Bright Crystal", brand: "Versace", category: "Women", family: "Floral Fruity", notes: "Yuzu, Pomegranate, Peony, Lotus", bottleVolumeMl: 90, pricePerSpray: 11500, retail10ml: 345000, fullBottlePrice: 2450000, kioskCode: "KIOSK-004", location: "Aeon Mall Tan Phu, HCMC", remainingVolumeMl: 62.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/versace-bright-crystal.jpg", status: "ACTIVE" },
    { slotNumber: 31, skuCode: "SKU-VER-31", name: "Versace Dylan Blue", brand: "Versace", category: "Men", family: "Aromatic Fougere", notes: "Bergamot, Grapefruit, Ambroxan, Incense", bottleVolumeMl: 100, pricePerSpray: 12000, retail10ml: 360000, fullBottlePrice: 2550000, kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside, Da Nang", remainingVolumeMl: 77.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/versace-dylan-blue.jpg", status: "ACTIVE" },
    { slotNumber: 32, skuCode: "SKU-VER-32", name: "Versace Eros", brand: "Versace", category: "Men", family: "Aromatic Fougere", notes: "Mint Leaves, Green Apple, Tonka Bean", bottleVolumeMl: 100, pricePerSpray: 12500, retail10ml: 375000, fullBottlePrice: 2700000, kioskCode: "KIOSK-SGN-02", location: "Vincom Dong Khoi, HCMC", remainingVolumeMl: 83.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/versace-eros.jpg", status: "ACTIVE" },
    { slotNumber: 33, skuCode: "SKU-YSL-33", name: "YSL Libre Eau de Parfum", brand: "Yves Saint Laurent", category: "Women", family: "Oriental Fougere", notes: "French Lavender, Orange Blossom, Vanilla", bottleVolumeMl: 90, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3750000, kioskCode: "KIOSK-SGN-01", location: "Takashimaya D1, HCMC", remainingVolumeMl: 14.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/ysl-libre.jpg", status: "ACTIVE" },
    { slotNumber: 34, skuCode: "SKU-YSL-34", name: "YSL Y Eau de Parfum", brand: "Yves Saint Laurent", category: "Men", family: "Aromatic Fougere", notes: "Apple, Ginger, Sage, Tonka Bean", bottleVolumeMl: 100, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3700000, kioskCode: "KIOSK-HN-01", location: "Lotte West Lake, Hanoi", remainingVolumeMl: 63.0, lowStockThresholdMl: 15, sprayDurationMs: 1200, image: "/images/ysl-y-edp.jpg", status: "INACTIVE" },
];

const DEFAULT_8_KIOSKS: SyncedKioskUnit[] = [
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

const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

const isExactFragranceMatch = (nameA: string, nameB: string): boolean =>
    nameA.trim().toLowerCase() === nameB.trim().toLowerCase();

const normalizeUserRoleCode = (rawRole?: string): RoleCode => {
    if (!rawRole) return "PSA";
    const r = rawRole.toUpperCase();
    if (r.includes("SUPER") || r === "PSA" || r === "ADMIN") return "PSA";
    if (r.includes("BRAND") || r === "BA") return "BA";
    if (r.includes("OPERATION") || r === "OM" || r.includes("MANAGER")) return "OM";
    if (r.includes("TECH") || r === "TE") return "TE";
    if (r.includes("INVENTORY") || r === "IS" || r.includes("WAREHOUSE")) return "IS";
    if (r.includes("VIEW") || r === "VW") return "VW";
    return "PSA";
};

// Các hàm dịch đầy đủ 100% EN <-> VI cho nhãn trạng thái, danh mục, khoang và địa chỉ
const formatCategoryLabel = (
    cat: "ALL" | "Niche" | "Men" | "Women" | "Unisex",
    lang: "en" | "vi"
): string => {
    if (lang === "en") {
        if (cat === "ALL") return "All";
        return cat;
    }
    switch (cat) {
        case "ALL":
            return "Tất cả";
        case "Niche":
            return "Cao cấp";
        case "Men":
            return "Nam";
        case "Women":
            return "Nữ";
        case "Unisex":
            return "Nam & Nữ";
    }
};

const formatKioskStatusLabel = (
    status: "ONLINE" | "MAINTENANCE" | "OFFLINE",
    lang: "en" | "vi"
): string => {
    if (lang === "en") {
        if (status === "ONLINE") return "Online";
        if (status === "MAINTENANCE") return "Maintenance";
        return "Offline";
    }
    if (status === "ONLINE") return "Sẵn sàng";
    if (status === "MAINTENANCE") return "Bảo trì";
    return "Mất kết nối";
};

const formatOrderStatusLabel = (
    status: OrderLifecycleState,
    lang: "en" | "vi"
): string => {
    const map: Record<OrderLifecycleState, { en: string; vi: string }> = {
        PENDING: { en: "Pending", vi: "Chờ thanh toán" },
        PAID: { en: "Paid", vi: "Đã thanh toán" },
        DISPENSING: { en: "Dispensing", vi: "Đang phun" },
        DISPENSED: { en: "Dispensed", vi: "Hoàn tất" },
        FAILED: { en: "Failed", vi: "Thất bại" },
        UNCERTAIN: { en: "Uncertain", vi: "Chờ đối soát" },
        CANCELLED: { en: "Cancelled", vi: "Đã hủy" },
        EXPIRED: { en: "Expired", vi: "Hết hạn" },
        REFUNDED: { en: "Refunded", vi: "Đã hoàn tiền" },
    };
    return map[status][lang];
};

const formatSlotLabel = (rawSlot: string, lang: "en" | "vi"): string => {
    const cleaned = rawSlot.trim().toUpperCase();
    if (lang === "en") {
        return cleaned.replace("KHOANG", "SLOT");
    }
    return cleaned.replace("SLOT", "KHOANG");
};

const getLocalizedAddress = (kiosk: SyncedKioskUnit, lang: "en" | "vi"): string => {
    if (lang === "en" && kiosk.addressEn) return kiosk.addressEn;
    return kiosk.address;
};

const formatCatalogLocation = (loc: string, lang: "en" | "vi"): string => {
    if (lang === "en") return loc;
    return loc
        .replace("D1, HCMC", "Q.1, TP.HCM")
        .replace("D7, HCMC", "Q.7, TP.HCM")
        .replace("HCMC", "TP.HCM")
        .replace("Hanoi", "Hà Nội")
        .replace("Da Nang", "Đà Nẵng")
        .replace("Vincom Dong Khoi", "Vincom Đồng Khởi")
        .replace("Trang Tien Plaza", "Tràng Tiền Plaza")
        .replace("Aeon Mall Tan Phu", "Aeon Mall Tân Phú");
};

export default function ScentStationLandingPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const isMountedRef = useRef<boolean>(true);
    const isProcessingPaymentRef = useRef<boolean>(false);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const processedWebhookRefs = useRef<Set<string>>(new Set());

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [catalog, setCatalog] = useState<SyncedCatalogItem[]>(DEFAULT_34_CATALOG);
    const [kiosks, setKiosks] = useState<SyncedKioskUnit[]>(DEFAULT_8_KIOSKS);
    const [selectedKioskCode, setSelectedKioskCode] = useState<string>("demo-device");
    const [filterBySelectedKiosk, setFilterBySelectedKiosk] = useState<boolean>(false);
    const [isKioskDropdownOpen, setIsKioskDropdownOpen] = useState<boolean>(false);
    const kioskDropdownRef = useRef<HTMLDivElement | null>(null);

    const [selectedCategory, setSelectedCategory] = useState<"ALL" | "Niche" | "Men" | "Women" | "Unisex">("ALL");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [showAll34, setShowAll34] = useState<boolean>(false);

    const [activeSessionUser, setActiveSessionUser] = useState<{
        fullName: string;
        roleCode: RoleCode;
        brandScope: string | null;
    } | null>(null);

    const [toastState, setToastState] = useState<{ msg: string; variant: ToastVariant } | null>(null);

    const [checkoutItem, setCheckoutItem] = useState<SyncedCatalogItem | null>(null);
    const [checkoutOrderId, setCheckoutOrderId] = useState<string>("");
    const [checkoutPriceSnapshot, setCheckoutPriceSnapshot] = useState<number>(0);
    const [checkoutMethod, setCheckoutMethod] = useState<"VIETQR" | "MOMO" | "VNPAY">("VIETQR");
    const [checkoutStatus, setCheckoutStatus] = useState<OrderLifecycleState>("PENDING");
    const [paymentAttemptError, setPaymentAttemptError] = useState<string | null>(null);
    const [mqttTelemetryStep, setMqttTelemetryStep] = useState<string>("");
    const [checkoutSecondsLeft, setCheckoutSecondsLeft] = useState<number>(120);
    const [autoCloseSeconds, setAutoCloseSeconds] = useState<number>(15);
    const [checkoutErrorReason, setCheckoutErrorReason] = useState<string>("");
    const [showDiagnosticsDrawer, setShowDiagnosticsDrawer] = useState<boolean>(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (kioskDropdownRef.current && !kioskDropdownRef.current.contains(e.target as Node)) {
                setIsKioskDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const clearPendingStepTimers = useCallback(() => {
        stepTimersRef.current.forEach((t) => clearTimeout(t));
        stepTimersRef.current = [];
    }, []);

    const sleepSafe = useCallback((ms: number) => {
        return new Promise<boolean>((resolve) => {
            const t = setTimeout(() => resolve(isMountedRef.current), ms);
            stepTimersRef.current.push(t);
        });
    }, []);

    const triggerToast = useCallback((msg: string, variant: ToastVariant = "success") => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastState({ msg, variant });
        toastTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) setToastState(null);
            toastTimerRef.current = null;
        }, 4200);
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

    const appendAuditLog = useCallback(
        (entry: {
            action: string;
            entityType: string;
            entityId: string;
            brandTenant: string | null;
            oldValues: Record<string, unknown> | null;
            newValues: Record<string, unknown> | null;
        }) => {
            try {
                const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const logs = rawLogs ? JSON.parse(rawLogs) : [];
                logs.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: new Date().toISOString(),
                    actor: activeSessionUser?.fullName || (lang === "en" ? "Kiosk Customer" : "Khách Kiosk"),
                    role: activeSessionUser?.roleCode || "CU",
                    tenant: entry.brandTenant,
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    oldValues: entry.oldValues,
                    newValues: entry.newValues,
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));
            } catch {
                // Ignore
            }
        },
        [activeSessionUser, lang]
    );

    const upsertOrderAndAlertsToStorage = useCallback(
        (payload: {
            id: string;
            time: string;
            kiosk: string;
            slotNumber: number;
            brand: string;
            product: string;
            priceSnapshot: number;
            amount: number;
            paidAmount: number;
            paymentMethod: string;
            providerReference: string;
            status: OrderLifecycleState;
            commandReference?: string;
            idempotencyKey?: string;
            signature?: string;
            ackedAt?: string | null;
            executedAt?: string | null;
            failureReason?: string | null;
            requiresHumanReview?: boolean;
            lowStockAlertToRaise?: {
                kioskCode: string;
                brand: string;
                product: string;
                slotNumber: number;
                remainingMl: number;
                thresholdMl: number;
            } | null;
        }) => {
            try {
                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                const dashData = rawDash
                    ? JSON.parse(rawDash)
                    : { transactions: [], incidents: [], alerts: [] };
                if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                if (!Array.isArray(dashData.incidents)) dashData.incidents = [];
                if (!Array.isArray(dashData.alerts)) dashData.alerts = [];

                const existingIdx = dashData.transactions.findIndex((tx: any) => tx.id === payload.id);
                if (existingIdx >= 0) {
                    dashData.transactions[existingIdx] = {
                        ...dashData.transactions[existingIdx],
                        ...payload,
                        updatedAt: new Date().toISOString(),
                    };
                } else {
                    dashData.transactions.unshift({
                        ...payload,
                        createdAt: new Date().toISOString(),
                    });
                }

                if (payload.requiresHumanReview) {
                    const hasIncident = dashData.incidents.some((inc: any) => inc.orderId === payload.id);
                    if (!hasIncident) {
                        dashData.incidents.unshift({
                            incidentId: `INC-2026-${Math.floor(1000 + Math.random() * 8999)}`,
                            orderId: payload.id,
                            kioskCode: payload.kiosk,
                            brand: payload.brand,
                            product: payload.product,
                            paidAmount: payload.paidAmount,
                            orderState: payload.status,
                            severity: payload.status === "UNCERTAIN" ? "HIGH" : "CRITICAL",
                            status: "OPEN_FOR_OM_REVIEW",
                            reason:
                                payload.failureReason ||
                                (lang === "en"
                                    ? "Unconfirmed dispense result from machine"
                                    : "Chưa xác nhận kết quả xịt từ máy"),
                            createdAt: new Date().toISOString(),
                        });
                    }
                }

                if (payload.lowStockAlertToRaise) {
                    const al = payload.lowStockAlertToRaise;
                    const alertType = al.remainingMl < 0.12 ? "SLOT_EMPTY" : "LOW_STOCK";
                    const duplicateOpenAlert = dashData.alerts.find(
                        (existing: any) =>
                            existing.machineId === al.kioskCode &&
                            existing.slotNumber === al.slotNumber &&
                            existing.alertType === alertType &&
                            existing.status !== "RESOLVED"
                    );

                    if (duplicateOpenAlert) {
                        duplicateOpenAlert.remainingMl = al.remainingMl;
                        duplicateOpenAlert.updatedAt = new Date().toISOString();
                    } else {
                        dashData.alerts.unshift({
                            id: `ALT-2026-${Math.floor(1000 + Math.random() * 8999)}`,
                            timestamp: new Date().toISOString(),
                            machineId: al.kioskCode,
                            slotNumber: al.slotNumber,
                            brand: al.brand,
                            product: al.product,
                            alertType,
                            category: "Inventory Alerts",
                            severity: al.remainingMl < 0.12 ? "CRITICAL" : "HIGH",
                            status: "OPEN",
                            remainingMl: al.remainingMl,
                            thresholdMl: al.thresholdMl,
                            description:
                                al.remainingMl < 0.12
                                    ? lang === "en"
                                        ? `Slot 0${al.slotNumber} (${al.product}) is empty (${al.remainingMl}ml). Slot locked.`
                                        : `Khoang 0${al.slotNumber} (${al.product}) đã cạn (${al.remainingMl}ml). Đã khóa khoang.`
                                    : lang === "en"
                                        ? `Slot 0${al.slotNumber} (${al.product}) is below threshold (${al.remainingMl}ml / ${al.thresholdMl}ml). Refill needed.`
                                        : `Khoang 0${al.slotNumber} (${al.product}) dưới ngưỡng (${al.remainingMl}ml / ${al.thresholdMl}ml). Cần nạp.`,
                        });
                    }
                }

                dashData.lastUpdatedAt = new Date().toISOString();
                localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));
            } catch {
                // Ignore
            }
        },
        [lang]
    );

    const handleSelectPaymentMethod = useCallback(
        (method: "VIETQR" | "MOMO" | "VNPAY") => {
            setCheckoutMethod(method);
            if (checkoutItem && checkoutStatus === "PENDING" && checkoutOrderId) {
                upsertOrderAndAlertsToStorage({
                    id: checkoutOrderId,
                    time: lang === "en" ? `Awaiting ${method}` : `Chờ thanh toán ${method}`,
                    kiosk: checkoutItem.kioskCode,
                    slotNumber: checkoutItem.slotNumber,
                    brand: checkoutItem.brand,
                    product: checkoutItem.name,
                    priceSnapshot: checkoutPriceSnapshot,
                    amount: 0,
                    paidAmount: 0,
                    paymentMethod: method,
                    providerReference: `QR-${method}-${checkoutOrderId}`,
                    status: "PENDING",
                    requiresHumanReview: false,
                });
            }
        },
        [checkoutItem, checkoutOrderId, checkoutPriceSnapshot, checkoutStatus, lang, upsertOrderAndAlertsToStorage]
    );

    const handlePortalNavigation = useCallback(
        (targetPath: string) => {
            if (targetPath === "/login" || targetPath.startsWith("/kiosk")) {
                router.push(targetPath);
                return;
            }
            if (!activeSessionUser) {
                router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
                return;
            }

            const [pathWithoutQuery, queryString] = targetPath.split("?");
            const baseRoute = "/" + pathWithoutQuery.split("/").filter(Boolean)[0];
            const allowedRoles = ROLE_ACCESS_MAP[baseRoute];

            if (activeSessionUser.roleCode === "VW" && allowedRoles && !allowedRoles.includes("VW")) {
                triggerToast(
                    lang === "en"
                        ? "Read-only role: Redirecting to Reports."
                        : "Tài khoản chỉ xem: Chuyển sang trang Báo cáo.",
                    "warning"
                );
                router.push("/reports");
                return;
            }

            if (allowedRoles && !allowedRoles.includes(activeSessionUser.roleCode)) {
                triggerToast(
                    lang === "en"
                        ? `Role ${activeSessionUser.roleCode} cannot access ${baseRoute}.`
                        : `Vai trò ${activeSessionUser.roleCode} không có quyền vào ${baseRoute}.`,
                    "error"
                );
                appendAuditLog({
                    action: "UNAUTHORIZED_ACCESS_BLOCKED",
                    entityType: "SCREEN_ROUTE",
                    entityId: targetPath,
                    brandTenant: activeSessionUser.brandScope,
                    oldValues: null,
                    newValues: { role: activeSessionUser.roleCode, attemptedRoute: targetPath },
                });
                return;
            }

            if (activeSessionUser.brandScope && activeSessionUser.roleCode !== "PSA") {
                const params = new URLSearchParams(queryString || "");
                if (!params.has("brand")) params.set("brand", activeSessionUser.brandScope);
                router.push(`${pathWithoutQuery}?${params.toString()}`);
                return;
            }

            router.push(targetPath);
        },
        [activeSessionUser, appendAuditLog, lang, router, triggerToast]
    );

    const loadAndSyncStorageData = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            const savedUserRaw =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (savedUserRaw) {
                const parsedUser = JSON.parse(savedUserRaw);
                setActiveSessionUser({
                    fullName: parsedUser.fullName || parsedUser.name || parsedUser.email || "Portal User",
                    roleCode: normalizeUserRoleCode(parsedUser.roleCode || parsedUser.role || parsedUser.roles?.[0]),
                    brandScope: parsedUser.brand || parsedUser.brandScope || null,
                });
            } else {
                setActiveSessionUser(null);
            }

            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            const productStatusMap = new Map<string, "ACTIVE" | "INACTIVE" | "DRAFT">();
            const productPriceMap = new Map<string, number>();
            const productCapacityMap = new Map<string, number>();
            let parsedProds: any[] = [];

            if (rawProds) {
                try {
                    const parsed = JSON.parse(rawProds);
                    if (Array.isArray(parsed)) {
                        parsedProds = parsed;
                        parsed.forEach((p: any) => {
                            if (p && p.name) {
                                const pKey = String(p.name).trim().toLowerCase();
                                if (p.status) productStatusMap.set(pKey, p.status);
                                if (typeof p.pricePerSpray === "number") productPriceMap.set(pKey, Number(p.pricePerSpray));
                                if (typeof p.bottleVolumeMl === "number") productCapacityMap.set(pKey, Number(p.bottleVolumeMl));
                            }
                        });
                    }
                } catch {
                    parsedProds = [];
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};

            parsedProds.forEach((p: any) => {
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

            let currentKiosks: SyncedKioskUnit[] = DEFAULT_8_KIOSKS;
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines) && parsedMachines.length > 0) {
                    currentKiosks = parsedMachines.map((m: any) => {
                        const seedMatch = DEFAULT_8_KIOSKS.find(
                            (sk) => sk.code.toLowerCase() === String(m.code || m.id || "").toLowerCase()
                        );
                        const conn = m.connectionStatus || (m.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                        const oper =
                            m.operatingStatus ||
                            (m.status === "MAINTENANCE" ? "MAINTENANCE" : m.status === "OFFLINE" ? "ERROR" : "ACTIVE");
                        const unifiedStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" =
                            conn === "OFFLINE" ? "OFFLINE" : oper === "MAINTENANCE" ? "MAINTENANCE" : oper === "ACTIVE" ? "ONLINE" : "OFFLINE";
                        const kCode = String(m.code || m.id || "").toLowerCase();

                        return {
                            ...m,
                            addressEn: m.addressEn || seedMatch?.addressEn,
                            status: unifiedStatus,
                            connectionStatus: conn,
                            operatingStatus: oper,
                            doorOpen: Boolean(m.doorOpen),
                            leakDetected: Boolean(m.leakDetected),
                            slots: Array.isArray(m.slots)
                                ? m.slots.map((sl: any) => {
                                    const fKey = String(sl.fragranceName || "").trim().toLowerCase();
                                    const st = productStatusMap.get(fKey) || sl.productStatus || "ACTIVE";
                                    const latestMl =
                                        typeof perKioskMatrix[kCode]?.[fKey] === "number"
                                            ? perKioskMatrix[kCode][fKey]
                                            : Number(sl.remainingMl);
                                    const latestCap = productCapacityMap.get(fKey) || Number(sl.capacityMl || 100);
                                    const latestPrice = productPriceMap.get(fKey);
                                    return {
                                        ...sl,
                                        remainingMl: latestMl,
                                        capacityMl: latestCap,
                                        productStatus: st,
                                        pricePerSpray: latestPrice,
                                    };
                                })
                                : [],
                        };
                    });
                    setKiosks(currentKiosks);
                }
            } else {
                localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(DEFAULT_8_KIOSKS));
            }

            let baseCatalog: SyncedCatalogItem[] = DEFAULT_34_CATALOG;
            if (parsedProds.length > 0) {
                baseCatalog = DEFAULT_34_CATALOG.map((defaultItem) => {
                    const savedProd = parsedProds.find(
                        (p: any) =>
                            p.slotNumber === defaultItem.slotNumber ||
                            p.skuCode === defaultItem.skuCode ||
                            isExactFragranceMatch(p.name || "", defaultItem.name)
                    );
                    if (!savedProd) return defaultItem;

                    const assignedList: AssignedStationMeta[] = Array.isArray(savedProd.assignedMachines)
                        ? savedProd.assignedMachines.map((am: any) => ({
                            kioskCode: am.kioskCode || defaultItem.kioskCode,
                            location: am.location || defaultItem.location,
                            slotNumber: Number(am.slotNumber || 1),
                            physicalSlotLabel: am.physicalSlotLabel || `Slot 0${am.slotNumber || 1}`,
                            remainingVolumeMl: Number(am.remainingVolumeMl ?? defaultItem.remainingVolumeMl),
                        }))
                        : [];

                    const primaryAssigned = assignedList.length > 0 ? assignedList[0] : null;

                    return {
                        ...defaultItem,
                        name: savedProd.name || defaultItem.name,
                        brand: savedProd.brand || defaultItem.brand,
                        category: savedProd.category || defaultItem.category,
                        family: savedProd.family || defaultItem.family,
                        notes: savedProd.notes || defaultItem.notes,
                        bottleVolumeMl: Number(savedProd.bottleVolumeMl ?? defaultItem.bottleVolumeMl),
                        pricePerSpray: Number(savedProd.pricePerSpray ?? defaultItem.pricePerSpray),
                        retail10ml: Number(savedProd.pricePerSpray ?? defaultItem.pricePerSpray) * 30,
                        kioskCode: primaryAssigned?.kioskCode || defaultItem.kioskCode,
                        location: primaryAssigned?.location || defaultItem.location,
                        physicalSlotLabel: primaryAssigned?.physicalSlotLabel,
                        remainingVolumeMl: Number(
                            primaryAssigned?.remainingVolumeMl ?? savedProd.remainingVolumeMl ?? defaultItem.remainingVolumeMl
                        ),
                        lowStockThresholdMl: Number(savedProd.lowStockThresholdMl ?? defaultItem.lowStockThresholdMl),
                        status: savedProd.status || defaultItem.status || "ACTIVE",
                        image: savedProd.image || defaultItem.image,
                        assignedMachines: assignedList,
                    };
                });

                const customAdded = parsedProds.filter(
                    (p: any) =>
                        p &&
                        p.name &&
                        !DEFAULT_34_CATALOG.some(
                            (d) =>
                                d.slotNumber === p.slotNumber ||
                                d.skuCode === p.skuCode ||
                                isExactFragranceMatch(d.name, p.name)
                        )
                );
                customAdded.forEach((customP: any, idx: number) => {
                    const assignedList: AssignedStationMeta[] = Array.isArray(customP.assignedMachines)
                        ? customP.assignedMachines.map((am: any) => ({
                            kioskCode: am.kioskCode || "demo-device",
                            location: am.location || "Diamond Plaza Atrium, HCMC",
                            slotNumber: Number(am.slotNumber || 4),
                            physicalSlotLabel: am.physicalSlotLabel || `Slot 0${am.slotNumber || 4}`,
                            remainingVolumeMl: Number(am.remainingVolumeMl ?? customP.bottleVolumeMl ?? 100),
                        }))
                        : [];
                    const primaryAssigned = assignedList.length > 0 ? assignedList[0] : null;

                    baseCatalog.unshift({
                        slotNumber: Number(customP.slotNumber || 35 + idx),
                        skuCode: customP.skuCode || `SKU-NEW-${35 + idx}`,
                        name: customP.name,
                        brand: customP.brand || "Brand",
                        category: customP.category || "Unisex",
                        family: customP.family || "Perfume",
                        notes: customP.notes || "Bergamot, Amber, Musk",
                        bottleVolumeMl: Number(customP.bottleVolumeMl || 100),
                        pricePerSpray: Number(customP.pricePerSpray || 15000),
                        retail10ml: Number(customP.pricePerSpray || 15000) * 30,
                        fullBottlePrice: Number(customP.pricePerSpray || 15000) * 240,
                        kioskCode: primaryAssigned?.kioskCode || "demo-device",
                        location: primaryAssigned?.location || "Diamond Plaza Atrium, HCMC",
                        physicalSlotLabel: primaryAssigned?.physicalSlotLabel || "Slot 04",
                        remainingVolumeMl: Number(primaryAssigned?.remainingVolumeMl ?? customP.bottleVolumeMl ?? 100),
                        lowStockThresholdMl: 15,
                        sprayDurationMs: 1200,
                        image: customP.image || "/images/dior-sauvage.jpg",
                        status: customP.status || "ACTIVE",
                        assignedMachines: assignedList,
                    });
                });

                baseCatalog = baseCatalog.filter((item) => {
                    const savedProd = parsedProds.find((p: any) => isExactFragranceMatch(p.name || "", item.name));
                    const hasAssignedMachine =
                        !savedProd || !Array.isArray(savedProd.assignedMachines) || savedProd.assignedMachines.length > 0;
                    return (!item.status || item.status === "ACTIVE") && hasAssignedMachine;
                });
            } else {
                baseCatalog = DEFAULT_34_CATALOG.filter((item) => !item.status || item.status === "ACTIVE");
            }

            const syncedCatalog = baseCatalog.map((item) => {
                const kKey = item.kioskCode.toLowerCase();
                const pKey = item.name.trim().toLowerCase();
                const matrixMl = perKioskMatrix[kKey]?.[pKey];
                const kioskUnit = currentKiosks.find((k) => k.code.toLowerCase() === kKey);
                const matchedSlot = kioskUnit?.slots.find((sl) => isExactFragranceMatch(sl.fragranceName, item.name));
                const finalMl =
                    typeof matrixMl === "number"
                        ? matrixMl
                        : matchedSlot
                            ? Number(matchedSlot.remainingMl)
                            : item.remainingVolumeMl;
                return { ...item, remainingVolumeMl: finalMl };
            });
            setCatalog(syncedCatalog);
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        loadAndSyncStorageData();

        const handleCrossTabSync = () => loadAndSyncStorageData();
        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const liveSyncTimer = setInterval(() => loadAndSyncStorageData(), 2000);
        return () => {
            isMountedRef.current = false;
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(liveSyncTimer);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            clearPendingStepTimers();
        };
    }, [clearPendingStepTimers, loadAndSyncStorageData]);

    useEffect(() => {
        if (!checkoutItem) {
            document.body.style.overflow = "";
            return;
        }
        document.body.style.overflow = "hidden";
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && checkoutStatus !== "PAID" && checkoutStatus !== "DISPENSING") {
                setCheckoutItem(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [checkoutItem, checkoutStatus]);

    useEffect(() => {
        if (!checkoutItem || checkoutStatus !== "PENDING") return;
        if (checkoutSecondsLeft <= 0) {
            setCheckoutStatus("EXPIRED");
            setCheckoutErrorReason(
                lang === "en"
                    ? `Order ${checkoutOrderId} expired (120s). No charge made.`
                    : `Đơn ${checkoutOrderId} đã hết hạn (120s). Không trừ tiền.`
            );
            upsertOrderAndAlertsToStorage({
                id: checkoutOrderId,
                time: lang === "en" ? "Expired (120s)" : "Hết hạn (120s)",
                kiosk: checkoutItem.kioskCode,
                slotNumber: checkoutItem.slotNumber,
                brand: checkoutItem.brand,
                product: checkoutItem.name,
                priceSnapshot: checkoutPriceSnapshot,
                amount: 0,
                paidAmount: 0,
                paymentMethod: checkoutMethod,
                providerReference: `PENDING-${checkoutOrderId}`,
                status: "EXPIRED",
                failureReason: "ORDER_PAYMENT_TIMEOUT_EXPIRED",
                requiresHumanReview: false,
            });
            return;
        }
        const timer = setInterval(() => setCheckoutSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(timer);
    }, [
        checkoutItem,
        checkoutStatus,
        checkoutSecondsLeft,
        checkoutOrderId,
        checkoutPriceSnapshot,
        checkoutMethod,
        lang,
        upsertOrderAndAlertsToStorage,
    ]);

    useEffect(() => {
        if (!checkoutItem || checkoutStatus !== "DISPENSED") {
            setAutoCloseSeconds(15);
            return;
        }
        if (autoCloseSeconds <= 0) {
            setCheckoutItem(null);
            return;
        }
        const timer = setInterval(() => setAutoCloseSeconds((prev) => Math.max(0, prev - 1)), 1000);
        return () => clearInterval(timer);
    }, [checkoutItem, checkoutStatus, autoCloseSeconds]);

    const getKioskReadiness = useCallback(
        (kioskCode: string) => {
            const kObj = kiosks.find((k) => k.code.toLowerCase() === kioskCode.toLowerCase());
            if (!kObj) return { ready: true, label: lang === "en" ? "Ready" : "Sẵn sàng", kiosk: undefined };
            if (kObj.connectionStatus !== "ONLINE" || kObj.status === "OFFLINE") {
                return { ready: false, label: lang === "en" ? "Offline" : "Mất kết nối", kiosk: kObj };
            }
            if (kObj.operatingStatus === "MAINTENANCE" || kObj.status === "MAINTENANCE") {
                return { ready: false, label: lang === "en" ? "Maintenance" : "Bảo trì", kiosk: kObj };
            }
            if (kObj.operatingStatus !== "ACTIVE" || kObj.doorOpen || kObj.leakDetected) {
                return { ready: false, label: lang === "en" ? "Safety Lock" : "Khóa an toàn", kiosk: kObj };
            }
            return { ready: true, label: lang === "en" ? "Ready" : "Sẵn sàng", kiosk: kObj };
        },
        [kiosks, lang]
    );

    const getPhysicalSlotLabel = useCallback(
        (kioskCode: string, perfumeName: string, fallbackIndex: number): string => {
            const kObj = kiosks.find((k) => k.code.toLowerCase() === kioskCode.toLowerCase());
            const matchedSlot = kObj?.slots.find((sl) => isExactFragranceMatch(sl.fragranceName, perfumeName));
            const raw = matchedSlot ? matchedSlot.slotLabel : `Slot 0${((fallbackIndex - 1) % 4) + 1}`;
            return formatSlotLabel(raw, lang);
        },
        [kiosks, lang]
    );

    const unique21Brands = useMemo(
        () => Array.from(new Set(catalog.map((item) => item.brand))).sort(),
        [catalog]
    );

    const activeKiosk = useMemo(
        () => kiosks.find((k) => k.code === selectedKioskCode) || kiosks[0],
        [kiosks, selectedKioskCode]
    );

    const onlineKiosksCount = useMemo(
        () => kiosks.filter((k) => k.connectionStatus === "ONLINE" && k.operatingStatus === "ACTIVE").length,
        [kiosks]
    );

    const fleetTotalSprays = useMemo(
        () => kiosks.reduce((sum, k) => sum + (k.todaySprays || 0), 0),
        [kiosks]
    );

    const fleetTotalRevenue = useMemo(
        () => kiosks.reduce((sum, k) => sum + (k.todayRevenue || 0), 0),
        [kiosks]
    );

    const baseScopedPerfumes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const selKioskLower = selectedKioskCode.toLowerCase();

        return catalog
            .map((item) => {
                const matchOnSelectedKiosk = item.assignedMachines?.find(
                    (am) => am.kioskCode.toLowerCase() === selKioskLower
                );
                if (matchOnSelectedKiosk) {
                    return {
                        ...item,
                        kioskCode: matchOnSelectedKiosk.kioskCode,
                        location: matchOnSelectedKiosk.location,
                        physicalSlotLabel: matchOnSelectedKiosk.physicalSlotLabel,
                        remainingVolumeMl: matchOnSelectedKiosk.remainingVolumeMl,
                    };
                }
                return item;
            })
            .filter((item) => {
                const matchBrand = selectedBrand === "ALL" || item.brand === selectedBrand;
                const isInstalledOnSelectedKiosk =
                    item.kioskCode.toLowerCase() === selKioskLower ||
                    Boolean(item.assignedMachines?.some((am) => am.kioskCode.toLowerCase() === selKioskLower));
                const matchKiosk = !filterBySelectedKiosk || isInstalledOnSelectedKiosk;
                const matchSearch =
                    !q ||
                    item.name.toLowerCase().includes(q) ||
                    item.skuCode.toLowerCase().includes(q) ||
                    item.brand.toLowerCase().includes(q) ||
                    item.notes.toLowerCase().includes(q) ||
                    item.location.toLowerCase().includes(q) ||
                    item.kioskCode.toLowerCase().includes(q);
                return matchBrand && matchKiosk && matchSearch;
            });
    }, [catalog, selectedBrand, filterBySelectedKiosk, selectedKioskCode, searchQuery]);

    const categoryCounts = useMemo(() => {
        return {
            ALL: baseScopedPerfumes.length,
            Niche: baseScopedPerfumes.filter((i) => i.category === "Niche").length,
            Men: baseScopedPerfumes.filter((i) => i.category === "Men").length,
            Women: baseScopedPerfumes.filter((i) => i.category === "Women").length,
            Unisex: baseScopedPerfumes.filter((i) => i.category === "Unisex").length,
        };
    }, [baseScopedPerfumes]);

    const totalMatchedPerfumes = useMemo(() => {
        if (selectedCategory === "ALL") return baseScopedPerfumes;
        return baseScopedPerfumes.filter((item) => item.category === selectedCategory);
    }, [baseScopedPerfumes, selectedCategory]);

    const isAutoExpanded =
        showAll34 ||
        selectedCategory !== "ALL" ||
        selectedBrand !== "ALL" ||
        filterBySelectedKiosk ||
        searchQuery.trim() !== "";

    const filteredPerfumes = useMemo(() => {
        return isAutoExpanded ? totalMatchedPerfumes : totalMatchedPerfumes.slice(0, 12);
    }, [isAutoExpanded, totalMatchedPerfumes]);

    const handleOpenPaymentGateway = (prod: SyncedCatalogItem, targetKioskCode?: string) => {
        const kioskCode = targetKioskCode || prod.kioskCode;
        const readiness = getKioskReadiness(kioskCode);

        if (!readiness.ready && readiness.kiosk) {
            triggerToast(
                lang === "en"
                    ? `${readiness.kiosk.locationName} is ${readiness.label.toLowerCase()}.`
                    : `${readiness.kiosk.locationName} hiện đang ${readiness.label.toLowerCase()}.`,
                "error"
            );
            return;
        }

        const targetSlot = readiness.kiosk?.slots.find((sl) => isExactFragranceMatch(sl.fragranceName, prod.name));
        if (
            (prod.status && prod.status !== "ACTIVE") ||
            (targetSlot?.productStatus && targetSlot.productStatus !== "ACTIVE")
        ) {
            triggerToast(
                lang === "en" ? `${prod.name} is inactive.` : `${prod.name} đang tạm ngưng.`,
                "warning"
            );
            return;
        }

        const assignedOnTarget = prod.assignedMachines?.find(
            (am) => am.kioskCode.toLowerCase() === kioskCode.toLowerCase()
        );
        const availableMl = targetSlot
            ? targetSlot.remainingMl
            : assignedOnTarget
                ? assignedOnTarget.remainingVolumeMl
                : prod.remainingVolumeMl;

        if (availableMl < 0.12) {
            triggerToast(
                lang === "en" ? `${prod.name} has insufficient volume (< 0.12ml).` : `${prod.name} không đủ dung tích (< 0.12ml).`,
                "error"
            );
            return;
        }

        const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
        clearPendingStepTimers();

        setCheckoutItem({
            ...prod,
            kioskCode,
            location: readiness.kiosk?.locationName || prod.location,
            remainingVolumeMl: availableMl,
        });
        setCheckoutOrderId(newOrderId);
        setCheckoutPriceSnapshot(prod.pricePerSpray);
        setCheckoutMethod("VIETQR");
        setCheckoutStatus("PENDING");
        setPaymentAttemptError(null);
        setMqttTelemetryStep("");
        setCheckoutSecondsLeft(120);
        setAutoCloseSeconds(15);
        setCheckoutErrorReason("");
        setShowDiagnosticsDrawer(false);

        upsertOrderAndAlertsToStorage({
            id: newOrderId,
            time: lang === "en" ? "Awaiting VIETQR" : "Chờ thanh toán VIETQR",
            kiosk: kioskCode,
            slotNumber: prod.slotNumber,
            brand: prod.brand,
            product: prod.name,
            priceSnapshot: prod.pricePerSpray,
            amount: 0,
            paidAmount: 0,
            paymentMethod: "VIETQR",
            providerReference: `QR-VIETQR-${newOrderId}`,
            status: "PENDING",
            requiresHumanReview: false,
        });
    };

    const handleProcessOrderScenario = async (
        scenario:
            | "WEBHOOK_PAID_AND_DISPENSED"
            | "PAYMENT_ATTEMPT_FAILED"
            | "CUSTOMER_CANCEL"
            | "SAFETY_INTERLOCK_FAILED_AFTER_PAID"
            | "DEVICE_TIMEOUT_UNCERTAIN"
    ) => {
        if (!checkoutItem || isProcessingPaymentRef.current) return;
        isProcessingPaymentRef.current = true;

        try {
            if (scenario === "CUSTOMER_CANCEL") {
                setCheckoutStatus("CANCELLED");
                setPaymentAttemptError(null);
                setCheckoutErrorReason(
                    lang === "en"
                        ? `Order ${checkoutOrderId} cancelled before payment.`
                        : `Đơn ${checkoutOrderId} đã hủy trước khi thanh toán.`
                );
                upsertOrderAndAlertsToStorage({
                    id: checkoutOrderId,
                    time: lang === "en" ? "Cancelled" : "Đã hủy",
                    kiosk: checkoutItem.kioskCode,
                    slotNumber: checkoutItem.slotNumber,
                    brand: checkoutItem.brand,
                    product: checkoutItem.name,
                    priceSnapshot: checkoutPriceSnapshot,
                    amount: 0,
                    paidAmount: 0,
                    paymentMethod: checkoutMethod,
                    providerReference: `CANCEL-${checkoutOrderId}`,
                    status: "CANCELLED",
                    failureReason: "CUSTOMER_CANCELLED_BEFORE_PAYMENT",
                    requiresHumanReview: false,
                });
                triggerToast(lang === "en" ? `Cancelled ${checkoutOrderId}.` : `Đã hủy ${checkoutOrderId}.`, "warning");
                return;
            }

            if (scenario === "PAYMENT_ATTEMPT_FAILED") {
                setPaymentAttemptError(
                    lang === "en"
                        ? `Payment via ${checkoutMethod} failed. Order stays open for retry before timeout.`
                        : `Thanh toán ${checkoutMethod} thất bại. Có thể quét lại trước khi hết giờ.`
                );
                return;
            }

            const providerRef = `PAY-${checkoutMethod}-${checkoutOrderId}`;
            if (processedWebhookRefs.current.has(providerRef)) return;
            processedWebhookRefs.current.add(providerRef);
            setPaymentAttemptError(null);

            setCheckoutStatus("PAID");
            setMqttTelemetryStep(
                lang === "en" ? `Verified (${providerRef}). Sending command...` : `Đã thanh toán (${providerRef}). Đang gửi lệnh...`
            );

            if (!(await sleepSafe(650))) return;

            const cmdUuid = `CMD-${checkoutOrderId}`;
            const idempotencyKey = `IDEMP-${checkoutOrderId}-SLOT0${checkoutItem.slotNumber}`;
            const hmacSignature = `HMAC_SHA256_${btoa(
                `${cmdUuid}|${checkoutItem.kioskCode}|${checkoutItem.slotNumber}|${checkoutPriceSnapshot}`
            ).slice(0, 24)}`;

            setCheckoutStatus("DISPENSING");
            setMqttTelemetryStep(
                lang === "en"
                    ? `Dispensing 0.12ml (${checkoutItem.sprayDurationMs}ms)...`
                    : `Đang phun 0.12ml (${checkoutItem.sprayDurationMs}ms)...`
            );

            if (!(await sleepSafe(750))) return;

            const readinessNow = getKioskReadiness(checkoutItem.kioskCode);

            if (scenario === "SAFETY_INTERLOCK_FAILED_AFTER_PAID" || !readinessNow.ready) {
                setCheckoutStatus("FAILED");
                setCheckoutErrorReason(
                    lang === "en"
                        ? `Safety interlock blocked spray on ${checkoutItem.kioskCode}. Order ${checkoutOrderId} logged for OM review & refund.`
                        : `Khóa an toàn chặn phun trên ${checkoutItem.kioskCode}. Đơn ${checkoutOrderId} đã chuyển OM rà soát hoàn tiền.`
                );
                upsertOrderAndAlertsToStorage({
                    id: checkoutOrderId,
                    time: lang === "en" ? "Hardware fault after payment" : "Lỗi phần cứng sau thanh toán",
                    kiosk: checkoutItem.kioskCode,
                    slotNumber: checkoutItem.slotNumber,
                    brand: checkoutItem.brand,
                    product: checkoutItem.name,
                    priceSnapshot: checkoutPriceSnapshot,
                    amount: 0,
                    paidAmount: checkoutPriceSnapshot,
                    paymentMethod: checkoutMethod,
                    providerReference: providerRef,
                    status: "FAILED",
                    commandReference: cmdUuid,
                    idempotencyKey,
                    signature: hmacSignature,
                    ackedAt: new Date().toISOString(),
                    executedAt: null,
                    failureReason: "SAFETY_INTERLOCK_REJECTED",
                    requiresHumanReview: true,
                });
                triggerToast(lang === "en" ? `Dispense failed. Logged for review.` : `Lỗi phun. Đã ghi nhận để đối soát.`, "error");
                return;
            }

            if (scenario === "DEVICE_TIMEOUT_UNCERTAIN") {
                setCheckoutStatus("UNCERTAIN");
                setCheckoutErrorReason(
                    lang === "en"
                        ? `Device timed out after ACK (${cmdUuid}). No auto-retry to avoid double spray. Held for OM verification.`
                        : `Máy quá hạn phản hồi sau khi nhận lệnh (${cmdUuid}). Không tự xịt lại để tránh xịt lặp; giữ trạng thái chờ OM đối soát.`
                );
                upsertOrderAndAlertsToStorage({
                    id: checkoutOrderId,
                    time: lang === "en" ? "Unconfirmed result" : "Chưa xác nhận kết quả",
                    kiosk: checkoutItem.kioskCode,
                    slotNumber: checkoutItem.slotNumber,
                    brand: checkoutItem.brand,
                    product: checkoutItem.name,
                    priceSnapshot: checkoutPriceSnapshot,
                    amount: 0,
                    paidAmount: checkoutPriceSnapshot,
                    paymentMethod: checkoutMethod,
                    providerReference: providerRef,
                    status: "UNCERTAIN",
                    commandReference: cmdUuid,
                    idempotencyKey,
                    signature: hmacSignature,
                    ackedAt: new Date().toISOString(),
                    executedAt: null,
                    failureReason: "MQTT_RESULT_TIMEOUT_UNCERTAIN",
                    requiresHumanReview: true,
                });
                triggerToast(lang === "en" ? `Result uncertain. Logged for OM.` : `Kết quả chưa xác nhận. Đã chuyển đối soát.`, "warning");
                return;
            }

            const price = checkoutPriceSnapshot;
            const kioskCode = checkoutItem.kioskCode;
            const kKey = kioskCode.toLowerCase();
            const perfumeName = checkoutItem.name;
            const pKey = perfumeName.trim().toLowerCase();
            const qtyBefore = checkoutItem.remainingVolumeMl;
            const qtyAfter = Number(Math.max(0, qtyBefore - 0.12).toFixed(2));
            const thresholdMl = checkoutItem.lowStockThresholdMl || 15;

            const updatedKiosks = kiosks.map((k) => {
                if (k.code.toLowerCase() !== kKey) return k;
                return {
                    ...k,
                    todaySprays: (k.todaySprays || 0) + 1,
                    todayRevenue: (k.todayRevenue || 0) + price,
                    slots: k.slots.map((sl) =>
                        isExactFragranceMatch(sl.fragranceName, perfumeName) ? { ...sl, remainingMl: qtyAfter } : sl
                    ),
                };
            });
            setKiosks(updatedKiosks);
            localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedKiosks));

            try {
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
                if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                perKioskMatrix[kKey][pKey] = qtyAfter;
                localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));
            } catch {
                // Safe fallback
            }

            const updatedCatalog = catalog.map((c) => {
                if (!isExactFragranceMatch(c.name, perfumeName)) return c;
                return {
                    ...c,
                    remainingVolumeMl: c.kioskCode.toLowerCase() === kKey ? qtyAfter : c.remainingVolumeMl,
                    assignedMachines: c.assignedMachines?.map((am) =>
                        am.kioskCode.toLowerCase() === kKey ? { ...am, remainingVolumeMl: qtyAfter } : am
                    ),
                };
            });
            setCatalog(updatedCatalog);

            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds)) {
                    const syncedProds = parsedProds.map((p: any) => {
                        if (!isExactFragranceMatch(p.name || "", perfumeName)) return p;
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
                                : [],
                        };
                    });
                    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(syncedProds));
                }
            }

            try {
                const rawMovements = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                const movements = rawMovements ? JSON.parse(rawMovements) : [];
                movements.unshift({
                    movementId: `MOV-${Date.now()}`,
                    orderId: checkoutOrderId,
                    commandReference: cmdUuid,
                    kioskCode,
                    slotNumber: checkoutItem.slotNumber,
                    brand: checkoutItem.brand,
                    productName: perfumeName,
                    movementType: "SALE",
                    quantityBeforeMl: qtyBefore,
                    quantityAfterMl: qtyAfter,
                    deltaMl: -0.12,
                    reason: lang === "en" ? `Dispense order (${checkoutOrderId})` : `Đơn xịt (${checkoutOrderId})`,
                    timestamp: new Date().toISOString(),
                });
                localStorage.setItem(INVENTORY_MOVEMENTS_KEY, JSON.stringify(movements.slice(0, 300)));
            } catch {
                // Safe fallback
            }

            const nowIso = new Date().toISOString();
            upsertOrderAndAlertsToStorage({
                id: checkoutOrderId,
                time: lang === "en" ? `Completed (${kioskCode})` : `Hoàn tất (${kioskCode})`,
                kiosk: kioskCode,
                slotNumber: checkoutItem.slotNumber,
                brand: checkoutItem.brand,
                product: perfumeName,
                priceSnapshot: price,
                amount: price,
                paidAmount: price,
                paymentMethod: checkoutMethod,
                providerReference: providerRef,
                status: "DISPENSED",
                commandReference: cmdUuid,
                idempotencyKey,
                signature: hmacSignature,
                ackedAt: nowIso,
                executedAt: nowIso,
                failureReason: null,
                requiresHumanReview: false,
                lowStockAlertToRaise:
                    qtyAfter <= thresholdMl
                        ? {
                            kioskCode,
                            brand: checkoutItem.brand,
                            product: perfumeName,
                            slotNumber: checkoutItem.slotNumber,
                            remainingMl: qtyAfter,
                            thresholdMl,
                        }
                        : null,
            });

            appendAuditLog({
                action: "ORDER_DISPENSED_CONFIRMED",
                entityType: "ORDERS",
                entityId: checkoutOrderId,
                brandTenant: checkoutItem.brand,
                oldValues: { status: "DISPENSING", remainingVolumeMl: qtyBefore },
                newValues: {
                    status: "DISPENSED",
                    remainingVolumeMl: qtyAfter,
                    priceSnapshot: price,
                    commandReference: cmdUuid,
                },
            });

            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("scentstation-sync"));
            }

            setCheckoutItem((prev) => (prev ? { ...prev, remainingVolumeMl: qtyAfter } : null));
            setCheckoutStatus("DISPENSED");

            triggerToast(
                lang === "en" ? `Dispensed ${perfumeName} (-0.12ml).` : `Đã xịt ${perfumeName} (-0.12ml).`,
                "success"
            );
        } finally {
            isProcessingPaymentRef.current = false;
        }
    };

    const handleResetDemoState = useCallback(() => {
        localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(DEFAULT_8_KIOSKS));
        localStorage.removeItem(PRODUCTS_STORAGE_KEY);
        localStorage.removeItem(KIOSK_PER_UNIT_STOCK_KEY);
        loadAndSyncStorageData();
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("scentstation-sync"));
        }
        triggerToast(
            lang === "en" ? "Station data refreshed." : "Đã làm mới dữ liệu trạm.",
            "success"
        );
    }, [lang, loadAndSyncStorageData, triggerToast]);

    const portalTargetRoute = activeSessionUser
        ? ROLE_DEFAULT_HOME[activeSessionUser.roleCode] || "/dashboard"
        : "/login";

    return (
        <div className={`${styles.landingViewport} notranslate`} translate="no">
            {/* GIỮ VIDEO NỀN */}
            <div className={styles.videoStage} aria-hidden="true">
                <video
                    ref={videoRef}
                    className={styles.videoElement}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    poster="/login-perfume.png"
                >
                    <source src="/video_1.mp4" type="video/mp4" />
                    <source src="/login-bg.mp4" type="video/mp4" />
                    <source src="/videos/video_1.mp4" type="video/mp4" />
                </video>
                <div className={styles.videoOverlay} />
            </div>

            <header className={styles.navbar}>
                <div className={styles.navInner}>
                    <div
                        className={styles.brandBlock}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                        <span className={styles.brandTitle} translate="no">
                            ScentStation
                        </span>
                    </div>

                    <nav className={styles.navLinks}>
                        <a href="#maisons" className={styles.navLinkItem}>
                            {lang === "en" ? "Brands" : "Thương hiệu"}
                        </a>
                        <a href="#collection" className={styles.navLinkItem}>
                            {lang === "en" ? "Catalog" : "Danh mục mùi"}
                        </a>
                        <a href="#kiosks" className={styles.navLinkItem}>
                            {lang === "en" ? "Stations" : "Danh sách trạm"}
                        </a>
                        <button
                            type="button"
                            onClick={() => router.push(`/kiosk/${selectedKioskCode}`)}
                            className={styles.navLinkItem}
                            title={
                                lang === "en"
                                    ? "Open customer touchscreen view"
                                    : "Mở giao diện cảm ứng dành cho khách tại trạm"
                            }
                        >
                            {lang === "en" ? "Kiosk Screen" : "Màn hình Kiosk"}
                        </button>
                    </nav>

                    <div className={styles.navActions}>
                        <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className={styles.iconGhostBtn}
                            title={
                                lang === "en"
                                    ? isMuted
                                        ? "Unmute background audio"
                                        : "Mute background audio"
                                    : isMuted
                                        ? "Bật âm thanh nền"
                                        : "Tắt âm thanh nền"
                            }
                        >
                            {isMuted ? <VolumeX size={15} color="#94A3B8" /> : <Volume2 size={15} color="#D4AF37" />}
                        </button>

                        <button
                            type="button"
                            onClick={handleToggleLanguage}
                            className={styles.iconGhostBtn}
                            title={lang === "en" ? "Switch to Vietnamese" : "Chuyển sang Tiếng Anh"}
                        >
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push(portalTargetRoute)}
                            className={styles.loginPrimaryBtn}
                        >
                            {activeSessionUser ? <LayoutDashboard size={15} /> : <LogIn size={15} />}
                            <span>
                                {activeSessionUser
                                    ? `${activeSessionUser.fullName} (${activeSessionUser.roleCode})`
                                    : lang === "en"
                                        ? "Staff Sign In"
                                        : "Đăng nhập quản trị"}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className={styles.contentWrapper}>
                <section className={styles.heroSection}>
                    <div>
                        <div className={styles.liveTelemetryPill}>
                            <span className={styles.pulseDot} />
                            <span>
                                {lang === "en"
                                    ? `${onlineKiosksCount}/${kiosks.length} stations online`
                                    : `${onlineKiosksCount}/${kiosks.length} trạm đang hoạt động`}
                            </span>
                        </div>

                        <h1 className={styles.heroHeadline}>
                            {lang === "en" ? "ScentStation Kiosk Network" : "Hệ thống trạm Kiosk ScentStation"}
                        </h1>

                        <p className={styles.heroLead}>
                            {lang === "en"
                                ? "Inspect live slot levels, test QR payment & dispensing flows (0.12ml/spray), or sign in to the management portal."
                                : "Theo dõi dung tích từng khoang máy, kiểm thử luồng thanh toán QR & phun định lượng (0.12ml/lần), hoặc đăng nhập vào trang quản trị."}
                        </p>

                        <div className={styles.ctaButtonGroup}>
                            <button
                                type="button"
                                onClick={() => router.push(portalTargetRoute)}
                                className={styles.ctaGoldHeroBtn}
                            >
                                {activeSessionUser ? <LayoutDashboard size={16} /> : <LogIn size={16} />}
                                <span>
                                    {activeSessionUser
                                        ? lang === "en"
                                            ? "Open Portal"
                                            : "Vào trang quản trị"
                                        : lang === "en"
                                            ? "Staff Sign In"
                                            : "Đăng nhập quản trị"}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push(`/kiosk/${selectedKioskCode}`)}
                                className={styles.ctaGlassSecondaryBtn}
                                title={
                                    lang === "en"
                                        ? "Opens anonymous customer UI for the selected station"
                                        : "Mở giao diện cảm ứng ẩn danh dành cho khách tại trạm đang chọn"
                                }
                            >
                                <QrCode size={16} color="#D4AF37" />
                                <span>{lang === "en" ? "Open Kiosk Screen" : "Mở màn hình Kiosk"}</span>
                            </button>
                        </div>

                        <div className={styles.heroStatsRow}>
                            <div
                                className={styles.heroStatCard}
                                onClick={() => document.getElementById("maisons")?.scrollIntoView({ behavior: "smooth" })}
                            >
                                <div className={styles.heroStatNum}>{unique21Brands.length}</div>
                                <div className={styles.heroStatLabel}>{lang === "en" ? "Brands" : "Thương hiệu"}</div>
                            </div>

                            <div
                                className={styles.heroStatCard}
                                onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}
                            >
                                <div className={styles.heroStatNum}>{catalog.length}</div>
                                <div className={styles.heroStatLabel}>{lang === "en" ? "Active Scents" : "Mùi đang mở bán"}</div>
                            </div>

                            <div
                                className={styles.heroStatCard}
                                onClick={() => document.getElementById("kiosks")?.scrollIntoView({ behavior: "smooth" })}
                            >
                                <div className={styles.heroStatNum}>
                                    {onlineKiosksCount}/{kiosks.length}
                                </div>
                                <div className={styles.heroStatLabel}>{lang === "en" ? "Stations Online" : "Trạm hoạt động"}</div>
                            </div>

                            {activeSessionUser ? (
                                <div className={styles.heroStatCard} onClick={() => handlePortalNavigation("/reports")}>
                                    <div className={styles.heroStatNum}>
                                        {lang === "en"
                                            ? `${(fleetTotalRevenue / 1000000).toFixed(2)}M VND`
                                            : `${(fleetTotalRevenue / 1000000).toFixed(2)} Tr đ`}
                                    </div>
                                    <div className={styles.heroStatLabel}>
                                        {lang === "en"
                                            ? `${fleetTotalSprays} sprays today`
                                            : `${fleetTotalSprays} lượt xịt hôm nay`}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.heroStatCard}>
                                    <div className={styles.heroStatNum}>0.12 ml</div>
                                    <div className={styles.heroStatLabel}>{lang === "en" ? "Dosage / spray" : "Định lượng / lần xịt"}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BẢNG KIỂM TRA TRẠM TRỰC TIẾP */}
                    <div className={styles.liveConsoleCard}>
                        <div className={styles.consoleHeader}>
                            <h3 className={styles.consoleTitle}>{activeKiosk.locationName}</h3>
                            <span
                                className={`${styles.statusBadge} ${
                                    activeKiosk.status === "ONLINE"
                                        ? styles.statusOnline
                                        : activeKiosk.status === "MAINTENANCE"
                                            ? styles.statusMaintenance
                                            : styles.statusOffline
                                }`}
                            >
                                ●{" "}
                                {activeKiosk.status === "ONLINE"
                                    ? `${formatKioskStatusLabel(activeKiosk.status, lang)} • ${activeKiosk.chamberTemp}`
                                    : formatKioskStatusLabel(activeKiosk.status, lang)}
                            </span>
                        </div>

                        <div className={styles.kioskDropdownWrapper} ref={kioskDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsKioskDropdownOpen((prev) => !prev)}
                                className={`${styles.kioskDropdownTrigger} ${
                                    isKioskDropdownOpen ? styles.kioskDropdownTriggerOpen : ""
                                }`}
                            >
                                <div className={styles.kioskTriggerLeft}>
                                    <span
                                        className={`${styles.kioskTriggerDot} ${
                                            activeKiosk.status === "ONLINE"
                                                ? styles.dotOnline
                                                : activeKiosk.status === "MAINTENANCE"
                                                    ? styles.dotMaintenance
                                                    : styles.dotOffline
                                        }`}
                                    />
                                    <div className={styles.kioskTriggerText}>
                                        <span className={styles.kioskTriggerPrimary}>
                                            {activeKiosk.code} — {activeKiosk.locationName}
                                        </span>
                                        <span className={styles.kioskTriggerSecondary}>
                                            {getLocalizedAddress(activeKiosk, lang)}
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown
                                    size={17}
                                    className={`${styles.kioskDropdownChevron} ${
                                        isKioskDropdownOpen ? styles.kioskDropdownChevronOpen : ""
                                    }`}
                                />
                            </button>

                            {isKioskDropdownOpen && (
                                <div className={styles.kioskDropdownMenu}>
                                    {kiosks.map((k) => {
                                        const isSelected = k.code === selectedKioskCode;
                                        return (
                                            <button
                                                key={k.code}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedKioskCode(k.code);
                                                    setIsKioskDropdownOpen(false);
                                                }}
                                                className={`${styles.kioskDropdownOption} ${
                                                    isSelected ? styles.kioskDropdownOptionSelected : ""
                                                }`}
                                            >
                                                <div className={styles.kioskTriggerLeft}>
                                                    <span
                                                        className={`${styles.kioskTriggerDot} ${
                                                            k.status === "ONLINE"
                                                                ? styles.dotOnline
                                                                : k.status === "MAINTENANCE"
                                                                    ? styles.dotMaintenance
                                                                    : styles.dotOffline
                                                        }`}
                                                    />
                                                    <div className={styles.kioskOptionInfo}>
                                                        <div className={styles.kioskOptionTitle}>
                                                            <span>{k.code}</span>
                                                            <span className={styles.kioskOptionBrand}>({k.locationName})</span>
                                                            {isSelected && <Check size={13} color="#D4AF37" />}
                                                        </div>
                                                        <div className={styles.kioskOptionLocation}>
                                                            {getLocalizedAddress(k, lang)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`${styles.kioskOptionBadge} ${
                                                        k.status === "ONLINE"
                                                            ? styles.statusOnline
                                                            : k.status === "MAINTENANCE"
                                                                ? styles.statusMaintenance
                                                                : styles.statusOffline
                                                    }`}
                                                >
                                                    {formatKioskStatusLabel(k.status, lang)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {activeKiosk.connectionStatus === "OFFLINE" && (
                            <div className={styles.staleWarningBanner}>
                                <AlertTriangle size={15} color="#F87171" style={{ flexShrink: 0 }} />
                                <span>
                                    {lang === "en"
                                        ? "Station offline: displayed volumes are last recorded values, not real-time."
                                        : "Trạm mất kết nối: mức dung tích hiển thị là dữ liệu ghi nhận lần cuối, không phải thời gian thực."}
                                </span>
                            </div>
                        )}

                        <div
                            className={styles.slotPreviewList}
                            style={{ opacity: activeKiosk.connectionStatus === "OFFLINE" ? 0.72 : 1 }}
                        >
                            {activeKiosk.slots.map((sl) => {
                                const matchedCatalog =
                                    catalog.find((c) => isExactFragranceMatch(c.name, sl.fragranceName)) ||
                                    DEFAULT_34_CATALOG.find((c) => isExactFragranceMatch(c.name, sl.fragranceName)) ||
                                    DEFAULT_34_CATALOG[0];
                                const effectiveSlotPrice =
                                    typeof sl.pricePerSpray === "number" ? sl.pricePerSpray : matchedCatalog.pricePerSpray;
                                const pct = Math.round((sl.remainingMl / sl.capacityMl) * 100);
                                const isSlotEmpty = sl.remainingMl < 0.12;
                                const isSlotProductInactive = sl.productStatus && sl.productStatus !== "ACTIVE";
                                const readiness = getKioskReadiness(activeKiosk.code);
                                const isSlotBlocked = isSlotEmpty || !readiness.ready || Boolean(isSlotProductInactive);

                                return (
                                    <div key={sl.slotLabel} className={styles.slotPreviewItem}>
                                        <div style={{ flex: 1, minWidth: 0, paddingRight: "0.75rem" }}>
                                            <div style={{ fontSize: "0.74rem", color: "#D4AF37", fontWeight: 700 }}>
                                                {formatSlotLabel(sl.slotLabel, lang)} • {sl.brand}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.92rem",
                                                    fontWeight: 700,
                                                    color: isSlotProductInactive ? "#94A3B8" : "#FFF",
                                                    margin: "0.1rem 0",
                                                }}
                                            >
                                                {sl.fragranceName}
                                            </div>
                                            <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                                                {lang === "en" ? "Remaining: " : "Còn lại: "}
                                                <strong
                                                    style={{
                                                        color: isSlotEmpty || isSlotProductInactive
                                                            ? "#F87171"
                                                            : sl.remainingMl <= (sl.lowStockThresholdMl || 15)
                                                                ? "#FBBF24"
                                                                : "#34D399",
                                                    }}
                                                >
                                                    {sl.remainingMl}ml / {sl.capacityMl}ml ({pct}%)
                                                </strong>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#F5E6AD", marginBottom: "4px" }}>
                                                {effectiveSlotPrice.toLocaleString("vi-VN")} VND
                                            </div>
                                            <button
                                                type="button"
                                                disabled={isSlotBlocked}
                                                onClick={() =>
                                                    handleOpenPaymentGateway(
                                                        {
                                                            ...matchedCatalog,
                                                            name: sl.fragranceName,
                                                            brand: sl.brand,
                                                            pricePerSpray: effectiveSlotPrice,
                                                            remainingVolumeMl: sl.remainingMl,
                                                            bottleVolumeMl: sl.capacityMl,
                                                            status: sl.productStatus || "ACTIVE",
                                                        },
                                                        activeKiosk.code
                                                    )
                                                }
                                                className={styles.iconGhostBtn}
                                                style={{
                                                    padding: "0.35rem 0.75rem",
                                                    fontSize: "0.76rem",
                                                    borderColor: isSlotBlocked ? "rgba(248,113,113,0.45)" : undefined,
                                                    color: isSlotBlocked ? "#F87171" : undefined,
                                                }}
                                            >
                                                <Zap size={12} color={isSlotBlocked ? "#F87171" : "#D4AF37"} />
                                                <span>
                                                    {isSlotProductInactive
                                                        ? lang === "en"
                                                            ? "Inactive"
                                                            : "Tạm ẩn"
                                                        : isSlotEmpty
                                                            ? lang === "en"
                                                                ? "Empty"
                                                                : "Hết bình"
                                                            : !readiness.ready
                                                                ? readiness.label
                                                                : lang === "en"
                                                                    ? "Test QR"
                                                                    : "Thử QR"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: "flex", gap: "0.65rem" }}>
                            <button
                                type="button"
                                onClick={() => router.push(`/kiosk/${activeKiosk.code}`)}
                                className={styles.loginPrimaryBtn}
                                style={{ flex: 1 }}
                            >
                                <Cpu size={15} />
                                <span>{lang === "en" ? "Open Kiosk UI" : "Mở giao diện Kiosk"}</span>
                            </button>

                            {activeSessionUser && (
                                <button
                                    type="button"
                                    onClick={() => handlePortalNavigation(`/machines?machineId=${activeKiosk.code}`)}
                                    className={styles.iconGhostBtn}
                                >
                                    <ShieldCheck size={14} color="#D4AF37" />
                                    <span>{lang === "en" ? "Manage" : "Quản lý máy"}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* LỌC THEO THƯƠNG HIỆU */}
                <section id="maisons" className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            {lang === "en" ? `Brands (${unique21Brands.length})` : `Thương hiệu (${unique21Brands.length})`}
                        </h2>
                    </div>

                    <div className={styles.brandsRibbon}>
                        <button
                            type="button"
                            onClick={() => setSelectedBrand("ALL")}
                            className={`${styles.brandPillBtn} ${selectedBrand === "ALL" ? styles.brandPillBtnActive : ""}`}
                        >
                            {lang === "en" ? `All (${catalog.length})` : `Tất cả (${catalog.length})`}
                        </button>
                        {unique21Brands.map((brandName) => {
                            const count = catalog.filter((c) => c.brand === brandName).length;
                            return (
                                <button
                                    key={brandName}
                                    type="button"
                                    onClick={() => setSelectedBrand(selectedBrand === brandName ? "ALL" : brandName)}
                                    className={`${styles.brandPillBtn} ${selectedBrand === brandName ? styles.brandPillBtnActive : ""}`}
                                >
                                    {brandName} ({count})
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* DANH MỤC MÙI HƯƠNG */}
                <section id="collection" className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            {lang === "en" ? `Active Catalog (${catalog.length})` : `Danh mục đang mở bán (${catalog.length})`}
                        </h2>

                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                            <button
                                type="button"
                                onClick={() => setFilterBySelectedKiosk(!filterBySelectedKiosk)}
                                className={`${styles.iconGhostBtn} ${filterBySelectedKiosk ? styles.brandPillBtnActive : ""}`}
                            >
                                <Filter size={13} color="#D4AF37" />
                                <span>
                                    {filterBySelectedKiosk
                                        ? `${lang === "en" ? "Station" : "Trạm"}: ${activeKiosk.code}`
                                        : lang === "en"
                                            ? "Filter by Selected Station"
                                            : "Lọc theo trạm đang chọn"}
                                </span>
                            </button>

                            <button type="button" onClick={() => setShowAll34(!showAll34)} className={styles.iconGhostBtn}>
                                <span>
                                    {isAutoExpanded
                                        ? lang === "en"
                                            ? "Show 12"
                                            : "Thu gọn (12)"
                                        : lang === "en"
                                            ? `Show All (${catalog.length})`
                                            : `Xem tất cả (${catalog.length})`}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.catalogToolbar}>
                        <div className={styles.searchBox}>
                            <Search size={16} color="#D4AF37" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={
                                    lang === "en"
                                        ? "Search fragrance, SKU, brand, or station..."
                                        : "Tìm tên nước hoa, mã SKU, thương hiệu, trạm..."
                                }
                                className={styles.searchInput}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                                    title={lang === "en" ? "Clear search" : "Xóa tìm kiếm"}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className={styles.filterTabs}>
                            {(["ALL", "Niche", "Men", "Women", "Unisex"] as const).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`${styles.filterTabBtn} ${selectedCategory === cat ? styles.filterTabBtnActive : ""}`}
                                >
                                    {formatCategoryLabel(cat, lang)} ({categoryCounts[cat]})
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredPerfumes.length === 0 ? (
                        <div className={styles.emptyCatalogState}>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#F5E6AD", marginBottom: "0.5rem" }}>
                                {lang === "en" ? "No matching fragrances" : "Không có mùi hương phù hợp"}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedBrand("ALL");
                                    setSelectedCategory("ALL");
                                    setFilterBySelectedKiosk(false);
                                }}
                                className={styles.loginPrimaryBtn}
                            >
                                <RefreshCw size={14} />
                                <span>{lang === "en" ? "Clear Filters" : "Xóa bộ lọc"}</span>
                            </button>
                        </div>
                    ) : (
                        <div className={styles.productGrid}>
                            {filteredPerfumes.map((prod) => {
                                const pct = Math.round((prod.remainingVolumeMl / prod.bottleVolumeMl) * 100);
                                const isEmpty = prod.remainingVolumeMl < 0.12;
                                const isLow = prod.remainingVolumeMl <= prod.lowStockThresholdMl;
                                const kioskReadiness = getKioskReadiness(prod.kioskCode);
                                const isSelectable = !isEmpty && kioskReadiness.ready;

                                return (
                                    <div
                                        key={`${prod.skuCode}-${prod.slotNumber}`}
                                        className={`${styles.productCard} ${!isSelectable ? styles.productCardUnavailable : ""}`}
                                    >
                                        <div>
                                            <div className={styles.productTopRow}>
                                                <div className={styles.productThumb}>
                                                    <img src={prod.image} alt={prod.name} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.15rem" }}>
                                                        <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#D4AF37" }}>
                                                            {prod.brand}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontSize: "0.7rem",
                                                                padding: "0.14rem 0.5rem",
                                                                borderRadius: "6px",
                                                                background: !isSelectable ? "rgba(248,113,113,0.18)" : "rgba(212,175,55,0.14)",
                                                                color: !isSelectable ? "#F87171" : "#F5E6AD",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {isEmpty
                                                                ? lang === "en"
                                                                    ? "EMPTY"
                                                                    : "HẾT BÌNH"
                                                                : !kioskReadiness.ready
                                                                    ? kioskReadiness.label.toUpperCase()
                                                                    : prod.physicalSlotLabel
                                                                        ? formatSlotLabel(prod.physicalSlotLabel, lang)
                                                                        : getPhysicalSlotLabel(prod.kioskCode, prod.name, prod.slotNumber)}
                                                        </span>
                                                    </div>

                                                    <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700, color: "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {prod.name}
                                                    </h3>
                                                    <div style={{ fontSize: "0.76rem", color: "#94A3B8", marginTop: "2px" }}>
                                                        {prod.kioskCode} • {formatCatalogLocation(prod.location, lang)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                                                <span style={{ color: "#94A3B8" }}>{formatCategoryLabel(prod.category, lang)}</span>
                                                <strong style={{ color: isEmpty ? "#F87171" : isLow ? "#FBBF24" : "#34D399" }}>
                                                    {prod.remainingVolumeMl}ml / {prod.bottleVolumeMl}ml ({pct}%)
                                                </strong>
                                            </div>
                                            <div className={styles.volumeTrack}>
                                                <div
                                                    className={styles.volumeFill}
                                                    style={{
                                                        width: `${pct}%`,
                                                        background: isEmpty ? "#F87171" : isLow ? "#FBBF24" : "#34D399",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                borderTop: "1px solid rgba(255,255,255,0.08)",
                                                paddingTop: "0.75rem",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div>
                                                <span style={{ fontSize: "0.7rem", color: "#94A3B8", display: "block" }}>
                                                    0.12ml / {lang === "en" ? "spray" : "lần xịt"}
                                                </span>
                                                <strong style={{ fontSize: "0.96rem", color: "#F5E6AD" }}>
                                                    {prod.pricePerSpray.toLocaleString("vi-VN")} VND
                                                </strong>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={!isSelectable}
                                                onClick={() => handleOpenPaymentGateway(prod, prod.kioskCode)}
                                                className={styles.loginPrimaryBtn}
                                                style={{
                                                    padding: "0.48rem 0.9rem",
                                                    fontSize: "0.8rem",
                                                    background: !isSelectable ? "rgba(248,113,113,0.18)" : undefined,
                                                    color: !isSelectable ? "#F87171" : undefined,
                                                    borderColor: !isSelectable ? "rgba(248,113,113,0.4)" : undefined,
                                                }}
                                            >
                                                {isSelectable ? <QrCode size={14} /> : <AlertOctagon size={14} />}
                                                <span>
                                                    {isEmpty
                                                        ? lang === "en"
                                                            ? "Empty"
                                                            : "Hết bình"
                                                        : !kioskReadiness.ready
                                                            ? kioskReadiness.label
                                                            : lang === "en"
                                                                ? "QR Test"
                                                                : "Quét QR"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className={styles.catalogFooterBar}>
                        <div style={{ fontSize: "0.84rem", color: "#CBD5E1" }}>
                            {lang === "en"
                                ? `Showing ${filteredPerfumes.length} / ${totalMatchedPerfumes.length} scents`
                                : `Hiển thị ${filteredPerfumes.length} / ${totalMatchedPerfumes.length} mùi`}
                        </div>

                        {totalMatchedPerfumes.length > 12 && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (isAutoExpanded && selectedCategory !== "ALL") {
                                        setSelectedCategory("ALL");
                                        setShowAll34(false);
                                    } else {
                                        setShowAll34(!showAll34);
                                    }
                                }}
                                className={styles.loginPrimaryBtn}
                                style={{ padding: "0.52rem 1.1rem", fontSize: "0.82rem" }}
                            >
                                <span>
                                    {isAutoExpanded
                                        ? lang === "en"
                                            ? "Show 12"
                                            : "Thu gọn (12)"
                                        : lang === "en"
                                            ? `View all (${totalMatchedPerfumes.length})`
                                            : `Xem tất cả (${totalMatchedPerfumes.length})`}
                                </span>
                            </button>
                        )}
                    </div>
                </section>

                {/* DANH SÁCH 8 TRẠM KIOSK */}
                <section id="kiosks" className={styles.sectionBlock}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            {lang === "en" ? `Stations (${kiosks.length})` : `Danh sách trạm (${kiosks.length})`}
                        </h2>
                    </div>

                    <div className={styles.kioskGrid}>
                        {kiosks.map((k) => {
                            const isSelected = k.code === selectedKioskCode;
                            return (
                                <div
                                    key={k.code}
                                    className={`${styles.kioskCard} ${isSelected ? styles.kioskCardSelected : ""}`}
                                    onClick={() => {
                                        setSelectedKioskCode(k.code);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                        <strong style={{ color: "#F5E6AD", fontSize: "0.86rem" }}>{k.code}</strong>
                                        <span
                                            className={`${styles.statusBadge} ${
                                                k.status === "ONLINE"
                                                    ? styles.statusOnline
                                                    : k.status === "MAINTENANCE"
                                                        ? styles.statusMaintenance
                                                        : styles.statusOffline
                                            }`}
                                        >
                                            ● {formatKioskStatusLabel(k.status, lang)}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "0.98rem", color: "#FFF" }}>
                                        {k.locationName}
                                    </h3>
                                    <p style={{ fontSize: "0.78rem", color: "#94A3B8", margin: "0 0 0.6rem 0" }}>
                                        <MapPin size={13} color="#D4AF37" style={{ display: "inline", marginRight: "4px" }} />
                                        {getLocalizedAddress(k, lang)}
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "0.76rem",
                                            color: "#CBD5E1",
                                            borderTop: "1px solid rgba(255,255,255,0.08)",
                                            paddingTop: "0.5rem",
                                        }}
                                    >
                                        <span>
                                            {lang === "en" ? `4 slots • ${k.brand}` : `4 khoang • ${k.brand}`}
                                        </span>
                                        <span style={{ color: "#D4AF37" }}>
                                            {activeSessionUser
                                                ? lang === "en"
                                                    ? `${k.todaySprays} sprays • ${k.todayRevenue.toLocaleString("en-US")} VND`
                                                    : `${k.todaySprays} lượt xịt • ${k.todayRevenue.toLocaleString("vi-VN")}đ`
                                                : k.chamberTemp}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* MODAL THANH TOÁN QR */}
            {checkoutItem && (() => {
                const physicalSlotLabel = checkoutItem.physicalSlotLabel
                    ? formatSlotLabel(checkoutItem.physicalSlotLabel, lang)
                    : getPhysicalSlotLabel(checkoutItem.kioskCode, checkoutItem.name, checkoutItem.slotNumber);
                const timerPct = Math.round((checkoutSecondsLeft / 120) * 100);

                return (
                    <div
                        className={styles.modalBackdrop}
                        onClick={() => {
                            if (checkoutStatus !== "PAID" && checkoutStatus !== "DISPENSING") setCheckoutItem(null);
                        }}
                    >
                        <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                                <div>
                                    <h3 style={{ margin: 0, color: "#FFF", fontSize: "1.12rem", fontWeight: 700 }}>
                                        {lang === "en" ? "QR Payment & Dispense" : "Thanh toán QR & Phun định lượng"} ({checkoutOrderId})
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    disabled={checkoutStatus === "PAID" || checkoutStatus === "DISPENSING"}
                                    onClick={() => setCheckoutItem(null)}
                                    title={lang === "en" ? "Close" : "Đóng"}
                                    style={{
                                        background: "rgba(255,255,255,0.06)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: "8px",
                                        padding: "0.3rem",
                                        color: "#CBD5E1",
                                        cursor: "pointer",
                                        display: "flex",
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className={styles.stateStepper}>
                                <div className={`${styles.stepItem} ${checkoutStatus === "PENDING" ? styles.stepItemActive : checkoutStatus === "PAID" || checkoutStatus === "DISPENSING" || checkoutStatus === "DISPENSED" ? styles.stepItemDone : styles.stepItemError}`}>
                                    <span>01</span>
                                    <span>
                                        {checkoutStatus === "CANCELLED" || checkoutStatus === "EXPIRED"
                                            ? formatOrderStatusLabel(checkoutStatus, lang)
                                            : lang === "en"
                                                ? "QR"
                                                : "Mã QR"}
                                    </span>
                                </div>
                                <div className={`${styles.stepItem} ${checkoutStatus === "PAID" ? styles.stepItemActive : checkoutStatus === "DISPENSING" || checkoutStatus === "DISPENSED" || checkoutStatus === "FAILED" || checkoutStatus === "UNCERTAIN" ? styles.stepItemDone : ""}`}>
                                    <span>02</span>
                                    <span>{lang === "en" ? "PAID" : "ĐÃ TRẢ"}</span>
                                </div>
                                <div className={`${styles.stepItem} ${checkoutStatus === "DISPENSING" ? styles.stepItemActive : checkoutStatus === "DISPENSED" ? styles.stepItemDone : checkoutStatus === "FAILED" || checkoutStatus === "UNCERTAIN" ? styles.stepItemError : ""}`}>
                                    <span>03</span>
                                    <span>{lang === "en" ? "SPRAY" : "PHUN"}</span>
                                </div>
                                <div className={`${styles.stepItem} ${checkoutStatus === "DISPENSED" ? styles.stepItemDone : checkoutStatus === "FAILED" || checkoutStatus === "UNCERTAIN" ? styles.stepItemError : ""}`}>
                                    <span>04</span>
                                    <span>
                                        {checkoutStatus === "FAILED" || checkoutStatus === "UNCERTAIN"
                                            ? formatOrderStatusLabel(checkoutStatus, lang)
                                            : lang === "en"
                                                ? "DONE"
                                                : "XONG"}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.checkoutProductSummary}>
                                <div className={styles.checkoutThumb}>
                                    <img src={checkoutItem.image} alt={checkoutItem.name} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#D4AF37" }}>{checkoutItem.brand}</div>
                                    <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#FFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {checkoutItem.name}
                                    </div>
                                    <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                                        {checkoutItem.kioskCode} • <strong style={{ color: "#34D399" }}>{physicalSlotLabel}</strong>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <strong style={{ fontSize: "1.05rem", color: "#F5E6AD" }}>
                                        {checkoutPriceSnapshot.toLocaleString("vi-VN")} VND
                                    </strong>
                                </div>
                            </div>

                            {(checkoutStatus === "PAID" || checkoutStatus === "DISPENSING") && (
                                <div className={styles.wristPreparationBanner}>
                                    {lang === "en"
                                        ? `Payment verified. Dispensing 1 spray (0.12ml) at ${physicalSlotLabel}...`
                                        : `Đã xác nhận thanh toán. Đang phun 1 định lượng (0.12ml) tại ${physicalSlotLabel}...`}
                                </div>
                            )}

                            {checkoutStatus === "PENDING" && (
                                <div className={styles.methodTabsGrid}>
                                    {(["VIETQR", "MOMO", "VNPAY"] as const).map((code) => (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => handleSelectPaymentMethod(code)}
                                            className={`${styles.methodTabBtn} ${checkoutMethod === code ? styles.methodTabBtnActive : ""}`}
                                        >
                                            <span>{code}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {checkoutStatus === "PENDING" && paymentAttemptError && (
                                <div style={{ padding: "0.65rem 0.85rem", borderRadius: "10px", marginBottom: "0.85rem", background: "rgba(245, 158, 11, 0.14)", border: "1px solid rgba(245, 158, 11, 0.45)", color: "#FDE68A", fontSize: "0.8rem" }}>
                                    {paymentAttemptError}
                                </div>
                            )}

                            {(checkoutStatus === "PENDING" || checkoutStatus === "PAID" || checkoutStatus === "DISPENSING") && (
                                <>
                                    <div className={styles.qrShowcaseBox}>
                                        <div className={styles.qrFrame}>
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                                    `SCENTSTATION_PAY|${checkoutOrderId}|${checkoutMethod}|${checkoutItem.skuCode}|${checkoutItem.kioskCode}|${checkoutPriceSnapshot}VND`
                                                )}`}
                                                alt={lang === "en" ? "Payment QR Code" : "Mã QR thanh toán"}
                                                width={136}
                                                height={136}
                                                style={{ display: "block" }}
                                            />
                                        </div>

                                        <div className={styles.invoiceMetaList}>
                                            <div className={styles.invoiceMetaRow}>
                                                <span style={{ color: "#94A3B8" }}>{lang === "en" ? "Ref:" : "Mã GD:"}</span>
                                                <strong>PAY-{checkoutMethod}-{checkoutOrderId.slice(-4)}</strong>
                                            </div>
                                            <div className={styles.invoiceMetaRow}>
                                                <span style={{ color: "#94A3B8" }}>{lang === "en" ? "Dosage:" : "Định lượng:"}</span>
                                                <strong style={{ color: "#F5E6AD" }}>0.12 ml</strong>
                                            </div>
                                            <div style={{ marginTop: "0.2rem" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: checkoutStatus === "PENDING" ? "#FBBF24" : "#34D399" }}>
                                                    <span>
                                                        <Lock size={12} style={{ display: "inline", marginRight: "4px" }} />
                                                        {checkoutStatus === "PENDING"
                                                            ? lang === "en"
                                                                ? "Waiting payment"
                                                                : "Chờ thanh toán"
                                                            : lang === "en"
                                                                ? "Verified"
                                                                : "Đã xác nhận"}
                                                    </span>
                                                    {checkoutStatus === "PENDING" && <strong>{checkoutSecondsLeft}s</strong>}
                                                </div>
                                                {checkoutStatus === "PENDING" ? (
                                                    <div className={styles.countdownBarTrack}>
                                                        <div
                                                            className={styles.countdownBarFill}
                                                            style={{
                                                                width: `${timerPct}%`,
                                                                background: checkoutSecondsLeft <= 25 ? "#F87171" : "#34D399",
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: "0.76rem", color: "#34D399", marginTop: "4px" }}>{mqttTelemetryStep}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.6rem" }}>
                                        <button
                                            type="button"
                                            disabled={checkoutStatus !== "PENDING"}
                                            onClick={() => handleProcessOrderScenario("WEBHOOK_PAID_AND_DISPENSED")}
                                            className={styles.loginPrimaryBtn}
                                            style={{ flex: 1.6, padding: "0.72rem 1rem" }}
                                        >
                                            <CheckCircle2 size={15} />
                                            <span>
                                                {checkoutStatus !== "PENDING"
                                                    ? lang === "en"
                                                        ? "Dispensing..."
                                                        : "Đang phun..."
                                                    : lang === "en"
                                                        ? "Confirm Paid"
                                                        : "Xác nhận đã thanh toán"}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={checkoutStatus !== "PENDING"}
                                            onClick={() => handleProcessOrderScenario("CUSTOMER_CANCEL")}
                                            className={styles.iconGhostBtn}
                                            style={{ flex: 0.7, padding: "0.72rem 0.85rem" }}
                                        >
                                            <Ban size={14} color="#F87171" />
                                            <span>{lang === "en" ? "Cancel" : "Hủy"}</span>
                                        </button>
                                    </div>

                                    <div style={{ marginTop: "0.75rem", textAlign: "right" }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowDiagnosticsDrawer(!showDiagnosticsDrawer)}
                                            className={styles.diagnosticToggleBtn}
                                        >
                                            <SlidersHorizontal size={12} />
                                            <span>{lang === "en" ? "Test error scenarios" : "Mô phỏng lỗi phần cứng / thanh toán"}</span>
                                        </button>
                                    </div>

                                    {showDiagnosticsDrawer && (
                                        <div className={styles.simulatorDrawer}>
                                            <div className={styles.simulatorHeader}>
                                                {lang === "en"
                                                    ? "Simulates edge cases; never auto-retries spray if status is uncertain."
                                                    : "Kiểm thử ngoại lệ (không tự phun lại nếu kết quả chưa xác nhận)."}
                                            </div>
                                            <div className={styles.simulatorGrid}>
                                                <button
                                                    type="button"
                                                    disabled={checkoutStatus !== "PENDING"}
                                                    onClick={() => handleProcessOrderScenario("PAYMENT_ATTEMPT_FAILED")}
                                                    className={styles.simScenarioBtn}
                                                    style={{ borderColor: "rgba(251, 191, 36, 0.4)", color: "#FDE68A" }}
                                                >
                                                    <AlertTriangle size={14} color="#FBBF24" />
                                                    <span>{lang === "en" ? "Payment Declined" : "Lỗi thanh toán"}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={checkoutStatus !== "PENDING"}
                                                    onClick={() => handleProcessOrderScenario("SAFETY_INTERLOCK_FAILED_AFTER_PAID")}
                                                    className={styles.simScenarioBtn}
                                                    style={{ borderColor: "rgba(248, 113, 113, 0.4)", color: "#FCA5A5" }}
                                                >
                                                    <AlertOctagon size={14} color="#F87171" />
                                                    <span>{lang === "en" ? "Safety Interlock Fault" : "Lỗi cảm biến an toàn"}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={checkoutStatus !== "PENDING"}
                                                    onClick={() => handleProcessOrderScenario("DEVICE_TIMEOUT_UNCERTAIN")}
                                                    className={styles.simScenarioBtn}
                                                    style={{ gridColumn: "1 / -1", borderColor: "rgba(192, 132, 252, 0.4)", color: "#E9D5FF" }}
                                                >
                                                    <HelpCircle size={14} color="#C084FC" />
                                                    <span>
                                                        {lang === "en"
                                                            ? "Timeout After ACK (Uncertain)"
                                                            : "Quá hạn phản hồi sau nhận lệnh (Chờ đối soát)"}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {checkoutStatus !== "PENDING" && checkoutStatus !== "PAID" && checkoutStatus !== "DISPENSING" && (
                                <div style={{ marginTop: "0.4rem" }}>
                                    <div
                                        style={{
                                            padding: "0.9rem",
                                            borderRadius: "12px",
                                            marginBottom: "0.9rem",
                                            background: checkoutStatus === "DISPENSED" ? "rgba(52,211,153,0.12)" : checkoutStatus === "UNCERTAIN" ? "rgba(192,132,252,0.14)" : "rgba(248,113,113,0.14)",
                                            border: `1px solid ${checkoutStatus === "DISPENSED" ? "rgba(52,211,153,0.45)" : checkoutStatus === "UNCERTAIN" ? "rgba(192,132,252,0.45)" : "rgba(248,113,113,0.45)"}`,
                                            color: checkoutStatus === "DISPENSED" ? "#34D399" : checkoutStatus === "UNCERTAIN" ? "#D8B4FE" : "#FCA5A5",
                                            fontSize: "0.84rem",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {checkoutStatus === "DISPENSED" ? (
                                            <strong>
                                                ✓ {formatOrderStatusLabel(checkoutStatus, lang)} — {checkoutOrderId} ({checkoutPriceSnapshot.toLocaleString("vi-VN")} VND)
                                            </strong>
                                        ) : (
                                            <>
                                                <strong>✕ {formatOrderStatusLabel(checkoutStatus, lang)}</strong>
                                                <div style={{ marginTop: "0.3rem", color: "#FEE2E2" }}>{checkoutErrorReason}</div>
                                            </>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", gap: "0.6rem" }}>
                                        {(checkoutStatus === "CANCELLED" || checkoutStatus === "EXPIRED") && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenPaymentGateway(checkoutItem, checkoutItem.kioskCode)}
                                                className={styles.loginPrimaryBtn}
                                                style={{ flex: 1 }}
                                            >
                                                <RefreshCw size={14} />
                                                <span>{lang === "en" ? "Retry" : "Tạo lại QR"}</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setCheckoutItem(null)}
                                            className={styles.iconGhostBtn}
                                            style={{ flex: 1, padding: "0.65rem" }}
                                        >
                                            <span>
                                                {checkoutStatus === "DISPENSED"
                                                    ? `${lang === "en" ? "Done" : "Đóng"} (${autoCloseSeconds}s)`
                                                    : lang === "en"
                                                        ? "Close"
                                                        : "Đóng"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {toastState && (
                <div
                    className={`${styles.toastNotice} ${
                        toastState.variant === "error"
                            ? styles.toastError
                            : toastState.variant === "warning"
                                ? styles.toastWarning
                                : styles.toastSuccess
                    }`}
                >
                    {toastState.variant === "error" ? (
                        <AlertOctagon size={16} color="#F87171" style={{ flexShrink: 0, marginTop: "2px" }} />
                    ) : toastState.variant === "warning" ? (
                        <AlertTriangle size={16} color="#FBBF24" style={{ flexShrink: 0, marginTop: "2px" }} />
                    ) : (
                        <CheckCircle2 size={16} color="#34D399" style={{ flexShrink: 0, marginTop: "2px" }} />
                    )}
                    <span>{toastState.msg}</span>
                </div>
            )}

            <footer className={styles.footerBar}>
                <div className={styles.footerInner}>
                    <strong>SCENTSTATION</strong>
                    <div className={styles.footerLinks}>
                        <button type="button" onClick={handleResetDemoState} className={styles.footerTextBtn}>
                            {lang === "en" ? "Reset Station Data" : "Làm mới dữ liệu trạm"}
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={() => router.push(portalTargetRoute)}
                            className={styles.footerTextBtn}
                            style={{ color: "#D4AF37" }}
                        >
                            {activeSessionUser
                                ? lang === "en"
                                    ? `${activeSessionUser.roleCode} Portal`
                                    : `Cổng quản trị (${activeSessionUser.roleCode})`
                                : lang === "en"
                                    ? "Staff Sign In"
                                    : "Đăng nhập nội bộ"}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}