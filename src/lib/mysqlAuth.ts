/**
 * Custom JWT auth client backed by the Hostinger MySQL backend
 * (hostinger-backend/routes/auth.js). Keeps its own bearer token in
 * localStorage — completely independent of the Supabase session.
 */
import { getApiBaseUrl } from "@/lib/apiClient";
import { MYSQL_TOKEN_KEY } from "@/lib/authProvider";

export interface MysqlUser {
  id: string | number;
  email: string;
  full_name: string | null;
  role: string;
  mobile?: string | null;
  division?: string | null;
  district?: string | null;
  upazila?: string | null;
  village?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(MYSQL_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string) {
  try {
    localStorage.setItem(MYSQL_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(MYSQL_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("ব্যাকএন্ড URL সেট করা নেই। Admin → Database Config থেকে সেট করুন।");
  }
  const token = getToken();
  const res = await fetch(`${base}/api/auth${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(body?.error || `${res.status} ${res.statusText}`);
  }
  return body as T;
}

export const mysqlAuth = {
  async signIn(identifier: string, password: string): Promise<MysqlUser> {
    const data = await call<{ user: MysqlUser; token: string }>("/signin", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    setToken(data.token);
    return data.user;
  },

  async signUp(payload: {
    email: string;
    password: string;
    full_name: string;
    mobile?: string;
    division?: string;
    district?: string;
    upazila?: string;
    village?: string;
    role_type?: string;
  }): Promise<MysqlUser> {
    const data = await call<{ user: MysqlUser; token: string }>("/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    return data.user;
  },

  async me(): Promise<MysqlUser | null> {
    if (!getToken()) return null;
    try {
      const data = await call<{ user: MysqlUser }>("/me");
      return data.user;
    } catch {
      clearToken();
      return null;
    }
  },

  async updateProfile(patch: Partial<MysqlUser>): Promise<MysqlUser> {
    const data = await call<{ user: MysqlUser }>("/profile", {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return data.user;
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await call("/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async isMobileAvailable(mobile: string): Promise<boolean> {
    try {
      const data = await call<{ available: boolean }>(
        `/mobile-available?mobile=${encodeURIComponent(mobile)}`
      );
      return data.available;
    } catch {
      return true;
    }
  },

  async signOut(): Promise<void> {
    try {
      await call("/signout", { method: "POST" });
    } catch {
      /* ignore */
    }
    clearToken();
  },
};
