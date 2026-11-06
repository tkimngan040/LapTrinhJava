"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { UserRound, LogOut, ShieldCheck, Sparkles, CircleDot } from "lucide-react";

type UserStatus = "online" | "busy" | "offline";

type HeaderProps = {
    role?: string;
    status: UserStatus;
    onStatusChangeAction: (status: UserStatus) => void;
    onLogoutAction: () => void;
};

const ROLE_LABELS: Record<string, string> = {
    PSA: "Platform Super Administrator",
    BA: "Brand Administrator",
    OM: "Operations Manager",
    TE: "Technician",
    IS: "Inventory Staff",
    VW: "Viewer",
};

const STATUS_OPTIONS = [
    { value: "online", label: "Online", color: "bg-emerald-400", shadow: "shadow-[0_0_12px_#34d399]" },
    { value: "busy", label: "Busy", color: "bg-amber-400", shadow: "shadow-[0_0_12px_#fbbf24]" },
    { value: "offline", label: "Offline", color: "bg-slate-400", shadow: "shadow-[0_0_12px_#94a3b8]" },
] as const;

export default function Header({
                                   role = "PSA",
                                   status,
                                   onStatusChangeAction,
                                   onLogoutAction,
                               }: HeaderProps) {
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [userName, setUserName] = useState("Platform Administrator");
    const [mounted, setMounted] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const savedUser = sessionStorage.getItem("scentstation-user");
        if (!savedUser) {
            setUserName("Platform Administrator");
            return;
        }
        try {
            const user = JSON.parse(savedUser);
            setUserName(user.fullName || user.email || "Platform Administrator");
        } catch {
            setUserName("Platform Administrator");
        }
    }, []);

    // Tính toán tọa độ và bật/tắt menu
    const handleToggleMenu = () => {
        if (!statusMenuOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 12,
                right: window.innerWidth - rect.right,
            });
        }
        setStatusMenuOpen(!statusMenuOpen);
    };

    // Đóng menu khi click ra ngoài
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

    const roleLabel = ROLE_LABELS[role] ?? role;
    const currentStatus = STATUS_OPTIONS.find((item) => item.value === status) ?? STATUS_OPTIONS[0];

    return (
        <header className="relative z-30 flex min-h-[100px] items-center justify-between gap-4 border-b border-[rgba(212,175,55,0.3)] bg-gradient-to-r from-[#07070C] via-[#101018] to-[#07070C] px-6 py-4 backdrop-blur-2xl md:px-8 shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
            {/* Hiệu ứng ánh sáng lan tỏa phía sau header */}
            <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/3 w-[500px] h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.08)] via-transparent to-transparent blur-2xl z-0" />

            {/* Left: Brand Identity */}
            <div className="relative z-10 flex min-w-0 items-center gap-4">
                <div className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.5)] bg-gradient-to-br from-[#1A1A24] to-[#0A0A10] shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all duration-300 hover:border-[#D4AF37] hover:scale-105">
                    <Image
                        src="/images/scentstation-logo.png"
                        alt="ScentStation logo"
                        fill
                        sizes="64px"
                        className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#F3E7C4] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm">
                            ScentStation Portal
                        </h2>
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[rgba(212,175,55,0.12)] text-[#D4AF37] border border-[rgba(212,175,55,0.35)] shadow-[0_0_10px_rgba(212,175,55,0.15)]">
                            <Sparkles size={10} className="animate-spin" /> SECURE IOT
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-[#94A3B8] tracking-wide font-medium">
                        Perfume Experience & Dispensing Platform
                    </p>
                </div>
            </div>

            {/* Right: User Profile & Actions */}
            <div className="relative z-10 flex shrink-0 items-center gap-5 md:gap-6">
                <div className="min-w-0 text-right hidden sm:block">
                    <p className="text-sm font-bold text-white tracking-wide flex items-center justify-end gap-1.5">
                        {userName} <ShieldCheck size={16} className="text-[#D4AF37]" />
                    </p>
                    <p className="mt-0.5 max-w-[260px] text-xs text-[#94A3B8] truncate font-medium">
                        {roleLabel}
                    </p>
                </div>

                <div className="flex items-center gap-3.5">
                    {/* Status Dropdown Trigger */}
                    <div className="relative shrink-0">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={handleToggleMenu}
                            aria-label={`Availability: ${currentStatus.label}. Change status`}
                            aria-expanded={statusMenuOpen}
                            className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.4)] bg-gradient-to-br from-[#151520] to-[#0A0A10] text-[#D4AF37] shadow-[0_5px_20px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-[#1E1E2C] hover:border-[#D4AF37] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:scale-105 cursor-pointer"
                        >
                            <UserRound size={24} strokeWidth={1.8} />
                            <span className={`absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-[#0A0A10] ${currentStatus.color} ${currentStatus.shadow}`} />
                        </button>

                        {/* Sử dụng React Portal để đẩy popup ra thẳng document.body, xóa bỏ hoàn toàn lỗi bị đè */}
                        {mounted && statusMenuOpen && createPortal(
                            <div
                                ref={menuRef}
                                style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                                className="fixed z-[99999999] w-72 rounded-2xl border border-[rgba(212,175,55,0.5)] bg-[#12121A]/95 p-3.5 shadow-[0_40px_100px_rgba(0,0,0,0.95)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                            >
                                <div className="flex items-center gap-3 px-2 py-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.4)] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Operator Status</p>
                                        <p className="text-xs text-[#94A3B8]">Set your availability mode</p>
                                    </div>
                                </div>

                                <div className="my-2.5 border-t border-white/10" />

                                {STATUS_OPTIONS.map((option) => {
                                    const isSelected = status === option.value;
                                    const statusStyles = {
                                        online: { icon: "✓", desc: "Available for live operations" },
                                        busy: { icon: "−", desc: "Engaged in system maintenance" },
                                        offline: { icon: "☾", desc: "Logged out from terminal" },
                                    }[option.value];

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                onStatusChangeAction(option.value);
                                                setStatusMenuOpen(false);
                                            }}
                                            className={`mb-1.5 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer ${
                                                isSelected
                                                    ? "border-[rgba(212,175,55,0.6)] bg-[rgba(212,175,55,0.15)] text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                                                    : "border-transparent hover:bg-white/5 text-[#CBD5E1]"
                                            }`}
                                        >
                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/50 border border-white/10 font-bold text-sm ${
                                                option.value === 'online' ? 'text-emerald-400' : option.value === 'busy' ? 'text-amber-400' : 'text-slate-400'
                                            }`}>
                                                {statusStyles.icon}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold">{option.label}</span>
                                                <span className="block text-[11px] text-[#94A3B8]">{statusStyles.desc}</span>
                                            </span>
                                            {isSelected && <CircleDot size={16} className="text-[#D4AF37]" />}
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
                        aria-label="Sign out"
                        title="Sign out of portal"
                        className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.4)] bg-gradient-to-br from-[#151520] to-[#0A0A10] text-[#D4AF37] shadow-[0_5px_20px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-rose-500/15 hover:border-rose-500/60 hover:text-rose-400 hover:shadow-[0_0_25px_rgba(244,63,94,0.3)] hover:scale-105 cursor-pointer"
                    >
                        <LogOut size={22} strokeWidth={2} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                </div>
            </div>
        </header>
    );
}