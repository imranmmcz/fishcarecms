import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ROUTABLE_MODULES,
  MYSQL_READY_MODULES,
  type RoutingMap,
  type RoutableModule,
  getRouting,
  loadRoutingFromServer,
  saveRouting,
} from "@/lib/dataSource";
import { pingBackend } from "@/lib/apiClient";
import MySQLBackendSettings from "@/components/admin/MySQLBackendSettings";
import MySQLHealthPanel from "@/components/admin/MySQLHealthPanel";
import StorageBackendSettings from "@/components/admin/StorageBackendSettings";
import { Database, Loader2, RefreshCw, Save, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, Activity } from "lucide-react";

const labelFor = (m: RoutableModule, bn: boolean) => {
  const map: Record<RoutableModule, [string, string]> = {
    products: ["পণ্য", "Products"],
    product_variations: ["পণ্যের ভেরিয়েশন", "Product Variations"],
    categories: ["ক্যাটাগরি", "Categories"],
    brands: ["ব্র্যান্ড", "Brands"],
    orders: ["অর্ডার", "Orders"],
    order_items: ["অর্ডার আইটেম", "Order Items"],
    customers: ["কাস্টমার", "Customers"],
    pos_sales: ["POS বিক্রয়", "POS Sales"],
    pos_sale_items: ["POS আইটেম", "POS Sale Items"],
    pos_shifts: ["POS শিফট", "POS Shifts"],
    pos_expenses: ["POS খরচ", "POS Expenses"],
    stock_adjustments: ["স্টক সমন্বয়", "Stock Adjustments"],
    purchase_orders: ["ক্রয় অর্ডার", "Purchase Orders"],
    purchase_order_items: ["ক্রয় আইটেম", "Purchase Order Items"],
    farmer_ponds: ["খামার পুকুর", "Farmer Ponds"],
    farmer_incomes: ["খামার আয়", "Farmer Incomes"],
    farmer_expenses: ["খামার ব্যয়", "Farmer Expenses"],
    farmer_samplings: ["স্যাম্পলিং", "Farmer Samplings"],
    farming_alerts: ["ফার্মিং অ্যালার্ট", "Farming Alerts"],
    market_prices: ["বাজার দর", "Market Prices"],
    product_reviews: ["পণ্য রিভিউ", "Product Reviews"],
    blog_posts: ["ব্লগ পোস্ট", "Blog Posts"],
    blog_comments: ["ব্লগ মন্তব্য", "Blog Comments"],
  };
  return map[m][bn ? 0 : 1];
};

export default function AdminDatabaseConfig() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const bn = language === "bn";

  const [routing, setRouting] = useState<RoutingMap>(getRouting());
  const [saving, setSaving] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);

  useEffect(() => {
    loadRoutingFromServer().then((m) => setRouting(m)).catch(() => {});
  }, []);

  const handlePing = async () => {
    setPinging(true);
    const ok = await pingBackend();
    setBackendUp(ok);
    setPinging(false);
    toast({
      title: ok ? (bn ? "সংযুক্ত" : "Connected") : (bn ? "সংযোগ ব্যর্থ" : "Connection failed"),
      description: ok
        ? bn
          ? "MySQL backend (Hostinger API) সাড়া দিচ্ছে।"
          : "MySQL backend (Hostinger API) is responding."
        : bn
        ? "API সার্ভারে পৌঁছানো যাচ্ছে না। URL/সার্ভার যাচাই করুন।"
        : "Cannot reach API server. Verify URL and that the server is running.",
      variant: ok ? "default" : "destructive",
    });
  };

  const toggleModule = (m: RoutableModule, useMysql: boolean) => {
    setRouting((prev) => ({ ...prev, [m]: useMysql ? "mysql" : "supabase" }));
  };

  const setAll = (target: "supabase" | "mysql") => {
    setRouting((prev) => {
      const next = { ...prev };
      for (const m of ROUTABLE_MODULES) {
        if (target === "mysql" && !MYSQL_READY_MODULES.has(m)) continue;
        next[m] = target;
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Refuse to enable MySQL routing if backend is unreachable.
      const wantsMysql = Object.values(routing).some((v) => v === "mysql");
      if (wantsMysql) {
        const ok = await pingBackend();
        setBackendUp(ok);
        if (!ok) {
          toast({
            title: bn ? "সংযোগ ব্যর্থ" : "Backend unreachable",
            description: bn
              ? "MySQL ব্যাকএন্ড সাড়া না দেওয়ায় রাউটিং সেভ করা হয়নি।"
              : "MySQL backend is not responding. Routing was not saved.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }
      await saveRouting(routing);
      toast({
        title: bn ? "সেভ হয়েছে" : "Saved",
        description: bn
          ? "ডাটা-সোর্স রাউটিং আপডেট করা হয়েছে।"
          : "Data-source routing updated.",
      });
    } catch (e: any) {
      toast({
        title: bn ? "ত্রুটি" : "Error",
        description: e?.message || "Failed to save routing",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const mysqlCount = Object.values(routing).filter((v) => v === "mysql").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            {bn ? "ডাটাবেজ কনফিগারেশন" : "Database Configuration"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {bn
              ? "Supabase ও Hostinger MySQL — প্রতি মডিউলের জন্য আলাদা ডাটা-সোর্স বেছে নিন।"
              : "Hybrid Supabase ⇄ Hostinger MySQL — choose the data source per module."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/data-migration"><ArrowRightLeft className="h-4 w-4 mr-2" />{bn ? "মাইগ্রেশন" : "Migration"}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/system-health"><Activity className="h-4 w-4 mr-2" />{bn ? "হেলথ" : "Health"}</Link>
          </Button>
          <Badge variant={backendUp ? "default" : backendUp === false ? "destructive" : "secondary"}>
            {backendUp === null
              ? bn ? "অজানা" : "Unknown"
              : backendUp
              ? bn ? "Backend Online" : "Backend Online"
              : bn ? "Backend Offline" : "Backend Offline"}
          </Badge>
          <Button variant="outline" size="sm" onClick={handlePing} disabled={pinging}>
            {pinging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {bn ? "টেস্ট" : "Test"}
          </Button>
        </div>
      </div>

      {/* Existing connection settings (API URL + MySQL creds reference) */}
      <MySQLBackendSettings />

      {/* Live DB health from backend */}
      <MySQLHealthPanel />

      {/* Storage backend + Supabase→Hostinger migration */}
      <StorageBackendSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5 text-primary" />
            {bn ? "মডিউল-ভিত্তিক রাউটিং" : "Per-Module Routing"}
          </CardTitle>
          <CardDescription>
            {bn
              ? `MySQL-এ চলছে: ${mysqlCount} / ${ROUTABLE_MODULES.length} মডিউল। অপ্রস্তুত মডিউল ধূসর।`
              : `Running on MySQL: ${mysqlCount} / ${ROUTABLE_MODULES.length} modules. Unready modules are disabled.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              {bn
                ? "Auth, Storage এবং Realtime সবসময় Supabase-এ থাকবে। শুধু ডাটা-CRUD মডিউল রাউট করা হয়। MySQL-এ যাওয়ার আগে ডাটা মাইগ্রেশন নিশ্চিত করুন।"
                : "Auth, Storage and Realtime always stay on Supabase. Only data CRUD modules are routed. Make sure data is migrated before switching a module to MySQL."}
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setAll("supabase")}>
              {bn ? "সব Supabase-এ" : "All → Supabase"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAll("mysql")}>
              {bn ? "প্রস্তুত মডিউল MySQL-এ" : "Ready modules → MySQL"}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ROUTABLE_MODULES.map((m) => {
              const ready = MYSQL_READY_MODULES.has(m);
              const isMysql = routing[m] === "mysql";
              return (
                <div
                  key={m}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{labelFor(m, bn)}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{m}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={isMysql ? "default" : "secondary"} className="text-[10px]">
                      {isMysql ? "MySQL" : "Supabase"}
                    </Badge>
                    <Switch
                      checked={isMysql}
                      disabled={!ready}
                      onCheckedChange={(v) => toggleModule(m, v)}
                      aria-label={`Route ${m} to MySQL`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {bn ? "রাউটিং সেভ করুন" : "Save Routing"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}