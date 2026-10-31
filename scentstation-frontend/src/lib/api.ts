
const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

type ApiOptions = RequestInit & {
    token?: string | null;
};

async function readErrorMessage(response: Response): Promise<string> {
    const responseText = await response.text();

    if (!responseText) {
        return `API request failed: HTTP ${response.status}`;
    }

    try {
        const data: unknown = JSON.parse(responseText);

        if (typeof data === "string") {
            return data;
        }

        if (data && typeof data === "object") {
            const errorData = data as Record<string, unknown>;

            for (const key of ["message", "error", "detail", "title"]) {
                if (typeof errorData[key] === "string") {
                    return errorData[key] as string;
                }
            }
        }
    } catch {
        // The response is plain text rather than JSON.
    }

    return responseText;
}

export async function api<T>(
    endpoint: string,
    options: ApiOptions = {},
): Promise<T> {
    const { token, headers, ...requestOptions } = options;

    const savedToken =
        typeof window !== "undefined"
            ? sessionStorage.getItem("scentstation-token")
            : null;

    const authToken = token ?? savedToken;

    const response = await fetch(
        `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
        {
            ...requestOptions,
            headers: {
                Accept: "application/json",
                ...(requestOptions.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...(authToken
                    ? { Authorization: `Bearer ${authToken}` }
                    : {}),
                ...headers,
            },
        },
    );

    if (response.status === 401) {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("scentstation-token");
            sessionStorage.removeItem("scentstation-demo-user");
            sessionStorage.removeItem("scentstation-demo-role");
            sessionStorage.removeItem("scentstation-demo-remember");

            if (window.location.pathname !== "/login") {
                window.location.replace("/login");
            }
        }

        throw new Error("Your session has expired or is invalid.");
    }

    if (!response.ok) {
        throw new Error(await readErrorMessage(response));
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}
