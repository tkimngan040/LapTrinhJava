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
    ShieldCheck,
    Thermometer,
    Droplets,
    Power,
    Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const formatPrice = (price: number): string =>
    new Intl.NumberFormat("vi-VN").format(price) + " VND";

const formatRetailReference = (
    price?: number | null,
    experiencePrice?: number
): string => {
    if (typeof price === "number" && price > 0) {
        return formatPrice(price);
    }
    if (typeof experiencePrice === "number" && experiencePrice > 0) {
        return formatPrice(experiencePrice * 30);
    }
    return formatPrice(250000);
};

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
    rating: number;
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
    gallery?: string[];
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

function formatFullDisplayDate(ymd: string): string {
    const parts = ymd.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
}

function formatShortDdMm(ymd: string): string {
    const parts = ymd.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : ymd;
}

const INITIAL_21_BRANDS: BrandItem[] = [
    {
        id: 1,
        name: "Giorgio Armani",
        code: "ARMANI",
        description: "Italian luxury fashion house founded in Milan, celebrated for iconic Mediterranean aquatic scents.",
        website: "https://www.armani.com",
        email: "concierge@armani.local",
        phone: "+39 02 7231 81",
        address: "Via Borgonuovo 11, 20121 Milano MI, Italy",
        status: "ACTIVE",
        createdAt: "2026-10-18",
        machinesCount: 1,
        transactionsCount: 48,
        revenueValue: 624000,
        image: "/images/acqua-di-gio.jpg",
        products: [
            { slotNumber: 1, skuCode: "SKU-ARM-01", name: "Acqua Di Gio", family: "Aquatic Aromatic", concentration: "Eau de Toilette", audience: "Men", notes: "Bergamot, Sea Notes, Jasmine, Cedar", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 78.0, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", sprayPrice: 12000, retailPrice10ml: 360000, fullBottlePrice: 3200000, rating: 4.8, status: "ACTIVE", image: "/images/acqua-di-gio.jpg" },
            { slotNumber: 2, skuCode: "SKU-ARM-02", name: "Acqua Di Gio Profondo", family: "Aquatic Mineral", concentration: "Eau de Parfum", audience: "Men", notes: "Marine Notes, Rosemary, Patchouli", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 64.0, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", sprayPrice: 14000, retailPrice10ml: 420000, fullBottlePrice: 3650000, rating: 4.9, status: "ACTIVE", image: "/images/acqua-di-gio-profondo.jpg" }
        ]
    },
    {
        id: 2,
        name: "Chanel",
        code: "CHANEL",
        description: "Iconic French luxury fashion and haute parfumerie house established in Paris.",
        website: "https://www.chanel.com",
        email: "contact@chanel.local",
        phone: "+33 1 42 68 55 00",
        address: "135 Avenue Charles de Gaulle, Neuilly-sur-Seine, France",
        status: "ACTIVE",
        createdAt: "2026-10-19",
        machinesCount: 2,
        transactionsCount: 64,
        revenueValue: 976000,
        image: "/images/bleu-de-chanel.png",
        products: [
            { slotNumber: 3, skuCode: "SKU-CHA-03", name: "Bleu de Chanel", family: "Woody Aromatic", concentration: "Eau de Parfum", audience: "Men", notes: "Lemon, Mint, Pink Pepper, Sandalwood", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 12.5, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", sprayPrice: 15000, retailPrice10ml: 450000, fullBottlePrice: 4250000, rating: 5.0, status: "ACTIVE", image: "/images/bleu-de-chanel.png" },
            { slotNumber: 4, skuCode: "SKU-CHA-04", name: "Coco Mademoiselle", family: "Oriental Floral", concentration: "Eau de Parfum", audience: "Women", notes: "Orange, Patchouli, Turkish Rose", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 82.0, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", sprayPrice: 15500, retailPrice10ml: 465000, fullBottlePrice: 4400000, rating: 4.9, status: "ACTIVE", image: "/images/coco-mademoiselle.jpg" }
        ]
    },
    {
        id: 3,
        name: "Burberry",
        code: "BURBERRY",
        description: "British luxury fashion house established in 1856, blending London heritage with modern perfumery.",
        website: "https://www.burberry.com",
        email: "customercare@burberry.local",
        phone: "+44 20 3402 1444",
        address: "Horseferry House, Horseferry Road, London, UK",
        status: "ACTIVE",
        createdAt: "2026-10-20",
        machinesCount: 2,
        transactionsCount: 38,
        revenueValue: 484500,
        image: "/images/burberry-goddess.jpg",
        products: [
            { slotNumber: 5, skuCode: "SKU-BUR-05", name: "Burberry Goddess", family: "Aromatic Vanilla", concentration: "Eau de Parfum", audience: "Women", notes: "Vanilla Infusion, Lavender, Cocoa", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 71.0, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", sprayPrice: 13000, retailPrice10ml: 390000, fullBottlePrice: 3500000, rating: 4.7, status: "ACTIVE", image: "/images/burberry-goddess.jpg" },
            { slotNumber: 6, skuCode: "SKU-BUR-06", name: "Burberry Her", family: "Floral Fruity", concentration: "Eau de Parfum", audience: "Women", notes: "Red & Dark Berries, Jasmine, Musk", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 55.0, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", sprayPrice: 12500, retailPrice10ml: 375000, fullBottlePrice: 3350000, rating: 4.6, status: "ACTIVE", image: "/images/burberry-her.jpg" }
        ]
    },
    {
        id: 4,
        name: "Carolina Herrera",
        code: "HERRERA",
        description: "Venezuelan-American luxury fashion house known for bold, sensual, and dramatic fragrances.",
        website: "https://www.carolinaherrera.com",
        email: "support@carolinaherrera.local",
        phone: "+1 212 944 5757",
        address: "501 Seventh Avenue, New York, NY, USA",
        status: "ACTIVE",
        createdAt: "2026-10-22",
        machinesCount: 1,
        transactionsCount: 24,
        revenueValue: 324000,
        image: "/images/carolina-herrera-good-girl.jpg",
        products: [
            { slotNumber: 7, skuCode: "SKU-CH-07", name: "Carolina Herrera Good Girl", family: "Oriental Floral", concentration: "Eau de Parfum", audience: "Women", notes: "Almond, Coffee, Tuberose, Tonka Bean", volume: "80ml", bottleVolumeMl: 80, remainingVolumeMl: 54.0, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", sprayPrice: 13500, retailPrice10ml: 405000, fullBottlePrice: 3450000, rating: 4.8, status: "ACTIVE", image: "/images/carolina-herrera-good-girl.jpg" }
        ]
    },
    {
        id: 5,
        name: "Armaf",
        code: "ARMAF",
        description: "Contemporary luxury perfumery house celebrated for high-projection signature blends.",
        website: "https://www.armafperfume.com",
        email: "info@armaf.local",
        phone: "+971 4 226 5888",
        address: "Dubai Industrial City, Dubai, UAE",
        status: "ACTIVE",
        createdAt: "2026-10-24",
        machinesCount: 1,
        transactionsCount: 28,
        revenueValue: 280000,
        image: "/images/club-de-nuit-intense.jpg",
        products: [
            { slotNumber: 8, skuCode: "SKU-ARMF-08", name: "Club de Nuit Intense Man", family: "Woody Spicy", concentration: "Eau de Toilette", audience: "Men", notes: "Lemon, Pineapple, Birch, Ambroxan", volume: "105ml", bottleVolumeMl: 105, remainingVolumeMl: 92.0, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside Mall Lobby, Da Nang", sprayPrice: 10000, retailPrice10ml: 300000, fullBottlePrice: 1650000, rating: 4.7, status: "ACTIVE", image: "/images/club-de-nuit-intense.jpg" }
        ]
    },
    {
        id: 6,
        name: "Creed",
        code: "CREED",
        description: "Authentic luxury niche perfume house founded in 1760, famous for royal bespoke creations.",
        website: "https://www.creedboutique.com",
        email: "info@creed.local",
        phone: "+44 20 7495 1760",
        address: "14 Mount Street, Mayfair, London, UK",
        status: "ACTIVE",
        createdAt: "2026-10-25",
        machinesCount: 1,
        transactionsCount: 45,
        revenueValue: 900000,
        image: "/images/creed-aventus.jpg",
        products: [
            { slotNumber: 9, skuCode: "SKU-CRD-09", name: "Creed Aventus", family: "Chypre Fruity", concentration: "Eau de Parfum", audience: "Niche", notes: "Pineapple, Birch, Musk, Oakmoss", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 11.5, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Luxury Atrium, HCMC", sprayPrice: 20000, retailPrice10ml: 600000, fullBottlePrice: 7800000, rating: 5.0, status: "ACTIVE", image: "/images/creed-aventus.jpg" }
        ]
    },
    {
        id: 7,
        name: "Dior",
        code: "DIOR",
        description: "Christian Dior SE, commonly known as Dior, is a French luxury haute parfumerie maison.",
        website: "https://www.dior.com",
        email: "support@dior.local",
        phone: "+33 1 40 73 73 73",
        address: "30 Avenue Montaigne, Paris, France",
        status: "ACTIVE",
        createdAt: "2026-10-26",
        machinesCount: 2,
        transactionsCount: 52,
        revenueValue: 728000,
        image: "/images/dior-sauvage.jpg",
        products: [
            { slotNumber: 10, skuCode: "SKU-DIO-10", name: "Dior Sauvage", family: "Aromatic Fougere", concentration: "Eau de Parfum", audience: "Men", notes: "Calabrian Bergamot, Sichuan Pepper, Ambroxan", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 84.0, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", sprayPrice: 14500, retailPrice10ml: 435000, fullBottlePrice: 3950000, rating: 4.9, status: "ACTIVE", image: "/images/dior-sauvage.jpg" },
            { slotNumber: 11, skuCode: "SKU-DIO-11", name: "Miss Dior Blooming Bouquet", family: "Floral", concentration: "Eau de Toilette", audience: "Women", notes: "Sweet Pea, Damask Rose, White Musk", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 76.0, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", sprayPrice: 13500, retailPrice10ml: 405000, fullBottlePrice: 3600000, rating: 4.8, status: "ACTIVE", image: "/images/miss-dior-blooming-bouquet.jpg" }
        ]
    },
    {
        id: 8,
        name: "Jean Paul Gaultier",
        code: "JPG",
        description: "Avant-garde French haute couture and perfumery house celebrated for iconic torso bottles.",
        website: "https://www.jeanpaulgaultier.com",
        email: "parfums@jpg.local",
        phone: "+33 1 44 68 80 00",
        address: "325 Rue Saint-Martin, 75003 Paris, France",
        status: "ACTIVE",
        createdAt: "2026-10-28",
        machinesCount: 1,
        transactionsCount: 32,
        revenueValue: 424000,
        image: "/images/jean-paul-gaultier-le-male.jpg",
        products: [
            { slotNumber: 12, skuCode: "SKU-JPG-12", name: "Jean Paul Gaultier Le Male", family: "Oriental Fougere", concentration: "Eau de Toilette", audience: "Men", notes: "Lavender, Mint, Cardamom, Vanilla", volume: "125ml", bottleVolumeMl: 125, remainingVolumeMl: 77.0, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", sprayPrice: 13000, retailPrice10ml: 390000, fullBottlePrice: 3300000, rating: 4.8, status: "ACTIVE", image: "/images/jean-paul-gaultier-le-male.jpg" },
            { slotNumber: 13, skuCode: "SKU-JPG-13", name: "Jean Paul Gaultier Scandal", family: "Chypre Floral", concentration: "Eau de Parfum", audience: "Women", notes: "Blood Orange, Honey, Gardenia, Patchouli", volume: "80ml", bottleVolumeMl: 80, remainingVolumeMl: 47.0, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", sprayPrice: 13500, retailPrice10ml: 405000, fullBottlePrice: 3450000, rating: 4.8, status: "ACTIVE", image: "/images/jean-paul-gaultier-scandal.jpg" }
        ]
    },
    {
        id: 9,
        name: "Le Labo",
        code: "LELABO",
        description: "New York-based niche perfume lab born in Grasse, focusing on slow perfumery and fresh blends.",
        website: "https://www.lelabofragrances.com",
        email: "paris@lelabo.local",
        phone: "+33 1 42 71 52 16",
        address: "6 Rue de Bourbon le Château, Paris, France",
        status: "ACTIVE",
        createdAt: "2026-10-30",
        machinesCount: 2,
        transactionsCount: 40,
        revenueValue: 730000,
        image: "/images/le-labo-another-13.jpg",
        products: [
            { slotNumber: 14, skuCode: "SKU-LLB-14", name: "Le Labo Another 13", family: "Woody Oriental", concentration: "Eau de Parfum", audience: "Niche", notes: "Ambroxan, Pear, Jasmine Petals, Ambrette", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 13.5, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Luxury Atrium, HCMC", sprayPrice: 18000, retailPrice10ml: 540000, fullBottlePrice: 6500000, rating: 4.9, status: "ACTIVE", image: "/images/le-labo-another-13.jpg" },
            { slotNumber: 15, skuCode: "SKU-LLB-15", name: "Le Labo Santal 33", family: "Woody Aromatic", concentration: "Eau de Parfum", audience: "Niche", notes: "Australian Sandalwood, Cedar, Cardamom, Leather", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 73.0, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", sprayPrice: 18500, retailPrice10ml: 555000, fullBottlePrice: 6600000, rating: 4.9, status: "ACTIVE", image: "/images/le-labo-another-13.jpg" }
        ]
    },
    {
        id: 10,
        name: "Maison Margiela",
        code: "MARGIELA",
        description: "Parisian haute couture house renowned for its Replica collection evoking familiar memories.",
        website: "https://www.maisonmargiela.com",
        email: "replica@margiela.local",
        phone: "+33 1 44 75 79 00",
        address: "163 Rue Saint-Maur, 75011 Paris, France",
        status: "ACTIVE",
        createdAt: "2026-11-01",
        machinesCount: 1,
        transactionsCount: 22,
        revenueValue: 319000,
        image: "/images/maison-margiela-by-the-fireplace.jpg",
        products: [
            { slotNumber: 16, skuCode: "SKU-MMG-16", name: "Replica By the Fireplace", family: "Woody Amber", concentration: "Eau de Toilette", audience: "Unisex", notes: "Cloves, Chestnut, Guaiac Wood, Vanilla", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 80.0, kioskCode: "KIOSK-HN-02", kioskLocation: "Trang Tien Plaza Luxury Wing, Hanoi", sprayPrice: 14500, retailPrice10ml: 435000, fullBottlePrice: 3650000, rating: 4.8, status: "ACTIVE", image: "/images/maison-margiela-by-the-fireplace.jpg" },
            { slotNumber: 17, skuCode: "SKU-MMG-17", name: "Replica Jazz Club", family: "Leather Woody", concentration: "Eau de Toilette", audience: "Men", notes: "Pink Pepper, Rum Absolute, Tobacco Leaf", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 67.0, kioskCode: "KIOSK-HN-02", kioskLocation: "Trang Tien Plaza Luxury Wing, Hanoi", sprayPrice: 14500, retailPrice10ml: 435000, fullBottlePrice: 3650000, rating: 4.8, status: "ACTIVE", image: "/images/maison-margiela-by-the-fireplace.jpg" }
        ]
    },
    {
        id: 11,
        name: "MCM Worldwide",
        code: "MCM",
        description: "German luxury leather goods and lifestyle brand founded in Munich in 1976.",
        website: "https://www.mcmworldwide.com",
        email: "contact@mcm.local",
        phone: "+49 89 2154 3000",
        address: "Brienner Straße 1, 80333 München, Germany",
        status: "ACTIVE",
        createdAt: "2026-11-02",
        machinesCount: 1,
        transactionsCount: 19,
        revenueValue: 228000,
        image: "/images/mcm-edp.jpg",
        products: [
            { slotNumber: 18, skuCode: "SKU-MCM-18", name: "MCM Eau de Parfum", family: "Floral Woody", concentration: "Eau de Parfum", audience: "Unisex", notes: "Raspberry, Apricot, White Peony, Ambrox", volume: "75ml", bottleVolumeMl: 75, remainingVolumeMl: 66.0, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside Mall Lobby, Da Nang", sprayPrice: 12000, retailPrice10ml: 360000, fullBottlePrice: 2650000, rating: 4.6, status: "ACTIVE", image: "/images/mcm-edp.jpg" }
        ]
    },
    {
        id: 12,
        name: "Maison Francis Kurkdjian",
        code: "MFK",
        description: "Ultra-luxury French niche perfumery co-founded by master perfumer Francis Kurkdjian.",
        website: "https://www.franciskurkdjian.com",
        email: "boutique@mfk.local",
        phone: "+33 1 42 60 07 07",
        address: "5 Rue d'Alger, 75001 Paris, France",
        status: "ACTIVE",
        createdAt: "2026-11-04",
        machinesCount: 1,
        transactionsCount: 46,
        revenueValue: 966000,
        image: "/images/mfk-baccarat-rouge-540.jpg",
        products: [
            { slotNumber: 19, skuCode: "SKU-MFK-19", name: "MFK Baccarat Rouge 540", family: "Oriental Floral", concentration: "Eau de Parfum", audience: "Niche", notes: "Saffron, Jasmine, Amberwood, Fir Resin", volume: "70ml", bottleVolumeMl: 70, remainingVolumeMl: 9.0, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Luxury Atrium, HCMC", sprayPrice: 21000, retailPrice10ml: 630000, fullBottlePrice: 7900000, rating: 5.0, status: "ACTIVE", image: "/images/mfk-baccarat-rouge-540.jpg" }
        ]
    },
    {
        id: 13,
        name: "Montblanc",
        code: "MONTBLANC",
        description: "European luxury maison renowned for fine craftsmanship and sophisticated masculine scents.",
        website: "https://www.montblanc.com",
        email: "service@montblanc.local",
        phone: "+49 40 8400 10",
        address: "Hellgrundweg 100, 22525 Hamburg, Germany",
        status: "ACTIVE",
        createdAt: "2026-11-05",
        machinesCount: 1,
        transactionsCount: 30,
        revenueValue: 337500,
        image: "/images/montblanc-explorer.jpg",
        products: [
            { slotNumber: 20, skuCode: "SKU-MTB-20", name: "Montblanc Explorer", family: "Woody Aromatic", concentration: "Eau de Parfum", audience: "Men", notes: "Italian Bergamot, Vetiver, Patchouli", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 79.0, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", sprayPrice: 11500, retailPrice10ml: 345000, fullBottlePrice: 2350000, rating: 4.7, status: "ACTIVE", image: "/images/montblanc-explorer.jpg" },
            { slotNumber: 21, skuCode: "SKU-MTB-21", name: "Montblanc Legend", family: "Aromatic Fougere", concentration: "Eau de Toilette", audience: "Men", notes: "Lavender, Pineapple, Red Apple, Tonka", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 85.0, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", sprayPrice: 11000, retailPrice10ml: 330000, fullBottlePrice: 2200000, rating: 4.6, status: "ACTIVE", image: "/images/montblanc-legend.jpg" }
        ]
    },
    {
        id: 14,
        name: "Narciso Rodriguez",
        code: "NARCISO",
        description: "New York designer fragrance house iconic for its signature heart of musc compositions.",
        website: "https://www.narcisorodriguez.com",
        email: "studio@narciso.local",
        phone: "+1 212 925 9091",
        address: "250 Park Avenue South, New York, USA",
        status: "ACTIVE",
        createdAt: "2026-11-06",
        machinesCount: 2,
        transactionsCount: 34,
        revenueValue: 450500,
        image: "/images/narciso-rodriguez-for-her.jpg",
        products: [
            { slotNumber: 22, skuCode: "SKU-NAR-22", name: "Narciso Rodriguez For Her EDP", family: "Floral Woody Musk", concentration: "Eau de Parfum", audience: "Women", notes: "Rose, Peach Pulp, Heart of Musc, Amber", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 61.0, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", sprayPrice: 13000, retailPrice10ml: 390000, fullBottlePrice: 3350000, rating: 4.8, status: "ACTIVE", image: "/images/narciso-rodriguez-for-her.jpg" },
            { slotNumber: 23, skuCode: "SKU-NAR-23", name: "Narciso Rodriguez Pure Musc", family: "Floral Woody Musk", concentration: "Eau de Parfum", audience: "Women", notes: "Pure Musk, White Flowers, Cashmeran", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 74.0, kioskCode: "KIOSK-HN-02", kioskLocation: "Trang Tien Plaza Luxury Wing, Hanoi", sprayPrice: 13500, retailPrice10ml: 405000, fullBottlePrice: 3450000, rating: 4.9, status: "ACTIVE", image: "/images/narciso-rodriguez-pure-musc.jpg" }
        ]
    },
    {
        id: 15,
        name: "Paco Rabanne",
        code: "RABANNE",
        description: "Bold luxury fashion and fragrance house known for extravagant metallic bottle designs.",
        website: "https://www.rabanne.com",
        email: "contact@rabanne.local",
        phone: "+33 1 53 67 60 00",
        address: "17 Rue François 1er, 75008 Paris, France",
        status: "ACTIVE",
        createdAt: "2026-11-08",
        machinesCount: 2,
        transactionsCount: 28,
        revenueValue: 350000,
        image: "/images/paco-rabanne-1-million.jpg",
        products: [
            { slotNumber: 24, skuCode: "SKU-PRB-24", name: "Paco Rabanne 1 Million", family: "Woody Spicy", concentration: "Eau de Toilette", audience: "Men", notes: "Blood Mandarin, Cinnamon, Leather, Amber", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 66.0, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", sprayPrice: 12500, retailPrice10ml: 375000, fullBottlePrice: 2850000, rating: 4.7, status: "ACTIVE", image: "/images/paco-rabanne-1-million.jpg" },
            { slotNumber: 25, skuCode: "SKU-PRB-25", name: "Paco Rabanne Invictus", family: "Woody Aquatic", concentration: "Eau de Toilette", audience: "Men", notes: "Sea Notes, Grapefruit, Bay Leaf, Ambergris", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 72.0, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside Mall Lobby, Da Nang", sprayPrice: 12500, retailPrice10ml: 375000, fullBottlePrice: 2800000, rating: 4.6, status: "ACTIVE", image: "/images/paco-rabanne-invictus.jpg" }
        ]
    },
    {
        id: 16,
        name: "Parfums de Marly",
        code: "PDM",
        description: "French niche haute parfumerie inspired by the 18th-century Royal Court of King Louis XV.",
        website: "https://www.parfums-de-marly.com",
        email: "vip@pdm.local",
        phone: "+33 1 42 60 41 16",
        address: "326 Rue Saint-Honoré, 75001 Paris, France",
        status: "ACTIVE",
        createdAt: "2026-11-09",
        machinesCount: 1,
        transactionsCount: 26,
        revenueValue: 481000,
        image: "/images/parfums-de-marly-sedley.jpg",
        products: [
            { slotNumber: 26, skuCode: "SKU-PDM-26", name: "Parfums de Marly Sedley", family: "Woody Aromatic", concentration: "Eau de Parfum", audience: "Niche", notes: "Spearmint, Bergamot, Lavender, Sandalwood", volume: "125ml", bottleVolumeMl: 125, remainingVolumeMl: 68.0, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Luxury Atrium, HCMC", sprayPrice: 18500, retailPrice10ml: 555000, fullBottlePrice: 6400000, rating: 4.9, status: "ACTIVE", image: "/images/parfums-de-marly-sedley.jpg" }
        ]
    },
    {
        id: 17,
        name: "Roja Parfums",
        code: "ROJA",
        description: "British ultra-luxury fragrance house founded by master perfumer Roja Dove in London.",
        website: "https://www.rojaparfums.com",
        email: "concierge@rojaparfums.local",
        phone: "+44 20 7734 9119",
        address: "51 Burlington Arcade, Mayfair, London, UK",
        status: "ACTIVE",
        createdAt: "2026-11-10",
        machinesCount: 1,
        transactionsCount: 25,
        revenueValue: 550000,
        image: "/images/roja-elysium.jpg",
        products: [
            { slotNumber: 27, skuCode: "SKU-ROJ-27", name: "Roja Parfums Elysium", family: "Aromatic Fougere", concentration: "Parfum Cologne", audience: "Niche", notes: "Grapefruit, Lime, Vetiver, Ambergris", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 11.0, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", sprayPrice: 22000, retailPrice10ml: 660000, fullBottlePrice: 7600000, rating: 5.0, status: "ACTIVE", image: "/images/roja-elysium.jpg" }
        ]
    },
    {
        id: 18,
        name: "Tom Ford",
        code: "TOMFORD",
        description: "American luxury fashion house founded by Tom Ford, renowned for bold and sensual fragrances.",
        website: "https://www.tomford.com",
        email: "concierge@tomford.local",
        phone: "+1 888 866 3673",
        address: "7 East 52nd Street, New York, USA",
        status: "ACTIVE",
        createdAt: "2026-11-11",
        machinesCount: 2,
        transactionsCount: 22,
        revenueValue: 352000,
        image: "/images/tom-ford-black-orchid.jpg",
        products: [
            { slotNumber: 28, skuCode: "SKU-TF-28", name: "Tom Ford Black Orchid", family: "Oriental Chypre", concentration: "Eau de Parfum", audience: "Unisex", notes: "Black Truffle, Black Orchid, Patchouli", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 48.0, kioskCode: "KIOSK-HN-02", kioskLocation: "Trang Tien Plaza Luxury Wing, Hanoi", sprayPrice: 16000, retailPrice10ml: 480000, fullBottlePrice: 4350000, rating: 4.8, status: "ACTIVE", image: "/images/tom-ford-black-orchid.jpg" }
        ]
    },
    {
        id: 19,
        name: "Valentino",
        code: "VALENTINO",
        description: "Italian luxury couture maison founded in Rome, celebrated for Born in Roma fragrances.",
        website: "https://www.valentino.com",
        email: "atelier@valentino.local",
        phone: "+39 06 6739 11",
        address: "Piazza Mignanelli 22, 00187 Roma RM, Italy",
        status: "SUSPENDED",
        createdAt: "2026-11-12",
        machinesCount: 2,
        transactionsCount: 18,
        revenueValue: 234000,
        image: "/images/valentino-born-in-roma.jpg",
        products: [
            { slotNumber: 29, skuCode: "SKU-VAL-29", name: "Valentino Born in Roma", family: "Oriental Floral", concentration: "Eau de Parfum", audience: "Women", notes: "Blackcurrant, Jasmine, Bourbon Vanilla", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 81.0, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", sprayPrice: 13000, retailPrice10ml: 390000, fullBottlePrice: 3400000, rating: 4.7, status: "ACTIVE", image: "/images/valentino-born-in-roma.jpg" }
        ]
    },
    {
        id: 20,
        name: "Versace",
        code: "VERSACE",
        description: "Iconic Italian luxury fashion company founded by Gianni Versace, known for vibrant Mediterranean scents.",
        website: "https://www.versace.com",
        email: "support@versace.local",
        phone: "+39 02 7609 31",
        address: "Via Gesù 12, 20121 Milano MI, Italy",
        status: "ACTIVE",
        createdAt: "2026-11-13",
        machinesCount: 3,
        transactionsCount: 44,
        revenueValue: 528000,
        image: "/images/versace-eros.jpg",
        products: [
            { slotNumber: 30, skuCode: "SKU-VER-30", name: "Versace Bright Crystal", family: "Floral Fruity", concentration: "Eau de Toilette", audience: "Women", notes: "Yuzu, Pomegranate, Peony, Lotus", volume: "90ml", bottleVolumeMl: 90, remainingVolumeMl: 62.0, kioskCode: "KIOSK-SGN-03", kioskLocation: "Crescent Mall Luxury Wing, HCMC", sprayPrice: 11500, retailPrice10ml: 345000, fullBottlePrice: 2450000, rating: 4.7, status: "ACTIVE", image: "/images/versace-bright-crystal.jpg" },
            { slotNumber: 31, skuCode: "SKU-VER-31", name: "Versace Dylan Blue", family: "Aromatic Fougere", concentration: "Eau de Toilette", audience: "Men", notes: "Bergamot, Grapefruit, Ambroxan, Incense", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 77.0, kioskCode: "KIOSK-DAD-01", kioskLocation: "IndoChina Riverside Mall Lobby, Da Nang", sprayPrice: 12000, retailPrice10ml: 360000, fullBottlePrice: 2550000, rating: 4.7, status: "ACTIVE", image: "/images/versace-dylan-blue.jpg" },
            { slotNumber: 32, skuCode: "SKU-VER-32", name: "Versace Eros", family: "Aromatic Fougere", concentration: "Eau de Parfum", audience: "Men", notes: "Mint Leaves, Green Apple, Tonka Bean", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 83.0, kioskCode: "KIOSK-SGN-02", kioskLocation: "Vincom Center Dong Khoi, HCMC", sprayPrice: 12500, retailPrice10ml: 375000, fullBottlePrice: 2700000, rating: 4.8, status: "ACTIVE", image: "/images/versace-eros.jpg" }
        ]
    },
    {
        id: 21,
        name: "Yves Saint Laurent",
        code: "YSL",
        description: "French luxury fashion house founded in 1961, iconic for rebellious modern elegance.",
        website: "https://www.ysl.com",
        email: "contact@ysl.local",
        phone: "+33 1 53 67 70 00",
        address: "5 Avenue Marceau, Paris, France",
        status: "INACTIVE",
        createdAt: "2026-11-14",
        machinesCount: 2,
        transactionsCount: 30,
        revenueValue: 420000,
        image: "/images/ysl-libre.jpg",
        products: [
            { slotNumber: 33, skuCode: "SKU-YSL-33", name: "YSL Libre Eau de Parfum", family: "Oriental Fougere", concentration: "Eau de Parfum", audience: "Women", notes: "French Lavender, Orange Blossom, Vanilla", volume: "90ml", bottleVolumeMl: 90, remainingVolumeMl: 14.0, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre Takashimaya Flagship, HCMC", sprayPrice: 14000, retailPrice10ml: 420000, fullBottlePrice: 3750000, rating: 4.9, status: "ACTIVE", image: "/images/ysl-libre.jpg" },
            { slotNumber: 34, skuCode: "SKU-YSL-34", name: "YSL Y Eau de Parfum", family: "Aromatic Fougere", concentration: "Eau de Parfum", audience: "Men", notes: "Apple, Ginger, Sage, Tonka Bean", volume: "100ml", bottleVolumeMl: 100, remainingVolumeMl: 63.0, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte Center West Lake Lounge, Hanoi", sprayPrice: 14000, retailPrice10ml: 420000, fullBottlePrice: 3700000, rating: 4.8, status: "INACTIVE", image: "/images/ysl-y-edp.jpg" }
        ]
    }
];

const BRANDS_STORAGE_KEY = "scentstation_commercial_brands_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type QuickDatePreset = "TODAY" | "THIS_WEEK" | "LAST_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "CUSTOM";

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

export default function BrandsManagementPage(): React.ReactElement {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const filterBarRef = useRef<HTMLDivElement | null>(null);

    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [brands, setBrands] = useState<BrandItem[]>(INITIAL_21_BRANDS);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<"NAME" | "CREATED_DATE" | "PERFORMANCE">("NAME");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    // LỊCH THỰC TẾ GIỐNG HỆT MÀN 9, 10, 11, 12
    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [openDropdown, setOpenDropdown] = useState<
        "CALENDAR" | "STATUS" | "SORT" | "MODAL_STATUS" | "MODAL_IMAGE" | null
    >(null);

    // Đồng bộ RBAC từ /login & /users
    const [currentActorRole, setCurrentActorRole] = useState<string>("Platform Super Administrator");
    const [isViewerReadOnly, setIsViewerReadOnly] = useState<boolean>(false);
    const [brandTenantScope, setBrandTenantScope] = useState<string | null>(null);

    const [liveFleetSlotsByBrand, setLiveFleetSlotsByBrand] = useState<
        Record<string, LiveBrandKioskSlot[]>
    >({});
    const [liveTxsByBrand, setLiveTxsByBrand] = useState<
        Record<string, LiveBrandTransaction[]>
    >({});

    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<
        "overview" | "products" | "machines" | "transactions" | "analytics"
    >("overview");
    const [analyticsRange, setAnalyticsRange] = useState<"7D" | "30D" | "YTD">("YTD");
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
    const [hoveredBarIndex, setHoveredBarIndex] = useState<number>(5);

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

    const selectedBrand = useMemo(
        () => brands.find((b) => b.id === selectedBrandId) || null,
        [brands, selectedBrandId]
    );

    /* --- 1. ĐỌC & ĐỐI SOÁT ĐỒNG BỘ TOÀN DIỆN VỚI MÀN 1..12 --- */
    const loadAndReconcileBrandsData = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            // A. Đọc quyền RBAC từ /login & /users
            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                const roleCode = parsedUser.roleCode || parsedUser.role || parsedUser.roles?.[0] || "PSA";
                setCurrentActorRole(parsedUser.fullName || parsedUser.name || roleCode);
                setIsViewerReadOnly(roleCode === "VW" || roleCode === "VIEWER");
                if (roleCode === "BA" && parsedUser.brandScope) {
                    setBrandTenantScope(parsedUser.brandScope);
                } else {
                    setBrandTenantScope(null);
                }
            }

            // B. Đọc ma trận tồn kho từng máy KIOSK_PER_UNIT_STOCK_KEY
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            // C. Đọc danh sách Brands đã lưu
            let workingBrands: BrandItem[] = [...INITIAL_21_BRANDS];
            const rawSavedBrands = localStorage.getItem(BRANDS_STORAGE_KEY);
            if (rawSavedBrands) {
                const parsedBrands = JSON.parse(rawSavedBrands);
                if (Array.isArray(parsedBrands) && parsedBrands.length >= 21) {
                    workingBrands = parsedBrands;
                }
            }

            // D. Đồng bộ giá bán, trạng thái & dung tích ml từ PRODUCTS_STORAGE_KEY (/products)
            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds) && parsedProds.length > 0) {
                    parsedProds.forEach((mp: any, idx: number) => {
                        if (!mp || !mp.brand) return;
                        const existsBrand = workingBrands.some((b) =>
                            isExactMatch(b.name, mp.brand)
                        );
                        if (!existsBrand) {
                            const bCode = String(mp.brand)
                                .replace(/[^a-zA-Z0-9]/g, "")
                                .toUpperCase()
                                .slice(0, 8);
                            workingBrands.unshift({
                                id: Date.now() + idx,
                                name: mp.brand,
                                code: bCode || `BR-${idx + 22}`,
                                description:
                                    mp.description ||
                                    "Luxury partner fragrance house synchronized from catalog.",
                                website: "https://www.scentstation.local",
                                email: `concierge@${bCode.toLowerCase()}.local`,
                                phone: "+33 1 40 00 00 00",
                                address: "Avenue Montaigne, Paris, France",
                                status: "ACTIVE",
                                createdAt: todayYmd,
                                machinesCount: 1,
                                transactionsCount: 12,
                                revenueValue: Number(mp.pricePerSpray || 15000) * 12,
                                image: mp.image || "/images/creed-aventus.jpg",
                                products: [],
                            });
                        }
                    });

                    workingBrands = workingBrands.map((b) => {
                        const matchedProds = parsedProds.filter((p: any) =>
                            isExactMatch(p.brand || "", b.name)
                        );
                        if (matchedProds.length === 0) return b;

                        const syncedBrandProds: BrandProductItem[] = matchedProds.map(
                            (mp: any) => {
                                const kCode =
                                    mp.assignedMachines?.[0]?.kioskCode || "demo-device";
                                const kLower = kCode.toLowerCase();
                                const pKey = String(mp.name || "").trim().toLowerCase();
                                const matrixMl = perKioskMatrix[kLower]?.[pKey];
                                const remMl =
                                    typeof matrixMl === "number"
                                        ? matrixMl
                                        : Number(
                                            mp.assignedMachines?.[0]
                                                ?.remainingVolumeMl ?? 75
                                        );

                                return {
                                    slotNumber: Number(mp.slotNumber || 1),
                                    skuCode: mp.skuCode || `SKU-0${mp.slotNumber}`,
                                    name: mp.name,
                                    family: mp.family || "Luxury Olfactory",
                                    concentration: mp.concentration || "Eau de Parfum",
                                    audience: mp.category || "Unisex",
                                    notes: mp.notes || "Bergamot, Amberwood, Musk",
                                    volume: `${mp.bottleVolumeMl || 100}ml`,
                                    bottleVolumeMl: Number(mp.bottleVolumeMl || 100),
                                    remainingVolumeMl: Number(Math.max(0, remMl).toFixed(2)),
                                    kioskCode: kCode,
                                    kioskLocation:
                                        mp.assignedMachines?.[0]?.location ||
                                        "Diamond Plaza Luxury Atrium, HCMC",
                                    sprayPrice: Number(mp.pricePerSpray || 15000),
                                    retailPrice10ml: Number(
                                        mp.retail10ml ||
                                        Number(mp.pricePerSpray || 15000) * 30
                                    ),
                                    fullBottlePrice: Number(
                                        mp.fullBottlePrice || 3500000
                                    ),
                                    rating: 4.9,
                                    status:
                                        mp.status === "INACTIVE"
                                            ? "INACTIVE"
                                            : "ACTIVE",
                                    image: mp.image || b.image,
                                };
                            }
                        );

                        return {
                            ...b,
                            products: syncedBrandProds,
                        };
                    });
                }
            } else {
                workingBrands = workingBrands.map((b) => ({
                    ...b,
                    products: b.products.map((prod) => {
                        const kLower = (prod.kioskCode || "demo-device").toLowerCase();
                        const pKey = prod.name.trim().toLowerCase();
                        const matrixMl = perKioskMatrix[kLower]?.[pKey];
                        return {
                            ...prod,
                            remainingVolumeMl:
                                typeof matrixMl === "number"
                                    ? Number(Math.max(0, matrixMl).toFixed(2))
                                    : prod.remainingVolumeMl,
                        };
                    }),
                }));
            }

            // E. Quét đội máy Kiosk từ MACHINES_STORAGE_KEY (/machines)
            const brandKioskMap: Record<string, LiveBrandKioskSlot[]> = {};
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    parsedMachines.forEach((m: any) => {
                        const kCode = m.code || m.id || "demo-device";
                        const kName = m.locationName || m.name || "Flagship Kiosk";
                        const kAddr = m.address || m.location || "District 1, HCMC";
                        const kStatus = m.status || "ONLINE";
                        const kTemp = m.chamberTemp || m.temp || "21.4°C";

                        if (Array.isArray(m.slots)) {
                            m.slots.forEach((sl: any, sIdx: number) => {
                                const bKey = String(sl.brand || "").trim().toLowerCase();
                                if (!bKey) return;
                                const fKey = String(sl.fragranceName || "")
                                    .trim()
                                    .toLowerCase();
                                const matrixMl =
                                    perKioskMatrix[kCode.toLowerCase()]?.[fKey];
                                const remMl =
                                    typeof matrixMl === "number"
                                        ? matrixMl
                                        : Number(sl.remainingMl ?? 70);

                                if (!brandKioskMap[bKey]) brandKioskMap[bKey] = [];
                                brandKioskMap[bKey].push({
                                    kioskCode: kCode,
                                    kioskName: kName,
                                    address: kAddr,
                                    status: kStatus,
                                    chamberTemp: kTemp,
                                    slotLabel: sl.slotLabel || `Slot 0${sIdx + 1}`,
                                    slotNumber: Number(sl.slotNumber || sIdx + 1),
                                    fragranceName: sl.fragranceName || "Signature Scent",
                                    sprayPrice: Number(sl.pricePerSpray || 15000),
                                    remainingMl: Number(Math.max(0, remMl).toFixed(2)),
                                    capacityMl: Number(sl.capacityMl ?? 100),
                                });
                            });
                        }
                    });
                }
            }

            workingBrands.forEach((b) => {
                const bKey = b.name.toLowerCase();
                if (!brandKioskMap[bKey] || brandKioskMap[bKey].length === 0) {
                    brandKioskMap[bKey] = b.products.map((prod) => ({
                        kioskCode: prod.kioskCode || "demo-device",
                        kioskName: prod.kioskLocation || "Flagship Kiosk Atrium",
                        address: prod.kioskLocation || "District 1, HCMC",
                        status:
                            prod.kioskCode === "KIOSK-004"
                                ? "OFFLINE"
                                : prod.kioskCode === "KIOSK-HN-02"
                                    ? "MAINTENANCE"
                                    : "ONLINE",
                        chamberTemp: "21.5°C",
                        slotLabel: `Slot ${String(((prod.slotNumber - 1) % 4) + 1).padStart(2, "0")}`,
                        slotNumber: prod.slotNumber,
                        fragranceName: prod.name,
                        sprayPrice: prod.sprayPrice,
                        remainingMl: prod.remainingVolumeMl ?? 70,
                        capacityMl: prod.bottleVolumeMl ?? 100,
                    }));
                }
            });
            setLiveFleetSlotsByBrand(brandKioskMap);

            // F. Quét toàn bộ 100% giao dịch thật từ DASHBOARD_STORAGE_KEY (không cắt slice)
            const brandTxMap: Record<string, LiveBrandTransaction[]> = {};
            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            if (rawDash) {
                const parsedDash = JSON.parse(rawDash);
                if (Array.isArray(parsedDash.transactions)) {
                    parsedDash.transactions.forEach((tx: any) => {
                        const bKey = String(tx.brand || "").trim().toLowerCase();
                        if (!bKey) return;
                        if (!brandTxMap[bKey]) brandTxMap[bKey] = [];
                        const createdIso = String(tx.createdAt || "");
                        const dStr = createdIso.includes("T")
                            ? createdIso.split("T")[0]
                            : todayYmd;

                        brandTxMap[bKey].push({
                            id: tx.id || "TXN-2026-9100",
                            dateStr: dStr,
                            kiosk: tx.kiosk || "demo-device",
                            productName: tx.product || "Signature Scent",
                            slotNumber: Number(tx.slotNumber || 1),
                            amount: Number(tx.amount ?? tx.priceSnapshot ?? 15000),
                            paymentMethod: tx.paymentMethod || "VIETQR",
                            time: tx.timestamp || tx.time || "Today",
                            status: tx.status || "DISPENSED",
                        });
                    });
                }
            }
            setLiveTxsByBrand(brandTxMap);

            // G. Tính doanh thu & lượt xịt của từng thương hiệu theo đúng khoảng lịch [startDate .. endDate]
            const startMs = new Date(startDate).getTime();
            const endMs = new Date(endDate).getTime();
            const daysSpan = Math.max(
                1,
                Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1
            );
            const periodRatio = Math.min(1, daysSpan / 30);

            workingBrands = workingBrands.map((b, idx) => {
                const bKey = b.name.toLowerCase();
                const assignedSlots = brandKioskMap[bKey] || [];
                const uniqueKioskCount = new Set(
                    assignedSlots.map((s) => s.kioskCode)
                ).size;

                const recordedTxs = (brandTxMap[bKey] || []).filter(
                    (t) =>
                        (t.status === "DISPENSED" || t.status === "PAID") &&
                        t.dateStr >= startDate &&
                        t.dateStr <= endDate
                );
                const liveTxCount = recordedTxs.length;
                const liveRevSum = recordedTxs.reduce((s, t) => s + t.amount, 0);

                const seedBaseTx = INITIAL_21_BRANDS[idx]?.transactionsCount || 24;
                const unitPrice = b.products[0]?.sprayPrice || 15000;
                const scaledSeedTx = Math.max(
                    2,
                    Math.round(seedBaseTx * periodRatio)
                );

                return {
                    ...b,
                    createdAt:
                        b.createdAt && b.createdAt.startsWith("2026-")
                            ? b.createdAt
                            : INITIAL_21_BRANDS[idx]?.createdAt || todayYmd,
                    machinesCount: Math.max(
                        1,
                        uniqueKioskCount || b.products.length
                    ),
                    transactionsCount: scaledSeedTx + liveTxCount,
                    revenueValue: scaledSeedTx * unitPrice + liveRevSum,
                };
            });

            setBrands(workingBrands);
        } catch {
            // Safe fallback
        }
    }, [todayYmd, startDate, endDate]);

    useEffect(() => {
        loadAndReconcileBrandsData();

        const handleCrossTabSync = () => {
            loadAndReconcileBrandsData();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileBrandsData();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileBrandsData]);

    /* --- 2. GHI & ĐỒNG BỘ NGƯỢC TỪ BRANDS SANG TOÀN BỘ 12 MÀN HÌNH KIA --- */
    const persistBrandsAndSyncAllModules = useCallback(
        (
            nextBrands: BrandItem[],
            newlyCreatedBrand?: BrandItem,
            auditEvent?: { action: string; target: string; detail: string }
        ) => {
            setBrands(nextBrands);
            try {
                localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(nextBrands));

                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                    ? JSON.parse(rawMatrix)
                    : {};

                if (newlyCreatedBrand && newlyCreatedBrand.products.length > 0) {
                    const np = newlyCreatedBrand.products[0];
                    const kKey = (np.kioskCode || "demo-device").toLowerCase();
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    perKioskMatrix[kKey][np.name.trim().toLowerCase()] = 100;
                    localStorage.setItem(
                        KIOSK_PER_UNIT_STOCK_KEY,
                        JSON.stringify(perKioskMatrix)
                    );
                }

                const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                if (rawProds) {
                    const parsedProds = JSON.parse(rawProds);
                    if (Array.isArray(parsedProds)) {
                        const updatedProds = parsedProds.map((p: any) => {
                            const parentBrand = nextBrands.find((b) =>
                                isExactMatch(b.name, p.brand || "")
                            );
                            if (!parentBrand) return p;
                            return {
                                ...p,
                                status:
                                    parentBrand.status === "ACTIVE"
                                        ? "ACTIVE"
                                        : "INACTIVE",
                            };
                        });

                        if (newlyCreatedBrand && newlyCreatedBrand.products.length > 0) {
                            const np = newlyCreatedBrand.products[0];
                            updatedProds.unshift({
                                id: Date.now(),
                                slotNumber: np.slotNumber,
                                skuCode: np.skuCode || `SKU-${newlyCreatedBrand.code}-01`,
                                name: np.name,
                                brand: newlyCreatedBrand.name,
                                category: "Niche",
                                concentration: np.concentration,
                                family: np.family,
                                topNotes: np.notes,
                                heartNotes: "Amberwood, Jasmine",
                                baseNotes: "Sandalwood, White Musk",
                                notes: np.notes,
                                description: newlyCreatedBrand.description,
                                bottleVolumeMl: 100,
                                sprayVolumeMl: 0.12,
                                pricePerSpray: np.sprayPrice,
                                retail10ml: np.retailPrice10ml,
                                fullBottlePrice: np.fullBottlePrice,
                                lowStockThresholdPct: 15,
                                status:
                                    newlyCreatedBrand.status === "ACTIVE"
                                        ? "ACTIVE"
                                        : "INACTIVE",
                                image: np.image,
                                baseSessions30d: 300,
                                liveExtraSprays: 0,
                                samplingSessions30d: 300,
                                assignedMachines: [
                                    {
                                        kioskCode: "demo-device",
                                        location: "Diamond Plaza Luxury Atrium, HCMC",
                                        physicalSlotLabel: "Slot 04",
                                        remainingVolumeMl: 100,
                                        capacityMl: 100,
                                        machineStatus: "ONLINE",
                                    },
                                ],
                            });
                        }

                        localStorage.setItem(
                            PRODUCTS_STORAGE_KEY,
                            JSON.stringify(updatedProds)
                        );
                    }
                } else {
                    // Nếu chưa mở /products lần nào thì tự động khởi tạo danh sách sản phẩm từ nextBrands để Màn 1, 4, 5 nhận ngay trạng thái Suspend/Active
                    const seededProds = nextBrands.flatMap((b) =>
                        b.products.map((np) => ({
                            id: np.slotNumber,
                            slotNumber: np.slotNumber,
                            skuCode: np.skuCode || `SKU-0${np.slotNumber}`,
                            name: np.name,
                            brand: b.name,
                            category: np.audience || "Unisex",
                            concentration: np.concentration,
                            family: np.family,
                            notes: np.notes,
                            description: b.description,
                            bottleVolumeMl: np.bottleVolumeMl || 100,
                            sprayVolumeMl: 0.12,
                            pricePerSpray: np.sprayPrice,
                            retail10ml: np.retailPrice10ml,
                            fullBottlePrice: np.fullBottlePrice,
                            lowStockThresholdPct: 15,
                            status: b.status === "ACTIVE" ? np.status : "INACTIVE",
                            image: np.image,
                            baseSessions30d: 300,
                            liveExtraSprays: 0,
                            samplingSessions30d: 300,
                            assignedMachines: [
                                {
                                    kioskCode: np.kioskCode || "demo-device",
                                    location:
                                        np.kioskLocation ||
                                        "Diamond Plaza Luxury Atrium, HCMC",
                                    physicalSlotLabel: `Slot 0${((np.slotNumber - 1) % 4) + 1}`,
                                    remainingVolumeMl: np.remainingVolumeMl ?? 75,
                                    capacityMl: np.bottleVolumeMl || 100,
                                    machineStatus: "ONLINE",
                                },
                            ],
                        }))
                    );
                    localStorage.setItem(
                        PRODUCTS_STORAGE_KEY,
                        JSON.stringify(seededProds)
                    );
                }

                if (auditEvent) {
                    const nowIso = new Date().toISOString();
                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                    auditList.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: nowIso,
                        actor: currentActorRole,
                        role: "PSA",
                        tenant: auditEvent.target,
                        action: auditEvent.action,
                        entityType: "BRANDS",
                        entityId: auditEvent.target,
                        severity: "INFO",
                        oldValues: null,
                        newValues: { detail: auditEvent.detail },
                        sourceIp: "127.0.0.1",
                    });
                    localStorage.setItem(
                        AUDIT_LOGS_STORAGE_KEY,
                        JSON.stringify(auditList.slice(0, 250))
                    );
                }

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        [currentActorRole]
    );

    /* --- 3. TÁC VỤ XỊT THỬ (-0.12ML) HOẶC NẠP BÌNH (100%) TRỰC TIẾP TỪ MODAL BRAND ĐỒNG BỘ 13 MÀN HÌNH --- */
    const handleBrandChamberAction = useCallback(
        (
            brandObj: BrandItem,
            slotItem: LiveBrandKioskSlot,
            actionType: "SPRAY" | "REFILL"
        ) => {
            if (isViewerReadOnly) return;

            const kKey = slotItem.kioskCode.toLowerCase();
            const pKey = slotItem.fragranceName.trim().toLowerCase();
            const qtyBefore = slotItem.remainingMl;

            if (actionType === "SPRAY" && qtyBefore < 0.12) {
                showToast(
                    lang === "en"
                        ? `Cartridge ${slotItem.fragranceName} on ${slotItem.kioskCode} is empty (0ml). Click "Refill 100%" first!`
                        : `Bình ${slotItem.fragranceName} tại trạm ${slotItem.kioskCode} đã cạn (0ml). Vui lòng bấm Nạp 100% trước!`
                );
                return;
            }

            const qtyAfter =
                actionType === "REFILL"
                    ? slotItem.capacityMl
                    : Number(Math.max(0, qtyBefore - 0.12).toFixed(2));
            const nowIso = new Date().toISOString();

            try {
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                    ? JSON.parse(rawMatrix)
                    : {};
                if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                perKioskMatrix[kKey][pKey] = qtyAfter;
                localStorage.setItem(
                    KIOSK_PER_UNIT_STOCK_KEY,
                    JSON.stringify(perKioskMatrix)
                );

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
                                    actionType === "REFILL" && m.status === "OFFLINE"
                                        ? "ONLINE"
                                        : m.status,
                                connectionStatus:
                                    actionType === "REFILL" && m.status === "OFFLINE"
                                        ? "ONLINE"
                                        : m.connectionStatus || "ONLINE",
                                operatingStatus:
                                    actionType === "REFILL" && m.status === "OFFLINE"
                                        ? "ACTIVE"
                                        : m.operatingStatus || "ACTIVE",
                                manualAdminOverride: true,
                                todaySprays:
                                    actionType === "SPRAY"
                                        ? (m.todaySprays || 0) + 1
                                        : m.todaySprays,
                                todayRevenue:
                                    actionType === "SPRAY"
                                        ? (m.todayRevenue || 0) + slotItem.sprayPrice
                                        : m.todayRevenue,
                                slots: Array.isArray(m.slots)
                                    ? m.slots.map((sl: any) =>
                                        isExactMatch(
                                            sl.fragranceName || "",
                                            slotItem.fragranceName
                                        )
                                            ? {
                                                ...sl,
                                                remainingMl: qtyAfter,
                                                available: qtyAfter >= 0.12,
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

                const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                if (rawProds) {
                    const parsedProds = JSON.parse(rawProds);
                    if (Array.isArray(parsedProds)) {
                        const syncedProds = parsedProds.map((p: any) => {
                            if (!isExactMatch(p.name || "", slotItem.fragranceName)) {
                                return p;
                            }
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
                        localStorage.setItem(
                            PRODUCTS_STORAGE_KEY,
                            JSON.stringify(syncedProds)
                        );
                    }
                }

                const refOrderOrRefillId =
                    actionType === "SPRAY"
                        ? `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`
                        : `RFL-2026-${Math.floor(1000 + Math.random() * 8999)}`;

                if (actionType === "SPRAY") {
                    const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                    const dashData = rawDash
                        ? JSON.parse(rawDash)
                        : { transactions: [], incidents: [], alerts: [] };
                    if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                    dashData.transactions.unshift({
                        id: refOrderOrRefillId,
                        time: `Completed (${slotItem.kioskCode})`,
                        kiosk: slotItem.kioskCode,
                        location: slotItem.kioskName,
                        slotNumber: slotItem.slotNumber,
                        brand: brandObj.name,
                        product: slotItem.fragranceName,
                        priceSnapshot: slotItem.sprayPrice,
                        amount: slotItem.sprayPrice,
                        paidAmount: slotItem.sprayPrice,
                        paymentMethod: "VIETQR",
                        providerReference: `PAY-VIETQR-${refOrderOrRefillId}`,
                        status: "DISPENSED",
                        commandReference: `CMD-${refOrderOrRefillId}`,
                        ackedAt: nowIso,
                        executedAt: nowIso,
                        createdAt: nowIso,
                        dateType: "TODAY",
                    });
                    localStorage.setItem(
                        DASHBOARD_STORAGE_KEY,
                        JSON.stringify(dashData)
                    );
                }

                // Ghi vào INVENTORY_MOVEMENTS_KEY cho cả SPRAY (-0.12ml) lẫn REFILL (+ml) để Màn 11 (/inventory) nhảy biểu đồ tức thì
                const rawMov = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                const movList = rawMov ? JSON.parse(rawMov) : [];
                movList.unshift({
                    movementId: `MOV-${Date.now()}`,
                    orderId: refOrderOrRefillId,
                    kioskCode: slotItem.kioskCode,
                    slotNumber: slotItem.slotNumber,
                    brand: brandObj.name,
                    productName: slotItem.fragranceName,
                    movementType: actionType === "SPRAY" ? "SALE" : "INSTALL",
                    quantityBeforeMl: qtyBefore,
                    quantityAfterMl: qtyAfter,
                    deltaMl: Number((qtyAfter - qtyBefore).toFixed(2)),
                    reason:
                        actionType === "SPRAY"
                            ? `Brand dossier calibrated spray on ${slotItem.kioskCode}`
                            : `Brand dossier 100% cartridge replenishment on ${slotItem.kioskCode}`,
                    timestamp: nowIso,
                });
                localStorage.setItem(
                    INVENTORY_MOVEMENTS_KEY,
                    JSON.stringify(movList.slice(0, 300))
                );

                // Ghi vào AUDIT_LOGS_STORAGE_KEY cho Màn 9 (/reports) & Màn 12 (/users)
                const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                auditList.unshift({
                    id: `AUD-${Date.now().toString().slice(-4)}`,
                    timestamp: nowIso,
                    actor: currentActorRole,
                    role: "PSA",
                    tenant: brandObj.name,
                    action:
                        actionType === "SPRAY"
                            ? "BRAND_CHAMBER_SPRAY"
                            : "BRAND_CHAMBER_REPLENISHED",
                    entityType: "INVENTORY",
                    entityId: `${slotItem.kioskCode} • ${slotItem.fragranceName}`,
                    severity: "INFO",
                    oldValues: { remainingMl: qtyBefore },
                    newValues: {
                        machineRemainingMl: qtyAfter,
                        detail: `${actionType === "SPRAY" ? "Dispensed -0.12ml" : "Replenished 100%"} for ${slotItem.fragranceName} on ${slotItem.kioskCode} (${qtyBefore}ml → ${qtyAfter}ml).`,
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
                loadAndReconcileBrandsData();

                showToast(
                    actionType === "SPRAY"
                        ? lang === "en"
                            ? `Dispensed 1 calibrated spray (-0.12ml) of ${slotItem.fragranceName} on ${slotItem.kioskCode}: ${qtyBefore}ml → ${qtyAfter}ml (+${formatPrice(slotItem.sprayPrice)})`
                            : `Đã kích hoạt phun (-0.12ml) ${slotItem.fragranceName} tại trạm ${slotItem.kioskCode}: ${qtyBefore}ml → ${qtyAfter}ml (+${formatPrice(slotItem.sprayPrice)})`
                        : lang === "en"
                            ? `Replenished cartridge ${slotItem.fragranceName} on ${slotItem.kioskCode} to ${qtyAfter}ml (100% capacity)`
                            : `Đã nạp đầy 100% (${qtyAfter}ml) cho bình ${slotItem.fragranceName} tại trạm ${slotItem.kioskCode}`
                );
            } catch {
                // Safe fallback
            }
        },
        [currentActorRole, isViewerReadOnly, lang, loadAndReconcileBrandsData, showToast]
    );

    const statusLabels: Record<string, string> = {
        ALL: lang === "en" ? "All Statuses" : "Mọi Trạng Thái",
        ACTIVE: "ACTIVE",
        INACTIVE: "INACTIVE",
        SUSPENDED: "SUSPENDED",
    };

    const sortLabels: Record<"NAME" | "CREATED_DATE" | "PERFORMANCE", string> = {
        NAME: lang === "en" ? "Sort: Maison Name (A-Z)" : "Xếp: Tên Thương Hiệu (A-Z)",
        CREATED_DATE: lang === "en" ? "Sort: Onboarded Date" : "Xếp: Ngày Hợp Tác",
        PERFORMANCE: lang === "en" ? "Sort: Recognized Revenue" : "Xếp: Doanh Thu Cao Nhất",
    };

    const scopedBrands = useMemo(() => {
        if (!brandTenantScope) return brands;
        return brands.filter((b) => isExactMatch(b.name, brandTenantScope));
    }, [brands, brandTenantScope]);

    const overviewKpis = useMemo(() => {
        const totalHouses = scopedBrands.length;
        const activeHouses = scopedBrands.filter((b) => b.status === "ACTIVE").length;
        const totalSkus = scopedBrands.reduce((acc, b) => acc + b.products.length, 0);
        const totalRevenue = scopedBrands.reduce((acc, b) => acc + b.revenueValue, 0);
        const totalTransactions = scopedBrands.reduce(
            (acc, b) => acc + b.transactionsCount,
            0
        );
        return {
            totalHouses,
            activeHouses,
            totalSkus,
            totalRevenue,
            totalTransactions,
        };
    }, [scopedBrands]);

    const filteredBrands = useMemo(() => {
        return scopedBrands
            .filter((b) => {
                const q = searchQuery.toLowerCase().trim();
                const matchesSearch =
                    !q ||
                    b.name.toLowerCase().includes(q) ||
                    b.code.toLowerCase().includes(q) ||
                    b.products.some((p) => p.name.toLowerCase().includes(q));
                const matchesStatus =
                    selectedStatus === "ALL" || b.status === selectedStatus;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === "NAME") return a.name.localeCompare(b.name);
                if (sortBy === "CREATED_DATE")
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
                if (sortBy === "PERFORMANCE") return b.revenueValue - a.revenueValue;
                return 0;
            });
    }, [scopedBrands, searchQuery, selectedStatus, sortBy]);

    const handleCopy = (text: string, fieldName: string) => {
        void navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 1800);
    };

    const handleDirectLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBrand) return;

        if (isViewerReadOnly) {
            showToast("Permission Denied: Viewer accounts cannot modify brand assets.");
            return;
        }

        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!validTypes.includes(file.type)) {
            showToast("Invalid file format. Only PNG, JPG, or WEBP files are permitted.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast("File size exceeds 5MB limit. Please select a smaller image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64Url = String(reader.result || selectedBrand.image);
            const updatedBrand: BrandItem = {
                ...selectedBrand,
                image: base64Url,
                gallery: [base64Url, ...(selectedBrand.gallery || [])],
            };

            const nextList = brands.map((b) =>
                b.id === selectedBrand.id ? updatedBrand : b
            );
            persistBrandsAndSyncAllModules(nextList, undefined, {
                action: "BRAND_LOGO_UPDATED",
                target: selectedBrand.code,
                detail: `Uploaded new brand cover asset (${file.name}) for ${selectedBrand.name}.`,
            });

            showToast(
                `Uploaded "${file.name}" (${(file.size / 1024).toFixed(
                    1
                )} KB) and persisted to Brand Portfolio!`
            );
        };
        reader.readAsDataURL(file);
    };

    const handleToggleBrandStatus = (brand: BrandItem) => {
        if (isViewerReadOnly) return;
        const nextStatus: BrandItem["status"] =
            brand.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        const updated: BrandItem = {
            ...brand,
            status: nextStatus,
            products: brand.products.map((p) => ({
                ...p,
                status: nextStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE",
            })),
        };
        const nextList = brands.map((b) => (b.id === brand.id ? updated : b));
        persistBrandsAndSyncAllModules(nextList, undefined, {
            action: `BRAND_STATUS_${nextStatus}`,
            target: brand.code,
            detail: `Changed ${brand.name} status to ${nextStatus} & cascaded status to ${brand.products.length} associated SKU(s).`,
        });
        showToast(
            lang === "en"
                ? `Updated ${brand.name} status to ${nextStatus} & cascaded product availability!`
                : `Đã chuyển trạng thái hãng ${brand.name} sang ${nextStatus} & cập nhật trạng thái sản phẩm!`
        );
    };

    const openAddModal = () => {
        if (isViewerReadOnly) return;
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
        setOpenDropdown(null);
        setIsModalOpen(true);
    };

    const openEditModal = (brand: BrandItem, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (isViewerReadOnly) return;
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
        setOpenDropdown(null);
        setIsModalOpen(true);
    };

    const handleSaveBrand = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError("");

        const trimmedName = formName.trim();
        const trimmedCode = formCode.trim().toUpperCase();

        if (!trimmedName || !trimmedCode || !formEmail.trim()) {
            setFormError(
                "Please fill in all required fields (Brand Name, Code, Contact Email)."
            );
            return;
        }

        const isDuplicate = brands.some(
            (b) =>
                (b.name.toLowerCase() === trimmedName.toLowerCase() ||
                    b.code.toUpperCase() === trimmedCode) &&
                b.id !== editingBrand?.id
        );

        if (isDuplicate) {
            setFormError(
                "Duplicate brand name or partner code detected. Please enter a unique brand."
            );
            return;
        }

        if (editingBrand) {
            const updated: BrandItem = {
                ...editingBrand,
                name: trimmedName,
                code: trimmedCode,
                description: formDesc,
                email: formEmail,
                phone: formPhone || "+33 1 00 00 00 00",
                address: formAddress || "Paris, France",
                website: formWebsite || "https://www.scentstation.local",
                status: formStatus,
                image: formImage,
                products: editingBrand.products.map((p) => ({
                    ...p,
                    status: formStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE",
                })),
            };
            const nextList = brands.map((b) =>
                b.id === editingBrand.id ? updated : b
            );
            persistBrandsAndSyncAllModules(nextList, undefined, {
                action: "BRAND_PROFILE_UPDATED",
                target: trimmedCode,
                detail: `Updated partner profile & status [${formStatus}] for ${trimmedName}.`,
            });
            showToast(
                lang === "en"
                    ? `Updated ${trimmedName} profile & synchronized across all modules!`
                    : `Đã cập nhật hồ sơ hãng ${trimmedName} & đồng bộ toàn hệ thống!`
            );
        } else {
            const nextSlotNum = overviewKpis.totalSkus + 1;
            const newBrand: BrandItem = {
                id: Date.now(),
                name: trimmedName,
                code: trimmedCode,
                description:
                    formDesc ||
                    "Luxury partner fragrance house registered on ScentStation.",
                website: formWebsite || "https://www.scentstation.local",
                email: formEmail,
                phone: formPhone || "+33 1 40 00 00 00",
                address: formAddress || "Avenue Montaigne, Paris, France",
                status: formStatus,
                createdAt: todayYmd,
                machinesCount: 1,
                transactionsCount: 1,
                revenueValue: 15000,
                image: formImage,
                products: [
                    {
                        slotNumber: nextSlotNum,
                        skuCode: `SKU-${trimmedCode.slice(0, 4)}-${nextSlotNum}`,
                        name: `${trimmedName} Signature EDP`,
                        family: "Oriental Woody",
                        concentration: "Eau de Parfum",
                        audience: "Unisex",
                        notes: "Amber, Saffron, Cedarwood",
                        volume: "100ml",
                        bottleVolumeMl: 100,
                        remainingVolumeMl: 100,
                        kioskCode: "demo-device",
                        kioskLocation: "Diamond Plaza Luxury Atrium, HCMC",
                        sprayPrice: 15000,
                        retailPrice10ml: 450000,
                        fullBottlePrice: 3900000,
                        rating: 4.9,
                        status: formStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE",
                        image: formImage,
                    },
                ],
            };
            const nextList = [newBrand, ...brands];
            persistBrandsAndSyncAllModules(nextList, newBrand, {
                action: "BRAND_ONBOARDED",
                target: trimmedCode,
                detail: `Onboarded new partner maison ${trimmedName} (${trimmedCode}) & provisioned Signature SKU.`,
            });
            showToast(
                lang === "en"
                    ? `Onboarded ${trimmedName} (${trimmedCode}) & provisioned Signature SKU!`
                    : `Đã thêm thương hiệu đối tác ${trimmedName} (${trimmedCode}) & khởi tạo mùi hương Signature!`
            );
        }

        setIsModalOpen(false);
    };

    const handleResetFilters = () => {
        setStartDate(defaultStart30d);
        setEndDate(todayYmd);
        setDatePreset("LAST_30_DAYS");
        setSearchQuery("");
        setSelectedStatus("ALL");
        setSortBy("NAME");
        setOpenDropdown(null);
    };

    const renderStatusBadge = (status: BrandItem["status"]) => {
        if (status === "ACTIVE") {
            return (
                <span className={styles.badgeActive}>
                    <CheckCircle2 size={12} />
                    <span>ACTIVE</span>
                </span>
            );
        }
        if (status === "SUSPENDED") {
            return (
                <span className={styles.badgeLocked}>
                    <AlertCircle size={12} />
                    <span>SUSPENDED</span>
                </span>
            );
        }
        return (
            <span className={styles.badgeInactive}>
                <AlertCircle size={12} />
                <span>INACTIVE</span>
            </span>
        );
    };

    const rangeMultiplier =
        analyticsRange === "7D" ? 0.25 : analyticsRange === "30D" ? 0.65 : 1;

    const selectedBrandLiveSlots = useMemo(() => {
        if (!selectedBrand) return [];
        const bKey = selectedBrand.name.toLowerCase();
        const rawSlots = liveFleetSlotsByBrand[bKey] || [];

        return selectedBrand.products.map((prod) => {
            const matchedLive = rawSlots.find((s) =>
                isExactMatch(s.fragranceName, prod.name)
            );
            return {
                kioskCode: matchedLive?.kioskCode || prod.kioskCode || "demo-device",
                kioskName:
                    matchedLive?.kioskName ||
                    prod.kioskLocation ||
                    "Flagship Kiosk Atrium",
                address:
                    matchedLive?.address ||
                    prod.kioskLocation ||
                    "District 1, HCMC",
                status:
                    matchedLive?.status ||
                    (prod.kioskCode === "KIOSK-004"
                        ? "OFFLINE"
                        : prod.kioskCode === "KIOSK-HN-02"
                            ? "MAINTENANCE"
                            : "ONLINE"),
                chamberTemp: matchedLive?.chamberTemp || "21.5°C",
                slotLabel:
                    matchedLive?.slotLabel ||
                    `Slot 0${((prod.slotNumber - 1) % 4) + 1}`,
                slotNumber: prod.slotNumber,
                fragranceName: prod.name,
                sprayPrice: prod.sprayPrice,
                remainingMl:
                    matchedLive?.remainingMl ?? prod.remainingVolumeMl ?? 70,
                capacityMl:
                    matchedLive?.capacityMl ?? prod.bottleVolumeMl ?? 100,
            };
        });
    }, [selectedBrand, liveFleetSlotsByBrand]);

    const selectedBrandLiveTransactions = useMemo(() => {
        if (!selectedBrand) return [];
        const bKey = selectedBrand.name.toLowerCase();
        const realTxs = (liveTxsByBrand[bKey] || []).filter(
            (t) => t.dateStr >= startDate && t.dateStr <= endDate
        );

        const seenIds = new Set<string>();
        const merged: LiveBrandTransaction[] = [];
        realTxs.forEach((tx) => {
            if (!seenIds.has(tx.id)) {
                seenIds.add(tx.id);
                merged.push(tx);
            }
        });

        const targetCount = Math.max(merged.length, selectedBrand.transactionsCount);
        const gateways = ["VIETQR", "MOMO", "VNPAY", "ZALOPAY"];
        const prods = selectedBrand.products;

        let seq = 0;
        while (merged.length < targetCount && prods.length > 0) {
            const prod = prods[seq % prods.length];
            const txId = `TXN-2026-${9100 + prod.slotNumber * 10 + seq}`;
            if (!seenIds.has(txId)) {
                seenIds.add(txId);
                const dayOffset = seq % 7;
                const dStr = addDaysToYmd(endDate, -dayOffset);
                const hr = String(10 + (seq % 11)).padStart(2, "0");
                const mn = String(12 + ((seq * 7) % 45)).padStart(2, "0");

                merged.push({
                    id: txId,
                    dateStr: dStr,
                    kiosk: prod.kioskCode || "demo-device",
                    productName: prod.name,
                    slotNumber: prod.slotNumber,
                    amount: prod.sprayPrice,
                    paymentMethod: gateways[seq % gateways.length],
                    time: `${dStr} ${hr}:${mn}:15`,
                    status: "DISPENSED",
                });
            }
            seq++;
        }

        return merged;
    }, [selectedBrand, liveTxsByBrand, startDate, endDate]);

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            onClick={() => setOpenDropdown(null)}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleDirectLogoUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: "none" }}
            />

            {/* LUXURY HERO BANNER CARD */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? "MULTI-TENANT MAISON PORTFOLIO & PARTNER GOVERNANCE"
                                : "QUẢN TRỊ DANH MỤC THƯƠNG HIỆU ĐỐI TÁC & ĐỐI SOÁT DOANH THU"}
                        </span>
                        <h1 className={styles.title}>
                            {lang === "en"
                                ? "Brand Portfolio Management"
                                : "Quản Trị Thương Hiệu Nước Hoa Đối Tác"}
                        </h1>
                        <p className={styles.subtitle}>
                            {lang === "en"
                                ? `Real-time multi-tenant synchronization across ${overviewKpis.totalHouses} luxury partner maisons, ${overviewKpis.totalSkus} signature fragrances, and deployed IoT sampling stations.`
                                : `Đồng bộ đa thương hiệu theo thời gian thực trên ${overviewKpis.totalHouses} nhà hương cao cấp, ${overviewKpis.totalSkus} mùi hương tuyển chọn và mạng lưới trạm Kiosk IoT.`}
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

                        <div
                            className={styles.secondaryGoldBtn}
                            style={{ cursor: "default" }}
                        >
                            <ShieldCheck size={14} color="#34D399" />
                            <span>
                                {isViewerReadOnly
                                    ? "Viewer (Read-Only)"
                                    : brandTenantScope
                                        ? `Tenant: ${brandTenantScope}`
                                        : currentActorRole}
                            </span>
                        </div>

                        {!isViewerReadOnly && (
                            <button
                                type="button"
                                onClick={openAddModal}
                                className={styles.primaryGoldBtn}
                            >
                                <Plus size={15} />
                                <span>
                                    {lang === "en"
                                        ? "Add Partner Maison"
                                        : "Thêm Thương Hiệu Mới"}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 4 KPI SUMMARY CARDS */}
                <div className={styles.kpiGrid4}>
                    <div
                        className={`${styles.kpiCard} ${
                            selectedStatus === "ALL" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() => setSelectedStatus("ALL")}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "PARTNER MAISONS" : "TỔNG SỐ THƯƠNG HIỆU"}
                        </div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#FFFFFF", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {overviewKpis.totalHouses} Maisons
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399", fontWeight: 600 }}>
                            {overviewKpis.activeHouses} active •{" "}
                            {overviewKpis.totalHouses - overviewKpis.activeHouses} paused
                        </div>
                    </div>

                    <div
                        className={`${styles.kpiCard} ${
                            selectedStatus === "ACTIVE" ? styles.kpiCardActive : ""
                        }`}
                        onClick={() =>
                            setSelectedStatus(
                                selectedStatus === "ACTIVE" ? "ALL" : "ACTIVE"
                            )
                        }
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en" ? "ASSOCIATED FRAGRANCES" : "TỔNG MÙI HƯƠNG ĐANG BÁN"}
                        </div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#34D399", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {overviewKpis.totalSkus} SKUs
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {lang === "en"
                                ? "Synchronized with /products & /inventory"
                                : "Đồng bộ trực tiếp với Sản phẩm & Tồn kho"}
                        </div>
                    </div>

                    <div
                        className={styles.kpiCard}
                        onClick={() => setSortBy("PERFORMANCE")}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en"
                                ? "PORTFOLIO RECOGNIZED REVENUE"
                                : "DOANH THU TOÀN THƯƠNG HIỆU"}
                        </div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#F5E6AD", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            {formatPrice(overviewKpis.totalRevenue)}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399", fontWeight: 600 }}>
                            From {overviewKpis.totalTransactions} verified Kiosk sprays ({formatShortDdMm(startDate)}–{formatShortDdMm(endDate)})
                        </div>
                    </div>

                    <div
                        className={styles.kpiCard}
                        onClick={() => router.push("/machines")}
                    >
                        <div style={{ fontSize: "0.66rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Space Grotesk, monospace" }}>
                            {lang === "en"
                                ? "DEPLOYED STATION FLEET"
                                : "ĐỘI MÁY KIOSK PHÂN BỔ"}
                        </div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#60A5FA", fontFamily: "Space Grotesk, monospace", margin: "0.35rem 0" }}>
                            8 Stations
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            {lang === "en"
                                ? "Select to inspect 4-slot station assignment"
                                : "Chạm để kiểm tra phân bổ 4 khoang máy"}
                        </div>
                    </div>
                </div>
            </div>

            {/* FILTER BAR 2 TẦNG CÓ BẢNG LỊCH THỰC TẾ GIỐNG HỆT MÀN 9, 10, 11, 12 */}
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
                                    ? "Search maison name, partner code, or signature fragrance (e.g. Chanel, Sauvage, Aventus)..."
                                    : "Tìm theo tên thương hiệu, mã đối tác hoặc mùi hương (VD: Chanel, Sauvage, Aventus)..."
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

                    {/* 2. Bảng Lịch Thực Tế (Custom Luxury Dark Calendar Popover) */}
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

                    {/* 3. Custom Dropdown: Status Filter */}
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
                            <span>{statusLabels[selectedStatus]}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "185px" }}
                            >
                                {(["ALL", "ACTIVE", "INACTIVE", "SUSPENDED"] as const).map(
                                    (s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => {
                                                setSelectedStatus(s);
                                                setOpenDropdown(null);
                                            }}
                                            className={`${styles.customDropdownItem} ${
                                                selectedStatus === s
                                                    ? styles.customDropdownItemActive
                                                    : ""
                                            }`}
                                        >
                                            <span>{statusLabels[s]}</span>
                                            {selectedStatus === s && (
                                                <Check size={13} color="#D4AF37" />
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. Custom Dropdown: Sort Criterion */}
                    <div className={styles.customDropdownWrap}>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "SORT" ? null : "SORT"
                                )
                            }
                            className={styles.customDropdownTrigger}
                        >
                            <ArrowUpDown size={13} color="#D4AF37" />
                            <span>{sortLabels[sortBy]}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "SORT" && (
                            <div
                                className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                style={{ minWidth: "245px" }}
                            >
                                {(
                                    [
                                        "NAME",
                                        "CREATED_DATE",
                                        "PERFORMANCE",
                                    ] as const
                                ).map((criterion) => (
                                    <button
                                        key={criterion}
                                        type="button"
                                        onClick={() => {
                                            setSortBy(criterion);
                                            setOpenDropdown(null);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            sortBy === criterion
                                                ? styles.customDropdownItemActive
                                                : ""
                                        }`}
                                    >
                                        <span>{sortLabels[criterion]}</span>
                                        {sortBy === criterion && (
                                            <Check size={13} color="#D4AF37" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. View Mode Toggle (Grid / List) */}
                    <div
                        style={{
                            display: "flex",
                            background: "#08080D",
                            border: "1px solid rgba(212,175,55,0.35)",
                            borderRadius: "11px",
                            padding: "0.18rem",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            style={{
                                background:
                                    viewMode === "grid"
                                        ? "rgba(212,175,55,0.22)"
                                        : "transparent",
                                border: "none",
                                color: viewMode === "grid" ? "#F5E6AD" : "#94A3B8",
                                padding: "0.4rem 0.65rem",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                            }}
                            title="Grid View"
                        >
                            <LayoutGrid size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            style={{
                                background:
                                    viewMode === "list"
                                        ? "rgba(212,175,55,0.22)"
                                        : "transparent",
                                border: "none",
                                color: viewMode === "list" ? "#F5E6AD" : "#94A3B8",
                                padding: "0.4rem 0.65rem",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                            }}
                            title="List View"
                        >
                            <ListIcon size={15} />
                        </button>
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

            {filteredBrands.length > 0 ? (
                viewMode === "grid" ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(320px, 1fr))",
                            gap: "1.25rem",
                            marginBottom: "2rem",
                        }}
                    >
                        {filteredBrands.map((brand) => {
                            const sampleProd = brand.products[0];
                            return (
                                <div
                                    key={brand.id}
                                    onClick={() => {
                                        setSelectedBrandId(brand.id);
                                        setActiveDetailTab("overview");
                                    }}
                                    style={{
                                        background:
                                            "linear-gradient(160deg, rgba(17, 17, 26, 0.94) 0%, rgba(8, 8, 13, 0.98) 100%)",
                                        border:
                                            selectedBrand?.id === brand.id
                                                ? "1px solid #D4AF37"
                                                : "1px solid rgba(212, 175, 55, 0.28)",
                                        borderRadius: "18px",
                                        padding: "1.35rem",
                                        cursor: "pointer",
                                        transition: "all 0.25s ease",
                                        boxShadow: "0 15px 40px rgba(0,0,0,0.65)",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: "1rem",
                                        }}
                                    >
                                        <div className={styles.productImageCell}>
                                            <div className={styles.imagePlaceholder}>
                                                <Image
                                                    src={brand.image}
                                                    alt={brand.name}
                                                    fill
                                                    sizes="48px"
                                                    style={{ objectFit: "cover" }}
                                                />
                                            </div>
                                            <div>
                                                <h3
                                                    style={{
                                                        fontSize: "1.05rem",
                                                        fontWeight: 700,
                                                        color: "#FFF",
                                                        margin: 0,
                                                        fontFamily:
                                                            "Bodoni Moda, Georgia, serif",
                                                    }}
                                                >
                                                    {brand.name}
                                                </h3>
                                                <span
                                                    style={{
                                                        fontSize: "0.72rem",
                                                        color: "#F5E6AD",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {brand.code} • {brand.machinesCount}{" "}
                                                    Station(s)
                                                </span>
                                            </div>
                                        </div>
                                        {renderStatusBadge(brand.status)}
                                    </div>
                                    <p
                                        style={{
                                            fontSize: "0.81rem",
                                            color: "#94A3B8",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            marginBottom: "0.95rem",
                                            lineHeight: "1.5",
                                        }}
                                    >
                                        {brand.description}
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingTop: "0.8rem",
                                            borderTop:
                                                "1px solid rgba(255,255,255,0.06)",
                                            fontSize: "0.78rem",
                                            color: "#CBD5E1",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        <span>
                                            Spray:{" "}
                                            <strong style={{ color: "#F5E6AD" }}>
                                                {formatPrice(
                                                    sampleProd?.sprayPrice || 15000
                                                )}
                                            </strong>
                                        </span>
                                        <span>
                                            Revenue:{" "}
                                            <strong style={{ color: "#34D399" }}>
                                                {formatPrice(brand.revenueValue)}
                                            </strong>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.tableCard}>
                        <div className={styles.tableScrollContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                <tr>
                                    <th>MAISON &amp; HERITAGE</th>
                                    <th>PARTNER CODE</th>
                                    <th>SIGNATURE FRAGRANCE &amp; NOTES</th>
                                    <th>PRICE / SPRAY</th>
                                    <th>RECOGNIZED REVENUE ({formatShortDdMm(startDate)}–{formatShortDdMm(endDate)})</th>
                                    <th style={{ textAlign: "center" }}>STATUS</th>
                                    <th style={{ textAlign: "right" }}>ACTIONS</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredBrands.map((brand) => {
                                    const mainProduct = brand.products[0] || {
                                        name: `${brand.name} Signature`,
                                        notes: "Amber, Bergamot, Musk",
                                        sprayPrice: 15000,
                                        retailPrice10ml: 450000,
                                        fullBottlePrice: 3800000,
                                        volume: "100ml",
                                    };
                                    return (
                                        <tr
                                            key={brand.id}
                                            className={styles.tableRow}
                                            onClick={() => {
                                                setSelectedBrandId(brand.id);
                                                setActiveDetailTab("overview");
                                            }}
                                        >
                                            <td
                                                className={styles.tableCell}
                                                style={{ maxWidth: "320px" }}
                                            >
                                                <div
                                                    className={
                                                        styles.productImageCell
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.imagePlaceholder
                                                        }
                                                    >
                                                        <Image
                                                            src={brand.image}
                                                            alt={brand.name}
                                                            fill
                                                            sizes="48px"
                                                            style={{
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div
                                                            style={{
                                                                fontWeight: 700,
                                                                color: "#FFFFFF",
                                                                fontSize:
                                                                    "0.88rem",
                                                                marginBottom:
                                                                    "0.18rem",
                                                            }}
                                                        >
                                                            {brand.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.75rem",
                                                                color: "#94A3B8",
                                                                display:
                                                                    "-webkit-box",
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient:
                                                                    "vertical",
                                                                overflow:
                                                                    "hidden",
                                                                lineHeight:
                                                                    "1.35",
                                                            }}
                                                        >
                                                            {brand.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td
                                                className={styles.tableCell}
                                                style={{
                                                    color: "#F5E6AD",
                                                    fontWeight: 700,
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                <div>{brand.code}</div>
                                                <div
                                                    style={{
                                                        fontSize: "0.71rem",
                                                        color: "#94A3B8",
                                                        marginTop: "2px",
                                                    }}
                                                >
                                                    {brand.machinesCount}{" "}
                                                    Station(s) •{" "}
                                                    {formatShortDdMm(
                                                        brand.createdAt
                                                    )}
                                                </div>
                                            </td>

                                            <td className={styles.tableCell}>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#FFFFFF",
                                                        fontSize: "0.84rem",
                                                        marginBottom:
                                                            "0.2rem",
                                                    }}
                                                >
                                                    {mainProduct.name} (
                                                    {brand.products.length}{" "}
                                                    SKUs)
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.74rem",
                                                        color: "#94A3B8",
                                                    }}
                                                >
                                                    {mainProduct.notes}
                                                </div>
                                            </td>

                                            <td
                                                className={styles.tableCell}
                                                style={{
                                                    fontWeight: 700,
                                                    color: "#F5E6AD",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.86rem",
                                                }}
                                            >
                                                {formatPrice(
                                                    mainProduct.sprayPrice
                                                )}
                                            </td>

                                            <td className={styles.tableCell}>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#34D399",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        fontSize: "0.86rem",
                                                    }}
                                                >
                                                    {formatPrice(brand.revenueValue)}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.72rem",
                                                        color: "#94A3B8",
                                                        marginTop: "0.15rem",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {brand.transactionsCount} sprays • Bottle: {formatPrice(mainProduct.fullBottlePrice)}
                                                </div>
                                            </td>

                                            <td
                                                className={styles.tableCell}
                                                style={{ textAlign: "center" }}
                                            >
                                                {renderStatusBadge(
                                                    brand.status
                                                )}
                                            </td>

                                            <td
                                                className={styles.tableCell}
                                                style={{
                                                    textAlign: "right",
                                                    whiteSpace: "nowrap",
                                                }}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        gap: "0.4rem",
                                                    }}
                                                >
                                                    {!isViewerReadOnly && (
                                                        <button
                                                            type="button"
                                                            className={
                                                                styles.actionButton
                                                            }
                                                            style={{
                                                                padding:
                                                                    "0.38rem 0.6rem",
                                                            }}
                                                            title="Edit Maison"
                                                            onClick={(e) =>
                                                                openEditModal(
                                                                    brand,
                                                                    e
                                                                )
                                                            }
                                                        >
                                                            <Edit3
                                                                size={14}
                                                                color="#D4AF37"
                                                            />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={
                                                            styles.actionButton
                                                        }
                                                        style={{
                                                            padding:
                                                                "0.38rem 0.6rem",
                                                        }}
                                                        title="Inspect Maison Dossier"
                                                        onClick={() => {
                                                            setSelectedBrandId(
                                                                brand.id
                                                            );
                                                            setActiveDetailTab(
                                                                "overview"
                                                            );
                                                        }}
                                                    >
                                                        <Eye
                                                            size={14}
                                                            color="#D4AF37"
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        color: "#94A3B8",
                        padding: "3.5rem",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "16px",
                        border: "1px solid rgba(212,175,55,0.2)",
                    }}
                >
                    <p
                        style={{
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: "#F5E6AD",
                            marginBottom: "0.4rem",
                        }}
                    >
                        No partner maisons found
                    </p>
                    <p style={{ fontSize: "0.84rem", marginBottom: "1.1rem" }}>
                        No brands match your current search keyword or status filter.
                    </p>
                    <button
                        onClick={handleResetFilters}
                        className={styles.secondaryGoldBtn}
                    >
                        <span>Reset All Filters</span>
                    </button>
                </div>
            )}

            {/* CENTERED LUXURY MODAL: BRAND DOSSIER */}
            {selectedBrand && (
                <div
                    className={styles.drawerOverlay}
                    onClick={() => setSelectedBrandId(null)}
                >
                    <div
                        className={styles.drawerPanel}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.drawerHeroBanner}>
                            <div
                                className={styles.drawerHeroBg}
                                style={{
                                    backgroundImage: `url(${selectedBrand.image})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            />
                            <div className={styles.drawerHeroOverlay} />

                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "nowrap",
                                    gap: "1rem",
                                }}
                            >
                                <div
                                    className={styles.productImageCell}
                                    style={{ minWidth: 0, flex: 1 }}
                                >
                                    <div
                                        className={styles.imagePlaceholder}
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            minWidth: "60px",
                                            borderRadius: "14px",
                                        }}
                                    >
                                        <Image
                                            src={selectedBrand.image}
                                            alt={selectedBrand.name}
                                            fill
                                            sizes="60px"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.55rem",
                                                marginBottom: "0.2rem",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "0.65rem",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.14em",
                                                    color: "#D4AF37",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                VERIFIED LUXURY PARTNER •{" "}
                                                {selectedBrand.code}
                                            </span>
                                            {renderStatusBadge(selectedBrand.status)}
                                        </div>
                                        <h2
                                            style={{
                                                fontSize: "1.45rem",
                                                color: "#FFFFFF",
                                                fontFamily:
                                                    "Bodoni Moda, Georgia, serif",
                                                margin: 0,
                                                fontWeight: 600,
                                                lineHeight: 1.15,
                                            }}
                                        >
                                            {selectedBrand.name}
                                        </h2>
                                        <div
                                            style={{
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                color: "#94A3B8",
                                                fontSize: "0.73rem",
                                                marginTop: "0.2rem",
                                            }}
                                        >
                                            ONBOARDED: {selectedBrand.createdAt} •{" "}
                                            REVENUE:{" "}
                                            <strong style={{ color: "#34D399" }}>
                                                {formatPrice(
                                                    selectedBrand.revenueValue
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.45rem",
                                        flexShrink: 0,
                                    }}
                                >
                                    {!isViewerReadOnly && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleToggleBrandStatus(
                                                        selectedBrand
                                                    )
                                                }
                                                className={styles.secondaryGoldBtn}
                                            >
                                                <Power
                                                    size={13}
                                                    color={
                                                        selectedBrand.status ===
                                                        "ACTIVE"
                                                            ? "#F87171"
                                                            : "#34D399"
                                                    }
                                                />
                                                <span>
                                                    {selectedBrand.status ===
                                                    "ACTIVE"
                                                        ? "Suspend"
                                                        : "Activate"}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditModal(selectedBrand)
                                                }
                                                className={styles.primaryGoldBtn}
                                            >
                                                <Edit3 size={13} />
                                                <span>Edit Maison</span>
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBrandId(null)}
                                        className={styles.secondaryGoldBtn}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerTabsBar}>
                            {[
                                {
                                    id: "overview",
                                    label: "Overview",
                                    icon: Building2,
                                },
                                {
                                    id: "products",
                                    label: "Fragrances",
                                    icon: Sparkles,
                                    count: selectedBrand.products.length,
                                },
                                {
                                    id: "machines",
                                    label: "Installed Stations",
                                    icon: Cpu,
                                    count: selectedBrandLiveSlots.length,
                                },
                                {
                                    id: "transactions",
                                    label: "Transactions",
                                    icon: Receipt,
                                    count: selectedBrandLiveTransactions.length,
                                },
                                {
                                    id: "analytics",
                                    label: "Performance Analytics",
                                    icon: BarChart3,
                                },
                            ].map((tab) => {
                                const IconComponent = tab.icon;
                                const isActive = activeDetailTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() =>
                                            setActiveDetailTab(tab.id as any)
                                        }
                                        className={`${styles.drawerTabBtn} ${
                                            isActive
                                                ? styles.drawerTabBtnActive
                                                : ""
                                        }`}
                                    >
                                        <IconComponent size={14} />
                                        <span>{tab.label}</span>
                                        {typeof tab.count === "number" && (
                                            <span
                                                className={
                                                    styles.drawerTabBadge
                                                }
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.drawerBody}>
                            {activeDetailTab === "overview" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "1rem",
                                    }}
                                >
                                    <div className={styles.glassCard}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "0.45rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    color: "#D4AF37",
                                                    textTransform: "uppercase",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.1em",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                Maison Heritage &amp; Olfactory
                                                Identity
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "0.72rem",
                                                    color: "#34D399",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.3rem",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <ShieldCheck size={13} />{" "}
                                                Multi-Tenant SLA Active
                                            </span>
                                        </div>
                                        <p
                                            style={{
                                                color: "#E2E8F0",
                                                lineHeight: "1.6",
                                                margin: 0,
                                                fontSize: "0.86rem",
                                            }}
                                        >
                                            {selectedBrand.description}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "0.85rem",
                                        }}
                                    >
                                        <div
                                            className={styles.glassCard}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                }}
                                            >
                                                <Mail size={16} color="#D4AF37" />
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: "0.68rem",
                                                            color: "#94A3B8",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        CONCIERGE EMAIL
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: "#FFF",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                            fontSize: "0.82rem",
                                                        }}
                                                    >
                                                        {selectedBrand.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCopy(
                                                        selectedBrand.email,
                                                        "email"
                                                    )
                                                }
                                                className={styles.actionButton}
                                            >
                                                {copiedField === "email" ? (
                                                    <Check
                                                        size={13}
                                                        color="#34D399"
                                                    />
                                                ) : (
                                                    <Copy size={13} />
                                                )}
                                            </button>
                                        </div>

                                        <div
                                            className={styles.glassCard}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                }}
                                            >
                                                <Phone
                                                    size={16}
                                                    color="#D4AF37"
                                                />
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: "0.68rem",
                                                            color: "#94A3B8",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        DIRECT HOTLINE
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: "#FFF",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                            fontSize: "0.82rem",
                                                        }}
                                                    >
                                                        {selectedBrand.phone}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCopy(
                                                        selectedBrand.phone,
                                                        "phone"
                                                    )
                                                }
                                                className={styles.actionButton}
                                            >
                                                {copiedField === "phone" ? (
                                                    <Check
                                                        size={13}
                                                        color="#34D399"
                                                    />
                                                ) : (
                                                    <Copy size={13} />
                                                )}
                                            </button>
                                        </div>

                                        <div className={styles.glassCard}>
                                            <div
                                                style={{
                                                    fontSize: "0.68rem",
                                                    color: "#94A3B8",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                OFFICIAL MAISON PORTAL
                                            </div>
                                            <a
                                                href={selectedBrand.website}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    color: "#F5E6AD",
                                                    fontSize: "0.82rem",
                                                    fontWeight: 600,
                                                    textDecoration: "none",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.35rem",
                                                    marginTop: "0.2rem",
                                                }}
                                            >
                                                <span>
                                                    {selectedBrand.website}
                                                </span>
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>

                                        <div className={styles.glassCard}>
                                            <div
                                                style={{
                                                    fontSize: "0.68rem",
                                                    color: "#94A3B8",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                GLOBAL HEADQUARTERS
                                            </div>
                                            <div
                                                style={{
                                                    color: "#E2E8F0",
                                                    fontSize: "0.82rem",
                                                    marginTop: "0.2rem",
                                                }}
                                            >
                                                <MapPin
                                                    size={12}
                                                    color="#D4AF37"
                                                    style={{
                                                        display: "inline",
                                                        marginRight: "4px",
                                                    }}
                                                />
                                                {selectedBrand.address}
                                            </div>
                                        </div>
                                    </div>

                                    {!isViewerReadOnly && (
                                        <div
                                            className={styles.glassCard}
                                            style={{
                                                border: "1px solid rgba(212,175,55,0.3)",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: "0.75rem",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#F5E6AD",
                                                        fontSize: "0.88rem",
                                                    }}
                                                >
                                                    Brand Editorial Cover Studio
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#94A3B8",
                                                    }}
                                                >
                                                    Upload a new cover image
                                                    (PNG/JPG/WEBP, max 5MB)
                                                    persisted across sessions.
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className={
                                                    styles.secondaryGoldBtn
                                                }
                                            >
                                                <Upload
                                                    size={13}
                                                    color="#D4AF37"
                                                />
                                                <span>Upload Cover Asset</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: FRAGRANCES */}
                            {activeDetailTab === "products" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.85rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            Showing{" "}
                                            <strong>
                                                {selectedBrand.products.length}{" "}
                                                {selectedBrand.products.length ===
                                                1
                                                    ? "Fragrance"
                                                    : "Fragrances"}
                                            </strong>{" "}
                                            associated fragrances synchronized
                                            with <code>/products</code>:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push("/products")
                                            }
                                            className={styles.secondaryGoldBtn}
                                        >
                                            <span>Open Catalog</span>
                                        </button>
                                    </div>

                                    {selectedBrand.products.map((prod) => (
                                        <div
                                            key={prod.slotNumber}
                                            className={styles.glassCard}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                    gap: "0.75rem",
                                                }}
                                            >
                                                <div
                                                    className={
                                                        styles.productImageCell
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.imagePlaceholder
                                                        }
                                                    >
                                                        <Image
                                                            src={prod.image}
                                                            alt={prod.name}
                                                            fill
                                                            sizes="48px"
                                                            style={{
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "0.5rem",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "0.68rem",
                                                                    fontWeight: 700,
                                                                    color: "#F5E6AD",
                                                                    fontFamily:
                                                                        "Space Grotesk, monospace",
                                                                    background:
                                                                        "rgba(212,175,55,0.16)",
                                                                    padding:
                                                                        "0.12rem 0.45rem",
                                                                    borderRadius:
                                                                        "6px",
                                                                }}
                                                            >
                                                                SLOT{" "}
                                                                {String(
                                                                    prod.slotNumber
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                )}
                                                            </span>
                                                            <strong
                                                                style={{
                                                                    color: "#FFF",
                                                                    fontSize:
                                                                        "0.92rem",
                                                                }}
                                                            >
                                                                {prod.name}
                                                            </strong>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.76rem",
                                                                color: "#94A3B8",
                                                                marginTop:
                                                                    "0.2rem",
                                                            }}
                                                        >
                                                            {prod.concentration}{" "}
                                                            • {prod.family} •{" "}
                                                            {prod.notes}
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: "1rem",
                                                                marginTop:
                                                                    "0.4rem",
                                                                fontSize:
                                                                    "0.78rem",
                                                                fontFamily:
                                                                    "Space Grotesk, monospace",
                                                            }}
                                                        >
                                                            <span>
                                                                Spray:{" "}
                                                                <strong
                                                                    style={{
                                                                        color: "#F5E6AD",
                                                                    }}
                                                                >
                                                                    {formatPrice(
                                                                        prod.sprayPrice
                                                                    )}
                                                                </strong>
                                                            </span>
                                                            <span>
                                                                Level:{" "}
                                                                <strong
                                                                    style={{
                                                                        color: "#34D399",
                                                                    }}
                                                                >
                                                                    {prod.remainingVolumeMl ??
                                                                        75}
                                                                    ml /{" "}
                                                                    {prod.bottleVolumeMl ??
                                                                        100}
                                                                    ml
                                                                </strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                    }}
                                                >
                                                    <span
                                                        className={
                                                            prod.status ===
                                                            "ACTIVE"
                                                                ? styles.badgeActive
                                                                : styles.badgeInactive
                                                        }
                                                    >
                                                        {prod.status}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            router.push(
                                                                `/machines/${encodeURIComponent(
                                                                    prod.kioskCode ||
                                                                    "demo-device"
                                                                )}`
                                                            )
                                                        }
                                                        className={
                                                            styles.secondaryGoldBtn
                                                        }
                                                    >
                                                        <span>
                                                            Station{" "}
                                                            {prod.kioskCode ||
                                                                "demo-device"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TAB 3: INSTALLED STATIONS */}
                            {activeDetailTab === "machines" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.85rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            Active IoT Kiosk chambers assigned
                                            to{" "}
                                            <strong
                                                style={{ color: "#F5E6AD" }}
                                            >
                                                {selectedBrand.name}
                                            </strong>{" "}
                                            — Real-time telemetry &amp; remote
                                            cartridge actuation:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                router.push("/machines")
                                            }
                                            className={styles.secondaryGoldBtn}
                                        >
                                            <span>Open Fleet</span>
                                        </button>
                                    </div>

                                    {selectedBrandLiveSlots.map((m, idx) => {
                                        const pct = Math.max(
                                            0,
                                            Math.round(
                                                (m.remainingMl / m.capacityMl) *
                                                100
                                            )
                                        );
                                        return (
                                            <div
                                                key={`${m.kioskCode}-${m.slotLabel}-${idx}`}
                                                className={styles.glassCard}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems:
                                                            "flex-start",
                                                        flexWrap: "wrap",
                                                        gap: "0.75rem",
                                                        marginBottom: "0.75rem",
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "0.55rem",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontWeight: 700,
                                                                    color: "#F5E6AD",
                                                                    fontFamily:
                                                                        "Space Grotesk, monospace",
                                                                    fontSize:
                                                                        "0.9rem",
                                                                }}
                                                            >
                                                                {m.kioskCode} •{" "}
                                                                {m.slotLabel}
                                                            </span>
                                                            <strong
                                                                style={{
                                                                    color: "#FFF",
                                                                    fontSize:
                                                                        "0.88rem",
                                                                }}
                                                            >
                                                                —{" "}
                                                                {
                                                                    m.fragranceName
                                                                }
                                                            </strong>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "0.76rem",
                                                                color: "#94A3B8",
                                                                marginTop:
                                                                    "0.18rem",
                                                            }}
                                                        >
                                                            {m.kioskName} (
                                                            {m.address})
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "0.4rem",
                                                        }}
                                                    >
                                                        <span
                                                            className={
                                                                m.status ===
                                                                "ONLINE"
                                                                    ? styles.badgeActive
                                                                    : m.status ===
                                                                    "MAINTENANCE"
                                                                        ? styles.badgeInactive
                                                                        : styles.badgeLocked
                                                            }
                                                        >
                                                            {m.status}
                                                        </span>
                                                        {!isViewerReadOnly && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleBrandChamberAction(
                                                                            selectedBrand,
                                                                            m,
                                                                            "SPRAY"
                                                                        )
                                                                    }
                                                                    className={
                                                                        styles.actionButton
                                                                    }
                                                                    style={{
                                                                        padding:
                                                                            "0.32rem 0.65rem",
                                                                        fontSize:
                                                                            "0.7rem",
                                                                        color: "#34D399",
                                                                        borderColor:
                                                                            "rgba(52,211,153,0.4)",
                                                                    }}
                                                                >
                                                                    <Zap
                                                                        size={
                                                                            11
                                                                        }
                                                                    />
                                                                    <span>
                                                                        Spray
                                                                        (-0.12ml)
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleBrandChamberAction(
                                                                            selectedBrand,
                                                                            m,
                                                                            "REFILL"
                                                                        )
                                                                    }
                                                                    className={
                                                                        styles.actionButton
                                                                    }
                                                                    style={{
                                                                        padding:
                                                                            "0.32rem 0.65rem",
                                                                        fontSize:
                                                                            "0.7rem",
                                                                        color: "#F5E6AD",
                                                                    }}
                                                                >
                                                                    <Droplets
                                                                        size={
                                                                            11
                                                                        }
                                                                    />
                                                                    <span>
                                                                        Refill
                                                                        100%
                                                                    </span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        background:
                                                            "rgba(255,255,255,0.03)",
                                                        padding:
                                                            "0.65rem 0.9rem",
                                                        borderRadius: "10px",
                                                        border: "1px solid rgba(255,255,255,0.05)",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            fontSize: "0.75rem",
                                                            color: "#CBD5E1",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                            marginBottom:
                                                                "0.35rem",
                                                        }}
                                                    >
                                                        <span>
                                                            Cartridge Volume:{" "}
                                                            <strong
                                                                style={{
                                                                    color:
                                                                        m.remainingMl <=
                                                                        15
                                                                            ? "#F87171"
                                                                            : "#34D399",
                                                                }}
                                                            >
                                                                {m.remainingMl}
                                                                ml /{" "}
                                                                {m.capacityMl}ml
                                                                ({pct}%)
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            <Thermometer
                                                                size={12}
                                                                color="#34D399"
                                                                style={{
                                                                    display:
                                                                        "inline",
                                                                    marginRight:
                                                                        "3px",
                                                                }}
                                                            />
                                                            Chamber Temp:{" "}
                                                            <strong>
                                                                {m.chamberTemp}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: "100%",
                                                            height: "6px",
                                                            background:
                                                                "rgba(255,255,255,0.08)",
                                                            borderRadius:
                                                                "999px",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: `${pct}%`,
                                                                height: "100%",
                                                                background:
                                                                    pct > 15
                                                                        ? "linear-gradient(90deg, #D4AF37, #34D399)"
                                                                        : "#F87171",
                                                                borderRadius:
                                                                    "999px",
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* TAB 4: TRANSACTIONS */}
                            {activeDetailTab === "transactions" && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            color: "#94A3B8",
                                        }}
                                    >
                                        Select any transaction below to inspect
                                        the Kiosk QR payment &amp; dispensing
                                        receipt:
                                    </div>

                                    {selectedBrandLiveTransactions.map(
                                        (txItem, idx) => (
                                            <div
                                                key={`${txItem.id}-${idx}`}
                                                className={styles.glassCard}
                                                style={{
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                }}
                                                onClick={() =>
                                                    setSelectedTxReceipt(txItem)
                                                }
                                            >
                                                <div>
                                                    <div
                                                        style={{
                                                            fontWeight: 700,
                                                            color: "#FFF",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                            fontSize: "0.86rem",
                                                        }}
                                                    >
                                                        {txItem.id}{" "}
                                                        <span
                                                            style={{
                                                                color: "#F5E6AD",
                                                            }}
                                                        >
                                                            ({txItem.kiosk} •{" "}
                                                            SLOT{" "}
                                                            {String(
                                                                txItem.slotNumber
                                                            ).padStart(2, "0")}
                                                            )
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "0.78rem",
                                                            color: "#94A3B8",
                                                            marginTop: "0.2rem",
                                                        }}
                                                    >
                                                        {txItem.productName} •{" "}
                                                        {txItem.time} •{" "}
                                                        {txItem.paymentMethod} •
                                                        Paid:{" "}
                                                        <strong
                                                            style={{
                                                                color: "#F5E6AD",
                                                                fontFamily:
                                                                    "Space Grotesk, monospace",
                                                            }}
                                                        >
                                                            {formatPrice(
                                                                txItem.amount
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>
                                                <span
                                                    className={
                                                        txItem.status ===
                                                        "FAILED"
                                                            ? styles.badgeLocked
                                                            : txItem.status ===
                                                            "REFUNDED"
                                                                ? styles.badgeInactive
                                                                : styles.badgeActive
                                                    }
                                                >
                                                    {txItem.status}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* TAB 5: PERFORMANCE ANALYTICS */}
                            {activeDetailTab === "analytics" &&
                                (() => {
                                    const unitSprayPrice =
                                        selectedBrand.products[0]?.sprayPrice ||
                                        15000;
                                    const bKey = selectedBrand.name.toLowerCase();
                                    const realPeriodTxs = (
                                        liveTxsByBrand[bKey] || []
                                    ).filter(
                                        (t) =>
                                            (t.status === "DISPENSED" ||
                                                t.status === "PAID") &&
                                            t.dateStr >= startDate &&
                                            t.dateStr <= endDate
                                    );
                                    const liveAddedSprays = realPeriodTxs.length;
                                    const historicalSprays = Math.max(
                                        10,
                                        selectedBrand.transactionsCount -
                                        liveAddedSprays
                                    );
                                    const scaledHistorical = Math.max(
                                        6,
                                        Math.round(
                                            historicalSprays * rangeMultiplier
                                        )
                                    );

                                    const histWeights = [
                                        0.12, 0.16, 0.15, 0.22, 0.24, 0.11,
                                    ];
                                    const timeSlots = [
                                        "10:00",
                                        "12:00",
                                        "15:00",
                                        "18:00",
                                        "20:00",
                                        "Live Now",
                                    ];

                                    const rawCounts = timeSlots.map((_, idx) => {
                                        const baseSlotCount = Math.max(
                                            1,
                                            Math.round(
                                                scaledHistorical *
                                                histWeights[idx]
                                            )
                                        );
                                        return idx === 5
                                            ? baseSlotCount + liveAddedSprays
                                            : baseSlotCount;
                                    });

                                    const maxSlotSprays = Math.max(
                                        1,
                                        ...rawCounts
                                    );
                                    const minSlotSprays = Math.min(
                                        ...rawCounts
                                    );
                                    const spraySpan = Math.max(
                                        1,
                                        maxSlotSprays - minSlotSprays
                                    );

                                    const chartData = timeSlots.map(
                                        (slot, idx) => {
                                            const currentSprays = rawCounts[idx];
                                            const slotRevenue =
                                                currentSprays * unitSprayPrice;
                                            const dynamicPct = Math.round(
                                                32 +
                                                ((currentSprays -
                                                        minSlotSprays) /
                                                    spraySpan) *
                                                62
                                            );

                                            return {
                                                label: slot,
                                                sprays: currentSprays,
                                                revenue: slotRevenue,
                                                pct: Math.max(
                                                    28,
                                                    Math.min(96, dynamicPct)
                                                ),
                                            };
                                        }
                                    );

                                    const totalChartSprays = chartData.reduce(
                                        (acc, item) => acc + item.sprays,
                                        0
                                    );
                                    const totalChartRevenue = chartData.reduce(
                                        (acc, item) => acc + item.revenue,
                                        0
                                    );
                                    const activeSlotData =
                                        chartData[hoveredBarIndex] ||
                                        chartData[5];
                                    const primarySlot =
                                        selectedBrandLiveSlots[0];

                                    return (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "0.95rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: "0.8rem",
                                                        color: "#94A3B8",
                                                    }}
                                                >
                                                    Multi-tenant performance
                                                    metrics for{" "}
                                                    <strong
                                                        style={{
                                                            color: "#F5E6AD",
                                                        }}
                                                    >
                                                        {selectedBrand.name}
                                                    </strong>
                                                    :
                                                </span>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                    }}
                                                >
                                                    {!isViewerReadOnly &&
                                                        primarySlot && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setHoveredBarIndex(
                                                                        5
                                                                    );
                                                                    handleBrandChamberAction(
                                                                        selectedBrand,
                                                                        primarySlot,
                                                                        "SPRAY"
                                                                    );
                                                                }}
                                                                className={
                                                                    styles.actionButton
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "0.35rem 0.7rem",
                                                                    fontSize:
                                                                        "0.72rem",
                                                                    color: "#34D399",
                                                                    borderColor:
                                                                        "rgba(52,211,153,0.45)",
                                                                }}
                                                            >
                                                                <Zap
                                                                    size={12}
                                                                />
                                                                <span>
                                                                    +1 Live
                                                                    Spray
                                                                    (-0.12ml)
                                                                </span>
                                                            </button>
                                                        )}

                                                    <div
                                                        className={
                                                            styles.quickRangePillsGroup
                                                        }
                                                    >
                                                        {(
                                                            [
                                                                "7D",
                                                                "30D",
                                                                "YTD",
                                                            ] as const
                                                        ).map((r) => (
                                                            <button
                                                                key={r}
                                                                type="button"
                                                                onClick={() =>
                                                                    setAnalyticsRange(
                                                                        r
                                                                    )
                                                                }
                                                                className={`${
                                                                    styles.quickRangePill
                                                                } ${
                                                                    analyticsRange ===
                                                                    r
                                                                        ? styles.quickRangePillActive
                                                                        : ""
                                                                }`}
                                                            >
                                                                {r === "7D"
                                                                    ? "7 Days"
                                                                    : r ===
                                                                    "30D"
                                                                        ? "30 Days"
                                                                        : "Year to Date"}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "1fr 1fr",
                                                    gap: "0.85rem",
                                                }}
                                            >
                                                <div
                                                    className={styles.glassCard}
                                                    style={{
                                                        border: "1px solid rgba(212,175,55,0.35)",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: "0.68rem",
                                                            color: "#94A3B8",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        RECOGNIZED SPRAY REVENUE
                                                        ({analyticsRange})
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "1.4rem",
                                                            fontWeight: 700,
                                                            color: "#F5E6AD",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                            marginTop: "0.25rem",
                                                        }}
                                                    >
                                                        {formatPrice(
                                                            totalChartRevenue
                                                        )}
                                                    </div>
                                                </div>

                                                <div
                                                    className={styles.glassCard}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: "0.68rem",
                                                            color: "#94A3B8",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        VERIFIED DISPENSED
                                                        SPRAYS ({analyticsRange}
                                                        )
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "1.4rem",
                                                            fontWeight: 700,
                                                            color: "#34D399",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                            marginTop: "0.25rem",
                                                        }}
                                                    >
                                                        {totalChartSprays.toLocaleString()}{" "}
                                                        Sprays
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.glassCard}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                        fontSize: "0.75rem",
                                                        color: "#F5E6AD",
                                                        fontFamily:
                                                            "Space Grotesk, monospace",
                                                        marginBottom: "0.65rem",
                                                    }}
                                                >
                                                    <span>
                                                        ● Selected Window [
                                                        {activeSlotData.label}]:{" "}
                                                        <strong>
                                                            {
                                                                activeSlotData.sprays
                                                            }{" "}
                                                            sprays (
                                                            {formatPrice(
                                                                activeSlotData.revenue
                                                            )}
                                                            )
                                                        </strong>
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: "#34D399",
                                                            fontSize: "0.7rem",
                                                        }}
                                                    >
                                                        Live Today: +
                                                        {liveAddedSprays}{" "}
                                                        sprays
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        height: "150px",
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "repeat(6, 1fr)",
                                                        gap: "0.75rem",
                                                        alignItems: "end",
                                                        paddingTop: "1.35rem",
                                                        borderBottom:
                                                            "1px solid rgba(255,255,255,0.08)",
                                                    }}
                                                >
                                                    {chartData.map(
                                                        (bar, idx) => {
                                                            const isSelected =
                                                                hoveredBarIndex ===
                                                                idx;
                                                            const isLiveCol =
                                                                idx === 5;
                                                            return (
                                                                <div
                                                                    key={
                                                                        bar.label
                                                                    }
                                                                    onMouseEnter={() =>
                                                                        setHoveredBarIndex(
                                                                            idx
                                                                        )
                                                                    }
                                                                    onClick={() =>
                                                                        setHoveredBarIndex(
                                                                            idx
                                                                        )
                                                                    }
                                                                    style={{
                                                                        height: "100%",
                                                                        display:
                                                                            "flex",
                                                                        flexDirection:
                                                                            "column",
                                                                        justifyContent:
                                                                            "flex-end",
                                                                        alignItems:
                                                                            "center",
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            fontSize:
                                                                                "0.7rem",
                                                                            color: isLiveCol
                                                                                ? "#34D399"
                                                                                : "#F5E6AD",
                                                                            fontFamily:
                                                                                "Space Grotesk, monospace",
                                                                            fontWeight: 700,
                                                                            marginBottom:
                                                                                "4px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            bar.sprays
                                                                        }{" "}
                                                                        sp
                                                                    </span>
                                                                    <div
                                                                        style={{
                                                                            width: "100%",
                                                                            height: `${bar.pct}%`,
                                                                            background:
                                                                                isLiveCol
                                                                                    ? "linear-gradient(180deg, #34D399 0%, #D4AF37 65%, rgba(212,175,55,0.25) 100%)"
                                                                                    : isSelected
                                                                                        ? "linear-gradient(180deg, #FFFFFF 0%, #D4AF37 60%, rgba(212,175,55,0.25) 100%)"
                                                                                        : "linear-gradient(180deg, #F5E6AD 0%, #D4AF37 50%, rgba(212,175,55,0.2) 100%)",
                                                                            borderRadius:
                                                                                "8px 8px 2px 2px",
                                                                            borderTop:
                                                                                isLiveCol
                                                                                    ? "2px solid #6EE7B7"
                                                                                    : "1px solid #FDE68A",
                                                                            boxShadow:
                                                                                isSelected
                                                                                    ? "0 0 16px rgba(212,175,55,0.4)"
                                                                                    : "none",
                                                                            transition:
                                                                                "height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                                                        }}
                                                                    />
                                                                    <span
                                                                        style={{
                                                                            fontSize:
                                                                                "0.68rem",
                                                                            color: isLiveCol
                                                                                ? "#34D399"
                                                                                : isSelected
                                                                                    ? "#F5E6AD"
                                                                                    : "#94A3B8",
                                                                            fontWeight:
                                                                                isLiveCol ||
                                                                                isSelected
                                                                                    ? 700
                                                                                    : 500,
                                                                            fontFamily:
                                                                                "Space Grotesk, monospace",
                                                                            marginTop:
                                                                                "6px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            bar.label
                                                                        }
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                        </div>

                        <div className={styles.drawerFooter}>
                            <div className={styles.footerMetricBox}>
                                <span
                                    style={{
                                        fontSize: "0.66rem",
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Catalog SKUs
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.88rem",
                                        color: "#FFF",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedBrand.products.length}{" "}
                                    {selectedBrand.products.length === 1
                                        ? "Fragrance"
                                        : "Fragrances"}
                                </strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span
                                    style={{
                                        fontSize: "0.66rem",
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Price / Spray
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.88rem",
                                        color: "#F5E6AD",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {formatPrice(
                                        selectedBrand.products[0]?.sprayPrice ||
                                        15000
                                    )}
                                </strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span
                                    style={{
                                        fontSize: "0.66rem",
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    10ml Decant
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.88rem",
                                        color: "#34D399",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {formatRetailReference(
                                        selectedBrand.products[0]
                                            ?.retailPrice10ml,
                                        selectedBrand.products[0]?.sprayPrice
                                    )}
                                </strong>
                            </div>
                            <div className={styles.footerMetricBox}>
                                <span
                                    style={{
                                        fontSize: "0.66rem",
                                        color: "#94A3B8",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Full Bottle
                                </span>
                                <strong
                                    style={{
                                        fontSize: "0.88rem",
                                        color: "#FFF",
                                        marginTop: "0.15rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {formatPrice(
                                        selectedBrand.products[0]
                                            ?.fullBottlePrice || 3800000
                                    )}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KIOSK DIGITAL RECEIPT MODAL */}
            {selectedTxReceipt && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedTxReceipt(null)}
                >
                    <div
                        className={styles.modalContent}
                        style={{ maxWidth: "28rem" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1rem",
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.08)",
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
                                    KIOSK DIGITAL RECEIPT
                                </span>
                                <h3
                                    style={{
                                        margin: "0.2rem 0 0 0",
                                        color: "#FFF",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTxReceipt.id}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedTxReceipt(null)}
                                className={styles.secondaryGoldBtn}
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
                                color: "#CBD5E1",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Station Code:</span>
                                <strong
                                    style={{
                                        color: "#FFF",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {selectedTxReceipt.kiosk}
                                </strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Dispensed Fragrance:</span>
                                <strong style={{ color: "#FFF" }}>
                                    {selectedTxReceipt.productName}
                                </strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Chamber Slot:</span>
                                <strong
                                    style={{
                                        color: "#F5E6AD",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    SLOT{" "}
                                    {String(
                                        selectedTxReceipt.slotNumber
                                    ).padStart(2, "0")}
                                </strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Payment Gateway:</span>
                                <strong>
                                    {selectedTxReceipt.paymentMethod}
                                </strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>Timestamp:</span>
                                <strong>{selectedTxReceipt.time}</strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    paddingTop: "0.75rem",
                                    borderTop:
                                        "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <span>Recognized Amount:</span>
                                <strong
                                    style={{
                                        color: "#F5E6AD",
                                        fontSize: "1rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {formatPrice(selectedTxReceipt.amount)}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD / EDIT PARTNER BRAND MODAL */}
            {isModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => {
                        setOpenDropdown(null);
                        setIsModalOpen(false);
                    }}
                >
                    <div
                        className={styles.modalContent}
                        style={{ overflow: "visible" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1.15rem",
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.08)",
                                paddingBottom: "0.85rem",
                            }}
                        >
                            <h2 className={styles.modalTitle} style={{ margin: 0 }}>
                                {editingBrand
                                    ? `Edit Partner Maison: ${editingBrand.name}`
                                    : "Onboard New Partner Maison"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {formError && (
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    padding: "0.75rem 1rem",
                                    borderRadius: "10px",
                                    background: "rgba(248,113,113,0.15)",
                                    border: "1px solid rgba(248,113,113,0.4)",
                                    color: "#F87171",
                                    fontSize: "0.82rem",
                                }}
                            >
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSaveBrand}>
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
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        MAISON NAME *
                                    </label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) =>
                                            setFormName(e.target.value)
                                        }
                                        required
                                        placeholder="e.g. Guerlain"
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        PARTNER CODE *
                                    </label>
                                    <input
                                        type="text"
                                        value={formCode}
                                        onChange={(e) =>
                                            setFormCode(e.target.value)
                                        }
                                        required
                                        placeholder="e.g. GUERLAIN"
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        CONCIERGE EMAIL *
                                    </label>
                                    <input
                                        type="email"
                                        value={formEmail}
                                        onChange={(e) =>
                                            setFormEmail(e.target.value)
                                        }
                                        required
                                        placeholder="concierge@guerlain.local"
                                        className={styles.searchInput}
                                        style={{ padding: "0.65rem 0.9rem" }}
                                    />
                                </div>

                                <div className={styles.customDropdownWrap}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        OPERATING STATUS
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === "MODAL_STATUS"
                                                    ? null
                                                    : "MODAL_STATUS"
                                            )
                                        }
                                        className={styles.customDropdownTrigger}
                                        style={{
                                            width: "100%",
                                            padding: "0.65rem 0.9rem",
                                        }}
                                    >
                                        <span>{formStatus}</span>
                                        <ChevronDown
                                            size={13}
                                            color="#D4AF37"
                                        />
                                    </button>
                                    {openDropdown === "MODAL_STATUS" && (
                                        <div
                                            className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                            style={{ width: "100%" }}
                                        >
                                            {(
                                                [
                                                    "ACTIVE",
                                                    "INACTIVE",
                                                    "SUSPENDED",
                                                ] as const
                                            ).map((st) => (
                                                <button
                                                    key={st}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormStatus(st);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className={`${
                                                        styles.customDropdownItem
                                                    } ${
                                                        formStatus === st
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>{st}</span>
                                                    {formStatus === st && (
                                                        <Check
                                                            size={13}
                                                            color="#D4AF37"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                style={{ marginBottom: "1rem" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        marginBottom: "0.35rem",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    SELECT EDITORIAL COVER ASSET
                                </label>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.85rem",
                                    }}
                                >
                                    <div className={styles.imagePlaceholder}>
                                        <Image
                                            src={formImage}
                                            alt="Preview"
                                            fill
                                            sizes="48px"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div
                                        className={styles.customDropdownWrap}
                                        style={{ flex: 1 }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenDropdown(
                                                    openDropdown ===
                                                    "MODAL_IMAGE"
                                                        ? null
                                                        : "MODAL_IMAGE"
                                                )
                                            }
                                            className={
                                                styles.customDropdownTrigger
                                            }
                                            style={{
                                                width: "100%",
                                                padding: "0.65rem 0.9rem",
                                            }}
                                        >
                                            <span>{formImage}</span>
                                            <ChevronDown
                                                size={13}
                                                color="#D4AF37"
                                            />
                                        </button>
                                        {openDropdown === "MODAL_IMAGE" && (
                                            <div
                                                className={
                                                    styles.customDropdownMenu
                                                }
                                                style={{
                                                    width: "100%",
                                                    maxHeight: "200px",
                                                }}
                                            >
                                                {INITIAL_21_BRANDS.flatMap(
                                                    (b) => b.products
                                                ).map((p) => (
                                                    <button
                                                        key={p.slotNumber}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormImage(
                                                                p.image
                                                            );
                                                            setOpenDropdown(
                                                                null
                                                            );
                                                        }}
                                                        className={`${
                                                            styles.customDropdownItem
                                                        } ${
                                                            formImage ===
                                                            p.image
                                                                ? styles.customDropdownItemActive
                                                                : ""
                                                        }`}
                                                    >
                                                        <span>
                                                            {p.name} ({p.image})
                                                        </span>
                                                        {formImage ===
                                                            p.image && (
                                                                <Check
                                                                    size={13}
                                                                    color="#D4AF37"
                                                                />
                                                            )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        marginBottom: "0.35rem",
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    MAISON HERITAGE DESCRIPTION
                                </label>
                                <textarea
                                    rows={2}
                                    value={formDesc}
                                    onChange={(e) =>
                                        setFormDesc(e.target.value)
                                    }
                                    placeholder="Enter brand heritage and olfactory identity..."
                                    className={styles.searchInput}
                                    style={{
                                        padding: "0.65rem 0.9rem",
                                        resize: "none",
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "0.75rem",
                                    marginTop: "1.25rem",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Cancel</span>
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryGoldBtn}
                                >
                                    <span>
                                        {editingBrand
                                            ? "Save Changes"
                                            : "Onboard Maison"}
                                    </span>
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