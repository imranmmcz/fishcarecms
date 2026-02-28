import { useEffect, useState, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Package, TrendingUp, TrendingDown, Users, Clock, CheckCircle, Truck, XCircle, DollarSign, AlertTriangle, User, MapPin, Phone, Mail, CalendarDays, Search, Waves, Fish, Filter, CalendarIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { bn } from "date-fns/locale";

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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
  processing: "bg-blue-500/10 text-blue-700 border-blue-300",
  shipped: "bg-purple-500/10 text-purple-700 border-purple-300",
  delivered: "bg-green-500/10 text-green-700 border-green-300",
  cancelled: "bg-red-500/10 text-red-700 border-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "পেন্ডিং",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  delivered: "ডেলিভারড",
  cancelled: "বাতিল",
};

const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

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
}

const AdminDashboard = () => {
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

  // Date filter state
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
        return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString(), label: "আজ" };
      case "yesterday": {
        const y = subDays(now, 1);
        return { start: startOfDay(y).toISOString(), end: endOfDay(y).toISOString(), label: "গতকাল" };
      }
      case "this_week":
        return { start: startOfWeek(now, { weekStartsOn: 6 }).toISOString(), end: endOfDay(now).toISOString(), label: "এই সপ্তাহ" };
      case "this_month":
        return { start: startOfMonth(now).toISOString(), end: endOfDay(now).toISOString(), label: "এই মাস" };
      case "last_30":
        return { start: startOfDay(subDays(now, 30)).toISOString(), end: endOfDay(now).toISOString(), label: "গত ৩০ দিন" };
      case "custom":
        if (customRange.from) {
          return {
            start: startOfDay(customRange.from).toISOString(),
            end: customRange.to ? endOfDay(customRange.to).toISOString() : endOfDay(customRange.from).toISOString(),
            label: `${format(customRange.from, "dd/MM/yy")}${customRange.to ? ` - ${format(customRange.to, "dd/MM/yy")}` : ""}`,
          };
        }
        return { start: null, end: null, label: "সব সময়" };
      case "all":
      default:
        return { start: null, end: null, label: "সব সময়" };
    }
  }, [dateFilter, customRange]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { start, end } = getDateRange();

      // Build filtered orders query
      let filteredQuery = supabase.from("orders").select("total_amount, status, created_at");
      if (start) filteredQuery = filteredQuery.gte("created_at", start);
      if (end) filteredQuery = filteredQuery.lte("created_at", end);

      const [
        { data: filteredOrders },
        { count: productCount },
        { count: userCount },
        { data: lowStock },
        { data: recent },
      ] = await Promise.all([
        filteredQuery,
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("id").lt("stock_quantity", 10),
        (() => {
          let q = supabase.from("orders").select("id, order_number, customer_name, total_amount, status, payment_method, payment_status, created_at").order("created_at", { ascending: false });
          if (start) q = q.gte("created_at", start);
          if (end) q = q.lte("created_at", end);
          return q.limit(10);
        })(),
      ]);

      const orders = filteredOrders || [];
      const byStatus: Record<string, number> = {};
      orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
      const totalSales = orders.reduce((s, o) => s + Number(o.total_amount), 0);

      setStats({
        todayOrders: orders.length,
        todaySales: totalSales,
        monthOrders: orders.length,
        monthSales: totalSales,
        totalOrders: orders.length,
        totalSales,
        totalProducts: productCount || 0,
        totalUsers: userCount || 0,
        lowStockProducts: lowStock?.length || 0,
        pendingOrders: byStatus["pending"] || 0,
        processingOrders: byStatus["processing"] || 0,
        shippedOrders: byStatus["shipped"] || 0,
        deliveredOrders: byStatus["delivered"] || 0,
        cancelledOrders: byStatus["cancelled"] || 0,
      });

      setRecentOrders(recent || []);

      // Daily sales chart from filtered data
      const dailyMap: Record<string, number> = {};
      orders.forEach(o => {
        const dateKey = format(new Date(o.created_at), "dd/MM");
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Number(o.total_amount);
      });
      setDailySalesData(
        Object.entries(dailyMap).map(([day, sales]) => ({ day, sales }))
      );

      setStatusDistribution(
        Object.entries(byStatus).map(([name, value]) => ({
          name: STATUS_LABELS[name] || name,
          value,
        }))
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);
  // Fetch all users for dropdown
  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    setAllUsers(data || []);
  }, []);

  // Fetch selected user's dashboard data
  const fetchUserDashboard = useCallback(async (userId: string) => {
    setIsUserLoading(true);
    try {
      const [
        { data: userOrders },
        { data: roleData },
        { data: pondsData },
        { data: incomesData },
        { data: expensesData },
      ] = await Promise.all([
        supabase.from("orders").select("id, order_number, customer_name, total_amount, status, payment_method, payment_status, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("user_roles").select("role").eq("user_id", userId).limit(1),
        supabase.from("farmer_ponds").select("id, status, fish_count").eq("user_id", userId),
        supabase.from("farmer_incomes").select("amount").eq("user_id", userId),
        supabase.from("farmer_expenses").select("amount").eq("user_id", userId),
      ]);

      const orders = userOrders || [];
      const byStatus: Record<string, number> = {};
      orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

      const ponds = pondsData || [];
      const incomes = incomesData || [];
      const expenses = expensesData || [];

      setSelectedUserData({
        totalOrders: orders.length,
        totalSpent: orders.reduce((s, o) => s + Number(o.total_amount), 0),
        pendingOrders: byStatus["pending"] || 0,
        deliveredOrders: byStatus["delivered"] || 0,
        orders: orders.slice(0, 10),
        role: roleData?.[0]?.role || "user",
        pondCount: ponds.length,
        activePondCount: ponds.filter(p => p.status === "active").length,
        totalIncome: incomes.reduce((s, i) => s + Number(i.amount), 0),
        totalExpense: expenses.reduce((s, e) => s + Number(e.amount), 0),
        totalFishCount: ponds.reduce((s, p) => s + (p.fish_count || 0), 0),
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

  const statCards = [
    { title: `বিক্রয় (${filterLabel})`, value: `৳${(stats?.totalSales || 0).toLocaleString("bn-BD")}`, sub: `${(stats?.totalOrders || 0).toLocaleString("bn-BD")} অর্ডার`, icon: DollarSign, color: "from-emerald-500 to-green-600", bg: "bg-emerald-500/10" },
    { title: "মোট অর্ডার", value: (stats?.totalOrders || 0).toLocaleString("bn-BD"), sub: filterLabel, icon: ShoppingCart, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10" },
    { title: "মোট পণ্য", value: (stats?.totalProducts || 0).toLocaleString("bn-BD"), sub: `${(stats?.lowStockProducts || 0).toLocaleString("bn-BD")} কম স্টক`, icon: Package, color: "from-cyan-500 to-blue-600", bg: "bg-cyan-500/10" },
    { title: "মোট ব্যবহারকারী", value: (stats?.totalUsers || 0).toLocaleString("bn-BD"), sub: "নিবন্ধিত", icon: Users, color: "from-orange-500 to-amber-600", bg: "bg-orange-500/10" },
  ];

  const orderStatusCards = [
    { label: "পেন্ডিং", count: stats?.pendingOrders || 0, icon: Clock, color: "text-yellow-600" },
    { label: "প্রসেসিং", count: stats?.processingOrders || 0, icon: Package, color: "text-blue-600" },
    { label: "শিপড", count: stats?.shippedOrders || 0, icon: Truck, color: "text-purple-600" },
    { label: "ডেলিভারড", count: stats?.deliveredOrders || 0, icon: CheckCircle, color: "text-green-600" },
    { label: "বাতিল", count: stats?.cancelledOrders || 0, icon: XCircle, color: "text-red-600" },
  ];

  const filterButtons: { key: DateFilterType; label: string }[] = [
    { key: "today", label: "আজ" },
    { key: "yesterday", label: "গতকাল" },
    { key: "this_week", label: "এই সপ্তাহ" },
    { key: "this_month", label: "এই মাস" },
    { key: "last_30", label: "৩০ দিন" },
    { key: "all", label: "সব" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">অ্যাডমিন ড্যাশবোর্ড</h1>
            <p className="text-muted-foreground">রিয়েলটাইম সেলস ও অর্ডার পরিসংখ্যান</p>
          </div>
        </div>

        {/* Date Filter Bar */}
        <Card className="border-0 bg-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              {filterButtons.map(f => (
                <Button
                  key={f.key}
                  variant={dateFilter === f.key ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setDateFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
              {/* Custom Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFilter === "custom" ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setDateFilter("custom")}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dateFilter === "custom" && customRange.from
                      ? `${format(customRange.from, "dd/MM")}${customRange.to ? ` - ${format(customRange.to, "dd/MM")}` : ""}`
                      : "কাস্টম তারিখ"}
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
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {dateFilter !== "today" && (
                <span className="text-xs text-muted-foreground ml-2">📊 {filterLabel}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s, i) => (
            <Card key={i} className={`${s.bg} border-0`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${s.color}`}>
                    <s.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Status Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              অর্ডার স্ট্যাটাস সারাংশ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {orderStatusCards.map((s, i) => (
                <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                  <span className="text-2xl font-bold">{s.count.toLocaleString("bn-BD")}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">বিক্রয় চার্ট ({filterLabel})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, "বিক্রয়"]} />
                  <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">অর্ডার স্ট্যাটাস বিতরণ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {(stats?.lowStockProducts || 0) > 0 && (
          <Card className="border-yellow-300 bg-yellow-500/5">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0" />
              <div>
                <p className="font-semibold text-yellow-800">{(stats?.lowStockProducts || 0).toLocaleString("bn-BD")}টি পণ্যের স্টক কম!</p>
                <p className="text-sm text-yellow-700">এই পণ্যগুলোর স্টক ১০-এর কম। ইনভেন্টরি থেকে চেক করুন।</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Dashboard Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              ব্যবহারকারী ড্যাশবোর্ড
            </CardTitle>
            <CardDescription>ব্যবহারকারী নির্বাচন করে তার সম্পূর্ণ তথ্য দেখুন</CardDescription>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="নাম, মোবাইল বা ইমেইল দিয়ে খুঁজুন..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="sm:w-64">
                  <SelectValue placeholder="ব্যবহারকারী নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name || u.email || "Unknown"} {u.mobile ? `(${u.mobile})` : ""}
                    </SelectItem>
                  )) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">কোনো ব্যবহারকারী পাওয়া যায়নি</div>
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
              <div className="space-y-5">
                {/* User Info */}
                {(() => {
                  const user = allUsers.find(u => u.user_id === selectedUserId);
                  if (!user) return null;
                  return (
                    <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{user.full_name || "N/A"}</span></div>
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{user.email || "N/A"}</span></div>
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{user.mobile || "N/A"}</span></div>
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{[user.village, user.upazila, user.district, user.division].filter(Boolean).join(", ") || "N/A"}</span></div>
                      <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><span>{new Date(user.created_at).toLocaleDateString("bn-BD")}</span></div>
                      <Badge variant="outline">{selectedUserData.role === "admin" ? "অ্যাডমিন" : selectedUserData.role === "farmer" ? "কৃষক" : selectedUserData.role === "customer" ? "কাস্টমার" : "ইউজার"}</Badge>
                    </div>
                  );
                })()}

                {/* User Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                    <Waves className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold">{selectedUserData.pondCount.toLocaleString("bn-BD")}</span>
                    <span className="text-xs text-muted-foreground">মোট পুকুর ({selectedUserData.activePondCount.toLocaleString("bn-BD")} চলমান)</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                    <Fish className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold">{selectedUserData.totalFishCount.toLocaleString("bn-BD")}</span>
                    <span className="text-xs text-muted-foreground">মোট মাছ</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold text-green-600">৳{selectedUserData.totalIncome.toLocaleString("bn-BD")}</span>
                    <span className="text-xs text-muted-foreground">মোট আয়</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    <span className="text-xl font-bold text-destructive">৳{selectedUserData.totalExpense.toLocaleString("bn-BD")}</span>
                    <span className="text-xs text-muted-foreground">মোট ব্যয়</span>
                  </div>
                </div>

                {/* Profit/Loss */}
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <span className="text-sm text-muted-foreground">নিট লাভ/ক্ষতি: </span>
                  <span className={`text-lg font-bold ${(selectedUserData.totalIncome - selectedUserData.totalExpense) >= 0 ? "text-green-600" : "text-destructive"}`}>
                    ৳{(selectedUserData.totalIncome - selectedUserData.totalExpense).toLocaleString("bn-BD")}
                  </span>
                </div>

                {/* Order Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold">{selectedUserData.totalOrders.toLocaleString("bn-BD")}</span>
                    <span className="text-xs text-muted-foreground">মোট অর্ডার</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold">৳{selectedUserData.totalSpent.toLocaleString("bn-BD")}</span>
                    <span className="text-xs text-muted-foreground">মোট ক্রয়</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="text-xl font-bold">{selectedUserData.pendingOrders.toLocaleString("bn-BD")}</span>
                    <span className="text-xs text-muted-foreground">পেন্ডিং</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 gap-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold">{selectedUserData.deliveredOrders.toLocaleString("bn-BD")}</span>
                    <span className="text-xs text-muted-foreground">ডেলিভারড</span>
                  </div>
                </div>

                {/* User Orders */}
                {selectedUserData.orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <p className="text-sm font-medium mb-2 text-muted-foreground">সর্বশেষ অর্ডারসমূহ</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 font-medium">অর্ডার নং</th>
                          <th className="pb-2 font-medium">পরিমাণ</th>
                          <th className="pb-2 font-medium">স্ট্যাটাস</th>
                          <th className="pb-2 font-medium">তারিখ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserData.orders.map(order => (
                          <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 font-mono text-xs">{order.order_number}</td>
                            <td className="py-2 font-semibold">৳{Number(order.total_amount).toLocaleString()}</td>
                            <td className="py-2">
                              <Badge variant="outline" className={`text-xs ${STATUS_COLORS[order.status] || ""}`}>
                                {STATUS_LABELS[order.status] || order.status}
                              </Badge>
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("bn-BD")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">এই ব্যবহারকারীর কোনো অর্ডার নেই</p>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">ড্রপডাউন থেকে একজন ব্যবহারকারী নির্বাচন করুন</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
