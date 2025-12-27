import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Waves, Calculator, Fish, ChevronRight, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  আয়: number;
  ব্যয়: number;
  লাভ: number;
}

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

const statusLabels: { [key: string]: { label: string; color: string } } = {
  active: { label: "চলমান", color: "bg-green-500" },
  harvested: { label: "আহরণ সম্পন্ন", color: "bg-blue-500" },
  preparation: { label: "প্রস্তুতি", color: "bg-yellow-500" },
  empty: { label: "খালি", color: "bg-gray-500" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("কৃষক");
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

  // Fetch user profile name and avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        if (data.full_name) {
          setUserName(data.full_name);
        }
        if (data.avatar_url) {
          setUserAvatar(data.avatar_url);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const incomes: IncomeRecord[] = JSON.parse(localStorage.getItem("farmerIncomes") || "[]");
    const expenses: ExpenseRecord[] = JSON.parse(localStorage.getItem("farmerExpenses") || "[]");
    const ponds: PondRecord[] = JSON.parse(localStorage.getItem("farmerPonds") || "[]");

    setTotalIncome(incomes.reduce((sum, item) => sum + item.amount, 0));
    setTotalExpense(expenses.reduce((sum, item) => sum + item.amount, 0));
    setPondCount(ponds.length);

    // Calculate total fish count and area
    const fishTotal = ponds.reduce((sum, pond) => sum + (pond.fishCount || 0), 0);
    const areaTotal = ponds.reduce((sum, pond) => sum + pond.area, 0);
    setTotalFishCount(fishTotal);
    setTotalArea(areaTotal);

    // Calculate pond-wise data
    const pondData: PondChartData[] = ponds.map((pond) => {
      const pondIncome = incomes
        .filter((i) => i.pondName === pond.name)
        .reduce((sum, i) => sum + i.amount, 0);
      const pondExpense = expenses
        .filter((e) => e.pondName === pond.name)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        name: pond.name,
        আয়: pondIncome,
        ব্যয়: pondExpense,
        লাভ: pondIncome - pondExpense,
      };
    });
    setPondChartData(pondData);

    // Calculate pond summaries
    const summaries: PondSummary[] = ponds.map((pond) => {
      const pondIncome = incomes
        .filter((i) => i.pondName === pond.name)
        .reduce((sum, i) => sum + i.amount, 0);
      const pondExpense = expenses
        .filter((e) => e.pondName === pond.name)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        name: pond.name,
        area: pond.area,
        areaUnit: pond.areaUnit || "শতক",
        fishCount: pond.fishCount || 0,
        income: pondIncome,
        expense: pondExpense,
        profit: pondIncome - pondExpense,
        status: pond.status,
        fishTypes: pond.fishTypes || [],
      };
    });
    setPondSummaries(summaries);

    // Calculate expense category data
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const catData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    setCategoryData(catData);
  }, []);

  const handleViewPondDetails = (pond: PondSummary) => {
    const incomes: IncomeRecord[] = JSON.parse(localStorage.getItem("farmerIncomes") || "[]");
    const expenses: ExpenseRecord[] = JSON.parse(localStorage.getItem("farmerExpenses") || "[]");
    
    setPondIncomes(incomes.filter((i) => i.pondName === pond.name));
    setPondExpenses(expenses.filter((e) => e.pondName === pond.name));
    setSelectedPond(pond);
  };

  const profit = totalIncome - totalExpense;

  const stats = [
    {
      title: "মোট আয়",
      value: `৳${totalIncome.toLocaleString("bn-BD")}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "মোট ব্যয়",
      value: `৳${totalExpense.toLocaleString("bn-BD")}`,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "লাভ/ক্ষতি",
      value: `৳${profit.toLocaleString("bn-BD")}`,
      icon: Calculator,
      color: profit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: profit >= 0 ? "bg-green-100" : "bg-red-100",
    },
    {
      title: "পুকুর সংখ্যা",
      value: pondCount.toString(),
      icon: Waves,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const pondStats = [
    {
      title: "মোট আয়তন",
      value: `${totalArea.toLocaleString("bn-BD")} শতক`,
      icon: Waves,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      title: "মোট মাছ",
      value: `${totalFishCount.toLocaleString("bn-BD")} টি`,
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
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">স্বাগতম, {userName}!</h1>
            <p className="text-muted-foreground mt-1">আপনার মাছ চাষের সারসংক্ষেপ দেখুন</p>
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
              পুকুরের সারসংক্ষেপ
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
                      <TableHead>পুকুরের নাম</TableHead>
                      <TableHead>আয়তন</TableHead>
                      <TableHead>মাছ</TableHead>
                      <TableHead>আয়</TableHead>
                      <TableHead>ব্যয়</TableHead>
                      <TableHead>লাভ/ক্ষতি</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pondSummaries.map((pond) => {
                      const statusInfo = statusLabels[pond.status] || statusLabels.active;
                      return (
                        <TableRow key={pond.name}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Waves className="h-4 w-4 text-blue-500" />
                              {pond.name}
                            </div>
                          </TableCell>
                          <TableCell>{pond.area} {pond.areaUnit}</TableCell>
                          <TableCell>{pond.fishCount.toLocaleString("bn-BD")} টি</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            ৳{pond.income.toLocaleString("bn-BD")}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            ৳{pond.expense.toLocaleString("bn-BD")}
                          </TableCell>
                          <TableCell className={pond.profit >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            ৳{pond.profit.toLocaleString("bn-BD")}
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
                              বিস্তারিত
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">কোনো পুকুর যোগ করা হয়নি</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pond-wise Income vs Expense Chart */}
          {pondChartData.length > 0 && (
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>পুকুরভিত্তিক আয় ও ব্যয়</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pondChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`}
                    />
                    <Legend />
                    <Bar dataKey="আয়" fill="#10b981" />
                    <Bar dataKey="ব্যয়" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Expense Category Pie Chart */}
          {categoryData.length > 0 && (
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>খরচের ক্যাটাগরি</CardTitle>
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
                    <Tooltip formatter={(value: number) => `৳${value.toLocaleString("bn-BD")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>সাম্প্রতিক আয়</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentList type="income" />
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>সাম্প্রতিক ব্যয়</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentList type="expense" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pond Details Dialog */}
      <Dialog open={!!selectedPond} onOpenChange={() => setSelectedPond(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-blue-500" />
              {selectedPond?.name} - বিস্তারিত তথ্য
            </DialogTitle>
          </DialogHeader>
          
          {selectedPond && (
            <div className="space-y-6">
              {/* Pond Info Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">আয়তন</p>
                  <p className="font-bold text-blue-600">{selectedPond.area} {selectedPond.areaUnit}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">মাছ</p>
                  <p className="font-bold text-purple-600">{selectedPond.fishCount.toLocaleString("bn-BD")} টি</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">মোট আয়</p>
                  <p className="font-bold text-green-600">৳{selectedPond.income.toLocaleString("bn-BD")}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">মোট ব্যয়</p>
                  <p className="font-bold text-red-600">৳{selectedPond.expense.toLocaleString("bn-BD")}</p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${selectedPond.profit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <p className="text-center">
                  <span className="text-muted-foreground">নিট লাভ/ক্ষতি: </span>
                  <span className={`text-2xl font-bold ${selectedPond.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ৳{selectedPond.profit.toLocaleString("bn-BD")}
                  </span>
                </p>
              </div>

              {selectedPond.fishTypes.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">মাছের প্রজাতি:</p>
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
                  আয়ের রেকর্ড ({pondIncomes.length} টি)
                </h4>
                {pondIncomes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pondIncomes.map((income) => (
                      <div key={income.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">{income.category}</p>
                          <p className="text-sm text-muted-foreground">{income.date} - {income.description}</p>
                        </div>
                        <p className="font-bold text-green-600">+৳{income.amount.toLocaleString("bn-BD")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">কোনো আয়ের রেকর্ড নেই</p>
                )}
              </div>

              {/* Expense Records */}
              <div>
                <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  ব্যয়ের রেকর্ড ({pondExpenses.length} টি)
                </h4>
                {pondExpenses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pondExpenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-sm text-muted-foreground">{expense.date} - {expense.description}</p>
                        </div>
                        <p className="font-bold text-red-600">-৳{expense.amount.toLocaleString("bn-BD")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">কোনো ব্যয়ের রেকর্ড নেই</p>
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

  useEffect(() => {
    const key = type === "income" ? "farmerIncomes" : "farmerExpenses";
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    setItems(data.slice(-5).reverse());
  }, [type]);

  if (items.length === 0) {
    return <p className="text-muted-foreground text-center py-4">কোনো রেকর্ড নেই</p>;
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
            {type === "income" ? "+" : "-"}৳{item.amount.toLocaleString("bn-BD")}
          </p>
        </div>
      ))}
    </div>
  );
}
