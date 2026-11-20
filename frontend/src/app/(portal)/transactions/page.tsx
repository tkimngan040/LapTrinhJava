// noinspection SpellCheckingInspection
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    Download,
    RefreshCw,
    CheckCircle2,
    AlertOctagon,
    Clock,
    Eye,
    RotateCcw,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Check,
    Globe,
    X,
    Sparkles,
    HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./transactions.module.css";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

export type TxLifecycleStatus =
    | "DISPENSED"
    | "PAID"
    | "PENDING"
    | "FAILED"
    | "UNCERTAIN"
    | "REFUND_PENDING"
    | "REFUNDED"
    | "CANCELLED"
    | "EXPIRED";

export interface TransactionLedgerItem {
    id: string;
    dateStr: string;
    timestamp: string;
    kioskCode: string;
    location: string;
    brand: string;
    productName: string;
    slotNumber: number;
    physicalSlotLabel: string;
    priceSnapshot: number;
    recognizedAmount: number;
    paidAmount: number;
    volumeDeductedMl: number;
    paymentMethod: "VietQR" | "MoMo" | "VNPay" | "ZaloPay";
    providerReference: string;
    commandReference: string;
    status: TxLifecycleStatus;
    failureReason: string | null;
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

const isExactMatch = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

function buildSeedTransactions(): TransactionLedgerItem[] {
    const today = toLocalYmd(new Date());
    const d1 = addDaysToYmd(today, -1);
    const d3 = addDaysToYmd(today, -3);
    const d5 = addDaysToYmd(today, -5);

    return [
        { id: "TXN-2026-9101", dateStr: today, timestamp: `${today} 10:15:20`, kioskCode: "demo-device", location: "Diamond Plaza Atrium", brand: "Creed", productName: "Creed Aventus", slotNumber: 1, physicalSlotLabel: "Slot 01", priceSnapshot: 20000, recognizedAmount: 20000, paidAmount: 20000, volumeDeductedMl: 0.12, paymentMethod: "VietQR", providerReference: "PAY-VIETQR-9101", commandReference: "CMD-9101", status: "DISPENSED", failureReason: null },
        { id: "TXN-2026-9102", dateStr: today, timestamp: `${today} 11:02:45`, kioskCode: "KIOSK-SGN-01", location: "Saigon Centre Takashimaya", brand: "Chanel", productName: "Bleu de Chanel", slotNumber: 3, physicalSlotLabel: "Slot 03", priceSnapshot: 15000, recognizedAmount: 15000, paidAmount: 15000, volumeDeductedMl: 0.12, paymentMethod: "MoMo", providerReference: "PAY-MOMO-9102", commandReference: "CMD-9102", status: "DISPENSED", failureReason: null },
        { id: "TXN-2026-9103", dateStr: d1, timestamp: `${d1} 14:30:10`, kioskCode: "demo-device", location: "Diamond Plaza Atrium", brand: "Maison Francis Kurkdjian", productName: "MFK Baccarat Rouge 540", slotNumber: 4, physicalSlotLabel: "Slot 04", priceSnapshot: 21000, recognizedAmount: 0, paidAmount: 21000, volumeDeductedMl: 0, paymentMethod: "VNPay", providerReference: "PAY-VNPAY-9103", commandReference: "CMD-9103", status: "UNCERTAIN", failureReason: "Quá hạn phản hồi từ máy sau lệnh ACK — cần OM rà soát." },
        { id: "TXN-2026-9104", dateStr: d3, timestamp: `${d3} 16:40:00`, kioskCode: "KIOSK-004", location: "Aeon Mall Tân Phú", brand: "Versace", productName: "Versace Bright Crystal", slotNumber: 3, physicalSlotLabel: "Slot 03", priceSnapshot: 11500, recognizedAmount: 0, paidAmount: 11500, volumeDeductedMl: 0, paymentMethod: "VietQR", providerReference: "PAY-VIETQR-9104", commandReference: "CMD-9104", status: "FAILED", failureReason: "Cảm biến khóa an toàn ngắt lệnh phun — đủ điều kiện chuyển duyệt hoàn tiền." },
        { id: "TXN-2026-9105", dateStr: d5, timestamp: `${d5} 18:12:05`, kioskCode: "KIOSK-HN-01", location: "Lotte West Lake", brand: "Dior", productName: "Dior Sauvage", slotNumber: 3, physicalSlotLabel: "Slot 03", priceSnapshot: 14500, recognizedAmount: 14500, paidAmount: 14500, volumeDeductedMl: 0.12, paymentMethod: "ZaloPay", providerReference: "PAY-ZALO-9105", commandReference: "CMD-9105", status: "DISPENSED", failureReason: null },
    ];
}

const DASHBOARD_STORAGE_KEY = "scentstation_commercial_dashboard_v2";
const AUDIT_LOGS_STORAGE_KEY = "scentstation_audit_logs_v2";
const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

type QuickDatePreset = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "LAST_30_DAYS" | "CUSTOM";

function normalizeGateway(raw?: string): TransactionLedgerItem["paymentMethod"] {
    const up = String(raw || "VIETQR").toUpperCase();
    if (up.includes("MOMO")) return "MoMo";
    if (up.includes("VNPAY")) return "VNPay";
    if (up.includes("ZALO")) return "ZaloPay";
    return "VietQR";
}

export default function TransactionsPage() {
    const router = useRouter();
    const filterBarRef = useRef<HTMLDivElement | null>(null);
    const todayYmd = useMemo(() => toLocalYmd(new Date()), []);
    const defaultStart30d = useMemo(() => addDaysToYmd(todayYmd, -29), [todayYmd]);

    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [currentRole, setCurrentRole] = useState<InternalRole>("PSA");
    const [actorName, setActorName] = useState<string>("Platform Super Administrator");
    const [lockedBrandScope, setLockedBrandScope] = useState<string | null>(null);

    const [transactions, setTransactions] = useState<TransactionLedgerItem[]>(() => buildSeedTransactions());
    const [startDate, setStartDate] = useState<string>(defaultStart30d);
    const [endDate, setEndDate] = useState<string>(todayYmd);
    const [datePreset, setDatePreset] = useState<QuickDatePreset>("LAST_30_DAYS");
    const [calendarViewYear, setCalendarViewYear] = useState<number>(() => new Date().getFullYear());
    const [calendarViewMonth, setCalendarViewMonth] = useState<number>(() => new Date().getMonth());
    const [selectingEdge, setSelectingEdge] = useState<"START" | "END">("START");

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [brandFilter, setBrandFilter] = useState<string>("ALL");
    const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
    const [viewTab, setViewTab] = useState<"ALL" | "NEEDS_REVIEW">("ALL");

    const [openDropdown, setOpenDropdown] = useState<"CALENDAR" | "STATUS" | "BRAND" | "PAYMENT" | null>(null);
    const [selectedTx, setSelectedTx] = useState<TransactionLedgerItem | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Quyền chuẩn theo src/lib/rbac.ts
    const roleConfig = ROLE_PERMISSIONS[currentRole];
    const canReconcile = currentRole === "OM";
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

    const formatStatus = (st: TxLifecycleStatus) => {
        const map: Record<TxLifecycleStatus, { en: string; vi: string }> = {
            DISPENSED: { en: "Dispensed", vi: "Đã phun" },
            PAID: { en: "Paid", vi: "Đã trả" },
            PENDING: { en: "Pending", vi: "Đang chờ" },
            FAILED: { en: "Failed", vi: "Thất bại" },
            UNCERTAIN: { en: "Uncertain", vi: "Chờ đối soát" },
            REFUND_PENDING: { en: "Refund Pending", vi: "Chờ duyệt hoàn tiền" },
            REFUNDED: { en: "Refunded", vi: "Đã hoàn tiền" },
            CANCELLED: { en: "Cancelled", vi: "Đã hủy" },
            EXPIRED: { en: "Expired", vi: "Hết hạn" },
        };
        return map[st][lang];
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

    const loadTransactions = useCallback(() => {
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
                setActorName(parsedUser.fullName || parsedUser.name || ROLE_PERMISSIONS[resolvedRole].label);
                const scope = parsedUser.brandScope || parsedUser.brand || null;
                if (resolvedRole === "BA" && scope) {
                    setLockedBrandScope(scope);
                    setBrandFilter(scope);
                } else {
                    setLockedBrandScope(null);
                }
            }

            const seedList = buildSeedTransactions();
            const rawDash = localStorage.getItem(DASHBOARD_STORAGE_KEY);
            if (rawDash) {
                const parsedDash = JSON.parse(rawDash);
                if (Array.isArray(parsedDash.transactions) && parsedDash.transactions.length > 0) {
                    const liveMapped: TransactionLedgerItem[] = parsedDash.transactions.map((tx: any, idx: number) => {
                        const rawSt = String(tx.status || "DISPENSED").toUpperCase() as TxLifecycleStatus;
                        const dStr = String(tx.createdAt || "").includes("T") ? String(tx.createdAt).split("T")[0] : todayYmd;
                        const priceSnap = Number(tx.priceSnapshot ?? tx.amount ?? tx.paidAmount ?? 15000);
                        const gw = normalizeGateway(tx.paymentMethod);
                        return {
                            id: String(tx.id || `ORD-2026-${9200 + idx}`),
                            dateStr: dStr,
                            timestamp: tx.timestamp || tx.time || dStr,
                            kioskCode: tx.kiosk || tx.kioskCode || "demo-device",
                            location: tx.location || "Diamond Plaza Atrium",
                            brand: tx.brand || "Chanel",
                            productName: tx.product || tx.productName || "Signature Scent",
                            slotNumber: Number(tx.slotNumber || 1),
                            physicalSlotLabel: `Slot 0${((Number(tx.slotNumber || 1) - 1) % 4) + 1}`,
                            priceSnapshot: priceSnap,
                            recognizedAmount: rawSt === "DISPENSED" || rawSt === "PAID" ? priceSnap : 0,
                            paidAmount: rawSt === "CANCELLED" || rawSt === "EXPIRED" ? 0 : priceSnap,
                            volumeDeductedMl: rawSt === "DISPENSED" ? 0.12 : 0,
                            paymentMethod: gw,
                            providerReference: tx.providerReference || `PAY-${gw.toUpperCase()}-${tx.id}`,
                            commandReference: tx.commandReference || `CMD-${tx.id}`,
                            status: rawSt,
                            failureReason: tx.failureReason || null,
                        };
                    });
                    const seen = new Set<string>();
                    const merged: TransactionLedgerItem[] = [];
                    [...liveMapped, ...seedList].forEach((item) => {
                        if (!seen.has(item.id)) {
                            seen.add(item.id);
                            merged.push(item);
                        }
                    });
                    setTransactions(merged);
                    return;
                }
            }
            setTransactions(seedList);
        } catch {
            // Safe fallback
        }
    }, [todayYmd]);

    useEffect(() => {
        loadTransactions();
        const handleSync = () => loadTransactions();
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("scentstation-sync", handleSync);
        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("scentstation-sync", handleSync);
        };
    }, [loadTransactions]);

    const handleReconcile = (targetTx: TransactionLedgerItem, resolution: "CONFIRM_DISPENSED" | "REQUEST_REFUND") => {
        if (!canReconcile) return;
        const nextStatus: TxLifecycleStatus = resolution === "CONFIRM_DISPENSED" ? "DISPENSED" : "REFUND_PENDING";
        const updated = transactions.map((t) =>
            t.id === targetTx.id
                ? {
                    ...t,
                    status: nextStatus,
                    recognizedAmount: nextStatus === "DISPENSED" ? t.priceSnapshot : 0,
                    volumeDeductedMl: nextStatus === "DISPENSED" ? 0.12 : 0,
                    failureReason:
                        nextStatus === "REFUND_PENDING"
                            ? lang === "en"
                                ? `Escalated for refund approval by ${actorName}.`
                                : `Đã chuyển quy trình duyệt hoàn tiền bởi ${actorName}.`
                            : null,
                }
                : t
        );
        setTransactions(updated);
        if (selectedTx?.id === targetTx.id) {
            setSelectedTx(updated.find((u) => u.id === targetTx.id) || null);
        }

        try {
            const rawAudit = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
            const auditList = rawAudit ? JSON.parse(rawAudit) : [];
            auditList.unshift({
                id: `AUD-${Date.now().toString().slice(-4)}`,
                timestamp: new Date().toISOString(),
                actor: actorName,
                role: currentRole,
                tenant: targetTx.brand,
                action: resolution === "CONFIRM_DISPENSED" ? "ORDER_RECONCILED_DISPENSED" : "ORDER_REFUND_REQUESTED",
                entityType: "ORDERS",
                entityId: targetTx.id,
                severity: "INFO",
                sourceIp: "127.0.0.1",
            });
            localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(auditList.slice(0, 250)));
        } catch {
            // Safe fallback
        }

        showToast(
            resolution === "CONFIRM_DISPENSED"
                ? lang === "en" ? `Order ${targetTx.id} confirmed as Dispensed.` : `Đã xác nhận đơn ${targetTx.id} đã phun.`
                : lang === "en" ? `Order ${targetTx.id} queued for refund approval.` : `Đã chuyển đơn ${targetTx.id} sang chờ duyệt hoàn tiền.`
        );
    };

    const uniqueBrands = useMemo(() => Array.from(new Set(transactions.map((t) => t.brand))).sort(), [transactions]);
    const effectiveBrand = lockedBrandScope || brandFilter;

    const filteredTransactions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return transactions.filter((tx) => {
            const matchDate = tx.dateStr >= startDate && tx.dateStr <= endDate;
            const matchStatus = statusFilter === "ALL" || tx.status === statusFilter;
            const matchTab =
                viewTab !== "NEEDS_REVIEW" ||
                tx.status === "UNCERTAIN" ||
                tx.status === "FAILED" ||
                tx.status === "REFUND_PENDING";
            const matchBrand = effectiveBrand === "ALL" || isExactMatch(tx.brand, effectiveBrand);
            const matchPayment = paymentFilter === "ALL" || tx.paymentMethod === paymentFilter;
            const matchSearch =
                !q ||
                tx.id.toLowerCase().includes(q) ||
                tx.productName.toLowerCase().includes(q) ||
                tx.brand.toLowerCase().includes(q) ||
                tx.kioskCode.toLowerCase().includes(q) ||
                tx.providerReference.toLowerCase().includes(q);
            return matchDate && matchStatus && matchTab && matchBrand && matchPayment && matchSearch;
        });
    }, [transactions, startDate, endDate, statusFilter, viewTab, effectiveBrand, paymentFilter, searchQuery]);

    const summaryMetrics = useMemo(() => {
        const dispensed = filteredTransactions.filter((t) => t.status === "DISPENSED" || t.status === "PAID");
        const totalRevenue = dispensed.reduce((s, t) => s + t.recognizedAmount, 0);
        const reviewCount = filteredTransactions.filter((t) => t.status === "UNCERTAIN" || t.status === "FAILED" || t.status === "REFUND_PENDING").length;
        return {
            total: filteredTransactions.length,
            dispensedCount: dispensed.length,
            totalRevenue,
            reviewCount,
        };
    }, [filteredTransactions]);

    const handleExportCSV = () => {
        if (!canExport) return;
        const header = "ID;Time;Station;Brand;Product;Payment;Amount;Status\n";
        const rows = filteredTransactions
            .map((t) => `"${t.id}";"${t.timestamp}";"${t.kioskCode}";"${t.brand}";"${t.productName}";"${t.paymentMethod}";"${t.recognizedAmount}";"${t.status}"`)
            .join("\n");
        const blob = new Blob(["\ufeff" + header + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "ScentStation_Transactions.csv";
        link.click();
        showToast(lang === "en" ? `Exported ${filteredTransactions.length} rows.` : `Đã xuất ${filteredTransactions.length} giao dịch ra CSV.`);
    };

    const renderStatusBadge = (st: TxLifecycleStatus) => {
        if (st === "DISPENSED" || st === "PAID") return <span className={styles.badgeSuccess}><CheckCircle2 size={12} /> {formatStatus(st)}</span>;
        if (st === "PENDING" || st === "UNCERTAIN" || st === "REFUND_PENDING" || st === "REFUNDED") return <span className={styles.badgeWarning}><Clock size={12} /> {formatStatus(st)}</span>;
        return <span className={styles.badgeFailed}><AlertOctagon size={12} /> {formatStatus(st)}</span>;
    };

    return (
        <div className={`${styles.container} notranslate`} translate="no" onClick={() => setOpenDropdown(null)}>
            <div className={styles.heroBannerCard}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{lang === "en" ? "Transactions" : "Giao dịch & Đối soát"}</h1>
                        <div className={styles.scopeBadge}>
                            <span>{roleConfig.label}</span>
                            {lockedBrandScope && <span>• {lockedBrandScope}</span>}
                        </div>
                    </div>

                    <div className={styles.headerActions} onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={handleToggleLanguage} className={styles.secondaryGoldBtn}>
                            <Globe size={14} color="#D4AF37" />
                            <span>{lang === "en" ? "EN" : "VI"}</span>
                        </button>

                        {canExport && (
                            <button type="button" onClick={handleExportCSV} className={styles.primaryGoldBtn}>
                                <Download size={14} />
                                <span>{lang === "en" ? "Export CSV" : "Xuất CSV"}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.kpiGrid4}>
                    <div className={`${styles.kpiCard} ${viewTab === "ALL" && statusFilter === "ALL" ? styles.kpiCardActive : ""}`} onClick={() => { setViewTab("ALL"); setStatusFilter("ALL"); }}>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Total Orders" : "Tổng đơn hàng"}</div>
                        <div style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0.25rem 0" }}>{summaryMetrics.total}</div>
                    </div>

                    <div className={`${styles.kpiCard} ${statusFilter === "DISPENSED" ? styles.kpiCardActive : ""}`} onClick={() => { setViewTab("ALL"); setStatusFilter(statusFilter === "DISPENSED" ? "ALL" : "DISPENSED"); }}>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Recognized Revenue" : "Doanh thu ghi nhận"}</div>
                        <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#F5E6AD", margin: "0.25rem 0" }}>{summaryMetrics.totalRevenue.toLocaleString("vi-VN")} VND</div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Verified Dispenses" : "Đã phun thành công"}</div>
                        <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#34D399", margin: "0.25rem 0" }}>{summaryMetrics.dispensedCount}</div>
                    </div>

                    <div className={`${styles.kpiCard} ${viewTab === "NEEDS_REVIEW" ? styles.kpiCardActive : ""}`} onClick={() => setViewTab(viewTab === "NEEDS_REVIEW" ? "ALL" : "NEEDS_REVIEW")}>
                        <div style={{ fontSize: "0.76rem", color: "#94A3B8", fontWeight: 600 }}>{lang === "en" ? "Needs Review" : "Cần đối soát"}</div>
                        <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#FBBF24", margin: "0.25rem 0" }}>{summaryMetrics.reviewCount}</div>
                    </div>
                </div>
            </div>

            {/* BỘ LỌC */}
            <div className={styles.filterBar} ref={filterBarRef} onClick={(e) => e.stopPropagation()}>
                <div className={styles.filterRowTop}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={lang === "en" ? "Search order ID, station, product, ref..." : "Tìm mã đơn, trạm, sản phẩm, mã thanh toán..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.6rem", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}><X size={14} /></button>
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
                            <span>{statusFilter === "ALL" ? (lang === "en" ? "All Status" : "Mọi trạng thái") : formatStatus(statusFilter as TxLifecycleStatus)}</span>
                            <ChevronDown size={13} color="#D4AF37" />
                        </button>
                        {openDropdown === "STATUS" && (
                            <div className={styles.customDropdownMenu} style={{ right: 0, left: "auto" }}>
                                {(["ALL", "DISPENSED", "UNCERTAIN", "FAILED", "REFUND_PENDING", "REFUNDED"] as const).map((st) => (
                                    <button key={st} type="button" onClick={() => { setStatusFilter(st); setOpenDropdown(null); }} className={`${styles.customDropdownItem} ${statusFilter === st ? styles.customDropdownItemActive : ""}`}>
                                        <span>{st === "ALL" ? (lang === "en" ? "All Status" : "Mọi trạng thái") : formatStatus(st)}</span>
                                        {statusFilter === st && <Check size={13} color="#D4AF37" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* THƯƠNG HIỆU (ẨN VỚI BA) */}
                    {!lockedBrandScope && (
                        <div className={styles.customDropdownWrap}>
                            <button type="button" onClick={() => setOpenDropdown(openDropdown === "BRAND" ? null : "BRAND")} className={styles.customDropdownTrigger}>
                                <span>{brandFilter === "ALL" ? (lang === "en" ? "All Brands" : "Tất cả thương hiệu") : brandFilter}</span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "BRAND" && (
                                <div className={styles.customDropdownMenu} style={{ right: 0, left: "auto" }}>
                                    <button type="button" onClick={() => { setBrandFilter("ALL"); setOpenDropdown(null); }} className={styles.customDropdownItem}>{lang === "en" ? "All Brands" : "Tất cả thương hiệu"}</button>
                                    {uniqueBrands.map((b) => (
                                        <button key={b} type="button" onClick={() => { setBrandFilter(b); setOpenDropdown(null); }} className={styles.customDropdownItem}>{b}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <div className={styles.customDropdownWrap}>
                            <button type="button" onClick={() => setOpenDropdown(openDropdown === "PAYMENT" ? null : "PAYMENT")} className={styles.customDropdownTrigger}>
                                <span>{paymentFilter === "ALL" ? (lang === "en" ? "All Gateways" : "Mọi cổng QR") : paymentFilter}</span>
                                <ChevronDown size={13} color="#D4AF37" />
                            </button>
                            {openDropdown === "PAYMENT" && (
                                <div className={styles.customDropdownMenu} style={{ right: 0, left: "auto", minWidth: "160px" }}>
                                    {(["ALL", "VietQR", "MoMo", "VNPay", "ZaloPay"] as const).map((pm) => (
                                        <button key={pm} type="button" onClick={() => { setPaymentFilter(pm); setOpenDropdown(null); }} className={styles.customDropdownItem}>
                                            {pm === "ALL" ? (lang === "en" ? "All Gateways" : "Mọi cổng QR") : pm}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="button" onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); if (!lockedBrandScope) setBrandFilter("ALL"); setPaymentFilter("ALL"); setViewTab("ALL"); handleApplyDatePreset("LAST_30_DAYS"); }} className={styles.secondaryGoldBtn}>
                            <RefreshCw size={13} />
                            <span>{lang === "en" ? "Clear" : "Xóa lọc"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className={styles.viewTabsBar}>
                <button type="button" onClick={() => setViewTab("ALL")} className={`${styles.viewTabBtn} ${viewTab === "ALL" ? styles.viewTabBtnActive : ""}`}>
                    <Sparkles size={14} />
                    <span>{lang === "en" ? `All (${filteredTransactions.length})` : `Tất cả (${filteredTransactions.length})`}</span>
                </button>
                <button type="button" onClick={() => setViewTab("NEEDS_REVIEW")} className={`${styles.viewTabBtn} ${viewTab === "NEEDS_REVIEW" ? styles.viewTabBtnActive : ""}`}>
                    <HelpCircle size={14} />
                    <span>{lang === "en" ? `Reconciliation (${summaryMetrics.reviewCount})` : `Cần đối soát (${summaryMetrics.reviewCount})`}</span>
                </button>
            </div>

            {/* BẢNG GIAO DỊCH */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>{lang === "en" ? "Order ID" : "Mã đơn"}</th>
                            <th>{lang === "en" ? "Time" : "Thời điểm"}</th>
                            <th>{lang === "en" ? "Product" : "Sản phẩm"}</th>
                            <th>{lang === "en" ? "Station" : "Trạm"}</th>
                            <th>{lang === "en" ? "Payment" : "Thanh toán"}</th>
                            <th style={{ textAlign: "right" }}>{lang === "en" ? "Revenue" : "Doanh thu"}</th>
                            <th style={{ textAlign: "center" }}>{lang === "en" ? "Status" : "Trạng thái"}</th>
                            <th style={{ textAlign: "right" }}>{lang === "en" ? "Actions" : "Thao tác"}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className={styles.tableRow} onClick={() => setSelectedTx(tx)}>
                                <td className={styles.tableCell} style={{ color: "#F5E6AD", fontWeight: 700 }}>{tx.id}</td>
                                <td className={styles.tableCell} style={{ color: "#94A3B8", fontSize: "0.78rem" }}>{tx.timestamp}</td>
                                <td className={styles.tableCell}>
                                    <strong>{tx.productName}</strong>
                                    <div style={{ fontSize: "0.74rem", color: "#D4AF37" }}>{tx.brand}</div>
                                </td>
                                <td className={styles.tableCell}>
                                    <strong>{tx.kioskCode}</strong>
                                    <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>{tx.physicalSlotLabel}</div>
                                </td>
                                <td className={styles.tableCell}>
                                    <strong>{tx.paymentMethod}</strong>
                                    <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{tx.providerReference}</div>
                                </td>
                                <td className={styles.tableCell} style={{ textAlign: "right", fontWeight: 700, color: tx.recognizedAmount > 0 ? "#F5E6AD" : "#F87171" }}>
                                    {tx.recognizedAmount.toLocaleString("vi-VN")} VND
                                </td>
                                <td className={styles.tableCell} style={{ textAlign: "center" }}>{renderStatusBadge(tx.status)}</td>
                                <td className={styles.tableCell} style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                                    <button type="button" onClick={() => setSelectedTx(tx)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.6rem" }}>
                                        <Eye size={13} color="#D4AF37" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CHI TIẾT & ĐỐI SOÁT */}
            {selectedTx && (
                <div className={styles.modalOverlay} onClick={() => setSelectedTx(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>{selectedTx.id}</h3>
                            <button type="button" onClick={() => setSelectedTx(null)} className={styles.secondaryGoldBtn} style={{ padding: "0.35rem 0.5rem" }}><X size={15} /></button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.86rem", marginBottom: "1.1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Status" : "Trạng thái"}:</span>{renderStatusBadge(selectedTx.status)}</div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Product" : "Sản phẩm"}:</span><strong>{selectedTx.brand} — {selectedTx.productName}</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Station" : "Trạm"}:</span><strong>{selectedTx.kioskCode} ({selectedTx.physicalSlotLabel})</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Payment Ref" : "Mã thanh toán"}:</span><strong>{selectedTx.paymentMethod} • {selectedTx.providerReference}</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Price Snapshot" : "Giá chốt đơn"}:</span><strong style={{ color: "#F5E6AD" }}>{selectedTx.priceSnapshot.toLocaleString("vi-VN")} VND</strong></div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94A3B8" }}>{lang === "en" ? "Recognized" : "Doanh thu ghi nhận"}:</span><strong style={{ color: selectedTx.recognizedAmount > 0 ? "#34D399" : "#F87171" }}>{selectedTx.recognizedAmount.toLocaleString("vi-VN")} VND</strong></div>
                            {selectedTx.failureReason && (
                                <div style={{ padding: "0.7rem", borderRadius: "9px", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)", color: "#FCA5A5", fontSize: "0.8rem" }}>
                                    {selectedTx.failureReason}
                                </div>
                            )}
                        </div>

                        {canReconcile && (selectedTx.status === "UNCERTAIN" || selectedTx.status === "FAILED") && (
                            <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.75rem" }}>
                                <button type="button" onClick={() => handleReconcile(selectedTx, "CONFIRM_DISPENSED")} className={styles.primaryGoldBtn} style={{ flex: 1 }}>
                                    <CheckCircle2 size={14} />
                                    <span>{lang === "en" ? "Confirm Dispensed" : "Xác nhận đã phun"}</span>
                                </button>
                                <button type="button" onClick={() => handleReconcile(selectedTx, "REQUEST_REFUND")} className={styles.secondaryGoldBtn} style={{ flex: 1, color: "#F87171" }}>
                                    <RotateCcw size={14} />
                                    <span>{lang === "en" ? "Request Refund" : "Chuyển duyệt hoàn tiền"}</span>
                                </button>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.6rem" }}>
                            <button type="button" onClick={() => router.push(`/machines/${encodeURIComponent(selectedTx.kioskCode)}`)} className={styles.secondaryGoldBtn} style={{ flex: 1 }}>
                                {lang === "en" ? "View Station" : "Xem trạm"}
                            </button>
                            <button type="button" onClick={() => setSelectedTx(null)} className={styles.primaryGoldBtn} style={{ flex: 1 }}>
                                {lang === "en" ? "Close" : "Đóng"}
                            </button>
                        </div>
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