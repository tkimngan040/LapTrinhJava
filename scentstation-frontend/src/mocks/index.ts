
export interface ApiError {
    timestamp: string;
    status: number;
    code: string;
    message: string;
}


export interface AuthUser {
    id: number;
    fullName: string;
    email: string;
    brandId: number | null;
    roles: string[];
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

export interface MachineMenuSlot {
    slotNumber: number;
    productId: number;
    productName: string;
    notes: string;
    imageUrl: string;
    price: number;
    available: boolean;
}

export interface MachineMenuResponse {
    deviceId: string;
    status: string;
    slots: MachineMenuSlot[];
}

export interface CreateOrderResponse {
    orderId: number;
    status: string;
    price: number;
    qrContent: string;
    expiresAt: string;
}

export interface OrderStatusResponse {
    orderId: number;
    status: string;
    failureReason: string | null;
}


interface MockAccount {
    email: string;
    password: string;
    user: AuthUser;
    locked: boolean;
}

// Mock accounts for Frontend testing only
export const MOCK_ACCOUNTS: MockAccount[] = [
    {
        email: "admin@scentstation.local",
        password: "ScentDemo123!",
        locked: false,
        user: {
            id: 1,
            fullName: "Platform Administrator",
            email: "admin@scentstation.local",
            brandId: null,
            roles: ["PSA"],
        },
    },
    {
        email: "viewer@scentstation.local",
        password: "ScentDemo123!",
        locked: false,
        user: {
            id: 2,
            fullName: "Viewer Account",
            email: "viewer@scentstation.local",
            brandId: null,
            roles: ["VW"],
        },
    },
    {
        email: "locked@scentstation.local",
        password: "ScentDemo123!",
        locked: true,
        user: {
            id: 3,
            fullName: "Locked Account",
            email: "locked@scentstation.local",
            brandId: null,
            roles: ["VW"],
        },
    },
];

export function mockLogin(
    email: string,
    password: string,
): LoginResponse {
    const account = MOCK_ACCOUNTS.find(
        (item) => item.email === email.trim().toLowerCase(),
    );

    if (!account || account.password !== password) {
        throw new Error("Invalid email or password.");
    }

    if (account.locked) {
        throw new Error("Your account has been locked. Please contact the administrator.");
    }

    return {
        token: `mock-jwt-token-${account.user.id}`,
        user: account.user,
    };
}

// Keep this export for existing mock data consumers
export const mockLoginResponse: LoginResponse = {
    token: "mock-jwt-token-1",
    user: MOCK_ACCOUNTS[0].user,
};


export const mockMachineMenu: MachineMenuResponse = {
    deviceId: "KIOSK-001",
    status: "ONLINE",
    slots: [
        {
            slotNumber: 1,
            productId: 10,
            productName: "Rose Elegance",
            notes: "A refined floral fragrance",
            imageUrl: "/mock/rose-elegance.png",
            price: 20000,
            available: true,
        },
        {
            slotNumber: 2,
            productId: 11,
            productName: "Citrus Breeze",
            notes: "A fresh and vibrant fragrance",
            imageUrl: "/mock/citrus-breeze.png",
            price: 25000,
            available: true,
        },
        {
            slotNumber: 3,
            productId: 12,
            productName: "Midnight Oud",
            notes: "A warm woody fragrance",
            imageUrl: "/mock/midnight-oud.png",
            price: 30000,
            available: false,
        },
    ],
};

export const mockCreateOrderResponse: CreateOrderResponse = {
    orderId: 55,
    status: "PENDING",
    price: 20000,
    qrContent: "MOCK-QR-ORDER-55",
    expiresAt: "2026-11-05T10:30:00Z",
};

export const mockOrderStatus: OrderStatusResponse = {
    orderId: 55,
    status: "DISPENSING",
    failureReason: null,
};

export const mockApiError: ApiError = {
    timestamp: "2026-11-05T10:30:00Z",
    status: 400,
    code: "SLOT_EMPTY",
    message: "Slot has insufficient volume",
};
