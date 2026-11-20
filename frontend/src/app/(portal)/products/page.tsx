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
    Smartphone,
    LayoutGrid,
    List as ListIcon,
    Upload,
    Trash2,
    Globe,
    SlidersHorizontal,
    Check,
    ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./products.module.css";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

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
    status: "ACTIVE" | "INACTIVE" | "DRAFT";
    image: string;
    assignedMachines: AssignedMachineSlot[];
}

const FLEET_KIOSK_OPTIONS = [
    { code: "demo-device", location: "Diamond Plaza Atrium, TP.HCM", status: "ONLINE" as const },
    { code: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya, TP.HCM", status: "ONLINE" as const },
    { code: "KIOSK-SGN-02", location: "Vincom Đồng Khởi, TP.HCM", status: "ONLINE" as const },
    { code: "KIOSK-SGN-03", location: "Crescent Mall, TP.HCM", status: "ONLINE" as const },
    { code: "KIOSK-HN-01", location: "Lotte West Lake, Hà Nội", status: "ONLINE" as const },
    { code: "KIOSK-HN-02", location: "Tràng Tiền Plaza, Hà Nội", status: "MAINTENANCE" as const },
    { code: "KIOSK-DAD-01", location: "IndoChina Riverside, Đà Nẵng", status: "ONLINE" as const },
    { code: "KIOSK-004", location: "Aeon Mall Tân Phú, TP.HCM", status: "OFFLINE" as const },
];

const INITIAL_34_PRODUCTS: PerfumeProductItem[] = [
    { id: "PROD-01", skuCode: "SKU-ARM-01", slotNumber: 1, name: "Acqua Di Gio", brand: "Giorgio Armani", category: "Men", concentration: "Eau de Toilette", family: "Aquatic Aromatic", notes: "Bergamot, Sea Notes, Jasmine, Cedar", description: "Aquatic aromatic fragrance.", bottleVolumeMl: 100, pricePerSpray: 12000, retail10ml: 360000, fullBottlePrice: 3200000, status: "ACTIVE", image: "/images/acqua-di-gio.jpg", assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0101", remainingVolumeMl: 78.0, thresholdPct: 15, lastRefilled: "2026-10-25" }] },
    { id: "PROD-02", skuCode: "SKU-ARM-02", slotNumber: 2, name: "Acqua Di Gio Profondo", brand: "Giorgio Armani", category: "Men", concentration: "Eau de Parfum", family: "Aquatic Mineral", notes: "Marine Notes, Rosemary, Patchouli", description: "Intense marine fragrance.", bottleVolumeMl: 100, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3650000, status: "ACTIVE", image: "/images/acqua-di-gio-profondo.jpg", assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0102", remainingVolumeMl: 64.0, thresholdPct: 15, lastRefilled: "2026-10-26" }] },
    { id: "PROD-03", skuCode: "SKU-CHA-03", slotNumber: 3, name: "Bleu de Chanel", brand: "Chanel", category: "Men", concentration: "Eau de Parfum", family: "Woody Aromatic", notes: "Lemon, Mint, Pink Pepper, Sandalwood", description: "Woody aromatic EDP.", bottleVolumeMl: 100, pricePerSpray: 15000, retail10ml: 450000, fullBottlePrice: 4250000, status: "ACTIVE", image: "/images/bleu-de-chanel.png", assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0103", remainingVolumeMl: 12.5, thresholdPct: 15, lastRefilled: "2026-10-12" }] },
    { id: "PROD-04", skuCode: "SKU-CHA-04", slotNumber: 4, name: "Coco Mademoiselle", brand: "Chanel", category: "Women", concentration: "Eau de Parfum", family: "Oriental Floral", notes: "Orange, Patchouli, Turkish Rose", description: "Oriental floral EDP.", bottleVolumeMl: 100, pricePerSpray: 15500, retail10ml: 465000, fullBottlePrice: 4400000, status: "ACTIVE", image: "/images/coco-mademoiselle.jpg", assignedMachines: [{ kioskCode: "KIOSK-SGN-02", location: "Vincom Đồng Khởi", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0104", remainingVolumeMl: 82.0, thresholdPct: 15, lastRefilled: "2026-10-28" }] },
    { id: "PROD-05", skuCode: "SKU-BUR-05", slotNumber: 5, name: "Burberry Goddess", brand: "Burberry", category: "Women", concentration: "Eau de Parfum", family: "Aromatic Vanilla", notes: "Vanilla Infusion, Lavender, Cocoa", description: "Aromatic vanilla EDP.", bottleVolumeMl: 100, pricePerSpray: 13000, retail10ml: 390000, fullBottlePrice: 3500000, status: "ACTIVE", image: "/images/burberry-goddess.jpg", assignedMachines: [{ kioskCode: "KIOSK-SGN-02", location: "Vincom Đồng Khởi", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0105", remainingVolumeMl: 71.0, thresholdPct: 15, lastRefilled: "2026-10-29" }] },
    { id: "PROD-09", skuCode: "SKU-CRD-09", slotNumber: 9, name: "Creed Aventus", brand: "Creed", category: "Niche", concentration: "Eau de Parfum", family: "Chypre Fruity", notes: "Pineapple, Birch, Musk, Oakmoss", description: "Chypre fruity niche EDP.", bottleVolumeMl: 100, pricePerSpray: 20000, retail10ml: 600000, fullBottlePrice: 7800000, status: "ACTIVE", image: "/images/creed-aventus.jpg", assignedMachines: [{ kioskCode: "demo-device", location: "Diamond Plaza Atrium", slotNumber: 1, physicalSlotLabel: "Slot 01", machineStatus: "ONLINE", bottleCode: "BTL-2026-0109", remainingVolumeMl: 11.5, thresholdPct: 15, lastRefilled: "2026-10-15" }] },
    { id: "PROD-10", skuCode: "SKU-DIO-10", slotNumber: 10, name: "Dior Sauvage", brand: "Dior", category: "Men", concentration: "Eau de Parfum", family: "Aromatic Fougere", notes: "Calabrian Bergamot, Sichuan Pepper, Ambroxan", description: "Aromatic fougere EDP.", bottleVolumeMl: 100, pricePerSpray: 14500, retail10ml: 435000, fullBottlePrice: 3950000, status: "ACTIVE", image: "/images/dior-sauvage.jpg", assignedMachines: [{ kioskCode: "KIOSK-HN-01", location: "Lotte West Lake", slotNumber: 3, physicalSlotLabel: "Slot 03", machineStatus: "ONLINE", bottleCode: "BTL-2026-0110", remainingVolumeMl: 84.0, thresholdPct: 15, lastRefilled: "2026-11-03" }] },
    { id: "PROD-14", skuCode: "SKU-LLB-14", slotNumber: 14, name: "Le Labo Another 13", brand: "Le Labo", category: "Niche", concentration: "Eau de Parfum", family: "Woody Oriental", notes: "Ambroxan, Pear, Jasmine Petals", description: "Woody oriental niche EDP.", bottleVolumeMl: 100, pricePerSpray: 18000, retail10ml: 540000, fullBottlePrice: 6500000, status: "ACTIVE", image: "/images/le-labo-another-13.jpg", assignedMachines: [{ kioskCode: "demo-device", location: "Diamond Plaza Atrium", slotNumber: 2, physicalSlotLabel: "Slot 02", machineStatus: "ONLINE", bottleCode: "BTL-2026-0114", remainingVolumeMl: 13.5, thresholdPct: 15, lastRefilled: "2026-10-14" }] },
    { id: "PROD-19", skuCode: "SKU-MFK-19", slotNumber: 19, name: "MFK Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", category: "Niche", concentration: "Eau de Parfum", family: "Oriental Floral", notes: "Saffron, Jasmine, Amberwood, Fir Resin", description: "Oriental floral niche EDP.", bottleVolumeMl: 70, pricePerSpray: 21000, retail10ml: 630000, fullBottlePrice: 7900000, status: "ACTIVE", image: "/images/mfk-baccarat-rouge-540.jpg", assignedMachines: [{ kioskCode: "demo-device", location: "Diamond Plaza Atrium", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0119", remainingVolumeMl: 9.0, thresholdPct: 15, lastRefilled: "2026-10-10" }] },
    { id: "PROD-28", skuCode: "SKU-TF-28", slotNumber: 28, name: "Tom Ford Black Orchid", brand: "Tom Ford", category: "Unisex", concentration: "Eau de Parfum", family: "Oriental Chypre", notes: "Black Truffle, Black Orchid, Patchouli", description: "Oriental chypre EDP.", bottleVolumeMl: 100, pricePerSpray: 16000, retail10ml: 480000, fullBottlePrice: 4350000, status: "ACTIVE", image: "/images/tom-ford-black-orchid.jpg", assignedMachines: [{ kioskCode: "KIOSK-HN-02", location: "Tràng Tiền Plaza", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "MAINTENANCE", bottleCode: "BTL-2026-0128", remainingVolumeMl: 48.0, thresholdPct: 15, lastRefilled: "2026-10-19" }] },
    { id: "PROD-33", skuCode: "SKU-YSL-33", slotNumber: 33, name: "YSL Libre Eau de Parfum", brand: "Yves Saint Laurent", category: "Women", concentration: "Eau de Parfum", family: "Oriental Fougere", notes: "French Lavender, Orange Blossom, Vanilla", description: "Oriental fougere EDP.", bottleVolumeMl: 90, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3750000, status: "ACTIVE", image: "/images/ysl-libre.jpg", assignedMachines: [{ kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0133", remainingVolumeMl: 14.0, thresholdPct: 15, lastRefilled: "2026-10-16" }] },
    { id: "PROD-34", skuCode: "SKU-YSL-34", slotNumber: 34, name: "YSL Y Eau de Parfum", brand: "Yves Saint Laurent", category: "Men", concentration: "Eau de Parfum", family: "Aromatic Fougere", notes: "Apple, Ginger, Sage, Tonka Bean", description: "Aromatic fougere EDP.", bottleVolumeMl: 100, pricePerSpray: 14000, retail10ml: 420000, fullBottlePrice: 3700000, status: "INACTIVE", image: "/images/ysl-y-edp.jpg", assignedMachines: [{ kioskCode: "KIOSK-HN-01", location: "Lotte West Lake", slotNumber: 4, physicalSlotLabel: "Slot 04", machineStatus: "ONLINE", bottleCode: "BTL-2026-0134", remainingVolumeMl: 63.0, thresholdPct: 15, lastRefilled: "2026-10-20" }] },
];

const PRODUCTS_STORAGE_KEY = "scentstation_commercial_products_v2";
const MACHINES_STORAGE_KEY = "scentstation_commercial_machines_v2";
const KIOSK_PER_UNIT_STOCK_KEY = "scentstation_per_kiosk_stock_matrix_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type SummaryFilterMode = "ALL" | "ACTIVE" | "AVAILABLE_MACHINES";
type DrawerTab = "overview" | "machines";

const isExactName = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

export default function ProductsPage(): React.ReactElement {
    const router = useRouter();
    const imageFileInputRef = useRef<HTMLInputElement | null>(null);
    const brandMenuRef = useRef<HTMLDivElement | null>(null);
    const assignKioskMenuRef = useRef<HTMLDivElement | null>(null);
    const presetImageMenuRef = useRef<HTMLDivElement | null>(null);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [activeUserName, setActiveUserName] = useState<string>("Platform Super Administrator");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [products, setProducts] = useState<PerfumeProductItem[]>(INITIAL_34_PRODUCTS);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [summaryFilter, setSummaryFilter] = useState<SummaryFilterMode>("ALL");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");
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
    const [concentration, setConcentration] = useState<PerfumeProductItem["concentration"]>("Eau de Parfum");
    const [bottleVolumeMl, setBottleVolumeMl] = useState<number>(100);
    const [family, setFamily] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [pricePerSpray, setPricePerSpray] = useState<number>(15000);
    const [status, setStatus] = useState<PerfumeProductItem["status"]>("ACTIVE");
    const [image, setImage] = useState<string>("/images/bleu-de-chanel.png");

    // Quyền chuẩn theo src/lib/rbac.ts (chỉ BA được quản lý danh mục sản phẩm thuộc brand mình)
    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canManageCatalog = roleConfig.canManageProducts;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (brandMenuRef.current && !brandMenuRef.current.contains(e.target as Node)) setIsBrandDropdownOpen(false);
            if (assignKioskMenuRef.current && !assignKioskMenuRef.current.contains(e.target as Node)) setIsAssignKioskOpen(false);
            if (presetImageMenuRef.current && !presetImageMenuRef.current.contains(e.target as Node)) setIsPresetImageOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedProduct = useMemo(() => products.find((p) => p.id === selectedProductId) || null, [products, selectedProductId]);

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

    const formatCategory = (cat: string) => {
        if (lang === "en") return cat === "ALL" ? "All" : cat;
        if (cat === "ALL") return "Tất cả";
        if (cat === "Men") return "Nam";
        if (cat === "Women") return "Nữ";
        if (cat === "Unisex") return "Nam & Nữ";
        return "Cao cấp";
    };

    const formatStatus = (st: PerfumeProductItem["status"]) => {
        if (lang === "en") return st === "ACTIVE" ? "Active" : st === "DRAFT" ? "Draft" : "Inactive";
        return st === "ACTIVE" ? "Đang bán" : st === "DRAFT" ? "Nháp" : "Tạm ẩn";
    };

    const appendCatalogAuditLog = useCallback(
        (action: string, entityId: string, details: Record<string, unknown>) => {
            try {
                const rawLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
                const logs = rawLogs ? JSON.parse(rawLogs) : [];
                logs.unshift({
                    id: `AUD-${Date.now().toString().slice(-4)}`,
                    timestamp: new Date().toISOString(),
                    actor: activeUserName,
                    role: currentRole,
                    tenant: lockedBrandScope,
                    action,
                    entityType: "PRODUCTS",
                    entityId,
                    severity: "INFO",
                    newValues: details,
                    sourceIp: "127.0.0.1",
                });
                localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 250)));
            } catch {
                // Safe fallback
            }
        },
        [activeUserName, currentRole, lockedBrandScope]
    );

    const loadAndReconcileProducts = useCallback(() => {
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
                setActiveUserName(parsedUser.fullName || parsedUser.name || ROLE_PERMISSIONS[resolvedRole].label);
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

            let workingList: PerfumeProductItem[] = [...INITIAL_34_PRODUCTS];
            const savedRaw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
            if (savedRaw) {
                const parsed = JSON.parse(savedRaw);
                if (Array.isArray(parsed) && parsed.length > 0) workingList = parsed;
            }

            workingList = workingList.map((prod) => ({
                ...prod,
                assignedMachines: Array.isArray(prod.assignedMachines)
                    ? prod.assignedMachines.map((m) => {
                        const matrixMl = perKioskMatrix[m.kioskCode.toLowerCase()]?.[prod.name.trim().toLowerCase()];
                        return typeof matrixMl === "number" ? { ...m, remainingVolumeMl: Number(matrixMl) } : m;
                    })
                    : [],
            }));

            setProducts(workingList);
        } catch {
            // Safe fallback
        }
    }, []);

    useEffect(() => {
        loadAndReconcileProducts();
        const handleSync = () => loadAndReconcileProducts();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadAndReconcileProducts]);

    const persistProducts = useCallback((updatedList: PerfumeProductItem[]) => {
        setProducts(updatedList);
        try {
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedList));
            const rawMachines = localStorage.getItem(MACHINES_STORAGE_KEY);
            if (rawMachines) {
                const parsedMachines = JSON.parse(rawMachines);
                if (Array.isArray(parsedMachines)) {
                    const statusMap = new Map<string, PerfumeProductItem["status"]>();
                    const priceMap = new Map<string, number>();
                    updatedList.forEach((p) => {
                        const k = p.name.trim().toLowerCase();
                        statusMap.set(k, p.status);
                        priceMap.set(k, p.pricePerSpray);
                    });
                    const syncedMachines = parsedMachines.map((fm: any) => ({
                        ...fm,
                        slots: Array.isArray(fm.slots)
                            ? fm.slots.map((sl: any) => {
                                const k = String(sl.fragranceName || "").trim().toLowerCase();
                                return {
                                    ...sl,
                                    productStatus: statusMap.get(k) || sl.productStatus || "ACTIVE",
                                    pricePerSpray: priceMap.get(k) ?? sl.pricePerSpray,
                                };
                            })
                            : fm.slots,
                    }));
                    localStorage.setItem(MACHINES_STORAGE_KEY, JSON.stringify(syncedMachines));
                }
            }
            window.dispatchEvent(new Event("scentstation-sync"));
        } catch {
            // Safe fallback
        }
    }, []);

    const uniqueBrands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).sort(), [products]);
    const scopedProducts = useMemo(() => {
        if (!lockedBrandScope) return products;
        return products.filter((p) => isExactName(p.brand, lockedBrandScope));
    }, [products, lockedBrandScope]);

    const summaryMetrics = useMemo(() => ({
        total: scopedProducts.length,
        active: scopedProducts.filter((p) => p.status === "ACTIVE").length,
        availableForMachines: scopedProducts.filter((p) => p.status === "ACTIVE" && p.assignedMachines.length > 0).length,
    }), [scopedProducts]);

    const filteredProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const effectiveBrand = lockedBrandScope || selectedBrand;
        return scopedProducts.filter((p) => {
            const matchesSearch =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.skuCode.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q) ||
                p.notes.toLowerCase().includes(q);
            const matchesBrand = effectiveBrand === "ALL" || p.brand === effectiveBrand;
            const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
            const matchesStatus = selectedStatus === "ALL" || p.status === selectedStatus;
            const matchesSummary =
                summaryFilter === "ALL" ||
                (summaryFilter === "ACTIVE" && p.status === "ACTIVE") ||
                (summaryFilter === "AVAILABLE_MACHINES" && p.status === "ACTIVE" && p.assignedMachines.length > 0);
            return matchesSearch && matchesBrand && matchesCategory && matchesStatus && matchesSummary;
        });
    }, [scopedProducts, searchQuery, lockedBrandScope, selectedBrand, selectedCategory, selectedStatus, summaryFilter]);

    const toggleStatus = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!canManageCatalog) return;
        const updatedList: PerfumeProductItem[] = products.map((p) => {
            if (p.id !== id) return p;
            const nextStatus: PerfumeProductItem["status"] = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
            return { ...p, status: nextStatus };
        });
        persistProducts(updatedList);
        appendCatalogAuditLog("PRODUCT_STATUS_TOGGLED", id, {});
        showToast(lang === "en" ? "Product status updated." : "Đã cập nhật trạng thái sản phẩm.");
    };

    const handleUploadBottleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") setImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleAssignProductToKiosk = () => {
        if (!selectedProduct || !canManageCatalog) return;
        const kioskMeta = FLEET_KIOSK_OPTIONS.find((k) => k.code === assignKioskCode) || FLEET_KIOSK_OPTIONS[0];
        const slotLabel = `Slot 0${assignSlotNum}`;
        const newSlot: AssignedMachineSlot = {
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
        const updatedList: PerfumeProductItem[] = products.map((p) => {
            if (p.id === selectedProduct.id) {
                const filteredOwn = p.assignedMachines.filter((m) => m.kioskCode.toLowerCase() !== kioskMeta.code.toLowerCase());
                return { ...p, assignedMachines: [...filteredOwn, newSlot] };
            }
            return p;
        });
        persistProducts(updatedList);
        appendCatalogAuditLog("PRODUCT_ASSIGNED_SLOT", selectedProduct.id, { kioskCode: kioskMeta.code, slotLabel });
        showToast(
            lang === "en"
                ? `Assigned to ${kioskMeta.code} (${slotLabel}). Waiting for machine confirmation.`
                : `Đã gán vào ${kioskMeta.code} (${slotLabel}). Đang chờ máy xác nhận đồng bộ.`
        );
    };

    const handleUnassignMachineSlot = (kioskCode: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedProduct || !canManageCatalog) return;
        const updatedList: PerfumeProductItem[] = products.map((p) =>
            p.id === selectedProduct.id
                ? { ...p, assignedMachines: p.assignedMachines.filter((m) => m.kioskCode.toLowerCase() !== kioskCode.toLowerCase()) }
                : p
        );
        persistProducts(updatedList);
        showToast(lang === "en" ? `Removed from ${kioskCode}.` : `Đã gỡ khỏi ${kioskCode}.`);
    };

    const openAddModal = () => {
        if (!canManageCatalog) return;
        setEditingProduct(null);
        setFormError("");
        setName("");
        setBrand(lockedBrandScope || "Chanel");
        setCategory("Unisex");
        setConcentration("Eau de Parfum");
        setBottleVolumeMl(100);
        setFamily("Woody Aromatic");
        setNotes("");
        setDescription("");
        setPricePerSpray(15000);
        setStatus("ACTIVE");
        setImage("/images/dior-sauvage.jpg");
        setIsModalOpen(true);
    };

    const openEditModal = (product: PerfumeProductItem, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!canManageCatalog) return;
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
        setIsModalOpen(true);
    };

    const handleSubmitProduct = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        if (!name.trim() || !brand.trim() || pricePerSpray <= 0) {
            setFormError(lang === "en" ? "Name, brand, and valid price are required." : "Vui lòng nhập tên, thương hiệu và giá hợp lệ.");
            return;
        }

        if (editingProduct) {
            const updatedList: PerfumeProductItem[] = products.map((p) =>
                p.id === editingProduct.id
                    ? { ...p, name: name.trim(), brand: brand.trim(), category, concentration, bottleVolumeMl, family, notes, description, pricePerSpray, retail10ml: pricePerSpray * 30, status, image }
                    : p
            );
            persistProducts(updatedList);
            appendCatalogAuditLog("PRODUCT_UPDATED", editingProduct.id, { name: name.trim(), pricePerSpray });
            showToast(lang === "en" ? "Product updated." : "Đã cập nhật sản phẩm.");
        } else {
            const nextSlot = products.reduce((max, p) => Math.max(max, p.slotNumber), 34) + 1;
            const newProd: PerfumeProductItem = {
                id: `PROD-${Date.now()}`,
                skuCode: `SKU-NEW-${nextSlot}`,
                slotNumber: nextSlot,
                name: name.trim(),
                brand: brand.trim(),
                category,
                concentration,
                bottleVolumeMl,
                family: family || "Perfume",
                notes: notes || "Bergamot, Musk",
                description,
                pricePerSpray,
                retail10ml: pricePerSpray * 30,
                fullBottlePrice: pricePerSpray * 240,
                status,
                image,
                assignedMachines: [],
            };
            persistProducts([newProd, ...products]);
            appendCatalogAuditLog("PRODUCT_CREATED", newProd.id, { name: newProd.name });
            showToast(lang === "en" ? "Product created." : "Đã thêm sản phẩm mới.");
        }
        setIsModalOpen(false);
    };

    const renderStatusBadge = (st: PerfumeProductItem["status"]) => {
        if (st === "ACTIVE") return <span className={styles.badgeActive}><CheckCircle2 size={12} /> {formatStatus(st)}</span>;
        if (st === "DRAFT") return <span className={styles.badgeDraft}><AlertCircle size={12} /> {formatStatus(st)}</span>;
        return <span className={styles.badgeInactive}><AlertCircle size={12} /> {formatStatus(st)}</span>;
    };

    const selectedAssignKioskMeta = FLEET_KIOSK_OPTIONS.find((k) => k.code === assignKioskCode) || FLEET_KIOSK_OPTIONS[0];

    return (
        <div className={`${styles.container} notranslate`} translate="no">
            <input type="file" ref={imageFileInputRef} onChange={handleUploadBottleImage} accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} />

            <div className={styles.workspaceInner}>
                <div className={styles.heroBannerCard}>
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>{lang === "en" ? "Products" : "Danh mục sản phẩm"}</h1>
                            <div className={styles.scopeBadge}>
                                <span>{roleConfig.label}</span>
                                {lockedBrandScope && <span>• {lockedBrandScope}</span>}
                            </div>
                        </div>

                        <div className={styles.headerActionGroup}>
                            <button type="button" onClick={handleToggleLanguage} className={styles.resetButton}>
                                <Globe size={14} color="#D4AF37" />
                                <span>{lang === "en" ? "EN" : "VI"}</span>
                            </button>

                            {canManageCatalog && (
                                <button type="button" onClick={openAddModal} className={styles.addButton}>
                                    <Plus size={15} />
                                    <span>{lang === "en" ? "Add Product" : "Thêm sản phẩm"}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.summaryGrid}>
                        <div onClick={() => setSummaryFilter("ALL")} className={`${styles.summaryCard} ${summaryFilter === "ALL" ? styles.summaryCardActive : ""}`}>
                            <div className={styles.summaryLabel}>{lang === "en" ? "Total SKUs" : "Tổng sản phẩm"}</div>
                            <div className={styles.summaryValue}>{summaryMetrics.total}</div>
                            <div className={styles.summaryHint}>{uniqueBrands.length} {lang === "en" ? "brands" : "thương hiệu"}</div>
                        </div>

                        <div onClick={() => setSummaryFilter("ACTIVE")} className={`${styles.summaryCard} ${summaryFilter === "ACTIVE" ? styles.summaryCardActive : ""}`}>
                            <div className={styles.summaryLabel}>{lang === "en" ? "Active" : "Đang mở bán"}</div>
                            <div className={styles.summaryValue} style={{ color: "#34D399" }}>{summaryMetrics.active}</div>
                            <div className={styles.summaryHint}>{lang === "en" ? "Visible on Kiosk" : "Hiển thị trên Kiosk"}</div>
                        </div>

                        <div onClick={() => setSummaryFilter("AVAILABLE_MACHINES")} className={`${styles.summaryCard} ${summaryFilter === "AVAILABLE_MACHINES" ? styles.summaryCardActive : ""}`}>
                            <div className={styles.summaryLabel}>{lang === "en" ? "Installed in Stations" : "Đang lắp trong máy"}</div>
                            <div className={styles.summaryValue} style={{ color: "#38BDF8" }}>{summaryMetrics.availableForMachines}</div>
                            <div className={styles.summaryHint}>{lang === "en" ? "Assigned to slots" : "Đã gán vào khoang"}</div>
                        </div>
                    </div>
                </div>

                {/* BỘ LỌC */}
                <div className={styles.filterBar}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={lang === "en" ? "Search name, SKU, brand, notes..." : "Tìm tên nước hoa, mã SKU, thương hiệu..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")} className={styles.clearSearchBtn}><X size={14} /></button>
                        )}
                    </div>

                    {!lockedBrandScope && (
                        <div className={styles.customDropdownWrap} ref={brandMenuRef}>
                            <button type="button" onClick={() => setIsBrandDropdownOpen((prev) => !prev)} className={styles.customDropdownTrigger}>
                                <SlidersHorizontal size={13} color="#D4AF37" />
                                <span>{selectedBrand === "ALL" ? (lang === "en" ? "All Brands" : "Tất cả thương hiệu") : selectedBrand}</span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {isBrandDropdownOpen && (
                                <div className={styles.customDropdownMenu}>
                                    <button type="button" onClick={() => { setSelectedBrand("ALL"); setIsBrandDropdownOpen(false); }} className={`${styles.customDropdownItem} ${selectedBrand === "ALL" ? styles.customDropdownItemActive : ""}`}>
                                        <span>{lang === "en" ? "All Brands" : "Tất cả thương hiệu"}</span>
                                        {selectedBrand === "ALL" && <Check size={13} color="#D4AF37" />}
                                    </button>
                                    {uniqueBrands.map((b) => (
                                        <button key={b} type="button" onClick={() => { setSelectedBrand(b); setIsBrandDropdownOpen(false); }} className={`${styles.customDropdownItem} ${selectedBrand === b ? styles.customDropdownItemActive : ""}`}>
                                            <span>{b}</span>
                                            <span className={styles.dropdownCountBadge}>{scopedProducts.filter((p) => p.brand === b).length}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.pillGroup}>
                        {(["ALL", "Niche", "Men", "Women", "Unisex"] as const).map((cat) => (
                            <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} className={`${styles.filterPillBtn} ${selectedCategory === cat ? styles.filterPillBtnActive : ""}`}>
                                {formatCategory(cat)}
                            </button>
                        ))}
                    </div>

                    <div className={styles.pillGroup}>
                        {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
                            <button key={st} type="button" onClick={() => setSelectedStatus(st)} className={`${styles.filterPillBtn} ${selectedStatus === st ? styles.filterPillBtnActive : ""}`}>
                                {st === "ALL" ? (lang === "en" ? "All" : "Tất cả") : formatStatus(st)}
                            </button>
                        ))}
                    </div>

                    {(searchQuery || (!lockedBrandScope && selectedBrand !== "ALL") || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
                        <button type="button" onClick={() => { setSearchQuery(""); if (!lockedBrandScope) setSelectedBrand("ALL"); setSelectedCategory("ALL"); setSelectedStatus("ALL"); setSummaryFilter("ALL"); }} className={styles.resetButton}>
                            <RefreshCw size={13} />
                            <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                        </button>
                    )}

                    <div className={styles.viewToggleBox}>
                        <button type="button" onClick={() => setViewMode("table")} className={`${styles.viewToggleBtn} ${viewMode === "table" ? styles.viewToggleBtnActive : ""}`}><ListIcon size={15} /></button>
                        <button type="button" onClick={() => setViewMode("grid")} className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}><LayoutGrid size={15} /></button>
                    </div>
                </div>

                {/* DANH SÁCH SẢN PHẨM */}
                {filteredProducts.length > 0 ? (
                    viewMode === "grid" ? (
                        <div className={styles.cardsGridContainer}>
                            {filteredProducts.map((product) => {
                                const machineInfo = product.assignedMachines[0];
                                const pctRemaining = machineInfo ? Math.round((machineInfo.remainingVolumeMl / product.bottleVolumeMl) * 100) : 0;
                                return (
                                    <div key={product.id} onClick={() => { setSelectedProductId(product.id); setDrawerTab("overview"); }} className={`${styles.luxuryProductCard} ${selectedProduct?.id === product.id ? styles.luxuryProductCardActive : ""}`}>
                                        <div>
                                            <div className={styles.productImageCell} style={{ marginBottom: "0.75rem" }}>
                                                <div className={styles.imagePlaceholder}>
                                                    <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontSize: "0.74rem", color: "#D4AF37", fontWeight: 700 }}>{product.brand}</div>
                                                    <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
                                                    <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{product.skuCode} • {product.bottleVolumeMl}ml</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "#CBD5E1" }}>
                                                <span>{machineInfo ? `${machineInfo.kioskCode} (${machineInfo.physicalSlotLabel})` : (lang === "en" ? "Unassigned" : "Chưa gán máy")}</span>
                                                {machineInfo && <strong style={{ color: pctRemaining <= 15 ? "#F87171" : "#34D399" }}>{machineInfo.remainingVolumeMl}ml ({pctRemaining}%)</strong>}
                                            </div>
                                            <div className={styles.volumeTrack}>
                                                <div className={styles.volumeFill} style={{ width: `${machineInfo ? pctRemaining : 0}%`, background: pctRemaining <= 15 ? "#F87171" : "#34D399" }} />
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.65rem" }}>
                                            <strong style={{ color: "#F5E6AD" }}>{product.pricePerSpray.toLocaleString("vi-VN")} VND</strong>
                                            {renderStatusBadge(product.status)}
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
                                        <th>{lang === "en" ? "Product & Bottle" : "Sản phẩm & Chai"}</th>
                                        <th>{lang === "en" ? "Brand" : "Thương hiệu"}</th>
                                        <th>{lang === "en" ? "Price / Spray" : "Giá / lần xịt"}</th>
                                        <th>{lang === "en" ? "Machine Stock" : "Tồn trong máy"}</th>
                                        <th>{lang === "en" ? "Status" : "Trạng thái"}</th>
                                        {canManageCatalog && <th style={{ textAlign: "right" }}>{lang === "en" ? "Actions" : "Thao tác"}</th>}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredProducts.map((product) => {
                                        const machineInfo = product.assignedMachines[0];
                                        const pct = machineInfo ? Math.round((machineInfo.remainingVolumeMl / product.bottleVolumeMl) * 100) : 0;
                                        return (
                                            <tr key={product.id} className={`${styles.tableRow} ${selectedProduct?.id === product.id ? styles.tableRowSelected : ""}`} onClick={() => { setSelectedProductId(product.id); setDrawerTab("overview"); }}>
                                                <td className={styles.tableCell}>
                                                    <div className={styles.productImageCell}>
                                                        <div className={styles.imagePlaceholder}>
                                                            <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{product.name}</div>
                                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                                                                {product.skuCode} • {lang === "en" ? "Bottle" : "Chai"} {product.bottleVolumeMl}ml
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <strong>{product.brand}</strong>
                                                    <div style={{ fontSize: "0.74rem", color: "#D4AF37" }}>{formatCategory(product.category)}</div>
                                                </td>
                                                <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 700 }}>
                                                    {product.pricePerSpray.toLocaleString("vi-VN")} VND
                                                </td>
                                                <td className={styles.tableCell}>
                                                    {machineInfo ? (
                                                        <div>
                                                            <span className={styles.slotPillTag}>{machineInfo.kioskCode} • {machineInfo.physicalSlotLabel}</span>
                                                            <div style={{ fontSize: "0.76rem", color: pct <= 15 ? "#F87171" : "#34D399", fontWeight: 700, marginTop: "3px" }}>
                                                                {machineInfo.remainingVolumeMl}ml / {product.bottleVolumeMl}ml ({pct}%)
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: "#94A3B8", fontSize: "0.78rem" }}>{lang === "en" ? "Not installed" : "Chưa lắp máy"}</span>
                                                    )}
                                                </td>
                                                <td className={styles.tableCell}>{renderStatusBadge(product.status)}</td>
                                                {canManageCatalog && (
                                                    <td className={styles.tableCell} style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                                                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                                                            <button type="button" onClick={(e) => openEditModal(product, e)} className={styles.actionButton} style={{ padding: "0.38rem 0.55rem" }} title={lang === "en" ? "Edit" : "Sửa"}>
                                                                <Edit3 size={14} color="#F5E6AD" />
                                                            </button>
                                                            <button type="button" onClick={(e) => toggleStatus(product.id, e)} className={styles.actionButton} style={{ padding: "0.38rem 0.55rem" }} title={lang === "en" ? "Toggle Status" : "Bật/tắt hiển thị"}>
                                                                {product.status === "ACTIVE" ? <EyeOff size={14} color="#FBBF24" /> : <Eye size={14} color="#34D399" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
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
                        <p style={{ fontWeight: 700, color: "#F5E6AD", marginBottom: "0.75rem" }}>{lang === "en" ? "No products found" : "Không có sản phẩm phù hợp"}</p>
                        <button type="button" onClick={() => { setSearchQuery(""); if (!lockedBrandScope) setSelectedBrand("ALL"); setSelectedCategory("ALL"); setSelectedStatus("ALL"); }} className={styles.resetButton}>
                            {lang === "en" ? "Clear Filters" : "Xóa bộ lọc"}
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT SẢN PHẨM */}
            {selectedProduct && (
                <div className={styles.drawerOverlay} onClick={() => setSelectedProductId(null)}>
                    <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                                <div className={styles.productImageCell}>
                                    <div className={styles.imagePlaceholderLarge}>
                                        <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <strong style={{ color: "#D4AF37", fontSize: "0.8rem" }}>{selectedProduct.brand} • {selectedProduct.skuCode}</strong>
                                            {renderStatusBadge(selectedProduct.status)}
                                        </div>
                                        <h2 style={{ margin: "0.15rem 0 0 0", fontSize: "1.25rem", fontWeight: 700 }}>{selectedProduct.name}</h2>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "0.45rem" }}>
                                    <button type="button" onClick={() => setPreviewProduct(selectedProduct)} className={styles.resetButton}>
                                        <Smartphone size={14} />
                                        <span>{lang === "en" ? "Kiosk Preview" : "Xem trên Kiosk"}</span>
                                    </button>
                                    {canManageCatalog && (
                                        <button type="button" onClick={() => openEditModal(selectedProduct)} className={styles.addButton}>
                                            <Edit3 size={14} />
                                            <span>{lang === "en" ? "Edit" : "Sửa"}</span>
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setSelectedProductId(null)} className={styles.actionButton} style={{ padding: "0.45rem 0.6rem" }}><X size={16} /></button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.drawerTabsBar}>
                            <button type="button" onClick={() => setDrawerTab("overview")} className={`${styles.drawerTabBtn} ${drawerTab === "overview" ? styles.drawerTabBtnActive : ""}`}>
                                <Sparkles size={14} />
                                <span>{lang === "en" ? "Details" : "Thông tin"}</span>
                            </button>
                            <button type="button" onClick={() => setDrawerTab("machines")} className={`${styles.drawerTabBtn} ${drawerTab === "machines" ? styles.drawerTabBtnActive : ""}`}>
                                <Cpu size={14} />
                                <span>{lang === "en" ? `Stations (${selectedProduct.assignedMachines.length})` : `Trạm lắp đặt (${selectedProduct.assignedMachines.length})`}</span>
                            </button>
                        </div>

                        <div className={styles.drawerBody}>
                            {drawerTab === "overview" ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    <div className={styles.glassCard}>
                                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", marginBottom: "0.25rem" }}>{lang === "en" ? "Notes" : "Nốt hương"}</div>
                                        <div style={{ fontWeight: 600 }}>{selectedProduct.family} — {selectedProduct.notes}</div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem" }}>
                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "Commercial Bottle" : "Dung tích chai"}</div>
                                            <strong>{selectedProduct.bottleVolumeMl} ml</strong>
                                        </div>
                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "Price / Spray (0.12ml)" : "Giá / lần xịt (0.12ml)"}</div>
                                            <strong style={{ color: "#F5E6AD" }}>{selectedProduct.pricePerSpray.toLocaleString("vi-VN")} VND</strong>
                                        </div>
                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{lang === "en" ? "10ml Reference" : "Giá tham khảo 10ml"}</div>
                                            <strong>{selectedProduct.retail10ml.toLocaleString("vi-VN")} VND</strong>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    {selectedProduct.assignedMachines.map((m) => (
                                        <div key={`${m.kioskCode}-${m.slotNumber}`} className={styles.glassCard} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <strong style={{ color: "#F5E6AD" }}>{m.kioskCode} • {m.physicalSlotLabel}</strong>
                                                <div style={{ fontSize: "0.78rem", color: "#CBD5E1" }}>
                                                    {m.location} • {lang === "en" ? "Remaining" : "Còn lại"}: <strong style={{ color: "#34D399" }}>{m.remainingVolumeMl} ml</strong>
                                                </div>
                                            </div>
                                            {canManageCatalog && (
                                                <button type="button" onClick={(e) => handleUnassignMachineSlot(m.kioskCode, e)} className={styles.actionButton} style={{ padding: "0.35rem 0.55rem" }} title={lang === "en" ? "Unassign" : "Gỡ khỏi máy"}>
                                                    <Trash2 size={14} color="#F87171" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {canManageCatalog && (
                                        <div className={styles.glassCard}>
                                            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F5E6AD", marginBottom: "0.6rem" }}>
                                                {lang === "en" ? "Assign to Station Slot" : "Gán vào khoang máy"}
                                            </div>
                                            <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", alignItems: "center" }}>
                                                <div className={styles.customDropdownWrap} ref={assignKioskMenuRef} style={{ flex: 1, minWidth: "200px" }}>
                                                    <button type="button" onClick={() => setIsAssignKioskOpen((p) => !p)} className={styles.customDropdownTrigger} style={{ width: "100%", justifyContent: "space-between" }}>
                                                        <span>{selectedAssignKioskMeta.code}</span>
                                                        <ChevronDown size={13} color="#D4AF37" />
                                                    </button>
                                                    {isAssignKioskOpen && (
                                                        <div className={styles.customDropdownMenu} style={{ width: "100%" }}>
                                                            {FLEET_KIOSK_OPTIONS.map((k) => (
                                                                <button key={k.code} type="button" onClick={() => { setAssignKioskCode(k.code); setIsAssignKioskOpen(false); }} className={styles.customDropdownItem}>
                                                                    <span>{k.code} — {k.location}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={styles.pillGroup}>
                                                    {[1, 2, 3, 4].map((num) => (
                                                        <button key={num} type="button" onClick={() => setAssignSlotNum(num)} className={`${styles.filterPillBtn} ${assignSlotNum === num ? styles.filterPillBtnActive : ""}`}>
                                                            {lang === "en" ? `Slot 0${num}` : `Khoang 0${num}`}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button type="button" onClick={handleAssignProductToKiosk} className={styles.addButton}>
                                                    <Plus size={14} />
                                                    <span>{lang === "en" ? "Assign" : "Gán khoang"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XEM TRƯỚC KIOSK */}
            {previewProduct && (
                <div className={styles.modalOverlay} onClick={() => setPreviewProduct(null)}>
                    <div className={styles.modalContent} style={{ maxWidth: "28rem" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <strong style={{ color: "#D4AF37" }}>{lang === "en" ? "Kiosk Preview" : "Xem trước trên Kiosk"}</strong>
                            <button type="button" onClick={() => setPreviewProduct(null)} className={styles.actionButton} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>
                        <div className={styles.glassCard}>
                            <div className={styles.productImageCell} style={{ marginBottom: "0.75rem" }}>
                                <div className={styles.imagePlaceholderLarge}>
                                    <img src={previewProduct.image} alt={previewProduct.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.76rem", color: "#D4AF37", fontWeight: 700 }}>{previewProduct.brand}</div>
                                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{previewProduct.name}</div>
                                    <div style={{ fontSize: "0.82rem", color: "#F5E6AD", fontWeight: 700 }}>{previewProduct.pricePerSpray.toLocaleString("vi-VN")} VND / 0.12ml</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push(`/kiosk/${encodeURIComponent(previewProduct.assignedMachines[0]?.kioskCode || "demo-device")}`)}
                                className={styles.addButton}
                                style={{ width: "100%" }}
                            >
                                <Smartphone size={14} />
                                <span>{lang === "en" ? "Open Kiosk Screen" : "Mở màn hình Kiosk"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THÊM / SỬA SẢN PHẨM (CHỈ DÀNH CHO BA) */}
            {isModalOpen && canManageCatalog && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 className={styles.modalTitle} style={{ margin: 0 }}>
                                {editingProduct
                                    ? lang === "en" ? `Edit ${editingProduct.name}` : `Sửa sản phẩm: ${editingProduct.name}`
                                    : lang === "en" ? "Add Product" : "Thêm sản phẩm mới"}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className={styles.actionButton} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>

                        {formError && (
                            <div style={{ marginBottom: "0.85rem", padding: "0.7rem", borderRadius: "9px", background: "rgba(248,113,113,0.14)", border: "1px solid rgba(248,113,113,0.4)", color: "#F87171", fontSize: "0.82rem" }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitProduct}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div className={styles.imagePlaceholder}>
                                    <img src={image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                                <button type="button" onClick={() => imageFileInputRef.current?.click()} className={styles.resetButton}>
                                    <Upload size={14} />
                                    <span>{lang === "en" ? "Upload Image" : "Tải ảnh chai"}</span>
                                </button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Product Name *" : "Tên sản phẩm *"}</label>
                                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Brand *" : "Thương hiệu *"}</label>
                                    <input type="text" required disabled={Boolean(lockedBrandScope)} value={brand} onChange={(e) => setBrand(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Bottle Volume (ml) *" : "Dung tích chai (ml) *"}</label>
                                    <input type="number" required min={10} value={bottleVolumeMl} onChange={(e) => setBottleVolumeMl(Number(e.target.value))} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Price / Spray (VND) *" : "Giá / lần xịt (VND) *"}</label>
                                    <input type="number" required min={1000} step={500} value={pricePerSpray} onChange={(e) => setPricePerSpray(Number(e.target.value))} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: "0.85rem" }}>
                                <label style={{ display: "block", fontSize: "0.78rem", color: "#CBD5E1", fontWeight: 600, marginBottom: "0.3rem" }}>{lang === "en" ? "Notes" : "Nốt hương"}</label>
                                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={styles.searchInput} style={{ padding: "0.56rem 0.85rem" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.resetButton}>{lang === "en" ? "Cancel" : "Hủy"}</button>
                                <button type="submit" className={styles.addButton}>{editingProduct ? (lang === "en" ? "Save" : "Lưu thay đổi") : (lang === "en" ? "Create" : "Tạo mới")}</button>
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