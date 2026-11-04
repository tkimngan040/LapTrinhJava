
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
    Geist,
    Geist_Mono,
    Bodoni_Moda,
    Montserrat,
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
    subsets: ["latin"],
    weight: ["400", "500"],
    style: ["normal", "italic"],
    display: "swap",
});

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    weight: ["300", "400", "500"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "ScentStation",
    description: "Luxury Smart Fragrance Experience",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} ${bodoni.variable} ${montserrat.variable} antialiased`}
        >
        {children}
        </body>
        </html>
    );
}
