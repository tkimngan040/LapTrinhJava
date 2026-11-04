
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: "▦" },
    { label: "Brands", href: "/brands", icon: "◇" },
    { label: "Users & Access", href: "/users", icon: "♙" },
    { label: "Products", href: "/products", icon: "♢" },
    { label: "Machines", href: "/machines", icon: "▣" },
    { label: "Inventory", href: "/inventory", icon: "▤" },
    { label: "Transactions", href: "/transactions", icon: "⇄" },
    { label: "Maintenance", href: "/maintenance", icon: "⚙" },
    { label: "Alerts", href: "/alerts", icon: "♧" },
    { label: "Reports", href: "/reports", icon: "▥" },
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
            className={`relative isolate flex min-h-screen shrink-0 flex-col overflow-hidden bg-[#28190f] text-white transition-[width] duration-300 ${
                collapsed ? "w-[76px]" : "w-[300px]"
            }`}
        >
            {/* Luxury background image */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 bg-no-repeat"
                style={{
                    backgroundImage: "url('/images/sidebar-luxury.png')",
                    backgroundSize: "auto 100%",
                    backgroundPosition: "65% center",
                }}
            />

            {/* Dark overlay */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#28170f]/95 via-[#28170f]/80 to-[#28170f]/40"
            />



            {/* Toggle button */}
            <button
                type="button"
                onClick={onToggleAction}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}

                className={`absolute top-8 z-30 flex h-12 w-12 items-center justify-center
    rounded-full border border-[#f0c982]/80
    bg-gradient-to-br from-[#b98549] to-[#80502d]
    text-3xl font-light text-[#fff4dc]
    shadow-[0_4px_14px_rgba(0,0,0,0.3)]
    transition-all duration-200
    hover:scale-105 hover:from-[#d5a766] hover:to-[#9b6336]
    hover:shadow-[0_0_16px_rgba(229,182,111,0.3)]
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-[#f0c982]/70
    ${
                    collapsed
                        ? "left-1/2 -translate-x-1/2"
                        : "right-4"
                }`}

            >
                {collapsed ? "›" : "‹"}
            </button>



            {/* Brand */}
            <div
                className={`relative z-10 flex min-h-[105px] items-center border-b border-white/10 ${
                    collapsed
                        ? "justify-center px-2"
                        : "px-5 py-6 pr-14"
                }`}
            >
                {collapsed ? (
                    <span className="text-2xl font-bold text-[#e5b66f]">
                        S
                    </span>
                ) : (
                    <div>
                        <h1 className="text-[28px] font-bold tracking-wide text-[#e5b66f]">
                            ScentStation
                        </h1>
                        <p className="mt-2 text-sm text-white/70">
                            Perfume Experience Platform
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div
                className={`relative z-10 flex-1 py-5 ${
                    collapsed ? "px-2" : "px-4"
                }`}
            >
                {!collapsed && (
                    <p className="mb-4 px-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#d2bda5]/85">
                        Workspace
                    </p>
                )}

                <nav className="space-y-1.5">
                    {visibleItems.map((item) => {
                        const active = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                title={collapsed ? item.label : undefined}
                                className={`group flex items-center gap-3 rounded-xl border py-3.5 text-base transition duration-200 ${
                                    collapsed
                                        ? "justify-center px-2"
                                        : "px-4"
                                } ${
                                    active
                                        ? "border-[#e7bd7b]/60 bg-[#8b5a32]/90 font-semibold text-[#fff5e5] shadow-md"
                                        : "border-transparent text-white/85 hover:border-white/15 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <span
                                    className={`flex w-5 shrink-0 items-center justify-center text-lg ${
                                        active
                                            ? "text-[#ffdda0]"
                                            : "text-[#d7b98e] group-hover:text-[#ffdda0]"
                                    }`}
                                >
                                    {item.icon}
                                </span>

                                {!collapsed && (
                                    <span className="whitespace-nowrap">
                                        {item.label}
                                    </span>
                                )}

                                {active && !collapsed && (
                                    <span className="ml-auto h-5 w-1 rounded-full bg-[#e5b66f]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}

        </aside>
    );
}
