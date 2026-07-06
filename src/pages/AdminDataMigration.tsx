import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { apiClient, pingBackend } from "@/lib/apiClient";
import { ArrowRightLeft, Database, Loader2, PlayCircle, RefreshCw } from "lucide-react";

/**
 * Copies rows from Supabase → MySQL for each routable module.
 * Pull in Supabase pages of 500, POST to backend /api/migration/import/:module.
 * Idempotent (backend uses INSERT ... ON DUPLICATE KEY UPDATE).
 */

type ModuleKey =
  | "categories" | "brands" | "products" | "product_variations"
  | "customers" | "orders" | "order_items"
  | "pos_shifts" | "pos_sales" | "pos_sale_items" | "pos_expenses"
  | "stock_adjustments" | "purchase_orders" | "purchase_order_items"
  | "farmer_ponds" | "farmer_incomes" | "farmer_expenses" | "farmer_samplings" | "farming_alerts";

const MODULES: { key: ModuleKey; label: string; bn: string; supabaseTable: string }[] = [
  { key: "categories", label: "Categories", bn: "ক্যাটাগরি", supabaseTable: "categories" },
  { key: "brands", label: "Brands", bn: "ব্র্যান্ড", supabaseTable: "brands" },
  { key: "products", label: "Products", bn: "পণ্য", supabaseTable: "products" },
  { key: "product_variations", label: "Product Variations", bn: "ভেরিয়েশন", supabaseTable: "product_variations" },
  { key: "customers", label: "Customers", bn: "কাস্টমার", supabaseTable: "customers" },
  { key: "orders", label: "Orders", bn: "অর্ডার", supabaseTable: "orders" },
  { key: "order_items", label: "Order Items", bn: "অর্ডার আইটেম", supabaseTable: "order_items" },
  { key: "pos_shifts", label: "POS Shifts", bn: "POS শিফট", supabaseTable: "pos_shifts" },
  { key: "pos_sales", label: "POS Sales", bn: "POS বিক্রয়", supabaseTable: "pos_sales" },
  { key: "pos_sale_items", label: "POS Sale Items", bn: "POS আইটেম", supabaseTable: "pos_sale_items" },
  { key: "pos_expenses", label: "POS Expenses", bn: "POS খরচ", supabaseTable: "pos_expenses" },
  { key: "stock_adjustments", label: "Stock Adjustments", bn: "স্টক সমন্বয়", supabaseTable: "stock_adjustments" },
  { key: "purchase_orders", label: "Purchase Orders", bn: "ক্রয় অর্ডার", supabaseTable: "purchase_orders" },
  { key: "purchase_order_items", label: "Purchase Order Items", bn: "ক্রয় আইটেম", supabaseTable: "purchase_order_items" },
  { key: "farmer_ponds", label: "Farmer Ponds", bn: "খামার পুকুর", supabaseTable: "farmer_ponds" },
  { key: "farmer_incomes", label: "Farmer Incomes", bn: "খামার আয়", supabaseTable: "farmer_incomes" },
  { key: "farmer_expenses", label: "Farmer Expenses", bn: "খামার ব্যয়", supabaseTable: "farmer_expenses" },
  { key: "farmer_samplings", label: "Farmer Samplings", bn: "স্যাম্পলিং", supabaseTable: "farmer_samplings" },
  { key: "farming_alerts", label: "Farming Alerts", bn: "ফার্মিং অ্যালার্ট", supabaseTable: "farming_alerts" },
];

interface ModuleState {
  supabaseCount: number | null;
  mysqlCount: number | null;
  progress: number;
  running: boolean;
  lastResult: string | null;
  error: string | null;
}

const PAGE_SIZE = 500;

export default function AdminDataMigration() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const bn = language === "bn";
  const [online, setOnline] = useState<boolean | null>(null);
  const [state, setState] = useState<Record<ModuleKey, ModuleState>>(
    () => Object.fromEntries(MODULES.map((m) => [m.key, {
      supabaseCount: null, mysqlCount: null, progress: 0, running: false, lastResult: null, error: null,
    }])) as Record<ModuleKey, ModuleState>
  );

  const setModule = (k: ModuleKey, patch: Partial<ModuleState>) => {
    setState((s) => ({ ...s, [k]: { ...s[k], ...patch } }));
  };

  const refreshCounts = async () => {
    const up = await pingBackend();
    setOnline(up);
    for (const m of MODULES) {
      // Supabase count
      try {
        const { count } = await (supabase as any).from(m.supabaseTable).select("*", { count: "exact", head: true });
        setModule(m.key, { supabaseCount: count ?? 0 });
      } catch {
        setModule(m.key, { supabaseCount: null });
      }
      // MySQL count
      if (up) {
        try {
          const r = await apiClient.get<{ count: number }>(`/api/migration/count/${m.key}`);
          setModule(m.key, { mysqlCount: r.count });
        } catch {
          setModule(m.key, { mysqlCount: null });
        }
      }
    }
  };

  useEffect(() => { void refreshCounts(); }, []);

  const migrateOne = async (m: typeof MODULES[number]) => {
    setModule(m.key, { running: true, progress: 0, error: null, lastResult: null });
    try {
      // Fetch total first
      const { count, error: cErr } = await (supabase as any)
        .from(m.supabaseTable)
        .select("*", { count: "exact", head: true });
      if (cErr) throw cErr;
      const total = count || 0;
      if (total === 0) {
        setModule(m.key, { running: false, progress: 100, lastResult: bn ? "কোনো ডাটা নেই" : "No data" });
        return;
      }
      let done = 0;
      let inserted = 0;
      for (let offset = 0; offset < total; offset += PAGE_SIZE) {
        const { data, error } = await (supabase as any)
          .from(m.supabaseTable)
          .select("*")
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        const rows = data || [];
        if (rows.length === 0) break;
        const r = await apiClient.post<{ inserted: number }>(`/api/migration/import/${m.key}`, { rows });
        inserted += r.inserted || 0;
        done += rows.length;
        setModule(m.key, { progress: Math.round((done / total) * 100) });
      }
      setModule(m.key, {
        running: false, progress: 100,
        lastResult: bn ? `${done} সারি পাঠানো, ${inserted} আপসার্ট` : `Sent ${done}, upserted ${inserted}`,
      });
      // Refresh MySQL count
      try {
        const r = await apiClient.get<{ count: number }>(`/api/migration/count/${m.key}`);
        setModule(m.key, { mysqlCount: r.count });
      } catch { /* ignore */ }
      toast({ title: bn ? "মাইগ্রেশন সম্পন্ন" : "Migration complete", description: `${m.label}: ${done} rows` });
    } catch (e: any) {
      setModule(m.key, { running: false, error: e?.message || "Failed" });
      toast({ title: bn ? "ব্যর্থ" : "Failed", description: `${m.label}: ${e?.message || "error"}`, variant: "destructive" });
    }
  };

  const migrateAll = async () => {
    for (const m of MODULES) {
      // eslint-disable-next-line no-await-in-loop
      await migrateOne(m);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6" /> {bn ? "ডাটা মাইগ্রেশন" : "Data Migration"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {bn ? "Supabase থেকে MySQL-এ ডাটা কপি করুন (idempotent — বারবার চালানো নিরাপদ)।" : "Copy data from Supabase to MySQL (idempotent — safe to re-run)."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={online ? "default" : online === false ? "destructive" : "secondary"}>
            {online === null ? "…" : online ? (bn ? "ব্যাকএন্ড অনলাইন" : "Backend online") : (bn ? "ব্যাকএন্ড অফলাইন" : "Backend offline")}
          </Badge>
          <Button size="sm" variant="outline" onClick={refreshCounts}>
            <RefreshCw className="h-4 w-4 mr-2" /> {bn ? "কাউন্ট রিফ্রেশ" : "Refresh counts"}
          </Button>
          <Button size="sm" onClick={migrateAll} disabled={!online}>
            <PlayCircle className="h-4 w-4 mr-2" /> {bn ? "সব মাইগ্রেট" : "Migrate all"}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          {bn
            ? "মাইগ্রেশনের পর Admin → Database Config-এ মডিউল MySQL-এ টগল করুন। টগল ফ্লিপ করার আগে count মিলিয়ে নিন।"
            : "After migrating, flip the module to MySQL in Admin → Database Config. Verify counts match before flipping."}
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-2">
        {MODULES.map((m) => {
          const s = state[m.key];
          const match = s.supabaseCount !== null && s.mysqlCount !== null && s.supabaseCount === s.mysqlCount;
          return (
            <Card key={m.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2"><Database className="h-4 w-4" /> {bn ? m.bn : m.label}</span>
                  {match && <Badge>= match</Badge>}
                </CardTitle>
                <CardDescription className="text-xs font-mono">{m.key}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div>Supabase: <span className="font-mono font-medium">{s.supabaseCount ?? "—"}</span></div>
                  <div>MySQL: <span className="font-mono font-medium">{s.mysqlCount ?? "—"}</span></div>
                </div>
                {(s.running || s.progress > 0) && <Progress value={s.progress} className="h-2" />}
                {s.lastResult && <p className="text-xs text-muted-foreground">{s.lastResult}</p>}
                {s.error && <p className="text-xs text-destructive">{s.error}</p>}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={!online || s.running}
                  onClick={() => migrateOne(m)}
                >
                  {s.running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                  {bn ? "মাইগ্রেট" : "Migrate"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}