"use client";

import React, { useState } from "react";
import { Download, Search, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import styles from "./reports.module.css";

interface ReportItem {
    id: string;
    timestamp: string;
    kioskCode: string;
    brand: string;
    productName: string;
    volumeMl: number;
    amountVnd: number;
    status: "SUCCESS" | "FAILED";
}

const extendedReportData: ReportItem[] = [
    { id: "REP-901", timestamp: "2026-11-06 14:20:10", kioskCode: "KIOSK-001", brand: "Maison Francis Kurkdjian", productName: "Baccarat Rouge 540 EDP", volumeMl: 1.5, amountVnd: 32000, status: "SUCCESS" },
    { id: "REP-902", timestamp: "2026-11-06 14:15:42", kioskCode: "KIOSK-002", brand: "Creed", productName: "Creed Aventus EDP", volumeMl: 1.5, amountVnd: 28000, status: "SUCCESS" },
    { id: "REP-903", timestamp: "2026-11-06 13:50:18", kioskCode: "KIOSK-005", brand: "Le Labo", productName: "Another 13 EDP", volumeMl: 1.5, amountVnd: 27000, status: "SUCCESS" },
    { id: "REP-904", timestamp: "2026-11-06 12:10:05", kioskCode: "KIOSK-001", brand: "Tom Ford", productName: "Black Orchid EDP", volumeMl: 1.5, amountVnd: 22000, status: "SUCCESS" },
    { id: "REP-905", timestamp: "2026-11-06 11:05:30", kioskCode: "KIOSK-003", brand: "Chanel", productName: "Bleu de Chanel EDP", volumeMl: 2.0, amountVnd: 12000, status: "SUCCESS" },
    { id: "REP-906", timestamp: "2026-11-06 10:40:15", kioskCode: "KIOSK-004", brand: "Dior", productName: "Dior Sauvage EDT", volumeMl: 2.0, amountVnd: 12000, status: "SUCCESS" },
    { id: "REP-907", timestamp: "2026-11-06 09:25:00", kioskCode: "KIOSK-002", brand: "Parfums de Marly", productName: "Sedley", volumeMl: 1.5, amountVnd: 24000, status: "SUCCESS" },
    { id: "REP-908", timestamp: "2026-11-06 08:50:12", kioskCode: "KIOSK-006", brand: "Giorgio Armani", productName: "Acqua Di Giò EDT", volumeMl: 2.5, amountVnd: 11000, status: "SUCCESS" },
    { id: "REP-909", timestamp: "2026-11-05 19:15:40", kioskCode: "KIOSK-003", brand: "Yves Saint Laurent", productName: "YSL Libre EDP", volumeMl: 2.0, amountVnd: 15000, status: "FAILED" },
    { id: "REP-910", timestamp: "2026-11-05 18:30:22", kioskCode: "KIOSK-001", brand: "Roja Parfums", productName: "Elysium", volumeMl: 1.5, amountVnd: 25000, status: "SUCCESS" },
    { id: "REP-911", timestamp: "2026-11-05 17:10:00", kioskCode: "KIOSK-002", brand: "Chanel", productName: "Coco Mademoiselle EDP", volumeMl: 2.0, amountVnd: 15000, status: "SUCCESS" },
    { id: "REP-912", timestamp: "2026-11-05 16:40:11", kioskCode: "KIOSK-004", brand: "Versace", productName: "Versace Eros EDT", volumeMl: 2.0, amountVnd: 11000, status: "SUCCESS" },
    { id: "REP-913", timestamp: "2026-11-05 15:20:50", kioskCode: "KIOSK-005", brand: "Burberry", productName: "Burberry Goddess EDP", volumeMl: 2.0, amountVnd: 13500, status: "SUCCESS" },
    { id: "REP-914", timestamp: "2026-11-05 14:15:30", kioskCode: "KIOSK-001", brand: "Carolina Herrera", productName: "Good Girl EDP", volumeMl: 2.0, amountVnd: 15000, status: "SUCCESS" },
    { id: "REP-915", timestamp: "2026-11-05 13:00:22", kioskCode: "KIOSK-003", brand: "Armaf", productName: "Club de Nuit Intense Man", volumeMl: 2.0, amountVnd: 9000, status: "SUCCESS" },
    { id: "REP-916", timestamp: "2026-11-05 11:45:10", kioskCode: "KIOSK-006", brand: "Montblanc", productName: "Explorer EDP", volumeMl: 2.0, amountVnd: 9500, status: "SUCCESS" },
    { id: "REP-917", timestamp: "2026-11-05 10:20:05", kioskCode: "KIOSK-002", brand: "Paco Rabanne", productName: "1 Million EDT", volumeMl: 2.0, amountVnd: 12000, status: "SUCCESS" },
    { id: "REP-918", timestamp: "2026-11-05 09:10:40", kioskCode: "KIOSK-004", brand: "Narciso Rodriguez", productName: "For Her EDP", volumeMl: 2.0, amountVnd: 13500, status: "SUCCESS" },
    { id: "REP-919", timestamp: "2026-11-04 20:30:15", kioskCode: "KIOSK-001", brand: "Jean Paul Gaultier", productName: "Le Male Le Parfum", volumeMl: 2.0, amountVnd: 14500, status: "SUCCESS" },
    { id: "REP-920", timestamp: "2026-11-04 18:12:00", kioskCode: "KIOSK-005", brand: "Maison Margiela", productName: "By the Fireplace", volumeMl: 1.5, amountVnd: 16500, status: "SUCCESS" },
];

const brandOptions = [
    { label: "All Brands (Fleet-wide)", value: "ALL" },
    { label: "Maison Francis Kurkdjian", value: "Maison Francis Kurkdjian" },
    { label: "Creed", value: "Creed" },
    { label: "Le Labo", value: "Le Labo" },
    { label: "Tom Ford", value: "Tom Ford" },
    { label: "Chanel", value: "Chanel" },
    { label: "Dior", value: "Dior" },
    { label: "Parfums de Marly", value: "Parfums de Marly" },
    { label: "Giorgio Armani", value: "Giorgio Armani" },
    { label: "Roja Dove", value: "Roja Dove" },
    { label: "Versace", value: "Versace" },
    { label: "Burberry", value: "Burberry" },
    { label: "Yves Saint Laurent", value: "Yves Saint Laurent" },
];

const kioskOptions = [
    { label: `All Kiosks (${extendedReportData.length} active units)`, value: "ALL" },
    { label: "KIOSK-001 (Takashimaya Q.1)", value: "KIOSK-001" },
    { label: "KIOSK-002 (Vincom Center)", value: "KIOSK-002" },
    { label: "KIOSK-003 (Diamond Plaza)", value: "KIOSK-003" },
    { label: "KIOSK-004 (Aeon Tan Phu)", value: "KIOSK-004" },
    { label: "KIOSK-005 (Lotte West Lake)", value: "KIOSK-005" },
    { label: "KIOSK-006 (Saigon Centre)", value: "KIOSK-006" },
];

export default function ReportsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("ALL");
    const [selectedKiosk, setSelectedKiosk] = useState("ALL");

    const [brandOpen, setBrandOpen] = useState(false);
    const [kioskOpen, setKioskOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

// Lọc danh sách báo cáo
    const filteredReports = extendedReportData.filter(r => {
        const matchesSearch = r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.kioskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBrand = selectedBrand === "ALL" || r.brand === selectedBrand;
        const matchesKiosk = selectedKiosk === "ALL" || r.kioskCode === selectedKiosk;
        return matchesSearch && matchesBrand && matchesKiosk;
    });

    // Hàm xuất CSV chuẩn định dạng Excel (dùng dấu chấm phẩy ; để chia cột)
    const handleExportCSV = () => {
        const csvHeader = "ID;Timestamp;Kiosk Code;Brand;Product Name;Volume (ml);Amount (VND);Status\n";

        const csvRows = extendedReportData.map(r =>
            `"${r.id}","${r.timestamp}","${r.kioskCode}","${r.brand}","${r.productName}","${r.volumeMl}","${r.amountVnd}","${r.status}"`
        ).join("\n");

        const csvContent = csvRows.replace(/","/g, '";"');

        const blob = new Blob(["\ufeff" + csvHeader + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "S13_reports_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setToastMessage("Successfully exported formatted CSV report (`S13_reports_sample.csv`)!");
        setTimeout(() => setToastMessage(null), 4000);
    };

    return (
        <div className={styles.container} onClick={() => { setBrandOpen(false); setKioskOpen(false); }}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Transaction & Dispensing Reports</h1>
                    <p className={styles.subtitle}>Audit real-time telemetry logs, catalog-priced spray fees across full catalog, and export CSV reports.</p>
                </div>
                <button onClick={handleExportCSV} className={styles.exportButton}>
                    <Download className="w-4 h-4" /> Export CSV Report
                </button>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search report ID, luxury product, brand, or kiosk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {/* Custom Brand Dropdown */}
                <div className={styles.customSelectWrapper}>
                    <div
                        className={styles.customSelectHeader}
                        onClick={() => { setBrandOpen(!brandOpen); setKioskOpen(false); }}
                    >
                        <span>{brandOptions.find(o => o.value === selectedBrand)?.label}</span>
                        <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${brandOpen ? "rotate-180" : ""}`} />
                    </div>
                    {brandOpen && (
                        <div className={styles.customDropdownList}>
                            {brandOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`${styles.customDropdownItem} ${selectedBrand === opt.value ? styles.customDropdownItemSelected : ""}`}
                                    onClick={() => { setSelectedBrand(opt.value); setBrandOpen(false); }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Custom Kiosk Dropdown */}
                <div className={styles.customSelectWrapper}>
                    <div
                        className={styles.customSelectHeader}
                        onClick={() => { setKioskOpen(!kioskOpen); setBrandOpen(false); }}
                    >
                        <span>{kioskOptions.find(o => o.value === selectedKiosk)?.label}</span>
                        <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${kioskOpen ? "rotate-180" : ""}`} />
                    </div>
                    {kioskOpen && (
                        <div className={styles.customDropdownList}>
                            {kioskOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`${styles.customDropdownItem} ${selectedKiosk === opt.value ? styles.customDropdownItemSelected : ""}`}
                                    onClick={() => { setSelectedKiosk(opt.value); setKioskOpen(false); }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th style={{ width: "110px" }}>Report ID</th>
                            <th style={{ width: "180px" }}>Timestamp</th>
                            <th style={{ width: "130px" }}>Kiosk Code</th>
                            <th style={{ width: "200px" }}>Brand</th>
                            <th style={{ minWidth: "220px" }}>Product Name</th>
                            <th style={{ width: "100px", textAlign: "right" }}>Volume</th>
                            <th style={{ width: "160px", textAlign: "right" }}>Catalog Price</th>
                            <th style={{ width: "130px", textAlign: "center" }}>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredReports.length > 0 ? (
                            filteredReports.map((row) => (
                                <tr key={row.id} className={styles.tableRow}>
                                    <td className={styles.tableCell} style={{ fontFamily: "monospace", color: "#D4AF37", fontWeight: 700 }}>{row.id}</td>
                                    <td className={styles.tableCell} style={{ color: "#94A3B8", fontSize: "0.85rem" }}>{row.timestamp}</td>
                                    <td className={styles.tableCell} style={{ fontFamily: "monospace", fontWeight: 600 }}>{row.kioskCode}</td>
                                    <td className={styles.tableCell} style={{ color: "#E2E8F0" }}>{row.brand}</td>
                                    <td className={styles.tableCell}>
                                        <strong style={{ color: "#FFF" }}>{row.productName}</strong>
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: "right", color: "#CBD5E1" }}>{row.volumeMl} ml</td>
                                    <td className={styles.tableCell} style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700, fontFamily: "Space Grotesk, monospace" }}>
                                        {row.amountVnd.toLocaleString()} VND
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                <span className={row.status === "SUCCESS" ? styles.badgeSuccess : styles.badgeFailed}>
                                    {row.status === "SUCCESS" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                    {row.status}
                                </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} style={{ textAlign: "center", color: "#94A3B8", padding: "3rem" }}>
                                    No matching dispensing logs found for the selected filter criteria.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: "fixed", bottom: "2rem", right: "2.5rem",
                    background: "linear-gradient(135deg, rgba(18,18,28,0.95) 0%, rgba(10,10,15,0.98) 100%)",
                    border: "1px solid rgba(212,175,55,0.5)", borderRadius: "14px", padding: "1rem 1.5rem",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.9), 0 0 20px rgba(212,175,55,0.2)",
                    color: "#F8F8F8", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.75rem", zIndex: 99999
                }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ADE80", boxShadow: "0 0 10px #4ADE80" }}></div>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}