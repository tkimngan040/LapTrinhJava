'use client';

import React, { useState } from 'react';
import styles from './transactions.module.css';
import { Search, ChevronDown, ShieldAlert, X } from 'lucide-react';

// Dữ liệu mẫu giao dịch (S08) mở rộng 30+ bản ghi cực kỳ phong phú
const transactionsData = [
    {
        id: "TXN-801", timestamp: "2026-11-06 14:20:10", kioskCode: "KIOSK-001", brand: "Maison Francis Kurkdjian", productName: "Baccarat Rouge 540 EDP", amountVnd: 32000, status: "DISPENSED",
        txRef: "QR-VN-992184", commandUuid: "cmd-uuid-901-abc", signature: "hmac-sha256-sig-8832a",
        timeline: [
            { step: "PENDING", time: "14:19:50", desc: "Order created & dynamic payment QR generated." },
            { step: "PAID", time: "14:20:02", desc: "Payment webhook verified by backend (VietQR)." },
            { step: "DISPENSING", time: "14:20:05", desc: "Signed MQTT command dispatched to KIOSK-001." },
            { step: "DISPENSED", time: "14:20:10", desc: "Hardware execution confirmed successfully. Stock deducted." }
        ]
    },
    {
        id: "TXN-802", timestamp: "2026-11-06 13:50:18", kioskCode: "KIOSK-005", brand: "Le Labo", productName: "Another 13 EDP", amountVnd: 27000, status: "UNCERTAIN",
        txRef: "QR-VN-992110", commandUuid: "cmd-uuid-902-def", signature: "hmac-sha256-sig-7711b",
        timeline: [
            { step: "PENDING", time: "13:49:40", desc: "Order created successfully." },
            { step: "PAID", time: "13:50:00", desc: "Payment successfully confirmed via payment gateway." },
            { step: "DISPENSING", time: "13:50:05", desc: "Signed command sent over MQTT." },
            { step: "UNCERTAIN", time: "13:50:18", desc: "Timeout reached without device acknowledgment. Awaiting manual operational review (BR14)." }
        ]
    },
    {
        id: "TXN-803", timestamp: "2026-11-06 11:05:30", kioskCode: "KIOSK-003", brand: "Chanel", productName: "Bleu de Chanel EDP", amountVnd: 12000, status: "PAID",
        txRef: "QR-VN-991854", commandUuid: "cmd-uuid-803-ghi", signature: "hmac-sha256-sig-5544c",
        timeline: [
            { step: "PENDING", time: "11:05:10", desc: "Order initialized." },
            { step: "PAID", time: "11:05:30", desc: "Payment verified. Preparing MQTT dispatch." }
        ]
    },
    {
        id: "TXN-804", timestamp: "2026-11-05 19:15:40", kioskCode: "KIOSK-003", brand: "Yves Saint Laurent", productName: "YSL Libre EDP", amountVnd: 15000, status: "FAILED",
        txRef: "QR-VN-989201", commandUuid: "cmd-uuid-804-jkl", signature: "hmac-sha256-sig-3322d",
        timeline: [
            { step: "PENDING", time: "19:15:00", desc: "Order created." },
            { step: "PAID", time: "19:15:20", desc: "Payment confirmed." },
            { step: "DISPENSING", time: "19:15:25", desc: "Command sent." },
            { step: "FAILED", time: "19:15:40", desc: "Device rejected command: Slot empty or safety interlock active." }
        ]
    },
    {
        id: "TXN-805", timestamp: "2026-11-05 17:10:00", kioskCode: "KIOSK-002", brand: "Chanel", productName: "Coco Mademoiselle EDP", amountVnd: 15000, status: "REFUNDED",
        txRef: "QR-VN-988992", commandUuid: "cmd-uuid-805-mno", signature: "hmac-sha256-sig-1100e",
        timeline: [
            { step: "PENDING", time: "17:09:10", desc: "Order created." },
            { step: "PAID", time: "17:09:40", desc: "Payment confirmed." },
            { step: "REFUNDED", time: "17:25:00", desc: "Operations Manager processed authorized full refund." }
        ]
    },
    {
        id: "TXN-806", timestamp: "2026-11-05 16:20:11", kioskCode: "KIOSK-004", brand: "Versace", productName: "Versace Eros EDT", amountVnd: 11000, status: "PENDING",
        txRef: "QR-VN-987112", commandUuid: "N/A", signature: "N/A",
        timeline: [{ step: "PENDING", time: "16:20:11", desc: "Order created. Awaiting payment." }]
    },
    {
        id: "TXN-807", timestamp: "2026-11-05 15:10:00", kioskCode: "KIOSK-001", brand: "Tom Ford", productName: "Black Orchid EDP", amountVnd: 22000, status: "DISPENSING",
        txRef: "QR-VN-986540", commandUuid: "cmd-uuid-807-pqr", signature: "hmac-sha256-sig-9988f",
        timeline: [{ step: "DISPENSING", time: "15:10:00", desc: "Command dispatched to kiosk. Awaiting execution." }]
    },
    {
        id: "TXN-808", timestamp: "2026-11-04 12:00:00", kioskCode: "KIOSK-006", brand: "Giorgio Armani", productName: "Acqua Di Giò EDT", amountVnd: 11000, status: "CANCELLED",
        txRef: "QR-VN-982100", commandUuid: "N/A", signature: "N/A",
        timeline: [{ step: "CANCELLED", time: "12:00:00", desc: "Customer cancelled order selection." }]
    },
    {
        id: "TXN-809", timestamp: "2026-11-04 10:15:00", kioskCode: "KIOSK-002", brand: "Parfums de Marly", productName: "Sedley", amountVnd: 24000, status: "EXPIRED",
        txRef: "QR-VN-980441", commandUuid: "N/A", signature: "N/A",
        timeline: [{ step: "EXPIRED", time: "10:15:00", desc: "Payment window expired without transfer." }]
    },
    { id: "TXN-810", timestamp: "2026-11-04 09:12:00", kioskCode: "KIOSK-001", brand: "Creed", productName: "Creed Aventus EDP", amountVnd: 28000, status: "DISPENSED", txRef: "QR-VN-979110", commandUuid: "cmd-uuid-810", signature: "sig-810", timeline: [] },
    { id: "TXN-811", timestamp: "2026-11-03 21:05:00", kioskCode: "KIOSK-003", brand: "Roja Parfums", productName: "Elysium", amountVnd: 25000, status: "DISPENSED", txRef: "QR-VN-975402", commandUuid: "cmd-uuid-811", signature: "sig-811", timeline: [] },
    { id: "TXN-812", timestamp: "2026-11-03 19:40:15", kioskCode: "KIOSK-005", brand: "Burberry", productName: "Burberry Goddess EDP", amountVnd: 13500, status: "FAILED", txRef: "QR-VN-974120", commandUuid: "cmd-uuid-812", signature: "sig-812", timeline: [] },
    { id: "TXN-813", timestamp: "2026-11-03 18:30:00", kioskCode: "KIOSK-002", brand: "Carolina Herrera", productName: "Good Girl EDP", amountVnd: 15000, status: "DISPENSED", txRef: "QR-VN-972991", commandUuid: "cmd-uuid-813", signature: "sig-813", timeline: [] },
    { id: "TXN-814", timestamp: "2026-11-03 16:15:22", kioskCode: "KIOSK-004", brand: "Armaf", productName: "Club de Nuit Intense Man", amountVnd: 9000, status: "DISPENSED", txRef: "QR-VN-971004", commandUuid: "cmd-uuid-814", signature: "sig-814", timeline: [] },
    { id: "TXN-815", timestamp: "2026-11-03 14:10:00", kioskCode: "KIOSK-001", brand: "Montblanc", productName: "Explorer EDP", amountVnd: 9500, status: "UNCERTAIN", txRef: "QR-VN-969882", commandUuid: "cmd-uuid-815", signature: "sig-815", timeline: [] },
    { id: "TXN-816", timestamp: "2026-11-02 20:00:10", kioskCode: "KIOSK-006", brand: "Paco Rabanne", productName: "1 Million EDT", amountVnd: 12000, status: "DISPENSED", txRef: "QR-VN-965431", commandUuid: "cmd-uuid-816", signature: "sig-816", timeline: [] },
    { id: "TXN-817", timestamp: "2026-11-02 18:25:40", kioskCode: "KIOSK-003", brand: "Narciso Rodriguez", productName: "For Her EDP", amountVnd: 13500, status: "PAID", txRef: "QR-VN-964110", commandUuid: "cmd-uuid-817", signature: "sig-817", timeline: [] },
    { id: "TXN-818", timestamp: "2026-11-02 15:40:00", kioskCode: "KIOSK-005", brand: "Jean Paul Gaultier", productName: "Le Male Le Parfum", amountVnd: 14500, status: "DISPENSED", txRef: "QR-VN-962001", commandUuid: "cmd-uuid-818", signature: "sig-818", timeline: [] },
    { id: "TXN-819", timestamp: "2026-11-02 12:10:05", kioskCode: "KIOSK-001", brand: "Maison Margiela", productName: "By the Fireplace", amountVnd: 16500, status: "REFUNDED", txRef: "QR-VN-959880", commandUuid: "cmd-uuid-819", signature: "sig-819", timeline: [] },
    { id: "TXN-820", timestamp: "2026-11-01 22:15:30", kioskCode: "KIOSK-002", brand: "Dior", productName: "Sauvage Elixir", amountVnd: 35000, status: "DISPENSED", txRef: "QR-VN-955120", commandUuid: "cmd-uuid-820", signature: "sig-820", timeline: [] },
    { id: "TXN-821", timestamp: "2026-11-01 20:05:12", kioskCode: "KIOSK-004", brand: "Chanel", productName: "Allure Homme Sport", amountVnd: 14000, status: "EXPIRED", txRef: "QR-VN-953400", commandUuid: "N/A", signature: "N/A", timeline: [] },
    { id: "TXN-822", timestamp: "2026-11-01 17:30:00", kioskCode: "KIOSK-003", brand: "Tom Ford", productName: "Lost Cherry EDP", amountVnd: 38000, status: "DISPENSED", txRef: "QR-VN-951221", commandUuid: "cmd-uuid-822", signature: "sig-822", timeline: [] },
    { id: "TXN-823", timestamp: "2026-10-31 15:20:00", kioskCode: "KIOSK-005", brand: "Le Labo", productName: "Santal 33 EDP", amountVnd: 29000, status: "DISPENSED", txRef: "QR-VN-948110", commandUuid: "cmd-uuid-823", signature: "sig-823", timeline: [] },
    { id: "TXN-824", timestamp: "2026-10-31 13:10:45", kioskCode: "KIOSK-001", brand: "Byredo", productName: "Gypsy Water EDP", amountVnd: 31000, status: "PAID", txRef: "QR-VN-946002", commandUuid: "cmd-uuid-824", signature: "sig-824", timeline: [] },
    { id: "TXN-825", timestamp: "2026-10-30 19:00:11", kioskCode: "KIOSK-002", brand: "Diptyque", productName: "Philosykos EDT", amountVnd: 26000, status: "DISPENSED", txRef: "QR-VN-942100", commandUuid: "cmd-uuid-825", signature: "sig-825", timeline: [] },
    { id: "TXN-826", timestamp: "2026-10-30 17:45:00", kioskCode: "KIOSK-006", brand: "Jo Malone", productName: "Wood Sage & Sea Salt", amountVnd: 23000, status: "FAILED", txRef: "QR-VN-940555", commandUuid: "cmd-uuid-826", signature: "sig-826", timeline: [] },
    { id: "TXN-827", timestamp: "2026-10-30 14:22:30", kioskCode: "KIOSK-004", brand: "Kilian", productName: "Angels' Share EDP", amountVnd: 45000, status: "DISPENSED", txRef: "QR-VN-938120", commandUuid: "cmd-uuid-827", signature: "sig-827", timeline: [] },
    { id: "TXN-828", timestamp: "2026-10-29 11:10:00", kioskCode: "KIOSK-003", brand: "Maison Francis Kurkdjian", productName: "Grand Soir EDP", amountVnd: 34000, status: "DISPENSING", txRef: "QR-VN-935001", commandUuid: "cmd-uuid-828", signature: "sig-828", timeline: [] },
    { id: "TXN-829", timestamp: "2026-10-29 09:30:15", kioskCode: "KIOSK-001", brand: "Parfums de Marly", productName: "Delina EDP", amountVnd: 33000, status: "DISPENSED", txRef: "QR-VN-932110", commandUuid: "cmd-uuid-829", signature: "sig-829", timeline: [] },
    { id: "TXN-830", timestamp: "2026-10-28 21:00:00", kioskCode: "KIOSK-005", brand: "Xerjoff", productName: "Erba Pura EDP", amountVnd: 40000, status: "REFUNDED", txRef: "QR-VN-928990", commandUuid: "cmd-uuid-830", signature: "sig-830", timeline: [] }
];

export default function TransactionsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState<typeof transactionsData[0] | null>(null);

    const filteredTxns = transactionsData.filter(t => {
        const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.kioskCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const renderStatusBadge = (status: string) => {
        const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
            PENDING: { bg: 'rgba(234, 179, 8, 0.12)', color: '#EAB308', border: 'rgba(234, 179, 8, 0.35)' },
            PAID: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.35)' },
            DISPENSING: { bg: 'rgba(168, 85, 247, 0.12)', color: '#A855F7', border: 'rgba(168, 85, 247, 0.35)' },
            DISPENSED: { bg: 'rgba(74, 222, 128, 0.12)', color: '#4ADE80', border: 'rgba(74, 222, 128, 0.35)' },
            FAILED: { bg: 'rgba(248, 113, 113, 0.12)', color: '#F87171', border: 'rgba(248, 113, 113, 0.35)' },
            UNCERTAIN: { bg: 'rgba(249, 115, 22, 0.12)', color: '#F97316', border: 'rgba(249, 115, 22, 0.35)' },
            CANCELLED: { bg: 'rgba(148, 163, 184, 0.12)', color: '#94A3B8', border: 'rgba(148, 163, 184, 0.35)' },
            EXPIRED: { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748B', border: 'rgba(100, 116, 139, 0.35)' },
            REFUNDED: { bg: 'rgba(236, 72, 153, 0.12)', color: '#EC4899', border: 'rgba(236, 72, 153, 0.35)' }
        };
        const current = statusStyles[status] || statusStyles.PENDING;
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.75rem',
                fontWeight: 700, fontFamily: 'Space Grotesk, monospace',
                background: current.bg, color: current.color, border: `1px solid ${current.border}`
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className={styles.container} onClick={() => setStatusDropdownOpen(false)}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Transactions & Payment Audit</h1>
                    <p className={styles.subtitle}>Trace end-to-end payment flows, secure MQTT dispense commands, and operational state machine logs.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search transaction ID, product, brand, or kiosk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {/* Status Filter Dropdown */}
                <div className={styles.customSelectWrapper} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.customSelectHeader} onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}>
                        <span>{selectedStatus === "ALL" ? "All Statuses" : selectedStatus}</span>
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                    </div>
                    {statusDropdownOpen && (
                        <div className={styles.customDropdownList}>
                            <div className={`${styles.customDropdownItem} ${selectedStatus === "ALL" ? styles.customDropdownItemSelected : ""}`} onClick={() => { setSelectedStatus("ALL"); setStatusDropdownOpen(false); }}>All Statuses (9 States)</div>
                            {["PENDING", "PAID", "DISPENSING", "DISPENSED", "FAILED", "UNCERTAIN", "CANCELLED", "EXPIRED", "REFUNDED"].map(st => (
                                <div key={st} className={`${styles.customDropdownItem} ${selectedStatus === st ? styles.customDropdownItemSelected : ""}`} onClick={() => { setSelectedStatus(st); setStatusDropdownOpen(false); }}>{st}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions Table Card with Scrolling */}
            <div className={styles.tableCard}>
                <div className={styles.tableScrollContainer}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                        <tr>
                            <th>TXN ID</th>
                            <th>Timestamp</th>
                            <th>Kiosk Code</th>
                            <th>Brand</th>
                            <th>Product Name</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                            <th style={{ textAlign: "center" }}>Status</th>
                            <th style={{ textAlign: "center" }}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTxns.length > 0 ? (
                            filteredTxns.map((txn) => (
                                <tr key={txn.id} className={styles.tableRow}>
                                    <td className={styles.tableCell} style={{ fontFamily: "monospace", color: "#D4AF37", fontWeight: 700 }}>{txn.id}</td>
                                    <td className={styles.tableCell} style={{ color: "#94A3B8", fontSize: "0.85rem" }}>{txn.timestamp}</td>
                                    <td className={styles.tableCell} style={{ fontFamily: "monospace", fontWeight: 600 }}>{txn.kioskCode}</td>
                                    <td className={styles.tableCell} style={{ color: "#E2E8F0" }}>{txn.brand}</td>
                                    <td className={styles.tableCell}><strong style={{ color: "#FFF" }}>{txn.productName}</strong></td>
                                    <td className={styles.tableCell} style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700, fontFamily: 'Space Grotesk, monospace' }}>
                                        {txn.amountVnd.toLocaleString()} VND
                                    </td>
                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>{renderStatusBadge(txn.status)}</td>
                                    <td className={styles.tableCell} style={{ textAlign: "center" }}>
                                        <button onClick={() => setSelectedTxn(txn)} className={styles.actionButton}>
                                            View Trace
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} style={{ textAlign: "center", color: "#94A3B8", padding: "3rem" }}>
                                    No matching transactions found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Chi tiết đơn hàng (Order Detail Trace Modal) */}
            {selectedTxn && (
                <div className={styles.modalOverlay} onClick={() => setSelectedTxn(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 className={styles.modalTitle}>Transaction Trace: {selectedTxn.id}</h2>
                                <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem' }}>End-to-end traceability linking payment, MQTT command, and device result.</p>
                            </div>
                            <button onClick={() => setSelectedTxn(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                                <div><span style={{ color: '#94A3B8' }}>Payment Ref:</span> <strong style={{ color: '#F8F8F8', fontFamily: 'monospace' }}>{selectedTxn.txRef}</strong></div>
                                <div><span style={{ color: '#94A3B8' }}>Command UUID:</span> <strong style={{ color: '#F8F8F8', fontFamily: 'monospace' }}>{selectedTxn.commandUuid}</strong></div>
                                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#94A3B8' }}>HMAC Signature:</span> <strong style={{ color: '#D4AF37', fontFamily: 'monospace', fontSize: '0.8rem' }}>{selectedTxn.signature}</strong></div>
                            </div>
                        </div>

                        {selectedTxn.status === "UNCERTAIN" && (
                            <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.4)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <ShieldAlert className="w-6 h-6 text-orange-400 flex-shrink-0" />
                                <div style={{ fontSize: '0.85rem', color: '#FDBA74' }}>
                                    <strong>Uncertain State Warning:</strong> Payment succeeded but hardware response timed out. Automated re-dispense is locked. Requires manual operational review or refund.
                                </div>
                            </div>
                        )}

                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F7EFCF', marginBottom: '1rem' }}>Order State Timeline</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(212,175,55,0.3)', marginBottom: '1.5rem' }}>
                            {selectedTxn.timeline && selectedTxn.timeline.length > 0 ? (
                                selectedTxn.timeline.map((item, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-1.82rem', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#D4AF37', border: '2px solid #0A0A10' }} />
                                        <div style={{ fontSize: '0.80rem', color: '#D4AF37', fontWeight: 700, fontFamily: 'Space Grotesk' }}>{item.step} — <span style={{ color: '#94A3B8' }}>{item.time}</span></div>
                                        <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '0.2rem' }}>{item.desc}</div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Standard lifecycle event recorded for audit trail.</div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setSelectedTxn(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '0.65rem 1.25rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}