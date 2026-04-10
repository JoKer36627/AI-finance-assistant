const API_BASE_OVERRIDE = new URLSearchParams(window.location.search).get("apiBase")
    || localStorage.getItem("ai_fin_assistant_api_base");

if (API_BASE_OVERRIDE) {
    localStorage.setItem("ai_fin_assistant_api_base", API_BASE_OVERRIDE);
}

const API_BASE = window.API_BASE || API_BASE_OVERRIDE || "http://127.0.0.1:8000";
const ACCESS_TOKEN_KEY = "ai_fin_assistant_access_token";

async function apiRequest(path, options = {}) {
    const token = authApi.getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers,
            credentials: "include"
        });
    } catch (networkError) {
        const error = new Error(
            `Cannot reach backend at ${API_BASE}. Start the FastAPI server on port 8000 and try again.`
        );
        error.cause = networkError;
        error.status = 0;
        throw error;
    }

    let payload = null;
    const contentType = response.headers.get("content-type") || "";
    const rawBody = await response.text();
    if (rawBody && contentType.includes("application/json")) {
        payload = JSON.parse(rawBody);
    }

    if (!response.ok) {
        const detail = payload?.detail;
        const message = Array.isArray(detail)
            ? detail.map((item) => `${item.field}: ${item.msg}`).join(", ")
            : detail || rawBody || "Request failed";
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload ?? rawBody ?? null;
}

const authApi = {
    getToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },

    clearToken() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    },

    async register(payload) {
        return apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    async verifyEmail(token) {
        return apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    },

    async login(payload) {
        const response = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        this.setToken(response.access_token);
        return response;
    },

    async logout() {
        return apiRequest("/auth/logout", { method: "POST" });
    },

    async getProfile() {
        return apiRequest("/users/me");
    }
};

const surveyApi = {
    getMine() {
        return apiRequest("/survey/me");
    },

    create(payload) {
        return apiRequest("/survey/", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    updateMine(payload) {
        return apiRequest("/survey/me", {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    }
};

const transactionsApi = {
    getMine() {
        return apiRequest("/transactions/me");
    },

    create(payload) {
        return apiRequest("/transactions/", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    update(transactionId, payload) {
        return apiRequest(`/transactions/${transactionId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },

    remove(transactionId) {
        return apiRequest(`/transactions/${transactionId}`, {
            method: "DELETE"
        });
    },

    getSummary() {
        return apiRequest("/transactions/summary");
    },

    parseText(payload) {
        return apiRequest("/transactions/parse-text", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    getInsights() {
        return apiRequest("/transactions/insights");
    }
};

const assistantApi = {
    sendMessage(payload) {
        return apiRequest("/assistant/chat", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    }
};
