// noinspection SpellCheckingInspection
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Download,
    Search,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    BarChart3,
    PieChart,
    Cpu,
    Sparkles,
    ShieldCheck,
    FileSpreadsheet,
    Globe,
    X,
    ChevronDown,
    Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./reports.module.css";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

export interface ReportRecord {
    id: string;
    dateStr: string;
    timestamp: string;
    kioskCode: string;
    location: string;
    brand: string;
    productName: string;
    slotNumber: number;
    volumeMl: number;
    spraysCount: number;
    amountVnd: number;
    paymentMethod: "VietQR" | "MoMo" | "VNPay" | "ZaloPay";
    status: "DISPENSED" | "PAID" | "PENDING" | "FAILED" | "UNCERTAIN" | "REFUNDED";
}

function toLocalYmd(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysToYmd(ymd: string, deltaDays: number): string {
    const [y, m, d] = ymd.split("-").map(Number);
    return toLocalYmd(new Date(y, (m || 1) - 1, (d || 1) + deltaDays));
}

function formatShortDdMm(ymd: string): string {
    const p = ymd.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}` : ymd;
}

const isExactMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

function buildSeedReports(): ReportRecord[] {
    const today = toLocalYmd(new Date());
    const d1 = addDaysToYmd(today, -1);
    const d2 = addDaysToYmd(today, -2);
    const d4 = addDaysToYmd(today, -4);
    const d6 = addDaysToYmd(today, -6);

    return [
        { id: "TXN-2026-9101", dateStr: today, timestamp: `${today} 10:15:20`, kioskCode: "demo-device", location: "Diamond Plaza Atrium", brand: "Creed", productName: "Creed Aventus", slotNumber: 1, volumeMl: 0.12, spraysCount: 1, amountVnd: 20000, paymentMethod: "VietQR", status: "DISPENSED" },
        { id: "TXN-2026-9102", dateStr: today, timestamp: `${today} 11:02:45`, kioskCode: "KIOSK-SGN-01", location: "Saigon Centre", brand: "Chanel", productName: "Bleu de Chanel", slotNumber: 3, volumeMl: 0.12, spraysCount: 1, amountVnd: 15000, paymentMethod: "MoMo", status: "DISPENSED" },
        { id: "TXN-2026-9103", dateStr: d1, timestamp: `${d1} 14:30:10`, kioskCode: "demo-device", location: "Diamond Plaza Atrium", brand: "Maison Francis Kurkdjian", productName: "MFK Baccarat Rouge 540", slotNumber: 4, volumeMl: 0, spraysCount: 0, amountVnd: 0, paymentMethod: "VNPay", status: "REFUNDED" },
        { id: "TXN-2026-9104", dateStr: d2, timestamp: `${d2} 16:40:00`, kioskCode: "KIOSK-SGN-02", location: "Vincom Đồng Khởi", brand: "Chanel", productName: "Coco Mademoiselle", slotNumber: 1, volumeMl: 0.12, spraysCount: 1, amountVnd: 15500, paymentMethod: "VietQR", status: "DISPENSED" },
        { id: "TXN-2026-9105", dateStr: d4, timestamp: `${d4} 18:12:05`, kioskCode: "KIOSK-HN-01", location: "Lotte West Lake", brand: "Dior", productName: "Dior Sauvage", slotNumber: 3, volumeMl: 0.12, spraysCount: 1, amountVnd: 14500, paymentMethod: "ZaloPay", status: "DISPENSED" },
        { id: "TXN-2026-9106", dateStr: d6, timestamp: `${d6} 19:05:30`, kioskCode: "KIOSK-DAD-01", location: "IndoChina Riverside", brand: "Versace", productName: "Versace Dylan Blue", slotNumber: 4, volumeMl: 0.12, spraysCount: 1, amountVnd: 12000, paymentMethod: "MoMo", status: "DISPENSED" },
    ];
}

const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type ReportTab = "OVERVIEW" | "SALES" | "MACHINES" | "PRODUCTS" | "AUDIT";
type QuickDatePreset = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_30_DAYS";

export default function ReportsPage() {
    const router = useRouter();
    const filterBarRef = useRef<HTMLDivElement | null>(null);
    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [reportRecords, setReportRecords] = useState<ReportRecord[]>(() => buildSeedReports());
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [quickPreset, setQuickPreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
    const [selectedKiosk, setSelectedKiosk] = useState<string>("ALL");
    const [activeTab, setActiveTab] = useState<ReportTab>("OVERVIEW");
    const [openDropdown, setOpenDropdown] = useState<"BRAND" | "KIOSK" | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Phân quyền chuẩn theo src/lib/rbac.ts
    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canExport = roleConfig.canExportReport;

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) setOpenDropdown(null);
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

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

    const formatStatus = (st: string) => {
        const key = String(st || "").toUpperCase();
        const map: Record<string, { en: string; vi: string }> = {
            DISPENSED: { en: "Dispensed", vi: "Đã phun" },
            COMPLETED: { en: "Completed", vi: "Hoàn tất" },
            PAID: { en: "Paid", vi: "Đã trả" },
            PENDING: { en: "Pending", vi: "Đang chờ" },
            FAILED: { en: "Failed", vi: "Thất bại" },
            UNCERTAIN: { en: "Uncertain", vi: "Chờ đối soát" },
            REFUND_PENDING: { en: "Refund Pending", vi: "Chờ hoàn tiền" },
            REFUNDED: { en: "Refunded", vi: "Đã hoàn tiền" },
            CANCELLED: { en: "Cancelled", vi: "Đã hủy" },
            EXPIRED: { en: "Expired", vi: "Hết hạn" },
        };
        return map[key]?.[lang] || st;
    };

    const handleApplyPreset = useCallback((preset: QuickDatePreset) => {
        const now = new Date();
        const todayStr = toLocalYmd(now);
        setQuickPreset(preset);
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
        } else {
            setStartDate(addDaysToYmd(todayStr, -29));
            setEndDate(todayStr);
        }
    }, []);

    const loadReports = useCallback(() => {
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
                const scope = parsedUser.brandScope || parsedUser.brand || null;
                if (resolvedRole === "BA" && scope) {
                    setLockedBrandScope(scope);
                    setSelectedBrand(scope);
                } else {
                    setLockedBrandScope(null);
                }
            }

            const seed = buildSeedReports();
            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            if (rawDash) {
                const parsed = JSON.parse(rawDash);
                if (Array.isArray(parsed.transactions) && parsed.transactions.length > 0) {
                    const live: ReportRecord[] = parsed.transactions.slice(0, 40).map((tx: any, idx: number) => {
                        const rawSt = String(tx.status || "DISPENSED").toUpperCase() as ReportRecord["status"];
                        const dStr = String(tx.createdAt || "").includes("T") ? String(tx.createdAt).split("T")[0] : todayYmd;
                        const isOk = rawSt === "DISPENSED" || rawSt === "PAID";
                        return {
                            id: String(tx.id || `ORD-2026-${9200 + idx}`),
                            dateStr: dStr,
                            timestamp: tx.timestamp || tx.time || dStr,
                            kioskCode: tx.kiosk || tx.kioskCode || "demo-device",
                            location: tx.location || "Diamond Plaza Atrium",
                            brand: tx.brand || "Chanel",
                            productName: tx.product || tx.productName || "Signature Scent",
                            slotNumber: Number(tx.slotNumber || 1),
                            volumeMl: isOk ? 0.12 : 0,
                            spraysCount: isOk ? 1 : 0,
                            amountVnd: isOk ? Number(tx.priceSnapshot ?? tx.amount ?? 15000) : 0,
                            paymentMethod: "VietQR",
                            status: rawSt,
                        };
                    });
                    const seen = new Set<string>();
                    const merged: ReportRecord[] = [];
                    [...live, ...seed].forEach((r) => {
                        if (!seen.has(r.id)) {
                            seen.add(r.id);
                            merged.push(r);
                        }
                    });
                    setReportRecords(merged);
                }
            }

            const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
            if (rawAudit) {
                const parsedAudit = JSON.parse(rawAudit);
                if (Array.isArray(parsedAudit)) setAuditLogs(parsedAudit);
            }
        } catch {
            // Safe fallback
        }
    }, [todayYmd]);

    useEffect(() => {
        loadReports();
        const handleSync = () => loadReports();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadReports]);

    const uniqueBrands = useMemo(() => Array.from(new Set(reportRecords.map((r) => r.brand))).sort(), [reportRecords]);
    const uniqueKiosks = useMemo(() => Array.from(new Set(reportRecords.map((r) => r.kioskCode))).sort(), [reportRecords]);
    const effectiveBrand = lockedBrandScope || selectedBrand;

    const filteredReports = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return reportRecords.filter((r) => {
            const matchDate = r.dateStr >= startDate && r.dateStr <= endDate;
            const matchBrand = effectiveBrand === "ALL" || isExactMatch(r.brand, effectiveBrand);
            const matchKiosk = selectedKiosk === "ALL" || isExactMatch(r.kioskCode, selectedKiosk);
            const matchQ = !q || r.id.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q) || r.brand.toLowerCase().includes(q) || r.kioskCode.toLowerCase().includes(q);
            return matchDate && matchBrand && matchKiosk && matchQ;
        });
    }, [reportRecords, startDate, endDate, effectiveBrand, selectedKiosk, searchQuery]);

    const kpiMetrics = useMemo(() => {
        const ok = filteredReports.filter((r) => r.status === "DISPENSED" || r.status === "PAID");
        return {
            revenue: ok.reduce((s, r) => s + r.amountVnd, 0),
            orders: filteredReports.length,
            sprays: ok.reduce((s, r) => s + r.spraysCount, 0),
            stations: new Set(filteredReports.map((r) => r.kioskCode)).size,
            brands: new Set(filteredReports.map((r) => r.brand)).size,
        };
    }, [filteredReports]);

    const trendBars = useMemo(() => {
        const ok = filteredReports.filter((r) => r.status === "DISPENSED" || r.status === "PAID");
        const arr: { label: string; rev: number; sp: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = addDaysToYmd(endDate, -i);
            const rows = ok.filter((r) => r.dateStr === d);
            arr.push({ label: formatShortDdMm(d), rev: rows.reduce((s, r) => s + r.amountVnd, 0), sp: rows.reduce((s, r) => s + r.spraysCount, 0) });
        }
        const maxRev = Math.max(...arr.map((a) => a.rev), 15000);
        return arr.map((a) => ({ ...a, pct: a.rev === 0 ? 8 : Math.max(18, Math.round((a.rev / maxRev) * 92)) }));
    }, [filteredReports, endDate]);

    const brandBreakdown = useMemo(() => {
        const map = new Map<string, { brand: string; rev: number; sp: number }>();
        filteredReports.filter((r) => r.status === "DISPENSED" || r.status === "PAID").forEach((r) => {
            const cur = map.get(r.brand) || { brand: r.brand, rev: 0, sp: 0 };
            cur.rev += r.amountVnd;
            cur.sp += r.spraysCount;
            map.set(r.brand, cur);
        });
        return Array.from(map.values()).sort((a, b) => b.rev - a.rev);
    }, [filteredReports]);

    const handleExportCSV = () => {
        if (!canExport) return;
        const header = "Order ID;Timestamp;Station;Brand;Product;Sprays;Amount (VND);Status\n";
        const rows = filteredReports.map((r) => `"${r.id}";"${r.timestamp}";"${r.kioskCode}";"${r.brand}";"${r.productName}";"${r.spraysCount}";"${r.amountVnd}";"${r.status}"`).join("\n");
        const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "ScentStation_Reports.csv";
        link.click();
        showToast(lang === "en" ? `Exported ${filteredReports.length} rows.` : `Đã xuất ${filteredReports.length} dòng báo cáo ra CSV.`);
    };

    return (
        <div className={`${styles.container} notranslate`} translate="no" onClick={() => setOpenDropdown(null)}>
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Reports" : "Báo cáo & Thống kê"}</h1>
                        <div className={styles.scopeBadge}>
                            <span>{lang === "en" ? roleConfig.labelEn : roleConfig.labelVi}</span>
                            {lockedBrandScope && <span>• {lockedBrandScope}</span>}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.55rem", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={handleToggleLanguage} className={styles.secondaryGoldBtn}>
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        {canExport && (
                            <button type="button" onClick={handleExportCSV} className={styles.exportButton}>
                                <Download size={14} />
                                <span>{lang === "en" ? "Export CSV" : "Xuất CSV"}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 5 KPI */}
                <div className={styles.kpiGrid5}>
                    <div className={styles.kpiCard} onClick={() => setActiveTab("SALES")}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Recognized Revenue" : "Doanh thu ghi nhận"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#F5E6AD", marginTop: "0.2rem" }}>{kpiMetrics.revenue.toLocaleString("vi-VN")} VND</div>
                    </div>
                    <div className={styles.kpiCard} onClick={() => setActiveTab("OVERVIEW")}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Total Orders" : "Tổng đơn hàng"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "0.2rem" }}>{kpiMetrics.orders}</div>
                    </div>
                    <div className={styles.kpiCard} onClick={() => setActiveTab("PRODUCTS")}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Verified Sprays" : "Lượt xịt xác thực"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34D399", marginTop: "0.2rem" }}>{kpiMetrics.sprays}</div>
                    </div>
                    <div className={styles.kpiCard} onClick={() => setActiveTab("MACHINES")}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Active Stations" : "Trạm phát sinh"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#38BDF8", marginTop: "0.2rem" }}>{kpiMetrics.stations}</div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Active Brands" : "Thương hiệu"}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "0.2rem" }}>{kpiMetrics.brands}</div>
                    </div>
                </div>
            </div>

            {/* BỘ LỌC */}
            <div className={styles.filterBar} ref={filterBarRef} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={lang === "en" ? "Search order ID, product, station..." : "Tìm mã đơn, sản phẩm, trạm..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <button type="button" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.6rem", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}><X size={14} /></button>}
                </div>

                <div style={{ display: "inline-flex", gap: "0.2rem", background: "#0B0D14", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "9px", padding: "0.2rem" }}>
                    {(
                        [
                            { id: "TODAY", label: lang === "en" ? "Today" : "Hôm nay" },
                            { id: "THIS_WEEK", label: lang === "en" ? "Week" : "Tuần này" },
                            { id: "THIS_MONTH", label: lang === "en" ? "Month" : "Tháng này" },
                            { id: "LAST_30_DAYS", label: lang === "en" ? "30d" : "30 ngày" },
                        ] as const
                    ).map((p) => (
                        <button key={p.id} type="button" onClick={() => handleApplyPreset(p.id)} style={{ padding: "0.34rem 0.6rem", borderRadius: "7px", border: "none", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", background: quickPreset === p.id ? "#D4AF37" : "transparent", color: quickPreset === p.id ? "#090A0F" : "#CBD5E1" }}>
                            {p.label}
                        </button>
                    ))}
                </div>

                {!lockedBrandScope && (
                    <div className={styles.customDropdownWrap}>
                        <button type="button" onClick={() => setOpenDropdown(openDropdown === "BRAND" ? null : "BRAND")} className={styles.customDropdownTrigger}>
                            <span>{selectedBrand === "ALL" ? (lang === "en" ? "All Brands" : "Tất cả thương hiệu") : selectedBrand}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "BRAND" && (
                            <div className={styles.customDropdownMenu}>
                                <button type="button" onClick={() => { setSelectedBrand("ALL"); setOpenDropdown(null); }} className={styles.customDropdownItem}>{lang === "en" ? "All Brands" : "Tất cả thương hiệu"}</button>
                                {uniqueBrands.map((b) => <button key={b} type="button" onClick={() => { setSelectedBrand(b); setOpenDropdown(null); }} className={styles.customDropdownItem}>{b}</button>)}
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.customDropdownWrap}>
                    <button type="button" onClick={() => setOpenDropdown(openDropdown === "KIOSK" ? null : "KIOSK")} className={styles.customDropdownTrigger}>
                        <span>{selectedKiosk === "ALL" ? (lang === "en" ? "All Stations" : "Tất cả trạm") : selectedKiosk}</span>
                        <ChevronDown size={13} color="#D4AF37" />
                    </button>
                    {openDropdown === "KIOSK" && (
                        <div className={styles.customDropdownMenu}>
                            <button type="button" onClick={() => { setSelectedKiosk("ALL"); setOpenDropdown(null); }} className={styles.customDropdownItem}>{lang === "en" ? "All Stations" : "Tất cả trạm"}</button>
                            {uniqueKiosks.map((k) => (
                                <button key={k} type="button" onClick={() => { setSelectedKiosk(k); setOpenDropdown(null); }} className={`${styles.customDropdownItem} ${selectedKiosk === k ? styles.customDropdownItemActive : ""}`}>
                                    <span>{k}</span>
                                    {selectedKiosk === k && <Check size={13} color="#D4AF37" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {(searchQuery || (!lockedBrandScope && selectedBrand !== "ALL") || selectedKiosk !== "ALL") && (
                    <button type="button" onClick={() => { setSearchQuery(""); if (!lockedBrandScope) setSelectedBrand("ALL"); setSelectedKiosk("ALL"); handleApplyPreset("LAST_30_DAYS"); }} className={styles.secondaryGoldBtn}>
                        <RefreshCw size={13} /><span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                    </button>
                )}
            </div>

            {/* TABS */}
            <div className={styles.categoryTabsBar}>
                {[
                    { id: "OVERVIEW", label: lang === "en" ? "Overview" : "Tổng quan", icon: BarChart3 },
                    { id: "SALES", label: lang === "en" ? "Sales" : "Doanh thu", icon: Sparkles },
                    { id: "MACHINES", label: lang === "en" ? "Stations" : "Đội máy", icon: Cpu },
                    { id: "PRODUCTS", label: lang === "en" ? "Products" : "Sản phẩm", icon: PieChart },
                    ...(currentRole === "PSA" ? [{ id: "AUDIT", label: lang === "en" ? "Audit Trail" : "Nhật ký", icon: ShieldCheck }] : []),
                ].map((t) => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} type="button" onClick={() => setActiveTab(t.id as ReportTab)} className={`${styles.categoryTabBtn} ${activeTab === t.id ? styles.categoryTabBtnActive : ""}`}>
                            <Icon size={14} /><span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* BIỂU ĐỒ XU HƯỚNG & THƯƠNG HIỆU */}
            {activeTab !== "AUDIT" && (
                <div className={styles.analyticsGrid2}>
                    <div className={styles.analyticsCard}>
                        <h3 className={styles.cardTitle} style={{ marginBottom: "0.75rem" }}>{lang === "en" ? "7-Day Revenue Trend" : "Xu hướng doanh thu 7 ngày"}</h3>
                        <div style={{ height: "165px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.55rem", alignItems: "end", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
                            {trendBars.map((b) => (
                                <div key={b.label} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.7rem", color: "#F5E6AD", marginBottom: "4px" }}>{(b.rev / 1000).toFixed(0)}k</span>
                                    <div style={{ width: "100%", height: `${b.pct}%`, background: "#D4AF37", borderRadius: "6px 6px 2px 2px" }} />
                                    <span style={{ fontSize: "0.7rem", color: "#94A3B8", marginTop: "5px" }}>{b.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.analyticsCard}>
                        <h3 className={styles.cardTitle} style={{ marginBottom: "0.75rem" }}>{lang === "en" ? "Revenue by Brand" : "Doanh thu theo thương hiệu"}</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "175px", overflowY: "auto" }}>
                            {brandBreakdown.map((item) => (
                                <div key={item.brand} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.7rem", borderRadius: "8px", background: "#0B0D14", fontSize: "0.82rem" }}>
                                    <strong>{item.brand}</strong>
                                    <strong style={{ color: "#F5E6AD" }}>{item.rev.toLocaleString("vi-VN")} VND ({item.sp})</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* BẢNG NHẬT KÝ (CHỈ PSA) HOẶC SỔ CÁI GIAO DỊCH */}
            {activeTab === "AUDIT" && currentRole === "PSA" ? (
                <div className={styles.tableCard}>
                    <h3 className={styles.cardTitle} style={{ marginBottom: "0.75rem" }}>{lang === "en" ? "System Audit Trail" : "Nhật ký kiểm toán hệ thống"}</h3>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>ID</th>
                                <th>{lang === "en" ? "Time" : "Thời điểm"}</th>
                                <th>{lang === "en" ? "Actor" : "Người thực hiện"}</th>
                                <th>{lang === "en" ? "Action" : "Hành động"}</th>
                                <th>{lang === "en" ? "Target" : "Đối tượng"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {auditLogs.slice(0, 25).map((log, i) => (
                                <tr key={log.id || i}>
                                    <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 700 }}>{log.id}</td>
                                    <td className={styles.tableCell} style={{ color: "#94A3B8" }}>{String(log.timestamp || "").replace("T", " ").slice(0, 19)}</td>
                                    <td className={styles.tableCell}><strong>{log.actor}</strong></td>
                                    <td className={styles.tableCell} style={{ color: "#34D399", fontWeight: 700 }}>{log.action}</td>
                                    <td className={styles.tableCell}>{log.entityId || log.target}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h3 className={styles.cardTitle}>
                            <FileSpreadsheet size={16} color="#D4AF37" style={{ display: "inline", marginRight: "6px" }} />
                            {lang === "en" ? `Report Ledger (${filteredReports.length})` : `Chi tiết báo cáo (${filteredReports.length})`}
                        </h3>
                        <button type="button" onClick={() => router.push("/transactions")} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.7rem", fontSize: "0.76rem" }}>
                            {lang === "en" ? "Open Transactions" : "Mở sổ giao dịch"}
                        </button>
                    </div>
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                            <tr>
                                <th>{lang === "en" ? "Order ID" : "Mã đơn"}</th>
                                <th>{lang === "en" ? "Time" : "Thời điểm"}</th>
                                <th>{lang === "en" ? "Station" : "Trạm"}</th>
                                <th>{lang === "en" ? "Brand" : "Thương hiệu"}</th>
                                <th>{lang === "en" ? "Product" : "Sản phẩm"}</th>
                                <th style={{ textAlign: "right" }}>{lang === "en" ? "Revenue" : "Doanh thu"}</th>
                                <th style={{ textAlign: "center" }}>{lang === "en" ? "Status" : "Trạng thái"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredReports.map((row) => (
                                <tr key={row.id}>
                                    <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 700 }}>{row.id}</td>
                                    <td className={styles.tableCell} style={{ color: "#94A3B8" }}>{row.timestamp}</td>
                                    <td className={styles.tableCell}><strong>{row.kioskCode}</strong></td>
                                    <td className={styles.tableCell}>{row.brand}</td>
                                    <td className={styles.tableCell}><strong>{row.productName}</strong></td>
                                    <td className={styles.tableCell} style={{ textAlign: "right", fontWeight: 700, color: row.amountVnd > 0 ? "#F5E6AD" : "#F87171" }}>{row.amountVnd.toLocaleString("vi-VN")} VND</td>
                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                            <span className={row.status === "DISPENSED" || row.status === "PAID" ? styles.badgeSuccess : row.status === "REFUNDED" || row.status === "UNCERTAIN" ? styles.badgeWarning : styles.badgeFailed}>
                                                {row.status === "DISPENSED" || row.status === "PAID" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                <span>{formatStatus(row.status)}</span>
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
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