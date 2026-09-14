import axios from "axios";

const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const apiBaseUrl = configuredApiUrl.replace(/\/$/, "");

if (!apiBaseUrl && import.meta.env.PROD) {
  console.warn("VITE_API_URL is not configured; API requests will use the current origin.");
}

const api = axios.create({
  baseURL: apiBaseUrl || "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

export default api;
