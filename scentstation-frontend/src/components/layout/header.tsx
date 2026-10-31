
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { UserRound, LogOut } from "lucide-react";

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
    {
        value: "online",
        label: "Online",
        color: "bg-emerald-500",
    },
    {
        value: "busy",
        label: "Busy",
        color: "bg-amber-500",
    },
    {
        value: "offline",
        label: "Offline",
        color: "bg-gray-400",
    },
] as const;

export default function Header({
                                   role = "PSA",
                                   status,
                                   onStatusChangeAction,
                                   onLogoutAction,
                               }: HeaderProps) {
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [userName, setUserName] = useState("Administrator");

    useEffect(() => {
        const savedUser = sessionStorage.getItem("scentstation-user");

        if (!savedUser) {
            setUserName("Administrator");
            return;
        }

        try {
            const user = JSON.parse(savedUser);

            setUserName(user.fullName || user.email || "User");
        } catch {
            setUserName("User");
        }
    }, []);
    const roleLabel = ROLE_LABELS[role] ?? role;

    const currentStatus =
        STATUS_OPTIONS.find((item) => item.value === status) ??
        STATUS_OPTIONS[0];

    return (
        <header className="relative z-30 flex min-h-[100px] items-center justify-between gap-4 border-b border-[#e8ddcd] bg-[#f7f2e9] px-5 py-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">


                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#6B4226] bg-[#3B2418] shadow-md md:h-[76px] md:w-[76px]">
                    <Image
                        src="/images/scentstation-logo.png"
                        alt="ScentStation logo"
                        fill
                        sizes="76px"
                        className="object-contain p-1.5"
                    />
                </div>



                <div className="min-w-0">
                    <h2 className="font-serif text-lg font-semibold tracking-wide text-[#39291d] md:text-xl">
                        ScentStation Portal
                    </h2>
                    <p className="mt-1 text-xs text-[#887967] sm:text-sm">
                        Perfume Experience Platform
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 md:gap-5">
                <div className="min-w-0 text-right">
                    <p className="text-base font-semibold text-[#302016] md:text-lg">
                        {userName}
                    </p>
                    <p className="mt-1 max-w-[240px] text-xs text-[#8c7a65] sm:text-sm">
                        {roleLabel}
                    </p>
                </div>

                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() =>
                            setStatusMenuOpen((open) => !open)
                        }
                        aria-label={`Availability: ${currentStatus.label}. Change status`}
                        aria-expanded={statusMenuOpen}
                        className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#e8d9c3] bg-white text-[#8c6b45] shadow-sm transition hover:bg-[#fbf7f0] md:h-[72px] md:w-[72px]"
                    >
                        <UserRound
                            size={34}
                            strokeWidth={1.8}
                        />

                        <span
                            className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${currentStatus.color}`}
                        />
                    </button>


                    {statusMenuOpen && (
                        <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-[#e8d9c3] bg-[#fffdf9] p-3 shadow-[0_16px_40px_rgba(48,32,22,0.16)]">
                            <div className="flex items-center gap-3 px-2 py-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b2418] text-[#f4d49a]">
                                    <span className="text-lg">✦</span>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-[#302016]">
                                        Availability
                                    </p>
                                    <p className="mt-0.5 text-xs text-[#8c7a65]">
                                        Choose your status
                                    </p>
                                </div>
                            </div>

                            <div className="my-2 border-t border-[#eadfce]" />

                            {STATUS_OPTIONS.map((option) => {
                                const isSelected = status === option.value;

                                const statusStyles = {
                                    online: {
                                        icon: "✓",
                                        iconBg: "bg-[#d9f3e5]",
                                        iconColor: "text-[#087c50]",
                                        dot: "bg-emerald-500",
                                        description: "Available for work",
                                    },
                                    busy: {
                                        icon: "−",
                                        iconBg: "bg-[#fff0d6]",
                                        iconColor: "text-[#bd7700]",
                                        dot: "bg-amber-500",
                                        description: "Temporarily unavailable",
                                    },
                                    offline: {
                                        icon: "☾",
                                        iconBg: "bg-[#eceef1]",
                                        iconColor: "text-[#717987]",
                                        dot: "bg-gray-400",
                                        description: "Appear unavailable",
                                    },
                                }[option.value];

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onStatusChangeAction(option.value);
                                            setStatusMenuOpen(false);
                                        }}
                                        className={`mb-1 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition duration-150 ${
                                            isSelected
                                                ? "border-[#e8d3b4] bg-[#f6efe3]"
                                                : "border-transparent hover:bg-[#f8f3eb]"
                                        }`}
                                    >
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${statusStyles.iconBg} ${statusStyles.iconColor}`}
                    >
                        <span className="text-lg font-semibold">
                            {statusStyles.icon}
                        </span>
                    </span>

                                        <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#302016]">
                            {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#8c7a65]">
                            {statusStyles.description}
                        </span>
                    </span>

                                        {isSelected && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#76583a]" />
                                        )}
                                    </button>
                                );
                            })}

                            <div className="mt-2 border-t border-[#eadfce] px-2 pt-3">
                                <p className="text-[11px] leading-relaxed text-[#9a8975]">
                                    Your status is visible in your profile.
                                </p>
                            </div>
                        </div>
                    )}

                </div>

                <button
                    type="button"
                    onClick={onLogoutAction}
                    aria-label="Sign out"
                    title="Sign out"
                    className="flex h-14 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#302016] text-[#fff8ed] shadow-sm transition hover:bg-[#59402c] md:h-[72px] md:w-[88px] md:rounded-[24px]"
                >
                    <LogOut
                        size={30}
                        strokeWidth={2}
                    />
                </button>
            </div>
        </header>
    );
}
