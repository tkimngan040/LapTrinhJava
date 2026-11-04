
import { api } from "@/lib/api";
import type {
    MachineMenuResponse,
    CreateOrderResponse,
    OrderStatusResponse,
} from "@/mocks";

export async function getMachineMenu(
    deviceId: string,
): Promise<MachineMenuResponse> {
    return api<MachineMenuResponse>(
        `/api/kiosk/machines/${encodeURIComponent(deviceId)}/menu`,
        {
            method: "GET",
        },
    );
}

export async function createKioskOrder(
    deviceId: string,
    slotNumber: number,
): Promise<CreateOrderResponse> {
    return api<CreateOrderResponse>("/api/kiosk/orders", {
        method: "POST",
        body: JSON.stringify({
            deviceId,
            slotNumber,
        }),
    });
}

export async function getKioskOrderStatus(
    orderId: number,
): Promise<OrderStatusResponse> {
    return api<OrderStatusResponse>(
        `/api/kiosk/orders/${orderId}/status`,
        {
            method: "GET",
        },
    );
}
