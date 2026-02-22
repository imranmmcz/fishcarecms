import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Package, TrendingUp, Users, Clock, CheckCircle, Truck, XCircle, DollarSign, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [dailySalesData, setDailySalesData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        { data: allOrders },
        { data: todayOrders },
        { data: monthOrders },
        { count: productCount },
        { count: userCount },
        { data: lowStock },
        { data: recent },
      ] = await Promise.all([
        supabase.from("orders").select("total_amount, status"),
        supabase.from("orders").select("total_amount").gte("created_at", todayStart),
        supabase.from("orders").select("total_amount, created_at").gte("created_at", monthStart),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("id").lt("stock_quantity", 10),
        supabase.from("orders").select("id, order_number, customer_name, total_amount, status, payment_method, payment_status, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const byStatus: Record<string, number> = {};
      allOrders?.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

      setStats({
        todayOrders: todayOrders?.length || 0,
        todaySales: todayOrders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0,
        monthOrders: monthOrders?.length || 0,
        monthSales: monthOrders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0,
        totalOrders: allOrders?.length || 0,
        totalSales: allOrders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0,
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

      // Daily sales for current month
      const dailyMap: Record<string, number> = {};
      monthOrders?.forEach(o => {
        const day = new Date(o.created_at).getDate().toString();
        dailyMap[day] = (dailyMap[day] || 0) + Number(o.total_amount);
      });
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dailyData = [];
      for (let i = 1; i <= Math.min(now.getDate(), daysInMonth); i++) {
        dailyData.push({ day: `${i}`, sales: dailyMap[i.toString()] || 0 });
      }
      setDailySalesData(dailyData);

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
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscription
    const channel = supabase
      .channel("admin-dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDashboardData]);

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

  const statCards = [
    { title: "আজকের বিক্রয়", value: `৳${(stats?.todaySales || 0).toLocaleString("bn-BD")}`, sub: `${(stats?.todayOrders || 0).toLocaleString("bn-BD")} অর্ডার`, icon: DollarSign, color: "from-emerald-500 to-green-600", bg: "bg-emerald-500/10" },
    { title: "এই মাসের বিক্রয়", value: `৳${(stats?.monthSales || 0).toLocaleString("bn-BD")}`, sub: `${(stats?.monthOrders || 0).toLocaleString("bn-BD")} অর্ডার`, icon: TrendingUp, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10" },
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-muted-foreground">রিয়েলটাইম সেলস ও অর্ডার পরিসংখ্যান</p>
        </div>

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
              <CardTitle className="text-lg">দৈনিক বিক্রয় (এই মাস)</CardTitle>
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

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              সাম্প্রতিক অর্ডার
            </CardTitle>
            <CardDescription>সর্বশেষ ১০টি অর্ডার</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">অর্ডার নং</th>
                      <th className="pb-2 font-medium">গ্রাহক</th>
                      <th className="pb-2 font-medium">পরিমাণ</th>
                      <th className="pb-2 font-medium">পেমেন্ট</th>
                      <th className="pb-2 font-medium">স্ট্যাটাস</th>
                      <th className="pb-2 font-medium">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 font-mono text-xs">{order.order_number}</td>
                        <td className="py-3">{order.customer_name}</td>
                        <td className="py-3 font-semibold">৳{Number(order.total_amount).toLocaleString()}</td>
                        <td className="py-3">
                          <span className="text-xs">{order.payment_method?.toUpperCase()}</span>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[order.status] || ""}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("bn-BD")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">কোনো অর্ডার নেই</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
