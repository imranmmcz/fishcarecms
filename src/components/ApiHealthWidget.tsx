import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiClient";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "checking" | "online" | "slow" | "offline";

const POLL_MS = 60_000;

/** Small always-visible API health indicator for the live site (footer). */
export default function ApiHealthWidget() {
  const { language } = useLanguage();
  const bn = language === "bn";
  const [status, setStatus] = useState<Status>("checking");
  const [latency, setLatency] = useState<number | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  const check = useCallback(async () => {
    const base = getApiBaseUrl().replace(/\/api$/, "");
    const t0 = performance.now();
    try {
      const res = await fetch(`${base}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(8_000),
      });
      const ms = Math.round(performance.now() - t0);
      if (!mounted.current) return;
      setLatency(ms);
      setCheckedAt(new Date());
      setStatus(!res.ok ? "offline" : ms > 1500 ? "slow" : "online");
    } catch {
      if (!mounted.current) return;
      setLatency(null);
      setCheckedAt(new Date());
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    check();
    const id = window.setInterval(check, POLL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [check]);

  const label: Record<Status, string> = {
    checking: bn ? "চেক হচ্ছে…" : "Checking…",
    online: bn ? "API সচল" : "API online",
    slow: bn ? "API ধীর" : "API slow",
    offline: bn ? "API বন্ধ" : "API offline",
  };

  const dot =
    status === "online"
      ? "bg-emerald-500"
      : status === "slow"
      ? "bg-amber-500"
      : status === "offline"
      ? "bg-destructive"
      : "bg-muted-foreground";

  const title = checkedAt
    ? `${label[status]}${latency !== null ? ` · ${latency}ms` : ""} · ${checkedAt.toLocaleTimeString()}`
    : label[status];

  return (
    <button
      type="button"
      onClick={check}
      title={title}
      aria-label={`${label[status]} — ${bn ? "আবার চেক করুন" : "check again"}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] leading-none transition-colors hover:bg-white/10"
      style={{ color: "hsl(var(--footer-text, 215 19% 78%) / 0.85)" }}
    >
      {status === "checking" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      )}
      <Activity className="h-3 w-3 opacity-60" aria-hidden="true" />
      <span>{label[status]}</span>
      {latency !== null && status !== "offline" && <span className="opacity-70">{latency}ms</span>}
    </button>
  );
}
