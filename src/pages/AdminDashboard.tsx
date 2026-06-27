import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ordersRepo } from "@/repositories/orders";
import { ShoppingCart, Package, TrendingUp, TrendingDown, Users, Clock, CheckCircle, Truck, XCircle, DollarSign, AlertTriangle, User, MapPin, Phone, Mail, CalendarDays, Search, Waves, Fish, Filter, CalendarIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminTranslations } from "@/data/adminTranslations";

type DateFilterType = "today" | "yesterday" | "this_week" | "this_month" | "last_30" | "all" | "custom";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DashboardStats {
  todayOrders: number;
  todaySales: number;
  monthOrders: number;
  monthSales: number;
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
  totalUsers: number;
  lowStockProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(186 100% 45%)", "hsl(35 95% 55%)", "hsl(0 84% 60%)"];

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  village: string | null;
  created_at: string;
}

interface UserDashboardData {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  deliveredOrders: number;
  orders: RecentOrder[];
  role: string;
  pondCount: number;
  activePondCount: number;
  totalIncome: number;
  totalExpense: number;
  totalFishCount: number;
  fishSpecies: string[];
}

const AdminDashboard = () => {
  const { language } = useLanguage();
  const at = useAdminTranslations(language);
  const locale = language === "bn" ? "bn-BD" : "en-US";

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
    processing: "bg-blue-500/10 text-blue-700 border-blue-300",
    shipped: "bg-purple-500/10 text-purple-700 border-purple-300",
    delivered: "bg-green-500/10 text-green-700 border-green-300",
    cancelled: "bg-red-500/10 text-red-700 border-red-300",
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: at.pending,
    processing: at.processing,
    shipped: at.shipped,
    delivered: at.delivered,
    cancelled: at.cancelled,
  };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [dailySalesData, setDailySalesData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserData, setSelectedUserData] = useState<UserDashboardData | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const [dateFilter, setDateFilter] = useState<DateFilterType>("today");
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined });

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return allUsers;
    const q = userSearchQuery.toLowerCase().trim();
    return allUsers.filter(u =>
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.mobile || "").includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }, [allUsers, userSearchQuery]);

  const getDateRange = useCallback((): { start: string | null; end: string | null; label: string } => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString(), label: at.today };
      case "yesterday": {
        const y = subDays(now, 1);
        return { start: startOfDay(y).toISOString(), end: endOfDay(y).toISOString(), label: at.yesterday };
      }
      case "this_week":
        return { start: startOfWeek(now, { weekStartsOn: 6 }).toISOString(), end: endOfDay(now).toISOString(), label: at.thisWeek };
      case "this_month":
        return { start: startOfMonth(now).toISOString(), end: endOfDay(now).toISOString(), label: at.thisMonth };
      case "last_30":
        return { start: startOfDay(subDays(now, 30)).toISOString(), end: endOfDay(now).toISOString(), label: at.last30Days };
      case "custom":
        if (customRange.from) {
          return {
            start: startOfDay(customRange.from).toISOString(),
            end: customRange.to ? endOfDay(customRange.to).toISOString() : endOfDay(customRange.from).toISOString(),
            label: `${format(customRange.from, "dd/MM/yy")}${customRange.to ? ` - ${format(customRange.to, "dd/MM/yy")}` : ""}`,
          };
        }
        return { start: null, end: null, label: at.allTime };
      case "all":
      default:
        return { start: null, end: null, label: at.allTime };
    }
  }, [dateFilter, customRange, at]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { start, end } = getDateRange();
      // Route order widgets through the facade so MySQL routing (Admin →
      // Database Config) flips them automatically. The facade preserves the
      // same date-range / status filters as the Supabase queries.
      const [
        filteredOrdersRaw,
        { count: productCount },
        { count: userCount },
        { data: lowStock },
        recentRaw,
      ] = await Promise.all([
        ordersRepo.list({
          userScope: "all",
          dateFrom: start ?? undefined,
          dateTo: end ?? undefined,
          limit: 5000,
        }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("id").lt("stock_quantity", 10),
        ordersRepo.list({
          userScope: "all",
          dateFrom: start ?? undefined,
          dateTo: end ?? undefined,
          limit: 10,
        }),
      ]);

      const orders = filteredOrdersRaw || [];
      const byStatus: Record<string, number> = {};
      orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
      const totalSales = orders.reduce((s, o) => s + Number(o.total_amount), 0);

      setStats({
        todayOrders: orders.length, todaySales: totalSales,
        monthOrders: orders.length, monthSales: totalSales,
        totalOrders: orders.length, totalSales,
        totalProducts: productCount || 0, totalUsers: userCount || 0,
        lowStockProducts: lowStock?.length || 0,
        pendingOrders: byStatus["pending"] || 0,
        processingOrders: byStatus["processing"] || 0,
        shippedOrders: byStatus["shipped"] || 0,
        deliveredOrders: byStatus["delivered"] || 0,
        cancelledOrders: byStatus["cancelled"] || 0,
      });
      setRecentOrders((recentRaw || []).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer_name,
        total_amount: o.total_amount,
        status: o.status,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        created_at: o.created_at,
      })));

      const dailyMap: Record<string, number> = {};
      orders.forEach(o => {
        const dateKey = format(new Date(o.created_at), "dd/MM");
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Number(o.total_amount);
      });
      setDailySalesData(Object.entries(dailyMap).map(([day, sales]) => ({ day, sales })));
      setStatusDistribution(Object.entries(byStatus).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value })));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    setAllUsers(data || []);
  }, []);

  const fetchUserDashboard = useCallback(async (userId: string) => {
    setIsUserLoading(true);
    try {
      const [
        userOrdersRaw, { data: roleData }, { data: pondsData },
        { data: incomesData }, { data: expensesData },
      ] = await Promise.all([
        ordersRepo.list({ userId, limit: 500 }),
        supabase.from("user_roles").select("role").eq("user_id", userId).limit(1),
        supabase.from("farmer_ponds").select("id, status, fish_count, fish_types").eq("user_id", userId),
        supabase.from("farmer_incomes").select("amount").eq("user_id", userId),
        supabase.from("farmer_expenses").select("amount").eq("user_id", userId),
      ]);
      const orders = userOrdersRaw || [];
      const byStatus: Record<string, number> = {};
      orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
      const ponds = pondsData || [];
      const allFishTypes = new Set<string>();
      ponds.forEach(p => {
        if (Array.isArray(p.fish_types)) {
          p.fish_types.forEach((ft: string) => { if (ft) allFishTypes.add(ft); });
        }
      });
      setSelectedUserData({
        totalOrders: orders.length,
        totalSpent: orders.reduce((s, o) => s + Number(o.total_amount), 0),
        pendingOrders: byStatus["pending"] || 0,
        deliveredOrders: byStatus["delivered"] || 0,
        orders: orders.slice(0, 10),
        role: roleData?.[0]?.role || "user",
        pondCount: ponds.length,
        activePondCount: ponds.filter(p => p.status === "active").length,
        totalIncome: (incomesData || []).reduce((s, i) => s + Number(i.amount), 0),
        totalExpense: (expensesData || []).reduce((s, e) => s + Number(e.amount), 0),
        totalFishCount: ponds.reduce((s, p) => s + (p.fish_count || 0), 0),
        fishSpecies: Array.from(allFishTypes),
      });
    } catch (err) {
      console.error("User dashboard error:", err);
    } finally {
      setIsUserLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    const channel = supabase
      .channel("admin-dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchDashboardData();
        if (selectedUserId) fetchUserDashboard(selectedUserId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDashboardData, fetchUsers, fetchUserDashboard, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) fetchUserDashboard(selectedUserId);
    else setSelectedUserData(null);
  }, [selectedUserId, fetchUserDashboard]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { label: filterLabel } = getDateRange();

  const filterButtons: { key: DateFilterType; label: string }[] = [
    { key: "today", label: at.today },
    { key: "yesterday", label: at.yesterday },
    { key: "this_week", label: at.thisWeek },
    { key: "this_month", label: at.thisMonth },
    { key: "last_30", label: at.last30Days },
    { key: "all", label: at.all },
  ];

  const orderStatusCards = [
    { label: at.pending, count: stats?.pendingOrders || 0, icon: Clock, cls: "text-yellow-600 bg-yellow-500/10" },
    { label: at.processing, count: stats?.processingOrders || 0, icon: Package, cls: "text-blue-600 bg-blue-500/10" },
    { label: at.shipped, count: stats?.shippedOrders || 0, icon: Truck, cls: "text-purple-600 bg-purple-500/10" },
    { label: at.delivered, count: stats?.deliveredOrders || 0, icon: CheckCircle, cls: "text-green-600 bg-green-500/10" },
    { label: at.cancelled, count: stats?.cancelledOrders || 0, icon: XCircle, cls: "text-red-600 bg-red-500/10" },
  ];

  const getRoleLabel = (role: string) => {
    if (role === "admin") return at.admin;
    if (role === "farmer") return at.farmer;
    if (role === "customer") return at.customer;
    return at.user;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{at.adminDashboard}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{at.realtimeStats}</p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 w-fit">
          <Select
            value={dateFilter}
            onValueChange={(val) => {
              if (val !== "custom") {
                setDateFilter(val as DateFilterType);
              }
            }}
          >
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue placeholder={at.filter} />
              </div>
            </SelectTrigger>
            <SelectContent>
              {filterButtons.map(f => (
                <SelectItem key={f.key} value={f.key} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateFilter === "custom" ? "default" : "outline"}
                size="sm"
                className="h-9 text-xs gap-1.5"
                onClick={() => setDateFilter("custom")}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateFilter === "custom" && customRange.from
                  ? `${format(customRange.from, "dd/MM")}${customRange.to ? ` - ${format(customRange.to, "dd/MM")}` : ""}`
                  : at.custom}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={customRange.from ? { from: customRange.from, to: customRange.to } : undefined}
                onSelect={(range) => {
                  setCustomRange({ from: range?.from, to: range?.to });
                  setDateFilter("custom");
                }}
                numberOfMonths={1}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{at.sales} ({filterLabel})</p>
                  <p className="text-xl font-bold text-foreground">৳{(stats?.totalSales || 0).toLocaleString(locale)}</p>
                  <p className="text-[11px] text-muted-foreground">{(stats?.totalOrders || 0).toLocaleString(locale)} {at.orders}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{at.totalOrders}</p>
                  <p className="text-xl font-bold text-foreground">{(stats?.totalOrders || 0).toLocaleString(locale)}</p>
                  <p className="text-[11px] text-muted-foreground">{filterLabel}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/10">
                  <ShoppingCart className="h-4 w-4 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{at.totalProducts}</p>
                  <p className="text-xl font-bold text-foreground">{(stats?.totalProducts || 0).toLocaleString(locale)}</p>
                  <p className="text-[11px] text-muted-foreground">{(stats?.lowStockProducts || 0).toLocaleString(locale)} {at.lowStock}</p>
                </div>
                <div className="p-2 rounded-lg bg-accent/10">
                  <Package className="h-4 w-4 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{at.usersLabel}</p>
                  <p className="text-xl font-bold text-foreground">{(stats?.totalUsers || 0).toLocaleString(locale)}</p>
                  <p className="text-[11px] text-muted-foreground">{at.registered}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Strip */}
        <div className="grid grid-cols-5 gap-3">
          {orderStatusCards.map((s, i) => (
            <Card key={i} className="border border-border/50">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", s.cls.split(" ").slice(1).join(" "))}>
                  <s.icon className={cn("h-4 w-4", s.cls.split(" ")[0])} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight">{s.count.toLocaleString(locale)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Low Stock Alert */}
        {(stats?.lowStockProducts || 0) > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-yellow-300/50 bg-yellow-50/50 dark:bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              <span className="font-semibold">{(stats?.lowStockProducts || 0).toLocaleString(locale)}</span>{at.lowStockAlert}
            </p>
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{at.salesChart} ({filterLabel})</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailySalesData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(186 100% 35%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(186 100% 35%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    formatter={(v: number) => [`৳${v.toLocaleString()}`, at.sales]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="hsl(186 100% 35%)" strokeWidth={2} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{at.orderStatusDistribution}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* User Dashboard Section */}
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {at.userDashboard}
            </CardTitle>
            <CardDescription className="text-xs">{at.selectUserDesc}</CardDescription>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={at.searchPlaceholder}
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  maxLength={100}
                />
              </div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="sm:w-56 h-9 text-sm">
                  <SelectValue placeholder={at.selectUser} />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name || u.email || "Unknown"} {u.mobile ? `(${u.mobile})` : ""}
                    </SelectItem>
                  )) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">{at.noUserFound}</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isUserLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : selectedUserData ? (
              <div className="space-y-4">
                {/* User Info */}
                {(() => {
                  const user = allUsers.find(u => u.user_id === selectedUserId);
                  if (!user) return null;
                  return (
                    <div className="flex flex-wrap gap-x-5 gap-y-2 p-3 rounded-lg bg-muted/50 text-sm">
                      <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{user.full_name || "N/A"}</span></div>
                      <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{user.email || "N/A"}</span></div>
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{user.mobile || "N/A"}</span></div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{[user.village, user.upazila, user.district, user.division].filter(Boolean).join(", ") || "N/A"}</span></div>
                      <Badge variant="outline" className="text-xs h-6">{getRoleLabel(selectedUserData.role)}</Badge>
                    </div>
                  );
                })()}

                {/* User Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Waves, label: `${at.totalPonds} (${selectedUserData.activePondCount.toLocaleString(locale)} ${at.active})`, value: selectedUserData.pondCount.toLocaleString(locale), cls: "text-primary" },
                    { icon: Fish, label: at.totalFish, value: selectedUserData.totalFishCount.toLocaleString(locale), cls: "text-primary", species: selectedUserData.fishSpecies },
                    { icon: TrendingUp, label: at.totalIncome, value: `৳${selectedUserData.totalIncome.toLocaleString(locale)}`, cls: "text-green-600" },
                    { icon: TrendingDown, label: at.totalExpense, value: `৳${selectedUserData.totalExpense.toLocaleString(locale)}`, cls: "text-destructive" },
                  ].map((s: any, i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-muted/40 gap-1 text-center">
                      <s.icon className={cn("h-4 w-4", s.cls)} />
                      <span className={cn("text-lg font-bold", s.cls)}>{s.value}</span>
                      <span className="text-[11px] text-muted-foreground">{s.label}</span>
                      {s.species && s.species.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          {s.species.map((sp: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0">
                              {sp}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Profit/Loss */}
                <div className="p-3 rounded-lg bg-muted/40 text-center">
                  <span className="text-xs text-muted-foreground">{at.netProfitLoss}: </span>
                  <span className={cn("text-base font-bold", (selectedUserData.totalIncome - selectedUserData.totalExpense) >= 0 ? "text-green-600" : "text-destructive")}>
                    ৳{(selectedUserData.totalIncome - selectedUserData.totalExpense).toLocaleString(locale)}
                  </span>
                </div>

                {/* Order Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: ShoppingCart, label: at.totalOrders, value: selectedUserData.totalOrders.toLocaleString(locale), cls: "text-primary" },
                    { icon: DollarSign, label: at.totalPurchase, value: `৳${selectedUserData.totalSpent.toLocaleString(locale)}`, cls: "text-primary" },
                    { icon: Clock, label: at.pending, value: selectedUserData.pendingOrders.toLocaleString(locale), cls: "text-yellow-600" },
                    { icon: CheckCircle, label: at.delivered, value: selectedUserData.deliveredOrders.toLocaleString(locale), cls: "text-green-600" },
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-muted/40 gap-1 text-center">
                      <s.icon className={cn("h-4 w-4", s.cls)} />
                      <span className="text-lg font-bold">{s.value}</span>
                      <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* User Orders Table */}
                {selectedUserData.orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <p className="text-xs font-medium mb-2 text-muted-foreground">{at.recentOrders}</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 font-medium">{at.orderNo}</th>
                          <th className="pb-2 font-medium">{at.amount}</th>
                          <th className="pb-2 font-medium">{at.status}</th>
                          <th className="pb-2 font-medium">{at.date}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserData.orders.map(order => (
                          <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 font-mono text-xs">
                              <Link to={`/admin/orders?order=${order.id}`} className="text-primary hover:underline cursor-pointer">
                                {order.order_number}
                              </Link>
                            </td>
                            <td className="py-2 font-semibold text-sm">৳{Number(order.total_amount).toLocaleString()}</td>
                            <td className="py-2">
                              <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[order.status] || "")}>
                                {STATUS_LABELS[order.status] || order.status}
                              </Badge>
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString(locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">{at.noOrders}</p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">{at.selectFromDropdown}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
