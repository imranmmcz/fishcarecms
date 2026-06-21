import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield, RefreshCw, AlertOctagon, AlertTriangle, Info,
  Database, FileText, ListChecks, Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

type Severity = "info" | "warning" | "critical";

interface Finding {
  id: string;
  event_type: string;
  severity: Severity;
  resource_table: string | null;
  policy_name: string | null;
  action: string | null;
  request_path: string | null;
  user_role: string | null;
  created_at: string;
}

const SEVERITY_COLOR: Record<Severity, string> = {
  info: "hsl(var(--muted-foreground))",
  warning: "hsl(38 92% 50%)",
  critical: "hsl(var(--destructive))",
};

const SEVERITY_RANK: Record<Severity, number> = { critical: 3, warning: 2, info: 1 };

function deriveScanSource(eventType: string): string {
  const t = eventType.toLowerCase();
  if (t.startsWith("rls_") || t.includes("policy")) return "RLS / Policy";
  if (t.startsWith("auth_") || t.includes("login") || t.includes("signup")) return "Auth";
  if (t.startsWith("admin_") || t.includes("admin_route")) return "Admin Access";
  if (t.includes("rate") || t.includes("lockout")) return "Rate Limit";
  if (t.includes("api") || t.includes("edge")) return "API / Edge";
  if (t.includes("storage") || t.includes("upload")) return "Storage";
  if (t.includes("scan") || t.includes("linter") || t.includes("wiz")) return "External Scanner";
  return "Runtime Audit";
}

function SeverityBadge({ s }: { s: Severity }) {
  const Icon = s === "critical" ? AlertOctagon : s === "warning" ? AlertTriangle : Info;
  const variant = s === "critical" ? "destructive" : s === "warning" ? "default" : "secondary";
  return (
    <Badge variant={variant as "default" | "destructive" | "secondary"} className="gap-1 capitalize">
      <Icon className="h-3 w-3" aria-hidden /> {s}
    </Badge>
  );
}

export default function AdminSecurityDashboard() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_audit_logs" as never)
      .select("id,event_type,severity,resource_table,policy_name,action,request_path,user_role,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error("Failed to load security findings");
    else setFindings((data as unknown as Finding[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("sec_dash_audit")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "security_audit_logs" },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return findings;
    return findings.filter((f) =>
      [f.event_type, f.resource_table, f.policy_name, f.request_path, f.user_role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [findings, search]);

  const stats = useMemo(() => {
    const acc = { total: filtered.length, critical: 0, warning: 0, info: 0 };
    for (const f of filtered) acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, [filtered]);

  const bySeverity = useMemo(() => {
    return (["critical", "warning", "info"] as Severity[]).map((s) => ({
      name: s,
      value: filtered.filter((f) => f.severity === s).length,
      fill: SEVERITY_COLOR[s],
    }));
  }, [filtered]);

  type Group = {
    key: string;
    total: number;
    critical: number;
    warning: number;
    info: number;
    last: string;
    items: Finding[];
  };

  function groupBy(getKey: (f: Finding) => string | null): Group[] {
    const map = new Map<string, Group>();
    for (const f of filtered) {
      const k = getKey(f) || "—";
      const g = map.get(k) ?? { key: k, total: 0, critical: 0, warning: 0, info: 0, last: f.created_at, items: [] };
      g.total += 1;
      g[f.severity] += 1;
      if (new Date(f.created_at) > new Date(g.last)) g.last = f.created_at;
      g.items.push(f);
      map.set(k, g);
    }
    return [...map.values()].sort((a, b) => {
      if (b.critical !== a.critical) return b.critical - a.critical;
      if (b.warning !== a.warning) return b.warning - a.warning;
      return b.total - a.total;
    });
  }

  const byScan = useMemo(() => groupBy((f) => deriveScanSource(f.event_type)), [filtered]);
  const byTable = useMemo(() => groupBy((f) => f.resource_table), [filtered]);
  const byPolicy = useMemo(() => groupBy((f) => f.policy_name), [filtered]);

  const scanChart = byScan.map((g) => ({
    name: g.key, critical: g.critical, warning: g.warning, info: g.info,
  }));

  return (
    <AdminLayout>
      <div className="space-y-4 p-2 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" aria-hidden />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Security Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Findings grouped by severity, source scan, and affected table or policy
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/security-logs">Raw logs</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground">Total findings</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4 border-destructive/40">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertOctagon className="h-3 w-3" /> Critical
            </div>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
          </Card>
          <Card className="p-4 border-yellow-500/40">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Warning
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Info
            </div>
            <div className="text-2xl font-bold">{stats.info}</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Severity distribution</h2>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bySeverity} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {bySeverity.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold mb-3">Findings by source scan</h2>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scanChart}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="critical" stackId="s" fill={SEVERITY_COLOR.critical} />
                  <Bar dataKey="warning" stackId="s" fill={SEVERITY_COLOR.warning} />
                  <Bar dataKey="info" stackId="s" fill={SEVERITY_COLOR.info} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event, table, policy, path…"
            className="pl-8"
          />
        </div>

        <Tabs defaultValue="scan">
          <TabsList>
            <TabsTrigger value="scan"><ListChecks className="h-3 w-3 mr-1" /> By scan source</TabsTrigger>
            <TabsTrigger value="table"><Database className="h-3 w-3 mr-1" /> By table</TabsTrigger>
            <TabsTrigger value="policy"><FileText className="h-3 w-3 mr-1" /> By policy</TabsTrigger>
          </TabsList>

          {[
            { v: "scan", groups: byScan, label: "Scan source" },
            { v: "table", groups: byTable, label: "Affected table" },
            { v: "policy", groups: byPolicy, label: "Policy" },
          ].map(({ v, groups, label }) => (
            <TabsContent key={v} value={v}>
              <Card className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{label}</TableHead>
                      <TableHead className="text-right">Critical</TableHead>
                      <TableHead className="text-right">Warning</TableHead>
                      <TableHead className="text-right">Info</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="hidden md:table-cell">Top event</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {loading ? "Loading…" : "No findings"}
                      </TableCell></TableRow>
                    )}
                    {groups.map((g) => {
                      const top = [...g.items].sort(
                        (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity],
                      )[0];
                      return (
                        <TableRow key={g.key}>
                          <TableCell className="font-medium">{g.key}</TableCell>
                          <TableCell className="text-right">
                            {g.critical > 0 ? <SeverityBadge s="critical" /> : <span className="text-muted-foreground">0</span>}
                          </TableCell>
                          <TableCell className="text-right">{g.warning}</TableCell>
                          <TableCell className="text-right">{g.info}</TableCell>
                          <TableCell className="text-right font-semibold">{g.total}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {top?.event_type}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="overflow-x-auto">
          <div className="p-3 border-b text-sm font-semibold">Latest findings</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="hidden md:table-cell">Table</TableHead>
                <TableHead className="hidden md:table-cell">Policy</TableHead>
                <TableHead className="hidden lg:table-cell">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 30).map((f) => (
                <TableRow key={f.id}>
                  <TableCell><SeverityBadge s={f.severity} /></TableCell>
                  <TableCell className="text-sm">{f.event_type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{deriveScanSource(f.event_type)}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{f.resource_table || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{f.policy_name || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs whitespace-nowrap">
                    {new Date(f.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}