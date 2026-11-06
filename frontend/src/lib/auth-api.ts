import { api } from "@/lib/api";
import { mockLogin, type LoginResponse } from "@/mocks";

/**
 * The screens were built against the short role codes, and the backend sends
 * the seven role names of Report section 1.4. This is the one place the two
 * meet, so no screen has to know both spellings.
 *
 * Anything unrecognised becomes VW, the least that can be done with the
 * portal. The real gate is the backend, which checks the token's roles on
 * every request; this only decides what the menu offers.
 */
const ROLE_CODES: Record<string, string> = {
    PLATFORM_SUPER_ADMIN: "PSA",
    BRAND_ADMIN: "BA",
    OPERATIONS_MANAGER: "OM",
    TECHNICIAN: "TE",
    INVENTORY_STAFF: "IS",
    VIEWER: "VW",
    CUSTOMER: "VW",
};

export function toRoleCode(role: string): string {
    return ROLE_CODES[role] ?? (role.length <= 3 ? role : "VW");
}

/**
 * Signing in against the backend (UC-00, FR1.1).
 *
 * The backend calls the field `username` and validates it as an email address,
 * which is why this is the one place the rename happens: every screen above it
 * works in terms of an email.
 *
 * Set NEXT_PUBLIC_USE_MOCKS=true in .env.local to work on the screens with no
 * backend running. It is off by default, so a forgotten flag can never let a
 * build sign a person in against fixtures.
 */
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export async function login(
    email: string,
    password: string,
): Promise<LoginResponse> {
    if (USE_MOCKS) {
        return mockLogin(email, password);
    }

    const response = await api<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
            username: email.trim().toLowerCase(),
            password,
        }),
    });

    return {
        ...response,
        user: {
            ...response.user,
            roles: (response.user.roles ?? []).map(toRoleCode),
        },
    };
}

/**
 * Discarding the session. The token is stateless, so signing out is a local
 * discard; the call is made so the backend can audit it, and a failure to
 * reach it must not keep the person signed in.
 */
export async function logout(): Promise<void> {
    try {
        if (!USE_MOCKS) {
            await api<void>("/api/auth/logout", { method: "POST" });
        }
    } catch {
        // The backend being unreachable is not a reason to stay signed in.
    } finally {
        if (typeof window !== "undefined") {
            sessionStorage.clear();
        }
    }
}
