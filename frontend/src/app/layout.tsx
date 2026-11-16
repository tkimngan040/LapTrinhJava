// noinspection SpellCheckingInspection

import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
    Geist,
    Geist_Mono,
    Bodoni_Moda,
    Montserrat,
    Space_Grotesk,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const bodoni = Bodoni_Moda({
    variable: "--font-bodoni",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600", "700"],
    style: ["normal", "italic"],
    display: "swap",
});

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin", "vietnamese"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin", "vietnamese"],
    weight: ["500", "600", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "ScentStation — Haute Parfumerie & Automated Sampling Boutiques",
    description: "Multi-Brand Luxury Smart Fragrance Experience & IoT Management Platform",
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
        <html lang="en" translate="no" className="notranslate" suppressHydrationWarning>
        <body
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable} ${bodoni.variable} ${montserrat.variable} ${spaceGrotesk.variable} antialiased notranslate`}
        >
        {children}
        </body>
        </html>
    );
}