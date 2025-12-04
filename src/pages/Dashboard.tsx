import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Waves, Calculator } from "lucide-react";
import { useEffect, useState } from "react";

interface IncomeRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

interface PondRecord {
  id: string;
  name: string;
  area: number;
  depth: number;
  fishTypes: string[];
  status: string;
}

export default function Dashboard() {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [pondCount, setPondCount] = useState(0);

  useEffect(() => {
    const incomes: IncomeRecord[] = JSON.parse(localStorage.getItem("farmerIncomes") || "[]");
    const expenses: ExpenseRecord[] = JSON.parse(localStorage.getItem("farmerExpenses") || "[]");
    const ponds: PondRecord[] = JSON.parse(localStorage.getItem("farmerPonds") || "[]");

    setTotalIncome(incomes.reduce((sum, item) => sum + item.amount, 0));
    setTotalExpense(expenses.reduce((sum, item) => sum + item.amount, 0));
    setPondCount(ponds.length);
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
