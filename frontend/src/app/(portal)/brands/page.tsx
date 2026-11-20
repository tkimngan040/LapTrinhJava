// noinspection SpellCheckingInspection
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import styles from "./brands.module.css";
import {
    Search,
    Plus,
    MapPin,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Edit3,
    X,
    LayoutGrid,
    List as ListIcon,
    ExternalLink,
    Upload,
    ArrowUpDown,
    Eye,
    Copy,
    Check,
    Sparkles,
    Cpu,
    Receipt,
    BarChart3,
    Building2,
    Globe,
    Mail,
    Phone,
    Thermometer,
    Power,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

const formatPrice = (price: number): string =>
    new Intl.NumberFormat("vi-VN").format(price) + " VND";

interface BrandProductItem {
    slotNumber: number;
    skuCode?: string;
    name: string;
    family: string;
    concentration: string;
    audience: string;
    notes: string;
    volume: string;
    bottleVolumeMl?: number;
    remainingVolumeMl?: number;
    kioskCode?: string;
    kioskLocation?: string;
    sprayPrice: number;
    retailPrice10ml: number;
    fullBottlePrice: number;
    status: "ACTIVE" | "INACTIVE";
    image: string;
}

interface BrandItem {
    id: number;
    name: string;
    code: string;
    description: string;
    website: string;
    email: string;
    phone: string;
    address: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    createdAt: string;
    machinesCount: number;
    transactionsCount: number;
    revenueValue: number;
    image: string;
    products: BrandProductItem[];
}

interface LiveBrandKioskSlot {
    kioskCode: string;
    kioskName: string;
    address: string;
    status: "ONLINE" | "MAINTENANCE" | "OFFLINE";
    chamberTemp: string;
    slotLabel: string;
    slotNumber: number;
    fragranceName: string;
    sprayPrice: number;
    remainingMl: number;
    capacityMl: number;
}

interface LiveBrandTransaction {
    id: string;
    dateStr: string;
    kiosk: string;
    productName: string;
    slotNumber: number;
    amount: number;
    paymentMethod: string;
    time: string;
    status: string;
}

function toLocalYmd(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysToYmd(ymd: string, deltaDays: number): string {
    const [y, m, d] = ymd.split("-").map(Number);
    return toLocalYmd(new Date(y, (m || 1) - 1, (d || 1) + deltaDays));
}

function formatFullDisplayDate(ymd: string): string {
    const p = ymd.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ymd;
}

function formatShortDdMm(ymd: string): string {
    const p = ymd.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}` : ymd;
}

const isExactMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

const INITIAL_21_BRANDS: BrandItem[] = [
    { id: 1, name: "Giorgio Armani", code: "ARMANI", description: "Milan, Italy", website: "https://www.armani.com", email: "concierge@armani.local", phone: "+39 02 7231 81", address: "Milano, Italy", status: "ACTIVE", createdAt: "2026-10-18", machinesCount: 1, transactionsCount: 48, revenueValue: 624000, image: "/images/acqua-di-gio.jpg", products: [{ slotNumber: 1, skuCode: "SKU-ARM-01", name: "Acqua Di Gio", family: "Aquatic", concentration: "EDT", audience: "Men", notes: "Bergamot, Sea Notes", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 78, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre", sprayPrice: 12000, retailPrice10ml: 360000, fullBottlePrice: 3200000, status: "ACTIVE", image: "/images/acqua-di-gio.jpg" }, { slotNumber: 2, skuCode: "SKU-ARM-02", name: "Acqua Di Gio Profondo", family: "Aquatic", concentration: "EDP", audience: "Men", notes: "Marine, Rosemary", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 64, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre", sprayPrice: 14000, retailPrice10ml: 420000, fullBottlePrice: 3650000, status: "ACTIVE", image: "/images/acqua-di-gio-profondo.jpg" }] },
    { id: 2, name: "Chanel", code: "CHANEL", description: "Paris, France", website: "https://www.chanel.com", email: "contact@chanel.local", phone: "+33 1 42 68 55 00", address: "Paris, France", status: "ACTIVE", createdAt: "2026-10-19", machinesCount: 2, transactionsCount: 64, revenueValue: 976000, image: "/images/bleu-de-chanel.png", products: [{ slotNumber: 3, skuCode: "SKU-CHA-03", name: "Bleu de Chanel", family: "Woody", concentration: "EDP", audience: "Men", notes: "Lemon, Mint, Sandalwood", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 12.5, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre", sprayPrice: 15000, retailPrice10ml: 450000, fullBottlePrice: 4250000, status: "ACTIVE", image: "/images/bleu-de-chanel.png" }, { slotNumber: 4, skuCode: "SKU-CHA-04", name: "Coco Mademoiselle", family: "Floral", concentration: "EDP", audience: "Women", notes: "Orange, Rose, Patchouli", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 82, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Đồng Khởi", sprayPrice: 15500, retailPrice10ml: 465000, fullBottlePrice: 4400000, status: "ACTIVE", image: "/images/coco-mademoiselle.jpg" }] },
    { id: 3, name: "Burberry", code: "BURBERRY", description: "London, UK", website: "https://www.burberry.com", email: "care@burberry.local", phone: "+44 20 3402 1444", address: "London, UK", status: "ACTIVE", createdAt: "2026-10-20", machinesCount: 2, transactionsCount: 38, revenueValue: 484500, image: "/images/burberry-goddess.jpg", products: [{ slotNumber: 5, skuCode: "SKU-BUR-05", name: "Burberry Goddess", family: "Vanilla", concentration: "EDP", audience: "Women", notes: "Vanilla, Lavender", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 71, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Đồng Khởi", sprayPrice: 13000, retailPrice10ml: 390000, fullBottlePrice: 3500000, status: "ACTIVE", image: "/images/burberry-goddess.jpg" }, { slotNumber: 6, skuCode: "SKU-BUR-06", name: "Burberry Her", family: "Floral Fruity", concentration: "EDP", audience: "Women", notes: "Berries, Jasmine", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 55, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte West Lake", sprayPrice: 12500, retailPrice10ml: 375000, fullBottlePrice: 3350000, status: "ACTIVE", image: "/images/burberry-her.jpg" }] },
    { id: 4, name: "Carolina Herrera", code: "HERRERA", description: "New York, USA", website: "https://www.carolinaherrera.com", email: "support@herrera.local", phone: "+1 212 944 5757", address: "New York, USA", status: "ACTIVE", createdAt: "2026-10-22", machinesCount: 1, transactionsCount: 24, revenueValue: 324000, image: "/images/carolina-herrera-good-girl.jpg", products: [{ slotNumber: 7, skuCode: "SKU-CH-07", name: "Carolina Herrera Good Girl", family: "Oriental", concentration: "EDP", audience: "Women", notes: "Almond, Coffee, Tuberose", volume: "80ml", bottleVolumeMl: 80, remainingVolumeMl: 54, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte West Lake", sprayPrice: 13500, retailPrice10ml: 405000, fullBottlePrice: 3450000, status: "ACTIVE", image: "/images/carolina-herrera-good-girl.jpg" }] },
    { id: 5, name: "Armaf", code: "ARMAF", description: "Dubai, UAE", website: "https://www.armafperfume.com", email: "info@armaf.local", phone: "+971 4 226 5888", address: "Dubai, UAE", status: "ACTIVE", createdAt: "2026-10-24", machinesCount: 1, transactionsCount: 28, revenueValue: 280000, image: "/images/club-de-nuit-intense.jpg", products: [{ slotNumber: 8, skuCode: "SKU-ARMF-08", name: "Club de Nuit Intense Man", family: "Woody Spicy", concentration: "EDT", audience: "Men", notes: "Lemon, Pineapple, Birch", volume: "105ml", bottleVolumeMl: 105, remainingVolumeMl: 92, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside", sprayPrice: 10000, retailPrice10ml: 300000, fullBottlePrice: 1650000, status: "ACTIVE", image: "/images/club-de-nuit-intense.jpg" }] },
    { id: 6, name: "Creed", code: "CREED", description: "London, UK", website: "https://www.creedboutique.com", email: "info@creed.local", phone: "+44 20 7495 1760", address: "London, UK", status: "ACTIVE", createdAt: "2026-10-25", machinesCount: 1, transactionsCount: 45, revenueValue: 900000, image: "/images/creed-aventus.jpg", products: [{ slotNumber: 9, skuCode: "SKU-CRD-09", name: "Creed Aventus", family: "Chypre Fruity", concentration: "EDP", audience: "Niche", notes: "Pineapple, Birch, Musk", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 11.5, kioskCode: "demo-device", kioskLocation: "Diamond Plaza", sprayPrice: 20000, retailPrice10ml: 600000, fullBottlePrice: 7800000, status: "ACTIVE", image: "/images/creed-aventus.jpg" }] },
    { id: 7, name: "Dior", code: "DIOR", description: "Paris, France", website: "https://www.dior.com", email: "support@dior.local", phone: "+33 1 40 73 73 73", address: "Paris, France", status: "ACTIVE", createdAt: "2026-10-26", machinesCount: 2, transactionsCount: 52, revenueValue: 728000, image: "/images/dior-sauvage.jpg", products: [{ slotNumber: 10, skuCode: "SKU-DIO-10", name: "Dior Sauvage", family: "Fougere", concentration: "EDP", audience: "Men", notes: "Bergamot, Pepper, Ambroxan", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 84, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte West Lake", sprayPrice: 14500, retailPrice10ml: 435000, fullBottlePrice: 3950000, status: "ACTIVE", image: "/images/dior-sauvage.jpg" }, { slotNumber: 11, skuCode: "SKU-DIO-11", name: "Miss Dior Blooming Bouquet", family: "Floral", concentration: "EDT", audience: "Women", notes: "Rose, White Musk", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 76, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre", sprayPrice: 13500, retailPrice10ml: 405000, fullBottlePrice: 3600000, status: "ACTIVE", image: "/images/miss-dior-blooming-bouquet.jpg" }] },
    { id: 8, name: "Jean Paul Gaultier", code: "JPG", description: "Paris, France", website: "https://www.jeanpaulgaultier.com", email: "parfums@jpg.local", phone: "+33 1 44 68 80 00", address: "Paris, France", status: "ACTIVE", createdAt: "2026-10-28", machinesCount: 1, transactionsCount: 32, revenueValue: 424000, image: "/images/jean-paul-gaultier-le-male.jpg", products: [{ slotNumber: 12, skuCode: "SKU-JPG-12", name: "Jean Paul Gaultier Le Male", family: "Fougere", concentration: "EDT", audience: "Men", notes: "Lavender, Mint, Vanilla", volume: "125ml", bottleVolumeMl: 125, remainingVolumeMl: 77, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Đồng Khởi", sprayPrice: 13000, retailPrice10ml: 390000, fullBottlePrice: 3300000, status: "ACTIVE", image: "/images/jean-paul-gaultier-le-male.jpg" }] },
    { id: 9, name: "Le Labo", code: "LELABO", description: "New York / Paris", website: "https://www.lelabofragrances.com", email: "paris@lelabo.local", phone: "+33 1 42 71 52 16", address: "Paris, France", status: "ACTIVE", createdAt: "2026-10-30", machinesCount: 2, transactionsCount: 40, revenueValue: 730000, image: "/images/le-labo-another-13.jpg", products: [{ slotNumber: 14, skuCode: "SKU-LLB-14", name: "Le Labo Another 13", family: "Woody", concentration: "EDP", audience: "Niche", notes: "Ambroxan, Pear, Jasmine", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 13.5, kioskCode: "demo-device", kioskLocation: "Diamond Plaza", sprayPrice: 18000, retailPrice10ml: 540000, fullBottlePrice: 6500000, status: "ACTIVE", image: "/images/le-labo-another-13.jpg" }] },
    { id: 10, name: "Maison Margiela", code: "MARGIELA", description: "Paris, France", website: "https://www.maisonmargiela.com", email: "replica@margiela.local", phone: "+33 1 44 75 79 00", address: "Paris, France", status: "ACTIVE", createdAt: "2026-11-01", machinesCount: 1, transactionsCount: 22, revenueValue: 319000, image: "/images/maison-margiela-by-the-fireplace.jpg", products: [{ slotNumber: 16, skuCode: "SKU-MMG-16", name: "Replica By the Fireplace", family: "Woody Amber", concentration: "EDT", audience: "Unisex", notes: "Chestnut, Vanilla", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 80, kioskCode: "KIOSK-HN-02", kioskLocation: "Tràng Tiền Plaza", sprayPrice: 14500, retailPrice10ml: 435000, fullBottlePrice: 3650000, status: "ACTIVE", image: "/images/maison-margiela-by-the-fireplace.jpg" }] },
    { id: 11, name: "MCM Worldwide", code: "MCM", description: "Munich, Germany", website: "https://www.mcmworldwide.com", email: "contact@mcm.local", phone: "+49 89 2154 3000", address: "Munich, Germany", status: "ACTIVE", createdAt: "2026-11-02", machinesCount: 1, transactionsCount: 19, revenueValue: 228000, image: "/images/mcm-edp.jpg", products: [{ slotNumber: 18, skuCode: "SKU-MCM-18", name: "MCM Eau de Parfum", family: "Floral Woody", concentration: "EDP", audience: "Unisex", notes: "Raspberry, Apricot", volume: "75ml", bottleVolumeMl: 75, remainingVolumeMl: 66, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside", sprayPrice: 12000, retailPrice10ml: 360000, fullBottlePrice: 2650000, status: "ACTIVE", image: "/images/mcm-edp.jpg" }] },
    { id: 12, name: "Maison Francis Kurkdjian", code: "MFK", description: "Paris, France", website: "https://www.franciskurkdjian.com", email: "boutique@mfk.local", phone: "+33 1 42 60 07 07", address: "Paris, France", status: "ACTIVE", createdAt: "2026-11-04", machinesCount: 1, transactionsCount: 46, revenueValue: 966000, image: "/images/mfk-baccarat-rouge-540.jpg", products: [{ slotNumber: 19, skuCode: "SKU-MFK-19", name: "MFK Baccarat Rouge 540", family: "Oriental Floral", concentration: "EDP", audience: "Niche", notes: "Saffron, Amberwood", volume: "70ml", bottleVolumeMl: 70, remainingVolumeMl: 9, kioskCode: "demo-device", kioskLocation: "Diamond Plaza", sprayPrice: 21000, retailPrice10ml: 630000, fullBottlePrice: 7900000, status: "ACTIVE", image: "/images/mfk-baccarat-rouge-540.jpg" }] },
    { id: 13, name: "Montblanc", code: "MONTBLANC", description: "Hamburg, Germany", website: "https://www.montblanc.com", email: "service@montblanc.local", phone: "+49 40 8400 10", address: "Hamburg, Germany", status: "ACTIVE", createdAt: "2026-11-05", machinesCount: 1, transactionsCount: 30, revenueValue: 337500, image: "/images/montblanc-explorer.jpg", products: [{ slotNumber: 20, skuCode: "SKU-MTB-20", name: "Montblanc Explorer", family: "Woody", concentration: "EDP", audience: "Men", notes: "Bergamot, Vetiver", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 79, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall", sprayPrice: 11500, retailPrice10ml: 345000, fullBottlePrice: 2350000, status: "ACTIVE", image: "/images/montblanc-explorer.jpg" }] },
    { id: 14, name: "Narciso Rodriguez", code: "NARCISO", description: "New York, USA", website: "https://www.narcisorodriguez.com", email: "studio@narciso.local", phone: "+1 212 925 9091", address: "New York, USA", status: "ACTIVE", createdAt: "2026-11-06", machinesCount: 2, transactionsCount: 34, revenueValue: 450500, image: "/images/narciso-rodriguez-for-her.jpg", products: [{ slotNumber: 22, skuCode: "SKU-NAR-22", name: "Narciso Rodriguez For Her EDP", family: "Musk", concentration: "EDP", audience: "Women", notes: "Rose, Musk, Amber", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 61, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte West Lake", sprayPrice: 13000, retailPrice10ml: 390000, fullBottlePrice: 3350000, status: "ACTIVE", image: "/images/narciso-rodriguez-for-her.jpg" }] },
    { id: 15, name: "Paco Rabanne", code: "RABANNE", description: "Paris, France", website: "https://www.rabanne.com", email: "contact@rabanne.local", phone: "+33 1 53 67 60 00", address: "Paris, France", status: "ACTIVE", createdAt: "2026-11-08", machinesCount: 2, transactionsCount: 28, revenueValue: 350000, image: "/images/paco-rabanne-1-million.jpg", products: [{ slotNumber: 24, skuCode: "SKU-PRB-24", name: "Paco Rabanne 1 Million", family: "Woody Spicy", concentration: "EDT", audience: "Men", notes: "Mandarin, Cinnamon", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 66, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Đồng Khởi", sprayPrice: 12500, retailPrice10ml: 375000, fullBottlePrice: 2850000, status: "ACTIVE", image: "/images/paco-rabanne-1-million.jpg" }] },
    { id: 16, name: "Parfums de Marly", code: "PDM", description: "Paris, France", website: "https://www.parfums-de-marly.com", email: "vip@pdm.local", phone: "+33 1 42 60 41 16", address: "Paris, France", status: "ACTIVE", createdAt: "2026-11-09", machinesCount: 1, transactionsCount: 26, revenueValue: 481000, image: "/images/parfums-de-marly-sedley.jpg", products: [{ slotNumber: 26, skuCode: "SKU-PDM-26", name: "Parfums de Marly Sedley", family: "Woody", concentration: "EDP", audience: "Niche", notes: "Spearmint, Bergamot", volume: "125ml", bottleVolumeMl: 125, remainingVolumeMl: 68, kioskCode: "demo-device", kioskLocation: "Diamond Plaza", sprayPrice: 18500, retailPrice10ml: 555000, fullBottlePrice: 6400000, status: "ACTIVE", image: "/images/parfums-de-marly-sedley.jpg" }] },
    { id: 17, name: "Roja Parfums", code: "ROJA", description: "London, UK", website: "https://www.rojaparfums.com", email: "concierge@roja.local", phone: "+44 20 7734 9119", address: "London, UK", status: "ACTIVE", createdAt: "2026-11-10", machinesCount: 1, transactionsCount: 25, revenueValue: 550000, image: "/images/roja-elysium.jpg", products: [{ slotNumber: 27, skuCode: "SKU-ROJ-27", name: "Roja Parfums Elysium", family: "Fougere", concentration: "Parfum", audience: "Niche", notes: "Grapefruit, Vetiver", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 11, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall", sprayPrice: 22000, retailPrice10ml: 660000, fullBottlePrice: 7600000, status: "ACTIVE", image: "/images/roja-elysium.jpg" }] },
    { id: 18, name: "Tom Ford", code: "TOMFORD", description: "New York, USA", website: "https://www.tomford.com", email: "concierge@tomford.local", phone: "+1 888 866 3673", address: "New York, USA", status: "ACTIVE", createdAt: "2026-11-11", machinesCount: 2, transactionsCount: 22, revenueValue: 352000, image: "/images/tom-ford-black-orchid.jpg", products: [{ slotNumber: 28, skuCode: "SKU-TF-28", name: "Tom Ford Black Orchid", family: "Oriental", concentration: "EDP", audience: "Unisex", notes: "Black Orchid, Patchouli", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 48, kioskCode: "KIOSK-HN-02", kioskLocation: "Tràng Tiền Plaza", sprayPrice: 16000, retailPrice10ml: 480000, fullBottlePrice: 4350000, status: "ACTIVE", image: "/images/tom-ford-black-orchid.jpg" }] },
    { id: 19, name: "Valentino", code: "VALENTINO", description: "Rome, Italy", website: "https://www.valentino.com", email: "atelier@valentino.local", phone: "+39 06 6739 11", address: "Rome, Italy", status: "SUSPENDED", createdAt: "2026-11-12", machinesCount: 2, transactionsCount: 18, revenueValue: 234000, image: "/images/valentino-born-in-roma.jpg", products: [{ slotNumber: 29, skuCode: "SKU-VAL-29", name: "Valentino Born in Roma", family: "Floral", concentration: "EDP", audience: "Women", notes: "Blackcurrant, Vanilla", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 81, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall", sprayPrice: 13000, retailPrice10ml: 390000, fullBottlePrice: 3400000, status: "ACTIVE", image: "/images/valentino-born-in-roma.jpg" }] },
    { id: 20, name: "Versace", code: "VERSACE", description: "Milan, Italy", website: "https://www.versace.com", email: "support@versace.local", phone: "+39 02 7609 31", address: "Milan, Italy", status: "ACTIVE", createdAt: "2026-11-13", machinesCount: 3, transactionsCount: 44, revenueValue: 528000, image: "/images/versace-eros.jpg", products: [{ slotNumber: 32, skuCode: "SKU-VER-32", name: "Versace Eros", family: "Fougere", concentration: "EDP", audience: "Men", notes: "Mint, Green Apple", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 83, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Đồng Khởi", sprayPrice: 12500, retailPrice10ml: 375000, fullBottlePrice: 2700000, status: "ACTIVE", image: "/images/versace-eros.jpg" }] },
    { id: 21, name: "Yves Saint Laurent", code: "YSL", description: "Paris, France", website: "https://www.ysl.com", email: "contact@ysl.local", phone: "+33 1 53 67 70 00", address: "Paris, France", status: "INACTIVE", createdAt: "2026-11-14", machinesCount: 2, transactionsCount: 30, revenueValue: 420000, image: "/images/ysl-libre.jpg", products: [{ slotNumber: 33, skuCode: "SKU-YSL-33", name: "YSL Libre Eau de Parfum", family: "Fougere", concentration: "EDP", audience: "Women", notes: "Lavender, Vanilla", volume: "90ml", bottleVolumeMl: 90, remainingVolumeMl: 14, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre", sprayPrice: 14000, retailPrice10ml: 420000, fullBottlePrice: 3750000, status: "ACTIVE", image: "/images/ysl-libre.jpg" }] },
];

const BRANDS_STORAGE_KEY = "scentstation_commercial_brands_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type QuickDatePreset = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "CUSTOM";

export default function BrandsManagementPage(): React.ReactElement {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");
    const [brandTenantScope, setBrandTenantScope] = useState<string | null>(null);

    const [brands, setBrands] = useState<BrandItem[]>(INITIAL_21_BRANDS);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<"NAME" | "CREATED_DATE" | "PERFORMANCE">("NAME");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [openDropdown, setOpenDropdown] = useState<"CALENDAR" | "STATUS" | "SORT" | "MODAL_STATUS" | "MODAL_IMAGE" | null>(null);

    const [liveFleetSlotsByBrand, setLiveFleetSlotsByBrand] = useState<Record<string, LiveBrandKioskSlot[]>>({});
    const [liveTxsByBrand, setLiveTxsByBrand] = useState<Record<string, LiveBrandTransaction[]>>({});

    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<"overview" | "products" | "machines" | "transactions" | "analytics">("overview");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [selectedTxReceipt, setSelectedTxReceipt] = useState<LiveBrandTransaction | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
    const [formName, setFormName] = useState("");
    const [formCode, setFormCode] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formAddress, setFormAddress] = useState("");
    const [formWebsite, setFormWebsite] = useState("");
    const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE" | "SUSPENDED">("ACTIVE");
    const [formImage, setFormImage] = useState("/images/bleu-de-chanel.png");
    const [formError, setFormError] = useState("");

    // Phân quyền chuẩn 6 vai trò nội bộ (khớp src/lib/rbac.ts)
    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canCreateBrand = currentRole === "PSA";
    const canSuspendBrand = currentRole === "PSA";
    const canEditBrand = currentRole === "PSA" || currentRole === "BA";

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

    const formatStatus = (st: BrandItem["status"]) => {
        if (lang === "en") return st === "ACTIVE" ? "Active" : st === "SUSPENDED" ? "Suspended" : "Inactive";
        return st === "ACTIVE" ? "Hoạt động" : st === "SUSPENDED" ? "Đình chỉ" : "Tạm ngưng";
    };

    const handleApplyDatePreset = useCallback((preset: QuickDatePreset) => {
        const now = new Date();
        const todayStr = toLocalYmd(now);
        setDatePreset(preset);
        if (preset === "TODAY") {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (preset === "THIS_WEEK") {
            const dow = now.getDay();
            const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (dow === 0 ? -6 : 1 - dow));
            const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
            setStartDate(toLocalYmd(mon));
            setEndDate(toLocalYmd(sun));
        } else if (preset === "THIS_MONTH") {
            setStartDate(toLocalYmd(new Date(now.getFullYear(), now.getMonth(), 1)));
            setEndDate(toLocalYmd(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
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
            cells.push({ ymd: toLocalYmd(new Date(calendarViewYear, calendarViewMonth - 1, prevMonthDays - i)), dayNum: prevMonthDays - i, isCurrentMonth: false });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ ymd: toLocalYmd(new Date(calendarViewYear, calendarViewMonth, d)), dayNum: d, isCurrentMonth: true });
        }
        while (cells.length < 42) {
            const nextD = cells.length - (startWeekday + daysInMonth) + 1;
            cells.push({ ymd: toLocalYmd(new Date(calendarViewYear, calendarViewMonth + 1, nextD)), dayNum: nextD, isCurrentMonth: false });
        }
        return cells;
    }, [calendarViewYear, calendarViewMonth]);

    const handleSelectCalendarDay = (pickedYmd: string) => {
        setDatePreset("CUSTOM");
        if (selectingEdge === "START") {
            setStartDate(pickedYmd);
            if (pickedYmd > endDate) setEndDate(pickedYmd);
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

    const monthTitleText = useMemo(
        () => new Date(calendarViewYear, calendarViewMonth, 1).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", { month: "long", year: "numeric" }),
        [calendarViewYear, calendarViewMonth, lang]
    );

    const selectedBrand = useMemo(() => brands.find((b) => b.id === selectedBrandId) || null, [brands, selectedBrandId]);

    const loadAndReconcileBrandsData = useCallback(() => {
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
                setCurrentActorLabel(parsedUser.fullName || parsedUser.name || ROLE_PERMISSIONS[resolvedRole].label);
                if (resolvedRole === "BA" && (parsedUser.brandScope || parsedUser.brand)) {
                    setBrandTenantScope(parsedUser.brandScope || parsedUser.brand);
                } else {
                    setBrandTenantScope(null);
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};

            let workingBrands: BrandItem[] = [...INITIAL_21_BRANDS];
            const rawSavedBrands = localStorage.getItem(BRANDS_STORAGE_KEY);
            if (rawSavedBrands) {
                const parsedBrands = JSON.parse(rawSavedBrands);
                if (Array.isArray(parsedBrands) && parsedBrands.length > 0) workingBrands = parsedBrands;
            }

            const brandKioskMap: Record<string, LiveBrandKioskSlot[]> = {};
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    parsedMachines.forEach((m: any) => {
                        const kCode = m.code || m.id || "demo-device";
                        if (Array.isArray(m.slots)) {
                            m.slots.forEach((sl: any, sIdx: number) => {
                                const bKey = String(sl.brand || "").trim().toLowerCase();
                                if (!bKey) return;
                                const fKey = String(sl.fragranceName || "").trim().toLowerCase();
                                const remMl = typeof perKioskMatrix[kCode.toLowerCase()]?.[fKey] === "number" ? perKioskMatrix[kCode.toLowerCase()][fKey] : Number(sl.remainingMl ?? 70);
                                if (!brandKioskMap[bKey]) brandKioskMap[bKey] = [];
                                brandKioskMap[bKey].push({
                                    kioskCode: kCode,
                                    kioskName: m.locationName || m.name || kCode,
                                    address: m.address || m.location || "",
                                    status: m.status || "ONLINE",
                                    chamberTemp: m.chamberTemp || "21.4°C",
                                    slotLabel: sl.slotLabel || `Slot 0${sIdx + 1}`,
                                    slotNumber: Number(sl.slotNumber || sIdx + 1),
                                    fragranceName: sl.fragranceName || "",
                                    sprayPrice: Number(sl.pricePerSpray || 15000),
                                    remainingMl: Number(Math.max(0, remMl).toFixed(2)),
                                    capacityMl: Number(sl.capacityMl ?? 100),
                                });
                            });
                        }
                    });
                }
            }
            setLiveFleetSlotsByBrand(brandKioskMap);

            const brandTxMap: Record<string, LiveBrandTransaction[]> = {};
            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            if (rawDash) {
                const parsedDash = JSON.parse(rawDash);
                if (Array.isArray(parsedDash.transactions)) {
                    parsedDash.transactions.forEach((tx: any) => {
                        const bKey = String(tx.brand || "").trim().toLowerCase();
                        if (!bKey) return;
                        if (!brandTxMap[bKey]) brandTxMap[bKey] = [];
                        const dStr = String(tx.createdAt || "").includes("T") ? String(tx.createdAt).split("T")[0] : todayYmd;
                        brandTxMap[bKey].push({
                            id: tx.id || "TXN-2026-9100",
                            dateStr: dStr,
                            kiosk: tx.kiosk || "demo-device",
                            productName: tx.product || "",
                            slotNumber: Number(tx.slotNumber || 1),
                            amount: Number(tx.amount ?? tx.priceSnapshot ?? 15000),
                            paymentMethod: tx.paymentMethod || "VIETQR",
                            time: tx.timestamp || tx.time || dStr,
                            status: tx.status || "DISPENSED",
                        });
                    });
                }
            }
            setLiveTxsByBrand(brandTxMap);
            setBrands(workingBrands);
        } catch {
            // Safe fallback
        }
    }, [todayYmd]);

    useEffect(() => {
        loadAndReconcileBrandsData();
        const handleSync = () => loadAndReconcileBrandsData();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadAndReconcileBrandsData]);

    const persistBrandsAndSyncAllModules = useCallback(
        (nextBrands: BrandItem[], auditEvent?: { action: string; target: string; detail: string }) => {
            setBrands(nextBrands);
            try {
                localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(nextBrands));
                const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                if (rawProds) {
                    const parsedProds = JSON.parse(rawProds);
                    if (Array.isArray(parsedProds)) {
                        const updatedProds = parsedProds.map((p: any) => {
                            const parentBrand = nextBrands.find((b) => isExactMatch(b.name, p.brand || ""));
                            if (!parentBrand) return p;
                            return { ...p, status: parentBrand.status === "ACTIVE" ? "ACTIVE" : "INACTIVE" };
                        });
                        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProds));
                    }
                }
                if (auditEvent) {
                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                    auditList.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: new Date().toISOString(),
                        actor: currentActorLabel,
                        role: currentRole,
                        tenant: auditEvent.target,
                        action: auditEvent.action,
                        entityType: "BRANDS",
                        entityId: auditEvent.target,
                        severity: "INFO",
                        newValues: { detail: auditEvent.detail },
                        sourceIp: "127.0.0.1",
                    });
                    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditList.slice(0, 250)));
                }
                window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        [currentActorLabel, currentRole]
    );

    const scopedBrands = useMemo(() => {
        if (!brandTenantScope) return brands;
        return brands.filter((b) => isExactMatch(b.name, brandTenantScope));
    }, [brands, brandTenantScope]);

    const overviewKpis = useMemo(() => ({
        totalHouses: scopedBrands.length,
        activeHouses: scopedBrands.filter((b) => b.status === "ACTIVE").length,
        totalSkus: scopedBrands.reduce((acc, b) => acc + b.products.length, 0),
        totalRevenue: scopedBrands.reduce((acc, b) => acc + b.revenueValue, 0),
        totalTransactions: scopedBrands.reduce((acc, b) => acc + b.transactionsCount, 0),
    }), [scopedBrands]);

    const filteredBrands = useMemo(() => {
        return scopedBrands
            .filter((b) => {
                const q = searchQuery.toLowerCase().trim();
                const matchesSearch = !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.products.some((p) => p.name.toLowerCase().includes(q));
                const matchesStatus = selectedStatus === "ALL" || b.status === selectedStatus;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === "NAME") return a.name.localeCompare(b.name);
                if (sortBy === "CREATED_DATE") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                return b.revenueValue - a.revenueValue;
            });
    }, [scopedBrands, searchQuery, selectedStatus, sortBy]);

    const handleCopy = (text: string, fieldName: string) => {
        void navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 1500);
    };

    const handleDirectLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBrand || !canEditBrand) return;
        const reader = new FileReader();
        reader.onload = () => {
            const base64Url = String(reader.result || selectedBrand.image);
            const nextList = brands.map((b) => (b.id === selectedBrand.id ? { ...b, image: base64Url } : b));
            persistBrandsAndSyncAllModules(nextList, { action: "BRAND_LOGO_UPDATED", target: selectedBrand.code, detail: file.name });
            showToast(lang === "en" ? "Logo updated." : "Đã cập nhật ảnh đại diện.");
        };
        reader.readAsDataURL(file);
    };

    const handleToggleBrandStatus = (brand: BrandItem) => {
        if (!canSuspendBrand) return;
        const nextStatus: BrandItem["status"] = brand.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        if (nextStatus === "SUSPENDED") {
            const ok = window.confirm(
                lang === "en"
                    ? `Suspend ${brand.name}? This will deactivate its ${brand.products.length} product(s) on kiosks.`
                    : `Tạm ngưng ${brand.name}? Thao tác này sẽ tạm ẩn ${brand.products.length} sản phẩm thuộc hãng trên các máy Kiosk.`
            );
            if (!ok) return;
        }
        const nextList: BrandItem[] = brands.map((b) =>
            b.id === brand.id
                ? {
                    ...b,
                    status: nextStatus,
                    products: b.products.map((p) => ({
                        ...p,
                        status: (nextStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE") as "ACTIVE" | "INACTIVE",
                    })),
                }
                : b
        );
        persistBrandsAndSyncAllModules(nextList, { action: `BRAND_STATUS_${nextStatus}`, target: brand.code, detail: `${brand.name} → ${nextStatus}` });
        showToast(lang === "en" ? `Updated ${brand.name} to ${nextStatus}.` : `Đã chuyển ${brand.name} sang ${formatStatus(nextStatus)}.`);
    };

    const openAddModal = () => {
        if (!canCreateBrand) return;
        setEditingBrand(null);
        setFormName("");
        setFormCode("");
        setFormDesc("");
        setFormEmail("");
        setFormPhone("");
        setFormAddress("");
        setFormWebsite("");
        setFormStatus("ACTIVE");
        setFormImage("/images/bleu-de-chanel.png");
        setFormError("");
        setIsModalOpen(true);
    };

    const openEditModal = (brand: BrandItem, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!canEditBrand) return;
        setEditingBrand(brand);
        setFormName(brand.name);
        setFormCode(brand.code);
        setFormDesc(brand.description);
        setFormEmail(brand.email);
        setFormPhone(brand.phone);
        setFormAddress(brand.address);
        setFormWebsite(brand.website);
        setFormStatus(brand.status);
        setFormImage(brand.image);
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSaveBrand = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError("");
        const trimmedName = formName.trim();
        const trimmedCode = formCode.trim().toUpperCase();

        if (!trimmedName || !trimmedCode || !formEmail.trim()) {
            setFormError(lang === "en" ? "Name, code, and email are required." : "Vui lòng nhập tên, mã và email.");
            return;
        }

        const isDuplicate = brands.some(
            (b) => (b.name.toLowerCase() === trimmedName.toLowerCase() || b.code.toUpperCase() === trimmedCode) && b.id !== editingBrand?.id
        );
        if (isDuplicate) {
            setFormError(lang === "en" ? "Brand name or code already exists." : "Tên thương hiệu hoặc mã đối tác đã tồn tại.");
            return;
        }

        if (editingBrand) {
            const nextList = brands.map((b) =>
                b.id === editingBrand.id
                    ? { ...b, name: trimmedName, code: trimmedCode, description: formDesc, email: formEmail, phone: formPhone, address: formAddress, website: formWebsite, status: canSuspendBrand ? formStatus : b.status, image: formImage }
                    : b
            );
            persistBrandsAndSyncAllModules(nextList, { action: "BRAND_UPDATED", target: trimmedCode, detail: trimmedName });
            showToast(lang === "en" ? `Updated ${trimmedName}.` : `Đã cập nhật ${trimmedName}.`);
        } else {
            const newBrand: BrandItem = {
                id: Date.now(),
                name: trimmedName,
                code: trimmedCode,
                description: formDesc || "—",
                website: formWebsite || "https://scentstation.local",
                email: formEmail,
                phone: formPhone || "—",
                address: formAddress || "—",
                status: formStatus,
                createdAt: todayYmd,
                machinesCount: 0,
                transactionsCount: 0,
                revenueValue: 0,
                image: formImage,
                products: [],
            };
            persistBrandsAndSyncAllModules([newBrand, ...brands], { action: "BRAND_CREATED", target: trimmedCode, detail: trimmedName });
            showToast(lang === "en" ? `Added ${trimmedName}.` : `Đã thêm thương hiệu ${trimmedName}.`);
        }
        setIsModalOpen(false);
    };

    const renderStatusBadge = (status: BrandItem["status"]) => {
        if (status === "ACTIVE") return <span className={styles.badgeActive}><CheckCircle2 size={12} /> {formatStatus(status)}</span>;
        if (status === "SUSPENDED") return <span className={styles.badgeLocked}><AlertCircle size={12} /> {formatStatus(status)}</span>;
        return <span className={styles.badgeInactive}><AlertCircle size={12} /> {formatStatus(status)}</span>;
    };

    const selectedBrandLiveSlots = useMemo(() => {
        if (!selectedBrand) return [];
        const rawSlots = liveFleetSlotsByBrand[selectedBrand.name.toLowerCase()] || [];
        return selectedBrand.products.map((prod) => {
            const matched = rawSlots.find((s) => isExactMatch(s.fragranceName, prod.name));
            return {
                kioskCode: matched?.kioskCode || prod.kioskCode || "demo-device",
                kioskName: matched?.kioskName || prod.kioskLocation || "Diamond Plaza",
                address: matched?.address || prod.kioskLocation || "",
                status: matched?.status || "ONLINE",
                chamberTemp: matched?.chamberTemp || "21.5°C",
                slotLabel: matched?.slotLabel || `Slot 0${((prod.slotNumber - 1) % 4) + 1}`,
                slotNumber: prod.slotNumber,
                fragranceName: prod.name,
                sprayPrice: prod.sprayPrice,
                remainingMl: matched?.remainingMl ?? prod.remainingVolumeMl ?? 70,
                capacityMl: matched?.capacityMl ?? prod.bottleVolumeMl ?? 100,
            };
        });
    }, [selectedBrand, liveFleetSlotsByBrand]);

    const selectedBrandLiveTransactions = useMemo(() => {
        if (!selectedBrand) return [];
        return (liveTxsByBrand[selectedBrand.name.toLowerCase()] || []).filter((t) => t.dateStr >= startDate && t.dateStr <= endDate);
    }, [selectedBrand, liveTxsByBrand, startDate, endDate]);

    return (
        <div className={`${styles.container} notranslate`} translate="no" onClick={() => setOpenDropdown(null)}>
            <input type="file" ref={fileInputRef} onChange={handleDirectLogoUpload} accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} />

            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Brands & Tenants" : "Thương hiệu & Đối tác"}</h1>
                        <div className={styles.scopeBadge}>
                            <span>{roleConfig.label}</span>
                            {brandTenantScope && <span>• {brandTenantScope}</span>}
                        </div>
                    </div>

                    <div className={styles.headerActions} onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={handleToggleLanguage} className={styles.secondaryGoldBtn}>
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        {canCreateBrand && (
                            <button type="button" onClick={openAddModal} className={styles.primaryGoldBtn}>
                                <Plus size={15} />
                                <span>{lang === "en" ? "Add Brand" : "Thêm thương hiệu"}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 4 KPI */}
                <div className={styles.kpiGrid4}>
                    <div className={`${styles.kpiCard} ${selectedStatus === "ALL" ? styles.kpiCardActive : ""}`} onClick={() => setSelectedStatus("ALL")}>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Total Brands" : "Tổng thương hiệu"}</div>
                        <div style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0.25rem 0" }}>{overviewKpis.totalHouses}</div>
                        <div style={{ fontSize: "0.76rem", color: "#34D399" }}>{overviewKpis.activeHouses} {lang === "en" ? "active" : "hoạt động"}</div>
                    </div>

                    <div className={`${styles.kpiCard} ${selectedStatus === "ACTIVE" ? styles.kpiCardActive : ""}`} onClick={() => setSelectedStatus(selectedStatus === "ACTIVE" ? "ALL" : "ACTIVE")}>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Associated SKUs" : "Tổng sản phẩm"}</div>
                        <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#34D399", margin: "0.25rem 0" }}>{overviewKpis.totalSkus}</div>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>{lang === "en" ? "Synced with Catalog" : "Đồng bộ Danh mục"}</div>
                    </div>

                    <div className={styles.kpiCard} onClick={() => setSortBy("PERFORMANCE")}>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Recognized Revenue" : "Doanh thu ghi nhận"}</div>
                        <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#F5E6AD", margin: "0.25rem 0" }}>{formatPrice(overviewKpis.totalRevenue)}</div>
                        <div style={{ fontSize: "0.76rem", color: "#34D399" }}>{overviewKpis.totalTransactions} {lang === "en" ? "sprays" : "lượt xịt"}</div>
                    </div>

                    <div className={styles.kpiCard} onClick={() => router.push("/machines")}>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Stations" : "Trạm Kiosk"}</div>
                        <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#38BDF8", margin: "0.25rem 0" }}>8</div>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>{lang === "en" ? "View Fleet" : "Xem đội máy"}</div>
                    </div>
                </div>
            </div>

            {/* BỘ LỌC */}
            <div className={styles.filterBar} onClick={(e) => e.stopPropagation()}>
                <div className={styles.filterRowTop}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={lang === "en" ? "Search brand name, code, or product..." : "Tìm tên thương hiệu, mã đối tác, sản phẩm..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.6rem", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* LỊCH */}
                    <div className={styles.customDropdownWrap}>
                        <button type="button" onClick={() => setOpenDropdown(openDropdown === "CALENDAR" ? null : "CALENDAR")} className={styles.customDropdownTrigger}>
                            <Calendar size={14} color="#D4AF37" />
                            <span>{formatFullDisplayDate(startDate)} — {formatFullDisplayDate(endDate)}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "CALENDAR" && (
                            <div className={styles.calendarPopover}>
                                <div className={styles.calendarHeader}>
                                    <button type="button" onClick={() => { if (calendarViewMonth === 0) { setCalendarViewMonth(11); setCalendarViewYear((y) => y - 1); } else { setCalendarViewMonth((m) => m - 1); } }} className={styles.calendarNavBtn}><ChevronLeft size={14} /></button>
                                    <span className={styles.calendarMonthTitle}>{monthTitleText}</span>
                                    <button type="button" onClick={() => { if (calendarViewMonth === 11) { setCalendarViewMonth(0); setCalendarViewYear((y) => y + 1); } else { setCalendarViewMonth((m) => m + 1); } }} className={styles.calendarNavBtn}><ChevronRight size={14} /></button>
                                </div>
                                <div className={styles.calendarWeekdaysGrid}>
                                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((wd) => <span key={wd}>{wd}</span>)}
                                </div>
                                <div className={styles.calendarDaysGrid}>
                                    {calendarGridCells.map((cell) => (
                                        <button key={cell.ymd} type="button" onClick={() => handleSelectCalendarDay(cell.ymd)} className={`${styles.calendarDayBtn} ${!cell.isCurrentMonth ? styles.calendarDayMuted : ""} ${cell.ymd > startDate && cell.ymd < endDate ? styles.calendarDayInRange : ""} ${cell.ymd === startDate || cell.ymd === endDate ? styles.calendarDaySelected : ""}`}>
                                            {cell.dayNum}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TRẠNG THÁI */}
                    <div className={styles.customDropdownWrap}>
                        <button type="button" onClick={() => setOpenDropdown(openDropdown === "STATUS" ? null : "STATUS")} className={styles.customDropdownTrigger}>
                            <span>{selectedStatus === "ALL" ? (lang === "en" ? "All Status" : "Mọi trạng thái") : formatStatus(selectedStatus as BrandItem["status"])}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}>
                                {(["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((s) => (
                                    <button key={s} type="button" onClick={() => { setSelectedStatus(s); setOpenDropdown(null); }} className={`${styles.customDropdownItem} ${selectedStatus === s ? styles.customDropdownItemActive : ""}`}>
                                        <span>{s === "ALL" ? (lang === "en" ? "All Status" : "Mọi trạng thái") : formatStatus(s)}</span>
                                        {selectedStatus === s && <Check size={13} color="#D4AF37" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SẮP XẾP */}
                    <div className={styles.customDropdownWrap}>
                        <button type="button" onClick={() => setOpenDropdown(openDropdown === "SORT" ? null : "SORT")} className={styles.customDropdownTrigger}>
                            <ArrowUpDown size={13} color="#D4AF37" />
                            <span>
                                {sortBy === "NAME"
                                    ? lang === "en" ? "Name (A-Z)" : "Tên (A-Z)"
                                    : sortBy === "CREATED_DATE"
                                        ? lang === "en" ? "Date" : "Ngày tạo"
                                        : lang === "en" ? "Revenue" : "Doanh thu"}
                            </span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "SORT" && (
                            <div className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}>
                                {(["NAME", "CREATED_DATE", "PERFORMANCE"] as const).map((c) => (
                                    <button key={c} type="button" onClick={() => { setSortBy(c); setOpenDropdown(null); }} className={`${styles.customDropdownItem} ${sortBy === c ? styles.customDropdownItemActive : ""}`}>
                                        <span>{c === "NAME" ? (lang === "en" ? "Name (A-Z)" : "Tên (A-Z)") : c === "CREATED_DATE" ? (lang === "en" ? "Date" : "Ngày tạo") : (lang === "en" ? "Revenue" : "Doanh thu")}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", background: "#0B0D14", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "9px", padding: "0.15rem" }}>
                        <button type="button" onClick={() => setViewMode("grid")} style={{ background: viewMode === "grid" ? "rgba(212,175,55,0.2)" : "transparent", border: "none", color: viewMode === "grid" ? "#F5E6AD" : "#94A3B8", padding: "0.35rem 0.55rem", borderRadius: "7px", cursor: "pointer" }}><LayoutGrid size={15} /></button>
                        <button type="button" onClick={() => setViewMode("list")} style={{ background: viewMode === "list" ? "rgba(212,175,55,0.2)" : "transparent", border: "none", color: viewMode === "list" ? "#F5E6AD" : "#94A3B8", padding: "0.35rem 0.55rem", borderRadius: "7px", cursor: "pointer" }}><ListIcon size={15} /></button>
                    </div>
                </div>

                <div className={styles.filterRowBottom}>
                    <div className={styles.quickRangePillsGroup}>
                        {(
                            [
                                { id: "TODAY", label: lang === "en" ? "Today" : "Hôm nay" },
                                { id: "THIS_WEEK", label: lang === "en" ? "This Week" : "Tuần này" },
                                { id: "THIS_MONTH", label: lang === "en" ? "This Month" : "Tháng này" },
                                { id: "LAST_30_DAYS", label: lang === "en" ? "30 Days" : "30 ngày" },
                            ] as const
                        ).map((preset) => (
                            <button key={preset.id} type="button" onClick={() => handleApplyDatePreset(preset.id)} className={`${styles.quickRangePill} ${datePreset === preset.id ? styles.quickRangePillActive : ""}`}>
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <button type="button" onClick={() => { setSearchQuery(""); setSelectedStatus("ALL"); setSortBy("NAME"); handleApplyDatePreset("LAST_30_DAYS"); }} className={styles.secondaryGoldBtn}>
                        <RefreshCw size={13} />
                        <span>{lang === "en" ? "Clear Filters" : "Xóa lọc"}</span>
                    </button>
                </div>
            </div>

            {/* DANH SÁCH THƯƠNG HIỆU */}
            {filteredBrands.length > 0 ? (
                viewMode === "grid" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                        {filteredBrands.map((brand) => (
                            <div
                                key={brand.id}
                                onClick={() => { setSelectedBrandId(brand.id); setActiveDetailTab("overview"); }}
                                style={{ background: "#121622", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", padding: "1.1rem", cursor: "pointer" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                                    <div className={styles.productImageCell}>
                                        <div className={styles.imagePlaceholder}>
                                            <Image src={brand.image} alt={brand.name} fill sizes="44px" style={{ objectFit: "cover" }} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>{brand.name}</h3>
                                            <span style={{ fontSize: "0.74rem", color: "#F5E6AD" }}>{brand.code} • {brand.products.length} SKU</span>
                                        </div>
                                    </div>
                                    {renderStatusBadge(brand.status)}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#CBD5E1", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.65rem" }}>
                                    <span>{brand.machinesCount} {lang === "en" ? "stations" : "trạm"}</span>
                                    <strong style={{ color: "#34D399" }}>{formatPrice(brand.revenueValue)}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.tableCard}>
                        <div className={styles.tableScrollContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                <tr>
                                    <th>{lang === "en" ? "Brand" : "Thương hiệu"}</th>
                                    <th>{lang === "en" ? "Code" : "Mã"}</th>
                                    <th>{lang === "en" ? "Products" : "Sản phẩm"}</th>
                                    <th>{lang === "en" ? "Revenue" : "Doanh thu"} ({formatShortDdMm(startDate)}–{formatShortDdMm(endDate)})</th>
                                    <th style={{ textAlign: "center" }}>{lang === "en" ? "Status" : "Trạng thái"}</th>
                                    <th style={{ textAlign: "right" }}>{lang === "en" ? "Actions" : "Thao tác"}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredBrands.map((brand) => (
                                    <tr key={brand.id} className={styles.tableRow} onClick={() => { setSelectedBrandId(brand.id); setActiveDetailTab("overview"); }}>
                                        <td className={styles.tableCell}>
                                            <div className={styles.productImageCell}>
                                                <div className={styles.imagePlaceholder}>
                                                    <Image src={brand.image} alt={brand.name} fill sizes="44px" style={{ objectFit: "cover" }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{brand.name}</div>
                                                    <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{brand.address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 700 }}>
                                            {brand.code}
                                            <div style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 500 }}>{brand.createdAt}</div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <strong>{brand.products.length} SKUs</strong>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{brand.machinesCount} {lang === "en" ? "stations" : "trạm"}</div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <strong style={{ color: "#34D399" }}>{formatPrice(brand.revenueValue)}</strong>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{brand.transactionsCount} {lang === "en" ? "sprays" : "lượt xịt"}</div>
                                        </td>
                                        <td className={styles.tableCell} style={{ textAlign: "center" }}>{renderStatusBadge(brand.status)}</td>
                                        <td className={styles.tableCell} style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                                                {canEditBrand && (
                                                    <button type="button" className={styles.actionButton} style={{ padding: "0.38rem 0.55rem" }} onClick={(e) => openEditModal(brand, e)} title={lang === "en" ? "Edit" : "Sửa"}>
                                                        <Edit3 size={14} color="#D4AF37" />
                                                    </button>
                                                )}
                                                <button type="button" className={styles.actionButton} style={{ padding: "0.38rem 0.55rem" }} onClick={() => { setSelectedBrandId(brand.id); setActiveDetailTab("overview"); }} title={lang === "en" ? "View" : "Xem"}>
                                                    <Eye size={14} color="#D4AF37" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                <div style={{ textAlign: "center", padding: "3rem", background: "#121622", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <p style={{ fontWeight: 700, color: "#F5E6AD", marginBottom: "0.75rem" }}>{lang === "en" ? "No brands found" : "Không có thương hiệu phù hợp"}</p>
                    <button type="button" onClick={() => { setSearchQuery(""); setSelectedStatus("ALL"); }} className={styles.secondaryGoldBtn}>
                        {lang === "en" ? "Clear Filters" : "Xóa bộ lọc"}
                    </button>
                </div>
            )}

            {/* MODAL CHI TIẾT THƯƠNG HIỆU */}
            {selectedBrand && (
                <div className={styles.drawerOverlay} onClick={() => setSelectedBrandId(null)}>
                    <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.drawerHeroBanner}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                <div className={styles.productImageCell}>
                                    <div className={styles.imagePlaceholder} style={{ width: "52px", height: "52px" }}>
                                        <Image src={selectedBrand.image} alt={selectedBrand.name} fill sizes="52px" style={{ objectFit: "cover" }} />
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <strong style={{ color: "#D4AF37", fontSize: "0.8rem" }}>{selectedBrand.code}</strong>
                                            {renderStatusBadge(selectedBrand.status)}
                                        </div>
                                        <h2 style={{ fontSize: "1.25rem", margin: "0.15rem 0 0 0", fontWeight: 700 }}>{selectedBrand.name}</h2>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "0.45rem" }}>
                                    {canSuspendBrand && (
                                        <button type="button" onClick={() => handleToggleBrandStatus(selectedBrand)} className={styles.secondaryGoldBtn}>
                                            <Power size={13} color={selectedBrand.status === "ACTIVE" ? "#F87171" : "#34D399"} />
                                            <span>{selectedBrand.status === "ACTIVE" ? (lang === "en" ? "Suspend" : "Tạm ngưng") : (lang === "en" ? "Activate" : "Kích hoạt")}</span>
                                        </button>
                                    )}
                                    {canEditBrand && (
                                        <button type="button" onClick={() => openEditModal(selectedBrand)} className={styles.primaryGoldBtn}>
                                            <Edit3 size={13} />
                                            <span>{lang === "en" ? "Edit" : "Sửa"}</span>
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setSelectedBrandId(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.45rem 0.6rem" }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerTabsBar}>
                            {[
                                { id: "overview", label: lang === "en" ? "Overview" : "Tổng quan", icon: Building2 },
                                { id: "products", label: lang === "en" ? "Products" : "Sản phẩm", icon: Sparkles, count: selectedBrand.products.length },
                                { id: "machines", label: lang === "en" ? "Stations" : "Trạm máy", icon: Cpu, count: selectedBrandLiveSlots.length },
                                { id: "transactions", label: lang === "en" ? "Orders" : "Giao dịch", icon: Receipt, count: selectedBrandLiveTransactions.length },
                                { id: "analytics", label: lang === "en" ? "Summary" : "Thống kê", icon: BarChart3 },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id} type="button" onClick={() => setActiveDetailTab(tab.id as any)} className={`${styles.drawerTabBtn} ${activeDetailTab === tab.id ? styles.drawerTabBtnActive : ""}`}>
                                        <Icon size={13} />
                                        <span>{tab.label}</span>
                                        {typeof tab.count === "number" && <span className={styles.drawerTabBadge}>{tab.count}</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.drawerBody}>
                            {activeDetailTab === "overview" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                        <div className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>Email</div>
                                                <div style={{ fontWeight: 600 }}><Mail size={13} color="#D4AF37" style={{ display: "inline", marginRight: "5px" }} />{selectedBrand.email}</div>
                                            </div>
                                            <button type="button" onClick={() => handleCopy(selectedBrand.email, "email")} className={styles.actionButton} style={{ padding: "0.35rem" }}>
                                                {copiedField === "email" ? <Check size={13} color="#34D399" /> : <Copy size={13} />}
                                            </button>
                                        </div>

                                        <div className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "Phone" : "Điện thoại"}</div>
                                                <div style={{ fontWeight: 600 }}><Phone size={13} color="#D4AF37" style={{ display: "inline", marginRight: "5px" }} />{selectedBrand.phone}</div>
                                            </div>
                                            <button type="button" onClick={() => handleCopy(selectedBrand.phone, "phone")} className={styles.actionButton} style={{ padding: "0.35rem" }}>
                                                {copiedField === "phone" ? <Check size={13} color="#34D399" /> : <Copy size={13} />}
                                            </button>
                                        </div>

                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>Website</div>
                                            <a href={selectedBrand.website} target="_blank" rel="noreferrer" style={{ color: "#F5E6AD", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                <span>{selectedBrand.website}</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>

                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "Address" : "Địa chỉ"}</div>
                                            <div><MapPin size={13} color="#D4AF37" style={{ display: "inline", marginRight: "4px" }} />{selectedBrand.address}</div>
                                        </div>
                                    </div>

                                    {canEditBrand && (
                                        <div className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "0.84rem", color: "#CBD5E1" }}>{lang === "en" ? "Brand cover image (PNG/JPG/WEBP)" : "Ảnh đại diện thương hiệu (PNG/JPG/WEBP)"}</span>
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.secondaryGoldBtn}>
                                                <Upload size={13} color="#D4AF37" />
                                                <span>{lang === "en" ? "Upload Image" : "Tải ảnh lên"}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeDetailTab === "products" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {selectedBrand.products.map((prod) => (
                                        <div key={prod.slotNumber} className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div className={styles.productImageCell}>
                                                <div className={styles.imagePlaceholder}>
                                                    <Image src={prod.image} alt={prod.name} fill sizes="44px" style={{ objectFit: "cover" }} />
                                                </div>
                                                <div>
                                                    <strong>{prod.name}</strong>
                                                    <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>
                                                        {prod.concentration} • {formatPrice(prod.sprayPrice)} • {prod.remainingVolumeMl ?? 70}ml / {prod.bottleVolumeMl ?? 100}ml
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => router.push("/products")} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.7rem", fontSize: "0.76rem" }}>
                                                {lang === "en" ? "Open Catalog" : "Mở danh mục"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeDetailTab === "machines" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {selectedBrandLiveSlots.map((m, idx) => (
                                        <div key={`${m.kioskCode}-${idx}`} className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <strong style={{ color: "#F5E6AD" }}>{m.kioskCode} • {m.slotLabel}</strong> — {m.fragranceName}
                                                <div style={{ fontSize: "0.76rem", color: "#94A3B8", marginTop: "2px" }}>
                                                    {m.kioskName} • <Thermometer size={12} style={{ display: "inline" }} /> {m.chamberTemp} • {m.remainingMl}ml / {m.capacityMl}ml
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => router.push(`/machines/${encodeURIComponent(m.kioskCode)}`)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.7rem", fontSize: "0.76rem" }}>
                                                {lang === "en" ? "Inspect" : "Xem máy"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeDetailTab === "transactions" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                    {selectedBrandLiveTransactions.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "2rem", color: "#94A3B8", fontSize: "0.86rem" }}>
                                            {lang === "en" ? "No live transactions in this date range." : "Chưa có giao dịch phát sinh trong khoảng thời gian này."}
                                        </div>
                                    ) : (
                                        selectedBrandLiveTransactions.map((tx, idx) => (
                                            <div key={`${tx.id}-${idx}`} className={styles.glassCard} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setSelectedTxReceipt(tx)}>
                                                <div>
                                                    <strong>{tx.id}</strong> ({tx.kiosk})
                                                    <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>{tx.productName} • {tx.paymentMethod} • {tx.time}</div>
                                                </div>
                                                <strong style={{ color: "#F5E6AD" }}>{formatPrice(tx.amount)}</strong>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeDetailTab === "analytics" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                    <div className={styles.glassCard}>
                                        <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>{lang === "en" ? "Total Revenue" : "Tổng doanh thu"}</div>
                                        <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#F5E6AD", marginTop: "0.25rem" }}>{formatPrice(selectedBrand.revenueValue)}</div>
                                    </div>
                                    <div className={styles.glassCard}>
                                        <div style={{ fontSize: "0.76rem", color: "#94A3B8" }}>{lang === "en" ? "Verified Sprays" : "Lượt xịt xác nhận"}</div>
                                        <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#34D399", marginTop: "0.25rem" }}>{selectedBrand.transactionsCount}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.drawerFooter}>
                            <div className={styles.footerMetricBox}>
                                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>SKUs</span>
                                <strong>{selectedBrand.products.length}</strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Stations" : "Trạm"}</span>
                                <strong>{selectedBrand.machinesCount}</strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Sprays" : "Lượt xịt"}</span>
                                <strong style={{ color: "#34D399" }}>{selectedBrand.transactionsCount}</strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{lang === "en" ? "Revenue" : "Doanh thu"}</span>
                                <strong style={{ color: "#F5E6AD" }}>{formatPrice(selectedBrand.revenueValue)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BIÊN NHẬN */}
            {selectedTxReceipt && (
                <div className={styles.modalOverlay} onClick={() => setSelectedTxReceipt(null)}>
                    <div className={styles.modalContent} style={{ maxWidth: "26rem" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{selectedTxReceipt.id}</h3>
                            <button type="button" onClick={() => setSelectedTxReceipt(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", fontSize: "0.86rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Station" : "Trạm"}:</span><strong>{selectedTxReceipt.kiosk}</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Product" : "Sản phẩm"}:</span><strong>{selectedTxReceipt.productName}</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Payment" : "Thanh toán"}:</span><strong>{selectedTxReceipt.paymentMethod}</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Amount" : "Số tiền"}:</span><strong style={{ color: "#F5E6AD" }}>{formatPrice(selectedTxReceipt.amount)}</strong></div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THÊM / SỬA THƯƠNG HIỆU */}
            {isModalOpen && canEditBrand && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 className={styles.modalTitle} style={{ margin: 0 }}>
                                {editingBrand
                                    ? lang === "en" ? `Edit ${editingBrand.name}` : `Sửa thương hiệu: ${editingBrand.name}`
                                    : lang === "en" ? "Add Brand" : "Thêm thương hiệu mới"}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>

                        {formError && (
                            <div style={{ marginBottom: "0.85rem", padding: "0.7rem", borderRadius: "9px", background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", color: "#F87171", fontSize: "0.82rem" }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSaveBrand}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.35rem" }}>{lang === "en" ? "Brand Name *" : "Tên thương hiệu *"}</label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required className={styles.searchInput} style={{ padding: "0.58rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.35rem" }}>{lang === "en" ? "Code *" : "Mã đối tác *"}</label>
                                    <input type="text" value={formCode} onChange={(e) => setFormCode(e.target.value)} required className={styles.searchInput} style={{ padding: "0.58rem 0.85rem" }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.35rem" }}>Email *</label>
                                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required className={styles.searchInput} style={{ padding: "0.58rem 0.85rem" }} />
                                </div>
                                {canSuspendBrand && (
                                    <div className={styles.customDropdownWrap}>
                                        <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.35rem" }}>{lang === "en" ? "Status" : "Trạng thái"}</label>
                                        <button type="button" onClick={() => setOpenDropdown(openDropdown === "MODAL_STATUS" ? null : "MODAL_STATUS")} className={styles.customDropdownTrigger} style={{ width: "100%" }}>
                                            <span>{formatStatus(formStatus)}</span>
                                            <ChevronDown size={13} color="#D4AF37" />
                                        </button>
                                        {openDropdown === "MODAL_STATUS" && (
                                            <div className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`} style={{ width: "100%" }}>
                                                {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((st) => (
                                                    <button key={st} type="button" onClick={() => { setFormStatus(st); setOpenDropdown(null); }} className={styles.customDropdownItem}>
                                                        {formatStatus(st)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.35rem" }}>{lang === "en" ? "Description" : "Ghi chú"}</label>
                                <textarea rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className={styles.searchInput} style={{ padding: "0.58rem 0.85rem", resize: "none" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.primaryGoldBtn}>{editingBrand ? (lang === "en" ? "Save" : "Lưu thay đổi") : (lang === "en" ? "Create" : "Tạo mới")}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: "#181D2C", border: "1px solid #D4AF37", padding: "0.85rem 1.15rem", borderRadius: "12px", color: "#F5E6AD", zIndex: 99999, fontWeight: 600, fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "0.55rem" }}>
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}