"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

type UserStatus = "online" | "busy" | "offline";

interface PortalUser {
    id?: number | string;
    fullName?: string;
    name?: string;
    email?: string;
    brandId?: number | null;
    brandScope?: string | null;
    role?: string;
    roleCode?: string;
    roles?: string[];
}

const SETTINGS_STORAGE_KEY = "scentstation_platform_settings_v2";

export default function PortalLayout({
                                         children,
                                     }: Readonly<{
    children: ReactNode;
}>) {
    const router = useRouter();
    const pathname = usePathname();

    const [role, setRole] = useState<string>("PSA");
    const [status, setStatus] = useState<UserStatus>("online");
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
    const [accentColor, setAccentColor] = useState<string>("#D4AF37");

    /* ---------------------------------------------------------
       1. ĐỒNG BỘ MÀU ACCENT (WORD PALETTE) & THEME XUYÊN SUỐT 18 MÀN HÌNH
    --------------------------------------------------------- */
    const syncGlobalThemeFromSettings = useCallback(() => {
        if (typeof document === "undefined") return;
        try {
            const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            const hexColor = parsed?.primaryColor || "#D4AF37";
            const themeMode = (parsed?.themeMode || "DARK").toLowerCase();

            setAccentColor(hexColor);

            const root = document.documentElement;
            root.style.setProperty("--ss-gold-primary", hexColor);
            root.setAttribute("data-ss-theme", themeMode);

            let styleTag = document.getElementById(
                "ss-global-accent-override"
            ) as HTMLStyleElement | null;
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = "ss-global-accent-override";
                document.head.appendChild(styleTag);
            }

            // Phủ màu Primary Accent đồng bộ lên toàn bộ 18 màn hình + Sidebar + Header
            styleTag.innerHTML = `
                :root, html, body, main, div[class*="container"] {
                    --ss-gold-primary: ${hexColor} !important;
                }
                button[class*="primaryGoldBtn"],
                button[class*="categoryTabBtnActive"],
                button[class*="quickRangePillActive"],
                button[class*="tabBtnActive"],
                button[class*="drawerTabBtnActive"],
                button[class*="calendarDaySelected"] {
                    background: linear-gradient(135deg, ${hexColor} 0%, #F5E6AD 100%) !important;
                    border-color: ${hexColor} !important;
                    color: #050508 !important;
                }
                span[class*="eyebrowTag"],
                svg[color="#D4AF37"] {
                    color: ${hexColor} !important;
                }
                div[class*="kpiCardActive"],
                div[class*="summaryCardActive"],
                div[class*="heroBannerCard"],
                div[class*="tableCard"],
                div[class*="sectionCard"],
                div[class*="analyticsCard"],
                div[class*="filterBar"],
                div[class*="card"] {
                    border-color: ${hexColor}59 !important;
                }
            `;
        } catch {
            // Safe fallback
        }
    }, []);

    /* ---------------------------------------------------------
       2. ĐỒNG BỘ PHIÊN ĐĂNG NHẬP & VAI TRÒ (RBAC) 2 CHIỀU VỚI /login, /users, /profile
    --------------------------------------------------------- */
    const verifyAndSyncSession = useCallback(() => {
        const token =
            sessionStorage.getItem("scentstation-token") ||
            localStorage.getItem("scentstation-token");
        const savedUser =
            sessionStorage.getItem("scentstation-user") ||
            localStorage.getItem("scentstation-user");

        if (!token || !savedUser) {
            router.replace("/login");
            return;
        }

        try {
            const user: PortalUser = JSON.parse(savedUser);
            const resolvedRole =
                user.roles?.[0] || user.roleCode || user.role || "PSA";
            const resolvedName = user.fullName || user.name;

            if (!resolvedName || !resolvedRole) {
                throw new Error("Invalid user session");
            }

            // Đảm bảo cả sessionStorage và localStorage luôn đồng nhất cho mọi màn hình đọc
            if (!sessionStorage.getItem("scentstation-user")) {
                sessionStorage.setItem("scentstation-user", savedUser);
            }
            if (!sessionStorage.getItem("scentstation-token")) {
                sessionStorage.setItem("scentstation-token", token);
            }

            setRole(resolvedRole);
            setIsCheckingAuth(false);
        } catch {
            sessionStorage.removeItem("scentstation-token");
            sessionStorage.removeItem("scentstation-user");
            sessionStorage.removeItem("scentstation-remember");
            localStorage.removeItem("scentstation-token");
            localStorage.removeItem("scentstation-user");

            router.replace("/login");
        }
    }, [router]);

    useEffect(() => {
        verifyAndSyncSession();
        syncGlobalThemeFromSettings();

        const handleGlobalSync = () => {
            verifyAndSyncSession();
            syncGlobalThemeFromSettings();
        };

        window.addEventListener("storage", handleGlobalSync);
        window.addEventListener("focus", handleGlobalSync);
        window.addEventListener("scentstation-sync", handleGlobalSync);

        return () => {
            window.removeEventListener("storage", handleGlobalSync);
            window.removeEventListener("focus", handleGlobalSync);
            window.removeEventListener("scentstation-sync", handleGlobalSync);
        };
    }, [verifyAndSyncSession, syncGlobalThemeFromSettings, pathname]);

    function handleLogout() {
        sessionStorage.removeItem("scentstation-token");
        sessionStorage.removeItem("scentstation-user");
        sessionStorage.removeItem("scentstation-remember");
        sessionStorage.removeItem("scentstation-demo-user");
        sessionStorage.removeItem("scentstation-demo-role");
        sessionStorage.removeItem("scentstation-demo-remember");

        localStorage.removeItem("scentstation-token");
        localStorage.removeItem("scentstation-user");
        localStorage.removeItem("scentstation-remember");

        router.replace("/login");
    }

    if (isCheckingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#040407] text-[#F5E6AD]">
                <div className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/40 bg-[#0D0D15] px-6 py-4 shadow-2xl">
                    <span
                        className="h-2.5 w-2.5 animate-ping rounded-full"
                        style={{ backgroundColor: accentColor }}
                    />
                    <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#F5E6AD]">
                        Verifying ScentStation Executive Session...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <div
            className="flex h-screen overflow-hidden bg-[#040407] text-[#F8FAFC]"
            style={
                {
                    "--ss-gold-primary": accentColor,
                } as React.CSSProperties
            }
        >
            <Sidebar
                role={role}
                collapsed={sidebarCollapsed}
                onToggleAction={() =>
                    setSidebarCollapsed((current) => !current)
                }
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#040407]">
                <div className="relative z-40 shrink-0">
                    <Header
                        role={role}
                        status={status}
                        onStatusChangeAction={setStatus}
                        onLogoutAction={handleLogout}
                    />
                </div>

                <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#040407]">
                    {children}
                </main>
            </div>
        </div>
    );
}