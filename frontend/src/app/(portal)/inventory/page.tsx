'use client';

import React, { useState } from 'react';
import styles from './inventory.module.css';
import { Search, AlertTriangle, RefreshCw } from 'lucide-react';

interface InventoryItem {
    id: string;
    kioskCode: string;
    slot: string;
    brand: string;
    productName: string;
    totalMl: number;
    remainingMl: number;
    thresholdMl: number;
    status: string;
    batch: string;
}

// Dữ liệu mẫu kho hàng & dung tích chai lọ (S09)
const initialInventoryData: InventoryItem[] = [
    { id: "INV-001", kioskCode: "KIOSK-001", slot: "Slot 1", brand: "Maison Francis Kurkdjian", productName: "Baccarat Rouge 540 EDP", totalMl: 100, remainingMl: 12.5, thresholdMl: 15, status: "NEARLY_EMPTY", batch: "BATCH-2026-A1" },
    { id: "INV-002", kioskCode: "KIOSK-001", slot: "Slot 2", brand: "Creed", productName: "Creed Aventus EDP", totalMl: 100, remainingMl: 78.0, thresholdMl: 15, status: "AVAILABLE", batch: "BATCH-2026-A2" },
    { id: "INV-003", kioskCode: "KIOSK-002", slot: "Slot 1", brand: "Le Labo", productName: "Another 13 EDP", totalMl: 100, remainingMl: 8.0, thresholdMl: 15, status: "NEARLY_EMPTY", batch: "BATCH-2026-B1" },
    { id: "INV-004", kioskCode: "KIOSK-003", slot: "Slot 1", brand: "Chanel", productName: "Bleu de Chanel EDP", totalMl: 100, remainingMl: 65.5, thresholdMl: 15, status: "AVAILABLE", batch: "BATCH-2026-C1" },
    { id: "INV-005", kioskCode: "KIOSK-004", slot: "Slot 1", brand: "Dior", productName: "Dior Sauvage EDT", totalMl: 100, remainingMl: 42.0, thresholdMl: 15, status: "AVAILABLE", batch: "BATCH-2026-D1" },
    { id: "INV-006", kioskCode: "KIOSK-005", slot: "Slot 2", brand: "Tom Ford", productName: "Black Orchid EDP", totalMl: 100, remainingMl: 0.0, thresholdMl: 15, status: "EMPTY", batch: "BATCH-2026-E1" },
];

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>(initialInventoryData);
    const [searchQuery, setSearchQuery] = useState("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Mô phỏng hành động xịt test để thấy dung tích giảm đúng lượng ml calib chuẩn
    const handleSimulateSprayTest = (id: string) => {
        setInventory(prev => prev.map(item => {
            if (item.id === id) {
                const nextVal = Math.max(0, item.remainingMl - 1.5);
                const nextStatus = nextVal === 0 ? "EMPTY" : nextVal <= item.thresholdMl ? "NEARLY_EMPTY" : "AVAILABLE";
                return { ...item, remainingMl: Number(nextVal.toFixed(1)), status: nextStatus };
            }
            return item;
        }));
        setToastMessage("Simulated 1 calibrated spray! Slot remaining volume updated (FR6.5, FR6.7).");
        setTimeout(() => setToastMessage(null), 4000);
    };

    const filteredInventory = inventory.filter(i =>
        (i.productName && i.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (i.kioskCode && i.kioskCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (i.brand && i.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (i.slot && i.slot.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Perfume Inventory & Level Monitoring</h1>
                    <p className={styles.subtitle}>Track physical perfume stock batches, real-time remaining volume estimates, and low-stock slot alerts (FR6).</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search product, brand, kiosk code, or slot..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* Inventory Table Card */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>INV ID</th>
                            <th>Kiosk & Slot</th>
                            <th>Brand & Product</th>
                            <th>Batch Code</th>
                            <th>Remaining Volume</th>
                            <th style={{ textAlign: "center" }}>Stock Status</th>
                            <th style={{ textAlign: "center" }}>Test Action (S09 Demo)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredInventory.length > 0 ? (
                            filteredInventory.map((item) => {
                                const percent = (item.remainingMl / item.totalMl) * 100;
                                const isLow = item.remainingMl <= item.thresholdMl;
                                return (
                                    <tr key={item.id} className={`${styles.tableRow} ${isLow ? styles.lowStockHighlight : ''}`}>
                                        <td className={styles.tableCell} style={{ fontFamily: "monospace", color: "#D4AF37", fontWeight: 700 }}>{item.id}</td>
                                        <td className={styles.tableCell} style={{ fontWeight: 600 }}>{item.kioskCode} <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>({item.slot})</span></td>
                                        <td className={styles.tableCell}>
                                            <div style={{ color: '#FFF', fontWeight: 700 }}>{item.productName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{item.brand}</div>
                                        </td>
                                        <td className={styles.tableCell} style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#CBD5E1" }}>{item.batch}</td>
                                        <td className={styles.tableCell}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                                                <strong style={{ color: isLow ? '#F87171' : '#4ADE80' }}>{item.remainingMl} ml</strong>
                                                <span style={{ color: '#94A3B8' }}>{percent.toFixed(0)}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                                                <div style={{ width: `${percent}%`, height: '100%', background: isLow ? '#F87171' : 'linear-gradient(90deg, #D4AF37, #4ADE80)', transition: 'width 0.3s ease' }} />
                                            </div>
                                        </td>
                                        <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.75rem',
                                                    fontWeight: 700, fontFamily: 'Space Grotesk, monospace',
                                                    background: item.status === 'AVAILABLE' ? 'rgba(74, 222, 128, 0.12)' : item.status === 'NEARLY_EMPTY' ? 'rgba(248, 113, 113, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                                                    color: item.status === 'AVAILABLE' ? '#4ADE80' : item.status === 'NEARLY_EMPTY' ? '#F87171' : '#94A3B8',
                                                    border: `1px solid ${item.status === 'AVAILABLE' ? 'rgba(74, 222, 128, 0.35)' : item.status === 'NEARLY_EMPTY' ? 'rgba(248, 113, 113, 0.35)' : 'rgba(100, 116, 139, 0.35)'}`
                                                }}>
                                                    {item.status === 'NEARLY_EMPTY' && <AlertTriangle className="w-3 h-3" />}
                                                    {item.status}
                                                </span>
                                        </td>
                                        <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                            <button onClick={() => handleSimulateSprayTest(item.id)} className={styles.actionButton} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Simulate Spray
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", color: "#94A3B8", padding: "3rem" }}>
                                    No inventory stock records found.
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
                    position: "fixed", bottom: "2rem", right: "2rem",
                    background: "linear-gradient(135deg, #14141E 0%, #0A0A10 100%)",
                    border: "1px solid rgba(212, 175, 55, 0.5)",
                    padding: "1rem 1.5rem", borderRadius: "12px", color: "#F7EFCF",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.8)", zIndex: 99999,
                    fontWeight: 600, fontSize: "0.9rem"
                }}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
}