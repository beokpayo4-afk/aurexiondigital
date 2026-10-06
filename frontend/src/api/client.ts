import axios from "axios";

const TOKEN_KEY = "aurexion.access";
const REFRESH_KEY = "aurexion.refresh";

function apiOrigin(): string {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!configured) {
    return "http://localhost:8000";
  }
  return configured.replace(/\/api(?:\/v1)?\/?$/, "");
}

export const api = axios.create({
  baseURL: `${apiOrigin()}/api`,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

export const apiV1 = axios.create({
  baseURL: `${apiOrigin()}/api/v1`,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function readAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveTokens(accessToken: string): void {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function clearTokens(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function readRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}
