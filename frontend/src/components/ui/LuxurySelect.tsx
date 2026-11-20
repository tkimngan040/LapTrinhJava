"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface LuxurySelectOption {
    value: string;
    label: string;
}

interface LuxurySelectProps {
    value: string;
    onChange: (value: string) => void;
    options: LuxurySelectOption[];
    disabled?: boolean;
    placeholder?: string;
    width?: string;
    minWidth?: string;
}

export default function LuxurySelect({
                                         value,
                                         onChange,
                                         options,
                                         disabled = false,
                                         placeholder = "Chọn...",
                                         width = "auto",
                                         minWidth = "180px",
                                     }: LuxurySelectProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const selected = options.find((o) => o.value === value);

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width,
                minWidth,
                display: width === "100%" ? "block" : "inline-block",
            }}
        >
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((prev) => !prev)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    padding: "0.56rem 0.85rem",
                    borderRadius: "9px",
                    background: "#0B0D14",
                    border: open
                        ? "1px solid #D4AF37"
                        : "1px solid rgba(255, 255, 255, 0.14)",
                    color: disabled ? "#64748B" : "#F8FAFC",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.6 : 1,
                    textAlign: "left",
                    transition: "border-color 0.18s ease",
                }}
            >
                <span
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={14}
                    color="#D4AF37"
                    style={{
                        flexShrink: 0,
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.18s ease",
                    }}
                />
            </button>

            {open && !disabled && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        right: 0,
                        minWidth: "210px",
                        maxHeight: "250px",
                        overflowY: "auto",
                        background: "#181D2C",
                        border: "1px solid rgba(212, 175, 55, 0.45)",
                        borderRadius: "10px",
                        padding: "0.35rem",
                        boxShadow: "0 18px 42px rgba(0, 0, 0, 0.9)",
                        zIndex: 999999,
                    }}
                >
                    {options.map((opt) => {
                        const isActive = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                style={{
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: "7px",
                                    border: "none",
                                    background: isActive
                                        ? "rgba(212, 175, 55, 0.18)"
                                        : "transparent",
                                    color: isActive ? "#F5E6AD" : "#CBD5E1",
                                    fontSize: "0.82rem",
                                    fontWeight: isActive ? 700 : 600,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    marginBottom: "2px",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background =
                                            "rgba(255, 255, 255, 0.06)";
                                        e.currentTarget.style.color = "#FFFFFF";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background =
                                            "transparent";
                                        e.currentTarget.style.color = "#CBD5E1";
                                    }
                                }}
                            >
                                <span
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {opt.label}
                                </span>
                                {isActive && (
                                    <Check
                                        size={13}
                                        color="#D4AF37"
                                        style={{ flexShrink: 0 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}