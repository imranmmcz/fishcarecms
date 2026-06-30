import { useState, useMemo } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText, TrendingUp, CreditCard, Banknote, Filter, Calendar,
  Download, ShoppingCart, Package, DollarSign, Users, Clock, HandCoins,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { posRepo } from "@/repositories/pos";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const getDateRange = (period: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "today": return { from: today.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    case "week": {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay());
      return { from: start.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    }
    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: start.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    }
    case "year": {
      const start = new Date(today.getFullYear(), 0, 1);
      return { from: start.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    }
    default: return { from: "", to: "" };
  }
};

const periods = [
  { value: "all", label: "সকল" },
  { value: "today", label: "আজ" },
  { value: "week", label: "এই সপ্তাহ" },
  { value: "month", label: "এই মাস" },
  { value: "year", label: "এই বছর" },
  { value: "custom", label: "কাস্টম" },
];

function DateFilter({ period, setPeriod, dateFrom, setDateFrom, dateTo, setDateTo }: any) {
  const handlePeriod = (p: string) => {
    setPeriod(p);
    if (p === "all") { setDateFrom(""); setDateTo(""); }
    else if (p !== "custom") {
      const r = getDateRange(p);
      setDateFrom(r.from);
      setDateTo(r.to);
    }
  };
  return (
    <Card>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> ফিল্টার</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 sm:px-6">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {periods.map(p => (
            <Button key={p.value} size="sm" variant={period === p.value ? "default" : "outline"}
              onClick={() => handlePeriod(p.value)} className="text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8">
              <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />{p.label}
            </Button>
          ))}
        </div>
        {(period === "custom" || dateFrom || dateTo) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">শুরুর তারিখ</Label>
              <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPeriod("custom"); }} />
            </div>
            <div className="space-y-1"><Label className="text-xs">শেষ তারিখ</Label>
              <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPeriod("custom"); }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ icon: Icon, title, value, color }: { icon: any; title: string; value: string; color: string }) {
  return (
    <Card>
      <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
        <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
          <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${color}`} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6"><p className="text-base sm:text-xl font-bold truncate">{value}</p></CardContent>
    </Card>
  );
}

function filterByDate(items: any[], dateFrom: string, dateTo: string, dateField = "created_at") {
  return items.filter(item => {
    if (dateFrom && new Date(item[dateField]) < new Date(dateFrom)) return false;
    if (dateTo && new Date(item[dateField]) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });
}

function downloadPDF(title: string, headers: string[], rows: string[][]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString("bn-BD")}`, 14, 28);
  autoTable(doc, { head: [headers], body: rows, startY: 34, styles: { fontSize: 8 } });
  doc.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ============ Sales Report Tab ============
function SalesReportTab() {
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const { data: sales = [] } = useQuery({
    queryKey: ["pos-report-sales"],
    queryFn: () => posRepo.sales.list({ limit: 1000 }),
  });

  const filtered = useMemo(() => {
    let list = filterByDate(sales, dateFrom, dateTo);
    if (paymentFilter !== "all") list = list.filter(s => s.payment_method === paymentFilter);
    return list;
  }, [sales, dateFrom, dateTo, paymentFilter]);

  const totalSales = filtered.reduce((s, r) => s + (r.total_amount || 0), 0);
  const cashSales = filtered.filter(s => s.payment_method === "cash").reduce((s, r) => s + (r.total_amount || 0), 0);
  const mobileSales = filtered.filter(s => s.payment_method === "mobile_banking").reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalDiscount = filtered.reduce((s, r) => s + (r.discount_amount || 0), 0);

  const handleDownload = () => {
    downloadPDF("বিক্রি রিপোর্ট",
      ["#", "বিক্রি নং", "তারিখ", "কাস্টমার", "পেমেন্ট", "মোট", "প্রদত্ত", "বাকি"],
      filtered.map((s, i) => [
        String(i + 1), s.sale_number, new Date(s.created_at).toLocaleDateString("bn-BD"),
        s.customer_name || "-", s.payment_method === "cash" ? "ক্যাশ" : s.payment_method === "mobile_banking" ? "মোবাইল" : "বাকি",
        `${s.total_amount}`, `${s.paid_amount}`, `${s.due_amount || 0}`
      ])
    );
  };

  return (
    <div className="space-y-4">
      <DateFilter period={period} setPeriod={setPeriod} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="পেমেন্ট" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল পেমেন্ট</SelectItem>
            <SelectItem value="cash">ক্যাশ</SelectItem>
            <SelectItem value="mobile_banking">মোবাইল ব্যাংকিং</SelectItem>
            <SelectItem value="due">বাকি</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleDownload} className="w-full sm:w-auto"><Download className="h-4 w-4 mr-1" /> PDF ডাউনলোড</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard icon={TrendingUp} title="মোট বিক্রি" value={`৳${totalSales.toLocaleString()}`} color="text-emerald-500" />
        <StatCard icon={Banknote} title="ক্যাশ বিক্রি" value={`৳${cashSales.toLocaleString()}`} color="text-green-500" />
        <StatCard icon={CreditCard} title="মোবাইল ব্যাংকিং" value={`৳${mobileSales.toLocaleString()}`} color="text-blue-500" />
        <StatCard icon={FileText} title="মোট ডিসকাউন্ট" value={`৳${totalDiscount.toLocaleString()}`} color="text-orange-500" />
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-2">
        {filtered.slice(0, 50).map((s, i) => (
          <Card key={s.id}>
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold">{s.sale_number}</span>
                <Badge variant={s.payment_method === "cash" ? "default" : s.payment_method === "due" ? "destructive" : "secondary"} className="text-[10px]">
                  {s.payment_method === "cash" ? "ক্যাশ" : s.payment_method === "mobile_banking" ? "মোবাইল" : "বাকি"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">{s.customer_name || "-"}</span>
                <span className="font-bold">৳{(s.total_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{new Date(s.created_at).toLocaleDateString("bn-BD")}</span>
                {s.due_amount > 0 && <span className="text-destructive font-medium">বাকি: ৳{s.due_amount.toLocaleString()}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">কোনো ডাটা নেই</p>}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">বিক্রি নং</TableHead>
                  <TableHead className="text-xs">তারিখ</TableHead>
                  <TableHead className="text-xs">কাস্টমার</TableHead>
                  <TableHead className="text-xs">পেমেন্ট</TableHead>
                  <TableHead className="text-xs text-right">মোট</TableHead>
                  <TableHead className="text-xs text-right">বাকি</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs">{i + 1}</TableCell>
                    <TableCell className="text-xs font-mono">{s.sale_number}</TableCell>
                    <TableCell className="text-xs">{new Date(s.created_at).toLocaleDateString("bn-BD")}</TableCell>
                    <TableCell className="text-xs">{s.customer_name || "-"}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={s.payment_method === "cash" ? "default" : s.payment_method === "due" ? "destructive" : "secondary"} className="text-[10px]">
                        {s.payment_method === "cash" ? "ক্যাশ" : s.payment_method === "mobile_banking" ? "মোবাইল" : "বাকি"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">৳{(s.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right text-destructive">{s.due_amount ? `৳${s.due_amount.toLocaleString()}` : "-"}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">কোনো ডাটা নেই</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-right">মোট: {filtered.length} টি ট্রানজেকশন</p>
    </div>
  );
}

// ============ Purchase Report Tab ============
function PurchaseReportTab() {
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: purchases = [] } = useQuery({
    queryKey: ["pos-report-purchases"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("*, companies(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = useMemo(() => filterByDate(purchases, dateFrom, dateTo), [purchases, dateFrom, dateTo]);
  const totalAmount = filtered.reduce((s, r) => s + (r.total_amount || 0), 0);
  const received = filtered.filter(p => p.status === "received").length;

  const handleDownload = () => {
    downloadPDF("ক্রয় রিপোর্ট",
      ["#", "অর্ডার নং", "তারিখ", "সাপ্লায়ার", "স্ট্যাটাস", "মোট"],
      filtered.map((p, i) => [
        String(i + 1), p.order_number, new Date(p.created_at).toLocaleDateString("bn-BD"),
        (p.companies as any)?.name || "-", p.status, `${p.total_amount}`
      ])
    );
  };

  return (
    <div className="space-y-4">
      <DateFilter period={period} setPeriod={setPeriod} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
      <Button size="sm" variant="outline" onClick={handleDownload} className="w-full sm:w-auto"><Download className="h-4 w-4 mr-1" /> PDF ডাউনলোড</Button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <StatCard icon={ShoppingCart} title="মোট ক্রয়" value={`৳${totalAmount.toLocaleString()}`} color="text-purple-500" />
        <StatCard icon={Package} title="মোট অর্ডার" value={`${filtered.length} টি`} color="text-blue-500" />
        <StatCard icon={Package} title="প্রাপ্ত অর্ডার" value={`${received} টি`} color="text-green-500" />
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-2">
        {filtered.slice(0, 50).map((p, i) => (
          <Card key={p.id}>
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold">{p.order_number}</span>
                <Badge variant={p.status === "received" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">{(p.companies as any)?.name || "-"}</span>
                <span className="font-bold">৳{(p.total_amount || 0).toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("bn-BD")}</p>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">কোনো ডাটা নেই</p>}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">অর্ডার নং</TableHead>
                  <TableHead className="text-xs">তারিখ</TableHead>
                  <TableHead className="text-xs">সাপ্লায়ার</TableHead>
                  <TableHead className="text-xs">স্ট্যাটাস</TableHead>
                  <TableHead className="text-xs text-right">মোট</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{i + 1}</TableCell>
                    <TableCell className="text-xs font-mono">{p.order_number}</TableCell>
                    <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString("bn-BD")}</TableCell>
                    <TableCell className="text-xs">{(p.companies as any)?.name || "-"}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={p.status === "received" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">৳{(p.total_amount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো ডাটা নেই</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Stock Report Tab ============
function StockReportTab() {
  const [stockFilter, setStockFilter] = useState("all");

  const { data: products = [] } = useQuery({
    queryKey: ["pos-report-stock"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, sku, category, stock_quantity, reorder_level, price").order("name");
      const { data: costs } = await supabase.rpc("get_products_cost_map");
      const costMap = new Map<string, number>((costs || []).map((c: { id: string; cost_price: number | null }) => [c.id, Number(c.cost_price) || 0]));
      return (data || []).map((p: any) => ({ ...p, cost_price: costMap.get(p.id) ?? 0 }));
    },
  });

  const filtered = useMemo(() => {
    if (stockFilter === "low") return products.filter(p => p.stock_quantity <= (p.reorder_level || 10));
    if (stockFilter === "out") return products.filter(p => p.stock_quantity <= 0);
    return products;
  }, [products, stockFilter]);

  const totalStockValue = products.reduce((s, p) => s + (p.stock_quantity * (p.cost_price || p.price || 0)), 0);
  const lowStock = products.filter(p => p.stock_quantity <= (p.reorder_level || 10) && p.stock_quantity > 0).length;
  const outOfStock = products.filter(p => p.stock_quantity <= 0).length;

  const handleDownload = () => {
    downloadPDF("স্টক রিপোর্ট",
      ["#", "পণ্যের নাম", "SKU", "ক্যাটাগরি", "স্টক", "রিঅর্ডার লেভেল", "মূল্য"],
      filtered.map((p, i) => [
        String(i + 1), p.name, p.sku || "-", p.category, String(p.stock_quantity),
        String(p.reorder_level || 10), `${p.price}`
      ])
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল পণ্য</SelectItem>
            <SelectItem value="low">লো স্টক</SelectItem>
            <SelectItem value="out">স্টক শেষ</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleDownload} className="w-full sm:w-auto"><Download className="h-4 w-4 mr-1" /> PDF ডাউনলোড</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard icon={Package} title="মোট পণ্য" value={`${products.length} টি`} color="text-blue-500" />
        <StatCard icon={DollarSign} title="স্টক মূল্য" value={`৳${totalStockValue.toLocaleString()}`} color="text-emerald-500" />
        <StatCard icon={Package} title="লো স্টক" value={`${lowStock} টি`} color="text-yellow-500" />
        <StatCard icon={Package} title="স্টক শেষ" value={`${outOfStock} টি`} color="text-red-500" />
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-2">
        {filtered.slice(0, 100).map((p, i) => (
          <Card key={p.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate flex-1 mr-2">{p.name}</span>
                <Badge variant={p.stock_quantity <= 0 ? "destructive" : p.stock_quantity <= (p.reorder_level || 10) ? "secondary" : "default"} className="text-[10px] shrink-0">
                  {p.stock_quantity}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>{p.sku || "-"}</span>
                <span className="font-medium">৳{(p.price || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">কোনো ডাটা নেই</p>}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">পণ্যের নাম</TableHead>
                  <TableHead className="text-xs">SKU</TableHead>
                  <TableHead className="text-xs text-right">স্টক</TableHead>
                  <TableHead className="text-xs text-right">মূল্য</TableHead>
                  <TableHead className="text-xs text-right">স্টক মূল্য</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{i + 1}</TableCell>
                    <TableCell className="text-xs font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono">{p.sku || "-"}</TableCell>
                    <TableCell className="text-xs text-right">
                      <Badge variant={p.stock_quantity <= 0 ? "destructive" : p.stock_quantity <= (p.reorder_level || 10) ? "secondary" : "default"} className="text-[10px]">
                        {p.stock_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right">৳{(p.price || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right font-medium">৳{(p.stock_quantity * (p.cost_price || p.price || 0)).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো ডাটা নেই</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Profit/Loss Report Tab ============
function ProfitLossReportTab() {
  const [period, setPeriod] = useState("month");
  const [dateFrom, setDateFrom] = useState(() => getDateRange("month").from);
  const [dateTo, setDateTo] = useState(() => getDateRange("month").to);

  const { data: sales = [] } = useQuery({
    queryKey: ["pos-report-profitloss-sales"],
    queryFn: async () => {
      const { data } = await supabase.from("pos_sales").select("*, pos_sale_items(product_id, quantity, unit_price, total_price)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["pos-report-profitloss-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, price");
      const { data: costs } = await supabase.rpc("get_products_cost_map");
      const costMap = new Map<string, number>((costs || []).map((c: { id: string; cost_price: number | null }) => [c.id, Number(c.cost_price) || 0]));
      return (data || []).map((p: any) => ({ ...p, cost_price: costMap.get(p.id) ?? 0 }));
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["pos-report-profitloss-purchases"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("total_amount, created_at").eq("status", "received");
      return data || [];
    },
  });

  const productMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.id] = p.cost_price || 0; });
    return map;
  }, [products]);

  const filteredSales = useMemo(() => filterByDate(sales, dateFrom, dateTo), [sales, dateFrom, dateTo]);
  const filteredPurchases = useMemo(() => filterByDate(purchases, dateFrom, dateTo), [purchases, dateFrom, dateTo]);

  const totalRevenue = filteredSales.reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalCost = filteredSales.reduce((s, sale) => {
    const items = (sale as any).pos_sale_items || [];
    return s + items.reduce((c: number, item: any) => c + ((productMap[item.product_id] || 0) * item.quantity), 0);
  }, 0);
  const totalPurchase = filteredPurchases.reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalDiscount = filteredSales.reduce((s, r) => s + (r.discount_amount || 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalDiscount;

  const handleDownload = () => {
    downloadPDF("লাভ-ক্ষতি রিপোর্ট",
      ["বিবরণ", "পরিমাণ"],
      [
        ["মোট বিক্রি", `${totalRevenue}`],
        ["পণ্য খরচ (COGS)", `${totalCost}`],
        ["মোট ক্রয়", `${totalPurchase}`],
        ["মোট ডিসকাউন্ট", `${totalDiscount}`],
        ["গ্রস লাভ", `${grossProfit}`],
        ["নেট লাভ", `${netProfit}`],
      ]
    );
  };

  return (
    <div className="space-y-4">
      <DateFilter period={period} setPeriod={setPeriod} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
      <Button size="sm" variant="outline" onClick={handleDownload} className="w-full sm:w-auto"><Download className="h-4 w-4 mr-1" /> PDF ডাউনলোড</Button>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <StatCard icon={TrendingUp} title="মোট বিক্রি" value={`৳${totalRevenue.toLocaleString()}`} color="text-emerald-500" />
        <StatCard icon={ShoppingCart} title="পণ্য খরচ (COGS)" value={`৳${totalCost.toLocaleString()}`} color="text-red-500" />
        <StatCard icon={DollarSign} title="গ্রস লাভ" value={`৳${grossProfit.toLocaleString()}`} color={grossProfit >= 0 ? "text-green-500" : "text-red-500"} />
        <StatCard icon={ShoppingCart} title="মোট ক্রয়" value={`৳${totalPurchase.toLocaleString()}`} color="text-purple-500" />
        <StatCard icon={FileText} title="মোট ডিসকাউন্ট" value={`৳${totalDiscount.toLocaleString()}`} color="text-orange-500" />
        <StatCard icon={DollarSign} title="নেট লাভ" value={`৳${netProfit.toLocaleString()}`} color={netProfit >= 0 ? "text-emerald-500" : "text-red-500"} />
      </div>
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          {[
            { label: "মোট বিক্রি রাজস্ব", value: totalRevenue, color: "text-emerald-600" },
            { label: "(-) পণ্য খরচ", value: totalCost, color: "text-red-600" },
            { label: "= গ্রস লাভ", value: grossProfit, color: grossProfit >= 0 ? "text-green-600" : "text-red-600" },
            { label: "(-) ডিসকাউন্ট", value: totalDiscount, color: "text-orange-600" },
            { label: "= নেট লাভ", value: netProfit, color: netProfit >= 0 ? "text-emerald-700" : "text-red-700" },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center border-b last:border-b-0 pb-2">
              <span className="text-xs sm:text-sm font-medium">{row.label}</span>
              <span className={`text-xs sm:text-sm font-bold ${row.color}`}>৳{row.value.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Due Report Tab ============
function DueReportTab() {
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: dueSales = [] } = useQuery({
    queryKey: ["pos-report-due"],
    queryFn: async () => {
      const { data } = await supabase.from("pos_sales").select("*").eq("payment_type", "due").gt("due_amount", 0).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = useMemo(() => filterByDate(dueSales, dateFrom, dateTo), [dueSales, dateFrom, dateTo]);

  const customerMap = useMemo(() => {
    const map: Record<string, { name: string; phone: string; total_due: number; total_paid: number; count: number }> = {};
    filtered.forEach(s => {
      const key = s.customer_phone || s.customer_name || "unknown";
      if (!map[key]) map[key] = { name: s.customer_name || "অজানা", phone: s.customer_phone || "-", total_due: 0, total_paid: 0, count: 0 };
      map[key].total_due += (s.due_amount || 0);
      map[key].total_paid += (s.paid_amount || 0);
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total_due - a.total_due);
  }, [filtered]);

  const totalDue = filtered.reduce((s, r) => s + (r.due_amount || 0), 0);

  const handleDownload = () => {
    downloadPDF("বাকি রিপোর্ট",
      ["#", "কাস্টমার", "ফোন", "মোট বাকি", "প্রদত্ত", "বিক্রয় সংখ্যা"],
      customerMap.map((c, i) => [
        String(i + 1), c.name, c.phone, `${c.total_due}`, `${c.total_paid}`, String(c.count)
      ])
    );
  };

  return (
    <div className="space-y-4">
      <DateFilter period={period} setPeriod={setPeriod} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
      <Button size="sm" variant="outline" onClick={handleDownload} className="w-full sm:w-auto"><Download className="h-4 w-4 mr-1" /> PDF ডাউনলোড</Button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <StatCard icon={HandCoins} title="মোট বাকি" value={`৳${totalDue.toLocaleString()}`} color="text-red-500" />
        <StatCard icon={Users} title="বাকিদার সংখ্যা" value={`${customerMap.length} জন`} color="text-orange-500" />
        <StatCard icon={FileText} title="বাকি বিক্রয়" value={`${filtered.length} টি`} color="text-yellow-500" />
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-2">
        {customerMap.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-destructive">৳{c.total_due.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{c.count} বিক্রয়</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {customerMap.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">কোনো বাকি নেই</p>}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">কাস্টমার</TableHead>
                  <TableHead className="text-xs">ফোন</TableHead>
                  <TableHead className="text-xs text-right">মোট বাকি</TableHead>
                  <TableHead className="text-xs text-right">প্রদত্ত</TableHead>
                  <TableHead className="text-xs text-center">বিক্রয়</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerMap.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{i + 1}</TableCell>
                    <TableCell className="text-xs font-medium">{c.name}</TableCell>
                    <TableCell className="text-xs">{c.phone}</TableCell>
                    <TableCell className="text-xs text-right text-destructive font-bold">৳{c.total_due.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">৳{c.total_paid.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-center">{c.count}</TableCell>
                  </TableRow>
                ))}
                {customerMap.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো বাকি নেই</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Shift Report Tab ============
function ShiftReportTab() {
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: shifts = [] } = useQuery({
    queryKey: ["pos-report-shifts"],
    queryFn: async () => {
      const { data } = await supabase.from("pos_shifts").select("*").order("opened_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = useMemo(() => filterByDate(shifts, dateFrom, dateTo, "opened_at"), [shifts, dateFrom, dateTo]);
  const totalShiftSales = filtered.reduce((s, r) => s + (r.total_sales || 0), 0);
  const totalCash = filtered.reduce((s, r) => s + (r.cash_sales || 0), 0);
  const totalMobile = filtered.reduce((s, r) => s + (r.mobile_banking_sales || 0), 0);

  const handleDownload = () => {
    downloadPDF("শিফট রিপোর্ট",
      ["#", "শিফট নং", "ওপেন তারিখ", "ক্লোজ তারিখ", "মোট বিক্রি", "ক্যাশ", "মোবাইল", "ট্রানজেকশন"],
      filtered.map((s, i) => [
        String(i + 1), s.shift_number,
        new Date(s.opened_at).toLocaleString("bn-BD"),
        s.closed_at ? new Date(s.closed_at).toLocaleString("bn-BD") : "চলমান",
        `${s.total_sales}`, `${s.cash_sales}`, `${s.mobile_banking_sales}`, String(s.total_transactions)
      ])
    );
  };

  return (
    <div className="space-y-4">
      <DateFilter period={period} setPeriod={setPeriod} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
      <Button size="sm" variant="outline" onClick={handleDownload} className="w-full sm:w-auto"><Download className="h-4 w-4 mr-1" /> PDF ডাউনলোড</Button>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard icon={Clock} title="মোট শিফট" value={`${filtered.length} টি`} color="text-blue-500" />
        <StatCard icon={TrendingUp} title="মোট বিক্রি" value={`৳${totalShiftSales.toLocaleString()}`} color="text-emerald-500" />
        <StatCard icon={Banknote} title="ক্যাশ বিক্রি" value={`৳${totalCash.toLocaleString()}`} color="text-green-500" />
        <StatCard icon={CreditCard} title="মোবাইল বিক্রি" value={`৳${totalMobile.toLocaleString()}`} color="text-blue-500" />
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-2">
        {filtered.slice(0, 50).map((s, i) => (
          <Card key={s.id}>
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold">{s.shift_number}</span>
                {!s.closed_at ? <Badge className="text-[10px]">চলমান</Badge> : <span className="text-[10px] text-muted-foreground">{new Date(s.closed_at).toLocaleDateString("bn-BD")}</span>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-xs text-muted-foreground">{new Date(s.opened_at).toLocaleDateString("bn-BD")}</span>
                <span className="font-bold">৳{(s.total_sales || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>ক্যাশ: ৳{(s.cash_sales || 0).toLocaleString()}</span>
                <span>{s.total_transactions} ট্রানজেকশন</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">কোনো ডাটা নেই</p>}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">শিফট নং</TableHead>
                  <TableHead className="text-xs">ওপেন</TableHead>
                  <TableHead className="text-xs">ক্লোজ</TableHead>
                  <TableHead className="text-xs text-right">বিক্রি</TableHead>
                  <TableHead className="text-xs text-right">ক্যাশ</TableHead>
                  <TableHead className="text-xs text-center">ট্রানজেকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs">{i + 1}</TableCell>
                    <TableCell className="text-xs font-mono">{s.shift_number}</TableCell>
                    <TableCell className="text-xs">{new Date(s.opened_at).toLocaleDateString("bn-BD")}</TableCell>
                    <TableCell className="text-xs">{s.closed_at ? new Date(s.closed_at).toLocaleDateString("bn-BD") : <Badge className="text-[10px]">চলমান</Badge>}</TableCell>
                    <TableCell className="text-xs text-right font-medium">৳{(s.total_sales || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">৳{(s.cash_sales || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-center">{s.total_transactions}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">কোনো ডাটা নেই</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Main Reports Page ============
export default function POSReports() {
  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" /> POS রিপোর্ট
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">সকল রিপোর্ট এক জায়গায় — ফিল্টার করুন ও PDF ডাউনলোড করুন</p>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="sales" className="text-[10px] sm:text-xs px-2 sm:px-3"><ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /> বিক্রি</TabsTrigger>
            <TabsTrigger value="purchase" className="text-[10px] sm:text-xs px-2 sm:px-3"><Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /> ক্রয়</TabsTrigger>
            <TabsTrigger value="stock" className="text-[10px] sm:text-xs px-2 sm:px-3"><Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /> স্টক</TabsTrigger>
            <TabsTrigger value="profitloss" className="text-[10px] sm:text-xs px-2 sm:px-3"><DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /> লাভ-ক্ষতি</TabsTrigger>
            <TabsTrigger value="due" className="text-[10px] sm:text-xs px-2 sm:px-3"><HandCoins className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /> বাকি</TabsTrigger>
            <TabsTrigger value="shift" className="text-[10px] sm:text-xs px-2 sm:px-3"><Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /> শিফট</TabsTrigger>
          </TabsList>
          <TabsContent value="sales"><SalesReportTab /></TabsContent>
          <TabsContent value="purchase"><PurchaseReportTab /></TabsContent>
          <TabsContent value="stock"><StockReportTab /></TabsContent>
          <TabsContent value="profitloss"><ProfitLossReportTab /></TabsContent>
          <TabsContent value="due"><DueReportTab /></TabsContent>
          <TabsContent value="shift"><ShiftReportTab /></TabsContent>
        </Tabs>
      </div>
    </POSLayout>
  );
}
