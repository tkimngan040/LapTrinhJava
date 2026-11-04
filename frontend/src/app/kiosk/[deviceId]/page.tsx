"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import mockMachineMenu, {
    type MachineMenuSlot,
} from "@/mocks";
import styles from "./page.module.css";
import {
    getMachineMenu,
    createKioskOrder,
    getKioskOrderStatus,
} from "@/lib/kiosk-api";
import QRCode from "react-qr-code";

/* =========================================================
   Types Extended
========================================================= */

export type ExtendedKioskSlot = MachineMenuSlot & {
    brand?: string;
    concentration?: string;
    audience?: string;
    fragranceFamily?: string;
    description?: string;
    topNotes?: string[] | null;
    heartNotes?: string[] | null;
    baseNotes?: string[] | null;
    retailPrice10ml?: number | null;
};

type KioskStep =
    | "SELECT"
    | "QR_WAITING"
    | "PAID_GUIDANCE"
    | "DISPENSING"
    | "SUCCESS"
    | "FAILED"
    | "UNCERTAIN";

type OrderStatus =
    | "PENDING"
    | "PAID"
    | "DISPENSING"
    | "DISPENSED"
    | "FAILED"
    | "UNCERTAIN"
    | "CANCELLED"
    | "EXPIRED";

interface OrderSnapshot {
    orderId: string | number;
    qrContent: string;
    product: ExtendedKioskSlot;
    price: number;
    expiresAt: number;
    status: OrderStatus;
}

/* =========================================================
   Helpers & Note Processors
========================================================= */

const formatPrice = (price: number): string =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(price);

const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const parseNotesFallback = (notesString?: string) => {
    if (!notesString) {
        return {
            top: ["Bergamot", "Citrus Accords"],
            heart: ["Floral Essence", "Aromatic Spices"],
            base: ["Precious Woods", "Sensual Amber"],
        };
    }

    const items = notesString
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    if (items.length >= 3) {
        const third = Math.ceil(items.length / 3);
        return {
            top: items.slice(0, third),
            heart: items.slice(third, third * 2),
            base: items.slice(third * 2),
        };
    } else if (items.length === 2) {
        return {
            top: [items[0]],
            heart: [items[1]],
            base: ["Deep Woods & Musk"],
        };
    }

    return {
        top: items,
        heart: ["Harmonious Heart Accords"],
        base: ["Rich Base Notes"],
    };
};

const renderNotesList = (explicitNotes?: string[] | null, fallbackNotes?: string[]) => {
    if (explicitNotes && explicitNotes.length > 0) {
        return explicitNotes.join(", ");
    }
    if (fallbackNotes && fallbackNotes.length > 0) {
        return fallbackNotes.join(", ");
    }
    return "Balanced Olfactory Note";
};

const formatRetailReference = (price?: number | null, experiencePrice?: number): string => {
    if (typeof price === "number" && price > 0) {
        return formatPrice(price);
    }
    if (typeof experiencePrice === "number" && experiencePrice > 0) {
        return formatPrice(experiencePrice * 30);
    }
    return formatPrice(250000);
};

const IS_DEMO =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_KIOSK_DEMO === "true";

/* =========================================================
   Main Kiosk Page Component
========================================================= */

export default function KioskPage() {
    const params = useParams<{ deviceId: string }>();
    const deviceId = params.deviceId;

    const [step, setStep] = useState<KioskStep>("SELECT");
    const [selectedProduct, setSelectedProduct] = useState<ExtendedKioskSlot | null>(null);
    const [activeVideoIndex, setActiveVideoIndex] = useState(1);
    const [order, setOrder] = useState<OrderSnapshot | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [machineStatus, setMachineStatus] = useState<string>("OFFLINE");
    const [availableProducts, setAvailableProducts] = useState<ExtendedKioskSlot[]>([]);
    const [isMenuLoading, setIsMenuLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);

    const demoStatusQueueRef = useRef<OrderStatus[]>([]);
    const isPollingRequestRef = useRef(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);


// ... các dòng tiếp theo giữ nguyên
    useEffect(() => {
        let isActive = true;

        const loadMachineMenu = async () => {
            setIsMenuLoading(true);

            if (IS_DEMO && deviceId === mockMachineMenu.deviceId) {
                const mockStatus = (mockMachineMenu.status || "OFFLINE").toUpperCase();
                const mockOnline = mockStatus === "ONLINE";

                setMachineStatus(mockStatus);
                setIsOnline(mockOnline);
                setAvailableProducts(
                    mockOnline
                        ? (mockMachineMenu.slots as ExtendedKioskSlot[]).filter((slot) => slot.available)
                        : [],
                );

                setIsMenuLoading(false);
                return;
            }

            try {
                const response = await getMachineMenu(deviceId);

                if (!isActive) return;

                const status = (response.status || "OFFLINE").toUpperCase();
                const online = status === "ONLINE";

                setMachineStatus(status);
                setIsOnline(online);
                setAvailableProducts(
                    online
                        ? (response.slots as ExtendedKioskSlot[]).filter((slot) => slot.available)
                        : [],
                );
            } catch (error) {
                if (!isActive) return;

                setMachineStatus("OFFLINE");
                setIsOnline(false);
                setAvailableProducts([]);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to load the machine menu.",
                );
            } finally {
                if (isActive) {
                    setIsMenuLoading(false);
                }
            }
        };

        if (deviceId) {
            void loadMachineMenu();
        }

        return () => {
            isActive = false;
        };
    }, [deviceId]);

    const statusConfig = {
        ONLINE: {
            label: "Machine Online",
            description: "The machine is connected and ready to serve.",
            className: styles.statusOnline,
        },
        OFFLINE: {
            label: "Machine Offline",
            description: "The machine is currently disconnected.",
            className: styles.statusOffline,
        },
        MAINTENANCE: {
            label: "Under Maintenance",
            description: "The machine is currently under maintenance.",
            className: styles.statusMaintenance,
        },
        BUSY: {
            label: "Machine Busy",
            description: "The machine is processing another request.",
            className: styles.statusBusy,
        },
    } as const;

    const currentStatus =
        statusConfig[machineStatus as keyof typeof statusConfig] ??
        statusConfig.OFFLINE;

    const clearTimers = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }

        demoStatusQueueRef.current = [];
        isPollingRequestRef.current = false;
    }, []);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const resetToSelect = useCallback(() => {
        clearTimers();
        setStep("SELECT");
        setSelectedProduct(null);
        setOrder(null);
        setRemainingSeconds(0);
        setErrorMessage(null);
        setIsCreatingOrder(false);
    }, [clearTimers]);

    const handleSelectProduct = (product: ExtendedKioskSlot) => {
        if (step !== "SELECT") return;
        setSelectedProduct(product);
        setErrorMessage(null);
    };

    const applyOrderStatus = (status: string) => {
        const normalizedStatus = (status || "PENDING").toUpperCase() as OrderStatus;

        if (normalizedStatus !== "PENDING" && countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }

        switch (normalizedStatus) {
            case "PENDING":
                setStep("QR_WAITING");
                break;
            case "PAID":
                setStep("PAID_GUIDANCE");
                break;
            case "DISPENSING":
                setStep("DISPENSING");
                break;
            case "DISPENSED":
                clearTimers();
                setStep("SUCCESS");
                break;
            case "FAILED":
                clearTimers();
                setStep("FAILED");
                break;
            case "UNCERTAIN":
                clearTimers();
                setStep("UNCERTAIN");
                break;
            case "CANCELLED":
            case "EXPIRED":
                clearTimers();
                setStep("FAILED");
                break;
            default:
                return;
        }

        setOrder((current) =>
            current ? { ...current, status: normalizedStatus } : current,
        );
    };

    const startStatusPolling = (orderId: string | number) => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
        }

        pollRef.current = setInterval(async () => {
            if (IS_DEMO) {
                const nextStatus = demoStatusQueueRef.current.shift();
                if (nextStatus) applyOrderStatus(nextStatus);
                return;
            }

            const numericOrderId = Number(orderId);
            if (!Number.isSafeInteger(numericOrderId) || isPollingRequestRef.current) {
                return;
            }

            isPollingRequestRef.current = true;
            try {
                const response = await getKioskOrderStatus(numericOrderId);
                applyOrderStatus(response.status);
            } catch {
                // Polling retry
            } finally {
                isPollingRequestRef.current = false;
            }
        }, 2000);
    };

    const handleConfirmSelection = async () => {
        if (!selectedProduct || !isOnline || isCreatingOrder) return;

        setIsCreatingOrder(true);
        setErrorMessage(null);
        clearTimers();

        try {
            const now = Date.now();
            const expiresAt = now + 3 * 60 * 1000;

            let newOrder: OrderSnapshot;

            if (IS_DEMO) {
                const demoOrderId = `DEMO-${now}`;
                newOrder = {
                    orderId: demoOrderId,
                    qrContent: `SCENTSTATION-DEMO|${demoOrderId}|${selectedProduct.slotNumber}|${selectedProduct.price}`,
                    product: selectedProduct,
                    price: selectedProduct.price,
                    expiresAt,
                    status: "PENDING",
                };
            } else {
                const response = await createKioskOrder(
                    deviceId,
                    selectedProduct.slotNumber,
                );

                const serverExpiresAt = new Date(response.expiresAt).getTime();

                if (!Number.isFinite(serverExpiresAt) || !response.qrContent) {
                    throw new Error("Invalid payment information returned by the server.");
                }

                newOrder = {
                    orderId: String(response.orderId),
                    qrContent: response.qrContent,
                    product: selectedProduct,
                    price: response.price,
                    expiresAt: serverExpiresAt,
                    status: response.status as OrderStatus,
                };
            }

            const remaining = Math.max(
                0,
                Math.ceil((newOrder.expiresAt - Date.now()) / 1000),
            );

            if (remaining <= 0) {
                throw new Error("The payment QR code has expired.");
            }

            setOrder(newOrder);
            setRemainingSeconds(remaining);
            setStep("QR_WAITING");
            startStatusPolling(newOrder.orderId);

            countdownRef.current = setInterval(() => {
                const secondsLeft = Math.max(
                    0,
                    Math.ceil((newOrder.expiresAt - Date.now()) / 1000),
                );

                setRemainingSeconds(secondsLeft);

                if (secondsLeft <= 0) {
                    clearTimers();
                    setOrder((current) =>
                        current ? { ...current, status: "EXPIRED" } : current,
                    );
                    setStep("FAILED");
                    setErrorMessage(
                        "The payment QR code has expired. Please create a new order.",
                    );
                }
            }, 1000);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to create the order. Please try again.",
            );
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handleFakePayment = () => {
        if (!order || step !== "QR_WAITING") return;
        demoStatusQueueRef.current = ["PAID", "DISPENSING", "DISPENSED"];
    };

    const handleDemoFailure = (status: "FAILED" | "UNCERTAIN") => {
        if (!order || step !== "QR_WAITING") return;
        demoStatusQueueRef.current = [status];
    };

    const handleCancelOrder = () => {
        if (step !== "QR_WAITING") return;
        clearTimers();
        setOrder((o) => (o ? { ...o, status: "CANCELLED" } : o));
        resetToSelect();
    };

    if (isMenuLoading) {
        return (
            <main className={styles.unavailablePage}>
                <div className={styles.unavailableContent}>
                    <p className={styles.brandName}>SCENTSTATION</p>
                    <h1>Loading Machine</h1>
                    <p className={styles.unavailableMessage}>
                        Connecting to the machine and loading available fragrances...
                    </p>
                </div>
            </main>
        );
    }

    if (!isOnline) {
        return (
            <main className={styles.unavailablePage}>
                <div className={styles.unavailableContent}>
                    <div className={styles.unavailableIcon}>!</div>
                    <p className={styles.brandName}>SCENTSTATION</p>
                    <h1>Machine Unavailable</h1>
                    <p className={styles.unavailableMessage}>
                        Machine <strong>{deviceId}</strong> is offline or unavailable.
                        Please try again later.
                    </p>
                    <span className={styles.deviceReference}>
                        DEVICE: {deviceId}
                    </span>
                </div>
            </main>
        );
    }

    if (step !== "SELECT") {
        return (
            <main className={styles.kioskPage}>
                <header className={styles.kioskHeader}>
                    <div className={styles.headerInner}>
                        <div className={styles.brandGroup}>
                            <h1 className={styles.brandName}>SCENTSTATION</h1>
                            <p className={styles.brandTagline}>EDITORIAL FRAGRANCE KIOSK</p>
                        </div>
                    </div>
                </header>

                <section className={styles.flowSection}>
                    {step === "QR_WAITING" && order && (
                        <div className={styles.flowCard}>
                            <p className={styles.flowEyebrow}>SECURE PAYMENT</p>
                            <h2 className={styles.flowTitle}>SCAN QR CODE TO PAY</h2>

                            {/* --- NÂNG CẤP THẺ THÔNG TIN SẢN PHẨM --- */}
                            <div className={styles.paymentProductBadge}>
                                <span className={styles.paymentBrandName}>{order.product.brand || "CURATED COLLECTION"}</span>
                                <h3 className={styles.paymentProductName}>{order.product.productName}</h3>
                                <div className={styles.paymentPriceDivider} />
                                <div className={styles.paymentPriceRow5}>
                                    <span className={styles.paymentPriceLabel}><span className={styles.dotGold} /> EXPERIENCE FEE</span>
                                    <span className={styles.paymentPriceValue}>{formatPrice(order.price)}</span>
                                </div>
                            </div>

                            {/* Khung chứa mã QR */}
                            <div className={styles.qrBoxWrapper}>
                                <div className={styles.qrBox}>
                                    {order.qrContent ? (
                                        <QRCode
                                            value={order.qrContent}
                                            size={210}
                                            bgColor="#FFFFFF"
                                            fgColor="#000000"
                                            level="M"
                                        />
                                    ) : (
                                        <p>QR code is unavailable.</p>
                                    )}
                                </div>
                            </div>

                            {/* Đồng hồ đếm ngược */}
                            <div className={styles.countdownBox}>
                                <span className={styles.countdownLabel}>TIME REMAINING</span>
                                <span
                                    className={`${styles.countdownValue} ${
                                        remainingSeconds <= 30 ? styles.countdownUrgent : ""
                                    }`}
                                >
                {formatCountdown(remainingSeconds)}
            </span>
                            </div>

                            <p className={styles.flowHint}>
                                Open your mobile banking app or digital wallet to scan. Status updates automatically.
                            </p>

                            {/* Nhóm các nút bấm */}
                            <div className={styles.flowActions}>
                                <button
                                    type="button"
                                    className={styles.primaryDemoButton}
                                    onClick={handleFakePayment}
                                >
                                    SIMULATE QR PAYMENT (PAID)
                                </button>
                                <div className={styles.demoButtonGroup}>
                                    <button
                                        type="button"
                                        className={styles.subDemoButton}
                                        onClick={() => handleDemoFailure("FAILED")}
                                    >
                                        SIMULATE FAILURE
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.subDemoButton}
                                        onClick={() => handleDemoFailure("UNCERTAIN")}
                                    >
                                        SIMULATE UNCERTAIN
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={handleCancelOrder}
                                >
                                    CANCEL ORDER
                                </button>
                            </div>
                        </div>
                    )}

                    {step === "PAID_GUIDANCE" && order && (
                        <div className={styles.flowCard}>
                            {/* Huy hiệu xác nhận thanh toán cao cấp */}
                            <div className={styles.successBadgeGlow}>
                                <span className={styles.successDotPulse} />
                                PAYMENT CONFIRMED
                            </div>

                            <h2 className={styles.flowTitle}>GET READY FOR YOUR SAMPLE</h2>

                            {/* Thẻ tên sản phẩm tinh tế */}
                            <div className={styles.guidanceProductTag}>
                                <span className={styles.guidanceSubLabel}>CURATED FRAGRANCE</span>
                                <p className={styles.guidanceProductName}>{order.product.productName}</p>
                            </div>

                            {/* Khung hướng dẫn mô phỏng khu vực cảm biến vòi phun */}
                            <div className={styles.nozzleGuideBox}>
                                <div className={styles.nozzleSensorRing}>
                                    <div className={styles.sensorCore} />
                                </div>
                                <p className={styles.guidanceText}>
                                    Place your <strong>wrist</strong> or <strong>test strip</strong> directly under the active nozzle area.
                                </p>
                                <p className={styles.guidanceSub}>
                                    Hold steady. The automated system will dispense exactly one precise dose.
                                </p>
                            </div>

                            <div className={styles.dispensingSequenceRow}>
                                <span className={styles.miniSpinner} />
                                <p className={styles.flowHintInline}>Initiating precise dispensing sequence...</p>
                            </div>
                        </div>
                    )}

                    {step === "DISPENSING" && order && (
                        <div className={styles.flowCard}>
                            {/* Hiệu ứng ánh sáng lan tỏa cao cấp */}
                            <div className={styles.dispensingVisualWrapper}>
                                <div className={styles.pulseRingOuter} />
                                <div className={styles.pulseRingInner} />
                                <div className={styles.dispensingCoreIcon}>✦</div>
                            </div>

                            <h2 className={styles.flowTitle}>DISPENSING SCENT</h2>

                            {/* Thẻ sản phẩm được nâng cấp viền sáng */}
                            <div className={styles.dispensingProductBadge}>
                                <span className={styles.badgeSubText}>PRECISE SPRAY IN PROGRESS</span>
                                <p className={styles.badgeProductName}>{order.product.productName}</p>

                                {/* Thanh tiến trình giả lập dòng chảy tinh chất */}
                                <div className={styles.dispensingProgressBar}>
                                    <div className={styles.dispensingProgressFill} />
                                </div>
                            </div>

                            <p className={styles.flowHint}>
                                Please keep your wrist or test strip steady in the nozzle area...
                            </p>
                        </div>
                    )}

                    {step === "SUCCESS" && order && (
                        <div className={styles.flowCard}>
                            {/* Biểu tượng hoàn tất với quầng sáng phát ngọc */}
                            <div className={styles.successCompleteIconWrapper}>
                                <div className={styles.successPulseRing} />
                                <div className={styles.successCheckSymbol}>✓</div>
                            </div>

                            <h2 className={styles.flowTitle}>EXPERIENCE COMPLETE</h2>

                            {/* Thẻ thông tin sản phẩm đã trải nghiệm */}
                            <div className={styles.completeProductBadge}>
                                <span className={styles.completeSubLabel}>SUCCESSFULLY DISPENSED</span>
                                <p className={styles.completeProductName}>{order.product.productName}</p>
                            </div>

                            <p className={styles.completeThankYouText}>
                                Thank you for exploring our curated olfactory collection. Your sample has been precisely delivered.
                            </p>

                            {/* Nút bấm quay về catalogue sang trọng */}
                            <button
                                type="button"
                                className={styles.completeFinishButton}
                                onClick={() => {
                                    setStep("SELECT");
                                    setSelectedProduct(null);
                                    setOrder(null);
                                }}
                            >
                                DONE / BACK TO CATALOGUE
                            </button>
                        </div>
                    )}

                    {/* --- TRẠNG THÁI 1: FAILED (LỖI HOÀN TOÀN / KHÔNG TRỪ TIỀN) --- */}
                    {step === "FAILED" && (
                        <div className={styles.flowCard}>
                            <div className={styles.errorIconWrapper}>
                                <div className={styles.errorPulseRing} />
                                <div className={styles.errorSymbol}>!</div>
                            </div>

                            <h2 className={styles.flowTitle}>TRANSACTION FAILED</h2>

                            <p className={styles.flowHint}>
                                {errorMessage ?? "The transaction could not be completed. Please keep your reference and contact support."}
                            </p>

                            {order && (
                                <div className={styles.referenceBadge}>
                                    <span className={styles.referenceLabel}>ORDER REFERENCE</span>
                                    <span className={styles.referenceValue}>{order.orderId}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                className={styles.errorActionButton}
                                onClick={resetToSelect}
                            >
                                BACK TO FRAGRANCES
                            </button>
                        </div>
                    )}

                    {/* --- TRẠNG THÁI 2: UNCERTAIN (NGHI VẤN / ĐANG ĐỐI SOÁT HOÀN TIỀN) --- */}
                    {step === "UNCERTAIN" && (
                        <div className={styles.flowCard}>
                            <div className={styles.errorIconWrapper}>
                                <div className={styles.uncertainPulseRing} />
                                <div className={styles.uncertainSymbol}>!</div>
                            </div>

                            <h2 className={styles.flowTitle}>TRANSACTION UNCERTAIN</h2>

                            <p className={styles.flowHint}>
                                {errorMessage ?? "The system could not verify machine confirmation. Your order is logged for automated refund review if charged."}
                            </p>

                            {order && (
                                <div className={styles.referenceBadge}>
                                    <span className={styles.referenceLabel}>ORDER REFERENCE</span>
                                    <span className={styles.referenceValue}>{order.orderId}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                className={styles.errorActionButton}
                                onClick={resetToSelect}
                            >
                                BACK TO FRAGRANCES
                            </button>
                        </div>
                    )}
                </section>
            </main>
        );
    }

    const parsedNotes = selectedProduct ? parseNotesFallback(selectedProduct.notes) : null;

    return (
        <main className={styles.kioskPage}>
            <header className={styles.kioskHeader}>
                <div className={styles.headerInner}>
                    <div className={styles.brandGroup}>
                        <h1 className={styles.brandName}>SCENTSTATION</h1>
                        <p className={styles.brandTagline}>EDITORIAL FRAGRANCE EXPERIENCE</p>
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.statusContainer}>
                            <button
                                type="button"
                                className={`${styles.machineStatus} ${currentStatus.className}`}
                                onClick={() => setIsStatusOpen((prev) => !prev)}
                                aria-expanded={isStatusOpen}
                                aria-controls="machine-status-panel"
                            >
                                <span className={styles.statusPulse}>
                                    <span className={styles.statusDot} />
                                </span>
                                <span className={styles.statusText}>{currentStatus.label}</span>
                            </button>

                            {isStatusOpen && (
                                <div id="machine-status-panel" className={styles.statusPanel}>
                                    <div className={styles.statusPanelHeader}>
                                        <span className={styles.statusPanelEyebrow}>SYSTEM STATUS</span>
                                        <button
                                            type="button"
                                            className={styles.statusCloseButton}
                                            onClick={() => setIsStatusOpen(false)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className={styles.statusPanelBody}>
                                        <div className={styles.statusDetailRow}>
                                            <span>Device ID</span>
                                            <strong>{deviceId}</strong>
                                        </div>
                                        <div className={styles.statusDetailRow}>
                                            <span>Connection</span>
                                            <strong>{machineStatus}</strong>
                                        </div>
                                        <div className={styles.statusDetailRow}>
                                            <span>Active Slots</span>
                                            <strong>{availableProducts.length} fragrances</strong>
                                        </div>
                                    </div>
                                    <p className={styles.statusDescription}>{currentStatus.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {selectedProduct ? (
                <section className={styles.detailSection}>
                    <button
                        type="button"
                        className={styles.backButton}
                        onClick={() => {
                            setSelectedProduct(null);
                            setErrorMessage(null);
                        }}
                    >
                         BACK TO CATALOGUE
                    </button>
                    <div className={styles.detailLayout}>
                        <div className={styles.detailImagePanel}>
                            {selectedProduct.imageUrl ? (
                                <Image
                                    src={selectedProduct.imageUrl}
                                    alt={selectedProduct.productName}
                                    width={720}
                                    height={900}
                                    priority
                                    className={styles.detailImage}
                                />
                            ) : (
                                <div className={styles.imagePlaceholder}>
                                    <span>SCENTSTATION EDITORIAL</span>
                                    <strong>{selectedProduct.productName}</strong>
                                    <small>VISUAL ARCHIVE PREVIEW</small>
                                </div>
                            )}
                        </div>
                        <div className={styles.detailContent}>
                            <p className={styles.eyebrow}>FRAGRANCE SPECIFICATION</p>
                            <p className={styles.detailBrand}>{selectedProduct.brand ?? "CURATED HOUSE"}</p>
                            <h2 className={styles.detailTitle}>{selectedProduct.productName}</h2>
                            <p className={styles.detailDescription}>
                                {selectedProduct.description ||
                                    selectedProduct.notes ||
                                    "An exquisite olfactory composition curated for discerning individuals."}
                            </p>
                            <div className={styles.detailFacts}>
                                <div>
                                    <span>FAMILY</span>
                                    <strong>{selectedProduct.fragranceFamily ?? "CONTEMPORARY"}</strong>
                                </div>
                                <div>
                                    <span>CONCENTRATION</span>
                                    <strong>{selectedProduct.concentration ?? "EAU DE PARFUM"}</strong>
                                </div>
                                <div>
                                    <span>AUDIENCE</span>
                                    <strong>{selectedProduct.audience ?? "UNISEX"}</strong>
                                </div>
                                <div>
                                    <span>MACHINE SLOT</span>
                                    <strong>{String(selectedProduct.slotNumber).padStart(2, "0")}</strong>
                                </div>
                            </div>
                            <div className={styles.scentProfile}>
                                <div>
                                    <span>TOP NOTES</span>
                                    <strong>
                                        {renderNotesList(selectedProduct.topNotes, parsedNotes?.top)}
                                    </strong>
                                </div>
                                <div>
                                    <span>HEART NOTES</span>
                                    <strong>
                                        {renderNotesList(selectedProduct.heartNotes, parsedNotes?.heart)}
                                    </strong>
                                </div>
                                <div>
                                    <span>BASE NOTES</span>
                                    <strong>
                                        {renderNotesList(selectedProduct.baseNotes, parsedNotes?.base)}
                                    </strong>
                                </div>
                                <div className={styles.sourcePriceRow}>
                                    <span>10ML DECANT REFERENCE</span>
                                    <strong>
                                        {formatRetailReference(
                                            selectedProduct.retailPrice10ml,
                                            selectedProduct.price
                                        )}
                                    </strong>
                                </div>
                            </div>
                            <div className={styles.detailPriceBlock}>
                                <div>
                                    <span>EXPERIENCE PRICE</span>
                                    <strong>{formatPrice(selectedProduct.price)}</strong>
                                </div>
                                <span className={styles.slotNumber}>1 PRECISE SPRAY</span>
                            </div>
                            {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
                            <button
                                type="button"
                                onClick={handleConfirmSelection}
                                disabled={isCreatingOrder || !selectedProduct.available}
                                className={styles.detailConfirmButton}
                            >
                                {isCreatingOrder ? "INITIALIZING ORDER..." : "EXPERIENCE NOW"}
                            </button>
                            <p className={styles.detailDisclaimer}>
                                Experience fee covers one automated precise spray at the kiosk.
                            </p>
                        </div>
                    </div>
                </section>
            ) : (
                <>
                    <section className={styles.heroSection}>
                        <p className={styles.eyebrow}>CURATED OLFACTORY ARCHIVE</p>
                        <h1 className={styles.heroTitle}>
                            DISCOVER YOUR
                            <br />
                            SIGNATURE SCENT.
                        </h1>
                        <p className={styles.heroDescription}>
                            Explore our curated collection of luxury fragrances. Select a scent and experience an automated precise spray instantly.
                        </p>

                        {/* --- INTERACTIVE 3-VIDEO SLIDING CAROUSEL --- */}
                        <div className={styles.carouselContainer}>
                            <div className={styles.carouselTrack}>
                                {(() => {
                                    const videoList = [
                                        {
                                            id: 0,
                                            src: "/videos/guerlain-vetiver.mp4",
                                            title: "VÉTIVER FAUVE",
                                            subtitle: "L’ART & LA MATIÈRE"
                                        },
                                        {
                                            id: 1,
                                            src: "/videos/guerlain-peche.mp4",
                                            title: "PÊCHE MIRAGE",
                                            subtitle: "GUERLAIN × CHARLES PÉTILLON"
                                        },
                                        {
                                            id: 2,
                                            src: "/videos/guerlain-heritage.mp4",
                                            title: "MAISON HERITAGE",
                                            subtitle: "LE CONTE DES MERVEILLES"
                                        },
                                    ];

                                    // Sắp xếp lại thứ tự mảng dựa trên activeVideoIndex để video được chọn luôn đứng giữa (index 1)
                                    const reorderedVideos = [
                                        videoList[(activeVideoIndex - 1 + videoList.length) % videoList.length], // Nằm bên trái
                                        videoList[activeVideoIndex], // Nằm ở giữa (Active)
                                        videoList[(activeVideoIndex + 1) % videoList.length], // Nằm bên phải
                                    ];

                                    return reorderedVideos.map((item, positionIndex) => {
                                        // positionIndex === 1 luôn luôn là item nằm ở giữa màn hình
                                        const isActive = positionIndex === 1;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`${styles.carouselItem} ${
                                                    isActive ? styles.activeItem : styles.inactiveItem
                                                }`}
                                                onClick={() => {
                                                    // Khi bấm vào item bên trái hoặc bên phải, tìm index gốc của nó để update activeVideoIndex
                                                    const originalIndex = videoList.findIndex(v => v.id === item.id);
                                                    setActiveVideoIndex(originalIndex);
                                                }}
                                            >
                                                <video
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    className={styles.carouselVideo}
                                                >
                                                    <source src={item.src} type="video/mp4" />
                                                </video>

                                                <div className={styles.carouselOverlay} />

                                                {isActive && (
                                                    <div className={styles.carouselCaption}>
                                                        <span className={styles.captionSubtitle}>{item.subtitle}</span>
                                                        <h3 className={styles.captionTitle}>{item.title}</h3>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Thanh chấm điều hướng */}
                            <div className={styles.carouselDots}>
                                {[0, 1, 2].map((index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        aria-label={`Chuyển đến video ${index + 1}`}
                                        className={`${styles.dot} ${index === activeVideoIndex ? styles.activeDot : ""}`}
                                        onClick={() => setActiveVideoIndex(index)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.deviceInfo}>
                            <span>ACTIVE KIOSK UNIT</span>
                            <strong>{deviceId}</strong>
                        </div>
                    </section>

                    <section className={styles.collectionSection}>
                        <div className={styles.sectionHeading}>
                            <div>
                                <p className={styles.sectionEyebrow}>CATALOGUE</p>
                                <h2>Available Fragrances.</h2>
                            </div>
                            <span className={styles.productCount}>
                                {availableProducts.length} items ready in machine
                            </span>
                        </div>

                        {availableProducts.length > 0 ? (
                            <div className={styles.productGrid}>
                                {availableProducts.map((product) => (
                                    <article key={product.slotNumber} className={styles.productCard}>
                                        <button
                                            type="button"
                                            className={styles.productCardAction}
                                            onClick={() => handleSelectProduct(product)}
                                            aria-label={`Select ${product.productName}`}
                                        >
                                            <div className={styles.visualWrapper}>
                                                <div className={styles.productVisual}>
                                                    {product.imageUrl ? (
                                                        <Image
                                                            src={product.imageUrl}
                                                            alt={product.productName}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 400px"
                                                            className={styles.productImage}
                                                        />
                                                    ) : (
                                                        <div className={styles.imagePlaceholder}>
                                                            <span>SCENTSTATION</span>
                                                            <strong>{product.productName}</strong>
                                                            <small>SLOT {String(product.slotNumber).padStart(2, "0")}</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.productDetails}>
                                                <span className={styles.slotNumber}>
                                                    SLOT {String(product.slotNumber).padStart(2, "0")}
                                                </span>
                                                <h3>{product.productName}</h3>
                                                <p className={styles.productNotes}>{product.notes}</p>
                                                <div className={styles.productFooter}>
                                                    <div>
                                                        <span className={styles.priceLabel}>PRICE / SPRAY</span>
                                                        <p className={styles.price}>{formatPrice(product.price)}</p>
                                                    </div>
                                                    <span className={styles.selectButton}>VIEW DETAILS</span>
                                                </div>
                                            </div>
                                        </button>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h3>No Fragrances Available</h3>
                                <p>All slots are currently empty or the machine is restocking.</p>
                            </div>
                        )}
                    </section>
                </>
            )}

            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerBrandBlock}>
                        <p className={styles.footerBrandName}>SCENTSTATION</p>
                        <p className={styles.footerBrandDesc}>
                            AUTOMATED FINE FRAGRANCE DISPENSING KIOSK
                        </p>
                        <span className={styles.footerUnitBadge}>
                            DEVICE ID: <strong>{deviceId}</strong>
                        </span>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>CUSTOMER SUPPORT</h4>
                        <p>Hotline: 1900-SCENT (72368)</p>
                        <p>Email: support@scentstation.com</p>
                        <p>Hours: 08:00 - 22:00 Daily</p>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>HOW IT WORKS</h4>
                        <p>1. Select Your Scent</p>
                        <p>2. Scan QR Code To Pay</p>
                        <p>3. Place Wrist & Enjoy Spray</p>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>COMPLIANCE & TERMS</h4>
                        <p>Auto-Refund Guarantee</p>
                        <p>Precise Dose Technology</p>
                        <p>Terms of Experience Service</p>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <span>SCENTSTATION EDITORIAL · ALL RIGHTS RESERVED</span>
                    <span>VERSION 2.4.0 · ENTERPRISE KIOSK EDITION</span>
                </div>
            </footer>
        </main>
    );
}