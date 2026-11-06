"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Activity, ArrowUpRight, Search, ChevronDown, CheckCircle2, AlertOctagon } from "lucide-react";
import RealTimeChart from "./RealTimeChart";
import styles from "./dashboard.module.css";

interface Transaction {
    id: string;
    kiosk: string;
    brand: string;
    product: string;
    amount: number; // Giá xịt chuẩn thực tế đồng bộ từ danh mục sản phẩm
    status: string;
    dateType: "TODAY" | "7D" | "30D";
}

const initialTransactions: Transaction[] = [
    { id: "TXN-9021", kiosk: "KIOSK-001", brand: "Giorgio Armani", product: "Acqua Di Gio", amount: 12000, status: "SUCCESS", dateType: "TODAY" },
    { id: "TXN-9022", kiosk: "KIOSK-002", brand: "Chanel", product: "Bleu de Chanel", amount: 15000, status: "SUCCESS", dateType: "TODAY" },
    { id: "TXN-9023", kiosk: "KIOSK-005", brand: "Creed", product: "Creed Aventus", amount: 25000, status: "SUCCESS", dateType: "7D" },
    { id: "TXN-9024", kiosk: "KIOSK-003", brand: "Dior", product: "Dior Sauvage", amount: 14000, status: "SUCCESS", dateType: "7D" },
    { id: "TXN-9025", kiosk: "KIOSK-001", brand: "Maison Francis Kurkdjian", product: "MFK Baccarat Rouge 540", amount: 30000, status: "SUCCESS", dateType: "30D" },
    { id: "TXN-9026", kiosk: "KIOSK-004", brand: "Tom Ford", product: "Tom Ford Black Orchid", amount: 20000, status: "SUCCESS", dateType: "30D" },
    { id: "TXN-9027", kiosk: "KIOSK-002", brand: "Le Labo", product: "Le Labo Another 13", amount: 22000, status: "SUCCESS", dateType: "30D" },
    { id: "TXN-9028", kiosk: "KIOSK-006", brand: "Parfums de Marly", product: "Parfums de Marly Sedley", amount: 24000, status: "SUCCESS", dateType: "7D" },
];

const activeAlerts = [
    { id: "ALT-401", kiosk: "KIOSK-004", location: "Aeon Tan Phu", type: "OFFLINE_TIMEOUT", severity: "CRITICAL", time: "12 mins ago" },
    { id: "ALT-402", kiosk: "KIOSK-002", location: "Takashimaya Q.1", type: "LOW_STOCK_SLOT_3", severity: "WARNING", time: "45 mins ago" },
];

export default function DashboardPage() {
    const [userRole] = useState<string>("VIEWER");
    const [searchQuery, setSearchQuery] = useState("");

    const [selectedBrand, setSelectedBrand] = useState("ALL");
    const [brandOpen, setBrandOpen] = useState(false);

    const [selectedDateRange, setSelectedDateRange] = useState("TODAY");
    const [dateOpen, setDateOpen] = useState(false);

    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [isUpdatingLive, setIsUpdatingLive] = useState(false);
    const [successRate, setSuccessRate] = useState(99.5);
    const [kioskStatus, setKioskStatus] = useState<"OFFLINE" | "REBOOTING" | "ONLINE">("OFFLINE");
    const [activeModal, setActiveModal] = useState<"DIAGNOSTICS" | "INCIDENT" | null>(null);
    const [rebootMessage, setRebootMessage] = useState<string | null>(null);

    const brandOptions = [
        { label: "All Brands (Fleet-wide)", value: "ALL" },
        { label: "Giorgio Armani", value: "Giorgio Armani" },
        { label: "Chanel", value: "Chanel" },
        { label: "Creed", value: "Creed" },
        { label: "Dior", value: "Dior" },
        { label: "Maison Francis Kurkdjian", value: "Maison Francis Kurkdjian" },
        { label: "Tom Ford", value: "Tom Ford" },
        { label: "Le Labo", value: "Le Labo" },
        { label: "Parfums de Marly", value: "Parfums de Marly" },
    ];

    const dateOptions = [
        { label: "Today", value: "TODAY" },
        { label: "Past 7 Days (Dynamic Aggregate)", value: "7D" },
        { label: "Past 30 Days (Dynamic Aggregate)", value: "30D" },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            const exactProductCatalog = [
                { brand: "Giorgio Armani", product: "Acqua Di Gio", amount: 12000, kiosk: "KIOSK-001" },
                { brand: "Chanel", product: "Bleu de Chanel", amount: 15000, kiosk: "KIOSK-002" },
                { brand: "Creed", product: "Creed Aventus", amount: 25000, kiosk: "KIOSK-005" },
                { brand: "Dior", product: "Dior Sauvage", amount: 14000, kiosk: "KIOSK-003" },
                { brand: "Maison Francis Kurkdjian", product: "MFK Baccarat Rouge 540", amount: 30000, kiosk: "KIOSK-001" },
                { brand: "Tom Ford", product: "Tom Ford Black Orchid", amount: 20000, kiosk: "KIOSK-004" },
                { brand: "Le Labo", product: "Le Labo Another 13", amount: 22000, kiosk: "KIOSK-002" },
                { brand: "Parfums de Marly", product: "Parfums de Marly Sedley", amount: 24000, kiosk: "KIOSK-006" },
            ];
            const chosen = exactProductCatalog[Math.floor(Math.random() * exactProductCatalog.length)];
            const newTxId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;

            const newTx: Transaction = {
                id: newTxId,
                kiosk: chosen.kiosk,
                brand: chosen.brand,
                product: chosen.product,
                amount: chosen.amount,
                status: "SUCCESS",
                dateType: "TODAY"
            };

            setTransactions((prev) => [newTx, ...prev]);
            setIsUpdatingLive(true);
            setTimeout(() => setIsUpdatingLive(false), 1000);

            setSuccessRate(+(99.0 + Math.random() * 0.8).toFixed(1));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleTriggerReboot = () => {
        setKioskStatus("REBOOTING");
        setRebootMessage("Sending secure MQTT payload to KIOSK-004 (Aeon Tan Phu)...");
        setTimeout(() => {
            setKioskStatus("ONLINE");
            setRebootMessage("Kiosk successfully rebooted! Hardware telemetry re-established.");
        }, 3000);
    };

    const getFilteredTransactionsByDate = () => {
        return transactions.filter(tx => {
            if (selectedDateRange === "TODAY") return tx.dateType === "TODAY";
            if (selectedDateRange === "7D") return tx.dateType === "TODAY" || tx.dateType === "7D";
            return true;
        });
    };

    const rangeTransactions = getFilteredTransactionsByDate();

    const finalFilteredTransactions = rangeTransactions.filter(tx => {
        const matchesSearch = tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.kiosk.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBrand = selectedBrand === "ALL" || tx.brand === selectedBrand;
        return matchesSearch && matchesBrand;
    });

    const targetTransactionsForMetrics = rangeTransactions.filter(tx => selectedBrand === "ALL" || tx.brand === selectedBrand);
    const totalRevenueNum = targetTransactionsForMetrics.reduce((sum, tx) => sum + tx.amount, 0);
    const totalOrdersCount = targetTransactionsForMetrics.length;

    return (
        <div className={styles.container} onClick={() => { setBrandOpen(false); setDateOpen(false); }}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Executive Analytics Dashboard</h1>
                    <p className={styles.subtitle}>Real-time telemetry and exact catalog-priced experience aggregation across the ScentStation IoT fleet.</p>
                </div>
                {userRole === "VIEWER" && (
                    <div className={styles.viewerBadge}>
                        <span className={styles.viewerBadgeDot} />
                        <span>Secure Viewer Portal &bull; Read-Only</span>
                    </div>
                )}
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search machine name, luxury product, or transaction ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.customSelectWrapper}>
                    <div className={styles.customSelectHeader} onClick={() => { setDateOpen(!dateOpen); setBrandOpen(false); }}>
                        <span>{dateOptions.find(o => o.value === selectedDateRange)?.label}</span>
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                    </div>
                    {dateOpen && (
                        <div className={styles.customDropdownList}>
                            {dateOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`${styles.customDropdownItem} ${selectedDateRange === opt.value ? styles.customDropdownItemSelected : ''}`}
                                    onClick={() => { setSelectedDateRange(opt.value); setDateOpen(false); }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.customSelectWrapper}>
                    <div className={styles.customSelectHeader} onClick={() => { setBrandOpen(!brandOpen); setDateOpen(false); }}>
                        <span>{brandOptions.find(o => o.value === selectedBrand)?.label}</span>
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                    </div>
                    {brandOpen && (
                        <div className={styles.customDropdownList}>
                            {brandOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`${styles.customDropdownItem} ${selectedBrand === opt.value ? styles.customDropdownItemSelected : ''}`}
                                    onClick={() => { setSelectedBrand(opt.value); setBrandOpen(false); }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className={styles.statsGrid}>
                {/* 1. Revenue Card với nét biểu đồ ziczac chạy từ dưới lên */}
                <div className={styles.statCard}>
                    <div>
                        <p className={styles.statLabel}>REVENUE ({selectedDateRange})</p>
                        <p className={`${styles.statValue} ${isUpdatingLive ? "text-amber-300 scale-105 transition-transform" : ""}`}>
                            {totalRevenueNum.toLocaleString()} VND
                        </p>
                        <span className={styles.statTrend} style={{ color: "#34D399" }}>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {isUpdatingLive && selectedDateRange === "TODAY" ? "⚡ Exact catalog price added" : `Calculated from ${totalOrdersCount} verified orders`}
                        </span>
                    </div>
                    <div className={styles.statIconBox} style={{ color: "#D4AF37", background: "rgba(212, 175, 55, 0.1)" }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline className={styles.customTrendingLine} points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                        </svg>
                    </div>
                </div>

                {/* 2. Total Orders Card */}
                <div className={styles.statCard}>
                    <div>
                        <p className={styles.statLabel}>TOTAL ORDERS ({selectedDateRange})</p>
                        <p className={`${styles.statValue} ${isUpdatingLive ? "text-emerald-300 scale-105 transition-transform" : ""}`}>
                            {totalOrdersCount.toLocaleString()}
                        </p>
                        <span className={styles.statTrend}><ArrowUpRight className="w-3.5 h-3.5" /> Accurate volume count</span>
                    </div>
                    <div className={styles.statIconBox} style={{ color: "#4ADE80", background: "rgba(74, 222, 128, 0.1)" }}>
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                </div>

                {/* 3. Success Rate Card với sóng nhịp tim chạy */}
                <div className={styles.statCard}>
                    <div>
                        <p className={styles.statLabel}>SUCCESS RATE</p>
                        <p className={styles.statValue}>{successRate}%</p>
                        <span className={styles.statTrend} style={{ color: "#4ADE80" }}>Live pneumatic actuators stable</span>
                    </div>
                    <button
                        type="button"
                        className={styles.statIconBox}
                        style={{ color: "#60A5FA", background: "rgba(96, 165, 250, 0.1)", cursor: "pointer", border: "1px solid rgba(96,165,250,0.3)" }}
                        onClick={() => setActiveModal("DIAGNOSTICS")}
                        title="Click to run hardware diagnostics"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline className={styles.customActivityWave} points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                    </button>
                </div>

                {/* 4. Offline Kiosk Card với wifi sáng tuần tự từng nấc */}
                <div className={styles.statCard}>
                    <div>
                        <p className={styles.statLabel}>OFFLINE KIOSK / ACTION</p>
                        <p className={styles.statValue} style={{ color: kioskStatus === "ONLINE" ? "#4ADE80" : "#F87171" }}>
                            {kioskStatus === "ONLINE" ? "0 Kiosk" : "1 Kiosk"}
                        </p>
                        <span className={styles.statTrend} style={{ color: kioskStatus === "ONLINE" ? "#4ADE80" : "#F87171" }}>
                            {kioskStatus === "ONLINE" ? "All units operational" : "KIOSK-004 (Aeon Tan Phu)"}
                        </span>
                    </div>
                    <button
                        type="button"
                        className={styles.statIconBox}
                        style={{
                            color: kioskStatus === "ONLINE" ? "#4ADE80" : "#F87171",
                            background: kioskStatus === "ONLINE" ? "rgba(74,222,128,0.1)" : "rgba(248, 113, 113, 0.1)",
                            cursor: "pointer",
                            border: kioskStatus === "ONLINE" ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(248,113,113,0.3)"
                        }}
                        onClick={() => setActiveModal("INCIDENT")}
                        title="Click to inspect offline incident"
                    >
                        {kioskStatus === "ONLINE" ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="20" r="1" className={styles.wifiDot} fill="currentColor" />
                                <path d="M8.5 16.5a5 5 0 0 1 7 0" className={styles.wifiArcMiddle} />
                                <path d="M5 13a10 10 0 0 1 14 0" className={styles.wifiArcOuter} />
                                <line x1="2" y1="2" x2="22" y2="22" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Real-time Canvas Chart */}
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <h2 className={styles.chartTitle}>IoT Fleet Telemetry Stream</h2>
                    <span className={styles.chartSub}>CPU, Memory & Latency (Live 60fps)</span>
                </div>
                <RealTimeChart />
            </div>

            {/* Transactions & Alerts Tables */}
            <div className={styles.gridTwoCols}>
                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Recent Transactions</h3>
                        <span className={styles.chartSub}>Filtered Log Stream</span>
                    </div>

                    {/* Khung chứa bảng có hỗ trợ cuộn dọc mượt mà */}
                    <div className={styles.tableScrollContainer}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Txn ID</th>
                                <th>Kiosk</th>
                                <th>Fragrance Product</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {finalFilteredTransactions.length > 0 ? (
                                finalFilteredTransactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td style={{ fontFamily: "monospace", color: "#D4AF37", fontWeight: 700 }}>{tx.id}</td>
                                        <td>{tx.kiosk}</td>
                                        <td>
                                            <strong style={{ color: "#FFF" }}>{tx.product}</strong>
                                            <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>{tx.brand}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{tx.amount.toLocaleString()} VND</td>
                                        <td><span className={styles.badgeSuccess}>{tx.status}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", color: "#94A3B8", padding: "1.5rem" }}>
                                        No matching transactions found for this time range.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.sectionCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>Active Alerts & Incidents</h3>
                        <span className={styles.chartSub} style={{ color: "#F87171", borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)" }}>Requires Action</span>
                    </div>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Alert ID</th>
                            <th>Kiosk</th>
                            <th>Location</th>
                            <th>Severity</th>
                            <th>Time</th>
                        </tr>
                        </thead>
                        <tbody>
                        {activeAlerts.map((al) => (
                            <tr key={al.id}>
                                <td style={{ fontFamily: "monospace", color: "#F87171", fontWeight: 700 }}>{al.id}</td>
                                <td>{al.kiosk}</td>
                                <td>{al.location}</td>
                                <td><span className={styles.badgeDanger}>{al.severity}</span></td>
                                <td style={{ color: "#94A3B8", fontSize: "0.8rem" }}>{al.time}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Diagnostics */}
            {activeModal === "DIAGNOSTICS" && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(3,3,5,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }} onClick={() => setActiveModal(null)}>
                    <div style={{ background: "#0E0E14", border: "1px solid rgba(96,165,250,0.4)", borderRadius: "20px", padding: "2.5rem", maxWidth: "500px", width: "90%", boxShadow: "0 25px 60px rgba(0,0,0,0.9)", color: "#FFF" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                            <Activity className="w-6 h-6 text-blue-400" />
                            <h3 style={{ fontSize: "1.25rem", color: "#60A5FA", fontFamily: "Space Grotesk, sans-serif" }}>Pneumatic Diagnostics Console</h3>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "#CBD5E1", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                            Real-time sensor feedback across all active fleet dispensers. Actuator pressure is currently maintained at 1.35 bar with zero fluid backflow.
                        </p>
                        <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            style={{ background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100% )", color: "#000", fontWeight: "800", padding: "0.8rem 1.5rem", borderRadius: "10px", border: "none", cursor: "pointer", width: "100%" }}
                        >
                            CLOSE DIAGNOSTICS
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Incident */}
            {activeModal === "INCIDENT" && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(3,3,5,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 }} onClick={() => setActiveModal(null)}>
                    <div style={{ background: "#0E0E14", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "20px", padding: "2.5rem", maxWidth: "500px", width: "90%", boxShadow: "0 25px 60px rgba(0,0,0,0.9)", color: "#FFF" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                            <AlertOctagon className="w-6 h-6 text-red-400" />
                            <h3 style={{ fontSize: "1.25rem", color: "#F87171", fontFamily: "Space Grotesk, sans-serif" }}>Incident Response: KIOSK-004</h3>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "#CBD5E1", lineHeight: "1.6", marginBottom: "1rem" }}>
                            <strong>Location:</strong> Aeon Tan Phu<br />
                            <strong>Status:</strong> {kioskStatus === "ONLINE" ? "Fully Operational (Rebooted)" : "Network Gateway Timeout / Unresponsive"}
                        </p>
                        {rebootMessage && (
                            <div style={{ background: kioskStatus === "ONLINE" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${kioskStatus === "ONLINE" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem", color: kioskStatus === "ONLINE" ? "#4ADE80" : "#F87171", fontSize: "0.85rem" }}>
                                {rebootMessage}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "1rem" }}>
                            {kioskStatus !== "ONLINE" && (
                                <button
                                    type="button"
                                    disabled={kioskStatus === "REBOOTING"}
                                    onClick={handleTriggerReboot}
                                    style={{ background: "linear-gradient(135deg, #F87171 0%, #EF4444 100%)", color: "#FFF", fontWeight: "800", padding: "0.8rem 1.5rem", borderRadius: "10px", border: "none", cursor: "pointer", flex: 1 }}
                                >
                                    {kioskStatus === "REBOOTING" ? "REBOOTING..." : "TRIGGER REMOTE REBOOT"}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                style={{ background: "rgba(255,255,255,0.1)", color: "#FFF", fontWeight: "800", padding: "0.8rem 1.5rem", borderRadius: "10px", border: "none", cursor: "pointer", flex: 1 }}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}