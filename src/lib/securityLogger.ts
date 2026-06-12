import { supabase } from "@/integrations/supabase/client";

type Severity = "info" | "warning" | "critical";

interface LogParams {
  eventType: string;
  severity?: Severity;
  resourceTable?: string;
  policyName?: string;
  action?: string;
  details?: Record<string, unknown>;
}

// Best-effort rate limiter to avoid flooding logs from a single client.
const recent = new Map<string, number>();
const WINDOW_MS = 10_000;

export async function logSecurityEvent({
  eventType,
  severity = "info",
  resourceTable,
  policyName,
  action,
  details,
}: LogParams): Promise<void> {
  try {
    const key = `${eventType}|${resourceTable || ""}|${action || ""}`;
    const now = Date.now();
    const last = recent.get(key) || 0;
    if (now - last < WINDOW_MS) return;
    recent.set(key, now);

    await supabase.rpc("log_security_event" as any, {
      _event_type: eventType,
      _severity: severity,
      _resource_table: resourceTable ?? null,
      _policy_name: policyName ?? null,
      _action: action ?? null,
      _request_path: typeof window !== "undefined" ? window.location.pathname : null,
      _details: details ?? {},
    });
  } catch {
    // never throw from logger
  }
}

/**
 * Inspect a Supabase error and, if it looks like an RLS denial or auth failure,
 * record it. Returns the original error so callers can still handle it.
 */
export function reportSupabaseError(
  error: { code?: string; message?: string } | null,
  context: { table?: string; action?: string },
) {
  if (!error) return error;
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";

  const isRls =
    msg.includes("row-level security") ||
    msg.includes("violates row-level") ||
    code === "42501" ||
    code === "PGRST301";
  const isAuth = code === "PGRST302" || msg.includes("jwt") || msg.includes("not authenticated");

  if (isRls) {
    logSecurityEvent({
      eventType: "rls_policy_denied",
      severity: "warning",
      resourceTable: context.table,
      action: context.action,
      details: { code, message: error.message },
    });
  } else if (isAuth) {
    logSecurityEvent({
      eventType: "auth_required",
      severity: "info",
      resourceTable: context.table,
      action: context.action,
      details: { code, message: error.message },
    });
  }
  return error;
}