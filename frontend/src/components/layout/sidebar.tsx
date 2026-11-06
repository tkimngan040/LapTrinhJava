"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Sparkles,
    Users,
    FlaskConical,
    Cpu,
    Boxes,
    ArrowLeftRight,
    Wrench,
    BellRing,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Zap
} from "lucide-react";

const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Brands", href: "/brands", icon: Sparkles },
    { label: "Users & Access", href: "/users", icon: Users },
    { label: "Products", href: "/products", icon: FlaskConical },
    { label: "Machines", href: "/machines", icon: Cpu },
    { label: "Inventory", href: "/inventory", icon: Boxes },
    { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { label: "Maintenance", href: "/maintenance", icon: Wrench },
    { label: "Alerts", href: "/alerts", icon: BellRing },
    { label: "Reports", href: "/reports", icon: BarChart3 },
];

type SidebarProps = {
    role?: string;
    collapsed?: boolean;
    onToggleAction?: () => void;
};

export default function Sidebar({
                                    role: roleProp,
                                    collapsed = false,
                                    onToggleAction,
                                }: SidebarProps) {
    const pathname = usePathname();
    const [storedRole, setStoredRole] = useState<string | null>(null);

    useEffect(() => {
        const savedRole = sessionStorage.getItem("scentstation-demo-role");
        setStoredRole(savedRole);
    }, []);

    const role = roleProp ?? storedRole;
    const visibleItems =
        role === null
            ? []
            : role === "VW"
                ? menuItems.filter(
                    (item) =>
                        item.href === "/dashboard" ||
                        item.href === "/reports"
                )
                : menuItems;

    return (
        <aside
            className={`relative isolate flex min-h-screen shrink-0 flex-col overflow-hidden bg-[#07070C] border-r border-[rgba(212,175,55,0.18)] text-white transition-all duration-300 ${
                collapsed ? "w-[80px]" : "w-[280px]"
            }`}
            style={{
                boxShadow: "5px 0 30px rgba(0, 0, 0, 0.8)"
            }}
        >
            {/* Background Radial Glow & Noise Effect tinh tế */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 opacity-30 bg-no-repeat"
                style={{
                    backgroundImage: "url('/images/sidebar-luxury.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#0A0A10]/95 via-[#07070C]/90 to-[#030305]"
            />

            {/* Hiệu ứng ánh sáng điểm nhấn góc trên */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -left-20 w-40 h-40 rounded-full bg-[rgba(212,175,55,0.15)] blur-[50px] z-0"
            />

            {/* Toggle button thu gọn / mở rộng sắc nét */}
            <button
                type="button"
                onClick={onToggleAction}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={`absolute top-7 z-30 flex h-9 w-9 items-center justify-center
                rounded-xl border border-[rgba(212,175,55,0.4)]
                bg-[#12121A] text-[#D4AF37]
                shadow-[0_0_15px_rgba(212,175,55,0.2)]
                transition-all duration-200
                hover:scale-105 hover:bg-[#1E1E2C] hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]
                focus-visible:outline-none
                ${collapsed ? "left-1/2 -translate-x-1/2" : "right-4"}`}
            >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Brand Header */}
            <div
                className={`relative z-10 flex min-h-[90px] items-center border-b border-[rgba(255,255,255,0.08)] ${
                    collapsed ? "justify-center px-2" : "px-6 py-5 pr-14"
                }`}
            >
                {collapsed ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.4)] text-[#D4AF37] font-bold text-lg shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                        S
                    </div>
                ) : (
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-[#F3E7C4] to-[#D4AF37] bg-clip-text text-transparent">
                            ScentStation
                        </h1>
                        <p className="mt-0.5 text-xs tracking-wider text-[#94A3B8] font-medium uppercase">
                            Experience Platform
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation Menu */}
            <div className={`relative z-10 flex-1 py-6 ${collapsed ? "px-2.5" : "px-4"}`}>
                {!collapsed && (
                    <div className="mb-3 px-3 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">
                            Workspace
                        </span>
                        <Zap size={12} className="text-[#D4AF37] animate-pulse" />
                    </div>
                )}

                <nav className="space-y-1.5">
                    {visibleItems.map((item) => {
                        const active = pathname === item.href;
                        const IconComponent = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                title={collapsed ? item.label : undefined}
                                className={`group relative flex items-center gap-3.5 rounded-xl border py-3 text-sm font-medium transition-all duration-200 ${
                                    collapsed ? "justify-center px-2" : "px-3.5"
                                } ${
                                    active
                                        ? "border-[rgba(212,175,55,0.5)] bg-[rgba(212,175,55,0.12)] text-[#F3E7C4] shadow-[0_0_20px_rgba(212,175,55,0.18)]"
                                        : "border-transparent text-[#94A3B8] hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                                }`}
                            >
                                {/* Hiệu ứng thanh phát quang bên trái khi active */}
                                {active && (
                                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
                                )}

                                <IconComponent
                                    size={20}
                                    strokeWidth={active ? 2.2 : 1.7}
                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                                        active ? "text-[#D4AF37]" : "text-[#64748B] group-hover:text-[#D4AF37]"
                                    }`}
                                />

                                {!collapsed && (
                                    <span className="whitespace-nowrap tracking-wide">
                                        {item.label}
                                    </span>
                                )}

                                {active && !collapsed && (
                                    <span className="ml-auto flex h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer trạng thái hệ thống nhỏ gọn sống động */}
            {!collapsed && (
                <div className="relative z-10 p-4 m-3 rounded-xl border border-[rgba(212,175,55,0.15)] bg-[rgba(10,10,16,0.6)] backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-semibold text-white tracking-wider">IoT Network Active</span>
                            <span className="text-[10px] text-[#94A3B8]">4 Slots Synchronized</span>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}