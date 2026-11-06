"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Server, Cpu, Thermometer, Wifi, RefreshCw, Wrench, AlertTriangle, MapPin, Activity, Terminal, ShieldCheck } from "lucide-react";
import Link from "next/link";
import styles from "./machine-detail.module.css";

interface Slot {
    slotNumber: number;
    productName: string;
    volumeRemaining: number;
    maxVolume: number;
    threshold: number;
    status: "READY" | "LOW" | "EMPTY" | "DISABLED";
}

const machinesDatabase: Record<string, {
    code: string;
    serial: string;
    brand: string;
    address: string;
    installDate: string;
    status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
    connection: string;
    temperature: string;
    lastHeartbeat: string;
    firmware: string;
    mqttTopic: string;
    latency: string;
    slots: Slot[];
}> = {
    "kiok-01": {
        code: "KIOSK-001",
        serial: "SS-DEV-90823",
        brand: "Dior & Chanel Shared Fleet",
        address: "Takashimaya, 92 Nam Ky Khoi Nghia, Ben Nghe, Dist. 1, HCMC",
        installDate: "15/10/2025",
        status: "ONLINE",
        connection: "Connected (MQTT Secure)",
        temperature: "24.5 °C",
        lastHeartbeat: "Just now (1s ago)",
        firmware: "FR2.6",
        mqttTopic: "scentstation/fleet/kiok-001/telemetry",
        latency: "24ms",
        slots: [
            { slotNumber: 1, productName: "Dior Sauvage EDT", volumeRemaining: 85, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 2, productName: "Bleu de Chanel EDP", volumeRemaining: 15, maxVolume: 100, threshold: 20, status: "LOW" },
            { slotNumber: 3, productName: "YSL Libre EDP", volumeRemaining: 0, maxVolume: 100, threshold: 20, status: "EMPTY" },
            { slotNumber: 4, productName: "MCM EDP", volumeRemaining: 90, maxVolume: 100, threshold: 20, status: "READY" },
        ]
    },
    "kiok-02": {
        code: "KIOSK-002",
        serial: "SS-DEV-90824",
        brand: "Chanel Flagship Fleet",
        address: "Vincom Center Dong Khoi, 72 Le Thanh Ton, Dist. 1, HCMC",
        installDate: "20/10/2025",
        status: "ONLINE",
        connection: "Connected (MQTT Secure)",
        temperature: "25.0 °C",
        lastHeartbeat: "2 mins ago",
        firmware: "FR2.6",
        mqttTopic: "scentstation/fleet/kiok-002/telemetry",
        latency: "31ms",
        slots: [
            { slotNumber: 1, productName: "Chanel No.5 EDP", volumeRemaining: 70, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 2, productName: "Coco Mademoiselle", volumeRemaining: 45, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 3, productName: "Bleu de Chanel", volumeRemaining: 10, maxVolume: 100, threshold: 20, status: "LOW" },
            { slotNumber: 4, productName: "Chance Eau Tendre", volumeRemaining: 80, maxVolume: 100, threshold: 20, status: "READY" },
        ]
    },
    "kiok-03": {
        code: "KIOSK-003",
        serial: "SS-DEV-90825",
        brand: "Dior Exclusive Network",
        address: "Lotte Center, 54 Lieu Giai, Ba Dinh, Hanoi",
        installDate: "05/11/2025",
        status: "MAINTENANCE",
        connection: "Disconnected (Servicing)",
        temperature: "22.1 °C",
        lastHeartbeat: "45 mins ago",
        firmware: "FR2.5",
        mqttTopic: "scentstation/fleet/kiok-003/telemetry",
        latency: "N/A",
        slots: [
            { slotNumber: 1, productName: "J'adore Dior", volumeRemaining: 0, maxVolume: 100, threshold: 20, status: "DISABLED" },
            { slotNumber: 2, productName: "Sauvage Elixir", volumeRemaining: 0, maxVolume: 100, threshold: 20, status: "DISABLED" },
            { slotNumber: 3, productName: "Miss Dior", volumeRemaining: 0, maxVolume: 100, threshold: 20, status: "DISABLED" },
            { slotNumber: 4, productName: "Dior Homme", volumeRemaining: 0, maxVolume: 100, threshold: 20, status: "DISABLED" },
        ]
    },
    "kiok-04": {
        code: "KIOSK-004",
        serial: "SS-DEV-90826",
        brand: "Multi-Brand Hub",
        address: "Aeon Mall Tan Phu, 30 Bo Bao Tan Thang, Tan Phu, HCMC",
        installDate: "12/12/2025",
        status: "OFFLINE",
        connection: "Lost Signal (Network Timeout)",
        temperature: "19.0 °C",
        lastHeartbeat: "3 hours ago",
        firmware: "FR2.6",
        mqttTopic: "scentstation/fleet/kiok-004/telemetry",
        latency: "Timeout",
        slots: [
            { slotNumber: 1, productName: "Gucci Flora", volumeRemaining: 30, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 2, productName: "Tom Ford Black Orchid", volumeRemaining: 12, maxVolume: 100, threshold: 20, status: "LOW" },
            { slotNumber: 3, productName: "YSL Black Opium", volumeRemaining: 50, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 4, productName: "Versace Eros", volumeRemaining: 5, maxVolume: 100, threshold: 20, status: "LOW" },
        ]
    },
    "kiok-05": {
        code: "KIOSK-005",
        serial: "SS-DEV-90827",
        brand: "Luxury Sky Lounge",
        address: "Landmark 81 SkyView, Binh Thanh, HCMC",
        installDate: "01/01/2026",
        status: "ONLINE",
        connection: "Connected (MQTT Secure)",
        temperature: "23.8 °C",
        lastHeartbeat: "1 min ago",
        firmware: "FR2.6",
        mqttTopic: "scentstation/fleet/kiok-005/telemetry",
        latency: "18ms",
        slots: [
            { slotNumber: 1, productName: "Creed Aventus", volumeRemaining: 95, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 2, productName: "Baccarat Rouge 540", volumeRemaining: 88, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 3, productName: "Tom Ford Oud Wood", volumeRemaining: 75, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 4, productName: "Parfums de Marly", volumeRemaining: 90, maxVolume: 100, threshold: 20, status: "READY" },
        ]
    },
    "kiok-06": {
        code: "KIOSK-006",
        serial: "SS-DEV-90828",
        brand: "Capital Premium Hub",
        address: "Hanoi Centerpoint, Le Van Luong, Thanh Xuan, Hanoi",
        installDate: "10/01/2026",
        status: "ONLINE",
        connection: "Connected (MQTT Secure)",
        temperature: "24.0 °C",
        lastHeartbeat: "5 mins ago",
        firmware: "FR2.5",
        mqttTopic: "scentstation/fleet/kiok-006/telemetry",
        latency: "42ms",
        slots: [
            { slotNumber: 1, productName: "Jo Malone English Pear", volumeRemaining: 40, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 2, productName: "Byredo Mojave Ghost", volumeRemaining: 18, maxVolume: 100, threshold: 20, status: "LOW" },
            { slotNumber: 3, productName: "Le Labo Santal 33", volumeRemaining: 60, maxVolume: 100, threshold: 20, status: "READY" },
            { slotNumber: 4, productName: "Diptyque Philosykos", volumeRemaining: 25, maxVolume: 100, threshold: 20, status: "READY" },
        ]
    }
};

export default function MachineDetailPage() {
    const params = useParams();
    const machineId = (params?.id as string) || "kiok-01";
    const currentMachineData = machinesDatabase[machineId] || machinesDatabase["kiok-01"];

    const [machineInfo] = useState(currentMachineData);
    const [slots, setSlots] = useState<Slot[]>(currentMachineData.slots);
    const [isMaintenanceModal, setIsMaintenanceModal] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // State quản lý Modal Telemetry chuyên sâu khi bấm vào các ô cảm biến
    const [activeSensorModal, setActiveSensorModal] = useState<"connection" | "temperature" | "heartbeat" | null>(null);

    const toggleSlotStatus = (slotNumber: number) => {
        setSlots(slots.map(s => {
            if (s.slotNumber === slotNumber) {
                const newStatus = s.status === "DISABLED" ? "READY" : "DISABLED";
                return { ...s, status: newStatus };
            }
            return s;
        }));
    };

    const handleRestart = () => {
        setIsRestarting(true);
        setTimeout(() => {
            setIsRestarting(false);
            setToastMessage(`Restart command successfully sent to ${machineInfo.code} via MQTT.`);
            setTimeout(() => setToastMessage(null), 4000);
        }, 1500);
    };

    return (
        <div className={styles.container}>
            <div>
                <Link href="/machines" className={styles.backLink}>
                    Back to Machine List
                </Link>
            </div>

            <div className={styles.header}>
                <div>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.machineTitle}>{machineInfo.code}</h1>
                        <span className={styles.onlineBadge} style={{
                            backgroundColor: machineInfo.status === "ONLINE" ? "rgba(74, 222, 128, 0.12)" : machineInfo.status === "MAINTENANCE" ? "rgba(245, 158, 11, 0.12)" : "rgba(248, 113, 113, 0.12)",
                            color: machineInfo.status === "ONLINE" ? "#4ade80" : machineInfo.status === "MAINTENANCE" ? "#fbbf24" : "#f87171",
                            borderColor: machineInfo.status === "ONLINE" ? "rgba(74, 222, 128, 0.35)" : machineInfo.status === "MAINTENANCE" ? "rgba(245, 158, 11, 0.35)" : "rgba(248, 113, 113, 0.35)"
                        }}>
                            <span className={styles.dotOnline} style={{ backgroundColor: machineInfo.status === "ONLINE" ? "#4ade80" : machineInfo.status === "MAINTENANCE" ? "#fbbf24" : "#f87171" }}></span>
                            {machineInfo.status}
                        </span>
                    </div>
                    <p className={styles.addressText}>
                        <MapPin className="w-4 h-4 text-amber-400" /> {machineInfo.address}
                    </p>
                </div>

                <div className={styles.actionsGroup}>
                    <button onClick={handleRestart} disabled={isRestarting} className={styles.restartBtn}>
                        <RefreshCw className={`w-4 h-4 text-amber-400 ${isRestarting ? "animate-spin" : ""}`} />
                        {isRestarting ? "Restarting..." : "Restart Machine"}
                    </button>
                    <button onClick={() => setIsMaintenanceModal(true)} className={styles.maintenanceBtn}>
                        <Wrench className="w-4 h-4" /> Maintenance Mode
                    </button>
                </div>
            </div>

            <div className={styles.gridSection}>
                <div className={styles.card} style={{ gridColumn: "span 2" }}>
                    <h2 className={styles.cardTitle}>
                        <Server className="w-4 h-4 text-[#d4af37]" /> Basic Information (Read-Only)
                    </h2>
                    <div className={styles.infoCardGrid}>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>Device Serial</span>
                            <span className={styles.infoBoxValue} style={{ fontFamily: "monospace" }}>{machineInfo.serial}</span>
                        </div>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>Managing Brand</span>
                            <span className={styles.infoBoxValue}>{machineInfo.brand}</span>
                        </div>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>Installation Date</span>
                            <span className={styles.infoBoxValue}>{machineInfo.installDate}</span>
                        </div>
                        <div className={styles.infoBoxItem}>
                            <span className={styles.infoBoxLabel}>Firmware Version</span>
                            <span className={styles.infoBoxValue} style={{ color: "#d4af37", fontFamily: "monospace" }}>{machineInfo.firmware}</span>
                        </div>
                    </div>
                </div>

                {/* REAL-TIME SENSORS (TÍCH HỢP ICON ĐỘNG VÀ ĐẦY ĐỦ THÔNG SỐ) */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <Cpu className="w-4 h-4 text-[#d4af37]" /> Real-time Sensors (Click to Inspect)
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>

                        {/* Ô Connection */}
                        <div
                            onClick={() => setActiveSensorModal("connection")}
                            className={styles.infoBoxItem}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                            title="Click to open MQTT Live Stream Inspector"
                        >
            <span style={{ color: "#a1a1aa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h.01" className={styles.wifiBar1}></path>
                    <path d="M8.5 16.4a5 5 0 0 1 7 0" className={styles.wifiBar2}></path>
                    <path d="M5 12.85a10 10 0 0 1 14 0" className={styles.wifiBar3}></path>
                    <path d="M2 9.3a15 15 0 0 1 20 0" className={styles.wifiBar4}></path>
                </svg>
                Connection
            </span>
                            <span style={{ color: machineInfo.status === "ONLINE" ? "#34d399" : "#f87171", fontWeight: 500, fontSize: "0.75rem" }}>
                {machineInfo.connection}
            </span>
                        </div>

                        {/* Ô Chamber Temp */}
                        <div
                            onClick={() => setActiveSensorModal("temperature")}
                            className={styles.infoBoxItem}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                            title="Click to view Chamber Temperature Analytics"
                        >
            <span style={{ color: "#a1a1aa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="15" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" className={styles.mercuryCore}></line>
                </svg>
                Chamber Temp
            </span>
                            <span style={{ color: "#fff", fontWeight: 500 }}>{machineInfo.temperature}</span>
                        </div>

                        {/* Ô Last Heartbeat với đường nét sóng tự động chạy biến đổi hình dạng */}
                        <div
                            onClick={() => setActiveSensorModal("heartbeat")}
                            className={styles.infoBoxItem}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                            title="Click to view Device Diagnostics & Latency"
                        >
    <span style={{ color: "#a1a1aa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h4l3-9 4 18 3-9h6">
                <animate
                    attributeName="d"
                    dur="1.2s"
                    repeatCount="indefinite"
                    values="
                        M2 12h4l3-9 4 18 3-9h6;
                        M2 12h4l3-5 4 10 3-5h6;
                        M2 12h4l3-12 4 24 3-12h6;
                        M2 12h4l3-9 4 18 3-9h6
                    "
                />
            </path>
        </svg>
        Last Heartbeat
    </span>
                            <span style={{ color: "#d4d4d8", fontSize: "0.75rem" }}>{machineInfo.lastHeartbeat}</span>
                        </div>

                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>Independent Perfume Slots (4 Slots)</h2>
                        <p style={{ fontSize: "0.75rem", color: "#a1a1aa", marginTop: "0.125rem" }}>Monitor liquid levels, assign products, calibrate dispensing pumps, and toggle slot availability.</p>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#d4af37", fontFamily: "monospace", background: "rgba(212,175,55,0.1)", padding: "0.25rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(212,175,55,0.3)" }}>
            IoT Protocol: MQTT v5.0
        </span>
                </div>

                <div className={styles.slotsGrid}>
                    {slots.map((slot) => {
                        let badgeStyle = { backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.25)" };
                        if (slot.status === "LOW") badgeStyle = { backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.25)" };
                        if (slot.status === "EMPTY") badgeStyle = { backgroundColor: "rgba(244, 63, 94, 0.1)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.25)" };
                        if (slot.status === "DISABLED") badgeStyle = { backgroundColor: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46" };

                        const percent = (slot.volumeRemaining / slot.maxVolume) * 100;
                        const thresholdPercent = (slot.threshold / slot.maxVolume) * 100;

                        return (
                            <div
                                key={slot.slotNumber}
                                className={styles.slotCard}
                                style={{
                                    borderColor: slot.status === "LOW" ? "rgba(245, 158, 11, 0.35)" : slot.status === "EMPTY" ? "rgba(244, 63, 94, 0.35)" : undefined
                                }}
                            >
                                <div>
                                    <div className={styles.slotHeader}>
                                        <span className={styles.slotNumberTag}>Slot #{slot.slotNumber}</span>
                                        <span style={{ padding: "0.15rem 0.65rem", borderRadius: "9999px", fontSize: "0.7rem", fontWeight: 700, fontFamily: "Space Grotesk, monospace", ...badgeStyle }}>
                                {slot.status}
                            </span>
                                    </div>

                                    <h3 style={{ fontWeight: 600, color: "#fff", fontSize: "0.95rem", marginBottom: "0.35rem", letterSpacing: "-0.01em" }}>{slot.productName}</h3>

                                    <div className={styles.progressBarContainer}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#a1a1aa", marginBottom: "0.35rem" }}>
                                            <span>Volume Level:</span>
                                            <span style={{ fontWeight: 600, color: "#fff", fontFamily: "monospace" }}>{slot.volumeRemaining}ml / {slot.maxVolume}ml</span>
                                        </div>

                                        {/* Thanh tiến trình có vạch mốc Threshold thực tế */}
                                        <div className={styles.progressBarTrack} style={{ position: "relative" }}>
                                            <div
                                                style={{ height: "100%", borderRadius: "9999px", width: `${percent}%`, backgroundColor: percent > 20 ? "#d4af37" : "#fb7185", transition: "width 0.4s ease" }}
                                            ></div>
                                            {/* Vạch chỉ báo ngưỡng Threshold */}
                                            <div
                                                style={{ position: "absolute", top: 0, bottom: 0, left: `${thresholdPercent}%`, width: "2px", backgroundColor: "#ffffff", opacity: 0.8 }}
                                                title={`Refill Threshold: ${slot.threshold}ml`}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.slotFooter}>
                                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontFamily: "monospace" }}>Refill Threshold: {slot.threshold}ml</span>
                                    <button
                                        onClick={() => toggleSlotStatus(slot.slotNumber)}
                                        className={styles.toggleSlotBtn}
                                        style={{
                                            backgroundColor: slot.status === "DISABLED" ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
                                            color: slot.status === "DISABLED" ? "#34d399" : "#e4e4e7",
                                            borderColor: slot.status === "DISABLED" ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.12)"
                                        }}
                                    >
                                        {slot.status === "DISABLED" ? "Enable Slot" : "Disable Slot"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL 1: MQTT PACKET INSPECTOR (Khi bấm vào Connection) */}
            {activeSensorModal === "connection" && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: "38rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#34d399" }}>
                                <Terminal className="w-5 h-5" />
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>MQTT Telemetry Stream Inspector</h3>
                            </div>
                            <button onClick={() => setActiveSensorModal(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1rem" }}>
                            Live broker traffic for target device: <span style={{ color: "#d4af37", fontFamily: "monospace" }}>{machineInfo.code}</span>
                        </p>
                        <div style={{ background: "#050508", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#34d399", lineHeight: "1.5", maxHeight: "180px", overflowY: "auto" }}>
                            {`[MQTT BROKER] Client connected: ${machineInfo.serial}\n[TOPIC]: ${machineInfo.mqttTopic}\n[QoS]: 1 (At least once)\n[PAYLOAD JSON]:\n{\n  "device_id": "${machineInfo.code}",\n  "status": "${machineInfo.status}",\n  "ping_interval_sec": 30,\n  "signal_dbm": -68,\n  "encryption": "TLS_AES_256_GCM_SHA384"\n}`}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                            <button onClick={() => setActiveSensorModal(null)} className={styles.confirmBtn}>Close Inspector</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: CHAMBER TEMPERATURE ANALYTICS (Khi bấm vào Chamber Temp) */}
            {activeSensorModal === "temperature" && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: "36rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#fbbf24" }}>
                                <Thermometer className="w-5 h-5" />
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>Chamber Thermal Diagnostics</h3>
                            </div>
                            <button onClick={() => setActiveSensorModal(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                            <div className={styles.infoBoxItem}>
                                <span className={styles.infoBoxLabel}>Current Temp</span>
                                <span className={styles.infoBoxValue} style={{ fontSize: "1.25rem", color: "#fbbf24" }}>{machineInfo.temperature}</span>
                            </div>
                            <div className={styles.infoBoxItem}>
                                <span className={styles.infoBoxLabel}>Cooling Fan Status</span>
                                <span className={styles.infoBoxValue} style={{ color: "#34d399" }}>Optimal (1200 RPM)</span>
                            </div>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.5" }}>
                            Thermal regulation system maintains a stable threshold between 18.0°C and 28.0°C to preserve fragrance compound stability in all 4 dispensing chambers.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                            <button onClick={() => setActiveSensorModal(null)} className={styles.confirmBtn}>Acknowledge</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: DEVICE DIAGNOSTICS & LATENCY (Khi bấm vào Last Heartbeat) */}
            {activeSensorModal === "heartbeat" && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: "36rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#60a5fa" }}>
                                <ShieldCheck className="w-5 h-5" />
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>Hardware Diagnostic & Latency Report</h3>
                            </div>
                            <button onClick={() => setActiveSensorModal(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                            <div className={styles.infoBoxItem}>
                                <span className={styles.infoBoxLabel}>Network Latency</span>
                                <span className={styles.infoBoxValue} style={{ color: "#34d399" }}>{machineInfo.latency}</span>
                            </div>
                            <div className={styles.infoBoxItem}>
                                <span className={styles.infoBoxLabel}>Last Handshake</span>
                                <span className={styles.infoBoxValue}>{machineInfo.lastHeartbeat}</span>
                            </div>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.5" }}>
                            Device hardware watchdog is fully operational. Secure encryption keys are up to date and verified against the central ScentStation Cloud HSM.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                            <button onClick={() => setActiveSensorModal(null)} className={styles.confirmBtn}>Close Diagnostics</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Maintenance */}
            {isMaintenanceModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem", color: "#fbbf24" }}>
                            <div style={{ padding: "0.75rem", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Confirm Maintenance Mode</h3>
                                <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Hardware Security Protocol</p>
                            </div>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "1.75rem", lineHeight: "1.6" }}>
                            This action will temporarily suspend all customer orders on Kiosk <span style={{ fontWeight: 700, color: "#d4af37", fontFamily: "monospace" }}>{machineInfo.code}</span> for hardware servicing.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.875rem" }}>
                            <button onClick={() => setIsMaintenanceModal(false)} className={styles.cancelBtn}>Cancel</button>
                            <button
                                onClick={() => {
                                    setIsMaintenanceModal(false);
                                    setToastMessage(`Machine ${machineInfo.code} switched to MAINTENANCE.`);
                                    setTimeout(() => setToastMessage(null), 4000);
                                }}
                                className={styles.confirmBtn}
                            >
                                Confirm Maintenance
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: "fixed",
                    bottom: "2rem",
                    right: "2.5rem",
                    background: "linear-gradient(135deg, rgba(18, 18, 28, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)",
                    border: "1px solid rgba(212, 175, 55, 0.5)",
                    borderRadius: "14px",
                    padding: "1rem 1.5rem",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.9), 0 0 20px rgba(212, 175, 55, 0.2)",
                    color: "#F8F8F8",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    zIndex: 99999,
                    backdropFilter: "blur(20px)"
                }}>
                    <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: toastMessage.includes("MAINTENANCE") ? "#fbbf24" : "#4ADE80",
                        boxShadow: toastMessage.includes("MAINTENANCE") ? "0 0 10px #fbbf24" : "0 0 10px #4ADE80"
                    }}></div>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}