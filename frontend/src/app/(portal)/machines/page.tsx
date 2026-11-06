"use client";

import React, { useState } from "react";
import { Search, Server, MapPin, Clock, ExternalLink, Cpu, Activity, AlertTriangle, WifiOff, ChevronDown } from "lucide-react";
import Link from "next/link";
import styles from "./machines.module.css";

interface Machine {
    id: string;
    code: string;
    location: string;
    status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
    activeSlots: number;
    totalSlots: number;
    lastActivity: string;
    firmware: string;
}

const initialMachines: Machine[] = [
    { id: "kiok-01", code: "KIOSK-001", location: "Takashimaya Flagship, TP.HCM", status: "ONLINE", activeSlots: 4, totalSlots: 4, lastActivity: "Just now", firmware: "FR2.6" },
    { id: "kiok-02", code: "KIOSK-002", location: "Vincom Center Dong Khoi, TP.HCM", status: "ONLINE", activeSlots: 3, totalSlots: 4, lastActivity: "2 mins ago", firmware: "FR2.6" },
    { id: "kiok-03", code: "KIOSK-003", location: "Lotte Center, Hanoi", status: "MAINTENANCE", activeSlots: 0, totalSlots: 4, lastActivity: "45 mins ago", firmware: "FR2.5" },
    { id: "kiok-04", code: "KIOSK-004", location: "Aeon Mall Tan Phu, TP.HCM", status: "OFFLINE", activeSlots: 0, totalSlots: 4, lastActivity: "3 hours ago", firmware: "FR2.6" },
    { id: "kiok-05", code: "KIOSK-005", location: "Landmark 81 SkyView, TP.HCM", status: "ONLINE", activeSlots: 4, totalSlots: 4, lastActivity: "1 min ago", firmware: "FR2.6" },
    { id: "kiok-06", code: "KIOSK-006", location: "Hanoi Centerpoint, Hanoi", status: "ONLINE", activeSlots: 2, totalSlots: 4, lastActivity: "5 mins ago", firmware: "FR2.5" },
];

export default function MachinesPage() {
    const [machines] = useState<Machine[]>(initialMachines);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const onlineCount = machines.filter(m => m.status === "ONLINE").length;
    const offlineCount = machines.filter(m => m.status === "OFFLINE").length;
    const maintenanceCount = machines.filter(m => m.status === "MAINTENANCE").length;

    const filteredMachines = machines.filter(m => {
        const matchesSearch = m.code.toLowerCase().includes(searchQuery.toLowerCase()) || m.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusLabels: Record<string, string> = {
        ALL: "All Statuses",
        ONLINE: "Online",
        OFFLINE: "Offline",
        MAINTENANCE: "Maintenance"
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>IoT Machine Fleet Management</h1>
                    <p className={styles.subtitle}>Real-time telemetry, firmware tracking, and hardware health monitoring across all luxury kiosks.</p>
                </div>
            </div>

            {/* Các thẻ thống kê tổng quan */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div>
                        <p className={styles.statLabel}>Total Kiosks</p>
                        <p className={styles.statValue}>{machines.length}</p>
                    </div>
                    <div className={styles.statIconBox} style={{ color: "#D4AF37", background: "rgba(212, 175, 55, 0.1)" }}>
                        <Cpu className="w-5 h-5" />
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.statOnline}`}>
                    <div>
                        <p className={styles.statLabel}>Online & Active</p>
                        <p className={styles.statValue} style={{ color: "#4ADE80" }}>{onlineCount}</p>
                    </div>
                    <div className={styles.statIconBox} style={{ color: "#4ADE80", background: "rgba(74, 222, 128, 0.1)" }}>
                        <Activity className="w-5 h-5" />
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.statMaintenance}`}>
                    <div>
                        <p className={styles.statLabel}>Under Maintenance</p>
                        <p className={styles.statValue} style={{ color: "#F59E0B" }}>{maintenanceCount}</p>
                    </div>
                    <div className={styles.statIconBox} style={{ color: "#F59E0B", background: "rgba(245, 158, 11, 0.1)" }}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                <div className={`${styles.statCard} ${styles.statOffline}`}>
                    <div>
                        <p className={styles.statLabel}>Offline / Disconnected</p>
                        <p className={styles.statValue} style={{ color: "#F87171" }}>{offlineCount}</p>
                    </div>
                    <div className={styles.statIconBox} style={{ color: "#F87171", background: "rgba(248, 113, 113, 0.1)" }}>
                        <WifiOff className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Thanh Tìm Kiếm & Bộ Lọc Custom Dropdown */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by kiosk code (e.g., KIOSK-001) or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.dropdownContainer}>
                    <div
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className={styles.dropdownHeader}
                    >
                        <span>{statusLabels[statusFilter] || "All Statuses"}</span>
                        <ChevronDown
                            className="w-4 h-4 text-amber-400"
                            style={{
                                transform: isStatusDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.3s ease"
                            }}
                        />
                    </div>

                    {isStatusDropdownOpen && (
                        <div className={styles.dropdownList}>
                            {["ALL", "ONLINE", "OFFLINE", "MAINTENANCE"].map((val) => (
                                <div
                                    key={val}
                                    onClick={() => {
                                        setStatusFilter(val);
                                        setIsStatusDropdownOpen(false);
                                    }}
                                    className={styles.dropdownItem}
                                >
                                    {statusLabels[val]}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Danh sách 6 máy chuẩn SaaS Kiosk */}
            <div className={styles.machinesGrid}>
                {filteredMachines.map((machine) => {
                    let badgeClass = styles.badgeOnline;
                    let dotClass = styles.dotOnline;
                    if (machine.status === "OFFLINE") {
                        badgeClass = styles.badgeOffline;
                        dotClass = styles.dotOffline;
                    }
                    if (machine.status === "MAINTENANCE") {
                        badgeClass = styles.badgeMaintenance;
                        dotClass = styles.dotMaintenance;
                    }

                    const slotPercentage = (machine.activeSlots / machine.totalSlots) * 100;

                    return (
                        <div key={machine.id} className={styles.machineCard}>
                            <div>
                                <div className={styles.cardHeader}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <div className={styles.serverIconBox}>
                                            <Server className="w-5 h-5 text-amber-300" />
                                        </div>
                                        <div>
                                            <h3 className={styles.machineCode}>{machine.code}</h3>
                                            <p className={styles.machineLocation}>
                                                <MapPin className="w-3.5 h-3.5 text-amber-400" /> {machine.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={badgeClass}>
                                        <span className={dotClass}></span>
                                        {machine.status}
                                    </div>
                                </div>

                                <div className={styles.infoBox}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Active Slots</span>
                                        <span className={styles.infoValue}>{machine.activeSlots} / {machine.totalSlots} Slots</span>
                                    </div>
                                    {/* Thanh tiến trình slot trực quan */}
                                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden", marginTop: "-2px", marginBottom: "4px" }}>
                                        <div style={{ width: `${slotPercentage}%`, height: "100%", background: slotPercentage === 100 ? "linear-gradient(90deg, #4ADE80, #22C55E)" : slotPercentage > 0 ? "linear-gradient(90deg, #F59E0B, #FBBF24)" : "#EF4444", transition: "width 0.4s ease" }}></div>
                                    </div>

                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Firmware Ver.</span>
                                        <span className={styles.firmwareTag}>{machine.firmware}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Last Heartbeat</span>
                                        <span className={styles.lastSeenText}>
                                            <Clock className="w-3.5 h-3.5 text-amber-400" /> {machine.lastActivity}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Link href={`/machines/${machine.id}`} className={styles.detailLink}>
                                <span>Configure 4-Slot Hardware</span>
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}