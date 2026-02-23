import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Waves, Calculator, Fish, ChevronRight, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import AdUnit from "@/components/AdUnit";

interface IncomeRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  pondName?: string;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  pondName?: string;
}

interface PondRecord {
  id: string;
  name: string;
  area: number;
  areaUnit?: string;
  depth: number;
  depthUnit?: string;
  fishTypes: string[];
  fishCount?: number;
  status: string;
}

interface PondSummary {
  name: string;
  area: number;
  areaUnit: string;
  fishCount: number;
  income: number;
  expense: number;
  profit: number;
  status: string;
  fishTypes: string[];
}

interface PondChartData {
  name: string;
  income: number;
  expense: number;
  profit: number;
}

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const { user, profile, isFarmer, isCustomer, userRole } = useAuth();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [pondCount, setPondCount] = useState(0);
  const [totalFishCount, setTotalFishCount] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [pondChartData, setPondChartData] = useState<PondChartData[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [pondSummaries, setPondSummaries] = useState<PondSummary[]>([]);
  const [selectedPond, setSelectedPond] = useState<PondSummary | null>(null);
  const [pondIncomes, setPondIncomes] = useState<IncomeRecord[]>([]);
  const [pondExpenses, setPondExpenses] = useState<ExpenseRecord[]>([]);

  // Use profile data from context
  useEffect(() => {
    if (profile) {
      setUserName(profile.full_name || user?.email?.split('@')[0] || '');
      setUserAvatar(profile.avatar_url || null);
    } else if (user) {
      setUserName((user as any)?.full_name || user.email?.split('@')[0] || '');
      setUserAvatar((user as any)?.avatar_url || null);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      const [pondsRes, incomesRes, expensesRes] = await Promise.all([
        apiClient.getPonds(String(user.id)),
        apiClient.getIncomes(String(user.id)),
        apiClient.getExpenses(String(user.id)),
      ]);

      const ponds = (pondsRes.data?.data || []) as any[];
      const incomes = (incomesRes.data?.data || []) as any[];
      const expenses = (expensesRes.data?.data || []) as any[];

      setTotalIncome(incomes.reduce((sum, item) => sum + Number(item.amount), 0));
      setTotalExpense(expenses.reduce((sum, item) => sum + Number(item.amount), 0));
      setPondCount(ponds.length);

      const fishTotal = ponds.reduce((sum, pond) => sum + (pond.fish_count || 0), 0);
      const areaTotal = ponds.reduce((sum, pond) => sum + Number(pond.area), 0);
      setTotalFishCount(fishTotal);
      setTotalArea(areaTotal);

      const pondData: PondChartData[] = ponds.map((pond) => {
        const pondIncome = incomes
          .filter((i) => i.pond_name === pond.name)
          .reduce((sum, i) => sum + Number(i.amount), 0);
        const pondExpense = expenses
          .filter((e) => e.pond_name === pond.name)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        return {
          name: pond.name,
          income: pondIncome,
          expense: pondExpense,
          profit: pondIncome - pondExpense,
        };
      });
      setPondChartData(pondData);

      const summaries: PondSummary[] = ponds.map((pond) => {
        const pondIncome = incomes
          .filter((i) => i.pond_name === pond.name)
          .reduce((sum, i) => sum + Number(i.amount), 0);
        const pondExpense = expenses
          .filter((e) => e.pond_name === pond.name)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        return {
          name: pond.name,
          area: Number(pond.area),
          areaUnit: pond.area_unit || "শতক",
          fishCount: pond.fish_count || 0,
          income: pondIncome,
          expense: pondExpense,
          profit: pondIncome - pondExpense,
          status: pond.status,
          fishTypes: pond.fish_types || [],
        };
      });
      setPondSummaries(summaries);

      const categoryMap: { [key: string]: number } = {};
      expenses.forEach((e) => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
      });
      const catData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
      setCategoryData(catData);
    };

    fetchData();
  }, [user]);

  const handleViewPondDetails = async (pond: PondSummary) => {
    if (!user) return;
    const [incomesRes, expensesRes] = await Promise.all([
      apiClient.getIncomes(String(user.id)),
      apiClient.getExpenses(String(user.id)),
    ]);
    
    setPondIncomes(((incomesRes.data?.data || []) as any[]).filter((i: any) => i.pond_name === pond.name).map((i: any) => ({
      id: String(i.id), date: i.date, category: i.category, amount: Number(i.amount),
      description: i.description || "", pondName: i.pond_name || undefined,
    })));
    setPondExpenses(((expensesRes.data?.data || []) as any[]).filter((e: any) => e.pond_name === pond.name).map((e: any) => ({
      id: String(e.id), date: e.date, category: e.category, amount: Number(e.amount),
      description: e.description || "", pondName: e.pond_name || undefined,
    })));
    setSelectedPond(pond);
  };

  const profit = totalIncome - totalExpense;

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: { label: string; color: string } } = {
      active: { label: t.active, color: "bg-green-500" },
      harvested: { label: t.harvestComplete, color: "bg-blue-500" },
      preparation: { label: t.preparation, color: "bg-yellow-500" },
      empty: { label: t.empty, color: "bg-gray-500" },
    };
    return labels[status] || labels.active;
  };

  const stats = [
    {
      title: t.totalIncome,
      value: formatPrice(totalIncome),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: t.totalExpense,
      value: formatPrice(totalExpense),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: t.profitLoss,
      value: formatPrice(profit),
      icon: Calculator,
      color: profit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: profit >= 0 ? "bg-green-100" : "bg-red-100",
    },
    {
      title: t.pondCount,
      value: pondCount.toString(),
      icon: Waves,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const pondStats = [
    {
      title: t.totalArea,
      value: `${totalArea.toLocaleString(language === "bn" ? "bn-BD" : "en-US")} ${t.decimal}`,
      icon: Waves,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      title: t.totalFish,
      value: `${totalFishCount.toLocaleString(language === "bn" ? "bn-BD" : "en-US")} ${language === "bn" ? "টি" : "pcs"}`,
      icon: Fish,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-lg">
            <AvatarImage src={userAvatar || undefined} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xl font-bold">
              {userName.charAt(0).toUpperCase() || "F"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{t.welcome}, {userName || (language === "bn" ? "কৃষক" : "Farmer")}!</h1>
              <Badge variant="outline" className="text-xs">
                {userRole === 'farmer' ? (language === "bn" ? "কৃষক" : "Farmer") : 
                 userRole === 'customer' ? (language === "bn" ? "কাস্টমার" : "Customer") : 
                 userRole === 'admin' ? (language === "bn" ? "অ্যাডমিন" : "Admin") : ""}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{t.viewSummary}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pond Summary Section */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-blue-500" />
              {t.pondSummary}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {pondStats.map((stat) => (
                <div key={stat.title} className={`p-4 rounded-lg ${stat.bgColor}`}>
                  <div className="flex items-center gap-3">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pondSummaries.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.pondName}</TableHead>
                      <TableHead>{t.area}</TableHead>
                      <TableHead>{language === "bn" ? "মাছ" : "Fish"}</TableHead>
                      <TableHead>{t.income}</TableHead>
                      <TableHead>{t.expense}</TableHead>
                      <TableHead>{t.profitLoss}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead className="text-right">{t.action}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pondSummaries.map((pond) => {
                      const statusInfo = getStatusLabel(pond.status);
                      return (
                        <TableRow key={pond.name}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Waves className="h-4 w-4 text-blue-500" />
                              {pond.name}
                            </div>
                          </TableCell>
                          <TableCell>{pond.area} {pond.areaUnit}</TableCell>
                          <TableCell>{pond.fishCount.toLocaleString(language === "bn" ? "bn-BD" : "en-US")} {language === "bn" ? "টি" : "pcs"}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatPrice(pond.income)}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {formatPrice(pond.expense)}
                          </TableCell>
                          <TableCell className={pond.profit >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {formatPrice(pond.profit)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPondDetails(pond)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {t.details}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t.noPondAdded}</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pond-wise Income vs Expense Chart */}
          {pondChartData.length > 0 && (
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>{language === "bn" ? "পুকুরভিত্তিক আয় ও ব্যয়" : "Pond-wise Income & Expense"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pondChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value: number) => formatPrice(value)}
                    />
                    <Legend />
                    <Bar dataKey="income" name={t.income} fill="#10b981" />
                    <Bar dataKey="expense" name={t.expense} fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Expense Category Pie Chart */}
          {categoryData.length > 0 && (
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>{language === "bn" ? "খরচের ক্যাটাগরি" : "Expense Category"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>{t.recentIncome}</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentList type="income" />
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>{t.recentExpense}</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentList type="expense" />
            </CardContent>
          </Card>
        </div>
        
        {/* In-Article Ad */}
        <div className="mt-6">
          <AdUnit position="in-article" />
        </div>
      </div>

      {/* Pond Details Dialog */}
      <Dialog open={!!selectedPond} onOpenChange={() => setSelectedPond(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-blue-500" />
              {selectedPond?.name} - {language === "bn" ? "বিস্তারিত তথ্য" : "Details"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPond && (
            <div className="space-y-6">
              {/* Pond Info Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t.area}</p>
                  <p className="font-bold text-blue-600">{selectedPond.area} {selectedPond.areaUnit}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "মাছ" : "Fish"}</p>
                  <p className="font-bold text-purple-600">{selectedPond.fishCount.toLocaleString(language === "bn" ? "bn-BD" : "en-US")} {language === "bn" ? "টি" : "pcs"}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t.totalIncome}</p>
                  <p className="font-bold text-green-600">{formatPrice(selectedPond.income)}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t.totalExpense}</p>
                  <p className="font-bold text-red-600">{formatPrice(selectedPond.expense)}</p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${selectedPond.profit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <p className="text-center">
                  <span className="text-muted-foreground">{language === "bn" ? "নিট লাভ/ক্ষতি:" : "Net Profit/Loss:"} </span>
                  <span className={`text-2xl font-bold ${selectedPond.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatPrice(selectedPond.profit)}
                  </span>
                </p>
              </div>

              {selectedPond.fishTypes.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{language === "bn" ? "মাছের প্রজাতি:" : "Fish Species:"}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPond.fishTypes.map((fish) => (
                      <Badge key={fish} variant="secondary">{fish}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Income Records */}
              <div>
                <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {language === "bn" ? `আয়ের রেকর্ড (${pondIncomes.length} টি)` : `Income Records (${pondIncomes.length})`}
                </h4>
                {pondIncomes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pondIncomes.map((income) => (
                      <div key={income.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">{income.category}</p>
                          <p className="text-sm text-muted-foreground">{income.date} - {income.description}</p>
                        </div>
                        <p className="font-bold text-green-600">+{formatPrice(income.amount)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">{language === "bn" ? "কোনো আয়ের রেকর্ড নেই" : "No income records"}</p>
                )}
              </div>

              {/* Expense Records */}
              <div>
                <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  {language === "bn" ? `ব্যয়ের রেকর্ড (${pondExpenses.length} টি)` : `Expense Records (${pondExpenses.length})`}
                </h4>
                {pondExpenses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pondExpenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-sm text-muted-foreground">{expense.date} - {expense.description}</p>
                        </div>
                        <p className="font-bold text-red-600">-{formatPrice(expense.amount)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">{language === "bn" ? "কোনো ব্যয়ের রেকর্ড নেই" : "No expense records"}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function RecentList({ type }: { type: "income" | "expense" }) {
  const [items, setItems] = useState<(IncomeRecord | ExpenseRecord)[]>([]);
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const res = type === "income" 
        ? await apiClient.getIncomes(String(user.id))
        : await apiClient.getExpenses(String(user.id));
      const data = (res.data?.data || []) as any[];
      // Take latest 5
      const sorted = data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
      setItems(sorted.map((d: any) => ({
        id: String(d.id), date: d.date, category: d.category,
        amount: Number(d.amount), description: d.description || "",
        pondName: d.pond_name || undefined,
      })));
    };
    fetchData();
  }, [type, user]);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-center py-4">{language === "bn" ? "কোনো রেকর্ড নেই" : "No records"}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">{item.category}</p>
            <p className="text-sm text-muted-foreground">{item.date}</p>
          </div>
          <p className={`font-bold ${type === "income" ? "text-green-600" : "text-red-600"}`}>
            {type === "income" ? "+" : "-"}{formatPrice(item.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}
