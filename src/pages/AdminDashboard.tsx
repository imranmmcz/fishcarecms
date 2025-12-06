import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Database, TrendingUp, Activity, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalUsers: number;
  totalPonds: number;
  totalIncome: number;
  totalExpense: number;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPonds: 0,
    totalIncome: 0,
    totalExpense: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentUsers();
    generateMockData();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get local storage data for aggregated stats
      const allPonds = JSON.parse(localStorage.getItem("farmerPonds") || "[]");
      const allIncomes = JSON.parse(localStorage.getItem("farmerIncomes") || "[]");
      const allExpenses = JSON.parse(localStorage.getItem("farmerExpenses") || "[]");

      const totalIncome = allIncomes.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
      const totalExpense = allExpenses.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);

      setStats({
        totalUsers: userCount || 0,
        totalPonds: allPonds.length,
        totalIncome,
        totalExpense,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentUsers(data);
      }
    } catch (error) {
      console.error("Error fetching recent users:", error);
    }
  };

  const generateMockData = () => {
    // Generate sample data for charts
    const months = ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন"];
    const growthData = months.map((month, index) => ({
      month,
      users: Math.floor(Math.random() * 50) + (index * 10),
      ponds: Math.floor(Math.random() * 30) + (index * 5),
    }));
    setUserGrowthData(growthData);
  };

  const statCards = [
    {
      title: "মোট ব্যবহারকারী",
      value: stats.totalUsers,
      icon: Users,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10",
    },
    {
      title: "মোট পুকুর",
      value: stats.totalPonds,
      icon: Database,
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "মোট আয়",
      value: `৳${stats.totalIncome.toLocaleString("bn-BD")}`,
      icon: TrendingUp,
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "মোট ব্যয়",
      value: `৳${stats.totalExpense.toLocaleString("bn-BD")}`,
      icon: FileText,
      color: "from-rose-500 to-red-600",
      bgColor: "bg-rose-500/10",
    },
  ];

  const activityData = [
    { name: "মাছ বিক্রয়", value: 45 },
    { name: "খাবার খরচ", value: 25 },
    { name: "ওষুধ", value: 15 },
    { name: "সার", value: 10 },
    { name: "অন্যান্য", value: 5 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-muted-foreground">সিস্টেম ওভারভিউ এবং পরিসংখ্যান</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index} className={`${stat.bgColor} border-0`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-500" />
                ব্যবহারকারী বৃদ্ধি
              </CardTitle>
              <CardDescription>মাসিক ব্যবহারকারী এবং পুকুর সংখ্যা</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#8b5cf6" name="ব্যবহারকারী" />
                  <Bar dataKey="ponds" fill="#06b6d4" name="পুকুর" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                কার্যক্রম বিতরণ
              </CardTitle>
              <CardDescription>বিভিন্ন ক্যাটাগরির শতাংশ</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {activityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              সাম্প্রতিক ব্যবহারকারী
            </CardTitle>
            <CardDescription>নতুন নিবন্ধিত ব্যবহারকারীগণ</CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user, index) => (
                  <div
                    key={user.id || index}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {(user.full_name || user.email || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || "নাম নেই"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("bn-BD")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">কোনো ব্যবহারকারী নেই</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
