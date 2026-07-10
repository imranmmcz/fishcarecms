/**
 * Unified storage wrapper — Hostinger backend (MySQL server) OR Supabase Storage.
 *
 * Uses the same shape as `supabase.storage.from(bucket).upload/getPublicUrl/remove`
 * so replacing call sites is mechanical.
 *
 * Mode is picked per-bucket:
 *   - `hostinger` (default when VITE_STORAGE_MODE=hostinger OR admin toggle enabled)
 *   - `supabase`  (legacy)
 *
 * Toggle stored in localStorage key `storage_mode` (values: 'hostinger' | 'supabase').
 */
import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export type StorageMode = "hostinger" | "supabase";

export function getStorageMode(): StorageMode {
  try {
    const env = (import.meta.env.VITE_STORAGE_MODE as string | undefined)?.toLowerCase();
    if (env === "hostinger" || env === "supabase") return env;
    const ls = localStorage.getItem("storage_mode");
    if (ls === "hostinger" || ls === "supabase") return ls;
  } catch {
    /* noop */
  }
  return "supabase"; // safe default until admin flips it
}

export function setStorageMode(mode: StorageMode) {
  localStorage.setItem("storage_mode", mode);
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

interface UploadResult {
  data: { path: string; fullPath?: string; publicUrl?: string } | null;
  error: { message: string } | null;
}

interface UrlResult {
  data: { publicUrl: string };
}

interface RemoveResult {
  data: unknown;
  error: { message: string } | null;
}

interface SignedUrlResult {
  data: { signedUrl: string } | null;
  error: { message: string } | null;
}

class HostingerBucket {
  constructor(private bucket: string) {}

  async upload(
    filePath: string,
    file: File | Blob,
    _options?: { upsert?: boolean; contentType?: string }
  ): Promise<UploadResult> {
    try {
      const form = new FormData();
      form.append("file", file);
      const token = getAuthToken();
      const res = await fetch(
        `${API_BASE_URL}/upload/bucket/${encodeURIComponent(this.bucket)}/${filePath}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: { message: json.error || `HTTP ${res.status}` } };
      return {
        data: { path: json.path || filePath, fullPath: json.data?.fullPath, publicUrl: json.publicUrl },
        error: null,
      };
    } catch (e: any) {
      return { data: null, error: { message: e.message || "Upload failed" } };
    }
  }

  getPublicUrl(filePath: string): UrlResult {
    const base = API_BASE_URL.replace(/\/api\/?$/, "");
    return {
      data: { publicUrl: `${base}/uploads/${this.bucket}/${filePath}` },
    };
  }

  async createSignedUrl(filePath: string, expiresIn = 3600): Promise<SignedUrlResult> {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/upload/signed-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ bucket: this.bucket, path: filePath, expiresIn }),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.error || `HTTP ${res.status}` } };
      return { data: { signedUrl: json.signedUrl }, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  async remove(paths: string[]): Promise<RemoveResult> {
    try {
      const token = getAuthToken();
      for (const p of paths) {
        await fetch(
          `${API_BASE_URL}/upload/bucket/${encodeURIComponent(this.bucket)}/${p}`,
          {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
      }
      return { data: { removed: paths }, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  async list(prefix = ""): Promise<{ data: any[] | null; error: { message: string } | null }> {
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${API_BASE_URL}/upload/bucket/${encodeURIComponent(this.bucket)}/list?prefix=${encodeURIComponent(prefix)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.error || `HTTP ${res.status}` } };
      return { data: json.data || [], error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }
}

/**
 * `appStorage.from("avatars").upload(...)` → routes to Hostinger or Supabase
 * depending on mode. Public API mirrors `supabase.storage.from(...)`.
 */
export const appStorage = {
  from(bucket: string) {
    if (getStorageMode() === "hostinger") return new HostingerBucket(bucket);
    return supabase.storage.from(bucket);
  },
};

/**
 * Copy every file from a Supabase Storage bucket into the Hostinger backend.
 * Runs entirely from the browser (admin-only) — walks the bucket, generates
 * public URLs, and calls the backend migration endpoint in chunks.
 */
export async function migrateBucketToHostinger(
  bucket: string,
  opts: { onProgress?: (m: string) => void; batchSize?: number } = {}
): Promise<{ succeeded: number; failed: number; details: any[] }> {
  const { onProgress, batchSize = 25 } = opts;
  const collected: { name: string; path: string }[] = [];

  async function walk(prefix: string) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) throw new Error(error.message);
    for (const entry of (data || []) as any[]) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Folders in Supabase Storage show up with id === null / no metadata
      if (entry.id == null || entry.metadata == null) {
        await walk(full);
      } else {
        collected.push({ name: entry.name, path: full });
      }
    }
  }

  onProgress?.(`Scanning bucket "${bucket}"…`);
  await walk("");
  onProgress?.(`Found ${collected.length} files. Uploading…`);

  const token = getAuthToken();
  const allResults: any[] = [];
  for (let i = 0; i < collected.length; i += batchSize) {
    const chunk = collected.slice(i, i + batchSize);
    const files = await Promise.all(
      chunk.map(async (f) => {
        // For private buckets we need a signed URL to fetch.
        const pub = supabase.storage.from(bucket).getPublicUrl(f.path).data.publicUrl;
        // Try public first; if bucket is private, request a signed URL.
        let url = pub;
        try {
          const head = await fetch(pub, { method: "HEAD" });
          if (!head.ok) {
            const signed = await supabase.storage.from(bucket).createSignedUrl(f.path, 300);
            if (signed.data?.signedUrl) url = signed.data.signedUrl;
          }
        } catch {
          const signed = await supabase.storage.from(bucket).createSignedUrl(f.path, 300);
          if (signed.data?.signedUrl) url = signed.data.signedUrl;
        }
        return { path: f.path, url };
      })
    );

    const res = await fetch(`${API_BASE_URL}/upload/migrate-from-supabase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ bucket, files }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    allResults.push(...(json.data?.results || []));
    onProgress?.(`Migrated ${Math.min(i + batchSize, collected.length)}/${collected.length}`);
  }

  return {
    succeeded: allResults.filter((r) => r.ok).length,
    failed: allResults.filter((r) => !r.ok).length,
    details: allResults,
  };
}