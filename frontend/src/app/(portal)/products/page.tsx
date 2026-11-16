// noinspection SpellCheckingInspection
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    Search,
    Plus,
    RefreshCw,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Edit3,
    X,
    Sparkles,
    Cpu,
    Droplets,
    BarChart3,
    Smartphone,
    LayoutGrid,
    List as ListIcon,
    Upload,
    Zap,
    Warehouse,
    Trash2,
    Globe,
    SlidersHorizontal,
    Check,
    ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./products.module.css";

interface AssignedMachineSlot {
    kioskCode: string;
    location: string;
    slotNumber: number;
    physicalSlotLabel: string;
    machineStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE";
    bottleCode: string;
    remainingVolumeMl: number;
    thresholdPct: number;
    lastRefilled: string;
}

interface PerfumeProductItem {
    id: string;
    skuCode: string;
    slotNumber: number;
    name: string;
    brand: string;
    category: "Men" | "Women" | "Unisex" | "Niche";
    concentration: "Eau de Parfum" | "Eau de Toilette" | "Parfum Cologne";
    family: string;
    notes: string;
    description: string;
    bottleVolumeMl: number;
    pricePerSpray: number;
    retail10ml: number;
    fullBottlePrice: number;
    rating: number;
    baseSessions30d: number;
    liveExtraSprays: number;
    samplingSessions30d: number;
    status: "ACTIVE" | "INACTIVE" | "DRAFT";
    image: string;
    warehouseHub: "WH-SGN-CENTRAL" | "WH-HN-NORTH" | "WH-DAD-CENTRAL";
    warehouseReserveBottles: number;
    batchNumber: string;
    assignedMachines: AssignedMachineSlot[];
}

const FLEET_KIOSK_OPTIONS = [
    { code: "demo-device", location: "Diamond Plaza Luxury Atrium, HCMC", status: "ONLINE" as const },
    { code: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya Flagship, HCMC", status: "ONLINE" as const },
    { code: "KIOSK-SGN-02", location: "Vincom Center Dong Khoi, HCMC", status: "ONLINE" as const },
    { code: "KIOSK-SGN-03", location: "Crescent Mall Luxury Wing, HCMC", status: "ONLINE" as const },
    { code: "KIOSK-HN-01", location: "Lotte Center West Lake Lounge, Hanoi", status: "ONLINE" as const },
    { code: "KIOSK-HN-02", location: "Trang Tien Plaza Luxury Wing, Hanoi", status: "MAINTENANCE" as const },
    { code: "KIOSK-DAD-01", location: "IndoChina Riverside Mall Lobby, Da Nang", status: "ONLINE" as const },
    { code: "KIOSK-004", location: "Aeon Mall Tan Phu Celadon, HCMC", status: "OFFLINE" as const },
];

const INITIAL_34_PRODUCTS: PerfumeProductItem[] = [
    {
        id: "PROD-01", skuCode: "SKU-ARM-01", slotNumber: 1, name: "Acqua Di Gio", brand: "Giorgio Armani", category: "Men", concentration: "Eau de Toilette",
        family: "Aquatic Aromatic", notes: "Bergamot, Sea Notes, Jasmine, Cedar",
        description: "A classic aquatic fragrance capturing the spirit of the Mediterranean sea and sun.",
        bottleVolumeMl: 100, pricePerSpray: 12000, retail10ml: 360000, fullBottlePrice: 3200000, rating: 4.8, baseSessions30d: 420, liveExtraSprays: 0, samplingSessions30d: 420, status: "ACTIVE", image: "/images/acqua-di-gio.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 4, batchNumber: "BATCH-2026-A01",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya Flagship, HCMC", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0101", remainingVolumeMl: 78.0, thresholdPct: 15, lastRefilled: "2026-10-25" }]
    },
    {
        id: "PROD-02", skuCode: "SKU-ARM-02", slotNumber: 2, name: "Acqua Di Gio Profondo", brand: "Giorgio Armani", category: "Men", concentration: "Eau de Parfum",
        family: "Aquatic Mineral", notes: "Marine Notes, Rosemary, Patchouli, Amber",
        description: "An intense marine interpretation of Acqua Di Gio, deep and mysterious.",
        bottleVolumeMl: 100, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3650000, rating: 4.9, baseSessions30d: 390, liveExtraSprays: 0, samplingSessions30d: 390, status: "ACTIVE", image: "/images/acqua-di-gio-profondo.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-A02",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya Flagship, HCMC", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0102", remainingVolumeMl: 64.0, thresholdPct: 15, lastRefilled: "2026-10-26" }]
    },
    {
        id: "PROD-03", skuCode: "SKU-CHA-03", slotNumber: 3, name: "Bleu de Chanel", brand: "Chanel", category: "Men", concentration: "Eau de Parfum",
        family: "Woody Aromatic", notes: "Lemon, Mint, Pink Pepper, New Caledonian Sandalwood",
        description: "An aromatic-woody fragrance with a captivating trail of timeless Parisian elegance.",
        bottleVolumeMl: 100, pricePerSpray: 15000, retail10ml: 450000, fullBottlePrice: 4250000, rating: 5.0, baseSessions30d: 685, liveExtraSprays: 0, samplingSessions30d: 685, status: "ACTIVE", image: "/images/bleu-de-chanel.png",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 5, batchNumber: "BATCH-2026-C01",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya Flagship, HCMC", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0103", remainingVolumeMl: 12.5, thresholdPct: 15, lastRefilled: "2026-10-12" }]
    },
    {
        id: "PROD-04", skuCode: "SKU-CHA-04", slotNumber: 4, name: "Coco Mademoiselle", brand: "Chanel", category: "Women", concentration: "Eau de Parfum",
        family: "Oriental Floral", notes: "Orange, Patchouli, Turkish Rose, White Musk",
        description: "An irresistible oriental fragrance of spirited and independent feminine character.",
        bottleVolumeMl: 100, pricePerSpray: 15500, retail10ml: 465000, fullBottlePrice: 4400000, rating: 4.9, baseSessions30d: 540, liveExtraSprays: 0, samplingSessions30d: 540, status: "ACTIVE", image: "/images/coco-mademoiselle.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 4, batchNumber: "BATCH-2026-C02",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-02", location: "Vincom Center Dong Khoi, HCMC", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0104", remainingVolumeMl: 82.0, thresholdPct: 15, lastRefilled: "2026-10-28" }]
    },
    {
        id: "PROD-05", skuCode: "SKU-BUR-05", slotNumber: 5, name: "Burberry Goddess", brand: "Burberry", category: "Women", concentration: "Eau de Parfum",
        family: "Aromatic Vanilla", notes: "Vanilla Infusion, Lavender, Vanilla Caviar, Cocoa",
        description: "A gourmand aromatic scent centered around a powerful trio of distinct vanillas.",
        bottleVolumeMl: 100, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3500000, rating: 4.7, baseSessions30d: 310, liveExtraSprays: 0, samplingSessions30d: 310, status: "ACTIVE", image: "/images/burberry-goddess.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-B01",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-02", location: "Vincom Center Dong Khoi, HCMC", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0105", remainingVolumeMl: 71.0, thresholdPct: 15, lastRefilled: "2026-10-29" }]
    },
    {
        id: "PROD-06", skuCode: "SKU-BUR-06", slotNumber: 6, name: "Burberry Her", brand: "Burberry", category: "Women", concentration: "Eau de Parfum",
        family: "Floral Fruity", notes: "Red & Dark Berries, Jasmine, Musk, Amber",
        description: "A vibrant and adventurous fruity floral signature created by master perfumer Francis Kurkdjian.",
        bottleVolumeMl: 100, pricePerSpray: 12500, retail10ml: 375000, fullBottlePrice: 3350000, rating: 4.6, baseSessions30d: 285, liveExtraSprays: 0, samplingSessions30d: 285, status: "ACTIVE", image: "/images/burberry-her.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-B02",
        assignedMachines: [{ kioskCode: "KIOSK-HN-01", location: "Lotte Center West Lake Lounge, Hanoi", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0106", remainingVolumeMl: 55.0, thresholdPct: 15, lastRefilled: "2026-10-21" }]
    },
    {
        id: "PROD-07", skuCode: "SKU-CH-07", slotNumber: 7, name: "Carolina Herrera Good Girl", brand: "Carolina Herrera", category: "Women", concentration: "Eau de Parfum",
        family: "Oriental Floral", notes: "Almond, Coffee, Tuberose, Jasmine Sambac, Tonka Bean",
        description: "A sensual, evocative fragrance born from the bold dualities of modern femininity.",
        bottleVolumeMl: 80, pricePerSpray: 13500, retail10ml: 405000, fullBottlePrice: 3450000, rating: 4.8, baseSessions30d: 360, liveExtraSprays: 0, samplingSessions30d: 360, status: "ACTIVE", image: "/images/carolina-herrera-good-girl.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-H01",
        assignedMachines: [{ kioskCode: "KIOSK-HN-01", location: "Lotte Center West Lake Lounge, Hanoi", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0107", remainingVolumeMl: 54.0, thresholdPct: 15, lastRefilled: "2026-10-22" }]
    },
    {
        id: "PROD-08", skuCode: "SKU-ARMF-08", slotNumber: 8, name: "Club de Nuit Intense Man", brand: "Armaf", category: "Men", concentration: "Eau de Toilette",
        family: "Woody Spicy", notes: "Lemon, Pineapple, Blackcurrant, Birch, Ambroxan",
        description: "A bold and commanding woody spicy signature scent with exceptional projection.",
        bottleVolumeMl: 105, pricePerSpray: 10000, retail10ml: 300000, fullBottlePrice: 1650000, rating: 4.7, baseSessions30d: 450, liveExtraSprays: 0, samplingSessions30d: 450, status: "ACTIVE", image: "/images/club-de-nuit-intense.jpg",
        warehouseHub: "WH-DAD-CENTRAL", warehouseReserveBottles: 4, batchNumber: "BATCH-2026-AF1",
        assignedMachines: [{ kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside Mall Lobby, Da Nang", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0108", remainingVolumeMl: 92.0, thresholdPct: 15, lastRefilled: "2026-11-01" }]
    },
    {
        id: "PROD-09", skuCode: "SKU-CRD-09", slotNumber: 9, name: "Creed Aventus", brand: "Creed", category: "Niche", concentration: "Eau de Parfum",
        family: "Chypre Fruity", notes: "Pineapple, Birch, Musk, Oakmoss, Blackcurrant",
        description: "The legendary niche scent celebrating strength, vision, power, and royal heritage.",
        bottleVolumeMl: 100, pricePerSpray: 20000, retail10ml: 600000, fullBottlePrice: 7800000, rating: 5.0, baseSessions30d: 640, liveExtraSprays: 0, samplingSessions30d: 640, status: "ACTIVE", image: "/images/creed-aventus.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-CR1",
        assignedMachines: [{ kioskCode: "demo-device", location: "Diamond Plaza Luxury Atrium, HCMC", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0109", remainingVolumeMl: 11.5, thresholdPct: 15, lastRefilled: "2026-10-15" }]
    },
    {
        id: "PROD-10", skuCode: "SKU-DIO-10", slotNumber: 10, name: "Dior Sauvage", brand: "Dior", category: "Men", concentration: "Eau de Parfum",
        family: "Aromatic Fougere", notes: "Calabrian Bergamot, Sichuan Pepper, Ambroxan, Vanilla",
        description: "Radically fresh, raw and noble all at once, inspired by wide-open desert spaces.",
        bottleVolumeMl: 100, pricePerSpray: 14500, retail10ml: 435000, fullBottlePrice: 3950000, rating: 4.9, baseSessions30d: 670, liveExtraSprays: 0, samplingSessions30d: 670, status: "ACTIVE", image: "/images/dior-sauvage.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 5, batchNumber: "BATCH-2026-D01",
        assignedMachines: [{ kioskCode: "KIOSK-HN-01", location: "Lotte Center West Lake Lounge, Hanoi", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0110", remainingVolumeMl: 84.0, thresholdPct: 15, lastRefilled: "2026-11-03" }]
    },
    {
        id: "PROD-11", skuCode: "SKU-DIO-11", slotNumber: 11, name: "Miss Dior Blooming Bouquet", brand: "Dior", category: "Women", concentration: "Eau de Toilette",
        family: "Floral", notes: "Sweet Pea, Damask Rose, Peony, White Musk",
        description: "An instant crush, a tender and sparkling floral composition dressed in couture bow.",
        bottleVolumeMl: 100, pricePerSpray: 13500, retail10ml: 405000, fullBottlePrice: 3600000, rating: 4.8, baseSessions30d: 395, liveExtraSprays: 0, samplingSessions30d: 395, status: "ACTIVE", image: "/images/miss-dior-blooming-bouquet.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-D02",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya Flagship, HCMC", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0111", remainingVolumeMl: 76.0, thresholdPct: 15, lastRefilled: "2026-10-29" }]
    },
    {
        id: "PROD-12", skuCode: "SKU-JPG-12", slotNumber: 12, name: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", category: "Men", concentration: "Eau de Toilette",
        family: "Oriental Fougere", notes: "Lavender, Mint, Cardamom, Vanilla, Tonka Bean",
        description: "An avant-garde masculine classic paying tribute to the iconic sailor torso bottle.",
        bottleVolumeMl: 125, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3300000, rating: 4.8, baseSessions30d: 340, liveExtraSprays: 0, samplingSessions30d: 340, status: "ACTIVE", image: "/images/jean-paul-gaultier-le-male.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-J01",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-02", location: "Vincom Center Dong Khoi, HCMC", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0112", remainingVolumeMl: 77.0, thresholdPct: 15, lastRefilled: "2026-10-25" }]
    },
    {
        id: "PROD-13", skuCode: "SKU-JPG-13", slotNumber: 13, name: "Jean Paul Gaultier Scandal", brand: "Jean Paul Gaultier", category: "Women", concentration: "Eau de Parfum",
        family: "Chypre Floral", notes: "Blood Orange, Honey, Gardenia, Patchouli",
        description: "An addictive honey chypre floral breaking all conventional Parisian clichés.",
        bottleVolumeMl: 80, pricePerSpray: 13500, retail10ml: 405000, fullBottlePrice: 3450000, rating: 4.8, baseSessions30d: 325, liveExtraSprays: 0, samplingSessions30d: 325, status: "ACTIVE", image: "/images/jean-paul-gaultier-scandal.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-J02",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-02", location: "Vincom Center Dong Khoi, HCMC", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0113", remainingVolumeMl: 47.0, thresholdPct: 15, lastRefilled: "2026-10-20" }]
    },
    {
        id: "PROD-14", skuCode: "SKU-LLB-14", slotNumber: 14, name: "Le Labo Another 13", brand: "Le Labo", category: "Niche", concentration: "Eau de Parfum",
        family: "Woody Oriental", notes: "Ambroxan, Pear, Jasmine Petals, Moss, Ambrette",
        description: "A hypnotic and addictive skin scent born in Grasse and hand-blended in New York.",
        bottleVolumeMl: 100, pricePerSpray: 18000, retail10ml: 540000, fullBottlePrice: 6500000, rating: 4.9, baseSessions30d: 580, liveExtraSprays: 0, samplingSessions30d: 580, status: "ACTIVE", image: "/images/le-labo-another-13.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 4, batchNumber: "BATCH-2026-L01",
        assignedMachines: [{ kioskCode: "demo-device", location: "Diamond Plaza Luxury Atrium, HCMC", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0114", remainingVolumeMl: 13.5, thresholdPct: 15, lastRefilled: "2026-10-14" }]
    },
    {
        id: "PROD-15", skuCode: "SKU-LLB-15", slotNumber: 15, name: "Le Labo Santal 33", brand: "Le Labo", category: "Niche", concentration: "Eau de Parfum",
        family: "Woody Aromatic", notes: "Australian Sandalwood, Virginia Cedar, Cardamom, Violet, Leather",
        description: "An iconic unisex woody composition evoking the vast American West and warm smoky fire.",
        bottleVolumeMl: 100, pricePerSpray: 18500, retail10ml: 555000, fullBottlePrice: 6600000, rating: 4.9, baseSessions30d: 595, liveExtraSprays: 0, samplingSessions30d: 595, status: "ACTIVE", image: "/images/le-labo-another-13.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 4, batchNumber: "BATCH-2026-L02",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya Flagship, HCMC", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0115", remainingVolumeMl: 73.0, thresholdPct: 15, lastRefilled: "2026-10-30" }]
    },
    {
        id: "PROD-16", skuCode: "SKU-MMG-16", slotNumber: 16, name: "Replica By the Fireplace", brand: "Maison Margiela", category: "Unisex", concentration: "Eau de Toilette",
        family: "Woody Amber", notes: "Cloves, Pink Pepper, Chestnut, Guaiac Wood, Vanilla",
        description: "Recreates the cozy warmth of a crackling fireplace on a frosty winter morning in Chamonix.",
        bottleVolumeMl: 100, pricePerSpray: 14500, retail10ml: 435000, fullBottlePrice: 3650000, rating: 4.8, baseSessions30d: 350, liveExtraSprays: 0, samplingSessions30d: 350, status: "ACTIVE", image: "/images/maison-margiela-by-the-fireplace.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-M01",
        assignedMachines: [{ kioskCode: "KIOSK-HN-02", location: "Trang Tien Plaza Luxury Wing, Hanoi", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "MAINTENANCE", bottleCode: "BTL-2026-0116", remainingVolumeMl: 80.0, thresholdPct: 15, lastRefilled: "2026-10-28" }]
    },
    {
        id: "PROD-17", skuCode: "SKU-MMG-17", slotNumber: 17, name: "Replica Jazz Club", brand: "Maison Margiela", category: "Men", concentration: "Eau de Toilette",
        family: "Leather Woody", notes: "Pink Pepper, Rum Absolute, Tobacco Leaf, Vanilla Bean",
        description: "Evokes the intimate atmosphere of a Brooklyn jazz club with leather armchairs and aged rum.",
        bottleVolumeMl: 100, pricePerSpray: 14500, retail10ml: 435000, fullBottlePrice: 3650000, rating: 4.8, baseSessions30d: 330, liveExtraSprays: 0, samplingSessions30d: 330, status: "ACTIVE", image: "/images/maison-margiela-by-the-fireplace.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-M02",
        assignedMachines: [{ kioskCode: "KIOSK-HN-02", location: "Trang Tien Plaza Luxury Wing, Hanoi", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "MAINTENANCE", bottleCode: "BTL-2026-0117", remainingVolumeMl: 67.0, thresholdPct: 15, lastRefilled: "2026-10-27" }]
    },
    {
        id: "PROD-18", skuCode: "SKU-MCM-18", slotNumber: 18, name: "MCM Eau de Parfum", brand: "MCM Worldwide", category: "Unisex", concentration: "Eau de Parfum",
        family: "Floral Woody", notes: "Raspberry, Apricot, White Peony, Jasmine, Ambrox",
        description: "A vibrant floral woody fragrance echoing MCM's Munich travel heritage.",
        bottleVolumeMl: 75, pricePerSpray: 12000, retail10ml: 360000, fullBottlePrice: 2650000, rating: 4.6, baseSessions30d: 230, liveExtraSprays: 0, samplingSessions30d: 230, status: "ACTIVE", image: "/images/mcm-edp.jpg",
        warehouseHub: "WH-DAD-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-MC1",
        assignedMachines: [{ kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside Mall Lobby, Da Nang", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0118", remainingVolumeMl: 66.0, thresholdPct: 15, lastRefilled: "2026-10-24" }]
    },
    {
        id: "PROD-19", skuCode: "SKU-MFK-19", slotNumber: 19, name: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", category: "Niche", concentration: "Eau de Parfum",
        family: "Oriental Floral", notes: "Saffron, Grandiflorum Jasmine, Amberwood, Fir Resin, Cedar",
        description: "A luminous and poetic haute parfumerie alchemy born from the encounter between MFK and Baccarat.",
        bottleVolumeMl: 70, pricePerSpray: 21000, retail10ml: 630000, fullBottlePrice: 7900000, rating: 5.0, baseSessions30d: 710, liveExtraSprays: 0, samplingSessions30d: 710, status: "ACTIVE", image: "/images/mfk-baccarat-rouge-540.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 5, batchNumber: "BATCH-2026-FK1",
        assignedMachines: [{ kioskCode: "demo-device", location: "Diamond Plaza Luxury Atrium, HCMC", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0119", remainingVolumeMl: 9.0, thresholdPct: 15, lastRefilled: "2026-10-10" }]
    },
    {
        id: "PROD-20", skuCode: "SKU-MTB-20", slotNumber: 20, name: "Montblanc Explorer", brand: "Montblanc", category: "Men", concentration: "Eau de Parfum",
        family: "Woody Aromatic", notes: "Italian Bergamot, Haitian Vetiver, Indonesian Patchouli",
        description: "An invitation to an exploratory journey across the four corners of the globe.",
        bottleVolumeMl: 100, pricePerSpray: 11500, retail10ml: 345000, fullBottlePrice: 2350000, rating: 4.7, baseSessions30d: 315, liveExtraSprays: 0, samplingSessions30d: 315, status: "ACTIVE", image: "/images/montblanc-explorer.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-MB1",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-03", location: "Crescent Mall Luxury Wing, HCMC", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0120", remainingVolumeMl: 79.0, thresholdPct: 15, lastRefilled: "2026-10-30" }]
    },
    {
        id: "PROD-21", skuCode: "SKU-MTB-21", slotNumber: 21, name: "Montblanc Legend", brand: "Montblanc", category: "Men", concentration: "Eau de Toilette",
        family: "Aromatic Fougere", notes: "Lavender, Pineapple, Red Apple, Oakmoss, Tonka Bean",
        description: "A charismatic and authentic fougere fragrance for men of self-confidence.",
        bottleVolumeMl: 100, pricePerSpray: 11000, retail10ml: 330000, fullBottlePrice: 2200000, rating: 4.6, baseSessions30d: 260, liveExtraSprays: 0, samplingSessions30d: 260, status: "ACTIVE", image: "/images/montblanc-legend.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-MB2",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-03", location: "Crescent Mall Luxury Wing, HCMC", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0121", remainingVolumeMl: 85.0, thresholdPct: 15, lastRefilled: "2026-11-01" }]
    },
    {
        id: "PROD-22", skuCode: "SKU-NAR-22", slotNumber: 22, name: "Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", category: "Women", concentration: "Eau de Parfum",
        family: "Floral Woody Musk", notes: "Rose, Peach Pulp, Heart of Musc, Patchouli, Soft Amber",
        description: "A sensual tribute to modern women built around Narciso's signature magnetic heart of musc.",
        bottleVolumeMl: 100, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3350000, rating: 4.8, baseSessions30d: 375, liveExtraSprays: 0, samplingSessions30d: 375, status: "ACTIVE", image: "/images/narciso-rodriguez-for-her.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-NR1",
        assignedMachines: [{ kioskCode: "KIOSK-HN-01", location: "Lotte Center West Lake Lounge, Hanoi", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0122", remainingVolumeMl: 61.0, thresholdPct: 15, lastRefilled: "2026-10-23" }]
    },
    {
        id: "PROD-23", skuCode: "SKU-NAR-23", slotNumber: 23, name: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", category: "Women", concentration: "Eau de Parfum",
        family: "Floral Woody Musk", notes: "Pure Musk, White Flowers, Cashmeran",
        description: "Captures the essence of pure, transcendent grace and intimate femininity.",
        bottleVolumeMl: 100, pricePerSpray: 13500, retail10ml: 405000, fullBottlePrice: 3450000, rating: 4.9, baseSessions30d: 345, liveExtraSprays: 0, samplingSessions30d: 345, status: "ACTIVE", image: "/images/narciso-rodriguez-pure-musc.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-NR2",
        assignedMachines: [{ kioskCode: "KIOSK-HN-02", location: "Trang Tien Plaza Luxury Wing, Hanoi", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "MAINTENANCE", bottleCode: "BTL-2026-0123", remainingVolumeMl: 74.0, thresholdPct: 15, lastRefilled: "2026-10-27" }]
    },
    {
        id: "PROD-24", skuCode: "SKU-PRB-24", slotNumber: 24, name: "Paco Rabanne 1 Million", brand: "Paco Rabanne", category: "Men", concentration: "Eau de Toilette",
        family: "Woody Spicy", notes: "Blood Mandarin, Peppermint, Cinnamon, Amberketal, Leather",
        description: "Daring, bold and golden. The iconic ingot fragrance of audacious luxury.",
        bottleVolumeMl: 100, pricePerSpray: 12500, retail10ml: 375000, fullBottlePrice: 2850000, rating: 4.7, baseSessions30d: 295, liveExtraSprays: 0, samplingSessions30d: 295, status: "ACTIVE", image: "/images/paco-rabanne-1-million.jpg",
        warehouseHub: "WH-DAD-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-PR1",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-02", location: "Vincom Center Dong Khoi, HCMC", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0124", remainingVolumeMl: 66.0, thresholdPct: 15, lastRefilled: "2026-10-24" }]
    },
    {
        id: "PROD-25", skuCode: "SKU-PRB-25", slotNumber: 25, name: "Paco Rabanne Invictus", brand: "Paco Rabanne", category: "Men", concentration: "Eau de Toilette",
        family: "Woody Aquatic", notes: "Sea Notes, Grapefruit, Bay Leaf, Guaiac Wood, Ambergris",
        description: "A clash of biting marine freshness and magnetic woody sensuality.",
        bottleVolumeMl: 100, pricePerSpray: 12500, retail10ml: 375000, fullBottlePrice: 2800000, rating: 4.6, baseSessions30d: 270, liveExtraSprays: 0, samplingSessions30d: 270, status: "ACTIVE", image: "/images/paco-rabanne-invictus.jpg",
        warehouseHub: "WH-DAD-CENTRAL", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-PR2",
        assignedMachines: [{ kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside Mall Lobby, Da Nang", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0125", remainingVolumeMl: 72.0, thresholdPct: 15, lastRefilled: "2026-10-26" }]
    },
    {
        id: "PROD-26", skuCode: "SKU-PDM-26", slotNumber: 26, name: "Parfums de Marly Sedley", brand: "Parfums de Marly", category: "Niche", concentration: "Eau de Parfum",
        family: "Woody Aromatic", notes: "Spearmint, Bergamot, Lavender, Geranium, Sandalwood",
        description: "French niche haute parfumerie inspired by the 18th-century Royal Court.",
        bottleVolumeMl: 125, pricePerSpray: 18500, retail10ml: 555000, fullBottlePrice: 6400000, rating: 4.9, baseSessions30d: 410, liveExtraSprays: 0, samplingSessions30d: 410, status: "ACTIVE", image: "/images/parfums-de-marly-sedley.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-PM1",
        assignedMachines: [{ kioskCode: "demo-device", location: "Diamond Plaza Luxury Atrium, HCMC", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0126", remainingVolumeMl: 68.0, thresholdPct: 15, lastRefilled: "2026-10-29" }]
    },
    {
        id: "PROD-27", skuCode: "SKU-ROJ-27", slotNumber: 27, name: "Roja Parfums Elysium", brand: "Roja Parfums", category: "Niche", concentration: "Parfum Cologne",
        family: "Aromatic Fougere", notes: "Grapefruit, Lime, Vetiver, Juniper Berry, Ambergris, Leather",
        description: "An ultra-luxurious British niche creation crafted by master perfumer Roja Dove.",
        bottleVolumeMl: 100, pricePerSpray: 22000, retail10ml: 660000, fullBottlePrice: 7600000, rating: 5.0, baseSessions30d: 465, liveExtraSprays: 0, samplingSessions30d: 465, status: "ACTIVE", image: "/images/roja-elysium.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-RJ1",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-03", location: "Crescent Mall Luxury Wing, HCMC", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0127", remainingVolumeMl: 11.0, thresholdPct: 15, lastRefilled: "2026-10-11" }]
    },
    {
        id: "PROD-28", skuCode: "SKU-TF-28", slotNumber: 28, name: "Tom Ford Black Orchid", brand: "Tom Ford", category: "Unisex", concentration: "Eau de Parfum",
        family: "Oriental Chypre", notes: "Black Truffle, Black Orchid, Plum, Patchouli, Vanilla",
        description: "A luxurious and sensual fragrance of rich dark accords and alluring black orchids.",
        bottleVolumeMl: 100, pricePerSpray: 16000, retail10ml: 480000, fullBottlePrice: 4350000, rating: 4.8, baseSessions30d: 430, liveExtraSprays: 0, samplingSessions30d: 430, status: "ACTIVE", image: "/images/tom-ford-black-orchid.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 4, batchNumber: "BATCH-2026-TF1",
        assignedMachines: [
            { kioskCode: "KIOSK-HN-02", location: "Trang Tien Plaza Luxury Wing, Hanoi", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "MAINTENANCE", bottleCode: "BTL-2026-0128", remainingVolumeMl: 48.0, thresholdPct: 15, lastRefilled: "2026-10-19" },
            { kioskCode: "KIOSK-004", location: "Aeon Mall Tan Phu Celadon, HCMC", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "OFFLINE", bottleCode: "BTL-2026-0428", remainingVolumeMl: 0.0, thresholdPct: 15, lastRefilled: "2026-10-05" }
        ]
    },
    {
        id: "PROD-29", skuCode: "SKU-VAL-29", slotNumber: 29, name: "Valentino Born in Roma", brand: "Valentino", category: "Women", concentration: "Eau de Parfum",
        family: "Oriental Floral", notes: "Blackcurrant, Jasmine Grandiflorum, Bourbon Vanilla, Guaiac Wood",
        description: "A modern haute couture floral fragrance inspired by Roman street elegance.",
        bottleVolumeMl: 100, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3400000, rating: 4.7, baseSessions30d: 255, liveExtraSprays: 0, samplingSessions30d: 255, status: "ACTIVE", image: "/images/valentino-born-in-roma.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 2, batchNumber: "BATCH-2026-VL1",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-03", location: "Crescent Mall Luxury Wing, HCMC", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0129", remainingVolumeMl: 81.0, thresholdPct: 15, lastRefilled: "2026-10-31" }]
    },
    {
        id: "PROD-30", skuCode: "SKU-VER-30", slotNumber: 30, name: "Versace Bright Crystal", brand: "Versace", category: "Women", concentration: "Eau de Toilette",
        family: "Floral Fruity", notes: "Yuzu, Pomegranate, Peony, Lotus, Magnolia, Musk",
        description: "A sheer, sensual and luminous floral jewel fragrance by Gianni Versace.",
        bottleVolumeMl: 90, pricePerSpray: 11500, retail10ml: 345000, fullBottlePrice: 2450000, rating: 4.7, baseSessions30d: 310, liveExtraSprays: 0, samplingSessions30d: 310, status: "ACTIVE", image: "/images/versace-bright-crystal.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-VS1",
        assignedMachines: [{ kioskCode: "KIOSK-004", location: "Aeon Mall Tan Phu Celadon, HCMC", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "OFFLINE", bottleCode: "BTL-2026-0130", remainingVolumeMl: 62.0, thresholdPct: 15, lastRefilled: "2026-10-25" }]
    },
    {
        id: "PROD-31", skuCode: "SKU-VER-31", slotNumber: 31, name: "Versace Dylan Blue", brand: "Versace", category: "Men", concentration: "Eau de Toilette",
        family: "Aromatic Fougere", notes: "Calabrian Bergamot, Grapefruit, Fig Leaf, Ambroxan, Incense",
        description: "A distinctive masculine fougere capturing the sensual scents of the Mediterranean.",
        bottleVolumeMl: 100, pricePerSpray: 12000, retail10ml: 360000, fullBottlePrice: 2550000, rating: 4.7, baseSessions30d: 335, liveExtraSprays: 0, samplingSessions30d: 335, status: "ACTIVE", image: "/images/versace-dylan-blue.jpg",
        warehouseHub: "WH-DAD-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-VS2",
        assignedMachines: [{ kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside Mall Lobby, Da Nang", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0131", remainingVolumeMl: 77.0, thresholdPct: 15, lastRefilled: "2026-10-28" }]
    },
    {
        id: "PROD-32", skuCode: "SKU-VER-32", slotNumber: 32, name: "Versace Eros", brand: "Versace", category: "Men", concentration: "Eau de Parfum",
        family: "Aromatic Fougere", notes: "Mint Leaves, Green Apple, Italian Lemon, Tonka Bean, Vanilla",
        description: "A fragrance for a strong, passionate man, inspired by the Greek god of love.",
        bottleVolumeMl: 100, pricePerSpray: 12500, retail10ml: 375000, fullBottlePrice: 2700000, rating: 4.8, baseSessions30d: 440, liveExtraSprays: 0, samplingSessions30d: 440, status: "ACTIVE", image: "/images/versace-eros.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 4, batchNumber: "BATCH-2026-VS3",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-02", location: "Vincom Center Dong Khoi, HCMC", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0132", remainingVolumeMl: 83.0, thresholdPct: 15, lastRefilled: "2026-11-02" }]
    },
    {
        id: "PROD-33", skuCode: "SKU-YSL-33", slotNumber: 33, name: "YSL Libre Eau de Parfum", brand: "Yves Saint Laurent", category: "Women", concentration: "Eau de Parfum",
        family: "Oriental Fougere", notes: "French Lavender, Moroccan Orange Blossom, Madagascar Vanilla",
        description: "The freedom of a bold, uncompromising feminine couture fragrance statement.",
        bottleVolumeMl: 90, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3750000, rating: 4.9, baseSessions30d: 495, liveExtraSprays: 0, samplingSessions30d: 495, status: "ACTIVE", image: "/images/ysl-libre.jpg",
        warehouseHub: "WH-SGN-CENTRAL", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-YS1",
        assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya Flagship, HCMC", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0133", remainingVolumeMl: 14.0, thresholdPct: 15, lastRefilled: "2026-10-16" }]
    },
    {
        id: "PROD-34", skuCode: "SKU-YSL-34", slotNumber: 34, name: "YSL Y Eau de Parfum", brand: "Yves Saint Laurent", category: "Men", concentration: "Eau de Parfum",
        family: "Aromatic Fougere", notes: "Apple, Ginger, Sage, Geranium, Tonka Bean, Cedar",
        description: "An intense woody-fougere representation of the Y olfactive signature.",
        bottleVolumeMl: 100, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3700000, rating: 4.8, baseSessions30d: 315, liveExtraSprays: 0, samplingSessions30d: 315, status: "INACTIVE", image: "/images/ysl-y-edp.jpg",
        warehouseHub: "WH-HN-NORTH", warehouseReserveBottles: 3, batchNumber: "BATCH-2026-YS2",
        assignedMachines: [{ kioskCode: "KIOSK-HN-01", location: "Lotte Center West Lake Lounge, Hanoi", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0134", remainingVolumeMl: 63.0, thresholdPct: 15, lastRefilled: "2026-10-20" }]
    },
];

const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type SummaryFilterMode =
    | "ALL"
    | "ACTIVE"
    | "AVAILABLE_MACHINES"
    | "MOST_POPULAR";
type DrawerTab = "overview" | "machines" | "inventory" | "analytics";
type RoleScopeMode =
    | "PLATFORM_ADMIN"
    | "BRAND_ADMIN_CHANEL"
    | "OPS_INVENTORY_STAFF"
    | "VIEWER_READONLY";

const isExactName = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

export default function ProductsPage(): React.ReactElement {
    const router = useRouter();
    const imageFileInputRef = useRef<HTMLInputElement | null>(null);
    const brandMenuRef = useRef<HTMLDivElement | null>(null);
    const assignKioskMenuRef = useRef<HTMLDivElement | null>(null);
    const presetImageMenuRef = useRef<HTMLDivElement | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasParsedUrlParamsRef = useRef<boolean>(false);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [products, setProducts] = useState<PerfumeProductItem[]>(INITIAL_34_PRODUCTS);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [summaryFilter, setSummaryFilter] = useState<SummaryFilterMode>("ALL");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [roleScope, setRoleScope] = useState<RoleScopeMode>("PLATFORM_ADMIN");
    const [activeUserName, setActiveUserName] = useState<string>("Platform Super Administrator");

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedStationIndex, setSelectedStationIndex] = useState<number>(0);
    const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");
    const [analyticsRange, setAnalyticsRange] = useState<"7D" | "30D" | "YTD">("30D");
    const [assignKioskCode, setAssignKioskCode] = useState<string>("demo-device");
    const [isAssignKioskOpen, setIsAssignKioskOpen] = useState<boolean>(false);
    const [assignSlotNum, setAssignSlotNum] = useState<number>(4);

    const [previewProduct, setPreviewProduct] = useState<PerfumeProductItem | null>(null);

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isPresetImageOpen, setIsPresetImageOpen] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<PerfumeProductItem | null>(null);
    const [formError, setFormError] = useState<string>("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [name, setName] = useState<string>("");
    const [brand, setBrand] = useState<string>("Chanel");
    const [category, setCategory] = useState<PerfumeProductItem["category"]>("Men");
    const [concentration, setConcentration] =
        useState<PerfumeProductItem["concentration"]>("Eau de Parfum");
    const [bottleVolumeMl, setBottleVolumeMl] = useState<number>(100);
    const [family, setFamily] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [pricePerSpray, setPricePerSpray] = useState<number>(15000);
    const [status, setStatus] = useState<PerfumeProductItem["status"]>("ACTIVE");
    const [image, setImage] = useState<string>("/images/bleu-de-chanel.png");

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (brandMenuRef.current && !brandMenuRef.current.contains(e.target as Node)) {
                setIsBrandDropdownOpen(false);
            }
            if (assignKioskMenuRef.current && !assignKioskMenuRef.current.contains(e.target as Node)) {
                setIsAssignKioskOpen(false);
            }
            if (presetImageMenuRef.current && !presetImageMenuRef.current.contains(e.target as Node)) {
                setIsPresetImageOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === selectedProductId) || null,
        [products, selectedProductId]
    );

    const handleToggleLanguage = useCallback(() => {
        const nextLang = lang === "en" ? "vi" : "en";
        setLang(nextLang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
        } catch {
            // Safe fallback
        }
    }, [lang]);

    const showToast = useCallback((msg: string) => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToastMessage(msg);
        toastTimerRef.current = setTimeout(() => {
            setToastMessage(null);
            toastTimerRef.current = null;
        }, 4200);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    const appendCatalogAuditLog = useCallback(
        (action: string, entityId: string, details: Record<string, unknown>) => {
            try {
                const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const logs = rawLogs ? JSON.parse(rawLogs) : [];
                logs.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: new Date().toISOString(),
                    actor: activeUserName,
                    role: roleScope,
                    tenant: roleScope === "BRAND_ADMIN_CHANEL" ? "Chanel" : null,
                    action,
                    entityType: "PRODUCTS",
                    entityId,
                    severity: "INFO",
                    oldValues: null,
                    newValues: details,
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));
            } catch {
                // Safe fallback
            }
        },
        [activeUserName, roleScope]
    );

    const loadAndReconcileProducts = useCallback(() => {
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
                setActiveUserName(parsedUser.fullName || parsedUser.name || "Portal Administrator");
                if (roleCode === "VW" || roleCode === "VIEWER") {
                    setRoleScope("VIEWER_READONLY");
                } else if (roleCode === "BA") {
                    setRoleScope("BRAND_ADMIN_CHANEL");
                    setSelectedBrand(parsedUser.brandScope || "Chanel");
                } else if (roleCode === "OM" || roleCode === "IS") {
                    setRoleScope("OPS_INVENTORY_STAFF");
                } else {
                    setRoleScope("PLATFORM_ADMIN");
                }
            }

            if (!hasParsedUrlParamsRef.current && typeof window !== "undefined") {
                hasParsedUrlParamsRef.current = true;
                const params = new URLSearchParams(window.location.search);
                const brandParam = params.get("brand");
                const skuParam = params.get("sku");
                if (brandParam) setSelectedBrand(brandParam);
                if (skuParam) setSearchQuery(skuParam);
            }

            const savedProdsRaw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            let savedArray: any[] = [];
            if (savedProdsRaw) {
                try {
                    const parsed = JSON.parse(savedProdsRaw);
                    if (Array.isArray(parsed)) savedArray = parsed;
                } catch {
                    savedArray = [];
                }
            }

            const distinctNamesInStorage = new Set(
                savedArray.map((item: any) => String(item?.name || "").trim().toLowerCase()).filter(Boolean)
            );
            const isCorruptedStorage = distinctNamesInStorage.size < 10;

            let mergedCatalog: PerfumeProductItem[] = INITIAL_34_PRODUCTS.map((seedItem) => {
                if (isCorruptedStorage) return seedItem;

                const matchedSaved = savedArray.find(
                    (p: any) =>
                        p.id === seedItem.id ||
                        p.skuCode === seedItem.skuCode ||
                        p.slotNumber === seedItem.slotNumber ||
                        isExactName(String(p.name || ""), seedItem.name)
                );

                if (!matchedSaved) return seedItem;

                const validAssigned = Array.isArray(matchedSaved.assignedMachines)
                    ? matchedSaved.assignedMachines.map((am: any, idx: number) => {
                        const cleanSlot =
                            typeof am.slotNumber === "number" && am.slotNumber >= 1 && am.slotNumber <= 4
                                ? am.slotNumber
                                : seedItem.assignedMachines[idx]?.slotNumber || 1;
                        const kMeta =
                            FLEET_KIOSK_OPTIONS.find(
                                (k) => k.code.toLowerCase() === String(am.kioskCode || "").toLowerCase()
                            ) || FLEET_KIOSK_OPTIONS[0];
                        return {
                            kioskCode: am.kioskCode || kMeta.code,
                            location: am.location || kMeta.location,
                            slotNumber: cleanSlot,
                            physicalSlotLabel: am.physicalSlotLabel || `Slot 0${cleanSlot}`,
                            machineStatus: am.machineStatus || kMeta.status,
                            bottleCode:
                                am.bottleCode ||
                                `BTL-2026-01${String(seedItem.slotNumber).padStart(2, "0")}`,
                            remainingVolumeMl: Number(
                                am.remainingVolumeMl ??
                                seedItem.assignedMachines[0]?.remainingVolumeMl ??
                                seedItem.bottleVolumeMl
                            ),
                            thresholdPct: 15,
                            lastRefilled: am.lastRefilled || "2026-10-28",
                        };
                    })
                    : seedItem.assignedMachines;

                return {
                    ...seedItem,
                    name: matchedSaved.name || seedItem.name,
                    brand: matchedSaved.brand || seedItem.brand,
                    category: matchedSaved.category || seedItem.category,
                    concentration: matchedSaved.concentration || seedItem.concentration,
                    family: matchedSaved.family || seedItem.family,
                    notes: matchedSaved.notes || seedItem.notes,
                    description: matchedSaved.description || seedItem.description,
                    bottleVolumeMl: Number(matchedSaved.bottleVolumeMl || seedItem.bottleVolumeMl),
                    pricePerSpray: Number(matchedSaved.pricePerSpray || seedItem.pricePerSpray),
                    retail10ml: Number(matchedSaved.pricePerSpray || seedItem.pricePerSpray) * 30,
                    status: matchedSaved.status || seedItem.status,
                    image: matchedSaved.image || seedItem.image,
                    liveExtraSprays: Number(matchedSaved.liveExtraSprays ?? 0),
                    samplingSessions30d: Number(
                        matchedSaved.samplingSessions30d ?? seedItem.baseSessions30d
                    ),
                    warehouseReserveBottles: Number(
                        matchedSaved.warehouseReserveBottles ?? seedItem.warehouseReserveBottles
                    ),
                    assignedMachines: validAssigned,
                };
            });

            if (!isCorruptedStorage) {
                const seedIds = new Set(INITIAL_34_PRODUCTS.map((s) => s.id));
                const seedSkus = new Set(INITIAL_34_PRODUCTS.map((s) => s.skuCode));
                const seedSlots = new Set(INITIAL_34_PRODUCTS.map((s) => s.slotNumber));
                const customAdded = savedArray.filter(
                    (p: any) =>
                        p &&
                        p.name &&
                        !seedIds.has(p.id) &&
                        !seedSkus.has(p.skuCode) &&
                        !seedSlots.has(Number(p.slotNumber)) &&
                        !INITIAL_34_PRODUCTS.some((s) => isExactName(s.name, p.name))
                );
                customAdded.forEach((custom: any, idx: number) => {
                    mergedCatalog.unshift({
                        ...INITIAL_34_PRODUCTS[0],
                        ...custom,
                        id: custom.id || `PROD-CUSTOM-${35 + idx}`,
                        skuCode: custom.skuCode || `SKU-NEW-${35 + idx}`,
                        slotNumber: Number(custom.slotNumber || 35 + idx),
                        baseSessions30d: Number(custom.baseSessions30d ?? 0),
                        liveExtraSprays: Number(custom.liveExtraSprays ?? 0),
                        samplingSessions30d: Number(custom.samplingSessions30d ?? 0),
                        assignedMachines: Array.isArray(custom.assignedMachines)
                            ? custom.assignedMachines
                            : [],
                    });
                });
            }

            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            const machineStatusMap = new Map<string, "ONLINE" | "MAINTENANCE" | "OFFLINE">();
            const machineSlotVolumeMap = new Map<string, number>();

            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    parsedMachines.forEach((m: any) => {
                        const code = String(m.code || m.id || "");
                        const conn = m.connectionStatus || (m.status === "OFFLINE" ? "OFFLINE" : "ONLINE");
                        const oper =
                            m.operatingStatus ||
                            (m.status === "MAINTENANCE"
                                ? "MAINTENANCE"
                                : m.status === "OFFLINE"
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

                        if (code) {
                            machineStatusMap.set(code.toLowerCase(), unifiedStatus);
                            if (Array.isArray(m.slots)) {
                                m.slots.forEach((sl: any) => {
                                    if (sl.fragranceName && typeof sl.remainingMl === "number") {
                                        machineSlotVolumeMap.set(
                                            `${code.toLowerCase()}__${sl.fragranceName.trim().toLowerCase()}`,
                                            Number(sl.remainingMl)
                                        );
                                    }
                                });
                            }
                        }
                    });
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};

            const dashRaw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            const dashTxs: any[] = dashRaw
                ? (JSON.parse(dashRaw)?.transactions || []).filter(
                    (t: any) => t.status === "DISPENSED"
                )
                : [];

            const movRaw = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
            const movList: any[] = movRaw ? JSON.parse(movRaw) || [] : [];

            mergedCatalog = mergedCatalog.map((prod) => {
                const prodKey = prod.name.trim().toLowerCase();

                const txSprayCount = dashTxs.filter((tx: any) =>
                    isExactName(String(tx.product || ""), prod.name)
                ).length;

                const movSprayCount = movList.filter(
                    (mv: any) =>
                        isExactName(String(mv.productName || ""), prod.name) &&
                        (mv.movementType === "SALE" || mv.movementType === "DIAGNOSTIC")
                ).length;

                const savedExtra = Math.max(
                    Number(prod.liveExtraSprays || 0),
                    Math.max(0, Number(prod.samplingSessions30d || 0) - Number(prod.baseSessions30d || 0))
                );

                const liveExtra = Math.max(txSprayCount, movSprayCount, savedExtra);

                const updatedMachines = prod.assignedMachines.map((m) => {
                    const kKey = m.kioskCode.toLowerCase();
                    const latestMStatus = machineStatusMap.get(kKey) || m.machineStatus;
                    const matrixMl = perKioskMatrix[kKey]?.[prodKey];
                    const slotMl = machineSlotVolumeMap.get(`${kKey}__${prodKey}`);

                    const syncedMl =
                        typeof matrixMl === "number"
                            ? matrixMl
                            : typeof slotMl === "number"
                                ? slotMl
                                : m.remainingVolumeMl;

                    return {
                        ...m,
                        machineStatus: latestMStatus,
                        remainingVolumeMl: Number(syncedMl),
                    };
                });

                return {
                    ...prod,
                    liveExtraSprays: liveExtra,
                    samplingSessions30d: prod.baseSessions30d + liveExtra,
                    assignedMachines: updatedMachines,
                };
            });

            setProducts(mergedCatalog);
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(mergedCatalog));
        } catch {
            setProducts(INITIAL_34_PRODUCTS);
        }
    }, []);

    useEffect(() => {
        loadAndReconcileProducts();

        const handleCrossTabStorage = (e: StorageEvent) => {
            if (
                !e.key ||
                e.key === PRODUCTS_STORAGE_KEY ||
                e.key === DASHBOARD_STORAGE_KEY ||
                e.key === MACHINES_STORAGE_KEY ||
                e.key === KIOSK_PER_UNIT_STOCK_KEY ||
                e.key === INVENTORY_MOVEMENTS_KEY ||
                e.key === LANGUAGE_STORAGE_KEY ||
                e.key === "scentstation-user"
            ) {
                loadAndReconcileProducts();
            }
        };

        const handleWindowFocusOrSync = () => {
            loadAndReconcileProducts();
        };

        window.addEventListener("storage", handleCrossTabStorage);
        window.addEventListener("focus", handleWindowFocusOrSync);
        window.addEventListener("scentstation-sync", handleWindowFocusOrSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileProducts();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabStorage);
            window.removeEventListener("focus", handleWindowFocusOrSync);
            window.removeEventListener("scentstation-sync", handleWindowFocusOrSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileProducts]);

    /* --- CẬP NHẬT ĐỒNG BỘ 2 CHIỀU TOÀN HỆ THỐNG & GHI NHẬN GIAO DỊCH VÀO BẢNG ADMIN --- */
    const persistProductsAndPropagateAll = useCallback(
        (
            updatedList: PerfumeProductItem[],
            inventoryEvent?: {
                eventType: "SPRAY_TEST" | "REFILL_FULL";
                product: PerfumeProductItem;
                kioskCode: string;
                physicalSlotLabel: string;
                location: string;
                qtyBeforeMl: number;
                qtyAfterMl: number;
            },
            renamedProductMeta?: {
                oldName: string;
                newName: string;
                newBrand: string;
                newPrice: number;
                newCapacity: number;
                newStatus: PerfumeProductItem["status"];
            }
        ) => {
            setProducts(updatedList);
            try {
                // 1. Lưu danh mục sản phẩm chuẩn vào PRODUCTS_STORAGE_KEY
                localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedList));

                // 2. Đồng bộ ma trận tồn kho từng máy (KIOSK_PER_UNIT_STOCK_KEY)
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                    ? JSON.parse(rawMatrix)
                    : {};

                if (renamedProductMeta && !isExactName(renamedProductMeta.oldName, renamedProductMeta.newName)) {
                    const oldKey = renamedProductMeta.oldName.trim().toLowerCase();
                    const newKey = renamedProductMeta.newName.trim().toLowerCase();
                    Object.keys(perKioskMatrix).forEach((kKey) => {
                        if (typeof perKioskMatrix[kKey]?.[oldKey] === "number") {
                            perKioskMatrix[kKey][newKey] = perKioskMatrix[kKey][oldKey];
                            delete perKioskMatrix[kKey][oldKey];
                        }
                    });
                }

                updatedList.forEach((prod) => {
                    const pKey = prod.name.trim().toLowerCase();
                    prod.assignedMachines.forEach((am) => {
                        const kKey = am.kioskCode.toLowerCase();
                        if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                        perKioskMatrix[kKey][pKey] = Number(am.remainingVolumeMl);
                    });
                });

                if (inventoryEvent) {
                    const targetKioskKey = inventoryEvent.kioskCode.toLowerCase();
                    const prodKey = inventoryEvent.product.name.trim().toLowerCase();
                    if (!perKioskMatrix[targetKioskKey]) {
                        perKioskMatrix[targetKioskKey] = {};
                    }
                    perKioskMatrix[targetKioskKey][prodKey] = inventoryEvent.qtyAfterMl;
                }
                localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                // 3. Đồng bộ trạng thái ACTIVE / INACTIVE, tên mới, giá mới, dung tích bình và doanh thu/lượt xịt xuống MACHINES_STORAGE_KEY
                const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawMachines) {
                    const parsedMachines = JSON.parse(rawMachines);
                    if (Array.isArray(parsedMachines)) {
                        const statusMap = new Map<string, PerfumeProductItem["status"]>();
                        const volumeCapacityMap = new Map<string, number>();
                        const priceMap = new Map<string, number>();
                        updatedList.forEach((p) => {
                            const k = p.name.trim().toLowerCase();
                            statusMap.set(k, p.status);
                            volumeCapacityMap.set(k, p.bottleVolumeMl);
                            priceMap.set(k, p.pricePerSpray);
                        });

                        const targetKioskKey = inventoryEvent?.kioskCode.toLowerCase();

                        const syncedMachines = parsedMachines.map((fm: any) => {
                            const kCode = String(fm.code || fm.id || "").toLowerCase();
                            const isTargetMachine = targetKioskKey && kCode === targetKioskKey;

                            return {
                                ...fm,
                                todaySprays:
                                    isTargetMachine && inventoryEvent?.eventType === "SPRAY_TEST"
                                        ? (fm.todaySprays || 0) + 1
                                        : fm.todaySprays,
                                todayRevenue:
                                    isTargetMachine && inventoryEvent?.eventType === "SPRAY_TEST"
                                        ? (fm.todayRevenue || 0) + inventoryEvent.product.pricePerSpray
                                        : fm.todayRevenue,
                                slots: Array.isArray(fm.slots)
                                    ? fm.slots.map((sl: any) => {
                                        let currentSlotFragranceName = String(sl.fragranceName || "");
                                        let currentSlotBrand = String(sl.brand || "");

                                        if (
                                            renamedProductMeta &&
                                            isExactName(currentSlotFragranceName, renamedProductMeta.oldName)
                                        ) {
                                            currentSlotFragranceName = renamedProductMeta.newName;
                                            currentSlotBrand = renamedProductMeta.newBrand;
                                        }

                                        const sNameKey = currentSlotFragranceName.trim().toLowerCase();
                                        const prodStatus = statusMap.get(sNameKey) || sl.productStatus || "ACTIVE";
                                        const latestMl =
                                            typeof perKioskMatrix[kCode]?.[sNameKey] === "number"
                                                ? perKioskMatrix[kCode][sNameKey]
                                                : Number(sl.remainingMl);
                                        const capMl = volumeCapacityMap.get(sNameKey) || Number(sl.capacityMl || 100);
                                        const latestPrice = priceMap.get(sNameKey) ?? sl.pricePerSpray;

                                        return {
                                            ...sl,
                                            fragranceName: currentSlotFragranceName,
                                            brand: currentSlotBrand,
                                            productStatus: prodStatus,
                                            available: prodStatus === "ACTIVE" && latestMl >= 0.12,
                                            remainingMl: latestMl,
                                            capacityMl: capMl,
                                            pricePerSpray: latestPrice,
                                        };
                                    })
                                    : fm.slots,
                            };
                        });
                        localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(syncedMachines));
                    }
                }

                if (inventoryEvent) {
                    const targetKioskKey = inventoryEvent.kioskCode.toLowerCase();
                    const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;

                    // 4. Ghi lịch sử biến động tồn kho vào INVENTORY_MOVEMENTS_KEY
                    const rawMovements = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movements = rawMovements ? JSON.parse(rawMovements) : [];
                    movements.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId:
                            inventoryEvent.eventType === "SPRAY_TEST"
                                ? newOrderId
                                : `REF-${Date.now().toString().slice(-5)}`,
                        kioskCode: inventoryEvent.kioskCode,
                        slotNumber: inventoryEvent.product.slotNumber,
                        brand: inventoryEvent.product.brand,
                        productName: inventoryEvent.product.name,
                        movementType:
                            inventoryEvent.eventType === "SPRAY_TEST" ? "SALE" : "REFILL",
                        quantityBeforeMl: inventoryEvent.qtyBeforeMl,
                        quantityAfterMl: inventoryEvent.qtyAfterMl,
                        deltaMl: Number(
                            (inventoryEvent.qtyAfterMl - inventoryEvent.qtyBeforeMl).toFixed(2)
                        ),
                        reason:
                            inventoryEvent.eventType === "SPRAY_TEST"
                                ? `Verified spray on ${inventoryEvent.kioskCode} (${inventoryEvent.physicalSlotLabel})`
                                : `Replenished ${inventoryEvent.kioskCode} (${inventoryEvent.physicalSlotLabel}) to 100% from ${inventoryEvent.product.warehouseHub}`,
                        timestamp: new Date().toISOString(),
                    });
                    localStorage.setItem(
                        INVENTORY_MOVEMENTS_KEY,
                        JSON.stringify(movements.slice(0, 300))
                    );

                    // 5. Ghi trực tiếp giao dịch vào DASHBOARD_STORAGE_KEY
                    const dashRaw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                    const dashData = dashRaw
                        ? JSON.parse(dashRaw)
                        : { transactions: [], incidents: [], alerts: [] };
                    if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                    if (!Array.isArray(dashData.alerts)) dashData.alerts = [];

                    if (inventoryEvent.eventType === "SPRAY_TEST") {
                        const nowIso = new Date().toISOString();
                        dashData.transactions.unshift({
                            id: newOrderId,
                            time: `Completed (${inventoryEvent.kioskCode})`,
                            kiosk: inventoryEvent.kioskCode,
                            slotNumber: inventoryEvent.product.slotNumber,
                            brand: inventoryEvent.product.brand,
                            product: inventoryEvent.product.name,
                            priceSnapshot: inventoryEvent.product.pricePerSpray,
                            amount: inventoryEvent.product.pricePerSpray,
                            paidAmount: inventoryEvent.product.pricePerSpray,
                            paymentMethod: "VIETQR",
                            providerReference: `PAY-VIETQR-${newOrderId}`,
                            status: "DISPENSED",
                            commandReference: `CMD-${newOrderId}`,
                            ackedAt: nowIso,
                            executedAt: nowIso,
                            createdAt: nowIso,
                        });

                        if (inventoryEvent.qtyAfterMl <= 15) {
                            const alertType = inventoryEvent.qtyAfterMl < 0.12 ? "SLOT_EMPTY" : "LOW_STOCK";
                            const existingAlert = dashData.alerts.find(
                                (a: any) =>
                                    String(a.machineId || "").toLowerCase() === targetKioskKey &&
                                    isExactName(a.product || "", inventoryEvent.product.name) &&
                                    a.status !== "RESOLVED"
                            );
                            if (existingAlert) {
                                existingAlert.remainingMl = inventoryEvent.qtyAfterMl;
                                existingAlert.updatedAt = nowIso;
                            } else {
                                dashData.alerts.unshift({
                                    id: `ALT-2026-${Math.floor(1000 + Math.random() * 8999)}`,
                                    timestamp: nowIso,
                                    machineId: inventoryEvent.kioskCode,
                                    slotNumber: inventoryEvent.product.slotNumber,
                                    brand: inventoryEvent.product.brand,
                                    product: inventoryEvent.product.name,
                                    alertType,
                                    category: "Inventory Alerts",
                                    severity: inventoryEvent.qtyAfterMl < 0.12 ? "CRITICAL" : "HIGH",
                                    status: "OPEN",
                                    remainingMl: inventoryEvent.qtyAfterMl,
                                    thresholdMl: 15,
                                    description: `Station ${inventoryEvent.kioskCode} (${inventoryEvent.physicalSlotLabel} - ${inventoryEvent.product.name}) is at ${inventoryEvent.qtyAfterMl}ml.`,
                                });
                            }
                        }
                    } else {
                        dashData.alerts = dashData.alerts.map((a: any) =>
                            String(a.machineId || "").toLowerCase() === targetKioskKey &&
                            isExactName(a.product || "", inventoryEvent.product.name)
                                ? {
                                    ...a,
                                    status: "RESOLVED",
                                    remainingMl: inventoryEvent.qtyAfterMl,
                                    resolvedAt: new Date().toISOString(),
                                }
                                : a
                        );
                    }

                    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));
                }

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
        () => Array.from(new Set(products.map((p) => p.brand))).sort(),
        [products]
    );

    const scopedProducts = useMemo(() => {
        if (roleScope === "BRAND_ADMIN_CHANEL") {
            return products.filter((p) => isExactName(p.brand, "Chanel"));
        }
        return products;
    }, [products, roleScope]);

    const summaryMetrics = useMemo(() => {
        const total = scopedProducts.length;
        const active = scopedProducts.filter((p) => p.status === "ACTIVE").length;
        const availableForMachines = scopedProducts.filter(
            (p) => p.status === "ACTIVE" && p.assignedMachines.length > 0
        ).length;
        const mostPopularList = [...scopedProducts].sort(
            (a, b) => b.samplingSessions30d - a.samplingSessions30d
        );
        const topProduct = mostPopularList[0];

        return { total, active, availableForMachines, topProduct };
    }, [scopedProducts]);

    const filteredProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let list = scopedProducts.filter((p) => {
            const matchesSearch =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.skuCode.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q) ||
                p.family.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.notes.toLowerCase().includes(q);
            const matchesBrand = selectedBrand === "ALL" || p.brand === selectedBrand;
            const matchesCategory =
                selectedCategory === "ALL" || p.category === selectedCategory;
            const matchesStatus =
                selectedStatus === "ALL" || p.status === selectedStatus;

            const matchesSummaryCard =
                summaryFilter === "ALL" ||
                (summaryFilter === "ACTIVE" && p.status === "ACTIVE") ||
                (summaryFilter === "AVAILABLE_MACHINES" &&
                    p.status === "ACTIVE" &&
                    p.assignedMachines.length > 0) ||
                (summaryFilter === "MOST_POPULAR" && p.samplingSessions30d >= 450);

            return (
                matchesSearch &&
                matchesBrand &&
                matchesCategory &&
                matchesStatus &&
                matchesSummaryCard
            );
        });

        if (summaryFilter === "MOST_POPULAR") {
            list = [...list].sort(
                (a, b) => b.samplingSessions30d - a.samplingSessions30d
            );
        }

        return list;
    }, [
        scopedProducts,
        searchQuery,
        selectedBrand,
        selectedCategory,
        selectedStatus,
        summaryFilter,
    ]);

    const handleResetFilters = () => {
        setSearchQuery("");
        setSelectedBrand(roleScope === "BRAND_ADMIN_CHANEL" ? "Chanel" : "ALL");
        setSelectedCategory("ALL");
        setSelectedStatus("ALL");
        setSummaryFilter("ALL");
    };

    const toggleStatus = (id: string, e?: React.MouseEvent): void => {
        if (e) e.stopPropagation();
        if (roleScope === "VIEWER_READONLY") return;

        let targetName = "";
        let nextState = "";
        const updatedList = products.map((p) => {
            if (p.id !== id) return p;
            const nextStatus: PerfumeProductItem["status"] =
                p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
            targetName = p.name;
            nextState = nextStatus;
            return { ...p, status: nextStatus };
        });
        persistProductsAndPropagateAll(updatedList);
        appendCatalogAuditLog("PRODUCT_STATUS_TOGGLED", id, {
            productName: targetName,
            newStatus: nextState,
        });
        showToast(
            lang === "en"
                ? `Updated "${targetName}" status to ${nextState}. Synchronized across Flagship Store & Kiosk screens.`
                : `Đã chuyển trạng thái "${targetName}" sang ${nextState} và đồng bộ khóa/mở trên các màn hình Kiosk.`
        );
    };

    /* --- XÓA SẢN PHẨM MỚI THÊM (SLOT > 34) VÀ ĐỒNG BỘ GỠ KHỎI MÀN 1 & MÀN 4 --- */
    const handleDeleteCustomProduct = (product: PerfumeProductItem, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (roleScope === "VIEWER_READONLY") return;

        const updatedList = products.filter((p) => p.id !== product.id);
        const prodKey = product.name.trim().toLowerCase();

        try {
            // 1. Xóa khỏi ma trận tồn kho từng máy
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            if (rawMatrix) {
                const matrix = JSON.parse(rawMatrix) || {};
                Object.keys(matrix).forEach((kKey) => {
                    if (matrix[kKey] && typeof matrix[kKey][prodKey] !== "undefined") {
                        delete matrix[kKey][prodKey];
                    }
                });
                localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(matrix));
            }

            // 2. Khóa khoang máy đang chứa sản phẩm vừa xóa trong MACHINES_STORAGE_KEY
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    const updatedFleet = parsedMachines.map((m: any) => ({
                        ...m,
                        slots: Array.isArray(m.slots)
                            ? m.slots.map((sl: any) =>
                                isExactName(sl.fragranceName || "", product.name)
                                    ? {
                                        ...sl,
                                        remainingMl: 0,
                                        available: false,
                                        productStatus: "INACTIVE",
                                    }
                                    : sl
                            )
                            : m.slots,
                    }));
                    localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
                }
            }
        } catch {
            // Safe fallback
        }

        if (selectedProductId === product.id) {
            setSelectedProductId(null);
        }

        persistProductsAndPropagateAll(updatedList);
        appendCatalogAuditLog("PRODUCT_DELETED", product.id, {
            skuCode: product.skuCode,
            productName: product.name,
        });
        showToast(
            lang === "en"
                ? `Deleted "${product.name}" (${product.skuCode}) and removed it from Storefront & Kiosks.`
                : `Đã xóa "${product.name}" (${product.skuCode}) và gỡ đồng bộ khỏi Trang chủ & Kiosk.`
        );
    };

    const handleUploadBottleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ["image/png", "image/jpeg", "image/webp"];
        if (!allowed.includes(file.type)) {
            setFormError(
                lang === "en"
                    ? "Invalid image format. Only PNG, JPG, or WEBP files are permitted."
                    : "Định dạng ảnh không hợp lệ. Chỉ chấp nhận PNG, JPG hoặc WEBP."
            );
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFormError(
                lang === "en"
                    ? "File size exceeds the 5MB limit."
                    : "Dung lượng file vượt quá giới hạn 5MB."
            );
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setImage(reader.result);
                showToast(
                    lang === "en"
                        ? `Uploaded "${file.name}" for product preview.`
                        : `Đã tải lên ảnh "${file.name}".`
                );
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAssignProductToKiosk = () => {
        if (!selectedProduct || roleScope === "VIEWER_READONLY") return;

        const kioskMeta =
            FLEET_KIOSK_OPTIONS.find((k) => k.code === assignKioskCode) ||
            FLEET_KIOSK_OPTIONS[0];
        const slotLabel = `Slot 0${assignSlotNum}`;

        const alreadyOnSameKiosk = selectedProduct.assignedMachines.find(
            (m) => m.kioskCode.toLowerCase() === kioskMeta.code.toLowerCase()
        );
        if (alreadyOnSameKiosk && alreadyOnSameKiosk.slotNumber === assignSlotNum) {
            showToast(
                lang === "en"
                    ? `${selectedProduct.name} is already installed in ${kioskMeta.code} (${slotLabel}).`
                    : `${selectedProduct.name} đã được lắp đặt sẵn tại ${kioskMeta.code} (${slotLabel}).`
            );
            return;
        }

        const newSlotAssignment: AssignedMachineSlot = {
            kioskCode: kioskMeta.code,
            location: kioskMeta.location,
            slotNumber: assignSlotNum,
            physicalSlotLabel: slotLabel,
            machineStatus: kioskMeta.status,
            bottleCode: `BTL-2026-${Math.floor(1000 + Math.random() * 8999)}`,
            remainingVolumeMl: selectedProduct.bottleVolumeMl,
            thresholdPct: 15,
            lastRefilled: new Date().toISOString().split("T")[0],
        };

        let replacedOldProductName: string | null = null;

        const updatedList = products.map((p) => {
            if (p.id === selectedProduct.id) {
                const filteredOwn = p.assignedMachines.filter(
                    (m) => m.kioskCode.toLowerCase() !== kioskMeta.code.toLowerCase()
                );
                return {
                    ...p,
                    assignedMachines: [...filteredOwn, newSlotAssignment],
                };
            }

            const hasConflictSlot = p.assignedMachines.some(
                (m) =>
                    m.kioskCode.toLowerCase() === kioskMeta.code.toLowerCase() &&
                    (m.slotNumber === assignSlotNum || m.physicalSlotLabel === slotLabel)
            );
            if (hasConflictSlot) {
                replacedOldProductName = p.name;
                return {
                    ...p,
                    assignedMachines: p.assignedMachines.filter(
                        (m) =>
                            !(
                                m.kioskCode.toLowerCase() === kioskMeta.code.toLowerCase() &&
                                (m.slotNumber === assignSlotNum || m.physicalSlotLabel === slotLabel)
                            )
                    ),
                };
            }
            return p;
        });

        try {
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    const updatedFleet = parsedMachines.map((m: any) => {
                        if (String(m.code || "").toLowerCase() !== kioskMeta.code.toLowerCase()) {
                            return m;
                        }
                        const nextSlots = Array.isArray(m.slots) ? [...m.slots] : [];
                        const idx = Math.max(0, Math.min(3, assignSlotNum - 1));
                        nextSlots[idx] = {
                            slotLabel,
                            fragranceName: selectedProduct.name,
                            brand: selectedProduct.brand,
                            remainingMl: selectedProduct.bottleVolumeMl,
                            capacityMl: selectedProduct.bottleVolumeMl,
                            lowStockThresholdMl: 15,
                            productStatus: selectedProduct.status,
                            pricePerSpray: selectedProduct.pricePerSpray,
                        };
                        return { ...m, slots: nextSlots };
                    });
                    localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const matrix = rawMatrix ? JSON.parse(rawMatrix) : {};
            const kKey = kioskMeta.code.toLowerCase();
            if (!matrix[kKey]) matrix[kKey] = {};
            matrix[kKey][selectedProduct.name.trim().toLowerCase()] =
                selectedProduct.bottleVolumeMl;
            localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(matrix));
        } catch {
            // Safe fallback
        }

        persistProductsAndPropagateAll(updatedList);
        const updatedTarget = updatedList.find((p) => p.id === selectedProduct.id);
        if (updatedTarget) {
            setSelectedStationIndex(Math.max(0, updatedTarget.assignedMachines.length - 1));
        }

        appendCatalogAuditLog("PRODUCT_ASSIGNED_TO_KIOSK_SLOT", selectedProduct.id, {
            productName: selectedProduct.name,
            kioskCode: kioskMeta.code,
            slotLabel,
            replacedOldProduct: replacedOldProductName,
        });

        showToast(
            lang === "en"
                ? `Installed ${selectedProduct.name} into ${kioskMeta.code} (${slotLabel} • ${selectedProduct.bottleVolumeMl}ml)${
                    replacedOldProductName ? ` — replaced ${replacedOldProductName}` : ""
                }. Synchronized to Kiosk & Storefront!`
                : `Đã lắp đặt ${selectedProduct.name} vào trạm ${kioskMeta.code} (${slotLabel} • ${selectedProduct.bottleVolumeMl}ml)${
                    replacedOldProductName ? ` — thay thế bình ${replacedOldProductName}` : ""
                }. Đã đồng bộ sang Màn 1 & Màn 4!`
        );
    };

    const handleUnassignMachineSlot = (kioskCode: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedProduct || roleScope === "VIEWER_READONLY") return;

        const updatedProd: PerfumeProductItem = {
            ...selectedProduct,
            assignedMachines: selectedProduct.assignedMachines.filter(
                (m) => m.kioskCode.toLowerCase() !== kioskCode.toLowerCase()
            ),
        };
        const updatedList = products.map((p) =>
            p.id === selectedProduct.id ? updatedProd : p
        );

        // Đồng bộ khóa khoang vừa gỡ trong cả KIOSK_PER_UNIT_STOCK_KEY và MACHINES_STORAGE_KEY (Chuẩn BR3)
        try {
            const kKey = kioskCode.toLowerCase();
            const prodKey = selectedProduct.name.trim().toLowerCase();

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            if (rawMatrix) {
                const matrix = JSON.parse(rawMatrix) || {};
                if (matrix[kKey]) {
                    matrix[kKey][prodKey] = 0;
                    localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(matrix));
                }
            }

            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    const updatedFleet = parsedMachines.map((m: any) => {
                        if (String(m.code || "").toLowerCase() !== kKey) {
                            return m;
                        }
                        return {
                            ...m,
                            slots: Array.isArray(m.slots)
                                ? m.slots.map((sl: any) =>
                                    isExactName(sl.fragranceName || "", selectedProduct.name)
                                        ? {
                                            ...sl,
                                            remainingMl: 0,
                                            available: false,
                                            productStatus: "INACTIVE",
                                        }
                                        : sl
                                )
                                : m.slots,
                        };
                    });
                    localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
                }
            }
        } catch {
            // Safe fallback
        }

        persistProductsAndPropagateAll(updatedList);
        setSelectedStationIndex(0);
        appendCatalogAuditLog("PRODUCT_UNASSIGNED_FROM_KIOSK", selectedProduct.id, {
            productName: selectedProduct.name,
            kioskCode,
        });
        showToast(
            lang === "en"
                ? `Removed ${selectedProduct.name} from station ${kioskCode} and updated Kiosk display.`
                : `Đã gỡ ${selectedProduct.name} khỏi trạm ${kioskCode} và cập nhật màn hình Kiosk.`
        );
    };

    /* --- XỊT THỬ / NẠP BÌNH TRỰC TIẾP: CỘNG NGAY VÀO BIỂU ĐỒ & GHI THẲNG VÀO BẢNG TRANSACTIONS ADMIN --- */
    const handleDrawerInventoryAction = (
        action: "SPRAY_TEST" | "REFILL_FULL",
        targetMachineIndex: number = selectedStationIndex
    ) => {
        if (
            !selectedProduct ||
            selectedProduct.assignedMachines.length === 0 ||
            roleScope === "VIEWER_READONLY"
        ) {
            return;
        }

        const safeIdx = Math.min(
            targetMachineIndex,
            selectedProduct.assignedMachines.length - 1
        );
        const targetMachine = selectedProduct.assignedMachines[safeIdx];

        if (action === "SPRAY_TEST") {
            if (targetMachine.machineStatus !== "ONLINE") {
                showToast(
                    lang === "en"
                        ? `Action Blocked: Station ${targetMachine.kioskCode} is currently ${targetMachine.machineStatus}.`
                        : `Từ chối thực thi: Trạm ${targetMachine.kioskCode} đang ở trạng thái ${targetMachine.machineStatus}.`
                );
                return;
            }
            if (targetMachine.remainingVolumeMl < 0.12) {
                showToast(
                    lang === "en"
                        ? `Cartridge Depleted: ${selectedProduct.name} on ${targetMachine.kioskCode} is at ${targetMachine.remainingVolumeMl}ml. Please replenish first.`
                        : `Bình đã cạn: ${selectedProduct.name} tại trạm ${targetMachine.kioskCode} còn ${targetMachine.remainingVolumeMl}ml. Vui lòng nạp đầy trước.`
                );
                return;
            }
        }

        const qtyBefore = targetMachine.remainingVolumeMl;
        const nextMl =
            action === "REFILL_FULL"
                ? selectedProduct.bottleVolumeMl
                : Number(Math.max(0, qtyBefore - 0.12).toFixed(2));

        const todayDateStr = new Date().toISOString().split("T")[0];
        const nextLiveExtra =
            action === "SPRAY_TEST"
                ? (selectedProduct.liveExtraSprays || 0) + 1
                : selectedProduct.liveExtraSprays || 0;

        const updatedProd: PerfumeProductItem = {
            ...selectedProduct,
            liveExtraSprays: nextLiveExtra,
            samplingSessions30d: selectedProduct.baseSessions30d + nextLiveExtra,
            warehouseReserveBottles:
                action === "REFILL_FULL" && selectedProduct.warehouseReserveBottles > 0
                    ? selectedProduct.warehouseReserveBottles - 1
                    : selectedProduct.warehouseReserveBottles,
            assignedMachines: selectedProduct.assignedMachines.map((m, i) =>
                i === safeIdx
                    ? {
                        ...m,
                        remainingVolumeMl: nextMl,
                        lastRefilled:
                            action === "REFILL_FULL" ? todayDateStr : m.lastRefilled,
                    }
                    : m
            ),
        };

        const updatedList = products.map((p) =>
            p.id === selectedProduct.id ? updatedProd : p
        );

        persistProductsAndPropagateAll(updatedList, {
            eventType: action,
            product: updatedProd,
            kioskCode: targetMachine.kioskCode,
            physicalSlotLabel: targetMachine.physicalSlotLabel,
            location: targetMachine.location,
            qtyBeforeMl: qtyBefore,
            qtyAfterMl: nextMl,
        });

        appendCatalogAuditLog(
            action === "SPRAY_TEST" ? "PRODUCT_LIVE_SPRAY_DISPENSED" : "PRODUCT_SLOT_REPLENISHED",
            selectedProduct.id,
            {
                productName: selectedProduct.name,
                kioskCode: targetMachine.kioskCode,
                slotLabel: targetMachine.physicalSlotLabel,
                qtyBeforeMl: qtyBefore,
                qtyAfterMl: nextMl,
                amountVnd: action === "SPRAY_TEST" ? selectedProduct.pricePerSpray : 0,
            }
        );

        if (action === "SPRAY_TEST") {
            showToast(
                lang === "en"
                    ? `Dispensed 1 spray (-0.12ml) on ${targetMachine.kioskCode} (${targetMachine.physicalSlotLabel}): ${nextMl}ml remaining. Updated Analytics (+${selectedProduct.pricePerSpray.toLocaleString("vi-VN")} VND) & Admin Transactions!`
                    : `Đã xịt 1 lần (-0.12ml) tại trạm ${targetMachine.kioskCode} (${targetMachine.physicalSlotLabel}): còn ${nextMl}ml. Đã cập nhật Biểu đồ (+${selectedProduct.pricePerSpray.toLocaleString("vi-VN")}đ) & Bảng Giao Dịch Admin!`
            );
        } else {
            showToast(
                lang === "en"
                    ? `Replenished ${targetMachine.kioskCode} (${targetMachine.physicalSlotLabel}) to ${selectedProduct.bottleVolumeMl}ml (100%) and synchronized to Kiosk!`
                    : `Đã nạp đầy bình tại trạm ${targetMachine.kioskCode} (${targetMachine.physicalSlotLabel}) lên ${selectedProduct.bottleVolumeMl}ml (100%) và đồng bộ sang Kiosk!`
            );
        }
    };

    const openAddModal = () => {
        if (roleScope === "VIEWER_READONLY") return;
        setEditingProduct(null);
        setFormError("");
        setName("");
        setBrand(roleScope === "BRAND_ADMIN_CHANEL" ? "Chanel" : "Dior");
        setCategory("Unisex");
        setConcentration("Eau de Parfum");
        setBottleVolumeMl(100);
        setFamily("Woody Aromatic");
        setNotes("");
        setDescription("");
        setPricePerSpray(15000);
        setStatus("ACTIVE");
        setImage("/images/dior-sauvage.jpg");
        setIsPresetImageOpen(false);
        setIsModalOpen(true);
    };

    const openEditModal = (product: PerfumeProductItem, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (roleScope === "VIEWER_READONLY") return;
        setEditingProduct(product);
        setFormError("");
        setName(product.name);
        setBrand(product.brand);
        setCategory(product.category);
        setConcentration(product.concentration);
        setBottleVolumeMl(product.bottleVolumeMl);
        setFamily(product.family);
        setNotes(product.notes);
        setDescription(product.description);
        setPricePerSpray(product.pricePerSpray);
        setStatus(product.status);
        setImage(product.image);
        setIsPresetImageOpen(false);
        setIsModalOpen(true);
    };

    const handleSubmitProduct = (e: React.FormEvent): void => {
        e.preventDefault();
        setFormError("");

        const trimmedName = name.trim();
        if (!trimmedName || !brand.trim()) {
            setFormError(
                lang === "en"
                    ? "Perfume Name and Brand are required fields."
                    : "Tên nước hoa và Thương hiệu là các trường bắt buộc."
            );
            return;
        }
        if (pricePerSpray <= 0 || bottleVolumeMl <= 0) {
            setFormError(
                lang === "en"
                    ? "Price per spray and bottle volume must be greater than 0."
                    : "Giá mỗi lần xịt và dung tích chai phải lớn hơn 0."
            );
            return;
        }

        const isDuplicate = products.some(
            (p) =>
                isExactName(p.name, trimmedName) &&
                isExactName(p.brand, brand) &&
                p.id !== editingProduct?.id
        );
        if (isDuplicate) {
            setFormError(
                lang === "en"
                    ? `Duplicate product: "${trimmedName}" already exists under ${brand}.`
                    : `Trùng lặp sản phẩm: "${trimmedName}" đã tồn tại dưới thương hiệu ${brand}.`
            );
            return;
        }

        if (editingProduct) {
            const oldName = editingProduct.name;
            const updated: PerfumeProductItem = {
                ...editingProduct,
                name: trimmedName,
                brand: brand.trim(),
                category,
                concentration,
                bottleVolumeMl,
                family: family || "Luxury Olfactory",
                notes: notes || "Bergamot, Amber, Musk",
                description: description || "Curated luxury formulation.",
                pricePerSpray,
                retail10ml: pricePerSpray * 30,
                status,
                image,
            };
            const updatedList = products.map((p) =>
                p.id === editingProduct.id ? updated : p
            );
            persistProductsAndPropagateAll(updatedList, undefined, {
                oldName,
                newName: updated.name,
                newBrand: updated.brand,
                newPrice: updated.pricePerSpray,
                newCapacity: updated.bottleVolumeMl,
                newStatus: updated.status,
            });
            appendCatalogAuditLog("PRODUCT_UPDATED", updated.id, {
                oldName,
                name: updated.name,
                pricePerSpray: updated.pricePerSpray,
                status: updated.status,
            });
            showToast(
                lang === "en"
                    ? `Updated "${updated.name}" (${updated.pricePerSpray.toLocaleString("vi-VN")} VND/spray • ${updated.status}) and synchronized across all stations.`
                    : `Đã cập nhật "${updated.name}" (${updated.pricePerSpray.toLocaleString("vi-VN")}đ/lần xịt • ${updated.status}) và đồng bộ toàn hệ thống.`
            );
        } else {
            const maxSlot = products.reduce((max, p) => Math.max(max, p.slotNumber || 0), 34);
            const nextSlot = maxSlot + 1;
            const defaultKiosk = FLEET_KIOSK_OPTIONS[0]; // demo-device
            const newProd: PerfumeProductItem = {
                id: `PROD-CUSTOM-${Date.now()}`,
                skuCode: `SKU-NEW-${nextSlot}`,
                slotNumber: nextSlot,
                name: trimmedName,
                brand: brand.trim(),
                category,
                concentration,
                bottleVolumeMl,
                family: family || "Luxury Olfactory",
                notes: notes || "Bergamot, Amber, Musk",
                description:
                    description ||
                    "Newly onboarded fragrance in the ScentStation catalog.",
                pricePerSpray,
                retail10ml: pricePerSpray * 30,
                fullBottlePrice: pricePerSpray * 240,
                rating: 5.0,
                baseSessions30d: 0,
                liveExtraSprays: 0,
                samplingSessions30d: 0,
                status,
                image: image || "/images/dior-sauvage.jpg",
                warehouseHub: "WH-SGN-CENTRAL",
                warehouseReserveBottles: 3,
                batchNumber: `BATCH-2026-N${nextSlot}`,
                assignedMachines: [
                    {
                        kioskCode: defaultKiosk.code,
                        location: defaultKiosk.location,
                        slotNumber: 4,
                        physicalSlotLabel: "Slot 04",
                        machineStatus: "ONLINE",
                        bottleCode: `BTL-2026-${nextSlot}04`,
                        remainingVolumeMl: bottleVolumeMl,
                        thresholdPct: 15,
                        lastRefilled: new Date().toISOString().split("T")[0],
                    },
                ],
            };

            // BR2: Tự động gỡ sản phẩm cũ đang chiếm Slot 04 của demo-device để nhường chỗ cho sản phẩm mới
            const updatedList = [
                newProd,
                ...products.map((p) => ({
                    ...p,
                    assignedMachines: p.assignedMachines.filter(
                        (am) =>
                            !(
                                am.kioskCode.toLowerCase() === defaultKiosk.code.toLowerCase() &&
                                am.slotNumber === 4
                            )
                    ),
                })),
            ];

            // Đồng bộ ngay sản phẩm mới vào Slot 04 của demo-device trong MACHINES_STORAGE_KEY
            try {
                const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawMachines) {
                    const parsedMachines = JSON.parse(rawMachines);
                    if (Array.isArray(parsedMachines)) {
                        const updatedFleet = parsedMachines.map((m: any) => {
                            if (String(m.code || "").toLowerCase() !== defaultKiosk.code.toLowerCase()) {
                                return m;
                            }
                            const nextSlots = Array.isArray(m.slots) ? [...m.slots] : [];
                            nextSlots[3] = {
                                slotLabel: "Slot 04",
                                fragranceName: newProd.name,
                                brand: newProd.brand,
                                remainingMl: newProd.bottleVolumeMl,
                                capacityMl: newProd.bottleVolumeMl,
                                lowStockThresholdMl: 15,
                                productStatus: newProd.status,
                                pricePerSpray: newProd.pricePerSpray,
                            };
                            return { ...m, slots: nextSlots };
                        });
                        localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(updatedFleet));
                    }
                }
            } catch {
                // Safe fallback
            }

            persistProductsAndPropagateAll(updatedList);
            appendCatalogAuditLog("PRODUCT_CREATED", newProd.id, {
                skuCode: newProd.skuCode,
                name: newProd.name,
                pricePerSpray: newProd.pricePerSpray,
            });
            showToast(
                lang === "en"
                    ? `Created "${newProd.name}" (${newProd.skuCode}), installed in ${defaultKiosk.code} (Slot 04) & synced to Storefront and Kiosk!`
                    : `Đã tạo mới "${newProd.name}" (${newProd.skuCode}), lắp vào ${defaultKiosk.code} (Slot 04) và đồng bộ ngay lên Trang chủ & Kiosk!`
            );
        }
        setIsModalOpen(false);
    };

    const renderStatusBadge = (st: PerfumeProductItem["status"]) => {
        if (st === "ACTIVE") {
            return (
                <span className={styles.badgeActive}>
                    <CheckCircle2 size={13} /> ACTIVE
                </span>
            );
        }
        if (st === "DRAFT") {
            return (
                <span className={styles.badgeDraft}>
                    <AlertCircle size={13} /> DRAFT
                </span>
            );
        }
        return (
            <span className={styles.badgeInactive}>
                <AlertCircle size={13} /> INACTIVE
            </span>
        );
    };

    const selectedAssignKioskMeta =
        FLEET_KIOSK_OPTIONS.find((k) => k.code === assignKioskCode) || FLEET_KIOSK_OPTIONS[0];

    const selectedPresetImageMeta =
        INITIAL_34_PRODUCTS.find((p) => p.image === image) || INITIAL_34_PRODUCTS[0];

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <input
                type="file"
                ref={imageFileInputRef}
                onChange={handleUploadBottleImage}
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
            />

            <div className={styles.workspaceInner}>
                <div className={styles.heroBannerCard}>
                    <div className={styles.header}>
                        <div>
                            <span className={styles.eyebrowTag}>
                                {lang === "en"
                                    ? "OLFACTORY CATALOG & STATION DEPLOYMENT"
                                    : "QUẢN LÝ DANH MỤC MÙI HƯƠNG & PHÂN BỔ TRẠM"}
                            </span>
                            <h1 className={styles.title}>
                                {lang === "en"
                                    ? "Perfume Product Catalog"
                                    : "Danh Mục Nước Hoa Hệ Thống"}
                            </h1>
                            <p className={styles.subtitle}>
                                {lang === "en"
                                    ? `Centralized curation of ${scopedProducts.length} signature fragrances across ${
                                        roleScope === "BRAND_ADMIN_CHANEL"
                                            ? "Chanel Maison Workspace"
                                            : `${uniqueBrands.length} partner luxury houses`
                                    }, calibrated spray pricing, and per-station bottle volumes.`
                                    : `Quản lý tập trung ${scopedProducts.length} mùi hương thuộc ${
                                        roleScope === "BRAND_ADMIN_CHANEL"
                                            ? "không gian thương hiệu Chanel"
                                            : `${uniqueBrands.length} nhà hương đối tác`
                                    }, thiết lập giá mỗi lần xịt và theo dõi dung tích từng trạm.`}
                            </p>
                        </div>

                        <div className={styles.headerActionGroup}>
                            <button
                                type="button"
                                onClick={handleToggleLanguage}
                                className={styles.resetButton}
                            >
                                <Globe size={14} color="#D4AF37" />
                                <span>{lang === "en" ? "EN" : "VI"}</span>
                            </button>

                            {roleScope !== "VIEWER_READONLY" && (
                                <button onClick={openAddModal} className={styles.addButton}>
                                    <Plus size={16} />
                                    <span>{lang === "en" ? "Add Fragrance" : "Thêm Mùi Hương"}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.summaryGrid}>
                        <div
                            onClick={() => setSummaryFilter("ALL")}
                            className={`${styles.summaryCard} ${
                                summaryFilter === "ALL" ? styles.summaryCardActive : ""
                            }`}
                        >
                            <div className={styles.summaryLabel}>
                                {lang === "en" ? "Total Fragrances" : "Tổng Số Mùi Hương"}
                            </div>
                            <div className={styles.summaryValue} translate="no">
                                {summaryMetrics.total} SKUs
                            </div>
                            <div className={styles.summaryHint} style={{ color: "#F5E6AD" }}>
                                {lang === "en"
                                    ? `Across ${uniqueBrands.length} luxury maisons`
                                    : `Thuộc ${uniqueBrands.length} thương hiệu cao cấp`}
                            </div>
                        </div>

                        <div
                            onClick={() => setSummaryFilter("ACTIVE")}
                            className={`${styles.summaryCard} ${
                                summaryFilter === "ACTIVE" ? styles.summaryCardActive : ""
                            }`}
                        >
                            <div className={styles.summaryLabel}>
                                {lang === "en" ? "Active Catalog" : "Đang Phục Vụ"}
                            </div>
                            <div className={styles.summaryValue} style={{ color: "#34D399" }} translate="no">
                                {summaryMetrics.active} Active
                            </div>
                            <div className={styles.summaryHint}>
                                {lang === "en"
                                    ? "Authorized for customer sampling"
                                    : "Hiển thị công khai trên Kiosk"}
                            </div>
                        </div>

                        <div
                            onClick={() => setSummaryFilter("AVAILABLE_MACHINES")}
                            className={`${styles.summaryCard} ${
                                summaryFilter === "AVAILABLE_MACHINES"
                                    ? styles.summaryCardActive
                                    : ""
                            }`}
                        >
                            <div className={styles.summaryLabel}>
                                {lang === "en" ? "Installed in Stations" : "Đã Lắp Vào Trạm"}
                            </div>
                            <div className={styles.summaryValue} style={{ color: "#60A5FA" }} translate="no">
                                {summaryMetrics.availableForMachines} Assigned
                            </div>
                            <div className={styles.summaryHint}>
                                {lang === "en"
                                    ? "Active in physical chamber slots"
                                    : "Đang gắn trong khoang chứa vật lý"}
                            </div>
                        </div>

                        <div
                            onClick={() => setSummaryFilter("MOST_POPULAR")}
                            className={`${styles.summaryCard} ${
                                summaryFilter === "MOST_POPULAR" ? styles.summaryCardActive : ""
                            }`}
                        >
                            <div className={styles.summaryLabel}>
                                {lang === "en" ? "Most Sampled (30 Days)" : "Được Thử Nhiều Nhất"}
                            </div>
                            <div className={styles.summaryHighlightName} translate="no">
                                {summaryMetrics.topProduct?.name || "N/A"}
                            </div>
                            <div className={styles.summaryHint} style={{ color: "#34D399", fontWeight: 700 }} translate="no">
                                {summaryMetrics.topProduct?.samplingSessions30d || 0}{" "}
                                {lang === "en" ? "verified sprays" : "lượt xịt xác thực"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.filterBar}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={
                                lang === "en"
                                    ? "Search fragrance name, SKU, maison (Chanel, Creed, Dior), or notes..."
                                    : "Tìm theo tên nước hoa, mã SKU, thương hiệu hoặc nốt hương..."
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className={styles.clearSearchBtn}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {roleScope !== "BRAND_ADMIN_CHANEL" && (
                        <div className={styles.customDropdownWrap} ref={brandMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsBrandDropdownOpen((prev) => !prev)}
                                className={`${styles.customDropdownTrigger} ${
                                    selectedBrand !== "ALL" ? styles.customDropdownTriggerActive : ""
                                }`}
                            >
                                <SlidersHorizontal size={14} color="#D4AF37" />
                                <span>
                                    {selectedBrand === "ALL"
                                        ? lang === "en"
                                            ? `All Maisons (${uniqueBrands.length})`
                                            : `Tất Cả Hãng (${uniqueBrands.length})`
                                        : selectedBrand}
                                </span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>

                            {isBrandDropdownOpen && (
                                <div className={styles.customDropdownMenu}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedBrand("ALL");
                                            setIsBrandDropdownOpen(false);
                                        }}
                                        className={`${styles.customDropdownItem} ${
                                            selectedBrand === "ALL" ? styles.customDropdownItemActive : ""
                                        }`}
                                    >
                                        <span>
                                            {lang === "en"
                                                ? `All Maisons (${uniqueBrands.length})`
                                                : `Tất Cả Hãng (${uniqueBrands.length})`}
                                        </span>
                                        {selectedBrand === "ALL" && <Check size={14} color="#D4AF37" />}
                                    </button>
                                    {uniqueBrands.map((b) => {
                                        const count = scopedProducts.filter((p) => p.brand === b).length;
                                        return (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBrand(b);
                                                    setIsBrandDropdownOpen(false);
                                                }}
                                                className={`${styles.customDropdownItem} ${
                                                    selectedBrand === b ? styles.customDropdownItemActive : ""
                                                }`}
                                            >
                                                <span>{b}</span>
                                                <span className={styles.dropdownCountBadge}>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.pillGroup} translate="no">
                        {(["ALL", "Niche", "Men", "Women", "Unisex"] as const).map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`${styles.filterPillBtn} ${
                                    selectedCategory === cat ? styles.filterPillBtnActive : ""
                                }`}
                            >
                                {cat === "ALL" ? (lang === "en" ? "All Scents" : "Tất cả") : cat}
                            </button>
                        ))}
                    </div>

                    <div className={styles.pillGroup} translate="no">
                        {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setSelectedStatus(st)}
                                className={`${styles.filterPillBtn} ${
                                    selectedStatus === st ? styles.filterPillBtnActive : ""
                                }`}
                            >
                                {st === "ALL"
                                    ? lang === "en"
                                        ? "All Status"
                                        : "Mọi TT"
                                    : st === "ACTIVE"
                                        ? "Active"
                                        : "Inactive"}
                            </button>
                        ))}
                    </div>

                    {(searchQuery ||
                        selectedBrand !== "ALL" ||
                        selectedCategory !== "ALL" ||
                        selectedStatus !== "ALL" ||
                        summaryFilter !== "ALL") && (
                        <button onClick={handleResetFilters} className={styles.resetButton}>
                            <RefreshCw size={13} />
                            <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                        </button>
                    )}

                    <div className={styles.viewToggleBox}>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={`${styles.viewToggleBtn} ${
                                viewMode === "table" ? styles.viewToggleBtnActive : ""
                            }`}
                            title="Table View"
                        >
                            <ListIcon size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={`${styles.viewToggleBtn} ${
                                viewMode === "grid" ? styles.viewToggleBtnActive : ""
                            }`}
                            title="Card Grid View"
                        >
                            <LayoutGrid size={15} />
                        </button>
                    </div>
                </div>

                {filteredProducts.length > 0 ? (
                    viewMode === "grid" ? (
                        <div className={styles.cardsGridContainer}>
                            {filteredProducts.map((product, index) => {
                                const machineInfo = product.assignedMachines[0];
                                const lowestLevel = machineInfo?.remainingVolumeMl ?? 0;
                                const pctRemaining = Math.round(
                                    (lowestLevel / product.bottleVolumeMl) * 100
                                );
                                const isLowStock =
                                    product.assignedMachines.length > 0 &&
                                    pctRemaining <= (machineInfo.thresholdPct || 15);

                                return (
                                    <div
                                        key={`${product.id || product.skuCode}-${index}`}
                                        onClick={() => {
                                            setSelectedProductId(product.id);
                                            setSelectedStationIndex(0);
                                            setDrawerTab("overview");
                                        }}
                                        className={`${styles.luxuryProductCard} ${
                                            selectedProduct?.id === product.id
                                                ? styles.luxuryProductCardActive
                                                : ""
                                        }`}
                                    >
                                        <div>
                                            <div className={styles.cardHeaderRow}>
                                                <div className={styles.productImageCell}>
                                                    <div className={styles.imagePlaceholder}>
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                display: "block",
                                                            }}
                                                        />
                                                    </div>
                                                    <div translate="no" style={{ minWidth: 0, flex: 1 }}>
                                                        <span className={styles.cardBrandEyebrow}>
                                                            {product.brand} • {product.category}
                                                        </span>
                                                        <h3 className={styles.cardProductTitle}>
                                                            {product.name}
                                                        </h3>
                                                        <span className={styles.cardSkuMeta}>
                                                            {product.skuCode} • {product.bottleVolumeMl}ml •{" "}
                                                            <strong style={{ color: "#34D399" }}>
                                                                {product.samplingSessions30d} sprays
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontSize: "0.72rem",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                <span style={{ color: "#CBD5E1" }}>
                                                    {machineInfo
                                                        ? `${machineInfo.kioskCode} (${machineInfo.physicalSlotLabel})`
                                                        : "Warehouse Reserve"}
                                                    {product.assignedMachines.length > 1 && (
                                                        <span style={{ color: "#F5E6AD", marginLeft: "4px" }}>
                                                            +{product.assignedMachines.length - 1}
                                                        </span>
                                                    )}
                                                </span>
                                                <strong
                                                    style={{
                                                        color: isLowStock ? "#F87171" : "#34D399",
                                                    }}
                                                >
                                                    {machineInfo
                                                        ? `${lowestLevel}ml / ${product.bottleVolumeMl}ml (${pctRemaining}%)`
                                                        : `${product.warehouseReserveBottles} bottles`}
                                                </strong>
                                            </div>

                                            <div className={styles.volumeTrack}>
                                                <div
                                                    className={styles.volumeFill}
                                                    style={{
                                                        width: `${machineInfo ? pctRemaining : 100}%`,
                                                        background: isLowStock
                                                            ? "#F87171"
                                                            : "linear-gradient(90deg, #D4AF37, #34D399)",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.cardFooterRow} translate="no">
                                            <div>
                                                <span style={{ color: "#94A3B8", fontSize: "0.66rem", display: "block", fontFamily: "Space Grotesk, monospace" }}>
                                                    1 CALIBRATED SPRAY (0.12ML)
                                                </span>
                                                <strong
                                                    style={{
                                                        color: "#F5E6AD",
                                                        fontFamily: "Space Grotesk, monospace",
                                                        fontSize: "0.95rem",
                                                    }}
                                                >
                                                    {product.pricePerSpray.toLocaleString("vi-VN")} VND
                                                </strong>
                                            </div>
                                            <div
                                                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {renderStatusBadge(product.status)}
                                                {roleScope !== "VIEWER_READONLY" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => toggleStatus(product.id, e)}
                                                            className={styles.actionButton}
                                                            title={
                                                                product.status === "ACTIVE"
                                                                    ? "Hide from Kiosks (Set INACTIVE)"
                                                                    : "Show on Kiosks (Set ACTIVE)"
                                                            }
                                                        >
                                                            {product.status === "ACTIVE" ? (
                                                                <EyeOff size={13} color="#FBBF24" />
                                                            ) : (
                                                                <Eye size={13} color="#34D399" />
                                                            )}
                                                        </button>
                                                        {product.slotNumber > 34 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteCustomProduct(product, e)}
                                                                className={styles.actionButton}
                                                                title="Delete Custom Fragrance"
                                                            >
                                                                <Trash2 size={13} color="#F87171" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
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
                                        <th>{lang === "en" ? "FRAGRANCE & BOTTLE" : "SẢN PHẨM & DUNG TÍCH"}</th>
                                        <th>{lang === "en" ? "MAISON & LINE" : "THƯƠNG HIỆU"}</th>
                                        <th>{lang === "en" ? "OLFACTORY PROFILE" : "NHÓM HƯƠNG & NỐT HƯƠNG"}</th>
                                        <th>{lang === "en" ? "SPRAY PRICING" : "ĐỊNH GIÁ XỊT"}</th>
                                        <th>{lang === "en" ? "30D VOLUME" : "SẢN LƯỢNG 30D"}</th>
                                        <th>{lang === "en" ? "STATION DEPLOYMENT" : "TRẠM LẮP ĐẶT"}</th>
                                        <th style={{ textAlign: "right" }}>{lang === "en" ? "MANAGE" : "THAO TÁC"}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredProducts.map((product, index) => {
                                        const isSelected = selectedProduct?.id === product.id;
                                        const machineInfo = product.assignedMachines[0];
                                        const pctRemaining = machineInfo
                                            ? Math.round(
                                                (machineInfo.remainingVolumeMl /
                                                    product.bottleVolumeMl) *
                                                100
                                            )
                                            : 0;
                                        const isLowStock =
                                            machineInfo &&
                                            pctRemaining <= (machineInfo.thresholdPct || 15);

                                        return (
                                            <tr
                                                key={`${product.id || product.skuCode}-${index}`}
                                                className={`${styles.tableRow} ${
                                                    isSelected ? styles.tableRowSelected : ""
                                                }`}
                                                onClick={() => {
                                                    setSelectedProductId(product.id);
                                                    setSelectedStationIndex(0);
                                                    setDrawerTab("overview");
                                                }}
                                            >
                                                <td className={styles.tableCell}>
                                                    <div className={styles.productImageCell}>
                                                        <div className={styles.imagePlaceholder}>
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit: "cover",
                                                                    display: "block",
                                                                }}
                                                            />
                                                        </div>
                                                        <div translate="no" style={{ minWidth: 0 }}>
                                                            <div className={styles.tableTitleLine}>
                                                                    <span className={styles.slotPillTag}>
                                                                        {machineInfo
                                                                            ? machineInfo.physicalSlotLabel.toUpperCase()
                                                                            : `SKU #${String(product.slotNumber).padStart(2, "0")}`}
                                                                    </span>
                                                                <strong className={styles.tableProductName}>
                                                                    {product.name}
                                                                </strong>
                                                            </div>
                                                            <div className={styles.tableSubMeta}>
                                                                {product.skuCode} • {product.concentration} •{" "}
                                                                <strong style={{ color: "#E2E8F0" }}>
                                                                    {product.bottleVolumeMl} ml
                                                                </strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td translate="no" className={styles.tableCell} style={{ whiteSpace: "nowrap" }}>
                                                    <div style={{ color: "#FFF", fontWeight: 700, fontSize: "0.86rem" }}>
                                                        {product.brand}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "0.72rem",
                                                            color: "#D4AF37",
                                                            marginTop: "0.18rem",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {product.category}
                                                    </div>
                                                </td>

                                                <td
                                                    className={styles.tableCell}
                                                    style={{ maxWidth: "250px" }}
                                                >
                                                    <div
                                                        style={{
                                                            color: "#F5E6AD",
                                                            fontWeight: 600,
                                                            fontSize: "0.82rem",
                                                        }}
                                                    >
                                                        {product.family}
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: "#94A3B8",
                                                            fontSize: "0.73rem",
                                                            marginTop: "0.2rem",
                                                            lineHeight: 1.4,
                                                        }}
                                                    >
                                                        ✦ {product.notes}
                                                    </div>
                                                </td>

                                                <td translate="no" className={styles.tableCell} style={{ whiteSpace: "nowrap" }}>
                                                    <div
                                                        style={{
                                                            color: "#F5E6AD",
                                                            fontWeight: 700,
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontSize: "0.92rem",
                                                        }}
                                                    >
                                                        {product.pricePerSpray.toLocaleString("vi-VN")} VND
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "0.7rem",
                                                            color: "#94A3B8",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            marginTop: "2px",
                                                        }}
                                                    >
                                                        10ml: {product.retail10ml.toLocaleString("vi-VN")}đ
                                                    </div>
                                                </td>

                                                <td translate="no" className={styles.tableCell} style={{ whiteSpace: "nowrap" }}>
                                                    <div
                                                        style={{
                                                            color: "#FFF",
                                                            fontWeight: 700,
                                                            fontFamily: "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        ★ {Number(product.rating ?? 4.9).toFixed(1)}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "0.72rem",
                                                            color: "#34D399",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontWeight: 600,
                                                            marginTop: "2px",
                                                        }}
                                                    >
                                                        {product.samplingSessions30d} sprays
                                                        {product.liveExtraSprays > 0 && (
                                                            <span style={{ color: "#F5E6AD", marginLeft: "4px" }}>
                                                                    (+{product.liveExtraSprays})
                                                                </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td translate="no" className={styles.tableCell} style={{ whiteSpace: "nowrap" }}>
                                                    {renderStatusBadge(product.status)}
                                                    <div
                                                        style={{
                                                            fontSize: "0.71rem",
                                                            color: isLowStock ? "#F87171" : "#34D399",
                                                            marginTop: "0.28rem",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {machineInfo
                                                            ? `${machineInfo.kioskCode} (${machineInfo.physicalSlotLabel}): ${machineInfo.remainingVolumeMl}ml (${pctRemaining}%)`
                                                            : "Warehouse Only"}
                                                        {product.assignedMachines.length > 1 && (
                                                            <span style={{ color: "#F5E6AD", marginLeft: "4px" }}>
                                                                    +{product.assignedMachines.length - 1}
                                                                </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td
                                                    className={styles.tableCell}
                                                    style={{ textAlign: "right", whiteSpace: "nowrap" }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div
                                                        style={{
                                                            display: "inline-flex",
                                                            gap: "0.4rem",
                                                        }}
                                                    >
                                                        {roleScope !== "VIEWER_READONLY" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => openEditModal(product, e)}
                                                                    title="Edit Fragrance"
                                                                    className={styles.actionButton}
                                                                >
                                                                    <Edit3 size={14} color="#F5E6AD" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => toggleStatus(product.id, e)}
                                                                    title={
                                                                        product.status === "ACTIVE"
                                                                            ? "Hide from Kiosks (Set INACTIVE)"
                                                                            : "Show on Kiosks (Set ACTIVE)"
                                                                    }
                                                                    className={styles.actionButton}
                                                                >
                                                                    {product.status === "ACTIVE" ? (
                                                                        <EyeOff size={14} color="#FBBF24" />
                                                                    ) : (
                                                                        <Eye size={14} color="#34D399" />
                                                                    )}
                                                                </button>
                                                                {product.slotNumber > 34 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) =>
                                                                            handleDeleteCustomProduct(product, e)
                                                                        }
                                                                        title="Delete Custom Fragrance"
                                                                        className={styles.actionButton}
                                                                    >
                                                                        <Trash2 size={14} color="#F87171" />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
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
                    <div className={styles.emptyCatalogCard}>
                        <h3
                            style={{
                                fontFamily: "Bodoni Moda, Georgia, serif",
                                fontSize: "1.45rem",
                                color: "#F5E6AD",
                                margin: "0 0 0.4rem 0",
                            }}
                        >
                            {lang === "en" ? "No Matching Fragrances Found" : "Không Tìm Thấy Mùi Hương Phù Hợp"}
                        </h3>
                        <p
                            style={{
                                fontSize: "0.85rem",
                                color: "#94A3B8",
                                marginBottom: "1.2rem",
                            }}
                        >
                            {lang === "en"
                                ? "No perfumes match your current search keyword or active filter criteria."
                                : "Không có mùi hương nào khớp với từ khóa hoặc bộ lọc hiện tại."}
                        </p>
                        <button onClick={handleResetFilters} className={styles.addButton}>
                            <RefreshCw size={14} />
                            <span>{lang === "en" ? "Reset All Filters" : "Xóa Bộ Lọc"}</span>
                        </button>
                    </div>
                )}
            </div>

            {selectedProduct && (() => {
                const activeStationSlot =
                    selectedProduct.assignedMachines[
                        Math.min(
                            selectedStationIndex,
                            Math.max(0, selectedProduct.assignedMachines.length - 1)
                        )
                        ];

                return (
                    <div
                        className={styles.drawerOverlay}
                        onClick={() => setSelectedProductId(null)}
                    >
                        <div
                            className={styles.drawerPanel}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.drawerHeader}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: "1rem",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div className={styles.productImageCell}>
                                        <div className={styles.imagePlaceholderLarge}>
                                            <img
                                                src={selectedProduct.image}
                                                alt={selectedProduct.name}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                            />
                                        </div>
                                        <div translate="no">
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.55rem",
                                                    marginBottom: "0.25rem",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: "0.68rem",
                                                        fontWeight: 700,
                                                        color: "#D4AF37",
                                                        letterSpacing: "0.14em",
                                                        textTransform: "uppercase",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {selectedProduct.brand} • {selectedProduct.skuCode} •{" "}
                                                    {selectedProduct.category}
                                                </span>
                                                {renderStatusBadge(selectedProduct.status)}
                                            </div>
                                            <h2
                                                style={{
                                                    margin: 0,
                                                    fontSize: "1.5rem",
                                                    color: "#FFF",
                                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                                }}
                                            >
                                                {selectedProduct.name}
                                            </h2>
                                            <div
                                                style={{
                                                    fontSize: "0.78rem",
                                                    color: "#94A3B8",
                                                    marginTop: "0.2rem",
                                                    fontFamily: "Space Grotesk, monospace",
                                                }}
                                            >
                                                {selectedProduct.concentration} • Bottle:{" "}
                                                <strong style={{ color: "#F5E6AD" }}>
                                                    {selectedProduct.bottleVolumeMl} ml
                                                </strong>{" "}
                                                • Spray Price:{" "}
                                                <strong style={{ color: "#34D399" }}>
                                                    {selectedProduct.pricePerSpray.toLocaleString("vi-VN")}{" "}
                                                    VND
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "0.5rem",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setPreviewProduct(selectedProduct)}
                                            className={styles.resetButton}
                                            style={{
                                                padding: "0.55rem 0.95rem",
                                                fontSize: "0.76rem",
                                            }}
                                        >
                                            <Smartphone size={14} />
                                            <span>
                                                {lang === "en" ? "Preview on Kiosk" : "Xem Thử Trên Kiosk"}
                                            </span>
                                        </button>
                                        {roleScope !== "VIEWER_READONLY" && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(selectedProduct)}
                                                    className={styles.addButton}
                                                    style={{
                                                        padding: "0.55rem 1rem",
                                                        fontSize: "0.76rem",
                                                    }}
                                                >
                                                    <Edit3 size={14} />
                                                    <span>{lang === "en" ? "Edit" : "Chỉnh Sửa"}</span>
                                                </button>
                                                {selectedProduct.slotNumber > 34 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) =>
                                                            handleDeleteCustomProduct(selectedProduct, e)
                                                        }
                                                        className={styles.actionButton}
                                                        title="Delete Custom Fragrance"
                                                    >
                                                        <Trash2 size={15} color="#F87171" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProductId(null)}
                                            className={styles.actionButton}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.drawerTabsBar}>
                                {[
                                    {
                                        id: "overview",
                                        label: lang === "en" ? "Overview & Notes" : "Tổng Quan & Nốt Hương",
                                        icon: Sparkles,
                                    },
                                    {
                                        id: "machines",
                                        label:
                                            lang === "en"
                                                ? `Station Deployment (${selectedProduct.assignedMachines.length})`
                                                : `Trạm Lắp Đặt (${selectedProduct.assignedMachines.length})`,
                                        icon: Cpu,
                                    },
                                    {
                                        id: "inventory",
                                        label: lang === "en" ? "Cartridge Inventory" : "Tồn Kho & Định Lượng",
                                        icon: Droplets,
                                    },
                                    {
                                        id: "analytics",
                                        label: lang === "en" ? "Performance Analytics" : "Phân Tích Doanh Thu",
                                        icon: BarChart3,
                                    },
                                ].map((tItem) => {
                                    const IconComp = tItem.icon;
                                    return (
                                        <button
                                            key={tItem.id}
                                            type="button"
                                            onClick={() => setDrawerTab(tItem.id as DrawerTab)}
                                            className={`${styles.drawerTabBtn} ${
                                                drawerTab === tItem.id ? styles.drawerTabBtnActive : ""
                                            }`}
                                        >
                                            <IconComp size={15} />
                                            <span>{tItem.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={styles.drawerBody}>
                                {drawerTab === "overview" && (() => {
                                    const noteParts = selectedProduct.notes
                                        .split(",")
                                        .map((n) => n.trim())
                                        .filter(Boolean);
                                    const topNoteStr = noteParts[0] || "Calabrian Bergamot";
                                    const heartNoteStr =
                                        noteParts.slice(1, Math.max(2, noteParts.length - 1)).join(", ") ||
                                        "Floral & Aromatic Heart";
                                    const baseNoteStr =
                                        noteParts[noteParts.length - 1] || "Precious Woods & Musk";

                                    return (
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
                                                            fontSize: "0.69rem",
                                                            color: "#D4AF37",
                                                            textTransform: "uppercase",
                                                            fontWeight: 700,
                                                            letterSpacing: "0.12em",
                                                            fontFamily: "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        {lang === "en"
                                                            ? "Olfactory Composition & Maison Story"
                                                            : "Câu Chuyện Chế Tác & Cấu Trúc Mùi Hương"}
                                                    </span>
                                                    <span
                                                        translate="no"
                                                        style={{
                                                            fontSize: "0.72rem",
                                                            color: "#F5E6AD",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        ★ {Number(selectedProduct.rating ?? 4.9).toFixed(1)} / 5.0 •{" "}
                                                        {selectedProduct.samplingSessions30d} Verified Sprays
                                                    </span>
                                                </div>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        color: "#E2E8F0",
                                                        lineHeight: 1.62,
                                                        fontSize: "0.88rem",
                                                    }}
                                                >
                                                    {selectedProduct.description}
                                                </p>
                                            </div>

                                            <div className={styles.glassCard}>
                                                <div
                                                    style={{
                                                        fontSize: "0.69rem",
                                                        color: "#94A3B8",
                                                        textTransform: "uppercase",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.1em",
                                                        marginBottom: "0.75rem",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {lang === "en"
                                                        ? `Olfactory Pyramid — ${selectedProduct.family}`
                                                        : `Tháp Hương 3 Tầng — ${selectedProduct.family}`}
                                                </div>
                                                <div className={styles.pyramidGrid}>
                                                    <div className={styles.pyramidStepCard}>
                                                        <span
                                                            style={{
                                                                fontSize: "0.64rem",
                                                                color: "#D4AF37",
                                                                fontFamily: "Space Grotesk, monospace",
                                                                fontWeight: 700,
                                                                display: "block",
                                                                marginBottom: "0.25rem",
                                                            }}
                                                        >
                                                            01 • TOP NOTES (HƯƠNG ĐẦU)
                                                        </span>
                                                        <strong style={{ color: "#FFF", fontSize: "0.86rem" }}>
                                                            ✦ {topNoteStr}
                                                        </strong>
                                                    </div>
                                                    <div className={styles.pyramidStepCard}>
                                                        <span
                                                            style={{
                                                                fontSize: "0.64rem",
                                                                color: "#F5E6AD",
                                                                fontFamily: "Space Grotesk, monospace",
                                                                fontWeight: 700,
                                                                display: "block",
                                                                marginBottom: "0.25rem",
                                                            }}
                                                        >
                                                            02 • HEART NOTES (HƯƠNG GIỮA)
                                                        </span>
                                                        <strong style={{ color: "#FFF", fontSize: "0.86rem" }}>
                                                            ✦ {heartNoteStr}
                                                        </strong>
                                                    </div>
                                                    <div className={styles.pyramidStepCard}>
                                                        <span
                                                            style={{
                                                                fontSize: "0.64rem",
                                                                color: "#34D399",
                                                                fontFamily: "Space Grotesk, monospace",
                                                                fontWeight: 700,
                                                                display: "block",
                                                                marginBottom: "0.25rem",
                                                            }}
                                                        >
                                                            03 • BASE NOTES (HƯƠNG CUỐI)
                                                        </span>
                                                        <strong style={{ color: "#FFF", fontSize: "0.86rem" }}>
                                                            ✦ {baseNoteStr}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.specsFourGrid} translate="no">
                                                <div className={styles.specMiniBox}>
                                                    <span
                                                        style={{
                                                            fontSize: "0.64rem",
                                                            color: "#94A3B8",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            display: "block",
                                                        }}
                                                    >
                                                        1 CALIBRATED SPRAY
                                                    </span>
                                                    <strong
                                                        style={{
                                                            fontSize: "1.02rem",
                                                            color: "#F5E6AD",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            display: "block",
                                                            marginTop: "0.2rem",
                                                        }}
                                                    >
                                                        {selectedProduct.pricePerSpray.toLocaleString("vi-VN")} VND
                                                    </strong>
                                                    <span style={{ fontSize: "0.68rem", color: "#34D399" }}>
                                                        0.12ml • 1,200ms Pulse
                                                    </span>
                                                </div>

                                                <div className={styles.specMiniBox}>
                                                    <span
                                                        style={{
                                                            fontSize: "0.64rem",
                                                            color: "#94A3B8",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            display: "block",
                                                        }}
                                                    >
                                                        10ML BOUTIQUE DECANT
                                                    </span>
                                                    <strong
                                                        style={{
                                                            fontSize: "1.02rem",
                                                            color: "#FFF",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            display: "block",
                                                            marginTop: "0.2rem",
                                                        }}
                                                    >
                                                        {selectedProduct.retail10ml.toLocaleString("vi-VN")} VND
                                                    </strong>
                                                    <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                                        ~83 Calibrated Sprays
                                                    </span>
                                                </div>

                                                <div className={styles.specMiniBox}>
                                                    <span
                                                        style={{
                                                            fontSize: "0.64rem",
                                                            color: "#94A3B8",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            display: "block",
                                                        }}
                                                    >
                                                        FULL BOTTLE ({selectedProduct.bottleVolumeMl}ML)
                                                    </span>
                                                    <strong
                                                        style={{
                                                            fontSize: "1.02rem",
                                                            color: "#FFF",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            display: "block",
                                                            marginTop: "0.2rem",
                                                        }}
                                                    >
                                                        {selectedProduct.fullBottlePrice.toLocaleString("vi-VN")} VND
                                                    </strong>
                                                    <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                                        {selectedProduct.concentration}
                                                    </span>
                                                </div>

                                                <div className={styles.specMiniBox}>
                                                    <span
                                                        style={{
                                                            fontSize: "0.64rem",
                                                            color: "#94A3B8",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            display: "block",
                                                        }}
                                                    >
                                                        ACTIVE STATION SLOT
                                                    </span>
                                                    <strong
                                                        style={{
                                                            fontSize: "0.96rem",
                                                            color: activeStationSlot ? "#34D399" : "#FBBF24",
                                                            fontFamily: "Space Grotesk, monospace",
                                                            display: "block",
                                                            marginTop: "0.2rem",
                                                        }}
                                                    >
                                                        {activeStationSlot
                                                            ? `${activeStationSlot.kioskCode} (${activeStationSlot.remainingVolumeMl}ml)`
                                                            : "Warehouse Reserve"}
                                                    </strong>
                                                    <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                                        Hub: {selectedProduct.warehouseHub}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {drawerTab === "machines" && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "1rem",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: "0.75rem",
                                            }}
                                        >
                                            <span style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                                                {lang === "en" ? (
                                                    <>
                                                        Boutique stations actively configured with{" "}
                                                        <strong style={{ color: "#FFF" }}>
                                                            {selectedProduct.name}
                                                        </strong>
                                                        :
                                                    </>
                                                ) : (
                                                    <>
                                                        Các trạm Kiosk đang lắp đặt bình{" "}
                                                        <strong style={{ color: "#FFF" }}>
                                                            {selectedProduct.name}
                                                        </strong>
                                                        :
                                                    </>
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => router.push("/machines")}
                                                className={styles.actionButton}
                                                style={{ color: "#F5E6AD", fontSize: "0.76rem" }}
                                            >
                                                <Cpu size={14} />
                                                <span>
                                                    {lang === "en" ? "Open Fleet Management" : "Mở Quản Trị Đội Máy"}
                                                </span>
                                            </button>
                                        </div>

                                        {selectedProduct.assignedMachines.length > 0 ? (
                                            selectedProduct.assignedMachines.map((m) => (
                                                <div
                                                    key={`${m.kioskCode}-${m.slotNumber}`}
                                                    className={styles.glassCard}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() =>
                                                        router.push(
                                                            `/kiosk/${encodeURIComponent(m.kioskCode)}`
                                                        )
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            flexWrap: "wrap",
                                                            gap: "0.5rem",
                                                        }}
                                                    >
                                                        <div>
                                                            <div
                                                                translate="no"
                                                                style={{
                                                                    fontWeight: 700,
                                                                    color: "#F5E6AD",
                                                                    fontFamily: "Space Grotesk, monospace",
                                                                    fontSize: "0.95rem",
                                                                }}
                                                            >
                                                                {m.kioskCode} • {m.physicalSlotLabel.toUpperCase()}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: "0.8rem",
                                                                    color: "#CBD5E1",
                                                                    marginTop: "0.2rem",
                                                                }}
                                                            >
                                                                {m.location} • Cartridge:{" "}
                                                                <strong translate="no">{m.bottleCode}</strong> (
                                                                <strong
                                                                    translate="no"
                                                                    style={{
                                                                        color:
                                                                            m.remainingVolumeMl < 0.12
                                                                                ? "#F87171"
                                                                                : "#34D399",
                                                                    }}
                                                                >
                                                                    {m.remainingVolumeMl} ml remaining
                                                                </strong>
                                                                )
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
                                                                    m.machineStatus === "ONLINE"
                                                                        ? styles.badgeActive
                                                                        : styles.badgeInactive
                                                                }
                                                            >
                                                                {m.machineStatus}
                                                            </span>
                                                            {roleScope !== "VIEWER_READONLY" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) =>
                                                                        handleUnassignMachineSlot(m.kioskCode, e)
                                                                    }
                                                                    className={styles.actionButton}
                                                                    title="Remove from this station"
                                                                >
                                                                    <Trash2 size={14} color="#F87171" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div
                                                className={styles.glassCard}
                                                style={{ textAlign: "center", color: "#94A3B8" }}
                                            >
                                                {lang === "en"
                                                    ? "This fragrance is currently in warehouse reserve only. Assign it to a station slot below."
                                                    : "Mùi hương này hiện đang lưu kho dự trữ. Hãy gán vào khoang máy Kiosk bên dưới."}
                                            </div>
                                        )}

                                        {roleScope !== "VIEWER_READONLY" && (
                                            <div
                                                className={styles.glassCard}
                                                style={{
                                                    border: "1px solid rgba(212,175,55,0.38)",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: "0.78rem",
                                                        color: "#F5E6AD",
                                                        fontWeight: 700,
                                                        marginBottom: "0.65rem",
                                                    }}
                                                >
                                                    {lang === "en"
                                                        ? `Deploy ${selectedProduct.name} to a Station Chamber Slot (Slot 01 – Slot 04)`
                                                        : `Lắp đặt ${selectedProduct.name} vào Khoang Trạm Kiosk (Slot 01 – Slot 04)`}
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "0.65rem",
                                                        flexWrap: "wrap",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div
                                                        className={styles.customDropdownWrap}
                                                        ref={assignKioskMenuRef}
                                                        style={{ flex: 1.5, minWidth: "240px" }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsAssignKioskOpen((prev) => !prev)}
                                                            className={styles.customDropdownTrigger}
                                                            style={{ width: "100%", justifyContent: "space-between" }}
                                                        >
                                                            <span
                                                                style={{
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                {selectedAssignKioskMeta.code} — {selectedAssignKioskMeta.location} ({selectedAssignKioskMeta.status})
                                                            </span>
                                                            <ChevronDown size={14} color="#D4AF37" />
                                                        </button>

                                                        {isAssignKioskOpen && (
                                                            <div
                                                                className={styles.customDropdownMenu}
                                                                style={{ width: "100%" }}
                                                            >
                                                                {FLEET_KIOSK_OPTIONS.map((k) => (
                                                                    <button
                                                                        key={k.code}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setAssignKioskCode(k.code);
                                                                            setIsAssignKioskOpen(false);
                                                                        }}
                                                                        className={`${styles.customDropdownItem} ${
                                                                            assignKioskCode === k.code
                                                                                ? styles.customDropdownItemActive
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        <span>
                                                                            {k.code} — {k.location}
                                                                        </span>
                                                                        <span className={styles.dropdownCountBadge}>
                                                                            {k.status}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className={styles.pillGroup} translate="no">
                                                        {[1, 2, 3, 4].map((slotNum) => (
                                                            <button
                                                                key={slotNum}
                                                                type="button"
                                                                onClick={() => setAssignSlotNum(slotNum)}
                                                                className={`${styles.filterPillBtn} ${
                                                                    assignSlotNum === slotNum
                                                                        ? styles.filterPillBtnActive
                                                                        : ""
                                                                }`}
                                                            >
                                                                Slot 0{slotNum}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={handleAssignProductToKiosk}
                                                        className={styles.addButton}
                                                        style={{
                                                            padding: "0.62rem 1.15rem",
                                                            fontSize: "0.78rem",
                                                        }}
                                                    >
                                                        <Plus size={14} />
                                                        <span>
                                                            {lang === "en" ? "Install in Slot" : "Lắp Vào Khoang"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {drawerTab === "inventory" && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "1rem",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <span style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                                                {lang === "en"
                                                    ? "Select an installed station below to inspect, dispense (-0.12ml), or replenish (100%) its cartridge:"
                                                    : "Chọn trạm bên dưới để kiểm tra, xịt thử (-0.12ml) hoặc nạp đầy 100% cho bình tại trạm đó:"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => router.push("/inventory")}
                                                className={styles.resetButton}
                                                style={{
                                                    padding: "0.5rem 0.9rem",
                                                    fontSize: "0.76rem",
                                                }}
                                            >
                                                <Warehouse size={14} />
                                                <span>
                                                    {lang === "en" ? "Open Inventory Ledger" : "Mở Quản Trị Kho"}
                                                </span>
                                            </button>
                                        </div>

                                        {selectedProduct.assignedMachines.length > 0 && (
                                            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                                                {selectedProduct.assignedMachines.map((m, idx) => (
                                                    <button
                                                        key={`${m.kioskCode}-${m.slotNumber}`}
                                                        type="button"
                                                        onClick={() => setSelectedStationIndex(idx)}
                                                        className={styles.resetButton}
                                                        style={{
                                                            padding: "0.45rem 0.9rem",
                                                            fontSize: "0.75rem",
                                                            borderColor:
                                                                selectedStationIndex === idx
                                                                    ? "#D4AF37"
                                                                    : "rgba(255,255,255,0.12)",
                                                            background:
                                                                selectedStationIndex === idx
                                                                    ? "rgba(212,175,55,0.22)"
                                                                    : "rgba(16,16,26,0.8)",
                                                            color:
                                                                selectedStationIndex === idx
                                                                    ? "#F5E6AD"
                                                                    : "#CBD5E1",
                                                        }}
                                                    >
                                                        {m.kioskCode} • {m.physicalSlotLabel} ({m.remainingVolumeMl}ml)
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "1rem",
                                            }}
                                        >
                                            <div className={styles.glassCard}>
                                                <div
                                                    style={{
                                                        fontSize: "0.7rem",
                                                        color: "#94A3B8",
                                                        textTransform: "uppercase",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {lang === "en"
                                                        ? "Commercial Bottle Capacity"
                                                        : "Dung Tích Chai Nguyên Bản"}
                                                </div>
                                                <div
                                                    translate="no"
                                                    style={{
                                                        fontSize: "1.4rem",
                                                        fontWeight: 700,
                                                        color: "#FFF",
                                                        fontFamily: "Space Grotesk, monospace",
                                                        marginTop: "0.25rem",
                                                    }}
                                                >
                                                    {selectedProduct.bottleVolumeMl} ml / Bottle
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#60A5FA",
                                                        marginTop: "0.2rem",
                                                    }}
                                                >
                                                    <Warehouse
                                                        size={13}
                                                        style={{ display: "inline", marginRight: "4px" }}
                                                    />
                                                    {lang === "en" ? "Warehouse Reserve" : "Dự trữ kho"} (
                                                    {selectedProduct.warehouseHub}):{" "}
                                                    <strong>
                                                        {selectedProduct.warehouseReserveBottles} Bottles (
                                                        {selectedProduct.warehouseReserveBottles *
                                                            selectedProduct.bottleVolumeMl}{" "}
                                                        ml)
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className={styles.glassCard}>
                                                <div
                                                    style={{
                                                        fontSize: "0.7rem",
                                                        color: "#94A3B8",
                                                        textTransform: "uppercase",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    {lang === "en"
                                                        ? "Installed Cartridge Remaining Level"
                                                        : "Dung Tích Còn Lại Trong Khoang"}
                                                </div>
                                                <div
                                                    translate="no"
                                                    style={{
                                                        fontSize: "1.4rem",
                                                        fontWeight: 700,
                                                        color:
                                                            (activeStationSlot?.remainingVolumeMl ?? 0) < 0.12
                                                                ? "#F87171"
                                                                : "#34D399",
                                                        fontFamily: "Space Grotesk, monospace",
                                                        marginTop: "0.25rem",
                                                    }}
                                                >
                                                    {activeStationSlot?.remainingVolumeMl ?? 0} ml /{" "}
                                                    {selectedProduct.bottleVolumeMl} ml
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        color: "#F5E6AD",
                                                        marginTop: "0.2rem",
                                                        fontFamily: "Space Grotesk, monospace",
                                                    }}
                                                >
                                                    Station: {activeStationSlot?.kioskCode || "N/A"} (
                                                    {activeStationSlot?.physicalSlotLabel || "N/A"}) • Batch:{" "}
                                                    {selectedProduct.batchNumber}
                                                </div>
                                            </div>
                                        </div>

                                        {roleScope !== "VIEWER_READONLY" && activeStationSlot ? (
                                            <div
                                                className={styles.glassCard}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    flexWrap: "wrap",
                                                    gap: "0.75rem",
                                                    border: "1px solid rgba(212,175,55,0.38)",
                                                }}
                                            >
                                                <div>
                                                    <div
                                                        style={{
                                                            fontWeight: 700,
                                                            color: "#FFF",
                                                            fontSize: "0.88rem",
                                                        }}
                                                    >
                                                        {lang === "en"
                                                            ? `Station Cartridge Control — ${activeStationSlot.kioskCode} (${activeStationSlot.physicalSlotLabel})`
                                                            : `Điều Khiển Bình Chứa Tại Trạm — ${activeStationSlot.kioskCode} (${activeStationSlot.physicalSlotLabel})`}
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                                        {lang === "en" ? (
                                                            <>
                                                                Deducts -0.12ml (logs transaction & updates Analytics) or replenishes 100% strictly on{" "}
                                                                <strong style={{ color: "#F5E6AD" }}>
                                                                    {activeStationSlot.kioskCode}
                                                                </strong>
                                                                .
                                                            </>
                                                        ) : (
                                                            <>
                                                                Trừ -0.12ml (ghi nhận giao dịch & cập nhật Biểu đồ) hoặc nạp đầy 100% đúng trên trạm{" "}
                                                                <strong style={{ color: "#F5E6AD" }}>
                                                                    {activeStationSlot.kioskCode}
                                                                </strong>
                                                                .
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", gap: "0.6rem" }}>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            activeStationSlot.remainingVolumeMl < 0.12 ||
                                                            activeStationSlot.machineStatus !== "ONLINE"
                                                        }
                                                        onClick={() =>
                                                            handleDrawerInventoryAction(
                                                                "SPRAY_TEST",
                                                                selectedStationIndex
                                                            )
                                                        }
                                                        className={styles.resetButton}
                                                        style={{
                                                            padding: "0.55rem 0.95rem",
                                                            fontSize: "0.76rem",
                                                            opacity:
                                                                activeStationSlot.remainingVolumeMl < 0.12 ||
                                                                activeStationSlot.machineStatus !== "ONLINE"
                                                                    ? 0.45
                                                                    : 1,
                                                        }}
                                                    >
                                                        <Zap size={14} color="#D4AF37" />
                                                        <span>
                                                            {activeStationSlot.remainingVolumeMl < 0.12
                                                                ? "Empty (0ml)"
                                                                : `Dispense 1 Spray (-0.12ml)`}
                                                        </span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDrawerInventoryAction(
                                                                "REFILL_FULL",
                                                                selectedStationIndex
                                                            )
                                                        }
                                                        className={styles.addButton}
                                                        style={{
                                                            padding: "0.55rem 1rem",
                                                            fontSize: "0.76rem",
                                                        }}
                                                    >
                                                        <span>
                                                            {lang === "en"
                                                                ? "Replenish Cartridge (100%)"
                                                                : "Nạp Đầy Khoang (100%)"}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={styles.glassCard}
                                                style={{
                                                    border: "1px dashed rgba(212,175,55,0.35)",
                                                    fontSize: "0.78rem",
                                                    color: "#F5E6AD",
                                                }}
                                            >
                                                {roleScope === "VIEWER_READONLY" ? (
                                                    <span>
                                                        <strong>Read-Only Account:</strong> Cartridge dispensing and warehouse replenishment controls are disabled for Viewer accounts.
                                                    </span>
                                                ) : (
                                                    <span>
                                                        Assign this fragrance to a station slot in the Station Deployment tab to enable cartridge controls.
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {drawerTab === "analytics" &&
                                    (() => {
                                        const baseSprays = selectedProduct.baseSessions30d || 300;
                                        const liveExtra = selectedProduct.liveExtraSprays || 0;
                                        const mult =
                                            analyticsRange === "7D"
                                                ? 0.25
                                                : analyticsRange === "30D"
                                                    ? 1
                                                    : 8.5;
                                        const periodSprays = Math.round(baseSprays * mult) + liveExtra;
                                        const periodRevenue =
                                            periodSprays * selectedProduct.pricePerSpray;

                                        const weights = [0.14, 0.16, 0.15, 0.18, 0.19, 0.18];
                                        const labels =
                                            analyticsRange === "7D"
                                                ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Today (Live)"]
                                                : analyticsRange === "30D"
                                                    ? ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Current (Live)"]
                                                    : ["Q1", "Q2", "Q3", "Oct", "Nov", "YTD (Live)"];

                                        const colCounts = weights.map((w, idx) => {
                                            const baseCol = Math.max(1, Math.round(baseSprays * mult * w));
                                            return idx === 5 ? baseCol + liveExtra : baseCol;
                                        });
                                        const maxCol = Math.max(...colCounts, 1);

                                        return (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "1.1rem",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                        gap: "0.5rem",
                                                    }}
                                                >
                                                    <span style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
                                                        {lang === "en"
                                                            ? "Real-time sampling volume and recognized spray revenue:"
                                                            : "Sản lượng lượt xịt thời gian thực và doanh thu ghi nhận:"}
                                                    </span>
                                                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                                                        {roleScope !== "VIEWER_READONLY" && activeStationSlot && (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    activeStationSlot.remainingVolumeMl < 0.12 ||
                                                                    activeStationSlot.machineStatus !== "ONLINE"
                                                                }
                                                                onClick={() =>
                                                                    handleDrawerInventoryAction(
                                                                        "SPRAY_TEST",
                                                                        selectedStationIndex
                                                                    )
                                                                }
                                                                className={styles.resetButton}
                                                                style={{ padding: "0.32rem 0.75rem", fontSize: "0.72rem" }}
                                                            >
                                                                <Zap size={13} color="#D4AF37" />
                                                                <span>
                                                                    {lang === "en"
                                                                        ? `+1 Live Spray (${activeStationSlot.kioskCode})`
                                                                        : `+1 Xịt & Đơn Hàng (${activeStationSlot.kioskCode})`}
                                                                </span>
                                                            </button>
                                                        )}

                                                        {activeStationSlot && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/kiosk/${encodeURIComponent(
                                                                            activeStationSlot.kioskCode
                                                                        )}`
                                                                    )
                                                                }
                                                                className={styles.resetButton}
                                                                style={{ padding: "0.32rem 0.75rem", fontSize: "0.72rem" }}
                                                            >
                                                                <Smartphone size={13} color="#34D399" />
                                                                <span>
                                                                    {lang === "en"
                                                                        ? `Open Kiosk`
                                                                        : `Mở Kiosk`}
                                                                </span>
                                                            </button>
                                                        )}

                                                        {(["7D", "30D", "YTD"] as const).map((r) => (
                                                            <button
                                                                key={r}
                                                                type="button"
                                                                onClick={() => setAnalyticsRange(r)}
                                                                style={{
                                                                    background:
                                                                        analyticsRange === r
                                                                            ? "rgba(212,175,55,0.22)"
                                                                            : "rgba(255,255,255,0.04)",
                                                                    border:
                                                                        analyticsRange === r
                                                                            ? "1px solid #D4AF37"
                                                                            : "1px solid rgba(255,255,255,0.1)",
                                                                    color:
                                                                        analyticsRange === r ? "#F5E6AD" : "#94A3B8",
                                                                    padding: "0.3rem 0.7rem",
                                                                    borderRadius: "8px",
                                                                    fontSize: "0.72rem",
                                                                    fontWeight: 700,
                                                                    fontFamily: "Space Grotesk, monospace",
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                {r}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "1fr 1fr",
                                                        gap: "1rem",
                                                    }}
                                                >
                                                    <div className={styles.glassCard} translate="no">
                                                        <div
                                                            style={{
                                                                fontSize: "0.7rem",
                                                                color: "#94A3B8",
                                                                textTransform: "uppercase",
                                                                fontFamily: "Space Grotesk, monospace",
                                                            }}
                                                        >
                                                            Sampling Volume ({analyticsRange})
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "1.5rem",
                                                                fontWeight: 700,
                                                                color: "#34D399",
                                                                fontFamily: "Space Grotesk, monospace",
                                                                marginTop: "0.25rem",
                                                            }}
                                                        >
                                                            {periodSprays.toLocaleString("vi-VN")} Sprays
                                                            {liveExtra > 0 && (
                                                                <span
                                                                    style={{
                                                                        fontSize: "0.76rem",
                                                                        color: "#F5E6AD",
                                                                        marginLeft: "8px",
                                                                    }}
                                                                >
                                                                    (+{liveExtra} live)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={styles.glassCard} translate="no">
                                                        <div
                                                            style={{
                                                                fontSize: "0.7rem",
                                                                color: "#94A3B8",
                                                                textTransform: "uppercase",
                                                                fontFamily: "Space Grotesk, monospace",
                                                            }}
                                                        >
                                                            Recognized Revenue ({analyticsRange})
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "1.5rem",
                                                                fontWeight: 700,
                                                                color: "#F5E6AD",
                                                                fontFamily: "Space Grotesk, monospace",
                                                                marginTop: "0.25rem",
                                                            }}
                                                        >
                                                            {periodRevenue.toLocaleString("vi-VN")} VND
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={styles.glassCard}>
                                                    <div
                                                        style={{
                                                            fontSize: "0.75rem",
                                                            fontWeight: 700,
                                                            color: "#F5E6AD",
                                                            textTransform: "uppercase",
                                                            fontFamily: "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        Sampling & Revenue Distribution ({analyticsRange})
                                                    </div>
                                                    <div className={styles.analyticsChartBox} translate="no">
                                                        {labels.map((lb, idx) => {
                                                            const spCount = colCounts[idx];
                                                            const barPct = Math.max(
                                                                22,
                                                                Math.min(94, Math.round((spCount / maxCol) * 90))
                                                            );
                                                            return (
                                                                <div
                                                                    key={lb}
                                                                    className={styles.analyticsBarCol}
                                                                    title={`${lb}: ${spCount} sprays (${(
                                                                        spCount * selectedProduct.pricePerSpray
                                                                    ).toLocaleString("vi-VN")} VND)`}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            fontSize: "0.66rem",
                                                                            color: idx === 5 && liveExtra > 0 ? "#34D399" : "#F5E6AD",
                                                                            fontWeight: idx === 5 ? 700 : 600,
                                                                            fontFamily: "Space Grotesk, monospace",
                                                                            marginBottom: "4px",
                                                                        }}
                                                                    >
                                                                        {spCount} sp
                                                                    </span>
                                                                    <div
                                                                        className={styles.analyticsBarFill}
                                                                        style={{
                                                                            height: `${barPct}%`,
                                                                            background:
                                                                                idx === 5 && liveExtra > 0
                                                                                    ? "linear-gradient(180deg, #34D399 0%, #D4AF37 70%, rgba(52,211,153,0.2) 100%)"
                                                                                    : undefined,
                                                                        }}
                                                                    />
                                                                    <span
                                                                        style={{
                                                                            fontSize: "0.68rem",
                                                                            color: idx === 5 ? "#F8FAFC" : "#94A3B8",
                                                                            marginTop: "6px",
                                                                            fontFamily: "Space Grotesk, monospace",
                                                                        }}
                                                                    >
                                                                        {lb}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {previewProduct && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setPreviewProduct(null)}
                >
                    <div
                        className={styles.modalContent}
                        style={{ maxWidth: "31rem", textAlign: "center" }}
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
                            <span
                                style={{
                                    fontSize: "0.7rem",
                                    color: "#D4AF37",
                                    fontWeight: 700,
                                    letterSpacing: "0.14em",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                CUSTOMER KIOSK DISPLAY PREVIEW
                            </span>
                            <button
                                onClick={() => setPreviewProduct(null)}
                                className={styles.actionButton}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {(previewProduct.status !== "ACTIVE" ||
                            previewProduct.assignedMachines.length === 0) && (
                            <div
                                style={{
                                    padding: "0.75rem",
                                    borderRadius: "10px",
                                    background: "rgba(251,191,36,0.14)",
                                    border: "1px solid rgba(251,191,36,0.4)",
                                    color: "#FBBF24",
                                    fontSize: "0.78rem",
                                    marginBottom: "1rem",
                                    textAlign: "left",
                                }}
                            >
                                <strong>Visibility Notice:</strong> This product is currently{" "}
                                <u>{previewProduct.status}</u> or not installed in an online station slot, so it is locked on public Kiosk menus.
                            </div>
                        )}

                        <div
                            style={{
                                background: "#08080E",
                                border: "1px solid rgba(212,175,55,0.4)",
                                borderRadius: "16px",
                                padding: "1.25rem",
                                textAlign: "left",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div className={styles.imagePlaceholderLarge}>
                                    <img
                                        src={previewProduct.image}
                                        alt={previewProduct.name}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                </div>
                                <div translate="no">
                                    <div
                                        style={{
                                            fontSize: "0.68rem",
                                            color: "#D4AF37",
                                            fontWeight: 700,
                                            letterSpacing: "0.12em",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {previewProduct.brand} •{" "}
                                        {previewProduct.assignedMachines[0]?.kioskCode || "demo-device"}{" "}
                                        ({previewProduct.assignedMachines[0]?.physicalSlotLabel || "Slot 01"})
                                    </div>
                                    <h3
                                        style={{
                                            margin: "0.2rem 0",
                                            fontSize: "1.2rem",
                                            color: "#FFF",
                                            fontFamily: "Bodoni Moda, Georgia, serif",
                                        }}
                                    >
                                        {previewProduct.name}
                                    </h3>
                                    <div
                                        style={{
                                            fontSize: "0.75rem",
                                            color: previewProduct.status === "ACTIVE" ? "#34D399" : "#F87171",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {previewProduct.status === "ACTIVE"
                                            ? `${previewProduct.assignedMachines[0]?.remainingVolumeMl ?? 75}ml / ${previewProduct.bottleVolumeMl}ml available`
                                            : `Status: ${previewProduct.status} (Locked on Kiosk)`}
                                    </div>
                                </div>
                            </div>

                            <p
                                style={{
                                    fontSize: "0.8rem",
                                    color: "#94A3B8",
                                    marginBottom: "1rem",
                                }}
                            >
                                ✦ {previewProduct.notes}
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    paddingTop: "0.85rem",
                                    borderTop: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <div translate="no">
                                    <span
                                        style={{
                                            fontSize: "0.65rem",
                                            color: "#94A3B8",
                                            display: "block",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        1 CALIBRATED SPRAY (0.12ML)
                                    </span>
                                    <strong
                                        style={{
                                            fontSize: "1.1rem",
                                            color: "#F5E6AD",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {previewProduct.pricePerSpray.toLocaleString("vi-VN")} VND
                                    </strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/kiosk/${encodeURIComponent(
                                                previewProduct.assignedMachines[0]?.kioskCode ||
                                                "demo-device"
                                            )}`
                                        )
                                    }
                                    className={styles.addButton}
                                    style={{
                                        padding: "0.6rem 1.1rem",
                                        fontSize: "0.76rem",
                                    }}
                                >
                                    <Smartphone size={14} />
                                    <span>
                                        Open Station (
                                        {previewProduct.assignedMachines[0]?.kioskCode ||
                                            "demo-device"}
                                        )
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className={styles.modalContent}
                        style={{ maxHeight: "88vh", overflowY: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1.15rem",
                            }}
                        >
                            <h2 className={styles.modalTitle} style={{ margin: 0 }}>
                                {editingProduct
                                    ? `Edit Fragrance: ${editingProduct.name}`
                                    : "Add New Fragrance to Catalog"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={styles.actionButton}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {editingProduct && (
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    padding: "0.75rem 1rem",
                                    borderRadius: "10px",
                                    background: "rgba(212,175,55,0.08)",
                                    border: "1px dashed rgba(212,175,55,0.35)",
                                    fontSize: "0.76rem",
                                    color: "#F5E6AD",
                                }}
                            >
                                <strong>Price & Status Synchronization:</strong> Updating the spray price or setting status to INACTIVE applies immediately across Flagship Storefront and Kiosk screens; existing open orders retain their locked price snapshot.
                            </div>
                        )}

                        {formError && (
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    padding: "0.75rem 1rem",
                                    borderRadius: "10px",
                                    background: "rgba(248,113,113,0.14)",
                                    border: "1px solid rgba(248,113,113,0.4)",
                                    color: "#F87171",
                                    fontSize: "0.8rem",
                                }}
                            >
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitProduct}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                    padding: "0.85rem 1rem",
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "12px",
                                    width: "100%",
                                }}
                            >
                                <div className={styles.imagePlaceholder}>
                                    <img
                                        src={image}
                                        alt="Preview"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            color: "#94A3B8",
                                            marginBottom: "0.35rem",
                                            fontWeight: 700,
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Product Bottle Image (Upload or Select Preset)
                                    </label>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.6rem",
                                            width: "100%",
                                        }}
                                    >
                                        <div
                                            className={styles.customDropdownWrap}
                                            ref={presetImageMenuRef}
                                            style={{ flex: 1, minWidth: 0 }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setIsPresetImageOpen((prev) => !prev)}
                                                className={styles.customDropdownTrigger}
                                                style={{ width: "100%", justifyContent: "space-between" }}
                                            >
                                                <span
                                                    style={{
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {selectedPresetImageMeta.name} ({selectedPresetImageMeta.brand})
                                                </span>
                                                <ChevronDown size={14} color="#D4AF37" />
                                            </button>

                                            {isPresetImageOpen && (
                                                <div
                                                    className={styles.customDropdownMenu}
                                                    style={{ width: "100%" }}
                                                >
                                                    {INITIAL_34_PRODUCTS.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setImage(p.image);
                                                                setIsPresetImageOpen(false);
                                                            }}
                                                            className={`${styles.customDropdownItem} ${
                                                                image === p.image
                                                                    ? styles.customDropdownItemActive
                                                                    : ""
                                                            }`}
                                                        >
                                                            <span>{p.name}</span>
                                                            <span className={styles.dropdownCountBadge}>
                                                                {p.brand}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => imageFileInputRef.current?.click()}
                                            className={styles.resetButton}
                                            style={{
                                                padding: "0.62rem 1rem",
                                                fontSize: "0.76rem",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Upload size={14} />
                                            <span>Upload</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

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
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Perfume Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Tom Ford Oud Wood"
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Brand *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={roleScope === "BRAND_ADMIN_CHANEL"}
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
                                    />
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.2fr 0.9fr 0.9fr",
                                    gap: "1rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Category *
                                    </label>
                                    <div className={styles.pillGroup} style={{ width: "100%", justifyContent: "space-between" }} translate="no">
                                        {(["Men", "Women", "Unisex", "Niche"] as const).map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setCategory(cat)}
                                                className={`${styles.filterPillBtn} ${
                                                    category === cat ? styles.filterPillBtnActive : ""
                                                }`}
                                                style={{ flex: 1, padding: "0.45rem 0.4rem" }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Bottle Volume (ml) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={10}
                                        value={bottleVolumeMl}
                                        onChange={(e) => setBottleVolumeMl(Number(e.target.value))}
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Price / Spray (VND) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={1000}
                                        step={500}
                                        value={pricePerSpray}
                                        onChange={(e) => setPricePerSpray(Number(e.target.value))}
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
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
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Fragrance Family
                                    </label>
                                    <input
                                        type="text"
                                        value={family}
                                        onChange={(e) => setFamily(e.target.value)}
                                        placeholder="e.g. Woody Aromatic"
                                        className={styles.searchInput}
                                        style={{ padding: "0.7rem 0.95rem" }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "#CBD5E1",
                                            marginBottom: "0.35rem",
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Product Status
                                    </label>
                                    <div className={styles.pillGroup} style={{ width: "100%", justifyContent: "space-between" }} translate="no">
                                        {(["ACTIVE", "INACTIVE", "DRAFT"] as const).map((st) => (
                                            <button
                                                key={st}
                                                type="button"
                                                onClick={() => setStatus(st)}
                                                className={`${styles.filterPillBtn} ${
                                                    status === st ? styles.filterPillBtnActive : ""
                                                }`}
                                                style={{ flex: 1, padding: "0.45rem 0.5rem" }}
                                            >
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: "#CBD5E1",
                                        marginBottom: "0.35rem",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Fragrance Notes
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Bergamot, Sichuan Pepper, Ambroxan"
                                    className={styles.searchInput}
                                    style={{ padding: "0.7rem 0.95rem" }}
                                />
                            </div>

                            <div style={{ marginBottom: "1.25rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: "#CBD5E1",
                                        marginBottom: "0.35rem",
                                        textTransform: "uppercase",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={styles.searchInput}
                                    style={{
                                        padding: "0.7rem 0.95rem",
                                        resize: "none",
                                    }}
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
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.resetButton}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles.addButton}>
                                    {editingProduct ? "Save Changes" : "Save Fragrance"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div className={styles.toastBanner}>
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}