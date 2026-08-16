const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "foundly_admin_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Thin wrapper around fetch() for the Foundly backend's standard
 * `{ success, message, data }` response envelope (see backend/src/lib/response.js).
 * Attaches the admin's bearer token automatically; throws ApiError on any
 * non-2xx or `success: false` response so callers can handle it in one place.
 */
async function request(path, { method = "GET", body, params } = {}) {
  const url = new URL(path, API_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Could not reach the Foundly backend. Is it running?", 0);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new ApiError(json?.message || "Something went wrong", res.status);
  }

  return json.data;
}

export const api = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/api/auth/me"),

  dashboard: () => request("/api/admin/dashboard"),

  listUsers: (params) => request("/api/admin/users", { params }),
  getUser: (id) => request(`/api/admin/users/${id}`),
  moderateUser: (id, body) => request(`/api/admin/users/${id}/moderate`, { method: "POST", body }),

  listListings: (params) => request("/api/admin/listings", { params }),
  getListing: (type, id) => request(`/api/admin/listings/${type}/${id}`),
  updateListing: (type, id, body) => request(`/api/admin/listings/${type}/${id}`, { method: "PATCH", body }),
  moderateListing: (type, id, body) =>
    request(`/api/admin/listings/${type}/${id}/moderate`, { method: "POST", body }),

  listReports: (params) => request("/api/admin/reports", { params }),
  updateReportStatus: (id, status) => request(`/api/admin/reports/${id}`, { method: "PATCH", body: { status } }),

  listVerifications: (params) => request("/api/admin/verifications", { params }),
  reviewVerification: (id, body) => request(`/api/admin/verifications/${id}/review`, { method: "POST", body }),

  listClaims: (params) => request("/api/admin/claims", { params }),
  getClaim: (id) => request(`/api/admin/claims/${id}`),
  moderateClaim: (id, body) => request(`/api/admin/claims/${id}/moderate`, { method: "POST", body }),

  listMatches: (params) => request("/api/admin/matches", { params }),
  getMatch: (id) => request(`/api/admin/matches/${id}`),
  moderateMatch: (id, body) => request(`/api/admin/matches/${id}/moderate`, { method: "POST", body }),

  listSpamFlags: (params) => request("/api/admin/spam-flags", { params }),
  getSpamFlag: (id) => request(`/api/admin/spam-flags/${id}`),
  reviewSpamFlag: (id, body) => request(`/api/admin/spam-flags/${id}`, { method: "PATCH", body }),

  listNotifications: (params) => request("/api/admin/notifications", { params }),

  moderationLog: (params) => request("/api/admin/moderation-log", { params }),
  getModerationLogEntry: (id) => request(`/api/admin/moderation-log/${id}`),
};
