// noinspection SpellCheckingInspection

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "ScentStation — Quản lý Kiosk",
    description: "Hệ thống quản lý trạm Kiosk nước hoa, tồn kho và giao dịch",
    other: {
        google: "notranslate",
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html
            lang="vi"
            translate="no"
            className={`${plusJakarta.variable} notranslate`}
            suppressHydrationWarning
        >
        <body
            suppressHydrationWarning
            className="bg-[#0B0D14] text-[#F8FAFC] antialiased notranslate"
            style={{
                fontFamily:
                    "var(--font-plus-jakarta), 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
        {children}
        </body>
        </html>
    );
}