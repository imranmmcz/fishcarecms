import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient, pingBackend } from "@/lib/apiClient";
import { Activity, AlertTriangle, Database, RefreshCw, Server } from "lucide-react";

interface HealthSummary {
  status: string;
  server: {
    uptime_s: number;
    node: string;
    env: string;
    memory: { rss_mb: number; heap_used_mb: number; heap_total_mb: number };
    load_avg: number[];
  };
  database: {
    ping_ms: number;
    pool: { connectionLimit?: number; allConnections?: number; freeConnections?: number; queue?: number };
    row_counts: Record<string, number | null>;
  };
  timestamp: string;
}
interface LatencySummary {
  total_requests: number;
  overall: { p50: number; p95: number; p99: number };
  routes: { route: string; count: number; p50: number; p95: number; p99: number; max: number }[];
}
interface RecentError {
  id: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  ts: string;
  message: string | null;
}

function fmtUptime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function AdminSystemHealth() {
  const { language } = useLanguage();
  const bn = language === "bn";
  const [online, setOnline] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [latency, setLatency] = useState<LatencySummary | null>(null);
  const [errors, setErrors] = useState<RecentError[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const up = await pingBackend();
    setOnline(up);
    if (up) {
      try {
        const [s, l, e] = await Promise.all([
          apiClient.get<HealthSummary>("/api/health/summary"),
          apiClient.get<LatencySummary>("/api/health/latency"),
          apiClient.get<{ errors: RecentError[] }>("/api/health/recent-errors?limit=50"),
        ]);
        setSummary(s);
        setLatency(l);
        setErrors(e.errors);
      } catch { /* keep old */ }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" /> {bn ? "সিস্টেম হেলথ" : "System Health"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {bn ? "MySQL ব্যাকএন্ডের লাইভ মেট্রিক্স ও এরর মনিটরিং।" : "Live metrics and error monitoring for the MySQL backend."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={online ? "default" : online === false ? "destructive" : "secondary"}>
            {online === null ? "…" : online ? (bn ? "অনলাইন" : "Online") : (bn ? "অফলাইন" : "Offline")}
          </Badge>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {bn ? "রিফ্রেশ" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4" /> {bn ? "সার্ভার" : "Server"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Uptime: <span className="font-mono">{summary ? fmtUptime(summary.server.uptime_s) : "—"}</span></div>
            <div>Node: <span className="font-mono">{summary?.server.node ?? "—"}</span></div>
            <div>Env: <span className="font-mono">{summary?.server.env ?? "—"}</span></div>
            <div>Memory: <span className="font-mono">{summary ? `${summary.server.memory.heap_used_mb}/${summary.server.memory.heap_total_mb} MB` : "—"}</span></div>
            <div>Load: <span className="font-mono">{summary?.server.load_avg.map((n) => n.toFixed(2)).join(" · ") ?? "—"}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" /> {bn ? "ডাটাবেজ" : "Database"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Ping: <span className="font-mono">{summary ? `${summary.database.ping_ms} ms` : "—"}</span></div>
            <div>Pool limit: <span className="font-mono">{summary?.database.pool.connectionLimit ?? "—"}</span></div>
            <div>Active: <span className="font-mono">{summary ? (summary.database.pool.allConnections ?? 0) - (summary.database.pool.freeConnections ?? 0) : "—"}</span></div>
            <div>Free: <span className="font-mono">{summary?.database.pool.freeConnections ?? "—"}</span></div>
            <div>Queue: <span className="font-mono">{summary?.database.pool.queue ?? "—"}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{bn ? "লেটেন্সি (p95)" : "Latency (p95)"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Overall p50: <span className="font-mono">{latency?.overall.p50.toFixed(1) ?? "—"} ms</span></div>
            <div>Overall p95: <span className="font-mono">{latency?.overall.p95.toFixed(1) ?? "—"} ms</span></div>
            <div>Overall p99: <span className="font-mono">{latency?.overall.p99.toFixed(1) ?? "—"} ms</span></div>
            <div>Requests: <span className="font-mono">{latency?.total_requests ?? 0}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{bn ? "টেবিল রো কাউন্ট" : "MySQL row counts"}</CardTitle>
          <CardDescription>{bn ? "প্রতি টেবিলে বর্তমান MySQL রো সংখ্যা।" : "Current MySQL row count per routed table."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 text-sm">
            {summary && Object.entries(summary.database.row_counts).map(([t, c]) => (
              <div key={t} className="flex items-center justify-between rounded border p-2">
                <span className="font-mono text-xs">{t}</span>
                <Badge variant={c === null ? "secondary" : "default"}>{c === null ? "N/A" : c}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{bn ? "রুটভিত্তিক লেটেন্সি" : "Per-route latency"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">p50</TableHead>
                <TableHead className="text-right">p95</TableHead>
                <TableHead className="text-right">p99</TableHead>
                <TableHead className="text-right">Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latency?.routes.map((r) => (
                <TableRow key={r.route}>
                  <TableCell className="font-mono text-xs">{r.route}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                  <TableCell className="text-right">{r.p50.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{r.p95.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{r.p99.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{r.max.toFixed(1)}</TableCell>
                </TableRow>
              ))}
              {!latency?.routes.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No traffic yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {bn ? "সাম্প্রতিক এরর" : "Recent errors"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Request ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((e) => (
                <TableRow key={e.id + e.ts}>
                  <TableCell className="text-xs">{new Date(e.ts).toLocaleTimeString()}</TableCell>
                  <TableCell className="font-mono text-xs">{e.method}</TableCell>
                  <TableCell className="font-mono text-xs">{e.route}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={e.status >= 500 ? "destructive" : "secondary"}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{e.message || "—"}</TableCell>
                  <TableCell className="font-mono text-[10px] truncate max-w-[120px]">{e.id}</TableCell>
                </TableRow>
              ))}
              {!errors.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No errors recorded</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}