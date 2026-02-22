import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart, CreditCard, Package, AlertCircle, RefreshCw,
  TrendingUp, TrendingDown, Calendar, BarChart2, DollarSign
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type DateRange = "today" | "week" | "month" | "custom";

interface DateFilter {
  range: DateRange;
  from: Date;
  to: Date;
}

interface EcommerceStats {
  totalSales: number;
  invoiceDue: number;
  totalPurchase: number;
  purchaseDue: number;
  totalPurchaseReturn: number;
  totalCostPrice: number;
  totalSellingPrice: number;
  grossProfit: number;
  profitMargin: number;
}

interface ChartPoint {
  label: string;
  sales: number;
  purchase: number;
  due: number;
}

const getDateRange = (range: DateRange, customFrom?: Date, customTo?: Date): { from: Date; to: Date } => {
  const now = new Date();
  switch (range) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 6 }), to: endOfWeek(now, { weekStartsOn: 6 }) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "custom":
      return { from: customFrom || startOfDay(now), to: customTo || endOfDay(now) };
  }
};

const AdminEcommerceOverview = () => {
  const [activeRange, setActiveRange] = useState<DateRange>("month");
  const [customFrom, setCustomFrom] = useState<Date>(subDays(new Date(), 7));
  const [customTo, setCustomTo] = useState<Date>(new Date());
  const [customFromOpen, setCustomFromOpen] = useState(false);
  const [customToOpen, setCustomToOpen] = useState(false);
  const [stats, setStats] = useState<EcommerceStats>({
    totalSales: 0,
    invoiceDue: 0,
    totalPurchase: 0,
    purchaseDue: 0,
    totalPurchaseReturn: 0,
    totalCostPrice: 0,
    totalSellingPrice: 0,
    grossProfit: 0,
    profitMargin: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const { from, to } = getDateRange(activeRange, customFrom, customTo);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const fromISO = from.toISOString();
      const toISO = to.toISOString();

      // Fetch orders within date range
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, payment_status, status, created_at")
        .gte("created_at", fromISO)
        .lte("created_at", toISO);

      // Fetch purchase orders within date range
      const { data: purchaseOrders } = await supabase
        .from("purchase_orders")
        .select("total_amount, status, created_at")
        .gte("created_at", fromISO)
        .lte("created_at", toISO);

      // Fetch order items with product cost_price for profit calculation
      const orderIds = (orders || []).map(o => o.id);
      let allOrderItems: any[] = [];
      if (orderIds.length > 0) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("order_id, quantity, unit_price, total_price, product_id")
          .in("order_id", orderIds);
        allOrderItems = orderItems || [];
      }

      // Fetch products for cost_price
      const productIds = [...new Set(allOrderItems.map(i => i.product_id))];
      let productCostMap: Record<string, number> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, cost_price")
          .in("id", productIds);
        (products || []).forEach(p => {
          productCostMap[p.id] = Number(p.cost_price || 0);
        });
      }

      const allOrders = orders || [];
      const allPurchases = purchaseOrders || [];

      // Total Sales
      const totalSales = allOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

      // Invoice Due
      const invoiceDue = allOrders
        .filter(o => o.payment_status === "pending" || o.payment_status === "unpaid")
        .reduce((s, o) => s + Number(o.total_amount || 0), 0);

      // Total Purchase
      const totalPurchase = allPurchases.reduce((s, p) => s + Number(p.total_amount || 0), 0);

      // Purchase Due
      const purchaseDue = allPurchases
        .filter(p => p.status === "pending" || p.status === "ordered")
        .reduce((s, p) => s + Number(p.total_amount || 0), 0);

      // Total Purchase Return
      const totalPurchaseReturn = allPurchases
        .filter(p => p.status === "returned")
        .reduce((s, p) => s + Number(p.total_amount || 0), 0);

      // Profit/Loss calculation based on cost_price
      let totalCostPrice = 0;
      let totalSellingPrice = 0;
      allOrderItems.forEach(item => {
        const costPrice = productCostMap[item.product_id] || 0;
        totalCostPrice += costPrice * Number(item.quantity);
        totalSellingPrice += Number(item.total_price || 0);
      });
      const grossProfit = totalSellingPrice - totalCostPrice;
      const profitMargin = totalSellingPrice > 0 ? (grossProfit / totalSellingPrice) * 100 : 0;

      setStats({ totalSales, invoiceDue, totalPurchase, purchaseDue, totalPurchaseReturn, totalCostPrice, totalSellingPrice, grossProfit, profitMargin });

      // Build chart data grouped by day
      buildChartData(allOrders, allPurchases);
    } catch (err) {
      console.error("Error fetching ecommerce stats:", err);
    } finally {
      setLoading(false);
    }
  }, [from.toISOString(), to.toISOString()]);

  const buildChartData = (orders: any[], purchases: any[]) => {
    const dayMap: Record<string, { sales: number; purchase: number; due: number }> = {};

    const addDays = (start: Date, end: Date) => {
      const days: string[] = [];
      const cur = new Date(start);
      while (cur <= end) {
        days.push(format(cur, "MM/dd"));
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    };

    const days = addDays(from, to);
    days.forEach(d => {
      dayMap[d] = { sales: 0, purchase: 0, due: 0 };
    });

    orders.forEach(o => {
      const key = format(new Date(o.created_at), "MM/dd");
      if (dayMap[key]) {
        dayMap[key].sales += Number(o.total_amount || 0);
        if (o.payment_status === "pending") {
          dayMap[key].due += Number(o.total_amount || 0);
        }
      }
    });

    purchases.forEach(p => {
      const key = format(new Date(p.created_at), "MM/dd");
      if (dayMap[key]) {
        dayMap[key].purchase += Number(p.total_amount || 0);
      }
    });

    const points: ChartPoint[] = Object.entries(dayMap).map(([label, v]) => ({
      label,
      sales: Math.round(v.sales),
      purchase: Math.round(v.purchase),
      due: Math.round(v.due),
    }));

    setChartData(points);
  };

  useEffect(() => {
    fetchStats();

    // Realtime subscription for orders and purchase_orders
    const ordersChannel = supabase
      .channel("ecommerce-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchStats]);

  const summaryCards = [
    {
      title: "মোট বিক্রয়",
      titleEn: "Total Sales",
      value: stats.totalSales,
      icon: ShoppingCart,
      gradient: "from-emerald-500 to-green-600",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "বকেয়া ইনভয়েস",
      titleEn: "Invoice Due",
      value: stats.invoiceDue,
      icon: CreditCard,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "মোট ক্রয়",
      titleEn: "Total Purchase",
      value: stats.totalPurchase,
      icon: Package,
      gradient: "from-blue-500 to-cyan-600",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "ক্রয় বকেয়া",
      titleEn: "Purchase Due",
      value: stats.purchaseDue,
      icon: AlertCircle,
      gradient: "from-rose-500 to-red-600",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      title: "ক্রয় ফেরত",
      titleEn: "Total Purchase Return",
      value: stats.totalPurchaseReturn,
      icon: RefreshCw,
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  const rangeButtons: { label: string; value: DateRange }[] = [
    { label: "আজ", value: "today" },
    { label: "এই সপ্তাহ", value: "week" },
    { label: "এই মাস", value: "month" },
    { label: "কাস্টম", value: "custom" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              ই-কমার্স ওভারভিউ
            </h1>
            <p className="text-muted-foreground text-sm">E-commerce Overview — অর্ডার ও ক্রয়ের সারসংক্ষেপ</p>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {rangeButtons.map(btn => (
              <Button
                key={btn.value}
                size="sm"
                variant={activeRange === btn.value ? "default" : "outline"}
                onClick={() => setActiveRange(btn.value)}
              >
                {btn.label}
              </Button>
            ))}
            {activeRange === "custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <Popover open={customFromOpen} onOpenChange={setCustomFromOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-1", !customFrom && "text-muted-foreground")}>
                      <Calendar className="h-3 w-3" />
                      {customFrom ? format(customFrom, "dd/MM/yy") : "শুরু"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={customFrom}
                      onSelect={(d) => { if (d) { setCustomFrom(d); setCustomFromOpen(false); } }}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground text-sm">—</span>
                <Popover open={customToOpen} onOpenChange={setCustomToOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-1", !customTo && "text-muted-foreground")}>
                      <Calendar className="h-3 w-3" />
                      {customTo ? format(customTo, "dd/MM/yy") : "শেষ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={customTo}
                      onSelect={(d) => { if (d) { setCustomTo(d); setCustomToOpen(false); } }}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        {/* Date range display */}
        <p className="text-xs text-muted-foreground -mt-2">
          {format(from, "dd MMM yyyy")} — {format(to, "dd MMM yyyy")}
        </p>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summaryCards.map((card, i) => (
            <Card key={i} className={cn("border", card.border, card.bg)}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                    <p className="text-xs text-muted-foreground/60 truncate">{card.titleEn}</p>
                    {loading ? (
                      <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-xl font-bold text-foreground">
                        ৳{card.value.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shrink-0 ml-2", card.gradient)}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profit/Loss Summary */}
        <Card className={cn("border", stats.grossProfit >= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              লাভ/ক্ষতি সারসংক্ষেপ (Profit/Loss Summary)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-20 bg-muted animate-pulse rounded" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">মোট বিক্রয় মূল্য</p>
                  <p className="text-lg font-bold text-foreground">৳{stats.totalSellingPrice.toLocaleString("en-IN")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">মোট ক্রয় মূল্য (Cost)</p>
                  <p className="text-lg font-bold text-foreground">৳{stats.totalCostPrice.toLocaleString("en-IN")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">গ্রস লাভ/ক্ষতি</p>
                  <div className="flex items-center gap-2">
                    {stats.grossProfit >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-500" />
                    )}
                    <p className={cn("text-lg font-bold", stats.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      ৳{Math.abs(stats.grossProfit).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">প্রফিট মার্জিন</p>
                  <div className="flex items-center gap-2">
                    <p className={cn("text-lg font-bold", stats.profitMargin >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {stats.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                বিক্রয় ও ক্রয় বিশ্লেষণ (Bar Chart)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  এই সময়ের জন্য কোনো ডেটা নেই
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(val: number, name: string) => [`৳${val.toLocaleString("en-IN")}`, name]}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="বিক্রয়" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchase" name="ক্রয়" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="due" name="বকেয়া" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                ট্রেন্ড বিশ্লেষণ (Line Chart)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] bg-muted animate-pulse rounded" />
              ) : chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  এই সময়ের জন্য কোনো ডেটা নেই
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(val: number, name: string) => [`৳${val.toLocaleString("en-IN")}`, name]}
                    />
                    <Legend />
                    <Line
                      type="monotone" dataKey="sales" name="বিক্রয়"
                      stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone" dataKey="purchase" name="ক্রয়"
                      stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone" dataKey="due" name="বকেয়া"
                      stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEcommerceOverview;
