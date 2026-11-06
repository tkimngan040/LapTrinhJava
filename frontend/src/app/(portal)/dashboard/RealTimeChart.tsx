"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./RealTimeChart.module.css";

interface DataPoint {
    time: number;
    cpu: number;
    memory: number;
    latency: number;
}

export default function RealTimeChart() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    const isPausedRef = useRef<boolean>(false);
    isPausedRef.current = isPaused;

    const dataPointsRef = useRef<DataPoint[]>([]);
    const mousePosRef = useRef<{ x: number; y: number } | null>(null);
    const animFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Helper for safe rounded rectangles across all environments
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

        // Initialize 60 seconds rolling window data points
        const now = Date.now();
        const initialPoints: DataPoint[] = [];
        for (let t = -60000; t <= 0; t += 500) {
            initialPoints.push({
                time: now + t,
                cpu: 40 + Math.sin(t / 3000) * 15 + (Math.random() * 10 - 5),
                memory: 8 + Math.sin(t / 5000) * 2 + (Math.random() * 0.5 - 0.25),
                latency: 80 + (Math.random() < 0.03 ? Math.random() * 250 : Math.random() * 15),
            });
        }
        dataPointsRef.current = initialPoints;

        // Data simulation interval (every 500ms)
        const simInterval = setInterval(() => {
            if (isPausedRef.current) return;

            const currentTime = Date.now();
            const lastPoint = dataPointsRef.current[dataPointsRef.current.length - 1] || {
                cpu: 50, memory: 8, latency: 80
            };

            const nextCpu = Math.max(0, Math.min(100, 50 + Math.sin(currentTime / 5000) * 20 + (Math.random() * 20 - 10)));
            const memoryDelta = (Math.random() * 0.4 - 0.2) + (12 - lastPoint.memory) * 0.02;
            const nextMemory = Math.max(2, Math.min(16, lastPoint.memory + memoryDelta));
            const isSpike = Math.random() < 0.03;
            const nextLatency = Math.max(20, Math.min(500, isSpike ? 200 + Math.random() * 200 : 80 + (Math.random() * 20 - 10)));

            dataPointsRef.current.push({
                time: currentTime,
                cpu: nextCpu,
                memory: nextMemory,
                latency: nextLatency,
            });

            const windowLimit = currentTime - 60000;
            dataPointsRef.current = dataPointsRef.current.filter(p => p.time >= windowLimit);
        }, 500);

        // ResizeObserver & initial sizing
        const updateCanvasSize = () => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        updateCanvasSize();
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        resizeObserver.observe(canvas);

        // Render Loop (60fps requestAnimationFrame)
        const render = () => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (width === 0 || height === 0) {
                animFrameRef.current = requestAnimationFrame(render);
                return;
            }

            ctx.clearRect(0, 0, width, height);

            const paddingLeft = 60;
            const paddingRight = 20;
            const paddingTop = 12;
            const paddingBottom = 30;

            const chartWidth = width - paddingLeft - paddingRight;
            const chartHeight = height - paddingTop - paddingBottom;

            // 1. Background & Dot-Grid
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
            const gridSize = 40;
            for (let x = paddingLeft % gridSize; x < width; x += gridSize) {
                for (let y = paddingTop % gridSize; y < height; y += gridSize) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            // 2. Y-Axis Gridlines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            for (let i = 0; i <= 4; i++) {
                const y = paddingTop + (chartHeight / 4) * i;
                ctx.beginPath();
                ctx.moveTo(paddingLeft, y);
                ctx.lineTo(width - paddingRight, y);
                ctx.stroke();

                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.font = "10px system-ui, sans-serif";
                ctx.textAlign = "right";
                const labelVal = Math.round(100 - (i * 25));
                ctx.fillText(`${labelVal}%`, paddingLeft - 10, y + 3);
            }
            ctx.setLineDash([]);

            // X-Axis Time Labels
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.font = "10px system-ui, sans-serif";
            ctx.textAlign = "center";
            const timeLabels = [
                { label: "-60s", offset: 0 },
                { label: "-45s", offset: 15000 },
                { label: "-30s", offset: 30000 },
                { label: "-15s", offset: 45000 },
                { label: "now", offset: 60000 },
            ];
            const nowTime = Date.now();
            const windowStart = nowTime - 60000;
            timeLabels.forEach(({ label, offset }) => {
                const targetTime = windowStart + offset;
                const x = paddingLeft + ((targetTime - windowStart) / 60000) * chartWidth;
                if (x >= paddingLeft && x <= width - paddingRight) {
                    ctx.fillText(label, x, height - 10);
                }
            });

            const points = dataPointsRef.current;
            if (points.length > 1) {
                const getCoords = (val: number, maxVal: number, time: number) => {
                    const x = paddingLeft + ((time - windowStart) / 60000) * chartWidth;
                    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
                    return { x, y };
                };

                const seriesConfigs = [
                    { key: "cpu" as keyof DataPoint, max: 100, color: "#00c4ff", name: "CPU Load", unit: "%" },
                    { key: "memory" as keyof DataPoint, max: 16, color: "#00ff88", name: "Memory", unit: " GB" },
                    { key: "latency" as keyof DataPoint, max: 500, color: "#a855f7", name: "Response", unit: " ms" },
                ];

                // 3. Render Gradient Fills & Smooth Curves
                seriesConfigs.forEach(series => {
                    let r = 0, g = 196, b = 255;
                    if (series.color === "#00ff88") { r = 0; g = 255; b = 136; }
                    else if (series.color === "#a855f7") { r = 168; g = 85; b = 247; }
                    else if (series.color === "#00c4ff") { r = 0; g = 196; b = 255; }

                    const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
                    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.2)`);
                    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);

                    ctx.beginPath();
                    const firstPt = getCoords(points[0][series.key] as number, series.max, points[0].time);
                    ctx.moveTo(firstPt.x, paddingTop + chartHeight);
                    ctx.lineTo(firstPt.x, firstPt.y);

                    for (let i = 0; i < points.length - 1; i++) {
                        const p0 = getCoords(points[Math.max(0, i - 1)][series.key] as number, series.max, points[Math.max(0, i - 1)].time);
                        const p1 = getCoords(points[i][series.key] as number, series.max, points[i].time);
                        const p2 = getCoords(points[i + 1][series.key] as number, series.max, points[i + 1].time);
                        const p3 = getCoords(points[Math.min(points.length - 1, i + 2)][series.key] as number, series.max, points[Math.min(points.length - 1, i + 2)].time);

                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;

                        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
                    }

                    const lastPt = getCoords(points[points.length - 1][series.key] as number, series.max, points[points.length - 1].time);
                    ctx.lineTo(lastPt.x, paddingTop + chartHeight);
                    ctx.closePath();
                    ctx.fillStyle = grad;
                    ctx.fill();

                    // Line Stroke with Glow
                    ctx.save();
                    ctx.strokeStyle = series.color;
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.shadowColor = series.color;
                    ctx.shadowBlur = 8;

                    ctx.beginPath();
                    ctx.moveTo(firstPt.x, firstPt.y);
                    for (let i = 0; i < points.length - 1; i++) {
                        const p0 = getCoords(points[Math.max(0, i - 1)][series.key] as number, series.max, points[Math.max(0, i - 1)].time);
                        const p1 = getCoords(points[i][series.key] as number, series.max, points[i].time);
                        const p2 = getCoords(points[i + 1][series.key] as number, series.max, points[i + 1].time);
                        const p3 = getCoords(points[Math.min(points.length - 1, i + 2)][series.key] as number, series.max, points[Math.min(points.length - 1, i + 2)].time);

                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;

                        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
                    }
                    ctx.stroke();
                    ctx.restore();
                });

                // 4. Legend
                const legendX = width - paddingRight - 160;
                const legendY = paddingTop + 10;
                const legendW = 150;
                const legendH = 75;

                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
                ctx.lineWidth = 1;
                drawRoundedRect(ctx, legendX, legendY, legendW, legendH, 8);
                ctx.fill();
                ctx.stroke();

                seriesConfigs.forEach((series, idx) => {
                    const rowY = legendY + 18 + idx * 20;
                    ctx.fillStyle = series.color;
                    ctx.beginPath();
                    ctx.arc(legendX + 12, rowY - 3, 3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                    ctx.font = "11px system-ui, sans-serif";
                    ctx.textAlign = "left";
                    ctx.fillText(series.name, legendX + 28, rowY);

                    const val = (points[points.length - 1][series.key] as number).toFixed(series.key === "memory" ? 1 : 0);
                    ctx.textAlign = "right";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(`${val}${series.unit}`, legendX + legendW - 12, rowY);
                });
                ctx.restore();

                // 5. Crosshair & Tooltip
                const mouse = mousePosRef.current;
                if (mouse && mouse.x >= paddingLeft && mouse.x <= width - paddingRight && mouse.y >= paddingTop && mouse.y <= paddingTop + chartHeight) {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
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

                    const tipW = 160;
                    const tipH = 95;
                    let tipX = mouse.x + 15;
                    let tipY = mouse.y - 40;
                    if (tipX + tipW > width - paddingRight) tipX = mouse.x - tipW - 15;
                    if (tipY < paddingTop) tipY = paddingTop;

                    ctx.save();
                    ctx.fillStyle = "rgba(10, 10, 15, 0.92)";
                    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
                    ctx.lineWidth = 1;
                    drawRoundedRect(ctx, tipX, tipY, tipW, tipH, 8);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                    ctx.font = "10px system-ui, sans-serif";
                    ctx.textAlign = "left";
                    const dateStr = new Date(closest.time).toLocaleTimeString();
                    ctx.fillText(`Time: ${dateStr}`, tipX + 12, tipY + 18);

                    seriesConfigs.forEach((series, idx) => {
                        const rowY = tipY + 38 + idx * 18;
                        ctx.fillStyle = series.color;
                        ctx.beginPath();
                        ctx.arc(tipX + 16, rowY - 3, 3, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                        ctx.font = "11px system-ui, sans-serif";
                        ctx.fillText(series.name, tipX + 28, rowY);

                        const val = (closest[series.key] as number).toFixed(series.key === "memory" ? 1 : 0);
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
    }, []);

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

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    return (
        <div
            className={styles.chartWrapper}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={togglePause}
        >
            <canvas ref={canvasRef} className={styles.canvas} />
            {isPaused && <div className={styles.pauseOverlay}>STREAM PAUSED (CLICK TO RESUME)</div>}
        </div>
    );
}