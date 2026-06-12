import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, RefreshCw, Trash2, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SecurityLog {
  id: string;
  event_type: string;
  severity: "info" | "warning" | "critical";
  user_id: string | null;
  user_role: string | null;
  resource_table: string | null;
  policy_name: string | null;
  action: string | null;
  request_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const severityStyle: Record<string, { variant: "default" | "secondary" | "destructive"; icon: typeof Info }> = {
  info: { variant: "secondary", icon: Info },
  warning: { variant: "default", icon: AlertTriangle },
  critical: { variant: "destructive", icon: AlertOctagon },
};

export default function AdminSecurityLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("security_audit_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (severity !== "all") query = query.eq("severity", severity);
    if (eventType !== "all") query = query.eq("event_type", eventType);
    const { data, error } = await query;
    if (error) {
      toast.error("লগ লোড করতে ব্যর্থ / Failed to load logs");
    } else {
      setLogs((data as unknown as SecurityLog[]) || []);
    }
    setLoading(false);
  }, [severity, eventType]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("security_audit_logs_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_audit_logs" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const clearOld = async () => {
    if (!confirm("৩০ দিনের পুরনো সব লগ মুছে ফেলা হবে। চালিয়ে যাবেন?")) return;
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("security_audit_logs" as any)
      .delete()
      .lt("created_at", cutoff);
    if (error) toast.error("Failed to clear logs");
    else {
      toast.success("পুরনো লগ মুছে ফেলা হয়েছে");
      load();
    }
  };

  const eventTypes = Array.from(new Set(logs.map((l) => l.event_type)));
  const criticalCount = logs.filter((l) => l.severity === "critical").length;
  const warningCount = logs.filter((l) => l.severity === "warning").length;

  return (
    <AdminLayout>
      <div className="space-y-4 p-2 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" aria-hidden />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">নিরাপত্তা লগ / Security Logs</h1>
              <p className="text-sm text-muted-foreground">
                পলিসি ব্লক, লগইন ব্যর্থতা ও সংবেদনশীল অ্যাকশন
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </Button>
            <Button variant="destructive" size="sm" onClick={clearOld}>
              <Trash2 className="h-4 w-4 mr-1" /> ৩০+ দিন মুছুন
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">মোট ইভেন্ট</div>
            <div className="text-2xl font-bold">{logs.length}</div>
          </Card>
          <Card className="p-3 border-yellow-500/40">
            <div className="text-xs text-muted-foreground">সতর্কতা</div>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          </Card>
          <Card className="p-3 border-destructive/40">
            <div className="text-xs text-muted-foreground">গুরুতর</div>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Event Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>সময়</TableHead>
                <TableHead>সিভিয়ারিটি</TableHead>
                <TableHead>ইভেন্ট</TableHead>
                <TableHead className="hidden md:table-cell">টেবিল</TableHead>
                <TableHead className="hidden md:table-cell">পলিসি</TableHead>
                <TableHead className="hidden lg:table-cell">পাথ</TableHead>
                <TableHead className="hidden lg:table-cell">ইউজার</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    কোনো লগ পাওয়া যায়নি
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => {
                const style = severityStyle[log.severity] || severityStyle.info;
                const Icon = style.icon;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={style.variant} className="gap-1">
                        <Icon className="h-3 w-3" aria-hidden /> {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.event_type}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{log.resource_table || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{log.policy_name || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs max-w-[200px] truncate">{log.request_path || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      {log.user_role || "anon"}{log.user_id ? ` · ${log.user_id.slice(0, 8)}` : ""}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}