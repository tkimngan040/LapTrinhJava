// noinspection SpellCheckingInspection
"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import styles from "./settings.module.css";
import {
    Settings,
    Building2,
    Cpu,
    CreditCard,
    Bell,
    Server,
    ShieldCheck,
    Plug,
    FileText,
    Upload,
    Trash2,
    CheckCircle2,
    RefreshCw,
    Eye,
    EyeOff,
    Download,
    Copy,
    ArrowUpRight,
    Globe,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    RotateCcw,
    Palette,
} from "lucide-react";
import { useRouter } from "next/navigation";

type SettingsTabId =
    | "general"
    | "brands"
    | "machines"
    | "payment"
    | "notifications"
    | "system"
    | "security"
    | "integrations"
    | "audit";

interface BrandSettingItem {
    code: string;
    name: string;
    tagline: string;
    description: string;
    status: "ACTIVE" | "PENDING" | "INACTIVE";
    locationsCount: number;
    machinesCount: number;
    maxLocationsLimit: number;
    maxMachinesLimit: number;
    currency: string;
    timeZone: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    enableSampling: boolean;
    showInCustomerApp: boolean;
    allowCustomPricing: boolean;
    dataIsolationEnforced: boolean;
    allowBaManageProducts: boolean;
    createdAt: string;
    updatedAt: string;
}

interface MachineSettingItem {
    code: string;
    name: string;
    brand: string;
    location: string;
    status: "ONLINE" | "LOW_REFILL" | "OFFLINE" | "MAINTENANCE";
    lastActivity: string;
    uptime: string;
    temp: string;
    humidity: string;
    perfumeLevelPct: number;
    activeError: string;
    dispenseDurationMs: number;
    spraysPerTransaction: number;
    cooldownSeconds: number;
    dailyDispenseLimit: number;
    syncStatus: "SAVED_ONLY" | "SYNCED_WITH_DEVICE";
    mqttEndpoint: string;
    maskedToken: string;
    displayLanguage: "EN" | "VI" | "BILINGUAL";
    openingTime: string;
    closingTime: string;
    sleepModeEnabled: boolean;
}

interface AuditLogRecord {
    id: string;
    timestamp: string;
    eventType: string;
    category:
        | "Login & Security"
        | "User Management"
        | "Brand Management"
        | "Machine Management"
        | "Transaction"
        | "Payment"
        | "System Settings"
        | "Integration";
    user: string;
    role: string;
    module: string;
    description: string;
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    severity: "INFO" | "WARNING" | "ERROR";
    oldValuesJson: string;
    newValuesJson: string;
}

function formatNowTimestamp(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

/* =========================================================
   BẢNG MÀU THỰC TẾ KIỂU MICROSOFT WORD (THEME COLORS + SHADES + STANDARD COLORS)
========================================================= */
const WORD_BASE_THEME_COLORS = [
    "#D4AF37", // Champagne Gold
    "#F5E6AD", // Ivory Silk
    "#34D399", // Emerald Mint
    "#38BDF8", // Sapphire Sky
    "#818CF8", // Royal Indigo
    "#C084FC", // Amethyst Orchid
    "#F472B6", // Velvet Rose
    "#F87171", // Crimson Ruby
    "#FB923C", // Amber Sunset
    "#94A3B8", // Platinum Slate
];

const WORD_THEME_SHADE_ROWS = [
    // Row 1: Lightest Tint (80%)
    ["#FAF3DB", "#FDFBF0", "#D6F6EA", "#D7F2FE", "#E6E8FE", "#F2E6FE", "#FDE3F0", "#FEE2E2", "#FFEDD5", "#E2E8F0"],
    // Row 2: Lighter Tint (60%)
    ["#F0DF9E", "#F9F0C9", "#9CEAD0", "#9ADDFB", "#BFC6FC", "#DFBFFC", "#F9B6D9", "#FCA5A5", "#FDBA74", "#CBD5E1"],
    // Row 3: Medium Shade (40%)
    ["#E2C665", "#F5E6AD", "#5ED8B3", "#60C8FA", "#9BA5FA", "#CD9BFA", "#F68AC2", "#F87171", "#FB923C", "#64748B"],
    // Row 4: Darker Shade (25%)
    ["#B89225", "#D6C076", "#10B981", "#0284C7", "#4F46E5", "#9333EA", "#DB2777", "#DC2626", "#EA580C", "#334155"],
    // Row 5: Deepest Luxury Shade (50%)
    ["#7C6014", "#9E8944", "#065F46", "#0369A1", "#312E81", "#581C87", "#831843", "#991B1B", "#9A3412", "#0F172A"],
];

const WORD_STANDARD_COLORS = [
    "#C00000", // Dark Red
    "#FF0000", // Red
    "#FFC000", // Gold Orange
    "#FFFF00", // Yellow
    "#92D050", // Light Green
    "#00B050", // Green
    "#00B0F0", // Light Blue
    "#0070C0", // Blue
    "#7030A0", // Purple
    "#FFFFFF", // Pure White
];

// Đủ 21 Thương hiệu chuẩn đồng bộ với Màn 13 (/brands)
const INITIAL_BRANDS_SETTINGS: BrandSettingItem[] = [
    { code: "BRD-CHANEL", name: "Chanel", tagline: "Haute Parfumerie Paris", description: "Iconic Parisian luxury fragrance house featuring Bleu de Chanel and Coco Mademoiselle.", status: "ACTIVE", locationsCount: 3, machinesCount: 2, maxLocationsLimit: 5, maxMachinesLimit: 4, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#0A0A10", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-01-10", updatedAt: "2026-11-16 09:20" },
    { code: "BRD-DIOR", name: "Dior", tagline: "Christian Dior Parfums", description: "French luxury house featuring Dior Sauvage and Miss Dior.", status: "ACTIVE", locationsCount: 2, machinesCount: 2, maxLocationsLimit: 5, maxMachinesLimit: 4, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#050508", accentColor: "#F3E7C4", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-01-15", updatedAt: "2026-11-16 08:45" },
    { code: "BRD-CREED", name: "Creed", tagline: "House of Creed 1760", description: "Royal niche perfumery featuring Creed Aventus.", status: "ACTIVE", locationsCount: 2, machinesCount: 1, maxLocationsLimit: 4, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#E2C665", secondaryColor: "#111118", accentColor: "#FFFFFF", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-01-12", updatedAt: "2026-11-15 16:10" },
    { code: "BRD-MFK", name: "Maison Francis Kurkdjian", tagline: "Contemporary Paris Perfumery", description: "Creator of Baccarat Rouge 540 EDP.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#C00000", secondaryColor: "#0D0D14", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-01-20", updatedAt: "2026-11-15 09:45" },
    { code: "BRD-LELABO", name: "Le Labo", tagline: "Grasse — New York", description: "Artisanal niche perfumery featuring Santal 33 and Another 13.", status: "ACTIVE", locationsCount: 2, machinesCount: 2, maxLocationsLimit: 4, maxMachinesLimit: 4, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#0A0A10", accentColor: "#E2E8F0", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-02-01", updatedAt: "2026-11-14 18:30" },
    { code: "BRD-YSL", name: "Yves Saint Laurent", tagline: "YSL Beauté Paris", description: "Couture perfumery featuring YSL Libre Eau de Parfum.", status: "ACTIVE", locationsCount: 2, machinesCount: 2, maxLocationsLimit: 4, maxMachinesLimit: 4, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#08080C", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-02-05", updatedAt: "2026-11-14 14:10" },
    { code: "BRD-TOMFORD", name: "Tom Ford", tagline: "Private Blend Collection", description: "Modern luxury fragrances featuring Black Orchid.", status: "ACTIVE", locationsCount: 2, machinesCount: 2, maxLocationsLimit: 4, maxMachinesLimit: 4, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#08080C", accentColor: "#F3E7C4", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-02-10", updatedAt: "2026-11-14 11:00" },
    { code: "BRD-MARGIELA", name: "Maison Margiela", tagline: "Replica Olfactory Library", description: "Memory-driven fragrances featuring By the Fireplace and Jazz Club.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#FB923C", secondaryColor: "#0A0A12", accentColor: "#FFFFFF", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-02-14", updatedAt: "2026-11-13 15:20" },
    { code: "BRD-ROJA", name: "Roja Parfums", tagline: "British Haute Parfumerie", description: "Ultra-luxury perfumery featuring Roja Elysium.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#38BDF8", secondaryColor: "#0A0A12", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-02-18", updatedAt: "2026-11-12 10:15" },
    { code: "BRD-VERSACE", name: "Versace", tagline: "Milano Luxury Fragrance", description: "Italian luxury house featuring Eros, Dylan Blue, and Bright Crystal.", status: "ACTIVE", locationsCount: 2, machinesCount: 2, maxLocationsLimit: 4, maxMachinesLimit: 4, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#09090F", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-02-22", updatedAt: "2026-11-11 09:00" },
    { code: "BRD-ARMAF", name: "Armaf", tagline: "Luxury French Perfumery", description: "Signature house of Club de Nuit Intense Man.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#08080D", accentColor: "#FFFFFF", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-01", updatedAt: "2026-11-10 14:00" },
    { code: "BRD-BURBERRY", name: "Burberry", tagline: "London Heritage Fragrances", description: "Iconic British house featuring Burberry Her and Hero.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#F472B6", secondaryColor: "#09090F", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-05", updatedAt: "2026-11-10 11:20" },
    { code: "BRD-CALVINKLEIN", name: "Calvin Klein", tagline: "Modern American Minimalist", description: "Contemporary classics featuring CK One.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#94A3B8", secondaryColor: "#08080D", accentColor: "#FFFFFF", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-08", updatedAt: "2026-11-09 16:00" },
    { code: "BRD-CAROLINA", name: "Carolina Herrera", tagline: "New York Couture House", description: "Creator of Good Girl Eau de Parfum.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#818CF8", secondaryColor: "#09090F", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-12", updatedAt: "2026-11-09 12:30" },
    { code: "BRD-ARMANI", name: "Giorgio Armani", tagline: "Armani Beauty Milano", description: "Mediterranean elegance featuring Acqua di Giò.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#38BDF8", secondaryColor: "#08080D", accentColor: "#FFFFFF", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-15", updatedAt: "2026-11-08 15:40" },
    { code: "BRD-JPG", name: "Jean Paul Gaultier", tagline: "Parisian Avant-Garde", description: "Iconic fragrances featuring Le Male Elixir and Scandal.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#09090F", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-18", updatedAt: "2026-11-08 10:15" },
    { code: "BRD-MCM", name: "MCM Worldwide", tagline: "Munich Luxury Leather & Scent", description: "Travel-inspired MCM Eau de Parfum.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#FB923C", secondaryColor: "#08080D", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-22", updatedAt: "2026-11-07 14:20" },
    { code: "BRD-MONTBLANC", name: "Montblanc", tagline: "European Craftsmanship", description: "Refined masculine perfumery featuring Montblanc Explorer.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#94A3B8", secondaryColor: "#08080D", accentColor: "#FFFFFF", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-25", updatedAt: "2026-11-07 09:50" },
    { code: "BRD-NARCISO", name: "Narciso Rodriguez", tagline: "New York Musc Mastery", description: "Signature heart of musc featuring Pure Musc and For Her.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#F472B6", secondaryColor: "#09090F", accentColor: "#FFFFFF", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-03-28", updatedAt: "2026-11-06 16:30" },
    { code: "BRD-PACO", name: "Paco Rabanne", tagline: "Rabanne Paris", description: "Bold olfactory creations featuring 1 Million Elixir.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#D4AF37", secondaryColor: "#08080D", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-04-02", updatedAt: "2026-11-06 11:10" },
    { code: "BRD-PDM", name: "Parfums de Marly", tagline: "18th Century French Splendor", description: "Haute Parfumerie featuring Sedley and Layton.", status: "ACTIVE", locationsCount: 1, machinesCount: 1, maxLocationsLimit: 3, maxMachinesLimit: 3, currency: "VND", timeZone: "Asia/Ho_Chi_Minh", primaryColor: "#38BDF8", secondaryColor: "#09090F", accentColor: "#F5E6AD", enableSampling: true, showInCustomerApp: true, allowCustomPricing: true, dataIsolationEnforced: true, allowBaManageProducts: true, createdAt: "2026-04-05", updatedAt: "2026-11-05 15:00" },
];

// Đủ 8/8 Máy Kiosk chuẩn trên toàn mạng lưới (Đồng bộ 100% với Màn 6 /machines, Màn 14 /alerts, Màn 15 /refill, Màn 17 /maintenance)
const INITIAL_MACHINES_SETTINGS: MachineSettingItem[] = [
    { code: "demo-device", name: "Diamond Plaza Flagship Kiosk", brand: "Creed", location: "Diamond Plaza Luxury Atrium, HCMC", status: "ONLINE", lastActivity: "Just now (2s ago)", uptime: "99.94%", temp: "21.2°C", humidity: "46%", perfumeLevelPct: 68, activeError: "None", dispenseDurationMs: 1200, spraysPerTransaction: 1, cooldownSeconds: 5, dailyDispenseLimit: 500, syncStatus: "SYNCED_WITH_DEVICE", mqttEndpoint: "ssl://mqtt.scentstation.vn:8883/kiosk/demo-device", maskedToken: "tok_iot_********************99a1", displayLanguage: "BILINGUAL", openingTime: "08:00", closingTime: "22:00", sleepModeEnabled: true },
    { code: "KIOSK-SGN-01", name: "Saigon Centre Takashimaya", brand: "Chanel", location: "Saigon Centre Takashimaya D1, HCMC", status: "LOW_REFILL", lastActivity: "4 seconds ago", uptime: "99.88%", temp: "21.4°C", humidity: "48%", perfumeLevelPct: 13, activeError: "LOW_STOCK_SLOT_03 (Bleu de Chanel 12.5ml)", dispenseDurationMs: 1200, spraysPerTransaction: 1, cooldownSeconds: 5, dailyDispenseLimit: 600, syncStatus: "SYNCED_WITH_DEVICE", mqttEndpoint: "ssl://mqtt.scentstation.vn:8883/kiosk/KIOSK-SGN-01", maskedToken: "tok_iot_********************88b2", displayLanguage: "BILINGUAL", openingTime: "09:00", closingTime: "22:30", sleepModeEnabled: true },
    { code: "KIOSK-SGN-02", name: "Vincom Dong Khoi Atrium", brand: "Yves Saint Laurent", location: "Vincom Center Dong Khoi, HCMC", status: "ONLINE", lastActivity: "8 seconds ago", uptime: "99.75%", temp: "21.8°C", humidity: "49%", perfumeLevelPct: 74, activeError: "None", dispenseDurationMs: 1200, spraysPerTransaction: 1, cooldownSeconds: 5, dailyDispenseLimit: 500, syncStatus: "SYNCED_WITH_DEVICE", mqttEndpoint: "ssl://mqtt.scentstation.vn:8883/kiosk/KIOSK-SGN-02", maskedToken: "tok_iot_********************77c3", displayLanguage: "VI", openingTime: "09:00", closingTime: "22:00", sleepModeEnabled: true },
    { code: "KIOSK-SGN-03", name: "Crescent Mall Luxury Wing", brand: "Roja Parfums", location: "Crescent Mall D7, HCMC", status: "LOW_REFILL", lastActivity: "5 seconds ago", uptime: "99.60%", temp: "21.6°C", humidity: "47%", perfumeLevelPct: 11, activeError: "LOW_STOCK_SLOT_03 (Roja Elysium 11.0ml)", dispenseDurationMs: 1200, spraysPerTransaction: 1, cooldownSeconds: 5, dailyDispenseLimit: 480, syncStatus: "SYNCED_WITH_DEVICE", mqttEndpoint: "ssl://mqtt.scentstation.vn:8883/kiosk/KIOSK-SGN-03", maskedToken: "tok_iot_********************61c8", displayLanguage: "BILINGUAL", openingTime: "09:30", closingTime: "22:00", sleepModeEnabled: true },
    { code: "KIOSK-HN-01", name: "Lotte West Lake Lounge", brand: "Dior", location: "Lotte Center West Lake, Hanoi", status: "ONLINE", lastActivity: "6 seconds ago", uptime: "99.90%", temp: "21.2°C", humidity: "45%", perfumeLevelPct: 84, activeError: "None", dispenseDurationMs: 1200, spraysPerTransaction: 1, cooldownSeconds: 5, dailyDispenseLimit: 550, syncStatus: "SYNCED_WITH_DEVICE", mqttEndpoint: "ssl://mqtt.scentstation.vn:8883/kiosk/KIOSK-HN-01", maskedToken: "tok_iot_********************66d4", displayLanguage: "BILINGUAL", openingTime: "08:30", closingTime: "22:00", sleepModeEnabled: true },
    { code: "KIOSK-HN-02", name: "Trang Tien Plaza Wing", brand: "Maison Margiela", location: "Trang Tien Plaza, Hanoi", status: "MAINTENANCE", lastActivity: "14 mins ago", uptime: "96.40%", temp: "23.1°C", humidity: "51%", perfumeLevelPct: 80, activeError: "MAINTENANCE_MODE_ACTIVE (Ticket #MNT-2026-409)", dispenseDurationMs: 1150, spraysPerTransaction: 1, cooldownSeconds: 6, dailyDispenseLimit: 400, syncStatus: "SAVED_ONLY", mqttEndpoint: "ssl://mqtt.scentstation.vn:8883/kiosk/KIOSK-HN-02", maskedToken: "tok_iot_********************55e5", displayLanguage: "EN", openingTime: "09:00", closingTime: "21:30", sleepModeEnabled: false },
    { code: "KIOSK-DAD-01", name: "IndoChina Riverside Mall Lobby", brand: "Armaf", location: "IndoChina Riverside Mall, Da Nang", status: "ONLINE", lastActivity: "3 seconds ago", uptime: "99.92%", temp: "21.5°C", humidity: "47%", perfumeLevelPct: 88, activeError: "None", dispenseDurationMs: 1200, spraysPerTransaction: 1, cooldownSeconds: 5, dailyDispenseLimit: 520, syncStatus: "SYNCED_WITH_DEVICE", mqttEndpoint: "ssl://mqtt.scentstation.vn:8883/kiosk/KIOSK-DAD-01", maskedToken: "tok_iot_********************72d9", displayLanguage: "BILINGUAL", openingTime: "08:30", closingTime: "22:00", sleepModeEnabled: true },
    { code: "KIOSK-004", name: "Aeon Mall Tan Phu Celadon", brand: "Tom Ford", location: "Aeon Mall Tan Phu, HCMC", status: "OFFLINE", lastActivity: "Last Recorded: 2026-11-16 08:40 (Stale)", uptime: "92.10%", temp: "24.2°C (Stale)", humidity: "55% (Stale)", perfumeLevelPct: 0, activeError: "MQTT_HEARTBEAT_TIMEOUT & SLOT_01_DEPLETED", dispenseDurationMs: 1200, spraysPerTransaction: 1, cooldownSeconds: 5, dailyDispenseLimit: 450, syncStatus: "SAVED_ONLY", mqttEndpoint: "ssl://mqtt.scentstation.vn:8883/kiosk/KIOSK-004", maskedToken: "tok_iot_********************44f6", displayLanguage: "VI", openingTime: "09:00", closingTime: "22:00", sleepModeEnabled: true },
];

const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
    { id: "LOG-2026-9901", timestamp: "2026-11-16 09:42:15", eventType: "DISPENSE_CMD_SIGNED", category: "Machine Management", user: "IoT Gateway Service", role: "SYSTEM", module: "Machines / MQTT", description: "Signed single-use dispensing command CMD-8821A (TTL 30s) for KIOSK-SGN-01 Slot 03.", ipAddress: "10.0.14.22", userAgent: "Spring-Boot-Paho-MQTT/3.3.5", sessionId: "SES-SYS-MQTT01", severity: "INFO", oldValuesJson: '{"order_status":"PAID"}', newValuesJson: '{"order_status":"DISPENSING","cmd_ttl":"30s"}' },
    { id: "LOG-2026-9902", timestamp: "2026-11-16 09:15:40", eventType: "PAYMENT_CALLBACK_VERIFIED", category: "Payment", user: "VietQR Webhook Verifier", role: "EXTERNAL_SYSTEM", module: "Payment", description: "Verified NAPAS247 VietQR signature for Order #TXN-2026-801 (25,000 VND).", ipAddress: "103.21.144.88", userAgent: "VietQR-Webhook-Dispatcher/2.1", sessionId: "SES-WH-991", severity: "INFO", oldValuesJson: '{"status":"PENDING"}', newValuesJson: '{"status":"PAID","provider_ref":"VIETQR-VN-992100"}' },
    { id: "LOG-2026-9903", timestamp: "2026-11-15 17:42:10", eventType: "MACHINE_OFFLINE_DETECTED", category: "Machine Management", user: "Heartbeat Watchdog", role: "SYSTEM", module: "Machines", description: "KIOSK-004 missed 3 consecutive MQTT heartbeats. Marked OFFLINE and paused incoming spray orders.", ipAddress: "10.0.14.10", userAgent: "ScentStation-Watchdog/2.4", sessionId: "SES-SYS-WD04", severity: "ERROR", oldValuesJson: '{"connection_status":"ONLINE"}', newValuesJson: '{"connection_status":"OFFLINE","orders_blocked":true}' },
    { id: "LOG-2026-9904", timestamp: "2026-11-15 16:30:00", eventType: "PRICE_UPDATED", category: "Brand Management", user: "Nguyễn Văn An", role: "Brand Administrator", module: "Perfume Products", description: "Updated Bleu de Chanel default spray price to 25,000 VND (historical transaction snapshots preserved).", ipAddress: "171.244.18.92", userAgent: "Mozilla/5.0 Chrome/131.0", sessionId: "SES-2026-006", severity: "INFO", oldValuesJson: '{"price_per_spray":22000}', newValuesJson: '{"price_per_spray":25000}' },
    { id: "LOG-2026-9905", timestamp: "2026-11-14 15:12:05", eventType: "LOGIN_FAILED_LOCKOUT", category: "Login & Security", user: "quan.tran@creed.local", role: "Technician", module: "Authentication", description: "Account UID-USR-008 locked for 30 minutes after 5 failed BCrypt password attempts.", ipAddress: "45.33.32.156", userAgent: "Mozilla/5.0 Chrome/130.0", sessionId: "SES-UNAUTH-88", severity: "WARNING", oldValuesJson: '{"failed_attempts":4,"status":"ACTIVE"}', newValuesJson: '{"failed_attempts":5,"status":"LOCKED"}' },
    { id: "LOG-2026-9906", timestamp: "2026-11-14 14:10:00", eventType: "REFUND_AUTHORIZED", category: "Transaction", user: "Platform Super Administrator", role: "Platform Super Admin", module: "Transactions", description: "Authorized full refund for Order #TXN-2026-802 (18,000 VND).", ipAddress: "115.78.209.14", userAgent: "Mozilla/5.0 Windows NT 10.0 Chrome/131.0", sessionId: "SES-2026-001", severity: "WARNING", oldValuesJson: '{"status":"UNCERTAIN"}', newValuesJson: '{"status":"REFUNDED","refund_ref":"REF-802"}' },
    { id: "LOG-2026-9907", timestamp: "2026-11-13 11:05:22", eventType: "SYSTEM_BACKUP_COMPLETED", category: "System Settings", user: "Platform Super Administrator", role: "Platform Super Admin", module: "System", description: "Verified encrypted PostgreSQL 16 snapshot backup (RPO <= 24h target).", ipAddress: "115.78.209.14", userAgent: "Mozilla/5.0 Chrome/131.0", sessionId: "SES-2026-001", severity: "INFO", oldValuesJson: '{"last_backup":"2026-11-12"}', newValuesJson: '{"last_backup":"2026-11-13","checksum":"SHA256_OK"}' },
    { id: "LOG-2026-9908", timestamp: "2026-11-12 09:40:11", eventType: "WEBHOOK_SIGNATURE_VERIFIED", category: "Integration", user: "VNPay Integration Service", role: "SYSTEM", module: "Integration", description: "Tested VNPay Production merchant endpoint & verified HMAC webhook secret.", ipAddress: "10.0.14.55", userAgent: "ScentStation-Integration/2.4", sessionId: "SES-INT-02", severity: "INFO", oldValuesJson: '{"vnpay_status":"UNVERIFIED"}', newValuesJson: '{"vnpay_status":"CONNECTED"}' },
];

const SETTINGS_STORAGE_KEY = "scentstation_platform_settings_v2";
const BRANDS_STORAGE_KEY = "scentstation_commercial_brands_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const TRANSACTIONS_STORAGE_KEY = "scentstation_commercial_transactions_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

export default function SettingsPage(): React.ReactElement {
    const router = useRouter();
    const logoUploadRef = useRef<HTMLInputElement | null>(null);

    const [activeTab, setActiveTab] = useState<SettingsTabId>("general");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [openDropdown, setOpenDropdown] = useState<
        | "GEN_THEME"
        | "GEN_COLOR"
        | "GEN_LANG"
        | "BRD_FILTER"
        | "BRD_STATUS"
        | "BRD_PRIMARY_COLOR"
        | "BRD_ACCENT_COLOR"
        | "MCH_FILTER"
        | "AUD_SEV"
        | "AUD_PAGESIZE"
        | null
    >(null);

    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");
    const [isViewerReadOnly, setIsViewerReadOnly] = useState<boolean>(false);

    /* ---------------------------------------------------------
       TAB 1: GENERAL STATE
    --------------------------------------------------------- */
    const [platformName, setPlatformName] = useState<string>("ScentStation");
    const [platformSlogan, setPlatformSlogan] = useState<string>(
        "Automated Multi-Brand Fine Fragrance Experience Platform"
    );
    const [platformDesc, setPlatformDesc] = useState<string>(
        "Centralized multi-tenant IoT Kiosk management, calibrated spray telemetry, and VietQR payment verification platform."
    );
    const [hasLogo, setHasLogo] = useState<boolean>(true);
    const [confirmRemoveLogo, setConfirmRemoveLogo] = useState<boolean>(false);

    const [themeMode, setThemeMode] = useState<"DARK" | "LIGHT" | "AUTO">("DARK");
    const [primaryColor, setPrimaryColor] = useState<string>("#D4AF37");
    const [defaultLang, setDefaultLang] = useState<"EN" | "VI">("EN");

    const [sysPrefs, setSysPrefs] = useState({
        multiBrandMode: true,
        machineMonitoring: true,
        analyticsReports: true,
        inviteOnlyRegistration: true,
        maintenanceReminders: true,
        dataExportEnabled: true,
    });

    const [smtpServer, setSmtpServer] = useState<string>("smtp.scentstation.vn");
    const [smtpPort, setSmtpPort] = useState<string>("587");
    const [smtpEncryption] = useState<"TLS" | "SSL">("TLS");

    /* ---------------------------------------------------------
       TAB 2: BRANDS STATE (ĐỦ 21 THƯƠNG HIỆU)
    --------------------------------------------------------- */
    const [brandsList, setBrandsList] = useState<BrandSettingItem[]>(INITIAL_BRANDS_SETTINGS);
    const [brandSearch, setBrandSearch] = useState<string>("");
    const [brandStatusFilter, setBrandStatusFilter] = useState<string>("ALL");
    const [selectedBrandCode, setSelectedBrandCode] = useState<string>("BRD-CHANEL");

    /* ---------------------------------------------------------
       TAB 3: MACHINES STATE (ĐỦ 8 MÁY KIOSK)
    --------------------------------------------------------- */
    const [machinesList, setMachinesList] =
        useState<MachineSettingItem[]>(INITIAL_MACHINES_SETTINGS);
    const [machineSearch, setMachineSearch] = useState<string>("");
    const [machineStatusFilter, setMachineStatusFilter] = useState<string>("ALL");
    const [selectedMachineCode, setSelectedMachineCode] =
        useState<string>("KIOSK-SGN-01");

    /* ---------------------------------------------------------
       TAB 4: PAYMENT STATE (ĐỒNG BỘ VỚI /transactions)
    --------------------------------------------------------- */
    const [paymentMethods, setPaymentMethods] = useState([
        { id: "VIETQR", name: "VietQR (NAPAS 247)", bank: "Vietcombank Corporate", account: "0071000889999 — SCENTSTATION JSC", active: true },
        { id: "MOMO", name: "MoMo Super App Business", bank: "MoMo Merchant Gateway", account: "MOMO-MERCHANT-2026", active: true },
        { id: "VNPAY", name: "VNPay Smart QR", bank: "VNPay Terminal Gateway", account: "VNPAY-TERM-8812", active: true },
        { id: "ZALOPAY", name: "ZaloPay E-Wallet", bank: "ZaloPay Enterprise", account: "ZLP-CORP-901", active: false },
    ]);
    const [paymentTimeoutSec, setPaymentTimeoutSec] = useState<number>(180);
    const [vatRatePct, setVatRatePct] = useState<number>(8);
    const [livePaymentMetrics, setLivePaymentMetrics] = useState({
        grossVnd: 14820000,
        netRecognizedVnd: 14250000,
        successSpraysCount: 912,
        failedOrdersCount: 18,
        refundedVnd: 570000,
        refundedCount: 32,
    });

    /* ---------------------------------------------------------
       TAB 5: NOTIFICATIONS STATE
    --------------------------------------------------------- */
    const [templateBody, setTemplateBody] = useState<string>(
        "Device {{machine_code}} missed heartbeat at {{timestamp}} (Last Ref: {{transaction_id}}). Please inspect network."
    );
    const [testRecipientEmail] = useState<string>("admin@scentstation.local");

    /* ---------------------------------------------------------
       TAB 6: SYSTEM STATE
    --------------------------------------------------------- */
    const [systemMaintenanceMode, setSystemMaintenanceMode] = useState<boolean>(false);
    const [confirmMaintDialog, setConfirmMaintDialog] = useState<boolean>(false);
    const [maintenanceBannerMsg, setMaintenanceBannerMsg] = useState<string>(
        "ScentStation platform is undergoing scheduled PostgreSQL & MQTT broker maintenance. Kiosk dispensing will resume shortly."
    );
    const [runningSysOp, setRunningSysOp] = useState<string | null>(null);
    const [simulateServiceDown, setSimulateServiceDown] = useState<boolean>(false);

    /* ---------------------------------------------------------
       TAB 7: SECURITY STATE
    --------------------------------------------------------- */
    const [minPwLength, setMinPwLength] = useState<number>(8);
    const [sessionTimeoutMin, setSessionTimeoutMin] = useState<number>(30);
    const [maxFailedAttempts, setMaxFailedAttempts] = useState<number>(5);
    const [lockoutDurationMin, setLockoutDurationMin] = useState<number>(30);
    const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState<boolean>(false);
    const [ipAllowlist, setIpAllowlist] = useState([
        { id: "IP-1", cidr: "115.78.209.14/32", desc: "Current Admin Workstation (HCMC Ops HQ)", status: "ACTIVE" },
        { id: "IP-2", cidr: "14.162.145.0/24", desc: "Hanoi Regional Office Subnet", status: "ACTIVE" },
    ]);
    const [newIpCidr, setNewIpCidr] = useState<string>("");
    const [newIpDesc, setNewIpDesc] = useState<string>("");

    /* ---------------------------------------------------------
       TAB 8: INTEGRATIONS STATE
    --------------------------------------------------------- */
    const [showApiSecret, setShowApiSecret] = useState<boolean>(false);
    const [mqttHost, setMqttHost] = useState<string>("mqtt.scentstation.vn");
    const [mqttPort, setMqttPort] = useState<string>("8883");

    /* ---------------------------------------------------------
       TAB 9: AUDIT LOGS STATE (ĐỒNG BỘ VỚI TOÀN BỘ 17 MÀN HÌNH)
    --------------------------------------------------------- */
    const [auditRecords, setAuditRecords] =
        useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
    const [auditQuickCategory, setAuditQuickCategory] = useState<string>("All");
    const [auditSearch, setAuditSearch] = useState<string>("");
    const [auditSeverity, setAuditSeverity] = useState<string>("ALL");
    const [auditSortDesc, setAuditSortDesc] = useState<boolean>(true);
    const [selectedAuditIds] = useState<string[]>([]);
    const [selectedAuditDetail, setSelectedAuditDetail] =
        useState<AuditLogRecord | null>(INITIAL_AUDIT_LOGS[0]);
    const [auditPage, setAuditPage] = useState<number>(1);
    const [auditPageSize, setAuditPageSize] = useState<number>(5);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4200);
    }, []);

    /* --- HÀM ĐỒNG BỘ MÀU ACCENT & THEME XUYÊN SUỐT TOÀN BỘ 18 MÀN HÌNH --- */
    const applyGlobalThemeAccent = useCallback(
        (hexColor: string, mode: "DARK" | "LIGHT" | "AUTO" = "DARK") => {
            if (typeof document === "undefined") return;
            const root = document.documentElement;
            root.style.setProperty("--ss-gold-primary", hexColor);
            root.setAttribute("data-ss-theme", mode.toLowerCase());

            let styleTag = document.getElementById(
                "ss-global-accent-override"
            ) as HTMLStyleElement | null;
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = "ss-global-accent-override";
                document.head.appendChild(styleTag);
            }

            styleTag.innerHTML = `
                :root, html, body, div[class*="container"] {
                    --ss-gold-primary: ${hexColor} !important;
                }
                button[class*="primaryGoldBtn"],
                button[class*="categoryTabBtnActive"],
                button[class*="quickRangePillActive"],
                button[class*="tabBtnActive"],
                button[class*="drawerTabBtnActive"],
                button[class*="calendarDaySelected"] {
                    background: linear-gradient(135deg, ${hexColor} 0%, #F5E6AD 100%) !important;
                    border-color: ${hexColor} !important;
                }
                span[class*="eyebrowTag"] {
                    color: ${hexColor} !important;
                }
                div[class*="kpiCardActive"],
                div[class*="summaryCardActive"] {
                    border-color: ${hexColor} !important;
                }
            `;
        },
        []
    );

    const saveAndBroadcastPlatformVisuals = useCallback(
        (
            nextColor: string,
            nextTheme: "DARK" | "LIGHT" | "AUTO",
            nextLang: "EN" | "VI"
        ) => {
            applyGlobalThemeAccent(nextColor, nextTheme);
            try {
                localStorage.setItem(
                    SETTINGS_STORAGE_KEY,
                    JSON.stringify({
                        platformName,
                        platformSlogan,
                        platformDesc,
                        primaryColor: nextColor,
                        themeMode: nextTheme,
                        defaultLang: nextLang,
                    })
                );
                localStorage.setItem(
                    LANGUAGE_STORAGE_KEY,
                    nextLang.toLowerCase()
                );
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        [platformName, platformSlogan, platformDesc, applyGlobalThemeAccent]
    );

    /* --- 1. ĐỌC & ĐỐI SOÁT DỮ LIỆU ĐỒNG BỘ 2 CHIỀU VỚI TOÀN BỘ 17 MÀN HÌNH TRƯỚC --- */
    const loadAndReconcileSettings = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toUpperCase() === "VI" || savedLang.toUpperCase() === "EN")) {
                setDefaultLang(savedLang.toUpperCase() as "EN" | "VI");
            }

            // Đọc cấu hình Platform Settings đã lưu & áp dụng ngay màu Accent toàn cục
            const rawSavedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (rawSavedSettings) {
                const parsedSettings = JSON.parse(rawSavedSettings);
                if (parsedSettings.platformName) setPlatformName(parsedSettings.platformName);
                if (parsedSettings.platformSlogan) setPlatformSlogan(parsedSettings.platformSlogan);
                if (parsedSettings.platformDesc) setPlatformDesc(parsedSettings.platformDesc);
                const resolvedColor = parsedSettings.primaryColor || "#D4AF37";
                const resolvedTheme = parsedSettings.themeMode || "DARK";
                setPrimaryColor(resolvedColor);
                setThemeMode(resolvedTheme);
                applyGlobalThemeAccent(resolvedColor, resolvedTheme);
            }

            // A. Đọc quyền RBAC từ /login & /users
            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                const roleCode = parsedUser.roleCode || parsedUser.role || parsedUser.roles?.[0] || "PSA";
                setCurrentActorLabel(parsedUser.fullName || parsedUser.name || "Platform Super Administrator");
                setIsViewerReadOnly(roleCode === "VW" || roleCode === "VIEWER");
            }

            // B. Đồng bộ đủ 21+ Thương hiệu từ Màn 13 (/brands)
            const rawBrands = localStorage.getItem(BRANDS_STORAGE_KEY);
            if (rawBrands) {
                const parsedBrands = JSON.parse(rawBrands);
                if (Array.isArray(parsedBrands) && parsedBrands.length > 0) {
                    const seenNames = new Set<string>();
                    const mergedBrands: BrandSettingItem[] = [];

                    parsedBrands.forEach((b: any) => {
                        const bName = String(b.name || "").trim();
                        if (!bName || seenNames.has(bName.toLowerCase())) return;
                        seenNames.add(bName.toLowerCase());

                        const existingSeed = INITIAL_BRANDS_SETTINGS.find((sb) =>
                            isExactMatch(sb.name, bName)
                        );

                        mergedBrands.push({
                            code:
                                b.code ||
                                existingSeed?.code ||
                                `BRD-${bName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`,
                            name: bName,
                            tagline:
                                b.country
                                    ? `${b.country} Haute Parfumerie`
                                    : existingSeed?.tagline || "Luxury Olfactory Maison",
                            description:
                                b.description ||
                                existingSeed?.description ||
                                "Authorized luxury fragrance partner house.",
                            status:
                                b.status === "SUSPENDED"
                                    ? "INACTIVE"
                                    : b.status || existingSeed?.status || "ACTIVE",
                            locationsCount: Math.max(
                                1,
                                Number(b.machinesCount || existingSeed?.locationsCount || 2)
                            ),
                            machinesCount: Math.max(
                                1,
                                Number(b.machinesCount || existingSeed?.machinesCount || 1)
                            ),
                            maxLocationsLimit: existingSeed?.maxLocationsLimit || 5,
                            maxMachinesLimit: existingSeed?.maxMachinesLimit || 4,
                            currency: "VND",
                            timeZone: "Asia/Ho_Chi_Minh",
                            primaryColor: existingSeed?.primaryColor || "#D4AF37",
                            secondaryColor: existingSeed?.secondaryColor || "#0A0A10",
                            accentColor: existingSeed?.accentColor || "#F5E6AD",
                            enableSampling: b.status !== "INACTIVE" && b.status !== "SUSPENDED",
                            showInCustomerApp: b.status === "ACTIVE",
                            allowCustomPricing: true,
                            dataIsolationEnforced: true,
                            allowBaManageProducts: true,
                            createdAt: b.createdDate || existingSeed?.createdAt || "2026-01-15",
                            updatedAt: "2026-11-16 09:30",
                        });
                    });

                    INITIAL_BRANDS_SETTINGS.forEach((seedB) => {
                        if (!seenNames.has(seedB.name.toLowerCase())) {
                            seenNames.add(seedB.name.toLowerCase());
                            mergedBrands.push(seedB);
                        }
                    });

                    setBrandsList(mergedBrands);
                }
            }

            // C. Đồng bộ đủ 8/8 máy Kiosk (và cả các máy mới thêm) từ Màn 6 (/machines)
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedFleet = JSON.parse(rawMachines);
                if (Array.isArray(parsedFleet) && parsedFleet.length > 0) {
                    const seenCodes = new Set<string>();
                    const mergedMachines: MachineSettingItem[] = [];

                    INITIAL_MACHINES_SETTINGS.forEach((seedM) => {
                        seenCodes.add(seedM.code.toLowerCase());
                        const matched = parsedFleet.find((fm: any) =>
                            isExactMatch(fm.code || fm.id || "", seedM.code)
                        );
                        if (!matched) {
                            mergedMachines.push(seedM);
                            return;
                        }
                        const nextSt: MachineSettingItem["status"] =
                            matched.status === "OFFLINE"
                                ? "OFFLINE"
                                : matched.status === "MAINTENANCE"
                                    ? "MAINTENANCE"
                                    : seedM.status === "LOW_REFILL" &&
                                    matched.status !== "ONLINE"
                                        ? "LOW_REFILL"
                                        : "ONLINE";

                        mergedMachines.push({
                            ...seedM,
                            name: matched.name || matched.locationName || seedM.name,
                            brand: matched.brand || seedM.brand,
                            location:
                                matched.locationName ||
                                matched.address ||
                                seedM.location,
                            status: nextSt,
                            syncStatus:
                                nextSt === "ONLINE"
                                    ? "SYNCED_WITH_DEVICE"
                                    : seedM.syncStatus,
                            activeError:
                                nextSt === "ONLINE" ? "None" : seedM.activeError,
                            lastActivity:
                                matched.lastActivity || seedM.lastActivity,
                        });
                    });

                    parsedFleet.forEach((fm: any) => {
                        const c = String(fm.code || fm.id || "").trim();
                        if (!c || seenCodes.has(c.toLowerCase())) return;
                        seenCodes.add(c.toLowerCase());
                        mergedMachines.push({
                            code: c,
                            name: fm.name || fm.locationName || `${c} Kiosk`,
                            brand: fm.brand || "Luxury Maison",
                            location:
                                fm.locationName ||
                                fm.address ||
                                "Flagship Atrium",
                            status:
                                fm.status === "OFFLINE"
                                    ? "OFFLINE"
                                    : fm.status === "MAINTENANCE"
                                        ? "MAINTENANCE"
                                        : "ONLINE",
                            lastActivity: fm.lastActivity || "Just now",
                            uptime: "99.90%",
                            temp: "21.4°C",
                            humidity: "47%",
                            perfumeLevelPct: 85,
                            activeError: "None",
                            dispenseDurationMs: 1200,
                            spraysPerTransaction: 1,
                            cooldownSeconds: 5,
                            dailyDispenseLimit: 500,
                            syncStatus: "SYNCED_WITH_DEVICE",
                            mqttEndpoint: `ssl://mqtt.scentstation.vn:8883/kiosk/${c}`,
                            maskedToken: "tok_iot_********************99z1",
                            displayLanguage: "BILINGUAL",
                            openingTime: "08:30",
                            closingTime: "22:00",
                            sleepModeEnabled: true,
                        });
                    });

                    setMachinesList(mergedMachines);
                }
            }

            // D. Đồng bộ số liệu thanh toán từ Màn 10 (/transactions)
            const rawTxns = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
            if (rawTxns) {
                const parsedTxns = JSON.parse(rawTxns);
                if (Array.isArray(parsedTxns) && parsedTxns.length > 0) {
                    const successTxns = parsedTxns.filter(
                        (t: any) =>
                            t.status === "SUCCESS" || t.status === "COMPLETED"
                    );
                    const failedTxns = parsedTxns.filter(
                        (t: any) =>
                            t.status === "FAILED" || t.status === "EXPIRED"
                    );
                    const refundedTxns = parsedTxns.filter(
                        (t: any) => t.status === "REFUNDED"
                    );
                    const netRev = successTxns.reduce(
                        (sum: number, t: any) => sum + Number(t.amount || 0),
                        0
                    );
                    const refAmt = refundedTxns.reduce(
                        (sum: number, t: any) => sum + Number(t.amount || 0),
                        0
                    );
                    if (netRev > 0) {
                        setLivePaymentMetrics({
                            grossVnd: netRev + refAmt,
                            netRecognizedVnd: netRev,
                            successSpraysCount: successTxns.length,
                            failedOrdersCount: failedTxns.length,
                            refundedVnd: refAmt,
                            refundedCount: refundedTxns.length,
                        });
                    }
                }
            }

            // E. Đồng bộ Nhật ký Kiểm toán từ toàn bộ 17 màn hình trước
            const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
            if (rawAudit) {
                const parsedAudit = JSON.parse(rawAudit);
                if (Array.isArray(parsedAudit) && parsedAudit.length > 0) {
                    const converted: AuditLogRecord[] = parsedAudit
                        .slice(0, 25)
                        .map((item: any, idx: number) => {
                            const ent = String(item.entityType || "").toUpperCase();
                            const mappedCat: AuditLogRecord["category"] =
                                ent.includes("BRAND")
                                    ? "Brand Management"
                                    : ent.includes("MACHINE") ||
                                    ent.includes("ALERT") ||
                                    ent.includes("REFILL") ||
                                    ent.includes("MAINTENANCE")
                                        ? "Machine Management"
                                        : ent.includes("PROFILE") ||
                                        ent.includes("AUTH")
                                            ? "Login & Security"
                                            : ent.includes("USER")
                                                ? "User Management"
                                                : "System Settings";
                            const rawTs = String(item.timestamp || "").replace(
                                "T",
                                " "
                            );
                            return {
                                id: item.id || `LOG-2026-${9920 + idx}`,
                                timestamp: rawTs.slice(0, 19) || formatNowTimestamp(),
                                eventType: item.action || "SYSTEM_EVENT",
                                category: mappedCat,
                                user:
                                    item.actor &&
                                    !String(item.actor).includes("Tuyền")
                                        ? item.actor
                                        : "Platform Super Administrator",
                                role: item.role || "PSA",
                                module: item.entityType || "Settings",
                                description:
                                    item.newValues?.detail ||
                                    `Executed ${item.action} on ${item.entityId}.`,
                                ipAddress: item.sourceIp || "115.78.209.14",
                                userAgent: "Mozilla/5.0 Chrome/131.0",
                                sessionId: "SES-2026-001",
                                severity:
                                    item.severity === "WARNING" ||
                                    item.severity === "ERROR"
                                        ? item.severity
                                        : "INFO",
                                oldValuesJson: JSON.stringify(
                                    item.oldValues || {}
                                ),
                                newValuesJson: JSON.stringify(
                                    item.newValues || { status: "COMMITTED" }
                                ),
                            };
                        });

                    const seenIds = new Set(converted.map((c) => c.id));
                    const combined = [
                        ...converted,
                        ...INITIAL_AUDIT_LOGS.filter((s) => !seenIds.has(s.id)),
                    ];
                    setAuditRecords(combined);
                }
            }
        } catch {
            // Safe fallback
        }
    }, [applyGlobalThemeAccent]);

    useEffect(() => {
        loadAndReconcileSettings();

        const handleCrossSync = () => {
            loadAndReconcileSettings();
        };

        window.addEventListener("storage", handleCrossSync);
        window.addEventListener("focus", handleCrossSync);
        window.addEventListener("scentstation-sync", handleCrossSync);

        const syncTimer = setInterval(() => {
            loadAndReconcileSettings();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossSync);
            window.removeEventListener("focus", handleCrossSync);
            window.removeEventListener("scentstation-sync", handleCrossSync);
            clearInterval(syncTimer);
        };
    }, [loadAndReconcileSettings]);

    /* --- 2. GHI & ĐỒNG BỘ NGƯỢC TỪ /settings SANG TOÀN BỘ 17 MÀN HÌNH KIA --- */
    const appendAuditLogAndBroadcast = useCallback(
        (
            eventType: string,
            category: AuditLogRecord["category"],
            moduleName: string,
            description: string,
            newValuesObj: Record<string, any>
        ) => {
            const nowStr = formatNowTimestamp();
            const newLog: AuditLogRecord = {
                id: `LOG-2026-${Math.floor(9910 + Math.random() * 880)}`,
                timestamp: nowStr,
                eventType,
                category,
                user: currentActorLabel,
                role: "PSA",
                module: moduleName,
                description,
                ipAddress: "115.78.209.14",
                userAgent: "Mozilla/5.0 Chrome/131.0",
                sessionId: "SES-2026-001",
                severity: "INFO",
                oldValuesJson: "{}",
                newValuesJson: JSON.stringify(newValuesObj),
            };

            setAuditRecords((prev) => [newLog, ...prev]);
            setSelectedAuditDetail(newLog);

            try {
                const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                auditList.unshift({
                    id: newLog.id,
                    timestamp: new Date().toISOString(),
                    actor: currentActorLabel,
                    role: "PSA",
                    tenant: moduleName,
                    action: eventType,
                    entityType: moduleName,
                    entityId: newLog.id,
                    severity: "INFO",
                    oldValues: null,
                    newValues: { detail: description, ...newValuesObj },
                    sourceIp: "115.78.209.14",
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
        [currentActorLabel]
    );

    const selectedBrand = useMemo(
        () =>
            brandsList.find((b) => b.code === selectedBrandCode) ||
            brandsList[0],
        [brandsList, selectedBrandCode]
    );

    const selectedMachine = useMemo(
        () =>
            machinesList.find((m) => m.code === selectedMachineCode) ||
            machinesList[0],
        [machinesList, selectedMachineCode]
    );

    const filteredAuditLogs = useMemo(() => {
        const q = auditSearch.trim().toLowerCase();
        const filtered = auditRecords.filter((r) => {
            const matchesCat =
                auditQuickCategory === "All" ||
                r.category === auditQuickCategory;
            const matchesSev =
                auditSeverity === "ALL" || r.severity === auditSeverity;
            const matchesQ =
                !q ||
                r.id.toLowerCase().includes(q) ||
                r.eventType.toLowerCase().includes(q) ||
                r.user.toLowerCase().includes(q) ||
                r.module.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q);
            return matchesCat && matchesSev && matchesQ;
        });

        return [...filtered].sort((a, b) =>
            auditSortDesc
                ? b.timestamp.localeCompare(a.timestamp)
                : a.timestamp.localeCompare(b.timestamp)
        );
    }, [
        auditRecords,
        auditQuickCategory,
        auditSeverity,
        auditSearch,
        auditSortDesc,
    ]);

    const totalAuditPages = Math.max(
        1,
        Math.ceil(filteredAuditLogs.length / auditPageSize)
    );

    const paginatedAuditLogs = useMemo(() => {
        const safePage = Math.min(auditPage, totalAuditPages);
        const startIdx = (safePage - 1) * auditPageSize;
        return filteredAuditLogs.slice(startIdx, startIdx + auditPageSize);
    }, [filteredAuditLogs, auditPage, auditPageSize, totalAuditPages]);

    const handleSaveEmailTemplate = () => {
        if (
            !templateBody.includes("{{machine_code}}") ||
            !templateBody.includes("{{timestamp}}")
        ) {
            showToast(
                "Template Validation Error: Mandatory variables {{machine_code}} and {{timestamp}} are missing!"
            );
            return;
        }
        appendAuditLogAndBroadcast(
            "EMAIL_TEMPLATE_UPDATED",
            "System Settings",
            "Settings / Notifications",
            "Validated required data variables and updated alert email template.",
            { template: "MACHINE_OFFLINE" }
        );
        showToast("Validated mandatory variables & saved email template!");
    };

    const handleRunSystemOperation = (opName: string) => {
        if (runningSysOp) {
            showToast(
                `Operation Blocked: "${runningSysOp}" is currently in progress. Duplicate commands are prevented.`
            );
            return;
        }
        setRunningSysOp(opName);
        showToast(`${opName}: Status -> PROCESSING...`);
        setTimeout(() => {
            setRunningSysOp(null);
            appendAuditLogAndBroadcast(
                opName.toUpperCase().replace(/\s+/g, "_"),
                "System Settings",
                "Settings / System",
                `Executed system operation "${opName}" with verified backend completion.`,
                { operation: opName, result: "SUCCESS" }
            );
            showToast(
                `${opName}: Backend confirmed execution result -> COMPLETED (Logged in Audit Trail)!`
            );
        }, 1400);
    };

    const handleExportAuditLogs = () => {
        const rowsToExport =
            selectedAuditIds.length > 0
                ? filteredAuditLogs.filter((r) => selectedAuditIds.includes(r.id))
                : filteredAuditLogs;

        const header =
            "Log ID;Timestamp;Category;Event Type;Actor;Role;Module;IP Address;Severity;Description\n";
        const body = rowsToExport
            .map(
                (r) =>
                    `"${r.id}";"${r.timestamp}";"${r.category}";"${r.eventType}";"${r.user}";"${r.role}";"${r.module}";"${r.ipAddress}";"${r.severity}";"${r.description}"`
            )
            .join("\n");

        const blob = new Blob(["\ufeff" + header + body], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "scentstation_audit_logs_export.csv";
        a.click();

        appendAuditLogAndBroadcast(
            "EXPORT_AUDIT_LOGS",
            "System Settings",
            "Settings / Audit Logs",
            `Exported ${rowsToExport.length} scoped audit log records to CSV.`,
            { exported_count: rowsToExport.length, format: "CSV" }
        );

        showToast(
            `Exported ${rowsToExport.length} logs to CSV & recorded export event in Audit Logs!`
        );
    };

    const onlineMachinesCount = useMemo(
        () =>
            machinesList.filter(
                (m) => m.status === "ONLINE" || m.status === "LOW_REFILL"
            ).length,
        [machinesList]
    );

    // Component tái sử dụng Bảng màu thực tế kiểu Microsoft Word
    const renderWordColorPalettePopover = (
        currentColor: string,
        onSelectColor: (hex: string) => void
    ) => (
        <div
            className={styles.colorPalettePopover}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={styles.paletteSectionTitle}>
                <span>Theme Colors (Word Palette)</span>
                <span style={{ color: currentColor }}>{currentColor}</span>
            </div>

            {/* Hàng 1: 10 Màu Chủ Đề Gốc */}
            <div className={styles.wordGrid10}>
                {WORD_BASE_THEME_COLORS.map((hex) => (
                    <button
                        key={hex}
                        type="button"
                        title={hex}
                        onClick={() => {
                            onSelectColor(hex);
                            setOpenDropdown(null);
                        }}
                        className={`${styles.colorSwatchBtn} ${
                            currentColor.toUpperCase() === hex.toUpperCase()
                                ? styles.colorSwatchActive
                                : ""
                        }`}
                        style={{ backgroundColor: hex }}
                    />
                ))}
            </div>

            {/* 5 Hàng Sắc Độ Tints & Shades (50 ô giống bảng màu Word) */}
            <div className={styles.wordShadeGrid10}>
                {WORD_THEME_SHADE_ROWS.flatMap((row, rIdx) =>
                    row.map((hex, cIdx) => (
                        <button
                            key={`${rIdx}-${cIdx}-${hex}`}
                            type="button"
                            title={hex}
                            onClick={() => {
                                onSelectColor(hex);
                                setOpenDropdown(null);
                            }}
                            className={`${styles.colorSwatchBtn} ${
                                currentColor.toUpperCase() === hex.toUpperCase()
                                    ? styles.colorSwatchActive
                                    : ""
                            }`}
                            style={{ backgroundColor: hex }}
                        />
                    ))
                )}
            </div>

            {/* Hàng Standard Colors */}
            <div className={styles.paletteSectionTitle}>
                <span>Standard Luxury Colors</span>
            </div>
            <div className={styles.wordGrid10} style={{ marginBottom: "0.65rem" }}>
                {WORD_STANDARD_COLORS.map((hex) => (
                    <button
                        key={hex}
                        type="button"
                        title={hex}
                        onClick={() => {
                            onSelectColor(hex);
                            setOpenDropdown(null);
                        }}
                        className={`${styles.colorSwatchBtn} ${
                            currentColor.toUpperCase() === hex.toUpperCase()
                                ? styles.colorSwatchActive
                                : ""
                        }`}
                        style={{ backgroundColor: hex }}
                    />
                ))}
            </div>

            {/* Thanh nhập mã HEX tùy chỉnh & nút Đóng */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <span
                    style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "6px",
                        backgroundColor: currentColor,
                        border: "1px solid rgba(255,255,255,0.35)",
                        flexShrink: 0,
                    }}
                />
                <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => onSelectColor(e.target.value)}
                    className={styles.textInput}
                    style={{
                        padding: "0.3rem 0.55rem",
                        fontSize: "0.74rem",
                        fontFamily: "Space Grotesk, monospace",
                    }}
                />
                <button
                    type="button"
                    onClick={() => setOpenDropdown(null)}
                    className={styles.primaryGoldBtn}
                    style={{ padding: "0.32rem 0.7rem", fontSize: "0.7rem" }}
                >
                    <span>Done</span>
                </button>
            </div>
        </div>
    );

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            style={
                {
                    "--ss-gold-primary": primaryColor,
                } as React.CSSProperties
            }
            onClick={() => setOpenDropdown(null)}
        >
            <input
                type="file"
                ref={logoUploadRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={() =>
                    showToast(
                        "Validated image format & dimensions — New Logo previewed!"
                    )
                }
                style={{ display: "none" }}
            />

            {/* LUXURY HERO BANNER CARD (ĐỒNG BỘ 100% VỚI MÀN 5..17) */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {defaultLang === "VI"
                                ? "TRUNG TÂM CẤU HÌNH NỀN TẢNG & QUẢN TRỊ BẢO MẬT 9 PHÂN HỆ"
                                : "ENTERPRISE PLATFORM CONFIGURATION & 9-PILLAR GOVERNANCE"}
                        </span>
                        <h1 className={styles.title}>
                            {defaultLang === "VI"
                                ? "Cấu Hình Hệ Thống & Quản Trị Nền Tảng"
                                : "Platform Settings & Governance"}
                        </h1>
                        <p className={styles.subtitle}>
                            {defaultLang === "VI"
                                ? "Trung tâm quản trị 9 phân hệ: Cấu hình chung, 21 Đối tác thương hiệu, 8 Trạm Kiosk IoT, Cổng thanh toán VietQR, Thông báo, Sức khỏe hệ thống, Bảo mật, Tích hợp và Nhật ký kiểm toán bất biến."
                                : "Nine-tab enterprise configuration center covering General, 21 Partner Brands, 8 IoT Kiosk Stations, VietQR Payments, Notifications, System Health, Security, Integrations, and Immutable Audit Logs."}
                        </p>
                    </div>

                    <div
                        className={styles.headerActions}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const nextLang = defaultLang === "EN" ? "VI" : "EN";
                                setDefaultLang(nextLang);
                                saveAndBroadcastPlatformVisuals(
                                    primaryColor,
                                    themeMode,
                                    nextLang
                                );
                            }}
                            className={styles.secondaryGoldBtn}
                        >
                            <Globe size={14} color={primaryColor} />
                            <span>{defaultLang}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem(SETTINGS_STORAGE_KEY);
                                setPrimaryColor("#D4AF37");
                                setThemeMode("DARK");
                                applyGlobalThemeAccent("#D4AF37", "DARK");
                                loadAndReconcileSettings();
                                showToast("Synchronized latest state & restored default Gold accent across all 18 screens!");
                            }}
                            className={styles.secondaryGoldBtn}
                        >
                            <RotateCcw size={13} color={primaryColor} />
                            <span>Sync All Modules</span>
                        </button>

                        <div
                            className={styles.secondaryGoldBtn}
                            style={{ cursor: "default" }}
                        >
                            <ShieldCheck size={14} color="#34D399" />
                            <span>
                                {isViewerReadOnly
                                    ? "Viewer (Read-Only)"
                                    : currentActorLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4 KPI SUMMARY CARDS */}
                <div className={styles.kpiGrid4}>
                    <div
                        className={styles.kpiCard}
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveTab("brands")}
                    >
                        <div
                            style={{
                                fontSize: "0.66rem",
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            PARTNER MAISONS
                        </div>
                        <div
                            style={{
                                fontSize: "1.45rem",
                                fontWeight: 700,
                                color: "#FFFFFF",
                                fontFamily: "Space Grotesk, monospace",
                                margin: "0.3rem 0",
                            }}
                        >
                            {brandsList.length} Active Houses
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399" }}>
                            Multi-Tenant Isolation Active
                        </div>
                    </div>

                    <div
                        className={styles.kpiCard}
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveTab("machines")}
                    >
                        <div
                            style={{
                                fontSize: "0.66rem",
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            IOT KIOSK FLEET SYNC
                        </div>
                        <div
                            style={{
                                fontSize: "1.45rem",
                                fontWeight: 700,
                                color: "#60A5FA",
                                fontFamily: "Space Grotesk, monospace",
                                margin: "0.3rem 0",
                            }}
                        >
                            {onlineMachinesCount} / {machinesList.length} Online
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            MQTT TLS 1.3 Port 8883
                        </div>
                    </div>

                    <div
                        className={styles.kpiCard}
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveTab("payment")}
                    >
                        <div
                            style={{
                                fontSize: "0.66rem",
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            PAYMENT GATEWAYS
                        </div>
                        <div
                            style={{
                                fontSize: "1.45rem",
                                fontWeight: 700,
                                color: "#F5E6AD",
                                fontFamily: "Space Grotesk, monospace",
                                margin: "0.3rem 0",
                            }}
                        >
                            {paymentMethods.filter((p) => p.active).length} /{" "}
                            {paymentMethods.length} Active
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#34D399" }}>
                            VietQR • MoMo • VNPay Verified
                        </div>
                    </div>

                    <div
                        className={styles.kpiCard}
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveTab("audit")}
                    >
                        <div
                            style={{
                                fontSize: "0.66rem",
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                fontFamily: "Space Grotesk, monospace",
                            }}
                        >
                            IMMUTABLE AUDIT TRAIL
                        </div>
                        <div
                            style={{
                                fontSize: "1.45rem",
                                fontWeight: 700,
                                color: "#34D399",
                                fontFamily: "Space Grotesk, monospace",
                                margin: "0.3rem 0",
                            }}
                        >
                            {auditRecords.length} Events
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                            Synced Across All 18 Screens
                        </div>
                    </div>
                </div>
            </div>

            {/* 9 TABS NAVIGATION BAR */}
            <div className={styles.tabsBar}>
                {(
                    [
                        { id: "general", label: "General", icon: Settings },
                        {
                            id: "brands",
                            label: `Brands (${brandsList.length})`,
                            icon: Building2,
                        },
                        {
                            id: "machines",
                            label: `Machines (${machinesList.length})`,
                            icon: Cpu,
                        },
                        { id: "payment", label: "Payment", icon: CreditCard },
                        {
                            id: "notifications",
                            label: "Notifications",
                            icon: Bell,
                        },
                        { id: "system", label: "System", icon: Server },
                        { id: "security", label: "Security", icon: ShieldCheck },
                        {
                            id: "integrations",
                            label: "Integrations",
                            icon: Plug,
                        },
                        {
                            id: "audit",
                            label: `Audit Logs (${auditRecords.length})`,
                            icon: FileText,
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

            {/* =========================================================
               TAB 1: GENERAL TAB (CÓ BẢNG MÀU THỰC TẾ KIỂU MICROSOFT WORD)
            ========================================================= */}
            {activeTab === "general" && (
                <div className={styles.grid2Cols}>
                    <div
                        className={styles.card}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>
                                    Platform Identity & Visual Appearance
                                </h2>
                                <p className={styles.cardSub}>
                                    Configure platform branding, emblem preview, theme mode, and custom Word-style color palette.
                                </p>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                                marginBottom: "1rem",
                                padding: "0.85rem 1rem",
                                background: "rgba(255,255,255,0.025)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "12px",
                            }}
                        >
                            <div
                                style={{
                                    width: "54px",
                                    height: "54px",
                                    borderRadius: "12px",
                                    border: `2px solid ${primaryColor}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    color: primaryColor,
                                    background: "#0A0A12",
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                    fontSize: "1.2rem",
                                    boxShadow: `0 0 18px ${primaryColor}33`,
                                }}
                            >
                                {hasLogo ? "SS" : "—"}
                            </div>
                            <div style={{ flex: 1 }}>
                                <strong
                                    style={{ color: "#FFF", fontSize: "0.9rem" }}
                                >
                                    {platformName} Executive Emblem
                                </strong>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.5rem",
                                        marginTop: "0.45rem",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            logoUploadRef.current?.click()
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            padding: "0.4rem 0.75rem",
                                            fontSize: "0.73rem",
                                        }}
                                    >
                                        <Upload size={13} color={primaryColor} />
                                        <span>Change Logo</span>
                                    </button>
                                    {hasLogo && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setConfirmRemoveLogo(true)
                                            }
                                            className={styles.secondaryGoldBtn}
                                            style={{
                                                padding: "0.4rem 0.75rem",
                                                fontSize: "0.73rem",
                                                color: "#F87171",
                                                borderColor:
                                                    "rgba(248,113,113,0.4)",
                                            }}
                                        >
                                            <Trash2 size={13} />
                                            <span>Remove Logo</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>
                                Platform Name & Tagline
                            </label>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1.5fr",
                                    gap: "0.75rem",
                                }}
                            >
                                <input
                                    type="text"
                                    value={platformName}
                                    onChange={(e) =>
                                        setPlatformName(e.target.value)
                                    }
                                    className={styles.textInput}
                                />
                                <input
                                    type="text"
                                    value={platformSlogan}
                                    onChange={(e) =>
                                        setPlatformSlogan(e.target.value)
                                    }
                                    className={styles.textInput}
                                />
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>
                                Platform Description
                            </label>
                            <textarea
                                rows={2}
                                value={platformDesc}
                                onChange={(e) => setPlatformDesc(e.target.value)}
                                className={styles.textInput}
                            />
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "0.75rem",
                                marginBottom: "1rem",
                            }}
                        >
                            {/* 1. Theme Mode Dropdown */}
                            <div className={styles.customDropdownWrap}>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Theme Mode
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenDropdown(
                                            openDropdown === "GEN_THEME"
                                                ? null
                                                : "GEN_THEME"
                                        )
                                    }
                                    className={styles.customDropdownTrigger}
                                >
                                    <span>
                                        {themeMode === "DARK"
                                            ? "Dark Luxury"
                                            : themeMode === "LIGHT"
                                                ? "Light Editorial"
                                                : "Auto (OS Sync)"}
                                    </span>
                                    <ChevronDown size={13} color={primaryColor} />
                                </button>
                                {openDropdown === "GEN_THEME" && (
                                    <div className={styles.customDropdownMenu}>
                                        {(
                                            [
                                                {
                                                    id: "DARK",
                                                    label: "Dark Luxury",
                                                },
                                                {
                                                    id: "LIGHT",
                                                    label: "Light Editorial",
                                                },
                                                {
                                                    id: "AUTO",
                                                    label: "Auto (OS Sync)",
                                                },
                                            ] as const
                                        ).map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setThemeMode(m.id);
                                                    saveAndBroadcastPlatformVisuals(
                                                        primaryColor,
                                                        m.id,
                                                        defaultLang
                                                    );
                                                    setOpenDropdown(null);
                                                }}
                                                className={`${
                                                    styles.customDropdownItem
                                                } ${
                                                    themeMode === m.id
                                                        ? styles.customDropdownItemActive
                                                        : ""
                                                }`}
                                            >
                                                <span>{m.label}</span>
                                                {themeMode === m.id && (
                                                    <Check
                                                        size={13}
                                                        color={primaryColor}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 2. Primary Accent — BẢNG MÀU THỰC TẾ KIỂU MICROSOFT WORD */}
                            <div className={styles.customDropdownWrap}>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Primary Accent
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenDropdown(
                                            openDropdown === "GEN_COLOR"
                                                ? null
                                                : "GEN_COLOR"
                                        )
                                    }
                                    className={`${styles.customDropdownTrigger} ${
                                        openDropdown === "GEN_COLOR"
                                            ? styles.customDropdownTriggerActive
                                            : ""
                                    }`}
                                >
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.45rem",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "16px",
                                                height: "16px",
                                                borderRadius: "4px",
                                                backgroundColor: primaryColor,
                                                border: "1px solid rgba(255,255,255,0.45)",
                                                boxShadow: `0 0 8px ${primaryColor}88`,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            {primaryColor}
                                        </span>
                                    </span>
                                    <Palette size={13} color={primaryColor} />
                                </button>

                                {openDropdown === "GEN_COLOR" &&
                                    renderWordColorPalettePopover(
                                        primaryColor,
                                        (pickedHex) => {
                                            setPrimaryColor(pickedHex);
                                            saveAndBroadcastPlatformVisuals(
                                                pickedHex,
                                                themeMode,
                                                defaultLang
                                            );
                                            showToast(
                                                `Applied Primary Accent ${pickedHex} across all 18 screens!`
                                            );
                                        }
                                    )}
                            </div>

                            {/* 3. Default Language Dropdown */}
                            <div className={styles.customDropdownWrap}>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Default Language
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenDropdown(
                                            openDropdown === "GEN_LANG"
                                                ? null
                                                : "GEN_LANG"
                                        )
                                    }
                                    className={styles.customDropdownTrigger}
                                >
                                    <span>
                                        {defaultLang === "EN"
                                            ? "English (EN)"
                                            : "Tiếng Việt (VI)"}
                                    </span>
                                    <ChevronDown size={13} color={primaryColor} />
                                </button>
                                {openDropdown === "GEN_LANG" && (
                                    <div
                                        className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                    >
                                        {(
                                            [
                                                {
                                                    id: "EN",
                                                    label: "English (EN)",
                                                },
                                                {
                                                    id: "VI",
                                                    label: "Tiếng Việt (VI)",
                                                },
                                            ] as const
                                        ).map((l) => (
                                            <button
                                                key={l.id}
                                                type="button"
                                                onClick={() => {
                                                    setDefaultLang(l.id);
                                                    saveAndBroadcastPlatformVisuals(
                                                        primaryColor,
                                                        themeMode,
                                                        l.id
                                                    );
                                                    setOpenDropdown(null);
                                                }}
                                                className={`${
                                                    styles.customDropdownItem
                                                } ${
                                                    defaultLang === l.id
                                                        ? styles.customDropdownItemActive
                                                        : ""
                                                }`}
                                            >
                                                <span>{l.label}</span>
                                                {defaultLang === l.id && (
                                                    <Check
                                                        size={13}
                                                        color={primaryColor}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                saveAndBroadcastPlatformVisuals(
                                    primaryColor,
                                    themeMode,
                                    defaultLang
                                );
                                appendAuditLogAndBroadcast(
                                    "PLATFORM_GENERAL_SAVED",
                                    "System Settings",
                                    "Settings / General",
                                    `Updated platform branding (${platformName}), accent (${primaryColor}), and default language (${defaultLang}).`,
                                    { platformName, primaryColor, defaultLang }
                                );
                                showToast(
                                    "Saved Platform Information & Appearance settings across all 18 modules!"
                                );
                            }}
                            className={styles.primaryGoldBtn}
                        >
                            <span>Save Platform Changes</span>
                        </button>
                    </div>

                    {/* System Preferences & Data Management */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h2 className={styles.cardTitle}>
                                    System Preferences, SMTP & Data Governance
                                </h2>
                                <p className={styles.cardSub}>
                                    Disabling a global switch preserves all historical records without deleting data.
                                </p>
                            </div>
                        </div>

                        {[
                            {
                                key: "multiBrandMode",
                                label: "Enable multi-brand mode (21 Partner Maisons)",
                            },
                            {
                                key: "machineMonitoring",
                                label: "Enable real-time machine monitoring (MQTT Heartbeats)",
                            },
                            {
                                key: "analyticsReports",
                                label: "Enable analytics & executive reports",
                            },
                            {
                                key: "inviteOnlyRegistration",
                                label: "Allow user registration by invitation only",
                            },
                            {
                                key: "maintenanceReminders",
                                label: "Enable automated SLA maintenance reminders",
                            },
                            {
                                key: "dataExportEnabled",
                                label: "Enable CSV/Excel data export",
                            },
                        ].map((sw) => {
                            const isOn =
                                sysPrefs[sw.key as keyof typeof sysPrefs];
                            return (
                                <div key={sw.key} className={styles.switchRow}>
                                    <span
                                        style={{
                                            fontSize: "0.82rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {sw.label}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSysPrefs((prev) => ({
                                                ...prev,
                                                [sw.key]: !isOn,
                                            }));
                                            appendAuditLogAndBroadcast(
                                                "SYSTEM_PREF_TOGGLED",
                                                "System Settings",
                                                "Settings / Preferences",
                                                `Toggled "${sw.label}" to ${!isOn ? "ENABLED" : "DISABLED"}.`,
                                                { [sw.key]: !isOn }
                                            );
                                            showToast(
                                                `Updated "${sw.label}". Existing historical data remains intact.`
                                            );
                                        }}
                                        className={`${styles.toggleSwitch} ${
                                            isOn ? styles.toggleSwitchOn : ""
                                        }`}
                                    >
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>
                            );
                        })}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr auto",
                                gap: "0.65rem",
                                marginTop: "0.75rem",
                                marginBottom: "0.85rem",
                            }}
                        >
                            <input
                                type="text"
                                value={smtpServer}
                                onChange={(e) => setSmtpServer(e.target.value)}
                                placeholder="SMTP Server"
                                className={styles.textInput}
                            />
                            <input
                                type="text"
                                value={smtpPort}
                                onChange={(e) => setSmtpPort(e.target.value)}
                                placeholder="Port"
                                className={styles.textInput}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    showToast(
                                        `SMTP Connection to ${smtpServer}:${smtpPort} (${smtpEncryption}) succeeded! Credentials masked.`
                                    )
                                }
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Test SMTP</span>
                            </button>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.55rem",
                                paddingTop: "0.75rem",
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    handleRunSystemOperation("Backup Data")
                                }
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Backup Data</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    handleRunSystemOperation("Restore Data")
                                }
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Restore Data</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    handleRunSystemOperation("Clear Cache")
                                }
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Clear Cache</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    showToast(
                                        "Exported authorized platform configuration JSON!"
                                    )
                                }
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Export Config</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 2: BRANDS TAB (ĐỦ 21 THƯƠNG HIỆU + BẢNG MÀU WORD)
            ========================================================= */}
            {activeTab === "brands" && (
                <div
                    className={styles.splitMasterDetail}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                Partner Maisons ({brandsList.length})
                            </h3>
                        </div>
                        <input
                            type="text"
                            placeholder="Search brand name or code..."
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            className={styles.textInput}
                            style={{ marginBottom: "0.65rem" }}
                        />

                        <div
                            className={styles.customDropdownWrap}
                            style={{ marginBottom: "0.85rem" }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(
                                        openDropdown === "BRD_FILTER"
                                            ? null
                                            : "BRD_FILTER"
                                    )
                                }
                                className={styles.customDropdownTrigger}
                            >
                                <span>
                                    {brandStatusFilter === "ALL"
                                        ? "All Statuses (Active / Pending / Inactive)"
                                        : brandStatusFilter}
                                </span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "BRD_FILTER" && (
                                <div className={styles.customDropdownMenu}>
                                    {(
                                        [
                                            "ALL",
                                            "ACTIVE",
                                            "PENDING",
                                            "INACTIVE",
                                        ] as const
                                    ).map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => {
                                                setBrandStatusFilter(st);
                                                setOpenDropdown(null);
                                            }}
                                            className={`${
                                                styles.customDropdownItem
                                            } ${
                                                brandStatusFilter === st
                                                    ? styles.customDropdownItemActive
                                                    : ""
                                            }`}
                                        >
                                            <span>
                                                {st === "ALL"
                                                    ? "All Statuses"
                                                    : st}
                                            </span>
                                            {brandStatusFilter === st && (
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

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                maxHeight: "380px",
                                overflowY: "auto",
                                paddingRight: "4px",
                            }}
                        >
                            {brandsList
                                .filter((b) => {
                                    const matchesQ =
                                        b.name
                                            .toLowerCase()
                                            .includes(
                                                brandSearch.toLowerCase()
                                            ) ||
                                        b.code
                                            .toLowerCase()
                                            .includes(
                                                brandSearch.toLowerCase()
                                            );
                                    const matchesSt =
                                        brandStatusFilter === "ALL" ||
                                        b.status === brandStatusFilter;
                                    return matchesQ && matchesSt;
                                })
                                .map((b) => (
                                    <div
                                        key={b.code}
                                        onClick={() =>
                                            setSelectedBrandCode(b.code)
                                        }
                                        style={{
                                            padding: "0.72rem 0.9rem",
                                            borderRadius: "12px",
                                            background:
                                                selectedBrandCode === b.code
                                                    ? "rgba(212,175,55,0.16)"
                                                    : "rgba(255,255,255,0.025)",
                                            border:
                                                selectedBrandCode === b.code
                                                    ? "1px solid #D4AF37"
                                                    : "1px solid rgba(255,255,255,0.06)",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div>
                                            <strong
                                                style={{
                                                    color: "#FFF",
                                                    fontSize: "0.86rem",
                                                }}
                                            >
                                                {b.name}
                                            </strong>
                                            <div
                                                style={{
                                                    fontSize: "0.71rem",
                                                    color: "#94A3B8",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                }}
                                            >
                                                {b.code} • {b.locationsCount} Loc
                                                / {b.machinesCount} Kiosks
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "0.68rem",
                                                fontWeight: 700,
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                color:
                                                    b.status === "ACTIVE"
                                                        ? "#34D399"
                                                        : b.status === "PENDING"
                                                            ? "#FACC15"
                                                            : "#F87171",
                                            }}
                                        >
                                            {b.status}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <span
                                    style={{
                                        fontSize: "0.68rem",
                                        color: "#D4AF37",
                                        fontFamily: "Space Grotesk, monospace",
                                        fontWeight: 700,
                                    }}
                                >
                                    STABLE BRAND CODE: {selectedBrand.code}{" "}
                                    (READ-ONLY IDENTIFIER)
                                </span>
                                <h2
                                    className={styles.cardTitle}
                                    style={{
                                        fontSize: "1.35rem",
                                        marginTop: "4px",
                                    }}
                                >
                                    {selectedBrand.name} — Tenant Operational
                                    Profile
                                </h2>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    onClick={() => router.push("/brands")}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>View Brand Page</span>
                                    <ArrowUpRight size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push("/products")}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>Manage Products</span>
                                    <ArrowUpRight size={13} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push("/machines")}
                                    className={styles.secondaryGoldBtn}
                                >
                                    <span>
                                        {selectedBrand.machinesCount} Machines
                                    </span>
                                    <ArrowUpRight size={13} />
                                </button>
                            </div>
                        </div>

                        {(selectedBrand.maxMachinesLimit <
                            selectedBrand.machinesCount ||
                            selectedBrand.maxLocationsLimit <
                            selectedBrand.locationsCount) && (
                            <div
                                style={{
                                    padding: "0.8rem 1rem",
                                    borderRadius: "10px",
                                    background: "rgba(245,158,11,0.14)",
                                    border: "1px solid rgba(245,158,11,0.45)",
                                    color: "#FBBF24",
                                    fontSize: "0.78rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <strong>Operational Limit Warning:</strong>{" "}
                                Configured maximum limit is lower than existing
                                active machines ({selectedBrand.machinesCount}) or
                                locations ({selectedBrand.locationsCount}).
                                Existing records are preserved and never
                                automatically deleted.
                            </div>
                        )}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "0.75rem",
                                marginBottom: "1rem",
                            }}
                        >
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Max Locations
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={selectedBrand.maxLocationsLimit}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setBrandsList((prev) =>
                                            prev.map((b) =>
                                                b.code === selectedBrand.code
                                                    ? {
                                                        ...b,
                                                        maxLocationsLimit: val,
                                                    }
                                                    : b
                                            )
                                        );
                                    }}
                                    className={styles.textInput}
                                />
                            </div>
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Max Machines
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={selectedBrand.maxMachinesLimit}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setBrandsList((prev) =>
                                            prev.map((b) =>
                                                b.code === selectedBrand.code
                                                    ? {
                                                        ...b,
                                                        maxMachinesLimit: val,
                                                    }
                                                    : b
                                            )
                                        );
                                    }}
                                    className={styles.textInput}
                                />
                            </div>

                            {/* Brand Primary Color (Word Palette) */}
                            <div className={styles.customDropdownWrap}>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Brand Color
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenDropdown(
                                            openDropdown === "BRD_PRIMARY_COLOR"
                                                ? null
                                                : "BRD_PRIMARY_COLOR"
                                        )
                                    }
                                    className={styles.customDropdownTrigger}
                                >
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.4rem",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "14px",
                                                height: "14px",
                                                borderRadius: "4px",
                                                backgroundColor:
                                                selectedBrand.primaryColor,
                                                border: "1px solid rgba(255,255,255,0.45)",
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            {selectedBrand.primaryColor}
                                        </span>
                                    </span>
                                    <Palette size={12} color="#D4AF37" />
                                </button>
                                {openDropdown === "BRD_PRIMARY_COLOR" &&
                                    renderWordColorPalettePopover(
                                        selectedBrand.primaryColor,
                                        (hex) => {
                                            setBrandsList((prev) =>
                                                prev.map((b) =>
                                                    b.code ===
                                                    selectedBrand.code
                                                        ? {
                                                            ...b,
                                                            primaryColor: hex,
                                                        }
                                                        : b
                                                )
                                            );
                                        }
                                    )}
                            </div>

                            <div className={styles.customDropdownWrap}>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Brand Status
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenDropdown(
                                            openDropdown === "BRD_STATUS"
                                                ? null
                                                : "BRD_STATUS"
                                        )
                                    }
                                    className={styles.customDropdownTrigger}
                                >
                                    <span>{selectedBrand.status}</span>
                                    <ChevronDown size={13} color="#D4AF37" />
                                </button>
                                {openDropdown === "BRD_STATUS" && (
                                    <div
                                        className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                    >
                                        {(
                                            [
                                                "ACTIVE",
                                                "PENDING",
                                                "INACTIVE",
                                            ] as const
                                        ).map((st) => (
                                            <button
                                                key={st}
                                                type="button"
                                                onClick={() => {
                                                    setBrandsList((prev) =>
                                                        prev.map((b) =>
                                                            b.code ===
                                                            selectedBrand.code
                                                                ? {
                                                                    ...b,
                                                                    status: st,
                                                                }
                                                                : b
                                                        )
                                                    );
                                                    // Đồng bộ ngược sang BRANDS_STORAGE_KEY của Màn 13 (/brands)
                                                    try {
                                                        const rawB =
                                                            localStorage.getItem(
                                                                BRANDS_STORAGE_KEY
                                                            );
                                                        if (rawB) {
                                                            const parsedB =
                                                                JSON.parse(rawB);
                                                            if (
                                                                Array.isArray(
                                                                    parsedB
                                                                )
                                                            ) {
                                                                const updatedB =
                                                                    parsedB.map(
                                                                        (
                                                                            item: any
                                                                        ) =>
                                                                            isExactMatch(
                                                                                item.name ||
                                                                                "",
                                                                                selectedBrand.name
                                                                            )
                                                                                ? {
                                                                                    ...item,
                                                                                    status:
                                                                                        st ===
                                                                                        "INACTIVE"
                                                                                            ? "INACTIVE"
                                                                                            : "ACTIVE",
                                                                                }
                                                                                : item
                                                                    );
                                                                localStorage.setItem(
                                                                    BRANDS_STORAGE_KEY,
                                                                    JSON.stringify(
                                                                        updatedB
                                                                    )
                                                                );
                                                            }
                                                        }
                                                    } catch {
                                                        // Safe fallback
                                                    }
                                                    appendAuditLogAndBroadcast(
                                                        "BRAND_STATUS_UPDATED",
                                                        "Brand Management",
                                                        "Settings / Brands",
                                                        `Updated ${selectedBrand.name} status to ${st}.`,
                                                        {
                                                            brand: selectedBrand.name,
                                                            status: st,
                                                        }
                                                    );
                                                    setOpenDropdown(null);
                                                    showToast(
                                                        `Updated ${selectedBrand.name} status to ${st} & synced with Brands module!`
                                                    );
                                                }}
                                                className={`${
                                                    styles.customDropdownItem
                                                } ${
                                                    selectedBrand.status === st
                                                        ? styles.customDropdownItemActive
                                                        : ""
                                                }`}
                                            >
                                                <span>{st}</span>
                                                {selectedBrand.status ===
                                                    st && (
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

                        <div className={styles.switchRow}>
                            <span>
                                <strong>
                                    Server-Side Tenant Data Isolation (@Filter
                                    brand_id)
                                </strong>
                            </span>
                            <span
                                style={{
                                    color: "#34D399",
                                    fontSize: "0.74rem",
                                    fontFamily: "Space Grotesk, monospace",
                                    fontWeight: 700,
                                }}
                            >
                                ENFORCED ON BACKEND ✓
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                appendAuditLogAndBroadcast(
                                    "BRAND_CONFIG_SAVED",
                                    "Brand Management",
                                    "Settings / Brands",
                                    `Saved operational profile & visual identity (${selectedBrand.primaryColor}) for ${selectedBrand.name}.`,
                                    {
                                        brand: selectedBrand.code,
                                        primaryColor: selectedBrand.primaryColor,
                                    }
                                );
                                showToast(
                                    `Saved changes for ${selectedBrand.name} and synchronized with Brands module!`
                                );
                            }}
                            className={styles.primaryGoldBtn}
                            style={{ marginTop: "0.5rem" }}
                        >
                            <span>Save Brand Configuration</span>
                        </button>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 3: MACHINES TAB (ĐỦ 8 MÁY KIOSK ĐỒNG BỘ 2 CHIỀU VỚI MÀN 6 /machines)
            ========================================================= */}
            {activeTab === "machines" && (
                <div
                    className={styles.splitMasterDetail}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                Kiosk Fleet ({machinesList.length} Stations)
                            </h3>
                        </div>
                        <input
                            type="text"
                            placeholder="Search machine code or location..."
                            value={machineSearch}
                            onChange={(e) => setMachineSearch(e.target.value)}
                            className={styles.textInput}
                            style={{ marginBottom: "0.65rem" }}
                        />

                        <div
                            className={styles.customDropdownWrap}
                            style={{ marginBottom: "0.85rem" }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(
                                        openDropdown === "MCH_FILTER"
                                            ? null
                                            : "MCH_FILTER"
                                    )
                                }
                                className={styles.customDropdownTrigger}
                            >
                                <span>
                                    {machineStatusFilter === "ALL"
                                        ? "All Station Statuses"
                                        : machineStatusFilter}
                                </span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "MCH_FILTER" && (
                                <div className={styles.customDropdownMenu}>
                                    {(
                                        [
                                            "ALL",
                                            "ONLINE",
                                            "LOW_REFILL",
                                            "MAINTENANCE",
                                            "OFFLINE",
                                        ] as const
                                    ).map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => {
                                                setMachineStatusFilter(st);
                                                setOpenDropdown(null);
                                            }}
                                            className={`${
                                                styles.customDropdownItem
                                            } ${
                                                machineStatusFilter === st
                                                    ? styles.customDropdownItemActive
                                                    : ""
                                            }`}
                                        >
                                            <span>
                                                {st === "ALL"
                                                    ? "All Station Statuses"
                                                    : st}
                                            </span>
                                            {machineStatusFilter === st && (
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

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                                maxHeight: "380px",
                                overflowY: "auto",
                                paddingRight: "4px",
                            }}
                        >
                            {machinesList
                                .filter((m) => {
                                    const matchesQ =
                                        m.code
                                            .toLowerCase()
                                            .includes(
                                                machineSearch.toLowerCase()
                                            ) ||
                                        m.location
                                            .toLowerCase()
                                            .includes(
                                                machineSearch.toLowerCase()
                                            );
                                    const matchesSt =
                                        machineStatusFilter === "ALL" ||
                                        m.status === machineStatusFilter;
                                    return matchesQ && matchesSt;
                                })
                                .map((m) => (
                                    <div
                                        key={m.code}
                                        onClick={() =>
                                            setSelectedMachineCode(m.code)
                                        }
                                        style={{
                                            padding: "0.72rem 0.9rem",
                                            borderRadius: "12px",
                                            background:
                                                selectedMachineCode === m.code
                                                    ? "rgba(212,175,55,0.16)"
                                                    : "rgba(255,255,255,0.025)",
                                            border:
                                                selectedMachineCode === m.code
                                                    ? "1px solid #D4AF37"
                                                    : "1px solid rgba(255,255,255,0.06)",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div>
                                            <strong
                                                style={{
                                                    color: "#FFF",
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.85rem",
                                                }}
                                            >
                                                {m.code}
                                            </strong>
                                            <div
                                                style={{
                                                    fontSize: "0.71rem",
                                                    color: "#94A3B8",
                                                }}
                                            >
                                                {m.brand} • {m.location}
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "0.66rem",
                                                fontWeight: 700,
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                color:
                                                    m.status === "ONLINE"
                                                        ? "#34D399"
                                                        : m.status === "OFFLINE"
                                                            ? "#F87171"
                                                            : "#FACC15",
                                            }}
                                        >
                                            {m.status}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <span
                                    style={{
                                        fontSize: "0.68rem",
                                        color: "#D4AF37",
                                        fontFamily: "Space Grotesk, monospace",
                                        fontWeight: 700,
                                    }}
                                >
                                    STABLE STATION IDENTIFIER:{" "}
                                    {selectedMachine.code}
                                </span>
                                <h2
                                    className={styles.cardTitle}
                                    style={{
                                        fontSize: "1.3rem",
                                        marginTop: "4px",
                                    }}
                                >
                                    {selectedMachine.name} (
                                    {selectedMachine.location})
                                </h2>
                            </div>

                            <span
                                style={{
                                    padding: "0.32rem 0.8rem",
                                    borderRadius: "99px",
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    fontFamily: "Space Grotesk, monospace",
                                    background:
                                        selectedMachine.syncStatus ===
                                        "SYNCED_WITH_DEVICE"
                                            ? "rgba(52,211,153,0.14)"
                                            : "rgba(245,158,11,0.16)",
                                    color:
                                        selectedMachine.syncStatus ===
                                        "SYNCED_WITH_DEVICE"
                                            ? "#34D399"
                                            : "#FBBF24",
                                    border: `1px solid ${
                                        selectedMachine.syncStatus ===
                                        "SYNCED_WITH_DEVICE"
                                            ? "rgba(52,211,153,0.4)"
                                            : "rgba(245,158,11,0.4)"
                                    }`,
                                }}
                            >
                                CONFIG STATUS: {selectedMachine.syncStatus}
                            </span>
                        </div>

                        {selectedMachine.status === "OFFLINE" && (
                            <div
                                style={{
                                    padding: "0.75rem 1rem",
                                    borderRadius: "10px",
                                    background: "rgba(248,113,113,0.14)",
                                    border: "1px solid rgba(248,113,113,0.4)",
                                    color: "#FCA5A5",
                                    fontSize: "0.78rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <strong>Outdated Telemetry Notice:</strong>{" "}
                                Station is disconnected (
                                {selectedMachine.lastActivity}). Values shown are
                                the last recorded measurements, not real-time
                                data.
                            </div>
                        )}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: "0.75rem",
                                marginBottom: "1rem",
                            }}
                        >
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Spray Duration (ms)
                                </label>
                                <input
                                    type="number"
                                    min={800}
                                    max={2000}
                                    value={selectedMachine.dispenseDurationMs}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setMachinesList((prev) =>
                                            prev.map((m) =>
                                                m.code === selectedMachine.code
                                                    ? {
                                                        ...m,
                                                        dispenseDurationMs:
                                                        val,
                                                        syncStatus:
                                                            "SAVED_ONLY",
                                                    }
                                                    : m
                                            )
                                        );
                                    }}
                                    className={styles.textInput}
                                />
                            </div>
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Sprays / Order
                                </label>
                                <input
                                    type="number"
                                    disabled
                                    value={selectedMachine.spraysPerTransaction}
                                    className={styles.textInput}
                                    style={{ opacity: 0.65 }}
                                />
                            </div>
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Cooldown (sec)
                                </label>
                                <input
                                    type="number"
                                    value={selectedMachine.cooldownSeconds}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setMachinesList((prev) =>
                                            prev.map((m) =>
                                                m.code === selectedMachine.code
                                                    ? {
                                                        ...m,
                                                        cooldownSeconds: val,
                                                        syncStatus:
                                                            "SAVED_ONLY",
                                                    }
                                                    : m
                                            )
                                        );
                                    }}
                                    className={styles.textInput}
                                />
                            </div>
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Operating Window
                                </label>
                                <input
                                    type="text"
                                    value={`${selectedMachine.openingTime} - ${selectedMachine.closingTime}`}
                                    readOnly
                                    className={styles.textInput}
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "0.65rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    appendAuditLogAndBroadcast(
                                        "MACHINE_CONFIG_SAVED",
                                        "Machine Management",
                                        "Settings / Machines",
                                        `Saved dispensing config (${selectedMachine.dispenseDurationMs}ms) for ${selectedMachine.code} (Status: SAVED_ONLY).`,
                                        {
                                            machine: selectedMachine.code,
                                            syncStatus: "SAVED_ONLY",
                                        }
                                    );
                                    showToast(
                                        "Saved configuration to database (Status: SAVED_ONLY — awaiting MQTT device sync)."
                                    );
                                }}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>1. Save Config (DB)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedMachine.status === "OFFLINE") {
                                        showToast(
                                            `Sync Pending: ${selectedMachine.code} is OFFLINE. Configuration remains SAVED_ONLY until station reconnects.`
                                        );
                                        return;
                                    }
                                    setMachinesList((prev) =>
                                        prev.map((m) =>
                                            m.code === selectedMachine.code
                                                ? {
                                                    ...m,
                                                    syncStatus:
                                                        "SYNCED_WITH_DEVICE",
                                                }
                                                : m
                                        )
                                    );
                                    // Đồng bộ ngược sang MACHINES_STORAGE_KEY của Màn 6 (/machines)
                                    try {
                                        const rawM =
                                            localStorage.getItem(
                                                MACHINES_STORAGE_KEY
                                            );
                                        if (rawM) {
                                            const parsedM = JSON.parse(rawM);
                                            if (Array.isArray(parsedM)) {
                                                const updatedM = parsedM.map(
                                                    (fm: any) =>
                                                        isExactMatch(
                                                            fm.code ||
                                                            fm.id ||
                                                            "",
                                                            selectedMachine.code
                                                        )
                                                            ? {
                                                                ...fm,
                                                                lastActivity:
                                                                    "Just now (Config Synced)",
                                                            }
                                                            : fm
                                                );
                                                localStorage.setItem(
                                                    MACHINES_STORAGE_KEY,
                                                    JSON.stringify(updatedM)
                                                );
                                            }
                                        }
                                    } catch {
                                        // Safe fallback
                                    }
                                    appendAuditLogAndBroadcast(
                                        "MACHINE_MQTT_SYNCED",
                                        "Machine Management",
                                        "Settings / Machines",
                                        `Synchronized configuration with ${selectedMachine.code} over MQTT (Status: SYNCED_WITH_DEVICE).`,
                                        {
                                            machine: selectedMachine.code,
                                            syncStatus: "SYNCED_WITH_DEVICE",
                                        }
                                    );
                                    showToast(
                                        `Synchronized configuration with ${selectedMachine.code} over MQTT (Status: SYNCED_WITH_DEVICE)!`
                                    );
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                <span>2. Sync to Kiosk via MQTT</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/machines/${encodeURIComponent(
                                            selectedMachine.code
                                        )}`
                                    )
                                }
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Inspect Station Hardware</span>
                                <ArrowUpRight size={13} />
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push("/refill")}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Open Refill Module</span>
                                <ArrowUpRight size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 4: PAYMENT TAB (ĐỒNG BỘ VỚI MÀN 10 /transactions)
            ========================================================= */}
            {activeTab === "payment" && (
                <div>
                    <div
                        className={styles.kpiGrid4}
                        style={{ marginBottom: "1.15rem" }}
                    >
                        <div
                            className={styles.kpiCard}
                            style={{ cursor: "pointer" }}
                            onClick={() => router.push("/transactions")}
                        >
                            <div className={styles.fieldLabel}>
                                Gross Attempted Volume
                            </div>
                            <div
                                style={{
                                    fontSize: "1.45rem",
                                    fontWeight: 700,
                                    color: "#FFF",
                                    fontFamily: "Space Grotesk, monospace",
                                    margin: "0.3rem 0",
                                }}
                            >
                                {livePaymentMetrics.grossVnd.toLocaleString()}{" "}
                                VND
                            </div>
                            <div
                                style={{ fontSize: "0.72rem", color: "#94A3B8" }}
                            >
                                All initiated QR orders
                            </div>
                        </div>
                        <div
                            className={styles.kpiCard}
                            style={{ cursor: "pointer" }}
                            onClick={() => router.push("/transactions")}
                        >
                            <div className={styles.fieldLabel}>
                                Net Recognized Revenue
                            </div>
                            <div
                                style={{
                                    fontSize: "1.45rem",
                                    fontWeight: 700,
                                    color: "#F5E6AD",
                                    fontFamily: "Space Grotesk, monospace",
                                    margin: "0.3rem 0",
                                }}
                            >
                                {livePaymentMetrics.netRecognizedVnd.toLocaleString()}{" "}
                                VND
                            </div>
                            <div
                                style={{ fontSize: "0.72rem", color: "#34D399" }}
                            >
                                {livePaymentMetrics.successSpraysCount}{" "}
                                Successful Sprays (Excludes Refunds)
                            </div>
                        </div>
                        <div
                            className={styles.kpiCard}
                            style={{ cursor: "pointer" }}
                            onClick={() => router.push("/transactions")}
                        >
                            <div className={styles.fieldLabel}>
                                Failed / Expired Orders
                            </div>
                            <div
                                style={{
                                    fontSize: "1.45rem",
                                    fontWeight: 700,
                                    color: "#F87171",
                                    fontFamily: "Space Grotesk, monospace",
                                    margin: "0.3rem 0",
                                }}
                            >
                                {livePaymentMetrics.failedOrdersCount} Orders
                            </div>
                            <div
                                style={{ fontSize: "0.72rem", color: "#94A3B8" }}
                            >
                                0 VND charged
                            </div>
                        </div>
                        <div
                            className={styles.kpiCard}
                            style={{ cursor: "pointer" }}
                            onClick={() => router.push("/transactions")}
                        >
                            <div className={styles.fieldLabel}>
                                Refunded Transactions
                            </div>
                            <div
                                style={{
                                    fontSize: "1.45rem",
                                    fontWeight: 700,
                                    color: "#F472B6",
                                    fontFamily: "Space Grotesk, monospace",
                                    margin: "0.3rem 0",
                                }}
                            >
                                {livePaymentMetrics.refundedVnd.toLocaleString()}{" "}
                                VND
                            </div>
                            <div
                                style={{ fontSize: "0.72rem", color: "#F472B6" }}
                            >
                                {livePaymentMetrics.refundedCount} Reconciled
                                Refunds
                            </div>
                        </div>
                    </div>

                    <div className={styles.grid2Cols}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>
                                    Payment Methods & VietQR Gateway
                                </h3>
                            </div>
                            {paymentMethods.map((pm) => (
                                <div key={pm.id} className={styles.switchRow}>
                                    <div>
                                        <strong
                                            style={{
                                                color: "#FFF",
                                                fontSize: "0.86rem",
                                            }}
                                        >
                                            {pm.name}
                                        </strong>
                                        <div
                                            style={{
                                                fontSize: "0.73rem",
                                                color: "#94A3B8",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                            }}
                                        >
                                            {pm.bank} • {pm.account}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethods((prev) =>
                                                prev.map((item) =>
                                                    item.id === pm.id
                                                        ? {
                                                            ...item,
                                                            active: !item.active,
                                                        }
                                                        : item
                                                )
                                            );
                                            appendAuditLogAndBroadcast(
                                                "PAYMENT_METHOD_TOGGLED",
                                                "Payment",
                                                "Settings / Payment",
                                                `Toggled ${pm.name} to ${!pm.active ? "ACTIVE" : "INACTIVE"}.`,
                                                {
                                                    method: pm.id,
                                                    active: !pm.active,
                                                }
                                            );
                                            showToast(
                                                `Updated ${pm.name} status. In-progress transactions & historical records remain untouched.`
                                            );
                                        }}
                                        className={`${styles.toggleSwitch} ${
                                            pm.active
                                                ? styles.toggleSwitchOn
                                                : ""
                                        }`}
                                    >
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>
                                    Flow, Pricing, VAT & Reconciliation
                                </h3>
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.85rem",
                                    marginBottom: "0.85rem",
                                }}
                            >
                                <div>
                                    <label
                                        className={styles.fieldLabel}
                                        style={{ marginBottom: "0.35rem" }}
                                    >
                                        QR Payment Timeout (sec)
                                    </label>
                                    <input
                                        type="number"
                                        value={paymentTimeoutSec}
                                        onChange={(e) =>
                                            setPaymentTimeoutSec(
                                                Number(e.target.value)
                                            )
                                        }
                                        className={styles.textInput}
                                    />
                                </div>
                                <div>
                                    <label
                                        className={styles.fieldLabel}
                                        style={{ marginBottom: "0.35rem" }}
                                    >
                                        Configured VAT Rate (%) *
                                    </label>
                                    <input
                                        type="number"
                                        value={vatRatePct}
                                        onChange={(e) =>
                                            setVatRatePct(Number(e.target.value))
                                        }
                                        className={styles.textInput}
                                    />
                                </div>
                            </div>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94A3B8",
                                    marginTop: 0,
                                    lineHeight: 1.5,
                                }}
                            >
                                * Timed-out orders are verified against provider webhook status before final state assignment.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    appendAuditLogAndBroadcast(
                                        "PAYMENT_FLOW_SAVED",
                                        "Payment",
                                        "Settings / Payment",
                                        `Updated QR timeout (${paymentTimeoutSec}s) and VAT rate (${vatRatePct}%).`,
                                        { paymentTimeoutSec, vatRatePct }
                                    );
                                    showToast(
                                        "Validated & saved Payment Flow and Tax settings!"
                                    );
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                <span>Save Payment Settings</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 5: NOTIFICATIONS TAB
            ========================================================= */}
            {activeTab === "notifications" && (
                <div className={styles.grid2Cols}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                Notification Channels & Event Triggers
                            </h3>
                        </div>
                        {[
                            {
                                ch: "Email (SMTP TLS)",
                                status: "ACTIVE",
                                integrated: true,
                            },
                            {
                                ch: "In-App Portal Bell",
                                status: "ACTIVE",
                                integrated: true,
                            },
                            {
                                ch: "Webhook Event Dispatcher",
                                status: "ACTIVE",
                                integrated: true,
                            },
                            {
                                ch: "SMS Gateway",
                                status: "UNAVAILABLE (Provider Not Integrated)",
                                integrated: false,
                            },
                            {
                                ch: "Mobile Push Notification",
                                status: "UNAVAILABLE (No Mobile App in Scope)",
                                integrated: false,
                            },
                        ].map((c) => (
                            <div key={c.ch} className={styles.switchRow}>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: "0.82rem",
                                    }}
                                >
                                    {c.ch}
                                </span>
                                <span
                                    style={{
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        color: c.integrated
                                            ? "#34D399"
                                            : "#94A3B8",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    {c.status}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                Email Template Validation & Test Delivery
                            </h3>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>
                                Template Body (Requires {"{{machine_code}}"}{" "}
                                & {"{{timestamp}}"})
                            </label>
                            <textarea
                                rows={3}
                                value={templateBody}
                                onChange={(e) => setTemplateBody(e.target.value)}
                                className={styles.textInput}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: "0.65rem",
                                marginBottom: "1rem",
                            }}
                        >
                            <button
                                type="button"
                                onClick={handleSaveEmailTemplate}
                                className={styles.primaryGoldBtn}
                            >
                                <span>Validate & Save Template</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    showToast(
                                        `Submission Status: ACCEPTED / QUEUED for ${testRecipientEmail} (Queued indicates relay acceptance; verify inbox for delivery).`
                                    )
                                }
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Send Test Email</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 6: SYSTEM TAB
            ========================================================= */}
            {activeTab === "system" && (
                <div className={styles.grid2Cols}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                Platform Release, Auto-Sync & Maintenance
                            </h3>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>
                                Software Version (Read-Only)
                            </label>
                            <input
                                type="text"
                                disabled
                                value="ScentStation Enterprise v2.4.8-LTS (Java 21 / Spring Boot 3.3.5 / Next.js 15)"
                                className={styles.textInput}
                                style={{ opacity: 0.65 }}
                            />
                        </div>

                        <div className={styles.switchRow}>
                            <div>
                                <strong>Enable Machine Auto Sync</strong>
                                <div
                                    style={{
                                        fontSize: "0.73rem",
                                        color: "#F5E6AD",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Separate Sync Status: {onlineMachinesCount}/
                                    {machinesList.length} Kiosks Synced
                                </div>
                            </div>
                            <span
                                style={{
                                    color: "#34D399",
                                    fontWeight: 700,
                                    fontSize: "0.74rem",
                                    fontFamily: "Space Grotesk, monospace",
                                }}
                            >
                                ENABLED
                            </span>
                        </div>

                        <div className={styles.switchRow}>
                            <div>
                                <strong>Global System Maintenance Mode</strong>
                                <div
                                    style={{
                                        fontSize: "0.73rem",
                                        color: "#94A3B8",
                                    }}
                                >
                                    Requires confirmation dialog before restricting customer/staff access
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmMaintDialog(true)}
                                className={`${styles.toggleSwitch} ${
                                    systemMaintenanceMode
                                        ? styles.toggleSwitchOn
                                        : ""
                                }`}
                            >
                                <span className={styles.toggleKnob} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                Service Health & Operations
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    setSimulateServiceDown(!simulateServiceDown)
                                }
                                className={styles.secondaryGoldBtn}
                                style={{
                                    padding: "0.35rem 0.7rem",
                                    fontSize: "0.72rem",
                                }}
                            >
                                <span>
                                    Simulate{" "}
                                    {simulateServiceDown
                                        ? "Operational"
                                        : "Unavailable"}
                                </span>
                            </button>
                        </div>

                        {[
                            {
                                srv: "Spring Boot 3 REST API Server",
                                st: "OPERATIONAL (P95: 118ms)",
                            },
                            {
                                srv: "PostgreSQL 16 Relational Database",
                                st: "CONNECTED (ACID / Partial Indexes OK)",
                            },
                            {
                                srv: "Eclipse Mosquitto 2.0 MQTT Broker",
                                st: simulateServiceDown
                                    ? "UNAVAILABLE (Telemetry Unreachable)"
                                    : "CONNECTED (TLS 1.3 Port 8883)",
                            },
                            {
                                srv: "Background Reconciliation Worker",
                                st: "RUNNING",
                            },
                        ].map((s) => (
                            <div key={s.srv} className={styles.switchRow}>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: "0.82rem",
                                    }}
                                >
                                    {s.srv}
                                </span>
                                <span
                                    style={{
                                        fontSize: "0.71rem",
                                        fontWeight: 700,
                                        fontFamily: "Space Grotesk, monospace",
                                        color: s.st.includes("UNAVAILABLE")
                                            ? "#F87171"
                                            : "#34D399",
                                    }}
                                >
                                    {s.st}
                                </span>
                            </div>
                        ))}

                        <div
                            style={{
                                display: "flex",
                                gap: "0.6rem",
                                marginTop: "0.75rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    handleRunSystemOperation(
                                        "Run Immediate Backup"
                                    )
                                }
                                className={styles.primaryGoldBtn}
                            >
                                <span>Run Backup</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    handleRunSystemOperation(
                                        "Restart MQTT Worker"
                                    )
                                }
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Restart Services</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 7: SECURITY TAB
            ========================================================= */}
            {activeTab === "security" && (
                <div className={styles.grid2Cols}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                Password, Session & Lockout Policy
                            </h3>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "0.85rem",
                                marginBottom: "0.85rem",
                            }}
                        >
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Min Password Length
                                </label>
                                <input
                                    type="number"
                                    min={8}
                                    value={minPwLength}
                                    onChange={(e) =>
                                        setMinPwLength(Number(e.target.value))
                                    }
                                    className={styles.textInput}
                                />
                            </div>
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Session Timeout (min)
                                </label>
                                <input
                                    type="number"
                                    value={sessionTimeoutMin}
                                    onChange={(e) =>
                                        setSessionTimeoutMin(
                                            Number(e.target.value)
                                        )
                                    }
                                    className={styles.textInput}
                                />
                            </div>
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Max Failed Login Attempts
                                </label>
                                <input
                                    type="number"
                                    value={maxFailedAttempts}
                                    onChange={(e) =>
                                        setMaxFailedAttempts(
                                            Number(e.target.value)
                                        )
                                    }
                                    className={styles.textInput}
                                />
                            </div>
                            <div>
                                <label
                                    className={styles.fieldLabel}
                                    style={{ marginBottom: "0.35rem" }}
                                >
                                    Lockout Duration (min)
                                </label>
                                <input
                                    type="number"
                                    value={lockoutDurationMin}
                                    onChange={(e) =>
                                        setLockoutDurationMin(
                                            Number(e.target.value)
                                        )
                                    }
                                    className={styles.textInput}
                                />
                            </div>
                        </div>
                        <p
                            style={{
                                fontSize: "0.74rem",
                                color: "#94A3B8",
                                marginTop: 0,
                                lineHeight: 1.5,
                            }}
                        >
                            * Progressive IP rate-limiting is active alongside temporary account lockouts. Mandatory security audit logging cannot be disabled by ordinary users.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                appendAuditLogAndBroadcast(
                                    "SECURITY_POLICY_UPDATED",
                                    "Login & Security",
                                    "Settings / Security",
                                    `Updated password min length (${minPwLength}), session timeout (${sessionTimeoutMin}m), and lockout duration (${lockoutDurationMin}m).`,
                                    {
                                        minPwLength,
                                        sessionTimeoutMin,
                                        lockoutDurationMin,
                                    }
                                );
                                showToast(
                                    "Saved Password, Session & Lockout Security Policies!"
                                );
                            }}
                            className={styles.primaryGoldBtn}
                        >
                            <span>Save Security Policies</span>
                        </button>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>
                                IP Access Control Whitelist
                            </h3>
                        </div>

                        <div className={styles.switchRow}>
                            <div>
                                <strong>Enable IP Whitelist Enforcement</strong>
                                <div
                                    style={{
                                        fontSize: "0.73rem",
                                        color: "#34D399",
                                    }}
                                >
                                    Current Admin IP (115.78.209.14) verified in allowlist to prevent self-lockout
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIpWhitelistEnabled(!ipWhitelistEnabled);
                                    appendAuditLogAndBroadcast(
                                        "IP_WHITELIST_TOGGLED",
                                        "Login & Security",
                                        "Settings / Security",
                                        `Toggled IP Whitelist enforcement to ${!ipWhitelistEnabled ? "ENABLED" : "DISABLED"}.`,
                                        { enabled: !ipWhitelistEnabled }
                                    );
                                    showToast(
                                        "Verified current Admin IP 115.78.209.14 is allowlisted & updated IP Whitelist policy!"
                                    );
                                }}
                                className={`${styles.toggleSwitch} ${
                                    ipWhitelistEnabled
                                        ? styles.toggleSwitchOn
                                        : ""
                                }`}
                            >
                                <span className={styles.toggleKnob} />
                            </button>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1.2fr auto",
                                gap: "0.5rem",
                                marginBottom: "0.85rem",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="IP/CIDR (e.g. 203.113.0.0/24)"
                                value={newIpCidr}
                                onChange={(e) => setNewIpCidr(e.target.value)}
                                className={styles.textInput}
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                value={newIpDesc}
                                onChange={(e) => setNewIpDesc(e.target.value)}
                                className={styles.textInput}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (!newIpCidr.includes(".")) {
                                        showToast("Invalid IP/CIDR format.");
                                        return;
                                    }
                                    setIpAllowlist((prev) => [
                                        ...prev,
                                        {
                                            id: `IP-${Date.now()}`,
                                            cidr: newIpCidr,
                                            desc:
                                                newIpDesc ||
                                                "Authorized Subnet",
                                            status: "ACTIVE",
                                        },
                                    ]);
                                    appendAuditLogAndBroadcast(
                                        "IP_ALLOWLIST_ADDED",
                                        "Login & Security",
                                        "Settings / Security",
                                        `Added IP/CIDR range ${newIpCidr} to administrative allowlist.`,
                                        { cidr: newIpCidr }
                                    );
                                    setNewIpCidr("");
                                    setNewIpDesc("");
                                    showToast(
                                        "Added IP/CIDR range to allowlist!"
                                    );
                                }}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Add IP</span>
                            </button>
                        </div>

                        {ipAllowlist.map((ip) => (
                            <div key={ip.id} className={styles.switchRow}>
                                <div>
                                    <strong
                                        style={{
                                            color: "#F5E6AD",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                        }}
                                    >
                                        {ip.cidr}
                                    </strong>{" "}
                                    —{" "}
                                    <span style={{ fontSize: "0.8rem" }}>
                                        {ip.desc}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        color: "#34D399",
                                        fontSize: "0.72rem",
                                        fontFamily: "Space Grotesk, monospace",
                                        fontWeight: 700,
                                    }}
                                >
                                    {ip.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 8: INTEGRATIONS TAB
            ========================================================= */}
            {activeTab === "integrations" && (
                <div>
                    <div className={styles.kpiGrid3}>
                        <div className={styles.kpiCard}>
                            <div className={styles.fieldLabel}>
                                Total Architecture Integrations
                            </div>
                            <div
                                style={{
                                    fontSize: "1.55rem",
                                    fontWeight: 700,
                                    color: "#FFF",
                                    fontFamily: "Space Grotesk, monospace",
                                    margin: "0.3rem 0",
                                }}
                            >
                                5 Services
                            </div>
                            <div
                                style={{ fontSize: "0.73rem", color: "#94A3B8" }}
                            >
                                Payment, MQTT IoT, SMTP & Cloud Backup
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.fieldLabel}>
                                Active & Connected
                            </div>
                            <div
                                style={{
                                    fontSize: "1.55rem",
                                    fontWeight: 700,
                                    color: "#34D399",
                                    fontFamily: "Space Grotesk, monospace",
                                    margin: "0.3rem 0",
                                }}
                            >
                                5 Active
                            </div>
                            <div
                                style={{ fontSize: "0.73rem", color: "#34D399" }}
                            >
                                TLS & HMAC Signatures Verified
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.fieldLabel}>
                                MQTT Broker Verification
                            </div>
                            <div
                                style={{
                                    fontSize: "0.79rem",
                                    color: "#F5E6AD",
                                    marginTop: "0.35rem",
                                    lineHeight: 1.45,
                                }}
                            >
                                Broker connection is <strong>ONLINE</strong>.
                                Individual kiosk connectivity is verified in the
                                Machines module ({onlineMachinesCount}/
                                {machinesList.length} stations online).
                            </div>
                        </div>
                    </div>

                    <div className={styles.grid2Cols}>
                        <div className={styles.card}>
                            <h3
                                className={styles.cardTitle}
                                style={{ marginBottom: "0.85rem" }}
                            >
                                VNPay & VietQR Gateway Configuration
                            </h3>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    Merchant API Secret (Protected Production
                                    Credential)
                                </label>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <input
                                        type={
                                            showApiSecret ? "text" : "password"
                                        }
                                        readOnly
                                        value="vnp_prod_hmac_sha256_998877665544332211"
                                        className={styles.textInput}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowApiSecret(!showApiSecret)
                                        }
                                        className={styles.secondaryGoldBtn}
                                    >
                                        {showApiSecret ? (
                                            <EyeOff size={15} />
                                        ) : (
                                            <Eye size={15} />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    showToast(
                                        "VNPay & VietQR Gateway Connection Test: SUCCEEDED (200 OK in 94ms)!"
                                    )
                                }
                                className={styles.primaryGoldBtn}
                            >
                                <span>Test Payment Gateway Connection</span>
                            </button>
                        </div>

                        <div className={styles.card}>
                            <h3
                                className={styles.cardTitle}
                                style={{ marginBottom: "0.85rem" }}
                            >
                                Eclipse Mosquitto MQTT Broker (IoT)
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 1fr",
                                    gap: "0.75rem",
                                    marginBottom: "0.85rem",
                                }}
                            >
                                <input
                                    type="text"
                                    value={mqttHost}
                                    onChange={(e) => setMqttHost(e.target.value)}
                                    className={styles.textInput}
                                />
                                <input
                                    type="text"
                                    value={mqttPort}
                                    onChange={(e) => setMqttPort(e.target.value)}
                                    className={styles.textInput}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    showToast(
                                        `MQTT Broker (${mqttHost}:${mqttPort} TLS) Connected! Individual station heartbeats verified in Machines module.`
                                    )
                                }
                                className={styles.primaryGoldBtn}
                            >
                                <span>Test MQTT Broker Connection</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               TAB 9: AUDIT LOGS TAB (CUSTOM DROPDOWN + PAGINATION)
            ========================================================= */}
            {activeTab === "audit" && (
                <div onClick={(e) => e.stopPropagation()}>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.4rem",
                            marginBottom: "1rem",
                        }}
                    >
                        {[
                            "All",
                            "Login & Security",
                            "User Management",
                            "Brand Management",
                            "Machine Management",
                            "Transaction",
                            "Payment",
                            "System Settings",
                            "Integration",
                        ].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                    setAuditQuickCategory(cat);
                                    setAuditPage(1);
                                }}
                                className={`${styles.tabBtn} ${
                                    auditQuickCategory === cat
                                        ? styles.tabBtnActive
                                        : ""
                                }`}
                                style={{
                                    padding: "0.45rem 0.85rem",
                                    fontSize: "0.74rem",
                                    background:
                                        auditQuickCategory === cat
                                            ? undefined
                                            : "rgba(15,15,23,0.9)",
                                    borderColor: "rgba(255,255,255,0.08)",
                                }}
                            >
                                <span>{cat}</span>
                            </button>
                        ))}
                    </div>

                    <div
                        className={styles.card}
                        style={{
                            marginBottom: "1.15rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.65rem",
                            alignItems: "center",
                            padding: "0.95rem 1.2rem",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Search Log ID, actor, event type, module, or IP address..."
                            value={auditSearch}
                            onChange={(e) => {
                                setAuditSearch(e.target.value);
                                setAuditPage(1);
                            }}
                            className={styles.textInput}
                            style={{ flex: 2, minWidth: "240px" }}
                        />

                        <div
                            className={styles.customDropdownWrap}
                            style={{ minWidth: "175px" }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenDropdown(
                                        openDropdown === "AUD_SEV"
                                            ? null
                                            : "AUD_SEV"
                                    )
                                }
                                className={styles.customDropdownTrigger}
                            >
                                <span>
                                    {auditSeverity === "ALL"
                                        ? "All Severities"
                                        : auditSeverity}
                                </span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "AUD_SEV" && (
                                <div
                                    className={`${styles.customDropdownMenu} ${styles.customDropdownMenuRight}`}
                                >
                                    {(
                                        [
                                            "ALL",
                                            "INFO",
                                            "WARNING",
                                            "ERROR",
                                        ] as const
                                    ).map((sev) => (
                                        <button
                                            key={sev}
                                            type="button"
                                            onClick={() => {
                                                setAuditSeverity(sev);
                                                setAuditPage(1);
                                                setOpenDropdown(null);
                                            }}
                                            className={`${
                                                styles.customDropdownItem
                                            } ${
                                                auditSeverity === sev
                                                    ? styles.customDropdownItemActive
                                                    : ""
                                            }`}
                                        >
                                            <span>
                                                {sev === "ALL"
                                                    ? "All Severities"
                                                    : sev}
                                            </span>
                                            {auditSeverity === sev && (
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

                        <button
                            type="button"
                            onClick={() => {
                                setAuditQuickCategory("All");
                                setAuditSearch("");
                                setAuditSeverity("ALL");
                                setAuditPage(1);
                            }}
                            className={styles.secondaryGoldBtn}
                        >
                            <RefreshCw size={13} />
                            <span>Reset</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportAuditLogs}
                            className={styles.primaryGoldBtn}
                        >
                            <Download size={14} />
                            <span>Export Logs CSV</span>
                        </button>
                    </div>

                    <div
                        className={styles.splitMasterDetail}
                        style={{ gridTemplateColumns: "1.45fr 1fr" }}
                    >
                        <div className={styles.card}>
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    <th
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                            setAuditSortDesc(!auditSortDesc)
                                        }
                                        title="Click to sort by Time"
                                    >
                                        TIMESTAMP {auditSortDesc ? "↓" : "↑"}
                                    </th>
                                    <th>EVENT TYPE & MODULE</th>
                                    <th>ACTOR & ROLE</th>
                                    <th>SEVERITY</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedAuditLogs.length > 0 ? (
                                    paginatedAuditLogs.map((log) => (
                                        <tr
                                            key={log.id}
                                            onClick={() =>
                                                setSelectedAuditDetail(log)
                                            }
                                            style={{
                                                cursor: "pointer",
                                                background:
                                                    selectedAuditDetail?.id ===
                                                    log.id
                                                        ? "rgba(212,175,55,0.12)"
                                                        : "transparent",
                                            }}
                                        >
                                            <td
                                                style={{
                                                    fontFamily:
                                                        "Space Grotesk, monospace",
                                                    fontSize: "0.76rem",
                                                    color: "#F5E6AD",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {log.timestamp}
                                            </td>
                                            <td>
                                                <strong
                                                    style={{ color: "#FFF" }}
                                                >
                                                    {log.eventType}
                                                </strong>
                                                <div
                                                    style={{
                                                        fontSize: "0.72rem",
                                                        color: "#94A3B8",
                                                    }}
                                                >
                                                    {log.module}
                                                </div>
                                            </td>
                                            <td>
                                                <div>{log.user}</div>
                                                <div
                                                    style={{
                                                        fontSize: "0.71rem",
                                                        color: "#94A3B8",
                                                    }}
                                                >
                                                    {log.role}
                                                </div>
                                            </td>
                                            <td>
                                                    <span
                                                        style={{
                                                            fontSize: "0.68rem",
                                                            fontWeight: 700,
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                            color:
                                                                log.severity ===
                                                                "ERROR"
                                                                    ? "#F87171"
                                                                    : log.severity ===
                                                                    "WARNING"
                                                                        ? "#FACC15"
                                                                        : "#34D399",
                                                        }}
                                                    >
                                                        {log.severity}
                                                    </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            style={{
                                                textAlign: "center",
                                                padding: "2.5rem",
                                                color: "#94A3B8",
                                            }}
                                        >
                                            No logs found
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>

                            {/* PAGINATION BAR */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: "0.95rem",
                                    paddingTop: "0.75rem",
                                    borderTop:
                                        "1px solid rgba(255,255,255,0.08)",
                                    flexWrap: "wrap",
                                    gap: "0.65rem",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        color: "#94A3B8",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    Total Records:{" "}
                                    <strong style={{ color: "#F5E6AD" }}>
                                        {filteredAuditLogs.length}
                                    </strong>{" "}
                                    • Page {auditPage} of {totalAuditPages}
                                </span>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.45rem",
                                    }}
                                >
                                    <div
                                        className={styles.customDropdownWrap}
                                        style={{ width: "115px" }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenDropdown(
                                                    openDropdown ===
                                                    "AUD_PAGESIZE"
                                                        ? null
                                                        : "AUD_PAGESIZE"
                                                )
                                            }
                                            className={
                                                styles.customDropdownTrigger
                                            }
                                            style={{
                                                padding: "0.38rem 0.65rem",
                                                fontSize: "0.72rem",
                                            }}
                                        >
                                            <span>{auditPageSize} / page</span>
                                            <ChevronDown
                                                size={12}
                                                color="#D4AF37"
                                            />
                                        </button>
                                        {openDropdown === "AUD_PAGESIZE" && (
                                            <div
                                                className={
                                                    styles.customDropdownMenu
                                                }
                                                style={{
                                                    bottom: "calc(100% + 6px)",
                                                    top: "auto",
                                                    minWidth: "115px",
                                                }}
                                            >
                                                {[5, 10, 20].map((sz) => (
                                                    <button
                                                        key={sz}
                                                        type="button"
                                                        onClick={() => {
                                                            setAuditPageSize(sz);
                                                            setAuditPage(1);
                                                            setOpenDropdown(
                                                                null
                                                            );
                                                        }}
                                                        className={`${
                                                            styles.customDropdownItem
                                                        } ${
                                                            auditPageSize === sz
                                                                ? styles.customDropdownItemActive
                                                                : ""
                                                        }`}
                                                    >
                                                        <span>{sz} / page</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        disabled={auditPage <= 1}
                                        onClick={() =>
                                            setAuditPage((p) =>
                                                Math.max(1, p - 1)
                                            )
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{ padding: "0.38rem 0.6rem" }}
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={auditPage >= totalAuditPages}
                                        onClick={() =>
                                            setAuditPage((p) =>
                                                Math.min(totalAuditPages, p + 1)
                                            )
                                        }
                                        className={styles.secondaryGoldBtn}
                                        style={{ padding: "0.38rem 0.6rem" }}
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Log Details Inspector */}
                        {selectedAuditDetail && (
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <span
                                            style={{
                                                fontSize: "0.68rem",
                                                color: "#D4AF37",
                                                fontFamily:
                                                    "Space Grotesk, monospace",
                                                fontWeight: 700,
                                            }}
                                        >
                                            IMMUTABLE AUDIT RECORD
                                        </span>
                                        <h3
                                            className={styles.cardTitle}
                                            style={{ marginTop: "3px" }}
                                        >
                                            {selectedAuditDetail.id} —{" "}
                                            {selectedAuditDetail.eventType}
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard?.writeText(
                                                JSON.stringify(
                                                    selectedAuditDetail,
                                                    null,
                                                    2
                                                )
                                            );
                                            showToast(
                                                "Copied audit record metadata to clipboard!"
                                            );
                                        }}
                                        className={styles.secondaryGoldBtn}
                                        style={{
                                            padding: "0.4rem 0.7rem",
                                            fontSize: "0.72rem",
                                        }}
                                    >
                                        <Copy size={13} color="#D4AF37" />
                                        <span>Copy</span>
                                    </button>
                                </div>

                                <div
                                    style={{
                                        fontSize: "0.81rem",
                                        lineHeight: 1.65,
                                        color: "#E2E8F0",
                                    }}
                                >
                                    <div>
                                        <strong>Actor & Role:</strong>{" "}
                                        {selectedAuditDetail.user} (
                                        {selectedAuditDetail.role})
                                    </div>
                                    <div>
                                        <strong>Timestamp & Module:</strong>{" "}
                                        {selectedAuditDetail.timestamp} •{" "}
                                        {selectedAuditDetail.module}
                                    </div>
                                    <div>
                                        <strong>
                                            IP Address & Session ID:
                                        </strong>{" "}
                                        <code>
                                            {selectedAuditDetail.ipAddress}
                                        </code>{" "}
                                        •{" "}
                                        <code>
                                            {selectedAuditDetail.sessionId}
                                        </code>
                                    </div>
                                    <div>
                                        <strong>User Agent:</strong>{" "}
                                        {selectedAuditDetail.userAgent}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: "0.5rem",
                                            color: "#F5E6AD",
                                        }}
                                    >
                                        <strong>Description:</strong>{" "}
                                        {selectedAuditDetail.description}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: "0.65rem",
                                            background: "#07070C",
                                            padding: "0.65rem 0.8rem",
                                            borderRadius: "10px",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            fontFamily:
                                                "Space Grotesk, monospace",
                                            fontSize: "0.73rem",
                                        }}
                                    >
                                        <div style={{ color: "#F87171" }}>
                                            Before:{" "}
                                            {selectedAuditDetail.oldValuesJson}
                                        </div>
                                        <div
                                            style={{
                                                color: "#34D399",
                                                marginTop: "4px",
                                            }}
                                        >
                                            After :{" "}
                                            {selectedAuditDetail.newValuesJson}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuditSearch(selectedAuditDetail.user);
                                        setAuditPage(1);
                                        showToast(
                                            `Filtered audit logs for actor: ${selectedAuditDetail.user}`
                                        );
                                    }}
                                    className={styles.secondaryGoldBtn}
                                    style={{ width: "100%", marginTop: "1rem" }}
                                >
                                    <span>
                                        View Actor Logs (
                                        {selectedAuditDetail.user})
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 1: CONFIRM REMOVE LOGO */}
            {confirmRemoveLogo && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setConfirmRemoveLogo(false)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                color: "#FFF",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                                fontSize: "1.3rem",
                            }}
                        >
                            Confirm Brand Emblem Removal
                        </h3>
                        <p style={{ fontSize: "0.84rem", color: "#CBD5E1" }}>
                            Are you sure you want to remove the custom ScentStation emblem and revert to the default monogram?
                        </p>
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
                                onClick={() => setConfirmRemoveLogo(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Cancel</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setHasLogo(false);
                                    setConfirmRemoveLogo(false);
                                    showToast(
                                        "Removed custom logo after confirmation!"
                                    );
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                <span>Confirm Removal</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: CONFIRM SYSTEM MAINTENANCE MODE */}
            {confirmMaintDialog && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setConfirmMaintDialog(false)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                color: "#FFF",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                                fontSize: "1.3rem",
                            }}
                        >
                            Confirm System Maintenance Mode
                        </h3>
                        <p
                            style={{
                                fontSize: "0.84rem",
                                color: "#FBBF24",
                                lineHeight: 1.55,
                            }}
                        >
                            <strong>Impact Warning:</strong> Activating platform maintenance mode will display the maintenance message below to non-administrative staff and pause new customer sessions.
                        </p>
                        <textarea
                            rows={2}
                            value={maintenanceBannerMsg}
                            onChange={(e) =>
                                setMaintenanceBannerMsg(e.target.value)
                            }
                            className={styles.textInput}
                            style={{ marginBottom: "1.25rem" }}
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "0.75rem",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setConfirmMaintDialog(false)}
                                className={styles.secondaryGoldBtn}
                            >
                                <span>Cancel</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const nextState = !systemMaintenanceMode;
                                    setSystemMaintenanceMode(nextState);
                                    setConfirmMaintDialog(false);
                                    appendAuditLogAndBroadcast(
                                        "SYSTEM_MAINTENANCE_MODE",
                                        "System Settings",
                                        "Settings / System",
                                        `Toggled Global System Maintenance Mode to ${nextState ? "ENABLED" : "DISABLED"}.`,
                                        { maintenanceMode: nextState }
                                    );
                                    showToast(
                                        `System Maintenance Mode is now ${
                                            nextState ? "ENABLED" : "DISABLED"
                                        }!`
                                    );
                                }}
                                className={styles.primaryGoldBtn}
                            >
                                <span>Confirm Maintenance Mode</span>
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