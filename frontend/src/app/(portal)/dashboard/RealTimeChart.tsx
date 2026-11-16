"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./RealTimeChart.module.css";

interface DataPoint {
    time: number;
    revenueK: number;     // Doanh thu theo khung thời gian (nghìn VND)
    transactions: number; // Số lượt xịt / giao dịch thành công
    successRate: number;  // Tỉ lệ vòi phun thành công (%)
}

interface RealTimeChartProps {
    selectedDateRange?: string;
    selectedBrand?: string;
    latestOrderAmount?: number;
    totalOrdersCount?: number;
}

export default function RealTimeChart({
                                          selectedDateRange = "30D",
                                          selectedBrand = "ALL",
                                          latestOrderAmount = 15000,
                                          totalOrdersCount = 34,
                                      }: RealTimeChartProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    const isPausedRef = useRef<boolean>(false);
    isPausedRef.current = isPaused;

    // Dùng useRef cho latestOrderAmount & totalOrdersCount để KHÔNG làm reset lại biểu đồ mỗi 5 giây
    const latestAmountRef = useRef<number>(latestOrderAmount);
    latestAmountRef.current = latestOrderAmount;

    const totalOrdersRef = useRef<number>(totalOrdersCount);
    const prevOrdersRef = useRef<number>(totalOrdersCount);
    totalOrdersRef.current = totalOrdersCount;

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

        // Khởi tạo cửa sổ 60s ban đầu
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
            // Kiểm tra xem vừa có đơn hàng mới thực tế phát sinh từ Dashboard hay không
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
            const nextRevenueK = Math.min(
                490,
                Math.max(30, Math.round(baseTx * activePriceK))
            );
            const nextSuccess = Math.min(
                100,
                Math.max(97.5, +(99.3 + (Math.random() * 0.5 - 0.25)).toFixed(1))
            );

            dataPointsRef.current.push({
                time: currentTime,
                revenueK: nextRevenueK,
                transactions: baseTx,
                successRate: nextSuccess,
            });

            const windowLimit = currentTime - 60000;
            dataPointsRef.current = dataPointsRef.current.filter(
                (p) => p.time >= windowLimit
            );
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
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        resizeObserver.observe(canvas);

        const render = () => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (width === 0 || height === 0) {
                animFrameRef.current = requestAnimationFrame(render);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            const paddingLeft = 68;
            const paddingRight = 22;
            const paddingTop = 16;
            const paddingBottom = 32;

            const chartWidth = width - paddingLeft - paddingRight;
            const chartHeight = height - paddingTop - paddingBottom;

            // 1. Nền & Dot-Grid
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "rgba(212, 175, 55, 0.04)";
            const gridSize = 40;
            for (let x = paddingLeft % gridSize; x < width; x += gridSize) {
                for (let y = paddingTop % gridSize; y < height; y += gridSize) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            // 2. Đường kẻ ngang Y-Axis
            ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            for (let i = 0; i <= 4; i++) {
                const y = paddingTop + (chartHeight / 4) * i;
                ctx.beginPath();
                ctx.moveTo(paddingLeft, y);
                ctx.lineTo(width - paddingRight, y);
                ctx.stroke();

                ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
                ctx.font = "10px system-ui, sans-serif";
                ctx.textAlign = "right";
                const labelVal = Math.round(500 - i * 125);
                ctx.fillText(`${labelVal}k`, paddingLeft - 10, y + 3);
            }
            ctx.setLineDash([]);

            // 3. Nhãn thời gian thực trục X
            ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
            ctx.font = "10px system-ui, sans-serif";
            ctx.textAlign = "center";
            const nowTime = Date.now();
            const windowStart = nowTime - 60000;
            const timeLabels = [
                { offset: 0 },
                { offset: 15000 },
                { offset: 30000 },
                { offset: 45000 },
                { offset: 60000 },
            ];
            timeLabels.forEach(({ offset }) => {
                const targetTime = windowStart + offset;
                const x = paddingLeft + ((targetTime - windowStart) / 60000) * chartWidth;
                if (x >= paddingLeft && x <= width - paddingRight) {
                    const timeStr = new Date(targetTime).toLocaleTimeString("vi-VN", {
                        hour12: false,
                    });
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
                        name: "Revenue",
                        unit: "k VND",
                    },
                    {
                        key: "transactions" as keyof DataPoint,
                        max: 40,
                        color: "#00ff88",
                        name: "Sprays / Orders",
                        unit: " tx",
                    },
                    {
                        key: "successRate" as keyof DataPoint,
                        max: 100,
                        color: "#00c4ff",
                        name: "Dispense Rate",
                        unit: "%",
                    },
                ];

                seriesConfigs.forEach((series) => {
                    let r = 212,
                        g = 175,
                        b = 55;
                    if (series.color === "#00ff88") {
                        r = 0;
                        g = 255;
                        b = 136;
                    } else if (series.color === "#00c4ff") {
                        r = 0;
                        g = 196;
                        b = 255;
                    }

                    const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
                    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.22)`);
                    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);

                    ctx.beginPath();
                    const firstPt = getCoords(
                        points[0][series.key] as number,
                        series.max,
                        points[0].time
                    );
                    ctx.moveTo(firstPt.x, paddingTop + chartHeight);
                    ctx.lineTo(firstPt.x, firstPt.y);

                    for (let i = 0; i < points.length - 1; i++) {
                        const p0 = getCoords(
                            points[Math.max(0, i - 1)][series.key] as number,
                            series.max,
                            points[Math.max(0, i - 1)].time
                        );
                        const p1 = getCoords(
                            points[i][series.key] as number,
                            series.max,
                            points[i].time
                        );
                        const p2 = getCoords(
                            points[i + 1][series.key] as number,
                            series.max,
                            points[i + 1].time
                        );
                        const p3 = getCoords(
                            points[Math.min(points.length - 1, i + 2)][series.key] as number,
                            series.max,
                            points[Math.min(points.length - 1, i + 2)].time
                        );

                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;

                        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
                    }

                    const lastPt = getCoords(
                        points[points.length - 1][series.key] as number,
                        series.max,
                        points[points.length - 1].time
                    );
                    ctx.lineTo(lastPt.x, paddingTop + chartHeight);
                    ctx.closePath();
                    ctx.fillStyle = grad;
                    ctx.fill();

                    ctx.save();
                    ctx.strokeStyle = series.color;
                    ctx.lineWidth = 2.2;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.shadowColor = series.color;
                    ctx.shadowBlur = 8;

                    ctx.beginPath();
                    ctx.moveTo(firstPt.x, firstPt.y);
                    for (let i = 0; i < points.length - 1; i++) {
                        const p0 = getCoords(
                            points[Math.max(0, i - 1)][series.key] as number,
                            series.max,
                            points[Math.max(0, i - 1)].time
                        );
                        const p1 = getCoords(
                            points[i][series.key] as number,
                            series.max,
                            points[i].time
                        );
                        const p2 = getCoords(
                            points[i + 1][series.key] as number,
                            series.max,
                            points[i + 1].time
                        );
                        const p3 = getCoords(
                            points[Math.min(points.length - 1, i + 2)][series.key] as number,
                            series.max,
                            points[Math.min(points.length - 1, i + 2)].time
                        );

                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;

                        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
                    }
                    ctx.stroke();
                    ctx.restore();
                });

                // 4. Legend góc phải
                const legendX = width - paddingRight - 190;
                const legendY = paddingTop + 10;
                const legendW = 180;
                const legendH = 78;

                ctx.save();
                ctx.fillStyle = "rgba(5, 5, 10, 0.82)";
                ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
                ctx.lineWidth = 1;
                drawRoundedRect(ctx, legendX, legendY, legendW, legendH, 8);
                ctx.fill();
                ctx.stroke();

                seriesConfigs.forEach((series, idx) => {
                    const rowY = legendY + 19 + idx * 20;
                    ctx.fillStyle = series.color;
                    ctx.beginPath();
                    ctx.arc(legendX + 12, rowY - 3, 3.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
                    ctx.font = "11px system-ui, sans-serif";
                    ctx.textAlign = "left";
                    ctx.fillText(series.name, legendX + 24, rowY);

                    const rawVal = points[points.length - 1][series.key] as number;
                    const val = series.key === "successRate" ? rawVal.toFixed(1) : rawVal.toFixed(0);
                    ctx.textAlign = "right";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${val}${series.unit}`, legendX + legendW - 12, rowY);
                });
                ctx.restore();

                // 5. Tooltip khi hover chuột trên biểu đồ
                const mouse = mousePosRef.current;
                if (
                    mouse &&
                    mouse.x >= paddingLeft &&
                    mouse.x <= width - paddingRight &&
                    mouse.y >= paddingTop &&
                    mouse.y <= paddingTop + chartHeight
                ) {
                    ctx.strokeStyle = "rgba(212, 175, 55, 0.45)";
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

                    const tipW = 185;
                    const tipH = 98;
                    let tipX = mouse.x + 15;
                    let tipY = mouse.y - 40;
                    if (tipX + tipW > width - paddingRight) tipX = mouse.x - tipW - 15;
                    if (tipY < paddingTop) tipY = paddingTop;

                    ctx.save();
                    ctx.fillStyle = "rgba(10, 10, 16, 0.95)";
                    ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
                    ctx.lineWidth = 1;
                    drawRoundedRect(ctx, tipX, tipY, tipW, tipH, 8);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = "#D4AF37";
                    ctx.font = "bold 10px system-ui, sans-serif";
                    ctx.textAlign = "left";
                    const dateStr = new Date(closest.time).toLocaleTimeString("vi-VN");
                    ctx.fillText(`Timestamp: ${dateStr}`, tipX + 12, tipY + 18);

                    seriesConfigs.forEach((series, idx) => {
                        const rowY = tipY + 38 + idx * 19;
                        ctx.fillStyle = series.color;
                        ctx.beginPath();
                        ctx.arc(tipX + 15, rowY - 3, 3, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                        ctx.font = "11px system-ui, sans-serif";
                        ctx.fillText(series.name, tipX + 26, rowY);

                        const rawVal = closest[series.key] as number;
                        const val =
                            series.key === "successRate" ? rawVal.toFixed(1) : rawVal.toFixed(0);
                        ctx.textAlign = "right";
                        ctx.fillStyle = "#ffffff";
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
    }, [selectedDateRange, selectedBrand]); // Đã gỡ latestOrderAmount khỏi dependency để biểu đồ chạy mượt không bị khởi tạo lại

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mousePosRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseLeave = () => {
        mousePosRef.current = null;
    };

    return (
        <div
            className={styles.chartWrapper}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => setIsPaused(!isPaused)}
            title="Hover to inspect time points, click to pause/resume live stream"
        >
            <canvas ref={canvasRef} className={styles.canvas} />
            {isPaused && (
                <div className={styles.pauseOverlay}>STREAM PAUSED (CLICK TO RESUME)</div>
            )}
        </div>
    );
}