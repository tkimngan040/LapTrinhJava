"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { UserRound, LogOut, ShieldCheck, CircleDot } from "lucide-react";
import { InternalRole, ROLE_PERMISSIONS, normalizeRole } from "@/lib/rbac";

type UserStatus = "online" | "busy" | "offline";

type HeaderProps = {
    role?: string;
    status: UserStatus;
    onStatusChangeAction: (status: UserStatus) => void;
    onLogoutAction: () => void;
};

const LANGUAGE_STORAGE_KEY = "scentstation_preferred_lang_v1";

const STATUS_OPTIONS = [
    {
        value: "online" as const,
        labelVi: "Trực tuyến",
        labelEn: "Online",
        descVi: "Sẵn sàng vận hành",
        descEn: "Available for live operations",
        color: "bg-emerald-400",
        icon: "✓",
    },
    {
        value: "busy" as const,
        labelVi: "Đang bận",
        labelEn: "Busy",
        descVi: "Đang xử lý bảo trì / sự cố",
        descEn: "Engaged in maintenance",
        color: "bg-amber-400",
        icon: "−",
    },
    {
        value: "offline" as const,
        labelVi: "Ngoại tuyến",
        labelEn: "Offline",
        descVi: "Tạm rời vị trí trực",
        descEn: "Away from terminal",
        color: "bg-slate-400",
        icon: "☾",
    },
];

export default function Header({
                                   role = "PSA",
                                   status,
                                   onStatusChangeAction,
                                   onLogoutAction,
                               }: HeaderProps) {
    const [lang, setLang] = useState<"en" | "vi">("vi");
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [userName, setUserName] = useState("Platform Super Administrator");
    const [resolvedRole, setResolvedRole] = useState<InternalRole>(normalizeRole(role));
    const [brandScope, setBrandScope] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const syncHeaderContext = useCallback(() => {
        try {
            const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLang && (savedLang.toLowerCase() === "vi" || savedLang.toLowerCase() === "en")) {
                setLang(savedLang.toLowerCase() as "en" | "vi");
            }

            const rawUser =
                sessionStorage.getItem("scentstation-user") ||
                localStorage.getItem("scentstation-user");
            if (rawUser) {
                const user = JSON.parse(rawUser);
                const norm = normalizeRole(user.roleCode || user.role || role);
                setResolvedRole(norm);
                setUserName(user.fullName || user.name || user.email || ROLE_PERMISSIONS[norm].label);
                setBrandScope(norm === "BA" ? user.brandScope || user.brand || null : null);
            } else {
                setResolvedRole(normalizeRole(role));
            }
        } catch {
            setResolvedRole(normalizeRole(role));
        }
    }, [role]);

    useEffect(() => {
        setMounted(true);
        syncHeaderContext();
        window.addEventListener("storage", syncHeaderContext);
        window.addEventListener("focus", syncHeaderContext);
        window.addEventListener("scentstation-sync", syncHeaderContext);
        return () => {
            window.removeEventListener("storage", syncHeaderContext);
            window.removeEventListener("focus", syncHeaderContext);
            window.removeEventListener("scentstation-sync", syncHeaderContext);
        };
    }, [syncHeaderContext]);

    const handleToggleMenu = () => {
        if (!statusMenuOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 10,
                right: window.innerWidth - rect.right,
            });
        }
        setStatusMenuOpen(!statusMenuOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setStatusMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const roleConfig = ROLE_PERMISSIONS[resolvedRole];
    const roleLabel = lang === "en" ? roleConfig.labelEn : roleConfig.labelVi;
    const currentStatus = STATUS_OPTIONS.find((item) => item.value === status) ?? STATUS_OPTIONS[0];

    return (
        <header className="relative z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-white/10 bg-[#0B0D14] px-6 py-3 md:px-8">
            {/* Left: Brand Identity */}
            <div className="flex min-w-0 items-center gap-3.5">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(212,175,55,0.4)] bg-[#121622]">
                    <Image
                        src="/images/scentstation-logo.png"
                        alt="ScentStation logo"
                        fill
                        sizes="44px"
                        className="object-contain p-2"
                    />
                </div>

                <div className="min-w-0">
                    <h2 className="text-base font-bold tracking-tight text-white">
                        ScentStation Portal
                    </h2>
                    <p className="text-xs text-[#94A3B8] truncate">
                        {lang === "en"
                            ? "Fragrance Dispensing Operations"
                            : "Hệ thống vận hành trạm nước hoa"}
                    </p>
                </div>
            </div>

            {/* Right: User Profile & Actions */}
            <div className="flex shrink-0 items-center gap-4">
                <div className="min-w-0 text-right hidden sm:block">
                    <p className="text-sm font-bold text-white flex items-center justify-end gap-1.5">
                        <span>{userName}</span>
                        <ShieldCheck size={15} className="text-[#D4AF37]" />
                    </p>
                    <p className="max-w-[260px] text-xs text-[#94A3B8] truncate font-medium">
                        {roleLabel}
                        {brandScope ? ` • ${brandScope}` : ""}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Status Dropdown Trigger */}
                    <div className="relative shrink-0">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={handleToggleMenu}
                            aria-label={lang === "en" ? "Change status" : "Đổi trạng thái"}
                            aria-expanded={statusMenuOpen}
                            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#121622] text-[#D4AF37] transition-colors hover:border-[#D4AF37] hover:bg-[#181D2C] cursor-pointer"
                        >
                            <UserRound size={20} strokeWidth={1.8} />
                            <span
                                className={`absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full border-2 border-[#121622] ${currentStatus.color}`}
                            />
                        </button>

                        {mounted &&
                            statusMenuOpen &&
                            createPortal(
                                <div
                                    ref={menuRef}
                                    style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                                    className="fixed z-[99999999] w-64 rounded-xl border border-[rgba(212,175,55,0.45)] bg-[#181D2C] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.9)]"
                                >
                                    <div className="px-2 pb-2 mb-2 border-b border-white/10">
                                        <p className="text-sm font-bold text-white">
                                            {lang === "en" ? "Operator Status" : "Trạng thái trực"}
                                        </p>
                                    </div>

                                    {STATUS_OPTIONS.map((option) => {
                                        const isSelected = status === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    onStatusChangeAction(option.value);
                                                    setStatusMenuOpen(false);
                                                }}
                                                className={`mb-1 flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? "border-[rgba(212,175,55,0.5)] bg-[rgba(212,175,55,0.14)] text-white"
                                                        : "border-transparent hover:bg-white/5 text-[#CBD5E1]"
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0B0D14] border border-white/10 font-bold text-xs ${
                                                        option.value === "online"
                                                            ? "text-emerald-400"
                                                            : option.value === "busy"
                                                                ? "text-amber-400"
                                                                : "text-slate-400"
                                                    }`}
                                                >
                                                    {option.icon}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-xs font-bold">
                                                        {lang === "en" ? option.labelEn : option.labelVi}
                                                    </span>
                                                    <span className="block text-[11px] text-[#94A3B8]">
                                                        {lang === "en" ? option.descEn : option.descVi}
                                                    </span>
                                                </span>
                                                {isSelected && <CircleDot size={14} className="text-[#D4AF37]" />}
                                            </button>
                                        );
                                    })}
                                </div>,
                                document.body
                            )}
                    </div>

                    {/* Logout Button */}
                    <button
                        type="button"
                        onClick={onLogoutAction}
                        aria-label={lang === "en" ? "Sign out" : "Đăng xuất"}
                        title={lang === "en" ? "Sign out" : "Đăng xuất"}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#121622] text-[#D4AF37] transition-colors hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
                    >
                        <LogOut size={18} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </header>
    );
}