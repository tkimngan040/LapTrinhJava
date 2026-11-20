"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./RealTimeChart.module.css";

interface DataPoint {
    time: number;
    revenueK: number;
    transactions: number;
    successRate: number;
}

interface RealTimeChartProps {
    selectedDateRange?: string;
    selectedBrand?: string;
    latestOrderAmount?: number;
    totalOrdersCount?: number;
    lang?: "en" | "vi";
}

export default function RealTimeChart({
                                          selectedDateRange = "30D",
                                          selectedBrand = "ALL",
                                          latestOrderAmount = 15000,
                                          totalOrdersCount = 34,
                                          lang = "vi",
                                      }: RealTimeChartProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    const isPausedRef = useRef<boolean>(false);
    isPausedRef.current = isPaused;

    const latestAmountRef = useRef<number>(latestOrderAmount);
    latestAmountRef.current = latestOrderAmount;

    const totalOrdersRef = useRef<number>(totalOrdersCount);
    const prevOrdersRef = useRef<number>(totalOrdersCount);
    totalOrdersRef.current = totalOrdersCount;

    const langRef = useRef<"en" | "vi">(lang);
    langRef.current = lang;

    const dataPointsRef = useRef<DataPoint[]>([]);
    const mousePosRef = useRef<{ x: number; y: number } | null>(null);
    const animFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const brandFactor = selectedBrand === "ALL" ? 1 : 0.35;
        const rangeFactor =
            selectedDateRange === "TODAY" ? 0.6 : selectedDateRange === "7D" ? 0.85 : 1.1;

        const drawRoundedRect = (
            context: CanvasRenderingContext2D,
            x: number,
            y: number,
            width: number,
            height: number,
            radius: number
        ) => {
            context.beginPath();
            context.moveTo(x + radius, y);
            context.lineTo(x + width - radius, y);
            context.arcTo(x + width, y, x + width, y + radius, radius);
            context.lineTo(x + width, y + height - radius);
            context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            context.lineTo(x + radius, y + height);
            context.arcTo(x, y + height, x, y + height - radius, radius);
            context.lineTo(x, y + radius);
            context.arcTo(x, y, x + radius, y, radius);
            context.closePath();
        };

        const now = Date.now();
        const initialPoints: DataPoint[] = [];
        for (let t = -60000; t <= 0; t += 500) {
            const baseTx = Math.max(
                4,
                Math.round(
                    (18 + Math.sin(t / 4000) * 5 + (Math.random() * 3 - 1.5)) *
                    brandFactor *
                    rangeFactor
                )
            );
            const avgSprayPriceK = (latestAmountRef.current || 15000) / 1000;
            initialPoints.push({
                time: now + t,
                revenueK: Math.min(480, Math.round(baseTx * avgSprayPriceK)),
                transactions: baseTx,
                successRate: +(99.1 + Math.sin(t / 7000) * 0.4 + Math.random() * 0.3).toFixed(1),
            });
        }
        dataPointsRef.current = initialPoints;

        const simInterval = setInterval(() => {
            if (isPausedRef.current) return;
            const currentTime = Date.now();
            const hasNewSprayOrder = totalOrdersRef.current > prevOrdersRef.current;
            prevOrdersRef.current = totalOrdersRef.current;

            const baseTx = Math.max(
                3,
                Math.round(
                    (18 +
                        Math.sin(currentTime / 4500) * 6 +
                        (hasNewSprayOrder ? 6 : 0) +
                        (Math.random() * 3 - 1.5)) *
                    brandFactor *
                    rangeFactor
                )
            );
            const activePriceK = (latestAmountRef.current || 15000) / 1000;
            const nextRevenueK = Math.min(490, Math.max(30, Math.round(baseTx * activePriceK)));
            const nextSuccess = Math.min(100, Math.max(97.5, +(99.3 + (Math.random() * 0.5 - 0.25)).toFixed(1)));

            dataPointsRef.current.push({
                time: currentTime,
                revenueK: nextRevenueK,
                transactions: baseTx,
                successRate: nextSuccess,
            });

            const windowLimit = currentTime - 60000;
            dataPointsRef.current = dataPointsRef.current.filter((p) => p.time >= windowLimit);
        }, 500);

        const updateCanvasSize = () => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        updateCanvasSize();
        const resizeObserver = new ResizeObserver(() => updateCanvasSize());
        resizeObserver.observe(canvas);

        const render = () => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (width === 0 || height === 0) {
                animFrameRef.current = requestAnimationFrame(render);
                return;
            }

            const isVi = langRef.current === "vi";
            ctx.clearRect(0, 0, width, height);

            const paddingLeft = 64;
            const paddingRight = 22;
            const paddingTop = 16;
            const paddingBottom = 32;
            const chartWidth = width - paddingLeft - paddingRight;
            const chartHeight = height - paddingTop - paddingBottom;

            ctx.fillStyle = "#0B0D14";
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            for (let i = 0; i <= 4; i++) {
                const y = paddingTop + (chartHeight / 4) * i;
                ctx.beginPath();
                ctx.moveTo(paddingLeft, y);
                ctx.lineTo(width - paddingRight, y);
                ctx.stroke();

                ctx.fillStyle = "#94A3B8";
                ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
                ctx.textAlign = "right";
                const labelVal = Math.round(500 - i * 125);
                ctx.fillText(`${labelVal}k`, paddingLeft - 10, y + 4);
            }
            ctx.setLineDash([]);

            ctx.fillStyle = "#94A3B8";
            ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = "center";
            const nowTime = Date.now();
            const windowStart = nowTime - 60000;
            [0, 15000, 30000, 45000, 60000].forEach((offset) => {
                const targetTime = windowStart + offset;
                const x = paddingLeft + ((targetTime - windowStart) / 60000) * chartWidth;
                if (x >= paddingLeft && x <= width - paddingRight) {
                    const timeStr = new Date(targetTime).toLocaleTimeString("vi-VN", { hour12: false });
                    ctx.fillText(timeStr, x, height - 10);
                }
            });

            const points = dataPointsRef.current;
            if (points.length > 1) {
                const getCoords = (val: number, maxVal: number, time: number) => {
                    const x = paddingLeft + ((time - windowStart) / 60000) * chartWidth;
                    const clampedVal = Math.min(maxVal, Math.max(0, val));
                    const y = paddingTop + chartHeight - (clampedVal / maxVal) * chartHeight;
                    return { x, y };
                };

                const seriesConfigs = [
                    {
                        key: "revenueK" as keyof DataPoint,
                        max: 500,
                        color: "#D4AF37",
                        name: isVi ? "Doanh thu" : "Revenue",
                        unit: "k",
                    },
                    {
                        key: "transactions" as keyof DataPoint,
                        max: 40,
                        color: "#34D399",
                        name: isVi ? "Lượt xịt" : "Sprays",
                        unit: isVi ? " đơn" : " tx",
                    },
                    {
                        key: "successRate" as keyof DataPoint,
                        max: 100,
                        color: "#38BDF8",
                        name: isVi ? "Tỉ lệ đạt" : "Success",
                        unit: "%",
                    },
                ];

                seriesConfigs.forEach((series) => {
                    ctx.save();
                    ctx.strokeStyle = series.color;
                    ctx.lineWidth = 2.2;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.beginPath();
                    const firstPt = getCoords(points[0][series.key] as number, series.max, points[0].time);
                    ctx.moveTo(firstPt.x, firstPt.y);
                    for (let i = 1; i < points.length; i++) {
                        const pt = getCoords(points[i][series.key] as number, series.max, points[i].time);
                        ctx.lineTo(pt.x, pt.y);
                    }
                    ctx.stroke();
                    ctx.restore();
                });

                const legendW = 185;
                const legendH = 78;
                const legendX = width - paddingRight - legendW - 8;
                const legendY = paddingTop + 8;

                ctx.save();
                ctx.fillStyle = "rgba(18, 22, 34, 0.9)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
                ctx.lineWidth = 1;
                drawRoundedRect(ctx, legendX, legendY, legendW, legendH, 8);
                ctx.fill();
                ctx.stroke();

                seriesConfigs.forEach((series, idx) => {
                    const rowY = legendY + 20 + idx * 20;
                    ctx.fillStyle = series.color;
                    ctx.beginPath();
                    ctx.arc(legendX + 12, rowY - 3, 3.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = "#CBD5E1";
                    ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
                    ctx.textAlign = "left";
                    ctx.fillText(series.name, legendX + 24, rowY);

                    const rawVal = points[points.length - 1][series.key] as number;
                    const val = series.key === "successRate" ? rawVal.toFixed(1) : rawVal.toFixed(0);
                    ctx.textAlign = "right";
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillText(`${val}${series.unit}`, legendX + legendW - 12, rowY);
                });
                ctx.restore();

                const mouse = mousePosRef.current;
                if (
                    mouse &&
                    mouse.x >= paddingLeft &&
                    mouse.x <= width - paddingRight &&
                    mouse.y >= paddingTop &&
                    mouse.y <= paddingTop + chartHeight
                ) {
                    ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(mouse.x, paddingTop);
                    ctx.lineTo(mouse.x, paddingTop + chartHeight);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    const timeRatio = (mouse.x - paddingLeft) / chartWidth;
                    const targetTimestamp = windowStart + timeRatio * 60000;

                    let closest = points[0];
                    let minDist = Math.abs(points[0].time - targetTimestamp);
                    for (let i = 1; i < points.length; i++) {
                        const dist = Math.abs(points[i].time - targetTimestamp);
                        if (dist < minDist) {
                            minDist = dist;
                            closest = points[i];
                        }
                    }

                    const tipW = 190;
                    const tipH = 98;
                    let tipX = mouse.x + 14;
                    let tipY = mouse.y - 40;
                    if (tipX + tipW > width - paddingRight) tipX = mouse.x - tipW - 14;
                    if (tipY < paddingTop) tipY = paddingTop;

                    ctx.save();
                    ctx.fillStyle = "rgba(18, 22, 34, 0.96)";
                    ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
                    ctx.lineWidth = 1;
                    drawRoundedRect(ctx, tipX, tipY, tipW, tipH, 8);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = "#F5E6AD";
                    ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
                    ctx.textAlign = "left";
                    const dateStr = new Date(closest.time).toLocaleTimeString("vi-VN");
                    ctx.fillText(`${isVi ? "Thời điểm" : "Time"}: ${dateStr}`, tipX + 12, tipY + 19);

                    seriesConfigs.forEach((series, idx) => {
                        const rowY = tipY + 39 + idx * 19;
                        ctx.fillStyle = series.color;
                        ctx.beginPath();
                        ctx.arc(tipX + 14, rowY - 3, 3, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = "#CBD5E1";
                        ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
                        ctx.fillText(series.name, tipX + 24, rowY);

                        const rawVal = closest[series.key] as number;
                        const val = series.key === "successRate" ? rawVal.toFixed(1) : rawVal.toFixed(0);
                        ctx.textAlign = "right";
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillText(`${val}${series.unit}`, tipX + tipW - 12, rowY);
                        ctx.textAlign = "left";
                    });
                    ctx.restore();
                }
            }

            animFrameRef.current = requestAnimationFrame(render);
        };

        animFrameRef.current = requestAnimationFrame(render);
        return () => {
            clearInterval(simInterval);
            resizeObserver.disconnect();
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [selectedDateRange, selectedBrand]);

    return (
        <div
            className={styles.chartWrapper}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }}
            onMouseLeave={() => {
                mousePosRef.current = null;
            }}
            onClick={() => setIsPaused(!isPaused)}
            title={lang === "vi" ? "Rê chuột để xem chi tiết, bấm để tạm dừng/tiếp tục" : "Hover to inspect, click to pause/resume"}
        >
            <canvas ref={canvasRef} className={styles.canvas} />
            {isPaused && (
                <div className={styles.pauseOverlay}>
                    {lang === "vi" ? "ĐÃ TẠM DỪNG (BẤM ĐỂ TIẾP TỤC)" : "PAUSED (CLICK TO RESUME)"}
                </div>
            )}
        </div>
    );
}