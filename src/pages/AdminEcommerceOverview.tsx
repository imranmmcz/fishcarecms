import { useEffect, useState, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart, CreditCard, Package, RefreshCw,
  TrendingUp, Calendar, BarChart2, Eye, Award,
  Clock, Truck, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type DateRange = "today" | "week" | "month" | "custom";

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

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: any; gradient: string; bg: string; border: string }> = {
  pending: { label: "পেন্ডিং", icon: Clock, gradient: "from-amber-500 to-orange-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  processing: { label: "প্রসেসিং", icon: Loader2, gradient: "from-blue-500 to-cyan-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  shipped: { label: "শিপড", icon: Truck, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  delivered: { label: "ডেলিভার্ড", icon: CheckCircle2, gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  cancelled: { label: "বাতিল", icon: XCircle, gradient: "from-rose-500 to-red-600", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const AdminEcommerceOverview = () => {
  const navigate = useNavigate();
  const [activeRange, setActiveRange] = useState<DateRange>("month");
  const [customFrom, setCustomFrom] = useState<Date>(subDays(new Date(), 7));
  const [customTo, setCustomTo] = useState<Date>(new Date());
  const [customFromOpen, setCustomFromOpen] = useState(false);
  const [customToOpen, setCustomToOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { from, to } = getDateRange(activeRange, customFrom, customTo);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, total_amount, status, payment_status, payment_method, created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false });
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [from.toISOString(), to.toISOString()]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("ecommerce-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  // Computed stats
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const paidAmount = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const dueAmount = orders.filter(o => o.payment_status !== "paid").reduce((s, o) => s + Number(o.total_amount || 0), 0);

  // Status summary
  const statusSummary = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    Object.keys(statusConfig).forEach(s => { map[s] = { count: 0, amount: 0 }; });
    orders.forEach(o => {
      const s = o.status || "pending";
      if (!map[s]) map[s] = { count: 0, amount: 0 };
      map[s].count++;
      map[s].amount += Number(o.total_amount || 0);
    });
    return map;
  }, [orders]);

  // Chart data by day
  const chartData = useMemo(() => {
    const dayMap: Record<string, number> = {};
    const cur = new Date(from);
    while (cur <= to) {
      dayMap[format(cur, "MM/dd")] = 0;
      cur.setDate(cur.getDate() + 1);
    }
    orders.forEach(o => {
      const key = format(new Date(o.created_at), "MM/dd");
      if (dayMap[key] !== undefined) dayMap[key] += Number(o.total_amount || 0);
    });
    return Object.entries(dayMap).map(([label, amount]) => ({ label, amount: Math.round(amount) }));
  }, [orders, from, to]);

  const recentOrders = orders.slice(0, 10);

  // Top selling products from order items
  const [topProducts, setTopProducts] = useState<{ product_name: string; product_image: string | null; total_qty: number; total_revenue: number }[]>([]);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const { data } = await supabase
          .from("order_items")
          .select("product_name, product_image, quantity, total_price, order_id");
        
        if (data) {
          // Filter by orders in current date range
          const orderIds = new Set(orders.map(o => o.id));
          const filtered = data.filter(item => orderIds.has(item.order_id));
          
          const map: Record<string, { product_name: string; product_image: string | null; total_qty: number; total_revenue: number }> = {};
          filtered.forEach(item => {
            const key = item.product_name;
            if (!map[key]) map[key] = { product_name: key, product_image: item.product_image, total_qty: 0, total_revenue: 0 };
            map[key].total_qty += item.quantity;
            map[key].total_revenue += Number(item.total_price || 0);
          });
          
          const sorted = Object.values(map).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 8);
          setTopProducts(sorted);
        }
      } catch (err) {
        console.error("Error fetching top products:", err);
      }
    };
    if (orders.length > 0) fetchTopProducts();
    else setTopProducts([]);
  }, [orders]);

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    orders.forEach(o => {
      const method = o.payment_method || "cod";
      if (!map[method]) map[method] = { count: 0, amount: 0 };
      map[method].count++;
      map[method].amount += Number(o.total_amount || 0);
    });
    return map;
  }, [orders]);

  const paymentMethodLabels: Record<string, string> = {
    cod: "ক্যাশ অন ডেলিভারি",
    bkash: "বিকাশ",
    nagad: "নগদ",
    rocket: "রকেট",
    bank: "ব্যাংক",
    online: "অনলাইন",
  };

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
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              ই-কমার্স ওভারভিউ
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">অনলাইন অর্ডারের সারসংক্ষেপ</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rangeButtons.map(btn => (
              <Button key={btn.value} size="sm" variant={activeRange === btn.value ? "default" : "outline"} onClick={() => setActiveRange(btn.value)}>
                {btn.label}
              </Button>
            ))}
            {activeRange === "custom" && (
              <div className="flex items-center gap-2 flex-wrap">
                <Popover open={customFromOpen} onOpenChange={setCustomFromOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {customFrom ? format(customFrom, "dd/MM/yy") : "শুরু"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={customFrom} onSelect={(d) => { if (d) { setCustomFrom(d); setCustomFromOpen(false); } }} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground text-sm">—</span>
                <Popover open={customToOpen} onOpenChange={setCustomToOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {customTo ? format(customTo, "dd/MM/yy") : "শেষ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={customTo} onSelect={(d) => { if (d) { setCustomTo(d); setCustomToOpen(false); } }} className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground -mt-2">
          {format(from, "dd MMM yyyy")} — {format(to, "dd MMM yyyy")}
        </p>

        {/* Top Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "মোট অর্ডার", value: totalOrders, isCurrency: false, icon: ShoppingCart, gradient: "from-blue-500 to-cyan-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { title: "মোট বিক্রয়", value: totalAmount, isCurrency: true, icon: CreditCard, gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { title: "পেইড", value: paidAmount, isCurrency: true, icon: CheckCircle2, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", border: "border-violet-500/20" },
            { title: "বকেয়া", value: dueAmount, isCurrency: true, icon: Clock, gradient: "from-amber-500 to-orange-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          ].map((card, i) => (
            <Card key={i} className={cn("border", card.border, card.bg)}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                    {loading ? (
                      <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-xl font-bold text-foreground">
                        {card.isCurrency ? `৳${card.value.toLocaleString("en-IN")}` : card.value}
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

        {/* Order Status Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              অর্ডার স্ট্যাটাস সারাংশ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-20 bg-muted animate-pulse rounded" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(statusConfig).map(([key, cfg]) => {
                  const data = statusSummary[key] || { count: 0, amount: 0 };
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className={cn("rounded-xl border p-4 space-y-2", cfg.border, cfg.bg)}>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", cfg.gradient)}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-foreground">{data.count}</span>
                        <span className="text-sm font-semibold text-muted-foreground">৳{data.amount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              দৈনিক বিক্রয় (অনলাইন অর্ডার)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[280px] bg-muted animate-pulse rounded" />
            ) : chartData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">এই সময়ের জন্য কোনো ডেটা নেই</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val: number) => [`৳${val.toLocaleString("en-IN")}`, "বিক্রয়"]} />
                  <Bar dataKey="amount" name="বিক্রয়" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                সাম্প্রতিক অর্ডার
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/orders")}>সব দেখুন</Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] bg-muted animate-pulse rounded" />
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">কোনো অর্ডার পাওয়া যায়নি</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>অর্ডার নম্বর</TableHead>
                      <TableHead className="hidden sm:table-cell">কাস্টমার</TableHead>
                      <TableHead>মোট টাকা</TableHead>
                      <TableHead className="hidden md:table-cell">পেমেন্ট</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead className="hidden md:table-cell">তারিখ</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => {
                      const sCfg = statusConfig[order.status] || statusConfig.pending;
                      return (
                        <TableRow key={order.id} className="cursor-pointer" onClick={() => navigate(`/admin/orders?order=${order.id}`)}>
                          <TableCell className="font-medium text-xs sm:text-sm">{order.order_number}</TableCell>
                          <TableCell className="hidden sm:table-cell">{order.customer_name}</TableCell>
                          <TableCell className="text-xs sm:text-sm">৳{Number(order.total_amount).toLocaleString("en-IN")}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="text-xs">
                              {order.payment_status === "paid" ? "পেইড" : "পেন্ডিং"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs", `border-${order.status === "delivered" ? "emerald" : order.status === "processing" ? "blue" : order.status === "shipped" ? "violet" : order.status === "cancelled" ? "destructive" : "amber"}-500`)}>
                              {sCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{format(new Date(order.created_at), "dd/MM/yy hh:mm a")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders?order=${order.id}`); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trending / Top Selling Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              ট্রেন্ডিং প্রোডাক্ট
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] bg-muted animate-pulse rounded" />
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">এই সময়ে কোনো প্রোডাক্ট বিক্রি হয়নি</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>প্রোডাক্ট</TableHead>
                    <TableHead className="text-center">বিক্রিত সংখ্যা</TableHead>
                    <TableHead className="text-right">মোট আয়</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.product_image ? (
                            <img src={p.product_image} alt={p.product_name} className="h-10 w-10 rounded-lg object-cover border" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-sm">{p.product_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{p.total_qty}</TableCell>
                      <TableCell className="text-right font-semibold">৳{p.total_revenue.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              পেমেন্ট মেথড সারাংশ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[100px] bg-muted animate-pulse rounded" />
            ) : Object.keys(paymentBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">কোনো ডেটা নেই</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(paymentBreakdown).map(([method, data]) => (
                  <div key={method} className="rounded-xl border p-4 space-y-1 bg-muted/30">
                    <p className="text-sm font-medium text-foreground">{paymentMethodLabels[method] || method}</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-foreground">{data.count} টি</span>
                      <span className="text-sm font-semibold text-muted-foreground">৳{data.amount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminEcommerceOverview;
