import axios from "axios";

let accessToken = null;
let refreshRequest = null;

const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

const api = axios.create({
  baseURL: rawApiUrl || "/api",
  timeout: 15000,
  headers: { Accept: "application/json" },
  withCredentials: true,
});

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const csrfCookie = document.cookie.split(";").map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("interviewiq_csrf="));
  return csrfCookie ? decodeURIComponent(csrfCookie.slice("interviewiq_csrf=".length)) : "";
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const detail = error.response?.data?.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item.msg || item.message || "Invalid request").join("; ")
        : error.response?.data?.message || (error.response ? error.message : "Unable to reach the InterviewIQ API. Check that the backend is running and VITE_API_URL is correct.");
    const request = error.config;
    const authEndpoint = request?.url?.startsWith("/auth/");

    if (error.response?.status === 401 && accessToken && request && !request._authRetry && !authEndpoint) {
      request._authRetry = true;
      try {
        if (!refreshRequest) {
          const csrfToken = getCsrfToken();
          if (!csrfToken) throw new Error("Your session has expired. Please sign in again.");
          refreshRequest = api.post("/auth/refresh", null, {
            headers: { "X-CSRF-Token": csrfToken },
          }).then(({ data }) => {
            setAccessToken(data.access_token);
            return data.access_token;
          }).finally(() => {
            refreshRequest = null;
          });
        }
        const token = await refreshRequest;
        request.headers.Authorization = `Bearer ${token}`;
        return api(request);
      } catch (refreshError) {
        setAccessToken(null);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("interviewiq:auth-expired"));
        return Promise.reject(new Error(refreshError.response?.data?.detail || refreshError.message || message));
      }
    }

    return Promise.reject(new Error(message));
  },
);

export default api;
