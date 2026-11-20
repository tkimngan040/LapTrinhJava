"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
    LayoutDashboard,
    Sparkles,
    Users,
    FlaskConical,
    Cpu,
    Boxes,
    Droplets,
    ArrowLeftRight,
    Wrench,
    BellRing,
    BarChart3,
    UserCircle,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { InternalRole, isRouteAllowedForRole, normalizeRole } from "@/lib/rbac";

const MENU_ITEMS = [
    { labelVi: "Tổng quan", labelEn: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { labelVi: "Cảnh báo", labelEn: "Alerts", href: "/alerts", icon: BellRing },
    { labelVi: "Thương hiệu", labelEn: "Brands", href: "/brands", icon: Sparkles },
    { labelVi: "Sản phẩm", labelEn: "Products", href: "/products", icon: FlaskConical },
    { labelVi: "Đội máy", labelEn: "Machines", href: "/machines", icon: Cpu },
    { labelVi: "Giao dịch", labelEn: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { labelVi: "Tồn kho", labelEn: "Inventory", href: "/inventory", icon: Boxes },
    { labelVi: "Nạp & Thay bình", labelEn: "Refill / Replace", href: "/refill", icon: Droplets },
    { labelVi: "Bảo trì", labelEn: "Maintenance", href: "/maintenance", icon: Wrench },
    { labelVi: "Người dùng", labelEn: "Users & Roles", href: "/users", icon: Users },
    { labelVi: "Báo cáo", labelEn: "Reports", href: "/reports", icon: BarChart3 },
    { labelVi: "Hồ sơ cá nhân", labelEn: "Profile", href: "/profile", icon: UserCircle },
    { labelVi: "Cài đặt", labelEn: "Settings", href: "/settings", icon: Settings },
];

const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

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
    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [resolvedRole, setResolvedRole] = useState<InternalRole>(normalizeRole(roleProp));

    const syncSidebarContext = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const u = JSON.parse(rawUser);
                setResolvedRole(normalizeRole(u.roleCode || u.role || roleProp));
            } else {
                const demoRole = sessionStorage.getItem("scentstation-demo-role");
                setResolvedRole(normalizeRole(roleProp || demoRole || "PSA"));
            }
        } catch {
            setResolvedRole(normalizeRole(roleProp));
        }
    }, [roleProp]);

    useEffect(() => {
        syncSidebarContext();
        window.addEventListener("storage", syncSidebarContext);
        window.addEventListener("focus", syncSidebarContext);
        window.addEventListener("scentstation-sync", syncSidebarContext);
        return () => {
            window.removeEventListener("storage", syncSidebarContext);
            window.removeEventListener("focus", syncSidebarContext);
            window.removeEventListener("scentstation-sync", syncSidebarContext);
        };
    }, [syncSidebarContext]);

    const visibleItems = MENU_ITEMS.filter((item) =>
        isRouteAllowedForRole(resolvedRole, item.href)
    );

    return (
        <aside
            className={`relative flex min-h-screen shrink-0 flex-col border-r border-white/10 bg-[#0B0D14] text-white transition-all duration-200 ${
                collapsed ? "w-[76px]" : "w-[250px]"
            }`}
        >
            {/* Brand Header & Toggle */}
            <div
                className={`flex min-h-[76px] items-center border-b border-white/10 ${
                    collapsed ? "justify-center px-2" : "justify-between px-5"
                }`}
            >
                {!collapsed && (
                    <div>
                        <h1 className="text-lg font-extrabold tracking-tight text-white">
                            ScentStation
                        </h1>
                        <p className="text-[11px] font-semibold text-[#94A3B8]">
                            {lang === "en" ? "Operations Portal" : "Cổng quản trị"}
                        </p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={onToggleAction}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#121622] text-[#D4AF37] transition-colors hover:border-[#D4AF37] hover:bg-[#181D2C] cursor-pointer"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Navigation Menu */}
            <div className={`flex-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
                <nav className="space-y-1">
                    {visibleItems.map((item) => {
                        const active =
                            pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const IconComponent = item.icon;
                        const label = lang === "en" ? item.labelEn : item.labelVi;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                title={collapsed ? label : undefined}
                                className={`relative flex items-center gap-3 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                                    collapsed ? "justify-center px-2" : "px-3"
                                } ${
                                    active
                                        ? "border-[rgba(212,175,55,0.45)] bg-[rgba(212,175,55,0.14)] text-[#F5E6AD]"
                                        : "border-transparent text-[#94A3B8] hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                {active && (
                                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#D4AF37]" />
                                )}

                                <IconComponent
                                    size={18}
                                    strokeWidth={active ? 2.2 : 1.8}
                                    className={`shrink-0 ${
                                        active ? "text-[#D4AF37]" : "text-[#64748B]"
                                    }`}
                                />

                                {!collapsed && (
                                    <span className="whitespace-nowrap truncate">{label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            {!collapsed && (
                <div className="m-3 rounded-xl border border-white/10 bg-[#121622] px-3.5 py-3">
                    <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                                {lang === "en" ? "IoT Network Online" : "Mạng IoT trực tuyến"}
                            </p>
                            <p className="text-[11px] text-[#94A3B8] truncate">
                                {resolvedRole} • {visibleItems.length}{" "}
                                {lang === "en" ? "modules" : "phân hệ"}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}