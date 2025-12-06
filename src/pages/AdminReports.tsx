import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Fish, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

const AdminReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Sample data - in real app, this would come from the database
  const incomeData = [
    { name: "সপ্তাহ ১", income: 45000, expense: 25000 },
    { name: "সপ্তাহ ২", income: 52000, expense: 28000 },
    { name: "সপ্তাহ ৩", income: 38000, expense: 22000 },
    { name: "সপ্তাহ ৪", income: 65000, expense: 35000 },
  ];

  const monthlyTrend = [
    { month: "জানু", amount: 150000 },
    { month: "ফেব্রু", amount: 180000 },
    { month: "মার্চ", amount: 220000 },
    { month: "এপ্রি", amount: 195000 },
    { month: "মে", amount: 280000 },
    { month: "জুন", amount: 320000 },
  ];

  const pondPerformance = [
    { pond: "পুকুর ১", profit: 85000 },
    { pond: "পুকুর ২", profit: 62000 },
    { pond: "পুকুর ৩", profit: 95000 },
    { pond: "পুকুর ৪", profit: 45000 },
    { pond: "পুকুর ৫", profit: 78000 },
  ];

  const handleDownloadReport = () => {
    // Generate CSV report
    const allIncomes = JSON.parse(localStorage.getItem("farmerIncomes") || "[]");
    const allExpenses = JSON.parse(localStorage.getItem("farmerExpenses") || "[]");

    let csvContent = "ধরন,তারিখ,পরিমাণ,ক্যাটাগরি,বিবরণ\n";

    allIncomes.forEach((item: any) => {
      csvContent += `আয়,${item.date},${item.amount},${item.category},${item.description || ""}\n`;
    });

    allExpenses.forEach((item: any) => {
      csvContent += `ব্যয়,${item.date},${item.amount},${item.category},${item.description || ""}\n`;
    });

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      title: "মোট আয়",
      value: "৳৩,২০,০০০",
      change: "+১২%",
      icon: TrendingUp,
      color: "from-emerald-500 to-green-600",
      positive: true,
    },
    {
      title: "মোট ব্যয়",
      value: "৳১,৮৫,০০০",
      change: "+৮%",
      icon: TrendingDown,
      color: "from-rose-500 to-red-600",
      positive: false,
    },
    {
      title: "নিট লাভ",
      value: "৳১,৩৫,০০০",
      change: "+১৫%",
      icon: DollarSign,
      color: "from-violet-500 to-purple-600",
      positive: true,
    },
    {
      title: "সক্রিয় পুকুর",
      value: "১২",
      change: "+২",
      icon: Fish,
      color: "from-cyan-500 to-blue-600",
      positive: true,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">রিপোর্ট ও এনালিটিক্স</h1>
            <p className="text-muted-foreground">বিস্তারিত পরিসংখ্যান এবং বিশ্লেষণ</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-36">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">এই সপ্তাহ</SelectItem>
                <SelectItem value="month">এই মাস</SelectItem>
                <SelectItem value="year">এই বছর</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              রিপোর্ট ডাউনলোড
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className={`text-sm ${card.positive ? "text-green-500" : "text-red-500"}`}>
                      {card.change} গত মাসের তুলনায়
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Income vs Expense */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-500" />
                আয় বনাম ব্যয়
              </CardTitle>
              <CardDescription>সাপ্তাহিক তুলনা</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`}
                  />
                  <Bar dataKey="income" fill="#10b981" name="আয়" />
                  <Bar dataKey="expense" fill="#ef4444" name="ব্যয়" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                মাসিক ট্রেন্ড
              </CardTitle>
              <CardDescription>আয়ের গতিপ্রকৃতি</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    name="পরিমাণ"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pond Performance */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-cyan-500" />
                পুকুরভিত্তিক পারফরম্যান্স
              </CardTitle>
              <CardDescription>প্রতিটি পুকুরের লাভ</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pondPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="pond" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`}
                  />
                  <Bar dataKey="profit" fill="#06b6d4" name="লাভ" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
