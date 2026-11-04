
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

type UserStatus = "online" | "busy" | "offline";

interface PortalUser {
    id: number;
    fullName: string;
    email: string;
    brandId: number | null;
    roles: string[];
}

export default function PortalLayout({
                                         children,
                                     }: Readonly<{
    children: ReactNode;
}>) {
    const router = useRouter();

    const [role, setRole] = useState("PSA");
    const [status, setStatus] = useState<UserStatus>("online");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem("scentstation-token");
        const savedUser = sessionStorage.getItem("scentstation-user");

        if (!token || !savedUser) {
            router.replace("/login");
            return;
        }

        try {
            const user: PortalUser = JSON.parse(savedUser);
            const userRole = user.roles?.[0];

            if (
                !user.id ||
                !user.fullName ||
                !userRole ||
                !Array.isArray(user.roles)
            ) {
                throw new Error("Invalid user session");
            }

            setRole(userRole);
            setIsCheckingAuth(false);
        } catch {
            sessionStorage.removeItem("scentstation-token");
            sessionStorage.removeItem("scentstation-user");
            sessionStorage.removeItem("scentstation-remember");

            sessionStorage.removeItem("scentstation-demo-user");
            sessionStorage.removeItem("scentstation-demo-role");
            sessionStorage.removeItem("scentstation-demo-remember");

            router.replace("/login");
        }
    }, [router]);

    function handleLogout() {
        sessionStorage.removeItem("scentstation-token");
        sessionStorage.removeItem("scentstation-user");
        sessionStorage.removeItem("scentstation-remember");

        sessionStorage.removeItem("scentstation-demo-user");
        sessionStorage.removeItem("scentstation-demo-role");
        sessionStorage.removeItem("scentstation-demo-remember");

        router.replace("/login");
    }

    if (isCheckingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] text-[#302319]">
                <p className="text-sm text-gray-500">
                    Checking authentication...
                </p>
            </main>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8f5ef] text-[#302319]">
            <Sidebar
                role={role}
                collapsed={sidebarCollapsed}
                onToggleAction={() =>
                    setSidebarCollapsed((current) => !current)
                }
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="relative z-40 shrink-0">
                    <Header
                        role={role}
                        status={status}
                        onStatusChangeAction={setStatus}
                        onLogoutAction={handleLogout}
                    />
                </div>

                <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
