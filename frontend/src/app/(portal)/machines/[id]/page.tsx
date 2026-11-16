// noinspection SpellCheckingInspection
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    ArrowLeft,
    MapPin,
    Cpu,
    Activity,
    Thermometer,
    Zap,
    RotateCcw,
    Wrench,
    Power,
    Edit3,
    Terminal,
    FileText,
    CheckCircle2,
    X,
    Droplets,
    AlertOctagon,
    Smartphone,
    WifiOff,
    Globe,
    ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "./machine-detail.module.css";

interface MachineSlotConfig {
    slotNumber: number;
    productName: string;
    brand: string;
    bottleCode: string;
    batchCode: string;
    pricePerSpray: number;
    sprayDurationMs: number;
    remainingVolumeMl: number;
    capacityMl: number;
    thresholdMl: number;
    enabled: boolean;
}

interface DeviceLogEntry {
    id: string;
    timestamp: string;
    type: "HEARTBEAT" | "COMMAND" | "ERROR" | "EVENT";
    severity: "INFO" | "WARNING" | "CRITICAL";
    message: string;
}

interface CatalogPerfumeOption {
    slot: number;
    name: string;
    brand: string;
    price: number;
    cap: number;
}

const DEFAULT_34_CATALOG_OPTIONS: CatalogPerfumeOption[] = [
    { slot: 1, name: "Acqua Di Gio", brand: "Giorgio Armani", price: 12000, cap: 100 },
    { slot: 2, name: "Acqua Di Gio Profondo", brand: "Giorgio Armani", price: 14000, cap: 100 },
    { slot: 3, name: "Bleu de Chanel", brand: "Chanel", price: 15000, cap: 100 },
    { slot: 4, name: "Coco Mademoiselle", brand: "Chanel", price: 15500, cap: 100 },
    { slot: 5, name: "Burberry Goddess", brand: "Burberry", price: 13000, cap: 100 },
    { slot: 6, name: "Burberry Her", brand: "Burberry", price: 12500, cap: 100 },
    { slot: 7, name: "Carolina Herrera Good Girl", brand: "Carolina Herrera", price: 13500, cap: 80 },
    { slot: 8, name: "Club de Nuit Intense Man", brand: "Armaf", price: 10000, cap: 105 },
    { slot: 9, name: "Creed Aventus", brand: "Creed", price: 20000, cap: 100 },
    { slot: 10, name: "Dior Sauvage", brand: "Dior", price: 14500, cap: 100 },
    { slot: 11, name: "Miss Dior Blooming Bouquet", brand: "Dior", price: 13500, cap: 100 },
    { slot: 12, name: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", price: 13000, cap: 125 },
    { slot: 13, name: "Jean Paul Gaultier Scandal", brand: "Jean Paul Gaultier", price: 13500, cap: 80 },
    { slot: 14, name: "Le Labo Another 13", brand: "Le Labo", price: 18000, cap: 100 },
    { slot: 15, name: "Le Labo Santal 33", brand: "Le Labo", price: 18500, cap: 100 },
    { slot: 16, name: "Replica By the Fireplace", brand: "Maison Margiela", price: 14500, cap: 100 },
    { slot: 17, name: "Replica Jazz Club", brand: "Maison Margiela", price: 14500, cap: 100 },
    { slot: 18, name: "MCM Eau de Parfum", brand: "MCM Worldwide", price: 12000, cap: 75 },
    { slot: 19, name: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", price: 21000, cap: 70 },
    { slot: 20, name: "Montblanc Explorer", brand: "Montblanc", price: 11500, cap: 100 },
    { slot: 21, name: "Montblanc Legend", brand: "Montblanc", price: 11000, cap: 100 },
    { slot: 22, name: "Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", price: 13000, cap: 100 },
    { slot: 23, name: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", price: 13500, cap: 100 },
    { slot: 24, name: "Paco Rabanne 1 Million", brand: "Paco Rabanne", price: 12500, cap: 100 },
    { slot: 25, name: "Paco Rabanne Invictus", brand: "Paco Rabanne", price: 12500, cap: 100 },
    { slot: 26, name: "Parfums de Marly Sedley", brand: "Parfums de Marly", price: 18500, cap: 125 },
    { slot: 27, name: "Roja Parfums Elysium", brand: "Roja Parfums", price: 22000, cap: 100 },
    { slot: 28, name: "Tom Ford Black Orchid", brand: "Tom Ford", price: 16000, cap: 100 },
    { slot: 29, name: "Valentino Born in Roma", brand: "Valentino", price: 13000, cap: 100 },
    { slot: 30, name: "Versace Bright Crystal", brand: "Versace", price: 11500, cap: 90 },
    { slot: 31, name: "Versace Dylan Blue", brand: "Versace", price: 12000, cap: 100 },
    { slot: 32, name: "Versace Eros", brand: "Versace", price: 12500, cap: 100 },
    { slot: 33, name: "YSL Libre Eau de Parfum", brand: "Yves Saint Laurent", price: 14000, cap: 90 },
    { slot: 34, name: "YSL Y Eau de Parfum", brand: "Yves Saint Laurent", price: 14000, cap: 100 },
];

interface MachinePresetItem {
    code: string;
    serial: string;
    brand: string;
    locationName: string;
    streetAddress: string;
    firmware: string;
    configVer: string;
    conn: "ONLINE" | "OFFLINE";
    mode: "ACTIVE" | "MAINTENANCE" | "DISABLED";
    temp: string;
    voltage: string;
    slots: MachineSlotConfig[];
}

const MACHINE_PRESET_LOOKUP: Record<string, MachinePresetItem> = {
    "demo-device": {
        code: "demo-device",
        serial: "SN-2026-8801",
        brand: "Creed",
        locationName: "Diamond Plaza Luxury Atrium",
        streetAddress: "34 Le Duan, District 1, Ho Chi Minh City",
        firmware: "v2.4.8-LTS",
        configVer: "cfg-2026.11",
        conn: "ONLINE",
        mode: "ACTIVE",
        temp: "21.2°C",
        voltage: "24.1V DC",
        slots: [
            { slotNumber: 1, productName: "Creed Aventus", brand: "Creed", bottleCode: "BTL-2026-0109", batchCode: "BATCH-2026-CR1", pricePerSpray: 20000, sprayDurationMs: 1200, remainingVolumeMl: 11.5, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 2, productName: "Le Labo Another 13", brand: "Le Labo", bottleCode: "BTL-2026-0114", batchCode: "BATCH-2026-L01", pricePerSpray: 18000, sprayDurationMs: 1200, remainingVolumeMl: 13.5, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 3, productName: "Parfums de Marly Sedley", brand: "Parfums de Marly", bottleCode: "BTL-2026-0126", batchCode: "BATCH-2026-PM1", pricePerSpray: 18500, sprayDurationMs: 1200, remainingVolumeMl: 68.0, capacityMl: 125, thresholdMl: 15, enabled: true },
            { slotNumber: 4, productName: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", bottleCode: "BTL-2026-0119", batchCode: "BATCH-2026-FK1", pricePerSpray: 21000, sprayDurationMs: 1200, remainingVolumeMl: 9.0, capacityMl: 70, thresholdMl: 15, enabled: true },
        ],
    },
    "KIOSK-SGN-01": {
        code: "KIOSK-SGN-01",
        serial: "SN-2026-8802",
        brand: "Chanel",
        locationName: "Saigon Centre Takashimaya Flagship",
        streetAddress: "65 Le Loi, District 1, Ho Chi Minh City",
        firmware: "v2.4.8-LTS",
        configVer: "cfg-2026.11",
        conn: "ONLINE",
        mode: "ACTIVE",
        temp: "21.4°C",
        voltage: "24.0V DC",
        slots: [
            { slotNumber: 1, productName: "Acqua Di Gio", brand: "Giorgio Armani", bottleCode: "BTL-2026-0101", batchCode: "BATCH-2026-A01", pricePerSpray: 12000, sprayDurationMs: 1200, remainingVolumeMl: 78.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 2, productName: "Acqua Di Gio Profondo", brand: "Giorgio Armani", bottleCode: "BTL-2026-0102", batchCode: "BATCH-2026-A02", pricePerSpray: 14000, sprayDurationMs: 1200, remainingVolumeMl: 64.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 3, productName: "Bleu de Chanel", brand: "Chanel", bottleCode: "BTL-2026-0103", batchCode: "BATCH-2026-C01", pricePerSpray: 15000, sprayDurationMs: 1200, remainingVolumeMl: 12.5, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 4, productName: "Miss Dior Blooming Bouquet", brand: "Dior", bottleCode: "BTL-2026-0111", batchCode: "BATCH-2026-D02", pricePerSpray: 13500, sprayDurationMs: 1200, remainingVolumeMl: 76.0, capacityMl: 100, thresholdMl: 15, enabled: true },
        ],
    },
    "KIOSK-SGN-02": {
        code: "KIOSK-SGN-02",
        serial: "SN-2026-8803",
        brand: "Yves Saint Laurent",
        locationName: "Vincom Center Dong Khoi",
        streetAddress: "72 Le Thanh Ton, District 1, Ho Chi Minh City",
        firmware: "v2.4.8-LTS",
        configVer: "cfg-2026.11",
        conn: "ONLINE",
        mode: "ACTIVE",
        temp: "21.8°C",
        voltage: "23.9V DC",
        slots: [
            { slotNumber: 1, productName: "Coco Mademoiselle", brand: "Chanel", bottleCode: "BTL-2026-0104", batchCode: "BATCH-2026-C02", pricePerSpray: 15500, sprayDurationMs: 1200, remainingVolumeMl: 82.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 2, productName: "Burberry Goddess", brand: "Burberry", bottleCode: "BTL-2026-0105", batchCode: "BATCH-2026-B01", pricePerSpray: 13000, sprayDurationMs: 1200, remainingVolumeMl: 71.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 3, productName: "Jean Paul Gaultier Le Male", brand: "Jean Paul Gaultier", bottleCode: "BTL-2026-0112", batchCode: "BATCH-2026-J01", pricePerSpray: 13000, sprayDurationMs: 1200, remainingVolumeMl: 77.0, capacityMl: 125, thresholdMl: 15, enabled: true },
            { slotNumber: 4, productName: "Versace Eros", brand: "Versace", bottleCode: "BTL-2026-0132", batchCode: "BATCH-2026-VS3", pricePerSpray: 12500, sprayDurationMs: 1200, remainingVolumeMl: 83.0, capacityMl: 100, thresholdMl: 15, enabled: true },
        ],
    },
    "KIOSK-SGN-03": {
        code: "KIOSK-SGN-03",
        serial: "SN-2026-8808",
        brand: "Montblanc",
        locationName: "Crescent Mall Luxury Wing",
        streetAddress: "101 Ton Dat Tien, District 7, Ho Chi Minh City",
        firmware: "v2.4.8-LTS",
        configVer: "cfg-2026.11",
        conn: "ONLINE",
        mode: "ACTIVE",
        temp: "21.6°C",
        voltage: "24.0V DC",
        slots: [
            { slotNumber: 1, productName: "Montblanc Explorer", brand: "Montblanc", bottleCode: "BTL-2026-0120", batchCode: "BATCH-2026-MB1", pricePerSpray: 11500, sprayDurationMs: 1200, remainingVolumeMl: 79.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 2, productName: "Montblanc Legend", brand: "Montblanc", bottleCode: "BTL-2026-0121", batchCode: "BATCH-2026-MB2", pricePerSpray: 11000, sprayDurationMs: 1200, remainingVolumeMl: 85.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 3, productName: "Valentino Born in Roma", brand: "Valentino", bottleCode: "BTL-2026-0129", batchCode: "BATCH-2026-VL1", pricePerSpray: 13000, sprayDurationMs: 1200, remainingVolumeMl: 81.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 4, productName: "Roja Parfums Elysium", brand: "Roja Parfums", bottleCode: "BTL-2026-0127", batchCode: "BATCH-2026-RJ1", pricePerSpray: 22000, sprayDurationMs: 1200, remainingVolumeMl: 11.0, capacityMl: 100, thresholdMl: 15, enabled: true },
        ],
    },
    "KIOSK-HN-01": {
        code: "KIOSK-HN-01",
        serial: "SN-2026-8804",
        brand: "Dior",
        locationName: "Lotte Center West Lake Lounge",
        streetAddress: "272 Vo Chi Cong, Tay Ho, Hanoi",
        firmware: "v2.4.8-LTS",
        configVer: "cfg-2026.11",
        conn: "ONLINE",
        mode: "ACTIVE",
        temp: "22.0°C",
        voltage: "24.0V DC",
        slots: [
            { slotNumber: 1, productName: "Burberry Her", brand: "Burberry", bottleCode: "BTL-2026-0106", batchCode: "BATCH-2026-B02", pricePerSpray: 12500, sprayDurationMs: 1200, remainingVolumeMl: 55.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 2, productName: "Carolina Herrera Good Girl", brand: "Carolina Herrera", bottleCode: "BTL-2026-0107", batchCode: "BATCH-2026-H01", pricePerSpray: 13500, sprayDurationMs: 1200, remainingVolumeMl: 54.0, capacityMl: 80, thresholdMl: 15, enabled: true },
            { slotNumber: 3, productName: "Dior Sauvage", brand: "Dior", bottleCode: "BTL-2026-0110", batchCode: "BATCH-2026-D01", pricePerSpray: 14500, sprayDurationMs: 1200, remainingVolumeMl: 84.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 4, productName: "Narciso Rodriguez For Her EDP", brand: "Narciso Rodriguez", bottleCode: "BTL-2026-0122", batchCode: "BATCH-2026-NR1", pricePerSpray: 13000, sprayDurationMs: 1200, remainingVolumeMl: 61.0, capacityMl: 100, thresholdMl: 15, enabled: true },
        ],
    },
    "KIOSK-HN-02": {
        code: "KIOSK-HN-02",
        serial: "SN-2026-8805",
        brand: "Maison Margiela",
        locationName: "Trang Tien Plaza Luxury Wing",
        streetAddress: "24 Hai Ba Trung, Hoan Kiem, Hanoi",
        firmware: "v2.4.6-LTS",
        configVer: "cfg-2026.10",
        conn: "ONLINE",
        mode: "MAINTENANCE",
        temp: "23.1°C",
        voltage: "23.8V DC",
        slots: [
            { slotNumber: 1, productName: "Replica By the Fireplace", brand: "Maison Margiela", bottleCode: "BTL-2026-0116", batchCode: "BATCH-2026-M01", pricePerSpray: 14500, sprayDurationMs: 1200, remainingVolumeMl: 80.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 2, productName: "Replica Jazz Club", brand: "Maison Margiela", bottleCode: "BTL-2026-0117", batchCode: "BATCH-2026-M02", pricePerSpray: 14500, sprayDurationMs: 1200, remainingVolumeMl: 67.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 3, productName: "Narciso Rodriguez Pure Musc", brand: "Narciso Rodriguez", bottleCode: "BTL-2026-0123", batchCode: "BATCH-2026-NR2", pricePerSpray: 13500, sprayDurationMs: 1200, remainingVolumeMl: 74.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 4, productName: "Tom Ford Black Orchid", brand: "Tom Ford", bottleCode: "BTL-2026-0128", batchCode: "BATCH-2026-TF1", pricePerSpray: 16000, sprayDurationMs: 1200, remainingVolumeMl: 48.0, capacityMl: 100, thresholdMl: 15, enabled: true },
        ],
    },
    "KIOSK-DAD-01": {
        code: "KIOSK-DAD-01",
        serial: "SN-2026-8806",
        brand: "Versace",
        locationName: "IndoChina Riverside Mall Lobby",
        streetAddress: "74 Bach Dang, Hai Chau, Da Nang",
        firmware: "v2.4.8-LTS",
        configVer: "cfg-2026.11",
        conn: "ONLINE",
        mode: "ACTIVE",
        temp: "21.9°C",
        voltage: "24.0V DC",
        slots: [
            { slotNumber: 1, productName: "Club de Nuit Intense Man", brand: "Armaf", bottleCode: "BTL-2026-0108", batchCode: "BATCH-2026-AF1", pricePerSpray: 10000, sprayDurationMs: 1200, remainingVolumeMl: 92.0, capacityMl: 105, thresholdMl: 15, enabled: true },
            { slotNumber: 2, productName: "MCM Eau de Parfum", brand: "MCM Worldwide", bottleCode: "BTL-2026-0118", batchCode: "BATCH-2026-MC1", pricePerSpray: 12000, sprayDurationMs: 1200, remainingVolumeMl: 66.0, capacityMl: 75, thresholdMl: 15, enabled: true },
            { slotNumber: 3, productName: "Paco Rabanne Invictus", brand: "Paco Rabanne", bottleCode: "BTL-2026-0125", batchCode: "BATCH-2026-PR2", pricePerSpray: 12500, sprayDurationMs: 1200, remainingVolumeMl: 72.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 4, productName: "Versace Dylan Blue", brand: "Versace", bottleCode: "BTL-2026-0131", batchCode: "BATCH-2026-VS2", pricePerSpray: 12000, sprayDurationMs: 1200, remainingVolumeMl: 77.0, capacityMl: 100, thresholdMl: 15, enabled: true },
        ],
    },
    "KIOSK-004": {
        code: "KIOSK-004",
        serial: "SN-2026-8807",
        brand: "Tom Ford",
        locationName: "Aeon Mall Tan Phu Celadon",
        streetAddress: "30 Bo Bao Tan Thang, Tan Phu, Ho Chi Minh City",
        firmware: "v2.4.5-LTS",
        configVer: "cfg-2026.09",
        conn: "OFFLINE",
        mode: "DISABLED",
        temp: "24.2°C",
        voltage: "0.0V",
        slots: [
            { slotNumber: 1, productName: "Tom Ford Black Orchid", brand: "Tom Ford", bottleCode: "BTL-2026-0128", batchCode: "BATCH-2026-TF1", pricePerSpray: 16000, sprayDurationMs: 1200, remainingVolumeMl: 0.0, capacityMl: 100, thresholdMl: 15, enabled: false },
            { slotNumber: 2, productName: "Valentino Born in Roma", brand: "Valentino", bottleCode: "BTL-2026-0129", batchCode: "BATCH-2026-VL1", pricePerSpray: 13000, sprayDurationMs: 1200, remainingVolumeMl: 81.0, capacityMl: 100, thresholdMl: 15, enabled: true },
            { slotNumber: 3, productName: "Versace Bright Crystal", brand: "Versace", bottleCode: "BTL-2026-0130", batchCode: "BATCH-2026-VS1", pricePerSpray: 11500, sprayDurationMs: 1200, remainingVolumeMl: 62.0, capacityMl: 90, thresholdMl: 15, enabled: true },
            { slotNumber: 4, productName: "Versace Dylan Blue", brand: "Versace", bottleCode: "BTL-2026-0131", batchCode: "BATCH-2026-VS2", pricePerSpray: 12000, sprayDurationMs: 1200, remainingVolumeMl: 77.0, capacityMl: 100, thresholdMl: 15, enabled: true },
        ],
    },
};

const INITIAL_DEVICE_LOGS: DeviceLogEntry[] = [
    { id: "LOG-901", timestamp: "2026-11-15 09:42:10", type: "HEARTBEAT", severity: "INFO", message: "MQTT heartbeat received (QoS 1). Preservation chamber within optimal range, Door: CLOSED." },
    { id: "LOG-902", timestamp: "2026-11-15 09:38:52", type: "COMMAND", severity: "INFO", message: "Executed signed command CMD-8821A on Slot 01 (1,200ms = 0.12ml). Result: DISPENSED." },
    { id: "LOG-903", timestamp: "2026-11-15 08:45:00", type: "EVENT", severity: "WARNING", message: "Low-stock threshold warning triggered on cartridge slot (< 15ml volume remaining)." },
    { id: "LOG-904", timestamp: "2026-11-15 07:20:15", type: "ERROR", severity: "CRITICAL", message: "Depleted cartridge (0ml) automatically locked from customer selection." },
];

const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const INVENTORY_MOVEMENTS_KEY = "scentstation_inventory_movements_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const BRANDS_STORAGE_KEY = "scentstation_commercial_brands_v2";
const ALERTS_STORAGE_KEY = "scentstation_commercial_alerts_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

function formatNowStr(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

const isExactMatch = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

export default function MachineDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const rawId = decodeURIComponent(params?.id || "KIOSK-SGN-01");

    const assignMenuRef = useRef<HTMLDivElement | null>(null);
    const cmdMenuRef = useRef<HTMLDivElement | null>(null);
    const priorityMenuRef = useRef<HTMLDivElement | null>(null);

    const preset = useMemo(() => {
        const direct =
            MACHINE_PRESET_LOOKUP[rawId] ||
            MACHINE_PRESET_LOOKUP[rawId.toUpperCase()] ||
            MACHINE_PRESET_LOOKUP[rawId.toLowerCase()];
        return (
            direct || {
                ...MACHINE_PRESET_LOOKUP["KIOSK-SGN-01"],
                code: rawId,
            }
        );
    }, [rawId]);

    const [lang, setLang] = useState<"en" | "vi">("en");
    const [isViewerReadOnly, setIsViewerReadOnly] = useState<boolean>(false);
    const [currentActorLabel, setCurrentActorLabel] = useState<string>("Platform Super Administrator");

    const [canonicalCode, setCanonicalCode] = useState<string>(preset.code);
    const [serialNumber, setSerialNumber] = useState<string>(preset.serial);
    const [connectionStatus, setConnectionStatus] = useState<"ONLINE" | "OFFLINE">(preset.conn);
    const [operatingMode, setOperatingMode] = useState<"ACTIVE" | "MAINTENANCE" | "DISABLED">(preset.mode);
    const [locationName, setLocationName] = useState<string>(preset.locationName);
    const [streetAddress, setStreetAddress] = useState<string>(preset.streetAddress);
    const [brandTenant, setBrandTenant] = useState<string>(preset.brand);
    const [firmwareVersion, setFirmwareVersion] = useState<string>(preset.firmware);
    const [configVersion, setConfigVersion] = useState<string>(preset.configVer);
    const [chamberTemp, setChamberTemp] = useState<string>(preset.temp);
    const [syncState, setSyncState] = useState<"SYNCED_MQTT" | "SAVED_DB_ONLY">("SYNCED_MQTT");

    const [catalogOptions, setCatalogOptions] = useState<CatalogPerfumeOption[]>(DEFAULT_34_CATALOG_OPTIONS);
    const [slots, setSlots] = useState<MachineSlotConfig[]>(preset.slots);
    const [logs, setLogs] = useState<DeviceLogEntry[]>(INITIAL_DEVICE_LOGS);

    const [activeModal, setActiveModal] = useState<
        "RESTART" | "EDIT_INFO" | "REMOTE_CONTROL" | "LOGS" | "TICKET" | "ASSIGN_SLOT" | null
    >(null);
    const [selectedSlotForAssign, setSelectedSlotForAssign] = useState<MachineSlotConfig | null>(null);
    const [assignPerfumeName, setAssignPerfumeName] = useState<string>("Bleu de Chanel");
    const [isAssignMenuOpen, setIsAssignMenuOpen] = useState<boolean>(false);
    const [assignPrice, setAssignPrice] = useState<number>(15000);
    const [assignDurationMs, setAssignDurationMs] = useState<number>(1200);
    const [assignThresholdMl, setAssignThresholdMl] = useState<number>(15);
    const [installFreshBottleOnAssign, setInstallFreshBottleOnAssign] = useState<boolean>(true);

    const [selectedCommand, setSelectedCommand] = useState<string>("STATUS_PING");
    const [isCmdMenuOpen, setIsCmdMenuOpen] = useState<boolean>(false);
    const [commandFeedback, setCommandFeedback] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [hasOpenTicket, setHasOpenTicket] = useState<boolean>(false);
    const [activeTicketCode, setActiveTicketCode] = useState<string | null>(null);
    const [ticketPriority, setTicketPriority] = useState<"URGENT" | "HIGH" | "NORMAL">("HIGH");
    const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState<boolean>(false);
    const [ticketDesc, setTicketDesc] = useState<string>(
        "Inspect low-stock sensor and verify micro-atomizer nozzle calibration."
    );
    const [logFilterType, setLogFilterType] = useState<string>("ALL");

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (assignMenuRef.current && !assignMenuRef.current.contains(e.target as Node)) {
                setIsAssignMenuOpen(false);
            }
            if (cmdMenuRef.current && !cmdMenuRef.current.contains(e.target as Node)) {
                setIsCmdMenuOpen(false);
            }
            if (priorityMenuRef.current && !priorityMenuRef.current.contains(e.target as Node)) {
                setIsPriorityMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const showBanner = useCallback((text: string, type: "success" | "error" = "success") => {
        setCommandFeedback({ type, text });
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

    /* --- 1. TẢI & ĐỒNG BỘ 2 CHIỀU VỚI MÀN 1, 2, 4, 5, 6 (KHÔNG BỊ GHI ĐÈ NGƯỢC) --- */
    const loadAndReconcileMachineDetail = useCallback(() => {
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
                setCurrentActorLabel(parsedUser.fullName || parsedUser.name || roleCode);
                setIsViewerReadOnly(roleCode === "VW" || roleCode === "VIEWER" || roleCode === "IS");
            }

            const kioskLower = rawId.toLowerCase();

            // A. Đọc PRODUCTS_STORAGE_KEY (/products) để lấy các mùi hương mới tạo (+ Add Fragrance), giá mới & trạng thái
            const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            const productLookupMap = new Map<
                string,
                {
                    name: string;
                    brand: string;
                    price: number;
                    cap: number;
                    status: "ACTIVE" | "INACTIVE" | "DRAFT";
                    remMl?: number;
                }
            >();
            let dynamicOptions: CatalogPerfumeOption[] = [...DEFAULT_34_CATALOG_OPTIONS];

            if (rawProds) {
                const parsedProds = JSON.parse(rawProds);
                if (Array.isArray(parsedProds) && parsedProds.length > 0) {
                    dynamicOptions = parsedProds
                        .filter((p: any) => p && p.name && p.status !== "INACTIVE")
                        .map((p: any, i: number) => ({
                            slot: Number(p.slotNumber || i + 1),
                            name: p.name,
                            brand: p.brand || "Luxury Maison",
                            price: Number(p.pricePerSpray || 15000),
                            cap: Number(p.bottleVolumeMl || 100),
                        }));

                    parsedProds.forEach((p: any) => {
                        if (!p || !p.name) return;
                        const pKey = String(p.name).trim().toLowerCase();
                        const price = Number(p.pricePerSpray || 15000);
                        const cap = Number(p.bottleVolumeMl || 100);
                        const st = p.status || "ACTIVE";

                        const assignedForThisKiosk = Array.isArray(p.assignedMachines)
                            ? p.assignedMachines.find(
                                (am: any) =>
                                    String(am.kioskCode || "").toLowerCase() === kioskLower
                            )
                            : null;

                        productLookupMap.set(pKey, {
                            name: p.name,
                            brand: p.brand || "Luxury Maison",
                            price,
                            cap,
                            status: st,
                            remMl: assignedForThisKiosk
                                ? Number(assignedForThisKiosk.remainingVolumeMl)
                                : undefined,
                        });
                    });
                }
            }
            setCatalogOptions(dynamicOptions);

            // B. Đọc KIOSK_PER_UNIT_STOCK_KEY (Ma trận tồn kho từng máy dùng chung với Màn 1, 4, 5, 6)
            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                ? JSON.parse(rawMatrix)
                : {};
            const thisKioskMatrix = perKioskMatrix[kioskLower] || {};

            // C. Đọc MACHINES_STORAGE_KEY (/machines) — Nguồn sự thật cho cấu hình 4 khoang vật lý của máy
            const rawFleet = localStorage.getItem(MACHINES_STORAGE_KEY);
            let foundMachine: any = null;
            if (rawFleet) {
                const parsedFleet = JSON.parse(rawFleet);
                if (Array.isArray(parsedFleet)) {
                    foundMachine = parsedFleet.find(
                        (m: any) =>
                            String(m.id || "").toLowerCase() === kioskLower ||
                            String(m.code || "").toLowerCase() === kioskLower
                    );
                }
            }

            if (foundMachine) {
                const machineCode = foundMachine.code || preset.code;
                setCanonicalCode(machineCode);
                setSerialNumber(foundMachine.serialNumber || preset.serial);
                setBrandTenant(foundMachine.brand || preset.brand);
                setLocationName(foundMachine.locationName || preset.locationName);
                setStreetAddress(foundMachine.address || preset.streetAddress);
                setFirmwareVersion(foundMachine.firmwareVersion || preset.firmware);
                setConfigVersion(foundMachine.configVersion || preset.configVer);
                setChamberTemp(foundMachine.chamberTemp || preset.temp);

                const nextConn: "ONLINE" | "OFFLINE" =
                    foundMachine.connectionStatus === "OFFLINE" ||
                    foundMachine.status === "OFFLINE"
                        ? "OFFLINE"
                        : "ONLINE";
                const nextMode: "ACTIVE" | "MAINTENANCE" | "DISABLED" =
                    foundMachine.operatingStatus === "MAINTENANCE" ||
                    foundMachine.status === "MAINTENANCE"
                        ? "MAINTENANCE"
                        : nextConn === "OFFLINE"
                            ? "DISABLED"
                            : "ACTIVE";

                setConnectionStatus(nextConn);
                setOperatingMode(nextMode);

                if (Array.isArray(foundMachine.slots) && foundMachine.slots.length === 4) {
                    setSlots(
                        foundMachine.slots.map((s: any, idx: number) => {
                            const slotNum = idx + 1;
                            const rawSlotName = String(s.fragranceName || "").trim();
                            const lowerName = rawSlotName.toLowerCase();

                            const prodStoreInfo = productLookupMap.get(lowerName);
                            const catOption = DEFAULT_34_CATALOG_OPTIONS.find(
                                (c) => c.name.toLowerCase() === lowerName
                            );

                            const resolvedName =
                                prodStoreInfo?.name || catOption?.name || rawSlotName;
                            const resolvedKey = resolvedName.trim().toLowerCase();

                            const resolvedCap = Number(
                                prodStoreInfo?.cap ||
                                s.capacityMl ||
                                catOption?.cap ||
                                100
                            );

                            const matrixMl = thisKioskMatrix[resolvedKey];
                            const resolvedRemMl =
                                typeof matrixMl === "number"
                                    ? matrixMl
                                    : typeof prodStoreInfo?.remMl === "number"
                                        ? prodStoreInfo.remMl
                                        : Number(s.remainingMl ?? resolvedCap);

                            const resolvedPrice = Number(
                                prodStoreInfo?.price ||
                                s.pricePerSpray ||
                                catOption?.price ||
                                15000
                            );

                            // Giữ nguyên trạng thái Lock/Enable riêng của từng khoang (s.slotEnabled / s.productStatus)
                            const isCatalogProductActive =
                                !prodStoreInfo?.status || prodStoreInfo.status === "ACTIVE";
                            const isSlotManuallyLocked =
                                s.slotEnabled === false ||
                                s.available === false ||
                                s.productStatus === "INACTIVE";

                            const presetSlot = preset.slots[idx] || preset.slots[0];

                            return {
                                slotNumber: slotNum,
                                productName: resolvedName,
                                brand:
                                    prodStoreInfo?.brand ||
                                    s.brand ||
                                    catOption?.brand ||
                                    presetSlot.brand,
                                bottleCode:
                                    s.bottleCode ||
                                    presetSlot.bottleCode ||
                                    `BTL-2026-0${slotNum}09`,
                                batchCode:
                                    presetSlot.batchCode || `BATCH-2026-S0${slotNum}`,
                                pricePerSpray: resolvedPrice,
                                sprayDurationMs: Number(
                                    s.sprayDurationMs || presetSlot.sprayDurationMs || 1200
                                ),
                                remainingVolumeMl: Number(
                                    Math.max(0, resolvedRemMl).toFixed(2)
                                ),
                                capacityMl: resolvedCap,
                                thresholdMl: Number(
                                    s.lowStockThresholdMl || presetSlot.thresholdMl || 15
                                ),
                                enabled:
                                    !isSlotManuallyLocked &&
                                    isCatalogProductActive &&
                                    resolvedRemMl >= 0.12 &&
                                    nextConn === "ONLINE" &&
                                    nextMode === "ACTIVE",
                            };
                        })
                    );
                }
            } else {
                setCanonicalCode(preset.code);
                setSerialNumber(preset.serial);
                setBrandTenant(preset.brand);
                setLocationName(preset.locationName);
                setStreetAddress(preset.streetAddress);
                setFirmwareVersion(preset.firmware);
                setConfigVersion(preset.configVer);
                setChamberTemp(preset.temp);
                setConnectionStatus(preset.conn);
                setOperatingMode(preset.mode);
                setSlots(preset.slots);
            }
        } catch {
            // Safe fallback
        }
    }, [rawId, preset]);

    useEffect(() => {
        loadAndReconcileMachineDetail();

        const handleCrossTabSync = () => {
            loadAndReconcileMachineDetail();
        };

        window.addEventListener("storage", handleCrossTabSync);
        window.addEventListener("focus", handleCrossTabSync);
        window.addEventListener("scentstation-sync", handleCrossTabSync);

        const syncInterval = setInterval(() => {
            loadAndReconcileMachineDetail();
        }, 2000);

        return () => {
            window.removeEventListener("storage", handleCrossTabSync);
            window.removeEventListener("focus", handleCrossTabSync);
            window.removeEventListener("scentstation-sync", handleCrossTabSync);
            clearInterval(syncInterval);
        };
    }, [loadAndReconcileMachineDetail]);

    /* --- 2. GHI & PHÁT TÍN HIỆU ĐỒNG BỘ TỨC THÌ SANG MÀN 1, 4, 5, 6, DASHBOARD, BRANDS, ALERTS & AUDIT LOGS --- */
    const syncHardwareStateToAllStores = useCallback(
        (
            nextSlots: MachineSlotConfig[],
            nextConn: "ONLINE" | "OFFLINE",
            nextMode: "ACTIVE" | "MAINTENANCE" | "DISABLED",
            options?: {
                nextFw?: string;
                nextCfg?: string;
                nextLocName?: string;
                nextAddress?: string;
                sprayedSlot?: MachineSlotConfig;
                refilledSlotNumber?: number;
                restartedToOnline?: boolean;
                createdTicketCode?: string;
                ticketNote?: string;
                ticketPriorityLevel?: "URGENT" | "HIGH" | "NORMAL";
                replacedOldProductName?: string;
            }
        ) => {
            const fw = options?.nextFw || firmwareVersion;
            const cfg = options?.nextCfg || configVersion;
            const locName = options?.nextLocName || locationName;
            const addr = options?.nextAddress || streetAddress;
            const kioskCode = canonicalCode || rawId;
            const kKey = kioskCode.toLowerCase();

            const effectiveFleetStatus: "ONLINE" | "MAINTENANCE" | "OFFLINE" =
                nextConn === "OFFLINE"
                    ? "OFFLINE"
                    : nextMode === "MAINTENANCE" || nextMode === "DISABLED"
                        ? "MAINTENANCE"
                        : "ONLINE";

            const effectiveOperatingStatus: "ACTIVE" | "MAINTENANCE" | "DISABLED" | "ERROR" =
                nextConn === "OFFLINE"
                    ? "ERROR"
                    : nextMode === "MAINTENANCE"
                        ? "MAINTENANCE"
                        : nextMode === "DISABLED"
                            ? "DISABLED"
                            : "ACTIVE";

            const enabledSlotsCount =
                effectiveFleetStatus !== "ONLINE"
                    ? 0
                    : nextSlots.filter((s) => s.enabled && s.remainingVolumeMl >= 0.12)
                        .length;

            try {
                // 1. Cập nhật KIOSK_PER_UNIT_STOCK_KEY (Để Màn 1 & Màn 4 nhận đúng số ml ngay lập tức)
                const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix
                    ? JSON.parse(rawMatrix)
                    : {};
                if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                nextSlots.forEach((sl) => {
                    perKioskMatrix[kKey][sl.productName.trim().toLowerCase()] = Number(
                        sl.remainingVolumeMl
                    );
                });
                localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                // 2. Cập nhật kho MACHINES_STORAGE_KEY (Cho Màn 1, Màn 4 & Màn 6)
                const rawFleet = localStorage.getItem(MACHINES_STORAGE_KEY);
                if (rawFleet) {
                    const parsedFleet = JSON.parse(rawFleet);
                    if (Array.isArray(parsedFleet)) {
                        const updatedFleet = parsedFleet.map((m: any) => {
                            if (
                                String(m.id || "").toLowerCase() !== kKey &&
                                String(m.code || "").toLowerCase() !== kKey
                            ) {
                                return m;
                            }
                            return {
                                ...m,
                                locationName: locName,
                                address: addr,
                                status: effectiveFleetStatus,
                                connectionStatus: nextConn,
                                operatingStatus: effectiveOperatingStatus,
                                manualAdminOverride: true,
                                activeSlots: enabledSlotsCount,
                                firmwareVersion: fw,
                                configVersion: cfg,
                                chamberTemp:
                                    effectiveFleetStatus === "ONLINE" ? "21.4°C" : "24.0°C",
                                voltage:
                                    effectiveFleetStatus === "ONLINE" ? "24.0V DC" : "0.0V",
                                lastActivity: "Live (4-Slot Console)",
                                todaySprays: options?.sprayedSlot
                                    ? (m.todaySprays || 0) + 1
                                    : m.todaySprays,
                                todayRevenue: options?.sprayedSlot
                                    ? (m.todayRevenue || 0) +
                                    options.sprayedSlot.pricePerSpray
                                    : m.todayRevenue,
                                slots: nextSlots.map((sl) => ({
                                    slotLabel: `Slot 0${sl.slotNumber}`,
                                    fragranceName: sl.productName,
                                    brand: sl.brand,
                                    bottleCode: sl.bottleCode,
                                    sprayDurationMs: sl.sprayDurationMs,
                                    remainingMl: sl.remainingVolumeMl,
                                    capacityMl: sl.capacityMl,
                                    lowStockThresholdMl: sl.thresholdMl,
                                    slotEnabled: sl.enabled,
                                    productStatus: sl.enabled ? "ACTIVE" : "INACTIVE",
                                    available: sl.enabled && sl.remainingVolumeMl >= 0.12,
                                    pricePerSpray: sl.pricePerSpray,
                                })),
                            };
                        });
                        localStorage.setItem(
                            MACHINES_STORAGE_KEY,
                            JSON.stringify(updatedFleet)
                        );
                    }
                }

                // 3. Cập nhật kho PRODUCTS_STORAGE_KEY (Chuẩn BR2: Gỡ sạch sản phẩm cũ nếu khoang đó được gán mùi hương mới)
                const rawProds = localStorage.getItem(PRODUCTS_STORAGE_KEY);
                if (rawProds) {
                    const parsedProds = JSON.parse(rawProds);
                    if (Array.isArray(parsedProds)) {
                        const syncedProds = parsedProds.map((p: any) => {
                            const cleanProdName = String(p.name || "").trim().toLowerCase();

                            // Tìm tất cả các khoang trong nextSlots của máy này đang chứa sản phẩm p
                            const matchingSlotsOnThisMachine = nextSlots.filter(
                                (sl) =>
                                    sl.productName.trim().toLowerCase() === cleanProdName
                            );

                            // Giữ lại các máy Kiosk khác không phải máy hiện tại
                            const otherKiosksAssigned = Array.isArray(p.assignedMachines)
                                ? p.assignedMachines.filter(
                                    (am: any) =>
                                        String(am.kioskCode || "").toLowerCase() !==
                                        kKey
                                )
                                : [];

                            // Nếu sản phẩm không còn nằm trong bất kỳ khoang nào của máy này -> trả về danh sách máy khác
                            if (matchingSlotsOnThisMachine.length === 0) {
                                return {
                                    ...p,
                                    assignedMachines: otherKiosksAssigned,
                                };
                            }

                            const slotMatch = matchingSlotsOnThisMachine[0];
                            const wasSprayed =
                                options?.sprayedSlot &&
                                isExactMatch(
                                    options.sprayedSlot.productName,
                                    slotMatch.productName
                                );

                            const nextExtra = wasSprayed
                                ? Number(p.liveExtraSprays || 0) + 1
                                : Number(p.liveExtraSprays || 0);
                            const base30d = Number(p.baseSessions30d || 300);

                            const thisKioskAssignments = matchingSlotsOnThisMachine.map(
                                (sm) => ({
                                    kioskCode,
                                    location: locName,
                                    slotNumber: sm.slotNumber,
                                    physicalSlotLabel: `Slot 0${sm.slotNumber}`,
                                    machineStatus: effectiveFleetStatus,
                                    bottleCode: sm.bottleCode,
                                    remainingVolumeMl: sm.remainingVolumeMl,
                                    thresholdPct: 15,
                                    lastRefilled: new Date()
                                        .toISOString()
                                        .split("T")[0],
                                })
                            );

                            return {
                                ...p,
                                pricePerSpray: slotMatch.pricePerSpray,
                                retail10ml: slotMatch.pricePerSpray * 30,
                                liveExtraSprays: nextExtra,
                                samplingSessions30d: base30d + nextExtra,
                                assignedMachines: [
                                    ...thisKioskAssignments,
                                    ...otherKiosksAssigned,
                                ],
                            };
                        });
                        localStorage.setItem(
                            PRODUCTS_STORAGE_KEY,
                            JSON.stringify(syncedProds)
                        );
                    }
                }

                // 4. Cập nhật kho BRANDS_STORAGE_KEY, ALERTS_STORAGE_KEY & AUDIT_LOGS_STORAGE_KEY
                const rawBrands = localStorage.getItem(BRANDS_STORAGE_KEY);
                if (rawBrands && options?.sprayedSlot) {
                    const parsedBrands = JSON.parse(rawBrands);
                    if (Array.isArray(parsedBrands)) {
                        const syncedBrands = parsedBrands.map((b: any) =>
                            isExactMatch(b.name || "", options.sprayedSlot!.brand)
                                ? {
                                    ...b,
                                    transactionsCount: (b.transactionsCount || 0) + 1,
                                    revenueValue:
                                        (b.revenueValue || 0) +
                                        options.sprayedSlot!.pricePerSpray,
                                }
                                : b
                        );
                        localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(syncedBrands));
                    }
                }

                const rawAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
                if (rawAlerts && options?.restartedToOnline) {
                    const parsedAlerts = JSON.parse(rawAlerts);
                    if (Array.isArray(parsedAlerts)) {
                        const syncedAlerts = parsedAlerts.map((al: any) =>
                            String(al.machineId || "").toLowerCase() === kKey
                                ? { ...al, status: "RESOLVED", resolvedAt: formatNowStr() }
                                : al
                        );
                        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(syncedAlerts));
                    }
                }

                const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                auditList.unshift({
                    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
                    timestamp: new Date().toISOString(),
                    actor: currentActorLabel,
                    role: "OM",
                    tenant: brandTenant,
                    action: options?.sprayedSlot
                        ? "MACHINE_SLOT_SPRAYED"
                        : "MACHINE_DETAIL_UPDATED",
                    entityType: "MACHINES",
                    entityId: kioskCode,
                    severity: "INFO",
                    oldValues: null,
                    newValues: {
                        status: effectiveFleetStatus,
                        locationName: locName,
                    },
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(
                    AUDIT_LOGS_STORAGE_KEY,
                    JSON.stringify(auditList.slice(0, 250))
                );

                // 5. Ghi lịch sử biến động tồn kho (INVENTORY_MOVEMENTS_KEY) & Giao dịch (DASHBOARD_STORAGE_KEY)
                const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
                const dashData = rawDash
                    ? JSON.parse(dashRawOrEmpty(rawDash))
                    : { transactions: [], incidents: [], alerts: [] };
                if (!Array.isArray(dashData.transactions)) dashData.transactions = [];
                if (!Array.isArray(dashData.alerts)) dashData.alerts = [];

                if (options?.sprayedSlot) {
                    const sp = options.sprayedSlot;
                    const newOrderId = `ORD-2026-${Math.floor(1000 + Math.random() * 8999)}`;
                    const nowIso = new Date().toISOString();

                    dashData.transactions.unshift({
                        id: newOrderId,
                        time: `Completed (${kioskCode})`,
                        kiosk: kioskCode,
                        slotNumber: sp.slotNumber,
                        brand: sp.brand,
                        product: sp.productName,
                        priceSnapshot: sp.pricePerSpray,
                        amount: sp.pricePerSpray,
                        paidAmount: sp.pricePerSpray,
                        paymentMethod: "VIETQR",
                        providerReference: `PAY-VIETQR-${newOrderId}`,
                        status: "DISPENSED",
                        commandReference: `CMD-${newOrderId}`,
                        ackedAt: nowIso,
                        executedAt: nowIso,
                        createdAt: nowIso,
                    });

                    const rawMovements = localStorage.getItem(INVENTORY_MOVEMENTS_KEY);
                    const movements = rawMovements ? JSON.parse(rawMovements) : [];
                    movements.unshift({
                        movementId: `MOV-${Date.now()}`,
                        orderId: newOrderId,
                        kioskCode,
                        slotNumber: sp.slotNumber,
                        brand: sp.brand,
                        productName: sp.productName,
                        movementType: "SALE",
                        quantityBeforeMl: Number((sp.remainingVolumeMl + 0.12).toFixed(2)),
                        quantityAfterMl: sp.remainingVolumeMl,
                        deltaMl: -0.12,
                        reason: `Hardware console spray on ${kioskCode} (Slot 0${sp.slotNumber})`,
                        timestamp: nowIso,
                    });
                    localStorage.setItem(
                        INVENTORY_MOVEMENTS_KEY,
                        JSON.stringify(movements.slice(0, 300))
                    );
                }

                localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashData));

                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("scentstation-sync"));
                }
            } catch {
                // Safe fallback
            }
        },
        [
            brandTenant,
            canonicalCode,
            configVersion,
            currentActorLabel,
            firmwareVersion,
            locationName,
            rawId,
            streetAddress,
        ]
    );

    const handleToggleMachineOperatingMode = () => {
        if (isViewerReadOnly) return;
        const nextMode = operatingMode === "ACTIVE" ? "MAINTENANCE" : "ACTIVE";
        const nextConn = nextMode === "ACTIVE" ? "ONLINE" : connectionStatus;

        const nextSlots = slots.map((s) => ({
            ...s,
            enabled: nextMode === "ACTIVE" && s.remainingVolumeMl >= 0.12,
        }));

        setOperatingMode(nextMode);
        setConnectionStatus(nextConn);
        setSlots(nextSlots);

        syncHardwareStateToAllStores(nextSlots, nextConn, nextMode);

        setLogs((prev) => [
            {
                id: `LOG-${Date.now().toString().slice(-3)}`,
                timestamp: formatNowStr(),
                type: "EVENT",
                severity: nextMode === "MAINTENANCE" ? "WARNING" : "INFO",
                message: `Station operating mode switched to ${nextMode} by ${currentActorLabel}.`,
            },
            ...prev,
        ]);
        showBanner(
            lang === "en"
                ? `Station ${canonicalCode} operating mode updated to [${nextMode}] and synchronized across Storefront, Kiosk & Fleet!`
                : `Đã chuyển chế độ hoạt động của trạm ${canonicalCode} sang [${nextMode}] và đồng bộ toàn hệ thống!`
        );
    };

    const handleForceOfflineMachineDetail = () => {
        if (isViewerReadOnly) return;
        const nextConn = "OFFLINE";
        const nextMode = "DISABLED";
        const nextSlots = slots.map((s) => ({ ...s, enabled: false }));

        setConnectionStatus(nextConn);
        setOperatingMode(nextMode);
        setSlots(nextSlots);

        syncHardwareStateToAllStores(nextSlots, nextConn, nextMode, {
            restartedToOnline: false,
        });

        setLogs((prev) => [
            {
                id: `LOG-${Date.now().toString().slice(-3)}`,
                timestamp: formatNowStr(),
                type: "ERROR",
                severity: "CRITICAL",
                message: `MQTT connection terminated (OFFLINE). All 4 chambers locked from accepting new customer orders.`,
            },
            ...prev,
        ]);

        showBanner(
            lang === "en"
                ? `Station ${canonicalCode} is now OFFLINE. All 4 chambers are locked on Storefront & Kiosk!`
                : `Trạm ${canonicalCode} đã chuyển sang OFFLINE. Cả 4 khoang đã được khóa an toàn trên Trang chủ & Kiosk!`,
            "error"
        );
    };

    const handleToggleSlot = (slotNum: number) => {
        if (isViewerReadOnly) return;

        if (connectionStatus === "OFFLINE") {
            showBanner(
                lang === "en"
                    ? `Cannot enable Slot 0${slotNum} while station is OFFLINE. Reconnect or Restart Station first.`
                    : `Không thể bật Slot 0${slotNum} khi trạm đang OFFLINE. Vui lòng kết nối lại trước.`,
                "error"
            );
            return;
        }

        const target = slots.find((s) => s.slotNumber === slotNum);
        if (!target) return;

        if (!target.enabled && target.remainingVolumeMl < 0.12) {
            showBanner(
                lang === "en"
                    ? `Cannot enable Slot 0${slotNum}: Cartridge is depleted (${target.remainingVolumeMl}ml). Click "Refill ${target.capacityMl}ml" first.`
                    : `Không thể bật Slot 0${slotNum}: Bình đã cạn (${target.remainingVolumeMl}ml). Vui lòng bấm Nạp đầy trước.`,
                "error"
            );
            return;
        }

        const updatedSlots = slots.map((s) =>
            s.slotNumber === slotNum ? { ...s, enabled: !s.enabled } : s
        );
        setSlots(updatedSlots);
        syncHardwareStateToAllStores(
            updatedSlots,
            connectionStatus,
            operatingMode
        );
        showBanner(
            lang === "en"
                ? `Slot 0${slotNum} (${target.productName}) is now ${
                    !target.enabled ? "ENABLED" : "LOCKED"
                } and synchronized to Storefront & Kiosk!`
                : `Đã ${!target.enabled ? "MỞ KHÓA" : "TẠM KHÓA"} Slot 0${slotNum} (${target.productName}) và đồng bộ sang Màn 1 & Màn 4!`
        );
    };

    const handleSimulateSlotSpray = (slotNum: number) => {
        if (isViewerReadOnly) return;

        if (connectionStatus === "OFFLINE") {
            showBanner(
                lang === "en"
                    ? `Action Blocked: Station ${canonicalCode} is currently OFFLINE.`
                    : `Từ chối thực thi: Trạm ${canonicalCode} đang OFFLINE.`,
                "error"
            );
            return;
        }

        if (operatingMode !== "ACTIVE") {
            showBanner(
                lang === "en"
                    ? `Action Blocked: Station ${canonicalCode} is in [${operatingMode}] mode. Enable station first.`
                    : `Từ chối thực thi: Trạm ${canonicalCode} đang ở chế độ [${operatingMode}].`,
                "error"
            );
            return;
        }

        const target = slots.find((s) => s.slotNumber === slotNum);
        if (!target) return;

        if (!target.enabled) {
            showBanner(
                lang === "en"
                    ? `Slot 0${slotNum} (${target.productName}) is currently locked. Click "Enable Slot" first.`
                    : `Slot 0${slotNum} (${target.productName}) đang tạm khóa. Vui lòng bật khoang trước.`,
                "error"
            );
            return;
        }

        if (target.remainingVolumeMl < 0.12) {
            showBanner(
                lang === "en"
                    ? `Cartridge Depleted: Slot 0${slotNum} (${target.productName}) is at ${target.remainingVolumeMl}ml. Please replenish first.`
                    : `Bình đã cạn: Slot 0${slotNum} (${target.productName}) còn ${target.remainingVolumeMl}ml. Vui lòng nạp đầy trước.`,
                "error"
            );
            return;
        }

        const nextMl = Number(
            Math.max(0, target.remainingVolumeMl - 0.12).toFixed(2)
        );
        const autoEnabled = nextMl >= 0.12 ? target.enabled : false;

        const updatedSlotObj: MachineSlotConfig = {
            ...target,
            remainingVolumeMl: nextMl,
            enabled: autoEnabled,
        };

        const updatedSlots = slots.map((s) =>
            s.slotNumber === slotNum ? updatedSlotObj : s
        );

        setSlots(updatedSlots);
        syncHardwareStateToAllStores(
            updatedSlots,
            connectionStatus,
            operatingMode,
            { sprayedSlot: updatedSlotObj }
        );

        setLogs((prev) => [
            {
                id: `LOG-${Date.now().toString().slice(-3)}`,
                timestamp: formatNowStr(),
                type: "COMMAND",
                severity: nextMl <= target.thresholdMl ? "WARNING" : "INFO",
                message: `Calibrated spray executed on Slot 0${slotNum} (${target.productName}, -0.12ml). Remaining: ${nextMl}ml.`,
            },
            ...prev,
        ]);

        showBanner(
            lang === "en"
                ? `Dispensed 1 calibrated spray (-0.12ml) on Slot 0${slotNum} (${target.productName}): ${target.remainingVolumeMl}ml → ${nextMl}ml. Synchronized to Storefront, Kiosk & Products Analytics!`
                : `Đã xịt 1 lần (-0.12ml) tại Slot 0${slotNum} (${target.productName}): ${target.remainingVolumeMl}ml → ${nextMl}ml. Đã đồng bộ sang Màn 1, 4, 5 & 6!`
        );
    };

    const handleQuickRefillSlot = (slotNum: number) => {
        if (isViewerReadOnly) return;
        const updatedSlots = slots.map((s) =>
            s.slotNumber === slotNum
                ? {
                    ...s,
                    remainingVolumeMl: s.capacityMl,
                    enabled: connectionStatus === "ONLINE" && operatingMode === "ACTIVE",
                    bottleCode: `BTL-2026-R${slotNum}${Math.floor(
                        10 + Math.random() * 89
                    )}`,
                }
                : s
        );
        setSlots(updatedSlots);
        syncHardwareStateToAllStores(
            updatedSlots,
            connectionStatus,
            operatingMode,
            { refilledSlotNumber: slotNum }
        );

        setLogs((prev) => [
            {
                id: `LOG-${Date.now().toString().slice(-3)}`,
                timestamp: formatNowStr(),
                type: "EVENT",
                severity: "INFO",
                message: `Slot 0${slotNum} cartridge replenished to 100% capacity.`,
            },
            ...prev,
        ]);

        showBanner(
            lang === "en"
                ? `Slot 0${slotNum} replenished to 100% capacity and synchronized across Storefront, Kiosk, Products & Fleet!`
                : `Đã nạp đầy 100% cho Slot 0${slotNum} và đồng bộ tức thì sang Màn 1, 4, 5 & 6!`
        );
    };

    const handleSaveSlotAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlotForAssign || isViewerReadOnly) return;
        const previousProductName = selectedSlotForAssign.productName;
        const found =
            catalogOptions.find((c) => isExactMatch(c.name, assignPerfumeName)) ||
            catalogOptions[0];

        const nextVolume = installFreshBottleOnAssign
            ? found.cap
            : Math.min(
                selectedSlotForAssign.remainingVolumeMl || found.cap,
                found.cap
            );

        const updatedSlots = slots.map((s) =>
            s.slotNumber === selectedSlotForAssign.slotNumber
                ? {
                    ...s,
                    productName: found.name,
                    brand: found.brand,
                    capacityMl: found.cap,
                    remainingVolumeMl: nextVolume,
                    pricePerSpray: assignPrice,
                    sprayDurationMs: assignDurationMs,
                    thresholdMl: assignThresholdMl,
                    enabled:
                        nextVolume >= 0.12 &&
                        connectionStatus === "ONLINE" &&
                        operatingMode === "ACTIVE",
                    bottleCode: installFreshBottleOnAssign
                        ? `BTL-2026-N${s.slotNumber}${Math.floor(
                            10 + Math.random() * 89
                        )}`
                        : s.bottleCode,
                }
                : s
        );

        setSlots(updatedSlots);
        setSyncState(
            connectionStatus === "ONLINE" ? "SYNCED_MQTT" : "SAVED_DB_ONLY"
        );
        syncHardwareStateToAllStores(
            updatedSlots,
            connectionStatus,
            operatingMode,
            { replacedOldProductName: previousProductName }
        );
        setActiveModal(null);
        showBanner(
            lang === "en"
                ? `Installed ${found.brand} — ${found.name} (${nextVolume}ml / ${found.cap}ml, ${assignPrice.toLocaleString("vi-VN")} VND/spray) in Slot 0${selectedSlotForAssign.slotNumber} and synchronized across all screens!`
                : `Đã lắp đặt ${found.brand} — ${found.name} (${nextVolume}ml / ${found.cap}ml, ${assignPrice.toLocaleString("vi-VN")}đ/xịt) vào Slot 0${selectedSlotForAssign.slotNumber} và đồng bộ toàn hệ thống!`
        );
    };

    const handleExecuteRemoteCommand = () => {
        if (isViewerReadOnly) return;
        if (connectionStatus === "OFFLINE") {
            showBanner(
                lang === "en"
                    ? "Command Rejected: Station is currently OFFLINE. Cannot dispatch MQTT command."
                    : "Từ chối lệnh: Trạm hiện đang OFFLINE, không thể gửi lệnh qua MQTT.",
                "error"
            );
            setActiveModal(null);
            return;
        }

        if (selectedCommand === "SYNC_SLOT_CONFIG") {
            setConfigVersion("cfg-2026.12");
            setSyncState("SYNCED_MQTT");
            syncHardwareStateToAllStores(
                slots,
                connectionStatus,
                operatingMode,
                { nextCfg: "cfg-2026.12" }
            );
        } else if (selectedCommand === "DIAGNOSTIC_SPRAY_SLOT_01") {
            setActiveModal(null);
            handleSimulateSlotSpray(1);
            return;
        }

        showBanner(
            lang === "en"
                ? `Command [${selectedCommand}] signed with HMAC-SHA256 acknowledged by station (118ms).`
                : `Lệnh [${selectedCommand}] ký số HMAC-SHA256 đã được trạm xác nhận thành công (118ms).`
        );
        setLogs((prev) => [
            {
                id: `LOG-${Date.now().toString().slice(-3)}`,
                timestamp: formatNowStr(),
                type: "COMMAND",
                severity: "INFO",
                message: `Remote Command [${selectedCommand}] executed by ${currentActorLabel} and acknowledged by station.`,
            },
            ...prev,
        ]);
        setActiveModal(null);
    };

    const handleConfirmRestart = () => {
        if (isViewerReadOnly) return;
        const recoveredSlots = slots.map((s) => {
            const restoredMl =
                s.remainingVolumeMl < 0.12 ? s.capacityMl : s.remainingVolumeMl;
            return {
                ...s,
                remainingVolumeMl: restoredMl,
                enabled: true,
            };
        });

        setConnectionStatus("ONLINE");
        setOperatingMode("ACTIVE");
        setChamberTemp("21.4°C");
        setSyncState("SYNCED_MQTT");
        setSlots(recoveredSlots);

        syncHardwareStateToAllStores(recoveredSlots, "ONLINE", "ACTIVE", {
            restartedToOnline: true,
        });

        setLogs((prev) => [
            {
                id: `LOG-${Date.now().toString().slice(-3)}`,
                timestamp: formatNowStr(),
                type: "EVENT",
                severity: "INFO",
                message: `Remote Restart completed. MQTT TLS 1.3 session re-established and all 4 chambers enabled.`,
            },
            ...prev,
        ]);

        showBanner(
            lang === "en"
                ? `Station ${canonicalCode} restarted, restored to ONLINE & ACTIVE service, and synchronized across all screens!`
                : `Đã khởi động lại trạm ${canonicalCode}, khôi phục trạng thái ONLINE & ACTIVE và đồng bộ toàn hệ thống!`
        );
        setActiveModal(null);
    };

    const handleSaveEditedMachineInfo = (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewerReadOnly) return;

        syncHardwareStateToAllStores(slots, connectionStatus, operatingMode, {
            nextLocName: locationName.trim() || preset.locationName,
            nextAddress: streetAddress.trim() || preset.streetAddress,
        });

        setLogs((prev) => [
            {
                id: `LOG-${Date.now().toString().slice(-3)}`,
                timestamp: formatNowStr(),
                type: "EVENT",
                severity: "INFO",
                message: `Updated installation venue to "${locationName} (${streetAddress})" by ${currentActorLabel}.`,
            },
            ...prev,
        ]);

        setActiveModal(null);
        showBanner(
            lang === "en"
                ? `Updated boutique venue details for ${canonicalCode} and synchronized across Fleet, Storefront & Kiosk!`
                : `Đã cập nhật địa điểm lắp đặt cho trạm ${canonicalCode} và đồng bộ toàn hệ thống!`
        );
    };

    const handleCreateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewerReadOnly) return;

        if (hasOpenTicket) {
            showBanner(
                lang === "en"
                    ? `An unresolved maintenance ticket (${activeTicketCode || "#MNT-2026-ACTIVE"}) already exists for ${canonicalCode}.`
                    : `Trạm ${canonicalCode} hiện đang có phiếu bảo trì chưa đóng (${activeTicketCode || "#MNT-2026-ACTIVE"}).`,
                "error"
            );
            setActiveModal(null);
            return;
        }

        const newTicketId = `MNT-2026-${Math.floor(810 + Math.random() * 180)}`;
        setHasOpenTicket(true);
        setActiveTicketCode(newTicketId);
        setOperatingMode("MAINTENANCE");

        syncHardwareStateToAllStores(slots, connectionStatus, "MAINTENANCE", {
            createdTicketCode: newTicketId,
            ticketNote: ticketDesc,
            ticketPriorityLevel: ticketPriority,
        });

        setLogs((prev) => [
            {
                id: `LOG-${Date.now().toString().slice(-3)}`,
                timestamp: formatNowStr(),
                type: "EVENT",
                severity: "WARNING",
                message: `Created Maintenance Ticket #${newTicketId} [${ticketPriority}]: ${ticketDesc}`,
            },
            ...prev,
        ]);

        showBanner(
            lang === "en"
                ? `Maintenance Ticket #${newTicketId} [${ticketPriority}] created. Station ${canonicalCode} placed in Maintenance Mode.`
                : `Đã tạo phiếu bảo trì #${newTicketId} [${ticketPriority}] và chuyển trạm ${canonicalCode} sang chế độ Bảo trì.`
        );
        setActiveModal(null);
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(
            (l) => logFilterType === "ALL" || l.type === logFilterType
        );
    }, [logs, logFilterType]);

    const selectedAssignMeta =
        catalogOptions.find((c) => isExactMatch(c.name, assignPerfumeName)) ||
        catalogOptions[0];

    const REMOTE_COMMAND_OPTIONS = [
        {
            code: "STATUS_PING",
            label:
                lang === "en"
                    ? "STATUS_PING — Request Immediate Sensor Telemetry"
                    : "STATUS_PING — Yêu Cầu Báo Cáo Cảm Biến Tức Thì",
        },
        {
            code: "SYNC_SLOT_CONFIG",
            label:
                lang === "en"
                    ? "SYNC_SLOT_CONFIG — Push Chamber Prices & Thresholds (cfg-2026.12)"
                    : "SYNC_SLOT_CONFIG — Đồng Bộ Giá Xịt & Ngưỡng Cảnh Báo (cfg-2026.12)",
        },
        {
            code: "DIAGNOSTIC_SPRAY_SLOT_01",
            label:
                lang === "en"
                    ? "DIAGNOSTIC_SPRAY_SLOT_01 — Calibrated Nozzle Test (-0.12ml)"
                    : "DIAGNOSTIC_SPRAY_SLOT_01 — Xịt Kiểm Chuẩn Vòi Phun (-0.12ml)",
        },
    ];

    return (
        <div
            className={`${styles.container} notranslate`}
            translate="no"
            suppressHydrationWarning
        >
            <div className={styles.topBarRow}>
                <Link href="/machines" className={styles.backLink}>
                    <ArrowLeft size={15} />
                    <span>
                        {lang === "en"
                            ? "Back to IoT Machine Fleet"
                            : "Quay Lại Đội Máy Kiosk"}
                    </span>
                </Link>

                <div
                    style={{
                        display: "flex",
                        gap: "0.6rem",
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <span className={styles.syncBadge}>
                        <span>CONFIG STATE: </span>
                        <span>
                            {syncState === "SYNCED_MQTT"
                                ? "SYNCED WITH STATION ✓"
                                : "SAVED (PENDING MQTT SYNC)"}
                        </span>
                    </span>

                    <button
                        type="button"
                        onClick={handleToggleLanguage}
                        className={styles.restartBtn}
                    >
                        <Globe size={14} color="#D4AF37" />
                        <span>{lang === "en" ? "EN" : "VI"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            router.push(`/kiosk/${encodeURIComponent(canonicalCode)}`)
                        }
                        className={styles.restartBtn}
                        style={{
                            color: "#F5E6AD",
                            borderColor: "rgba(212,175,55,0.45)",
                        }}
                    >
                        <Smartphone size={14} color="#34D399" />
                        <span>
                            {lang === "en"
                                ? `Open Customer Kiosk (${canonicalCode})`
                                : `Mở Màn Hình Kiosk (${canonicalCode})`}
                        </span>
                    </button>
                </div>
            </div>

            {/* LUXURY HERO BANNER HEADER */}
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <span className={styles.eyebrowTag}>
                            {lang === "en"
                                ? `4-CHAMBER HARDWARE CONSOLE • ${serialNumber}`
                                : `BẢNG ĐIỀU KHIỂN PHẦN CỨNG 4 KHOANG • ${serialNumber}`}
                        </span>
                        <div className={styles.titleGroup}>
                            <h1 className={styles.machineTitle}>
                                {locationName} ({canonicalCode})
                            </h1>
                            <span
                                className={
                                    connectionStatus === "OFFLINE"
                                        ? styles.offlineBadge
                                        : operatingMode === "MAINTENANCE"
                                            ? styles.maintenanceBadge
                                            : styles.onlineBadge
                                }
                            >
                                <span className={styles.dotOnline} />
                                <span>
                                    {connectionStatus} • {operatingMode}
                                </span>
                            </span>
                        </div>
                        <p className={styles.addressText}>
                            <MapPin size={15} color="#D4AF37" />
                            <span>
                                {streetAddress} • Primary Maison:{" "}
                                <strong style={{ color: "#F5E6AD" }}>
                                    {brandTenant}
                                </strong>
                            </span>
                        </p>
                    </div>

                    <div className={styles.actionsGroup}>
                        {!isViewerReadOnly && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleToggleMachineOperatingMode}
                                    className={styles.restartBtn}
                                >
                                    <Power size={15} color="#34D399" />
                                    <span>
                                        {operatingMode === "ACTIVE"
                                            ? lang === "en"
                                                ? "Enter Maintenance Mode"
                                                : "Chuyển Chế Độ Bảo Trì"
                                            : lang === "en"
                                                ? "Restore Active Service"
                                                : "Khôi Phục Phục Vụ"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (connectionStatus === "ONLINE") {
                                            handleForceOfflineMachineDetail();
                                        } else {
                                            handleConfirmRestart();
                                        }
                                    }}
                                    className={styles.restartBtn}
                                    style={{
                                        borderColor:
                                            connectionStatus === "ONLINE"
                                                ? "rgba(248,113,113,0.5)"
                                                : "rgba(52,211,153,0.5)",
                                        color:
                                            connectionStatus === "ONLINE"
                                                ? "#F87171"
                                                : "#34D399",
                                    }}
                                >
                                    <WifiOff size={15} />
                                    <span>
                                        {connectionStatus === "ONLINE"
                                            ? lang === "en"
                                                ? "Disconnect Station"
                                                : "Ngắt Kết Nối (Offline)"
                                            : lang === "en"
                                                ? "Reconnect Station"
                                                : "Kết Nối Lại (Online)"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveModal("REMOTE_CONTROL")}
                                    className={styles.restartBtn}
                                >
                                    <Terminal size={15} color="#D4AF37" />
                                    <span>
                                        {lang === "en" ? "Remote Command" : "Lệnh Từ Xa"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveModal("RESTART")}
                                    className={styles.restartBtn}
                                >
                                    <RotateCcw size={15} color="#D4AF37" />
                                    <span>
                                        {lang === "en" ? "Restart Station" : "Khởi Động Lại"}
                                    </span>
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => setActiveModal("LOGS")}
                            className={styles.restartBtn}
                        >
                            <FileText size={15} color="#60A5FA" />
                            <span>
                                {lang === "en"
                                    ? `Telemetry Logs (${logs.length})`
                                    : `Nhật Ký Thiết Bị (${logs.length})`}
                            </span>
                        </button>

                        {!isViewerReadOnly && (
                            <button
                                type="button"
                                onClick={() => setActiveModal("TICKET")}
                                className={styles.maintenanceBtn}
                            >
                                <Wrench size={15} />
                                <span>
                                    {hasOpenTicket
                                        ? `Ticket Active (${activeTicketCode})`
                                        : lang === "en"
                                            ? "Create Maintenance Ticket"
                                            : "Tạo Phiếu Bảo Trì"}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {commandFeedback && (
                <div
                    style={{
                        marginBottom: "1.25rem",
                        padding: "0.9rem 1.25rem",
                        borderRadius: "14px",
                        background:
                            commandFeedback.type === "error"
                                ? "rgba(239,68,68,0.14)"
                                : "rgba(212,175,55,0.12)",
                        border: `1px solid ${
                            commandFeedback.type === "error"
                                ? "rgba(239,68,68,0.45)"
                                : "rgba(212,175,55,0.45)"
                        }`,
                        color:
                            commandFeedback.type === "error"
                                ? "#FCA5A5"
                                : "#F5E6AD",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.84rem",
                        fontWeight: 600,
                    }}
                >
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.55rem",
                        }}
                    >
                        {commandFeedback.type === "error" ? (
                            <AlertOctagon size={16} color="#F87171" />
                        ) : (
                            <CheckCircle2 size={16} color="#34D399" />
                        )}
                        <span>{commandFeedback.text}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setCommandFeedback(null)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#FFF",
                            cursor: "pointer",
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* MACHINE INFORMATION + REAL-TIME SENSORS */}
            <div className={styles.gridSection}>
                <div className={styles.card}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                        }}
                    >
                        <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                            <Cpu size={18} color="#D4AF37" />
                            <span>
                                {lang === "en"
                                    ? "Station Identity & Firmware Configuration"
                                    : "Định Danh Trạm Kiosk & Phiên Bản Phần Cứng"}
                            </span>
                        </h2>
                        {!isViewerReadOnly && (
                            <button
                                type="button"
                                onClick={() => setActiveModal("EDIT_INFO")}
                                className={styles.toggleSlotBtn}
                                style={{
                                    color: "#F5E6AD",
                                    borderColor: "rgba(212,175,55,0.4)",
                                    background: "rgba(212,175,55,0.1)",
                                }}
                            >
                                <Edit3 size={13} />
                                <span>
                                    {lang === "en" ? "Edit Venue Info" : "Sửa Địa Điểm"}
                                </span>
                            </button>
                        )}
                    </div>

                    <div className={styles.infoCardGrid}>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>
                                {lang === "en"
                                    ? "Station Code & Serial Number"
                                    : "Mã Trạm & Số Serial Phần Cứng"}
                            </span>
                            <span className={styles.infoBoxValue}>
                                {canonicalCode} • {serialNumber}
                            </span>
                        </div>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>
                                {lang === "en"
                                    ? "Assigned Maison Tenant"
                                    : "Thương Hiệu Quản Lý Chính"}
                            </span>
                            <span className={styles.infoBoxValue}>
                                {brandTenant}
                            </span>
                        </div>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>
                                {lang === "en"
                                    ? "Firmware & Configuration Version"
                                    : "Phiên Bản Firmware & Cấu Hình"}
                            </span>
                            <span
                                className={styles.infoBoxValue}
                                style={{ color: "#F5E6AD" }}
                            >
                                {firmwareVersion} • {configVersion}
                            </span>
                        </div>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>
                                {lang === "en"
                                    ? "MQTT Heartbeat Status"
                                    : "Tín Hiệu Kết Nối MQTT"}
                            </span>
                            <span
                                className={styles.infoBoxValue}
                                style={{
                                    color:
                                        connectionStatus === "ONLINE"
                                            ? "#34D399"
                                            : "#F87171",
                                }}
                            >
                                {connectionStatus === "ONLINE"
                                    ? lang === "en"
                                        ? "ONLINE — Heartbeat Verified (3s ago)"
                                        : "TRỰC TUYẾN — Nhịp tim ổn định (3 giây trước)"
                                    : lang === "en"
                                        ? "OFFLINE — Disconnected"
                                        : "NGOẠI TUYẾN — Mất kết nối"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Real-time Sensors */}
                <div className={styles.card}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                        }}
                    >
                        <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                            <Activity size={18} color="#34D399" />
                            <span>
                                {lang === "en"
                                    ? "Chamber Telemetry & Interlocks"
                                    : "Cảm Biến Buồng Xịt & Khóa An Toàn"}
                            </span>
                        </h2>
                    </div>

                    {connectionStatus === "OFFLINE" && (
                        <div
                            style={{
                                padding: "0.6rem 0.85rem",
                                borderRadius: "10px",
                                background: "rgba(251,191,36,0.14)",
                                border: "1px solid rgba(251,191,36,0.4)",
                                color: "#FBBF24",
                                fontSize: "0.75rem",
                                marginBottom: "0.85rem",
                            }}
                        >
                            <strong>
                                {lang === "en"
                                    ? "Offline Telemetry:"
                                    : "Cảm biến ngoại tuyến:"}
                            </strong>{" "}
                            <span>
                                {lang === "en"
                                    ? "Displaying last recorded readings prior to disconnection."
                                    : "Đang hiển thị số đo ghi nhận lần cuối trước khi ngắt kết nối."}
                            </span>
                        </div>
                    )}

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                        }}
                    >
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>
                                <Thermometer
                                    size={13}
                                    style={{ display: "inline", marginRight: "4px" }}
                                />
                                <span>
                                    {lang === "en"
                                        ? "Preservation Chamber Climate"
                                        : "Nhiệt Độ Bảo Quản Buồng Chứa"}
                                </span>
                            </span>
                            <span
                                className={styles.infoBoxValue}
                                style={{ color: "#34D399" }}
                            >
                                {chamberTemp} {"(Optimal < 23.0°C)"}
                            </span>
                        </div>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>
                                <Zap
                                    size={13}
                                    style={{ display: "inline", marginRight: "4px" }}
                                />
                                <span>
                                    {lang === "en"
                                        ? "Actuator Bus & Cabinet Door Interlock"
                                        : "Điện Áp Vòi Phun & Cảm Biến Cửa"}
                                </span>
                            </span>
                            <span className={styles.infoBoxValue}>
                                <span>
                                    {connectionStatus === "ONLINE"
                                        ? "24.0V DC"
                                        : "0.0V (Offline)"}
                                </span>
                                <span style={{ color: "#34D399" }}>
                                    {" "}
                                    • Door: CLOSED ✓
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4 INDEPENDENT PERFUME SLOTS */}
            <div className={styles.card}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.2rem",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                    }}
                >
                    <div>
                        <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                            <Droplets size={18} color="#D4AF37" />
                            <span>
                                {lang === "en"
                                    ? "4-Chamber Independent Fragrance Configuration"
                                    : "Cấu Hình 4 Khoang Nước Hoa Độc Lập"}
                            </span>
                        </h2>
                        <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                            {lang === "en"
                                ? "Assign any fragrance from the catalog, calibrate spray pricing, replenish cartridges, or trigger a 0.12ml test spray."
                                : "Gán mùi hương từ danh mục, điều chỉnh giá mỗi lần xịt, nạp đầy bình 100% hoặc kích hoạt xịt thử định lượng 0.12ml."}
                        </span>
                    </div>
                </div>

                <div className={styles.slotsGrid}>
                    {slots.map((slot) => {
                        const pct = Math.round(
                            (slot.remainingVolumeMl / slot.capacityMl) * 100
                        );
                        const slotStatus =
                            slot.remainingVolumeMl < 0.12
                                ? "EMPTY"
                                : slot.remainingVolumeMl <= slot.thresholdMl
                                    ? "LOW"
                                    : "AVAILABLE";

                        return (
                            <div
                                key={slot.slotNumber}
                                className={styles.slotCard}
                            >
                                <div>
                                    <div className={styles.slotHeader}>
                                        <span className={styles.slotNumberTag}>
                                            SLOT 0{slot.slotNumber}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "0.66rem",
                                                fontWeight: 700,
                                                fontFamily: "Space Grotesk, monospace",
                                                padding: "0.2rem 0.6rem",
                                                borderRadius: "99px",
                                                background:
                                                    !slot.enabled || slotStatus === "EMPTY"
                                                        ? "rgba(248,113,113,0.16)"
                                                        : slotStatus === "LOW"
                                                            ? "rgba(251,191,36,0.16)"
                                                            : "rgba(52,211,153,0.14)",
                                                color:
                                                    !slot.enabled || slotStatus === "EMPTY"
                                                        ? "#F87171"
                                                        : slotStatus === "LOW"
                                                            ? "#FBBF24"
                                                            : "#34D399",
                                            }}
                                        >
                                            <span>{slotStatus}</span>
                                            <span> • </span>
                                            <span>
                                                {slot.enabled ? "ACTIVE" : "LOCKED"}
                                            </span>
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "0.68rem",
                                            color: "#D4AF37",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        {slot.brand}
                                    </div>
                                    <h3
                                        style={{
                                            margin: "0.2rem 0",
                                            fontSize: "1.06rem",
                                            color: "#FFF",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {slot.productName}
                                    </h3>
                                    <div
                                        style={{
                                            fontSize: "0.75rem",
                                            color: "#94A3B8",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        <span>{slot.bottleCode} • </span>
                                        <strong style={{ color: "#F5E6AD" }}>
                                            {slot.pricePerSpray.toLocaleString("vi-VN")} VND
                                        </strong>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.69rem",
                                            color: "#94A3B8",
                                            marginTop: "3px",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        Pulse: {slot.sprayDurationMs}ms (0.12ml) • Low Alert:{" "}
                                        {slot.thresholdMl}ml
                                    </div>

                                    <div className={styles.progressBarContainer}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: "0.75rem",
                                                marginBottom: "0.38rem",
                                                fontFamily: "Space Grotesk, monospace",
                                            }}
                                        >
                                            <span style={{ color: "#94A3B8" }}>
                                                {lang === "en" ? "Remaining" : "Còn lại"}
                                            </span>
                                            <strong
                                                style={{
                                                    color:
                                                        slotStatus === "AVAILABLE"
                                                            ? "#34D399"
                                                            : slotStatus === "LOW"
                                                                ? "#FBBF24"
                                                                : "#F87171",
                                                }}
                                            >
                                                {slot.remainingVolumeMl}ml / {slot.capacityMl}ml ({pct}%)
                                            </strong>
                                        </div>
                                        <div className={styles.progressBarTrack}>
                                            <div
                                                style={{
                                                    width: `${pct}%`,
                                                    height: "100%",
                                                    background:
                                                        slotStatus === "AVAILABLE"
                                                            ? "linear-gradient(90deg, #D4AF37, #34D399)"
                                                            : slotStatus === "LOW"
                                                                ? "#FBBF24"
                                                                : "#F87171",
                                                    transition: "width 0.3s ease",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {!isViewerReadOnly && (
                                    <div className={styles.slotActionGrid}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedSlotForAssign(slot);
                                                setAssignPerfumeName(slot.productName);
                                                setAssignPrice(slot.pricePerSpray);
                                                setAssignDurationMs(slot.sprayDurationMs);
                                                setAssignThresholdMl(slot.thresholdMl);
                                                setInstallFreshBottleOnAssign(true);
                                                setIsAssignMenuOpen(false);
                                                setActiveModal("ASSIGN_SLOT");
                                            }}
                                            className={styles.toggleSlotBtn}
                                            style={{
                                                background: "rgba(212,175,55,0.14)",
                                                color: "#F5E6AD",
                                                borderColor: "rgba(212,175,55,0.35)",
                                            }}
                                        >
                                            <span>
                                                {lang === "en" ? "Assign Scent" : "Đổi Mùi Hương"}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                slot.remainingVolumeMl < 0.12 ||
                                                !slot.enabled ||
                                                connectionStatus === "OFFLINE" ||
                                                operatingMode !== "ACTIVE"
                                            }
                                            onClick={() =>
                                                handleSimulateSlotSpray(slot.slotNumber)
                                            }
                                            className={styles.toggleSlotBtn}
                                            style={{
                                                background: "rgba(255,255,255,0.05)",
                                                color: "#F8FAFC",
                                                opacity:
                                                    slot.remainingVolumeMl < 0.12 ||
                                                    !slot.enabled ||
                                                    connectionStatus === "OFFLINE" ||
                                                    operatingMode !== "ACTIVE"
                                                        ? 0.4
                                                        : 1,
                                            }}
                                        >
                                            <Zap size={12} color="#D4AF37" />
                                            <span>
                                                {slot.remainingVolumeMl < 0.12
                                                    ? "Empty (0ml)"
                                                    : "Spray (-0.12ml)"}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleQuickRefillSlot(slot.slotNumber)
                                            }
                                            className={styles.toggleSlotBtn}
                                            style={{
                                                background: "rgba(52,211,153,0.12)",
                                                color: "#34D399",
                                                borderColor: "rgba(52,211,153,0.35)",
                                            }}
                                        >
                                            <Droplets size={12} />
                                            <span>Refill {slot.capacityMl}ml</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleToggleSlot(slot.slotNumber)
                                            }
                                            className={styles.toggleSlotBtn}
                                            style={{
                                                background: slot.enabled
                                                    ? "rgba(248,113,113,0.12)"
                                                    : "rgba(52,211,153,0.14)",
                                                color: slot.enabled
                                                    ? "#F87171"
                                                    : "#34D399",
                                            }}
                                        >
                                            <span>
                                                {slot.enabled
                                                    ? lang === "en"
                                                        ? "Lock Slot"
                                                        : "Khóa Khoang"
                                                    : lang === "en"
                                                        ? "Enable Slot"
                                                        : "Mở Khoang"}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL 1: RESTART STATION CONFIRMATION */}
            {activeModal === "RESTART" && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setActiveModal(null)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                color: "#FFF",
                                fontSize: "1.35rem",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                            }}
                        >
                            {lang === "en"
                                ? `Confirm Station Restart (${canonicalCode})`
                                : `Xác Nhận Khởi Động Lại Trạm (${canonicalCode})`}
                        </h3>
                        <p
                            style={{
                                color: "#CBD5E1",
                                fontSize: "0.86rem",
                                lineHeight: 1.6,
                            }}
                        >
                            {lang === "en" ? (
                                <>
                                    Restarting <strong>{canonicalCode}</strong> will temporarily pause active QR sessions for ~15 seconds, re-establish the MQTT TLS connection, and restore all valid chambers to active service. Proceed?
                                </>
                            ) : (
                                <>
                                    Khởi động lại <strong>{canonicalCode}</strong> sẽ tạm dừng phiên quét mã QR trong khoảng 15 giây, thiết lập lại kết nối MQTT và mở khóa toàn bộ 4 khoang chứa. Bạn có chắc chắn muốn thực hiện?
                                </>
                            )}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "0.75rem",
                                marginTop: "1.4rem",
                            }}
                        >
                            <button
                                onClick={() => setActiveModal(null)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRestart}
                                className={styles.confirmBtn}
                            >
                                Confirm Restart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: REMOTE CONTROL DEFINED COMMANDS */}
            {activeModal === "REMOTE_CONTROL" && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setActiveModal(null)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                marginTop: 0,
                                color: "#FFF",
                                fontSize: "1.35rem",
                                fontFamily: "Bodoni Moda, Georgia, serif",
                            }}
                        >
                            {lang === "en"
                                ? "Signed MQTT Remote Command"
                                : "Gửi Lệnh Điều Khiển Từ Xa Qua MQTT"}
                        </h3>
                        <p
                            style={{
                                color: "#94A3B8",
                                fontSize: "0.82rem",
                                marginBottom: "1rem",
                            }}
                        >
                            {lang === "en"
                                ? "Select an authorized hardware command signed with HMAC-SHA256:"
                                : "Chọn lệnh phần cứng được ký xác thực HMAC-SHA256:"}
                        </p>

                        <div
                            className={styles.customDropdownWrap}
                            ref={cmdMenuRef}
                            style={{ marginBottom: "1.35rem" }}
                        >
                            <button
                                type="button"
                                onClick={() => setIsCmdMenuOpen((prev) => !prev)}
                                className={styles.customDropdownTrigger}
                            >
                                <span>
                                    {REMOTE_COMMAND_OPTIONS.find(
                                        (c) => c.code === selectedCommand
                                    )?.label || selectedCommand}
                                </span>
                                <ChevronDown size={14} color="#D4AF37" />
                            </button>
                            {isCmdMenuOpen && (
                                <div className={styles.customDropdownMenu}>
                                    {REMOTE_COMMAND_OPTIONS.map((cmd) => (
                                        <button
                                            key={cmd.code}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCommand(cmd.code);
                                                setIsCmdMenuOpen(false);
                                            }}
                                            className={`${styles.customDropdownItem} ${
                                                selectedCommand === cmd.code
                                                    ? styles.customDropdownItemActive
                                                    : ""
                                            }`}
                                        >
                                            <span>{cmd.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "0.75rem",
                            }}
                        >
                            <button
                                onClick={() => setActiveModal(null)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExecuteRemoteCommand}
                                className={styles.confirmBtn}
                            >
                                Send Signed Command
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: VIEW TELEMETRY LOGS */}
            {activeModal === "LOGS" && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setActiveModal(null)}
                >
                    <div
                        className={styles.modalContent}
                        style={{ maxWidth: "44rem" }}
                        onClick={(e) => e.stopPropagation()}
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
                            <h3
                                style={{
                                    margin: 0,
                                    color: "#FFF",
                                    fontFamily: "Bodoni Moda, Georgia, serif",
                                    fontSize: "1.35rem",
                                }}
                            >
                                {lang === "en"
                                    ? "Immutable Station Telemetry & Command History"
                                    : "Lịch Sử Tín Hiệu Cảm Biến & Lệnh Điều Khiển"}
                            </h3>
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                                {(["ALL", "HEARTBEAT", "COMMAND", "EVENT", "ERROR"] as const).map(
                                    (tType) => (
                                        <button
                                            key={tType}
                                            type="button"
                                            onClick={() => setLogFilterType(tType)}
                                            style={{
                                                background:
                                                    logFilterType === tType
                                                        ? "rgba(212,175,55,0.22)"
                                                        : "rgba(255,255,255,0.04)",
                                                border:
                                                    logFilterType === tType
                                                        ? "1px solid #D4AF37"
                                                        : "1px solid rgba(255,255,255,0.1)",
                                                color:
                                                    logFilterType === tType
                                                        ? "#F5E6AD"
                                                        : "#94A3B8",
                                                padding: "0.3rem 0.6rem",
                                                borderRadius: "7px",
                                                fontSize: "0.68rem",
                                                fontWeight: 700,
                                                fontFamily: "Space Grotesk, monospace",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {tType}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div
                            style={{
                                maxHeight: "290px",
                                overflowY: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.6rem",
                                marginBottom: "1.25rem",
                            }}
                        >
                            {filteredLogs.map((l) => (
                                <div
                                    key={l.id}
                                    style={{
                                        padding: "0.75rem 1rem",
                                        borderRadius: "10px",
                                        background: "rgba(255,255,255,0.03)",
                                        borderLeft: `3px solid ${
                                            l.severity === "CRITICAL"
                                                ? "#F87171"
                                                : l.severity === "WARNING"
                                                    ? "#FBBF24"
                                                    : "#34D399"
                                        }`,
                                        fontSize: "0.81rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            color: "#94A3B8",
                                            fontSize: "0.72rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        <span>
                                            [{l.type}] • {l.severity}
                                        </span>
                                        <span>{l.timestamp}</span>
                                    </div>
                                    <div
                                        style={{
                                            color: "#F8FAFC",
                                            marginTop: "0.25rem",
                                        }}
                                    >
                                        {l.message}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setActiveModal(null)}
                            className={styles.confirmBtn}
                            style={{ width: "100%" }}
                        >
                            Close Telemetry Logs
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 4: EDIT MACHINE VENUE INFO */}
            {activeModal === "EDIT_INFO" && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setActiveModal(null)}
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
                                fontSize: "1.35rem",
                            }}
                        >
                            {lang === "en"
                                ? "Edit Boutique Venue Details"
                                : "Cập Nhật Địa Điểm Lắp Đặt Trạm"}
                        </h3>
                        <form onSubmit={handleSaveEditedMachineInfo}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        fontWeight: 700,
                                        marginBottom: "0.35rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    BOUTIQUE VENUE NAME *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={locationName}
                                    onChange={(e) =>
                                        setLocationName(e.target.value)
                                    }
                                    className={styles.inputField}
                                />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        fontWeight: 700,
                                        marginBottom: "0.35rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    STREET ADDRESS *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={streetAddress}
                                    onChange={(e) =>
                                        setStreetAddress(e.target.value)
                                    }
                                    className={styles.inputField}
                                />
                            </div>
                            <div style={{ marginBottom: "1.25rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#94A3B8",
                                        fontWeight: 700,
                                        marginBottom: "0.35rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    MQTT CONNECTION STATUS (SYSTEM MONITORED — READ ONLY)
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={connectionStatus}
                                    className={styles.inputField}
                                    style={{ opacity: 0.55 }}
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
                                    onClick={() => setActiveModal(null)}
                                    className={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.confirmBtn}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: ASSIGN PERFUME TO CHAMBER SLOT */}
            {activeModal === "ASSIGN_SLOT" && selectedSlotForAssign && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setActiveModal(null)}
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
                                fontSize: "1.35rem",
                            }}
                        >
                            {lang === "en"
                                ? `Configure Slot 0${selectedSlotForAssign.slotNumber} Fragrance`
                                : `Cấu Hình Mùi Hương Cho Slot 0${selectedSlotForAssign.slotNumber}`}
                        </h3>
                        <form onSubmit={handleSaveSlotAssignment}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        fontWeight: 700,
                                        marginBottom: "0.35rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    SELECT AUTHORIZED FRAGRANCE ({catalogOptions.length} SKUS)
                                </label>
                                <div
                                    className={styles.customDropdownWrap}
                                    ref={assignMenuRef}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsAssignMenuOpen((prev) => !prev)
                                        }
                                        className={styles.customDropdownTrigger}
                                    >
                                        <span>
                                            {selectedAssignMeta.brand} —{" "}
                                            {selectedAssignMeta.name} (
                                            {selectedAssignMeta.price.toLocaleString(
                                                "vi-VN"
                                            )}{" "}
                                            VND / {selectedAssignMeta.cap}ml)
                                        </span>
                                        <ChevronDown size={14} color="#D4AF37" />
                                    </button>
                                    {isAssignMenuOpen && (
                                        <div className={styles.customDropdownMenu}>
                                            {catalogOptions.map((c) => (
                                                <button
                                                    key={`${c.slot}-${c.name}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setAssignPerfumeName(c.name);
                                                        setAssignPrice(c.price);
                                                        setIsAssignMenuOpen(false);
                                                    }}
                                                    className={`${styles.customDropdownItem} ${
                                                        isExactMatch(
                                                            assignPerfumeName,
                                                            c.name
                                                        )
                                                            ? styles.customDropdownItemActive
                                                            : ""
                                                    }`}
                                                >
                                                    <span>
                                                        {c.brand} — {c.name}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: "0.68rem",
                                                            color: "#F5E6AD",
                                                            fontFamily:
                                                                "Space Grotesk, monospace",
                                                        }}
                                                    >
                                                        {c.price.toLocaleString(
                                                            "vi-VN"
                                                        )}
                                                        đ • {c.cap}ml
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "0.75rem",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.68rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.3rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        PRICE / SPRAY (VND)
                                    </label>
                                    <input
                                        type="number"
                                        min={1000}
                                        step={500}
                                        value={assignPrice}
                                        onChange={(e) =>
                                            setAssignPrice(Number(e.target.value))
                                        }
                                        className={styles.inputField}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.68rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.3rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        PULSE DURATION (MS)
                                    </label>
                                    <input
                                        type="number"
                                        min={800}
                                        max={2000}
                                        step={50}
                                        value={assignDurationMs}
                                        onChange={(e) =>
                                            setAssignDurationMs(
                                                Number(e.target.value)
                                            )
                                        }
                                        className={styles.inputField}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "0.68rem",
                                            color: "#CBD5E1",
                                            fontWeight: 700,
                                            marginBottom: "0.3rem",
                                            fontFamily: "Space Grotesk, monospace",
                                        }}
                                    >
                                        LOW ALERT (ML)
                                    </label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={40}
                                        value={assignThresholdMl}
                                        onChange={(e) =>
                                            setAssignThresholdMl(
                                                Number(e.target.value)
                                            )
                                        }
                                        className={styles.inputField}
                                    />
                                </div>
                            </div>

                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.55rem",
                                    fontSize: "0.82rem",
                                    color: "#E2E8F0",
                                    marginBottom: "1.25rem",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={installFreshBottleOnAssign}
                                    onChange={(e) =>
                                        setInstallFreshBottleOnAssign(
                                            e.target.checked
                                        )
                                    }
                                    style={{ accentColor: "#D4AF37" }}
                                />
                                <span>
                                    {lang === "en"
                                        ? "Install fresh sealed bottle at 100% capacity"
                                        : "Lắp đặt bình nguyên niêm phong mới ở mức 100% dung tích"}
                                </span>
                            </label>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "0.75rem",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setActiveModal(null)}
                                    className={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.confirmBtn}
                                >
                                    Save & Sync Chamber
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: CREATE MAINTENANCE TICKET */}
            {activeModal === "TICKET" && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setActiveModal(null)}
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
                                fontSize: "1.35rem",
                            }}
                        >
                            {lang === "en"
                                ? `Create Maintenance Ticket (${canonicalCode})`
                                : `Tạo Phiếu Bảo Trì Kỹ Thuật (${canonicalCode})`}
                        </h3>
                        <form onSubmit={handleCreateTicket}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        fontWeight: 700,
                                        marginBottom: "0.35rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    PRIORITY LEVEL
                                </label>
                                <div
                                    className={styles.customDropdownWrap}
                                    ref={priorityMenuRef}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsPriorityMenuOpen((prev) => !prev)
                                        }
                                        className={styles.customDropdownTrigger}
                                    >
                                        <span>
                                            {ticketPriority === "URGENT"
                                                ? "URGENT (Immediate Dispatch)"
                                                : ticketPriority === "HIGH"
                                                    ? "HIGH (SLA < 4 Hours)"
                                                    : "NORMAL (Scheduled)"}
                                        </span>
                                        <ChevronDown size={14} color="#D4AF37" />
                                    </button>
                                    {isPriorityMenuOpen && (
                                        <div className={styles.customDropdownMenu}>
                                            {(["URGENT", "HIGH", "NORMAL"] as const).map(
                                                (pLevel) => (
                                                    <button
                                                        key={pLevel}
                                                        type="button"
                                                        onClick={() => {
                                                            setTicketPriority(pLevel);
                                                            setIsPriorityMenuOpen(false);
                                                        }}
                                                        className={`${styles.customDropdownItem} ${
                                                            ticketPriority === pLevel
                                                                ? styles.customDropdownItemActive
                                                                : ""
                                                        }`}
                                                    >
                                                        <span>{pLevel}</span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ marginBottom: "1.25rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "0.7rem",
                                        color: "#CBD5E1",
                                        fontWeight: 700,
                                        marginBottom: "0.35rem",
                                        fontFamily: "Space Grotesk, monospace",
                                    }}
                                >
                                    ISSUE DESCRIPTION *
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={ticketDesc}
                                    onChange={(e) =>
                                        setTicketDesc(e.target.value)
                                    }
                                    className={styles.inputField}
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
                                    onClick={() => setActiveModal(null)}
                                    className={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.confirmBtn}
                                >
                                    Create Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function dashRawOrEmpty(raw: string): string {
    return raw || '{"transactions":[],"incidents":[],"alerts":[]}';
}