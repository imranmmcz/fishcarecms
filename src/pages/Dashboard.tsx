import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Waves, Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
  depth: number;
  fishTypes: string[];
  status: string;
}

interface PondChartData {
  name: string;
  আয়: number;
  ব্যয়: number;
  লাভ: number;
}

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [pondCount, setPondCount] = useState(0);
  const [pondChartData, setPondChartData] = useState<PondChartData[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const incomes: IncomeRecord[] = JSON.parse(localStorage.getItem("farmerIncomes") || "[]");
    const expenses: ExpenseRecord[] = JSON.parse(localStorage.getItem("farmerExpenses") || "[]");
    const ponds: PondRecord[] = JSON.parse(localStorage.getItem("farmerPonds") || "[]");

    setTotalIncome(incomes.reduce((sum, item) => sum + item.amount, 0));
    setTotalExpense(expenses.reduce((sum, item) => sum + item.amount, 0));
    setPondCount(ponds.length);

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

    // Calculate expense category data
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const catData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    setCategoryData(catData);
  }, []);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">স্বাগতম, কৃষক!</h1>
          <p className="text-muted-foreground mt-1">আপনার মাছ চাষের সারসংক্ষেপ দেখুন</p>
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
