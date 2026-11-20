// noinspection SpellCheckingInspection
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./inventory.module.css";
import {
    Search,
    AlertTriangle,
    RefreshCw,
    Plus,
    ArrowLeftRight,
    Droplets,
    Cpu,
    Warehouse,
    History,
    X,
    ArrowUpRight,
    CheckCircle2,
    Layers,
    Download,
    Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";
import LuxurySelect from "@/components/ui/LuxurySelect";

type BottleStatus = "INSTALLED" | "AVAILABLE" | "NEARLY_EMPTY" | "EMPTY" | "DAMAGED" | "EXPIRED";

interface InventorySkuRecord {
    id: string;
    skuCode: string;
    slotNumber: number;
    productName: string;
    brand: string;
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
    timestamp: string;
    movementType: "RECEIPT" | "INSTALL" | "SALE_SPRAY" | "TRANSFER" | "ADJUSTMENT" | "DISPOSAL";
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
    "WH-SGN-CENTRAL": "Kho trung tâm TP.HCM",
    "WH-HN-NORTH": "Kho miền Bắc (Hà Nội)",
    "WH-DAD-CENTRAL": "Kho miền Trung (Đà Nẵng)",
};

const WAREHOUSE_OPTIONS = [
    { value: "WH-SGN-CENTRAL", label: "WH-SGN-CENTRAL" },
    { value: "WH-HN-NORTH", label: "WH-HN-NORTH" },
    { value: "WH-DAD-CENTRAL", label: "WH-DAD-CENTRAL" },
];

const INITIAL_INVENTORY: InventorySkuRecord[] = [
    { id: "INV-001", skuCode: "SKU-ARM-01", slotNumber: 1, productName: "Acqua Di Gio", brand: "Giorgio Armani", image: "/images/acqua-di-gio.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0101", machineRemainingMl: 78.0, sensorLoadCellMl: 78.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Kho trung tâm TP.HCM", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-A01", receivedDate: "2026-10-18", expirationDate: "2028-09-10", status: "INSTALLED" },
    { id: "INV-003", skuCode: "SKU-CHA-03", slotNumber: 3, productName: "Bleu de Chanel", brand: "Chanel", image: "/images/bleu-de-chanel.png", bottleCapacityMl: 100, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0103", machineRemainingMl: 12.5, sensorLoadCellMl: 12.5, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Kho trung tâm TP.HCM", warehouseBottlesCount: 5, batchNumber: "BATCH-2026-C01", receivedDate: "2026-10-20", expirationDate: "2028-09-12", status: "NEARLY_EMPTY" },
    { id: "INV-009", skuCode: "SKU-CRD-09", slotNumber: 9, productName: "Creed Aventus", brand: "Creed", image: "/images/creed-aventus.jpg", bottleCapacityMl: 100, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Atrium", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0109", machineRemainingMl: 11.5, sensorLoadCellMl: 11.5, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Kho trung tâm TP.HCM", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-CR1", receivedDate: "2026-10-26", expirationDate: "2028-09-22", status: "NEARLY_EMPTY" },
    { id: "INV-010", skuCode: "SKU-DIO-10", slotNumber: 10, productName: "Dior Sauvage", brand: "Dior", image: "/images/dior-sauvage.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-HN-01", kioskLocation: "Lotte West Lake", slotLabel: "Slot 03", installedBottleCode: "BTL-2026-0110", machineRemainingMl: 84.0, sensorLoadCellMl: 84.0, thresholdMl: 15, warehouseCode: "WH-HN-NORTH", warehouseLocation: "Kho miền Bắc (Hà Nội)", warehouseBottlesCount: 5, batchNumber: "BATCH-2026-D01", receivedDate: "2026-10-27", expirationDate: "2028-09-25", status: "INSTALLED" },
    { id: "INV-019", skuCode: "SKU-MFK-19", slotNumber: 19, productName: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", image: "/images/mfk-baccarat-rouge-540.jpg", bottleCapacityMl: 70, kioskCode: "demo-device", kioskLocation: "Diamond Plaza Atrium", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0119", machineRemainingMl: 9.0, sensorLoadCellMl: 6.2, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Kho trung tâm TP.HCM", warehouseBottlesCount: 5, batchNumber: "BATCH-2026-FK1", receivedDate: "2026-11-06", expirationDate: "2028-10-06", status: "NEARLY_EMPTY" },
    { id: "INV-028", skuCode: "SKU-TF-28", slotNumber: 28, productName: "Tom Ford Black Orchid", brand: "Tom Ford", image: "/images/tom-ford-black-orchid.jpg", bottleCapacityMl: 100, kioskCode: "KIOSK-004", kioskLocation: "Aeon Mall Tân Phú", slotLabel: "Slot 01", installedBottleCode: "BTL-2026-0128", machineRemainingMl: 0.0, sensorLoadCellMl: 0.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Kho trung tâm TP.HCM", warehouseBottlesCount: 4, batchNumber: "BATCH-2026-TF1", receivedDate: "2026-11-13", expirationDate: "2028-10-16", status: "EMPTY" },
    { id: "INV-033", skuCode: "SKU-YSL-33", slotNumber: 33, productName: "YSL Libre Eau de Parfum", brand: "Yves Saint Laurent", image: "/images/ysl-libre.jpg", bottleCapacityMl: 90, kioskCode: "KIOSK-SGN-01", kioskLocation: "Saigon Centre", slotLabel: "Slot 04", installedBottleCode: "BTL-2026-0133", machineRemainingMl: 14.0, sensorLoadCellMl: 14.0, thresholdMl: 15, warehouseCode: "WH-SGN-CENTRAL", warehouseLocation: "Kho trung tâm TP.HCM", warehouseBottlesCount: 3, batchNumber: "BATCH-2026-YS1", receivedDate: "2026-11-15", expirationDate: "2028-10-22", status: "NEARLY_EMPTY" },
];

const INITIAL_MOVEMENTS: StockMovementRecord[] = [
    { id: "MOV-2026-501", timestamp: "2026-11-15 09:12:05", movementType: "SALE_SPRAY", skuCode: "SKU-CHA-03", productName: "Bleu de Chanel", brand: "Chanel", bottleCode: "BTL-2026-0103", sourceLocation: "KIOSK-SGN-01 (Slot 03)", targetLocation: "TXN-2026-9102", quantityBeforeMl: 12.62, quantityAfterMl: 12.5, deltaMl: -0.12, actor: "IoT Engine", reason: "Đơn xịt khách hàng", referenceDoc: "CMD-8812A" },
    { id: "MOV-2026-502", timestamp: "2026-11-15 08:30:00", movementType: "RECEIPT", skuCode: "SKU-MFK-19", productName: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", bottleCode: "BATCH-2026-FK1", sourceLocation: "Supplier", targetLocation: "WH-SGN-CENTRAL", quantityBeforeMl: 0, quantityAfterMl: 350, deltaMl: 350, actor: "Inventory Staff", reason: "Nhập lô 5 chai mới", referenceDoc: "PO-2026-992" },
    { id: "MOV-2026-503", timestamp: "2026-11-14 16:45:22", movementType: "INSTALL", skuCode: "SKU-DIO-10", productName: "Dior Sauvage", brand: "Dior", bottleCode: "BTL-2026-0110", sourceLocation: "WH-HN-NORTH", targetLocation: "KIOSK-HN-01 (Slot 03)", quantityBeforeMl: 14.0, quantityAfterMl: 100, deltaMl: 86.0, actor: "Inventory Staff", reason: "Thay chai mới 100ml", referenceDoc: "RFL-2026-108" },
];

const INVENTORY_STORAGE_KEY = "scentstation_commercial_inventory_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

const isExactMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

function computeBottleStatus(remMl: number, thresholdMl: number, current: BottleStatus = "INSTALLED"): BottleStatus {
    if (current === "DAMAGED" || current === "EXPIRED") return current;
    if (remMl < 0.12) return "EMPTY";
    if (remMl <= thresholdMl) return "NEARLY_EMPTY";
    return current === "AVAILABLE" ? "AVAILABLE" : "INSTALLED";
}

function formatNowStr(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export default function InventoryPage() {
    const router = useRouter();

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [currentActorRole, setCurrentActorRole] = useState<string>("Platform Super Administrator");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [inventory, setInventory] = useState<InventorySkuRecord[]>(INITIAL_INVENTORY);
    const [movements, setMovements] = useState<StockMovementRecord[]>(INITIAL_MOVEMENTS);

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [activeTab, setActiveTab] = useState<"ALL" | "MACHINE_STOCK" | "WAREHOUSE_STOCK" | "MOVEMENTS">("ALL");
    const [summaryFilter, setSummaryFilter] = useState<"ALL" | "LOW_STOCK" | "IN_MACHINES" | "IN_WAREHOUSE">("ALL");

    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modal Nhập lô
    const [isAddStockOpen, setIsAddStockOpen] = useState<boolean>(false);
    const [addSkuId, setAddSkuId] = useState<string>("INV-003");
    const [addWarehouse, setAddWarehouse] = useState<InventorySkuRecord["warehouseCode"]>("WH-SGN-CENTRAL");
    const [addBottlesQty, setAddBottlesQty] = useState<number>(5);
    const [addBatchNumber, setAddBatchNumber] = useState<string>("BATCH-2026-NEW99");
    const [addExpiryDate, setAddExpiryDate] = useState<string>("2028-12-31");
    const [modalError, setModalError] = useState<string>("");

    // Modal Điều chuyển / Điều chỉnh
    const [isManageStockOpen, setIsManageStockOpen] = useState<boolean>(false);
    const [manageType, setManageType] = useState<"ALLOCATE_TO_KIOSK" | "WAREHOUSE_TRANSFER" | "MANUAL_ADJUSTMENT" | "DAMAGE_DISPOSAL">("ALLOCATE_TO_KIOSK");
    const [manageSkuId, setManageSkuId] = useState<string>("INV-003");
    const [manageTargetWarehouse, setManageTargetWarehouse] = useState<InventorySkuRecord["warehouseCode"]>("WH-HN-NORTH");
    const [manageDeltaMl, setManageDeltaMl] = useState<number>(100);
    const [manageReason, setManageReason] = useState<string>("");

    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canManageInventory = roleConfig.canManageInventory;
    const canAdjustStock = roleConfig.canAdjustStock;

    const selectedItem = useMemo(() => inventory.find((i) => i.id === selectedItemId) || null, [inventory, selectedItemId]);

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

    const formatBottleStatus = (st: BottleStatus) => {
        const map: Record<BottleStatus, { en: string; vi: string }> = {
            INSTALLED: { en: "Installed", vi: "Đã lắp" },
            AVAILABLE: { en: "Available", vi: "Sẵn dùng" },
            NEARLY_EMPTY: { en: "Low Stock", vi: "Gần cạn" },
            EMPTY: { en: "Empty", vi: "Hết bình" },
            DAMAGED: { en: "Damaged", vi: "Hỏng" },
            EXPIRED: { en: "Expired", vi: "Hết hạn" },
        };
        return map[st]?.[lang] || st;
    };

    const loadInventory = useCallback(() => {
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
                setCurrentActorRole(parsedUser.fullName || parsedUser.name || ROLE_PERMISSIONS[resolvedRole].label);
                const scope = parsedUser.brandScope || parsedUser.brand || null;
                if (resolvedRole === "BA" && scope) {
                    setLockedBrandScope(scope);
                    setSelectedBrand(scope);
                } else {
                    setLockedBrandScope(null);
                }
            }

            const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
            const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};

            let workingInv: InventorySkuRecord[] = [...INITIAL_INVENTORY];
            const rawSaved = localStorage.getItem(INVENTORY_STORAGE_KEY);
            if (rawSaved) {
                const parsed = JSON.parse(rawSaved);
                if (Array.isArray(parsed.inventory) && parsed.inventory.length > 0) workingInv = parsed.inventory;
                if (Array.isArray(parsed.movements) && parsed.movements.length > 0) setMovements(parsed.movements);
            }

            workingInv = workingInv.map((item) => {
                const matrixMl = perKioskMatrix[item.kioskCode.toLowerCase()]?.[item.productName.trim().toLowerCase()];
                const nextMl = typeof matrixMl === "number" ? Number(Math.max(0, matrixMl).toFixed(2)) : item.machineRemainingMl;
                return {
                    ...item,
                    machineRemainingMl: nextMl,
                    status: computeBottleStatus(nextMl, item.thresholdMl, item.status),
                };
            });
            setInventory(workingInv);
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadInventory();
        const handleSync = () => loadInventory();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadInventory]);

    const persistInventory = useCallback(
        (nextInv: InventorySkuRecord[], nextMovements: StockMovementRecord[], modified?: InventorySkuRecord) => {
            setInventory(nextInv);
            setMovements(nextMovements);
            try {
                localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify({ inventory: nextInv, movements: nextMovements }));
                if (modified) {
                    const rawMatrix = localStorage.getItem(KIOSK_PER_UNIT_STOCK_KEY);
                    const perKioskMatrix: Record<string, Record<string, number>> = rawMatrix ? JSON.parse(rawMatrix) : {};
                    const kKey = modified.kioskCode.toLowerCase();
                    if (!perKioskMatrix[kKey]) perKioskMatrix[kKey] = {};
                    perKioskMatrix[kKey][modified.productName.trim().toLowerCase()] = Number(modified.machineRemainingMl);
                    localStorage.setItem(KIOSK_PER_UNIT_STOCK_KEY, JSON.stringify(perKioskMatrix));

                    const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
                    if (rawMachines) {
                        const parsedMachines = JSON.parse(rawMachines);
                        if (Array.isArray(parsedMachines)) {
                            const synced = parsedMachines.map((m: any) =>
                                String(m.code || m.id || "").toLowerCase() === kKey
                                    ? {
                                        ...m,
                                        slots: Array.isArray(m.slots)
                                            ? m.slots.map((sl: any) =>
                                                isExactMatch(sl.fragranceName || "", modified.productName)
                                                    ? { ...sl, remainingMl: modified.machineRemainingMl }
                                                    : sl
                                            )
                                            : m.slots,
                                    }
                                    : m
                            );
                            localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(synced));
                        }
                    }

                    const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                    const auditList = rawAudit ? JSON.parse(rawAudit) : [];
                    auditList.unshift({
                        id: `AUD-${Date.now().toString().slice(-4)}`,
                        timestamp: new Date().toISOString(),
                        actor: currentActorRole,
                        role: currentRole,
                        tenant: modified.brand,
                        action: "INVENTORY_UPDATED",
                        entityType: "INVENTORY",
                        entityId: modified.skuCode,
                        severity: "INFO",
                        sourceIp: "127.0.0.1",
                    });
                    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditList.slice(0, 250)));
                }
                window.dispatchEvent(new Event("scentstation-sync"));
            } catch {
                // Safe fallback
            }
        },
        [currentActorRole, currentRole]
    );

    const handleQuickRefill = (item: InventorySkuRecord, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!canManageInventory) return;
        if (item.warehouseBottlesCount <= 0) {
            showToast(lang === "en" ? "No reserve bottles in warehouse." : "Kho dự trữ đã hết chai.");
            return;
        }
        const beforeMl = item.machineRemainingMl;
        const afterMl = item.bottleCapacityMl;
        const updatedItem: InventorySkuRecord = {
            ...item,
            warehouseBottlesCount: item.warehouseBottlesCount - 1,
            machineRemainingMl: afterMl,
            sensorLoadCellMl: afterMl,
            status: "INSTALLED",
        };
        const newMv: StockMovementRecord = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            timestamp: formatNowStr(),
            movementType: "INSTALL",
            skuCode: item.skuCode,
            productName: item.productName,
            brand: item.brand,
            bottleCode: item.installedBottleCode,
            sourceLocation: item.warehouseCode,
            targetLocation: `${item.kioskCode} (${item.slotLabel})`,
            quantityBeforeMl: beforeMl,
            quantityAfterMl: afterMl,
            deltaMl: +(afterMl - beforeMl).toFixed(2),
            actor: currentActorRole,
            reason: lang === "en" ? "Refilled slot to 100%" : "Xuất kho nạp đầy 100%",
            referenceDoc: `RFL-${Date.now().toString().slice(-4)}`,
        };
        persistInventory(inventory.map((r) => (r.id === item.id ? updatedItem : r)), [newMv, ...movements], updatedItem);
        showToast(lang === "en" ? `Refilled ${item.productName} to 100%.` : `Đã nạp đầy 100% cho ${item.productName}.`);
    };

    const handleReconcileSensor = (item: InventorySkuRecord) => {
        if (!canAdjustStock) return;
        const beforeMl = item.machineRemainingMl;
        const afterMl = item.sensorLoadCellMl;
        const updatedItem: InventorySkuRecord = {
            ...item,
            machineRemainingMl: afterMl,
            status: computeBottleStatus(afterMl, item.thresholdMl),
        };
        const newMv: StockMovementRecord = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            timestamp: formatNowStr(),
            movementType: "ADJUSTMENT",
            skuCode: item.skuCode,
            productName: item.productName,
            brand: item.brand,
            bottleCode: item.installedBottleCode,
            sourceLocation: item.kioskCode,
            targetLocation: item.kioskCode,
            quantityBeforeMl: beforeMl,
            quantityAfterMl: afterMl,
            deltaMl: +(afterMl - beforeMl).toFixed(2),
            actor: currentActorRole,
            reason: lang === "en" ? "Reconciled to load-cell sensor" : "Đối soát khớp cảm biến Load-Cell",
            referenceDoc: `ADJ-${Date.now().toString().slice(-4)}`,
        };
        persistInventory(inventory.map((r) => (r.id === item.id ? updatedItem : r)), [newMv, ...movements], updatedItem);
        showToast(lang === "en" ? "Reconciled sensor volume." : "Đã đối soát khớp cảm biến.");
    };

    const handleAddStockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManageInventory) return;
        setModalError("");
        if (addBottlesQty <= 0 || !addBatchNumber.trim()) {
            setModalError(lang === "en" ? "Invalid quantity or batch." : "Số lượng hoặc mã lô không hợp lệ.");
            return;
        }
        const target = inventory.find((i) => i.id === addSkuId);
        if (!target) return;
        const addedMl = addBottlesQty * target.bottleCapacityMl;
        const updatedItem: InventorySkuRecord = {
            ...target,
            warehouseCode: addWarehouse,
            warehouseLocation: WAREHOUSE_LABELS[addWarehouse],
            warehouseBottlesCount: target.warehouseBottlesCount + addBottlesQty,
            batchNumber: addBatchNumber.trim().toUpperCase(),
            expirationDate: addExpiryDate,
        };
        const newMv: StockMovementRecord = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            timestamp: formatNowStr(),
            movementType: "RECEIPT",
            skuCode: target.skuCode,
            productName: target.productName,
            brand: target.brand,
            bottleCode: `${addBatchNumber.trim().toUpperCase()} (${addBottlesQty})`,
            sourceLocation: target.brand,
            targetLocation: addWarehouse,
            quantityBeforeMl: target.warehouseBottlesCount * target.bottleCapacityMl,
            quantityAfterMl: (target.warehouseBottlesCount + addBottlesQty) * target.bottleCapacityMl,
            deltaMl: addedMl,
            actor: currentActorRole,
            reason: lang === "en" ? "Warehouse batch receipt" : "Nhập lô hàng mới",
            referenceDoc: `GRN-${Date.now().toString().slice(-4)}`,
        };
        persistInventory(inventory.map((i) => (i.id === addSkuId ? updatedItem : i)), [newMv, ...movements], updatedItem);
        setIsAddStockOpen(false);
        showToast(lang === "en" ? `Added ${addBottlesQty} bottles.` : `Đã nhập ${addBottlesQty} chai vào kho.`);
    };

    const handleManageStockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canAdjustStock) return;
        setModalError("");
        const target = inventory.find((i) => i.id === manageSkuId);
        if (!target) return;
        if (!manageReason.trim()) {
            setModalError(lang === "en" ? "Reason is required for audit." : "Bắt buộc nhập lý do để ghi audit.");
            return;
        }

        let updatedItem: InventorySkuRecord = { ...target };
        let deltaMl = 0;
        let mvType: StockMovementRecord["movementType"] = "ADJUSTMENT";

        if (manageType === "ALLOCATE_TO_KIOSK") {
            if (target.warehouseBottlesCount <= 0) {
                setModalError(lang === "en" ? "No warehouse bottles left." : "Hết chai trong kho.");
                return;
            }
            updatedItem = { ...target, warehouseBottlesCount: target.warehouseBottlesCount - 1, machineRemainingMl: target.bottleCapacityMl, sensorLoadCellMl: target.bottleCapacityMl, status: "INSTALLED" };
            deltaMl = +(target.bottleCapacityMl - target.machineRemainingMl).toFixed(2);
            mvType = "INSTALL";
        } else if (manageType === "WAREHOUSE_TRANSFER") {
            updatedItem = { ...target, warehouseCode: manageTargetWarehouse, warehouseLocation: WAREHOUSE_LABELS[manageTargetWarehouse] };
            mvType = "TRANSFER";
        } else if (manageType === "DAMAGE_DISPOSAL") {
            updatedItem = { ...target, machineRemainingMl: 0, sensorLoadCellMl: 0, status: "DAMAGED" };
            deltaMl = -target.machineRemainingMl;
            mvType = "DISPOSAL";
        } else {
            const afterMl = Number(Math.max(0, Math.min(target.bottleCapacityMl, manageDeltaMl)).toFixed(2));
            updatedItem = { ...target, machineRemainingMl: afterMl, sensorLoadCellMl: afterMl, status: computeBottleStatus(afterMl, target.thresholdMl) };
            deltaMl = +(afterMl - target.machineRemainingMl).toFixed(2);
        }

        const newMv: StockMovementRecord = {
            id: `MOV-${Date.now().toString().slice(-4)}`,
            timestamp: formatNowStr(),
            movementType: mvType,
            skuCode: target.skuCode,
            productName: target.productName,
            brand: target.brand,
            bottleCode: target.installedBottleCode,
            sourceLocation: target.warehouseCode,
            targetLocation: manageType === "WAREHOUSE_TRANSFER" ? manageTargetWarehouse : target.kioskCode,
            quantityBeforeMl: target.machineRemainingMl,
            quantityAfterMl: updatedItem.machineRemainingMl,
            deltaMl,
            actor: currentActorRole,
            reason: manageReason.trim(),
            referenceDoc: `ADJ-${Date.now().toString().slice(-4)}`,
        };

        persistInventory(inventory.map((i) => (i.id === manageSkuId ? updatedItem : i)), [newMv, ...movements], updatedItem);
        setIsManageStockOpen(false);
        setManageReason("");
        showToast(lang === "en" ? "Stock movement saved." : "Đã lưu biến động tồn kho.");
    };

    const uniqueBrands = useMemo(() => Array.from(new Set(inventory.map((i) => i.brand))).sort(), [inventory]);
    const effectiveBrand = lockedBrandScope || selectedBrand;

    const overviewMetrics = useMemo(() => {
        const installed = inventory.filter((i) => i.machineRemainingMl >= 0.12).length;
        const whBottles = inventory.reduce((s, i) => s + i.warehouseBottlesCount, 0);
        const machineMl = +inventory.reduce((s, i) => s + i.machineRemainingMl, 0).toFixed(2);
        const whMl = inventory.reduce((s, i) => s + i.warehouseBottlesCount * i.bottleCapacityMl, 0);
        const lowCount = inventory.filter((i) => i.machineRemainingMl <= i.thresholdMl).length;
        return { totalBottles: installed + whBottles, totalVolumeMl: +(machineMl + whMl).toFixed(2), lowCount, machineMl, whMl };
    }, [inventory]);

    const filteredInventory = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return inventory.filter((item) => {
            const matchSearch = !q || item.productName.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q) || item.skuCode.toLowerCase().includes(q) || item.kioskCode.toLowerCase().includes(q);
            const matchBrand = effectiveBrand === "ALL" || isExactMatch(item.brand, effectiveBrand);
            const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;
            const matchSummary =
                summaryFilter === "ALL" ||
                (summaryFilter === "LOW_STOCK" && item.machineRemainingMl <= item.thresholdMl) ||
                (summaryFilter === "IN_MACHINES" && item.machineRemainingMl >= 0.12) ||
                (summaryFilter === "IN_WAREHOUSE" && item.warehouseBottlesCount > 0);
            const matchTab =
                activeTab === "MACHINE_STOCK"
                    ? item.machineRemainingMl >= 0.12
                    : activeTab === "WAREHOUSE_STOCK"
                        ? item.warehouseBottlesCount > 0
                        : true;
            return matchSearch && matchBrand && matchStatus && matchSummary && matchTab;
        });
    }, [inventory, searchQuery, effectiveBrand, selectedStatus, summaryFilter, activeTab]);

    const handleExportCSV = () => {
        const header = "SKU;Product;Brand;Station;Remaining(ml);WarehouseBottles;Status\n";
        const rows = filteredInventory.map((i) => `"${i.skuCode}";"${i.productName}";"${i.brand}";"${i.kioskCode}";"${i.machineRemainingMl}";"${i.warehouseBottlesCount}";"${i.status}"`).join("\n");
        const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "ScentStation_Inventory.csv";
        link.click();
        showToast(lang === "en" ? "Exported CSV." : "Đã xuất file CSV.");
    };

    const renderStatusBadge = (st: BottleStatus) => {
        const isGood = st === "INSTALLED" || st === "AVAILABLE";
        const isWarn = st === "NEARLY_EMPTY";
        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.22rem 0.6rem", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 700, background: isGood ? "rgba(52,211,153,0.14)" : isWarn ? "rgba(251,191,36,0.14)" : "rgba(248,113,113,0.14)", color: isGood ? "#34D399" : isWarn ? "#FBBF24" : "#F87171", border: `1px solid ${isGood ? "rgba(52,211,153,0.38)" : isWarn ? "rgba(251,191,36,0.38)" : "rgba(248,113,113,0.38)"}` }}>
                {!isGood && <AlertTriangle size={11} />}
                <span>{formatBottleStatus(st)}</span>
            </span>
        );
    };

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Inventory" : "Quản lý tồn kho"}</h1>
                        <div className={styles.scopeBadge}>
                            <span>{lang === "en" ? roleConfig.labelEn : roleConfig.labelVi}</span>
                            {lockedBrandScope && <span>• {lockedBrandScope}</span>}
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button type="button" onClick={handleToggleLanguage} className={styles.secondaryGoldBtn}>
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        {roleConfig.canExportReport && (
                            <button type="button" onClick={handleExportCSV} className={styles.secondaryGoldBtn}>
                                <Download size={14} color="#D4AF37" />
                                <span>{lang === "en" ? "Export CSV" : "Xuất CSV"}</span>
                            </button>
                        )}

                        {canAdjustStock && (
                            <button type="button" onClick={() => { setModalError(""); setIsManageStockOpen(true); }} className={styles.secondaryGoldBtn}>
                                <ArrowLeftRight size={14} color="#D4AF37" />
                                <span>{lang === "en" ? "Adjust / Transfer" : "Điều chỉnh / Chuyển kho"}</span>
                            </button>
                        )}

                        {canManageInventory && (
                            <button type="button" onClick={() => { setModalError(""); setIsAddStockOpen(true); }} className={styles.primaryGoldBtn}>
                                <Plus size={15} />
                                <span>{lang === "en" ? "Receive Batch" : "Nhập lô mới"}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 5 KPI */}
                <div className={styles.kpiGrid5}>
                    <div onClick={() => { setSummaryFilter("ALL"); setActiveTab("ALL"); }} className={`${styles.kpiCard} ${summaryFilter === "ALL" ? styles.kpiCardActive : ""}`}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Total Bottles" : "Tổng số chai"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "0.2rem" }}>{overviewMetrics.totalBottles}</div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Total Volume" : "Tổng dung tích"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F5E6AD", marginTop: "0.2rem" }}>{overviewMetrics.totalVolumeMl} ml</div>
                    </div>

                    <div onClick={() => { setSummaryFilter("LOW_STOCK"); setActiveTab("ALL"); }} className={`${styles.kpiCard} ${summaryFilter === "LOW_STOCK" ? styles.kpiCardActive : ""}`}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Low Stock" : "Sắp cạn (≤ 15ml)"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F87171", marginTop: "0.2rem" }}>{overviewMetrics.lowCount}</div>
                    </div>

                    <div onClick={() => { setSummaryFilter("IN_MACHINES"); setActiveTab("MACHINE_STOCK"); }} className={`${styles.kpiCard} ${summaryFilter === "IN_MACHINES" ? styles.kpiCardActive : ""}`}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "In Machines" : "Trong máy"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34D399", marginTop: "0.2rem" }}>{overviewMetrics.machineMl} ml</div>
                    </div>

                    <div onClick={() => { setSummaryFilter("IN_WAREHOUSE"); setActiveTab("WAREHOUSE_STOCK"); }} className={`${styles.kpiCard} ${summaryFilter === "IN_WAREHOUSE" ? styles.kpiCardActive : ""}`}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "In Warehouse" : "Trong kho"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#38BDF8", marginTop: "0.2rem" }}>{overviewMetrics.whMl} ml</div>
                    </div>
                </div>
            </div>

            {/* BỘ LỌC */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={lang === "en" ? "Search product, SKU, station..." : "Tìm sản phẩm, mã SKU, trạm..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <button type="button" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.6rem", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}><X size={14} /></button>}
                </div>

                {!lockedBrandScope && (
                    <LuxurySelect
                        value={selectedBrand}
                        onChange={setSelectedBrand}
                        minWidth="185px"
                        options={[
                            { value: "ALL", label: lang === "en" ? "All Brands" : "Tất cả thương hiệu" },
                            ...uniqueBrands.map((b) => ({ value: b, label: b })),
                        ]}
                    />
                )}

                <LuxurySelect
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    minWidth="165px"
                    options={[
                        { value: "ALL", label: lang === "en" ? "All Status" : "Mọi trạng thái" },
                        ...(["INSTALLED", "AVAILABLE", "NEARLY_EMPTY", "EMPTY", "DAMAGED"] as const).map((st) => ({
                            value: st,
                            label: formatBottleStatus(st),
                        })),
                    ]}
                />

                {(searchQuery || (!lockedBrandScope && selectedBrand !== "ALL") || selectedStatus !== "ALL" || summaryFilter !== "ALL") && (
                    <button type="button" onClick={() => { setSearchQuery(""); if (!lockedBrandScope) setSelectedBrand("ALL"); setSelectedStatus("ALL"); setSummaryFilter("ALL"); setActiveTab("ALL"); }} className={styles.secondaryGoldBtn}>
                        <RefreshCw size={13} />
                        <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                    </button>
                )}
            </div>

            {/* 4 TABS */}
            <div className={styles.tabsBar}>
                {[
                    { id: "ALL", label: lang === "en" ? "All Stock" : "Tất cả tồn kho", icon: Layers },
                    { id: "MACHINE_STOCK", label: lang === "en" ? "Machine Stock" : "Trong máy", icon: Cpu },
                    { id: "WAREHOUSE_STOCK", label: lang === "en" ? "Warehouse" : "Trong kho", icon: Warehouse },
                    { id: "MOVEMENTS", label: lang === "en" ? `Movements (${movements.length})` : `Biến động (${movements.length})`, icon: History },
                ].map((t) => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} type="button" onClick={() => setActiveTab(t.id as any)} className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ""}`}>
                            <Icon size={14} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* NỘI DUNG BẢNG */}
            {activeTab === "MOVEMENTS" ? (
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>{lang === "en" ? "ID & Time" : "Mã & Thời điểm"}</th>
                                <th>{lang === "en" ? "Type" : "Loại"}</th>
                                <th>{lang === "en" ? "Product" : "Sản phẩm"}</th>
                                <th>{lang === "en" ? "Before → After" : "Trước → Sau"}</th>
                                <th>{lang === "en" ? "Actor & Reason" : "Người thực hiện & Lý do"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {movements.map((mv, idx) => (
                                <tr key={`${mv.id}-${idx}`} className={styles.tableRow}>
                                    <td className={styles.tableCell}><strong style={{ color: "#F5E6AD" }}>{mv.id}</strong><div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{mv.timestamp}</div></td>
                                    <td className={styles.tableCell}><strong>{mv.movementType}</strong></td>
                                    <td className={styles.tableCell}><strong>{mv.productName}</strong><div style={{ fontSize: "0.74rem", color: "#D4AF37" }}>{mv.bottleCode}</div></td>
                                    <td className={styles.tableCell}>{mv.quantityBeforeMl}ml → <strong>{mv.quantityAfterMl}ml</strong> <span style={{ color: mv.deltaMl >= 0 ? "#34D399" : "#F87171", fontWeight: 700 }}>({mv.deltaMl >= 0 ? `+${mv.deltaMl}` : mv.deltaMl}ml)</span></td>
                                    <td className={styles.tableCell}><div>{mv.actor}</div><div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{mv.reason}</div></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>{lang === "en" ? "Product & SKU" : "Sản phẩm & SKU"}</th>
                                <th>{lang === "en" ? "Station" : "Trạm Kiosk"}</th>
                                <th>{lang === "en" ? "In Machine" : "Còn trong máy"}</th>
                                <th>{lang === "en" ? "Warehouse" : "Kho dự trữ"}</th>
                                <th style={{ textAlign: "center" }}>{lang === "en" ? "Status" : "Trạng thái"}</th>
                                {canManageInventory && <th style={{ textAlign: "right" }}>{lang === "en" ? "Action" : "Thao tác"}</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {filteredInventory.map((item) => {
                                const pct = Math.round((item.machineRemainingMl / item.bottleCapacityMl) * 100);
                                const isLow = item.machineRemainingMl <= item.thresholdMl;
                                const hasVariance = Math.abs(item.machineRemainingMl - item.sensorLoadCellMl) >= 1.0;
                                return (
                                    <tr key={item.id} onClick={() => setSelectedItemId(item.id)} className={styles.tableRow}>
                                        <td className={styles.tableCell}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <div className={styles.productThumb}><img src={item.image} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                                                <div>
                                                    <strong>{item.productName}</strong>
                                                    <div style={{ fontSize: "0.74rem", color: "#D4AF37" }}>{item.brand} • {item.skuCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <strong>{item.kioskCode} ({item.slotLabel})</strong>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{item.installedBottleCode}</div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <strong style={{ color: isLow ? "#F87171" : "#34D399" }}>{item.machineRemainingMl} / {item.bottleCapacityMl} ml ({pct}%)</strong>
                                            {hasVariance && <div style={{ fontSize: "0.72rem", color: "#FBBF24" }}>{lang === "en" ? `Sensor: ${item.sensorLoadCellMl}ml` : `Cảm biến: ${item.sensorLoadCellMl}ml`}</div>}
                                        </td>
                                        <td className={styles.tableCell}>
                                            <strong style={{ color: "#38BDF8" }}>{item.warehouseBottlesCount} {lang === "en" ? "bottles" : "chai"}</strong>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{item.warehouseCode} • {item.batchNumber}</div>
                                        </td>
                                        <td className={styles.tableCell} style={{ textAlign: "center" }}>{renderStatusBadge(item.status)}</td>
                                        {canManageInventory && (
                                            <td className={styles.tableCell} style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                                <button type="button" onClick={(e) => handleQuickRefill(item, e)} className={styles.actionButton} style={{ color: "#34D399", padding: "0.38rem 0.7rem", fontSize: "0.76rem" }}>
                                                    <Droplets size={12} />
                                                    <span>{lang === "en" ? "Refill 100%" : "Nạp 100%"}</span>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT TỒN KHO */}
            {selectedItem && (
                <div className={styles.drawerOverlay} onClick={() => setSelectedItemId(null)}>
                    <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <div>
                                <div style={{ fontSize: "0.76rem", color: "#D4AF37", fontWeight: 700 }}>{selectedItem.brand} • {selectedItem.skuCode}</div>
                                <h2 style={{ margin: "0.15rem 0 0 0", fontSize: "1.2rem" }}>{selectedItem.productName}</h2>
                            </div>
                            <button type="button" onClick={() => setSelectedItemId(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>

                        <div className={styles.glassCard}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <strong>{selectedItem.kioskCode} ({selectedItem.slotLabel})</strong>
                                <button type="button" onClick={() => router.push(`/machines/${encodeURIComponent(selectedItem.kioskCode)}`)} className={styles.secondaryGoldBtn} style={{ padding: "0.3rem 0.6rem", fontSize: "0.74rem" }}>
                                    <span>{lang === "en" ? "Open Station" : "Mở máy"}</span>
                                    <ArrowUpRight size={12} />
                                </button>
                            </div>
                            <div style={{ fontSize: "0.84rem", color: "#CBD5E1", lineHeight: 1.6 }}>
                                <div>{lang === "en" ? "Estimated Remaining" : "Lượng ước tính"}: <strong style={{ color: "#34D399" }}>{selectedItem.machineRemainingMl} ml</strong> / {selectedItem.bottleCapacityMl} ml</div>
                                <div>{lang === "en" ? "Load-Cell Sensor" : "Cảm biến Load-Cell"}: <strong>{selectedItem.sensorLoadCellMl} ml</strong></div>
                                <div>{lang === "en" ? "Warehouse Reserve" : "Kho dự trữ"}: <strong>{selectedItem.warehouseBottlesCount} {lang === "en" ? "bottles" : "chai"}</strong> ({selectedItem.warehouseCode} • {selectedItem.batchNumber} • EXP {selectedItem.expirationDate})</div>
                            </div>

                            {Math.abs(selectedItem.machineRemainingMl - selectedItem.sensorLoadCellMl) >= 1.0 && canAdjustStock && (
                                <div style={{ marginTop: "0.75rem", padding: "0.65rem", borderRadius: "9px", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.78rem", color: "#FBBF24" }}>{lang === "en" ? "Sensor discrepancy detected." : "Phát hiện chênh lệch cảm biến."}</span>
                                    <button type="button" onClick={() => handleReconcileSensor(selectedItem)} className={styles.secondaryGoldBtn} style={{ padding: "0.3rem 0.65rem", fontSize: "0.76rem", color: "#FBBF24" }}>
                                        {lang === "en" ? "Reconcile" : "Đối soát"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {canManageInventory && (
                            <button type="button" onClick={() => handleQuickRefill(selectedItem)} className={styles.primaryGoldBtn} style={{ width: "100%" }}>
                                <Droplets size={14} />
                                <span>{lang === "en" ? "Allocate 1 Bottle & Refill 100%" : "Xuất 1 chai & Nạp đầy 100%"}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL NHẬP LÔ (CHỈ IS) — DÙNG LUXURYSELECT */}
            {isAddStockOpen && canManageInventory && (
                <div className={styles.modalOverlay} onClick={() => setIsAddStockOpen(false)}>
                    <div className={styles.modalContent} style={{ overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{lang === "en" ? "Receive Stock Batch" : "Nhập lô hàng mới"}</h3>
                            <button type="button" onClick={() => setIsAddStockOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>
                        {modalError && <div style={{ marginBottom: "0.85rem", padding: "0.65rem", borderRadius: "8px", background: "rgba(248,113,113,0.14)", color: "#F87171", fontSize: "0.82rem" }}>{modalError}</div>}
                        <form onSubmit={handleAddStockSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Product" : "Sản phẩm"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={addSkuId}
                                        onChange={setAddSkuId}
                                        options={inventory.map((i) => ({ value: i.id, label: `${i.productName} (${i.bottleCapacityMl}ml)` }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Warehouse" : "Kho nhận"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={addWarehouse}
                                        onChange={(v) => setAddWarehouse(v as InventorySkuRecord["warehouseCode"])}
                                        options={WAREHOUSE_OPTIONS}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Bottles *" : "Số chai *"}</label>
                                    <input type="number" min={1} required value={addBottlesQty} onChange={(e) => setAddBottlesQty(Number(e.target.value))} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Batch *" : "Mã lô *"}</label>
                                    <input type="text" required value={addBatchNumber} onChange={(e) => setAddBatchNumber(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Expiry *" : "Hạn dùng *"}</label>
                                    <input type="text" required value={addExpiryDate} onChange={(e) => setAddExpiryDate(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsAddStockOpen(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.primaryGoldBtn}>{lang === "en" ? "Confirm" : "Xác nhận nhập"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ĐIỀU CHỈNH / CHUYỂN KHO (CHỈ IS) — DÙNG LUXURYSELECT */}
            {isManageStockOpen && canAdjustStock && (
                <div className={styles.modalOverlay} onClick={() => setIsManageStockOpen(false)}>
                    <div className={styles.modalContent} style={{ overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{lang === "en" ? "Adjust / Transfer Stock" : "Điều chỉnh / Chuyển kho"}</h3>
                            <button type="button" onClick={() => setIsManageStockOpen(false)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>
                        {modalError && <div style={{ marginBottom: "0.85rem", padding: "0.65rem", borderRadius: "8px", background: "rgba(248,113,113,0.14)", color: "#F87171", fontSize: "0.82rem" }}>{modalError}</div>}
                        <form onSubmit={handleManageStockSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Action" : "Loại thao tác"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={manageType}
                                        onChange={(v) => setManageType(v as typeof manageType)}
                                        options={[
                                            { value: "ALLOCATE_TO_KIOSK", label: lang === "en" ? "Allocate to Kiosk" : "Xuất kho nạp máy" },
                                            { value: "MANUAL_ADJUSTMENT", label: lang === "en" ? "Manual Adjustment" : "Điều chỉnh dung tích" },
                                            { value: "WAREHOUSE_TRANSFER", label: lang === "en" ? "Warehouse Transfer" : "Chuyển kho" },
                                            { value: "DAMAGE_DISPOSAL", label: lang === "en" ? "Mark Damaged" : "Báo hỏng / Hủy" },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "SKU" : "Sản phẩm"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={manageSkuId}
                                        onChange={setManageSkuId}
                                        options={inventory.map((i) => ({ value: i.id, label: `${i.productName} (${i.machineRemainingMl}ml)` }))}
                                    />
                                </div>
                            </div>
                            {manageType === "WAREHOUSE_TRANSFER" && (
                                <div style={{ marginBottom: "0.85rem" }}>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Destination" : "Kho đích"}</label>
                                    <LuxurySelect
                                        width="100%"
                                        value={manageTargetWarehouse}
                                        onChange={(v) => setManageTargetWarehouse(v as InventorySkuRecord["warehouseCode"])}
                                        options={WAREHOUSE_OPTIONS}
                                    />
                                </div>
                            )}
                            {manageType === "MANUAL_ADJUSTMENT" && (
                                <div style={{ marginBottom: "0.85rem" }}>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", marginBottom: "0.3rem" }}>{lang === "en" ? "Corrected Volume (ml)" : "Dung tích thực tế (ml)"}</label>
                                    <input type="number" step="0.1" min={0} max={125} value={manageDeltaMl} onChange={(e) => setManageDeltaMl(Number(e.target.value))} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                            )}
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#D4AF37", fontWeight: 700, marginBottom: "0.3rem" }}>{lang === "en" ? "Audit Reason *" : "Lý do bắt buộc *"}</label>
                                <input type="text" required value={manageReason} onChange={(e) => setManageReason(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsManageStockOpen(false)} className={styles.secondaryGoldBtn}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.primaryGoldBtn}>{lang === "en" ? "Save" : "Lưu & Ghi log"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: "#181D2C", border: "1px solid #D4AF37", borderRadius: "12px", padding: "0.85rem 1.15rem", color: "#F5E6AD", fontWeight: 600, fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "0.55rem", zIndex: 99999 }}>
                    <CheckCircle2 size={16} color="#34D399" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}