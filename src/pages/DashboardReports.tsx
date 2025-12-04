import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, TrendingUp, TrendingDown, Calculator, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";

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

export default function DashboardReports() {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterPond, setFilterPond] = useState("all");
  const [ponds, setPonds] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setIncomes(JSON.parse(localStorage.getItem("farmerIncomes") || "[]"));
    setExpenses(JSON.parse(localStorage.getItem("farmerExpenses") || "[]"));
    setPonds(JSON.parse(localStorage.getItem("farmerPonds") || "[]"));
  }, []);

  const months = [
    { value: "01", label: "জানুয়ারি" },
    { value: "02", label: "ফেব্রুয়ারি" },
    { value: "03", label: "মার্চ" },
    { value: "04", label: "এপ্রিল" },
    { value: "05", label: "মে" },
    { value: "06", label: "জুন" },
    { value: "07", label: "জুলাই" },
    { value: "08", label: "আগস্ট" },
    { value: "09", label: "সেপ্টেম্বর" },
    { value: "10", label: "অক্টোবর" },
    { value: "11", label: "নভেম্বর" },
    { value: "12", label: "ডিসেম্বর" },
  ];

  const filterByMonth = (date: string) => {
    if (filterMonth === "all") return true;
    return date.substring(5, 7) === filterMonth;
  };

  const filterByPond = (pondName?: string) => {
    if (filterPond === "all") return true;
    return pondName === filterPond;
  };

  const filteredIncomes = incomes.filter((i) => filterByMonth(i.date) && filterByPond(i.pondName));
  const filteredExpenses = expenses.filter((e) => filterByMonth(e.date) && filterByPond(e.pondName));

  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalIncome - totalExpense;

  // Category-wise breakdown
  const incomeByCategory = filteredIncomes.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseByCategory = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-full">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">রিপোর্ট</h1>
            <p className="text-muted-foreground">আয়-ব্যয়ের বিস্তারিত রিপোর্ট</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              ফিল্টার
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>মাস</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="সব মাস" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব মাস</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>পুকুর</Label>
                <Select value={filterPond} onValueChange={setFilterPond}>
                  <SelectTrigger>
                    <SelectValue placeholder="সব পুকুর" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব পুকুর</SelectItem>
                    {ponds.map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">মোট আয়</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">৳{totalIncome.toLocaleString("bn-BD")}</p>
            </CardContent>
          </Card>
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">মোট ব্যয়</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">৳{totalExpense.toLocaleString("bn-BD")}</p>
            </CardContent>
          </Card>
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">লাভ/ক্ষতি</CardTitle>
              <Calculator className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {profit >= 0 ? "+" : ""}৳{profit.toLocaleString("bn-BD")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ক্যাটাগরি অনুযায়ী আয়
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(incomeByCategory).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">কোনো আয়ের রেকর্ড নেই</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ক্যাটাগরি</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(incomeByCategory).map(([cat, amount]) => (
                      <TableRow key={cat}>
                        <TableCell>{cat}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          ৳{amount.toLocaleString("bn-BD")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                ক্যাটাগরি অনুযায়ী ব্যয়
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(expenseByCategory).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">কোনো ব্যয়ের রেকর্ড নেই</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ক্যাটাগরি</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(expenseByCategory).map(([cat, amount]) => (
                      <TableRow key={cat}>
                        <TableCell>{cat}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          ৳{amount.toLocaleString("bn-BD")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Transactions */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>সকল লেনদেন</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredIncomes.length === 0 && filteredExpenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">কোনো লেনদেন নেই</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>ধরন</TableHead>
                      <TableHead>ক্যাটাগরি</TableHead>
                      <TableHead>পুকুর</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ...filteredIncomes.map((i) => ({ ...i, type: "income" as const })),
                      ...filteredExpenses.map((e) => ({ ...e, type: "expense" as const })),
                    ]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>
                            {item.type === "income" ? (
                              <span className="text-green-600">আয়</span>
                            ) : (
                              <span className="text-red-600">ব্যয়</span>
                            )}
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.pondName || "-"}</TableCell>
                          <TableCell className={`text-right font-medium ${item.type === "income" ? "text-green-600" : "text-red-600"}`}>
                            {item.type === "income" ? "+" : "-"}৳{item.amount.toLocaleString("bn-BD")}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
