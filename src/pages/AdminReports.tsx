import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Fish, Calendar, ChartPie, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { SalesAnalytics } from "@/components/SalesAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, startOfWeek, subMonths, startOfYear } from "date-fns";

const AdminReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);

  useEffect(() => {
    fetchFarmingData();
  }, []);

  const fetchFarmingData = async () => {
    setLoading(true);
    try {
      const [incomesRes, expensesRes, pondsRes] = await Promise.all([
        supabase.from('farmer_incomes').select('*'),
        supabase.from('farmer_expenses').select('*'),
        supabase.from('farmer_ponds').select('*'),
      ]);
      if (incomesRes.data) setIncomes(incomesRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
      if (pondsRes.data) setPonds(pondsRes.data);
    } catch (error) {
      console.error('Error fetching farming data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case "week": return startOfWeek(now, { weekStartsOn: 0 });
      case "month": return startOfMonth(now);
      case "year": return startOfYear(now);
      default: return startOfMonth(now);
    }
  };

  const filterByPeriod = (items: any[], dateField = 'date') => {
    const start = getStartDate();
    return items.filter(item => new Date(item[dateField]) >= start);
  };

  const filteredIncomes = filterByPeriod(incomes);
  const filteredExpenses = filterByPeriod(expenses);

  const totalIncome = filteredIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalIncome - totalExpense;
  const activePonds = ponds.filter(p => p.status === 'active').length;

  // Weekly income vs expense chart
  const incomeExpenseData = (() => {
    const start = getStartDate();
    const now = new Date();
    const weeks: { name: string; income: number; expense: number }[] = [];
    let weekStart = new Date(start);
    let weekNum = 1;
    
    while (weekStart <= now) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const wStart = new Date(weekStart);
      const wEnd = weekEnd > now ? now : weekEnd;

      const weekIncome = filteredIncomes
        .filter(i => { const d = new Date(i.date); return d >= wStart && d <= wEnd; })
        .reduce((sum, i) => sum + Number(i.amount), 0);
      const weekExpense = filteredExpenses
        .filter(e => { const d = new Date(e.date); return d >= wStart && d <= wEnd; })
        .reduce((sum, e) => sum + Number(e.amount), 0);

      if (weekIncome > 0 || weekExpense > 0) {
        weeks.push({ name: `সপ্তাহ ${weekNum}`, income: weekIncome, expense: weekExpense });
      }
      weekNum++;
      weekStart = new Date(wEnd);
      weekStart.setDate(weekStart.getDate() + 1);
    }
    return weeks.length > 0 ? weeks : [{ name: 'কোনো ডেটা নেই', income: 0, expense: 0 }];
  })();

  // Monthly trend (last 6 months)
  const monthlyTrend = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(new Date(), i));
      const mEnd = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0);
      const monthName = format(mStart, 'MMM');
      const monthIncome = incomes
        .filter(item => { const d = new Date(item.date); return d >= mStart && d <= mEnd; })
        .reduce((sum, i) => sum + Number(i.amount), 0);
      months.push({ month: monthName, amount: monthIncome });
    }
    return months;
  })();

  // Pond performance
  const pondPerformance = (() => {
    return ponds.map(pond => {
      const pondIncome = incomes
        .filter(i => i.pond_name === pond.name)
        .reduce((sum, i) => sum + Number(i.amount), 0);
      const pondExpense = expenses
        .filter(e => e.pond_name === pond.name)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return { pond: pond.name, profit: pondIncome - pondExpense };
    }).filter(p => p.profit !== 0 || ponds.length <= 10);
  })();

  const handleDownloadReport = () => {
    let csvContent = "ধরন,তারিখ,পরিমাণ,ক্যাটাগরি,বিবরণ,পুকুর\n";
    filteredIncomes.forEach((item: any) => {
      csvContent += `আয়,${item.date},${item.amount},${item.category},${item.description || ""},${item.pond_name || ""}\n`;
    });
    filteredExpenses.forEach((item: any) => {
      csvContent += `ব্যয়,${item.date},${item.amount},${item.category},${item.description || ""},${item.pond_name || ""}\n`;
    });
    csvContent += `\nমোট আয়,${totalIncome}\nমোট ব্যয়,${totalExpense}\nনিট লাভ,${netProfit}\n`;
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farming_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      title: "মোট আয়",
      value: `৳${totalIncome.toLocaleString('bn-BD')}`,
      change: `${filteredIncomes.length} এন্ট্রি`,
      icon: TrendingUp,
      color: "from-emerald-500 to-green-600",
      positive: true,
    },
    {
      title: "মোট ব্যয়",
      value: `৳${totalExpense.toLocaleString('bn-BD')}`,
      change: `${filteredExpenses.length} এন্ট্রি`,
      icon: TrendingDown,
      color: "from-rose-500 to-red-600",
      positive: false,
    },
    {
      title: "নিট লাভ",
      value: `৳${netProfit.toLocaleString('bn-BD')}`,
      change: netProfit >= 0 ? "লাভ" : "লোকসান",
      icon: DollarSign,
      color: netProfit >= 0 ? "from-violet-500 to-purple-600" : "from-rose-500 to-red-600",
      positive: netProfit >= 0,
    },
    {
      title: "সক্রিয় পুকুর",
      value: activePonds.toString(),
      change: `মোট ${ponds.length}`,
      icon: Fish,
      color: "from-cyan-500 to-blue-600",
      positive: true,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Tabs defaultValue="sales" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">রিপোর্ট ও এনালিটিক্স</h1>
              <p className="text-muted-foreground">বিস্তারিত পরিসংখ্যান এবং বিশ্লেষণ</p>
            </div>
            <TabsList>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <ChartPie className="h-4 w-4" />
                সেলস অ্যানালিটিক্স
              </TabsTrigger>
              <TabsTrigger value="farming" className="flex items-center gap-2">
                <Fish className="h-4 w-4" />
                ফার্মিং রিপোর্ট
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sales">
            <SalesAnalytics />
          </TabsContent>

          <TabsContent value="farming" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
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

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">ডেটা লোড হচ্ছে...</span>
              </div>
            ) : (
              <>
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
                              {card.change}
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
                        <BarChart data={incomeExpenseData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`} />
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
                      <CardDescription>আয়ের গতিপ্রকৃতি (গত ৬ মাস)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`} />
                          <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="পরিমাণ" />
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
                      <CardDescription>প্রতিটি পুকুরের লাভ/লোকসান</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pondPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={pondPerformance} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="pond" type="category" width={100} />
                            <Tooltip formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`} />
                            <Bar dataKey="profit" fill="#06b6d4" name="লাভ" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                          কোনো পুকুরের ডেটা পাওয়া যায়নি
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
