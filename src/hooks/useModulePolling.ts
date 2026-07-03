/**
 * useModulePolling — MySQL-routed modules lose Supabase realtime, so
 * fall back to polling when routing = mysql. No-op for supabase routing.
 *
 * - Pauses when the tab is hidden.
 * - Re-runs refetch immediately when tab regains focus.
 * - Safe if `refetch` identity changes (uses a ref).
 */
import { useEffect, useRef } from "react";
import { isMysql, type RoutableModule } from "@/lib/dataSource";

export function useModulePolling(
  module: RoutableModule,
  refetch: () => void | Promise<void>,
  intervalMs: number = 15000,
) {
  const cbRef = useRef(refetch);
  cbRef.current = refetch;

  useEffect(() => {
    if (!isMysql(module)) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        try { void cbRef.current(); } catch { /* swallow */ }
      }, Math.max(3000, intervalMs));
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };
    const onVis = () => {
      if (document.hidden) {
        stop();
      } else {
        try { void cbRef.current(); } catch { /* swallow */ }
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, [module, intervalMs]);
}