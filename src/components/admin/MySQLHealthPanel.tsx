import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2, RefreshCw, Database } from "lucide-react";
import { apiClient, ApiError } from "@/lib/apiClient";
import { useLanguage } from "@/contexts/LanguageContext";

interface Summary {
  status: string;
  server: {
    uptime_s: number;
    node: string;
    env: string;
    memory: { rss_mb: number; heap_used_mb: number; heap_total_mb: number };
  };
  database: {
    ping_ms: number;
    pool: { connectionLimit?: number; allConnections?: number; freeConnections?: number; queue?: number };
    row_counts: Record<string, number | null>;
  };
  timestamp: string;
}

export default function MySQLHealthPanel() {
  const { language } = useLanguage();
  const bn = language === "bn";
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Summary>("/api/health/summary");
      setData(res);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : (e as Error).message;
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            {bn ? "MySQL লাইভ হেলথ" : "MySQL Live Health"}
          </CardTitle>
          <CardDescription>
            {bn ? "ব্যাকএন্ড থেকে সরাসরি DB পিং ও রো-কাউন্ট" : "Direct DB ping and row counts from backend"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {bn ? "রিফ্রেশ" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {bn ? "সংযোগ ব্যর্থ: " : "Failed: "}
            {error}
          </div>
        )}
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label={bn ? "DB পিং" : "DB Ping"} value={`${data.database.ping_ms} ms`} good={data.database.ping_ms < 200} />
              <Stat label={bn ? "আপটাইম" : "Uptime"} value={`${Math.floor(data.server.uptime_s / 60)} m`} good />
              <Stat label="RAM (heap)" value={`${data.server.memory.heap_used_mb} MB`} good />
              <Stat
                label={bn ? "পুল ফ্রি" : "Pool Free"}
                value={`${data.database.pool.freeConnections ?? 0}/${data.database.pool.connectionLimit ?? 0}`}
                good
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                {bn ? "টেবিল রো কাউন্ট" : "Table Row Counts"}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                {Object.entries(data.database.row_counts).map(([t, c]) => (
                  <div key={t} className="flex justify-between rounded border bg-muted/30 px-2 py-1">
                    <span className="font-mono truncate">{t}</span>
                    <Badge variant={c === null ? "secondary" : "outline"} className="text-[10px]">
                      {c === null ? "—" : c}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {bn ? "শেষ আপডেট: " : "Last updated: "}
              {new Date(data.timestamp).toLocaleString()}
            </p>
          </>
        )}
        {!data && !error && !loading && (
          <p className="text-sm text-muted-foreground">
            {bn ? "কোনো ডাটা নেই।" : "No data yet."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-lg font-semibold ${good ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}