/**
 * Lightweight API client for the Hostinger MySQL backend (hostinger-backend/).
 * Reads base URL from localStorage (set in /admin/database-config) with
 * VITE_API_URL as fallback. Attaches the current Supabase JWT so backend
 * middleware can verify the user.
 */
import { supabase } from "@/integrations/supabase/client";

const API_STORAGE_KEY = "api_server_config";
const CANONICAL_API_URL = "https://api.fishcare.com.bd/api";
const MIGRATION_FLAG = "api_server_config_migrated_v1";

/**
 * One-time migration: rewrite any legacy fishcare API base URL
 * (e.g. https://new.fishcare.com.bd/api) to the dedicated API subdomain.
 * Local/dev URLs are left untouched.
 */
function migrateLegacyApiUrl(): void {
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;
    const saved = localStorage.getItem(API_STORAGE_KEY);
    if (saved) {
      const cfg = JSON.parse(saved) as { baseUrl?: string };
      const url = (cfg.baseUrl || "").trim();
      const isLocal = /localhost|127\.0\.0\.1|:\d{4}/.test(url);
      const isFishcare = /fishcare\.com\.bd/i.test(url);
      if (url && !isLocal && isFishcare && url.replace(/\/$/, "") !== CANONICAL_API_URL) {
        localStorage.setItem(
          API_STORAGE_KEY,
          JSON.stringify({ ...cfg, baseUrl: CANONICAL_API_URL })
        );
      }
    }
    localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    /* ignore */
  }
}

export function getApiBaseUrl(): string {
  migrateLegacyApiUrl();
  try {
    const saved = localStorage.getItem(API_STORAGE_KEY);
    if (saved) {
      const cfg = JSON.parse(saved) as { baseUrl?: string };
      if (cfg.baseUrl) return cfg.baseUrl.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  const envUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  if (envUrl) return envUrl;
  // Production default: dedicated Hostinger API subdomain
  return CANONICAL_API_URL;
}



export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiError(
      "MySQL backend base URL not configured. Set it in Admin → Database Config.",
      0,
      null
    );
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body && String((body as any).error)) ||
      `${res.status} ${res.statusText}`;
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

export const apiClient = {
  get: <T,>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
  post: <T,>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T,>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T,>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, { ...init, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T,>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "DELETE" }),
};

export async function pingBackend(): Promise<boolean> {
  const base = getApiBaseUrl();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}